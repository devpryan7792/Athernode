import React, { useCallback, useEffect, useState } from 'react';
import { useServerStore, useUiStore } from '../../stores';
import { schematicService } from '../../services';
import type { SchematicItem } from '../../types';
import {
  Layers,
  UploadCloud,
  Copy,
  Check,
  Trash2,
  Box,
  Palette,
} from 'lucide-react';

export const SchematicsView: React.FC = () => {
  const { getActiveServer } = useServerStore();
  const { addToast } = useUiStore();
  const server = getActiveServer();

  const [schematics, setSchematics] = useState<SchematicItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadSchematics = useCallback(async () => {
    if (!server) return;
    try {
      const list = await schematicService.listSchematics(server.id);
      setSchematics(list);
    } catch {
      addToast('Error', 'Failed to load schematics', 'error');
    }
  }, [server, addToast]);

  useEffect(() => {
    loadSchematics();
  }, [loadSchematics]);

  const handleCopyCommand = (name: string, id: string) => {
    navigator.clipboard.writeText(`//schem load ${name}`);
    setCopiedId(id);
    addToast('Command Copied', `//schem load ${name} ready to paste in Minecraft chat.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!server) return;
    await schematicService.deleteSchematic(server.id, id);
    addToast('Schematic Deleted', `Removed ${name} from disk`, 'warning');
    loadSchematics();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !server) return;
    const file = e.target.files[0];
    try {
      await schematicService.uploadSchematic(server.id, file);
      addToast('Upload Complete', `Successfully uploaded ${file.name}`);
      loadSchematics();
    } catch {
      addToast('Upload Failed', `Could not upload ${file.name}`, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-obsidian-850 border border-obsidian-600">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">WorldEdit & FAWE Schematics</h2>
            <p className="text-xs text-slate-400">
              Inspect 3D bounding dimensions, block palettes, and manage clipboard assets
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-obsidian-950 hover:bg-emerald-400 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
          <UploadCloud className="w-4 h-4" />
          <span>Upload Schematic</span>
          <input
            type="file"
            accept=".schem,.schematic"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Schematics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {schematics.map((schem) => (
          <div
            key={schem.id}
            className="p-5 rounded-2xl bg-obsidian-850 border border-obsidian-600 hover:border-obsidian-500 shadow-xl space-y-4 transition-all"
          >
            {/* Top Bar: Name + Format Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Box className="w-4 h-4 text-emerald-400" />
                  <span>{schem.name}</span>
                </h3>
                <div className="text-xs font-mono text-slate-400 mt-0.5">{schem.filename}</div>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                {schem.format}
              </span>
            </div>

            {/* 3D Metadata Stats */}
            <div className="grid grid-cols-3 gap-2 bg-obsidian-900 p-3 rounded-xl border border-obsidian-750 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Dimensions</span>
                <span className="text-white font-bold">
                  {schem.dimensions.x}×{schem.dimensions.y}×{schem.dimensions.z}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Total Blocks</span>
                <span className="text-neon-cyan font-bold">
                  {(schem.totalBlocks / 1000).toFixed(1)}k
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase">File Size</span>
                <span className="text-slate-200">
                  {(schem.fileSizeBytes / 1024).toFixed(0)} KB
                </span>
              </div>
            </div>

            {/* Block Palette Distribution */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-neon-sky" />
                  <span>Dominant Block Palette ({schem.paletteCount} Unique)</span>
                </span>
              </div>

              {/* Progress Distribution Bar */}
              <div className="w-full h-2.5 rounded-full bg-obsidian-950 overflow-hidden flex">
                {schem.dominantBlocks.map((b, idx) => (
                  <div
                    key={b.block}
                    className={`h-full ${
                      idx === 0
                        ? 'bg-emerald-400'
                        : idx === 1
                        ? 'bg-emerald-500'
                        : idx === 2
                        ? 'bg-emerald-600'
                        : 'bg-slate-600'
                    }`}
                    style={{ width: `${b.percentage}%` }}
                    title={`${b.block}: ${b.percentage}%`}
                  />
                ))}
              </div>

              {/* Palette Breakdown Legend */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono">
                {schem.dominantBlocks.map((b) => (
                  <span
                    key={b.block}
                    className="px-2 py-0.5 rounded bg-obsidian-800 border border-obsidian-700 text-slate-300"
                  >
                    {b.block.replace('minecraft:', '')}: <span className="text-neon-cyan">{b.percentage}%</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-obsidian-750 flex items-center justify-between gap-3">
              <button
                onClick={() => handleCopyCommand(schem.name, schem.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 border border-obsidian-600 hover:border-neon-cyan/40 text-slate-200 text-xs font-mono transition-colors"
              >
                {copiedId === schem.id ? (
                  <Check className="w-3.5 h-3.5 text-neon-emerald" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>//schem load {schem.name}</span>
              </button>

              <button
                onClick={() => handleDelete(schem.id, schem.name)}
                className="p-1.5 rounded-lg bg-obsidian-800 hover:bg-neon-crimson/20 text-slate-400 hover:text-neon-crimson transition-colors"
                title="Delete Schematic"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
