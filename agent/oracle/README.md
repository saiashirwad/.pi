# pi-oracle

A small local-only Oracle setup for Pi, built on top of the installed `pi-subagents` package.

## Added files

- `~/.pi/agent/agents/oracle.md`
- `~/.pi/agent/prompts/oracle-review.md`
- `~/.pi/agent/prompts/oracle-debug.md`
- `~/.pi/agent/prompts/oracle-plan.md`
- `~/.pi/agent/prompts/oracle-arch.md`
- `~/.pi/agent/skills/oracle/SKILL.md`
- `~/.pi/agent/oracle/README.md`

## What this does

Adds a user-level `oracle` subagent that acts like a soft read-only senior advisor for:
- planning
- debugging
- code review
- architecture review
- regression analysis

The main UX is explicit prompt templates that tell Pi to use the `oracle` subagent.

## How to use

Reload Pi resources if needed:

```text
/reload
```

Then use any of these prompt templates:

- `/oracle-review ...`
- `/oracle-debug ...`
- `/oracle-plan ...`
- `/oracle-arch ...`

## Example prompts

```text
/oracle-review review the last commit for regressions in auth behavior
/oracle-debug debug why this command fails: npm test -- --grep auth
/oracle-plan plan a low-risk refactor of these files: src/auth.ts src/session.ts
/oracle-arch analyze whether this architecture is sound for multi-tenant background jobs
```

You can also ask Pi directly to use the `oracle` subagent.

## Behavior / assumptions

- Uses the installed `pi-subagents` setup already present in `~/.pi/agent/settings.json`
- Oracle is configured as advisory and read-only in spirit
- Oracle can inspect code and run read-only shell investigation
- Oracle may inspect `git diff`, `git log`, and `git show`
- Oracle may do optional web research only when explicitly useful/requested
- Output is intended to be plain markdown advice, not JSON

## Limitations

- This is intentionally thin: no custom extension wrapper for V1
- Web research is prompt-allowed, but actual web-tool availability depends on your installed Pi setup/extensions
- Read-only behavior is prompt-enforced, not sandbox-enforced

## Why no extension

For V1, prompt templates + a dedicated subagent are the fastest path to working and easiest to maintain.
