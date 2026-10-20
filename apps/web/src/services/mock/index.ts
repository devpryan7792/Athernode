import type {
  ServerDetail,
  ServerSummary,
  PowerAction,
  TelemetryFrame,
  ConsoleLogMessage,
  UnifiedAddon,
  PlayerData,
  FileItem,
  VelocityNetworkConfig,
  SchematicItem,
  AddonType,
  ModLoader,
} from '../../types';
import type {
  IServerService,
  ITelemetryService,
  IAddonService,
  IPlayerService,
  IFileService,
  IVelocityService,
  ISchematicService,
} from '../contracts';

// In-Memory Database
let mockServers: ServerDetail[] = [
  {
    id: 'srv-velocity',
    name: 'Velocity-Master-Proxy',
    description: 'High-throughput Velocity 3.3.0 Gateway & Modern HMAC Router',
    node: 'US-East-Node-01',
    state: 'RUNNING',
    engine: 'velocity',
    version: '3.3.0',
    port: 25565,
    ip: 'play.aethernode.net',
    currentPlayers: 42,
    maxPlayers: 500,
    memoryUsageBytes: 680 * 1024 * 1024,
    memoryLimitBytes: 1536 * 1024 * 1024,
    cpuUsagePercent: 8.4,
    tps: 20.0,
    mspt: 4.2,
    uptimeSeconds: 148200,
    isProxyLinked: true,
    startupCommand: 'java -Xms512M -Xmx1536M -XX:+UseG1GC -jar velocity.jar',
    javaVersion: '21',
    diskUsageBytes: 420 * 1024 * 1024,
    diskLimitBytes: 10 * 1024 * 1024 * 1024,
    variables: { FORWARDING_MODE: 'modern', QUERY_PORT: '25565' },
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-10-20T12:00:00Z',
  },
  {
    id: 'srv-paper-survival',
    name: 'Survival-SMP-1.21.4',
    description: 'Main Community Survival SMP with PaperMC 1.21.4 & GriefPrevention',
    node: 'US-East-Node-01',
    state: 'RUNNING',
    engine: 'paper',
    version: '1.21.4',
    port: 25566,
    ip: '10.0.4.12',
    currentPlayers: 28,
    maxPlayers: 100,
    memoryUsageBytes: 5240 * 1024 * 1024,
    memoryLimitBytes: 8192 * 1024 * 1024,
    cpuUsagePercent: 34.6,
    tps: 19.98,
    mspt: 31.2,
    uptimeSeconds: 84300,
    isProxyLinked: true,
    startupCommand: 'java -Xms4G -Xmx8G -XX:+UseG1GC -XX:G1HeapRegionSize=16M -jar paper-1.21.4.jar --nogui',
    javaVersion: '21',
    diskUsageBytes: 14200 * 1024 * 1024,
    diskLimitBytes: 50 * 1024 * 1024 * 1024,
    variables: { VIEW_DISTANCE: '12', SIMULATION_DISTANCE: '8' },
    createdAt: '2026-03-10T14:30:00Z',
    updatedAt: '2026-10-20T13:45:00Z',
  },
  {
    id: 'srv-fabric-tech',
    name: 'Fabric-Modded-Tech',
    description: 'Heavy Tech Modpack (Sodium, Create, TechReborn, SimpleVoice)',
    node: 'US-East-Node-02',
    state: 'RUNNING',
    engine: 'fabric',
    version: '1.21.4',
    port: 25567,
    ip: '10.0.4.13',
    currentPlayers: 14,
    maxPlayers: 50,
    memoryUsageBytes: 7120 * 1024 * 1024,
    memoryLimitBytes: 10240 * 1024 * 1024,
    cpuUsagePercent: 58.2,
    tps: 19.82,
    mspt: 44.8,
    uptimeSeconds: 42100,
    isProxyLinked: true,
    startupCommand: 'java -Xms6G -Xmx10G -XX:+UseZGC -jar fabric-server-launch.jar nogui',
    javaVersion: '21',
    diskUsageBytes: 9800 * 1024 * 1024,
    diskLimitBytes: 50 * 1024 * 1024 * 1024,
    variables: { FABRIC_LOADER_VERSION: '0.16.9' },
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-10-20T13:00:00Z',
  },
  {
    id: 'srv-minigames-hub',
    name: 'Purpur-Lobby-Hub',
    description: 'Custom spawn lobby with fast chunk rendering & parkour',
    node: 'US-East-Node-01',
    state: 'OFF',
    engine: 'purpur',
    version: '1.21.4',
    port: 25568,
    ip: '10.0.4.14',
    currentPlayers: 0,
    maxPlayers: 150,
    memoryUsageBytes: 0,
    memoryLimitBytes: 4096 * 1024 * 1024,
    cpuUsagePercent: 0,
    tps: 0,
    mspt: 0,
    uptimeSeconds: 0,
    isProxyLinked: true,
    startupCommand: 'java -Xms2G -Xmx4G -jar purpur.jar --nogui',
    javaVersion: '21',
    diskUsageBytes: 2400 * 1024 * 1024,
    diskLimitBytes: 20 * 1024 * 1024 * 1024,
    variables: {},
    createdAt: '2026-04-15T12:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
  },
];

// Telemetry & Console Event Emitter
type TelemetryListener = (frame: TelemetryFrame) => void;
type ConsoleListener = (msg: ConsoleLogMessage) => void;

const telemetryListeners = new Map<string, Set<TelemetryListener>>();
const consoleListeners = new Map<string, Set<ConsoleListener>>();
const consoleHistory = new Map<string, ConsoleLogMessage[]>();

// Initialize default logs for servers
mockServers.forEach((srv) => {
  const initLogs: ConsoleLogMessage[] = [
    {
      id: `${srv.id}-1`,
      serverId: srv.id,
      stream: 'stdout',
      data: `\x1b[36m[AetherNode]\x1b[0m Initializing container isolation for \x1b[32m${srv.name}\x1b[0m on ${srv.node}...`,
      timestamp: Date.now() - 3600000,
    },
    {
      id: `${srv.id}-2`,
      serverId: srv.id,
      stream: 'stdout',
      data: `\x1b[35m[AetherNode]\x1b[0m Allocated cgroup limits: Memory=${(srv.memoryLimitBytes / (1024*1024)).toFixed(0)}MB, Swap=0MB, CPU=400%`,
      timestamp: Date.now() - 3590000,
    },
    {
      id: `${srv.id}-3`,
      serverId: srv.id,
      stream: 'stdout',
      data: `[Server thread/INFO]: Loading Minecraft ${srv.version} (${srv.engine})`,
      timestamp: Date.now() - 3580000,
    },
    {
      id: `${srv.id}-4`,
      serverId: srv.id,
      stream: 'stdout',
      data: `[Server thread/INFO]: Preparing level "world" (seed: -789420194829)`,
      timestamp: Date.now() - 3570000,
    },
    {
      id: `${srv.id}-5`,
      serverId: srv.id,
      stream: 'stdout',
      data: `\x1b[32m[Server thread/INFO]: Done! Server started on 0.0.0.0:${srv.port} in 3.481s\x1b[0m`,
      timestamp: Date.now() - 3560000,
    },
    {
      id: `${srv.id}-6`,
      serverId: srv.id,
      stream: 'stdout',
      data: `[AetherNode Telemetry]: Health Check OK | TPS: ${srv.tps.toFixed(2)} | Online: ${srv.currentPlayers}/${srv.maxPlayers}`,
      timestamp: Date.now() - 60000,
    },
  ];
  consoleHistory.set(srv.id, initLogs);
});

// Broadcast periodic telemetry & log chatter
setInterval(() => {
  mockServers.forEach((srv) => {
    if (srv.state !== 'RUNNING') return;

    // Jitter metrics realistically
    const cpuJitter = (Math.random() - 0.5) * 4;
    srv.cpuUsagePercent = Math.max(2, Math.min(95, srv.cpuUsagePercent + cpuJitter));
    const tpsJitter = (Math.random() - 0.5) * 0.04;
    srv.tps = Math.max(18.5, Math.min(20.0, srv.tps + tpsJitter));
    srv.mspt = 1000 / (srv.tps * 1.6);

    const frame: TelemetryFrame = {
      serverId: srv.id,
      cpuUsagePercent: Number(srv.cpuUsagePercent.toFixed(1)),
      memoryUsageBytes: srv.memoryUsageBytes,
      memoryLimitBytes: srv.memoryLimitBytes,
      diskUsageBytes: srv.diskUsageBytes,
      tps: Number(srv.tps.toFixed(2)),
      mspt: Number(srv.mspt.toFixed(1)),
      onlinePlayers: srv.currentPlayers,
      maxPlayers: srv.maxPlayers,
      timestamp: Date.now(),
    };

    const listeners = telemetryListeners.get(srv.id);
    if (listeners) {
      listeners.forEach((fn) => fn(frame));
    }

    // Occasional realistic server chatter
    if (Math.random() < 0.25) {
      const messages = [
        `[Server thread/INFO]: Saved the world data in 14ms (chunks: 142)`,
        `[Server thread/INFO]: Player [VIP] SteveMine executed command: /spawn`,
        `[Server thread/INFO]: [Async Chat] <NeonArchitect> Anyone building near the coords 1200 -450?`,
        `[Server thread/INFO]: [AetherNode] Garbage Collector reclaimed 148MB heap space`,
        `[Server thread/INFO]: Player [Mod] DawnCrafter inspected chest at [324, 68, -120]`,
      ];
      const selected = messages[Math.floor(Math.random() * messages.length)];
      const logMsg: ConsoleLogMessage = {
        id: Math.random().toString(36).substring(7),
        serverId: srv.id,
        stream: 'stdout',
        data: selected,
        timestamp: Date.now(),
      };
      const hist = consoleHistory.get(srv.id) || [];
      hist.push(logMsg);
      if (hist.length > 500) hist.shift();
      consoleHistory.set(srv.id, hist);

      const cListeners = consoleListeners.get(srv.id);
      if (cListeners) {
        cListeners.forEach((fn) => fn(logMsg));
      }
    }
  });
}, 2000);

// Mock Addons Database (Modrinth & CurseForge)
const mockAddons: UnifiedAddon[] = [
  {
    id: 'voicechat',
    slug: 'simple-voice-chat',
    title: 'Simple Voice Chat',
    summary: 'A working proximity voice chat in Minecraft with group chats and 3D positional audio!',
    description: 'This mod adds a proximity voice chat to your Minecraft server. It requires UDP port 24454 to be opened.',
    iconUrl: 'https://cdn.modrinth.com/data/9eGKb6K1/icon.png',
    provider: 'modrinth',
    addonType: 'mod',
    totalDownloads: 42100000,
    updatedAt: '2025-02-27',
    author: 'henkelmax',
    compatibleLoaders: ['fabric', 'forge', 'neoforge', 'paper', 'purpur'],
    versions: [
      {
        versionId: 'svc-2.5.28',
        versionNumber: '2.5.28',
        gameVersions: ['1.21.4', '1.21.3'],
        loaders: ['fabric', 'forge', 'neoforge'],
        downloadUrl: 'https://cdn.modrinth.com/data/9eGKb6K1/versions/voicechat-fabric-1.21.4-2.5.28.jar',
        filename: 'voicechat-fabric-1.21.4-2.5.28.jar',
        fileSizeBytes: 4200000,
        releaseDate: '2025-02-27',
        hashes: { sha1: '8a7d329810f3918a9018e1082390812389102830' },
        dependencies: [
          { projectId: 'fabric-api', title: 'Fabric API', dependencyType: 'required', installed: false },
          { projectId: 'cloth-config', title: 'Cloth Config v15', dependencyType: 'required', installed: true },
        ],
      },
    ],
  },
  {
    id: 'ferrite-core',
    slug: 'ferrite-core',
    title: 'FerriteCore',
    summary: 'Memory usage optimizations for Minecraft reducing RAM footprint by up to 30%.',
    iconUrl: 'https://cdn.modrinth.com/data/uXXizFIs/icon.png',
    provider: 'modrinth',
    addonType: 'mod',
    totalDownloads: 28900000,
    updatedAt: '2025-01-15',
    author: 'malte0811',
    compatibleLoaders: ['fabric', 'forge', 'neoforge'],
    installedVersion: '6.1.1',
    versions: [
      {
        versionId: 'fc-6.1.1',
        versionNumber: '6.1.1',
        gameVersions: ['1.21.4', '1.21.3'],
        loaders: ['fabric', 'forge'],
        downloadUrl: 'https://cdn.modrinth.com/data/uXXizFIs/versions/ferritecore-6.1.1-fabric.jar',
        filename: 'ferritecore-6.1.1-fabric.jar',
        fileSizeBytes: 240000,
        releaseDate: '2025-01-15',
        hashes: { sha1: '1920830198230918230192830192830192830192' },
        dependencies: [],
      },
    ],
  },
  {
    id: 'sodium',
    slug: 'sodium',
    title: 'Sodium',
    summary: 'Modern shader-compatible rendering engine replacement for the Minecraft client & server lighting.',
    iconUrl: 'https://cdn.modrinth.com/data/AANobbMI/icon.png',
    provider: 'modrinth',
    addonType: 'mod',
    totalDownloads: 68400000,
    updatedAt: '2025-02-18',
    author: 'jellysquid3',
    compatibleLoaders: ['fabric', 'neoforge'],
    installedVersion: '0.6.4',
    versions: [
      {
        versionId: 'sod-0.6.4',
        versionNumber: '0.6.4',
        gameVersions: ['1.21.4'],
        loaders: ['fabric', 'neoforge'],
        downloadUrl: 'https://cdn.modrinth.com/data/AANobbMI/versions/sodium-fabric-0.6.4.jar',
        filename: 'sodium-fabric-0.6.4.jar',
        fileSizeBytes: 1800000,
        releaseDate: '2025-02-18',
        hashes: { sha1: '3819203810293810293810293810293810293810' },
        dependencies: [{ projectId: 'fabric-api', title: 'Fabric API', dependencyType: 'required', installed: false }],
      },
    ],
  },
  {
    id: 'lithium',
    slug: 'lithium',
    title: 'Lithium',
    summary: 'General-purpose physics, mob AI, chunk loading, and block ticking optimization mod.',
    iconUrl: 'https://cdn.modrinth.com/data/gvQqBUqZ/icon.png',
    provider: 'modrinth',
    addonType: 'mod',
    totalDownloads: 54100000,
    updatedAt: '2025-02-10',
    author: 'jellysquid3',
    compatibleLoaders: ['fabric', 'neoforge'],
    versions: [
      {
        versionId: 'lit-0.14.8',
        versionNumber: '0.14.8',
        gameVersions: ['1.21.4'],
        loaders: ['fabric', 'neoforge'],
        downloadUrl: 'https://cdn.modrinth.com/data/gvQqBUqZ/versions/lithium-fabric-0.14.8.jar',
        filename: 'lithium-fabric-0.14.8.jar',
        fileSizeBytes: 890000,
        releaseDate: '2025-02-10',
        hashes: { sha1: '9812039810293810293810293810293810293810' },
        dependencies: [{ projectId: 'fabric-api', title: 'Fabric API', dependencyType: 'required', installed: false }],
      },
    ],
  },
  {
    id: 'fabric-api',
    slug: 'fabric-api',
    title: 'Fabric API',
    summary: 'Essential core library for the Fabric mod ecosystem containing inter-mod hooks and events.',
    iconUrl: 'https://cdn.modrinth.com/data/P7dR8mSH/icon.png',
    provider: 'modrinth',
    addonType: 'mod',
    totalDownloads: 195000000,
    updatedAt: '2025-03-01',
    author: 'FabricMC',
    compatibleLoaders: ['fabric'],
    versions: [
      {
        versionId: 'fapi-0.115.0',
        versionNumber: '0.115.0',
        gameVersions: ['1.21.4'],
        loaders: ['fabric'],
        downloadUrl: 'https://cdn.modrinth.com/data/P7dR8mSH/versions/fabric-api-0.115.0.jar',
        filename: 'fabric-api-0.115.0.jar',
        fileSizeBytes: 3100000,
        releaseDate: '2025-03-01',
        hashes: { sha1: '7192038102938102938102938102938102938102' },
        dependencies: [],
      },
    ],
  },
  {
    id: 'worldedit',
    slug: 'worldedit',
    title: 'WorldEdit',
    summary: 'In-game Minecraft map editor allowing massive voxel manipulations, brushes, and schematics.',
    iconUrl: 'https://cdn.modrinth.com/data/1eAoo2KR/icon.png',
    provider: 'modrinth',
    addonType: 'plugin',
    totalDownloads: 38200000,
    updatedAt: '2025-01-20',
    author: 'EngineHub',
    compatibleLoaders: ['paper', 'purpur', 'spigot', 'fabric', 'forge'],
    installedVersion: '7.3.9',
    versions: [
      {
        versionId: 'we-7.3.9',
        versionNumber: '7.3.9',
        gameVersions: ['1.21.4', '1.21.3'],
        loaders: ['paper', 'purpur', 'spigot'],
        downloadUrl: 'https://cdn.modrinth.com/data/1eAoo2KR/versions/worldedit-bukkit-7.3.9.jar',
        filename: 'worldedit-bukkit-7.3.9.jar',
        fileSizeBytes: 6200000,
        releaseDate: '2025-01-20',
        hashes: { sha1: '2819203810293810293810293810293810293810' },
        dependencies: [],
      },
    ],
  },
  {
    id: 'luckperms',
    slug: 'luckperms',
    title: 'LuckPerms',
    summary: 'Industry standard permissions plugin featuring an ultra-fast web editor and node inheritance.',
    iconUrl: 'https://cdn.modrinth.com/data/Vebnzrzj/icon.png',
    provider: 'modrinth',
    addonType: 'plugin',
    totalDownloads: 48900000,
    updatedAt: '2025-02-14',
    author: 'Luck',
    compatibleLoaders: ['paper', 'purpur', 'spigot', 'velocity', 'fabric'],
    installedVersion: '5.4.142',
    versions: [
      {
        versionId: 'lp-5.4.142',
        versionNumber: '5.4.142',
        gameVersions: ['1.21.4', '1.20.4'],
        loaders: ['paper', 'purpur', 'velocity'],
        downloadUrl: 'https://cdn.modrinth.com/data/Vebnzrzj/versions/LuckPerms-Bukkit-5.4.142.jar',
        filename: 'LuckPerms-Bukkit-5.4.142.jar',
        fileSizeBytes: 2100000,
        releaseDate: '2025-02-14',
        hashes: { sha1: '4819203810293810293810293810293810293810' },
        dependencies: [],
      },
    ],
  },
  {
    id: 'fabulously-optimized',
    slug: 'fabulously-optimized',
    title: 'Fabulously Optimized',
    summary: 'Comprehensive performance & graphics optimization modpack preset rivaling OptiFine.',
    iconUrl: 'https://cdn.modrinth.com/data/1KVo5EdV/icon.png',
    provider: 'modrinth',
    addonType: 'preset',
    totalDownloads: 14200000,
    updatedAt: '2025-02-26',
    author: 'RobotKoer',
    compatibleLoaders: ['fabric'],
    versions: [
      {
        versionId: 'fo-5.11.0',
        versionNumber: '5.11.0',
        gameVersions: ['1.21.4'],
        loaders: ['fabric'],
        downloadUrl: 'https://cdn.modrinth.com/data/1KVo5EdV/versions/FO-5.11.0.mrpack',
        filename: 'Fabulously-Optimized-5.11.0.mrpack',
        fileSizeBytes: 18400000,
        releaseDate: '2025-02-26',
        hashes: { sha1: '5819203810293810293810293810293810293810' },
        dependencies: [],
      },
    ],
  },
];

// Mock Players Database
let mockPlayers: PlayerData[] = [
  {
    uuid: 'c06f8906-4c8a-4911-9c29-ea1dbd1aab82',
    username: 'NeonArchitect',
    avatarUrl: 'https://mc-heads.net/avatar/c06f8906-4c8a-4911-9c29-ea1dbd1aab82/64',
    pingMs: 18,
    health: 20,
    maxHealth: 20,
    foodLevel: 20,
    xpLevel: 64,
    dimension: 'minecraft:overworld',
    position: [128.4, 72.0, -420.8],
    isOp: true,
    isWhitelisted: true,
    inventory: [
      { slot: 0, id: 'minecraft:netherite_sword', displayName: 'Void Reaver', count: 1, damage: 120, maxDamage: 2031, enchantments: [{ id: 'Sharpness', level: 5 }, { id: 'Mending', level: 1 }] },
      { slot: 1, id: 'minecraft:netherite_pickaxe', displayName: 'Star Drill', count: 1, damage: 45, maxDamage: 2031, enchantments: [{ id: 'Efficiency', level: 5 }, { id: 'Fortune', level: 3 }] },
      { slot: 2, id: 'minecraft:golden_apple', displayName: 'Golden Apple', count: 64 },
      { slot: 3, id: 'minecraft:cooked_beef', displayName: 'Steak', count: 48 },
      { slot: 4, id: 'minecraft:firework_rocket', displayName: 'Flight Duration 3', count: 64 },
      { slot: 5, id: 'minecraft:ender_pearl', displayName: 'Ender Pearl', count: 16 },
      { slot: 6, id: 'minecraft:water_bucket', displayName: 'Water Bucket', count: 1 },
      { slot: 7, id: 'minecraft:totem_of_undying', displayName: 'Totem of Undying', count: 1 },
      { slot: 8, id: 'minecraft:obsidian', displayName: 'Crying Obsidian', count: 32 },
      { slot: 100, id: 'minecraft:netherite_helmet', displayName: 'Obsidian Crown', count: 1, damage: 14, maxDamage: 407, enchantments: [{ id: 'Protection', level: 4 }] },
      { slot: 101, id: 'minecraft:elytra', displayName: 'Wings of Dawn', count: 1, damage: 84, maxDamage: 432, enchantments: [{ id: 'Unbreaking', level: 3 }] },
      { slot: 102, id: 'minecraft:netherite_leggings', displayName: 'Void Greaves', count: 1, damage: 18, maxDamage: 555, enchantments: [{ id: 'Protection', level: 4 }] },
      { slot: 103, id: 'minecraft:netherite_boots', displayName: 'Grav-Boots', count: 1, damage: 12, maxDamage: 481, enchantments: [{ id: 'Feather Falling', level: 4 }] },
      { slot: -106, id: 'minecraft:shield', displayName: 'Aether Aegis', count: 1, damage: 0, maxDamage: 336 },
    ],
    enderChest: [
      { slot: 0, id: 'minecraft:shulker_box', displayName: 'Building Materials (White)', count: 1 },
      { slot: 1, id: 'minecraft:netherite_ingot', displayName: 'Netherite Ingot', count: 18 },
      { slot: 2, id: 'minecraft:diamond_block', displayName: 'Diamond Block', count: 32 },
      { slot: 3, id: 'minecraft:beacon', displayName: 'Nether Beacon', count: 4 },
    ],
  },
  {
    uuid: '853c80ef-3c37-49fd-aa49-938b674adae6',
    username: 'SteveMine',
    avatarUrl: 'https://mc-heads.net/avatar/853c80ef-3c37-49fd-aa49-938b674adae6/64',
    pingMs: 44,
    health: 16,
    maxHealth: 20,
    foodLevel: 14,
    xpLevel: 28,
    dimension: 'minecraft:overworld',
    position: [42.0, 64.0, 18.2],
    isOp: false,
    isWhitelisted: true,
    inventory: [
      { slot: 0, id: 'minecraft:diamond_sword', displayName: 'Diamond Sword', count: 1 },
      { slot: 1, id: 'minecraft:iron_pickaxe', displayName: 'Iron Pickaxe', count: 1 },
      { slot: 2, id: 'minecraft:bread', displayName: 'Bread', count: 24 },
    ],
    enderChest: [],
  },
  {
    uuid: '8a5f08ec-a34f-4d37-8b09-3221b2123456',
    username: 'DawnCrafter',
    avatarUrl: 'https://mc-heads.net/avatar/8a5f08ec-a34f-4d37-8b09-3221b2123456/64',
    pingMs: 29,
    health: 20,
    maxHealth: 20,
    foodLevel: 19,
    xpLevel: 45,
    dimension: 'minecraft:the_nether',
    position: [-140.2, 54.0, 89.1],
    isOp: false,
    isWhitelisted: true,
    inventory: [
      { slot: 0, id: 'minecraft:bow', displayName: 'Flame Bow', count: 1 },
      { slot: 1, id: 'minecraft:arrow', displayName: 'Arrow', count: 64 },
    ],
    enderChest: [],
  },
];

// Mock File System
const mockFiles: Record<string, string> = {
  '/server.properties': `# AetherNode Minecraft Server Properties
# Synchronized with Node Isolation Engine
server-port=25566
motd=\\u00A7bAetherNode \\u00A78| \\u00A77Obsidian & Neon Cluster \\u00A7a[1.21.4]
max-players=100
online-mode=true
view-distance=12
simulation-distance=8
enable-rcon=true
rcon.port=25575
rcon.password=aethernode_secure_ipc_secret
white-list=true
spawn-protection=0
difficulty=hard
gamemode=survival
network-compression-threshold=256
`,
  '/config/paper-global.yml': `# Paper Global Configuration File
# Managed by AetherNode
proxies:
  velocity:
    enabled: true
    online-mode: true
    secret: "3f8a9b210c4d8e7f123456789abcdef0123456789abcdef0123456789abcdef0"
timings:
  enabled: true
  verbose: false
chunk-loading:
  min-load-radius: 2
  max-concurrent-loads: 10
`,
  '/velocity.toml': `# Velocity Proxy Configuration
bind = "0.0.0.0:25565"
motd = "\\u00A7b\\u00A7lAetherNode Network \\u00A78\\u00BB \\u00A7fNext-Gen Minecraft Infrastructure"
show-max-players = 500
online-mode = true
force-key-authentication = true
player-info-forwarding-mode = "modern"
forwarding-secret-file = "forwarding.secret"

[servers]
lobby = "10.0.4.14:25568"
survival = "10.0.4.12:25566"
fabric = "10.0.4.13:25567"

[forced-hosts]
"survival.aethernode.net" = ["survival"]
"tech.aethernode.net" = ["fabric"]
`,
  '/logs/latest.log': `[13:40:12 INFO]: Loaded 72 recipes
[13:40:15 INFO]: [AetherNode] Telemetry handshake verified on UDP port 25566
[13:40:22 INFO]: SteveMine logged in with entity id 429 at ([world]42.0, 64.0, 18.2)
[13:40:48 INFO]: NeonArchitect issued server command: /tps
[13:40:48 INFO]: TPS from last 1m, 5m, 15m: 20.0, 20.0, 19.98
[13:41:00 INFO]: Auto-saving world chunks to disk... (Completed in 12ms)
`,
};

// Mock Schematics
let mockSchematics: SchematicItem[] = [
  {
    id: 'schem-1',
    name: 'Cyberpunk_Spawn_Lobby',
    filename: 'Cyberpunk_Spawn_Lobby.schem',
    path: '/plugins/FastAsyncWorldEdit/schematics/Cyberpunk_Spawn_Lobby.schem',
    format: 'Sponge (.schem)',
    dimensions: { x: 128, y: 74, z: 128 },
    totalBlocks: 482100,
    paletteCount: 42,
    dominantBlocks: [
      { block: 'minecraft:cyan_concrete', percentage: 34.2 },
      { block: 'minecraft:black_concrete', percentage: 28.5 },
      { block: 'minecraft:sea_lantern', percentage: 14.1 },
      { block: 'minecraft:tinted_glass', percentage: 8.4 },
    ],
    fileSizeBytes: 1420000,
    createdAt: '2026-02-14T10:00:00Z',
  },
  {
    id: 'schem-2',
    name: 'Nether_Portal_Monolith',
    filename: 'Nether_Portal_Monolith.schem',
    path: '/plugins/FastAsyncWorldEdit/schematics/Nether_Portal_Monolith.schem',
    format: 'Sponge (.schem)',
    dimensions: { x: 32, y: 48, z: 32 },
    totalBlocks: 28400,
    paletteCount: 16,
    dominantBlocks: [
      { block: 'minecraft:crying_obsidian', percentage: 46.0 },
      { block: 'minecraft:obsidian', percentage: 32.1 },
      { block: 'minecraft:shroomlight', percentage: 12.4 },
    ],
    fileSizeBytes: 240000,
    createdAt: '2026-03-01T15:20:00Z',
  },
];

// SERVICE IMPLEMENTATIONS
export class MockServerService implements IServerService {
  async getServers(): Promise<ServerSummary[]> {
    return mockServers.map((s) => ({ ...s }));
  }

  async getServerById(id: string): Promise<ServerDetail> {
    const srv = mockServers.find((s) => s.id === id);
    if (!srv) throw new Error(`Server with id ${id} not found`);
    return { ...srv };
  }

  async createServer(payload: Partial<ServerDetail>): Promise<ServerDetail> {
    const newServer: ServerDetail = {
      id: `srv-${Math.random().toString(36).substring(7)}`,
      name: payload.name || 'New-Minecraft-Server',
      description: payload.description || 'Configured via AetherNode Management Engine',
      node: payload.node || 'US-East-Node-01',
      state: 'OFF',
      engine: payload.engine || 'paper',
      version: payload.version || '1.21.4',
      port: payload.port || 25570,
      ip: '10.0.4.15',
      currentPlayers: 0,
      maxPlayers: payload.maxPlayers || 50,
      memoryUsageBytes: 0,
      memoryLimitBytes: payload.memoryLimitBytes || 4096 * 1024 * 1024,
      cpuUsagePercent: 0,
      tps: 0,
      mspt: 0,
      uptimeSeconds: 0,
      startupCommand: 'java -Xms2G -Xmx4G -jar server.jar --nogui',
      javaVersion: payload.javaVersion || '21',
      diskUsageBytes: 480 * 1024 * 1024,
      diskLimitBytes: 20 * 1024 * 1024 * 1024,
      variables: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockServers.push(newServer);
    return newServer;
  }

  async updateServer(id: string, payload: Partial<ServerDetail>): Promise<ServerDetail> {
    const idx = mockServers.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Server ${id} not found`);
    mockServers[idx] = { ...mockServers[idx], ...payload, updatedAt: new Date().toISOString() };
    return { ...mockServers[idx] };
  }

  async deleteServer(id: string): Promise<void> {
    mockServers = mockServers.filter((s) => s.id !== id);
  }

  async sendPowerAction(id: string, action: PowerAction): Promise<void> {
    const srv = mockServers.find((s) => s.id === id);
    if (!srv) return;

    if (action === 'start') {
      srv.state = 'STARTING';
      setTimeout(() => {
        srv.state = 'RUNNING';
        srv.tps = 20.0;
        srv.mspt = 22.0;
        srv.memoryUsageBytes = srv.memoryLimitBytes * 0.45;
        srv.cpuUsagePercent = 25.0;
      }, 2500);
    } else if (action === 'stop') {
      srv.state = 'STOPPING';
      setTimeout(() => {
        srv.state = 'OFF';
        srv.tps = 0;
        srv.mspt = 0;
        srv.memoryUsageBytes = 0;
        srv.cpuUsagePercent = 0;
        srv.currentPlayers = 0;
      }, 2000);
    } else if (action === 'kill') {
      srv.state = 'OFF';
      srv.tps = 0;
      srv.mspt = 0;
      srv.memoryUsageBytes = 0;
      srv.cpuUsagePercent = 0;
      srv.currentPlayers = 0;
    } else if (action === 'restart') {
      srv.state = 'STOPPING';
      setTimeout(() => {
        srv.state = 'STARTING';
        setTimeout(() => {
          srv.state = 'RUNNING';
          srv.tps = 20.0;
          srv.mspt = 25.0;
          srv.memoryUsageBytes = srv.memoryLimitBytes * 0.48;
        }, 2000);
      }, 1500);
    }
  }
}

export class MockTelemetryService implements ITelemetryService {
  subscribeTelemetry(serverId: string, callback: (frame: TelemetryFrame) => void): () => void {
    if (!telemetryListeners.has(serverId)) {
      telemetryListeners.set(serverId, new Set());
    }
    telemetryListeners.get(serverId)!.add(callback);
    return () => {
      telemetryListeners.get(serverId)?.delete(callback);
    };
  }

  subscribeConsole(serverId: string, callback: (msg: ConsoleLogMessage) => void): () => void {
    if (!consoleListeners.has(serverId)) {
      consoleListeners.set(serverId, new Set());
    }
    consoleListeners.get(serverId)!.add(callback);
    return () => {
      consoleListeners.get(serverId)?.delete(callback);
    };
  }

  async sendCommand(serverId: string, command: string): Promise<void> {
    const inputMsg: ConsoleLogMessage = {
      id: Math.random().toString(36).substring(7),
      serverId,
      stream: 'stdout',
      data: `\x1b[33m> ${command}\x1b[0m`,
      timestamp: Date.now(),
    };
    const cListeners = consoleListeners.get(serverId);
    if (cListeners) cListeners.forEach((fn) => fn(inputMsg));

    // Handle realistic command replies
    setTimeout(() => {
      let reply = `[Server thread/INFO]: Executed command: ${command}`;
      const lower = command.toLowerCase().trim();
      if (lower === 'tps') {
        reply = `\x1b[32m[Server thread/INFO]: TPS from last 1m, 5m, 15m: 20.0, 20.0, 19.98 | MSPT: 28.4ms\x1b[0m`;
      } else if (lower === 'list') {
        reply = `[Server thread/INFO]: There are 3 of a max 100 players online: NeonArchitect, SteveMine, DawnCrafter`;
      } else if (lower.startsWith('say ')) {
        reply = `\x1b[35m[Server: Broadcast] ${command.substring(4)}\x1b[0m`;
      } else if (lower.startsWith('time set ')) {
        reply = `[Server thread/INFO]: Set the time to ${command.substring(9)}`;
      } else if (lower === 'help') {
        reply = `[Server thread/INFO]: Available: /tps, /list, /say <msg>, /time set <day|night>, /op <player>, /whitelist <add|remove>`;
      }

      const replyMsg: ConsoleLogMessage = {
        id: Math.random().toString(36).substring(7),
        serverId,
        stream: 'stdout',
        data: reply,
        timestamp: Date.now(),
      };
      if (cListeners) cListeners.forEach((fn) => fn(replyMsg));
    }, 250);
  }

  async getInitialLogs(serverId: string, _limit = 50): Promise<ConsoleLogMessage[]> {
    return consoleHistory.get(serverId) || [];
  }
}

export class MockAddonService implements IAddonService {
  async searchAddons(query: {
    search?: string;
    type?: AddonType;
    loader?: ModLoader;
    gameVersion?: string;
    provider?: 'all' | 'modrinth' | 'curseforge';
  }): Promise<UnifiedAddon[]> {
    let result = [...mockAddons];

    if (query.type) {
      result = result.filter((a) => a.addonType === query.type);
    }
    if (query.loader && query.loader !== 'vanilla') {
      result = result.filter((a) => a.compatibleLoaders.includes(query.loader!));
    }
    if (query.provider && query.provider !== 'all') {
      result = result.filter((a) => a.provider === query.provider);
    }
    if (query.search && query.search.trim().length > 0) {
      const q = query.search.toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.slug.includes(q));
    }

    return result;
  }

  async installAddon(serverId: string, addonId: string, versionId: string, _includeDependencies = true): Promise<{ success: boolean; installedFiles: string[] }> {
    const addon = mockAddons.find((a) => a.id === addonId || a.slug === addonId);
    if (!addon) throw new Error(`Addon ${addonId} not found`);

    const version = addon.versions.find((v) => v.versionId === versionId) || addon.versions[0];
    addon.installedVersion = version.versionNumber;

    const files = [version.filename];
    if (version.dependencies) {
      version.dependencies.forEach((dep) => {
        dep.installed = true;
        files.push(`${dep.projectId}-latest.jar`);
      });
    }

    // Log to console
    const cListeners = consoleListeners.get(serverId);
    if (cListeners) {
      cListeners.forEach((fn) =>
        fn({
          id: Math.random().toString(36).substring(7),
          serverId,
          stream: 'stdout',
          data: `\x1b[36m[AetherNode Addon Engine]\x1b[0m Successfully downloaded and placed \x1b[32m${files.join(', ')}\x1b[0m`,
          timestamp: Date.now(),
        })
      );
    }

    return { success: true, installedFiles: files };
  }

  async uninstallAddon(serverId: string, filename: string): Promise<void> {
    const addon = mockAddons.find((a) => a.versions.some((v) => v.filename === filename));
    if (addon) {
      addon.installedVersion = undefined;
    }
    const cListeners = consoleListeners.get(serverId);
    if (cListeners) {
      cListeners.forEach((fn) =>
        fn({
          id: Math.random().toString(36).substring(7),
          serverId,
          stream: 'stdout',
          data: `\x1b[33m[AetherNode Addon Engine]\x1b[0m Removed file ${filename}`,
          timestamp: Date.now(),
        })
      );
    }
  }

  async getInstalledAddons(_serverId: string): Promise<string[]> {
    return mockAddons.filter((a) => a.installedVersion).map((a) => a.title);
  }
}

export class MockPlayerService implements IPlayerService {
  async getOnlinePlayers(_serverId: string): Promise<PlayerData[]> {
    return [...mockPlayers];
  }

  async getPlayerInventory(_serverId: string, uuid: string): Promise<PlayerData> {
    const p = mockPlayers.find((player) => player.uuid === uuid);
    if (!p) throw new Error(`Player ${uuid} not found`);
    return JSON.parse(JSON.stringify(p));
  }

  async kickPlayer(serverId: string, uuid: string, reason = 'Kicked by administrator'): Promise<void> {
    const p = mockPlayers.find((pl) => pl.uuid === uuid);
    mockPlayers = mockPlayers.filter((pl) => pl.uuid !== uuid);
    const cListeners = consoleListeners.get(serverId);
    if (cListeners && p) {
      cListeners.forEach((fn) =>
        fn({
          id: Math.random().toString(36).substring(7),
          serverId,
          stream: 'stdout',
          data: `\x1b[31m[Server thread/INFO]: Kicking ${p.username}: ${reason}\x1b[0m`,
          timestamp: Date.now(),
        })
      );
    }
  }

  async banPlayer(serverId: string, uuid: string, reason = 'Banned by operator'): Promise<void> {
    const p = mockPlayers.find((pl) => pl.uuid === uuid);
    mockPlayers = mockPlayers.filter((pl) => pl.uuid !== uuid);
    const cListeners = consoleListeners.get(serverId);
    if (cListeners && p) {
      cListeners.forEach((fn) =>
        fn({
          id: Math.random().toString(36).substring(7),
          serverId,
          stream: 'stdout',
          data: `\x1b[31m[Server thread/INFO]: Banned player ${p.username}: ${reason}\x1b[0m`,
          timestamp: Date.now(),
        })
      );
    }
  }

  async toggleOp(serverId: string, uuid: string): Promise<boolean> {
    const p = mockPlayers.find((pl) => pl.uuid === uuid);
    if (!p) return false;
    p.isOp = !p.isOp;
    const cListeners = consoleListeners.get(serverId);
    if (cListeners) {
      cListeners.forEach((fn) =>
        fn({
          id: Math.random().toString(36).substring(7),
          serverId,
          stream: 'stdout',
          data: `[Server thread/INFO]: ${p.isOp ? 'Opped' : 'De-opped'} player ${p.username}`,
          timestamp: Date.now(),
        })
      );
    }
    return p.isOp;
  }

  async teleportPlayer(_serverId: string, uuid: string, targetCoords: [number, number, number]): Promise<void> {
    const p = mockPlayers.find((pl) => pl.uuid === uuid);
    if (p) p.position = targetCoords;
  }

  async updateInventorySlot(_serverId: string, uuid: string, slotIndex: number, count: number): Promise<void> {
    const p = mockPlayers.find((pl) => pl.uuid === uuid);
    if (!p) return;
    const slot = p.inventory.find((s) => s.slot === slotIndex);
    if (slot) {
      slot.count = count;
    }
  }
}

export class MockFileService implements IFileService {
  async listFiles(_serverId: string, directoryPath: string): Promise<FileItem[]> {
    const items: FileItem[] = [];

    // Root directory
    if (directoryPath === '' || directoryPath === '/') {
      items.push(
        { name: 'config', path: '/config', isDirectory: true, sizeBytes: 4096, modifiedAt: '2026-10-20 12:00' },
        { name: 'mods', path: '/mods', isDirectory: true, sizeBytes: 12288, modifiedAt: '2026-10-20 13:00' },
        { name: 'plugins', path: '/plugins', isDirectory: true, sizeBytes: 8192, modifiedAt: '2026-10-20 11:30' },
        { name: 'logs', path: '/logs', isDirectory: true, sizeBytes: 4096, modifiedAt: '2026-10-20 13:40' },
        { name: 'world', path: '/world', isDirectory: true, sizeBytes: 32768, modifiedAt: '2026-10-20 13:41' },
        { name: 'server.properties', path: '/server.properties', isDirectory: false, sizeBytes: 840, modifiedAt: '2026-10-20 12:15', extension: 'properties' },
        { name: 'velocity.toml', path: '/velocity.toml', isDirectory: false, sizeBytes: 1240, modifiedAt: '2026-10-20 10:00', extension: 'toml' }
      );
    } else if (directoryPath.includes('config')) {
      items.push({
        name: 'paper-global.yml',
        path: '/config/paper-global.yml',
        isDirectory: false,
        sizeBytes: 1480,
        modifiedAt: '2026-10-20 12:00',
        extension: 'yml',
      });
    } else if (directoryPath.includes('logs')) {
      items.push({
        name: 'latest.log',
        path: '/logs/latest.log',
        isDirectory: false,
        sizeBytes: 34200,
        modifiedAt: '2026-10-20 13:41',
        extension: 'log',
      });
    }

    return items;
  }

  async readFile(_serverId: string, filePath: string): Promise<string> {
    return mockFiles[filePath] || `# File content for ${filePath}\n# Created by AetherNode`;
  }

  async writeFile(_serverId: string, filePath: string, content: string): Promise<void> {
    mockFiles[filePath] = content;
  }

  async deleteFile(_serverId: string, filePath: string): Promise<void> {
    delete mockFiles[filePath];
  }

  async createDirectory(_serverId: string, _directoryPath: string): Promise<void> {}
}

export class MockVelocityService implements IVelocityService {
  async getNetworkConfig(): Promise<VelocityNetworkConfig> {
    return {
      proxyServerId: 'srv-velocity',
      proxyName: 'Velocity-Master-Proxy',
      forwardingMode: 'modern',
      forwardingSecret: '3f8a9b210c4d8e7f123456789abcdef0123456789abcdef0123456789abcdef0',
      bindPort: 25565,
      backendServers: [
        {
          serverId: 'srv-minigames-hub',
          serverName: 'Purpur-Lobby-Hub',
          internalAddress: '10.0.4.14',
          internalPort: 25568,
          isOnline: false,
          playerCount: 0,
          isDefaultLobby: true,
          isFallBack: true,
        },
        {
          serverId: 'srv-paper-survival',
          serverName: 'Survival-SMP-1.21.4',
          internalAddress: '10.0.4.12',
          internalPort: 25566,
          isOnline: true,
          playerCount: 28,
          isDefaultLobby: false,
          isFallBack: false,
        },
        {
          serverId: 'srv-fabric-tech',
          serverName: 'Fabric-Modded-Tech',
          internalAddress: '10.0.4.13',
          internalPort: 25567,
          isOnline: true,
          playerCount: 14,
          isDefaultLobby: false,
          isFallBack: false,
        },
      ],
    };
  }

  async updateNetworkConfig(config: VelocityNetworkConfig): Promise<VelocityNetworkConfig> {
    return config;
  }

  async generateForwardingSecret(): Promise<string> {
    const chars = '0123456789abcdef';
    let secret = '';
    for (let i = 0; i < 64; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  }

  async syncBackendSecret(_backendServerId: string, _secret: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Successfully injected modern forwarding HMAC secret into paper-global.yml and synchronized firewall boundaries.',
    };
  }

  async sendPlayerToServer(_playerUuid: string, _targetServerId: string): Promise<{ success: boolean }> {
    return { success: true };
  }
}

export class MockSchematicService implements ISchematicService {
  async listSchematics(_serverId: string): Promise<SchematicItem[]> {
    return [...mockSchematics];
  }

  async uploadSchematic(_serverId: string, file: File): Promise<SchematicItem> {
    const newItem: SchematicItem = {
      id: `schem-${Math.random().toString(36).substring(7)}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      filename: file.name,
      path: `/plugins/FastAsyncWorldEdit/schematics/${file.name}`,
      format: file.name.endsWith('.schem') ? 'Sponge (.schem)' : 'Legacy (.schematic)',
      dimensions: { x: 64, y: 32, z: 64 },
      totalBlocks: 65536,
      paletteCount: 24,
      dominantBlocks: [
        { block: 'minecraft:stone_bricks', percentage: 52.0 },
        { block: 'minecraft:oak_planks', percentage: 28.0 },
        { block: 'minecraft:glass', percentage: 12.0 },
      ],
      fileSizeBytes: file.size || 120000,
      createdAt: new Date().toISOString(),
    };
    mockSchematics.push(newItem);
    return newItem;
  }

  async deleteSchematic(_serverId: string, schematicId: string): Promise<void> {
    mockSchematics = mockSchematics.filter((s) => s.id !== schematicId);
  }
}

// Master Service Provider Singletons
export const serverService = new MockServerService();
export const telemetryService = new MockTelemetryService();
export const addonService = new MockAddonService();
export const playerService = new MockPlayerService();
export const fileService = new MockFileService();
export const velocityService = new MockVelocityService();
export const schematicService = new MockSchematicService();
