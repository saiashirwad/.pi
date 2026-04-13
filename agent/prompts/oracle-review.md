---
description: Ask Oracle for an advisory code review or regression review
---
Use the `subagent` tool with `agent: "oracle"` for this task, not the main thread unless subagent invocation fails:

$@

Requirements for the Oracle run:
- Keep it advisory and read-only.
- Inspect code and, when useful, inspect `git diff`, `git log`, `git show`, and `git status`.
- Focus on regressions, correctness, security, edge cases, and unintended behavior changes.
- Ground findings in evidence with file paths, symbols, commands inspected, and commit hashes when available.
- Return plain markdown advice only.

Preferred output:
- Summary
- Findings
- Likely regressions/risks
- Recommended next steps
- Confidence
