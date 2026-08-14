import type { ConfigService } from "mioku";
import {
  DEFAULT_CONFIG,
  normalizeConfig,
  type TerrariaConfig,
  type TerrariaServerConfig,
} from "../types";

export function createConfigHandler(configService: ConfigService | undefined) {
  let currentConfig: TerrariaConfig = { ...DEFAULT_CONFIG };

  const register = async () => {
    if (!configService) return;
    await configService.registerConfig("terraria", "base", DEFAULT_CONFIG);
    const raw = await configService.getConfig("terraria", "base");
    currentConfig = normalizeConfig(raw);
    configService.onConfigChange("terraria", "base", (next) => {
      currentConfig = normalizeConfig(next);
    });
  };

  const getConfig = (): TerrariaConfig => currentConfig;

  const updateServerSync = async (
    serverName: string,
    enabled: boolean,
  ): Promise<boolean> => {
    if (!configService) return false;
    const exists = currentConfig.servers.some(
      (s) => s.server_name === serverName,
    );
    if (!exists) return false;
    const servers = currentConfig.servers.map((s) =>
      s.server_name === serverName ? { ...s, sync_enabled: enabled } : s,
    );
    await configService.updateConfig("terraria", "base", { servers });
    return true;
  };

  const findServerByName = (
    serverName: string,
  ): TerrariaServerConfig | null => {
    return (
      currentConfig.servers.find((s) => s.server_name === serverName) || null
    );
  };

  const getServersForGroup = (
    groupId: string | number,
  ): TerrariaServerConfig[] => {
    const gid = String(groupId);
    return currentConfig.servers.filter((s) => s.group_list === gid);
  };

  return {
    register,
    getConfig,
    updateServerSync,
    findServerByName,
    getServersForGroup,
  };
}

export type ConfigHandler = ReturnType<typeof createConfigHandler>;
