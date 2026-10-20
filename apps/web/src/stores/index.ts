import { create } from 'zustand';
import type { ServerSummary, UnifiedAddon } from '../types';
import { serverService } from '../services';

export type NavigationTab = 'dashboard' | 'console' | 'addons' | 'players' | 'files' | 'network' | 'schematics';

export interface ToastItem {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: number;
}

interface ServerStoreState {
  servers: ServerSummary[];
  activeServerId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchServers: () => Promise<void>;
  setActiveServerId: (id: string) => void;
  getActiveServer: () => ServerSummary | undefined;
}

interface UiStoreState {
  activeTab: NavigationTab;
  isSidebarCollapsed: boolean;
  selectedAddonForInstall: UnifiedAddon | null;
  toasts: ToastItem[];
  setActiveTab: (tab: NavigationTab) => void;
  toggleSidebar: () => void;
  openInstallModal: (addon: UnifiedAddon) => void;
  closeInstallModal: () => void;
  addToast: (title: string, description: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
}

export const useServerStore = create<ServerStoreState>((set, get) => ({
  servers: [],
  activeServerId: 'srv-paper-survival',
  isLoading: false,
  error: null,
  fetchServers: async () => {
    set({ isLoading: true, error: null });
    try {
      const list = await serverService.getServers();
      set({ servers: list, isLoading: false });
      if (!get().activeServerId && list.length > 0) {
        set({ activeServerId: list[0].id });
      }
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  setActiveServerId: (id: string) => set({ activeServerId: id }),
  getActiveServer: () => {
    const state = get();
    return state.servers.find((s) => s.id === state.activeServerId);
  },
}));

export const useUiStore = create<UiStoreState>((set) => ({
  activeTab: 'dashboard',
  isSidebarCollapsed: false,
  selectedAddonForInstall: null,
  toasts: [],
  setActiveTab: (tab: NavigationTab) => set({ activeTab: tab }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  openInstallModal: (addon: UnifiedAddon) => set({ selectedAddonForInstall: addon }),
  closeInstallModal: () => set({ selectedAddonForInstall: null }),
  addToast: (title: string, description: string, type = 'success') => {
    const id = Math.random().toString(36).substring(7);
    const newToast: ToastItem = { id, title, description, type, timestamp: Date.now() };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  removeToast: (id: string) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
