# 性价比账本

中文 · [English](value.md)

公开榜单只告诉你「哪个模型强」，官方价格页只告诉你「按量多少钱」。但你实际花出去的钱，是这三件事决定的：

1. 这个模型你是按量付、走包月套餐，还是吃赠送额度；
2. 它在经理 + 工人这套流程里，一次做对的比例有多高，返工几轮；
3. 一张单从头到尾跑了多久。

同一张工单，走包月套餐里可能是 0 元，按量可能是几块，返工三次就是三倍。所以别问「哪个模型便宜」，要问「哪套组合做出一张**合格工单**最便宜」。

这个账本就是为了持续回答这个问题：每个工人每跑完一单记一行，月底照着排行决定下一轮用谁、续不续套餐。**每月复盘一次，用真实数据换人，不靠感觉。**

## 数据来源

账本里只记自己跑出来的数。下面这些是外部参考，只借数据，不复制对方的代码：

- **模型质量**：[AIHOT 模型榜](https://github.com/KKKKhazix/AIHOT)（MIT，汇总多家公开评测的共识排名，方法公开，见它的 `docs/leaderboard.md`）、[SWE-bench Pro](https://scale.com/leaderboard/swe_bench_pro_public)。**只作参考**：和我们自己的实测冲突时，听实测的。
- **按量价格**：[models.dev](https://github.com/anomalyco/models.dev)（开源模型数据库，[api.json](https://models.dev/api.json) 里有价格和上下文长度），[LiteLLM 的价格表](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 作备用。
- **套餐用量**：[ccusage](https://github.com/ryoppippi/ccusage)（Claude Code 用量）、[CodexBar](https://github.com/steipete/CodexBar)（Codex / Claude 用量上限）。
- **渠道价格与额度**：各家官方页面，链接和核对日期写在 `skill/<语言>/opus-manager/templates/plans.example.json` 里。

GitHub 上没找到「按真实工单算套餐划算度」的项目（搜过 coding plan comparison、subscription price comparison 这些词），只找到两篇零星的单次横评，都是比价不比结果，也没有返工和合格率。所以这一块我们自己攒。

## 账本格式

每个工人每跑完一单（施工、审查、修复都算），经理在 `_receipts/ledger.tsv` 追加一行，制表符分隔：

| 列 | 写什么 |
|---|---|
| 日期 | `YYYY-MM-DD`，用单子完成那天 |
| 工单 | 工单编号，不带标题 |
| 角色 | 施工 / 审查 / 修复 |
| 工具 | 实际跑的 CLI（`pi`、`codex`、`cursor-agent`、`agy`…） |
| 模型:档位 | 例如 `deepseek-v4.1-flash:high`；档位没记就只写模型 |
| 渠道 | `按量`、`赠送`，或套餐表里的 channel（如 `opencode-go`、`codex-plus`） |
| 输入 | 输入 token，可写 `120K` |
| 缓存命中 | 缓存读到的 token |
| 输出 | 输出 token |
| 耗时分钟 | 这一单从派出去到出结果，分钟数 |
| 按量花费 | 本币金额。套餐和赠送写 `0`，按量写实付 |
| 结果 | `一次过` / `返工2轮` / `失败` / `没交` |
| 审查成立条数 | 审查单填核实成立的条数，施工单填这单后来被查出几条 |

三条硬规矩：

- **token 取不到就写「未知」。** 有的 CLI 无头模式下不报用量，写未知，不许拿别的数凑，也不许按 token 数估。
- **一行一次运行。** 同一张单施工、审查、修复各记一行，别合并。
- **按量花费只有真掏钱的才写数。** 套餐里跑的是 0，哪怕它的标价很贵——标价由脚本另外算。

示例（也是脚本的自测数据）：[`scripts/value-ledger.example.tsv`](../scripts/value-ledger.example.tsv)。列名和结果同时认中英文（`build` / `first-pass` / `rework 2` 都行）。

## 两种算法

`scripts/value-report.py` 两种都出，别混着看：

- **边际成本（日常派单看这个）**：额度内的套餐和赠送记 0，只算真金白银。用途就一句话——**先把包月和赠送的额度用干净**，用完再考虑按量。同样的边际成本时，比每单吃掉的 token：吃得少的先派。
- **摊销成本（月底复盘、决定续不续看这个）**：套餐月费按本月实际产出的合格单数摊到每单。月费 $10、这个月出了 24 张合格单，那每张就是 $0.42。它回答的是「这个套餐值不值」，不是「现在该派谁」。

一张单的真实成本还要看另外几个数，排行里一并给：合格工单数、一次过率、平均返工轮数、审查成立条数、平均耗时、每张合格工单成本。

## 每月怎么出排行

1. 平时只要记：每单一行，别攒到月底补。
2. 月底跑一遍：

   ```bash
   python3 scripts/value-report.py _receipts/ledger.tsv --plans plans.json
   ```

   加 `--month 2026-09` 只看某个月，加 `--fetch-prices` 会去 models.dev 拉一份按量价，把同样的 token 按标价折一遍（当参考）。

3. 对着两张表做三个决定：
   - **换人**：每张合格单最贵的那个模型，下个月换掉或降档。
   - **续套餐**：套餐的摊销成本高于按量标价，就退掉改按量；反过来（用得比月费值）就留下。
   - **改流程**：一次过率低的模型，要么加一轮审查，要么只用来做探索类的活。
4. 把结论写进 `_receipts/` 里的月度报告，下个月用同样的算法复核一次。

## 渠道表

`skill/<语言>/opus-manager/templates/plans.example.json` 里有常见渠道的月费、额度、限速、重置周期、来源链接和核对日期。复制到项目里改成你自己付的钱。核实到 **2026-09-29** 的情况：

| 渠道 | 月费 | 额度 | 限速 / 重置 | 来源 |
|---|---|---|---|---|
| OpenCode Go | $10（Go Plus $40） | 按模型给：DeepSeek V4.1 Flash 每月 $60 用量 | 5 小时 = 月额度的 20%、每周 = 50%；即每 5 小时 $12、每周 $30，滚动窗口 | [opencode.ai/go](https://opencode.ai/go) · [docs](https://opencode.ai/docs/go/) |
| DeepSeek 官方按量 | 按量 | 无 | 低谷价是峰价的一半；高峰为 UTC 周一至周五 01:00-04:00 与 06:00-10:00 | [官方价目](https://api-docs.deepseek.com/quick_start/pricing) |
| ChatGPT 订阅里的 Codex | Free $0 / Go $8 / Plus $20 / Pro $100 起 / Business 每人每月 $25 | Codex 与 ChatGPT Work 共用；本地消息和云端会话同一份额度，另有每周上限 | 5 小时滚动窗口，重置时间看用量面板；到顶可买额度或改用 API key 按 API 价 | [官方价目](https://developers.openai.com/codex/pricing) |
| 智谱 GLM Coding Plan | Lite $18 起（Pro / Max 价格待核） | 5 小时 + 每周 credit：Lite 2,000 / 10,000，Pro 12,000 / 60,000，Max 28,000 / 140,000 | 5 小时额度用掉后 5 小时刷新，每周额度每 7 天重置；高峰为 UTC+8 周一至周五 14:00-18:00 | [概览](https://docs.z.ai/devpack/overview) · [FAQ](https://docs.z.ai/devpack/faq) |
| Google AI 会员里的 Gemini | Google AI Pro $19.99（Ultra $99.99） | 比免费档更高的 Gemini 访问量，官方没给 token 数 | 按档位滚动重置，官方没给具体数字 | [官方页面](https://one.google.com/about/google-ai-plans/) |

查不到的写「待核」，不编。价格会变：核对完把 `checked` 改成当天，链接留好，下次照着核。

## 我们的数字

> 只放按模型汇总的数，不放工单名和项目名。样本是作者本机 2026-09-28 至 09-29 两天的真实运行；**样本小，两天不等于一个月**，看趋势不看小数点。

### 施工（2 天）

| 模型（工具） | 渠道 | 工单 | 调用 | 总 token | 按量标价（估算） | 实付按量 | 工单中位耗时 | 完成 | 一次过 | 返工 |
|---|---|---|---|---|---|---|---|---|---|---|
| DeepSeek V4.1 Flash（`pi`） | OpenCode Go 套餐 | 17 | 2,100 | 4.55 亿 | ~$2.97 | 0 | 83 分 | 7 | 3 | 4 |
| GPT-5.6 Sol（`pi`） | Codex 套餐 | 18 | 2,683 | 3.83 亿 | ~$199.54 | 0 | 82 分 | 11 | 5 | 6 |
| GPT-6 Astra（`pi`） | Codex 套餐 | 2 | 282 | 0.42 亿 | ~$65.49 | 0 | 85 分 | 1 | 0 | 1 |
| DeepSeek Flash（`pi`） | 官方按量 | 1 | 17 | 603 万 | ~$0.15 | ¥0.51 | 127 分 | 1 | 0 | 1 |

「完成」小于「工单」是因为还有单子在跑。**一次过 = 没有返工轮就直接验收通过；返工 = 至少派过一次修复单。**

### 审查（2 天）

| 模型（工具） | 渠道 | 审查轮 | 调用 | 总 token | 提出条数（报告里数的） | 核实成立（修复回报里记录的） |
|---|---|---|---|---|---|---|
| GLM 5.3 Flash（`pi`） | GLM Coding Plan | 23 | 391 | 1,952 万 | 2 | 20 |
| Gemini 3.1 Pro（`pi`） | Google AI 会员（少量轮次走了 Codex 套餐） | 22 | 263 | 1,338 万 | 21 | 9 |
| Gemini 3.8 Flash（`pi`） | Google AI 会员（少量轮次走了 Codex 套餐） | 25 | 1,007 | 9,408 万 | 31 | 18 |

「提出条数」只数了报告里带严重程度标注的，「核实成立」只数了修复回报里明确写了条数的，两列口径不同，**都是偏低的估算**，别当准确值。

### 两天合计

- 6,743 次调用，约 10.1 亿 token。
- 按 models.dev 的按量价折下来约 **$274.62（估算）**；实际现金支出 **¥0.51**。差额全部落在三个包月/赠送渠道里——这就是为什么要算「每张合格工单成本」，而不是看标价。
- 同一批活里，GPT-5.6 Sol 吃掉约 $270 的标价，DeepSeek V4.1 Flash 只吃掉约 $3。

### 每张合格工单成本（按标价算，估算）

这张表用 $1 ≈ ¥7.1、套餐月费取上表的数，**样本只有两天，摊销数先当作「回本线」看**：

| 组合 | 每张合格单标价 | 套餐回本线（月费 ÷ 每单标价） |
|---|---|---|
| GLM 5.3 Flash + GLM Coding Plan（$18/月，只做审查） | ~$0.05 / 轮 | 每月约 400 轮 |
| DeepSeek V4.1 Flash + OpenCode Go（$10/月） | ~$0.42 / 张 | 每月约 24 张 |
| GPT-5.6 Sol + Codex 套餐（月费按 $20 算） | ~$18.14 / 张 | 每月约 2 张 |

读法：**Codex 套餐只要一个月能出 2 张单就回本，DeepSeek 走 OpenCode Go 要出 24 张，GLM 只拿来做审查则要 400 轮。** GLM 那个数说明「套餐值不值」取决于你拿它做什么：同一份套餐用来施工，回本线会低得多。

### 更长的运行记录（2026-09-23 起，7 天）

本机的任务状态表里，7 天一共 484 次工人运行（不是工单数）：438 次正常结束（91%）、24 次报错、22 次超时被杀。按模型看运行次数：DeepSeek Flash 165、GPT-5.6 Sol 94、GLM 5.3 Flash 82、GPT-6 Sol 43、DeepSeek V4.1 Flash 23、Gemini 3.8 Flash 23、Gemini 3.1 Pro 21、GPT-6 Astra 16、MiMo V2.6 Pro 11、GPT-5.6 Luna 6。

这几天里没有按量明细（只有一个工具报用量），所以**按模型的总 token 和花费只有上面两天那一段**，更早的只能看运行次数和成败，标「估算」。

## 还不靠谱的地方

- **样本太小**：两天、30 张单。至少攒满一个月再说换人。
- **套餐净成本没算**：一个人同时在用几个套餐，很难分清哪张单用了哪份额度。现在只能用「标价」和「回本线」近似。
- **缓存放大了 token 数**：同一个上下文反复读，缓存命中价只有输入价的 1/50 左右，所以「总 token 大」不等于「贵」。脚本按输入/缓存/输出分开算，别只看总数。
- **不同模型的落地质量不一样**：DeepSeek 便宜但收尾毛糙，GPT-5.6 Sol 贵但一次过率高。账本只算钱和返工，不算「这活它能干不能干」。
- **`待核` 的两处**：OpenAI 那边没记用的是哪一档 ChatGPT；Google AI 没记哪一档会员、模型是走会员额度还是 API key。核完填进你的 plans.json。

## 怎么跑

```bash
python3 scripts/value-report.py --selftest                                   # 自测，不需要任何数据
python3 scripts/value-report.py _receipts/ledger.tsv --plans plans.json     # 出两张排行
```

只用 Python 标准库，不用装东西。
