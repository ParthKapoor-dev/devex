package main

import (
	"bytes"
	"context"
	"errors"
	"io"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

// fakeStorage is an in-memory bucket: key -> contents.
type fakeStorage struct {
	objects map[string]string
	copyErr error
}

func (f *fakeStorage) List(_ context.Context, prefix string) ([]string, error) {
	var keys []string
	for k := range f.objects {
		if strings.HasPrefix(k, prefix) {
			keys = append(keys, k)
		}
	}
	slices.Sort(keys)
	return keys, nil
}

func (f *fakeStorage) Copy(_ context.Context, src, dst string) error {
	if f.copyErr != nil {
		return f.copyErr
	}
	f.objects[dst] = f.objects[src]
	return nil
}

func (f *fakeStorage) Delete(_ context.Context, key string) error {
	delete(f.objects, key)
	return nil
}

// world is production as the old code left it, in miniredis and a fake bucket:
//
//   - parth: a GitHub user with two workspaces (migrate to gh:1001)
//   - rahul: an email sign-in with one workspace (reset)
//   - gh:7:  an account already on the new layout (must be ignored)
type world struct {
	t     *testing.T
	mr    *miniredis.Miniredis
	store *fakeStorage
	dir   string
}

func newWorld(t *testing.T) *world {
	t.Helper()
	mr := miniredis.RunT(t)

	legacy := func(name string, repls ...string) {
		for _, id := range repls {
			mr.HSet("repl:"+id, "id", id, "name", id, "user", name, "template", "node", "isActive", "false")
			mr.SAdd("user:"+name, id)
		}
	}
	legacy("parth", "repl-a", "repl-b")
	legacy("rahul", "repl-c")
	mr.HSet("repl:repl-n", "id", "repl-n", "user", "someone", "userId", "gh:7", "isActive", "1")
	mr.SAdd("user:gh:7", "repl-n")

	store := &fakeStorage{objects: map[string]string{
		"repl/parth/repl-a/index.js":        "a",
		"repl/parth/repl-a/src/app file.js": "a2",
		"repl/parth/repl-b/main.py":         "b",
		"repl/rahul/repl-c/index.js":        "c",
		"repl/gh:7/repl-n/index.js":         "n",
		"repl/parthkapoor/repl-z/untouched": "z", // a name that shares a prefix with "parth"
		"templates/node/index.js":           "template",
	}}
	return &world{t: t, mr: mr, store: store, dir: t.TempDir()}
}

func (w *world) mapping() string { return filepath.Join(w.dir, "mapping.csv") }

func (w *world) writeMapping(lines ...string) {
	w.t.Helper()
	body := strings.Join(append([]string{strings.Join(header, ",")}, lines...), "\n") + "\n"
	if err := os.WriteFile(w.mapping(), []byte(body), 0o600); err != nil {
		w.t.Fatal(err)
	}
}

// run executes the command as main would, against the fake world.
func (w *world) run(args ...string) (string, error) {
	w.t.Helper()
	var out bytes.Buffer
	args = append(args, "-redis-url", "redis://"+w.mr.Addr(), "-s3-endpoint", "http://fake", "-s3-bucket", "fake", "-mapping", w.mapping())
	err := run(context.Background(), args, &out, func(_ context.Context, cfg config, out io.Writer) (deps, error) {
		lookup := func(_ context.Context, login string) (int64, bool, error) {
			if login == "parth" {
				return 1001, true, nil
			}
			return 0, false, nil
		}
		return deps{rdb: redis.NewClient(&redis.Options{Addr: w.mr.Addr()}), store: w.store, lookup: lookup, out: out}, nil
	})
	return out.String(), err
}

func (w *world) members(key string) []string {
	w.t.Helper()
	if !w.mr.Exists(key) {
		return nil
	}
	m, err := w.mr.Members(key)
	if err != nil {
		w.t.Fatal(err)
	}
	return m
}

const decided = "parth,migrate,gh:1001,2,3,\nrahul,reset,,1,1,"

func TestPlanListsOnlyLegacyOwners(t *testing.T) {
	w := newWorld(t)

	out, err := w.run("plan")
	if err != nil {
		t.Fatalf("plan: %v\n%s", err, out)
	}

	rows, err := os.ReadFile(w.mapping())
	if err != nil {
		t.Fatal(err)
	}
	got := strings.Split(strings.TrimSpace(string(rows)), "\n")
	if len(got) != 3 {
		t.Fatalf("mapping has %d lines, want header + parth + rahul:\n%s", len(got), rows)
	}
	if !strings.HasPrefix(got[1], "parth,review,gh:1001,2,3,") {
		t.Errorf("parth row = %q; want action review, suggested gh:1001, 2 repls, 3 files", got[1])
	}
	if !strings.HasPrefix(got[2], "rahul,review,,1,1,") {
		t.Errorf("rahul row = %q; want action review, no suggestion", got[2])
	}
	if strings.Contains(string(rows), "gh:7,") {
		t.Error("an account already on the new layout was listed")
	}
}

func TestPlanNeverOverwritesMapping(t *testing.T) {
	w := newWorld(t)
	w.writeMapping(decided)

	if _, err := w.run("plan"); err == nil {
		t.Fatal("plan overwrote an existing mapping file")
	}
	if b, _ := os.ReadFile(w.mapping()); !strings.Contains(string(b), "parth,migrate") {
		t.Error("mapping file changed")
	}
}

func TestMappingMustBeDecided(t *testing.T) {
	cases := map[string]string{
		"review left":        "parth,review,gh:1001,2,3,",
		"migrate without id": "parth,migrate,,2,3,",
		"email id":           "parth,migrate,email:abc,2,3,",
		"reset with id":      "rahul,reset,gh:1,1,1,",
		"unknown action":     "parth,move,gh:1001,2,3,",
		"duplicate":          "parth,migrate,gh:1001,2,3,\nparth,reset,,2,3,",
		"new-layout name":    "gh:7,reset,,1,1,",
	}
	for name, line := range cases {
		t.Run(name, func(t *testing.T) {
			w := newWorld(t)
			w.writeMapping(line)
			before := maps.Clone(w.store.objects)

			if _, err := w.run("apply", "-yes"); err == nil {
				t.Fatal("apply accepted the mapping")
			}
			if w.mr.HGet("repl:repl-a", "userId") != "" || !maps.Equal(before, w.store.objects) {
				t.Error("apply wrote something despite a bad mapping")
			}
		})
	}
}

func TestApplyDryRunWritesNothing(t *testing.T) {
	w := newWorld(t)
	w.writeMapping(decided)
	before := maps.Clone(w.store.objects)

	out, err := w.run("apply")
	if err != nil {
		t.Fatalf("apply: %v\n%s", err, out)
	}
	if !strings.Contains(out, "would copy 3 files") || !strings.Contains(out, "run again with -yes") {
		t.Errorf("dry run output:\n%s", out)
	}
	if w.mr.HGet("repl:repl-a", "userId") != "" || w.mr.Exists("user:gh:1001") || w.mr.Exists(markerKey) {
		t.Error("dry run wrote to Redis")
	}
	if !maps.Equal(before, w.store.objects) {
		t.Error("dry run changed the bucket")
	}
}

func TestApplyExpandsAndIsRepeatable(t *testing.T) {
	w := newWorld(t)
	w.writeMapping(decided)

	if out, err := w.run("apply", "-yes"); err != nil {
		t.Fatalf("apply: %v\n%s", err, out)
	}

	for _, id := range []string{"repl-a", "repl-b"} {
		if got := w.mr.HGet("repl:"+id, "userId"); got != "gh:1001" {
			t.Errorf("%s userId = %q, want gh:1001", id, got)
		}
	}
	if got := w.members("user:gh:1001"); !slices.Equal(got, []string{"repl-a", "repl-b"}) {
		t.Errorf("user:gh:1001 = %v", got)
	}
	for _, key := range []string{"repl/gh:1001/repl-a/index.js", "repl/gh:1001/repl-a/src/app file.js", "repl/gh:1001/repl-b/main.py"} {
		if _, ok := w.store.objects[key]; !ok {
			t.Errorf("%s not copied", key)
		}
	}

	// Expand only adds: the old layout still works for the old code.
	if got := w.members("user:parth"); len(got) != 2 {
		t.Errorf("user:parth = %v, want untouched", got)
	}
	if _, ok := w.store.objects["repl/parth/repl-a/index.js"]; !ok {
		t.Error("old file removed by apply")
	}
	// Reset rows and look-alike names are not touched.
	if w.mr.HGet("repl:repl-c", "userId") != "" {
		t.Error("reset row was migrated")
	}
	if _, ok := w.store.objects["repl/gh:1001/repl-z/untouched"]; ok {
		t.Error("files of user parthkapoor were copied as parth's")
	}
	if w.mr.HGet(markerKey, "applied_at") == "" {
		t.Error("applied_at marker not recorded")
	}

	// After deploy the user edits a file under the new folder; running apply
	// again must not overwrite it with the old copy.
	w.store.objects["repl/gh:1001/repl-a/index.js"] = "edited after deploy"
	out, err := w.run("apply", "-yes")
	if err != nil {
		t.Fatalf("second apply: %v\n%s", err, out)
	}
	if got := w.store.objects["repl/gh:1001/repl-a/index.js"]; got != "edited after deploy" {
		t.Errorf("second apply overwrote a newer file: %q", got)
	}
	if !strings.Contains(out, "updated 0 records and 0 files") {
		t.Errorf("second apply was not a no-op:\n%s", out)
	}
}

func TestApplyRefusesRunningWorkspaces(t *testing.T) {
	w := newWorld(t)
	w.mr.HSet("repl:repl-b", "isActive", "true")
	w.writeMapping(decided)

	out, err := w.run("apply", "-yes")
	if err == nil || !strings.Contains(err.Error(), "repl-b is marked running") {
		t.Fatalf("apply err = %v, want refusal for running repl-b\n%s", err, out)
	}
	if w.mr.HGet("repl:repl-a", "userId") != "" {
		t.Error("apply wrote before refusing")
	}

	if out, err := w.run("apply", "-yes", "-allow-active"); err != nil {
		t.Fatalf("apply -allow-active: %v\n%s", err, out)
	}
}

func TestApplyRefusesConflictingOwner(t *testing.T) {
	w := newWorld(t)
	w.mr.HSet("repl:repl-a", "userId", "gh:9999")
	w.writeMapping(decided)

	if _, err := w.run("apply", "-yes"); err == nil || !strings.Contains(err.Error(), "already has userId gh:9999") {
		t.Fatalf("apply err = %v, want conflict", err)
	}
}

func TestVerifyFindsIncompleteApply(t *testing.T) {
	w := newWorld(t)
	w.writeMapping(decided)
	if out, err := w.run("apply", "-yes"); err != nil {
		t.Fatalf("apply: %v\n%s", err, out)
	}

	if out, err := w.run("verify"); err != nil {
		t.Fatalf("verify after apply: %v\n%s", err, out)
	}

	delete(w.store.objects, "repl/gh:1001/repl-b/main.py")
	w.mr.HDel("repl:repl-a", "userId")
	out, err := w.run("verify")
	if err == nil {
		t.Fatal("verify passed with a missing file and owner")
	}
	for _, want := range []string{"repl-a userId", "repl/parth/repl-b/main.py not copied"} {
		if !strings.Contains(out, want) {
			t.Errorf("verify output missing %q:\n%s", want, out)
		}
	}
}

func TestContractRefusesBeforeApply(t *testing.T) {
	w := newWorld(t)
	w.writeMapping(decided)
	before := maps.Clone(w.store.objects)

	if _, err := w.run("contract", "-yes"); err == nil {
		t.Fatal("contract ran before apply")
	}
	if !maps.Equal(before, w.store.objects) || !w.mr.Exists("user:parth") {
		t.Error("contract deleted data before apply was complete")
	}
}

func TestContractRemovesOldData(t *testing.T) {
	w := newWorld(t)
	w.writeMapping(decided)
	if out, err := w.run("apply", "-yes"); err != nil {
		t.Fatalf("apply: %v\n%s", err, out)
	}

	// Dry run first: nothing may disappear.
	if out, err := w.run("contract"); err != nil || !strings.Contains(out, "nothing deleted") {
		t.Fatalf("contract dry run: %v\n%s", err, out)
	}
	if !w.mr.Exists("user:parth") {
		t.Fatal("contract dry run deleted user:parth")
	}

	if out, err := w.run("contract", "-yes"); err != nil {
		t.Fatalf("contract: %v\n%s", err, out)
	}

	for _, key := range []string{"user:parth", "user:rahul", "repl:repl-c"} {
		if w.mr.Exists(key) {
			t.Errorf("%s still exists", key)
		}
	}
	// Migrated workspaces keep their records and new files.
	for _, key := range []string{"repl:repl-a", "repl:repl-b", "user:gh:1001", "user:gh:7", "repl:repl-n"} {
		if !w.mr.Exists(key) {
			t.Errorf("%s was deleted", key)
		}
	}
	want := []string{
		"repl/gh:1001/repl-a/index.js",
		"repl/gh:1001/repl-a/src/app file.js",
		"repl/gh:1001/repl-b/main.py",
		"repl/gh:7/repl-n/index.js",
		"repl/parthkapoor/repl-z/untouched",
		"templates/node/index.js",
	}
	if got := slices.Sorted(maps.Keys(w.store.objects)); !slices.Equal(got, want) {
		t.Errorf("bucket after contract =\n  %v\nwant\n  %v", got, want)
	}
	if w.mr.HGet(markerKey, "contracted_at") == "" {
		t.Error("contracted_at marker not recorded")
	}
}

func TestApplyStopsOnCopyError(t *testing.T) {
	w := newWorld(t)
	w.writeMapping(decided)
	w.store.copyErr = errors.New("bucket unavailable")

	if _, err := w.run("apply", "-yes"); err == nil {
		t.Fatal("apply reported success although copies failed")
	}
	if w.mr.Exists(markerKey) {
		t.Error("applied_at recorded after a failed apply")
	}
}

func TestParseArgs(t *testing.T) {
	if _, err := parseArgs(nil); err == nil {
		t.Error("no command accepted")
	}
	if _, err := parseArgs([]string{"migrate"}); err == nil {
		t.Error("unknown command accepted")
	}
	_, err := parseArgs([]string{"plan"})
	if err == nil || err.Error() != "missing required flags: -redis-url, -s3-endpoint, -s3-bucket" {
		t.Errorf("missing flags err = %v", err)
	}
}
