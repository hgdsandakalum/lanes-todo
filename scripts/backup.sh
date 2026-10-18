#!/bin/bash
# Saves a dated copy of local.db to backups/ and keeps the last 14 days.
# The app makes one of these itself each day it runs (lib/db/backup.ts); this is for a copy on demand.
# Run: npm run db:backup
# Restore: stop the app, then cp backups/lanes-YYYY-MM-DD.db local.db
set -euo pipefail

cd "$(dirname "$0")/.."
KEEP_DAYS=14
mkdir -p backups

# sqlite's .backup takes a consistent snapshot even while the app is writing; a plain cp might not
out="backups/lanes-$(date +%F).db"
/usr/bin/sqlite3 local.db ".backup '$out'"

# a copy that fails its integrity check is worse than none
if [ "$(/usr/bin/sqlite3 "$out" 'pragma integrity_check')" != "ok" ]; then
  echo "$(date '+%F %T') backup failed its integrity check: $out" >&2
  rm -f "$out"
  exit 1
fi

find backups -name 'lanes-*.db' -mtime +$((KEEP_DAYS - 1)) -delete
echo "$(date '+%F %T') saved $out ($(du -h "$out" | cut -f1)), $(ls backups/lanes-*.db | wc -l | tr -d ' ') kept"
