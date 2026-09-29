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
- **Performance / price frontier (the cut line)**: [Artificial Analysis](https://artificialanalysis.ai/)'s intelligence × cost frontier, used for one rough filter only; see [First filter](#first-filter-the-cut-line-performance--price-frontier) below.

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

## First filter: the cut line (performance / price frontier)

The line Chinese-language circles call the "cut line" (斩杀线) is the **Pareto line** on [Artificial Analysis](https://artificialanalysis.ai/)'s homepage chart of intelligence against cost per benchmark task: every model on the line is the smartest at its price or the cheapest at its score, and models inside the line are beaten on both axes at once. Their evaluation method is on the [methodology page](https://artificialanalysis.ai/methodology).

**How to use it**: filter first with that line, and only pick models on it or right next to it; then rank those with this ledger by the cost per qualified ticket your own tickets measured. When the two disagree, trust your own numbers — the cut line uses someone else's benchmark set and official list prices, and knows nothing about your ticket mix or your plan discounts.

**Three limits**:

- it prices everything at **official pay-per-use rates**, with no plans, gifted quota or discounts — exactly the gap this ledger fills;
- the score comes from their own evaluation set, which is not your ticket mix;
- cost per task also depends on how chatty a model is, so verbose models look worse on that chart than they are.

**Rules for getting the data**: Artificial Analysis has a free API (register for a key, 1,000 requests a day, attribution required, they advise caching and say not to put keys in client-side code). Their [terms of use](https://artificialanalysis.ai/terms-of-use) grant a personal, noncommercial licence only; they forbid scraping the site and forbid building a similar or competing product from their data or republishing it, and any of that needs written consent first. So, in this repository:

- **no Artificial Analysis data is stored here**, and nothing scrapes their pages;
- the script offers one **optional switch**: `--aa-key` (or the `ARTIFICIAL_ANALYSIS_API_KEY` environment variable). It uses your own key for a single call, keeps a local snapshot (next to the ledger by default, reused for 24 hours), computes the frontier, and marks every model in your ledger as on the frontier / near it / inside it. Without a key it skips that and the rest of the report runs as usual;
- the self-test **never touches the network**; the frontier logic is tested against built-in fake data.

One caveat about the free API: it gives a price per million tokens and an intelligence score, while the homepage chart's x-axis, cost per task, is that price folded through a fixed token-per-task assumption. The script computes intelligence against the blended price per million tokens — the same idea, a proxy, not the chart's original value.

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

### Review

**Usage (from the usage table, 2026-09-28 to 09-29)**

| Model (tool) | Channel | Review rounds with detail | Calls | Tokens |
|---|---|---|---|---|
| GLM 5.3 Flash (`pi`) | GLM Coding Plan | 23 | 391 | 19.5M |
| Gemini 3.1 Pro (`pi`) | Google AI plan (a few rounds ran on the Codex plan) | 22 | 263 | 13.4M |
| Gemini 3.8 Flash (`pi`) | Google AI plan (a few rounds ran on the Codex plan) | 25 | 1,007 | 94.1M |

**Review quality (from the fix-stage verification table, the same batch of rounds, one counting rule)**

| Reviewer (model it ran on) | Rounds with a verification record | Findings claimed | Confirmed | Confirmed rate |
|---|---|---|---|---|
| `review` (GLM 5.3 Flash) | 13 | 54 | 43 | 80% |
| `review-gem8` (Gemini 3.8 Flash) | 12 | 39 | 32 | 82% |
| `review-gem` (Gemini 3.1 Pro) | 13 | 20 | 16 | 80% |
| One round standing in (GPT-5.6 Sol) | 1 | 2 | 2 | — |
| One ticket not split per reviewer | — | 14 | 12 | — |
| **Total** | **39** | **129** | **105** | **81%** |

These two tables come from two different records: the top one is usage the tools reported, the bottom one is the item-by-item verdicts in the fix reports. Some review reports never marked severity, so counting the findings written in the reports does not line up with the verification table — no number is taken from those reports any more. **Both columns now come from the verification table only**; tickets without an item-by-item verification are not counted, and a round that ran but claimed nothing counts as zero findings but still counts as a round.

### Two-day totals

- 6,743 calls, about 1.01 billion tokens.
- Priced at models.dev pay-per-use rates: about **$274.62 (estimate)**. Cash actually spent: **¥0.51**. The rest sat inside three plan / gifted channels — which is why the number to watch is cost per qualified ticket, not the list price.
- Within the same batch of work, GPT-5.6 Sol carried about $270 of that list price; DeepSeek V4.1 Flash carried about $3.

### What one month of quota buys, and the cost per ticket

On a monthly plan the quota is what runs out first, not the money. So read two numbers together: (1) roughly how many qualified tickets one month of quota buys, from what we actually consumed, and (2) amortized cost = monthly fee ÷ that number.

| Combination | Quota | Qualified tickets per month of quota | Monthly fee | Amortized cost |
|---|---|---|---|---|
| DeepSeek V4.1 Flash + OpenCode Go | $60 of usage a month for this model | about 143 ($60 ÷ the measured $0.42 per ticket) | $10/month | about $0.07 each |
| GPT-5.6 Sol + Codex plan (Plus assumed) | weekly quota. Measured: at this intensity two days took the weekly quota down to 5% left | about 50 (11 qualified tickets in two days → about 11.6 per week of quota → about 50 a month) | **tbd** ($20/month on Plus) | about $0.40 each |
| GPT-5.6 Sol + Codex plan (Pro assumed) | OpenAI says Pro carries 5x or 20x the Plus limits | 5x ≈ 250; 20x ≈ 1,000 | **tbd** (from $100/month; we could not verify what 5x and 20x cost) | about $0.40 each at 5x; the 20x fee is unverified, and scaling both sides keeps it in the same range |
| GLM 5.3 Flash + GLM Coding Plan | credits | tbd: turning credits into tickets needs input, cache and output counted separately, and the ledger still holds only a total | $18/month | tbd |
| Gemini + Google AI plan | no published quota number | tbd | $19.99/month | tbd |

The Codex row deserves a flag: **we do not know which ChatGPT tier was used**, so the fee says tbd and both assumptions (Plus, Pro) are listed. Either way, the ~50 tickets a month figure is the Plus order of magnitude; a higher tier buys proportionally more.

### A longer run of runs (from 2026-09-23, 7 days)

The local task status table shows 484 worker runs in 7 days (runs, not tickets): 438 ended normally (91%), 24 errored, 22 were killed on a timeout. **Models still in use**: DeepSeek V4.1 Flash 188 (165 through the official API, recorded as `deepseek-flash`, plus 23 on OpenCode Go — the same model), GPT-5.6 Sol 94, GLM 5.3 Flash 82, Gemini 3.8 Flash 23, Gemini 3.1 Pro 21, GPT-6 Astra 16. **Retired models account for the remaining 60 runs.**

Those days have no pay-per-use detail (only one tool reported usage), so **tokens and money are only available for the two days above**. For the earlier days we have runs and pass/fail only; treat that as an estimate.

## What is still rough

- **Sample too small**: two days, 30 tickets. Wait for a full month before swapping models.
- **Plan cost is not net**: when several plans run at once, telling which run spent which quota is hard. Right now only list price and the break-even line approximate it.
- **Caching inflates token counts**: re-reading the same context hits cache at roughly 1/50 of the input price, so "many tokens" does not mean "expensive". The script prices input, cache and output separately; do not read the total alone.
- **Models do not land the same quality**: DeepSeek is cheap but sloppy at the finish; GPT-5.6 Sol is expensive but gets more right the first time. The ledger counts money and rework, not "can it do this job at all".
- **The `tbd`s**: OpenAI does not record which ChatGPT tier was used; Google AI does not record which tier or whether the models run inside the plan or through an API key; GLM's credits cannot be turned into a ticket count yet. Fill those in once you check them.

## How to run it

```bash
python3 scripts/value-report.py --selftest                                # self-test, offline
python3 scripts/value-report.py _receipts/ledger.tsv --plans plans.json   # the two rankings
python3 scripts/value-report.py _receipts/ledger.tsv --plans plans.json \
    --aa-key "$ARTIFICIAL_ANALYSIS_API_KEY"                                # optional: the first filter
```

Standard library only; nothing to install. The Artificial Analysis switch is off by default, skips silently without a key, and never runs in the self-test.
