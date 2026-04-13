---
description: Ask Oracle for a low-risk implementation or refactor plan
---
Use the `subagent` tool with `agent: "oracle"` for this task, not the main thread unless subagent invocation fails:

$@

Requirements for the Oracle run:
- Do not implement.
- Stay advisory and read-only.
- Prefer low-risk, incremental, reversible steps.
- Call out sequencing, validation strategy, rollback points, and regression risks.
- Ground recommendations in the code structure observed.
- Return plain markdown advice only.

Preferred output:
- Summary
- Proposed plan
- Risks
- Recommended next steps
- Confidence
