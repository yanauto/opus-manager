# Ticket Dispatch

English · [中文](README.zh-CN.md)

Turn Claude Code into an engineering manager instead of an expensive typist.

You tell Claude what you want built. Claude breaks the job into small, explicit tickets, hands them to cheaper AI command-line tools already on your machine (Cursor, Gemini, DeepSeek via pi, Codex, etc.), reruns the acceptance checks itself, brings in a model from a different vendor to review the diff, and verifies every finding before accepting the work.

Claude's quota is spent entirely on judgment: task decomposition, acceptance testing, and review verification. The heavy lifting goes to fast, cheap pay-as-you-go models. The author's own words: a $20 Claude Pro plan starts to feel like the $200 Max plan.

The entire project is a single Claude Code skill folder: instructions, a ticket template, and a receipt template. No servers, no background daemons, no scripts to install. It is built to work on macOS, Linux and Windows, because Claude runs the commands in whatever shell you already have (bash, zsh or PowerShell). So far it has been tested on macOS only.

## Why Do This?

Claude (especially Opus) is exceptional at high-level reasoning and catching subtle design bugs, but letting it write repetitive boilerplate burns through quota fast. Pay-as-you-go models cost far less per token.

Real numbers from actual daily use:
- **A full workday on 20% quota**: One colleague handed a whole working day of development to this workflow and consumed just 20% of their weekly Claude Pro allowance. The worker models cost about $5–$6 for that day. One person, one day.
- **Heavy throughput**: On one of the author's work projects in a single day, worker models (DeepSeek via pi) made 3,617 model calls and consumed ~808M tokens for roughly $10.
- **Cross-vendor bug hunting**: On another day across 13 tickets on the author's own app, a second-vendor review generated 36 review findings over 3 rounds. Claude verified each finding against the code: 35 were accepted and fixed, 1 was rejected.

Cheap models still cost money on a pay-per-use basis, but you hit Claude's limits far less often, and Claude still judges every change.

## How It Works

Once you ask Claude to manage a task, it runs a disciplined delivery cycle inside your repo:

1. **Writes the ticket**: Creates a clear spec in `_tickets/open/` with strict boundaries (allowed files, non-goals) and runnable acceptance commands.
2. **Dispatches to a local worker**: Moves the ticket to `_tickets/doing/` and runs your chosen CLI tool in the background.
3. **Accepts the work itself**: The worker files a receipt in `_receipts/`. Claude does not take the worker's word for it—Claude reruns every test and acceptance command itself and inspects the diff.
4. **Cross-vendor review**: Claude calls a model from a different vendor in read-only mode to audit the changes for logic errors, edge cases, data risks, and security issues.
5. **Verifies every finding**: Reviewers make mistakes too. Claude opens the cited files and lines to verify each problem. Genuine bugs get dispatched as follow-up fix tickets; false alarms are rejected with a note.

Everything is recorded as plain markdown in `_tickets/` and `_receipts/`.

## First Use: Claude Sets It Up With You

There are no config files to write by hand. Each worker tool still needs its own login or API key, as usual.

The first time you tell Claude to use tickets, it inspects your machine:
- Detects which AI CLI tools are installed (`cursor-agent`, `agy` / `gemini`, `codex`, `pi`, etc.).
- Runs `--help` on each tool to find headless flags, model arguments, and permission options.
- Asks you questions one at a time: who builds, who reviews, which models to use, which tools may see your code, and whether workers may edit files without prompting.
- Runs a quick, low-cost trial ticket to confirm the tool runs cleanly.
- Saves your setup to `_tickets/workers.md` for all future dispatches.

Claude never makes privacy, security, or file-access decisions for you.

## Requirements

- [Claude Code](https://code.claude.com) (Pro is enough)
- At least one other AI command-line tool: `cursor-agent`, `agy` / `gemini`, `codex`, `pi`, … Whatever you have; Claude checks on first use.

## Install

Easiest: open Claude Code and say

> Install `skill/en/ticket-dispatch` from https://github.com/yanauto/ticket-oss as my personal skill.

Or by hand:

**macOS / Linux**

```bash
git clone https://github.com/yanauto/ticket-oss.git
mkdir -p ~/.claude/skills
cp -R ticket-oss/skill/en/ticket-dispatch ~/.claude/skills/
```

**Windows (PowerShell)**

```powershell
git clone https://github.com/yanauto/ticket-oss.git
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills" | Out-Null
Copy-Item -Recurse ticket-oss\skill\en\ticket-dispatch "$env:USERPROFILE\.claude\skills\"
```

No git? On GitHub click Code → Download ZIP and copy `skill/en/ticket-dispatch` to the same place.

Restart Claude Code afterwards.

## Use

In your project, tell Claude Code:

> Use tickets: add remember-me to the login page.

(You can also say "manage this", "hand it off", or "let other models do this".)

## One tip

Let it run. Cutting in makes Claude stop and verify what you said, which burns quota. Speak up for real decisions; park passing thoughts.

## License

MIT
