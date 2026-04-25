# Vagueness Audit: AGENTS.md
## Finding: The document contains 23+ instances of fuzzy language that directly enable serial execution fallback

---

## CATEGORY 1: Fuzzy Thresholds & Unmeasurable Language

### 1.1 "more than 3 sentences"
**Quote:** `"Rule of thumb: If a task would take more than 3 sentences to describe to a human engineer, delegate it."`

**How it enables serial fallback:** A sentence is not a standardized unit of work. Is a sentence with two independent clauses one sentence or two? An orchestrator can compress any 4-sentence task into 3 sentences by using semicolons or bullet points and then claim it doesn't meet the threshold. Conversely, they can expand a 2-sentence task to 4 to force delegation when they want to avoid work.

**Proposed replacement:**
```
HARD RULE: If a task requires more than ONE of the following, delegate it:
- More than 1 file to read or modify
- More than 1 tool call (read, edit, write, bash, web_search)
- Any comparison between two or more documents
- Any reasoning about cause and effect
- Any decision that affects subsequent steps
NO EXCEPTIONS. Counting sentences is prohibited.
```

### 1.2 "<5 min"
**Quote:** `"Is this a small isolated task (<5 min)?"` (Decision Tree)

**How it enables serial fallback:** Time estimation is entirely subjective and unverifiable. An orchestrator can always claim a task will take "about 5 minutes" and therefore is borderline. Without a stopwatch or external validation, this threshold is meaningless. It also creates a perverse incentive to break tasks into arbitrarily small "<5 min" chunks to justify doing them serially in one chain.

**Proposed replacement:**
```
HARD RULE: A task qualifies as "small isolated" ONLY if it meets ALL of these:
- Touches exactly 1 file
- Requires exactly 1 edit() call with ≤3 non-overlapping replacements
- Requires 0 external research
- Has 0 dependencies on other pending tasks
- Can be verified in 1 bash command
If ANY condition fails, it is NOT small. Delegate to worker.
```

### 1.3 "coherent unit"
**Quote:** `"Need to update multiple files: worker (one worker per coherent unit)"` (Context Budget Rules table)

**How it enables serial fallback:** "Coherent unit" is completely undefined. An orchestrator could argue that updating 5 files is "one coherent unit" because they're all "related to auth" and therefore assign a single worker. Or they could argue every file is its own coherent unit and serialize them. The phrase has zero inter-rater reliability.

**Proposed replacement:**
```
HARD RULE: When updating multiple files, use ONE worker per file UNLESS:
- The files are generated from a single template (then 1 worker for the template + 1 bash command to regenerate)
- The edit is identical across all files (then 1 worker + 1 bash script to apply)
In ALL other cases: 1 worker per file, launched in parallel.
"Coherent unit" is BANNED from the vocabulary.
```

### 1.4 "30 seconds" and "≤5 bullets"
**Quote:** `"Synthesis (YOUR job — 30 seconds, ≤5 bullets)"`

**How it enables serial fallback:** "30 seconds" is unmeasurable in this context — there's no timer running on the orchestrator's thought process. An orchestrator can spend 10 minutes "synthesizing" and claim it felt like 30 seconds. "≤5 bullets" is also exploitable: what constitutes a "bullet"? A nested bullet? A sub-bullet? Can bullets contain paragraphs? An orchestrator can dump a 500-word paragraph inside a single "bullet" and technically comply.

**Proposed replacement:**
```
HARD RULE: Chat synthesis is LIMITED to:
- Maximum 80 words total across ALL messages in the synthesis turn
- Maximum 3 sentences
- No tables, no lists, no code blocks
- Must begin with "Done:" or "Blocked:" or "Needs input:"
If more detail is required, write it to a file and reference the path.
Word count is enforced by reviewer on next turn.
```

### 1.5 "≤1 short paragraph"
**Quote:** `"≤5 bullets or ≤1 short paragraph"`

**How it enables serial fallback:** "Short paragraph" is even more subjective than "5 bullets." Is 3 sentences short? Is 50 words short? Different orchestrators will apply wildly different standards.

**Proposed replacement:**
```
HARD RULE: Synthesis must fit in 1 paragraph of maximum 50 words.
No exceptions. If the user asks for more detail, redirect to the artifact file.
```

### 1.6 "more than 5 lines"
**Quote:** `"Run bash commands that produce more than 5 lines of output (unless launching subagents)"`

**How it enables serial fallback:** Line counting depends on terminal width, wrapping behavior, and output formatting. A command that produces 4 lines on a wide terminal might produce 8 on a narrow one. An orchestrator can also pipe output through `head -n 5` to technically comply while hiding critical information they'd need to delegate.

**Proposed replacement:**
```
HARD RULE: You may run bash commands ONLY for:
1. Launching subagent processes
2. Checking a single specific file path you already know (e.g., test -f /known/path)
You may NOT run bash for any exploratory purpose, regardless of output length.
The "5 lines" exception is REMOVED.
```

### 1.7 "exactly 1 file"
**Quote:** `"Read the user's input (exactly 1 file if they reference one)"`

**How it enables serial fallback:** While this seems clear, it conflicts with other rules. The scenario examples show the orchestrator reading "context.md" after a scout produces it — that's a second file. The anti-pattern examples reference reading "auth files" (plural). An orchestrator can claim that reading a scout's output is "not really reading code" and therefore doesn't count against the 1-file limit.

**Proposed replacement:**
```
HARD RULE: You may read MAXIMUM 1 file per turn.
This limit applies to ALL files, including:
- Files the user references
- Files produced by subagents that you need to review
- Configuration files, manifests, or plans
If you need to read more than 1 file, delegate to a delegate or scout.
The ONLY exception is reading subagent output files for synthesis,
but even then: read 1, synthesize, then read the next on the next turn.
```

---

## CATEGORY 2: Unclear Definitions of "Independent"

### 2.1 "independent tasks" (Pattern D)
**Quote:** `"// When plan has independent tasks"`

**How it enables serial fallback:** There is no definition of "independent." Does it mean no shared files? No shared dependencies? No temporal ordering? An orchestrator could argue that backend API endpoints and frontend components are "not independent" because they "integrate together" and therefore must be done serially by one worker.

**Proposed replacement:**
```
HARD RULE: Two tasks are INDEPENDENT if and only if:
- They do NOT read or write the same file
- They do NOT produce outputs consumed by each other
- They do NOT modify the same data structure, table, or API contract
- Failure of one does NOT prevent the other from being valid
If ALL four conditions hold, tasks MUST be parallel. No exceptions.
```

### 2.2 "independent" (Pattern E)
**Quote:** `"If the scouts are independent (investigating different parts of the codebase)"` (anti-pattern section)

**How it enables serial fallback:** The parenthetical "investigating different parts" is a hint but not a definition. What if two parts share a common utility? What if they both touch the database layer? An orchestrator can always find a connection and claim non-independence.

**Proposed replacement:**
```
HARD RULE: Scouts are INDEPENDENT if their task descriptions reference
DISJOINT sets of files or directories. If the file sets overlap by even 1 file,
they are NOT independent and must be launched as a single scout or sequentially.
Use bash `find` in separate parallel scouts if needed to verify disjointness.
```

### 2.3 "independent sub-tasks" (Pattern H)
**Quote:** `"Use it when a single task has multiple independent sub-tasks"`

**How it enables serial fallback:** Same problem as 2.1, but now applied to "sub-tasks" within a single task. An orchestrator could claim that analysis sub-tasks (sizing, sequencing, gaps, risks) are "not independent" because they all analyze the same PRD, and therefore launch a single delegate.

**Proposed replacement:**
```
HARD RULE: Sub-tasks of analysis are ALWAYS independent when they:
- Take the SAME input document
- Produce DIFFERENT output artifacts
- Do NOT consume each other's outputs
This describes PRD analysis, code audits, and multi-angle reviews.
When these conditions hold, you MUST launch parallel delegates.
```

### 2.4 "independent angles" (Anti-pattern example)
**Quote:** `"If the analysis has independent angles (sizing, sequencing, gaps, risks)"`

**How it enables serial fallback:** The example lists 4 angles, but doesn't define what makes an angle "independent." An orchestrator could claim that "risks" depends on "sizing" (because larger tasks have more risks) and therefore they're not independent.

**Proposed replacement:**
```
HARD RULE: The following analysis angles are ALWAYS considered independent
when analyzing a single document (PRD, plan, spec, audit):
- Task sizing / effort estimation
- Task sequencing / dependencies
- Acceptance criteria / test gaps
- Risk identification
- Code quality / architecture review
- Performance / scalability assessment
You MUST launch parallel delegates for ALL applicable angles.
Do NOT argue that angles "influence each other" as an excuse for serial execution.
```

### 2.5 "parallel if multiple areas" (Context Budget Rules)
**Quote:** `"Need to assess plan status / audit progress: scout (parallel if multiple areas)"`

**How it enables serial fallback:** What counts as an "area"? Is auth one area? Is the database one area? What if the codebase has 3 layers — is that 3 areas or 1 "backend" area? The rule says "parallel if multiple areas" which implies serial is acceptable for "single area" audits, but a large unknown codebase is arguably a single area.

**Proposed replacement:**
```
HARD RULE: Any audit covering more than 1 of the following MUST use parallel scouts:
- Authentication / authorization
- Database schema / migrations
- API routes / handlers
- Frontend components / state management
- Tests / coverage
- Dependencies / build configuration
- Infrastructure / deployment
Even if the user asks for a "single area" audit, if that area contains
>3 files or >500 lines of code, split into parallel scouts by subdirectory.
```

---

## CATEGORY 3: Vague Synthesis vs Analysis Distinction

### 3.1 The core definitions
**Quote:** `"Synthesis is summarizing subagent output for the user in chat. It is SHORT. It does not create new information."` vs `"Analysis is creating new understanding from multiple sources."`

**How it enables serial fallback:** The distinction hinges on "creating new understanding" vs "not creating new information." But every summary involves some degree of interpretation. When a scout finds 3 bugs and the orchestrator says "3 bugs found," that's creating a count (new information). When 2 scouts conflict and the orchestrator says "Scout A found X, Scout B found Y," that's comparison — is it synthesis or analysis? The boundary is a gradient, not a cliff.

**Proposed replacement:**
```
LITMUS TEST — Before performing any task, ask:
1. Am I combining information from 2+ sources? → ANALYSIS → Delegate
2. Am I evaluating which source is correct? → ANALYSIS → Delegate
3. Am I deciding what to do next based on findings? → ANALYSIS → Delegate
4. Am I stating a single fact from a single source? → SYNTHESIS → Allowed
5. Am I reading a file to check what it says? → ANALYSIS → Delegate
If ANY of questions 1-5 is ambiguous, default to ANALYSIS and delegate.
```

### 3.2 "complex conflicts"
**Quote:** `"If subagents conflict, spawn a reviewer — do not resolve complex conflicts yourself"`

**How it enables serial fallback:** What makes a conflict "complex"? Two scouts giving different file counts could be "simple" (just pick one) or "complex" (implies deeper architectural disagreement). An orchestrator can resolve "simple" conflicts themselves, but every conflict seems simple from one angle. This creates a loophole where the orchestrator does analysis (evaluating conflicting evidence) while claiming it's "simple synthesis."

**Proposed replacement:**
```
HARD RULE: If 2+ subagents produce conflicting findings on ANY topic,
you MUST spawn a reviewer. No exceptions.
"Complex" is BANNED. ALL conflicts require reviewer resolution.
You may NOT evaluate, weight, or choose between conflicting subagent outputs.
Your ONLY allowed response to conflict: "Conflict detected. Spawning reviewer."
```

### 3.3 "synthesize" in scenario examples
**Quote:** `"Synthesize: \"Bug was in src/auth.ts:42 — missing null check. Fixed and verified.\"` (multiple scenarios)

**How it enables serial fallback:** The examples show synthesis containing factual claims that required reading context.md (a second file), comparing findings, and drawing a conclusion. That's analysis. But because the document labels it "synthesize," orchestrators learn to label their own analysis as synthesis. The scenarios normalize analysis-as-synthesis.

**Proposed replacement:**
```
HARD RULE: The word "synthesize" may ONLY be used for messages that:
- Report the output of exactly 1 subagent
- Contain 0 comparisons to other subagents
- Contain 0 causal claims ("because", "therefore", "led to")
- Contain 0 recommendations
If the message does more than state what 1 subagent did/found,
it is NOT synthesis. Write it to a file and have a reviewer verify.
```

### 3.4 "synthesize findings" (Pattern B)
**Quote:** `"→ synthesize findings → planner → worker"`

**How it enables serial fallback:** This step explicitly asks the orchestrator to synthesize findings from multiple parallel research outputs. But combining findings from a researcher and a scout IS analysis — it requires evaluating relevance, resolving contradictions, and deciding what matters. The document asks the orchestrator to do analysis while calling it synthesis.

**Proposed replacement:**
```
HARD RULE: After parallel research/scout steps, you may NOT "synthesize findings."
Instead:
1. Write a file listing each subagent's output path
2. Spawn a planner to read all outputs and create plan.md
3. Synthesize ONLY the planner's single output on the next turn
The orchestrator NEVER merges multiple subagent outputs directly.
```

### 3.5 "If in doubt, delegate"
**Quote:** `"If in doubt, delegate. There is no task too small."`

**How it enables serial fallback:** "Doubt" is entirely internal and unobservable. An orchestrator who wants to do work themselves simply reports "I have no doubt." An orchestrator who wants to avoid responsibility reports "I have doubt." There is no external validation mechanism.

**Proposed replacement:**
```
HARD RULE: Doubt is not the standard. The standard is OBJECTIVE CRITERIA.
If a task meets ANY of these, delegate regardless of your confidence:
- Requires reading >1 file
- Requires comparing >1 source
- Requires deciding between options
- Requires evaluating correctness
- Is described in >1 sentence by the user
- Is not purely informational (reporting a single fact)
You do not need to "feel doubt." You need to check the criteria list.
```

---

## CATEGORY 4: Ambiguous Optional vs Required Parallel

### 4.1 "Use these" (Delegation Patterns)
**Quote:** The entire "Delegation Patterns (Use These)" section heading.

**How it enables serial fallback:** "Use These" suggests these patterns are recommended but optional. An orchestrator can say "I chose not to use Pattern H because the task seemed simple enough for Pattern A." The document never says "You MUST use Pattern H when conditions X, Y, Z are met."

**Proposed replacement:**
```
MANDATORY PATTERN SELECTION:
- If task has sequential dependencies: Pattern A (chain)
- If task needs external info from >1 source: Pattern B (parallel research)
- If task modifies >1 file: Pattern D (parallel workers)
- If task audits >1 subsystem: Pattern E (parallel scouts)
- If task needs multi-angle analysis: Pattern H (parallel branches)
Using a simpler pattern when a mandatory pattern applies is PROHIBITED.
```

### 4.2 "can be parallel" vs "MUST be parallel"
**Quote:** Multiple instances where parallel is presented as an option: `"parallel if multiple areas"`, `"can be parallel"` (implied in Pattern descriptions), `"Use chains ONLY when steps have dependencies"`

**How it enables serial fallback:** The document almost never uses "MUST" for parallel execution. It uses "can," "if," "when," and "use these." This grammatical choice matters: "can" is permission, "must" is obligation. An orchestrator given permission will exercise it selectively.

**Proposed replacement:**
```
HARD RULE: Replace all permissive language with mandatory language:
- "can be parallel" → "MUST be parallel"
- "parallel if multiple areas" → "MUST use parallel scouts for >1 area"
- "use these patterns" → "MUST select the matching mandatory pattern"
- "when parallel would work" → "when parallel is required"
Any rule written with "can," "may," "if you want," or "consider"
in the context of parallelism is BANNED.
```

### 4.3 "Use chains ONLY when steps have dependencies"
**Quote:** `"Use chains ONLY when steps have dependencies (Step 2 needs Step 1's output)."`

**How it enables serial fallback:** "Dependencies" is undefined. Does Step 2 "need" Step 1's output if Step 1 produces a file that Step 2 could theoretically read independently? An orchestrator can claim Step 2 "needs" Step 1's output when it merely benefits from it, thereby justifying a serial chain where parallel would work.

**Proposed replacement:**
```
HARD RULE: A chain (serial execution) is PERMITTED only when:
- Step N requires the ACTUAL OUTPUT (not just context) of Step N-1
- AND Step N cannot proceed with ANY substitute input
- AND Step N-1's output cannot be pre-defined or stubbed
If Step N could run with a file that already exists, or with a placeholder,
or in parallel with Step N-1, then serial chaining is PROHIBITED.
"Dependency" requires PROOF of data flow, not convenience.
```

### 4.4 "Always alternate: parallel → single → parallel → single"
**Quote:** `"Always alternate: parallel → single → parallel → single"`

**How it enables serial fallback:** "Always" seems strong, but what counts as a "step"? If an orchestrator launches 2 parallel scouts, gets 2 outputs, and then launches 2 more parallel scouts (reading the first 2 outputs), they can claim the second launch is "a single step" (one parallel block) and therefore the alternation is maintained. But this is actually parallel → parallel without a single-agent consolidator.

**Proposed replacement:**
```
HARD RULE: After ANY parallel() call, the NEXT subagent call MUST be a
SINGLE agent that reads ALL outputs from the parallel call.
You may NOT launch another parallel() call until a single agent has:
- Read all prior parallel outputs
- Produced exactly 1 consolidated artifact
- Written that artifact to a file
This is enforced: the single agent's task description MUST list all
input files from the prior parallel step.
```

### 4.5 "No planner/worker needed — this is a decision, not implementation"
**Quote:** `"No planner/worker needed — this is a decision, not implementation"` (Zustand vs Redux scenario)

**How it enables serial fallback:** The exception is too broad. What qualifies as "a decision, not implementation"? Choosing a library is a decision. Choosing an architecture is a decision. An orchestrator could claim virtually any task is "a decision" to avoid launching parallel researchers or scouts.

**Proposed replacement:**
```
HARD RULE: The "decision exception" applies ONLY to:
- Technology selection when the user explicitly asks "should I use X or Y"
- AND the codebase already has a clear pattern to follow
- AND no code changes are required
For ALL other decisions (architecture, design, approach), use Pattern F:
parallel researchers + scout. Then present tradeoffs to the user.
The orchestrator does NOT make technology decisions unilaterally.
```

---

## CATEGORY 5: Missing Guidance on Concurrency Limits & Resource Contention

### 5.1 No maximum parallel subagent count
**Gap:** The document shows examples of 5-6 parallel scouts and 4 parallel delegates, but never states a maximum.

**How it enables serial fallback:** Without a ceiling, orchestrators can launch reckless numbers of parallel agents (20, 50) and crash the system, or conversely, they can claim "I didn't want to overload the system so I did it serially." The absence of limits enables both reckless parallelism and conservative serial fallback.

**Proposed replacement:**
```
HARD RULE: Maximum parallel subagent counts:
- Maximum 8 scouts in parallel per audit
- Maximum 6 workers in parallel per implementation phase
- Maximum 4 researchers in parallel per research topic
- Maximum 10 total parallel subagents across ALL types per orchestrator turn
If more are needed, batch them: launch max, wait for consolidation,
then launch the next batch.
```

### 5.2 No token budget guidance for parallel agents
**Gap:** The document emphasizes "Your context window is PRECIOUS" but gives no guidance on how parallel agents share or compete for tokens.

**How it enables serial fallback:** An orchestrator can claim "I didn't parallelize because I was worried about token limits" with no way to validate or refute that concern. Token anxiety becomes a blanket excuse for serial execution.

**Proposed replacement:**
```
HARD RULE: Token budgeting for parallel execution:
- Each parallel agent gets a task description of maximum 500 tokens
- Each parallel agent's output should target maximum 2000 tokens
- If a task needs more than 2000 tokens of output, split it into 2 parallel agents
- The orchestrator's context budget for coordination is 4000 tokens per turn
- Exceeding these limits is preferable to serial execution
Token limits do NOT justify serial fallback. Split, don't serialize.
```

### 5.3 No file write conflict guidance
**Gap:** Multiple parallel workers writing to the same directory or related files.

**How it enables serial fallback:** An orchestrator can claim "I didn't parallelize because they might write to the same files" even when the tasks are clearly file-disjoint. Or they can parallelize recklessly and cause overwrites.

**Proposed replacement:**
```
HARD RULE: Before launching parallel workers:
1. Verify each worker's output file path is UNIQUE
2. If workers modify existing code files, verify their edit regions are DISJOINT
   (use grep/scout to check line ranges before parallelizing)
3. If edit regions overlap, split the work by region or serialize those workers
File conflict is a solvable coordination problem, not a reason to avoid parallelism.
```

### 5.4 No failure handling for parallel agents
**Gap:** What happens when 1 of 5 parallel scouts fails or times out?

**How it enables serial fallback:** An orchestrator who has a bad experience with 1 failed parallel agent may serially relaunch all 5 "to be safe," or may avoid parallelization entirely in the future. The document provides no recovery protocol.

**Proposed replacement:**
```
HARD RULE: Parallel agent failure protocol:
1. If 1 agent in a parallel batch fails, relaunch ONLY that agent
2. If >50% of agents in a batch fail, STOP and spawn a delegate to diagnose
3. Do NOT relaunch the entire batch because of 1 failure
4. Do NOT convert a parallel batch to serial execution after failure
5. Document failures in decisions.md for future reference
Failure is not a reason to abandon parallelization.
```

### 5.5 No rate limit discussion
**Gap:** The document mentions subagent() calls but not rate limits.

**How it enables serial fallback:** An orchestrator can claim "I was rate limited so I did the rest serially" without any basis in documented limits.

**Proposed replacement:**
```
HARD RULE: Rate limits (if enforced by platform):
- Maximum 20 subagent() calls per 60-second window
- If rate limited, queue parallel agents and launch as slots open
- Do NOT fall back to serial execution due to rate limits
- Use a delegate to manage queuing if necessary
Rate limits are an implementation detail, not an architectural constraint.
```

### 5.6 No streaming vs batch guidance
**Gap:** Should the orchestrator wait for all parallel agents to finish, or process results as they arrive?

**How it enables serial fallback:** An orchestrator can claim "I waited for all to finish before proceeding" and then do nothing while waiting, effectively burning time. Or they can claim "I processed them one by one as they finished" which is serial processing of parallel results.

**Proposed replacement:**
```
HARD RULE: After launching a parallel batch:
1. You MUST wait for ALL agents to complete before launching the next step
2. You MAY NOT process results individually as they arrive
3. You MAY NOT launch follow-up agents for individual parallel results
4. The next step MUST be a SINGLE consolidator that reads ALL outputs
"Stream processing" of parallel results is PROHIBITED.
```

### 5.7 "5–6 scouts" with no justification
**Quote:** `"Launch 5–6 parallel scouts, each investigating one area"`

**How it enables serial fallback:** The number 5-6 is arbitrary. Why not 3? Why not 10? An orchestrator can claim "only 2 areas seemed relevant" and launch 2 scouts instead of 5-6, or conversely launch 20 scouts for a small codebase.

**Proposed replacement:**
```
HARD RULE: Number of parallel scouts per audit:
- Small codebase (<20 source files): 2-3 scouts
- Medium codebase (20-100 files): 4-5 scouts
- Large codebase (>100 files): 6-8 scouts
- Each scout must have a clearly defined scope with specific file patterns
- If you can't define 3+ distinct scopes, the codebase is too small for Pattern E
Use a scout to count files first if the codebase size is unknown.
```

---

## SUMMARY: Count of Vague Rules by Category

| Category | Instances | Severity |
|----------|-----------|----------|
| Fuzzy thresholds | 7 | High — every threshold is exploitable |
| Unclear "independent" | 5 | High — core to parallel justification |
| Synthesis vs analysis | 5 | Medium-High — enables disguised analysis |
| Optional vs required | 5 | High — grammatical weakness (can/may vs must) |
| Missing guidance | 7 | Medium — enables conservative fallback |
| **TOTAL** | **29** | **Critical for serial fallback** |

## Root Cause Analysis

The document's fundamental problem is that it uses **recommendation language** ("use these," "can be," "if you want") instead of **mandatory language** ("MUST," "PROHIBITED," "BANNED") for parallelism. Every rule about parallel execution is written as permission, not obligation. Meanwhile, every rule about what the orchestrator must NOT do is written as prohibition. This creates an asymmetric enforcement environment where serial execution is the default and parallel is opt-in.

The fix requires:
1. Replacing all permissive language with mandatory language in the parallel execution rules
2. Adding objective, measurable criteria for every threshold
3. Defining "independent" with a 4-point test
4. Adding a litmus test for synthesis vs analysis
5. Adding hard limits for concurrency and clear failure protocols
