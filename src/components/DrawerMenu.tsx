import { ConnectionStatus } from '@/types';

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
