import type { ConfigHandler } from "../utils/config-handler";
import type { TerrariaConfig } from "../types";

export async function handleSync(
  serverName: string | undefined,
  enabled: boolean,
  configHandler: ConfigHandler,
  config: TerrariaConfig,
  reply: (text: string) => Promise<void>,
): Promise<boolean> {
  if (!serverName) {
    if (config.servers.length === 0) {
      await reply("暂无已配置的服务器");
      return true;
    }
    const lines = config.servers.map((s) => {
      const syncStatus = s.sync_enabled === false ? "已关闭" : "已开启";
      return `${s.server_name}: ${syncStatus}`;
    });
    await reply(lines.join("\n"));
    return true;
  }

  const serverItem = configHandler.findServerByName(serverName);
  if (!serverItem) {
    await reply(`未找到服务器「${serverName}」`);
    return true;
  }

  const ok = await configHandler.updateServerSync(serverName, enabled);
  if (!ok) {
    await reply(`更新服务器 ${serverName} 同步状态失败`);
    return true;
  }
  const action = enabled ? "开启" : "关闭";
  await reply(`${action}了服务器 ${serverName} 的同步`);
  return true;
}
