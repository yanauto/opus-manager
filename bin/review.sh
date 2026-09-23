#!/usr/bin/env bash
# Have a second worker, ideally from a different vendor, review a finished ticket. Read-only.
#
#   _tickets/review.sh <worker>[:<model>] <ticket-name> [git-range]
#
#   _tickets/review.sh agy:gemini-3.8-flash-high T3-add-login main..feat/login
#
# The ticket may be in doing/ or done/. Without a git range the reviewer works it out from the receipt and git.
# The reviewer prints its report; the script saves it to _receipts/<ticket>.review.md.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$HERE")"
. "$HERE/workers.sh"

if [ $# -lt 2 ]; then
  sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//' >&2
  exit 2
fi
SPEC="$1"; NAME="${2%.md}"; RANGE="${3:-}"
worker_check "$SPEC"

T=""
for d in doing done; do
  [ -f "$HERE/$d/$NAME.md" ] && T="$HERE/$d/$NAME.md" && break
done
[ -n "$T" ] || { echo "ticket not found in doing/ or done/: $NAME" >&2; exit 1; }

RECEIPT="$ROOT/_receipts/$NAME.receipt.md"
# Second and later rounds get their own file: <ticket>.review-2.md, -3, ...
REPORT="$ROOT/_receipts/$NAME.review.md"; n=2
while [ -e "$REPORT" ]; do REPORT="$ROOT/_receipts/$NAME.review-$n.md"; n=$((n+1)); done
LOG="${REPORT%.md}.log"
[ -f "$RECEIPT" ] || { echo "no receipt yet, dispatch the ticket first: $RECEIPT" >&2; exit 1; }

sub="$(sed -nE 's/^>[[:space:]]*(workdir|作业目录)[[:space:]]*[:：][[:space:]]*//p' "$T" | head -1 | tr -d '`' | sed -E 's/[[:space:]]+$//')"
WORKDIR="$ROOT/${sub:-.}"
[ -d "$WORKDIR" ] || { echo "workdir does not exist: $WORKDIR" >&2; exit 1; }

NOW="$(date '+%Y-%m-%d %H:%M %Z')"
ENGINE="$(worker_label "$SPEC")"
if [ -n "$RANGE" ]; then
  SCOPE="Review exactly the committed changes in: git diff ${RANGE}"
else
  SCOPE="Find the changes yourself: use git log / git diff / git show if this is a git repo, otherwise read every file listed in the receipt."
fi

PROMPT="You are the code reviewer for one ticket. You run headless: nobody can answer questions. Another model wrote this code; you check it.
Ticket: ${T}
Worker's receipt: ${RECEIPT}
${SCOPE}
1. Read the ticket and the receipt first: what was asked, what was actually changed.
2. Look for real problems only: wrong logic and edge cases, damage to existing data, security holes (secrets, exposed endpoints, skipped approvals), stability (concurrency, timeouts, leaked resources), and tests that do not actually test what the receipt claims. No style nitpicks.
3. Do not edit any file. You may run read-only commands and the ticket's acceptance commands to check claims.
4. Your final answer IS the report, in the same language as the ticket, and nothing else:
   first line: Reviewer: ${ENGINE} @ ${NOW}
   then one sentence overall verdict,
   then one entry per finding: severity (high/medium/low) | file:line | what is wrong | code evidence (quote it) | how to fix.
   Mark anything you are not sure about as UNSURE. If you found nothing, say so; do not pad."

echo "▶ review $NAME  |  workdir ${sub:-.}  |  $ENGINE"
set +e
( cd "$WORKDIR" && run_worker review "$SPEC" "$PROMPT" ) </dev/null 2>"$LOG" | tee "$REPORT.part"
code=${PIPESTATUS[0]}
set -e

echo "────────"
if [ "$code" -ne 0 ] || [ ! -s "$REPORT.part" ]; then
  cat "$REPORT.part" >> "$LOG"; rm -f "$REPORT.part"
  echo "⚠ review failed (exit $code), no report saved; see $LOG" >&2
  exit 1
fi
mv "$REPORT.part" "$REPORT"
echo "report: $REPORT"
echo "log:    $LOG"
