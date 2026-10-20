import React, { useEffect, useState } from 'react';
import { useServerStore, useUiStore } from '../../stores';
import { playerService } from '../../services';
import type { PlayerData, InventorySlot } from '../../types';
import {
  Users,
  Shield,
  Compass,
  Heart,
  Zap,
  Activity,
  X,
  Eye,
  UserX,
  Ban,
  Sparkles,
  Layers,
} from 'lucide-react';

export const PlayerManager: React.FC = () => {
  const { getActiveServer } = useServerStore();
  const { addToast } = useUiStore();
  const server = getActiveServer();

  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'enderchest'>('inventory');
  const [hoveredSlot, setHoveredSlot] = useState<InventorySlot | null>(null);

  useEffect(() => {
    loadPlayers();
  }, [server?.id]);

  const loadPlayers = async () => {
    if (!server) return;
    try {
      const list = await playerService.getOnlinePlayers(server.id);
      setPlayers(list);
    } catch {
      addToast('Error', 'Failed to load player sessions', 'error');
    }
  };

  const handleKick = async (player: PlayerData) => {
    if (!server) return;
    await playerService.kickPlayer(server.id, player.uuid);
    addToast('Player Kicked', `${player.username} was kicked from the server.`, 'warning');
    loadPlayers();
    if (selectedPlayer?.uuid === player.uuid) setSelectedPlayer(null);
  };

  const handleBan = async (player: PlayerData) => {
    if (!server) return;
    await playerService.banPlayer(server.id, player.uuid);
    addToast('Player Banned', `${player.username} was permanently banned.`, 'error');
    loadPlayers();
    if (selectedPlayer?.uuid === player.uuid) setSelectedPlayer(null);
  };

  const handleToggleOp = async (player: PlayerData) => {
    if (!server) return;
    const isNowOp = await playerService.toggleOp(server.id, player.uuid);
    addToast(
      isNowOp ? 'Operator Granted' : 'Operator Revoked',
      `${player.username} is ${isNowOp ? 'now a server operator' : 'no longer an operator'}.`
    );
    loadPlayers();
  };

  // Helper to get slot item
  const getItemAtSlot = (slots: InventorySlot[], index: number) => {
    return slots.find((s) => s.slot === index);
  };

  const renderSlot = (slotIndex: number, isArmor = false, isOffhand = false) => {
    if (!selectedPlayer) return null;
    const pool = activeTab === 'inventory' ? selectedPlayer.inventory : selectedPlayer.enderChest;
    const item = getItemAtSlot(pool, slotIndex);

    return (
      <div
        key={slotIndex}
        onMouseEnter={() => item && setHoveredSlot(item)}
        onMouseLeave={() => setHoveredSlot(null)}
        className="mc-slot w-12 h-12 rounded-lg flex items-center justify-center relative cursor-pointer group transition-all"
      >
        {item ? (
          <>
            {/* Visual Icon */}
            <div className="text-xl select-none group-hover:scale-110 transition-transform">
              {item.id.includes('sword')
                ? '⚔️'
                : item.id.includes('pickaxe')
                ? '⛏️'
                : item.id.includes('apple')
                ? '🍏'
                : item.id.includes('elytra')
                ? '🪽'
                : item.id.includes('shulker')
                ? '📦'
                : item.id.includes('pearl')
                ? '🔮'
                : item.id.includes('totem')
                ? '🗿'
                : item.id.includes('helmet')
                ? '🪖'
                : item.id.includes('leggings') || item.id.includes('boots')
                ? '🛡️'
                : '📦'}
            </div>

            {/* Stack count badge */}
            {item.count > 1 && (
              <span className="absolute bottom-1 right-1 font-mono font-bold text-xs text-white bg-obsidian-950/80 px-1 rounded shadow">
                {item.count}
              </span>
            )}

            {/* Durability Bar */}
            {item.damage !== undefined && item.maxDamage && (
              <div className="absolute bottom-0.5 left-1 right-1 h-1 bg-obsidian-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neon-emerald"
                  style={{ width: `${Math.round(((item.maxDamage - item.damage) / item.maxDamage) * 100)}%` }}
                />
              </div>
            )}
          </>
        ) : (
          <span className="text-[10px] text-slate-600 font-mono">
            {isArmor ? 'ARM' : isOffhand ? 'OFF' : ''}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-obsidian-850 border border-obsidian-600">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-neon-violet/10 border border-neon-violet/30 text-neon-violet">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Player Sessions & Moderation</h2>
            <p className="text-xs text-slate-400">
              Live telemetry, coordinates, and NBT PlayerData inspector
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-neon-violet bg-neon-violet/10 border border-neon-violet/30 px-3 py-1.5 rounded-lg">
          Online: {players.length} Players
        </div>
      </div>

      {/* Players Table */}
      <div className="rounded-2xl border border-obsidian-600 bg-obsidian-850 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-obsidian-900 border-b border-obsidian-750 text-xs font-mono text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Player</th>
                <th className="px-5 py-3.5">Latency</th>
                <th className="px-5 py-3.5">Vitals</th>
                <th className="px-5 py-3.5">Dimension & Coords</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-750 font-medium">
              {players.map((player) => (
                <tr key={player.uuid} className="hover:bg-obsidian-800/60 transition-colors">
                  {/* Player & Avatar */}
                  <td className="px-5 py-4 flex items-center gap-3">
                    <img
                      src={player.avatarUrl}
                      alt={player.username}
                      className="w-9 h-9 rounded-lg bg-obsidian-900 border border-obsidian-600"
                    />
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{player.username}</span>
                        {player.isOp && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neon-amber/20 text-neon-amber border border-neon-amber/40">
                            OP
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{player.uuid.substring(0, 13)}...</div>
                    </div>
                  </td>

                  {/* Ping Latency */}
                  <td className="px-5 py-4 font-mono text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-neon-emerald" />
                      {player.pingMs} ms
                    </span>
                  </td>

                  {/* Health / Food / Level */}
                  <td className="px-5 py-4 font-mono text-xs">
                    <div className="flex items-center gap-3 text-slate-300">
                      <span className="flex items-center gap-1 text-neon-crimson">
                        <Heart className="w-3.5 h-3.5 fill-neon-crimson" />
                        {player.health}/20
                      </span>
                      <span className="flex items-center gap-1 text-neon-emerald">
                        <Zap className="w-3.5 h-3.5 fill-neon-emerald" />
                        Lvl {player.xpLevel}
                      </span>
                    </div>
                  </td>

                  {/* Coords & Dimension */}
                  <td className="px-5 py-4 font-mono text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <Compass className="w-3.5 h-3.5 text-neon-sky" />
                      <span>
                        [{player.position[0].toFixed(0)}, {player.position[1].toFixed(0)}, {player.position[2].toFixed(0)}]
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {player.dimension.replace('minecraft:', '')}
                    </div>
                  </td>

                  {/* Operator Toggle */}
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleOp(player)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                        player.isOp
                          ? 'bg-neon-amber/20 text-neon-amber border border-neon-amber/40'
                          : 'bg-obsidian-750 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{player.isOp ? 'Operator' : 'Member'}</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedPlayer(player)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 border border-neon-cyan/40 text-xs font-semibold transition-all shadow-neon-cyan"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect HUD</span>
                      </button>

                      <button
                        onClick={() => handleKick(player)}
                        className="p-1.5 rounded-lg bg-obsidian-750 hover:bg-neon-amber/20 text-slate-400 hover:text-neon-amber transition-colors"
                        title="Kick Player"
                      >
                        <UserX className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleBan(player)}
                        className="p-1.5 rounded-lg bg-obsidian-750 hover:bg-neon-crimson/20 text-slate-400 hover:text-neon-crimson transition-colors"
                        title="Ban Player"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VISUAL MINECRAFT INVENTORY HUD MODAL */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-obsidian-850 border border-obsidian-500 shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-obsidian-700 pb-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedPlayer.avatarUrl}
                  alt={selectedPlayer.username}
                  className="w-12 h-12 rounded-xl bg-obsidian-900 border border-obsidian-600"
                />
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{selectedPlayer.username}</span>
                    <span className="text-xs font-mono font-normal text-slate-400">
                      (NBT Live Memory)
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-300 mt-0.5">
                    <span className="text-neon-crimson">HP: {selectedPlayer.health}/20</span>
                    <span className="text-neon-amber">Food: {selectedPlayer.foodLevel}/20</span>
                    <span className="text-neon-emerald">XP: Level {selectedPlayer.xpLevel}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Switch between Inventory & Ender Chest */}
                <div className="flex items-center p-1 rounded-xl bg-obsidian-900 border border-obsidian-700">
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'inventory'
                        ? 'bg-neon-cyan text-obsidian-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Inventory
                  </button>
                  <button
                    onClick={() => setActiveTab('enderchest')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'enderchest'
                        ? 'bg-neon-violet text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ender Chest
                  </button>
                </div>

                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-obsidian-750 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Inventory HUD Grids */}
            <div className="p-6 rounded-2xl bg-obsidian-900/90 border border-obsidian-750 flex flex-col items-center justify-center space-y-6">
              {activeTab === 'inventory' ? (
                <>
                  {/* Armor & Offhand Row */}
                  <div className="flex items-center justify-between w-full max-w-lg px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 mr-2">Armor:</span>
                      {renderSlot(100, true)} {/* Helmet */}
                      {renderSlot(101, true)} {/* Chestplate */}
                      {renderSlot(102, true)} {/* Leggings */}
                      {renderSlot(103, true)} {/* Boots */}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 mr-2">Off-hand:</span>
                      {renderSlot(-106, false, true)}
                    </div>
                  </div>

                  {/* Main 27 Storage Slots (3 Rows of 9) */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      Main Storage
                    </div>
                    {[9, 18, 27].map((rowStart) => (
                      <div key={rowStart} className="flex gap-1.5">
                        {Array.from({ length: 9 }).map((_, i) => renderSlot(rowStart + i))}
                      </div>
                    ))}
                  </div>

                  {/* Hotbar (9 Slots) */}
                  <div className="space-y-1.5 pt-2 border-t border-obsidian-750">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      Hotbar (0-8)
                    </div>
                    <div className="flex gap-1.5">
                      {Array.from({ length: 9 }).map((_, i) => renderSlot(i))}
                    </div>
                  </div>
                </>
              ) : (
                /* Ender Chest (27 Slots) */
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-neon-violet flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>Ender Chest Storage (27 Slots)</span>
                  </div>
                  {[0, 9, 18].map((rowStart) => (
                    <div key={rowStart} className="flex gap-1.5">
                      {Array.from({ length: 9 }).map((_, i) => renderSlot(rowStart + i))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hovered Item Tooltip */}
            {hoveredSlot ? (
              <div className="p-4 rounded-xl bg-obsidian-900 border border-obsidian-700 space-y-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white tracking-wide">{hoveredSlot.displayName}</span>
                  <span className="text-xs font-mono text-slate-400">Count: {hoveredSlot.count}</span>
                </div>
                <div className="text-xs font-mono text-slate-400">{hoveredSlot.id}</div>

                {hoveredSlot.enchantments && hoveredSlot.enchantments.length > 0 && (
                  <div className="pt-1 space-y-0.5">
                    {hoveredSlot.enchantments.map((ench) => (
                      <div key={ench.id} className="text-xs font-mono text-neon-violet flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{ench.id} {ench.level}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 text-center text-xs font-mono text-slate-400">
                Hover any inventory slot to inspect NBT tags, lore, and enchantments.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
