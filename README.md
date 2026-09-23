# Ticket Dispatch

English · [中文](README.zh-CN.md)

Make Claude the manager, not the coder. You tell Claude what you want; it turns the work into tickets, hands them to cheaper AI command-line tools on your machine (Cursor, Gemini, DeepSeek, …), accepts the result by rerunning the checks itself, and has a model from a different vendor hunt for bugs.

Claude's quota goes to judgment. The labor goes to cheaper models.

The whole thing is one skill folder: instructions plus a ticket template and a receipt template. No server, nothing else to install.

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

**On first use**, Claude looks at which AI tools you have and how to call them, then asks you, one question at a time: who builds, who reviews, which models, which tools may see your code. You decide. It does a trial run and writes the result to `_tickets/workers.md` in your project.

Every ticket after that:

1. Claude writes the ticket: what to do, which files may change, which commands decide it is done.
2. It hands the ticket to your chosen worker, which runs in the background.
3. The worker hands back a receipt; Claude reruns the checks itself.
4. A model from another vendor reviews the change; Claude verifies each finding and sends the real ones back as a fix ticket.

Everything is recorded in `_tickets/` and `_receipts/` in your project.

## One tip

Let it run. Cutting in makes Claude stop and verify what you said, which burns quota. Speak up for real decisions; park passing thoughts.

## License

MIT
