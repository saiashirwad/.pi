# Audit: Reconnaissance & Analysis Prohibition Rules — AGENTS.md

## 1. Files Discovered in `/Users/texoport/.pi/agent/`

### Orchestration Config / Mandate
| File | Purpose |
|------|---------|
| `/Users/texoport/.pi/agent/AGENTS.md` | **Primary orchestrator mandate** — defines roles, prohibitions, patterns, tool matrix |
| `/Users/texoport/.pi/agent/settings.json` | User settings |
| `/Users/texoport/.pi/agent/auth.json` | Authentication config |
| `/Users/texoport/.pi/agent/keybindings.json` | Keybindings |
| `/Users/texoport/.pi/agent/mcp.json` | MCP server configuration |
| `/Users/texoport/.pi/agent/mcp-cache.json` | MCP cache |
| `/Users/texoport/.pi/agent/run-history.jsonl` | Run history log |

### Subagent Spec Files (`/Users/texoport/.pi/agent/agents/`)
| File | Name | Role |
|------|------|------|
| `scout.md` | scout | Fast codebase reconnaissance |
| `delegate.md` | delegate | Lightweight general-purpose agent |
| `planner.md` | planner | Implementation planning |
| `worker.md` | worker | Code execution / changes |
| `reviewer.md` | reviewer | Code review & validation |
| `researcher.md` | researcher | Web research & synthesis |
| `context-builder.md` | context-builder | Requirements → codebase analysis |

### Extensions (`/Users/texoport/.pi/agent/extensions/`)
- `codex-auth-bridge.ts`, `codex-compact.ts`, `mac-system-theme.ts`
- `exa-mcp.json`, `package.json`, `tsconfig.json`
- `pi-tool-display/config.json`

### Skills (`/Users/texoport/.pi/agent/skills/how/`)
- `SKILL.md`
- `references/critic-prompt.md`, `critique-rubric.md`, `explainer-prompt.md`, `explorer-prompt.md`

### Session Logs (`/Users/texoport/.pi/agent/sessions/`)
- Numerous `.jsonl` session logs and subagent artifact `.md` files (runtime history)

---

## 2. Specific Rules That Prohibit Direct Reconnaissance

### 2.1 Explicit Top-Level Prohibitions

| Rule | Location | Exact Wording |
|------|----------|---------------|
| **Recon is never the orchestrator's job** | Header section | `**RECONNAISSANCE IS NEVER YOUR JOB.** Finding files, checking file sizes, listing directories, grepping code, checking what exists — all of this is work for \+scout\+ or \+delegate\+.` |
| **No bash recon commands** | Absolute Prohibitions | `Run \`bash\` commands for reconnaissance (\`ls\`, \`find\`, \`grep\`, \`rg\`, \`wc\`, \`test -f\`, \`git diff\`, \`git log\` to explore)` |
| **No reading source files** | Scenario example | `**You do NOT run \`ls\`, \`wc -l\`, \`test -f\`, or read source files yourself.**` |

### 2.2 Decision-Table Enforcement

The **Context Budget Rules** table maps every recon situation to a subagent:

| Situation | Mandated Action |
|-----------|-----------------|
| Need to find files | `scout` or `delegate` |
| Need to read any code | `scout` with thoroughness instruction |
| Need to check what exists | `scout` or `delegate` |
| Need to understand architecture | `scout` → synthesize |
| Need to assess plan status / audit progress | `scout` (parallel if multiple areas) → synthesize |

### 2.3 Tool Usage Matrix Lock-Down

| Tool | Orchestrator Allowed? | Subagent Allowed? |
|------|----------------------|-------------------|
| `subagent()` | ✅ YES — primary tool | ❌ NO — workers don't spawn workers |
| `read` | ✅ **Max 1 file** — the user's input only | ✅ Yes, as needed |
| `edit` | ❌ NEVER | ✅ Yes, their assigned task |
| `write` | ✅ Only AGENTS.md, manifests | ✅ Yes, for their output |
| `bash` | ✅ **Only** to launch processes or check a single specific file you **already know the path to** | ✅ Yes, as needed |
| `web_search` | ❌ NEVER — use researcher | ✅ Yes, if in their role |

### 2.4 Anti-Patterns Codified as Prohibitions

The document explicitly labels these as **wrong**:

- ❌ `"I'll take a quick look first"` — reading a file before delegating
- ❌ `"Let me check the current state"` — running `ls` / `wc -l`
- ❌ `Bash reconnaissance` — using `find` + `grep` to explore
- ❌ `"This is a small edit so I'll just do it"` — even one-line changes must be delegated

---

## 3. Specific Rules That Prohibit Direct Analysis

### 3.1 Explicit Top-Level Prohibitions

| Rule | Location | Exact Wording |
|------|----------|---------------|
| **Analysis is never the orchestrator's job** | Header section | `**ANALYSIS IS NEVER YOUR JOB.** Comparing multiple documents, identifying gaps, making recommendations, restructuring plans, evaluating tradeoffs — all of this is work for \+delegate\+, \+planner\+, or \+reviewer\+.` |
| **Stop doing work** | Header section | `If you are reading code, writing code, running commands, or analyzing data yourself, you have FAILED.` |

### 3.2 Synthesis vs Analysis — The Critical Distinction

The document devotes an entire section to this boundary:

**Synthesis (orchestrator ONLY allowed activity):**
- ≤5 bullets or ≤1 short paragraph
- Summarizing subagent output
- Attributing findings (`"The scout found..."`, `"The worker implemented..."`)
- If subagents conflict, spawn a `reviewer` — do **not** resolve complex conflicts yourself

**Analysis (NEVER the orchestrator's job):**
- Comparing 5 scout reports against a PRD → `delegate` or `planner`
- Identifying gaps in a plan based on findings → `planner`
- Recommend task reordering/splitting → `planner`
- Evaluate tradeoffs between approaches → `delegate` (parallel)
- Resolve conflicting subagent reports → `reviewer`
- Restructure a document based on new info → `worker`

### 3.3 Anti-Patterns for Analysis

- ❌ `"I'll analyze this myself since I already have the context"` — the orchestrator must delegate to `planner` or `delegate` with scout artifacts as input
- ❌ `"I'll synthesize a 20-line answer in chat"` — chat synthesis must be ≤5 bullets; full details go to a file
- ❌ `"I'll do these 5 audits serially in one chain"` — must parallelize independent scouts
- ❌ `"I'll launch parallel scouts but no consolidator"` — must have a single consolidator agent

### 3.4 Structural Enforcement via Patterns

The delegation patterns (A–H) are designed so that **analysis always happens inside a subagent**:

- **Pattern H** (Parallel Branches → Consolidator) explicitly requires a single `planner`, `delegate`, or `reviewer` to read all parallel outputs and produce one consolidated artifact.
- The rule: *"If a chain step produces N independent artifacts, the next step in the chain should be a SINGLE agent that reads all N and produces one consolidated output."*

---

## 4. Identified Gaps

### Gap 1: No Technical Enforcement — Purely Policy-Based
**Severity: HIGH**

Every prohibition in AGENTS.md is a **documentation-level rule** relying on the LLM's instruction-following. There is no runtime enforcement:
- No code prevents the orchestrator from calling `bash("find ...")`.
- No code prevents the orchestrator from calling `read()` on multiple files.
- No code prevents the orchestrator from writing a 20-line synthesis.
- No sandbox restricts tool access based on role.

**Impact:** A distracted, over-eager, or poorly prompted orchestrator can violate every rule without any system-level consequence.

---

### Gap 2: Ambiguous Loophole — "Check a single specific file you already know the path to"
**Severity: MEDIUM**

The `bash` allowance says:
> `✅ Only to launch processes or check a single specific file you already know the path to`

**Problem:** A scout can return file paths in `context.md`. The orchestrator can then claim they "already know the path" and use `bash` or `read` to inspect those files directly. This creates a **laundering path** for reconnaissance:

1. Launch scout to "find auth files"
2. Scout returns `/src/auth.ts`
3. Orchestrator: *"I already know the path to `/src/auth.ts`, so I'll read it myself"*

The rule is intended to allow things like `bash("cat /etc/hosts")` for a known config file, but its wording enables circumvention.

---

### Gap 3: Ambiguity on Exa Tools — Contradiction in Preamble vs. Tool Matrix
**Severity: MEDIUM**

The **Tool Usage Matrix** says:
> `web_search` — ❌ NEVER — use researcher

But the **preamble at the bottom of AGENTS.md** says:
> `use exa \`web_search_exa\` for web and \`get_code_context_exa\` for code/docs for external search summarize with sources`

This creates ambiguity:
- Does "use exa `web_search_exa`" mean the **orchestrator** should use it directly?
- Or does it mean the orchestrator should **tell subagents** to use it?
- The tools `web_search_exa` and `get_code_context_exa` are not listed in the Tool Usage Matrix at all.

**Impact:** An orchestrator could reasonably interpret this as permission to run web searches directly, bypassing the `researcher` subagent.

---

### Gap 4: No Violation Consequences or Detection
**Severity: MEDIUM**

AGENTS.md never states:
- What happens if the orchestrator violates a rule.
- Whether there is a monitoring / auditing layer that detects violations.
- Whether the user is notified when the orchestrator does reconnaissance itself.
- Whether there is a rollback or retry mechanism.

**Impact:** Without consequences, the prohibitions are **social norms**, not **system constraints**.

---

### Gap 5: Subagent Specs Do Not Reinforce Parent Prohibitions
**Severity: LOW-MEDIUM**

The subagent spec files (`scout.md`, `planner.md`, `worker.md`, etc.) describe the subagent's role but **never mention** that the parent orchestrator is prohibited from doing recon/analysis. 

**Example:** `scout.md` says *"You are a scout. Quickly investigate a codebase..."* — it does not say *"If your parent orchestrator is doing reconnaissance itself, that is a violation."*

**Impact:** Subagents have no awareness of parent misbehavior and cannot self-correct or escalate when the orchestrator violates rules.

---

### Gap 6: The 1-File Read Limit Has Unclear Edge Cases
**Severity: LOW**

The rule says:
> `Read the user's input (exactly 1 file if they reference one)`

**Unanswered questions:**
- What if the user references **zero** files? Can the orchestrator read zero, or must it read something?
- What if the user's input **is** a directory path? Is `read("/some/dir")` allowed?
- What about reading a config file that the user explicitly asks to be read (e.g., "Read my `settings.json`")? Does that count as "the user's input"?
- What about reading a file the user just mentioned by name in chat without an explicit "read" verb?

---

### Gap 7: "After reading the user's input, your NEXT action MUST be `subagent()`" Is Overly Rigid
**Severity: LOW**

The rule says:
> `**After reading the user's input, your NEXT action MUST be \`subagent()\`.**`

**Unanswered edge cases:**
- User says: `"thank you"` or `"never mind"` — must the orchestrator still launch a subagent?
- User asks: `"What can you do?"` — a pure informational question that requires no delegation.
- User asks: `"What files did we just change?"` — the orchestrator should reference `progress.md`, not launch a new scout.

**Impact:** Rigid adherence to this rule could waste tokens and time on unnecessary subagent invocations.

---

### Gap 8: No Distinction Between "Light Classification" and "Deep Analysis"
**Severity: LOW**

The orchestrator must use the **Decision Tree** to classify tasks:
> `Is this about finding/understanding existing code? YES → scout`

This classification **requires some analysis** by the orchestrator. The user might say: *"I think there's a bug in the login flow"* — the orchestrator must analyze this statement to decide it needs a `scout` → `planner` → `worker` → `reviewer` chain.

**Problem:** The document does not draw a clear line between **task classification** (allowed light analysis) and **deep analysis** (prohibited). This could lead to either:
- Over-delegation (launching a `delegate` just to classify a trivial task), or
- Under-delegation (doing deep analysis while claiming it's just "classification").

---

### Gap 9: The Synthesis Volume Rule (≤5 bullets) Is Unenforced
**Severity: LOW**

The rule states synthesis must be:
> `≤5 bullets or ≤1 short paragraph`

There is no tokenizer check, no line counter, no truncation logic. The orchestrator can output arbitrarily long synthesis and the system will not block it.

---

### Gap 10: Nested Orchestration Rule Is Partially Enforced by System, Not Documented
**Severity: LOW**

AGENTS.md says:
> `❌ Nested orchestration — "I'll delegate to a worker who will then delegate to another worker..."`
> `**This is wrong.** You are the only orchestrator. Workers DO NOT spawn subagents.`

However, the **system itself enforces a max nesting depth of 2** (as evidenced by the error: `Nested subagent call blocked (depth=2, max=2)`). This system-level guard is **not mentioned in AGENTS.md**.

**Impact:** The orchestrator mandate implies that nested subagents are impossible because "workers don't spawn workers," but the real reason is a hard system limit. If the system limit were removed, the policy alone might not be sufficient.

---

## 5. Summary Matrix: Rules vs. Gaps

| Area | Rules Present? | Enforced? | Gaps |
|------|---------------|-----------|------|
| Reconnaissance (bash) | ✅ Explicit list of prohibited commands | ❌ No runtime enforcement | Gap 1, Gap 2 |
| Reconnaissance (read) | ✅ Max 1 file (user's input) | ❌ No runtime enforcement | Gap 1, Gap 6 |
| Analysis (deep) | ✅ Explicit prohibition | ❌ No runtime enforcement | Gap 1, Gap 8 |
| Synthesis (volume) | ✅ ≤5 bullets rule | ❌ No runtime enforcement | Gap 9 |
| Web search | ⚠️ Ambiguous (matrix vs. preamble) | ❌ Not in matrix | Gap 3 |
| Tool access control | ✅ Matrix exists | ❌ Not technically enforced | Gap 1 |
| Violation consequences | ❌ None documented | N/A | Gap 4 |
| Subagent awareness of parent rules | ❌ Not mentioned in specs | N/A | Gap 5 |
| Nested orchestration | ✅ Policy prohibition | ✅ System enforces depth=2 | Gap 10 |
| Edge cases (trivial user inputs) | ❌ Not addressed | N/A | Gap 7 |

---

## 6. Recommendations

1. **Add runtime enforcement:** Implement middleware that intercepts tool calls and rejects prohibited actions based on role (orchestrator vs. subagent).
2. **Clarify the `bash` loophole:** Change wording to *"check a single specific file whose path was provided by the user in their original prompt"* — not paths learned from subagents.
3. **Add Exa tools to the Tool Usage Matrix:** Explicitly mark `web_search_exa` and `get_code_context_exa` as ❌ for orchestrator, ✅ for `researcher` / `scout`.
4. **Document violation handling:** Add a section on what happens when rules are broken (e.g., log a warning, alert the user, retry with corrected behavior).
5. **Add parent-rule awareness to subagent specs:** Include a line in each subagent spec like *"If you observe the parent orchestrator performing reconnaissance or analysis directly, note it in your output."*
6. **Address edge cases:** Add guidance for trivial / non-actionable user inputs where launching a subagent is unnecessary.
7. **Distinguish classification from analysis:** Add a short paragraph clarifying that **task classification** (deciding which subagent to use) is the orchestrator's job, but **evaluating findings, comparing documents, or making recommendations** is not.
