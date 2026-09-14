package main

import (
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"os"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	actionReview  = "review"
	actionMigrate = "migrate"
	actionReset   = "reset"

	// markerKey records when each step last ran with -yes.
	markerKey = "migrations:owner-ids"
)

var (
	// Only GitHub accounts can be migrated: email records kept only the part
	// before the @, so they can't be mapped to an email:<hash> id.
	githubId = regexp.MustCompile(`^gh:[0-9]+$`)
	newIdKey = regexp.MustCompile(`^(gh|email):`)
)

var header = []string{"old_name", "action", "new_id", "repls", "objects", "note"}

type row struct {
	line    int
	oldName string
	action  string
	newId   string
	note    string
}

func userKey(id string) string   { return "user:" + id }
func replKey(id string) string   { return "repl:" + id }
func folder(owner string) string { return "repl/" + owner + "/" }

// legacyNames lists the owners of user:<name> sets that predate ids.
func legacyNames(ctx context.Context, d deps) ([]string, error) {
	var names []string
	iter := d.rdb.Scan(ctx, 0, "user:*", 100).Iterator()
	for iter.Next(ctx) {
		name := strings.TrimPrefix(iter.Val(), "user:")
		if newIdKey.MatchString(name) {
			continue
		}
		if typ, err := d.rdb.Type(ctx, iter.Val()).Result(); err != nil || typ != "set" {
			continue
		}
		names = append(names, name)
	}
	if err := iter.Err(); err != nil {
		return nil, err
	}
	slices.Sort(names)
	return names, nil
}

func plan(ctx context.Context, d deps, w io.Writer) error {
	names, err := legacyNames(ctx, d)
	if err != nil {
		return err
	}

	cw := csv.NewWriter(w)
	if err := cw.Write(header); err != nil {
		return err
	}
	for _, name := range names {
		repls, err := d.rdb.SCard(ctx, userKey(name)).Result()
		if err != nil {
			return err
		}
		objects, err := d.store.List(ctx, folder(name))
		if err != nil {
			return err
		}

		suggested, note := "", "no GitHub lookup: decide migrate (fill new_id) or reset"
		if d.lookup != nil {
			switch id, found, err := d.lookup(ctx, name); {
			case err != nil:
				note = "GitHub lookup failed (" + err.Error() + "): decide by hand"
			case found:
				suggested = "gh:" + strconv.FormatInt(id, 10)
				note = "a GitHub account with this login exists: migrate only if that person used DevEx; an email user can share the name"
			default:
				note = "no GitHub account with this login: an email sign-in, reset"
			}
		}
		fmt.Fprintf(d.out, "%-24s repls=%d objects=%d  %s\n", name, repls, len(objects), note)
		if err := cw.Write([]string{name, actionReview, suggested, strconv.FormatInt(repls, 10), strconv.Itoa(len(objects)), note}); err != nil {
			return err
		}
	}
	cw.Flush()
	if err := cw.Error(); err != nil {
		return err
	}
	fmt.Fprintf(d.out, "\n%d legacy owners\n", len(names))
	return nil
}

func loadMapping(path string) ([]row, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return parseMapping(f)
}

func parseMapping(r io.Reader) ([]row, error) {
	records, err := csv.NewReader(r).ReadAll()
	if err != nil {
		return nil, fmt.Errorf("mapping: %w", err)
	}
	if len(records) == 0 || !slices.Equal(records[0], header) {
		return nil, fmt.Errorf("mapping: first line must be %s", strings.Join(header, ","))
	}

	var rows []row
	var problems []string
	seen := map[string]bool{}
	for i, rec := range records[1:] {
		rw := row{line: i + 2, oldName: strings.TrimSpace(rec[0]), action: strings.TrimSpace(rec[1]), newId: strings.TrimSpace(rec[2]), note: rec[5]}
		bad := func(msg string) {
			problems = append(problems, fmt.Sprintf("line %d (%s): %s", rw.line, rw.oldName, msg))
		}

		switch {
		case rw.oldName == "" || strings.Contains(rw.oldName, "/") || newIdKey.MatchString(rw.oldName):
			bad("old_name must be a legacy name")
		case seen[rw.oldName]:
			bad("listed twice")
		}
		seen[rw.oldName] = true

		switch rw.action {
		case actionMigrate:
			if !githubId.MatchString(rw.newId) {
				bad("migrate needs new_id like gh:12345")
			}
		case actionReset:
			if rw.newId != "" {
				bad("reset rows must have an empty new_id")
			}
		case actionReview:
			bad("still marked review")
		default:
			bad("action must be migrate or reset")
		}
		rows = append(rows, rw)
	}
	if len(problems) > 0 {
		return nil, fmt.Errorf("mapping has problems:\n  %s", strings.Join(problems, "\n  "))
	}
	return rows, nil
}

// preflight refuses to start when a workspace is running (its pod would upload
// to the old folder later) or a record doesn't match its row.
func preflight(ctx context.Context, d deps, rows []row, allowActive bool) error {
	var problems []string
	for _, rw := range rows {
		ids, err := d.rdb.SMembers(ctx, userKey(rw.oldName)).Result()
		if err != nil {
			return err
		}
		for _, id := range ids {
			h, err := d.rdb.HGetAll(ctx, replKey(id)).Result()
			if err != nil {
				return err
			}
			if len(h) == 0 {
				continue
			}
			if active, _ := strconv.ParseBool(h["isActive"]); active && !allowActive {
				problems = append(problems, fmt.Sprintf("%s: %s is marked running; stop it first (or -allow-active if it's stale)", rw.oldName, id))
			}
			if h["user"] != rw.oldName {
				problems = append(problems, fmt.Sprintf("%s: %s belongs to user %q", rw.oldName, id, h["user"]))
			}
			if rw.action == actionMigrate && h["userId"] != "" && h["userId"] != rw.newId {
				problems = append(problems, fmt.Sprintf("%s: %s already has userId %s, not %s", rw.oldName, id, h["userId"], rw.newId))
			}
		}
	}
	if len(problems) > 0 {
		return fmt.Errorf("refusing to start:\n  %s", strings.Join(problems, "\n  "))
	}
	return nil
}

// verb picks the wording for a real run or a dry run.
func verb(yes bool, done, dry string) string {
	if yes {
		return done
	}
	return "would " + dry
}

// apply is the expand step. It only adds data, and running it again is a no-op:
// files already present at the destination are never overwritten.
func apply(ctx context.Context, d deps, rows []row, yes, allowActive bool) error {
	if err := preflight(ctx, d, rows, allowActive); err != nil {
		return err
	}

	var records, files int
	for _, rw := range rows {
		if rw.action != actionMigrate {
			fmt.Fprintf(d.out, "%s: reset, nothing to do until contract\n", rw.oldName)
			continue
		}

		ids, err := d.rdb.SMembers(ctx, userKey(rw.oldName)).Result()
		if err != nil {
			return err
		}
		slices.Sort(ids)
		for _, id := range ids {
			h, err := d.rdb.HGetAll(ctx, replKey(id)).Result()
			if err != nil {
				return err
			}
			if len(h) == 0 {
				fmt.Fprintf(d.out, "%s: %s has no record, skipped\n", rw.oldName, id)
				continue
			}
			inSet, err := d.rdb.SIsMember(ctx, userKey(rw.newId), id).Result()
			if err != nil {
				return err
			}
			if h["userId"] == rw.newId && inSet {
				continue
			}
			fmt.Fprintf(d.out, "%s: %s owner %s\n", rw.oldName, verb(yes, "set", "set"), idArrow(id, rw.newId))
			records++
			if !yes {
				continue
			}
			if _, err := d.rdb.TxPipelined(ctx, func(p redis.Pipeliner) error {
				p.HSet(ctx, replKey(id), "userId", rw.newId)
				p.SAdd(ctx, userKey(rw.newId), id)
				return nil
			}); err != nil {
				return err
			}
		}

		n, err := copyFolder(ctx, d, rw, yes)
		if err != nil {
			return err
		}
		files += n
	}

	fmt.Fprintf(d.out, "\n%s %d records and %d files\n", verb(yes, "updated", "update"), records, files)
	if !yes {
		fmt.Fprintln(d.out, "nothing written: run again with -yes")
		return nil
	}
	return d.rdb.HSet(ctx, markerKey, "applied_at", time.Now().UTC().Format(time.RFC3339)).Err()
}

func idArrow(replId, newId string) string { return replId + " -> " + newId }

// copyFolder copies repl/<old>/... to repl/<new>/..., skipping files that
// already exist at the destination.
func copyFolder(ctx context.Context, d deps, rw row, yes bool) (int, error) {
	src, dst := folder(rw.oldName), folder(rw.newId)
	have, err := d.store.List(ctx, dst)
	if err != nil {
		return 0, err
	}
	existing := map[string]bool{}
	for _, k := range have {
		existing[k] = true
	}

	keys, err := d.store.List(ctx, src)
	if err != nil {
		return 0, err
	}
	n := 0
	for _, key := range keys {
		target := dst + strings.TrimPrefix(key, src)
		if existing[target] {
			continue
		}
		n++
		if !yes {
			continue
		}
		if err := d.store.Copy(ctx, key, target); err != nil {
			return n - 1, err
		}
	}
	if n > 0 {
		fmt.Fprintf(d.out, "%s: %s %d files %s -> %s\n", rw.oldName, verb(yes, "copied", "copy"), n, src, dst)
	}
	return n, nil
}

// verify checks every migrate row is fully applied. It writes nothing.
func verify(ctx context.Context, d deps, rows []row) error {
	problems, err := check(ctx, d, rows)
	if err != nil {
		return err
	}
	if len(problems) > 0 {
		for _, p := range problems {
			fmt.Fprintln(d.out, "MISSING", p)
		}
		return fmt.Errorf("%d problems: run apply -yes again", len(problems))
	}
	fmt.Fprintln(d.out, "OK: every migrate row is applied")
	return nil
}

func check(ctx context.Context, d deps, rows []row) ([]string, error) {
	var problems []string
	for _, rw := range rows {
		if rw.action != actionMigrate {
			continue
		}
		ids, err := d.rdb.SMembers(ctx, userKey(rw.oldName)).Result()
		if err != nil {
			return nil, err
		}
		for _, id := range ids {
			h, err := d.rdb.HGetAll(ctx, replKey(id)).Result()
			if err != nil {
				return nil, err
			}
			if len(h) == 0 {
				continue
			}
			if h["userId"] != rw.newId {
				problems = append(problems, fmt.Sprintf("%s: %s userId = %q, want %s", rw.oldName, id, h["userId"], rw.newId))
			}
			if ok, err := d.rdb.SIsMember(ctx, userKey(rw.newId), id).Result(); err != nil {
				return nil, err
			} else if !ok {
				problems = append(problems, fmt.Sprintf("%s: %s not in %s", rw.oldName, id, userKey(rw.newId)))
			}
		}

		src, dst := folder(rw.oldName), folder(rw.newId)
		have, err := d.store.List(ctx, dst)
		if err != nil {
			return nil, err
		}
		keys, err := d.store.List(ctx, src)
		if err != nil {
			return nil, err
		}
		for _, key := range keys {
			if target := dst + strings.TrimPrefix(key, src); !slices.Contains(have, target) {
				problems = append(problems, fmt.Sprintf("%s: file %s not copied to %s", rw.oldName, key, target))
			}
		}
	}
	return problems, nil
}

// contract deletes what the new code no longer reads. Run it only once
// production has been verified: after it, rolling back loses data.
func contract(ctx context.Context, d deps, rows []row, yes, allowActive bool) error {
	if err := preflight(ctx, d, rows, allowActive); err != nil {
		return err
	}
	if problems, err := check(ctx, d, rows); err != nil {
		return err
	} else if len(problems) > 0 {
		return fmt.Errorf("apply is incomplete (%d problems); run verify", len(problems))
	}

	var records, files int
	for _, rw := range rows {
		ids, err := d.rdb.SMembers(ctx, userKey(rw.oldName)).Result()
		if err != nil {
			return err
		}
		slices.Sort(ids)

		if rw.action == actionReset {
			for _, id := range ids {
				owner, err := d.rdb.HGet(ctx, replKey(id), "userId").Result()
				if err != nil && !errors.Is(err, redis.Nil) {
					return err
				}
				if owner != "" {
					fmt.Fprintf(d.out, "%s: %s belongs to %s now, kept\n", rw.oldName, id, owner)
					continue
				}
				fmt.Fprintf(d.out, "%s: %s workspace %s\n", rw.oldName, verb(yes, "deleted", "delete"), id)
				records++
				if yes {
					if err := d.rdb.Del(ctx, replKey(id)).Err(); err != nil {
						return err
					}
				}
			}
		}

		keys, err := d.store.List(ctx, folder(rw.oldName))
		if err != nil {
			return err
		}
		if len(keys) > 0 {
			fmt.Fprintf(d.out, "%s: %s %d files under %s\n", rw.oldName, verb(yes, "deleted", "delete"), len(keys), folder(rw.oldName))
		}
		files += len(keys)
		fmt.Fprintf(d.out, "%s: %s %s\n", rw.oldName, verb(yes, "deleted", "delete"), userKey(rw.oldName))
		if !yes {
			continue
		}
		for _, key := range keys {
			if err := d.store.Delete(ctx, key); err != nil {
				return err
			}
		}
		if err := d.rdb.Del(ctx, userKey(rw.oldName)).Err(); err != nil {
			return err
		}
	}

	fmt.Fprintf(d.out, "\n%s %d workspace records and %d files\n", verb(yes, "deleted", "delete"), records, files)
	if !yes {
		fmt.Fprintln(d.out, "nothing deleted: run again with -yes")
		return nil
	}
	return d.rdb.HSet(ctx, markerKey, "contracted_at", time.Now().UTC().Format(time.RFC3339)).Err()
}
