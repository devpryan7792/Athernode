import React, { useState } from 'react';
import { useServerStore, useUiStore } from '../../stores';
import { serverService } from '../../services';
import {
  Play,
  RotateCw,
  Square,
  Skull,
  Copy,
  Check,
  Cpu,
  Database,
  Gauge,
  Users,
  Terminal,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const ServerOverview: React.FC = () => {
  const { getActiveServer, fetchServers } = useServerStore();
  const { setActiveTab, addToast } = useUiStore();
  const server = getActiveServer();
  const [copied, setCopied] = useState(false);
  const [isPowering, setIsPowering] = useState(false);

  if (!server) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <p>No active server selected.</p>
      </div>
    );
  }

  const handleCopyIp = () => {
    navigator.clipboard.writeText(`${server.ip}:${server.port}`);
    setCopied(true);
    addToast('Address Copied', `${server.ip}:${server.port} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePowerAction = async (action: 'start' | 'stop' | 'restart' | 'kill') => {
    setIsPowering(true);
    try {
      await serverService.sendPowerAction(server.id, action);
      addToast(
        `Command Sent: ${action.toUpperCase()}`,
        `Server ${server.name} transitioning to ${action === 'start' ? 'STARTING' : 'STOPPING'} state.`
      );
      setTimeout(async () => {
        await fetchServers();
        setIsPowering(false);
      }, 1500);
    } catch {
      addToast('Action Failed', `Failed to execute ${action}`, 'error');
      setIsPowering(false);
    }
  };

  const ramUsedMb = (server.memoryUsageBytes / (1024 * 1024)).toFixed(0);
  const ramLimitMb = (server.memoryLimitBytes / (1024 * 1024)).toFixed(0);
  const ramPercent = Math.min(100, Math.round((server.memoryUsageBytes / server.memoryLimitBytes) * 100));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Control Banner */}
      <div className="relative rounded-2xl bg-obsidian-850 border border-obsidian-600 p-6 shadow-xl overflow-hidden">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Server Identity */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                {server.engine} {server.version}
              </span>
              <span className="text-xs font-mono text-slate-400">Node: {server.node}</span>
              {server.isProxyLinked && (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                  Velocity Routed
                </span>
              )}
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              {server.name}
            </h1>

            <p className="text-sm text-slate-400 max-w-2xl">{server.description}</p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleCopyIp}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-obsidian-900 border border-obsidian-600 hover:border-neon-cyan/50 text-slate-200 text-xs font-mono transition-all group"
              >
                <span>{server.ip}:{server.port}</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-neon-emerald" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-neon-cyan transition-colors" />
                )}
              </button>
            </div>
          </div>

          {/* Tactile Power Controls Cluster */}
          <div className="flex items-center gap-2.5 bg-obsidian-950/80 p-2.5 rounded-xl border border-obsidian-600/80 backdrop-blur-md shrink-0">
            {server.state === 'OFF' ? (
              <button
                disabled={isPowering}
                onClick={() => handlePowerAction('start')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neon-emerald/20 hover:bg-neon-emerald/30 border border-neon-emerald/40 text-neon-emerald text-sm font-semibold tracking-wide shadow-neon-emerald transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-neon-emerald" />
                <span>Start</span>
              </button>
            ) : (
              <>
                <button
                  disabled={isPowering}
                  onClick={() => handlePowerAction('restart')}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-neon-amber/15 hover:bg-neon-amber/25 border border-neon-amber/40 text-neon-amber text-sm font-semibold tracking-wide transition-all disabled:opacity-50"
                  title="Restart Server Gracefully"
                >
                  <RotateCw className={`w-4 h-4 ${isPowering ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Restart</span>
                </button>

                <button
                  disabled={isPowering}
                  onClick={() => handlePowerAction('stop')}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-obsidian-700 hover:bg-obsidian-600 border border-obsidian-500 text-slate-200 text-sm font-semibold tracking-wide transition-all disabled:opacity-50"
                  title="Stop Server Gracefully"
                >
                  <Square className="w-4 h-4" />
                  <span className="hidden sm:inline">Stop</span>
                </button>

                <button
                  disabled={isPowering}
                  onClick={() => handlePowerAction('kill')}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-neon-crimson/15 hover:bg-neon-crimson/25 border border-neon-crimson/40 text-neon-crimson text-sm font-semibold tracking-wide transition-all disabled:opacity-50"
                  title="Force SIGKILL Process"
                >
                  <Skull className="w-4 h-4" />
                  <span className="hidden sm:inline">Kill</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bento Grid Telemetry & Vital Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TPS & Health */}
        <div className="rounded-xl bg-obsidian-850/80 border border-obsidian-600 p-5 space-y-3 relative overflow-hidden group hover:border-neon-cyan/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Tick Rate (TPS)</span>
            <Gauge className="w-4 h-4 text-neon-cyan" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">
              {server.state === 'RUNNING' ? server.tps.toFixed(2) : '0.00'}
            </span>
            <span className="text-xs font-mono text-neon-emerald">/ 20.00 Max</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            MSPT: <span className="text-slate-200">{server.state === 'RUNNING' ? `${server.mspt.toFixed(1)}ms` : '0ms'}</span> (Target: &lt;50ms)
          </div>
        </div>

        {/* RAM Usage */}
        <div className="rounded-xl bg-obsidian-850/80 border border-obsidian-600 p-5 space-y-3 relative overflow-hidden group hover:border-neon-sky/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Memory (RAM)</span>
            <Database className="w-4 h-4 text-neon-sky" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">{ramUsedMb}</span>
            <span className="text-xs font-mono text-slate-400">/ {ramLimitMb} MB</span>
          </div>
          <div className="w-full bg-obsidian-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                ramPercent > 85 ? 'bg-neon-crimson' : ramPercent > 70 ? 'bg-neon-amber' : 'bg-neon-cyan'
              }`}
              style={{ width: `${ramPercent}%` }}
            />
          </div>
        </div>

        {/* CPU Load */}
        <div className="rounded-xl bg-obsidian-850/80 border border-obsidian-600 p-5 space-y-3 relative overflow-hidden group hover:border-neon-emerald/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">CPU Saturation</span>
            <Cpu className="w-4 h-4 text-neon-emerald" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">
              {server.state === 'RUNNING' ? `${server.cpuUsagePercent.toFixed(1)}%` : '0.0%'}
            </span>
            <span className="text-xs font-mono text-slate-400">Allocated: 4 Cores</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            cgroup limits: <span className="text-neon-emerald">Active</span>
          </div>
        </div>

        {/* Player Sessions */}
        <div
          onClick={() => setActiveTab('players')}
          className="rounded-xl bg-obsidian-850/80 border border-obsidian-600 p-5 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Online Players</span>
            <Users className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">{server.currentPlayers}</span>
            <span className="text-xs font-mono text-slate-400">/ {server.maxPlayers} Max</span>
          </div>
          <div className="text-xs font-mono text-emerald-400 flex items-center gap-1 group-hover:underline">
            <span>Inspect NBT & Inventories</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Quick Launchpad Navigation Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div
          onClick={() => setActiveTab('console')}
          className="flex items-center justify-between p-4 rounded-xl bg-obsidian-800/60 border border-obsidian-600 hover:border-emerald-500/50 hover:bg-obsidian-800 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                Interactive Console
              </div>
              <div className="text-xs text-slate-400">Stream live stdout & issue commands</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </div>

        <div
          onClick={() => setActiveTab('addons')}
          className="flex items-center justify-between p-4 rounded-xl bg-obsidian-800/60 border border-obsidian-600 hover:border-emerald-500/50 hover:bg-obsidian-800 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                Addon Marketplace
              </div>
              <div className="text-xs text-slate-400">One-click Modrinth & CurseForge installer</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </div>

        <div
          onClick={() => setActiveTab('schematics')}
          className="flex items-center justify-between p-4 rounded-xl bg-obsidian-800/60 border border-obsidian-600 hover:border-emerald-500/50 hover:bg-obsidian-800 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                WorldEdit Schematics
              </div>
              <div className="text-xs text-slate-400">Inspect 3D dimensions & block palettes</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
};
