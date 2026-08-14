import { PROTOCOL, type TerrariaConfig, type TerrariaEvent } from "../types";

export function formatTerrariaEvent(
  event: TerrariaEvent,
  config: TerrariaConfig,
): string | null {
  const sayWord = config.say_way || "说：";
  const playerName = event.player?.name || "未知玩家";
  let body: string | null = null;

  switch (event.name) {
    case PROTOCOL.PLAYER_JOIN:
      body = `${playerName} 加入了游戏`;
      break;
    case PROTOCOL.PLAYER_QUIT:
      body = `${playerName} 退出了游戏`;
      break;
    case PROTOCOL.PLAYER_CHAT: {
      const content = (event.message ?? "").trim();
      if (content) body = `${playerName} ${sayWord} ${content}`;
      break;
    }
    case PROTOCOL.PLAYER_DEATH: {
      const text = (event.death_message ?? "").trim();
      body = text ? `${playerName} ${text}` : `${playerName} 倒下了`;
      break;
    }
  }

  if (!body) return null;
  if (!config.display_server_name) return body;
  const name = event.server_name || "未知服务器";
  return `[${name}] ${body}`;
}

export interface QqMessagePart {
  type: string;
  text?: string;
  url?: string;
}

export interface QqSender {
  nickname?: string;
  card?: string;
  user_id?: number | string;
}

export function formatQqToTerraria(
  sender: QqSender,
  messageArr: QqMessagePart[],
): string {
  const sayWord = "说：";
  const nick =
    sender.nickname || sender.card || String(sender.user_id ?? "未知用户");

  const parts: string[] = [];
  for (const msg of messageArr) {
    if (msg.type === "text") {
      parts.push(String(msg.text ?? ""));
    } else if (msg.type === "image") {
      parts.push("[图片]");
    } else if (msg.type === "face") {
      parts.push("[表情]");
    } else if (msg.type === "at") {
      parts.push(`@${String(msg.text ?? "").trim()}`);
    } else if (msg.type === "reply") {
      parts.push("");
    } else {
      parts.push(`[${msg.type}]`);
    }
  }

  const content = parts.join("").trim();
  return `${nick} ${sayWord} ${content}`.trim();
}
