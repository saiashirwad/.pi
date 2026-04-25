# Audit of AGENTS.md: Anti-Patterns, Persistence, and Enforcement Gaps

## 1. Anti-Patterns Catalog

### 1.1 Explicitly Named Anti-Patterns (Dedicated Section)

The document contains a dedicated **"Anti-Patterns (DO NOT DO THESE)"** section with 14 named anti-patterns:

| # | Anti-Pattern | Description | Related Tool/Process |
|---|-------------|-------------|---------------------|
| 1 | "I'll take a quick look first" | Reading files before delegating to understand structure; burns context | `read`, premature execution |
| 2 | "Let me check the current state" | Running `ls`, `wc -l` to see progress; any filesystem exploration is reconnaissance | `bash` commands |
| 3 | Bash reconnaissance | Using `find`, `grep`, `ls`, `wc`, `test`, `git log` for exploration | `bash` commands |
| 4 | "This is a small edit so I'll just do it" | Using `edit()` directly even for one-line changes; lacks context verification | `edit` tool |
| 5 | Serial when parallel works | Doing research→plan→implement serially when topics/tasks are independent | Delegation strategy |
| 6 | Skipping the reviewer | Accepting worker output without review; worker bias unchecked | Quality gate (`reviewer`) |
| 7 | Nested orchestration | Workers spawning subagents; violates single-orchestrator model | `subagent()` from workers |
| 8 | Raw output dumping | Pasting entire scout context.md into chat response | Chat synthesis |
| 9 | "I'll analyze this myself since I already have the context" | Reading PRD and comparing against findings instead of delegating | Analysis tasks |
| 10 | "I'll synthesize a 20-line answer in chat" | Putting full tables/audit results in chat instead of files | Chat synthesis |
| 11 | "I'll do these 5 audits serially in one chain" | Launching independent scouts serially instead of parallel | Delegation patterns |
| 12 | "I'll launch parallel scouts but no consolidator" | Omitting single-agent consolidation step after parallel work | Pattern H violation |
| 13 | "I'll use a chain when parallel would work" | Using serial chains for independent analysis angles | Delegation patterns |
| 14 | "I'll chain parallel → parallel without a single-agent step between" | Missing consolidator between parallel phases | Pattern H violation |

### 1.2 Implicit Anti-Patterns (Stated Elsewhere)

Beyond the dedicated section, the following prohibitions function as implicit anti-patterns:

**From "Absolute Prohibitions":**
- Reading more than 1 file per turn
- Running `bash` for reconnaissance
- Running `bash` with >5 lines of output (unless launching subagents)
- Editing any file directly
- Writing any file directly (except AGENTS.md and manifests)
- Doing research yourself (instead of using `researcher`)
- Browsing the web yourself
- Analyzing test failures yourself
- Generating code yourself
- Reviewing your own work

**From "Synthesis vs Analysis":**
- Attempting to resolve conflicting subagent reports yourself (should spawn `reviewer`)

**From "Artifact Handoff & Persistence":**
- Pasting full scout findings into subagent task descriptions
- Relying on session artifacts for follow-up work instead of project files

### 1.3 Anti-Pattern Coverage Assessment

**Well-covered areas:**
- Direct editing/writing by orchestrator (explicitly prohibited in multiple places)
- Chat output bloat (synthesis rules + raw output dumping anti-pattern)
- Nested orchestration (explicitly called out)
- Parallel vs serial delegation (4 anti-patterns address this)
- Self-analysis by orchestrator (2 anti-patterns + absolute prohibition)
- Review skipping (explicit anti-pattern)

**Notable coverage strength:** The document attacks the same problem from multiple angles. For example, the "no direct edits" rule appears in:
- Absolute Prohibitions: "Edit any file directly"
- Anti-Patterns: "This is a small edit so I'll just do it"
- Tool Usage Matrix: `edit` = ❌ NEVER for orchestrator

---

## 2. Persistence and Artifact Handoff Rules

### 2.1 Core Persistence Rules

| Rule | Location | Description |
|------|----------|-------------|
| R1 | Artifact Handoff intro | Subagent output lives in session-scoped artifact directories by default |
| R2 | "Always Persist Consolidated Findings" | MUST write consolidated artifact before synthesizing in chat |
| R3 | "Always Persist Consolidated Findings" | If user might ask follow-up, write to project directory file |
| R4 | "Pass Artifacts by Path, Not by Paste" | Reference artifact file paths in subsequent subagent tasks |
| R5 | "Pass Artifacts by Path, Not by Paste" | Never paste full findings into subagent task descriptions |
| R6 | "When Artifact Paths Aren't Accessible" | Option A: worker consolidates to project file first |
| R7 | "When Artifact Paths Aren't Accessible" | Option B: include only minimal summary (≤3 sentences) |
| R8 | Project-Level Conventions | Establish `ralph/` directory with standard filenames |

### 2.2 Artifact Type Matrix

| After Agent Type | Write To | Content |
|-----------------|----------|---------|
| Scout network | `audit.md`, `context.md`, or project path | Consolidated findings |
| Researcher | `research.md` or project path | Synthesized brief with sources |
| Planner | `plan.md` or project path | Implementation plan with tasks |
| Worker | `progress.md` or project path | What changed, status, blockers |
| Reviewer | `review-notes.md` or project path | Issues found, fixes applied |

### 2.3 Project-Level Artifact Conventions

```
ralph/
  audit.md          # Current codebase state (updated by scouts)
  plan.md           # Implementation plan (updated by planner)
  progress.md       # What's been done (updated by workers)
  decisions.md      # Deferred items, blockers, tradeoffs
  review-notes.md   # Reviewer findings
```

### 2.4 Handoff Mechanisms

1. **Path-based reference** (preferred): Subsequent agents read files by path
2. **Worker consolidation** (fallback): When session artifacts are inaccessible, a worker reads all session artifacts and writes a project-level file
3. **Minimal summary** (last resort): ≤3 sentences in task description, agent does own reconnaissance

### 2.5 Enforcement Mechanism

**None.** All persistence rules are prescriptive ("MUST", "Always", "Never") but there is:
- No technical enforcement
- No validation step
- No consequence for violation
- No detection mechanism

---

## 3. Gaps and Weak Enforcement

### 3.1 Missing Anti-Patterns

| Missing Anti-Pattern | Why It Matters |
|---------------------|----------------|
| **"I'll just run one quick command"** | The orchestrator might run a bash command that seems innocent but is actually reconnaissance. Not explicitly covered beyond the general bash prohibition. |
| **"I'll use the wrong agent type"** | No anti-pattern for using `worker` when `delegate` is appropriate, or `scout` for analysis. The decision tree exists but no violation pattern. |
| **"I'll ignore the user's actual question"** | No guidance on what to do when user asks something that violates orchestrator constraints. |
| **"I'll overload a single subagent"** | No anti-pattern for giving a subagent an oversized task that should be parallelized. |
| **"I'll launch too many parallel agents"** | No guidance on upper bounds for parallelism or resource exhaustion. |
| **"I'll skip error handling"** | No anti-pattern for ignoring subagent failures or errors. |
| **"I'll reuse an old plan without checking"** | No guidance on stale plans or outdated audit files. |
| **Circular delegation** | No prohibition against A→B→A delegation patterns. |
| **Chat as planning surface** | No anti-pattern for using chat messages as the planning medium instead of files. |

### 3.2 Weak or Unenforceable Rules

| Rule | Weakness |
|------|----------|
| "Read exactly 1 file" | No technical enforcement; orchestrator can read multiple files and nothing prevents it |
| "Synthesis ≤5 bullets" | Subjective—what counts as a bullet? No validator. |
| "Small isolated task (<5 min)" | Time estimation is unreliable and subjective; no timer or enforcement. |
| "Run bash with ≤5 lines output" | Lines of output are unpredictable; orchestrator cannot always know in advance. |
| "Never paste full findings" | "Full" is undefined; partial pasting is a gray area. |
| "Always fork a reviewer" | Exceptions exist (e.g., "No planner/worker needed — this is a decision") but aren't systematically enumerated. |
| "Workers DO NOT spawn subagents" | Relies on worker instruction-following, not technical restriction. Tool Usage Matrix says ❌ but this is advisory. |
| "Context window is PRECIOUS" | No actual context budget tracking or warnings. |

### 3.3 Contradictions and Ambiguities

| Issue | Description |
|-------|-------------|
| **Self-policing paradox** | The orchestrator is expected to both follow rules AND detect its own violations. There is no external enforcer. |
| **Direct write exception** | "Write any file directly (except this config and subagent launch manifests)" — but the exact scope of "manifests" is undefined. |
| **Analysis delegation vs. self-analysis** | The orchestrator is told "ANALYSIS IS NEVER YOUR JOB" but then expected to synthesize findings, which requires some analytical judgment. |
| **"I'll take a quick look first" vs. reading user's input** | The orchestrator MUST read the user's referenced file (up to 1). The line between "quick look" and "required read" is blurry for edge cases. |
| **Delegate vs. worker for documents** | Writing `audit.md` could be either a `delegate` task or a `worker` task. The boundary is unclear. |
| **"context-builder" undefined** | Mentioned in the decision tree but never defined, described, or given examples. |

### 3.4 Missing Safeguards and Infrastructure

| Gap | Impact |
|-----|--------|
| **No violation detection** | If orchestrator reads 2 files, runs a grep, or edits directly, there is no alarm or correction mechanism. |
| **No remediation protocol** | If a rule IS violated, there is no guidance on how to recover or whether to notify the user. |
| **No token/cost budget** | No guidance on managing API costs or token limits across subagents. |
| **No subagent failure handling** | No guidance on what to do if a scout, worker, or reviewer fails, times out, or produces garbage output. |
| **No session cleanup guidance** | Session-scoped artifacts accumulate with no mention of cleanup or retention policies. |
| **No file size limits** | No guidance on maximum artifact sizes or when to split files. |
| **No concurrency limits** | Examples show 6 parallel scouts, but no maximum is specified. |
| **No user interruption protocol** | No guidance on handling mid-workflow user corrections or cancellations. |
| **No security sandboxing mentioned** | Subagents have full tool access; no discussion of privilege separation or dangerous operation containment. |
| **No versioning for artifacts** | `audit.md` and `plan.md` are updated in place with no history or rollback mechanism. |

### 3.5 Enforcement Mechanism Analysis

The entire rule system relies on **three layers**:

1. **Instruction layer**: Rules stated in natural language ("You MAY NOT", "This is wrong")
2. **Pattern layer**: Concrete examples of bad behavior with explanations
3. **Tool matrix layer**: Binary permissions (✅/❌) for tool usage

**Missing layer: Technical enforcement.** There is no:
- Pre-action validation (e.g., "You have already read 1 file this turn")
- Post-action audit (e.g., "Warning: bash output was 47 lines")
- Runtime restriction (e.g., `edit` tool disabled for orchestrator identity)
- Consequence structure (e.g., "If you violate, stop and delegate recovery")

This makes the entire framework **soft governance** rather than **hard constraints**.

---

## 4. Summary

**Strengths:**
- Comprehensive catalog of common failure modes
- Multiple reinforcement channels (prohibitions, anti-patterns, tool matrix, examples)
- Clear artifact naming conventions and handoff patterns
- Strong emphasis on parallelization and consolidation

**Critical Weaknesses:**
1. **Zero technical enforcement** — all rules are honor-system
2. **Self-policing is unreliable** — the entity expected to follow rules also judges compliance
3. **Ambiguous boundaries** — delegate vs. worker, synthesis vs. analysis, quick look vs. required read
4. **Missing failure modes** — no guidance on subagent errors, user interruptions, or resource exhaustion
5. **Stale artifact risk** — in-place updates with no versioning or freshness validation

**Recommendations (if this were being revised):**
1. Add explicit subagent failure handling protocol
2. Define clear boundaries for delegate vs. worker vs. scout tasks
3. Add artifact freshness/versioning guidance
4. Include a "circuit breaker" pattern for when the orchestrator detects it has violated rules
5. Enumerate the exceptions to "always fork a reviewer" systematically
6. Define "full findings" vs. "minimal summary" with concrete character/word limits
