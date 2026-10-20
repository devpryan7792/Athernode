import React from 'react';
import { useServerStore, useUiStore } from '../../stores';
import { Server, Activity, ShieldCheck, ChevronDown, Radio, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  const { servers, activeServerId, setActiveServerId, getActiveServer } = useServerStore();
  const { toggleSidebar } = useUiStore();
  const activeServer = getActiveServer();

  return (
    <header className="h-16 border-b border-obsidian-600 bg-obsidian-900/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Sidebar Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg bg-obsidian-800 border border-obsidian-600 hover:border-neon-cyan/50 text-slate-300 hover:text-neon-cyan transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 border border-neon-cyan/40 flex items-center justify-center shadow-neon-cyan">
            <Radio className="w-4 h-4 text-neon-cyan animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">AETHER<span className="text-neon-cyan">NODE</span></span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-widest font-semibold rounded bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
                v1.0-RC
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Cluster: <span className="text-slate-300">US-East-01</span> (4/4 Nodes Healthy)
            </div>
          </div>
        </div>
      </div>

      {/* Center: Server Switcher Dropdown */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-obsidian-800 border border-obsidian-600 hover:border-obsidian-500 cursor-pointer transition-all">
            <Server className="w-4 h-4 text-neon-sky" />
            <select
              value={activeServerId || ''}
              onChange={(e) => setActiveServerId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-200 outline-none cursor-pointer pr-4 appearance-none"
            >
              {servers.map((s) => (
                <option key={s.id} value={s.id} className="bg-obsidian-850 text-slate-200">
                  {s.name} ({s.engine} {s.version})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none -ml-2" />
          </div>
        </div>

        {/* Server State Indicator Badge */}
        {activeServer && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-obsidian-850 border border-obsidian-600">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                activeServer.state === 'RUNNING'
                  ? 'bg-neon-emerald shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                  : activeServer.state === 'STARTING'
                  ? 'bg-neon-amber shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
              {activeServer.state}
            </span>
            {activeServer.state === 'RUNNING' && (
              <span className="text-xs font-mono text-neon-emerald pl-1.5 border-l border-obsidian-600">
                {activeServer.tps.toFixed(1)} TPS
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right User & Cluster Meta */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-obsidian-800/60 border border-obsidian-600/80 text-slate-300 text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-neon-emerald" />
          <span>RAM: 13.0 / 24.0 GB</span>
        </div>

        <div className="flex items-center gap-2.5 pl-2 border-l border-obsidian-600">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-obsidian-700 to-obsidian-600 border border-obsidian-500 flex items-center justify-center text-xs font-bold text-neon-cyan shadow-sm">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-200 leading-none">Admin (Root)</div>
            <div className="text-[10px] text-neon-emerald flex items-center gap-1 mt-0.5 font-mono">
              <ShieldCheck className="w-3 h-3 inline" /> Standalone Mock
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
