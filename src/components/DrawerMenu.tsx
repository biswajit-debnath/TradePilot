import { ConnectionStatus } from '@/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DrawerMenuProps {
  isOpen: boolean;
  connectionStatus: ConnectionStatus | null;
  onClose: () => void;
  onHowItWorksClick: () => void;
}

export default function DrawerMenu({
  isOpen,
  connectionStatus,
  onClose,
  onHowItWorksClick,
}: DrawerMenuProps) {
  const pathname = usePathname();

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Drawer */}
      <div 
        className={`absolute left-0 top-0 h-full w-80 bg-gray-900 border-r border-gray-800 shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold gradient-text">Menu</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Client ID Section */}
          {connectionStatus?.success && (
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-gray-400">Connected</span>
              </div>
              <div className="text-sm text-white font-mono">
                ID: {connectionStatus.client_id}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="p-4">
          <nav className="space-y-2">
            {/* Home Link */}
            <Link
              href="/"
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                pathname === '/' 
                  ? 'bg-cyan-600/20 border border-cyan-500/30' 
                  : 'hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <div>
                <div className="text-sm font-medium text-white">Home</div>
                <div className="text-xs text-gray-400">Position & SL Management</div>
              </div>
            </Link>

            {/* Trade Live Link (REST API) */}
            <Link
              href="/trade-live"
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                pathname === '/trade-live' 
                  ? 'bg-cyan-600/20 border border-cyan-500/30' 
                  : 'hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <div>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  Trade Live (REST)
                  <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded font-bold">SECURE</span>
                </div>
                <div className="text-xs text-gray-400">1s updates (recommended)</div>
              </div>
            </Link>

            {/* Trade Live WebSocket Link */}
            <Link
              href="/trade-live-ws"
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                pathname === '/trade-live-ws' 
                  ? 'bg-cyan-600/20 border border-cyan-500/30' 
                  : 'hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  Trade Live (WebSocket)
                  <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded font-bold">REAL-TIME</span>
                </div>
                <div className="text-xs text-gray-400">Tick-by-tick updates</div>
              </div>
            </Link>

            {/* Algorithm Trading Link */}
            <Link
              href="/trade-algo"
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                pathname === '/trade-algo' 
                  ? 'bg-cyan-600/20 border border-cyan-500/30' 
                  : 'hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  Algorithm Trading
                  <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded font-bold">AUTO</span>
                </div>
                <div className="text-xs text-gray-400">Automated SL strategies</div>
              </div>
            </Link>

            <div className="border-t border-gray-800 my-3" />

            <button
              onClick={() => {
                onHowItWorksClick();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
            >
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-white">How It Works</div>
                <div className="text-xs text-gray-400">Learn about order types</div>
              </div>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
