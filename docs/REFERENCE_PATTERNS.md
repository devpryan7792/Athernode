# AetherNode: Architectural Reference & Intelligence Brief

This document establishes the architectural foundations and extracted engineering patterns from tier-1 open-source projects and industry-leading platforms (WiseHosting, Dawn Client, Aternos, Pterodactyl). It serves as the primary technical reference to prevent architectural drift and superficial design.

---

## 1. UX & Visual Deconstruction: The Obsidian & Neon Aesthetic

### 1.1 The Visual Blueprint (WiseHosting + Dawn Client)
- **Base Surfaces & Elevation**:
  - `Surface 0 (Canvas)`: `#080A0F` (True dark obsidian).
  - `Surface 1 (Card/Container)`: `#111622` with a 1px border of `#1E2638`.
  - `Surface 2 (Interactive/Hover)`: `#182030` with subtle border illumination `#2A364F`.
  - `Surface 3 (Modal/Overlay)`: `#0E121B` at 85% opacity with `backdrop-filter: blur(16px)`.
- **Neon Accent Hierarchy**:
  - `Primary Cyan`: `#00F2FE` transitioning to `#38BDF8` (used for primary actions, active tabs, glowing install states).
  - `Emerald Success`: `#10B981` (20.0 TPS, running state, connected nodes).
  - `Amber Warning`: `#F59E0B` (TPS drop < 16.0, high memory > 85%, dependency warnings).
  - `Crimson Danger`: `#EF4444` (Process crash, OOM kill, ban action, delete server).
  - `Electric Violet`: `#8B5CF6` (Velocity network proxy indicators, schematic tags).

### 1.2 Component Micro-Interactions
- **Bento-Grid Dashboard**: Adaptive multi-column grid with live status glow badges and micro-telemetry sparklines (CPU, RAM, TPS).
- **Sticky Status Toasts**: Real-time notifications that float at the bottom center with glowing border states, action undo buttons, and progress rings.
- **Drawer Panels**: Slide-out version inspection sheets for mods/plugins displaying changelogs, dependencies, and download streams without losing search context.

---

## 2. Competitive Deconstruction: How "One-Click Install" Actually Works

### 2.1 The Aternos vs. WiseHosting Model
In Aternos and WiseHosting, "One-Click Install" is not a simple file download. A naive download breaks the server in 90% of cases due to **loader mismatches**, **incompatible Minecraft versions**, or **missing transitive dependencies**.

#### The 5-Step Resolution Pipeline:
1. **Server Context Detection**:
   - The frontend queries the active server instance:
     - `Engine`: Fabric, Forge, NeoForge, Paper, Purpur, Spigot, Velocity.
     - `GameVersion`: e.g. `1.21.4`.
     - `InstalledFiles`: List of `.jar` filenames and metadata currently in `/mods` or `/plugins`.
2. **Catalog Query (Modrinth Labrinth v2 & CurseForge Core)**:
   - Search parameters automatically inherit `version=1.21.4` and `loader=fabric`.
   - Incompatible mods are either filtered out or rendered with a disabled badge explaining the incompatibility.
3. **Dependency Graph Traversal**:
   - When the user clicks **[Install]** on a mod (e.g. `Simple Voice Chat`):
     - The client/API inspects the target version's `dependencies` array.
     - Example: `Simple Voice Chat` requires `Fabric API` and `Cloth Config`.
   - The resolver cross-references the server's `/mods` directory.
   - If dependencies are missing, the UI presents an **Atomic Installation Modal**:
     > *"Simple Voice Chat requires Fabric API and Cloth Config. Install all 3 components?"*
4. **Atomic Jar Placement**:
   - Files are fetched via authenticated SHA1/SHA512 download streams directly into the container's volume.
   - If an older version of the same mod exists (e.g., `voicechat-fabric-1.21.3.jar`), it is automatically unlinked/archived to prevent duplicate mod crashes.
5. **Dynamic Config & Presets Injection**:
   - Certain mods require specific ports (e.g. Simple Voice Chat UDP port 24454).
   - The panel auto-allocates a free network port on the node and patches the mod's `config/voicechat/voicechat-server.properties` automatically.

---

## 3. Reference Architecture: Open-Source Systems Deep-Dive

### 3.1 Pterodactyl & Wings (`pterodactyl/panel`, `pterodactyl/wings`)
- **Key Insight**: Complete decoupling of the UI/Control Panel from the execution node (Daemon).
- **Communication Protocol**:
  - REST API for CRUD, configuration, and allocation.
  - State-secured WebSockets with JWT tokens for live console, telemetry streaming, and file transfer.
- **Process Isolation**: Each Minecraft instance runs inside a rootless Docker container with hard cgroup constraints:
  - `Memory`: Fixed hard limit (e.g. 4096MB) + swap limit (0MB to prevent thrashing).
  - `CPU`: `CpuQuota` and `CpuPeriod` to prevent a single runaway tick from starving the host.
  - `I/O Limits`: Disk write throttling (`blkio-weight`) preventing malicious logging DOS attacks.

### 3.2 MCSManager (`MCSManager/MCSManager`)
- **Key Insight**: Universal Web-to-Daemon JSON-RPC/WebSocket protocol.
- **Frontend Value**: Demonstrates how to design an event-driven frontend that handles multiple nodes seamlessly without page reloads.

### 3.3 Crafty Controller (`crafty-controller/crafty-4`)
- **Key Insight**: High-efficiency backup snapshotting and automated configuration parsing for `server.properties` and YAML configs.
- **Frontend Value**: Visual configuration editors with toggle switches and input masks for complex Minecraft server flags (e.g. `view-distance`, `simulation-distance`, `enforce-whitelist`, `allow-flight`).

### 3.4 PrismarineJS (`PrismarineJS/prismarine-nbt`, `prismarine-schematic`)
- **Key Insight**: Zero-loss binary NBT parsing and serialization in TypeScript.
- **Capabilities for AetherNode**:
  - Direct decoding of `playerdata/<UUID>.dat`: Inventory slots, Armor, Ender Chest, Health, Food, XP, Potion effects, Advancements.
  - Parsing WorldEdit `.schem` (Sponge format) and legacy `.schematic` files for 3D block counts, palette metadata, and dimension footprints.

---

## 4. Velocity Network Topology: Proxy & Backend Node Model

```
                          +-------------------------+
                          |   AetherNode Frontend   |
                          +------------+------------+
                                       |
                   WebSockets & REST   |
                                       v
                          +-------------------------+
                          |    AetherNode Backend   |
                          +------------+------------+
                                       |
        +------------------------------+------------------------------+
        |                                                             |
        v                                                             v
+---------------+                                             +---------------+
| Velocity Node | (Gateway: Port 25565)                       |  Paper Hub 01 | (Port 25566)
| Modern Proxy  | === Modern Forwarding (Secret HMAC) ======> |  Paper Survival| (Port 25567)
| Player Router |                                             |  Fabric Mods  | (Port 25568)
+---------------+                                             +---------------+
```

### Key Frontend Features for Velocity Management:
1. **Visual Route Canvas / Network Graph**:
   - Interactive topology showing the Velocity Proxy connected to downstream servers (Lobby, Survival, Minigames).
   - Real-time indicator of player counts distributed across the network.
2. **Automated Modern Forwarding Synchronization**:
   - The frontend manages the forwarding secret token (`forwarding.secret`).
   - One-click "Link to Velocity" button that automatically configures `velocity.toml` and updates `paper-global.yml` on backend servers with the shared secret.
3. **Cross-Network Player Dispatcher**:
   - List all online players across the entire network.
   - Live teleport/send player between servers: `/send <player> <target_server>`.
