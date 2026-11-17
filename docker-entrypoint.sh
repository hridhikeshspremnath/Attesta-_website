#!/bin/sh
# Fetch this workload's SVID into $ATTESTA_SVID_DIR, keep it fresh, then start Next.js.
# The key only ever lives in that directory (a tmpfs in the compose service).
set -eu

dir="${ATTESTA_SVID_DIR:-/tmp/svid}"
socket="${SPIFFE_SOCKET:-/run/spire/sockets/agent.sock}"
mkdir -p "$dir"

fetch() { /opt/spire/bin/spire-agent api fetch x509 -socketPath "$socket" -write "$dir" >/dev/null 2>&1; }

i=0
until fetch; do  # the registration entry reaches the agent on its next sync
    i=$((i + 1))
    [ "$i" -ge 20 ] && { echo "no SVID issued by the SPIRE agent" >&2; exit 1; }
    sleep 3
done
# shortcut: a request that lands mid-refresh can read a mismatched cert/key and fail once;
# switch to an in-process Workload API client if that matters.
( while sleep 300; do fetch || echo "SVID refresh failed" >&2; done ) &

exec node_modules/.bin/next start -H 0.0.0.0 -p 3000
