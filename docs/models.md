# Model field notes

English · [中文](models.zh-CN.md)

Every row comes from real use on a small sample, so your mileage will differ. The manager (Claude) does not read the code; it judges by whether receipts are truthful, whether the findings from cross-vendor review hold up, whether boundaries were crossed, and whether things stayed stable after release. Add a row whenever you try a new model. Retired models are no longer listed.

The 2026-09-30 update comes from 10 work tickets in one real production project, plus 1 read-only review record (not counted as an additional work ticket). These are observations, not a controlled model comparison; channel samples and availability failures are counted separately below.

## Build

| Model | Vendor | Run with | Good for | Watch out for | Evidence |
|---|---|---|---|---|---|
| GPT-6.1 Sol (medium / high) | OpenAI | `pi` (Codex subscription) | New main worker for non-prompt work: device diagnostics, read-only workflow investigation and production pre-release checks; separates facts from inference, respects boundaries and stops when evidence contradicts the plan | After stopping, needs a follow-up instruction to continue; small sample, not a controlled comparison | 2026-09-30: 4 tickets |
| DeepSeek V4.1 Flash (high / max) | DeepSeek | `pi` (official API or the OpenCode Go plan) | Official API: website fixes found two root causes and reduced the initial page from 3.7 MB to 33 KB. Go: webpage restyling took 34 minutes, with clean styling and no scope creep. A separate read-only reassessment covered 45 records in 12 minutes and disclosed weak evidence | Go restyling did not catch content problems outside its scope; earlier work missed saved files or entry points, so keep cross-vendor review. Different tasks do not establish a channel quality difference | 2026-09-30: 1 official ticket, 1 Go ticket, 1 ticket with channel unspecified; earlier: dozens of tickets (09-23 to 09-29) |
| GPT-5.6 Sol (low–high) | OpenAI | `pi` (Codex subscription) | Backend and operations: stable diagnostics; investigated a systemic root cause before considering resends | Conservative: one prohibited historical-data change stopped the whole ticket, including unrelated rollback and PR cleanup. Earlier self-validation used too few samples and optimistic reporting; once merged another ticket's unfinished changes | 2026-09-30: 3 tickets; earlier: dozens (09-23 to 09-29) |
| Kimi K3 | Moonshot | `pi` (Kimi plan) | No completed run to assess on 09-30: the plan returned 403, temporarily blocking use | Availability failure only; no quality conclusion from this attempt | 2026-09-30: 1 recorded availability failure, 0 completed tickets |
| GPT-6 Astra (xhigh) | OpenAI | `pi` (Codex subscription) | Major refactors (splitting files that are thousands of lines long), reviewing other models' changes | Slow and expensive; a single thinking run can exceed 15 minutes, so the watchdog must not kill it for "being quiet" | About 6 tickets |
| Grok (4.6 / 4.7) | xAI | `cursor-agent` | Build: the author's main worker — it built 131 of the 227 tickets whose worker could be identified over 8 weeks | Not recorded (the README does not say) | The author's own app: 13 tickets, 3 review rounds (source: README "Field numbers") |

## Read-only review

| Model | Vendor | Run with | Track record | Watch out for | Evidence |
|---|---|---|---|---|---|
| GLM 5.3 Flash (high, with only read/grep/find/ls enabled) | Zhipu | `pi` | Main code reviewer: on 09-30, 0 high-, 1 medium- and 1 low-severity findings; both held up with code evidence, and it also listed verified non-issues. Earlier reviews caught high-severity problems | Occasionally looks at the wrong file and produces false positives; got the wrong answer on a small find-the-bug question; verify findings individually | 2026-09-30: 1 review; earlier: about 35 reviews |
| Gemini 3.1 Pro (high, read-only) | Google | `pi` (through the antigravity bridge) | On small find-the-bug questions it found the bug and gave the simplest fix; the steadiest in our tests | With several concurrent runs it wanders into another session (reviewing the wrong PR), so run only one at a time; only one run can go at a time, so when several tickets need review at once they queue and time out (on 09-29 two of them were skipped after more than 25 minutes); it occasionally rates severity too high | Smoke test + several reviews |
| Gemini 3.8 Flash (high, read-only) | Google | `pi` (through the antigravity bridge) | Thinks deeply and often catches what others miss | Very slow (3–15× DeepSeek on the same question) and fond of going in circles; public discussion reports the same; there is an hourly quota cap that even annual members hit (on 09-29 it reported the personal quota was used up, resetting after about 1 hour) | Smoke test + about 10 reviews |
| Gemini 3.8 Flash (read-only) | Google | `agy` | Handled read-only review on the author's own app | Not recorded (the README does not say) | The author's own app: 13 tickets, 3 review rounds, 36 findings, 35 accepted and 1 rejected (source: README "Field numbers") |

The same piece of code reviewed concurrently by three vendors: both Geminis found the root cause, GLM got it wrong (the same way DeepSeek did). So review work is best done by more than one vendor.

## Cross-model lessons

- **Use Gemini as a bonus reviewer, never as a required one.** Use GLM for the main review, and have GPT-6 Astra re-check important large changes; when several tickets need review at once, give Gemini to the most important one only.
- **Do not switch models inside one session.** On failure, just retry with the original model; to switch, open a new session and write down what has been done so far. Picking up another model's output after a switch visibly degrades the work.
- **OpenCode Go plan** ($10/month; DeepSeek V4.1 Flash gets a $60 monthly allowance, plus caps of $12 per 5 hours and $30 per week): unit prices are on par with the official API, so within the allowance it works out about 6× cheaper; in our tests it was about 2–2.5× slower than the official API (median about 8 s per call versus 3.5 s) and 20–40% slower again through a proxy, with no drop in quality that we could see.
- **Watchdog**: as long as the model is still connected (thinking) or the worker is running commands (has child processes), it is not stuck; judging only by "how long since the session was written" will kill long thinking and long tests by mistake.
- **GPT-6.1 Sol external reference (Artificial Analysis, checked 2026-09-30 in the source notes):** intelligence scores were 52 for 6.1 Sol, 47 for 5.6 Sol and 58 for Astra. API list prices per million input/output tokens were $2/$10 for 6.1 Sol versus $4/$20 for 5.6 Sol; Astra input was $10. Thus 6.1 Sol was half the price of 5.6 Sol, with input one fifth of Astra's—not one fifth across the board. Reported output speed was 69 versus 80 tokens/s for 5.6 Sol, so cheaper did not mean faster. API list prices are not direct savings on a subscription or proof of its quota accounting.
- Choosing a model: rely mainly on your own tests, with public leaderboards (such as SWE-bench Pro) as a secondary source; when the two disagree, trust your own tests.
