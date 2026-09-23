#!/usr/bin/env bash
# Claim a ticket and hand it to a worker CLI, headless.
#
#   _tickets/dispatch.sh <worker>[:<model>] [ticket-name]
#
#   _tickets/dispatch.sh cursor:grok-4.7-xhigh          # oldest ticket in open/
#   _tickets/dispatch.sh agy T3-add-login               # a specific ticket
#
# Claiming is `mv open/X.md doing/`: mv is atomic, so two workers can never take the same ticket.
# The script (not the model) signs the ticket with the real CLI and model, so nobody can misreport who did the work.
# Output: receipt _receipts/<ticket>.receipt.md, full log _receipts/<ticket>.run.log
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"   # <project>/_tickets
ROOT="$(dirname "$HERE")"               # <project>
. "$HERE/workers.sh"

if [ $# -lt 1 ]; then
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//' >&2
  exit 2
fi
SPEC="$1"; shift
worker_check "$SPEC"

if [ $# -gt 0 ]; then
  candidates=("$HERE/open/${1%.md}.md")
else
  candidates=("$HERE"/open/*.md)       # glob sorts by name: T1 before T2
fi

T=""
for f in "${candidates[@]}"; do
  [ -f "$f" ] || continue
  if mv -n "$f" "$HERE/doing/" 2>/dev/null && [ ! -e "$f" ]; then
    T="$HERE/doing/$(basename "$f")"
    break
  fi
done
if [ -z "$T" ]; then
  echo "nothing to claim in open/${1:+ ($1)}" >&2
  exit 1
fi

NAME="$(basename "$T" .md)"
mkdir -p "$ROOT/_receipts"
RECEIPT="$ROOT/_receipts/$NAME.receipt.md"
LOG="$ROOT/_receipts/$NAME.run.log"
TEMPLATE="$HERE/templates/receipt.md"

# Optional header line "> workdir: sub/dir" (relative to the project root). Default: project root.
sub="$(sed -nE 's/^>[[:space:]]*(workdir|作业目录)[[:space:]]*[:：][[:space:]]*//p' "$T" | head -1 | tr -d '`' | sed -E 's/[[:space:]]+$//')"
WORKDIR="$ROOT/${sub:-.}"
if [ ! -d "$WORKDIR" ]; then
  mv "$T" "$HERE/blocked/"
  echo "workdir does not exist: $WORKDIR  (ticket moved to blocked/)" >&2
  exit 1
fi

NOW="$(date '+%Y-%m-%d %H:%M %Z')"
ENGINE="$(worker_label "$SPEC")"
SIGN="> claimed-by: $ENGINE @ $NOW"
if grep -qE '^> *(claimed-by|领单人)' "$T"; then
  SIGN="$SIGN" perl -0pi -e 's{^> *(claimed-by|领单人).*$}{$ENV{SIGN}}m' "$T"
else
  SIGN="$SIGN" perl -0pi -e 's{\A(.*\n)}{$1\n$ENV{SIGN}\n}' "$T"
fi

PROMPT="You are the worker for one ticket. You run headless: nobody can answer questions.
Ticket: ${T} (already claimed for you; it stays in _tickets/doing/).
1. Read the whole ticket first, then every file it lists under inputs.
2. Do exactly what the ticket asks, nothing outside its scope.
3. Irreversible actions (dropping data, deleting directories, force-push, sending messages) only if the ticket explicitly says so; otherwise list them under open questions. If something is unclear, list it; do not guess.
4. Kill any background process you started for testing before you finish.
5. Do not move the ticket file. Do not git commit or push unless the ticket says so.
6. When done, write the receipt to ${RECEIPT} following ${TEMPLATE}, in the same language as the ticket. Engine line: ${ENGINE}. For every acceptance check, paste the exact command you ran and its unedited output. Never invent output."

echo "▶ $NAME → doing/  |  workdir ${sub:-.}  |  $ENGINE"
set +e
( cd "$WORKDIR" && run_worker build "$SPEC" "$PROMPT" ) </dev/null 2>&1 | tee "$LOG"
code=${PIPESTATUS[0]}
set -e

echo "────────"
echo "ticket:  $T"
if [ -f "$RECEIPT" ]; then echo "receipt: $RECEIPT"; else echo "⚠ no receipt written: $RECEIPT"; fi
echo "log:     $LOG"
[ "$code" -eq 0 ] && [ -f "$RECEIPT" ] || exit 1
