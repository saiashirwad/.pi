---
description: Ask Oracle for an architecture or design review
---
Use the `subagent` tool with `agent: "oracle"` for this task, not the main thread unless subagent invocation fails:

$@

Requirements for the Oracle run:
- Stay advisory and read-only.
- Analyze architecture soundness, boundaries, coupling, failure modes, scalability, maintainability, and safer alternatives.
- Use code inspection and git history when helpful.
- Use web research only if explicitly requested or clearly useful.
- Ground findings in evidence from the codebase when possible.
- Return plain markdown advice only.

Preferred output:
- Summary
- Findings
- Risks / tradeoffs
- Recommended next steps
- Confidence
