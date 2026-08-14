import type { ServerManager } from "../utils/server-manager";
import type { TerrariaConfig } from "../types";

export async function handleStatus(
  serverManager: ServerManager,
  config: TerrariaConfig,
  reply: (text: string) => Promise<void>,
): Promise<void> {
  if (config.servers.length === 0) {
    await reply("暂无已配置的服务器");
    return;
  }

  const statusList = serverManager.getStatusList();
  const lines: string[] = [];

  config.servers.forEach((server, index) => {
    if (index > 0) lines.push("");

    const statusObj = statusList.find((s) => s.name === server.server_name);
    const wsStatus =
      statusObj?.status === "connected"
        ? "已连接"
        : statusObj?.status === "connecting"
          ? "连接中"
          : "未连接";

    lines.push(`服务器：${server.server_name}`);
    lines.push(`WebSocket 状态：${wsStatus}`);
    lines.push(`地址：${server.host}:${server.port}`);
  });

  await reply(lines.join("\n"));
}
