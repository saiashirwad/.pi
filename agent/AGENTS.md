# Global pi guidance

- Be concise, practical, and explicit.
- Prefer small, reversible changes.
- Preserve existing style and structure.
- For non-trivial work, briefly state the plan before making changes.
- Ask before broad, destructive, or hard-to-reverse actions.
- Prefer safe inspection before mutation.
- Use the `agent-browser` skill for any task involving websites, browser automation, navigation, forms, screenshots, scraping, or web app QA.

## Subagents

- Prefer using the pi-subagents extension for exploratory or parallelizable work.
- Before spawning subagents, break the task into smaller independent subtasks.
- When useful, spawn multiple subagents in parallel instead of doing all exploration in the main thread.
- Prefer subagents for codebase exploration, search, comparison, and side investigations.
- Prefer openai-codex/gpt-5.4-mini for exploratory subagents when appropriate.
- Keep the main thread focused on coordination, synthesis, and the final answer.
- Use subagents proactively when a task clearly benefits from decomposition; do not wait for the user to request an exact number.
- For independent exploration, prefer multiple parallel subagents over a single broad one.
- For sequential work, prefer a short chain such as scout -> planner -> worker/reviewer.
- Keep each subagent focused on one narrow question or slice of work.
- Prefer the main thread for orchestration and synthesis, not broad exploratory searching.
- When using subagents, choose the smallest useful number that gives parallelism without unnecessary overhead.

## Communication

- Keep answers short and to the point.
- Prefer brief explanations over long essays.
- Explain only what is needed for the next decision or action.
- When giving options, keep them concise and include a recommendation.

## Search

- Prefer Exa tools for web search and code/documentation lookup when external search is needed.
- Use `web_search_exa` for current web information.
- Use `get_code_context_exa` for API docs, library usage, and code examples.
- Prefer Exa over ad-hoc browsing when it is faster or cleaner.
- Summarize findings briefly and include the most relevant sources.
