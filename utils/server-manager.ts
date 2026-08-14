import {
  createForwardClient,
  type ClientStatus,
  type WsClient,
} from "../core/ws-client";
import { PROTOCOL, type TerrariaConfig } from "../types";

export type StatusCallback = (serverName: string, status: ClientStatus) => void;
export type EventCallback = (raw: {
  serverName: string;
  name: string;
  data: Record<string, unknown>;
}) => void;

export interface ServerManagerOptions {
  onStatusChange: StatusCallback;
  onEvent: EventCallback;
  logger?: { error: (msg: string) => void };
}

export function createServerManager(options: ServerManagerOptions) {
  const clients = new Map<string, WsClient>();
  let currentConfig: TerrariaConfig | null = null;

  const handleEvent = (serverName: string) =>
    (raw: { name: string; data: Record<string, unknown> }) => {
      options.onEvent({
        serverName,
        name: raw.name,
        data: raw.data,
      });
    };

  const handleError = (serverName: string, error: Error) => {
    options.logger?.error(
      `[Terraria] 服务器 ${serverName} 连接错误: ${error.message}`,
    );
  };

  const stopClients = () => {
    clients.forEach((client) => client.close());
    clients.clear();
  };

  const startServers = (config: TerrariaConfig) => {
    stopClients();
    currentConfig = config;

    for (const server of config.servers) {
      if (!server.server_name) continue;
      if (server.sync_enabled === false) continue;

      const client = createForwardClient(
        server,
        handleEvent(server.server_name),
        options.onStatusChange,
        handleError,
      );
      clients.set(server.server_name, client);
    }
  };

  const stopServers = () => {
    stopClients();
    currentConfig = null;
  };

  const reconnectAll = () => {
    if (!currentConfig) return;
    const config = currentConfig;
    startServers(config);
  };

  const isServerConnected = (serverName: string) => {
    return clients.get(serverName)?.getStatus() === "connected";
  };

  const sendToServer = (
    serverName: string,
    apiName: string,
    data: Record<string, unknown>,
  ) => {
    const client = clients.get(serverName);
    if (!client) {
      throw new Error(`服务器 ${serverName} 未配置`);
    }
    return client.request(apiName, data);
  };

  const broadcast = (serverName: string, message: string) =>
    sendToServer(serverName, PROTOCOL.BROADCAST, { message });

  const privateMessage = (
    serverName: string,
    target: string,
    message: string,
  ) =>
    sendToServer(serverName, PROTOCOL.PRIVATE_MESSAGE, { target, message });

  const rcon = (serverName: string, command: string) =>
    sendToServer(serverName, PROTOCOL.RCON_COMMAND, { command });

  const getStatusList = () => {
    const list: Array<{ name: string; status: ClientStatus }> = [];
    clients.forEach((client, name) => {
      list.push({ name, status: client.getStatus() });
    });
    return list;
  };

  return {
    startServers,
    stopServers,
    reconnectAll,
    isServerConnected,
    sendToServer,
    broadcast,
    privateMessage,
    rcon,
    getStatusList,
  };
}

export type ServerManager = ReturnType<typeof createServerManager>;
