import { ConnectionStatus } from '@/types';

interface NavbarProps {
  connectionStatus: ConnectionStatus | null;
  isRefreshing: boolean;
  hasPositionsOrOrders: boolean;
  onMenuClick: () => void;
  onRefresh: () => void;
  onExitAll: () => void;
  isLoading: boolean;
}

export default function Navbar({
  connectionStatus,
  isRefreshing,
  hasPositionsOrOrders,
  onMenuClick,
  onRefresh,
  onExitAll,
  isLoading,
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <span className="text-2xl">✈️</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold gradient-text">TradePilot</h1>
                <p className="text-[10px] text-gray-400 -mt-0.5">Intelligent Trading</p>
              </div>
            </div>
          </div>

          {/* Right Section - Menu & Actions */}
          <div className="flex items-center gap-3">
            {/* Hamburger Menu with Connection Dot */}
            <button
              onClick={onMenuClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all"
              title="Open Menu"
            >
              <div className={`w-2 h-2 rounded-full ${connectionStatus?.success ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
              title="Refresh All Data"
            >
              <svg 
                className={`w-5 h-5 text-cyan-400 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline text-sm font-medium text-cyan-400">
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>

            {/* Exit All Button - Only show if there are positions/orders */}
            {hasPositionsOrOrders && (
              <button
                onClick={onExitAll}
                disabled={isLoading || isRefreshing}
                className="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed text-red-400 hover:text-red-300"
                title="Exit All Positions & Cancel All Orders"
              >
                <span className="hidden sm:inline">⛔ Exit All</span>
                <span className="sm:hidden">⛔</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
