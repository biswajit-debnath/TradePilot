import { ConnectionStatus } from '@/types';
import Link from 'next/link';

interface NavbarProps {
  connectionStatus: ConnectionStatus | null;
  isRefreshing: boolean;
  hasPositionsOrOrders: boolean;
  onMenuClick: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  autoRefresh?: boolean;
  onToggleAutoRefresh?: () => void;
}

export default function Navbar({
  connectionStatus,
  isRefreshing,
  hasPositionsOrOrders,
  onMenuClick,
  onRefresh,
  isLoading,
  autoRefresh = false,
  onToggleAutoRefresh,
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <span className="text-2xl">✈️</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold gradient-text">TradePilot</h1>
                <p className="text-[10px] text-gray-400 -mt-0.5">Intelligent Trading</p>
              </div>
            </Link>
          </div>

          {/* Right Section - Menu & Actions */}
          <div className="flex items-center gap-3">
            {/* Live Trade Quick Link */}
            <Link 
              href="/trade-live-ws" 
              className="items-center gap-1.1 px-2 py-1 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 hover:border-green-500/50 transition-all group"
              title="Go to Live Trading"
            >
             
              <span className="text-xs font-medium text-green-400">Live</span>
            </Link>

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

            {/* Refresh Button with Auto-Refresh Toggle */}
            <div className="flex pl-1 items-center gap-1 bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
              {/* Manual Refresh Button */}
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="px-1 hover:bg-cyan-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
                title="Manual Refresh"
              >
                <svg 
                  className={`w-4 h-4 text-cyan-400 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}
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
              
              {/* Divider */}
              {onToggleAutoRefresh && (
                <>
                  <div className="w-px h-6 bg-gray-700"></div>
                  
                  {/* Auto-Refresh Toggle */}
                  <button
                    onClick={onToggleAutoRefresh}
                    className={`px-1 py-2 transition-all flex items-center gap-1.5 ${
                      autoRefresh 
                        ? 'bg-cyan-600/30 hover:bg-cyan-600/40' 
                        : 'hover:bg-gray-700/50'
                    }`}
                    title={autoRefresh ? 'Auto-refresh ON (Click to disable)' : 'Auto-refresh OFF (Click to enable)'}
                  >
                    <svg 
                      className={`w-4 h-4 ${autoRefresh ? 'text-cyan-400 animate-pulse' : 'text-gray-400'}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    <span className={`hidden md:inline text-xs font-medium ${autoRefresh ? 'text-cyan-400' : 'text-gray-400'}`}>
                      Auto
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
