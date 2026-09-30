# Model field notes

English · [中文](models.zh-CN.md)

Every row comes from real use on a small sample, so your mileage will differ. The manager (Claude) does not read the code; it judges by whether receipts are truthful, whether the findings from cross-vendor review hold up, whether boundaries were crossed, and whether things stayed stable after release. Add a row whenever you try a new model. Retired models are no longer listed.

The 2026-09-30 morning update covered 10 work tickets and 1 separate read-only review record. Afternoon conclusions followed about 25 tickets in the same real production project; this is the overall observation set, not a verified per-model count. Samples are small and not a controlled same-task comparison; review findings are not additional work tickets.

## Build

| Model | Vendor | Run with | Good for | Watch out for | Evidence |
|---|---|---|---|---|---|
| GPT-6.1 Sol (medium / high) | OpenAI | `pi` (Codex subscription) | Most reliable for investigation and high-risk production work in this sample: checks carefully before acting and honestly reports no progress | One blocker can stop the whole ticket: as of the evening of 09-30 it had stopped to wait for the manager 6 times that day, 3 of them caused by overly strict manager-written stop conditions. A scoring overhaul took about 5 hours through release; one release held the lock for over an hour. Dense reports consume manager attention; the user's technical lead also warned that it overcomplicates simple features, hurting maintenance | 2026-09-30: 4 morning tickets; afternoon conclusion after about 25 tickets overall (per-model total not recorded) |
| DeepSeek V4.1 Flash (high / max) | DeepSeek | `pi` (official API or the OpenCode Go plan) | Go subscription: default daily developer, about 30–90 minutes per ticket, keeps going; cleanly finished 2 other-model half-built tickets and supplied before/after counts for prompt changes. Official API: website fixes found two root causes and reduced the initial page from 3.7 MB to 33 KB; a separate read-only reassessment disclosed weak evidence | Context easily exceeds 400K tokens; Go restyling missed out-of-scope content problems. Earlier work missed saved files or entry points, so keep cross-vendor review; different tasks do not establish channel quality differences | 2026-09-30 morning: 1 official ticket, 1 Go ticket, 1 with channel unspecified; afternoon: 2 takeovers and 1 prompt ticket (full total not recorded); earlier: dozens (09-23 to 09-29) |
| GPT-5.6 Sol (low–high) | OpenAI | `pi` (Codex subscription) | Backend and operations: stable diagnostics; investigated a systemic root cause before considering resends | Quick overall and does not stop early; but one ticket hit a red line and stopped entirely (overly cautious), including unrelated rollback and PR cleanup (as of the evening of 09-30). Earlier self-validation used too few samples and optimistic reporting; once merged another ticket's unfinished changes | 2026-09-30: 3 tickets (as of that evening); earlier: dozens (09-23 to 09-29) |
| Kimi K3 | Moonshot | `pi` (Kimi plan) | No completed run to assess on 09-30: the plan returned 403, temporarily blocking use | Availability failure only; no quality conclusion from this attempt | 2026-09-30: 1 recorded availability failure, 0 completed tickets |
| GPT-6 Astra (xhigh) | OpenAI | `pi` (Codex subscription) | Major refactors (splitting files that are thousands of lines long), reviewing other models' changes | Slow and expensive; a single thinking run can exceed 15 minutes, so the watchdog must not kill it for "being quiet" | About 6 tickets |
| Grok (4.6 / 4.7) | xAI | `cursor-agent` | Build: the author's main worker — it built 131 of the 227 tickets whose worker could be identified over 8 weeks | Not recorded (the README does not say) | The author's own app: 13 tickets, 3 review rounds (source: README "Field numbers") |

## Read-only review

| Model | Vendor | Run with | Track record | Watch out for | Evidence |
|---|---|---|---|---|---|
| GLM 5.3 Flash (high, with only read/grep/find/ls enabled) | Zhipu | `pi` | Main code reviewer: caught the day's most valuable finding—a read-only internal API exposed residence data even for hidden resumes, missed by the author's self-tests. Morning: 1 medium and 1 low finding, both valid; afternoon: 4 of 5 findings valid on one ticket | Occasionally looks at the wrong file and produces false positives; got the wrong answer on a small find-the-bug question; verify findings individually | 2026-09-30: 1 morning review, 1 afternoon ticket with counts plus the privacy finding (overlap unspecified); earlier: about 35 reviews |
| Gemini 3.1 Pro (high, read-only) | Google | `pi` (through the antigravity bridge) | On small find-the-bug questions it found the bug and gave the simplest fix; the steadiest in our tests | With several concurrent runs it wanders into another session (reviewing the wrong PR), so run only one at a time; it occasionally rates severity too high | Smoke test + several reviews |
| Gemini 3.8 Flash (high, read-only) | Google | `pi` (through the antigravity bridge) | Thinks deeply and often catches what others miss | Very slow (3–15× DeepSeek on the same question) and fond of going in circles; public discussion reports the same; there is an hourly quota cap that even annual members hit (on 09-29 it reported the personal quota was used up, resetting after about 1 hour) | Smoke test + about 10 reviews |
| Gemini 3.8 Flash (read-only) | Google | `agy` | Handled read-only review on the author's own app | Not recorded (the README does not say) | The author's own app: 13 tickets, 3 review rounds, 36 findings, 35 accepted and 1 rejected (source: README "Field numbers") |

09-30 afternoon review additions:

| Model | Vendor | Run with | Track record | Watch out for | Evidence |
|---|---|---|---|---|---|
| MiMo V2.6 Pro (read-only) | Xiaomi | `pi` (OpenCode Go) | 20 findings across 3 tickets, 19 valid (as of the evening of 09-30); now a regular reviewer alongside GLM | One finding did not hold up; verify each finding | 2026-09-30: 3 tickets (as of that evening) |
| Gemini (version unspecified in afternoon notes) | Google | Not recorded | 0 findings in each of 2 reviews | No added findings in this sample does not prove poor review quality | 2026-09-30: 2 reviews |

The same piece of code reviewed concurrently by three vendors: both Geminis found the root cause, GLM got it wrong (the same way DeepSeek did). So review work is best done by more than one vendor.

## Our current default combination

**DeepSeek writes; GLM + MiMo review; GPT investigates and handles high-risk checks.** Use DeepSeek Go for daily features, fixes, pages, prompts and documentation; GPT-6.1 Sol medium for investigation and high for release-process, disk/data and security work. Both builders' code can attract around ten review findings: the safety net is review, not who writes, so use GPT's rigor where it matters most.

Prewrite “if X happens, do Y” within authorized boundaries, split large tickets, and check for overengineering in review—unnecessary abstractions, configuration or fallback logic. This is our small, single-project observation, not a controlled same-task comparison.

## Ratings (from 夯到拉)

This is a Chinese-internet meme: it comes from the overseas Tier List format and spread on Douyin and similar platforms from 2024-11. We borrow it to grade models, seven tiers from high to low:

**夯爆了 (S+) > 夯 (S) > 顶级 (A) > 人上人 (B) > NPC (C) > 拉 (D) > 拉完了 (F)**

夯爆了 and 拉 are the two tiers we added to the meme's original five. The tone is a joke; the facts behind each tier are governed by the field notes above, and cover a single project, a small sample, on 09-30 only.

**Tier standards**

| Tier | Hard standard |
|---|---|
| 夯爆了 (S+) | Did something others could not, backed by numbers or a concrete case; without it the result is clearly worse |
| 夯 (S) | Fast and good enough to be a main worker; small flaws that do not get in the way |
| 顶级 (A) | Very strong, but with one clear weakness (cost, slowness, occasional absence, needs watching) |
| 人上人 (B) | Good enough and does not make mistakes; has highlights but does not amaze |
| NPC (C) | Makes little difference either way; runs and is honest, but never showed it did more |
| 拉 (D) | Causes trouble and needs cleanup; its cost or rework outweighs its benefit |
| 拉完了 (F) | Showing up is the same as not showing up, or it makes things worse; there is concrete counter-evidence |

If the evidence is not enough, write "not rated" rather than forcing a tier; the tone is aggressive, the facts are not. (Giving each tier a hard standard is borrowed from the GitHub project Nplace-su/jev-father.)

| Model | Used for | Tier | One-line reason |
|---|---|---|---|
| GLM 5.3 Flash | Review | 夯爆了 (S+) | On a change the author's own tests all passed, it caught that an internal read-only API still returned residence data for hidden resumes; nearly every finding held up and none were padding |
| DeepSeek V4.1 Flash | Main builder | 夯 (S) | Half an hour to an hour and a half per ticket, keeps going, cleanly finishes other models' half-done takeovers, low cost; minus: optimistic self-check (it passed its own 3/3 tests on one ticket, then cross-vendor review raised 14 findings) |
| MiMo V2.6 Pro | Review | 顶级 (A) | 20 findings across 3 tickets, 19 valid; on a subscription channel, so it is absent when the quota runs out |
| GPT-5.6 Sol | Investigation, high-risk checks | 人上人 (B) | Quick, does not stop early, the medium tier is enough; picks too few samples to validate itself |
| GPT-6.1 Sol | Build | NPC (C) | Investigates most thoroughly and does not sugarcoat, but stopped to wait for the manager 6 times in one day, spent about 5 hours on one large ticket, and tends to make simple features complex |
| Gemini | Review | 拉完了 (F) | Two reviews, 0 findings |
| Kimi K3 | Build | Not rated | Subscription unavailable that day |

## Cross-model lessons

- **Use Gemini as a bonus reviewer, never as a required one.** Use GLM for the main review, and have GPT-6 Astra re-check important large changes; when several tickets need review at once, give Gemini to the most important one only.
- **Do not switch models inside one session.** On failure, just retry with the original model; to switch, open a new session and write down what has been done so far. Picking up another model's output after a switch visibly degrades the work.
- **OpenCode Go plan** ($10/month; DeepSeek V4.1 Flash gets a $60 monthly allowance, plus caps of $12 per 5 hours and $30 per week): unit prices are on par with the official API, so within the allowance it works out about 6× cheaper; in our tests it was about 2–2.5× slower than the official API (median about 8 s per call versus 3.5 s) and 20–40% slower again through a proxy, with no drop in quality that we could see.
- **Stopping workers:** a child waiting for the release lock can become orphaned and acquire it after its worker is stopped; clean up lock-waiting children too.
- **Worker lifetime:** workers attached to the manager session's background jobs can die on session restart; launch them independently.
- **Watchdog**: as long as the model is still connected (thinking) or the worker is running commands (has child processes), it is not stuck; judging only by "how long since the session was written" will kill long thinking and long tests by mistake.
- **GPT-6.1 Sol external reference (Artificial Analysis, checked 2026-09-30 in the source notes):** intelligence scores were 52 for 6.1 Sol, 47 for 5.6 Sol and 58 for Astra. API list prices per million input/output tokens were $2/$10 for 6.1 Sol versus $4/$20 for 5.6 Sol; Astra input was $10. Thus 6.1 Sol was half the price of 5.6 Sol, with input one fifth of Astra's—not one fifth across the board. Reported output speed was 69 versus 80 tokens/s for 5.6 Sol, so cheaper did not mean faster. API list prices are not direct savings on a subscription or proof of its quota accounting.
- Choosing a model: rely mainly on your own tests, with public leaderboards (such as SWE-bench Pro) as a secondary source; when the two disagree, trust your own tests.
