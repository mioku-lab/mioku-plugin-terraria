import type { TerrariaServerConfig } from "../types";

export function parseCommand(
  text: string,
  serverItem: TerrariaServerConfig,
): string | null {
  const header = serverItem.command_header || "$";
  const trimmed = text.trim();
  if (!header || !trimmed.startsWith(header)) return null;
  return trimmed.slice(header.length).trim();
}

export function isCommandAllowed(
  text: string,
  serverItem: TerrariaServerConfig,
  isMaster: boolean,
  userId: number | string | undefined,
): boolean {
  if (isMaster) return true;

  const cmdName = getCommandName(text);
  const whitelist = serverItem.rcon_command_whitelist || [];
  if (
    whitelist.some((w) => String(w).replace(/^\/+/, "") === cmdName)
  ) {
    return true;
  }

  const userList = serverItem.command_user || [];
  if (userId === undefined) return false;
  return userList.some((u) => String(u) === String(userId));
}

function getCommandName(text: string): string {
  const trimmed = String(text).trim();
  const parts = trimmed.split(/\s+/, 1);
  return parts[0] || "";
}

export function formatCommandResult(raw: TerrariaCommandResult): string {
  if (raw === null || raw === undefined) return "命令执行成功";

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed || "命令执行成功";
  }

  if (typeof raw !== "object") return String(raw);

  const success = Boolean(raw.success);
  const message = String(raw.message ?? "").trim();

  if (!success) {
    return message || "命令执行失败";
  }
  return message || "命令执行成功";
}

export type TerrariaCommandResult =
  | { success: boolean; message?: string }
  | string
  | null
  | undefined;
