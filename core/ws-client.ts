import WebSocket from "ws";
import { PROTOCOL, type TerrariaServerConfig } from "../types";

export type ClientStatus = "connected" | "disconnected" | "connecting";

export interface TerrariaApiResponse {
  success: boolean;
  message?: string;
}

export interface WsClient {
  serverName: string;
  getStatus(): ClientStatus;
  request(
    name: string,
    data: Record<string, unknown>,
  ): Promise<TerrariaApiResponse>;
  close(): void;
}

type EventHandler = (raw: {
  name: string;
  data: Record<string, unknown>;
}) => void;
type StatusHandler = (serverName: string, status: ClientStatus) => void;
type ErrorHandler = (serverName: string, error: Error) => void;

interface PendingRequest {
  name: string;
  resolve: (value: TerrariaApiResponse) => void;
  reject: (err: Error) => void;
}

export function createForwardClient(
  serverItem: TerrariaServerConfig,
  onEvent: EventHandler,
  onStatusChange: StatusHandler,
  onError?: ErrorHandler,
): WsClient {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;
  let closed = false;
  let currentStatus: ClientStatus = "disconnected";
  const pendingQueue: PendingRequest[] = [];

  const updateStatus = (status: ClientStatus) => {
    currentStatus = status;
    onStatusChange(serverItem.server_name, status);
  };

  const flushQueueWithError = (err: Error) => {
    while (pendingQueue.length > 0) {
      const pending = pendingQueue.shift()!;
      pending.reject(err);
    }
  };

  const connect = () => {
    if (closed) return;
    if (socket) {
      try {
        socket.close();
      } catch {}
      socket = null;
    }
    updateStatus("connecting");

    const url = buildUrl(serverItem.host, serverItem.port);
    const headers: Record<string, string> = {
      "x-self-name": serverItem.server_name,
    };
    const token = (serverItem.access_token || "").trim();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      socket = new WebSocket(url, { headers });
    } catch (err) {
      onError?.(serverItem.server_name, err as Error);
      updateStatus("disconnected");
      scheduleReconnect();
      return;
    }

    socket.on("open", () => {
      reconnectAttempt = 0;
      updateStatus("connected");
    });

    socket.on("close", () => {
      if (currentStatus !== "disconnected") {
        updateStatus("disconnected");
      }
      flushQueueWithError(new Error(`服务器 ${serverItem.server_name} 连接已断开`));
      scheduleReconnect();
    });

    socket.on("error", (err: Error) => {
      onError?.(serverItem.server_name, err);
    });

    socket.on("message", (data: WebSocket.RawData) => {
      const text = data.toString();
      let parsed: { type?: string; name?: string; data?: unknown };
      try {
        parsed = JSON.parse(text);
      } catch {
        return;
      }
      handleEnvelope(parsed);
    });
  };

  const handleEnvelope = (env: {
    type?: string;
    name?: string;
    data?: unknown;
  }) => {
    if (!env.type || !env.name) return;

    if (env.type === PROTOCOL.EVENT_TYPE) {
      onEvent({
        name: env.name,
        data: (env.data ?? {}) as Record<string, unknown>,
      });
      return;
    }

    if (env.type === PROTOCOL.API_TYPE && env.name === PROTOCOL.API_RESPONSE) {
      const pending = pendingQueue.shift();
      if (!pending) return;
      const result = (env.data ?? {}) as TerrariaApiResponse;
      pending.resolve({
        success: Boolean(result.success),
        message: result.message,
      });
    }
  };

  const scheduleReconnect = () => {
    if (closed) return;
    if (reconnectTimer) return;
    const maxAttempts = serverItem.reconnect_max_attempts ?? 0;
    reconnectAttempt += 1;
    if (maxAttempts > 0 && reconnectAttempt > maxAttempts) {
      return;
    }
    const baseDelay = 10_000;
    const delay = Math.min(baseDelay * reconnectAttempt, 60_000);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  const request = (
    name: string,
    data: Record<string, unknown>,
  ): Promise<TerrariaApiResponse> => {
    return new Promise<TerrariaApiResponse>((resolve, reject) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error(`服务器 ${serverItem.server_name} 未连接`));
        return;
      }
      const envelope = JSON.stringify({
        type: PROTOCOL.API_TYPE,
        name,
        data,
      });
      try {
        socket.send(envelope);
      } catch (err) {
        reject(err as Error);
        return;
      }
      pendingQueue.push({ name, resolve, reject });
    });
  };

  const close = () => {
    closed = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket) {
      try {
        socket.close();
      } catch {}
      socket = null;
    }
    flushQueueWithError(new Error(`服务器 ${serverItem.server_name} 已关闭`));
    updateStatus("disconnected");
  };

  connect();

  return {
    serverName: serverItem.server_name,
    getStatus: () => currentStatus,
    request,
    close,
  };
}

function buildUrl(host: string, port: number): string {
  return `ws://${host}:${port}/`;
}
