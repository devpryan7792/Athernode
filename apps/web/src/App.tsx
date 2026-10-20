import { useEffect } from 'react';
import { useServerStore, useUiStore } from './stores';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ServerOverview } from './components/dashboard/ServerOverview';
import { ConsoleView } from './components/console/ConsoleView';
import { AddonMarketplace } from './components/addons/AddonMarketplace';
import { PlayerManager } from './components/players/PlayerManager';
import { VelocityNetworkView } from './components/network/VelocityNetworkView';
import { FileManagerView } from './components/files/FileManagerView';
import { SchematicsView } from './components/schematics/SchematicsView';
import { ToastContainer } from './components/ui/ToastContainer';

export function App() {
  const { fetchServers } = useServerStore();
  const { activeTab } = useUiStore();

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col selection:bg-neon-cyan/30 selection:text-white">
      {/* Global Cluster Navigation Bar */}
      <Header />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Obsidian Collapsible Sidebar */}
        <Sidebar />

        {/* Dynamic Viewport Surface */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-obsidian-900/60">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <ServerOverview />}
            {activeTab === 'console' && <ConsoleView />}
            {activeTab === 'addons' && <AddonMarketplace />}
            {activeTab === 'players' && <PlayerManager />}
            {activeTab === 'network' && <VelocityNetworkView />}
            {activeTab === 'files' && <FileManagerView />}
            {activeTab === 'schematics' && <SchematicsView />}
          </div>
        </main>
      </div>

      {/* Real-time Glowing Status Toasts */}
      <ToastContainer />
    </div>
  );
}

export default App;
