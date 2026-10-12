# Dispatch work to Claude from personal WeChat (cc-connect)

English · [中文](wechat-remote.zh-CN.md)

When you are out, send tasks from WeChat on your phone to Claude Code on your computer at home, and read its reports there. Claude still manages; workers still run on the computer.

Evidence: one real production project, used daily from 2026-10-02 to 10-12 (10 days). Tested on macOS only.

## How it works

[cc-connect](https://github.com/chenhg5/cc-connect) (open source) runs on your computer, forwards messages from your personal WeChat to the local Claude Code **CLI**, and sends the replies back. The computer must stay on and must not sleep.

It drives the CLI, not the desktop app, and the two do not share conversations. Keep them in sync through state files in the project (a handoff note, `_tickets/queue.md`, `_receipts/progress.md`), not through chat memory.

## Setup

cc-connect's own docs and `cc-connect --help` are the reference; below is the order and the traps we hit.

1. Install cc-connect following its official INSTALL.md.
2. `cc-connect weixin setup` and scan the QR code to bind your personal WeChat. Allow only your own account to send commands (`allow_from` in the config).
3. Run `cc-connect config example` to see a full config, then add one project: agent Claude Code, `work_dir` set to the **project root**. Started anywhere else, Claude will not read the project rules. One project is simplest; with several, it is easy to send to the wrong one from a phone.
4. Log the Claude Code CLI in once on its own. Until you do, WeChat only receives "Not logged in" and later messages queue up; after logging in, run `cc-connect daemon restart`.
5. `cc-connect daemon install` installs it as a background service that starts at boot. After config changes or a hang, `cc-connect daemon restart`.
6. From mainland China, direct calls to the Anthropic API are refused (403). Set a proxy (for example `HTTPS_PROXY`) in the background service's environment, and use it when you log in from a terminal too.
7. You cannot tap confirmation prompts from WeChat, so the CLI usually has to run without per-step approval to finish a ticket. That lets Claude act in this project without asking; decide that deliberately. You can switch back any time by sending `/mode default` in WeChat.
8. Pages and screenshots it generates can be sent back to WeChat with `cc-connect send` (see `--help` for flags) and read on the phone.

## Prompt cache: where quota is wasted most easily

Claude's prompt cache lasts about 1 hour for subscribers within their plan limits, and about 5 minutes once over the limit. A WeChat conversation often stays open all day and grows to hundreds of thousands of tokens. If you speak again after more than an hour, the whole conversation is re-read at full price.

Measured: Claude set itself an 8:30 "morning report" reminder inside the long conversation. When it fired, it woke the overnight conversation and used about 20% of a 5-hour quota window in one go.

So:

- **Compact before you leave for long.** Before sleeping or a long outing, send `/compact` in WeChat. Even if the cache has expired by morning, far less has to be re-read. State lives in files, so nothing is lost.
- **Do not let Claude set overnight reminders or morning reports in the long conversation.** Ask yourself the next day. Put this in your global rules so it does not decide otherwise on its own.
- **Run scheduled jobs in a new session.** cc-connect scheduled tasks **reuse the existing session by default**, which wakes exactly that long conversation. Always add `--session-mode new-per-run` (for example `cc-connect cron add --cron "30 9 * * *" --prompt "…" --session-mode new-per-run`), or use the desktop app's scheduled tasks. Have them read the state files.
- **Do not send a keep-alive message every 55 minutes.** Each message also reads the whole conversation at cache price; about 9 of them over an 8-hour night add up to roughly one full re-read, so little is saved. Keeping it warm pays only if you know you will be back within an hour or two.
- **Talking within the hour keeps the cache alive**; nothing special is needed.
- In the same conversation, do not switch models, toggle fast mode, or add or remove connectors mid-way; each of these also invalidates the cache.

## Day to day

- Replies are read on a phone, so keep them short: put "read on a phone, plain words, result first" in your rules.
- Ask for progress as a topology diagram (see SKILL section 4) and send a screenshot back to WeChat; it reads better than a long message.
- Workers run on the computer as usual and do not use your Claude quota; Claude spends quota only on planning, acceptance and decisions.
- When the connector restarts, a message in flight can be lost. If nothing comes back within a few minutes, send it again or run `cc-connect daemon restart`.
