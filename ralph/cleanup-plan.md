# AGENTS.md Cleanup Plan

Generated from audits:
- `audit-recon-analysis.md`
- `audit-chains-parallel.md`
- `audit-anti-patterns-persistence.md`
- `audit-consolidation-quality.md`

---

## P0 (Critical)

### P0.1 Harden Pattern H consolidation rule from "should" to "MUST"
- **Section:** `Delegation Patterns` → `Pattern H` → `Rule`
- **Current text:**
  > `If a chain step produces N independent artifacts, the next step in the chain should be a SINGLE agent that reads all N and produces one consolidated output.`
- **Proposed fix:** Replace `should` with `MUST`:
  > `If a chain step produces N independent artifacts, the next step in the chain MUST be a SINGLE agent that reads all N and produces one consolidated output.`
- **Rationale:** `audit-chains-parallel` §5.2 observed orchestrators skipping consolidators because the weak modal "should" made the rule feel optional. This produces integration chaos when parallel workers lack a coherence gate.

### P0.2 Make parallel execution the explicit default
- **Section:** `Context Budget Rules` → `Rule of thumb`
- **Current text:**
  > `If a task would take more than 3 sentences to describe to a human engineer, delegate it.`
- **Proposed fix:** Append the parallel default:
  > `If a task would take more than 3 sentences to describe to a human engineer, delegate it and default to parallel execution unless dependencies prove otherwise.`
  >
  > `Parallel execution is the default for all non-trivial tasks. Serial chains require explicit justification based on proven dependencies.`
- **Rationale:** `audit-chains-parallel` §5.1 notes that without a positive default mandate, serial chains become the implicit norm, directly undermining the parallelization mandate.

### P0.3 Close the bash reconnaissance laundering loophole
- **Section:** `Absolute Prohibitions` → bash allowance
- **Current text:**
  > `bash` (only to launch processes or check a single specific file you already know the path to)
- **Proposed fix:** Restrict the source of the path:
  > `bash` (only to launch processes or check a single specific file whose path was provided by the user in their original prompt — **not** paths discovered via subagents)
- **Rationale:** `audit-recon-analysis` Gap 2 demonstrates a laundering path: a scout returns `/src/auth.ts`, then the orchestrator claims it "already knows the path" and reads the file directly, bypassing the reconnaissance ban.

### P0.4 Eliminate Exa tool ambiguity / contradiction
- **Section:** `Tool Usage Matrix` (add rows) and `Remember` preamble
- **Current text (Matrix):** `web_search_exa` and `get_code_context_exa` are missing entirely.
- **Current text (Remember preamble):**
  > `use exa `web_search_exa` for web and `get_code_context_exa` for code/docs for external search summarize with sources`
- **Proposed fix:**
  1. Add to matrix:
     - `web_search_exa` → Orchestrator: `❌ NEVER — delegate to researcher` | Subagent: `✅ Yes, if in their role`
     - `get_code_context_exa` → Orchestrator: `❌ NEVER — delegate to researcher or scout` | Subagent: `✅ Yes, if in their role`
  2. Rewrite preamble line:
     > `Delegate external search to the `researcher` subagent, which uses exa `web_search_exa` for web and `get_code_context_exa` for code/docs. The orchestrator never invokes Exa tools directly.`
- **Rationale:** `audit-recon-analysis` Gap 3 shows the preamble can be read as direct orchestrator permission, creating a contradiction with the matrix and bypassing the `researcher` mandate.

### P0.5 Resolve Pattern C contradiction (fork vs serial)
- **Section:** `Delegation Patterns` → `Pattern C`
- **Current text:** The comments state:
  > `DON'T wait for worker to finish to launch reviewer`
  > `Launch reviewer in parallel with clear handoff instructions`
  But the **Actual flow** block shows:
  ```
  worker("Implement feature X", output="progress.md")
  // After worker signals complete:
  reviewer("Review progress.md against plan.md, fix issues directly")
  ```
- **Proposed fix:** Replace the Actual flow with a true fork and explicit fallback note:
  ```
  // Launch worker and reviewer in parallel with a file-watch handoff
  parallel(
    worker("Implement feature X per plan.md", output="progress.md"),
    reviewer("Poll for progress.md; when found, review it against plan.md and fix issues directly")
  )
  // If the runtime cannot support parallel launch after worker starts, launch the reviewer
  // immediately after the worker begins (do not wait for completion).
  ```
- **Rationale:** `audit-consolidation-quality` §3 notes Pattern C contradicts itself: the comment demands parallel forking while the example models serial execution, undermining the "always fork, never serial" rule.

### P0.6 Document the Pattern G exception to "always fork, never serial"
- **Section:** `Context Budget Rules` table row `Need to verify quality` and `Delegation Patterns` → `Pattern G`
- **Current text (table):**
  > `reviewer` (always fork, never serial)
- **Current text (Pattern G):** No exception noted; the pattern shows a serial `worker → reviewer → worker → reviewer` loop.
- **Proposed fix:**
  1. In the table, change to:
     > `reviewer` (always fork, never serial — **except self-correction loops** where each iteration depends on the previous reviewer's output)
  2. In Pattern G header, add:
     > `**Exception:** Self-correction loops are inherently serial because each iteration depends on the previous reviewer's output. Limit to 3 iterations (see P1.5).`
- **Rationale:** `audit-consolidation-quality` §5.1 shows Pattern G is serial, yet the doc states an absolute "always fork" rule with no documented exception, creating confusion and hidden loopholes.

---

## P1 (Major)

### P1.1 Rewrite "Refactor the API layer" example to use parallel scouts
- **Section:** `Examples by Scenario` → `Refactor the API layer`
- **Current text:** Step 1 is a single serial scout:
  > `scout("Thorough: Map entire API layer — all files, dependencies, test coverage")`
- **Proposed fix:** Replace Step 1 with parallel scouts and a consolidator:
  ```
  parallel(
    scout("Thorough: Map auth endpoints and middleware, write auth-api-audit.md"),
    scout("Thorough: Map data endpoints and middleware, write data-api-audit.md"),
    scout("Thorough: Map test coverage for API layer, write api-test-audit.md")
  )
  → planner("Read all api-audit files, create unified refactoring plan with phases")
  ```
  Renumber subsequent steps accordingly.
- **Rationale:** `audit-chains-parallel` §3.2 identifies this as the documentation modeling the exact anti-pattern it prohibits (using a single scout for a massive task).

### P1.2 Add parallel-scout guidance to "Fix this bug" example
- **Section:** `Examples by Scenario` → `Fix this bug where login fails`
- **Current text:** Step 1 is a single serial scout:
  > `scout("Find login-related code and error handling. What changed recently?")`
- **Proposed fix:** After Step 1, add:
  > `// For non-trivial bugs, parallelize scouts: scout A for the failing code path, scout B for recent changes, scout C for test coverage. Then consolidate before planning.`
- **Rationale:** `audit-chains-parallel` §3.1 notes the example models a pure serial chain where parallel scouts would improve both speed and investigation depth.

### P1.3 Add consolidator step to "Zustand or Redux" decision example
- **Section:** `Examples by Scenario` → `Should we use Zustand or Redux?`
- **Current text:**
  > `2. // No planner/worker needed — this is a decision, not implementation`
  > `3. Synthesize: Present tradeoff matrix...`
- **Proposed fix:** Insert a true Step 2 and renumber:
  ```
  2. delegate("Read research.md and scout-context.md. Produce tradeoff matrix in ralph/decisions.md")
  3. Synthesize from ralph/decisions.md: Present recommendation in ≤5 bullets
  ```
- **Rationale:** `audit-chains-parallel` §3.3 and `audit-consolidation-quality` §2 note the example shows the orchestrator doing direct analysis/synthesis from multiple sources, violating `ANALYSIS IS NEVER YOUR JOB`.

### P1.4 Add minimum parallelism threshold for analysis tasks
- **Section:** `Delegation Patterns` → `Analysis tasks MUST be parallelized` heading
- **Current text:**
  > `Analysis tasks MUST be parallelized.`
- **Proposed fix:** Append:
  > `Decompose analysis into at least 3 independent angles executed in parallel. Fewer than 3 angles indicates the task is either trivial (use a single \`delegate\`) or not yet fully decomposed.`
- **Rationale:** `audit-chains-parallel` §1.2 notes that without a minimum threshold, orchestrators can technically comply with only 2 parallel agents, producing shallow analysis.

### P1.5 Add Pattern G guardrails (iteration caps and escalation)
- **Section:** `Delegation Patterns` → `Pattern G`
- **Current text:**
  > `Loop until reviewer approves`
- **Proposed fix:** Replace with:
  ```
  // Loop until reviewer approves OR maximum 3 iterations reached
  // If iteration 3 fails, escalate to planner to restructure the task
  // Each re-review should verify fixes only, not expand scope
  ```
- **Rationale:** `audit-consolidation-quality` §5 notes uncapped loops risk infinite iteration, context exhaustion, and reviewer-worker deadlock.

### P1.6 Define reviewer authority limits
- **Section:** `Delegation Patterns` → `Pattern C` (Actual flow)
- **Current text:**
  > `fix issues directly`
- **Proposed fix:** Add immediately after:
  > `Reviewers may fix typos, minor logic errors, and style issues directly. Architectural changes, design flaws, or feature omissions must be escalated to the orchestrator via review-notes.md for a new planner/worker cycle.`
- **Rationale:** `audit-consolidation-quality` §4.4 notes that unlimited "fix directly" authority leads to reviewer scope creep and architectural overreach.

### P1.7 Add violation handling / circuit-breaker protocol
- **Section:** New section after `Anti-Patterns (DO NOT DO THESE)`: `## Violation Handling & Recovery`
- **Current text:** None.
- **Proposed fix:** Insert:
  ```markdown
  ## Violation Handling & Recovery

  If you detect that you have violated a rule (e.g., read a second file, ran bash reconnaissance, edited a file directly), **STOP immediately**. Do not use the violation to justify further direct work.

  1. Synthesize the violation in ≤5 bullets.
  2. Write a recovery note to `ralph/violation-log.md`.
  3. Delegate the remaining work to the appropriate subagent.
  4. Never attempt to "fix" a violation by doing more work yourself.
  ```
- **Rationale:** `audit-anti-patterns-persistence` §3.4 notes the absence of a remediation protocol means orchestrators often compound violations by trying to recover manually.

### P1.8 Add subagent failure handling protocol
- **Section:** New subsection under `Context Budget Rules` or immediately after `Violation Handling & Recovery`
- **Current text:** None.
- **Proposed fix:** Insert:
  ```markdown
  ### Subagent Failure Protocol

  If a subagent fails, times out, or produces incoherent output:
  1. Do not retry the same agent with the same prompt more than once.
  2. If the retry fails, escalate to a `planner` to diagnose whether the task is oversized, under-specified, or requires a different agent type.
  3. Write the failure and diagnosis to `ralph/decisions.md`.
  ```
- **Rationale:** `audit-anti-patterns-persistence` §3.1 (missing "skip error handling" anti-pattern) and §3.4 show orchestrators ignoring failures or looping indefinitely.

---

## P2 (Minor)

### P2.1 Clarify task classification vs deep analysis
- **Section:** `Synthesis vs Analysis — The Critical Distinction`
- **Current text:** No explicit boundary for classification.
- **Proposed fix:** Add paragraph:
  > `Task classification (deciding which subagent to use based on the user's request) is part of your role and should take <30 seconds. Deep analysis (evaluating findings, comparing documents, making recommendations) is never your role.`
- **Rationale:** `audit-recon-analysis` Gap 8 notes ambiguity leads to over-delegation of trivial tasks or under-delegation of complex analysis disguised as classification.

### P2.2 Add trivial-input exception to mandatory subagent launch
- **Section:** Preamble / `Absolute Prohibitions`
- **Current text:**
  > `**After reading the user's input, your NEXT action MUST be `subagent()`.**`
- **Proposed fix:** Append:
  > `Exception: If the user's input is purely conversational (e.g., "thank you", "never mind", "what can you do?"), respond directly without launching a subagent.`
- **Rationale:** `audit-recon-analysis` Gap 7 notes rigid adherence wastes tokens on unnecessary subagent invocations for non-actionable inputs.

### P2.3 Define or remove `context-builder` from Decision Tree
- **Section:** `Decision Tree`
- **Current text:**
  > `Need to build complex context from requirements + codebase? YES → context-builder`
- **Proposed fix:** Add definition immediately after the Decision Tree:
  > `The \`context-builder\` agent performs deep requirements-to-codebase mapping and outputs \`context.md\` + \`meta-prompt.md\`. Use it when the user provides prose requirements and the codebase is large or unfamiliar. It replaces a thorough scout when requirements analysis is needed before planning.`
  (Alternatively, remove the line if the role is deprecated.)
- **Rationale:** `audit-consolidation-quality` §6 notes `context-builder` is mentioned once but never defined, making it an orphan concept.

### P2.4 Add artifact freshness / versioning guidance
- **Section:** `Artifact Handoff & Persistence Rules`
- **Current text:** None on versioning.
- **Proposed fix:** Add after `Project-Level Artifact Conventions`:
  > `When updating an existing artifact, append a timestamped header or write to a dated file (e.g., audit-2026-04-25.md) if the prior version may be needed for comparison. Never overwrite the only copy of a critical artifact without a backup.`
- **Rationale:** `audit-consolidation-quality` §6 notes stale artifacts and the risk of losing prior state when files are overwritten in-place.

### P2.5 Expand Anti-Patterns catalog
- **Section:** `Anti-Patterns (DO NOT DO THESE)`
- **Current text:** 14 named anti-patterns.
- **Proposed fix:** Append:
  - `❌ "I'll just run one quick command"` — Running a bash command that seems innocent but is actually reconnaissance (e.g., `git status`, `cat` to "verify"). This is reconnaissance.
  - `❌ "I'll overload a single subagent"` — Giving one agent a task that should be parallelized (e.g., "Read this PRD and identify all gaps, sizing issues, risks, and sequencing problems"). Use parallel delegates instead.
  - `❌ "I'll skip error handling"` — Ignoring a subagent failure, timeout, or garbage output and moving on. Always diagnose or escalate.
- **Rationale:** `audit-anti-patterns-persistence` §3.1 identifies these as missing coverage that leads to silent failures.

### P2.6 Add consolidator type guide
- **Section:** `Delegation Patterns` → `Pattern H` or new table
- **Current text:** Inconsistent use of `planner`, `delegate`, or `reviewer` as consolidator.
- **Proposed fix:** Insert table:
  ```markdown
  | Parallel Output Type | Recommended Consolidator | Rationale |
  |---|---|---|
  | Scout / research findings | `delegate` or `planner` | Synthesis of facts into coherent context |
  | Code implementation (parallel workers) | `reviewer` | Integration and correctness checks |
  | Analysis angles (e.g., PRD audits) | `reviewer` or `delegate` | Conflict resolution and gap consolidation |
  | Plans / designs | `planner` | Unified scheduling and dependency mapping |
  ```
- **Rationale:** `audit-chains-parallel` §1.3 and `audit-consolidation-quality` §4.2 note inconsistent consolidator assignment erodes role boundaries.

### P2.7 Add parent-rule awareness note to subagent specs (cross-reference)
- **Section:** N/A in AGENTS.md; applies to spec files in `/agents/`
- **Current text:** None.
- **Proposed fix:** Add a one-line note in the `Remember` section of AGENTS.md:
  > `Subagents should enforce parent rules: if a subagent observes the orchestrator violating prohibitions, it must note the violation in its output.`
  (Detailed spec updates are specified in `ralph/subagent-spec-updates.md`.)
- **Rationale:** `audit-recon-analysis` Gap 5 notes subagents have no awareness of parent misbehavior and cannot self-correct or escalate.
