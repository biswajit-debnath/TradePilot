import { useState, useEffect, Fragment } from 'react';
import { OrderDetails } from '@/types';
// Settings modal for configuring field display
import LivePositionSettingsModal, { FieldConfig } from './LivePositionSettingsModal';

interface LivePositionCardProps {
  lastOrder: OrderDetails | null;
  currentPrice: number | null;
  gainLossPoints: number | null;
  gainLossPercentage: number | null;
  gainLossValue: number | null;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  isLiveUpdating: boolean;
  onRefreshPosition: () => void;
  onToggleLiveUpdate: () => void;
  onExitAll: () => void;
  isLoading: boolean;
}

// Default field configurations with order
const DEFAULT_FIELDS: FieldConfig[] = [
  // Position 1-4: Basic Info
  { id: 'symbol', label: 'Symbol', enabled: true, category: 'basic', order: 0 },
  { id: 'category', label: 'Category', enabled: false, category: 'basic', order: 1 },
  { id: 'quantity', label: 'Quantity', enabled: true, category: 'basic', order: 2 },
  { id: 'exchangeSegment', label: 'Exchange Segment', enabled: false, category: 'basic', order: 3 },
  
  // Position 5-8: Price & Option Info
  { id: 'buyPrice', label: 'Buy Price', enabled: true, category: 'price', order: 4 },
  { id: 'optionType', label: 'Option Type (CE/PE)', enabled: true, category: 'option', order: 5 },
  { id: 'strikePrice', label: 'Strike Price', enabled: true, category: 'option', order: 6 },
  { id: 'expiryDate', label: 'Expiry Date', enabled: false, category: 'option', order: 7 },
  { id: 'productType', label: 'Product Type', enabled: true, category: 'stock', order: 8 },
  
  // Position 9-13: Live Market Data
  { id: 'currentPrice', label: 'Current Price', enabled: true, category: 'live', order: 9 },
  { id: 'gainLossPoints', label: 'P&L Points', enabled: true, category: 'live', order: 10 },
  { id: 'gainLossPercentage', label: 'P&L Percentage', enabled: true, category: 'live', order: 11 },
  { id: 'gainLossValue', label: 'P&L Value', enabled: true, category: 'live', order: 12 },
  { id: 'lastUpdated', label: 'Last Updated', enabled: true, category: 'live', order: 13 },
];

export default function LivePositionCard({
  lastOrder,
  currentPrice,
  gainLossPoints,
  gainLossPercentage,
  gainLossValue,
  lastUpdated,
  isRefreshing,
  isLiveUpdating,
  onRefreshPosition,
  onToggleLiveUpdate,
  onExitAll,
  isLoading,
}: LivePositionCardProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [fields, setFields] = useState<FieldConfig[]>(() => {
    // Load from localStorage if available and merge with defaults
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('livePositionFields');
      if (saved) {
        try {
          const savedFields = JSON.parse(saved);
          
          // Merge saved fields with default fields to ensure new fields are included
          const mergedFields = DEFAULT_FIELDS.map(defaultField => {
            const savedField = savedFields.find((f: FieldConfig) => f.id === defaultField.id);
            // If field exists in saved config, use it; otherwise use default
            return savedField || defaultField;
          });
          
          // Add any saved fields that don't exist in defaults (for backwards compatibility)
          savedFields.forEach((savedField: FieldConfig) => {
            if (!mergedFields.find(f => f.id === savedField.id)) {
              mergedFields.push(savedField);
            }
          });
          
          return mergedFields;
        } catch {
          return DEFAULT_FIELDS;
        }
      }
    }
    return DEFAULT_FIELDS;
  });

  // Save to localStorage whenever fields change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('livePositionFields', JSON.stringify(fields));
    }
  }, [fields]);

  // One-time migration: ensure all default fields exist in current config
  useEffect(() => {
    const missingFields = DEFAULT_FIELDS.filter(
      defaultField => !fields.find(f => f.id === defaultField.id)
    );
    
    if (missingFields.length > 0) {
      console.log('🔄 Migrating configuration: Adding', missingFields.length, 'new fields');
      setFields(prev => [...prev, ...missingFields]);
    }
  }, []); // Run only once on mount

  const handleSaveFields = (newFields: FieldConfig[]) => {
    setFields(newFields);
  };

  const isFieldEnabled = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.enabled : true;
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Render field content based on field ID and order
  const renderFieldContent = (fieldId: string) => {
    if (!lastOrder) return null;

    switch (fieldId) {
      case 'symbol':
        return (
          <div className="bg-black/30 p-2 md:p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-0.5">Symbol</p>
            <p className="text-sm md:text-base font-semibold truncate">{lastOrder.symbol || '-'}</p>
          </div>
        );
      
      case 'category':
        return (
          <div className="bg-black/30 p-2 md:p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-0.5">Category</p>
            <p className="text-sm md:text-base font-semibold">
              {lastOrder.order_category === 'OPTION' ? (
                <span className="text-purple-400"><span className="hidden sm:inline">📊 </span>Option</span>
              ) : (
                <span className="text-blue-400"><span className="hidden sm:inline">📈 </span>Stock</span>
              )}
            </p>
          </div>
        );
      
      case 'quantity':
        return (
          <div className="bg-black/30 p-2 md:p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-0.5">Quantity</p>
            <p className="text-sm md:text-base font-semibold">{lastOrder.quantity || '-'}</p>
          </div>
        );
      
      case 'exchangeSegment':
        return (
          <div className="bg-black/30 p-2 md:p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-0.5">Exchange</p>
            <p className="text-sm md:text-base font-semibold">{lastOrder.exchange_segment}</p>
          </div>
        );
      
      case 'buyPrice':
        return (
          <div className="bg-black/30 p-2 md:p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-0.5">Buy Price</p>
            <p className="text-sm md:text-base font-semibold text-green-400">₹{lastOrder.buy_price?.toFixed(2)}</p>
          </div>
        );
      
      case 'optionType':
        if (lastOrder.order_category !== 'OPTION') return null;
        return (
          <div className="bg-black/30 p-2 md:p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-0.5">Type</p>
            <p className="text-sm md:text-base font-semibold">{lastOrder.option_type || '-'}</p>
          </div>
        );
      
      case 'strikePrice':
        if (lastOrder.order_category !== 'OPTION') return null;
        return (
          <div className="bg-black/30 p-2 md:p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-0.5">Strike Price</p>
            <p className="text-sm md:text-base font-semibold">₹{lastOrder.strike_price || '-'}</p>
          </div>
        );
      
      case 'expiryDate':
        if (lastOrder.order_category !== 'OPTION') return null;
        return (
          <div className="bg-black/30 p-2 md:p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-0.5">Expiry</p>
            <p className="text-sm md:text-base font-semibold">{formatDate(lastOrder.expiry_date)}</p>
          </div>
        );
      
      case 'productType':
        if (lastOrder.order_category !== 'STOCK') return null;
        return (
          <div className="bg-black/30 p-2 md:p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-0.5">Product Type</p>
            <p className="text-sm md:text-base font-semibold">{lastOrder.product_type}</p>
          </div>
        );
      
      case 'currentPrice':
        return (
          <div className="bg-black/40 p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-1">Current Price</p>
            <p className={`text-lg md:text-xl font-bold ${
              isLiveUpdating ? 'animate-pulse' : ''
            } ${
              isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-white'
            }`}>
              {currentPrice !== null ? `₹${currentPrice.toFixed(2)}` : '--'}
            </p>
          </div>
        );
      
      case 'gainLossPoints':
        return (
          <div className={`p-3 rounded-lg border-2 ${
            isProfit 
              ? 'bg-green-500/20 border-green-500/50 shadow-lg shadow-green-500/20' 
              : isLoss 
                ? 'bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20' 
                : 'bg-black/40 border-gray-600'
          }`}>
            <p className="text-gray-400 text-xs mb-1 font-semibold">P&L (Points) ⭐</p>
            <p className={`text-xl md:text-2xl font-bold ${
              isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-white'
            }`}>
              {gainLossPoints !== null ? (
                <>
                  {isProfit ? '+' : ''}{gainLossPoints.toFixed(2)}
                  <span className="text-sm ml-1">pts</span>
                </>
              ) : '--'}
            </p>
          </div>
        );
      
      case 'gainLossPercentage':
        return (
          <div className="bg-black/40 p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-1">P&L (%)</p>
            <p className={`text-lg md:text-xl font-bold ${
              isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-white'
            }`}>
              {gainLossPercentage !== null ? (
                <>
                  {isProfit ? '+' : ''}{gainLossPercentage.toFixed(2)}%
                </>
              ) : '--'}
            </p>
          </div>
        );
      
      case 'gainLossValue':
        return (
          <div className="bg-black/40 p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-1">Total P&L</p>
            <p className={`text-lg md:text-xl font-bold ${
              isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-white'
            }`}>
              {gainLossValue !== null ? (
                <>
                  {isProfit ? '+' : ''}₹{gainLossValue.toFixed(2)}
                </>
              ) : '--'}
            </p>
          </div>
        );
      
      case 'lastUpdated':
        return (
          <div className="bg-black/40 p-3 rounded-lg">
            <p className="text-gray-500 text-xs mb-1">Last Updated</p>
            <p className="text-sm md:text-base font-semibold text-cyan-400">
              {formatTime(lastUpdated)}
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  const isProfit = gainLossPoints !== null && gainLossPoints > 0;
  const isLoss = gainLossPoints !== null && gainLossPoints < 0;

  return (
    <div className="glass-card rounded-xl p-4 md:p-6 mb-4 md:mb-5">
      <LivePositionSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        fields={fields}
        onSave={handleSaveFields}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 md:mb-5">
        <div className="flex items-center gap-2 md:gap-3">
          <h2 className="text-lg md:text-xl font-semibold text-cyan-400">
            📊 Live Position
          </h2>
          
          {/* Settings Icon */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-cyan-500/50 transition-all group"
            title="Display Settings"
          >
            <svg className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors group-hover:rotate-45 transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          {/* Exit All Button - Small, placed with heading */}
          {lastOrder && (
            <button
              onClick={onExitAll}
              disabled={isLoading || isRefreshing}
              className="px-2 py-1 text-xs font-medium rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-red-400 hover:text-red-300"
              title="Exit Position & Cancel Orders"
            >
              ⛔ Exit
            </button>
          )}
        </div>
      </div>

      {lastOrder ? (
        <>
          {/* All Fields Grid - Unified display based on field order */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 md:mb-5">
            {fields
              .filter(field => field.enabled)
              .sort((a, b) => a.order - b.order)
              .map(field => (
                <Fragment key={field.id}>
                  {renderFieldContent(field.id)}
                </Fragment>
              ))
            }
          </div>
        </>
      ) : (
        <div className="text-center py-6 md:py-10 text-gray-500">
          <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm md:text-base">No open position found</p>
          <p className="text-xs md:text-sm mt-1">Buy an option or intraday stock to see live data</p>
        </div>
      )}
    </div>
  );
}
