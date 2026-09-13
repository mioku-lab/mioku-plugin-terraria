import { definePlugin, getService, Services, type MiokuContext } from "mioku";
import { handleStatus } from "./handlers/status";
import { handleSync } from "./handlers/sync";
import { handleReconnect } from "./handlers/reconnect";
import { parseTsCommand } from "./utils/command-router";
import { createConfigHandler } from "./utils/config-handler";
import {
  formatQqToTerraria,
  formatTerrariaEvent,
  type QqMessagePart,
} from "./utils/message-formatter";
import { createServerManager } from "./utils/server-manager";
import {
  formatCommandResult,
  isCommandAllowed,
  parseCommand,
} from "./core/command";
import { PROTOCOL, type TerrariaConfig, type TerrariaEvent } from "./types";

export default definePlugin({
  name: "terraria",
  version: "1.0.0",
  description: "Terraria 服务器与 QQ 群消息互通插件，基于 TianSuo 协议",

  async setup(ctx: MiokuContext) {
    const configService = getService(ctx, Services.Config);

    const configHandler = createConfigHandler(configService);
    await configHandler.register();
    const config = configHandler.getConfig();

    const serverManager = createServerManager({
      onStatusChange: (serverName, status) => {
        ctx.logger.info(`[Terraria] 服务器 ${serverName} 状态: ${status}`);
      },
      onEvent: (raw) => {
        handleTerrariaEvent(ctx, raw, config, configHandler);
      },
      logger: { error: (msg) => ctx.logger.error(msg) },
    });

    serverManager.startServers(config);
    ctx.logger.info("Terraria 插件已就绪");

    ctx.handle("message", async (event) => {
      const text = ctx.text(event).trim();
      const groupId =
        "group_id" in event && typeof event.group_id === "number"
          ? event.group_id
          : undefined;

      const parsed = parseTsCommand(text);
      if (parsed) {
        if (!groupId) return;

        switch (parsed.action) {
          case "状态": {
            await handleStatus(serverManager, config, async (msg) => {
              await event.reply(msg);
            });
            return;
          }
          case "开启同步": {
            const serverName = parsed.args[0];
            await handleSync(
              serverName,
              true,
              configHandler,
              config,
              async (msg) => {
                await event.reply(msg);
              },
            );
            return;
          }
          case "关闭同步": {
            const serverName = parsed.args[0];
            await handleSync(
              serverName,
              false,
              configHandler,
              config,
              async (msg) => {
                await event.reply(msg);
              },
            );
            return;
          }
          case "重连": {
            if (ctx.isMaster?.(event)) {
              await handleReconnect(serverManager, async (msg) => {
                await event.reply(msg);
              });
            }
            return;
          }
          case "":
            return;
        }
        return;
      }

      if (!groupId) return;
      await forwardToTerraria(ctx, event, config, configHandler, serverManager);
    });

    return async () => {
      serverManager.stopServers();
      ctx.logger.info("Terraria 插件已卸载");
    };
  },
});

async function handleTerrariaEvent(
  ctx: MiokuContext,
  raw: { serverName: string; name: string; data: Record<string, unknown> },
  config: TerrariaConfig,
  configHandler: ReturnType<typeof createConfigHandler>,
): Promise<void> {
  const eventName = raw.name as TerrariaEvent["name"];
  if (
    eventName !== PROTOCOL.PLAYER_JOIN &&
    eventName !== PROTOCOL.PLAYER_QUIT &&
    eventName !== PROTOCOL.PLAYER_CHAT &&
    eventName !== PROTOCOL.PLAYER_DEATH
  ) {
    return;
  }

  const data = raw.data ?? {};
  const event: TerrariaEvent = {
    server_name: raw.serverName,
    name: eventName,
    player: (data.player as TerrariaEvent["player"]) || undefined,
    message: typeof data.message === "string" ? data.message : undefined,
    death_message:
      typeof data.death_message === "string"
        ? data.death_message
        : typeof data.deathMessage === "string"
          ? data.deathMessage
          : undefined,
  };

  const messageText = formatTerrariaEvent(event, config);
  if (!messageText) return;

  const serverItem = configHandler.findServerByName(raw.serverName);
  if (!serverItem) return;
  if (serverItem.sync_enabled === false) return;

  const bots = serverItem.bot_self_id ? [serverItem.bot_self_id] : [];
  const groups = serverItem.group_list ? [serverItem.group_list] : [];

  for (const botId of bots) {
    const bot = ctx.pickBot(botId);
    if (!bot) continue;
    for (const groupId of groups) {
      try {
        await bot.sendMessage({ type: "group", group_id: groupId}, messageText);
      } catch (err) {
        ctx.logger.error(
          `[Terraria] 发送消息到群 ${groupId} 失败: ${err}`,
        );
      }
    }
  }
}

async function forwardToTerraria(
  ctx: MiokuContext,
  event: any,
  config: TerrariaConfig,
  configHandler: ReturnType<typeof createConfigHandler>,
  serverManager: ReturnType<typeof createServerManager>,
): Promise<void> {
  const text = ctx.text(event);
  ctx.logger.debug(
    `[Terraria] 收到群消息 group=${event.group_id} text=${text}`,
  );

  if (!event.group_id) return;

  const servers = configHandler.getServersForGroup(event.group_id);
  if (servers.length === 0) return;

  const msgList: QqMessagePart[] = Array.isArray(event.message)
    ? event.message
    : [{ type: "text", text }];

  for (const server of servers) {
    if (server.sync_enabled === false) continue;

    const commandText = parseCommand(text, server);
    if (commandText !== null) {
      const isAllowed = isCommandAllowed(
        commandText,
        server,
        ctx.isMaster?.(event) ?? false,
        event.user_id,
      );
      if (!isAllowed) continue;

      try {
        const result = await serverManager.rcon(server.server_name, commandText);
        await event.reply(formatCommandResult(result));
      } catch (err) {
        await event.reply(`执行命令失败: ${err}`);
      }
      continue;
    }

    try {
      const message = formatQqToTerraria(event.sender || {}, msgList);
      await serverManager.broadcast(server.server_name, message);
    } catch (err) {
      ctx.logger.error(
        `[Terraria] 发送到服务器 ${server.server_name} 失败: ${err}`,
      );
    }
  }
}
