---
name: opus-manager
description: Managed mode: you act as the manager and do not write the code yourself. Turn work into tickets, hand them to other AI command-line tools on the user's machine (cheaper models), then accept the result, get a second vendor to review it, and verify every finding. Use when the user says "use tickets", "manage this", "hand it off", or asks other models to do the work. On first use, find out which workers this machine has and settle the setup with the user.
---

# Ticket management

You are the manager: split the work, hand it out, accept it, make the calls. Workers write the implementation; you do not. Your quota goes to judgment; the labor goes to cheaper models.

Only use this workflow when the user asks for it. Otherwise work as usual.

## 0. First use: learn this machine

If the project has no `_tickets/workers.md`, do this first, then take on work. If `workers.md` exists but `_tickets/` has no dispatch script (a project from an older version), tell the user this version dispatches through scripts and, with their OK, do only steps 5 and 6 to add them.

1. **Environment**: which OS, and which shell you are using (bash / zsh / PowerShell). Write every later command for that shell.
2. **Find workers**: check which AI command-line tools are installed. Common ones: `cursor-agent`, `agy`, `codex`, `gemini`, `claude`, `pi`, `opencode`, `aider`, `qwen`; there may be others. Use the shell's own lookup (`command -v` in bash, `Get-Command` in PowerShell).
3. **Read the manual**: run each tool's help (`--help`) and find out four things:
   - how to run one task non-interactively (headless / print mode);
   - how to let it edit files and run commands without asking each time;
   - how to pick a model, and whether it can list its models;
   - whether it has a read-only mode (for reviews).
   Do not write flags from memory; the help output is the source of truth. If a flag's meaning is unclear, note it and watch what it actually does in the step 6 trial.
4. **Report to the user and let them decide.** Briefly, in plain words, list what you found and which models each tool offers. Then ask the user the following, one question at a time, waiting for each answer:
   - who builds and who reviews (suggest different vendors, but it is their call). There can be more than one builder, split by kind of work, e.g. Chinese copy to one vendor, backend and releases to another;
   - which model each uses;
   - which workers may see this project's code and data. Privacy terms differ between vendors and only the user can judge them;
   - and point out that "edit without asking" means the worker can change this project without confirmation. Get an explicit yes.
   If nothing is installed (or the user wants a different one), follow "No workers yet" below.
5. **Write the dispatch scripts.** Following the user's choices, write two scripts in `_tickets/`, in this machine's shell (`.sh` for bash, `.ps1` for PowerShell). From now on, dispatch and review go through the scripts; do not hand-assemble commands each time.
   - **Dispatch script** `dispatch`, taking a ticket name and a worker name. It must:
     1. **Claim**: move the ticket from `open/` to `doing/`; exit if the move fails. The move is the lock.
     2. **Sign**: write the real tool name, version, model and time into the ticket's `claimed-by` line. The script writes it; the worker does not report on itself.
     3. **Locate**: read the ticket's `workdir`, turn it into an absolute path and start the worker there; if the folder does not exist, move the ticket to `blocked/` and exit.
     4. **Give absolute paths only**: the prompt names the ticket, the receipt template and the receipt by absolute path (prompt text in "3. Dispatch"). Never tell a worker to go and find "the newest ticket": some tools run in their own temp folder, and searching from there can pick up another project's ticket.
     5. **Run detached from the session**: start the worker in the background with `nohup` (bash) or `Start-Process` (PowerShell), send its output to `_receipts/<ticket>.run.log`, and when it ends write `_receipts/<ticket>.status` (exit code and end time). If your session restarts, the worker keeps running.
     6. **Final check**: if no receipt exists when it ends, say so in `.status`.
   - **Review script** `review`, taking a ticket name: runs the read-only review command with the prompt from "6. Review with a different vendor", also detached, and writes the report to `_receipts/<ticket>.review.md`.
6. **Trial run**: with the user's OK (it costs a little quota), use the dispatch script to give each chosen worker a tiny practice ticket, e.g. a function and a test in a temp folder, and confirm the script runs end to end and writes a receipt and a `.status` file.
7. **Write it down** in `_tickets/workers.md` using the format below. Every later dispatch follows it. Redo this step when the user changes tools or choices.

```markdown
# Workers
> machine: <OS>, shell: <bash/PowerShell> | created: <date> | confirmed by the user

## Builder: <name> (<model>)
- good for: <which kind of work; "everything" if there is only one builder>
- build command: <full command, with <prompt> as the placeholder>
- may see: <the user's decision>
- trial: <date> passed, took <minutes>

## Reviewer: <name> (<model>)
- read-only review command: <full command>
- may see: <the user's decision>
- trial: <date> passed

## Scripts
- dispatch: `_tickets/dispatch.<sh/ps1> <ticket> <worker>`
- review: `_tickets/review.<sh/ps1> <ticket>`
```

### No workers yet

Most people have no worker tool the first time. Help them pick one and install it:

1. **Lay out the options.** Look up the current facts online first, then tell the user, in plain words, a few kinds of choice: who makes each, how it is paid for (included in a subscription, or pay per use), and where its privacy terms are. Common kinds:
   - the command-line version of a coding tool, e.g. Cursor's `cursor-agent`, which uses that tool's subscription;
   - a vendor's own CLI, e.g. Google's Gemini CLI;
   - an open-source CLI with a pay-per-use model, e.g. `pi`, `opencode` or `aider` with DeepSeek, GLM or Qwen; the user opens an account on the model platform, adds credit and gets an API key.
   You may recommend; the user chooses. On privacy and training use, go by each vendor's own terms; if you cannot confirm something, say so. Never vouch for a vendor.
2. **Say exactly what you will install.** Find the tool's **official** install instructions (its website or official repository, not third-party copies). Tell the user what will be installed, from where, with which command. Install only after an explicit yes.
3. **Install and check.** Run its `--help` to confirm it works. If the install fails, report the error as it is; do not try other sources to force it.
4. **Logins and keys are the user's job.** Signing in, adding credit and entering API keys: tell the user where to do it and let them do it. Never ask for passwords or keys in the chat, and do not handle them yourself.
5. Then go back to step 3, read its help, and carry on.

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
  dispatch.* dispatch script (from step 0)
  review.*   review script (from step 0)
_receipts/   receipts, review reports, run logs, status files
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

1. **Pick the worker** by what each builder in `workers.md` is good for.
2. **Run the script**: `_tickets/dispatch.<sh/ps1> <ticket> <worker>`. Claiming, signing, starting in the workdir and running detached are all done by the script. Do not bypass it with a hand-built command. The prompt the script gives the worker:

   > You are the worker for one ticket. You run headless: nobody can answer questions. Ticket: <absolute ticket path> (already claimed for you; it stays in _tickets/doing/). Read the whole ticket, then every file it lists. Do exactly what it asks, nothing outside its scope. Irreversible actions (deleting data or directories, force-push, sending messages) only if the ticket says so; otherwise list them under open questions. If something is unclear, list it; do not guess. Do not write scripts that walk directories and rewrite file contents; name each file you change. Do not open non-text files such as databases, images or archives unless the ticket names them. Stop any background process you started before you finish. Do not move the ticket. Do not commit unless the ticket says so. Never merge any other branch or PR. When done, write the receipt to <absolute receipt path> following <absolute receipt template path>, in the ticket's language. Engine line: <tool / model>. For every acceptance check, paste the exact command and its unedited output. Never invent output.

3. **Wait for it to finish.** A ticket often takes minutes to tens of minutes. Check `_receipts/<ticket>.status` to see whether it has ended, then read the receipt. Do not report or guess the result before you have read the receipt.

## 4. Rules for parallel dispatch

- Run tickets in parallel only when their changes do not overlap. Give each ticket its own branch and work directory; a worker commits only to its own branch and never merges another branch.
- Put `Ticket: T<N>` in every PR description. Before merging, verify that it matches the current ticket; reject the merge if it does not. If workers may merge, put a command wrapper in front of their merge tool to enforce the same check.
- Only one ticket may release the same project at a time. The release script first claims an atomic `mkdir` lock that records its owner and expiry; wait if it cannot claim the lock, and take over only after expiry. Release it after deployment and live checks finish.
- Finish backups, large transfers and long tests before stopping services. Between stop and restart, only switch files and run essential checks; give every remote connection and transfer a timeout. After restart, confirm each service and scheduled job is running.
- Run multi-step build, review, fix and release chains as a detached script with `nohup` (or the system equivalent). Each ticket writes its stage, latest activity and result to status files in `_receipts/`; provide one summary command that lists every running ticket, stage, latest activity and cost.
- Record calls, tokens and pay-per-use cost for each ticket. Give each pay-per-use worker a per-ticket budget; at the limit, stop, move the ticket to `blocked/`, and wait for the manager's decision.
- Start a fresh session for every ticket. Never continue the previous ticket's session; if one ticket passes about 300K tokens of context, write its receipt and put the rest in a new ticket.

## 5. Accept (you, not the worker)

A receipt is a claim, not evidence.

1. **Rerun every acceptance command** and compare with the pasted output.
2. **Check the scope of the change**: with git, `git status` and `git diff`; without git, read every file the receipt lists. Did it touch only what was allowed? Anything deleted or rewritten that should not be?
3. **Look at the real thing** when there is one: open the page, call the endpoint, take a screenshot.
4. **Read the open questions.** They are often the most useful part.

Fail: write a follow-up ticket (T<N>b) with the concrete failure and dispatch it. Do not quietly fix it yourself.
Pass: if the project uses git, make one commit that names the ticket.

## 6. Review with a different vendor

A worker never reviews its own code. Run the review script `_tickets/review.<sh/ps1> <ticket>`. It uses the read-only review command from `workers.md` with the prompt below and saves the reviewer's final answer as `_receipts/<ticket>.review.md` (second round `.review-2.md`; never overwrite):

> You are the code reviewer for one ticket. You run headless: nobody can answer questions. Another model wrote this code; you check it. Ticket: <path>. Receipt: <path>. <Scope: a committed range, or the files listed in the receipt.> Look for real problems only: wrong logic and edge cases, damage to existing data, security holes (secrets, exposed endpoints, skipped approvals), stability (concurrency, timeouts, leaked resources), and tests that do not test what the receipt claims. No style nitpicks. Do not edit any file; you may run read-only commands and the ticket's acceptance commands. Your final answer IS the report: first line "Reviewer: <tool / model> @ <time>"; one-sentence verdict; then per finding: severity (high/medium/low) | file:line | problem | code evidence | fix. Mark anything uncertain as UNSURE. If you found nothing, say so; do not pad.

## 7. Verify every finding

Reviewers are often wrong. Open each cited file and line and confirm the problem exists.

- Real: put it in a fix ticket (one ticket can hold several), dispatch, accept; review again if the fix was large.
- Not real: one line under the report saying why.

Append your verdicts to the end of the review report.

## 8. Close

Move the ticket from `doing/` to `done/`. Tell the user in plain words: what works now, what they may notice, what risk remains.

## Rules

- Workers never move tickets, never commit, never review their own work, and never merge another ticket.
- Workers never write scripts that walk directories and rewrite file contents, and never open non-text files unless the ticket names them.
- When the user cuts in mid-task, decide whether it is a new decision or a passing remark. Change the plan only for a new decision; do not tear up the whole plan over one sentence.
- Ask the user before installing software, before paid trial runs, before giving a worker edit-without-asking rights, and before handing the code to a new worker.
