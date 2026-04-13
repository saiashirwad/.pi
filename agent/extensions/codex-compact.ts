import { completeSimple } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { convertToLlm, serializeConversation } from "@mariozechner/pi-coding-agent";

const COMPACTION_SYSTEM_PROMPT = [
  "You are performing a CONTEXT CHECKPOINT COMPACTION.",
  "Create a handoff summary for another LLM that will resume the task.",
  "Do not continue the work. Only produce the checkpoint.",
].join(" ");

const COMPACTION_USER_PROMPT = `Include:
- Current progress and key decisions made
- Important context, constraints, or user preferences
- What remains to be done (clear next steps)
- Any critical data, examples, or references needed to continue

Output concise, structured markdown with these sections:
## Current Progress
## Key Decisions
## Constraints & Preferences
## Remaining Work
## Critical References

Preserve exact file paths, symbols, commands, errors, and identifiers when important.`;

function pickSummaryModel(ctx: ExtensionContext) {
  return (
    ctx.modelRegistry.find("openai-codex", "gpt-5.4-mini") ??
    ctx.modelRegistry.find("openai-codex", "gpt-5.4") ??
    ctx.modelRegistry.find("openai", "gpt-5.4-mini") ??
    ctx.modelRegistry.find("openai", "gpt-5.4")
  );
}

function computeFileLists(fileOps: {
  read: Set<string>;
  written: Set<string>;
  edited: Set<string>;
}) {
  const modified = new Set([...fileOps.written, ...fileOps.edited]);
  const readFiles = [...fileOps.read].filter((f) => !modified.has(f)).sort();
  const modifiedFiles = [...modified].sort();
  return { readFiles, modifiedFiles };
}

function formatFileTags(readFiles: string[], modifiedFiles: string[]) {
  const parts: string[] = [];
  if (readFiles.length) {
    parts.push(`<read-files>\n${readFiles.join("\n")}\n</read-files>`);
  }
  if (modifiedFiles.length) {
    parts.push(`<modified-files>\n${modifiedFiles.join("\n")}\n</modified-files>`);
  }
  return parts.length ? `\n\n${parts.join("\n\n")}` : "";
}

export default function (pi: ExtensionAPI) {
  pi.on("session_before_compact", async (event, ctx) => {
    const { preparation, customInstructions, signal } = event;
    const {
      messagesToSummarize,
      turnPrefixMessages,
      tokensBefore,
      firstKeptEntryId,
      previousSummary,
      fileOps,
      settings,
    } = preparation;

    const model = pickSummaryModel(ctx);
    if (!model) {
      ctx.ui.notify("Codex compaction: no compatible summary model found, using default compaction", "warning");
      return;
    }

    const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
    if (!auth.ok || !auth.apiKey) {
      ctx.ui.notify("Codex compaction: auth unavailable, using default compaction", "warning");
      return;
    }

    const messages = [...messagesToSummarize, ...turnPrefixMessages];
    if (messages.length === 0 && !previousSummary) {
      return;
    }

    const conversationText = serializeConversation(convertToLlm(messages));
    const previousSummaryBlock = previousSummary
      ? `\n<previous-summary>\n${previousSummary}\n</previous-summary>`
      : "";
    const customInstructionsBlock = customInstructions?.trim()
      ? `\n<additional-focus>\n${customInstructions.trim()}\n</additional-focus>`
      : "";

    const promptText = [
      COMPACTION_USER_PROMPT,
      previousSummaryBlock,
      customInstructionsBlock,
      `\n<conversation>\n${conversationText}\n</conversation>`,
    ].join("\n");

    ctx.ui.notify(
      `Codex compaction: checkpointing ${messages.length} messages (${tokensBefore.toLocaleString()} tokens before compaction) with ${model.id}`,
      "info",
    );

    try {
      const response = await completeSimple(
        model,
        {
          systemPrompt: COMPACTION_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [{ type: "text", text: promptText }],
              timestamp: Date.now(),
            },
          ],
        },
        {
          apiKey: auth.apiKey,
          headers: auth.headers,
          signal,
          maxTokens: Math.max(2048, Math.floor(settings.reserveTokens * 0.6)),
          ...(model.reasoning ? { reasoning: "medium" as const } : {}),
        },
      );

      if (response.stopReason === "error") {
        ctx.ui.notify(`Codex compaction failed: ${response.errorMessage ?? "unknown error"}`, "error");
        return;
      }

      const summary = response.content
        .filter((item): item is { type: "text"; text: string } => item.type === "text")
        .map((item) => item.text)
        .join("\n")
        .trim();

      if (!summary) {
        ctx.ui.notify("Codex compaction returned an empty summary, using default compaction", "warning");
        return;
      }

      const { readFiles, modifiedFiles } = computeFileLists(fileOps);

      return {
        compaction: {
          summary: `${summary}${formatFileTags(readFiles, modifiedFiles)}`,
          firstKeptEntryId,
          tokensBefore,
          details: {
            source: "codex-checkpoint",
            summaryModel: model.id,
            readFiles,
            modifiedFiles,
          },
        },
      };
    } catch (error) {
      if (!signal.aborted) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Codex compaction failed: ${message}`, "error");
      }
      return;
    }
  });
}
