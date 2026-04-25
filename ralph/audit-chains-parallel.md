# Audit: Parallel Analysis Enforcement in AGENTS.md

**Date:** 2026-04-25  
**Scope:** Chain patterns, serial vs. parallel defaults, consolidator discipline, and enforcement language strength in `/Users/texoport/.pi/agent/AGENTS.md`.

---

## Executive Summary

AGENTS.md is **strong** on identifying anti-patterns and documenting Pattern H (parallel → consolidator → parallel → single), but **weak** on making parallel analysis the *unquestionable default*. The doc relies on negative examples ("don't do X") rather than positive mandates ("always do Y"). Several scenario examples inadvertently model serial execution for tasks that could be parallelized, and there are gaps in enforcement language that allow an orchestrator to technically comply while still under-utilizing parallelism.

---

## 1. Chain Patterns (Pattern H) — Strengths

### What's Working Well

| Item | Evidence | Verdict |
|------|----------|---------|
| Explicit Pattern H definition | Full 4-step annotated example with scouts → planner → workers → reviewer | ✅ Strong |
| Core consolidation rule | "Never chain parallel → parallel without a single-agent step between" | ✅ Strong |
| Anti-pattern catalog | "❌ 'I'll chain parallel → parallel without a consolidator'" with explicit BAD label | ✅ Strong |
| Analysis tasks heading | "Analysis tasks MUST be parallelized" | ✅ Strong (but see §4) |

### What's Weak or Missing

#### 1.1 No Rationale for *Why* Pattern H Works
The doc presents Pattern H as a recipe but never explains the underlying principle: **parallel steps increase breadth; single-agent steps increase coherence**. An orchestrator following the doc mechanically might not recognize when to apply Pattern H vs. simpler patterns. Missing: a one-sentence rule like *"Parallelization is for independent investigation; consolidation is for integration."*

#### 1.2 No Minimum Parallelism Threshold
The PRD recommendation example uses 4 parallel delegates, and the large-scale audit uses 6. But there is no rule stating a minimum. An orchestrator could spawn 2 parallel agents and claim compliance. Missing: *"Analysis tasks must be decomposed into at least 3 independent angles executed in parallel."*

#### 1.3 No Guidance on Consolidator Agent Type
The examples use `reviewer`, `planner`, and `delegate` as consolidators inconsistently. The PRD example uses `reviewer`; the large-scale audit uses `delegate` then `planner`. There is no rule for *which* agent type should consolidate which kind of output. This creates ambiguity.

#### 1.4 Missing: Consolidator as Non-Optional
The rule says "Never chain parallel → parallel without a single-agent step between." It does not say "A consolidator is mandatory after every parallel step." The word "step" is vague — an orchestrator might interpret a single `bash` command as a "step." Missing: *"Every parallel execution block MUST be followed by a single-agent consolidation block before any further parallel execution."*

---

## 2. Single-Planner Chains — Weaknesses

### The Problem

The doc contains two contradictory messages about single-planner chains:

**Strong anti-pattern:**
> "❌ 'I'll use a chain when parallel would work'"  
> "❌ 'I'll chain parallel → parallel without a single-agent step between'"

**But also implicit modeling of single-planner chains as acceptable:**

In the "Decision Tree" section, the flow is:
> "Is this creating a plan or design? YES → planner"

This suggests that planning is a *single* agent task by default. The doc never explicitly states: *"Planning tasks that synthesize multiple sources must be preceded by parallel scouts/researchers."*

### Specific Gaps

#### 2.1 The Planner Is Not Shown as a Consolidator
The doc frames `planner` as a role that creates plans, not as a role that *consolidates parallel inputs into a plan*. In Pattern H, the planner is used as a consolidator (`planner reads all audits and produces unified plan`), but this is never generalized. Missing: *"The planner agent's primary purpose is to consolidate parallel findings into a single coherent plan."*

#### 2.2 Serial Planning Is Never Flagged as an Anti-Pattern
There is no anti-pattern for:  
> "❌ 'I'll read one document and plan based on it'"

The closest is the general "❌ 'I'll use a chain when parallel would work'", but it's not specific to planning. An orchestrator could easily read one file, launch a single planner, and believe they are compliant.

#### 2.3 The "Context Budget Rules" Table Encourages Serial Chains
The table lists:
> "Need to implement anything → scout → planner → worker"

This is a **serial chain** presented as the default. It does not mention parallelizing the scout step or the worker step. While this may be appropriate for trivial tasks, the table does not qualify it with *"For multi-file or complex tasks, parallelize the scout and worker steps per Pattern H."*

---

## 3. Serial Scout Chains — Weaknesses

### The Problem

AGENTS.md has an excellent anti-pattern for serial scouts:

> "❌ 'I'll do these 5 audits serially in one chain'"  
> "❌ 'I'll launch scout 1, wait for it to finish, then launch scout 2...'"

However, **several scenario examples in the doc itself model serial scout behavior** or fail to show parallelization where it would be natural.

### Specific Examples of Weak Modeling

#### 3.1 Scenario: "Fix this bug where login fails"
```
1. scout("Find login-related code and error handling...")
2. planner("Create plan to fix login bug...")
3. worker("Implement fix...")
4. reviewer("Verify fix...")
```
This is a **pure serial chain**. While a bug fix might seem like a linear task, the scout step could easily be parallelized:
- Scout A: Find the failing code path
- Scout B: Find recent changes to auth
- Scout C: Find test coverage for auth

The example models the *simplest* path, not the *parallel* path. Missing: a note like *"For non-trivial bugs, parallelize scouts to investigate code, history, and tests simultaneously."*

#### 3.2 Scenario: "Refactor the API layer"
```
1. scout("Thorough: Map entire API layer...")
2. planner("Create refactoring plan...")
3. // Phase 1: worker...
4. reviewer("Review phase 1")
5. // Phase 2: worker...
```
This uses a **single scout** for a massive task ("Map entire API layer"). The doc itself admits this is a "large unknown codebase" scenario, yet it does not apply Pattern H here. Step 1 should be:
```
parallel(
  scout("Map auth endpoints"),
  scout("Map data endpoints"),
  scout("Map middleware layer"),
  ...
)
```

This is a **direct violation** of the anti-pattern "❌ 'I'll do these 5 audits serially in one chain'" — the doc is doing exactly that by using one scout for everything.

#### 3.3 Scenario: "Should we use Zustand or Redux?"
The step list says:
```
1. parallel(
     researcher("Zustand vs Redux..."),
     scout("What state management is currently used?")
   )
```
This is actually good! But the **presentation format** is weak. In the markdown, the "parallel" step is just a bullet point, not a code block. It's easy to miss. More importantly, the synthesis step is not shown as a single consolidator — it says:
> "Synthesize: Present tradeoff matrix..."

This suggests the **orchestrator does the synthesis**, which contradicts the rule that analysis is NEVER the orchestrator's job. Missing: an explicit `delegate` or `reviewer` consolidation step before synthesis.

---

## 4. Parallel → Parallel Without Consolidator — Weaknesses

### The Problem

The doc has the strongest possible rule here:

> "**Rule:** If a chain step produces N independent artifacts, the next step in the chain should be a SINGLE agent that reads all N and produces one consolidated output. **Never chain parallel → parallel without a single-agent step between.**"

However, **enforcement relies entirely on the orchestrator's self-discipline**. There are no structural or tooling guardrails mentioned.

### Specific Gaps

#### 4.1 No Consequence for Violation
The anti-pattern is labeled "❌" but there is no explanation of *why* it fails or what happens if you do it. Missing: *"Without a consolidator, integration issues multiply and no single agent has full context, leading to conflicting implementations and silent failures."*

#### 4.2 The Doc's Own Examples Are Inconsistent
The large-scale Pattern H example shows:
```
// Step 3: Parallel workers execute independent phases
→ parallel(
    worker("Implement Phase 1 fixes"),
    worker("Implement Phase 2 fixes")
  )
// Step 4: Single reviewer checks integration
→ reviewer("Read plan.md and all progress.md files...")
```
This is correct. But the "Phase 1" and "Phase 2" comment structure could be misread as:
```
// Phase 1: worker
// Phase 2: worker
// Phase 3: reviewer
```
An orchestrator might think "phases" are inherently serial and skip the parallel-consolidation rule. Missing: explicit annotation like *"Steps 3 and 4 form a parallel → single pattern. Never add Step 5 as another parallel block without a consolidator."*

#### 4.3 Missing: Nested Parallel Detection
There is no rule about **nested parallelism** — e.g., parallel workers each spawning parallel sub-tasks. This is a form of parallel → parallel without a consolidator at the intermediate level. Missing: *"Workers MUST NOT spawn parallel subagents. If a worker's task needs subdivision, the orchestrator should have subdivided it before delegating."*

---

## 5. Missing Rules & Weak Language

### 5.1 The "Default" Is Not Explicitly Parallel
The doc states:
> "**Rule of thumb:** If a task would take more than 3 sentences to describe to a human engineer, delegate it."

It does NOT say:
> "**Rule of thumb:** If a task would take more than 3 sentences to describe, delegate it **and default to parallel execution unless dependencies prove otherwise.**"

This is the single most important missing rule. Parallelism is framed as an *optimization* for analysis, not as the *default mode of operation*.

### 5.2 Weak Modal Language in Critical Rules

| Strong Language | Weak Language | Location |
|---------------|---------------|----------|
| "NEVER your job" | | Synthesis vs Analysis |
| "MUST be parallelized" | | Analysis tasks heading |
| "Never chain parallel → parallel" | | Pattern H rule |
| | "should be a SINGLE agent" | Pattern H rule ("should" vs "must") |
| | "Use chains ONLY when steps have dependencies" | Anti-pattern (strong, but in negative form) |
| | "If in doubt, delegate" | Decision Tree |

The word **"should"** in the Pattern H rule is a critical weakness. It should be **"MUST"**.

### 5.3 Missing: The 3-Sentence Rule Should Mention Parallel
The 3-sentence rule is the most frequently cited heuristic in the doc. It never mentions parallelization. Adding *"and consider parallelizing"* would make parallel analysis the default for any non-trivial task.

### 5.4 Missing: Analysis Task Definition
"Analysis tasks MUST be parallelized" is strong, but what counts as an "analysis task"? The doc never defines it. Is bug diagnosis analysis? Is reading one file to check a line number analysis? Missing: *"Any task requiring comparison, evaluation, gap identification, tradeoff assessment, or synthesis from multiple sources is an analysis task and MUST be parallelized."*

### 5.5 Missing: Parallelism for External Research
The doc has `researcher` agents but never explicitly mandates parallel researchers. The Zustand/Redux example shows parallel research, but there is no general rule. Missing: *"External research on multiple topics MUST be executed by parallel researchers."*

### 5.6 Missing: Fork Review as Parallel-by-Default
The fork review pattern (Pattern C) is documented, but it is not explicitly framed as a *parallel* pattern. It says:
> "DON'T wait for worker to finish to launch reviewer"

This is about *timing*, not about *parallel structure*. Missing: *"Quality gates MUST be launched in parallel with the work they review, not serially after completion."*

### 5.7 No Structural Enforcement
The doc is purely prescriptive. There is no mention of:
- Linting or validation of chain structures
- Automated detection of serial scout chains
- Required minimum parallel agents for analysis tasks
- A checklist or rubric for orchestrators to self-audit their plans

---

## 6. Recommendations

### Immediate (Language Changes)

1. **Change "should" to "MUST"** in the Pattern H consolidation rule.
2. **Add a positive default rule:** *"Parallel execution is the default for all non-trivial tasks. Serial chains require justification based on proven dependencies."*
3. **Expand the 3-sentence rule:** *"If a task would take more than 3 sentences to describe to a human engineer, delegate it and default to parallel execution."*
4. **Define analysis tasks explicitly** with a bulleted list of examples.

### Short-Term (Example Fixes)

5. **Fix the "Refactor the API layer" scenario** to use parallel scouts in Step 1.
6. **Fix the "Fix this bug" scenario** to show optional parallel scouts for non-trivial bugs.
7. **Fix the "Should we use Zustand or Redux?" scenario** to include a `delegate` or `reviewer` consolidation step before orchestrator synthesis.
8. **Fix the Context Budget Rules table** to include parallelization notes for multi-file tasks.

### Medium-Term (Structural Additions)

9. **Add a minimum parallelism rule:** *"Analysis tasks MUST be decomposed into at least 3 independent angles and executed in parallel."*
10. **Add a consolidator type guide:** A table mapping parallel output types → consolidator agent type.
11. **Add a self-audit checklist** for orchestrators to verify their plans before execution.
12. **Add a "Nested Parallelism Prohibited" rule** to prevent workers from spawning parallel subagents.

---

## 7. Severity Matrix

| Issue | Impact | Difficulty to Fix | Priority |
|-------|--------|-------------------|----------|
| "should" instead of "MUST" in Pattern H | Orchestrators may skip consolidators | Trivial (1 word) | 🔴 Critical |
| No default parallel rule | Serial chains become the implicit norm | Easy (1 sentence) | 🔴 Critical |
| 3-sentence rule omits parallel | Most-used heuristic doesn't promote parallelism | Easy (1 phrase) | 🔴 Critical |
| "Refactor API" example uses single scout | Doc models the anti-pattern it prohibits | Medium (rewrite example) | 🟠 High |
| No minimum parallel angle count | Orchestrators can technically comply with 2 agents | Easy (1 sentence) | 🟠 High |
| No analysis task definition | Ambiguity about what MUST be parallelized | Medium (new paragraph) | 🟡 Medium |
| No nested parallelism rule | Hidden parallel→parallel violations | Easy (1 rule) | 🟡 Medium |
| No consolidator type guide | Inconsistent agent selection | Medium (new table) | 🟢 Low |

---

*End of audit.*
