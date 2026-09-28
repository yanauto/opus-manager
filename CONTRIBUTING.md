# Contributing

English · [中文](CONTRIBUTING.zh-CN.md)

Thanks for helping. This page explains how changes land and what a good change looks like.

## How changes land

`main` is protected. All changes go through a pull request and need a review before they are merged. Force pushes and branch deletion are blocked.

Anyone is welcome to fork the repository and open a PR.

## Before you start

- **Small fixes** (typos, broken links, a wrong flag in an example): open a PR directly.
- **Anything larger** (changing how the workflow behaves, adding a section to the skill, changing the ticket or receipt format): open an issue first and say what problem it solves. That saves you from writing a PR that gets turned down.

## What helps most

**Real results with other models and CLIs.** The skill works with whatever coding CLIs a user has, and every CLI has its own headless, auto-approve, model and read-only flags. If you have tried a combination, tell us:

- which CLI and model built the code, and which reviewed it;
- the exact command line that worked headless;
- what went well, what broke, and roughly what it cost;
- your OS.

Open an issue with this, or send a PR that adds a row to the "Field numbers" table in both READMEs. Numbers must come from real use. Say how big the sample is, and do not round up.

## Rules for every PR

1. **English and Chinese stay in sync.** These come in pairs and must change in the same PR:
   - `skill/en/opus-manager/` ↔ `skill/zh/opus-manager/` (`SKILL.md` and `templates/`)
   - `README.md` ↔ `README.zh-CN.md`
   - `CONTRIBUTING.md` ↔ `CONTRIBUTING.zh-CN.md`

   The two versions of `SKILL.md` keep the same sections in the same order. If you can only write one language, say so in the PR and a maintainer will add the other.
2. **Try skill changes for real.** If you change `SKILL.md` or a template, run at least one ticket with it in a real project and say in the PR what you ran and what happened.
3. **Plain, short writing.** Say what Claude should do, not why it is a good idea at length. No invented numbers or quotes.
4. **One topic per PR.** Easier to review, easier to revert.

## No secrets, ever

Never commit API keys, tokens, passwords, `.env` files or AI session logs (`.claude/sessions/`, `*.jsonl`). This repository is public: anything pushed can be copied before it is deleted.

Every push and PR is scanned by [gitleaks](https://github.com/gitleaks/gitleaks) in CI. If the check turns red, the PR cannot be merged. Remove the secret, revoke it at the provider (assume it is already leaked), and push again.

To catch it before it leaves your machine, install gitleaks and turn on the pre-push check once per clone:

```bash
git config core.hooksPath .githooks
```

## License

By contributing, you agree that your contribution is released under the [MIT License](LICENSE).
