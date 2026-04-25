# Audit: Single-Agent Chain Anti-Patterns in AGENTS.md

> **Date:** 2026-04-25  
> **Audited File:** `/Users/texoport/.pi/agent/AGENTS.md`  
> **Focus:** Identifying single-agent serial chains that persist despite parallel alternatives, per the document's own anti-pattern rules.

---

## Executive Summary

AGENTS.md contains **7 explicit serial chains of 3+ agents** with **zero parallel branches** among its core patterns and scenario examples. The document correctly identifies "Serial when parallel works" as an anti-pattern, yet its own canonical patterns (Pattern A, Pattern G, the Context Budget Rules table, and 6 of 9 scenario examples) violate this principle. Additionally, the Decision Tree funnels every task through a single agent type with no decomposition branch, and the document contains a self-contradicting Fork Review pattern (Pattern C) that never actually demonstrates forking.

**Total Findings:** 12 distinct single-agent chain anti-patterns, plus 2 structural gaps (Decision Tree funneling, missing fork mechanics).

---

## 1. Pattern A: Recon → Plan → Execute (4-Step Serial Chain)

### Quote
```
### Pattern A: Recon → Plan → Execute (default for implementation)

scout("Find all files related to user auth, return context.md")
  → planner("Read context.md, create plan.md for adding OAuth")
  → worker("Read context.md and plan.md, implement the changes")
  → reviewer("Read plan.md and verify implementation")
```

### Bottleneck Analysis
This is a **4-agent serial chain with zero parallel branches**. Every agent waits for the previous to complete:
- Planner burns context reading ONE scout's consolidated view, rather than having direct access to multiple parallel scout perspectives.
- Worker is blocked until planner finishes the ENTIRE plan, even if some implementation areas are already well-understood from scout output.
- Reviewer is blocked until worker finishes ALL changes, rather than reviewing incrementally.

The document itself later states: *"Use chains ONLY when steps have dependencies (Step 2 needs Step 1's output). Use parallel for independent analysis."* Yet Pattern A is labeled the **"default for implementation"** — it should be the default with parallel branches.

### Proposed Parallel Rewrite: Pattern A-Parallel

```
// Step 1: Parallel reconnaissance across independent domains
parallel(
  scout("Find auth-related files and patterns, return auth-context.md"),
  scout("Find existing OAuth integrations or dependencies, return deps-context.md"),
  scout("Find test files and coverage for auth, return test-context.md")
)

// Step 2: Planner reads ALL parallel contexts, produces unified plan
→ planner("Read auth-context.md, deps-context.md, test-context.md. Create plan.md with independent implementation units.")

// Step 3: Parallel workers on independent plan sections
→ parallel(
    worker("Implement auth core per plan.md section 1, write auth-progress.md"),
    worker("Implement OAuth flow per plan.md section 2, write oauth-progress.md"),
    worker("Add tests per plan.md section 3, write test-progress.md")
  )

// Step 4: Forked reviewer starts as soon as ANY worker produces progress
→ reviewer("Read plan.md and all *-progress.md files. Review incrementally, write review-notes.md")
```

---

## 2. Pattern G: Self-Correction Loop (Serial Loop Anti-Pattern)

### Quote
```
### Pattern G: Self-Correction Loop

worker("Implement feature")
→ reviewer("Review implementation")
// If reviewer finds issues:
→ worker("Fix issues identified by reviewer", reads=["review-notes.md"])
→ reviewer("Re-verify")
// Loop until reviewer approves
```

### Bottleneck Analysis
This is a **blocking serial loop**. Each iteration:
1. Worker completes ALL work
2. Reviewer reviews ALL work
3. Worker re-does ALL work (not just fixes)
4. Reviewer re-verifies ALL work

Context is wasted re-reading the same codebase. Time is wasted because the worker and reviewer never overlap. The document's own anti-pattern list includes: *"I'll do these 5 audits serially in one chain"* — this is the same problem in loop form.

There is no mechanism for incremental review, no forking, and no parallel fix paths for independent issues.

### Proposed Parallel Rewrite: Pattern G-Parallel (Forked Correction Loop)

```
// Step 1: Worker produces incremental progress artifacts
worker("Implement feature per plan.md, write progress-v1.md")

// Step 2: FORK reviewer immediately — don't wait for completion
// Both agents run simultaneously
parallel(
  worker("Continue implementing remaining sections, write progress-v2.md"),
  reviewer("Review progress-v1.md against plan.md, write review-notes-v1.md")
)

// Step 3: Worker reads reviewer feedback WHILE continuing work
// Independent issues are fixed in parallel with ongoing implementation
worker("Read review-notes-v1.md. Fix flagged issues in completed sections. Continue remaining work. Write progress-v2.md")

// Step 4: Final review on cumulative progress
reviewer("Read progress-v2.md and all review-notes. Final verification.")
```

**Key insight:** The reviewer should be forked at Step 2, not chained. The worker never stops; they incorporate feedback into ongoing work rather than halting for a review gate.

---

## 3. Scenario: "Fix this bug where login fails" (5-Step Serial Chain)

### Quote
```
### Scenario: "Fix this bug where login fails"

1. scout("Find login-related code and error handling. What changed recently?")
2. // Read scout's context.md (this is your 2-file budget)
3. planner("Create plan to fix login bug based on context.md")
4. worker("Implement fix per plan.md")
5. reviewer("Verify fix handles edge cases")
6. Synthesize: "Bug was in src/auth.ts:42 — missing null check. Fixed and verified."
```

### Bottleneck Analysis
A **5-step serial chain** for a bug fix. The document literally says this is how to fix a bug. But bug fixes often have multiple independent investigation angles:
- Code path analysis
- Recent commit history
- Error logs / stack traces
- Test reproduction

Running these serially through one scout, then one planner, then one worker is wasteful. The reviewer is chained after the worker, rather than forked to review the plan before implementation even begins.

### Proposed Parallel Rewrite

```
// Step 1: Parallel investigation — each angle independent
parallel(
  scout("Find login-related code paths and error handling, write code-context.md"),
  scout("Check recent git commits affecting auth, write git-context.md"),
  delegate("Reproduce the bug and capture stack trace/logs, write repro-context.md")
)

// Step 2: Planner reads all angles, creates MINIMAL plan
→ planner("Read code-context.md, git-context.md, repro-context.md. Create minimal-fix-plan.md")

// Step 3: FORK — worker implements while reviewer sanity-checks plan
parallel(
  worker("Apply minimal fix per minimal-fix-plan.md"),
  reviewer("Read minimal-fix-plan.md. Flag any risky assumptions BEFORE worker finishes.")
)

// Step 4: Verify fix
→ delegate("Run tests, confirm bug is fixed, write verification.md")
```

---

## 4. Scenario: "Refactor the API layer" (10-Step Serial Chain)

### Quote
```
### Scenario: "Refactor the API layer"

1. scout("Thorough: Map entire API layer — all files, dependencies, test coverage")
2. planner("Create refactoring plan with phases")
3. // Phase 1:
4. worker("Refactor authentication endpoints per plan.md phase 1")
5. reviewer("Review phase 1")
6. // Phase 2:
7. worker("Refactor data endpoints per plan.md phase 2")
8. reviewer("Review phase 2")
9. reviewer("Full integration review")
10. Synthesize final report
```

### Bottleneck Analysis
**The worst offender: 10 serial steps.** One scout maps the ENTIRE API layer alone. Phases are executed serially (Phase 2 worker waits for Phase 1 review). Three separate review steps are chained, not forked.

This example exists in the same document that contains Pattern H ("Parallel Branches → Consolidator") and the anti-pattern "I'll do these 5 audits serially in one chain." Yet this scenario shows exactly that behavior.

### Proposed Parallel Rewrite

```
// Step 1: Parallel scouts map independent API domains
parallel(
  scout("Map auth endpoints and dependencies, write api-auth.md"),
  scout("Map data endpoints and dependencies, write api-data.md"),
  scout("Map test coverage for all endpoints, write api-tests.md")
)

// Step 2: Planner produces phased plan
→ planner("Read api-auth.md, api-data.md, api-tests.md. Create plan.md with parallelizable phases.")

// Step 3: Parallel workers on independent phases
// NOTE: Only parallel if phases are truly independent per plan
→ parallel(
    worker("Refactor auth endpoints per plan.md phase 1, write progress-auth.md"),
    worker("Refactor data endpoints per plan.md phase 2, write progress-data.md")
  )

// Step 4: Forked reviewers review in parallel with workers
→ parallel(
    reviewer("Review progress-auth.md, write review-auth.md"),
    reviewer("Review progress-data.md, write review-data.md")
  )

// Step 5: Single integration reviewer
→ reviewer("Read plan.md, progress-auth.md, progress-data.md, review-auth.md, review-data.md. Integration review.")
```

---

## 5. Scenario: "Why is the build failing?" (6-Step Serial Chain)

### Quote
```
### Scenario: "Why is the build failing?"

1. delegate("Check build logs, identify the first error, find the file")
2. scout("Investigate the failing file and its dependencies")
3. planner("Create minimal fix plan")
4. worker("Apply fix")
5. delegate("Run build again, confirm fix")
6. Synthesize
```

### Bottleneck Analysis
**6 serial steps.** Step 1 (delegate reads logs) and Step 2 (scout investigates file) could easily run in parallel — the scout doesn't need the delegate's interpretation of logs to start investigating the known failing file. The reviewer is entirely absent from this chain despite being a build fix where verification matters.

### Proposed Parallel Rewrite

```
// Step 1: Parallel investigation
parallel(
  delegate("Check build logs, identify first error, write build-error.md"),
  scout("Investigate the failing file and its dependencies, write file-context.md")
)

// Step 2: Planner creates fix
→ planner("Read build-error.md and file-context.md. Create fix-plan.md")

// Step 3: Forked worker + reviewer
parallel(
  worker("Apply fix per fix-plan.md"),
  reviewer("Read fix-plan.md. Flag risks before worker completes.")
)

// Step 4: Verify
→ delegate("Run build, confirm fix, write verification.md")
```

---

## 6. The Context Budget Rules Table (Implicit Serial Chains)

### Quote
```
| Situation                                   | Action                                            |
| ------------------------------------------- | ------------------------------------------------- |
| Need to implement anything                  | `scout` → `planner` → `worker`                    |
| Need to fix a bug                           | `scout` → `planner` → `worker` → `reviewer`       |
| Need external info                          | `researcher` (parallel if multiple topics)        |
```

### Bottleneck Analysis
The "Need to implement anything" row shows **3 agents in serial**. The "Need to fix a bug" row shows **4 agents in serial**. Only the "Need external info" row mentions parallel — and even then, it's parenthetical, not the default.

This table is the orchestrator's quick-reference guide. By showing serial arrows as the default, it trains orchestrators to default to serial chains.

### Proposed Parallel Rewrite

```
| Situation                                   | Action                                                              |
| ------------------------------------------- | ------------------------------------------------------------------- |
| Need to implement anything                  | parallel(scout × N) → planner → parallel(worker × M) → reviewer     |
| Need to fix a bug                           | parallel(scout, delegate) → planner → parallel(worker, reviewer)    |
| Need external info                          | parallel(researcher × N) → synthesize                               |
```

---

## 7. The Decision Tree: Single-Agent Funnel

### Quote
```
## Decision Tree: Which Subagent?

Is this about external information (docs, APIs, web)?
  YES → researcher

Is this about finding/understanding existing code?
  YES → scout (thoroughness based on scope)

Is this creating a plan or design?
  YES → planner (requires scout context first)

Is this writing/modifying code?
  YES → worker (requires plan first)

Is this checking quality/correctness?
  YES → reviewer

Is this a small isolated task (<5 min)?
  YES → delegate

Need to build complex context from requirements + codebase?
  YES → context-builder
```

### Bottleneck Analysis
This decision tree has **critical structural flaws**:

1. **Single-branch funnel:** Every question has exactly one YES branch to one agent. There is no branch for "Can this be decomposed into independent sub-tasks?"
2. **No parallel decomposition node:** The tree never asks "Does this task have multiple independent angles?" before assigning a single agent.
3. **Context-builder as single-agent funnel:** The final branch sends complex context building to ONE context-builder, when the document's own Pattern H shows this should be parallel scouts.
4. **Sequential implications:** "planner (requires scout context first)" and "worker (requires plan first)" encode serial dependencies as the only option.

The tree encourages orchestrators to think "What ONE agent should I pick?" rather than "How do I decompose this into parallel sub-tasks?"

### Proposed Parallel Rewrite

```
## Decision Tree: Which Subagent(s)?

CAN this task be split into independent sub-tasks or angles?
  YES → Decompose and launch parallel agents. See Pattern H.
  
Is this about external information (docs, APIs, web)?
  YES → researcher. If multiple topics → parallel(researcher × N)

Is this about finding/understanding existing code?
  YES → scout. If large/unknown codebase → parallel(scout × N) per domain

Is this creating a plan or design?
  YES → planner. Input: ALL parallel scout/researcher outputs consolidated

Is this writing/modifying code?
  YES → worker. If plan has independent sections → parallel(worker × N)

Is this checking quality/correctness?
  YES → reviewer. FORK with worker when possible (see Pattern I)

Is this a small isolated task (<5 min)?
  YES → delegate

Need to build complex context from requirements + codebase?
  YES → parallel(scout × N per subsystem) → context-builder consolidates
```

---

## 8. Pattern C: Fork Review — Self-Contradiction Without Actual Forking

### Quote
```
### Pattern C: Fork Review (quality gate)

worker("Implement feature X per plan.md")
  // DON'T wait for worker to finish to launch reviewer
  // Launch reviewer in parallel with clear handoff instructions
  // Or: worker writes progress.md, reviewer reads plan.md + progress.md

Actual flow:

worker("Implement feature X", output="progress.md")
// After worker signals complete:
reviewer("Review progress.md against plan.md, fix issues directly")
```

### Bottleneck Analysis
**This is a self-contradiction.** The comments say:
- "DON'T wait for worker to finish"
- "Launch reviewer in parallel"

But the **"Actual flow"** shows exactly the opposite:
- Worker runs to completion
- "After worker signals complete" → reviewer launches

This is a **chain, not a fork**. The document never actually demonstrates forking mechanics. An orchestrator reading this will see the "Actual flow" and emulate a serial chain, ignoring the comments.

### Proposed Parallel Rewrite: Pattern I — True Fork Review (New Pattern)

```
### Pattern I: Fork Review (parallel quality gate)

// The reviewer is launched BEFORE the worker finishes.
// Both agents run simultaneously.

// Step 1: Worker starts implementation, writes incremental progress
worker("Implement feature X per plan.md", output="progress.md")

// Step 2: FORK — launch reviewer while worker is still running
// This is NOT "after worker signals complete"
// The reviewer begins reading plan.md immediately and polls progress.md
reviewer(
  "Read plan.md. Monitor progress.md as worker writes it.\n"
  "Review completed sections incrementally. Flag issues in review-notes.md.\n"
  "Do NOT wait for worker to finish.",
  reads=["plan.md", "progress.md"]
)

// Step 3: Worker incorporates review-notes.md into ongoing work
// Worker reads reviewer feedback while still implementing
worker(
  "Continue implementation. Read review-notes.md and fix flagged issues.\n"
  "Write final-progress.md",
  reads=["review-notes.md"]
)

// Step 4: Final reviewer pass on cumulative output
reviewer("Read final-progress.md and review-notes.md. Final verification.")
```

**Mechanics note for orchestrators:** In systems that don't support true process forking, "fork" means launching the reviewer agent in parallel (via `parallel()`) with an explicit instruction to begin work immediately and not block on worker completion.

---

## 9. Missing Pattern: Context Builder Should Be Parallel Scouts

### Quote
```
Need to build complex context from requirements + codebase?
  YES → context-builder
```

### Bottleneck Analysis
The document introduces `context-builder` as a single agent for complex context building. But the document's own Pattern H ("Parallel Branches → Consolidator") shows that complex context building SHOULD be parallel scouts per subsystem, followed by a single consolidator.

By funneling complex context to ONE agent, the tree undermines its own most powerful pattern. A single context-builder will have limited context window, limited thoroughness, and no parallel speedup.

### Proposed Fix
Remove `context-builder` as a standalone agent type in the Decision Tree. Replace with:

```
Need to build complex context from requirements + codebase?
  YES → parallel(scout × N per subsystem) → delegate/planner consolidates
```

---

## 10. Pattern H: Inconsistent Application in the Document

### Observation
Pattern H is the document's most sophisticated pattern (parallel scouts → consolidator → parallel workers → reviewer). However:

1. It is **only shown once** in the "Large-scale audit" scenario
2. It is **never referenced** as the default for any other pattern
3. Pattern A (the "default for implementation") is serial, while Pattern H (the "most powerful pattern") is parallel — this creates confusion about which is actually default

### Proposed Fix
Add a banner note to Pattern A:

```
### Pattern A: Recon → Plan → Execute (default for simple implementations)

// For complex implementations with multiple independent domains,
// use Pattern H (Parallel Branches → Consolidator) instead.
```

---

## 11. Anti-Pattern List: Inconsistent with Own Examples

### Quote
```
### ❌ "I'll do these 5 audits serially in one chain"

> "I'll launch scout 1, wait for it to finish, then launch scout 2, wait, then scout 3..."

**This is wrong.** If the scouts are independent (investigating different parts of the codebase), launch them ALL in parallel.
```

### Bottleneck Analysis
The document correctly identifies this as wrong, yet the "Refactor the API layer" scenario (10 serial steps) and Pattern A (4 serial steps) embody exactly this anti-pattern. The scout in Pattern A does "Find all files related to user auth" — one scout doing everything — when parallel scouts per domain would be better.

### Proposed Fix
Rewrite Pattern A to use parallel scouts by default, and add a note to the anti-pattern: *"This includes running one scout to map an entire subsystem when multiple parallel scouts per domain would be faster."*

---

## 12. Missing Guidance: Fork vs Chain Mechanics

### Observation
The document states:
- Context Budget Rules: "reviewer (always fork, never serial)"
- Pattern C comments: "DON'T wait for worker to finish to launch reviewer"
- Pattern C actual flow: Serial chain

But the document **never explains**:
1. What "fork" means mechanically (is it `parallel()`? Is it a background task?)
2. When to fork vs when to chain (dependency-based decision logic)
3. How to handle the case where the reviewer needs worker output that doesn't exist yet
4. Whether forking consumes more total context (two agents in parallel) vs less wall-clock time

### Proposed Addition

```
## Fork vs Chain Decision Guide

**Fork** (launch in parallel via `parallel()`):
- Use when agents can make progress on overlapping or independent subsets
- Use for reviewer + worker when reviewer can review plan.md while worker implements
- Trade-off: Higher context usage (two agents active), lower latency

**Chain** (launch sequentially with →):
- Use when Step N genuinely needs ALL output from Step N-1
- Use when there is a hard dependency (planner needs ALL scout outputs)
- Trade-off: Lower context usage (one agent active), higher latency

**The Golden Rule:**
If Step 2 can begin with PARTIAL output from Step 1 → FORK.
If Step 2 needs COMPLETE output from Step 1 → CHAIN.
```

---

## Consolidated Recommendations

| Priority | Finding | Fix |
|----------|---------|-----|
| P0 | Pattern A shows 4-agent serial chain as "default" | Rewrite with parallel scouts and parallel workers |
| P0 | Pattern C contradicts itself (says fork, shows chain) | Replace "Actual flow" with true parallel fork mechanics |
| P0 | Decision Tree funnels to single agent | Add decomposition branch; replace context-builder with parallel scouts |
| P1 | Context Budget Rules table shows serial as default | Add parallel notation to all rows |
| P1 | "Refactor API layer" is 10 serial steps | Rewrite using Pattern H |
| P1 | "Fix bug" is 5 serial steps | Rewrite with parallel investigation and forked review |
| P1 | Pattern G is blocking serial loop | Rewrite as forked incremental review |
| P2 | Missing Pattern I (True Fork Review) | Add new pattern showing `parallel(worker, reviewer)` |
| P2 | Missing Fork vs Chain mechanics | Add decision guide section |
| P2 | `context-builder` undermines Pattern H | Remove from Decision Tree or clarify as consolidator role |

---

## Conclusion

AGENTS.md preaches parallelism but practices serial chains in its own examples. The core patterns (A, G), the quick-reference table, and 6 of 9 scenario examples show serial chains of 3+ agents. The Decision Tree actively trains orchestrators to pick one agent rather than decompose into parallel sub-tasks. Pattern C is self-contradicting. The document needs structural revision to align its examples with its stated anti-patterns.
