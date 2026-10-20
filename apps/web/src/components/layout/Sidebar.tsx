import React from 'react';
import { useUiStore, type NavigationTab } from '../../stores';
import {
  LayoutDashboard,
  Terminal,
  Package,
  Users,
  FolderTree,
  Network,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, isSidebarCollapsed, toggleSidebar } = useUiStore();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'console',
      label: 'Console & Telemetry',
      icon: <Terminal className="w-5 h-5 shrink-0" />,
      badge: 'Live',
    },
    {
      id: 'addons',
      label: 'Mods & Plugins',
      icon: <Package className="w-5 h-5 shrink-0" />,
      badge: 'Store',
    },
    {
      id: 'players',
      label: 'Players & NBT HUD',
      icon: <Users className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'network',
      label: 'Velocity Mesh',
      icon: <Network className="w-5 h-5 shrink-0" />,
      badge: 'HMAC',
    },
    {
      id: 'files',
      label: 'Files & Editor',
      icon: <FolderTree className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'schematics',
      label: 'WorldEdit Schems',
      icon: <Layers className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <aside
      className={`fixed lg:static top-16 bottom-0 left-0 z-30 flex flex-col justify-between border-r border-obsidian-600 bg-obsidian-950/95 lg:bg-obsidian-950/70 backdrop-blur-xl transition-all duration-300 select-none ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Navigation List */}
      <div className="p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
          {!isSidebarCollapsed && 'Server Control Plane'}
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-850/80 border border-transparent'
              }`}
            >
              <span className={`${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400 transition-colors'}`}>
                {item.icon}
              </span>

              {!isSidebarCollapsed && (
                <span className="truncate flex-1 text-left tracking-wide">
                  {item.label}
                </span>
              )}

              {!isSidebarCollapsed && item.badge && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-obsidian-700 text-slate-400 group-hover:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-obsidian-600/80 hidden lg:block">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 border border-obsidian-600 text-slate-400 hover:text-slate-200 text-xs font-mono transition-all"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
