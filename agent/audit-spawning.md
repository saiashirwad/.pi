# Agent Spawning & Role Boundary Audit

**Date:** 2026-04-25
**Scope:** 7 agent spec files under `/Users/texoport/.pi/agent/agents/*.md`
**Focus:** Role boundaries, subagent spawning prohibitions, orchestrator mandate leakage

---

## Executive Summary

| Agent | Forbids Subagents? | Sharp Boundaries? | Coordination Risk? | AGENTS.md Leak? |
|-------|-------------------|-------------------|-------------------|-----------------|
| **context-builder** | ❌ NO | ⚠️ Mostly | 🟡 Low | ❌ No |
| **delegate** | ❌ NO | ❌ NO | 🔴 High | ❌ No |
| **planner** | ❌ NO | ✅ Yes | 🟡 Low | ❌ No |
| **researcher** | ❌ NO | ✅ Yes | 🟢 None | ❌ No |
| **reviewer** | ❌ NO | ✅ Yes | 🟢 None | ❌ No |
| **scout** | ❌ NO | ✅ Yes | 🟢 None | ❌ No |
| **worker** | ❌ NO | ❌ NO | 🔴 Critical | ❌ No |

**Critical Finding:** Not a single agent spec explicitly prohibits spawning subagents. The `worker.md` spec is the most dangerous — it explicitly instructs the worker to "Use all available tools as needed" with "full capabilities" and zero role boundaries. If the `subagent` tool is available to workers, this is a direct instruction to violate the orchestrator mandate.

---

## Detailed Findings by Agent

### 1. context-builder

**File:** `agents/context-builder.md`

**Q1: Does it forbid spawning subagents?** ❌ **NO**
- Tools listed: `read, grep, find, ls, bash, web_search` — `subagent` is absent from the tool list, which is good.
- However, the prompt text contains **zero explicit prohibition** on spawning subagents.
- A context-builder running in an environment where `subagent` is implicitly available would have no textual guardrail stopping it.

**Q2: Sharp role boundaries?** ⚠️ **MOSTLY**
- Role is well-defined: analyze requirements, search codebase, generate `context.md` and `meta-prompt.md`.
- **Boundary blur:** The `meta-prompt.md` output template includes a "Suggested Approach" section ("recommended implementation strategy"). This encroaches slightly on planner territory, but is mitigated because it's framed as input *for* the planner, not a replacement.

**Q3: Incorrect coordination/orchestration?** 🟡 **LOW RISK**
- "When running in a chain, generate two files in the specified chain directory" — chain-aware but passive. Does not instruct orchestration.
- No delegation language.

**Q4: AGENTS.md mandate leak?** ❌ **NO**
- No orchestrator-specific language found.

---

### 2. delegate

**File:** `agents/delegate.md`

**Q1: Does it forbid spawning subagents?** ❌ **NO**
- **No tools listed in frontmatter at all.** Inherits whatever the parent model has access to.
- Prompt text: "Execute the assigned task using your tools." — "your tools" is unbounded. If `subagent` is in the toolset, this is an open invitation.

**Q2: Sharp role boundaries?** ❌ **NO — CRITICAL GAP**
- The **entire prompt is 3 sentences**:
  > "You are a delegated agent. Execute the assigned task using your tools. Be direct and efficient."
- There is **no description of what a delegate is**, what it should NOT do, or what distinguishes it from a worker, scout, or planner.
- A delegate receiving a vague task could easily plan, implement, review, or orchestrate — there are no guardrails.

**Q3: Incorrect coordination/orchestration?** 🔴 **HIGH RISK**
- "Execute the assigned task using your tools" + no role definition = the delegate may interpret coordination as part of its task.
- Since delegates are often used for quick exploratory tasks, the lack of boundaries means it could spawn scouts, workers, or even nested subagents if available.

**Q4: AGENTS.md mandate leak?** ❌ **NO**
- No orchestrator language found. (But also almost no language at all.)

---

### 3. planner

**File:** `agents/planner.md`

**Q1: Does it forbid spawning subagents?** ❌ **NO (implicit only)**
- Tools listed: `read, grep, find, ls, write` — `subagent` is absent.
- Prompt states: "You must NOT make any changes. Only read, analyze, and plan."
- No explicit text says "do not spawn subagents," but the "must NOT make any changes" and read-only tool set make it unlikely.

**Q2: Sharp role boundaries?** ✅ **YES**
- "You must NOT make any changes. Only read, analyze, and plan." — extremely clear.
- The planner knows its output is consumed by a worker: "The worker agent will execute it." This is appropriate role awareness, not overreach.

**Q3: Incorrect coordination/orchestration?** 🟡 **LOW RISK**
- Acknowledges the worker role but does not instruct the planner to manage or orchestrate workers.
- No risk of the planner launching subagents.

**Q4: AGENTS.md mandate leak?** ❌ **NO**
- No orchestrator language found.

---

### 4. researcher

**File:** `agents/researcher.md`

**Q1: Does it forbid spawning subagents?** ❌ **NO (implicit only)**
- Tools listed: `read, write, web_search, fetch_content, get_search_content` — `subagent` is absent.
- No explicit prohibition in prompt text, but the tool list is research-focused.

**Q2: Sharp role boundaries?** ✅ **YES**
- "You are a research specialist. Given a question or topic, conduct thorough web research and produce a focused, well-sourced brief."
- Very specific workflow (break into facets → search → read → synthesize). No ambiguity.

**Q3: Incorrect coordination/orchestration?** 🟢 **NONE**
- Purely autonomous research workflow. No mention of other agents or chains.

**Q4: AGENTS.md mandate leak?** ❌ **NO**
- No orchestrator language found.

---

### 5. reviewer

**File:** `agents/reviewer.md`

**Q1: Does it forbid spawning subagents?** ❌ **NO (implicit only)**
- Tools listed: `read, grep, find, ls, bash` — `subagent` is absent.
- Prompt restricts bash to "read-only commands only."
- No explicit subagent ban.

**Q2: Sharp role boundaries?** ✅ **YES**
- "You are a senior code reviewer. Analyze implementation against the plan." — clear.
- "Bash is for read-only commands only" — strong guardrail.
- "If issues found, fix them directly." — instructs direct action, NOT delegation. This is good; it prevents the reviewer from spawning workers to fix issues.

**Q3: Incorrect coordination/orchestration?** 🟢 **NONE**
- No delegation language. The reviewer is told to fix issues itself, not coordinate others.

**Q4: AGENTS.md mandate leak?** ❌ **NO**
- No orchestrator language found.

---

### 6. scout

**File:** `agents/scout.md`

**Q1: Does it forbid spawning subagents?** ❌ **NO (implicit only)**
- Tools listed: `read, grep, find, ls, bash, write` — `subagent` is absent.
- No explicit prohibition in prompt text.

**Q2: Sharp role boundaries?** ✅ **YES**
- "You are a scout. Quickly investigate a codebase and return structured findings." — clear.
- Thoroughness levels (Quick / Medium / Thorough) are well-defined.
- Output format is strictly `context.md` with no room for planning or implementation.

**Q3: Incorrect coordination/orchestration?** 🟢 **NONE**
- "When running in a chain, you'll receive instructions about where to write your output" — chain-aware but completely passive.

**Q4: AGENTS.md mandate leak?** ❌ **NO**
- No orchestrator language found.

---

### 7. worker — 🔴 CRITICAL

**File:** `agents/worker.md`

**Q1: Does it forbid spawning subagents?** ❌ **NO — THIS IS THE WORST OFFENDER**
- **No tools listed in frontmatter.** Inherits full parent toolset.
- Prompt explicitly says: **"Use all available tools as needed."**
  - If `subagent` is an available tool, this is a **direct instruction to use it**.
- AGENTS.md states: "Workers DO NOT spawn subagents" and "Subagents may NOT use the subagent tool."
- **The worker prompt contains none of this.** It is completely unprotected.

**Q2: Sharp role boundaries?** ❌ **NO — CRITICAL GAP**
- Prompt says: "You are a worker agent with **full capabilities**."
- "Full capabilities" implies no boundaries. A worker could:
  - Plan instead of execute
  - Review its own work instead of doing it
  - Spawn subagents to do its work
  - Orchestrate a chain of other agents
- There is no text like "You must NOT plan" or "You must NOT delegate."
- Compare to planner's "You must NOT make any changes" — worker has no equivalent negative constraint.

**Q3: Incorrect coordination/orchestration?** 🔴 **CRITICAL RISK**
- "Use all available tools as needed" + "full capabilities" + no role boundaries = the worker may interpret its task as requiring coordination.
- "When running in a chain, you'll receive instructions about..." makes it chain-aware, which is fine, but combined with "full capabilities" it may try to manage the chain itself.

**Q4: AGENTS.md mandate leak?** ❌ **NO**
- No orchestrator language found in the prompt.
- **However, there is a REVERSE leakage problem:** The critical mandate that "workers must NOT spawn subagents" is present in AGENTS.md but **completely absent** from `worker.md`. The orchestrator knows the rule, but the worker has never been told.

---

## Cross-Cutting Issues

### Issue A: Zero Explicit Subagent Prohibitions
**Severity:** 🔴 Critical

Not one of the 7 agent specs contains the text "do not spawn subagents" or "you may NOT use the subagent tool."

The only protections are:
- **Implicit via tool absence:** `planner`, `researcher`, `reviewer`, `scout`, `context-builder` list tools explicitly and omit `subagent`.
- **No protection at all:** `delegate` and `worker` list **no tools**, inherit everything, and have no textual guardrails.

**Recommendation:** Add an explicit prohibition to every agent spec, especially `worker.md` and `delegate.md`:
> "You may NOT spawn subagents or use the `subagent` tool."

### Issue B: Worker.md is an Unbounded Agent
**Severity:** 🔴 Critical

`worker.md` is the only agent described as having "full capabilities" with instructions to "Use all available tools as needed." This is the exact opposite of bounded agency. The worker needs:
1. A clear negative constraint (what it must NOT do).
2. An explicit subagent prohibition.
3. Removal of "full capabilities" language — replace with "You are an implementation specialist."

### Issue C: Delegate.md is a Blank Slate
**Severity:** 🔴 High

`delegate.md` is 3 sentences long with no role definition. It is impossible for this agent to know its boundaries. It needs:
1. A role definition (what IS a delegate?).
2. A clear scope (small, isolated tasks).
3. An explicit subagent prohibition.
4. A boundary against planning, reviewing, or orchestrating.

### Issue D: Reverse Leakage (Mandate NOT Propagated)
**Severity:** 🟡 Medium

AGENTS.md contains critical rules that agents should know but don't:
- "Workers DO NOT spawn subagents"
- "Subagents may NOT use the subagent tool"
- "The only tools you use directly: `subagent()`" (orchestrator-only)

These rules should be distilled into agent prompts, but they are not. The orchestrator mandate is successfully hidden from agents (no leakage), but the **prohibitions** that would keep agents in bounds are also hidden.

### Issue E: Context-Builder's "Suggested Approach"
**Severity:** 🟢 Low

The `meta-prompt.md` template includes "Suggested Approach" / "recommended implementation strategy." This is mild encroachment on the planner's role. Recommendation: rename to "Implementation Considerations" or "Technical Notes for Planner" to make it clear this is input material, not a plan.

---

## Recommendations (Priority Order)

1. **[P0] Fix worker.md:** Add explicit subagent prohibition, remove "full capabilities," add negative constraints ("You must NOT plan, review, or delegate. Only implement.").
2. **[P0] Fix delegate.md:** Add role definition, scope boundaries, and explicit subagent prohibition.
3. **[P1] Add subagent prohibition to all agents:** Even those with explicit tool lists should have a textual guardrail in case tool lists change or are overridden.
4. **[P2] Propagate key prohibitions from AGENTS.md:** Create a shared "Agent Rules" snippet that includes "You may NOT spawn subagents" and inject it into all agent prompts.
5. **[P3] Clarify context-builder.md output template:** Rename "Suggested Approach" to "Technical Notes" to avoid planner-role ambiguity.
