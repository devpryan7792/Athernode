import type {
  ServerSummary,
  ServerDetail,
  PowerAction,
  TelemetryFrame,
  ConsoleLogMessage,
  UnifiedAddon,
  AddonType,
  PlayerData,
  FileItem,
  VelocityNetworkConfig,
  SchematicItem,
  ModLoader,
} from '../../types';

export interface IServerService {
  getServers(): Promise<ServerSummary[]>;
  getServerById(id: string): Promise<ServerDetail>;
  createServer(payload: Partial<ServerDetail>): Promise<ServerDetail>;
  updateServer(id: string, payload: Partial<ServerDetail>): Promise<ServerDetail>;
  deleteServer(id: string): Promise<void>;
  sendPowerAction(id: string, action: PowerAction): Promise<void>;
}

export interface ITelemetryService {
  subscribeTelemetry(serverId: string, callback: (frame: TelemetryFrame) => void): () => void;
  subscribeConsole(serverId: string, callback: (msg: ConsoleLogMessage) => void): () => void;
  sendCommand(serverId: string, command: string): Promise<void>;
  getInitialLogs(serverId: string, limit?: number): Promise<ConsoleLogMessage[]>;
}

export interface IAddonService {
  searchAddons(query: {
    search?: string;
    type?: AddonType;
    loader?: ModLoader;
    gameVersion?: string;
    provider?: 'all' | 'modrinth' | 'curseforge';
  }): Promise<UnifiedAddon[]>;
  installAddon(serverId: string, addonId: string, versionId: string, includeDependencies?: boolean): Promise<{ success: boolean; installedFiles: string[] }>;
  uninstallAddon(serverId: string, filename: string): Promise<void>;
  getInstalledAddons(serverId: string): Promise<string[]>;
}

export interface IPlayerService {
  getOnlinePlayers(serverId: string): Promise<PlayerData[]>;
  getPlayerInventory(serverId: string, uuid: string): Promise<PlayerData>;
  kickPlayer(serverId: string, uuid: string, reason?: string): Promise<void>;
  banPlayer(serverId: string, uuid: string, reason?: string): Promise<void>;
  toggleOp(serverId: string, uuid: string): Promise<boolean>;
  teleportPlayer(serverId: string, uuid: string, targetCoords: [number, number, number]): Promise<void>;
  updateInventorySlot(serverId: string, uuid: string, slotIndex: number, count: number): Promise<void>;
}

export interface IFileService {
  listFiles(serverId: string, directoryPath: string): Promise<FileItem[]>;
  readFile(serverId: string, filePath: string): Promise<string>;
  writeFile(serverId: string, filePath: string, content: string): Promise<void>;
  deleteFile(serverId: string, filePath: string): Promise<void>;
  createDirectory(serverId: string, directoryPath: string): Promise<void>;
}

export interface IVelocityService {
  getNetworkConfig(): Promise<VelocityNetworkConfig>;
  updateNetworkConfig(config: VelocityNetworkConfig): Promise<VelocityNetworkConfig>;
  generateForwardingSecret(): Promise<string>;
  syncBackendSecret(backendServerId: string, secret: string): Promise<{ success: boolean; message: string }>;
  sendPlayerToServer(playerUuid: string, targetServerId: string): Promise<{ success: boolean }>;
}

export interface ISchematicService {
  listSchematics(serverId: string): Promise<SchematicItem[]>;
  uploadSchematic(serverId: string, file: File): Promise<SchematicItem>;
  deleteSchematic(serverId: string, schematicId: string): Promise<void>;
}
