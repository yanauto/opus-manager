# Board · Mission Control

English · [中文](README.zh-CN.md)

A read-only local board: how many workers are running, what each one is on, how far it got, and what is waiting in the queue.

It does not dispatch anything and changes nothing. It reads one JSON file and draws it, refreshing itself.

## Run it

Node 18+, no other dependencies.

```bash
node board/server.mjs
# → http://127.0.0.1:3999
```

A fresh clone runs on the bundled example data. To use your own, copy the two files and edit them:

```bash
cp board/config.example.json board/config.json   # seats and default models
cp board/state.example.json  board/state.json    # who is running, what is queued
```

Options: `--state <file>`, `--config <file>`; port via `BOARD_PORT`.

## Where the data comes from

`state.json` is just a file. You, or Claude, write a line into it when a ticket is dispatched, handed back, or shipped. No server, no API. The board re-reads it every 15 seconds.

```json
{
  "workers": [
    {
      "task": "ticket-101",
      "title": "search endpoint cached, duplicate requests hit one process",
      "role": "builder",
      "model": "DeepSeek",
      "stage": "building",
      "startedAt": "2026-10-15T01:20:00Z",
      "lastActivity": "2026-10-15T01:34:00Z"
    }
  ],
  "queue": [
    { "batch": "batch-7", "status": "running", "note": "stuck on PR, waiting for review", "items": ["ticket-101"] }
  ],
  "today": [
    { "task": "ticket-98", "role": "builder", "model": "DeepSeek", "status": "done", "at": "2026-10-15T00:12:00Z" }
  ]
}
```

- `role` matches a `seats[].id` in `config.json`; anything else is shown as-is.
- Timestamps are absolute. If writing them by hand is a chore, `minutesAgo: 12` also works.
- `lastActivity` turns amber past 15 minutes and red past 30 — that is how a stuck worker shows up.

## When writing the state file

This is a board for humans. Keep prompt text, customer data and credentials out of it. Ticket id, stage and model are enough. `state.json` and `config.json` are in `.gitignore` and will not be committed.

## Files

- `server.mjs` — one http server, zero dependencies
- `view.mjs` — rendering, plain string concatenation, no frontend framework
- `config.example.json`, `state.example.json` — copy and edit

To wire in your own records, change the few lines in `server.mjs` that read the file; or just keep writing `state.json` on a timer and change nothing.
