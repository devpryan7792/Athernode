import React, { useEffect, useState } from 'react';
import { useUiStore } from '../../stores';
import { velocityService } from '../../services';
import type { VelocityNetworkConfig } from '../../types';
import {
  Network,
  ShieldCheck,
  RefreshCw,
  Key,
  Server,
  ArrowRight,
  Send,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const VelocityNetworkView: React.FC = () => {
  const { addToast } = useUiStore();
  const [config, setConfig] = useState<VelocityNetworkConfig | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [dispatchPlayer, setDispatchPlayer] = useState('NeonArchitect');
  const [dispatchTarget, setDispatchTarget] = useState('srv-fabric-tech');

  useEffect(() => {
    const loadNetwork = async () => {
      try {
        const cfg = await velocityService.getNetworkConfig();
        setConfig(cfg);
      } catch {
        addToast('Error', 'Failed to load Velocity network configuration', 'error');
      }
    };
    loadNetwork();
  }, [addToast]);

  const handleRegenerateSecret = async () => {
    if (!config) return;
    const newSecret = await velocityService.generateForwardingSecret();
    setConfig({ ...config, forwardingSecret: newSecret });
    addToast(
      'Secret Generated',
      'New 256-bit HMAC secret generated. Remember to synchronize with backend nodes.'
    );
  };

  const handleSyncSecret = async (backendId: string, backendName: string) => {
    if (!config) return;
    setIsSyncing(backendId);
    try {
      const res = await velocityService.syncBackendSecret(backendId, config.forwardingSecret);
      addToast('Secret Synchronized', `${backendName}: ${res.message}`);
    } catch {
      addToast('Sync Failed', `Could not update ${backendName}`, 'error');
    } finally {
      setIsSyncing(null);
    }
  };

  const handleDispatchPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    const target = config.backendServers.find((s) => s.serverId === dispatchTarget);
    await velocityService.sendPlayerToServer(dispatchPlayer, dispatchTarget);
    addToast(
      'Player Sent',
      `Transferred ${dispatchPlayer} to ${target?.serverName || dispatchTarget} via Velocity IPC bridge.`
    );
  };

  if (!config) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Network Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-obsidian-850 border border-obsidian-600 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Velocity Network Mesh</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                MODERN FORWARDING ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Zero-leak HMAC-SHA256 authenticated proxy routing and multi-server orchestration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Proxy Gateway:</span>
          <span className="text-emerald-400 font-bold bg-obsidian-900 px-3 py-1.5 rounded-lg border border-obsidian-700">
            0.0.0.0:{config.bindPort}
          </span>
        </div>
      </div>

      {/* Visual Network Topology Canvas */}
      <div className="rounded-2xl border border-obsidian-600 bg-obsidian-950 p-6 shadow-2xl relative overflow-hidden">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Interactive Server Routing Topology</span>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-4">
          {/* Velocity Master Gateway Node */}
          <div className="w-full lg:w-72 p-5 rounded-2xl bg-obsidian-850 border-2 border-emerald-500/40 shadow-sm flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Network className="w-7 h-7" />
            </div>
            <div>
              <div className="text-base font-bold text-white">{config.proxyName}</div>
              <div className="text-xs font-mono text-emerald-400">Gateway Proxy (Velocity 3.3.0)</div>
            </div>
            <div className="px-3 py-1 rounded-full bg-obsidian-900 border border-obsidian-700 text-xs font-mono text-slate-300">
              Port: {config.bindPort} | Forwarding: Modern
            </div>
          </div>

          {/* Connection Divider Arrow */}
          <div className="hidden lg:flex flex-col items-center gap-1 text-slate-500 font-mono text-xs">
            <div className="w-16 h-0.5 bg-emerald-500/40" />
            <ArrowRight className="w-5 h-5 text-emerald-400" />
            <span>HMAC Tunnel</span>
          </div>

          {/* Backend Servers Cluster */}
          <div className="w-full lg:flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.backendServers.map((backend) => (
              <div
                key={backend.serverId}
                className="p-4 rounded-xl bg-obsidian-850/90 border border-obsidian-600 hover:border-neon-cyan/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-white">
                    <Server className="w-4 h-4 text-neon-sky" />
                    <span>{backend.serverName}</span>
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      backend.isOnline
                        ? 'bg-neon-emerald shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                        : 'bg-slate-600'
                    }`}
                  />
                </div>

                <div className="space-y-1 text-xs font-mono text-slate-400">
                  <div>Internal: <span className="text-slate-200">{backend.internalAddress}:{backend.internalPort}</span></div>
                  <div>Players: <span className="text-neon-emerald font-bold">{backend.playerCount}</span></div>
                  {backend.isDefaultLobby && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-neon-sky/15 text-neon-sky border border-neon-sky/30">
                      Default Lobby
                    </span>
                  )}
                </div>

                <button
                  disabled={isSyncing === backend.serverId}
                  onClick={() => handleSyncSecret(backend.serverId, backend.serverName)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-obsidian-750 hover:bg-obsidian-700 border border-obsidian-600 text-slate-200 text-xs font-mono transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing === backend.serverId ? 'animate-spin' : ''}`} />
                  <span>Sync Secret</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secret Configuration & Cross-Server Player Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Modern Forwarding Secret Management */}
        <div className="p-5 rounded-2xl bg-obsidian-850 border border-obsidian-600 space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm">
            <Lock className="w-4 h-4 text-neon-cyan" />
            <span>Modern Forwarding Secret (velocity.toml)</span>
          </div>

          <p className="text-xs text-slate-400">
            This 256-bit cryptographic key verifies that player connections originate strictly from your Velocity proxy.
          </p>

          <div className="p-3 rounded-xl bg-obsidian-950 border border-obsidian-700 font-mono text-xs text-neon-cyan break-all select-all">
            {config.forwardingSecret}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRegenerateSecret}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-obsidian-750 hover:bg-obsidian-700 border border-obsidian-600 text-slate-200 text-xs font-mono transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Regenerate CSPRNG Key</span>
            </button>
          </div>
        </div>

        {/* Cross-Network Player Dispatcher */}
        <div className="p-5 rounded-2xl bg-obsidian-850 border border-obsidian-600 space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm">
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Cross-Server Player Dispatcher (/send)</span>
          </div>

          <p className="text-xs text-slate-400">
            Instantly transfer online players between linked backend servers without disconnecting their client session.
          </p>

          <form onSubmit={handleDispatchPlayer} className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Target Player</label>
              <input
                type="text"
                value={dispatchPlayer}
                onChange={(e) => setDispatchPlayer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-obsidian-900 border border-obsidian-700 text-xs font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Destination Server</label>
              <select
                value={dispatchTarget}
                onChange={(e) => setDispatchTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-obsidian-900 border border-obsidian-700 text-xs font-mono text-white outline-none cursor-pointer"
              >
                {config.backendServers.map((s) => (
                  <option key={s.serverId} value={s.serverId}>
                    {s.serverName} ({s.internalAddress}:{s.internalPort})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-obsidian-950 hover:bg-emerald-400 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Dispatch Player Transfer</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
