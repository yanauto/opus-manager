# 配音稿 / Voiceover

画面总长 62 秒。每段配音尽量落在对应的时间段里，语速正常就行，稍微快一点也没关系，画面可以再跟着配音调。
The video is 62 s. Keep each line inside its time window; the animation can be retimed to the recording afterwards.

| 时间 | 画面 | 中文 | English |
|---|---|---|---|
| 0.0–6.6 | 三家公司的 AI | 我让三家公司的 AI 一起写代码：Claude 调度，Grok 施工，Gemini 审查。 | I get three AI labs to write code together: Claude runs the show, Grok builds, Gemini reviews. |
| 6.6–13.8 | 自己审自己 | 一个 AI 自己写、自己审，它会说测试全过了，可测试里一句断言都没有。 | Let one AI grade its own work and it tells you all tests pass, even when the test checks nothing. |
| 13.8–22.0 | ① 写工单 | 所以 Opus 只写工单：目标、边界、用哪条命令验收，写清楚，放进 open 文件夹。 | So Opus only writes tickets: the goal, the scope, and the exact commands that decide if it's done. |
| 22.0–30.0 | ② 上锁派单 | 派单脚本把它挪进 doing，挪进去就等于上了锁，Grok 在后台开工。 | The dispatch script moves it into doing. That move is the lock. Grok starts working in the background. |
| 30.0–38.0 | ③ 重跑验收 | 干完交回执。回执只是它的说法，Opus 会把验收命令自己再跑一遍，对得上才算数。 | It hands back a receipt. A receipt is just a claim, so Opus reruns every check itself. |
| 38.0–48.2 | ④ 换家审查 | 然后换一家公司，让 Gemini 来挑错。Opus 逐条核实，成立的打包成新工单派回去修，不成立的写明理由。 | Then a different lab, Gemini, hunts for bugs. Opus verifies each finding: real ones go back as a new ticket, wrong ones get a reason. |
| 48.2–55.8 | 真实数字 | 这是我真实的一天：13 张工单，3 轮审查，36 条意见，修好 35 条。只用 bash 和 git。 | One real day: 13 tickets, 3 review rounds, 36 findings, 35 fixed. Just bash and git. |
| 55.8–62.0 | 仓库 | 一份说明，两行命令，装进你的项目。仓库在这里。 | One skill file, two commands, and it's in your project. Here's the repo. |

## 数字出处 / Where the numbers come from

2026-09-23 09:59–20:27，Vitals 的 VH 系列工单：13 张工单；agy（Gemini 3.8 Flash）审查 3 轮，提出 36 条意见，采纳并修好 35 条，否掉 1 条（N+1 查询，项目只有几十个，没有可感知影响）。
