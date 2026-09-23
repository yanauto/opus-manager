---
name: ticket-dispatch
description: Managed mode: you act as the manager and do not write the code yourself. Turn work into tickets, hand them to other AI command-line tools on the user's machine (cheaper models), then accept the result, get a second vendor to review it, and verify every finding. Use when the user says "use tickets", "manage this", "hand it off", or asks other models to do the work. On first use, find out which workers this machine has and settle the setup with the user.
---

# Ticket management

You are the manager: split the work, hand it out, accept it, make the calls. Workers write the implementation; you do not. Your quota goes to judgment; the labor goes to cheaper models.

Only use this workflow when the user asks for it. Otherwise work as usual.

## 0. First use: learn this machine

If the project has no `_tickets/workers.md`, do this first, then take on work.

1. **Environment**: which OS, and which shell you are using (bash / zsh / PowerShell). Write every later command for that shell.
2. **Find workers**: check which AI command-line tools are installed. Common ones: `cursor-agent`, `agy`, `codex`, `gemini`, `claude`, `pi`, `opencode`, `aider`, `qwen`; there may be others. Use the shell's own lookup (`command -v` in bash, `Get-Command` in PowerShell).
3. **Read the manual**: run each tool's help (`--help`) and find out four things:
   - how to run one task non-interactively (headless / print mode);
   - how to let it edit files and run commands without asking each time;
   - how to pick a model, and whether it can list its models;
   - whether it has a read-only mode (for reviews).
   Do not write flags from memory; the help output is the source of truth. If a flag's meaning is unclear, note it and watch what it actually does in the step 5 trial.
4. **Report to the user and let them decide.** Briefly, in plain words, list what you found and which models each tool offers. Then ask the user the following, one question at a time, waiting for each answer:
   - who builds and who reviews (suggest different vendors, but it is their call);
   - which model each uses;
   - which workers may see this project's code and data. Privacy terms differ between vendors and only the user can judge them;
   - and point out that "edit without asking" means the worker can change this project without confirmation. Get an explicit yes.
   If nothing is installed, tell the user the options; do not install anything for them.
5. **Trial run**: with the user's OK (it costs a little quota), give each chosen worker a tiny practice ticket, e.g. a function and a test in a temp folder, and confirm the command really runs and writes a receipt.
6. **Write it down** in `_tickets/workers.md` using the format below. Every later dispatch uses these commands. Redo this step when the user changes tools or choices.

```markdown
# Workers
> machine: <OS>, shell: <bash/PowerShell> | created: <date> | confirmed by the user

## Builder: <name> (<model>)
- build command: <full command, with <prompt> as the placeholder>
- may see: <the user's decision>
- trial: <date> passed, took <minutes>

## Reviewer: <name> (<model>)
- read-only review command: <full command>
- may see: <the user's decision>
- trial: <date> passed
```

## 1. Layout

Create these in the project root if missing:

```text
_tickets/
  open/      tickets ready to run
  doing/     in progress (moving a ticket here is the lock)
  done/      accepted
  blocked/   waiting on something outside; say what in the header
  dropped/   abandoned; say why
  workers.md worker setup (from step 0)
_receipts/   receipts, review reports, run logs
```

Ticket and receipt templates are in this skill's `templates/` folder.

## 2. Write the ticket

Follow `templates/ticket.md`, save as `_tickets/open/T<N>-<slug>.md`.

- **One ticket, one change.** If acceptance does not fit in a few commands, split it.
- **Acceptance is commands, not opinions.** "`npm test` passes", "open http://localhost:3000/login, tick remember-me, reload, still logged in". The worker must paste the raw output.
- **Say why the checks exist.** A worker can pass a check and miss the point (a test that asserts nothing). This line tells it, and later the reviewer, what actually matters.
- **Boundaries are explicit**: which files it may touch; no commits; no moving the ticket.
- **Write two, dispatch one.** Only tickets that can run now go in `open/`. The next one usually depends on the open questions in the last receipt.

## 3. Dispatch

1. **Lock**: move the ticket from `open/` to `doing/` (`mv` in bash, `Move-Item` in PowerShell). If the move succeeds, it is yours; if it fails, someone else took it, pick another.
2. **Sign**: fill the ticket's `claimed-by` line with who actually got it: tool, model, time. You write it; the worker does not report on itself.
3. **Run**: in the project folder (or the ticket's workdir), use the build command from `workers.md` with this prompt in place of `<prompt>`, and save the output to `_receipts/<ticket>.run.log`:

   > You are the worker for one ticket. You run headless: nobody can answer questions. Ticket: <path> (already claimed for you; it stays in _tickets/doing/). Read the whole ticket, then every file it lists. Do exactly what it asks, nothing outside its scope. Irreversible actions (deleting data or directories, force-push, sending messages) only if the ticket says so; otherwise list them under open questions. If something is unclear, list it; do not guess. Stop any background process you started before you finish. Do not move the ticket. Do not commit unless the ticket says so. When done, write the receipt to _receipts/<ticket>.receipt.md following <receipt template path>, in the ticket's language. Engine line: <tool / model>. For every acceptance check, paste the exact command and its unedited output. Never invent output.

4. **Wait for it to finish.** A ticket often takes minutes to tens of minutes. Run it in the background if you can, and look only once it has really ended. Do not report or guess the result before you have read the receipt.

## 4. Accept (you, not the worker)

A receipt is a claim, not evidence.

1. **Rerun every acceptance command** and compare with the pasted output.
2. **Check the scope of the change**: with git, `git status` and `git diff`; without git, read every file the receipt lists. Did it touch only what was allowed? Anything deleted or rewritten that should not be?
3. **Look at the real thing** when there is one: open the page, call the endpoint, take a screenshot.
4. **Read the open questions.** They are often the most useful part.

Fail: write a follow-up ticket (T<N>b) with the concrete failure and dispatch it. Do not quietly fix it yourself.
Pass: if the project uses git, make one commit that names the ticket.

## 5. Review with a different vendor

A worker never reviews its own code. Use the read-only review command from `workers.md` with this prompt, and save its final answer as `_receipts/<ticket>.review.md` (second round `.review-2.md`; never overwrite):

> You are the code reviewer for one ticket. You run headless: nobody can answer questions. Another model wrote this code; you check it. Ticket: <path>. Receipt: <path>. <Scope: a committed range, or the files listed in the receipt.> Look for real problems only: wrong logic and edge cases, damage to existing data, security holes (secrets, exposed endpoints, skipped approvals), stability (concurrency, timeouts, leaked resources), and tests that do not test what the receipt claims. No style nitpicks. Do not edit any file; you may run read-only commands and the ticket's acceptance commands. Your final answer IS the report: first line "Reviewer: <tool / model> @ <time>"; one-sentence verdict; then per finding: severity (high/medium/low) | file:line | problem | code evidence | fix. Mark anything uncertain as UNSURE. If you found nothing, say so; do not pad.

## 6. Verify every finding

Reviewers are often wrong. Open each cited file and line and confirm the problem exists.

- Real: put it in a fix ticket (one ticket can hold several), dispatch, accept; review again if the fix was large.
- Not real: one line under the report saying why.

Append your verdicts to the end of the review report.

## 7. Close

Move the ticket from `doing/` to `done/`. Tell the user in plain words: what works now, what they may notice, what risk remains.

## Rules

- Workers never move tickets, never commit, never review their own work.
- When the user cuts in mid-task, decide whether it is a new decision or a passing remark. Change the plan only for a new decision; do not tear up the whole plan over one sentence.
- Ask the user before paid trial runs, before giving a worker edit-without-asking rights, and before handing the code to a new worker.
