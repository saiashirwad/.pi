# AGENTS.md Parallelism Conflict Audit

This document identifies conflicting rules within `AGENTS.md` that undermine or contradict parallelism goals. Each conflict includes the exact contradictory text, its impact on parallelism, and a proposed resolution.

---

## Conflict 1: Pattern C Directly Contradicts Itself on Parallel Review

### Conflicting Text A (Fork Review — Parallel)
> "DON'T wait for worker to finish to launch reviewer"  
> "Launch reviewer in parallel with clear handoff instructions"

### Conflicting Text B (Fork Review — Serial)
> `worker("Implement feature X", output="progress.md")`  
> `// After worker signals complete:`  
> `reviewer("Review progress.md against plan.md, fix issues directly")`

### Parallelism Impact
Pattern C first instructs the orchestrator to launch the reviewer in parallel with the worker (maximizing parallelism), then immediately shows an example where the reviewer is launched only **after the worker signals complete** (pure serial dependency). This self-contradiction creates confusion: if the reviewer is truly forked in parallel, it may start reviewing before `progress.md` exists. If it waits for the worker to signal completion, it is not forked in parallel and the "DON'T wait" instruction is meaningless. The ambiguity causes orchestrators to either (a) launch reviewers prematurely and fail, or (b) wait serially and lose parallelism.

### Proposed Resolution
**Split Pattern C into two distinct patterns:**
- **Pattern C1 — True Fork Review:** `reviewer` is launched in parallel with `worker` and polls/waits for `progress.md` internally. Add explicit language: "The reviewer agent should poll for `progress.md` or wait on a file-watch trigger; the orchestrator does not wait."
- **Pattern C2 — Post-Completion Review:** `reviewer` is launched strictly after the worker finishes. Remove the "DON'T wait" language from this variant.

---

## Conflict 2: "Analysis MUST Be Parallelized" vs "Consolidation MUST Be Single-Agent"

### Conflicting Text A (Analysis Parallelization Mandate)
> "**Analysis tasks MUST be parallelized.** When analyzing a document (PRD, plan, spec, findings), don't give one agent the whole job. Split it into independent angles and launch them in parallel"

### Conflicting Text B (Single-Agent Consolidation Requirement)
> "**Rule:** If a chain step produces N independent artifacts, the next step in the chain should be a SINGLE agent that reads all N and produces one consolidated output."

### Parallelism Impact
Consolidation **is** analysis. It requires reading N sources, comparing them, resolving conflicts, evaluating tradeoffs, and creating a unified artifact — exactly the kind of synthesis work the document defines as analysis. By forcing consolidation to be single-agent, the document creates a **serial bottleneck** immediately after every parallel step. The "MUST be parallelized" rule is violated at the exact moment parallel outputs need to be merged. This undermines the scalability of Pattern H: 6 parallel scouts are fast, but the subsequent single-agent consolidator becomes the limiting factor.

### Proposed Resolution
**Distinguish between "analysis" and "consolidation" more precisely, and allow parallel consolidation where possible.**
- Change the consolidation rule to: "Consolidation SHOULD be single-agent **unless** the artifacts can be partitioned into independent consolidation domains. When possible, use parallel consolidation (e.g., one agent per subsystem) followed by a final single-agent merge."
- Add a new pattern: **Pattern I — Hierarchical Consolidation**: `parallel(scouts) → parallel(mid-level consolidators) → single(final consolidator)`. This preserves parallelism through the merge phase when subsystems are independent.

---

## Conflict 3: "Reviewer Always Fork, Never Serial" vs Pattern G's Serial Loop

### Conflicting Text A (Reviewer Fork Rule)
> "Need to verify quality → `reviewer` (**always fork, never serial**)"

### Conflicting Text B (Pattern G — Serial Self-Correction Loop)
> `worker("Implement feature")`  
> `→ reviewer("Review implementation")`  
> `// If reviewer finds issues:`  
> `→ worker("Fix issues identified by reviewer", reads=["review-notes.md"])`  
> `→ reviewer("Re-verify")`  
> `// Loop until reviewer approves`

### Parallelism Impact
The Context Budget Rules explicitly demand that reviewers be **forked** (parallel), never **serial**. Yet Pattern G is entirely serial: worker finishes → reviewer reviews → worker fixes → reviewer re-reviews → loop. Each iteration blocks the next. This is the definition of a serial pipeline. The rule and the pattern cannot coexist. An orchestrator following "always fork, never serial" would launch the second reviewer in parallel with the fixer-worker, which makes no sense (the reviewer needs the fixes to exist first). The contradiction forces orchestrators to either violate the fork rule or abandon the self-correction loop pattern.

### Proposed Resolution
**Remove "never serial" from the reviewer rule, or reframe Pattern G as an exception.**
- Option A: Change the rule to "`reviewer` should be forked when possible; serial loops are acceptable for iterative feedback cycles."
- Option B: Keep the rule but add a footnote to Pattern G: "This is an exception to the fork rule because re-verification requires the fixer's output as a prerequisite."

---

## Conflict 4: Context Budget Rules Mandate `delegate` for Comparisons, but Pattern F Uses `researcher`/`scout`

### Conflicting Text A (Context Budget Rules)
> "Need to compare options → Spawn 2+ `delegate` agents in parallel"

### Conflicting Text B (Pattern F — Oracle Decision)
> `parallel(`  
> `  researcher("Deep dive on technology X tradeoffs"),`  
> `  researcher("Deep dive on technology Y tradeoffs"),`  
> `  scout("What does current codebase already use?")`  
> `)`

### Parallelism Impact
The Context Budget Rules specify `delegate` as the agent type for parallel option comparison. But Pattern F — the canonical example for comparing options — uses `researcher` and `scout`, not `delegate`. This inconsistency causes orchestrators to either (a) use `delegate` for research tasks (wrong tool, producing lower-quality results) or (b) use `researcher`/`scout` and violate the explicit "delegate" mandate. Both choices reduce parallelism effectiveness by mismatching agent capabilities to tasks.

### Proposed Resolution
**Align the Context Budget Rules with Pattern F.**
- Change the Context Budget Rules entry to: "Need to compare options → Spawn parallel agents with the appropriate role (e.g., `researcher` for external tech comparison, `scout` for codebase context)."
- Alternatively, if `delegate` is the intended universal agent for comparisons, rewrite Pattern F to use `delegate` agents with explicit skill instructions (e.g., `delegate("Research X tradeoffs", skill="researcher")`).

---

## Conflict 5: "Write Any File Directly" Prohibition vs "MUST Write Consolidated Artifact" Requirement

### Conflicting Text A (Absolute Prohibitions)
> "Write any file directly (**except this config and subagent launch manifests**)"

### Conflicting Text B (Artifact Handoff Rules)
> "After parallel scouts or researchers return, you **MUST write a consolidated artifact** before synthesizing in chat."  
> "Full details go to a file, not chat"

### Conflicting Text C (Tool Usage Matrix)
> `write` — "✅ **Only AGENTS.md, manifests**"

### Parallelism Impact
The orchestrator is prohibited from writing files, yet is required to produce consolidated artifacts after every parallel scout network. The only compliant path is to **delegate file writing to a subagent**, adding an extra round-trip of latency after every parallel phase. This overhead undermines the efficiency gains of parallelism. For example, after 6 parallel scouts finish, instead of the orchestrator quickly writing a summary manifest, it must spawn a `worker` or `delegate` to write the file, wait for completion, and then read it back. The document says "Your context window is PRECIOUS" but then forces a wasteful delegation step for a simple file write.

### Proposed Resolution
**Allow the orchestrator to write lightweight coordination artifacts (e.g., `audit.md`, `context.md`, `progress.md`).**
- Change the prohibition to: "Write any file directly **except configuration files, manifests, and lightweight coordination artifacts** (e.g., `audit.md`, `context.md`, `progress.md`)."
- Alternatively, change the artifact rule to: "Direct a subagent to write the consolidated artifact" instead of "you MUST write."

---

## Conflict 6: Test Failure Analysis Mandates `worker`/`reviewer`, but Scenario Uses `delegate`

### Conflicting Text A (Absolute Prohibitions)
> "Analyze test failures yourself (**use `worker` or `reviewer`**)"

### Conflicting Text B ("Why is the build failing?" Scenario)
> `1. delegate("Check build logs, identify the first error, find the file")`

### Parallelism Impact
The prohibition explicitly designates `worker` or `reviewer` as the correct agents for test/build failure analysis. However, the canonical scenario for build failures assigns the initial diagnostic step to `delegate` — an agent type intended for "small isolated tasks (<5 min)" per the Decision Tree. Build log analysis is often complex and may require deep investigation. Using `delegate` for it either (a) underestimates the task and assigns it to the wrong capability tier, or (b) contradicts the prohibition's explicit agent type requirement. This inconsistency weakens the agent selection framework and can lead to poor parallel task distribution.

### Proposed Resolution
**Align the scenario with the prohibition.**
- Change step 1 of the build failure scenario to: `worker("Check build logs, identify the first error, find the file")` or `reviewer("Check build logs, identify the first error, find the file")`.
- Alternatively, if `delegate` is correct for initial triage, change the prohibition to: "Analyze test failures yourself (use `delegate` for triage, `worker` or `reviewer` for deep analysis)."

---

## Conflict 7: "You do NOT read source files yourself" vs Scenario Step 1 Reading PLAN.md

### Conflicting Text A (Scenario Note)
> "**You do NOT run `ls`, `wc -l`, `test -f`, or read source files yourself.**"

### Conflicting Text B ("Does this plan still need to be done?" Scenario)
> `1. read("PLAN.md")  // your 1-file budget`

### Parallelism Impact
The scenario explicitly has the orchestrator reading `PLAN.md` (a source/planning file), while the note directly below prohibits reading source files. This contradiction creates ambiguity about whether planning documents are exempt from the "no source files" rule. Orchestrators may either (a) unnecessarily delegate reading of plan files to scouts (burning context on a simple read) or (b) read them directly and violate the prohibition. Both outcomes reduce parallelism: unnecessary delegation adds latency, while rule-breaking creates inconsistency in parallel workflow design.

### Proposed Resolution
**Clarify the scope of "source files."**
- Change the prohibition to: "You do NOT read **code files or implementation details** yourself. Reading a single user-referenced planning document (e.g., `PLAN.md`, `PRD.md`) is allowed as your 1-file budget."
- Remove the conflicting note from the scenario, or rephrase it to: "You do NOT read code or scout output files yourself."

---

## Conflict 8: Anti-Pattern "Serial when parallel works" Implicitly Condemns Pattern A

### Conflicting Text A (Anti-Pattern)
> "❌ **Serial when parallel works**"  
> "'Let me research first, then plan, then implement.' This is wrong. If research topics are independent, launch `researcher` agents in parallel."

### Conflicting Text B (Pattern A — Default Implementation Pattern)
> `scout("Find all files related to user auth, return context.md")`  
> `  → planner("Read context.md, create plan.md for adding OAuth")`  
> `  → worker("Read context.md and plan.md, implement the changes")`  
> `  → reviewer("Read plan.md and verify implementation")`

### Parallelism Impact
While Pattern A has legitimate dependencies (planner needs scout output, worker needs plan), the anti-pattern's broad condemnation of "serial" workflows — without qualifying "when steps have no dependencies" — implicitly stigmatizes Pattern A. The anti-pattern says "This is wrong" about research→plan→implement serially. Pattern A is exactly scout→plan→implement serially. An over-literal reader might try to force parallelism where none exists (e.g., launching planner before scout finishes), causing failures. The anti-pattern should explicitly exempt dependency chains like Pattern A.

### Proposed Resolution
**Add a dependency qualifier to the anti-pattern.**
- Change the anti-pattern to: "❌ **Serial when parallel works and steps are independent.** 'Let me research first, then plan, then implement.' This is wrong **when the research topics are independent**. If steps have hard dependencies (e.g., planning requires recon output), serial chains like Pattern A are correct."

---

## Conflict 9: "Remember" Bullet Directs Orchestrator to Use `web_search_exa`, but Tool Matrix Forbids It

### Conflicting Text A (Tool Usage Matrix)
> `web_search` — "❌ **NEVER** — use researcher"

### Conflicting Text B (Remember Section)
> "use exa `web_search_exa` for web and `get_code_context_exa` for code/docs for external search summarize with sources"

### Parallelism Impact
The `Remember` section appears to give the orchestrator direct instructions to use web search tools, but the Tool Usage Matrix explicitly prohibits the orchestrator from using `web_search`. If the orchestrator follows the `Remember` section, they violate the tool matrix; if they follow the tool matrix, they must delegate a `researcher` for every web search, adding latency. This is particularly damaging to parallelism because external research is often on the critical path of parallel scout networks. The extra delegation hop serializes what could be a direct tool call.

### Proposed Resolution
**Clarify that the `Remember` bullets are for subagents, not the orchestrator.**
- Prefix the `Remember` section with: "**Subagent instructions:**" or move these bullets into a "Subagent Capabilities" section.
- Alternatively, if the orchestrator is meant to use these tools in rare cases, add an exception to the Tool Usage Matrix: "`web_search` — ❌ NEVER for the orchestrator (subagents only, per `researcher` role)."

---

## Conflict 10: Synthesis Is the Orchestrator's Job, but Anti-Pattern Prohibits Reading Material Needed to Synthesize

### Conflicting Text A (Orchestrator's Job Description)
> "Your only jobs: ... 4. **Synthesize and present results**"

### Conflicting Text B (Anti-Pattern)
> "❌ 'I'll analyze this myself since I already have the context'"  
> "The scouts found X. Now the user wants recommendations for the PRD. I'll read the PRD and compare it against the scout findings myself. **This is wrong.** ... Do not read the PRD yourself and start reasoning through gaps."

### Conflicting Text C (Read Limit)
> "Read **more than 1 file** in a single turn (the user's referenced input)"

### Parallelism Impact
Synthesis requires understanding subagent outputs. But the orchestrator is (a) prohibited from reading more than 1 file, and (b) explicitly told NOT to read source documents (like PRDs) to compare against findings. This means the orchestrator can only synthesize from the direct return values of subagent calls. If those return values are truncated or incomplete (common with large outputs), the orchestrator cannot read the artifact files to fill gaps. This forces orchestrators to either (a) launch additional consolidation subagents (serial overhead) or (b) produce shallow syntheses. The prohibition on reading more than 1 file creates a **synthesis bottleneck** after parallel execution.

### Proposed Resolution
**Allow the orchestrator to read consolidated artifacts for synthesis purposes.**
- Change the read prohibition to: "Read more than 1 file in a single turn **except** for reading a single consolidated artifact (e.g., `audit.md`, `context.md`) produced by subagents for synthesis purposes."
- Or, change the anti-pattern to: "Do not read the PRD yourself **unless it is your 1-file budget for the turn** and you need it to synthesize subagent findings."

---

## Summary Table

| # | Conflict Location | Core Tension | Parallelism Damage |
|---|-------------------|--------------|-------------------|
| 1 | Pattern C | "Don't wait" vs "After worker signals complete" | Confuses parallel vs serial review timing |
| 2 | Pattern H + Analysis Rule | Analysis MUST be parallel vs consolidation MUST be single-agent | Creates serial bottleneck after every parallel phase |
| 3 | Context Budget Rules + Pattern G | "Reviewer always fork, never serial" vs serial self-correction loop | Condemns the serial loop pattern explicitly shown |
| 4 | Context Budget Rules + Pattern F | "Use `delegate` for comparisons" vs `researcher`/`scout` in example | Mismatches agent type to parallel task |
| 5 | Absolute Prohibitions + Artifact Handoff | Can't write files vs MUST write consolidated artifacts | Forces extra delegation latency after parallel work |
| 6 | Absolute Prohibitions + Build Failure Scenario | Test failures → `worker`/`reviewer` vs scenario uses `delegate` | Weakens agent selection framework |
| 7 | Scenario Note + Scenario Step | "Don't read source files" vs `read("PLAN.md")` | Ambiguity causes unnecessary delegation |
| 8 | Anti-Patterns + Pattern A | "Serial is wrong" vs serial Pattern A is default | Risks forcing false parallelism on dependent steps |
| 9 | Tool Usage Matrix + Remember | `web_search` ❌ vs "use `web_search_exa`" | Extra delegation hop for external research |
| 10 | Orchestrator Jobs + Anti-Patterns + Read Limit | Must synthesize but can't read source material | Shallow synthesis or extra consolidation steps |

---

*Audit completed: 10 distinct conflicts identified that directly undermine parallelism goals through contradictory agent selection, serialization mandates, tool usage ambiguity, and workflow timing confusion.*
