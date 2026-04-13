// Syncs OpenAI Codex auth into pi, patches atob to preserve account IDs in
// decoded auth payloads, and exposes a command to import Codex login data.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  AuthStorage,
  getAgentDir,
  type ExtensionAPI,
  type OAuthCredential,
} from "@mariozechner/pi-coding-agent";

const OPENAI_AUTH_CLAIM = "https://api.openai.com/auth";
const PI_PROVIDER_ID = "openai-codex";
const PATCH_MARKER = "__piCodexAtobPatched";

function readJson(file: string): any {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function decodeJwtPayload(token?: string | null): any | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function deriveAccountIdFromPayload(payload: any): string | null {
  const auth = payload?.[OPENAI_AUTH_CLAIM];
  if (!auth || typeof auth !== "object") return null;
  if (
    typeof auth.chatgpt_account_id === "string" &&
    auth.chatgpt_account_id.length > 0
  ) {
    return auth.chatgpt_account_id;
  }
  const orgs = auth.organizations;
  if (Array.isArray(orgs)) {
    const preferred =
      orgs.find((org: any) => org?.is_default && typeof org?.id === "string") ??
      orgs.find((org: any) => typeof org?.id === "string");
    if (preferred?.id) return preferred.id;
  }
  return null;
}

function getCodexAuthPath(): string {
  return path.join(os.homedir(), ".codex", "auth.json");
}

function getPiAuthPath(): string {
  return path.join(getAgentDir(), "auth.json");
}

function getCodexAccountIdFromCodexAuth(): string | null {
  const codexAuthFile = getCodexAuthPath();
  if (!fs.existsSync(codexAuthFile)) return null;
  try {
    const codexAuth = readJson(codexAuthFile);
    const tokens = codexAuth?.tokens ?? {};
    return (
      deriveAccountIdFromPayload(decodeJwtPayload(tokens.id_token)) ??
      deriveAccountIdFromPayload(decodeJwtPayload(tokens.access_token)) ??
      (typeof tokens.account_id === "string" ? tokens.account_id : null)
    );
  } catch {
    return null;
  }
}

function getCodexAccountIdFromPiAuth(): string | null {
  try {
    const creds = AuthStorage.create().get(PI_PROVIDER_ID);
    return creds?.type === "oauth" && typeof creds.accountId === "string" && creds.accountId.length > 0
      ? creds.accountId
      : null;
  } catch {
    return null;
  }
}

function getBestAccountId(): string | null {
  return getCodexAccountIdFromPiAuth() ?? getCodexAccountIdFromCodexAuth();
}

function installAtobPatch(): void {
  const g = globalThis as typeof globalThis & {
    [PATCH_MARKER]?: boolean;
    atob: (data: string) => string;
  };
  if (g[PATCH_MARKER]) return;
  const nativeAtob = globalThis.atob.bind(globalThis);

  g.atob = (input: string): string => {
    let normalized = input;
    let decoded: string;
    try {
      normalized = input.replace(/-/g, "+").replace(/_/g, "/");
      normalized += "=".repeat((4 - (normalized.length % 4)) % 4);
      decoded = nativeAtob(normalized);
    } catch {
      decoded = nativeAtob(input);
    }

    try {
      const payload = JSON.parse(decoded);
      const auth = payload?.[OPENAI_AUTH_CLAIM];
      if (auth && typeof auth === "object" && !auth.chatgpt_account_id) {
        const accountId = getBestAccountId();
        if (accountId) {
          auth.chatgpt_account_id = accountId;
          return JSON.stringify(payload);
        }
      }
    } catch {
      // not JSON; pass through
    }

    return decoded;
  };

  g[PATCH_MARKER] = true;
}

function syncCodexAuthIntoPi(): {
  accountId: string | null;
  expires: number;
  written: string;
} {
  const codexAuthFile = getCodexAuthPath();

  if (!fs.existsSync(codexAuthFile)) {
    throw new Error("~/.codex/auth.json not found. Run codex login first.");
  }

  const codexAuth = readJson(codexAuthFile);
  const tokens = codexAuth?.tokens ?? {};
  const access = tokens.access_token;
  const refresh = tokens.refresh_token;
  const idToken = tokens.id_token;

  if (typeof access !== "string" || typeof refresh !== "string") {
    throw new Error(
      "~/.codex/auth.json is missing access_token or refresh_token.",
    );
  }

  const accessPayload = decodeJwtPayload(access);
  const exp = Number(accessPayload?.exp ?? 0);
  const expires =
    Number.isFinite(exp) && exp > 0 ? exp * 1000 : Date.now() + 30 * 60 * 1000;
  const accountId =
    deriveAccountIdFromPayload(decodeJwtPayload(idToken)) ??
    deriveAccountIdFromPayload(accessPayload) ??
    (typeof tokens.account_id === "string" ? tokens.account_id : null);

  const auth = AuthStorage.create();
  auth.set(
    PI_PROVIDER_ID,
    {
      type: "oauth",
      access,
      refresh,
      expires,
      accountId,
      idToken,
    } satisfies OAuthCredential,
  );

  return { accountId, expires, written: getPiAuthPath() };
}

export default function (pi: ExtensionAPI) {
  installAtobPatch();

  pi.on("session_start", async (_event, ctx) => {
    installAtobPatch();
    const accountId = getBestAccountId();
    if (accountId) {
      ctx.ui.setStatus("codex-login", `codex acct ${accountId.slice(0, 10)}…`);
    }
  });

  pi.registerCommand("codex-login", {
    description: "Import ChatGPT/Codex login from ~/.codex/auth.json into pi",
    handler: async (_args, ctx) => {
      installAtobPatch();
      const result = syncCodexAuthIntoPi();
      const acct = result.accountId ? ` (${result.accountId})` : "";
      ctx.ui.notify(`Imported Codex auth into pi${acct}`, "info");
      ctx.ui.setStatus(
        "codex-login",
        result.accountId
          ? `codex acct ${result.accountId.slice(0, 10)}…`
          : "codex auth synced",
      );
    },
  });
}
