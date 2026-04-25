# Agent Spec Audit: Output Conventions, Reads, Progress, and Tools

## Per-Agent Breakdown

### context-builder
| Attribute | Value |
|-----------|-------|
| Output | `context.md` (solo), `context.md` + `meta-prompt.md` (chain) |
| defaultReads | none |
| defaultProgress | not set |
| Tools | read, grep, find, ls, bash, web_search |

### delegate
| Attribute | Value |
|-----------|-------|
| Output | none (inherits parent) |
| defaultReads | none |
| defaultProgress | not set |
| Tools | none listed (inherits parent model) |

### planner
| Attribute | Value |
|-----------|-------|
| Output | `plan.md` |
| defaultReads | `context.md` |
| defaultProgress | not set |
| Tools | read, grep, find, ls, write |

### researcher
| Attribute | Value |
|-----------|-------|
| Output | `research.md` |
| defaultReads | none |
| defaultProgress | `true` |
| Tools | read, write, web_search, fetch_content, get_search_content |

### reviewer
| Attribute | Value |
|-----------|-------|
| Output | none specified |
| defaultReads | `plan.md`, `progress.md` |
| defaultProgress | `true` |
| Tools | read, grep, find, ls, bash |

### scout
| Attribute | Value |
|-----------|-------|
| Output | `context.md` |
| defaultReads | none |
| defaultProgress | `true` |
| Tools | read, grep, find, ls, bash, write |

### worker
| Attribute | Value |
|-----------|-------|
| Output | none specified |
| defaultReads | `context.md`, `plan.md` |
| defaultProgress | `true` |
| Tools | none listed (inherits parent model) |

---

## Cross-Cutting Analysis

### 1. Are output filenames predictable and chain-compatible?

**Mostly yes, with one collision risk:**

- `planner` → `plan.md` (unique)
- `researcher` → `research.md` (unique)
- `context-builder` → `context.md` + `meta-prompt.md`
- `scout` → `context.md`

**Conflict:** Both `context-builder` and `scout` default to `context.md`. If 5 scouts run in parallel in the *same directory*, they will overwrite each other. The specs mitigate this by saying "in a chain, you'll receive instructions about where to write" (chain directory isolates them). However, the **default filenames are not chain-compatible** without explicit directory isolation. The orchestrator AGENTS.md explicitly warns about this ("if 5 scouts run in parallel, will they all overwrite context.md?") — the answer is **yes**, unless the orchestrator passes distinct output paths.

`delegate` and `worker` have no default output file, so they are safe but less predictable for artifact handoff.

### 2. Are defaultReads sensible for the agent's position in the pipeline?

| Agent | defaultReads | Sensible? |
|-------|-------------|-----------|
| planner | `context.md` | ✅ Yes — reads upstream context |
| reviewer | `plan.md`, `progress.md` | ✅ Yes — needs plan + current progress |
| worker | `context.md`, `plan.md` | ✅ Yes — needs context + plan to execute |
| delegate | none | ✅ Yes — lightweight, task-specific |
| scout | none | ✅ Yes — starts from scratch |
| context-builder | none | ✅ Yes — starts from user requirements |
| researcher | none | ⚠️ **Risk** — research tasks often need codebase context (`context.md`). If a researcher is launched after a scout, it won't auto-read the context. |

**Verdict:** `researcher` is the only one with a potential gap. Its research may be codebase-dependent but it has no defaultReads to pull in prior context.

### 3. Are tool lists accurate?

| Issue | Agent | Details |
|-------|-------|---------|
| **Missing `write` tool** | `reviewer` | Spec says "Update progress.md" and "fix them directly" (edits code), but tool list is `read, grep, find, ls, bash`. **No `write` or `edit` tool.** This is a real bug — reviewer cannot update progress.md or fix code without a write tool. |
| **"No changes" vs has `write`** | `planner` | Spec says "You must NOT make any changes. Only read, analyze, and plan." but includes `write` tool. This is *acceptable* because `write` is only for the output artifact (`plan.md`), but the wording is slightly contradictory. |
| **Bash restriction without enforcement** | `reviewer` | Spec says "Bash is for read-only commands only" but there is no mechanism to enforce this. The tool list just includes `bash` with no restrictions. |
| **No tools listed** | `delegate`, `worker` | Spec says they "inherit the parent model". `worker` description says "Use all available tools as needed." This is vague but probably works in practice. However, it means the orchestrator cannot gate what tools a worker uses. |
| **Unique researcher tools** | `researcher` | Has `fetch_content` and `get_search_content` which no other agent lists. This is fine (research-specific), but inconsistent if other agents need to fetch web content. |

### 4. Missing or inconsistent conventions between agents

#### defaultProgress inconsistency
- **Has it:** `researcher`, `reviewer`, `scout`, `worker`
- **Missing it:** `context-builder`, `delegate`, `planner`

`planner` and `context-builder` are file-producing agents. It would be useful for the orchestrator to know their progress, yet they don't have `defaultProgress: true`. `delegate` is lightweight so its absence may be intentional.

#### Missing `edit` tool
No agent spec lists the `edit` tool explicitly. If the pi harness auto-injects `edit` for agents with `write`, that's fine. But `reviewer` doesn't even have `write`, so it presumably lacks `edit` too.

#### Output filename collisions
- `context-builder` and `scout` both output `context.md` by default.
- `worker` and `delegate` have no default output, making artifact handoff less predictable.

#### Tool list completeness
- `reviewer` is the only agent that claims to modify files ("fix them directly", "Update progress.md") but lacks the `write` tool.
- `planner` includes `write` but no `edit`, which may be fine since planners typically write a single new file.
- `scout` includes `write` but no `edit` — scouts typically write a single report, so this is acceptable.

#### defaultReads asymmetry
- `worker` reads both `context.md` and `plan.md`
- `reviewer` reads `plan.md` and `progress.md`
- `planner` reads only `context.md`
- No agent reads `research.md` by default, even though `researcher` produces it. If research feeds into planning, `planner` should potentially read `research.md` too (or the orchestrator must pass it).

---

## Recommendations

1. **Fix reviewer tool list:** Add `write` (and implicitly `edit`) to `reviewer.md` so it can update `progress.md` and apply fixes.
2. **Resolve context.md collision:** Either rename scout output to `scout-context.md` or document that parallel scouts MUST receive distinct output paths.
3. **Add defaultProgress to planner and context-builder:** They produce artifacts; tracking their progress is valuable.
4. **Consider adding `context.md` to researcher defaultReads:** When research follows a scout, the researcher should auto-read the codebase context.
5. **Clarify worker/delegate tool inheritance:** Document whether "inherit parent model" means "all tools" or "same tools as parent". If it means all tools, make this explicit.
