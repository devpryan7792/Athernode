import React from 'react';
import { useUiStore } from '../../stores';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'neon-border-cyan';
        let bgIcon = <CheckCircle2 className="w-5 h-5 text-neon-cyan shrink-0" />;

        if (toast.type === 'error') {
          borderClass = 'neon-border-crimson';
          bgIcon = <XCircle className="w-5 h-5 text-neon-crimson shrink-0" />;
        } else if (toast.type === 'warning') {
          borderClass = 'border-neon-amber/50 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]';
          bgIcon = <AlertTriangle className="w-5 h-5 text-neon-amber shrink-0" />;
        } else if (toast.type === 'info') {
          borderClass = 'neon-border-cyan';
          bgIcon = <Info className="w-5 h-5 text-neon-sky shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl bg-obsidian-850/95 backdrop-blur-xl border ${borderClass} text-white shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 min-w-[340px] max-w-md`}
          >
            {bgIcon}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold tracking-wide text-slate-100">{toast.title}</div>
              {toast.description && <div className="text-xs text-slate-400 mt-0.5 truncate">{toast.description}</div>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-obsidian-700/80 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
