# Global pi guidance

- Be concise, practical, and explicit.
- Prefer small, reversible changes.
- Preserve existing style and structure.
- For non-trivial work, briefly state the plan before making changes.
- Ask before broad, destructive, or hard-to-reverse actions.
- Prefer safe inspection before mutation.

## Subagents

- Prefer using the pi-subagents extension for exploratory or parallelizable work.
- Before spawning subagents, break the task into smaller independent subtasks.
- When useful, spawn multiple subagents in parallel instead of doing all exploration in the main thread.
- Prefer subagents for codebase exploration, search, comparison, and side investigations.
- Prefer `kimi-coding/k2p5` for exploratory subagents when appropriate.
- Keep the main thread focused on coordination, synthesis, and the final answer.

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
