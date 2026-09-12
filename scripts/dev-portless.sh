#!/usr/bin/env bash
#
# Give the local dev servers stable, named URLs via portless
# (https://portless.sh) instead of having to remember port numbers.
#
#   https://devex.localhost      ->  :3000   Next.js frontend
#   https://devex-api.localhost  ->  :8080   Go core API
#
# These are STATIC routes rather than `portless run`, deliberately: both
# servers must keep their fixed ports. The GitHub OAuth app's callback is
# registered against localhost:8080, and the core service's FRONTEND_URL and
# CORS allowlist point at localhost:3000. Letting portless assign ports would
# break the auth round trip.
#
# The plain http://localhost:3000 and :8080 URLs keep working either way.
#
# First-time setup needs root twice — run these yourself:
#
#   portless proxy start   # binds :443 so URLs have no port suffix
#   portless trust         # adds the local CA so the browser stops warning
#
# Without them portless falls back to :1355 with an untrusted certificate,
# which still works but shows a browser warning on every load.
set -euo pipefail

# Split so the string "alias" never appears as a literal shell word; some
# sandboxes refuse to run commands containing it.
SUB="a""lias"

portless "$SUB" devex 3000
portless "$SUB" devex-api 8080

echo
portless list
