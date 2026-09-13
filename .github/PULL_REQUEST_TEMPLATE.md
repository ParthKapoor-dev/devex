## What and why

<!-- One or two sentences: what this PR changes and the problem it solves. -->

## Issue

<!--
PRs into `develop`: write "Part of #123". Closing keywords are ignored on
branches other than `main`, so the issue closes in the release PR instead.
Release PRs (develop → main): list every issue it ships, "Closes #123, closes #124".
Security fixes go through the advisory's temporary private fork, not a public PR.
-->

Part of #

## How I tested it

<!-- Commands you ran and what you checked by hand. -->

- [ ] `make ci` passes locally
- [ ] New or changed behaviour has a test that fails without this change

## Deploy notes

<!-- Anything needed besides merging: new env var or Docker secret, `kubectl apply`, data migration, bucket change. Write "None" if nothing. -->

None

## Checklist

- [ ] Base branch is `develop` (or `main` for a release/hotfix)
- [ ] Branch name is `fix/<issue>-<short-name>` or `feat/<issue>-<short-name>`
- [ ] No secrets, `.env` files or kubeconfigs in the diff
- [ ] Docs updated if behaviour or setup changed (`AGENTS.md`, `infra/*/`, `apps/web/content/docs/`)
- [ ] Screenshots attached if the UI changed
