// AetherNode Core Domain Types

export type ServerState = 'OFF' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'CRASHED';

export type ModLoader = 'fabric' | 'forge' | 'neoforge' | 'paper' | 'purpur' | 'velocity' | 'spigot' | 'vanilla';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

export interface ServerSummary {
  id: string;
  name: string;
  description: string;
  node: string;
  state: ServerState;
  engine: ModLoader;
  version: string;
  port: number;
  ip: string;
  currentPlayers: number;
  maxPlayers: number;
  memoryUsageBytes: number;
  memoryLimitBytes: number;
  cpuUsagePercent: number;
  tps: number;
  mspt: number;
  uptimeSeconds: number;
  isProxyLinked?: boolean;
}

export interface ServerDetail extends ServerSummary {
  startupCommand: string;
  javaVersion: '8' | '17' | '21';
  diskUsageBytes: number;
  diskLimitBytes: number;
  variables: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface TelemetryFrame {
  serverId: string;
  cpuUsagePercent: number;
  memoryUsageBytes: number;
  memoryLimitBytes: number;
  diskUsageBytes: number;
  tps: number;
  mspt: number;
  onlinePlayers: number;
  maxPlayers: number;
  timestamp: number;
}

export interface ConsoleLogMessage {
  id: string;
  serverId: string;
  stream: 'stdout' | 'stderr' | 'system';
  data: string;
  timestamp: number;
}

// Addons & Marketplace
export type AddonType = 'mod' | 'plugin' | 'datapack' | 'preset';
export type AddonProvider = 'modrinth' | 'curseforge';

export interface AddonDependency {
  projectId: string;
  title: string;
  dependencyType: 'required' | 'optional' | 'incompatible';
  installed: boolean;
}

export interface AddonVersion {
  versionId: string;
  versionNumber: string;
  gameVersions: string[];
  loaders: ModLoader[];
  downloadUrl: string;
  filename: string;
  fileSizeBytes: number;
  releaseDate: string;
  hashes: { sha1: string; sha512?: string };
  dependencies: AddonDependency[];
}

export interface UnifiedAddon {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description?: string;
  iconUrl: string | null;
  provider: AddonProvider;
  addonType: AddonType;
  totalDownloads: number;
  updatedAt: string;
  author: string;
  compatibleLoaders: ModLoader[];
  installedVersion?: string;
  versions: AddonVersion[];
}

// Player Management & NBT HUD
export interface PlayerData {
  uuid: string;
  username: string;
  avatarUrl: string;
  pingMs: number;
  health: number;
  maxHealth: number;
  foodLevel: number;
  xpLevel: number;
  dimension: 'minecraft:overworld' | 'minecraft:the_nether' | 'minecraft:the_end';
  position: [number, number, number];
  isOp: boolean;
  isWhitelisted: boolean;
  inventory: InventorySlot[];
  enderChest: InventorySlot[];
}

export interface InventorySlot {
  slot: number; // 0-35 standard, 100-103 armor, -106 offhand
  id: string; // e.g. "minecraft:netherite_sword"
  displayName: string;
  count: number;
  damage?: number;
  maxDamage?: number;
  enchantments?: { id: string; level: number }[];
  lore?: string[];
  iconSlug?: string;
}

// Velocity Network Management
export interface VelocityNetworkConfig {
  proxyServerId: string;
  proxyName: string;
  forwardingMode: 'modern' | 'bungeeguard' | 'legacy';
  forwardingSecret: string;
  bindPort: number;
  backendServers: VelocityBackendLink[];
}

export interface VelocityBackendLink {
  serverId: string;
  serverName: string;
  internalAddress: string;
  internalPort: number;
  isOnline: boolean;
  playerCount: number;
  isDefaultLobby: boolean;
  isFallBack: boolean;
}

// File Explorer & Editor
export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  modifiedAt: string;
  extension?: string;
}

// Schematics
export interface SchematicItem {
  id: string;
  name: string;
  filename: string;
  path: string;
  format: 'Sponge (.schem)' | 'Legacy (.schematic)';
  dimensions: { x: number; y: number; z: number };
  totalBlocks: number;
  paletteCount: number;
  dominantBlocks: { block: string; percentage: number }[];
  fileSizeBytes: number;
  createdAt: string;
}
