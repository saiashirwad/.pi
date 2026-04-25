# Implementation Plan

## Goal
Apply audit findings from four recon/parallel/consolidation/anti-pattern audits to harden `AGENTS.md` and align all 7 subagent specs with the updated rules.

## Tasks
1. **Apply P0 edits to AGENTS.md** — Critical language fixes that close loopholes and contradictions.
   - Change Pattern H "should" → "MUST" (consolidator rule).
   - Append parallel-default clause to the 3-sentence rule.
   - Tighten bash allowance to "user-provided path only" to block laundering.
   - Add Exa tools to Tool Usage Matrix and rewrite preamble.
   - Rewrite Pattern C example to show true fork, not serial fallback.
   - Document Pattern G exception to "always fork, never serial".

2. **Apply P1 edits to AGENTS.md** — Major example and guardrail fixes.
   - Rewrite "Refactor the API layer" scenario to use parallel scouts.
   - Add parallel-scout note to "Fix this bug" scenario.
   - Insert `delegate` consolidator into "Zustand or Redux" scenario.
   - Add minimum-3-angles rule to analysis tasks.
   - Cap Pattern G loops at 3 iterations with planner escalation.
   - Define reviewer authority limits (minor fixes only).
   - Add new `Violation Handling & Recovery` section.
   - Add `Subagent Failure Protocol` subsection.

3. **Apply P2 edits to AGENTS.md** — Clarifications and cross-references.
   - Distinguish task classification vs deep analysis.
   - Add trivial-input exception to mandatory `subagent()` launch.
   - Define `context-builder` in Decision Tree.
   - Add artifact freshness / versioning guidance.
   - Expand Anti-Patterns catalog (3 new patterns).
   - Add consolidator type guide table.
   - Add parent-rule awareness note in `Remember` section.

4. **Update subagent specs** — Apply `ralph/subagent-spec-updates.md` to all 7 specs.
   - `scout.md` — Add parent awareness, deduplication, artifact freshness.
   - `delegate.md` — Expand from stub; add consolidation role, sizing guardrail.
   - `planner.md` — Add consolidation role, parallel plan mandate, stale plan check.
   - `worker.md` — Add nested-orchestration prohibition, self-review ban, parent awareness.
   - `reviewer.md` — Add authority limits, loop guardrails, integration focus.
   - `researcher.md` — Add local-recon refusal, parallel focus, output discipline.
   - `context-builder.md` — Add role boundary, AGENTS.md alignment, parent awareness.

5. **Review for internal consistency** — After edits, run a `reviewer` subagent to check that:
   - No example contradicts a rule.
   - All "MUST" / "NEVER" language is matched by an example.
   - The Tool Usage Matrix covers every tool mentioned in the preamble.

## Files to Modify
- `/Users/texoport/.pi/agent/AGENTS.md` — all P0/P1/P2 edits listed in `ralph/cleanup-plan.md`
- `/Users/texoport/.pi/agent/agents/scout.md` — per `ralph/subagent-spec-updates.md`
- `/Users/texoport/.pi/agent/agents/delegate.md` — per `ralph/subagent-spec-updates.md`
- `/Users/texoport/.pi/agent/agents/planner.md` — per `ralph/subagent-spec-updates.md`
- `/Users/texoport/.pi/agent/agents/worker.md` — per `ralph/subagent-spec-updates.md`
- `/Users/texoport/.pi/agent/agents/reviewer.md` — per `ralph/subagent-spec-updates.md`
- `/Users/texoport/.pi/agent/agents/researcher.md` — per `ralph/subagent-spec-updates.md`
- `/Users/texoport/.pi/agent/agents/context-builder.md` — per `ralph/subagent-spec-updates.md`

## New Files
- `ralph/cleanup-plan.md` — prioritized cleanup instructions (already written)
- `ralph/subagent-spec-updates.md` — subagent specification updates (already written)
- `ralph/violation-log.md` — placeholder for future violation tracking (create empty)

## Dependencies
- **Task 1 (P0)** must be completed before Tasks 2–4 because it hardens the core mandate that the specs reference.
- **Task 4 (spec updates)** depends on Task 3 completing the `context-builder` definition and parent-rule awareness note in AGENTS.md.
- **Task 5 (review)** depends on all prior tasks.

## Risks
- Rewriting multiple scenarios in AGENTS.md could introduce new contradictions. Task 5 (reviewer pass) mitigates this.
- Changing `delegate.md` from a 2-line stub to a full spec may alter behavior for existing orchestration flows. Monitor for over-rejection (`OVERSIZED_TASK`) on borderline tasks.
- The bash loophole fix relies on the LLM interpreting "user's original prompt" correctly; there is still no runtime enforcement.
