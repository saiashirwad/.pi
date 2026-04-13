---
description: Ask Oracle to debug a failure or confusing behavior
---
Use the `subagent` tool with `agent: "oracle"` for this task, not the main thread unless subagent invocation fails:

$@

Requirements for the Oracle run:
- Stay read-only and investigation-first.
- Start by identifying what changed, last known good state, reproducibility clues, and relevant config/env differences.
- Inspect relevant code, logs, commands, and git history when useful.
- Prioritize root-cause analysis, top 2-3 hypotheses, and the fastest discriminating validation steps.
- Ground findings in evidence with file paths, commands inspected, and commit hashes when available.
- Return plain markdown advice only.

Preferred output:
- Summary
- Findings
- Most likely causes
- Recommended next debugging steps
- Confidence
