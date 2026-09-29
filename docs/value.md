# Value ledger

English · [中文](value.zh-CN.md)

Public leaderboards tell you which model is strong. Official pricing pages tell you what pay-per-use costs. What you actually spend is decided by three other things:

1. whether that model runs on pay-per-use, on a monthly plan, or on gifted quota;
2. how often it gets a ticket right the first time in this manager + worker flow, and how many rework rounds it needs;
3. how long one ticket takes from dispatch to result.

The same ticket can be free inside a plan, a few dollars on pay-per-use, and three times that if it needs three rounds. So the useful question is not "which model is cheap" but "which combination is cheapest **per accepted ticket**".

This ledger answers that continuously: one line per worker run, and a ranking at the end of the month that decides who works next month and whether a plan is worth renewing. **Review it monthly, swap models on evidence, not on feeling.**

## Data sources

The ledger holds only what you measured yourself. These are outside references; we borrow the data, not the code:

- **Model quality**: the [AIHOT leaderboard](https://github.com/KKKKhazix/AIHOT) (MIT; a consensus ranking over several public evaluations, method published in its `docs/leaderboard.md`) and [SWE-bench Pro](https://scale.com/leaderboard/swe_bench_pro_public). **Reference only**: when they disagree with your own runs, trust your runs.
- **Pay-per-use prices**: [models.dev](https://github.com/anomalyco/models.dev) (open model database; [api.json](https://models.dev/api.json) carries prices and context length), with the [LiteLLM price list](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) as a fallback.
- **Plan usage**: [ccusage](https://github.com/ryoppippi/ccusage) (Claude Code usage) and [CodexBar](https://github.com/steipete/CodexBar) (Codex / Claude limits).
- **Channel prices and quotas**: each vendor's own pages. Links and check dates live in `skill/<lang>/opus-manager/templates/plans.example.json`.

We looked for an existing project that scores plan value per real ticket (searched for coding plan comparison, subscription price comparison and similar). We found nothing; only a couple of one-off price comparisons that never measure results, rework or success rate. So this part we collect ourselves.

## Ledger format

After every worker run — build, review or fix — the manager appends one tab-separated line to `_receipts/ledger.tsv`:

| Column | What goes in it |
|---|---|
| date | `YYYY-MM-DD`, the day the run finished |
| ticket | ticket id only, no title |
| role | build / review / fix |
| tool | the CLI that actually ran (`pi`, `codex`, `cursor-agent`, `agy`, …) |
| model:tier | e.g. `deepseek-v4.1-flash:high`; the model alone if the tier is not recorded |
| channel | `metered`, `gifted`, or a channel from the plans file (`opencode-go`, `codex-plus`, …) |
| in | input tokens; `120K` is fine |
| cache | tokens read from cache |
| out | output tokens |
| minutes | dispatch to result, in minutes |
| cost | money actually paid per use; `0` for plan and gifted runs |
| result | `first-pass` / `rework 2` / `failed` / `missing` |
| findings | for a review run, how many findings survived verification; for a build run, how many were later confirmed against it |

Three rules:

- **No usage number, write `unknown`.** Some CLIs report nothing headless. Write unknown; never pad it, never estimate it from tokens.
- **One line per run.** The same ticket gets a line for build, one for review, one for fix. Never merge them.
- **`cost` only ever holds real money.** A plan run is 0 even though its list price is high; the script works the list price out separately.

Example, which is also the script's self-test data: [`scripts/value-ledger.example.tsv`](../scripts/value-ledger.example.tsv). Column names and results are accepted in English and Chinese (`施工` / `一次过` / `返工2轮` also work).

## Two ways to count

`scripts/value-report.py` prints both. Do not mix them:

- **Marginal cost (use it when dispatching)**: plan and gifted quota count as 0; only money actually paid counts. One purpose: **drain the plans and the free quota first**, fall back to pay-per-use after that. When the marginal cost ties, the run that eats the least tokens wins.
- **Amortized cost (use it at month end, to decide about renewals)**: the plan's monthly fee spread over the qualified runs it produced this month. A $10 plan that produced 24 qualified tickets costs $0.42 each. That answers "is this plan worth keeping", not "who should work now".

A ticket's real cost needs a few more numbers, so the ranking prints them together: qualified runs, first-pass rate, average rework rounds, confirmed findings, average minutes, and cost per qualified run.

## Monthly routine

1. Day to day, only record: one line per run, never backfill at month end.
2. At month end:

   ```bash
   python3 scripts/value-report.py _receipts/ledger.tsv --plans plans.json
   ```

   Add `--month 2026-09` for a single month, and `--fetch-prices` to pull list prices from models.dev and price the same tokens at pay-per-use rates (as a reference).

3. Three decisions follow from the two tables:
   - **Swap workers**: the model with the highest cost per qualified run is replaced or dropped a tier next month.
   - **Keep or drop a plan**: if its amortized cost is above the pay-per-use list price, drop it and pay per use; if the plan is used far more than it costs, keep it.
   - **Change the flow**: a model with a low first-pass rate either gets an extra review round or gets the exploratory tickets only.
4. Write the conclusion into the month's report under `_receipts/`, then check it again next month with the same method.

## Channel table

`skill/<lang>/opus-manager/templates/plans.example.json` holds monthly fees, quotas, rate limits, reset rules, source links and check dates for the usual channels. Copy it into your project and put in what you actually pay. Verified on **2026-09-29**:

| Channel | Monthly fee | Quota | Rate limit / reset | Source |
|---|---|---|---|---|
| OpenCode Go | $10 (Go Plus $40) | per model: DeepSeek V4.1 Flash gets $60 of usage a month | 5 hours = 20% of the monthly limit, weekly = 50%: $12 per 5 hours, $30 per week, rolling windows | [opencode.ai/go](https://opencode.ai/go) · [docs](https://opencode.ai/docs/go/) |
| DeepSeek official API | pay per use | none | off-peak is half price; peak is 01:00-04:00 and 06:00-10:00 UTC, Monday to Friday | [pricing](https://api-docs.deepseek.com/quick_start/pricing) |
| ChatGPT subscription with Codex | Free $0 / Go $8 / Plus $20 / Pro from $100 / Business $25 per user per month | shared by Codex and ChatGPT Work; local messages and cloud chats draw on the same allowance, weekly limits may also apply | rolling 5-hour window, current reset time on the usage dashboard; after the limit, buy credits or run with an API key at API rates | [pricing](https://developers.openai.com/codex/pricing) |
| Zhipu GLM Coding Plan | from $18 Lite (Pro / Max fee tbd) | credits per 5 hours and per week: Lite 2,000 / 10,000, Pro 12,000 / 60,000, Max 28,000 / 140,000 | 5-hour credits refresh 5 hours after use; weekly credits every 7 days; peak is 14:00-18:00 UTC+8, Monday to Friday | [overview](https://docs.z.ai/devpack/overview) · [FAQ](https://docs.z.ai/devpack/faq) |
| Google AI plan with Gemini | Google AI Pro $19.99 (Ultra $99.99) | higher Gemini access than the free tier; no published token number | tier-based, rolling; no published numbers | [official page](https://one.google.com/about/google-ai-plans/) |

What we could not verify says `tbd`; nothing is invented. Prices move: after re-checking, set `checked` to that day and keep the links.

## Our numbers

> Aggregated per model only — no ticket names, no project names. From two days of real runs on the author's machine, 2026-09-28 to 09-29. **Small sample: two days is not a month.** Read the direction, not the decimals.

### Build (2 days)

| Model (tool) | Channel | Tickets | Calls | Tokens | List price (estimate) | Paid cash | Median ticket time | Finished | First pass | Reworked |
|---|---|---|---|---|---|---|---|---|---|---|
| DeepSeek V4.1 Flash (`pi`) | OpenCode Go plan | 17 | 2,100 | 455M | ~$2.97 | 0 | 83 min | 7 | 3 | 4 |
| GPT-5.6 Sol (`pi`) | Codex plan | 18 | 2,683 | 383M | ~$199.54 | 0 | 82 min | 11 | 5 | 6 |
| GPT-6 Astra (`pi`) | Codex plan | 2 | 282 | 42M | ~$65.49 | 0 | 85 min | 1 | 0 | 1 |
| DeepSeek Flash (`pi`) | official API, pay per use | 1 | 17 | 6.0M | ~$0.15 | ¥0.51 | 127 min | 1 | 0 | 1 |

"Finished" is lower than "tickets" because some tickets were still running. **First pass = accepted with no rework round; reworked = at least one fix ticket was dispatched.**

### Review (2 days)

| Model (tool) | Channel | Review rounds | Calls | Tokens | Findings claimed (counted in the reports) | Confirmed (recorded in fix reports) |
|---|---|---|---|---|---|---|
| GLM 5.3 Flash (`pi`) | GLM Coding Plan | 23 | 391 | 19.5M | 2 | 20 |
| Gemini 3.1 Pro (`pi`) | Google AI plan (a few rounds ran on the Codex plan) | 22 | 263 | 13.4M | 21 | 9 |
| Gemini 3.8 Flash (`pi`) | Google AI plan (a few rounds ran on the Codex plan) | 25 | 1,007 | 94.1M | 31 | 18 |

"Findings claimed" counts only the ones marked with a severity in the report; "confirmed" counts only the fix reports that stated a number. The two columns are counted differently and **both are undercounts**; do not read them as exact.

### Two-day totals

- 6,743 calls, about 1.01 billion tokens.
- Priced at models.dev pay-per-use rates: about **$274.62 (estimate)**. Cash actually spent: **¥0.51**. The rest sat inside three plan / gifted channels — which is why the number to watch is cost per qualified ticket, not the list price.
- Within the same batch of work, GPT-5.6 Sol carried about $270 of that list price; DeepSeek V4.1 Flash carried about $3.

### Cost per qualified run (list price, estimate)

Using $1 ≈ ¥7.1 and the monthly fees above. **With only two days of sample, read the right column as a break-even line:**

| Combination | List price per qualified run | Break-even (monthly fee ÷ per run) |
|---|---|---|
| GLM 5.3 Flash + GLM Coding Plan ($18/month, review only) | ~$0.05 per round | about 400 rounds a month |
| DeepSeek V4.1 Flash + OpenCode Go ($10/month) | ~$0.42 per ticket | about 24 tickets a month |
| GPT-5.6 Sol + Codex plan ($20/month assumed) | ~$18.14 per ticket | about 2 tickets a month |

Read it like this: **the Codex plan pays for itself after 2 tickets a month, DeepSeek on OpenCode Go needs 24, and GLM used for review alone needs 400 rounds.** That last number says the plan's value depends on what you point it at: the same plan used for building would break far earlier.

### A longer run of runs (from 2026-09-23, 7 days)

The local task status table shows 484 worker runs in 7 days (runs, not tickets): 438 ended normally (91%), 24 errored, 22 were killed on a timeout. Runs by model: DeepSeek Flash 165, GPT-5.6 Sol 94, GLM 5.3 Flash 82, GPT-6 Sol 43, DeepSeek V4.1 Flash 23, Gemini 3.8 Flash 23, Gemini 3.1 Pro 21, GPT-6 Astra 16, MiMo V2.6 Pro 11, GPT-5.6 Luna 6.

Those days have no pay-per-use detail (only one tool reported usage), so **tokens and money are only available for the two days above**. For the earlier days we have runs and pass/fail only; treat that as an estimate.

## What is still rough

- **Sample too small**: two days, 30 tickets. Wait for a full month before swapping models.
- **Plan cost is not net**: when several plans run at once, telling which run spent which quota is hard. Right now only list price and the break-even line approximate it.
- **Caching inflates token counts**: re-reading the same context hits cache at roughly 1/50 of the input price, so "many tokens" does not mean "expensive". The script prices input, cache and output separately; do not read the total alone.
- **Models do not land the same quality**: DeepSeek is cheap but sloppy at the finish; GPT-5.6 Sol is expensive but gets more right the first time. The ledger counts money and rework, not "can it do this job at all".
- **Two `tbd`s**: OpenAI does not record which ChatGPT tier was used, and Google AI does not record which tier or whether the models run inside the plan or through an API key. Fill those in once you check them.

## How to run it

```bash
python3 scripts/value-report.py --selftest                                # self-test, needs no data
python3 scripts/value-report.py _receipts/ledger.tsv --plans plans.json   # the two rankings
```

Standard library only; nothing to install.
