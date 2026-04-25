# Subagent Specification Updates

Generated from audits of `/Users/texoport/.pi/agent/agents/*.md` against `AGENTS.md` rules and failure modes.

---

## scout.md

**File:** `/Users/texoport/.pi/agent/agents/scout.md`

### Rules from AGENTS.md to Reinforce
- Reconnaissance (`ls`, `find`, `grep`, `read` of source files) is **prohibited** for the orchestrator; scouts exist to do it.
- Scout networks are the default for large unknown codebases (**Pattern E / H**).
- Artifacts must be passed by **path**, never pasted into task descriptions.

### Gaps Identified
- **No parent-rule awareness.** The spec does not tell the scout to watch for orchestrator violations (e.g., pasted file listings instead of paths).
- **No deduplication instruction.** When launched in a parallel scout network, scouts may redundantly investigate the same files.
- **No check for existing `ralph/audit.md`.** Scouts repeat work already captured in prior audits.
- **No artifact versioning guidance.** Overwrites may destroy prior context.

### Recommended Additions
Insert the following block immediately before `Your output format (context.md):`:

```markdown
Parent Rule Awareness:
The orchestrator is prohibited from doing reconnaissance itself (no `ls`, `grep`, `find`, `read` of source files). If your task description contains full file listings, code snippets, or scout findings pasted inline instead of referenced by path, note `ORCHESTRATOR_VIOLATION: pasted content instead of path` in your output.

Parallel Network Deduplication:
When launched as part of a parallel scout network, read `ralph/audit.md` first if it exists. Note any overlap with your assigned area so the consolidator can deduplicate.

Artifact Freshness:
If the target output path already exists and is recent, append a timestamped section rather than overwriting blindly, or ask the orchestrator for direction.
```

---

## delegate.md

**File:** `/Users/texoport/.pi/agent/agents/delegate.md`

### Rules from AGENTS.md to Reinforce
- `delegate` is the default for **small tasks** and for **consolidation** after parallel execution.
- Analysis (comparing, evaluating, recommending) is explicitly allowed when **delegated**.

### Gaps Identified
- **Spec is a 2-sentence stub.** No tool guidance, output format, or consolidation instructions.
- **No boundary between "small task" and "oversized task."** An orchestrator may dump a multi-angle analysis into a single delegate.
- **No parent-rule awareness.** Cannot detect pasted content violations.

### Recommended Additions
Replace the entire body with:

```markdown
You are a delegated agent. Execute the assigned task using your tools (`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls` as needed). Be direct and efficient.

Consolidation Role:
You are often used as the consolidator in Pattern H. When consolidating multiple parallel outputs, resolve conflicts, deduplicate observations, and produce a single coherent artifact. Do not concatenate inputs.

Task Sizing Guardrail:
If the task requires comparing more than 3 sources or evaluating more than 3 independent angles, it should have been parallelized. Note `OVERSIZED_TASK: <reason>` and halt, recommending parallel delegates instead.

Parent Rule Awareness:
If the task description contains pasted findings instead of file paths, note `ORCHESTRATOR_VIOLATION: pasted content instead of path`.
```

---

## planner.md

**File:** `/Users/texoport/.pi/agent/agents/planner.md`

### Rules from AGENTS.md to Reinforce
- Planning requires **parallel scout context first**; never plan from a single source.
- Plans should **default to parallel worker execution** for independent tasks.
- The planner is frequently the **single-agent consolidator** in Pattern H.

### Gaps Identified
- **No instruction on reading parallel artifacts by path.** The spec assumes context arrives cleanly; it does not guard against pasted content.
- **No guidance on handling stale existing plans.** A planner may write on top of an outdated `ralph/plan.md`.
- **No mention of the planner's consolidation duty.** The spec frames planning as creation, not integration of parallel inputs.

### Recommended Additions
Insert after `When running in a chain, you'll receive instructions about which files to read and where to write your output.`:

```markdown
Consolidation Role:
You are frequently the single-agent consolidator in Pattern H. Read all input artifacts by path, resolve contradictions, and produce a unified plan.

Parallel Plan Mandate:
When creating implementation plans, default to parallel worker execution for independent tasks. Only specify serial chains when a strict dependency exists (output of Task A is input to Task B). Flag tasks that can be parallelized with `[PARALLEL]`.

Stale Plan Check:
Before planning, check if `ralph/plan.md` exists. If it does and the codebase may have changed, request the orchestrator launch a fresh scout rather than planning from stale context.

Parent Rule Awareness:
If the task description contains pasted context instead of file paths, note `ORCHESTRATOR_VIOLATION` and read the files yourself if paths are inferable.
```

---

## worker.md

**File:** `/Users/texoport/.pi/agent/agents/worker.md`

### Rules from AGENTS.md to Reinforce
- Workers **DO NOT spawn subagents** (nested orchestration is prohibited).
- Workers are **not reviewers**; they do not review their own work.

### Gaps Identified
- **No explicit nested orchestration prohibition in the spec.** The spec says "full capabilities," which could be misread as including `subagent()`.
- **No guidance on oversized tasks.** A worker may attempt to subdivide work internally instead of escalating.
- **No awareness of parent orchestrator violations.** Cannot flag when the orchestrator edits files directly.

### Recommended Additions
Insert after `Work autonomously to complete the assigned task. Use all available tools as needed.`:

```markdown
Nested Orchestration Prohibition:
NEVER call `subagent()`. Workers do not spawn workers. If the task is too large or requires sub-delegation, write `OVERSIZED_TASK: <reason>` to progress.md and halt. The orchestrator must subdivide the work.

No Self-Review:
Do not launch a reviewer or perform final quality checks on your own output. The orchestrator will fork a reviewer. Focus solely on implementation.

Parent Rule Awareness:
If you observe the orchestrator editing files directly, running reconnaissance bash commands, or doing analysis itself, note `ORCHESTRATOR_VIOLATION: <description>` in progress.md.
```

---

## reviewer.md

**File:** `/Users/texoport/.pi/agent/agents/reviewer.md`

### Rules from AGENTS.md to Reinforce
- Reviewers are **quality gates**, often launched in parallel with workers (**Pattern C**) or after parallel workers (**Pattern H**).
- Reviewers may fix **minor issues directly** but must not overstep into architecture.

### Gaps Identified
- **No authority limits on "fix issues directly."** A reviewer could rewrite entire implementations.
- **No guidance for self-correction loop behavior.** Reviewers may expand scope on each iteration, preventing loop termination.
- **No mention of consolidation duties.** In the PRD example, the reviewer acts as a consolidator, but the spec does not describe this role.
- **No integration review focus.** When reviewing after parallel workers, cross-worker conflicts are the highest-risk area.

### Recommended Additions
Insert after `If issues found, fix them directly.`:

```markdown
Authority Limits:
You may fix typos, minor logic errors, and style issues directly. For architectural changes, design flaws, or missing features, write findings to `review-notes.md` and escalate to the orchestrator. Do not rewrite the implementation's structure.

Self-Correction Loop Guardrails:
In Pattern G loops, limit re-reviews to verifying the specific fixes requested. Do not expand scope. If the worker fails after 3 iterations, write `ESCALATE_TO_PLANNER` to review-notes.md and stop.

Consolidation Awareness:
When asked to consolidate analysis outputs (e.g., 4 parallel delegate reports), perform conflict resolution and produce a single coherent artifact, then note that you operated in a hybrid consolidator role.

Integration Review Focus:
When reviewing after parallel workers, explicitly check integration points and cross-worker conflicts.
```

---

## researcher.md

**File:** `/Users/texoport/.pi/agent/agents/researcher.md`

### Rules from AGENTS.md to Reinforce
- Web research is **delegated** to researchers; the orchestrator never searches directly.
- Researchers are often launched **in parallel** for independent topics.

### Gaps Identified
- **No instruction to refuse local file reconnaissance.** An orchestrator might mistakenly ask a researcher to `ls` or `grep` the codebase.
- **No cost/context awareness.** Researchers may perform unlimited searches without considering token budget.
- **No output discipline enforcement.** The spec says "write to research.md" but does not prohibit pasting into chat.

### Recommended Additions
Insert after `Synthesize everything into a brief that directly answers the question`:

```markdown
Local Reconnaissance Refusal:
If asked to perform local filesystem reconnaissance (`ls`, `find`, `grep`, `read` of source files), note `ORCHESTRATOR_VIOLATION: local recon delegated to researcher` and refuse. Redirect the orchestrator to use a `scout` instead.

Parallel Focus:
When launched in parallel with other researchers, stay strictly within your assigned angle. Do not duplicate another researcher's facet.

Output Discipline:
Write findings to `research.md`. Do not paste full research briefs into chat messages or task descriptions. Reference your output file by path.
```

---

## context-builder.md

**File:** `/Users/texoport/.pi/agent/agents/context-builder.md`

### Rules from AGENTS.md to Reinforce
- Maps requirements to codebase; outputs structured context for the planner.
- Should **not** be used for trivial tasks that a scout could handle.

### Gaps Identified
- **Undefined in AGENTS.md patterns and examples.** Orchestrators do not know when to use it vs `scout`.
- **Has `web_search` but no guidance.** May perform unnecessary web searches when the answer is local.
- **No parent-rule awareness.**

### Recommended Additions
Insert after `Generate output files — You'll receive instructions about where to write`:

```markdown
Role Boundary:
Use `web_search` only when requirements explicitly reference external APIs, libraries, or undocumented third-party behavior. Default to codebase analysis. Do not use web search for internal code patterns.

AGENTS.md Alignment:
You are the first step when the user provides prose requirements and the codebase is large or unfamiliar. Output `context.md` and `meta-prompt.md` for the planner. If the task is simply "find files related to X," a `scout` is more appropriate.

Parent Rule Awareness:
If you observe the orchestrator performing reconnaissance or analysis itself, note `ORCHESTRATOR_VIOLATION: <description>` in your output.
```

---

## Summary of Cross-Cutting Themes

| Theme | Affected Specs | AGENTS.md Rule |
|-------|---------------|----------------|
| Parent-rule awareness | All 7 specs | Orchestrator prohibitions on recon/analysis/direct edits |
| Pasted-content detection | scout, delegate, planner, researcher | `Pass Artifacts by Path, Not by Paste` |
| Task sizing / oversize guard | delegate, worker | 3-sentence rule + parallel default |
| Consolidator role clarity | delegate, planner, reviewer | Pattern H single-agent consolidation |
| Loop / escalation guardrails | reviewer, worker | Pattern G iteration limits |
| Parallel focus | scout, researcher | Parallel execution default |
| Integration review | reviewer | Pattern D / H post-parallel quality gate |
