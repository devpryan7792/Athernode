# AETHERNODE: ARCHITECTURAL SPECIFICATION & SUBSYSTEM CONTRACTS

**Document Version:** 1.0.0-PROD-SPEC  
**Classification:** Engineering Specification / System Blueprint  
**System Target:** High-Performance Distributed Minecraft Server & Network Management Architecture  

---

## CHAPTER 1: SYSTEM TOPOLOGY & DESIGN INVARIANTS

### 1.1 Architectural Axioms
AetherNode decouples the presentation plane from the process isolation plane. The frontend operates as a decoupled, deterministic client against a strongly typed API and binary WebSocket multiplexer. The system guarantees five architectural invariants:

1. **Isolation Invariant**: Every game server process executes inside an unprivileged OCI container governed by Linux `cgroup v2`. No container process shall possess root host execution or unmapped host filesystem access.
2. **Terminal Non-Blocking Invariant**: stdout/stderr streaming from server instances must flow through an asynchronous ring-buffer kernel. Unread stdout data on the client must exert zero backpressure onto the child process execution loop.
3. **Save-State Atomicity Invariant**: Mutating player inventory, server properties, or world state while a Minecraft process is active must synchronize through the Minecraft main thread (RCON or companion agent). Offline disk alterations must acquire exclusive process locks, write to a staged temporary file (`.dat.tmp`), execute `fsync`, and atomically swap via atomic rename.
4. **Deterministic Addon Invariant**: Every mod or plugin installation must resolve transitive dependencies matching both `MinecraftVersion` and `ModLoader` before writing to disk. Installation of conflicting `.jar` versions must execute atomic replacement.
5. **Zero-Fluff Aesthetic Invariant**: The visual presentation adheres to the Obsidian & Neon design language (WiseHosting + Dawn Client), prioritizing information density, low input latency (< 16ms interaction-to-render), and high contrast without superfluous decorative bloat.

```
+--------------------------------------------------------------------------------------------------------+
|                                      AETHERNODE ARCHITECTURE OVERVIEW                                  |
+--------------------------------------------------------------------------------------------------------+
|  PRESENTATION PLANE (Frontend)                                                                         |
|  React 19 + TypeScript + Vite | Tailwind CSS (Custom Obsidian Tokens) | Zustand | TanStack Query       |
|  [Bento Dashboard] [xterm.js Console] [Addon Market] [Inventory HUD] [Velocity Canvas] [Monaco Editor] |
+------------------------------------+------------------------------------+------------------------------+
                                     |                                    |
                    REST APIs (HTTP/2 JSON)                     Multiplexed WebSockets (Binary / WS-RPC)
                                     |                                    |
+------------------------------------+------------------------------------+------------------------------+
|  APPLICATION & ORCHESTRATION PLANE (Backend Core / API Gateway)                                        |
|  Node.js (Fastify) or Go (Gin/Fiber) | Postgres / SQLite (WAL) | JWT Auth & RBAC | Addon Resolver Cache |
+------------------------------------+------------------------------------+------------------------------+
                                     | gRPC / Encrypted Daemon Sockets
                                     v
+--------------------------------------------------------------------------------------------------------+
|  NODE EXECUTION PLANE (AetherNode Daemon / Wings-Compatible Engine)                                    |
|  Docker OCI Engine | cgroups v2 Limits | PTY Allocation (node-pty) | Ring-Buffered Stdout/Stderr        |
|  +---------------------------+  +---------------------------+  +------------------------------------+  |
|  | Container: Velocity Proxy |  | Container: Paper Survival |  | Container: Fabric Modded           |  |
|  | Port 25565 (Gateway)      |  | Port 25566 (Backend)      |  | Port 25567 (Backend)               |  |
|  +---------------------------+  +---------------------------+  +------------------------------------+  |
+--------------------------------------------------------------------------------------------------------+
```

---

## CHAPTER 2: FRONTEND CLIENT ARCHITECTURE

### 2.1 Technology Stack & Toolchain
- **Runtime & Build Engine**: React 19, TypeScript 5.5+, Vite 5 (Fast Refresh, ESBuild native bundling).
- **Styling Architecture**: Tailwind CSS 3.4+ configured with custom obsidian color matrices, CSS Grid / Flexbox primitives, zero runtime CSS-in-JS overhead.
- **State Partitioning Strategy**:
  - *Server State*: TanStack Query v5 (stale-while-revalidate, automatic retry with exponential backoff, structural sharing for memory stability).
  - *Client/UI State*: Zustand (atomic selectors, zero unnecessary re-renders, local storage sync for terminal filters and view preferences).
  - *Real-time Streaming*: Custom WebSocket multiplexer hook using typed protocol frames and frame decoders.
- **Editor & Terminal Drivers**:
  - Terminal: `xterm` 5.x + `xterm-addon-fit` + `xterm-addon-web-links` + `xterm-addon-search` + Canvas/WebGL renderer.
  - File Editing: `@monaco-editor/react` (VS Code engine) with registered language definitions for `.properties`, `.yaml`, `.toml`, and `.json`.
- **Component Virtualization**: `@tanstack/react-virtual` for file listings with > 10,000 items and mod search results.

### 2.2 Dual-Mode API Abstraction Layer
The frontend implements a strict interface-based repository pattern. All components consume services defined via TypeScript interfaces (`IServerService`, `ITelemetryService`, `IAddonService`, `IFileSystemService`).

```typescript
export interface IServerService {
  getServers(): Promise<ServerSummary[]>;
  getServerById(id: string): Promise<ServerDetail>;
  createServer(payload: CreateServerRequest): Promise<ServerDetail>;
  updateServer(id: string, payload: UpdateServerRequest): Promise<ServerDetail>;
  deleteServer(id: string): Promise<void>;
  sendPowerAction(id: string, action: PowerAction): Promise<void>;
}
```

- **Mock Implementation (`MockServerService`)**: Powered by an in-memory reactive state bus. Simulates server lifecycle transitions, logs, metrics, and file systems. Allows complete standalone development and testing without spinning up Docker or Go backends.
- **Production Implementation (`HttpServerService`)**: Direct HTTP/2 and WebSocket transport to the real backend. Activated via `VITE_USE_MOCKS=false`.

---

## CHAPTER 3: UI/UX DESIGN SYSTEM (OBSIDIAN & NEON)

### 3.1 Design Tokens (Tailwind Configuration)
```javascript
// tailwind.config.js - Obsidian & Neon Semantic Tokens
module.exports = {
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#05070A', // Deepest background
          900: '#080A0F', // Main canvas surface
          850: '#0D111A', // Secondary panel background
          800: '#111622', // Card container
          700: '#182030', // Elevated interactive surface
          600: '#232D42', // Border base
          500: '#323F5C', // Border highlight
        },
        neon: {
          cyan: '#00F2FE',     // Primary accent / Active states
          sky: '#38BDF8',      // Secondary interactive
          emerald: '#10B981',  // Running / Healthy TPS / 20.0
          amber: '#F59E0B',    // Warning / Degraded performance
          crimson: '#EF4444',  // Crash / Destructive actions
          violet: '#8B5CF6',   // Velocity Network / Schematics
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px -5px rgba(0, 242, 254, 0.3)',
        'neon-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'neon-crimson': '0 0 20px -5px rgba(239, 68, 68, 0.3)',
        'neon-violet': '0 0 20px -5px rgba(139, 92, 246, 0.3)',
      }
    }
  }
};
```

### 3.2 Key Screen Specifications
1. **Global Navigation & Network Health Bar**:
   - Fixed header containing node cluster status, aggregate memory/CPU footprint, active Velocity proxy selector, and user session badge.
2. **Server Detail Bento Grid**:
   - `Hero Console Tile`: 60% viewport width, live ANSI terminal with full screen toggle, quick command input, and auto-scroll anchor.
   - `Telemetry Micro-Tiles`: Live gauge charts for TPS (Target: 20.0), MSPT (< 50ms), CPU Thread saturation, and Resident Set Size (RSS) Memory.
   - `Server Controls Cluster`: Tactile button group: `Start` (Emerald), `Restart` (Amber), `Stop` (Slate), `Force Kill` (Crimson modal lock).
3. **Addon Marketplace (Mods / Plugins / Datapacks / Presets)**:
   - Sticky filter bar: Search query input with debounce (300ms), source selector (`Modrinth` | `CurseForge`), Loader selector (`Fabric` | `Forge` | `NeoForge` | `Paper` | `Purpur`), Version selector.
   - Card grid with 2-level progressive disclosure: Quick Card (Name, icon, download counter, compatibility check, single-click install) and Detailed Drawer (Markdown changelogs, transitive dependency breakdown, version dropdown).
4. **Player Management & NBT Visualizer**:
   - Table of active sessions with ping, coordinates, operator status, and quick moderation actions (Kick, Ban, Mute, Teleport).
   - Modal Player HUD: Faithful recreation of the 27-slot inventory + 9-slot hotbar + 4-slot armor + offhand + 27-slot Ender Chest. Hovering triggers tooltip with item damage, custom enchantments, and lore.
5. **Velocity Network Route Graph**:
   - Node-graph visualization mapping the Velocity proxy to linked backend instances.
   - Real-time player distribution pill indicators on each node.
   - Forwarding secret generator and automated config synchronization trigger.

---

## CHAPTER 4: BACKEND DAEMON & CONTAINER ENGINE

### 4.1 Container Isolation Specification (Docker / OCI)
Every server runs within an isolated Docker container configured with zero privilege escalation:
- **Image Runtime**:
  - Eclipse Temurin OpenJDK 21 (for modern Minecraft 1.20.5+ / 1.21+).
  - Eclipse Temurin OpenJDK 17 (for Minecraft 1.17 - 1.20.4).
  - Eclipse Temurin OpenJDK 8 (legacy support for 1.12.2 / 1.7.10).
- **Security Options**:
  - `SecurityOpt: ["no-new-privileges:true"]`
  - `CapDrop: ["ALL"]`
  - `ReadonlyRootfs: false` (Rootfs mounted read-only except data directory `/data` mounted as a dedicated host bind mount).
- **Cgroups Resource Clamping**:
  - Memory: `Memory = AllocatedBytes`, `MemorySwap = AllocatedBytes` (Disables swap to prevent JVM page faults).
  - CPU: `NanoCPUs = CoreCount * 1,000,000,000`.
  - PIDs Limit: `PidsLimit = 512` (Prevents fork-bomb plugins).
  - Disk Quota: Enforced via Linux `XFS` project quotas or ext4 directory quotas on the host mount point.

### 4.2 Process Lifecycle State Machine
The server process operates under a formal finite state machine (FSM):

```
       [ OFF ] ──( Start Command )──> [ PROVISIONING ]
          ▲                                  │
          │ (Container Exit 0)               │ (Docker Container Created)
          │                                  ▼
     [ STOPPING ] <──( Graceful Stop )── [ RUNNING ]
          │                                  │
          │ (Timeout > 30s)                  │ (Unexpected Exit Code != 0)
          ▼                                  ▼
     [ KILLING (SIGKILL) ] ───────────> [ CRASHED ]
```

- **Graceful Shutdown Protocol**:
  1. Daemon writes `/stop\n` or `end\n` to the container PTY stdin.
  2. Daemon initiates a 30-second watchdog timer.
  3. If the process does not terminate within 30 seconds, daemon issues `SIGKILL` (`kill -9`) to the container PID.
  4. Sockets are audited via `ss -Htan state closed` to ensure port release before the server state resets to `OFF`.

---

## CHAPTER 5: REAL-TIME COMMUNICATION PROTOCOL

### 5.1 Transport Multiplexing
All real-time communications flow through a single WebSocket endpoint per server (`/ws/servers/:id/stream`). Data frames are encoded as JSON messages with structured headers.

### 5.2 Packet Protocol Definition
```typescript
export type WebSocketPacket =
  | { op: 'AUTH'; d: { token: string } }
  | { op: 'CONSOLE_INPUT'; d: { command: string } }
  | { op: 'CONSOLE_OUTPUT'; d: { stream: 'stdout' | 'stderr'; data: string; timestamp: number } }
  | { op: 'TELEMETRY'; d: TelemetryFrame }
  | { op: 'STATUS_CHANGE'; d: { from: ServerState; to: ServerState; exitCode?: number } }
  | { op: 'PONG'; d: { timestamp: number } };

export interface TelemetryFrame {
  cpuUsagePercent: number;
  memoryUsageBytes: number;
  memoryLimitBytes: number;
  diskUsageBytes: number;
  tps: number;              // Current ticks per second (0.00 - 20.00)
  mspt: number;             // Milliseconds per tick (nominal: < 50.0ms)
  onlinePlayers: number;
  maxPlayers: number;
  timestamp: number;
}
```

### 5.3 Ring-Buffer Backpressure Protection
- **Server Side**: The daemon holds an in-memory 5,000-line circular ring buffer for console output. If the client WebSocket connection stalls or drops, older lines are recycled without allocating additional heap memory.
- **Client Side (React)**: The xterm.js subscriber uses a rate-limited animation frame buffer (`requestAnimationFrame`). Bursts of console output (> 1,000 lines/sec) are batched into 16ms render chunks, capping client CPU usage at < 3% during startup spam.

---

## CHAPTER 6: UNIFIED ADDON ENGINE (MODS, PLUGINS & PRESETS)

### 6.1 Multi-Provider Resolution Matrix
AetherNode unifies Modrinth and CurseForge through an abstracted metadata format:

```typescript
export interface UnifiedAddon {
  id: string;
  slug: string;
  title: string;
  summary: string;
  iconUrl: string | null;
  provider: 'modrinth' | 'curseforge';
  addonType: 'mod' | 'plugin' | 'datapack' | 'preset';
  totalDownloads: number;
  updatedAt: string;
  compatibleLoaders: ('fabric' | 'forge' | 'neoforge' | 'paper' | 'purpur' | 'velocity')[];
  versions: AddonVersion[];
}

export interface AddonVersion {
  versionId: string;
  versionNumber: string;
  gameVersions: string[];
  loaders: string[];
  downloadUrl: string;
  filename: string;
  hashes: { sha1: string; sha512?: string };
  dependencies: AddonDependency[];
}

export interface AddonDependency {
  projectId: string;
  dependencyType: 'required' | 'optional' | 'incompatible';
  versionId?: string;
}
```

### 6.2 The Transitive Dependency Traversal Algorithm
1. Retrieve target addon version metadata.
2. Filter `dependencies` where `dependencyType === 'required'`.
3. Check the server filesystem `/mods` or `/plugins` index.
4. If a dependency is missing:
   - Recursively fetch the dependency’s latest version matching the server’s `(MinecraftVersion, ModLoader)`.
   - Add to the `InstallQueue`.
5. Display confirmation modal presenting all required items, download sizes, and licenses.
6. On user confirmation, execute downloads in parallel with SHA-1 validation.

---

## CHAPTER 7: VELOCITY PROXY & NETWORK ORCHESTRATION

### 7.1 Modern Forwarding Security Engine
Velocity replaces legacy BungeeCord IP-forwarding with HMAC-SHA256 modern forwarding. The system manages this end-to-end:
1. **Secret Generation**: Upon creating a Velocity Network, the backend generates a secure 64-character hexadecimal forwarding secret:
   $$\text{Secret} = \text{CSPRNG}(256\text{ bits})$$
2. **Velocity Configuration Injection**:
   The proxy's `velocity.toml` is written with:
   ```toml
   player-info-forwarding-mode = "modern"
   forwarding-secret-file = "forwarding.secret"
   ```
3. **Backend Server Config Synchronization**:
   - For Paper/Purpur: Injects into `config/paper-global.yml`:
     ```yaml
     proxies:
       velocity:
         enabled: true
         online-mode: true
         secret: "<FORWARDING_SECRET>"
     ```
   - For Fabric: Installs `FabricProxy-Lite` and injects the secret into its configuration.
4. **Firewall Invariant**: Backend game servers bind exclusively to container network interfaces (`172.x.x.x`), prohibiting external direct traffic to backend ports and preventing player UUID spoofing.

---

## CHAPTER 8: PLAYER INVENTORY NBT & SCHEMATICS SUBSYSTEM

### 8.1 Player Data Concurrency & NBT Decoding
Minecraft player data resides in `world/playerdata/<UUID>.dat` encoded in gzip-compressed NBT.

```typescript
export interface PlayerInventoryData {
  uuid: string;
  username: string;
  health: number;
  foodLevel: number;
  xpLevel: number;
  xpScore: number;
  dimension: string;
  position: [number, number, number];
  inventory: InventorySlot[];
  enderChest: InventorySlot[];
}

export interface InventorySlot {
  slot: number;          // 0-35 (Standard), 100-103 (Armor), -106 (Offhand)
  id: string;            // e.g. "minecraft:netherite_sword"
  count: number;
  damage?: number;
  customName?: string;
  enchantments?: { id: string; level: number }[];
  rawNbt?: Record<string, unknown>;
}
```

#### Mutation Guard Protocol:
- If player is **ONLINE**:
  - Writing directly to `.dat` is forbidden.
  - Commands must be dispatched via RCON or companion bridge (e.g., `/item replace entity <player> slot.hotbar.0 with diamond_sword`).
- If player is **OFFLINE**:
  - Process acquires file lock on `world/playerdata/<UUID>.dat`.
  - Parses NBT buffer using `prismarine-nbt`.
  - Mutates Tag structure.
  - Re-compresses with zlib/gzip.
  - Writes to `<UUID>.dat.tmp`, executes `fsync`, and atomically renames over target file.

### 8.2 WorldEdit Schematics Management
- File formats supported: Sponge Schematic (`.schem` - modern 1.13+) and MCEdit/Legacy (`.schematic`).
- Parser extracts:
  - Header: Dimensions ($Width \times Height \times Length$).
  - Palette: Mapping of block state strings to integer IDs.
  - Data: Compacted block array.
- Frontend renders a 3D bounding box preview, block palette breakdown table, and one-click clipboard paste command generator (`//schem load <name>`).

---

## CHAPTER 9: ZERO-THEATER TESTING PROTOCOL

In strict accordance with the **Zero-Theater Mandate**, test suites avoid superficial mocks. Verification is divided across Domain 5 (High-Concurrency Backends) and Domain 6 (Modern Frontends):

```
+----------------------------------------------------------------------------------------------------+
|                                    ZERO-THEATER VERIFICATION MATRIX                                |
+------------------+------------------------------------+--------------------------------------------+
| Layer            | Frontend Focus (Domain 6)          | Backend Focus (Domain 5)                   |
+------------------+------------------------------------+--------------------------------------------+
| 1. Binary/Schema | TypeScript strict null checks,     | Zod / TypeBox schema validator fuzzing,    |
|                  | JSON schema validation on all APIs | memory leaks under continuous PTY pipes    |
| 2. Property Inv. | Bijective NBT decoder/encoder,     | Transitive dependency graph acyclicity     |
|                  | FSM state-transition completeness  | cgroup resource hard limit enforcement     |
| 3. Mutation Test | StrykerJS on inventory mutation    | cargo-mutants / mutmut on state-machine    |
|                  | and dependency resolution logic    | Target: 0 surviving mutants on core FSM    |
| 4. Fault Injected| WebSocket disconnect mid-install,  | Process SIGKILL during world autosave,     |
|                  | 50,000 lines/sec console flood     | Disk full / out-of-quota error handling    |
| 5. Numeric SLAs  | Console render frame: < 16.6ms,    | API p99 < 25ms under 500 concurrent reqs,  |
|                  | First Contentful Paint: < 800ms    | PTY buffer latency < 15ms                  |
+------------------+------------------------------------+--------------------------------------------+
```

---

## CHAPTER 10: DATA MODELS & COMPLETE API SPECIFICATION

### 10.1 Core REST API Routes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/servers` | List all servers with health and player summaries. |
| `POST` | `/api/v1/servers` | Provision a new server instance (specifying engine, memory, ports). |
| `GET` | `/api/v1/servers/:id` | Full server configuration and live status. |
| `PATCH` | `/api/v1/servers/:id` | Modify allocations, startup flags, or Java version. |
| `DELETE` | `/api/v1/servers/:id` | Terminate and delete server container and volumes. |
| `POST` | `/api/v1/servers/:id/power` | Dispatch power action (`start`, `stop`, `restart`, `kill`). |
| `GET` | `/api/v1/servers/:id/files` | Query file tree listing with metadata. |
| `GET` | `/api/v1/servers/:id/files/view` | Read contents of a configuration or log file. |
| `PUT` | `/api/v1/servers/:id/files/write` | Atomically write content to a configuration file. |
| `GET` | `/api/v1/addons/search` | Search Modrinth & CurseForge catalogs. |
| `POST` | `/api/v1/servers/:id/addons/install` | Execute atomic addon installation with dependencies. |
| `GET` | `/api/v1/servers/:id/players` | Query online players with ping and location. |
| `GET` | `/api/v1/servers/:id/players/:uuid/inventory` | Parse and retrieve player NBT inventory. |
| `POST` | `/api/v1/networks/velocity` | Initialize or update a Velocity proxy cluster. |

---

## CHAPTER 11: REPOSITORY STRUCTURE & BRANCHING ARCHITECTURE

### 11.1 Project Structure
```
Athernode/
├── apps/
│   ├── web/                          # Primary Scope: React 19 Frontend
│   │   ├── src/
│   │   │   ├── assets/               # Icons, sounds, custom shaders
│   │   │   ├── components/
│   │   │   │   ├── bento/            # Bento grid dashboard cards
│   │   │   │   ├── console/          # xterm.js ANSI terminal & telemetry
│   │   │   │   ├── addons/           # Mod/Plugin store, drawers, version sheets
│   │   │   │   ├── players/          # Inventory HUD, 9x4 NBT slot visualizer
│   │   │   │   ├── files/            # Monaco editor & file tree
│   │   │   │   ├── network/          # Velocity route canvas & secret generator
│   │   │   │   └── ui/               # Buttons, badges, modals, drawers, toasts
│   │   │   ├── hooks/                # useWebSocket, useTelemetry, useAddonSearch
│   │   │   ├── services/
│   │   │   │   ├── contracts/        # TypeScript interfaces (zero coupling)
│   │   │   │   ├── mock/             # High-fidelity standalone simulation engine
│   │   │   │   └── api/              # Production Axios / Fetch adapters
│   │   │   ├── stores/               # Zustand state stores
│   │   │   └── types/                # Strict domain types
│   │   └── tailwind.config.js        # Obsidian & Neon design tokens
│   │
│   └── daemon/                       # Secondary Scope (Separate Branch: 'feature/backend-daemon')
│       ├── cmd/daemon/               # Go or Node.js server container runner
│       ├── pkg/docker/               # OCI container manager & cgroups
│       ├── pkg/pty/                  # Terminal stream multiplexer
│       └── pkg/rcon/                 # Live Minecraft synchronization client
│
├── packages/
│   └── shared-types/                 # Shared TypeScript models across client & server
│
├── docs/
│   ├── AETHERNODE_SPEC.md            # This Master Specification Document
│   └── REFERENCE_PATTERNS.md         # Open-source architectural reference brief
│
└── tests/
    ├── e2e/                          # Playwright test suite (Domain 6)
    └── unit/                         # Invariant & mutation tests
```

### 11.2 Branching Strategy
- **`main`**: Pure frontend application equipped with the dual-mode adapter. Runs completely standalone in mock mode (`VITE_USE_MOCKS=true`) with fully functional interactive console, mod store, telemetry, inventory inspection, and Velocity canvas. When your friend's backend is ready, switching `VITE_USE_MOCKS=false` connects directly to the real APIs.
- **`feature/backend-daemon`**: Independent branch dedicated to the backend container execution daemon, isolated from the presentation repository so your friend can build or integrate his own backend without conflicts.
