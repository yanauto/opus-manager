# 工单托管 · Ticket Dispatch

[English](README.md) · 中文

让 Claude 当经理，别让它当敲键盘的码农。

你只管跟 Claude 提需求。它把任务拆成独立的工单，派给你电脑上现成的便宜 AI 命令行工具（Cursor、Gemini、通过 pi 调 DeepSeek/GLM、Codex 等）在后台写代码。做完之后，Claude 自己重新跑一遍验收命令，再调另一个厂商的模型来挑错，挑出来的刺 Claude 还要逐条去翻代码核实，确认没问题才收工。

Claude 的额度全花在刀刃上：架构思考、拆单、跑验收、核对审查意见。出力的脏活累活交给便宜的按量付费模型。用作者自己的话说：20 美元的 Claude Pro，用出了 200 美元 Max 的感觉。

整个项目就只是一个 Claude Code 的 skill 文件夹：一份规则说明，加工单和回执两个模板。没有后台服务，没有常驻进程，不需要安装任何脚本。按设计 macOS、Linux、Windows 都能用，因为 Claude 在你电脑上用什么终端（bash、zsh 或 PowerShell），就用那个终端的命令。目前只在 macOS 上实测过。

## 为什么这么搞？

Claude（特别是 Opus）的架构拆解和问题判断能力极强，但如果让它一行行写样板代码、补业务逻辑，每周的额度很快就会耗尽。按量付费的便宜模型，同样的 token 便宜得多。

来自实际日常开发的真实数据：
- **全天托活只用 20% 周额度**：作者同事把整整一个工作日的开发任务全交给它，只消耗了 Claude Pro 当周额度的 20%；当天跑活的便宜模型总花费约 5~6 美元。一个人，一天。
- **超高吞吐成本极低**：在作者的一个工作项目里，一天内便宜模型（通过 pi 调 DeepSeek）调用了 3,617 次，消耗约 8.08 亿 tokens，总花费约 10 美元。
- **跨厂商代码审查真能挑出刺**：作者在自己 App 上的另一天：13 张工单，3 轮审查，挑出 36 个问题；Claude 逐条核实后，采纳并修好 35 个，驳回 1 个。

说句实话：便宜模型也是按量计费的，仍然要花一点钱。但 Claude 撞限额的次数会少得多，每一处改动也仍然由 Claude 把关。

## 它是怎么跑的

一旦你在项目里开启工单托管，Claude 会按这套流程走：

1. **写工单**：在 `_tickets/open/` 写好工单，定死修改边界（允许改哪些文件、不许碰哪些文件）和具体的验收命令。
2. **派给本地工人**：把工单挪到 `_tickets/doing/`，调用你配置好的 CLI 工具在后台施工。
3. **Claude 自己验收**：工人写完后在 `_receipts/` 提交回执。Claude 绝不盲信回执上的说法，而是亲自把验收测试重跑一遍，严格核对改动范围。
4. **换一家模型审查**：Claude 调另一个厂商的模型（只读模式）审查改动，专门查逻辑漏洞、数据误伤、安全隐患和边界情况。
5. **逐条核实审查意见**：审查模型也经常看走眼。Claude 会挨个打开对应的代码行核实；真的问题打进修复单派回去改，看错的问题写明理由直接驳回。

所有的工单、回执、运行日志都是纯 Markdown 文件，保存在项目根目录的 `_tickets/` 和 `_receipts/` 里，随时翻看。

## 第一次用：Claude 陪你配好

不用你手写配置文件。各个工人工具自己的登录或 API Key，还是照常需要。

第一次跟 Claude 说走工单时，它会主动摸清你的电脑：
- 自动扫描你装了哪些 AI 命令行工具（`cursor-agent`、`agy` / `gemini`、`codex`、`pi` 等）。
- 挨个跑 `--help`，弄清怎么无头运行、怎么传模型参数、怎么开启免确认改文件权限。
- 一次只问你一个问题：谁来施工、谁来审查、各用什么模型、哪些工具可以看你的代码、是否允许工人不经确认直接改代码。
- 跑一张微型练习单（花很少一点额度），确认链路真的通畅。
- 把结果存成项目里的 `_tickets/workers.md`，以后派活直接照着来。

涉及数据隐私、代码权限和是否允许直接动文件，Claude 绝不替你擅自做主。

## 需要什么

- [Claude Code](https://code.claude.com)（Pro 就够）
- 至少一个别的 AI 命令行工具，比如 Cursor 的 `cursor-agent`、Google 的 `agy` / `gemini`、`codex`、`pi` 等。装了哪些都行，第一次使用时 Claude 会自己去查。

## 安装

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

## 使用

在你的项目里打开 Claude Code，说：

> 走工单：给登录页加上「记住我」。

（说「托管」「派出去」「让别的模型做」也一样能触发。）

## 一个建议

放手让它托管。中途插话会让 Claude 停下来核实你说的话，反而浪费额度。有新决定再说，随口的想法先记着。

## 许可证

MIT
