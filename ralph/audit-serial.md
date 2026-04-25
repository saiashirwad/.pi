# Audit: Overly Serial Patterns in AGENTS.md

## Executive Summary

AGENTS.md contains multiple delegation patterns and scenario examples that present **unnecessarily sequential chains** when parallel alternatives exist or when later steps could be forked concurrently with earlier ones. The document correctly champions parallelism in some sections (Pattern C fork review, Pattern D multiple workers, Pattern E scout network, Pattern H parallel branches) but **fails to apply those same insights** to its own canonical patterns. This creates a contradictory instruction set where the "default" patterns teach serialism while the "advanced" patterns teach parallelism.

---

## Finding 1: Pattern A (Recon → Plan → Execute) — 4-Step Serial Chain

**Quoted text:**

> ```
> scout("Find all files related to user auth, return context.md")
>   → planner("Read context.md, create plan.md for adding OAuth")
>   → worker("Read context.md and plan.md, implement the changes")
>   → reviewer("Read plan.md and verify implementation")
> ```

**Why it's unnecessarily serial:**

Steps 1→2 and 2→3 have genuine dependencies (planner needs scout output; worker needs plan). However, **step 4 (reviewer) does not need to wait for the worker to finish**. Pattern C — defined later in the same document — explicitly demonstrates fork review: "DON'T wait for worker to finish to launch reviewer." Pattern A ignores this entirely, teaching orchestrators to burn time waiting for implementation to complete before starting quality verification. Additionally, for any non-trivial auth system, a single scout is insufficient; Pattern E (parallel scouts) should be the default, not the exception.

**Proposed parallel rewrite:**

```
parallel(
  scout("Find auth-related files, routes, middleware, and tests. Write auth-context.md"),
  scout("Find user DB schema and session/token storage. Write auth-db-context.md")
)
→ planner("Read auth-context.md and auth-db-context.md. Create plan.md")
→ worker("Implement changes per plan.md", output="progress.md")
  // FORKED IN PARALLEL — do not wait for worker to finish
→ reviewer("Read plan.md and monitor progress.md. Verify against acceptance criteria")
→ Synthesize
```

---

## Finding 2: Context Budget Rules — "Need to implement anything"

**Quoted text:**

> | Need to implement anything | `scout` → `planner` → `worker` |

**Why it's unnecessarily serial:**

This table entry encodes a 3-step serial chain as the default for all implementation work. It makes no mention of Pattern D (Multiple Workers), which allows independent implementation tasks to proceed in parallel after planning. For any plan with independent sections (e.g., backend API + frontend components), forcing a single worker serializes work that could be done concurrently.

**Proposed edit:**

Replace the table row with:

> | Need to implement anything | `scout` (parallel if multiple subsystems) → `planner` → `worker` (parallel if independent tasks) → `reviewer` (forked) |

---

## Finding 3: Context Budget Rules — "Need to fix a bug" (The 4-Step Serial Bug-Fix)

**Quoted text:**

> | Need to fix a bug | `scout` → `planner` → `worker` → `reviewer` |

**Why it's unnecessarily serial:**

This is the most egregious example of forced sequentialism in the document. It mandates a 4-step serial chain for every bug fix. The document **already knows** that reviewers can be forked (Pattern C) and that scouts can run in parallel (Pattern E). A bug fix in a distributed system might require scouting the frontend, backend, and database layers simultaneously. The planner step can be skipped entirely for small bugs (the document's own "delegate" agent handles "<5 min" tasks). Presenting a 4-step chain as the default teaches orchestrators to be slow by default.

**Proposed edit:**

Replace the table row with:

> | Need to fix a bug | `scout` (parallel if multi-component) → `planner` (skip for trivial bugs, use `delegate`) → `worker` → `reviewer` (forked, never serial) |

**Concrete rewrite of the full bug-fix scenario:**

The document's explicit scenario:

> ```
> 1. scout("Find login-related code and error handling. What changed recently?")
> 2. // Read scout's context.md (this is your 2-file budget)
> 3. planner("Create plan to fix login bug based on context.md")
> 4. worker("Implement fix per plan.md")
> 5. reviewer("Verify fix handles edge cases")
> 6. Synthesize: "Bug was in src/auth.ts:42 — missing null check. Fixed and verified."
> ```

Should be rewritten as:

```
1. parallel(
     scout("Find login code and error handling. Write login-context.md"),
     scout("Check recent git changes to auth files. Write git-context.md")
   )
2. planner("Read login-context.md and git-context.md. Create plan.md")
3. worker("Implement fix per plan.md", output="progress.md")
   // FORKED — launched immediately after worker begins
4. reviewer("Read plan.md and monitor progress.md for edge case gaps")
5. Synthesize
```

---

## Finding 4: Pattern G (Self-Correction Loop) — Loop Serialism Without Parallel Dispatch

**Quoted text:**

> ```
> worker("Implement feature")
> → reviewer("Review implementation")
> // If reviewer finds issues:
> → worker("Fix issues identified by reviewer", reads=["review-notes.md"])
> → reviewer("Re-verify")
> // Loop until reviewer approves
> ```

**Why it's unnecessarily serial:**

While iterative loops have dependencies, the document presents **only** the serial loop. It never mentions that if a reviewer finds **multiple independent issues** (e.g., "auth bug in file A, CSS bug in file B, test missing in file C"), a single serial worker fixes them one at a time. Pattern D (Multiple Workers) should apply here: dispatch parallel workers for disjoint fixes, then run a single re-verification reviewer.

**Proposed parallel rewrite:**

```
worker("Implement feature", output="progress.md")
  // FORKED
→ reviewer("Review progress.md. Write review-notes.md with categorized issues")
// If reviewer finds issues:
→ planner("Read review-notes.md. Group issues into independent fix batches. Write fix-plan.md")
→ parallel(
    worker("Fix batch 1 per fix-plan.md", output="fix-1.md"),
    worker("Fix batch 2 per fix-plan.md", output="fix-2.md"),
    worker("Fix batch 3 per fix-plan.md", output="fix-3.md")
  )
→ reviewer("Re-verify all fix outputs against fix-plan.md")
// Loop until reviewer approves
```

---

## Finding 5: Scenario — "Refactor the API layer" — Serial Phases

**Quoted text:**

> ```
> 1. scout("Thorough: Map entire API layer — all files, dependencies, test coverage")
> 2. planner("Create refactoring plan with phases")
> 3. // Phase 1:
> 4. worker("Refactor authentication endpoints per plan.md phase 1")
> 5. reviewer("Review phase 1")
> 6. // Phase 2:
> 7. worker("Refactor data endpoints per plan.md phase 2")
> 8. reviewer("Review phase 2")
> 9. reviewer("Full integration review")
> 10. Synthesize final report
> ```

**Why it's unnecessarily serial:**

The document never states that Phase 1 and Phase 2 depend on each other. If the planner designed independent phases (which is the whole point of phased planning), forcing `Phase 1 → Review 1 → Phase 2 → Review 2` serializes independent work. The full integration reviewer (step 9) must wait for both phases, but steps 4–5 and 7–8 can run in parallel. The example teaches orchestrators to default to phase-gating even when no dependency exists.

**Proposed parallel rewrite:**

```
1. scout("Thorough: Map entire API layer — all files, dependencies, test coverage")
2. planner("Create refactoring plan with independent phases")
3. parallel(
     worker("Refactor auth endpoints per plan.md phase 1", output="phase-1.md"),
     worker("Refactor data endpoints per plan.md phase 2", output="phase-2.md")
   )
   // FORKED reviewers for each phase, running in parallel with workers
4. parallel(
     reviewer("Review phase 1 output against plan"),
     reviewer("Review phase 2 output against plan")
   )
5. reviewer("Full integration review of phase-1.md and phase-2.md")
6. Synthesize final report
```

---

## Finding 6: Context Budget Rules — "Need to understand architecture"

**Quoted text:**

> | Need to understand architecture | `scout` → synthesize |

**Why it's unnecessarily serial:**

This implies a single scout probes the entire architecture, then the orchestrator synthesizes. For any codebase larger than a few files, architecture understanding requires investigating the database layer, API layer, frontend state, build system, and deployment config — all independent domains. Pattern E (Scout Network) exists specifically for this, yet the default table entry suggests a single scout.

**Proposed edit:**

> | Need to understand architecture | `scout` (parallel network, one per subsystem) → synthesize |

---

## Finding 7: The `→` Arrow Notation Itself Encodes Serial Assumptions

**Quoted text (throughout document):**

> `scout → planner → worker`
> `scout → planner → worker → reviewer`
> `scout → synthesize`

**Why it's unnecessarily serial:**

The arrow notation (`→`) is used pervasively in the Context Budget Rules table and pattern definitions. In a document that elsewhere fights against serialism ("❌ 'I'll do these 5 audits serially in one chain'"), the arrow has become a **visual shorthand for "must wait for previous step to complete."** It appears 8+ times in the Context Budget table alone. There is no alternative notation for "these steps can be forked" or "these run in parallel." The only parallel notation used is explicit `parallel()` blocks, which are reserved for "advanced" patterns.

**Proposed edit:**

Introduce a fork notation and use it in the table:

> | Need to fix a bug | `scout` → `planner` → `worker` ⇉ `reviewer` |

Where `⇉` means "fork in parallel, do not wait for completion." Update Pattern A and all scenario examples to use `⇉` before the reviewer step.

---

## Summary Table

| Location | Serial Pattern | Parallel Opportunity | Severity |
|----------|---------------|----------------------|----------|
| Pattern A | 4-step chain | Fork reviewer; parallel scouts | High |
| Context Budget: implement | `scout→planner→worker` | Parallel workers after plan | Medium |
| Context Budget: bug fix | `scout→planner→worker→reviewer` | Fork reviewer; parallel scouts | **Critical** |
| Bug-fix scenario | Explicit 5-step serial scenario | Rewrite with forked reviewer | High |
| Pattern G | Single serial correction loop | Parallel workers for independent fixes | Medium |
| API refactor scenario | Serial phases 1→2 | Parallel phase execution | Medium |
| Context Budget: architecture | Single scout | Parallel scout network | Low |
| Notation | `→` implies mandatory wait | Add `⇉` fork notation | Low |

---

## Recommendation

1. **Rewrite Pattern A** to use parallel scouts and a forked reviewer.
2. **Update the Context Budget Rules table** to use fork notation (`⇉`) for reviewers and to recommend parallel scouts/workers where applicable.
3. **Rewrite the bug-fix scenario** as the canonical example of forked review, not serial review.
4. **Add a sentence to Pattern G** noting that independent fixes found by a reviewer should be dispatched to parallel workers.
5. **Audit all `→` arrows** in scenario examples and replace with `⇉` wherever the next step is a reviewer or independent worker.
