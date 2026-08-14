export const PROTOCOL = {
  EVENT_TYPE: "event",
  API_TYPE: "api",
  API_RESPONSE: "api_response",

  PLAYER_JOIN: "player_join",
  PLAYER_QUIT: "player_quit",
  PLAYER_CHAT: "player_chat",
  PLAYER_DEATH: "player_death",

  BROADCAST: "broadcast",
  PRIVATE_MESSAGE: "private_message",
  RCON_COMMAND: "rcon_command",
} as const;

export type ProtocolName = (typeof PROTOCOL)[keyof typeof PROTOCOL];

export type TerrariaEventName =
  | typeof PROTOCOL.PLAYER_JOIN
  | typeof PROTOCOL.PLAYER_QUIT
  | typeof PROTOCOL.PLAYER_CHAT
  | typeof PROTOCOL.PLAYER_DEATH;

export interface PlayerView {
  name?: string;
  index?: number;
  group?: string;
  account?: string;
  uuid?: string;
  ip?: string;
}

export interface TerrariaEvent {
  server_name: string;
  name: TerrariaEventName;
  player?: PlayerView;
  message?: string;
  death_message?: string;
}

export interface TerrariaServerConfig {
  server_name: string;
  host: string;
  port: number;
  access_token?: string;
  reconnect_max_attempts?: number;
  group_list: string;
  bot_self_id: string;
  command_header?: string;
  command_user?: string[];
  rcon_command_whitelist?: string[];
  sync_enabled?: boolean;
}

export interface TerrariaConfig {
  servers: TerrariaServerConfig[];
  say_way: string;
  display_server_name: boolean;
}

export const DEFAULT_CONFIG: TerrariaConfig = {
  servers: [],
  say_way: "说：",
  display_server_name: true,
};

export function normalizeConfig(raw: Partial<TerrariaConfig>): TerrariaConfig {
  const servers = Array.isArray(raw.servers) ? raw.servers : [];
  return {
    servers: servers.map((s) => ({
      ...s,
      server_name: String(s.server_name ?? "").trim(),
      host:
        typeof s.host === "string" && s.host.trim()
          ? s.host.trim()
          : "127.0.0.1",
      port: typeof s.port === "number" && s.port > 0 ? s.port : 8080,
      access_token:
        typeof s.access_token === "string" ? s.access_token.trim() : "",
      reconnect_max_attempts:
        typeof s.reconnect_max_attempts === "number"
          ? s.reconnect_max_attempts
          : 0,
      group_list:
        typeof s.group_list === "string" ? s.group_list.trim() : "",
      bot_self_id:
        typeof s.bot_self_id === "string" ? s.bot_self_id.trim() : "",
      command_header:
        typeof s.command_header === "string" && s.command_header
          ? s.command_header
          : "$",
      command_user: Array.isArray(s.command_user)
        ? s.command_user.map((u) => String(u))
        : [],
      rcon_command_whitelist: Array.isArray(s.rcon_command_whitelist)
        ? s.rcon_command_whitelist.map((c) => String(c))
        : [],
      sync_enabled:
        typeof s.sync_enabled === "boolean" ? s.sync_enabled : true,
    })),
    say_way: raw.say_way || DEFAULT_CONFIG.say_way,
    display_server_name:
      typeof raw.display_server_name === "boolean"
        ? raw.display_server_name
        : DEFAULT_CONFIG.display_server_name,
  };
}
