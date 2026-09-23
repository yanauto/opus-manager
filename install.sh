#!/usr/bin/env bash
# Install the ticket workflow into a project.
#
#   ./install.sh <project-dir> [--lang en|zh]
#
# Creates  <project>/_tickets/{open,doing,done,blocked,dropped}, <project>/_receipts/,
# copies the scripts and templates into _tickets/, and the skill into <project>/.claude/skills/ticket-dispatch/.
# Existing files are never overwritten; rerun it any time.
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
LANG_=en
DEST=""
while [ $# -gt 0 ]; do
  case "$1" in
    --lang) LANG_="${2:-}"; shift 2 ;;
    --lang=*) LANG_="${1#--lang=}"; shift ;;
    -h|--help) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) DEST="$1"; shift ;;
  esac
done
[ -n "$DEST" ] || { sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//' >&2; exit 2; }
case "$LANG_" in en|zh) ;; *) echo "--lang must be en or zh" >&2; exit 2 ;; esac
[ -d "$DEST" ] || { echo "not a directory: $DEST" >&2; exit 1; }
DEST="$(cd "$DEST" && pwd)"

put() {  # put <src> <dst>: copy unless dst exists
  if [ -e "$2" ]; then echo "  keep   ${2#$DEST/}"; else cp "$1" "$2"; echo "  add    ${2#$DEST/}"; fi
}

mkdir -p "$DEST"/_tickets/{open,doing,done,blocked,dropped} "$DEST/_tickets/templates" \
         "$DEST/_receipts" "$DEST/.claude/skills/ticket-dispatch"
for d in open doing done blocked dropped; do touch "$DEST/_tickets/$d/.gitkeep"; done
touch "$DEST/_receipts/.gitkeep"

for f in dispatch.sh review.sh workers.sh; do put "$SRC/bin/$f" "$DEST/_tickets/$f"; done
chmod +x "$DEST/_tickets/dispatch.sh" "$DEST/_tickets/review.sh"
for f in ticket.md receipt.md; do put "$SRC/templates/$LANG_/$f" "$DEST/_tickets/templates/$f"; done
put "$SRC/skill/$LANG_/SKILL.md" "$DEST/.claude/skills/ticket-dispatch/SKILL.md"

# Logs can contain anything the worker printed; keep them out of git.
if ! grep -qs '_receipts/\*.log' "$DEST/.gitignore"; then
  printf '\n# ticket workflow: worker logs\n_receipts/*.log\n' >> "$DEST/.gitignore"
  echo "  update .gitignore"
fi

echo
echo "Done. In Claude Code, inside $DEST, say for example:"
if [ "$LANG_" = zh ]; then
  echo '  「走工单：给登录页加上记住我。让 cursor 写，agy 审。」'
else
  echo '  "Use tickets: add remember-me to the login page. Cursor builds, agy reviews."'
fi
