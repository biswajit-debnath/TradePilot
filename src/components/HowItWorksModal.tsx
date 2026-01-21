interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null;

  const slOffset = process.env.NEXT_PUBLIC_PP_OFFSET || '2';
  const slOffsetLoss = process.env.NEXT_PUBLIC_SL_OFFSET_LOSS || '20';
  const tpOffset = process.env.NEXT_PUBLIC_TP_OFFSET || '12';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold gradient-text">How It Works</h2>
              <p className="text-xs text-gray-400">Understanding order types and strategies</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* SL Limit +4 */}
          <div className="bg-black/20 rounded-lg p-4 border border-gray-800">
            <h3 className="text-base font-semibold text-green-400 mb-3 flex items-center gap-2">
              <span>🔻</span>
              <span>SL Limit +₹{slOffset}</span>
            </h3>
            <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
              <li>Places a LIMIT order at buy price + ₹{slOffset} (e.g., ₹100 → ₹10{slOffset})</li>
              <li>Executes immediately if price is above limit (locks quick profit/break-even)</li>
              <li>Use when price moves favorably - ensures minimum ₹{slOffset} gain</li>
            </ul>
          </div>

          {/* SL-Market Order */}
          <div className="bg-black/20 rounded-lg p-4 border border-gray-800">
            <h3 className="text-base font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <span>🛡️</span>
              <span>SL-Market -₹{slOffsetLoss}</span>
            </h3>
            <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
              <li>Places STOP_LOSS_MARKET order at buy price - ₹{slOffsetLoss} (e.g., ₹100 → trigger at ₹{100 - Number(slOffsetLoss)})</li>
              <li>Only triggers when price falls to trigger level, then executes at market</li>
              <li>Protects against large losses - limits max loss to ₹{slOffsetLoss} per share</li>
            </ul>
          </div>

          {/* TP Limit */}
          <div className="bg-black/20 rounded-lg p-4 border border-gray-800">
            <h3 className="text-base font-semibold text-cyan-400 mb-3 flex items-center gap-2">
              <span>🎯</span>
              <span>TP Limit +₹{tpOffset}</span>
            </h3>
            <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
              <li>Places LIMIT order at buy price + offset (adjustable with +/- buttons)</li>
              <li>Executes when price reaches target (e.g., ₹100 → ₹{100 + Number(tpOffset)} for +₹{tpOffset} offset)</li>
              <li>Books profit automatically - great for scalping and targets</li>
            </ul>
          </div>

          {/* Important Notes */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <p className="text-cyan-300 font-semibold mb-3 flex items-center gap-2">
              <span>⚡</span>
              <span>Important:</span>
            </p>
            <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
              <li><strong>Single order policy:</strong> Only ONE order active at a time per position</li>
              <li>Clicking any button cancels existing order and places new one</li>
              <li>Refresh button resets TP offset to default (₹{tpOffset})</li>
              <li>Orders are position-specific using security ID matching</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
