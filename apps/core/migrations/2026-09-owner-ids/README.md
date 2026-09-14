# 2026-09 owner ids

One-off migration for the release that identifies accounts by a stable id (PR #34).

| | Redis | Files |
| --- | --- | --- |
| Before | `user:<name>` set, `repl:<id>` without `userId` | `repl/<name>/<replId>/…` |
| After | `user:<gh:123>` set, `repl:<id>.userId = gh:123` | `repl/gh:123/<replId>/…` |

Old records don't say whether `<name>` was a GitHub login or the part of an email address before the `@`, so every name is decided by hand in `mapping.csv`: **migrate** (GitHub users, to `gh:<numeric id>`) or **reset** (email sign-ins, whose full address was never stored).

## Runbook

Run from a directory **outside** the repo, so nothing picks up a `.env`. Every step reads the same flags:

```sh
(cd apps/core && go build -o ../../migrate-owner-ids ./migrations/2026-09-owner-ids)   # from the repo root; move the binary out of the repo
export S3_ACCESS_KEY=… S3_SECRET_KEY=…
FLAGS="-redis-url redis://:<password>@<host>:6379/0 -s3-endpoint https://<account>.r2.cloudflarestorage.com -s3-bucket <bucket>"
```

| # | When | Step |
| --- | --- | --- |
| 1 | Before the release | Announce a short maintenance window. Stop running workspaces; `kubectl get deploy` lists no `repl-…` |
| 2 | | **Back up** Redis (`redis-cli --rdb backup.rdb`) and `repl/` (`aws s3 sync s3://<bucket>/repl/ s3://<bucket>/backup-<date>/repl/`) |
| 3 | | `./migrate-owner-ids plan $FLAGS`: read-only, writes `mapping.csv` |
| 4 | | Edit `mapping.csv`: every row `migrate` (with `gh:<id>`) or `reset`. A GitHub account with the same login is only a suggestion: an email user can share the name |
| 5 | | `./migrate-owner-ids apply $FLAGS`: dry run, read what it would do |
| 6 | | `./migrate-owner-ids apply $FLAGS -yes`, then `verify $FLAGS` until it prints OK |
| 7 | Release | Merge the `develop` → `main` release PR; wait for the core deploy |
| 8 | | On production: sign in, dashboard lists your workspaces, open one, close the tab, wait 5 minutes, reopen: files still there |
| 9 | ~1 week later | `contract $FLAGS` (dry run), then `contract $FLAGS -yes`. After this, rolling back loses data |

`apply` only adds data, so until step 9 a rollback is just redeploying the previous core image. `apply` and `verify` can be re-run any time; `apply` never overwrites a file that already exists at the new path. Each `-yes` run records its time in the Redis hash `migrations:owner-ids`.

Keep `mapping.csv` out of git: it lists your users.

Delete this folder in a small PR once `contract -yes` has run; git history keeps it.
