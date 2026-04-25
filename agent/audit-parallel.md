# Parallel Branch → Consolidator (Pattern H) Audit

Audit of all 7 agent specs under `/Users/texoport/.pi/agent/agents/*.md` for support of parallel branch flows.

---

## Summary

**Zero of 7 agents** contain explicit instructions for safe participation in parallel branches. Only **context-builder** references a chain-scoped directory. No agent documents how to avoid file collisions, read multiple peer artifacts, or act as a consolidator. The orchestrator mandate (AGENTS.md) describes Pattern H extensively, but this knowledge is not pushed down into the individual agent specs that actually execute the work.

---

## scout.md

| Question | Finding |
|----------|---------|
| 1. Unique/prefixed output paths? | **No.** Default output is hardcoded to `context.md` with no prefixing guidance. |
| 2. References `chain_dir` or scoped outputs? | **No.** Says "When running in a chain, you'll receive instructions about where to write your output" but does not name `chain_dir` or explain scoped directories. |
| 3. Assumes sole producer of its output file? | **Yes.** Always targets `context.md`. No warning that other parallel scouts may overwrite it. |
| 4. Missing parallel-branch instructions? | **Yes.** No guidance for running N-at-a-time alongside other scouts (e.g., `scout × 5` in Pattern H). Does not instruct to use task-specific prefixes like `auth-context.md`. |
| 5. Consolidator instructions for reading multiple artifacts? | **N/A** — scout is a leaf producer, not a consolidator. |

**Risk:** Multiple parallel scouts will all attempt to write `context.md` unless the orchestrator overrides the path in every task. The agent spec gives the orchestrator no help here.

---

## planner.md

| Question | Finding |
|----------|---------|
| 1. Unique/prefixed output paths? | **No.** Default output is `plan.md`. No prefixing guidance. |
| 2. References `chain_dir` or scoped outputs? | **No.** Mentions chain execution for read/write targets but does not reference `chain_dir`. |
| 3. Assumes sole producer of its output file? | **Yes.** Hardcoded `plan.md`. |
| 4. Missing parallel-branch instructions? | **Yes.** No guidance for scenarios where multiple planners run in parallel (rare but possible in large plans). |
| 5. Consolidator instructions for reading multiple artifacts? | **Partial.** Says "you'll receive instructions about which files to read" — implies multi-file input, but does not explicitly tell the planner to expect *N* peer artifacts from a parallel step and synthesize them into one plan. |

**Risk:** When acting as the consolidator after `parallel(scout × 5)`, the planner has no spec-level instruction to read multiple `*-context.md` files and merge them. It relies entirely on the orchestrator's task prompt.

---

## worker.md

| Question | Finding |
|----------|---------|
| 1. Unique/prefixed output paths? | **No.** No default output file; mentions "progress tracking" but does not instruct workers to use unique names in parallel runs. |
| 2. References `chain_dir` or scoped outputs? | **No.** Mentions chain instructions for reading/writing but does not reference `chain_dir`. |
| 3. Assumes sole producer of its output file? | **Implicitly yes.** Uses `progress.md` in examples with no collision warning. |
| 4. Missing parallel-branch instructions? | **Yes.** No guidance for parallel workers (e.g., `parallel(worker, worker)` in Pattern H). Does not tell workers to write to `progress-frontend.md` vs `progress-api.md`. |
| 5. Consolidator instructions for reading multiple artifacts? | **Partial.** `defaultReads: context.md, plan.md` shows multi-file reading, but no instruction for reading *N* peer progress files. |

**Risk:** Parallel workers will collide on `progress.md` unless the orchestrator manually prefixes every task. The worker spec is also missing the critical "read multiple peer outputs" pattern needed when a worker consolidates.

---

## reviewer.md

| Question | Finding |
|----------|---------|
| 1. Unique/prefixed output paths? | **No.** No default output file specified. |
| 2. References `chain_dir` or scoped outputs? | **No.** |
| 3. Assumes sole producer of its output file? | **Not explicit.** No default output to collide on. |
| 4. Missing parallel-branch instructions? | **Yes.** No guidance for running multiple reviewers in parallel (e.g., one per subsystem). |
| 5. Consolidator instructions for reading multiple artifacts? | **Partial.** `defaultReads: plan.md, progress.md` reads two artifacts, but the spec does not scale this to *N* artifacts. When reviewer acts as the final quality gate after parallel workers, it has no instruction to read `progress-1.md`, `progress-2.md`, etc. |

**Risk:** Reviewer is frequently the consolidator in Pattern H (Step 5). The spec does not prepare it to ingest an arbitrary number of peer progress files.

---

## researcher.md

| Question | Finding |
|----------|---------|
| 1. Unique/prefixed output paths? | **No.** Default output is `research.md`. |
| 2. References `chain_dir` or scoped outputs? | **No.** |
| 3. Assumes sole producer of its output file? | **Yes.** Hardcoded `research.md`. |
| 4. Missing parallel-branch instructions? | **Yes.** No guidance for parallel researchers (e.g., `parallel(researcher, researcher)` for multi-topic research). |
| 5. Consolidator instructions for reading multiple artifacts? | **N/A** — leaf producer. |

**Risk:** Parallel researchers will overwrite each other's `research.md`. The spec should instruct researchers to accept an output path or use topic prefixes.

---

## delegate.md

| Question | Finding |
|----------|---------|
| 1. Unique/prefixed output paths? | **No.** Minimal spec; no output file mentioned at all. |
| 2. References `chain_dir` or scoped outputs? | **No.** |
| 3. Assumes sole producer of its output file? | **N/A** — no output specified. |
| 4. Missing parallel-branch instructions? | **Yes.** No guidance. Because it has no default reads or output, it is a blank slate — but also has no hints for safe parallel usage. |
| 5. Consolidator instructions for reading multiple artifacts? | **No.** No default reads specified. |

**Risk:** Delegate is often used as the consolidator in Pattern H (e.g., after parallel scouts). Its minimal spec means every consolidator behavior must be driven entirely by the orchestrator's prompt. The agent has no built-in awareness that it should expect multiple input artifacts.

---

## context-builder.md

| Question | Finding |
|----------|---------|
| 1. Unique/prefixed output paths? | **No.** Generates `context.md` and `meta-prompt.md` by default. No prefixing. |
| 2. References `chain_dir` or scoped outputs? | **Yes — partially.** This is the *only* agent that explicitly says: "When running in a chain, generate two files in the specified chain directory." It is aware of chain-scoped directories, though it does not use the template variable name `chain_dir`. |
| 3. Assumes sole producer of its output file? | **Yes.** Still hardcodes `context.md` and `meta-prompt.md` with no collision avoidance. |
| 4. Missing parallel-branch instructions? | **Yes.** Even though it knows about chain directories, it does not mention what to do when multiple context-builders run in parallel within that directory. |
| 5. Consolidator instructions for reading multiple artifacts? | **N/A** — producer. |

**Risk:** Best awareness of chain context among all agents, but still lacks parallel-safety guidance.

---

## Cross-Cutting Gaps

### Gap 1: No `chain_dir` awareness in 6 of 7 agents
Only `context-builder.md` references a chain-scoped directory. The orchestrator mandate defines `chain_dir` as a chain template variable for shared output, but `scout`, `planner`, `worker`, `reviewer`, `researcher`, and `delegate` do not know this variable exists.

### Gap 2: No collision-avoidance instructions
Every agent with a default output file (`scout`, `planner`, `researcher`, `context-builder`) hardcodes a single filename. None tell the agent: "If your task prompt includes a custom output path or prefix, use it." This makes parallel execution fragile.

### Gap 3: No consolidator role definition
`planner`, `reviewer`, and `delegate` are frequently used as consolidators in Pattern H, yet none have instructions like:
- "You may receive multiple peer artifacts from a parallel step. Read all of them."
- "Synthesize conflicting information into a single coherent output."
- "Reference artifacts by file path; do not wait for inline context."

### Gap 4: No explicit Pattern H reference
The orchestrator mandate describes Pattern H in detail, but no agent spec mentions it. Agents cannot self-correct for parallel flow because they have never been told it exists.

---

## Recommendations

1. **Add `chain_dir` awareness** to all agent specs that participate in chains (`scout`, `planner`, `worker`, `reviewer`, `delegate`). Reference the template variable explicitly.

2. **Add collision-avoidance instructions** to all producers: "If an output path or prefix is provided in your task instructions, use it instead of the default filename. When running in parallel with peer agents, expect a unique prefix."

3. **Add consolidator instructions** to `planner`, `reviewer`, and `delegate`: "You may be asked to read multiple artifacts produced by parallel peer agents. Read every file referenced in your task, resolve conflicts, and produce a single consolidated output."

4. **Add parallel-branch hint to all agents**: "You may be running as one of N parallel agents. Do not assume you are the sole writer to the working directory."
