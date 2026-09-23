---
name: ticket-dispatch
description: Run coding work as tickets. You write the ticket, a worker CLI from another vendor (Cursor, agy, Claude, pi) builds it headless, you check the result by rerunning the acceptance commands, a reviewer from a third vendor hunts for bugs, and you verify each finding. Use when the user says "use tickets", "dispatch this", "let cursor/agy do it", or otherwise asks to hand work to other agents.
---

# Ticket dispatch

You are the orchestrator. You do not write the implementation yourself: you write tickets, dispatch them, and check what comes back. This keeps your context small and your judgment independent of the code.

Only use this workflow when the user asks for it. Otherwise do the work yourself as usual.

## Layout

```text
_tickets/
  open/      tickets ready to run (you write them here)
  doing/     claimed tickets (dispatch.sh moves them here; mv is atomic, so it doubles as a lock)
  done/      accepted tickets (you move them here after acceptance)
  blocked/   waiting on something outside; say what in the ticket header
  dropped/   abandoned; say why
  templates/ ticket.md, receipt.md
  dispatch.sh  review.sh  workers.sh
_receipts/   <ticket>.receipt.md, <ticket>.review.md, logs
```

## 1. Write the ticket

Copy `_tickets/templates/ticket.md` to `_tickets/open/T<N>-<slug>.md` and fill it in.

- **One ticket, one change, one commit.** If you cannot describe the acceptance in a few commands, split it.
- **Acceptance is commands, not opinions.** "`cargo test health::` passes", "`curl -s localhost:8080/api/x | jq .count` prints 3". The worker must paste the exact output.
- **Say why the checks exist.** A worker can pass a check without reaching the goal (a test that asserts nothing, a guard on the wrong side). The "why" line tells it, and later the reviewer, what actually matters.
- **Boundaries are explicit.** Which files it may touch; no commits; no moving the ticket.
- **Write two, dispatch one.** Only put tickets in `open/` that can run now. The next ticket usually depends on the open questions in the last receipt.

## 2. Dispatch

```bash
_tickets/dispatch.sh cursor:grok-4.7-xhigh            # oldest ticket in open/
_tickets/dispatch.sh agy:gemini-3.8-flash-high T4-fix-timezone
```

Worker spec is `<cli>[:<model>]`; supported CLIs are listed in `workers.sh`. A run takes minutes to tens of minutes: start it in the background and wait for it to exit. Do not report or guess the result before you have read the receipt.

The script signs the ticket with the real CLI and model, so the receipt cannot misstate who did the work.

## 3. Accept (you, not the worker)

Read `_receipts/<ticket>.receipt.md`, then check it yourself. The receipt is a claim, not evidence.

1. **Rerun every acceptance command** and compare with what the receipt pasted.
2. **Read the diff** (`git diff`, `git status`): did it touch only what the ticket allowed? Anything deleted or rewritten that should not be?
3. **Look at the real thing** when there is one: open the page, call the endpoint, take the screenshot.
4. Read the open questions. They are often the most useful part.

If it fails, write a follow-up ticket (T<N>b) with the concrete failure and dispatch again. Do not quietly fix it yourself; the record of what failed is part of the value.

When it passes, commit it as one commit that names the ticket.

## 4. Review with a different vendor

The model that wrote the code never reviews it. Use a reviewer from another vendor:

```bash
_tickets/review.sh agy:gemini-3.8-flash-high T4-fix-timezone main..HEAD
```

The reviewer runs read-only and its report lands in `_receipts/<ticket>.review.md`. Review committed ranges, not a working tree that may still be changing. For several related tickets, one review over the whole range is fine.

## 5. Verify every finding

Reviewers are wrong fairly often. For each finding:

- Open the cited file and line and confirm the problem exists.
- Real: add it to a fix ticket (one fix ticket can cover several findings), dispatch, accept, review again if the fix was large.
- Not real: write one line saying why under the report.

Append your verdicts to the end of the review report so the trail is complete.

## 6. Close

Move the ticket from `doing/` to `done/`. Tell the user: what now works, what changed that they may notice, what risks remain. Short.

## Choosing workers

- Different vendors for building and reviewing. They make different mistakes, which is the point.
- You can route by data sensitivity: send private code only to workers whose privacy terms you accept, and keep others for work where it does not matter.
- Workers never move tickets, never commit, never review their own work.
