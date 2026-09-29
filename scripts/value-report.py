#!/usr/bin/env python3
"""value-report.py - rank model + channel combinations by cost per accepted ticket.

Reads a ledger written by the manager (one line per worker run, see
docs/value.md) and a plans file (see skill/*/opus-manager/templates/plans.example.json)
and prints two rankings:

  * marginal  - plan and gifted quota count as 0; only money actually paid per
                run is counted. Use this when you dispatch work day to day:
                drain the plans and the free quota first.
  * amortized - the plan's monthly fee is spread over the qualified tickets the
                plan produced this month. Use this at the end of the month to
                decide whether to renew a plan.

Standard library only. Python 3.8+.

Usage:
    python3 value-report.py _receipts/ledger.tsv --plans plans.json
    python3 value-report.py _receipts/ledger.tsv --plans plans.json --month 2026-09
    python3 value-report.py _receipts/ledger.tsv --plans plans.json --fetch-prices
    python3 value-report.py --selftest
"""

import argparse
import json
import os
import re
import sys
import tempfile
import urllib.request

MODELS_DEV = "https://models.dev/api.json"

UNKNOWN = {"", "-", "?", "未知", "unknown", "n/a", "na", "none"}
FIELDS = ["date", "ticket", "role", "tool", "model", "channel",
          "in", "cache", "out", "minutes", "cost", "result", "findings"]

ALIASES = {
    "date": {"date", "日期", "时间"},
    "ticket": {"ticket", "工单", "任务"},
    "role": {"role", "角色"},
    "tool": {"tool", "工具", "引擎"},
    "model": {"model", "模型", "模型:档位", "模型：档位", "model:tier"},
    "channel": {"channel", "渠道", "计费"},
    "in": {"in", "input", "输入", "输入token", "输入 tokens"},
    "cache": {"cache", "cache_read", "缓存命中", "缓存"},
    "out": {"out", "output", "输出", "输出token", "输出 tokens"},
    "minutes": {"minutes", "min", "耗时分钟", "耗时", "分钟"},
    "cost": {"cost", "按量花费", "花费", "支出"},
    "result": {"result", "结果"},
    "findings": {"findings", "审查成立条数", "成立条数"},
}

QUALIFIED_RE = re.compile(r"^(一次过|返工|first[- ]?pass|once|rework)", re.I)
FAILED_RE = re.compile(r"^(失败|没交|failed|fail|missing|dropped|没交)", re.I)
REWORK_N_RE = re.compile(r"(\d+)")

_ALIAS_LOOKUP = {a.lower(): k for k, v in ALIASES.items() for a in v}


def num(value):
    """Parse a token count or a money amount. Returns None when unknown."""
    if value is None:
        return None
    text = str(value).strip().replace(",", "").replace("，", "")
    if text.lower() in UNKNOWN:
        return None
    factor = 1.0
    if text.endswith(("K", "k")):
        factor, text = 1e3, text[:-1]
    elif text.endswith(("M", "m")):
        factor, text = 1e6, text[:-1]
    try:
        return float(text) * factor
    except ValueError:
        return None


def money(value):
    got = num(value)
    return 0.0 if got is None else got


def read_ledger(path):
    """Read the ledger. The header names the columns; without one we assume FIELDS order."""
    rows = []
    columns = list(FIELDS)
    with open(path, encoding="utf-8-sig") as handle:
        for line_no, raw in enumerate(handle, 1):
            line = raw.rstrip("\n").rstrip("\r")
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            cells = [c.strip() for c in line.split("\t")]
            if not rows:
                named = [_ALIAS_LOOKUP.get(c.lower()) for c in cells]
                if "ticket" in named and "model" in named:
                    columns = named  # header row: map each column by its name
                    continue
            if len(cells) < len(columns):
                cells += [""] * (len(columns) - len(cells))
            row = {name: cells[i] for i, name in enumerate(columns) if name}
            if not row.get("ticket") or not row.get("model"):
                sys.exit("ledger line %d: need at least a ticket and a model" % line_no)
            row["_line"] = line_no
            row["in_tok"] = num(row.get("in"))
            row["cache_tok"] = num(row.get("cache"))
            row["out_tok"] = num(row.get("out"))
            row["minutes_val"] = num(row.get("minutes"))
            row["cost_val"] = money(row.get("cost"))
            row["findings_val"] = num(row.get("findings"))
            result = (row.get("result") or "").strip()
            row["qualified"] = bool(QUALIFIED_RE.match(result))
            row["failed"] = bool(FAILED_RE.match(result))
            row["rework_rounds"] = 0.0
            if re.search(r"返工|rework", result, re.I):
                match = REWORK_N_RE.search(result)
                row["rework_rounds"] = float(match.group(1)) if match else 1.0
            rows.append(row)
    return rows


def load_plans(path):
    if not path:
        return {}
    with open(path, encoding="utf-8") as handle:
        data = json.load(handle)
    plans = {}
    for plan in data.get("plans", []):
        channel = plan.get("channel") or plan.get("name")
        if not channel:
            continue
        plans[channel.strip().lower()] = plan
    return plans


def plan_fee(plan, fx):
    """Monthly fee of a plan in the ledger's money unit (CNY by default)."""
    if not plan:
        return 0.0
    fee = float(plan.get("monthly_fee") or 0)
    currency = (plan.get("currency") or "CNY").upper()
    if fee <= 0:
        return 0.0
    if currency == "CNY":
        return fee
    return fee * float(fx.get(currency, 0.0))


def group(rows, plans, fx):
    """Aggregate rows per model + channel."""
    groups = {}
    for row in rows:
        channel = (row.get("channel") or "unknown").strip()
        key = (row.get("model", "").strip(), channel)
        got = groups.setdefault(key, {
            "model": key[0], "channel": channel, "plan": plans.get(channel.lower()),
            "rows": 0, "tickets": set(), "qualified": 0, "first_pass": 0,
            "rework_rounds": 0.0, "failed": 0, "findings": 0.0,
            "minutes": 0.0, "minutes_rows": 0, "cost": 0.0,
            "in_tok": 0.0, "cache_tok": 0.0, "out_tok": 0.0, "tok_rows": 0,
        })
        got["rows"] += 1
        got["tickets"].add(row.get("ticket"))
        if row["qualified"]:
            got["qualified"] += 1
            got["rework_rounds"] += row["rework_rounds"]
            if row["rework_rounds"] == 0:
                got["first_pass"] += 1
        if row["failed"]:
            got["failed"] += 1
        if row["findings_val"] is not None:
            got["findings"] += row["findings_val"]
        if row["minutes_val"] is not None:
            got["minutes"] += row["minutes_val"]
            got["minutes_rows"] += 1
        got["cost"] += row["cost_val"]
        if None not in (row["in_tok"], row["cache_tok"], row["out_tok"]):
            got["in_tok"] += row["in_tok"]
            got["cache_tok"] += row["cache_tok"]
            got["out_tok"] += row["out_tok"]
            got["tok_rows"] += 1

    # Amortized: the plan's monthly fee spread over the qualified tickets it
    # produced this month, so every row on that channel carries its share.
    for got in groups.values():
        plan = got["plan"]
        got["plan_fee"] = plan_fee(plan, fx)
        per_unit = 0.0
        if got["plan_fee"] and got["qualified"]:
            per_unit = got["plan_fee"] / got["qualified"]
        got["amortized"] = got["cost"] + per_unit * got["qualified"]
        got["amortized_each"] = per_unit + (got["cost"] / got["qualified"] if got["qualified"] else 0.0)
    return list(groups.values())


def fmt_money(value):
    return "%.2f" % value


def fmt_tokens(value):
    if not value:
        return "-"
    if value >= 1e6:
        return "%.2fM" % (value / 1e6)
    if value >= 1e3:
        return "%.0fK" % (value / 1e3)
    return "%.0f" % value


def cost_each(got, key):
    if not got["qualified"]:
        return None
    return got[key] / got["qualified"]


def tokens_per_run(got):
    if not got["tok_rows"]:
        return None
    return (got["in_tok"] + got["cache_tok"] + got["out_tok"]) / got["tok_rows"]


def sort_key(got, each_key):
    """Cheapest per qualified run first; ties go to the run that eats the least quota."""
    each = cost_each(got, each_key)
    tokens = tokens_per_run(got)
    return (each is None, round(each, 4) if each is not None else 0.0,
            tokens if tokens is not None else float("inf"), got["model"])


def table(groups, money_name, each_key, fx_name):
    head = ("%-24s %-16s %5s %6s %6s %7s %7s %7s %8s %9s %10s" % (
        "model", "channel", "runs", "tickets", "ok", "first%", "rework", "findings",
        "tok/run", "min/run", money_name))
    print(head)
    print("-" * len(head))
    rows = sorted(groups, key=lambda g: sort_key(g, each_key))
    for got in rows:
        each = cost_each(got, each_key)
        first = (100.0 * got["first_pass"] / got["qualified"]) if got["qualified"] else 0.0
        rework = (got["rework_rounds"] / got["qualified"]) if got["qualified"] else 0.0
        minutes = (got["minutes"] / got["minutes_rows"]) if got["minutes_rows"] else 0.0
        tokens = tokens_per_run(got)
        print("%-24s %-16s %5d %6d %6d %6.0f%% %7.2f %7.0f %8s %9.1f %10s" % (
            got["model"][:24], got["channel"][:16], got["rows"], len(got["tickets"]),
            got["qualified"], first, rework, got["findings"],
            fmt_tokens(tokens) if tokens is not None else "-", minutes,
            fmt_money(each) if each is not None else "n/a"))
    total_qualified = sum(g["qualified"] for g in groups)
    total_cost = sum(g[each_key] for g in groups)
    print("-" * len(head))
    print("qualified runs: %d | total %s: %s | per qualified run: %s" % (
        total_qualified, money_name, fmt_money(total_cost),
        fmt_money(total_cost / total_qualified) if total_qualified else "n/a"))
    if fx_name:
        print("(money is %s; plan fees converted at the rates in the plans file)" % fx_name)


def price_estimate(got, prices):
    """Pay-per-use value of a group's tokens, from models.dev list prices."""
    if not got["tok_rows"]:
        return None
    model = got["model"].split(":")[0]
    price = match_price(model, prices)
    if not price:
        return None
    return (got["in_tok"] * price.get("input", 0)
            + got["cache_tok"] * price.get("cache_read", 0)
            + got["out_tok"] * price.get("output", 0)) / 1e6


def match_price(model, prices):
    if model in prices:
        return prices[model]
    flat = model.lower().replace(".", "-").replace("_", "-")
    hits = [v for k, v in prices.items()
            if k.lower().replace(".", "-").replace("_", "-") == flat]
    return hits[0] if len(hits) == 1 else None


def fetch_prices(cache_path=None):
    request = urllib.request.Request(MODELS_DEV, headers={"User-Agent": "value-report.py"})
    try:
        raw = urllib.request.urlopen(request, timeout=30).read()
    except Exception as exc:  # network is optional; never fail the report
        print("warning: could not read %s (%s); skipping price estimates" % (MODELS_DEV, exc),
              file=sys.stderr)
        return {}
    if cache_path:
        try:
            with open(cache_path, "wb") as handle:
                handle.write(raw)
        except OSError:
            pass
    data = json.loads(raw)
    prices = {}
    for provider in data.values():
        for model in (provider.get("models") or {}).values():
            cost = model.get("cost") or {}
            if not cost or model.get("id") is None:
                continue
            prices.setdefault(model["id"], {
                "input": cost.get("input", 0) or 0,
                "output": cost.get("output", 0) or 0,
                "cache_read": cost.get("cache_read", 0) or 0,
            })
    return prices


def selftest():
    here = os.path.dirname(os.path.abspath(__file__))
    ledger = os.path.join(here, "value-ledger.example.tsv")
    plans = os.path.join(here, os.pardir, "skill", "zh", "opus-manager",
                         "templates", "plans.example.json")
    rows = read_ledger(ledger)
    assert len(rows) == 8, "expected 8 example rows, got %d" % len(rows)
    got = {g["model"] + "@" + g["channel"]: g for g in
           group(rows, load_plans(plans), {"USD": 7.0})}
    plan = got["glm-5.3-flash:high@glm-coding-plan"]
    assert plan["rows"] == 4 and plan["qualified"] == 3, plan
    assert plan["first_pass"] == 2 and plan["rework_rounds"] == 1, plan
    assert plan["findings"] == 3, plan
    assert abs(plan["cost"] - 0.0) < 1e-9, plan
    assert abs(plan["amortized_each"] - 18.0 * 7.0 / 3) < 1e-6, plan
    metered = got["deepseek-flash:max@按量"]
    assert abs(metered["cost"] - 0.51) < 1e-9, metered
    assert abs(cost_each(metered, "cost") - 0.51) < 1e-9, metered
    free = got["gemini-3-1-pro:high@赠送"]
    assert free["qualified"] == 1 and free["cost"] == 0.0, free
    minutes = [r["minutes_val"] for r in rows if r["minutes_val"] is not None]
    assert len(minutes) == 8 and abs(sum(minutes) - 68) < 1e-9, minutes

    # the same file must also parse when the columns and results are English
    english = [
        "date\tticket\trole\ttool\tmodel\tchannel\tin\tcache\tout\tminutes\tcost\tresult\tfindings",
        "2026-09-01\tT1\tbuild\tpi\tdeepseek-flash:max\tmetered\t120K\t800K\t40K\t12\t0.51\tfirst-pass\tunknown",
    ]
    import tempfile
    import tempfile
    with tempfile.NamedTemporaryFile("w", suffix=".tsv", delete=False, encoding="utf-8") as tmp:
        tmp.write("\n".join(english) + "\n")
        tmp_path = tmp.name
    try:
        alt = read_ledger(tmp_path)
        assert len(alt) == 1 and alt[0]["qualified"] and alt[0]["cost_val"] == 0.51, alt
    finally:
        os.unlink(tmp_path)
    print("selftest ok: %d rows, %d model+channel groups" % (len(rows), len(got)))
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description="cost per accepted ticket, by model and channel")
    parser.add_argument("ledger", nargs="?", help="path to _receipts/ledger.tsv")
    parser.add_argument("--plans", help="path to a plans file (plans.example.json)")
    parser.add_argument("--month", help="only rows whose date starts with this, e.g. 2026-09")
    parser.add_argument("--fetch-prices", action="store_true",
                        help="fetch list prices from %s for an extra estimate" % MODELS_DEV)
    parser.add_argument("--currency", default="CNY", help="money unit of the ledger (default CNY)")
    parser.add_argument("--selftest", action="store_true", help="run the built-in test and exit")
    args = parser.parse_args(argv)

    if args.selftest:
        return selftest()
    if not args.ledger:
        parser.error("give a ledger path, or --selftest")

    rows = read_ledger(args.ledger)
    if args.month:
        rows = [r for r in rows if (r.get("date") or "").startswith(args.month)]
    if not rows:
        sys.exit("no ledger rows to report")

    plans = load_plans(args.plans)
    if not plans:
        print("note: no plans file, so plan channels are counted as 0 and cannot be "
              "amortized\n", file=sys.stderr)
    fx = {}
    if args.plans:
        with open(args.plans, encoding="utf-8") as handle:
            fx = json.load(handle).get("fx", {})
        missing = {p.get("currency", "CNY").upper() for p in plans.values()} - set(fx) - {"CNY"}
        if missing:
            print("warning: no fx rate for %s, so those plan fees count as 0"
                  % ", ".join(sorted(missing)), file=sys.stderr)

    groups = group(rows, plans, fx)
    dates = sorted({(r.get("date") or "")[:10] for r in rows if r.get("date")})
    print("ledger: %s" % args.ledger)
    print("rows: %d | tickets: %d | dates: %s .. %s" % (
        len(rows), len({r.get("ticket") for r in rows}),
        dates[0] if dates else "?", dates[-1] if dates else "?"))
    print()
    print("== marginal cost (plan and gifted quota count as 0; use for daily dispatch) ==")
    table(groups, "cost", "cost", args.currency if plans else None)
    print()
    print("== amortized cost (monthly fee spread over this month's qualified runs; "
          "use at month end) ==")
    table(groups, "amortized", "amortized_each", args.currency if plans else None)

    if args.fetch_prices:
        prices = fetch_prices()
        if prices:
            print()
            print("== pay-per-use list price of the same tokens (models.dev, estimate) ==")
            for got in sorted(groups, key=lambda g: g["model"]):
                estimate = price_estimate(got, prices)
                if estimate is None:
                    print("%-26s %-18s n/a (tokens or price unknown)" % (
                        got["model"][:26], got["channel"][:18]))
                    continue
                per = ("%.2f" % (estimate / got["qualified"])) if got["qualified"] else "n/a"
                print("%-26s %-18s $%.2f claimed  $%s per qualified run" % (
                    got["model"][:26], got["channel"][:18], estimate, per))
    return 0


if __name__ == "__main__":
    sys.exit(main())
