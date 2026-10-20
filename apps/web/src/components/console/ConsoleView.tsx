import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useServerStore, useUiStore } from '../../stores';
import { telemetryService } from '../../services';
import type { TelemetryFrame } from '../../types';
import { Terminal as TerminalIcon, Send, Trash2, ArrowDownCircle, Cpu, Database, Gauge } from 'lucide-react';

export const ConsoleView: React.FC = () => {
  const { getActiveServer } = useServerStore();
  const { addToast } = useUiStore();
  const server = getActiveServer();
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const fitAddonInstance = useRef<FitAddon | null>(null);

  const [inputCommand, setInputCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [telemetry, setTelemetry] = useState<TelemetryFrame | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (!terminalRef.current || !server) return;

    // Initialize xterm
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      theme: {
        background: '#080a0f',
        foreground: '#e2e8f0',
        cursor: '#00f2fe',
        selectionBackground: 'rgba(0, 242, 254, 0.3)',
        black: '#111622',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#38bdf8',
        magenta: '#8b5cf6',
        cyan: '#00f2fe',
        white: '#f8fafc',
        brightBlack: '#475569',
        brightRed: '#f87171',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#a78bfa',
        brightCyan: '#67e8f9',
        brightWhite: '#ffffff',
      },
      convertEol: true,
      scrollback: 5000,
      disableStdin: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    fitAddonInstance.current = fitAddon;

    // Load initial logs
    telemetryService.getInitialLogs(server.id).then((logs) => {
      logs.forEach((log) => {
        term.writeln(log.data);
      });
    });

    // Subscribe to live console streams
    const unsubConsole = telemetryService.subscribeConsole(server.id, (msg) => {
      term.writeln(msg.data);
      if (autoScroll) {
        term.scrollToBottom();
      }
    });

    // Subscribe to live telemetry
    const unsubTelemetry = telemetryService.subscribeTelemetry(server.id, (frame) => {
      setTelemetry(frame);
    });

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch {
        // ignore layout resize quirks
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      unsubConsole();
      unsubTelemetry();
      window.removeEventListener('resize', handleResize);
      term.dispose();
      xtermInstance.current = null;
    };
  }, [server?.id, autoScroll]);

  const handleSendCommand = async (cmdToSend?: string) => {
    const cmd = cmdToSend !== undefined ? cmdToSend : inputCommand;
    if (!cmd.trim() || !server) return;

    try {
      await telemetryService.sendCommand(server.id, cmd);
      setCommandHistory((prev) => [cmd, ...prev]);
      setHistoryIndex(-1);
      setInputCommand('');
    } catch {
      addToast('Command Error', 'Failed to dispatch command to server process', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputCommand(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const prevIdx = historyIndex - 1;
        setHistoryIndex(prevIdx);
        setInputCommand(commandHistory[prevIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputCommand('');
      }
    }
  };

  const handleClearTerminal = () => {
    if (xtermInstance.current) {
      xtermInstance.current.clear();
      addToast('Terminal Cleared', 'Console buffer wiped');
    }
  };

  const quickCommands = ['tps', 'list', 'say Hello world!', 'time set day', 'weather clear'];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-obsidian-850 border border-obsidian-600">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <TerminalIcon className="w-4 h-4 text-neon-cyan" />
          <span>Interactive Server Terminal</span>
          <span className="text-xs font-mono text-slate-400">({server?.name})</span>
        </div>

        {/* Live Gauges Strip */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-obsidian-900 border border-obsidian-600">
            <Gauge className="w-3.5 h-3.5 text-neon-emerald" />
            <span className="text-slate-400">TPS:</span>
            <span className="text-neon-emerald font-bold">
              {telemetry ? telemetry.tps.toFixed(2) : server?.tps.toFixed(2) || '20.00'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-obsidian-900 border border-obsidian-600">
            <Database className="w-3.5 h-3.5 text-neon-sky" />
            <span className="text-slate-400">RAM:</span>
            <span className="text-neon-sky font-bold">
              {telemetry ? (telemetry.memoryUsageBytes / (1024 * 1024)).toFixed(0) : '0'} MB
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-obsidian-900 border border-obsidian-600">
            <Cpu className="w-3.5 h-3.5 text-neon-cyan" />
            <span className="text-slate-400">CPU:</span>
            <span className="text-neon-cyan font-bold">
              {telemetry ? `${telemetry.cpuUsagePercent.toFixed(1)}%` : '0%'}
            </span>
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition-colors ${
              autoScroll
                ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan'
                : 'bg-obsidian-800 border-obsidian-600 text-slate-400'
            }`}
            title="Toggle Auto-Scroll"
          >
            <ArrowDownCircle className="w-3 h-3" />
            <span>AutoScroll</span>
          </button>

          <button
            onClick={handleClearTerminal}
            className="p-1.5 rounded hover:bg-obsidian-750 text-slate-400 hover:text-white transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="rounded-xl border border-obsidian-600 bg-obsidian-950 p-3 shadow-2xl relative">
        <div
          ref={terminalRef}
          className="h-[520px] w-full overflow-hidden rounded-lg font-mono text-sm"
        />
      </div>

      {/* Quick Command Suggestion Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-slate-400">Quick Commands:</span>
        {quickCommands.map((qCmd) => (
          <button
            key={qCmd}
            onClick={() => handleSendCommand(qCmd)}
            className="px-2.5 py-1 rounded-lg bg-obsidian-800/80 hover:bg-obsidian-700 border border-obsidian-600 hover:border-neon-cyan/40 text-slate-300 hover:text-neon-cyan text-xs font-mono transition-all"
          >
            /{qCmd}
          </button>
        ))}
      </div>

      {/* Command Input Bar */}
      <div className="flex items-center gap-2 bg-obsidian-850 p-2 rounded-xl border border-obsidian-600 focus-within:border-neon-cyan/50 focus-within:shadow-neon-cyan transition-all">
        <span className="pl-3 font-mono text-neon-cyan font-bold">&gt;</span>
        <input
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a server command (e.g. /tps, /op SteveMine, /say Hello) or press Enter..."
          className="flex-1 bg-transparent px-2 py-2 text-sm font-mono text-white placeholder-slate-400 outline-none"
        />
        <button
          onClick={() => handleSendCommand()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neon-cyan text-obsidian-950 hover:bg-neon-sky font-semibold text-xs tracking-wider uppercase transition-all shadow-neon-cyan shrink-0 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
