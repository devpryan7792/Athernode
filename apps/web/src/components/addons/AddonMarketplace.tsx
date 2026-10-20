import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useServerStore, useUiStore } from '../../stores';
import { addonService } from '../../services';
import type { UnifiedAddon, AddonType, ModLoader } from '../../types';
import {
  Search,
  Download,
  Calendar,
  Check,
  Package,
  Layers,
  Puzzle,
  Boxes,
  Loader2,
  ShieldAlert,
  X,
} from 'lucide-react';

export const AddonMarketplace: React.FC = () => {
  const { getActiveServer } = useServerStore();
  const { addToast } = useUiStore();
  const server = getActiveServer();

  const [activeTab, setActiveTab] = useState<AddonType>('mod');
  const [searchQuery, setSearchQuery] = useState('');
  const [provider, setProvider] = useState<'all' | 'modrinth' | 'curseforge'>('all');
  const [selectedLoader, setSelectedLoader] = useState<ModLoader>(server?.engine || 'fabric');
  const [selectedVersion, setSelectedVersion] = useState<string>(server?.version || '1.21.4');

  const [addons, setAddons] = useState<UnifiedAddon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);

  // Dependency Resolution Modal State
  const [resolvingAddon, setResolvingAddon] = useState<UnifiedAddon | null>(null);

  useEffect(() => {
    loadAddons();
  }, [activeTab, provider, selectedLoader, selectedVersion]);

  const loadAddons = async () => {
    setIsLoading(true);
    try {
      const results = await addonService.searchAddons({
        type: activeTab,
        provider,
        loader: selectedLoader,
        gameVersion: selectedVersion,
        search: searchQuery,
      });
      setAddons(results);
    } catch {
      addToast('Search Failed', 'Could not load addon catalog', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAddons();
  };

  const handleInitiateInstall = (addon: UnifiedAddon) => {
    const version = addon.versions[0];
    const missingDeps = version?.dependencies.filter((d) => d.dependencyType === 'required' && !d.installed) || [];

    if (missingDeps.length > 0) {
      // Pop dependency resolution modal
      setResolvingAddon(addon);
    } else {
      // Direct install
      executeInstall(addon, false);
    }
  };

  const executeInstall = async (addon: UnifiedAddon, withDependencies: boolean) => {
    if (!server) return;
    setInstallingId(addon.id);
    setResolvingAddon(null);

    try {
      const version = addon.versions[0];
      const res = await addonService.installAddon(server.id, addon.id, version.versionId, withDependencies);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00f2fe', '#38bdf8', '#10b981'],
      });

      addToast(
        'Mod installed successfully',
        `Installed ${addon.title} ${version.versionNumber} (${res.installedFiles.length} file${res.installedFiles.length > 1 ? 's' : ''})`,
        'success'
      );

      // Reload addons to reflect installed version
      loadAddons();
    } catch {
      addToast('Installation Failed', `Failed to install ${addon.title}`, 'error');
    } finally {
      setInstallingId(null);
    }
  };

  const formatDownloads = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Category Tabs: Presets, Mods, Plugins, Datapacks */}
      <div className="flex items-center gap-2 border-b border-obsidian-600 pb-3">
        <button
          onClick={() => setActiveTab('preset')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'preset'
              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan'
              : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Presets & Modpacks</span>
        </button>

        <button
          onClick={() => setActiveTab('mod')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'mod'
              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan'
              : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Mods</span>
        </button>

        <button
          onClick={() => setActiveTab('plugin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'plugin'
              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan'
              : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800'
          }`}
        >
          <Puzzle className="w-4 h-4" />
          <span>Plugins</span>
        </button>

        <button
          onClick={() => setActiveTab('datapack')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'datapack'
              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan'
              : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Datapacks</span>
        </button>
      </div>

      {/* Filter Bar: Search, Provider, Version, Loader */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-obsidian-850 p-3 rounded-2xl border border-obsidian-600">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}s across Modrinth & CurseForge...`}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-obsidian-900 border border-obsidian-600 text-sm text-slate-200 placeholder-slate-400 outline-none focus:border-neon-cyan/50 focus:shadow-neon-cyan transition-all"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Provider Selector */}
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as 'all' | 'modrinth' | 'curseforge')}
            className="px-3 py-2 rounded-xl bg-obsidian-900 border border-obsidian-600 text-xs font-semibold text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Sources</option>
            <option value="modrinth">Modrinth</option>
            <option value="curseforge">CurseForge</option>
          </select>

          {/* Loader Selector */}
          <select
            value={selectedLoader}
            onChange={(e) => setSelectedLoader(e.target.value as ModLoader)}
            className="px-3 py-2 rounded-xl bg-obsidian-900 border border-obsidian-600 text-xs font-semibold text-slate-300 outline-none cursor-pointer uppercase"
          >
            <option value="fabric">Fabric</option>
            <option value="neoforge">NeoForge</option>
            <option value="forge">Forge</option>
            <option value="paper">Paper</option>
            <option value="purpur">Purpur</option>
            <option value="velocity">Velocity</option>
          </select>

          {/* Version Selector */}
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="px-3 py-2 rounded-xl bg-obsidian-900 border border-obsidian-600 text-xs font-semibold text-slate-300 outline-none cursor-pointer font-mono"
          >
            <option value="1.21.4">1.21.4</option>
            <option value="1.21.3">1.21.3</option>
            <option value="1.20.4">1.20.4</option>
            <option value="1.20.1">1.20.1</option>
          </select>
        </div>
      </div>

      {/* Addons Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
          <span className="text-sm font-mono">Querying Modrinth & CurseForge manifests...</span>
        </div>
      ) : addons.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-obsidian-850/50 rounded-2xl border border-obsidian-600">
          <p className="text-sm">No {activeTab}s found matching your current filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map((addon) => {
            const isInstalled = Boolean(addon.installedVersion);
            const isInstallingThis = installingId === addon.id;

            return (
              <div
                key={addon.id}
                className="flex flex-col justify-between p-5 rounded-2xl bg-obsidian-850 border border-obsidian-600 hover:border-obsidian-500 hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div>
                  {/* Top Bar: Icon + Title + Author */}
                  <div className="flex items-start gap-3.5 mb-3">
                    {addon.iconUrl ? (
                      <img
                        src={addon.iconUrl}
                        alt={addon.title}
                        className="w-12 h-12 rounded-xl bg-obsidian-900 border border-obsidian-600 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-obsidian-800 border border-obsidian-600 flex items-center justify-center text-neon-cyan shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-white truncate group-hover:text-neon-cyan transition-colors">
                          {addon.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate">by {addon.author}</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
                    {addon.summary}
                  </p>
                </div>

                {/* Footer Metadata & Install Action */}
                <div className="pt-3 border-t border-obsidian-750 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      {formatDownloads(addon.totalDownloads)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {addon.updatedAt}
                    </span>
                  </div>

                  {/* Install Button */}
                  {isInstalled ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neon-emerald/15 border border-neon-emerald/30 text-neon-emerald text-xs font-semibold font-mono">
                      <Check className="w-3.5 h-3.5" />
                      <span>v{addon.installedVersion}</span>
                    </div>
                  ) : (
                    <button
                      disabled={isInstallingThis}
                      onClick={() => handleInitiateInstall(addon)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neon-cyan text-obsidian-950 hover:bg-neon-sky text-xs font-bold tracking-wide uppercase transition-all shadow-neon-cyan disabled:opacity-50 cursor-pointer"
                    >
                      {isInstallingThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Installing...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Install</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TRANSITIVE DEPENDENCY RESOLUTION MODAL */}
      {resolvingAddon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-obsidian-850 border border-obsidian-500 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-neon-amber/15 border border-neon-amber/30 text-neon-amber">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Dependency Resolver</h3>
                  <p className="text-xs text-slate-400">
                    Additional required libraries detected for <span className="text-neon-cyan font-semibold">{resolvingAddon.title}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResolvingAddon(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-obsidian-750"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-obsidian-900 border border-obsidian-750 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Components to Install:
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-200 bg-obsidian-800 p-2.5 rounded-lg border border-obsidian-700">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-neon-cyan" />
                    <span>{resolvingAddon.title} (Target Mod)</span>
                  </span>
                  <span className="text-[11px] font-mono text-neon-cyan">v{resolvingAddon.versions[0]?.versionNumber}</span>
                </div>

                {resolvingAddon.versions[0]?.dependencies.map((dep) => (
                  <div
                    key={dep.projectId}
                    className="flex items-center justify-between text-xs font-medium text-slate-200 bg-obsidian-800 p-2.5 rounded-lg border border-obsidian-700"
                  >
                    <span className="flex items-center gap-2">
                      <Puzzle className="w-4 h-4 text-neon-sky" />
                      <span>{dep.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neon-amber/15 text-neon-amber border border-neon-amber/30">
                        Required
                      </span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Auto-Matched</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setResolvingAddon(null)}
                className="px-4 py-2.5 rounded-xl bg-obsidian-750 hover:bg-obsidian-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeInstall(resolvingAddon, true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon-cyan text-obsidian-950 hover:bg-neon-sky text-xs font-bold tracking-wider uppercase shadow-neon-cyan transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Install All Components</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
