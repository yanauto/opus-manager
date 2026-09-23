# 工单托管 · Ticket Dispatch

[中文](#中文) · [English](#english)

---

## 中文

让 Claude 当经理，不当码农：你只跟 Claude 说要什么，它把活拆成工单，派给你电脑上其他更便宜的 AI 命令行工具去做（比如 Cursor、Gemini、DeepSeek），做完它自己验收，再换一家模型来挑错。

Claude 的额度只花在判断上，出力的活交给便宜模型。

整个东西就是一个 skill 文件夹：一份说明，加工单和回执两个模板。不需要服务器，也不需要装别的程序。

### 需要什么

- [Claude Code](https://code.claude.com)（Pro 就够）
- 至少一个别的 AI 命令行工具，比如 Cursor 的 `cursor-agent`、Google 的 `agy` / `gemini`、`codex`、`pi` 等。装了哪些都行，第一次使用时 Claude 会自己去查。

### 安装

最省事的办法：打开 Claude Code，对它说：

> 帮我把 https://github.com/yanauto/ticket-oss 里的 `skill/zh/ticket-dispatch` 装成我的个人 skill。

也可以自己动手：

**Mac / Linux**

```bash
git clone https://github.com/yanauto/ticket-oss.git
mkdir -p ~/.claude/skills
cp -R ticket-oss/skill/zh/ticket-dispatch ~/.claude/skills/
```

**Windows（PowerShell）**

```powershell
git clone https://github.com/yanauto/ticket-oss.git
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills" | Out-Null
Copy-Item -Recurse ticket-oss\skill\zh\ticket-dispatch "$env:USERPROFILE\.claude\skills\"
```

没装 git 的话，在 GitHub 页面点 Code → Download ZIP，解压后把 `skill/zh/ticket-dispatch` 这个文件夹复制到上面的位置。

装好后重新打开 Claude Code。

### 使用

在你的项目里打开 Claude Code，说：

> 走工单：给登录页加上「记住我」。

**第一次用**，Claude 会先查一遍你电脑上有哪些 AI 工具、各自怎么调用，然后一件一件问你：谁来写代码、谁来审查、用什么模型、哪些工具可以看你的代码。都由你来定。定好后它会试跑一次，把结果记在项目里的 `_tickets/workers.md`，以后就照着它派活。

之后的每一张单：

1. Claude 写工单：要做什么、能动哪些文件、用哪条命令验收。
2. 派给你选的工人，在后台做。
3. 工人交回执，Claude 自己把验收命令重跑一遍。
4. 换一家模型审查，Claude 逐条核实，成立的再派回去修。

所有记录都在项目里的 `_tickets/` 和 `_receipts/` 两个文件夹，随时可以翻看。

### 一个建议

放手让它托管。中途插话会让 Claude 停下来核实你说的话，反而浪费额度。有新决定再说，随口的想法先记着。

---

## English

Make Claude the manager, not the coder. You tell Claude what you want; it turns the work into tickets, hands them to cheaper AI command-line tools on your machine (Cursor, Gemini, DeepSeek, …), accepts the result by rerunning the checks itself, and has a model from a different vendor hunt for bugs.

Claude's quota goes to judgment. The labor goes to cheaper models.

The whole thing is one skill folder: instructions plus a ticket template and a receipt template. No server, nothing else to install.

### Requirements

- [Claude Code](https://code.claude.com) (Pro is enough)
- At least one other AI command-line tool: `cursor-agent`, `agy` / `gemini`, `codex`, `pi`, … Whatever you have; Claude checks on first use.

### Install

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

### Use

In your project, tell Claude Code:

> Use tickets: add remember-me to the login page.

**On first use**, Claude looks at which AI tools you have and how to call them, then asks you, one question at a time: who builds, who reviews, which models, which tools may see your code. You decide. It does a trial run and writes the result to `_tickets/workers.md` in your project.

Every ticket after that:

1. Claude writes the ticket: what to do, which files may change, which commands decide it is done.
2. It hands the ticket to your chosen worker, which runs in the background.
3. The worker hands back a receipt; Claude reruns the checks itself.
4. A model from another vendor reviews the change; Claude verifies each finding and sends the real ones back as a fix ticket.

Everything is recorded in `_tickets/` and `_receipts/` in your project.

### One tip

Let it run. Cutting in makes Claude stop and verify what you said, which burns quota. Speak up for real decisions; park passing thoughts.

## License

MIT
