// Command migrate-owner-ids (migration 2026-09) moves workspaces created before accounts had
// stable ids onto the id-based layout.
//
//	before: user:<name>  -> {replId}   repl:<replId> without userId   files under repl/<name>/
//	after:  user:<id>    -> {replId}   repl:<replId>.userId = <id>     files under repl/<id>/
//
// Old records don't say whether <name> was a GitHub login or the local part of
// an email address, so a person decides, row by row, in a mapping file:
//
//	plan      read-only. Writes the mapping file: one row per legacy name, action "review".
//	apply     expand. Adds userId, the new set and copies of the files. Old data is untouched.
//	verify    read-only. Checks that apply is complete for every "migrate" row.
//	contract  deletes the old sets and folders, and the workspaces of "reset" rows.
//
// apply and contract only print what they would do unless -yes is given.
//
// Connection settings come from flags and the process environment only. This
// command deliberately does not import internal/s3 or internal/redis: those
// read .env files and production defaults at init.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const usage = `usage: migrate-owner-ids <plan|apply|verify|contract> [flags]

  plan      read-only; write the mapping file for you to review
  apply     add the id-based data next to the old data (expand)
  verify    read-only; check apply is complete
  contract  delete the old data (run once production is verified)

S3 credentials are read from S3_ACCESS_KEY and S3_SECRET_KEY in the environment.
`

type config struct {
	command     string
	redisURL    string
	s3Endpoint  string
	s3Bucket    string
	s3Region    string
	mapping     string
	githubAPI   string
	yes         bool
	allowActive bool
}

// deps is what the steps talk to; tests swap in miniredis and a fake storage.
type deps struct {
	rdb    *redis.Client
	store  storage
	lookup githubLookup
	out    io.Writer
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	if err := run(ctx, os.Args[1:], os.Stdout, connect); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func parseArgs(args []string) (config, error) {
	if len(args) == 0 || strings.HasPrefix(args[0], "-") {
		return config{}, errors.New(usage)
	}
	cfg := config{command: args[0]}

	fs := flag.NewFlagSet(cfg.command, flag.ContinueOnError)
	fs.StringVar(&cfg.redisURL, "redis-url", "", "Redis URL, e.g. redis://:password@host:6379/0 (required)")
	fs.StringVar(&cfg.s3Endpoint, "s3-endpoint", "", "S3-compatible endpoint URL (required)")
	fs.StringVar(&cfg.s3Bucket, "s3-bucket", "", "bucket holding repl/ (required)")
	fs.StringVar(&cfg.s3Region, "s3-region", "auto", "bucket region")
	fs.StringVar(&cfg.mapping, "mapping", "mapping.csv", "mapping file written by plan and read by the other steps")
	fs.StringVar(&cfg.githubAPI, "github-api", "https://api.github.com", "GitHub API base URL used by plan for suggestions; empty disables lookups")
	fs.BoolVar(&cfg.yes, "yes", false, "apply/contract: actually write; without it they only print")
	fs.BoolVar(&cfg.allowActive, "allow-active", false, "apply/contract: proceed even if a workspace is marked running")
	if err := fs.Parse(args[1:]); err != nil {
		return config{}, err
	}

	switch cfg.command {
	case "plan", "apply", "verify", "contract":
	default:
		return config{}, fmt.Errorf("unknown command %q\n\n%s", cfg.command, usage)
	}
	var missing []string
	for _, f := range []struct{ name, value string }{{"-redis-url", cfg.redisURL}, {"-s3-endpoint", cfg.s3Endpoint}, {"-s3-bucket", cfg.s3Bucket}} {
		if f.value == "" {
			missing = append(missing, f.name)
		}
	}
	if len(missing) > 0 {
		return config{}, fmt.Errorf("missing required flags: %s", strings.Join(missing, ", "))
	}
	return cfg, nil
}

func run(ctx context.Context, args []string, out io.Writer, newDeps func(context.Context, config, io.Writer) (deps, error)) error {
	cfg, err := parseArgs(args)
	if err != nil {
		return err
	}
	d, err := newDeps(ctx, cfg, out)
	if err != nil {
		return err
	}
	defer d.rdb.Close()

	if err := d.rdb.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("redis: %w", err)
	}

	switch cfg.command {
	case "plan":
		f, err := os.OpenFile(cfg.mapping, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
		if err != nil {
			return fmt.Errorf("%w (plan never overwrites a mapping file; move it first)", err)
		}
		defer f.Close()
		if err := plan(ctx, d, f); err != nil {
			return err
		}
		fmt.Fprintf(out, "wrote %s: set every row's action to migrate or reset, then run apply\n", cfg.mapping)
		return nil
	}

	rows, err := loadMapping(cfg.mapping)
	if err != nil {
		return err
	}
	switch cfg.command {
	case "apply":
		return apply(ctx, d, rows, cfg.yes, cfg.allowActive)
	case "verify":
		return verify(ctx, d, rows)
	default:
		return contract(ctx, d, rows, cfg.yes, cfg.allowActive)
	}
}

// connect builds the real clients from cfg.
func connect(ctx context.Context, cfg config, out io.Writer) (deps, error) {
	opt, err := redis.ParseURL(cfg.redisURL)
	if err != nil {
		return deps{}, fmt.Errorf("-redis-url: %w", err)
	}
	store, err := newS3Storage(ctx, cfg.s3Endpoint, cfg.s3Bucket, cfg.s3Region, os.Getenv("S3_ACCESS_KEY"), os.Getenv("S3_SECRET_KEY"))
	if err != nil {
		return deps{}, err
	}
	fmt.Fprintf(out, "redis %s, bucket %s at %s\n\n", opt.Addr, cfg.s3Bucket, cfg.s3Endpoint)

	d := deps{rdb: redis.NewClient(opt), store: store, out: out}
	if cfg.githubAPI != "" {
		d.lookup = newGitHubLookup(&http.Client{Timeout: 10 * time.Second}, cfg.githubAPI, os.Getenv("GITHUB_TOKEN"))
	}
	return d, nil
}
