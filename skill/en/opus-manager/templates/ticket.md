# T<N>: <short title>

> from: <orchestrator, e.g. Claude Code (Opus)> | date: YYYY-MM-DD | worker: <cli:model>
> workdir: <path relative to the project root; omit for the root>
> claimed-by: (the manager fills this in at dispatch)

## Goal
<One sentence: what problem this ticket solves.>

## Read first
1. <project rules, e.g. AGENTS.md / CLAUDE.md>
2. <the files, docs or issues this change touches>

## Boundaries
1. Touch only: <files / modules>. Nothing else.
2. No secrets in code, docs or logs.
3. No git commit / push (the orchestrator commits after acceptance).
4. Leave this ticket file in `_tickets/doing/`.

## Acceptance (commands, not opinions)
1. `<command>` → <expected result, e.g. all tests pass>
2. `<command>` → <expected output or field value>

## Why these checks
<What real outcome the checks protect. Passing the checks is not the goal; this is.>

## Deliverables
- <files to create or change>
