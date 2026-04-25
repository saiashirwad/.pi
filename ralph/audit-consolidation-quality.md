# AGENTS.md Consolidation & Quality Audit

**Source:** `/Users/texoport/.pi/agent/AGENTS.md`
**Audit Date:** 2026-04-25
**Auditor:** Orchestrator Agent (direct execution — subagent depth limit reached)

---

## 1. Consolidation Rules

### Explicit Rules

1. **"Always Persist Consolidated Findings"** — After parallel scouts or researchers return, the orchestrator MUST write a consolidated artifact before synthesizing in chat. This is mandatory, not optional.

2. **"Pass Artifacts by Path, Not by Paste"** — When launching follow-up subagents, reference artifact file paths; do not paste content into task descriptions. Rationale given: avoids bloating context and prevents drift from stale pasted content.

3. **"If a chain step produces N independent artifacts, the next step in the chain should be a SINGLE agent that reads all N and produces one consolidated output."** — This is stated as a hard rule: "Never chain parallel → parallel without a consolidator in between."

4. **"Always alternate: parallel → single → parallel → single."** — The structural rule for any chain involving parallel execution.

5. **Consolidator role assignment:** The doc specifies that a single `planner`, `delegate`, or `reviewer` should read all parallel outputs and produce ONE consolidated artifact. In Pattern H, Step 2 uses `delegate` as consolidator; in the PRD analysis example, Step 2 uses `reviewer`.

6. **Project-level artifact conventions:** The doc prescribes a `ralph/` directory with standard filenames (`audit.md`, `plan.md`, `progress.md`, `decisions.md`, `review-notes.md`) to ensure artifacts persist across sessions.

### Implicit Rules

- Consolidation is required even when outputs seem compatible. The doc explicitly rejects the anti-pattern: "I have 5 scout reports. The user can read them all."
- Consolidation must resolve conflicts and duplicate observations, not just concatenate outputs.
- The orchestrator itself should perform synthesis (≤5 bullets) but must have a consolidated artifact as its source material.

---

## 2. Synthesis vs Analysis Boundaries

### Definitions

| Role | Definition | Constraints |
|------|-----------|-------------|
| **Synthesis (Orchestrator)** | Summarizing subagent output for the user in chat | ≤30 seconds, ≤5 bullets or ≤1 short paragraph |
| **Analysis (Delegated)** | Creating new understanding from multiple sources | Never the orchestrator's job |

### Explicit Boundary Markers

The doc states: "You have TWO roles. Do not confuse them." and provides a table of analysis tasks that must be delegated:

- Compare 5 scout reports against a PRD → `delegate` or `planner`
- Identify gaps in a plan → `planner`
- Recommend task reordering/splitting → `planner`
- Evaluate tradeoffs between approaches → `delegate` (parallel)
- Resolve conflicting subagent reports → `reviewer`
- Restructure a document based on new info → `worker`

### Synthesis Rules

- Must attribute: "The scout found...", "The worker implemented..."
- If subagents conflict, spawn a `reviewer` — do not resolve complex conflicts yourself
- Full details go to a file, not chat

### Ambiguity / Edge Cases

1. **What counts as "new understanding"?** The doc says synthesis "does not create new information," but any summary involves some degree of abstraction and selection. The line between "selective summarization" (synthesis) and "pattern extraction" (analysis) is not clearly drawn.

2. **Single-source synthesis:** If a scout returns one artifact, the orchestrator synthesizing from it is straightforward. But if multiple scouts return conflicting information, the orchestrator is told to "spawn a reviewer" rather than resolve it. This implies the orchestrator cannot even perform conflict *detection* in synthesis — yet detecting a conflict requires some comparative analysis.

3. **The "2-file budget":** The orchestrator can read the user's input (1 file) and "the scout's context.md" (1 file). If there are 5 scout reports, the orchestrator cannot read them all. But the rule says the orchestrator should not compare multiple documents. This creates a structural enforcement of the boundary, which is clever but not explicitly stated as the reason.

---

## 3. Fork Review Rules (Pattern C)

### What the Doc Says

Pattern C is labeled "Fork Review (quality gate)." It shows:

```
worker("Implement feature X per plan.md")
  // DON'T wait for worker to finish to launch reviewer
  // Launch reviewer in parallel with clear handoff instructions
```

The "Actual flow" shows:
```
worker("Implement feature X", output="progress.md")
// After worker signals complete:
reviewer("Review progress.md against plan.md, fix issues directly")
```

### "Always Fork, Never Serial"

This exact phrase appears in the Context Budget Rules table:
- "Need to verify quality → `reviewer` (always fork, never serial)"

### Exceptions / Nuance

**No explicit exceptions are documented.** However, there are implicit contradictions:

1. Pattern C's comment says "DON'T wait for worker to finish to launch reviewer" and "Launch reviewer in parallel," but the "Actual flow" shows serial execution (worker completes, then reviewer starts). This is a **contradiction within Pattern C itself** — the ideal (fork) vs. the practical example (serial).

2. In Pattern G (Self-Correction Loop), the reviewer and worker are explicitly serial: `worker → reviewer → worker → reviewer`. This is inherently not forked. The doc does not explain why self-correction loops are exempt from the "always fork" rule.

3. In the "Refactor the API layer" scenario, Phase 1 is `worker → reviewer`, Phase 2 is `worker → reviewer`, then a final `reviewer`. All are serial within phases.

---

## 4. Reviewer Requirements

### When Required

1. **"Always fork a reviewer."** (anti-pattern section)
2. **"Need to verify quality → reviewer"** (decision table)
3. **"Skipping the reviewer" is explicitly listed as an anti-pattern.**
4. Bug fixes require reviewer: `scout → planner → worker → reviewer`
5. Pattern D (Multiple Workers) ends with `reviewer("Review integration points")`
6. Pattern H ends with `reviewer("Review all progress.md files against plan.md, flag integration issues")`

### What Reviewers Should Do

- "Review progress.md against plan.md, fix issues directly" — reviewers can fix issues directly, not just report them
- "Flag integration issues" — when multiple workers are involved
- "Verify fix handles edge cases" — for bug fixes
- "Resolve conflicts, write consolidated recommendations.md" — in the PRD analysis example, the reviewer acts as a consolidator

### How to Launch

- "Launch reviewer in parallel with clear handoff instructions" — Pattern C
- "always fork, never serial" — Context Budget Rules

### Gaps in Reviewer Rules

1. **No reviewer for the reviewer.** The doc never addresses what happens when a reviewer makes mistakes or has biases. There is no "meta-review" rule.

2. **Reviewer vs. consolidator role confusion.** In the PRD analysis example, the `reviewer` is used to consolidate 4 parallel analysis outputs. But in the Decision Tree, `reviewer` is for "checking quality/correctness," while `delegate` is for small tasks and `planner` is for plans. Using `reviewer` as a consolidator stretches its defined role.

3. **No guidance on reviewer scope.** Should one reviewer check everything, or should there be domain-specific reviewers? The doc shows both (single integration reviewer in Pattern H, vs. phase reviewers in the refactor scenario).

4. **"Fix issues directly" — no boundaries.** The doc says reviewers can "fix issues directly," but doesn't specify limits. Can a reviewer rewrite entire implementations? Can it override the worker's architectural decisions?

5. **No failure mode.** What if the reviewer never approves? What if the worker and reviewer deadlock?

---

## 5. Self-Correction Loops (Pattern G)

### What the Doc Says

```
worker("Implement feature")
→ reviewer("Review implementation")
// If reviewer finds issues:
→ worker("Fix issues identified by reviewer", reads=["review-notes.md"])
→ reviewer("Re-verify")
// Loop until reviewer approves
```

### Explicit Rules

- Loop until reviewer approves
- Worker must read `review-notes.md` on subsequent iterations

### Missing Rules / Gaps

1. **No maximum iteration limit.** The doc says "Loop until reviewer approves" with no cap. In practice, this could lead to infinite loops or runaway context usage.

2. **No escalation path.** If the worker and reviewer disagree fundamentally, who breaks the tie? The orchestrator is forbidden from analyzing, so it cannot adjudicate.

3. **No state accumulation rules.** Does each iteration's `review-notes.md` overwrite the previous, or accumulate? If the worker reads all prior notes, context bloat is inevitable.

4. **No parallelism restriction.** Can the worker in iteration N be launched while iteration N-1's reviewer is still running? The doc implies serial execution.

5. **No detection of reviewer scope creep.** If a reviewer keeps finding new issues on each pass (not just verifying fixes), the loop may never terminate. The doc doesn't distinguish between "re-verify fixes" and "full re-review."

6. **No cost/context awareness.** Self-correction loops are expensive. The doc does not mention when to cut losses and restart with a new worker or planner.

---

## 6. Identified Gaps Summary

### Critical Gaps

| # | Gap | Location / Evidence | Risk |
|---|-----|---------------------|------|
| 1 | **Pattern C contradicts itself** — Comment says "fork/parallel" but actual flow is serial | Pattern C example | Undermines the "always fork" rule |
| 2 | **No max iteration limit for Pattern G** | Pattern G: "Loop until reviewer approves" | Potential infinite loops, context exhaustion |
| 3 | **No escalation path for reviewer-worker deadlock** | Entire doc | Orchestrator cannot analyze, so deadlocks are unresolvable by design |
| 4 | **No meta-review or reviewer quality check** | Reviewer sections | Single point of failure; reviewer errors propagate |
| 5 | **"Always fork, never serial" is violated by Pattern G and refactoring scenario** | Pattern G, Refactor API scenario | Rule is stated as absolute but exceptions exist without explanation |

### Major Gaps

| # | Gap | Location / Evidence | Risk |
|---|-----|---------------------|------|
| 6 | **Reviewer role conflated with consolidator** | PRD analysis example uses `reviewer` to consolidate | Role boundary erosion; reviewer may overstep |
| 7 | **"Fix issues directly" has no scope limits** | Pattern C actual flow | Reviewer could rewrite rather than review |
| 8 | **No guidance on when to use one reviewer vs. many** | Multiple scenarios show both | Inconsistent quality gate coverage |
| 9 | **Synthesis vs analysis boundary is fuzzy for conflict detection** | Synthesis section says "if subagents conflict, spawn reviewer" | Detecting conflict IS comparative analysis, which the orchestrator is forbidden from doing |
| 10 | **No artifact freshness / versioning rules** | Artifact Handoff section | Stale artifacts may be consumed if multiple iterations occur |
| 11 | **No rule for when to stop parallelizing and start consolidating** | Pattern H examples | "5–6 parallel scouts" is vague; N=20 might be too many |
| 12 | **Consolidator agent type is ambiguous** — `planner`, `delegate`, or `reviewer`? | Pattern H uses `delegate`, PRD example uses `reviewer` | Inconsistent role assignment for same task |

### Minor Gaps

| # | Gap | Location / Evidence | Risk |
|---|-----|---------------------|------|
| 13 | **No naming convention for iteration artifacts** | Pattern G | `review-notes.md` may be overwritten |
| 14 | **"Always alternate parallel → single" is not stated as a strict algorithm** | Anti-pattern section | Could be interpreted as guideline rather than rule |
| 15 | **No guidance on how long synthesis should take** | Synthesis rules say "30 seconds" but this is metaphorical, not literal | Ambiguous timeboxing |
| 16 | **The `context-builder` agent type is mentioned once in the Decision Tree but never defined or used in patterns** | Decision Tree | Orphan concept |
| 17 | **No rule for duplicate detection across parallel scouts** | Pattern H | 6 scouts may investigate overlapping areas; no deduplication mechanism |
| 18 | **"Write to a file in the project directory" vs session artifacts — no migration rule** | Artifact Handoff | Session-scoped artifacts may be lost before project-level consolidation |

---

## 7. Recommendations

1. **Clarify Pattern C:** Either make the example truly forked (worker and reviewer in parallel with explicit handoff mechanics) or document serial review as an acceptable fallback.

2. **Add Pattern G guardrails:**
   - Maximum 3 iterations
   - Escalation to `planner` if iteration 3 fails
   - Explicit instruction that re-verification should be narrower than full review

3. **Define reviewer authority limits:** Specify what "fix issues directly" means — e.g., "typos and minor logic errors only, not architectural changes."

4. **Resolve consolidator role ambiguity:** Either standardize on `delegate` for consolidation (since it is a small, focused task) or create a dedicated `consolidator` concept.

5. **Add meta-review rule:** For critical paths, a second reviewer should spot-check the first reviewer's output. Or allow the orchestrator to perform lightweight conflict detection before spawning a reviewer.

6. **Define `context-builder` or remove it:** If it has a legitimate use case, add a pattern and examples. Otherwise, delete from the Decision Tree.

7. **Add deduplication instruction to Pattern H:** Parallel scouts should be told to check `ralph/audit.md` first to avoid redundant investigations.

---

## 8. Conclusion

AGENTS.md is a well-structured and opinionated orchestration guide with strong patterns and clear anti-patterns. However, it contains **internal contradictions** (Pattern C's fork vs. serial example), **absolute rules with undocumented exceptions** ("always fork" violated by Pattern G), and **missing guardrails** for failure modes (infinite loops, reviewer error, deadlock). The synthesis/analysis boundary is structurally enforced by the 1-file read limit but not philosophically clarified, leading to edge cases like conflict detection. Addressing the Critical and Major gaps above would significantly improve reliability and reduce ambiguity for orchestrator agents.
