import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useServerStore, useUiStore } from '../../stores';
import { fileService } from '../../services';
import type { FileItem } from '../../types';
import {
  FolderTree,
  FileCode,
  Folder,
  Save,
  RefreshCw,
  FileText,
} from 'lucide-react';

export const FileManagerView: React.FC = () => {
  const { getActiveServer } = useServerStore();
  const { addToast } = useUiStore();
  const server = getActiveServer();

  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  useEffect(() => {
    loadDirectory(currentPath);
  }, [server?.id, currentPath]);

  const loadDirectory = async (path: string) => {
    if (!server) return;
    setIsLoadingFiles(true);
    try {
      const items = await fileService.listFiles(server.id, path);
      setFiles(items);
      // Auto-select server.properties or first editable file if none selected
      if (!selectedFile && items.length > 0) {
        const propFile = items.find((f) => f.name === 'server.properties') || items.find((f) => !f.isDirectory);
        if (propFile) {
          loadFile(propFile);
        }
      }
    } catch {
      addToast('File Error', 'Could not read directory contents', 'error');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const loadFile = async (item: FileItem) => {
    if (!server) return;
    setSelectedFile(item);
    try {
      const content = await fileService.readFile(server.id, item.path);
      setFileContent(content);
    } catch {
      addToast('Error', `Failed to open ${item.name}`, 'error');
    }
  };

  const handleSaveFile = async () => {
    if (!server || !selectedFile) return;
    setIsSaving(true);
    try {
      await fileService.writeFile(server.id, selectedFile.path, fileContent);
      addToast('File Saved', `Successfully written to ${selectedFile.name}`, 'success');
    } catch {
      addToast('Save Failed', `Could not write to ${selectedFile.name}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.properties')) return 'ini';
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) return 'yaml';
    if (filename.endsWith('.toml')) return 'ini';
    if (filename.endsWith('.json')) return 'json';
    return 'plaintext';
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top File Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-obsidian-850 border border-obsidian-600">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <FolderTree className="w-4 h-4 text-neon-cyan" />
          <span>Integrated File System & Configuration Editor</span>
          <span className="text-xs font-mono text-slate-400">({server?.name})</span>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-300 bg-obsidian-900 px-3 py-1 rounded border border-obsidian-700">
              {selectedFile.path}
            </span>
            <button
              disabled={isSaving}
              onClick={handleSaveFile}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neon-cyan text-obsidian-950 hover:bg-neon-sky text-xs font-bold uppercase tracking-wider transition-all shadow-neon-cyan disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save</span>
            </button>
          </div>
        )}
      </div>

      {/* Dual Pane Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[620px]">
        {/* Left Pane: File Tree Explorer */}
        <div className="lg:col-span-1 rounded-2xl bg-obsidian-950 border border-obsidian-600 p-3 flex flex-col justify-between overflow-hidden shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-obsidian-800 text-xs font-mono uppercase tracking-wider text-slate-400 px-2">
              <span>Root Filesystem</span>
              <button
                onClick={() => loadDirectory(currentPath)}
                className="p-1 hover:text-white rounded"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-2 space-y-1 overflow-y-auto max-h-[520px]">
              {isLoadingFiles ? (
                <div className="p-4 text-center text-xs text-slate-500 font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-1 text-neon-cyan" /> Loading...
                </div>
              ) : (
                files.map((item) => {
                  const isSelected = selectedFile?.path === item.path;
                return (
                  <div
                    key={item.path}
                    onClick={() => {
                      if (item.isDirectory) {
                        setCurrentPath(item.path);
                      } else {
                        loadFile(item);
                      }
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-mono cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                        : 'text-slate-300 hover:bg-obsidian-850 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.isDirectory ? (
                        <Folder className="w-4 h-4 text-neon-amber shrink-0" />
                      ) : (
                        <FileCode className="w-4 h-4 text-neon-sky shrink-0" />
                      )}
                      <span className="truncate">{item.name}</span>
                    </div>

                    {!item.isDirectory && (
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {(item.sizeBytes / 1024).toFixed(1)}K
                      </span>
                    )}
                  </div>
                );
              })
            )}
            </div>
          </div>

          <div className="pt-2 border-t border-obsidian-800 text-[11px] font-mono text-slate-500 px-2">
            Storage: Chrooted container volume
          </div>
        </div>

        {/* Right Pane: Monaco VS Code Editor */}
        <div className="lg:col-span-3 rounded-2xl bg-obsidian-950 border border-obsidian-600 overflow-hidden shadow-2xl flex flex-col">
          {selectedFile ? (
            <div className="flex-1 flex flex-col">
              {/* Editor Tab Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-obsidian-900 border-b border-obsidian-800 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-200">
                  <FileText className="w-3.5 h-3.5 text-neon-cyan" />
                  <span>{selectedFile.name}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Syntax: <span className="text-neon-sky">{getLanguage(selectedFile.name)}</span>
                </div>
              </div>

              {/* Monaco Component */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={getLanguage(selectedFile.name)}
                  theme="vs-dark"
                  value={fileContent}
                  onChange={(val) => setFileContent(val || '')}
                  options={{
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    lineNumbers: 'on',
                    renderWhitespace: 'selection',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
              Select a file from the explorer on the left to edit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
