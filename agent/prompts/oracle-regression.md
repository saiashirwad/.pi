---
description: Ask Oracle to investigate likely regressions from a commit, diff, or behavior change
---
Use the `subagent` tool with `agent: "oracle"` for this task, not the main thread unless subagent invocation fails:

$@

Requirements for the Oracle run:
- Stay advisory and read-only.
- Start from what changed: commits, diffs, config changes, or dependency changes.
- Inspect `git diff`, `git log`, `git show`, and relevant code paths when useful.
- Focus on unintended behavior changes, broken assumptions, compatibility risks, and missing tests/checks.
- Ground findings in evidence with file paths, commands inspected, and commit hashes when available.
- Return plain markdown advice only.

Preferred output:
- Summary
- Findings
- Likely regressions
- Recommended next steps
- Confidence
