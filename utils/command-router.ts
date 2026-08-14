export interface ParsedCommand {
  action: string;
  args: string[];
  raw: string;
}

export function parseTsCommand(text: string): ParsedCommand | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/ts")) return null;

  const remainder = trimmed.slice(3).trim();
  if (!remainder) {
    return { action: "", args: [], raw: "" };
  }

  const parts = remainder.split(/\s+/);
  const action = parts[0] || "";
  const args = parts.slice(1);

  return { action, args, raw: remainder };
}
