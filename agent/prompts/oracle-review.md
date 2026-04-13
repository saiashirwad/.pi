---
description: Ask Oracle for an advisory code review or regression review
---
Use the `subagent` tool to run the `oracle` agent for this review task:

$@

Requirements for the Oracle run:
- Keep it advisory and read-only.
- Inspect code and, if useful, inspect `git diff`, `git log`, or `git show`.
- Focus on regressions, correctness, security, edge cases, and notable design risks.
- Return plain markdown advice only.

Preferred output:
- Summary
- Findings
- Likely regressions/risks
- Recommended next steps
