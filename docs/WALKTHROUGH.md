# Walkthrough - AetherNode Web Application

We have implemented the full **AetherNode** web application with the **Dark Obsidian & Neon** aesthetic inspired by WiseHosting and Dawn Client. The application runs with a dual-mode service layer, pre-packaged with a high-fidelity mock engine allowing you to click through, demo, and test every single feature immediately, while adhering to the 11-chapter architectural specification.

## What Was Built

### 1. Master Architectural Documents
- [`docs/AETHERNODE_SPEC.md`](file:///home/pryan/code/Athernode/docs/AETHERNODE_SPEC.md): The comprehensive 11-chapter specification covering cgroups isolation, ring-buffer telemetry backpressure, dependency resolvers, Velocity modern forwarding HMAC, NBT atomic saving, and Zero-Theater verification.
- [`docs/REFERENCE_PATTERNS.md`](file:///home/pryan/code/Athernode/docs/REFERENCE_PATTERNS.md): Architectural extraction from Pterodactyl Wings, MCSManager, Crafty Controller, and PrismarineJS.

---

### 2. Obsidian & Neon Visual Design System
- **Surfaces & Palette**: Deep Obsidian (`#080A0F`), Midnight Containers (`#111622`), Slate Borders (`#232D42`), and Electric Neon Accents (`#00F2FE` Cyan, `#10B981` Emerald, `#EF4444` Crimson, `#8B5CF6` Violet).
- **Collapsible Sidebar**: Tactile navigation between Overview, Console, Addons Store, Player HUD, Velocity Mesh, Monaco Editor, and Schematics.
- **Glowing Toast System**: Sticky notifications floating at the bottom with neon border glow and pulse animations.

---

### 3. Core Subsystems & Interactive Features

#### A. Bento-Grid Server Overview ([`ServerOverview.tsx`](file:///home/pryan/code/Athernode/apps/web/src/components/dashboard/ServerOverview.tsx))
- **Hero Server Card**: Engine/version tags (Paper, Fabric, Velocity), IP copy pill, and tactile power buttons (`Start`, `Restart`, `Stop`, `Kill`).
- **Live Vital Gauges**: Real-time tick rate (TPS), MSPT latency, RSS Memory progress bar, and cgroup CPU thread saturation.
- **Quick Switcher**: Instant switching between active servers in the cluster.

#### B. Live Terminal & Telemetry ([`ConsoleView.tsx`](file:///home/pryan/code/Athernode/apps/web/src/components/console/ConsoleView.tsx))
- Powered by modern **`@xterm/xterm`** + **`@xterm/addon-fit`**.
- ANSI-color decoding for Minecraft log levels (`[INFO]`, `[WARN]`, `[FATAL]`).
- Auto-scroll lock, clear buffer action, and command history (Up/Down arrow keys).
- Quick command execution buttons (`/tps`, `/list`, `/say Hello world!`, `/time set day`, `/weather clear`) with realistic simulated stdout responses.

#### C. Modrinth & CurseForge Addon Store ([`AddonMarketplace.tsx`](file:///home/pryan/code/Athernode/apps/web/src/components/addons/AddonMarketplace.tsx))
- **Category Tabs**: `Presets`, `Mods`, `Plugins`, `Datapacks`.
- **Search & Filter Bar**: Instant search, provider toggle (`Modrinth` / `CurseForge`), loader dropdown (`Fabric`, `Forge`, `NeoForge`, `Paper`, `Velocity`), and Minecraft version filter.
- **Transitive Dependency Resolver**: Clicking "Install" on mods like *Simple Voice Chat* detects required dependencies (*Fabric API*, *Cloth Config*) and launches an atomic installation modal.
- Celebratory confetti (`canvas-confetti`) on installation with sticky neon toast.

#### D. Visual Player Inventory & NBT HUD ([`PlayerManager.tsx`](file:///home/pryan/code/Athernode/apps/web/src/components/players/PlayerManager.tsx))
- Online players table showing skin avatar, ping latency, health, food, XP level, and world coordinates.
- **Interactive 9x4 Inventory HUD Modal**:
  - Full recreation of the 27-slot main storage + 9-slot hotbar + 4 armor slots + offhand.
  - Tab toggle to inspect the player's 27-slot **Ender Chest**.
  - Hover tooltip displaying item lore, durability bar, and custom enchantments (e.g. *Sharpness V*, *Mending*).
  - Moderation actions: Kick, Ban, and Operator toggle (`/op`).

#### E. Velocity Network Orchestration Mesh ([`VelocityNetworkView.tsx`](file:///home/pryan/code/Athernode/apps/web/src/components/network/VelocityNetworkView.tsx))
- Visual network topology mapping the **Velocity Master Gateway** (Port 25565) to downstream nodes (`Survival-SMP`, `Fabric-Tech`, `Purpur-Lobby`).
- **HMAC-SHA256 Secret Engine**: Live 256-bit CSPRNG key generator and one-click "Sync Secret" simulation that patches backend configs.
- **Cross-Server Player Dispatcher**: Live form to route players between servers using the proxy's `/send` IPC bridge.

#### F. Integrated Monaco Code Editor & File Explorer ([`FileManagerView.tsx`](file:///home/pryan/code/Athernode/apps/web/src/components/files/FileManagerView.tsx))
- Dual-pane layout with file tree explorer on the left and full VS Code **Monaco Editor** on the right.
- Syntax highlighting auto-detection for `.properties`, `.yml`, `.toml`, `.json`, and `.log`.
- Live file editing and atomic saving with toast confirmation.

#### G. WorldEdit Schematics Manager ([`SchematicsView.tsx`](file:///home/pryan/code/Athernode/apps/web/src/components/schematics/SchematicsView.tsx))
- Displays 3D bounding dimensions ($X \times Y \times Z$), total blocks count, and palette composition percentages.
- Drag-and-drop `.schem` and `.schematic` file uploader.
- One-click clipboard copy for in-game pasting (`//schem load <name>`).

---

## Verification & Status

### 1. Build Verification
- Production TypeScript compilation (`npm run build`) completed with **0 errors**:
  ```
  dist/index.html                   0.45 kB │ gzip:   0.29 kB
  dist/assets/index-Bl5F5Cbu.css   53.81 kB │ gzip:   9.09 kB
  dist/assets/index-D1WX5TsP.js   691.78 kB │ gzip: 190.48 kB
  ✓ built in 383ms
  ```

### 2. Live Dev Server
- Dev server running on `http://localhost:5173/` (`HTTP 200 OK`).

### 3. Git Repository History
- Initialized git repository with clean atomic commits:
  - `218ee83`: `docs: establish master technical specification and architectural reference`
  - `af9eddd`: `feat(web): implement AetherNode obsidian & neon frontend with live console, addon store, NBT HUD, and Velocity mesh`
