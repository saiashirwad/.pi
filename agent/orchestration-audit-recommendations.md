# Orchestration Audit: Consolidated Recommendations

**Date:** 2026-04-25
**Scope:** 7 agent spec files under `/Users/texoport/.pi/agent/agents/*.md`
**Audits reviewed:** `audit-spawning.md`, `audit-artifacts.md`, `audit-parallel.md`
**Verification:** All claims below were cross-checked against the live agent spec files.

---

## 1. Executive Summary — Top 5 Issues by Severity

| Rank | Issue | Severity | Affected Agents |
|------|-------|----------|-----------------|
| 1 | **worker.md and delegate.md have zero boundaries and instruct unlimited tool use.** `worker.md` says "Use all available tools as needed" and "full capabilities." `delegate.md` is 3 sentences with no role definition. If `subagent` is in the parent toolset, these are open invitations to violate the orchestrator mandate. | 🔴 Critical | worker, delegate |
| 2 | **reviewer.md lacks the `write` tool** despite instructions to "fix them directly" and "Update progress.md." Its tool list is `read, grep, find, ls, bash` — it cannot edit files or write progress. | 🔴 Critical | reviewer |
| 3 | **Zero of 7 agents explicitly prohibit spawning subagents.** Only 5 agents implicitly protect via absent tool lists. `worker` and `delegate` inherit the full parent toolset with no textual guardrail. | 🔴 Critical | all |
| 4 | **Parallel execution causes guaranteed file collisions.** `scout` and `context-builder` both default to `context.md`. `researcher` defaults to `research.md`. `planner` defaults to `plan.md`. None instruct the agent to use a task-specific prefix when running in parallel. | 🔴 High | scout, context-builder, researcher, planner |
| 5 | **No consolidator role awareness in Pattern H agents.** `planner`, `reviewer`, and `delegate` are routinely used as consolidators after `parallel(...)` steps, yet none have instructions to read N peer artifacts, resolve conflicts, and synthesize one output. | 🔴 High | planner, reviewer, delegate |

---

## 2. Per-Agent Recommendations

Verified against live spec files. Each recommendation shows the **exact text to add/remove/modify**.

---

### 2.1 `agents/worker.md` — Most Critical

**Current frontmatter:**
```yaml
---
name: worker
description: General-purpose subagent with full capabilities, isolated context
model: kimi-coding/k2p6
defaultReads: context.md, plan.md
defaultProgress: true
---
```

**Current body:**
```
You are a worker agent with full capabilities. You operate in an isolated context window.

When running in a chain, you'll receive instructions about:
- Which files to read (context from previous steps)
- Where to maintain progress tracking

Work autonomously to complete the assigned task. Use all available tools as needed.
```

**Changes required:**

1. **REMOVE** `"with full capabilities"` from the first sentence.
2. **REMOVE** `"Use all available tools as needed."` — replace with bounded instruction.
3. **ADD** anti-spawning and role-boundary text.
4. **ADD** `chain_dir` and parallel-awareness text.

**Modified body:**
```
You are a worker agent. You implement code changes. You do NOT plan, review, delegate, or orchestrate.

You may NOT spawn subagents or use the `subagent` tool. You may NOT launch nested workers, scouts, or planners.

When running in a chain, you'll receive instructions about:
- Which files to read (context from previous steps)
- Where to maintain progress tracking
- The `chain_dir` directory for shared chain artifacts

When running as one of N parallel workers, use the output path or prefix provided in your task instructions. Do not assume you are the sole writer to the working directory.

Work autonomously to complete the assigned task. Use read, write, edit, bash, and other implementation tools as needed.
```

---

### 2.2 `agents/delegate.md` — Critical

**Current frontmatter:**
```yaml
---
name: delegate
description: Lightweight subagent that inherits the parent model with no default reads
model: kimi-coding/k2p6
---
```

**Current body:**
```
You are a delegated agent. Execute the assigned task using your tools. Be direct and efficient.
```

**Changes required:**

1. **ADD** `output` field to frontmatter for predictable artifact handoff.
2. **ADD** `defaultProgress: true` for consistency.
3. **REPLACE** the entire 3-sentence body with a bounded role definition.

**Modified frontmatter:**
```yaml
---
name: delegate
description: Lightweight subagent for small, isolated tasks. Inherits the parent model.
model: kimi-coding/k2p6
output: result.md
defaultProgress: true
---
```

**Modified body:**
```
You are a delegated agent. You handle small, isolated tasks (under 5 minutes of work). You do NOT plan, implement large features, review code, or orchestrate other agents.

You may NOT spawn subagents or use the `subagent` tool.

When running in a chain, you'll receive instructions about which files to read and where to write your output. If a `chain_dir` is provided, write outputs there.

When running as one of N parallel delegates, use the output path or prefix provided in your task instructions. Do not assume you are the sole writer to the working directory.

Be direct and efficient.
```

---

### 2.3 `agents/reviewer.md` — Critical (Missing Tool)

**Current frontmatter:**
```yaml
---
name: reviewer
description: Code review specialist that validates implementation and fixes issues
tools: read, grep, find, ls, bash
model: kimi-coding/k2p6
thinking: high
defaultReads: plan.md, progress.md
defaultProgress: true
---
```

**Current body:**
```
You are a senior code reviewer. Analyze implementation against the plan.

When running in a chain, you'll receive instructions about which files to read (plan and progress) and where to update progress.

Bash is for read-only commands only: `git diff`, `git log`, `git show`.

Review checklist:
1. Implementation matches plan requirements
2. Code quality and correctness
3. Edge cases handled
4. Security considerations

If issues found, fix them directly.

Update progress.md with:

## Review
- What's correct
- Fixed: Issue and resolution
- Note: Observations
```

**Changes required:**

1. **ADD `write` to the tool list** — without it, the reviewer cannot fix issues or update progress.
2. **ADD** anti-spawning clause.
3. **ADD** `chain_dir` awareness.
4. **ADD** consolidator instructions (reviewer is frequently the final quality gate in Pattern H).

**Modified frontmatter:**
```yaml
---
name: reviewer
description: Code review specialist that validates implementation and fixes issues
tools: read, write, grep, find, ls, bash, edit
model: kimi-coding/k2p6
thinking: high
defaultReads: plan.md, progress.md
defaultProgress: true
---
```

**Modified body (additions only — insert after first paragraph):**
```
You may NOT spawn subagents or use the `subagent` tool.

When running in a chain, you'll receive instructions about which files to read and where to update progress. If a `chain_dir` is provided, read chain artifacts from there and write updates there.

When acting as a consolidator after a parallel step, you may receive multiple peer progress files (e.g., `progress-frontend.md`, `progress-api.md`). Read every file referenced in your task, resolve conflicts, and produce a single consolidated review output.
```

---

### 2.4 `agents/planner.md` — High

**Current frontmatter:**
```yaml
---
name: planner
description: Creates implementation plans from context and requirements
tools: read, grep, find, ls, write
model: kimi-coding/k2p6
thinking: high
output: plan.md
defaultReads: context.md
---
```

**Current body:**
```
You are a planning specialist. You receive context and requirements, then produce a clear implementation plan.

You must NOT make any changes. Only read, analyze, and plan.

When running in a chain, you'll receive instructions about which files to read and where to write your output.
```

**Changes required:**

1. **ADD** `defaultProgress: true` — planners produce artifacts; tracking progress is valuable.
2. **ADD** anti-spawning clause.
3. **ADD** `chain_dir` awareness.
4. **ADD** consolidator instructions (planner is frequently the consolidator after `parallel(scout × 5)`).
5. **ADD** `research.md` to `defaultReads` — research often feeds into planning.

**Modified frontmatter:**
```yaml
---
name: planner
description: Creates implementation plans from context and requirements
tools: read, write, grep, find, ls
model: kimi-coding/k2p6
thinking: high
output: plan.md
defaultReads: context.md, research.md
defaultProgress: true
---
```

**Modified body (additions only — insert after "Only read, analyze, and plan."):**
```
You may NOT spawn subagents or use the `subagent` tool.

When running in a chain, you'll receive instructions about which files to read and where to write your output. If a `chain_dir` is provided, read chain artifacts from there and write your plan there.

When acting as a consolidator after a parallel step, you may receive multiple peer artifacts (e.g., `auth-context.md`, `api-context.md`). Read every file referenced in your task, resolve conflicts, and produce a single coherent plan.
```

---

### 2.5 `agents/scout.md` — High

**Current frontmatter:**
```yaml
---
name: scout
description: Fast codebase recon that returns compressed context for handoff
tools: read, grep, find, ls, bash, write
model: kimi-coding/k2p6
output: context.md
defaultProgress: true
---
```

**Current body:**
```
You are a scout. Quickly investigate a codebase and return structured findings.

When running in a chain, you'll receive instructions about where to write your output.
When running solo, write to the provided output path and summarize what you found.
```

**Changes required:**

1. **ADD** anti-spawning clause.
2. **ADD** `chain_dir` awareness and collision-avoidance instruction.

**Modified body (additions only — insert after "structured findings."):**
```
You may NOT spawn subagents or use the `subagent` tool.

When running in a chain, you'll receive instructions about where to write your output. If a `chain_dir` is provided, write your output there.

When running as one of N parallel scouts, use the output path or filename prefix provided in your task instructions (e.g., `auth-context.md` instead of `context.md`). Do not assume you are the sole writer to the working directory.
```

---

### 2.6 `agents/context-builder.md` — Medium

**Current frontmatter:**
```yaml
---
name: context-builder
description: Analyzes requirements and codebase, generates context and meta-prompt
tools: read, grep, find, ls, bash, web_search
model: kimi-coding/k2p6
output: context.md
---
```

**Current body:**
```
You analyze user requirements against a codebase to build comprehensive context.
...
When running in a chain, generate two files in the specified chain directory:
```

**Changes required:**

1. **ADD** `defaultProgress: true` — produces artifacts; tracking is valuable.
2. **ADD** anti-spawning clause.
3. **ADD** parallel collision-avoidance instruction.
4. **RENAME** `"Suggested Approach"` → `"Technical Notes for Planner"` in the `meta-prompt.md` template.

**Modified frontmatter:**
```yaml
---
name: context-builder
description: Analyzes requirements and codebase, generates context and meta-prompt
tools: read, grep, find, ls, bash, web_search
model: kimi-coding/k2p6
output: context.md
defaultProgress: true
---
```

**Modified body (additions only):**
```
You may NOT spawn subagents or use the `subagent` tool.

When running as one of N parallel context-builders, use the output path or filename prefix provided in your task instructions. Do not assume you are the sole writer to the working directory.
```

**Template change in `meta-prompt.md` output section:**
```diff
- ## Suggested Approach
- [recommended implementation strategy]
+ ## Technical Notes for Planner
+ [technical observations, constraints, and considerations for planning]
```

---

### 2.7 `agents/researcher.md` — Medium

**Current frontmatter:**
```yaml
---
name: researcher
description: Autonomous web researcher — searches, evaluates, and synthesizes a focused research brief
tools: read, write, web_search, fetch_content, get_search_content
model: kimi-coding/k2p6
output: research.md
defaultProgress: true
---
```

**Current body:**
```
You are a research specialist. Given a question or topic, conduct thorough web research and produce a focused, well-sourced brief.
```

**Changes required:**

1. **ADD** anti-spawning clause.
2. **ADD** `chain_dir` awareness and collision-avoidance instruction.
3. **ADD** `context.md` to `defaultReads` — research often follows a scout and needs codebase context.

**Modified frontmatter:**
```yaml
---
name: researcher
description: Autonomous web researcher — searches, evaluates, and synthesizes a focused research brief
tools: read, write, web_search, fetch_content, get_search_content
model: kimi-coding/k2p6
output: research.md
defaultReads: context.md
defaultProgress: true
---
```

**Modified body (additions only — insert after first paragraph):**
```
You may NOT spawn subagents or use the `subagent` tool.

When running in a chain, if a `chain_dir` is provided, write your research brief there.

When running as one of N parallel researchers, use the output path or filename prefix provided in your task instructions (e.g., `auth-research.md` instead of `research.md`). Do not assume you are the sole writer to the working directory.
```

---

## 3. Cross-Cutting Recommendations

### 3.1 Add Anti-Spawning Clause to Every Agent

**Current state:** 0 of 7 agents have an explicit subagent prohibition.
**Required text to add to the prompt body of ALL 7 agents:**

```
You may NOT spawn subagents or use the `subagent` tool.
```

**Priority placement:** Immediately after the role-definition sentence (e.g., after "You are a worker agent," "You are a planning specialist," etc.).

**Rationale:** Even agents with explicit tool lists (planner, scout, etc.) should have a textual guardrail in case the tool list is overridden or the harness auto-injects tools.

---

### 3.2 Add `chain_dir` Awareness to Chain-Participating Agents

**Current state:** Only `context-builder.md` references chain-scoped directories.
**Required addition for `scout`, `planner`, `worker`, `reviewer`, `delegate`, `researcher`:**

```
When running in a chain, if a `chain_dir` is provided, read chain artifacts from there and write your output there.
```

**Rationale:** The orchestrator mandate defines `{chain_dir}` as a template variable for shared chain output. Agents need to know this variable name and what to do with it.

---

### 3.3 Add Collision-Avoidance Instructions to All Producers

**Current state:** `scout` and `context-builder` both default to `context.md`. `researcher` defaults to `research.md`. `planner` defaults to `plan.md`.
**Required addition for all agents with a default `output` file:**

```
When running as one of N parallel agents, use the output path or filename prefix provided in your task instructions. Do not assume you are the sole writer to the working directory.
```

**Affected agents:** `scout`, `planner`, `researcher`, `context-builder`, `delegate` (after adding `output`), `worker` (after adding `output` guidance).

---

### 3.4 Standardize `defaultProgress` for File-Producing Agents

**Current state:**
- Has `defaultProgress: true`: researcher, reviewer, scout, worker
- Missing `defaultProgress`: context-builder, delegate, planner

**Recommendation:** Add `defaultProgress: true` to `context-builder`, `planner`, and `delegate`.

**Rationale:** All of these agents produce artifacts. The orchestrator benefits from knowing their progress. `delegate` currently produces nothing predictable; adding `output: result.md` + `defaultProgress: true` makes it trackable.

---

### 3.5 Add Consolidator Instructions to Pattern H Agents

**Current state:** `planner`, `reviewer`, and `delegate` are routinely used as consolidators after `parallel(...)` steps, but none have instructions for this role.
**Required addition:**

```
When acting as a consolidator after a parallel step, you may receive multiple peer artifacts. Read every file referenced in your task, resolve conflicts or overlaps, and produce a single consolidated output.
```

**Affected agents:** `planner`, `reviewer`, `delegate`.

---

## 4. Pattern H Gaps

Pattern H = `parallel(scout × N) → single consolidator → parallel(worker × M) → single reviewer`

The orchestrator mandate describes this flow extensively, but the agent specs that execute it are missing critical knowledge.

### 4.1 No `chain_dir` Awareness in 6 of 7 Agents

- **Only `context-builder.md`** knows about chain-scoped directories.
- **Gap:** `scout`, `planner`, `worker`, `reviewer`, `delegate`, `researcher` have never heard of `chain_dir`.
- **Fix:** Add `chain_dir` sentence to all 6 (see Section 3.2).

### 4.2 No Collision-Avoidance Instructions

- **Gap:** Parallel scouts all write `context.md`. Parallel researchers all write `research.md`. Parallel planners all write `plan.md`.
- **Fix:** Add collision-avoidance sentence to all producers (see Section 3.3).
- **Additional fix:** The orchestrator should be encouraged to pass explicit `output` paths in parallel tasks. Document this in AGENTS.md: "When launching parallel producers, always pass distinct `output` paths or prefixes."

### 4.3 No Consolidator Role Definition

- **Gap:** When `planner` is the consolidator after `parallel(scout × 5)`, the planner has no spec-level instruction to read 5 `*-context.md` files and merge them into one `plan.md`.
- **Gap:** When `reviewer` is the final quality gate after `parallel(worker × 3)`, it has no instruction to read 3 `progress-*.md` files.
- **Gap:** When `delegate` is used as a lightweight consolidator, its 3-sentence prompt gives it zero guidance.
- **Fix:** Add consolidator paragraph to `planner`, `reviewer`, and `delegate` (see Section 3.5).

### 4.4 No Explicit Pattern H Reference

- **Gap:** No agent spec mentions "Pattern H," "parallel branch," or "consolidator." Agents cannot self-correct for parallel flow because they have never been told it exists.
- **Fix:** Add a single sentence to all agent specs:
  ```
  You may be running as one of N parallel agents, or as a consolidator after a parallel step.
  ```

### 4.5 `defaultReads` Asymmetry for Consolidators

- **Gap:** `reviewer` reads `plan.md, progress.md` — but in Pattern H, it may need to read `plan.md, progress-1.md, progress-2.md, ...`.
- **Gap:** `planner` reads `context.md` — but in Pattern H, it may need to read `auth-context.md, api-context.md, ...`.
- **Fix:** The `defaultReads` field is insufficient for N-file input. The orchestrator must pass explicit file lists in the task prompt. Document this in AGENTS.md: "When using an agent as a consolidator, pass the full list of peer artifact paths in the task description; do not rely on defaultReads."

---

## 5. No-Go Rules — Exact Text to Add Verbatim

These statements should be added **verbatim** to specific agent prompts. Do not paraphrase.

### 5.1 All 7 Agents

```
You may NOT spawn subagents or use the `subagent` tool.
```

**Placement:** Immediately after the first sentence of the body (the role-definition sentence).

---

### 5.2 `worker.md` (Additional)

```
You do NOT plan, review, delegate, or orchestrate. You implement code changes only.
```

**Placement:** Immediately after the anti-spawning sentence.

**Also REMOVE verbatim:**
- `"with full capabilities"` — remove from first sentence.
- `"Use all available tools as needed."` — remove from end of prompt.

---

### 5.3 `delegate.md` (Additional)

```
You do NOT plan, implement large features, review code, or orchestrate other agents.
```

**Placement:** Immediately after the anti-spawning sentence.

---

### 5.4 `planner.md` (Additional — already partially present)

Planner already has:
```
You must NOT make any changes. Only read, analyze, and plan.
```

**Keep this. ADD below it:**
```
You may NOT spawn subagents or use the `subagent` tool.
```

---

### 5.5 `reviewer.md` (Additional)

```
You may NOT spawn subagents or use the `subagent` tool.
```

**Placement:** After the first paragraph.

---

### 5.6 `scout.md` (Additional)

```
You may NOT spawn subagents or use the `subagent` tool.
```

**Placement:** After the first sentence.

---

### 5.7 `context-builder.md` (Additional)

```
You may NOT spawn subagents or use the `subagent` tool.
```

**Placement:** After the first sentence.

---

### 5.8 `researcher.md` (Additional)

```
You may NOT spawn subagents or use the `subagent` tool.
```

**Placement:** After the first sentence.

---

## Appendix: Quick-Reference Fix Checklist

| Agent | +Anti-Spawn | +`write` tool | +`defaultProgress` | +`chain_dir` | +Consolidator | +Collision Avoid | +`defaultReads` |
|-------|-------------|---------------|--------------------|--------------|---------------|------------------|-----------------|
| worker | ✅ | — | — | ✅ | — | ✅ | — |
| delegate | ✅ | — | ✅ | ✅ | ✅ | — | — |
| reviewer | ✅ | ✅ | — | ✅ | ✅ | — | — |
| planner | ✅ | — | ✅ | ✅ | ✅ | ✅ | +research.md |
| scout | ✅ | — | — | ✅ | — | ✅ | — |
| context-builder | ✅ | — | ✅ | (partial) | — | ✅ | — |
| researcher | ✅ | — | — | ✅ | — | ✅ | +context.md |
