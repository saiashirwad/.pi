# AGENTS.md Parallelism Audit — Consolidated Findings

**Date:** 2026-04-25
**Source Audits:**
- `audit-conflicts.md` — 10 contradictory rules
- `audit-serial.md` — 8 unnecessarily serial patterns
- `audit-vague.md` — 29 vague thresholds and undefined terms
- `audit-chains.md` — 12 single-agent chain anti-patterns

**Total Issues:** 59 distinct findings, consolidated into 10 ranked parallelism blockers.

---

## 1. Executive Summary: Top 10 Issues Ranked by Parallelism Impact

| Rank | Issue | Parallelism Damage | Priority |
|------|-------|-------------------|----------|
| 1 | **Pattern A is a 4-step serial chain labeled "default"** — It teaches every orchestrator to default to serial execution for the most common task type (implementation). Parallel scouts, parallel workers, and forked reviewers are all omitted. | Sets serial as the default mental model for all implementations. | **P0** |
| 2 | **"Analysis MUST be parallelized" but "consolidation MUST be single-agent"** — Consolidation *is* analysis. This creates a mandatory serial bottleneck immediately after every parallel phase, undermining Pattern H's scalability. | Every parallel scout network hits a single-agent wall. | **P0** |
| 3 | **Pattern C says "DON'T wait" but shows a serial chain** — The canonical fork-review pattern contradicts itself: comments say fork, "Actual flow" shows worker → reviewer serially. | Reviewers are never actually forked in practice. | **P0** |
| 4 | **Context Budget Rules table encodes serial chains as defaults** — "Need to implement anything" = scout→planner→worker. "Need to fix a bug" = 4-step serial chain. No fork notation, no parallel workers. | The quick-reference guide trains serial habits. | **P0** |
| 5 | **Decision Tree funnels every task to a single agent** — No decomposition branch. "Need to build complex context" → ONE context-builder, undermining Pattern H. | Prevents decomposition into parallel sub-tasks at the decision level. | **P0** |
| 6 | **All thresholds are fuzzy and exploitable** — "3 sentences," "<5 min," "coherent unit," "30 seconds" are subjective, enabling orchestrators to claim tasks are "small enough" to do serially. | Serial fallback is always justifiable. | **P1** |
| 7 | **"Independent" is undefined** — "Independent tasks," "independent angles," "independent sub-tasks" have no criteria. Orchestrators can always find a connection and avoid parallelizing. | The core justification for parallelism lacks a test. | **P1** |
| 8 | **Synthesis vs Analysis boundary is a gradient, not a rule** — Orchestrators learn to label their own analysis as "synthesis" to avoid delegating. Scenarios normalize this. | Disguised analysis bypasses delegation, creating serial work. | **P1** |
| 9 | **Grammar of permission, not obligation** — The document uses "can," "if," "use these" for parallel rules but "NEVER," "MUST NOT," "PROHIBITED" for serial/orchestrator rules. Parallelism is opt-in; serial is default. | The writing itself creates an asymmetric enforcement environment. | **P1** |
| 10 | **No fork mechanics, no concurrency limits, no failure protocol** — The document never explains *how* to fork, how many agents are safe, or what to do when one parallel agent fails. | Orchestrators avoid parallelism due to fear of the unknown. | **P2** |

---

## 2. Consolidated Findings by Theme

### Theme A: Conflicts (from `audit-conflicts.md`)

The document contains **10 direct self-contradictions**. The most damaging:

1. **Pattern C contradicts itself on fork review.** Comments say "DON'T wait"; actual flow says "After worker signals complete."
2. **Analysis MUST be parallel, but consolidation MUST be single-agent.** Consolidation requires comparing N sources, resolving conflicts, and creating new understanding — that's analysis.
3. **"Reviewer always fork, never serial" vs Pattern G's serial loop.** An iterative feedback cycle cannot be forked; the second reviewer needs the fixer's output.
4. **"Use delegate for comparisons" vs Pattern F uses researcher/scout.** Mismatches agent capabilities to tasks.
5. **"Write any file directly" is prohibited, but "MUST write consolidated artifact" is required.** Forces extra delegation latency after every parallel phase.
6. **Test failures → worker/reviewer, but build failure scenario uses delegate.** Weakens the agent-selection framework.
7. **"Don't read source files" vs scenario reads PLAN.md.** Creates ambiguity about planning documents.
8. **Anti-pattern "Serial is wrong" implicitly condemns Pattern A.** Pattern A *is* scout→plan→implement serially with legitimate dependencies; the anti-pattern should exempt dependency chains.
9. **Tool matrix forbids web_search, but Remember section says "use web_search_exa."** Extra delegation hop for external research.
10. **Orchestrator must synthesize but can't read source material.** The 1-file limit and "don't read source files" rules create a synthesis bottleneck.

### Theme B: Serialism (from `audit-serial.md`)

The document's own canonical patterns are unnecessarily serial:

1. **Pattern A:** 4-agent serial chain. No parallel scouts, no forked reviewer.
2. **Context Budget — "Need to implement anything":** scout→planner→worker. No mention of Pattern D (parallel workers).
3. **Context Budget — "Need to fix a bug":** 4-step serial chain. No forked reviewer, no parallel scouts.
4. **Pattern G (Self-Correction Loop):** Single serial loop. No parallel fix paths for independent issues.
5. **"Refactor the API layer" scenario:** 10 serial steps. Phases are gated serially even when independent.
6. **"Need to understand architecture":** Single scout. Pattern E (scout network) should be the default.
7. **The `→` arrow notation itself** encodes "must wait" visually. No `⇉` fork notation exists.

### Theme C: Vagueness (from `audit-vague.md`)

**29 instances** of fuzzy language enable serial fallback:

- **7 fuzzy thresholds:** "more than 3 sentences," "<5 min," "coherent unit," "30 seconds / ≤5 bullets," "≤1 short paragraph," "more than 5 lines," "exactly 1 file."
- **5 undefined "independent" terms:** "independent tasks" (Pattern D), "independent" (Pattern E), "independent sub-tasks" (Pattern H), "independent angles" (anti-pattern), "parallel if multiple areas."
- **5 synthesis/analysis ambiguities:** The boundary is a gradient; scenarios normalize analysis-as-synthesis.
- **5 optional-vs-required ambiguities:** "Use these patterns," "can be parallel," "parallel if," "use chains ONLY when," "no planner/worker needed — this is a decision."
- **7 missing guidance gaps:** No max parallel count, no token budget, no file-write conflict rules, no failure protocol, no rate limit discussion, no streaming vs batch guidance, no justification for "5–6 scouts."

### Theme D: Single-Agent Chains (from `audit-chains.md`)

**12 distinct single-agent serial chains** of 3+ agents with zero parallel branches:

1. Pattern A (4 steps)
2. Pattern G (loop, each iteration serial)
3. "Fix this bug" scenario (5 steps)
4. "Refactor the API layer" scenario (10 steps — worst offender)
5. "Why is the build failing?" scenario (6 steps)
6. Context Budget Rules table (implicit serial chains)
7. Decision Tree (single-agent funnel with no decomposition branch)
8. Pattern C (never actually demonstrates forking)
9. `context-builder` as single-agent (undermines Pattern H)
10. Pattern H referenced only once, never as default
11. Anti-pattern list inconsistent with own examples
12. Missing Fork vs Chain mechanics section

---

## 3. Concrete Proposed Edits

For each P0/P1 issue, the exact current text, proposed replacement, and rationale.

### Edit 1: Rewrite Pattern A (P0)

**Current text:**
```
### Pattern A: Recon → Plan → Execute (default for implementation)

scout("Find all files related to user auth, return context.md")
  → planner("Read context.md, create plan.md for adding OAuth")
  → worker("Read context.md and plan.md, implement the changes")
  → reviewer("Read plan.md and verify implementation")
```

**Proposed replacement:**
```
### Pattern A: Recon → Plan → Execute (default for implementation)

// Step 1: Parallel reconnaissance across independent domains
parallel(
  scout("Find auth-related files, routes, middleware, and tests. Write auth-context.md"),
  scout("Find user DB schema and session/token storage. Write auth-db-context.md")
)

// Step 2: Planner reads ALL parallel contexts, produces unified plan
→ planner("Read auth-context.md and auth-db-context.md. Create plan.md with independent implementation units.")

// Step 3: Parallel workers on independent plan sections
→ parallel(
    worker("Implement auth core per plan.md section 1, write auth-progress.md"),
    worker("Implement OAuth flow per plan.md section 2, write oauth-progress.md"),
    worker("Add tests per plan.md section 3, write test-progress.md")
  )

// Step 4: Forked reviewer starts as soon as workers begin
// Do NOT wait for all workers to finish
⇉ reviewer("Read plan.md and monitor *-progress.md files. Review incrementally. Write review-notes.md")
```

**Rationale:** Pattern A is the "default for implementation." By teaching serial scouts, a single worker, and a chained reviewer, the document trains orchestrators to default to serial execution. The rewrite uses parallel scouts, parallel workers, and a forked reviewer — matching the document's own advanced patterns but making them the default.

---

### Edit 2: Fix Pattern C — True Fork Review (P0)

**Current text:**
```
### Pattern C: Fork Review (quality gate)

worker("Implement feature X", output="progress.md")
// After worker signals complete:
reviewer("Review progress.md against plan.md, fix issues directly")
```

**Proposed replacement:**
```
### Pattern C: Fork Review (quality gate)

// The reviewer is launched BEFORE the worker finishes.
// Both agents run simultaneously via parallel().

// Step 1: Worker starts implementation, writes incremental progress
worker("Implement feature X per plan.md", output="progress.md")

// Step 2: FORK — launch reviewer while worker is still running
// This is NOT "after worker signals complete"
// The reviewer begins reading plan.md immediately and polls progress.md
parallel(
  worker("Continue implementing remaining sections, append to progress.md"),
  reviewer(
    "Read plan.md. Monitor progress.md as worker writes it.\n"
    "Review completed sections incrementally. Flag issues in review-notes.md.\n"
    "Do NOT wait for worker to finish.",
    reads=["plan.md", "progress.md"]
  )
)

// Step 3: Worker incorporates review-notes.md into ongoing work
worker(
  "Read review-notes.md. Fix flagged issues in completed sections. Continue remaining work. Write final-progress.md",
  reads=["review-notes.md"]
)

// Step 4: Final reviewer pass on cumulative output
reviewer("Read final-progress.md and review-notes.md. Final verification.")
```

**Rationale:** The current Pattern C is self-contradictory: it says "DON'T wait" but shows a serial chain. The rewrite makes fork mechanics explicit using `parallel()`, clarifies that the reviewer polls progress incrementally, and keeps the worker active while review happens.

---

### Edit 3: Allow Parallel Consolidation (P0)

**Current text:**
```
**Rule:** If a chain step produces N independent artifacts, the next step in the chain should be a SINGLE agent that reads all N and produces one consolidated output.
```

**Proposed replacement:**
```
**Rule:** If a chain step produces N independent artifacts, the next step SHOULD be a SINGLE agent that reads all N and produces one consolidated output — UNLESS the artifacts can be partitioned into independent consolidation domains.

**Pattern I — Hierarchical Consolidation (when domains are independent):**
```
parallel(scouts) → parallel(mid-level consolidators per domain) → single(final consolidator)
```

Use hierarchical consolidation when:
- Scouts investigated disjoint subsystems (e.g., auth, DB, API, frontend)
- Each subsystem's consolidation does not require cross-subsystem knowledge
- A final single agent merges the mid-level consolidated artifacts

**Example:**
```
parallel(
  scout("Audit auth system, write auth-audit.md"),
  scout("Audit DB layer, write db-audit.md"),
  scout("Audit API routes, write api-audit.md"),
  scout("Audit frontend, write frontend-audit.md")
)
→ parallel(
    delegate("Consolidate auth + DB findings, write backend-audit.md", reads=["auth-audit.md", "db-audit.md"]),
    delegate("Consolidate API + frontend findings, write client-audit.md", reads=["api-audit.md", "frontend-audit.md"])
  )
→ delegate("Merge backend-audit.md and client-audit.md. Write master-audit.md")
```
```

**Rationale:** The current rule forces a single agent to read 4–6 long scout reports, creating a context bottleneck. Hierarchical consolidation preserves parallelism through the merge phase when subsystems are independent, cutting consolidation latency by 50–75%.

---

### Edit 4: Rewrite Context Budget Rules Table (P0)

**Current text:**
```
| Need to implement anything                  | `scout` → `planner` → `worker`                    |
| Need to fix a bug                           | `scout` → `planner` → `worker` → `reviewer`       |
| Need external info                          | `researcher` (parallel if multiple topics)        |
| Need to understand architecture             | `scout` → synthesize                              |
```

**Proposed replacement:**
```
| Need to implement anything                  | parallel(`scout` × N) → `planner` → parallel(`worker` × M) ⇉ `reviewer` |
| Need to fix a bug                           | parallel(`scout`, `delegate`) → `planner` (skip if trivial) → `worker` ⇉ `reviewer` |
| Need external info                          | parallel(`researcher` × N) → `delegate` consolidates                            |
| Need to understand architecture             | parallel(`scout` × N, one per subsystem) → `delegate` consolidates              |
```

**Add notation key:**
```
**Notation:** `→` = chain (wait for previous step). `⇉` = fork (launch in parallel, do not wait).
```

**Rationale:** The current table shows serial arrows as the default for implementation and bug fixes. The rewrite makes parallel the default notation and adds the `⇉` fork symbol for reviewers. The "parallel if multiple topics" parenthetical becomes mandatory parallel for N > 1.

---

### Edit 5: Rewrite Decision Tree with Decomposition Branch (P0)

**Current text:**
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

**Proposed replacement:**
```
## Decision Tree: Which Subagent(s)?

**STEP 0 — Decomposition Check (MANDATORY):**
CAN this task be split into independent sub-tasks, angles, or domains?
  YES → Launch parallel agents per Pattern H. Do NOT pick one agent.
  
Is this about external information (docs, APIs, web)?
  YES → researcher. If multiple topics → parallel(researcher × N)

Is this about finding/understanding existing code?
  YES → scout. If large/unknown codebase → parallel(scout × N) per domain

Is this creating a plan or design?
  YES → planner. Input: ALL parallel scout/researcher outputs consolidated

Is this writing/modifying code?
  YES → worker. If plan has independent sections → parallel(worker × N)

Is this checking quality/correctness?
  YES → reviewer. FORK with worker when possible (see Pattern C)

Is this a small isolated task (touches 1 file, 1 edit, 0 research)?
  YES → delegate

Need to build complex context from requirements + codebase?
  YES → parallel(scout × N per subsystem) → delegate/planner consolidates
```

**Rationale:** The current tree funnels every task to a single agent with no decomposition branch. By adding "STEP 0 — Decomposition Check" at the top, the tree forces orchestrators to consider parallelization before selecting an agent type. The `context-builder` single-agent funnel is replaced with parallel scouts + consolidator.

---

### Edit 6: Replace Fuzzy Thresholds with Hard Rules (P1)

**Current text:**
```
"Rule of thumb: If a task would take more than 3 sentences to describe to a human engineer, delegate it."
```

**Proposed replacement:**
```
**HARD RULE — When to delegate:**
If a task requires more than ONE of the following, delegate it:
- More than 1 file to read or modify
- More than 1 tool call (read, edit, write, bash, web_search)
- Any comparison between two or more documents
- Any reasoning about cause and effect
- Any decision that affects subsequent steps
NO EXCEPTIONS. Sentence-counting is prohibited.
```

**Current text:**
```
"Is this a small isolated task (<5 min)?"
```

**Proposed replacement:**
```
**HARD RULE — "Small isolated task" definition:**
A task qualifies as "small isolated" ONLY if it meets ALL of these:
- Touches exactly 1 file
- Requires exactly 1 edit() call with ≤3 non-overlapping replacements
- Requires 0 external research
- Has 0 dependencies on other pending tasks
- Can be verified in 1 bash command
If ANY condition fails, it is NOT small. Delegate to worker.
```

**Current text:**
```
"worker (one worker per coherent unit)"
```

**Proposed replacement:**
```
**HARD RULE — Multiple file updates:**
When updating multiple files, use ONE worker per file UNLESS:
- The files are generated from a single template (then 1 worker for the template + 1 bash command to regenerate)
- The edit is identical across all files (then 1 worker + 1 bash script to apply)
In ALL other cases: 1 worker per file, launched in parallel.
"Coherent unit" is BANNED from the vocabulary.
```

**Current text:**
```
"Synthesis (YOUR job — 30 seconds, ≤5 bullets)"
"≤5 bullets or ≤1 short paragraph"
```

**Proposed replacement:**
```
**HARD RULE — Chat synthesis limits:**
- Maximum 80 words total across ALL messages in the synthesis turn
- Maximum 3 sentences
- No tables, no lists, no code blocks
- Must begin with "Done:", "Blocked:", or "Needs input:"
If more detail is required, write it to a file and reference the path.
```

**Rationale:** Fuzzy thresholds ("3 sentences," "<5 min," "coherent unit," "30 seconds") are subjective and exploitable. Hard rules with objective, countable criteria remove the orchestrator's ability to justify serial fallback by reinterpreting the threshold.

---

### Edit 7: Define "Independent" with a 4-Point Test (P1)

**Current text:**
```
"// When plan has independent tasks"
```

**Proposed replacement:**
```
**HARD RULE — Independence Test (applies to tasks, scouts, workers, and angles):**
Two tasks are INDEPENDENT if and only if ALL four conditions hold:
1. They do NOT read or write the same file
2. They do NOT produce outputs consumed by each other
3. They do NOT modify the same data structure, table, or API contract
4. Failure of one does NOT prevent the other from being valid

If ALL four conditions hold, tasks MUST be parallel. No exceptions.
If ANY condition fails, tasks are dependent and must be chained (→).
```

**Add to analysis angle definition:**
```
**HARD RULE — Analysis angles are ALWAYS independent:**
When analyzing a single document (PRD, plan, spec, audit), the following angles are predefined as independent:
- Task sizing / effort estimation
- Task sequencing / dependencies
- Acceptance criteria / test gaps
- Risk identification
- Code quality / architecture review
- Performance / scalability assessment

You MUST launch parallel delegates for ALL applicable angles.
Do NOT argue that angles "influence each other" as an excuse for serial execution.
```

**Rationale:** "Independent" is the core justification for parallelism but has no definition. The 4-point test gives an objective check. Predefining analysis angles as independent removes the excuse that "risks depend on sizing" or similar arguments.

---

### Edit 8: Synthesis vs Analysis Litmus Test (P1)

**Current text:**
```
"Synthesis is summarizing subagent output for the user in chat. It is SHORT. It does not create new information."
"Analysis is creating new understanding from multiple sources."
```

**Proposed replacement:**
```
## Synthesis vs Analysis — Litmus Test

Before performing any task, ask:
1. Am I combining information from 2+ sources? → **ANALYSIS → Delegate**
2. Am I evaluating which source is correct? → **ANALYSIS → Delegate**
3. Am I deciding what to do next based on findings? → **ANALYSIS → Delegate**
4. Am I stating a single fact from a single source? → **SYNTHESIS → Allowed**
5. Am I reading a file to check what it says? → **ANALYSIS → Delegate**

If ANY of questions 1–3 is true, default to **ANALYSIS** and delegate.
If ambiguous, default to **ANALYSIS**.

**HARD RULE — After parallel research/scout steps, you may NOT "synthesize findings."**
Instead:
1. Write a file listing each subagent's output path
2. Spawn a planner to read all outputs and create plan.md
3. Synthesize ONLY the planner's single output on the next turn

The orchestrator NEVER merges multiple subagent outputs directly.
```

**Rationale:** The current definitions are a gradient. Orchestrators learn to label comparison and decision-making as "synthesis" to avoid delegating. The litmus test makes the boundary objective and removes the merge-multiple-outputs loophole.

---

### Edit 9: Mandatory Language for Parallelism (P1)

**Current text (scattered throughout):**
```
"Use these patterns"
"can be parallel"
"parallel if multiple areas"
"Use chains ONLY when steps have dependencies"
"when parallel would work"
```

**Proposed replacement:**
```
**HARD RULE — Mandatory parallelism language:**
Replace all permissive language with mandatory language:
- "can be parallel" → "MUST be parallel"
- "parallel if multiple areas" → "MUST use parallel scouts for >1 area"
- "use these patterns" → "MUST select the matching mandatory pattern"
- "when parallel would work" → "when parallel is required"
- "independent tasks can be parallel" → "independent tasks MUST be parallel"

Any rule written with "can," "may," "if you want," "consider," or "optional"
in the context of parallelism is BANNED.
```

**Rationale:** The document's grammar creates an asymmetric environment: serial rules are prohibitions ("NEVER," "MUST NOT"), but parallel rules are permissions ("can," "if"). This makes serial the default and parallel opt-in. Mandatory language flips the default.

---

### Edit 10: Add Fork vs Chain Mechanics Section (P2)

**New section:**
```
## Fork vs Chain Decision Guide

**Fork** (launch in parallel via `parallel()`):
- Use when agents can make progress on overlapping or independent subsets
- Use for reviewer + worker when reviewer can review plan.md while worker implements
- Trade-off: Higher context usage (two agents active), lower latency

**Chain** (launch sequentially with `→`):
- Use when Step N genuinely needs ALL output from Step N-1
- Use when there is a hard dependency (planner needs ALL scout outputs)
- Trade-off: Lower context usage (one agent active), higher latency

**The Golden Rule:**
If Step 2 can begin with PARTIAL output from Step 1 → **FORK**.
If Step 2 needs COMPLETE output from Step 1 → **CHAIN**.

**Notation:**
- `→` = chain (wait for completion)
- `⇉` = fork (launch in parallel, do not wait)
```

**Rationale:** The document states "reviewer always fork" and "DON'T wait" but never explains *how* to fork or when forking is appropriate vs chaining. This section provides the missing mechanics.

---

### Edit 11: Add Concurrency Limits and Failure Protocol (P2)

**New section:**
```
## Parallel Execution Limits and Failure Protocol

**Maximum parallel subagent counts:**
- Maximum 8 scouts in parallel per audit
- Maximum 6 workers in parallel per implementation phase
- Maximum 4 researchers in parallel per research topic
- Maximum 10 total parallel subagents across ALL types per orchestrator turn
If more are needed, batch them: launch max, wait for consolidation, then launch next batch.

**Token budgeting:**
- Each parallel agent gets a task description of maximum 500 tokens
- Each parallel agent's output should target maximum 2000 tokens
- If a task needs more than 2000 tokens of output, split it into 2 parallel agents
- The orchestrator's context budget for coordination is 4000 tokens per turn
- Exceeding these limits is preferable to serial execution

**Parallel agent failure protocol:**
1. If 1 agent in a parallel batch fails, relaunch ONLY that agent
2. If >50% of agents in a batch fail, STOP and spawn a delegate to diagnose
3. Do NOT relaunch the entire batch because of 1 failure
4. Do NOT convert a parallel batch to serial execution after failure
5. Document failures in decisions.md for future reference

**After launching a parallel batch:**
1. You MUST wait for ALL agents to complete before launching the next step
2. You MAY NOT process results individually as they arrive
3. You MAY NOT launch follow-up agents for individual parallel results
4. The next step MUST be a SINGLE consolidator that reads ALL outputs
```

**Rationale:** Orchestrators avoid parallelism due to fear of crashes, overuse, or confusion about what to do when one agent fails. Hard limits and a failure protocol remove these barriers.

---

## 4. New Proposed Section: Parallelism-First Decision Protocol

This section replaces vague thresholds with a hard-rule decision tree.

```
# Parallelism-First Decision Protocol

## Step 0: Decomposition (ALWAYS FIRST)
Before selecting any agent, ask: "Can this be split into independent pieces?"
If YES → Use Pattern H. Do not proceed to Step 1.
If NO → Proceed to Step 1.

## Step 1: Task Classification
Classify the task using OBJECTIVE criteria only. Subjectivity is prohibited.

| Criterion | Threshold | Action if exceeded |
|-----------|-----------|-------------------|
| Files touched | >1 | MUST use parallel workers (Pattern D) |
| Tool calls needed | >1 | MUST delegate |
| Research sources | >1 | MUST use parallel researchers (Pattern B) |
| Subsystems involved | >1 | MUST use parallel scouts (Pattern E) |
| Analysis angles | >1 | MUST use parallel delegates (Pattern H) |
| Output tokens needed | >2000 | MUST split into parallel agents |

## Step 2: Agent Selection
After confirming the task cannot be decomposed (Step 0) and checking thresholds (Step 1), select the single agent matching the task type.

## Step 3: Execution Mode
After selecting the agent, determine execution mode:

- **Chain (→):** ONLY if the next step needs COMPLETE output from the previous step
- **Fork (⇉):** If the next step can begin with PARTIAL output or runs on a disjoint domain
- **Parallel (parallel()):** If two or more agents are independent per the 4-Point Independence Test

## Step 4: Review (ALWAYS FORK)
Every implementation MUST have a reviewer.
The reviewer MUST be forked (⇉) in parallel with the worker when possible.
The reviewer MUST NOT wait for the worker to signal completion.

## Violation Detection
If you find yourself doing ANY of the following, you have violated this protocol:
- Picking one agent without checking for decomposition first
- Using "can be parallel" to justify serial execution
- Launching a reviewer after the worker finishes
- Running one scout to map an entire multi-subsystem codebase
- Merging multiple subagent outputs in chat instead of delegating consolidation
```

---

## 5. Proposed Rewrite of Pattern A — Parallel-By-Default

See **Edit 1** above for the full rewrite. Summarized here:

```
### Pattern A: Recon → Plan → Execute (default for implementation)

parallel(
  scout("Find auth-related files, routes, middleware, and tests. Write auth-context.md"),
  scout("Find user DB schema and session/token storage. Write auth-db-context.md")
)
→ planner("Read auth-context.md and auth-db-context.md. Create plan.md with independent implementation units.")
→ parallel(
    worker("Implement auth core per plan.md section 1, write auth-progress.md"),
    worker("Implement OAuth flow per plan.md section 2, write oauth-progress.md"),
    worker("Add tests per plan.md section 3, write test-progress.md")
  )
⇉ reviewer("Read plan.md and monitor *-progress.md files. Review incrementally. Write review-notes.md")
```

**Key changes from serial Pattern A:**
1. **Parallel scouts** (2+ scouts per default implementation, not 1)
2. **Planner receives multiple parallel contexts** and designs independent implementation units
3. **Parallel workers** on independent plan sections
4. **Forked reviewer** (⇉) that monitors progress incrementally, not after completion
5. **No arrow between worker and reviewer** — they overlap in time

**When to use the serial variant:**
ONLY when the implementation touches exactly 1 file in exactly 1 subsystem with no independent sections. In all other cases, use the parallel Pattern A above.

---

## 6. Priority Ranking Summary

### P0 — Fix Immediately (Structural / Default Behavior)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | Pattern A is 4-step serial chain | Patterns section | Rewrite with parallel scouts, parallel workers, forked reviewer |
| 2 | Analysis parallel but consolidation single-agent | Pattern H + Analysis Rule | Add Pattern I (Hierarchical Consolidation) |
| 3 | Pattern C says fork but shows chain | Pattern C | Replace "Actual flow" with true `parallel()` fork mechanics |
| 4 | Context Budget table defaults to serial | Context Budget Rules | Add `parallel()` and `⇉` notation to all rows |
| 5 | Decision Tree funnels to single agent | Decision Tree | Add "Decomposition Check" as Step 0; remove `context-builder` as single-agent |

### P1 — Fix Soon (Thresholds, Definitions, Language)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 6 | Fuzzy thresholds (3 sentences, <5 min, coherent unit, etc.) | Throughout | Replace with HARD RULEs using objective criteria |
| 7 | "Independent" undefined | Patterns D, E, H; anti-patterns | Add 4-Point Independence Test |
| 8 | Synthesis vs Analysis gradient | Synthesis/Analysis section | Add Litmus Test; ban merging multiple outputs in chat |
| 9 | Permissive grammar for parallel rules | Throughout | Replace "can/may/if" with "MUST/PROHIBITED/BANNED" |
| 10 | Anti-pattern "Serial is wrong" condemns Pattern A | Anti-patterns | Add qualifier: "when steps are independent" |
| 11 | "Don't read source files" vs read PLAN.md | Scenarios + anti-patterns | Clarify: planning docs are allowed as 1-file budget |
| 12 | Tool matrix forbids web_search, Remember says use it | Tool matrix + Remember | Clarify Remember bullets are for subagents |
| 13 | "Write files prohibited" vs "MUST write artifacts" | Absolute Prohibitions + Handoff | Allow orchestrator to write lightweight coordination artifacts |
| 14 | Reviewer "always fork, never serial" vs Pattern G serial loop | Context Budget + Pattern G | Reframe: "fork when possible; serial loops acceptable for iterative feedback" |

### P2 — Nice to Have (Mechanics, Limits, Guidance)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 15 | Missing fork mechanics | Nowhere | Add Fork vs Chain Decision Guide |
| 16 | Missing concurrency limits | Nowhere | Add Parallel Execution Limits section |
| 17 | Missing failure protocol | Nowhere | Add failure recovery rules |
| 18 | Missing token budget guidance | Nowhere | Add per-agent token targets |
| 19 | Missing file-write conflict rules | Nowhere | Add pre-parallel verification rules |
| 20 | `→` arrow encodes serial visually | Throughout | Add `⇉` fork notation and use it |
| 21 | Pattern G serial loop for independent fixes | Pattern G | Add parallel worker dispatch for independent fix batches |
| 22 | "Refactor API layer" scenario is 10 serial steps | Scenarios | Rewrite using Pattern H |
| 23 | "Fix bug" scenario is 5 serial steps | Scenarios | Rewrite with parallel investigation and forked review |
| 24 | "Build failing" scenario is 6 serial steps | Scenarios | Rewrite with parallel investigation |

---

## 7. Conclusion

AGENTS.md preaches parallelism but practices serialism in its defaults. The root cause is threefold:

1. **Default patterns teach serial chains.** Pattern A, the Context Budget Rules table, and 6 of 9 scenarios show serial execution as normal.
2. **Parallel rules are written as permissions, not obligations.** "Can be parallel" vs "MUST NOT be serial" creates an asymmetric environment where serial is the safe default.
3. **Core terms are undefined.** "Independent," "coherent unit," "synthesis," and "<5 min" have no objective criteria, allowing orchestrators to justify serial fallback indefinitely.

**The fix:** Rewrite Pattern A to be parallel-by-default, add the Parallelism-First Decision Protocol, replace all fuzzy thresholds with hard rules, define "independent" with the 4-Point Test, and switch all parallel guidance from permissive to mandatory language.
