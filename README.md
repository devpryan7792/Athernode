# AetherNode

> High-Performance Minecraft Server & Network Management Platform with Dark Obsidian & Neon UI.

AetherNode is an open-source server control plane designed for high-density Minecraft infrastructure. It provides real-time telemetry, low-latency container console streams via xterm.js, Modrinth/CurseForge addon management with automated transitive dependency resolution, visual 9x4 NBT player inventory inspection, Velocity modern forwarding HMAC orchestration, an integrated Monaco code editor with interactive directory navigation, and WorldEdit 3D schematic management.

Built with **React 19**, **TypeScript**, and **Tailwind CSS v4**, operating on a **Dual-Mode Contract Architecture** that runs fully standalone in mock mode for instant evaluation or connects directly to daemon orchestration endpoints.

---

## Architecture Overview

```
                          +-------------------------------+
                          |    AetherNode Web UI          |
                          |  (React 19 + TypeScript + v4) |
                          +---------------+---------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                [Standalone Mock]                  [Production Wire]
                        |                                   |
            +-----------v-----------+           +-----------v-----------+
            | High-Fidelity Mock    |           | REST & WebSocket API  |
            | Engine & State Store  |           | (Backend Daemon)      |
            +-----------------------+           +-----------+-----------+
                                                            |
                                                +-----------v-----------+
                                                | Linux cgroups v2 /    |
                                                | Docker / Pterodactyl  |
                                                | Wings Runtime         |
                                                +-----------------------+
```

---

## Core Features

- **Obsidian & Neon UI**: Dark aesthetic inspired by WiseHosting and Dawn Client (`#080A0F` deep obsidian base, `#111622` surface panels, electric `#00F2FE` cyan and `#10B981` emerald telemetry indicators).
- **Live Terminal & Telemetry**: Integrated `@xterm/xterm` console with ANSI color formatting, command history buffer, auto-scroll locking, and real-time TPS/MSPT/Memory/CPU monitoring.
- **Addon Marketplace & Resolver**: Unified catalog searching Modrinth and CurseForge. Automatically detects missing required transitive dependencies (e.g. Fabric API, Cloth Config) before applying atomic batch installations.
- **Visual Player Inventory & NBT HUD**: Inspects online players with a 41-slot Minecraft inventory matrix (Armor, Offhand, 27-slot Storage, 9-slot Hotbar) and 27-slot Ender Chest viewer with item lore and enchantments tooltips.
- **Velocity Proxy Orchestration Mesh**: Coordinates multi-server proxy forwarding using 256-bit CSPRNG HMAC secrets and enables live cross-server player dispatching.
- **Integrated File Explorer & Monaco Editor**: VS Code-powered Monaco editor with interactive `/root` breadcrumb navigation, parent folder traversal, and automatic syntax detection (`.properties`, `.yml`, `.toml`, `.json`, `.log`).
- **WorldEdit Schematics Management**: Inspects 3D bounding dimensions ($X \times Y \times Z$), block volume counts, and palette composition percentages with one-click copyable in-game load commands (`//schem load <name>`).

---

## Project Structure

```
Athernode/
├── apps/
│   └── web/                     # React 19 + TypeScript Frontend
│       ├── src/
│       │   ├── components/      # UI Subsystems (Overview, Console, Addons, Players, Network, Files)
│       │   ├── services/
│       │   │   ├── contracts/   # Type-safe interface abstractions (IServerService, etc.)
│       │   │   └── mock/        # Standalone high-fidelity simulated engine
│       │   ├── stores/          # Zustand global state (servers, telemetry, UI)
│       │   └── types/           # Domain models and telemetry contracts
│       ├── package.json
│       └── vite.config.ts
├── docs/
│   ├── AETHERNODE_SPEC.md       # Comprehensive 11-chapter architectural blueprint
│   ├── REFERENCE_PATTERNS.md    # Deconstructed architectures (Pterodactyl, Crafty, MCSManager)
│   └── WALKTHROUGH.md          # Verification notes and audit results
└── README.md
```

---

## Quickstart

### Prerequisites
- Node.js 18+ (Node.js 20+ or 22+ recommended)
- npm or pnpm

### Running Locally
```bash
# Clone the repository
git clone https://github.com/devpryan7792/Athernode.git
cd Athernode/apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The application launches in standalone mock mode by default (`VITE_USE_MOCKS=true`), allowing full exploration of every feature without requiring external daemon infrastructure.

### Building for Production
```bash
cd apps/web
npm run build
```

---

## Specifications & Verification

Detailed technical documents:
- [System Architecture Specification](docs/AETHERNODE_SPEC.md)
- [Reference Pattern Analysis](docs/REFERENCE_PATTERNS.md)
- [Application Walkthrough & Audit Log](docs/WALKTHROUGH.md)

---

## License

MIT License.
