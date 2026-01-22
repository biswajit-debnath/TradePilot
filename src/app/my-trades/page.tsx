'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiService } from '@/services/api';
import { DhanOrder, TradeJournalEntry, TradeAnalytics, ConnectionStatus } from '@/types';
import Navbar from '@/components/Navbar';
import DrawerMenu from '@/components/DrawerMenu';
import HowItWorksModal from '@/components/HowItWorksModal';
import Alert from '@/components/Alert';

export default function MyTrades() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [orders, setOrders] = useState<DhanOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('today');
  const [customDate, setCustomDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'journal' | 'all-orders'>('journal');

  const showAlert = (message: string, type: 'success' | 'error' | 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const status = await apiService.verifyConnection();
      setConnectionStatus(status);
      if (!status.success) {
        showAlert('Failed to connect: ' + status.error, 'error');
      }
    } catch (error) {
      setConnectionStatus({ success: false, error: 'Connection error' });
      showAlert('Connection error', 'error');
    }
  };

  // Fetch orders and trades
  const fetchTrades = async () => {
    const refresh = isRefreshing;
    if (!refresh) {
      setIsLoading(true);
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      let response;
      
      // For today, use order book API; for historical dates, use trade history API
      if (dateFilter === 'today' || (dateFilter === 'custom' && customDate === today)) {
        // Fetch today's orders from order book
        response = await apiService.getOrderBook();
        if (response.success && response.orders) {
          setOrders(response.orders);
        } else {
          showAlert(response.error || 'Failed to fetch trades', 'error');
        }
      } else {
        // Fetch historical trades for past dates
        let fromDate: string;
        let toDate: string;
        
        if (dateFilter === 'custom' && customDate) {
          fromDate = customDate;
          toDate = customDate;
        } else if (dateFilter === 'week') {
          toDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Yesterday
          fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        } else if (dateFilter === 'month') {
          toDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Yesterday
          fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        } else {
          // All time - last 90 days
          toDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Yesterday
          fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
        
        response = await apiService.getTradeHistory(fromDate, toDate);
        
        if (response.success && response.trades) {
          console.log('📊 Raw Trade History Response:', response.trades);
          console.log('📊 Number of trades:', response.trades.length);
          
          // Group trades by orderId to consolidate multiple executions
          const orderMap = new Map<string, any>();
          
          response.trades.forEach((trade: any) => {
            const orderId = trade.orderId;
            
            if (!orderMap.has(orderId)) {
              // First trade for this order
              orderMap.set(orderId, {
                orderId: trade.orderId,
                dhanClientId: trade.dhanClientId,
                orderStatus: 'TRADED',
                transactionType: trade.transactionType,
                exchangeSegment: trade.exchangeSegment,
                productType: trade.productType,
                orderType: trade.orderType,
                validity: 'DAY',
                tradingSymbol: trade.tradingSymbol || trade.customSymbol,
                securityId: trade.securityId,
                quantity: trade.tradedQuantity,
                disclosedQuantity: 0,
                price: trade.tradedPrice,
                triggerPrice: 0,
                afterMarketOrder: false,
                boProfitValue: 0,
                boStopLossValue: 0,
                legName: '',
                createTime: trade.exchangeTime || trade.createTime || '',
                updateTime: trade.updateTime || '',
                exchangeTime: trade.exchangeTime || '',
                drvExpiryDate: trade.drvExpiryDate || null,
                drvOptionType: trade.drvOptionType || null,
                drvStrikePrice: trade.drvStrikePrice || 0,
                omsErrorCode: '',
                omsErrorDescription: '',
                filled: trade.tradedQuantity,
                averageTradedPrice: trade.tradedPrice,
                filledQty: trade.tradedQuantity,
                remainingQuantity: 0,
                cancelledQuantity: 0,
                algoId: '',
                correlationId: trade.orderId,
                totalValue: trade.tradedPrice * trade.tradedQuantity,
                tradeCount: 1,
              });
            } else {
              // Additional trade for same order - aggregate
              const existing = orderMap.get(orderId);
              const newQty = existing.quantity + trade.tradedQuantity;
              const newValue = existing.totalValue + (trade.tradedPrice * trade.tradedQuantity);
              
              existing.quantity = newQty;
              existing.filled = newQty;
              existing.filledQty = newQty;
              existing.totalValue = newValue;
              existing.averageTradedPrice = newValue / newQty;
              existing.price = newValue / newQty;
              existing.tradeCount++;
            }
          });
          
          const orders = Array.from(orderMap.values());
          
          console.log('📊 Grouped Orders:', orders);
          console.log('📊 Total Orders after grouping:', orders.length);
          setOrders(orders);
        } else {
          showAlert(response.error || 'Failed to fetch trades', 'error');
          setOrders([]);
        }
      }
    } catch (error) {
      showAlert('Error fetching trades', 'error');
      console.error('Error fetching trades:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      checkConnection(),
      fetchTrades(),
    ]);
  };

  useEffect(() => {
    fetchTrades();
  }, [dateFilter, customDate]);

  // Process trades into journal entries
  const journalEntries = useMemo(() => {
    const entries: TradeJournalEntry[] = [];

    // Filter only TRADED orders
    const tradedOrders = orders.filter(order => order.orderStatus === 'TRADED');

    console.log('📊 Total orders:', orders.length);
    console.log('📊 Traded orders:', tradedOrders.length);
    console.log('📊 Order statuses:', [...new Set(orders.map(o => o.orderStatus))]);

    // Group orders by symbol/securityId
    const ordersBySymbol = new Map<string, { buys: DhanOrder[]; sells: DhanOrder[] }>();
    
    tradedOrders.forEach(order => {
      const key = `${order.securityId}_${order.tradingSymbol}`;
      if (!ordersBySymbol.has(key)) {
        ordersBySymbol.set(key, { buys: [], sells: [] });
      }
      const group = ordersBySymbol.get(key)!;
      
      if (order.transactionType === 'BUY') {
        group.buys.push(order);
      } else if (order.transactionType === 'SELL') {
        group.sells.push(order);
      }
    });

    console.log('📊 Unique symbols:', ordersBySymbol.size);

    // Match BUY and SELL orders chronologically with quantity tracking
    ordersBySymbol.forEach((group, key) => {
      // Sort by time
      group.buys.sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());
      group.sells.sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());

      console.log(`📊 ${key}: ${group.buys.length} BUYs, ${group.sells.length} SELLs`);

      // Track remaining quantities for each order
      const buyQuantities = new Map<string, number>();
      const sellQuantities = new Map<string, number>();
      
      group.buys.forEach(order => buyQuantities.set(order.orderId, order.quantity));
      group.sells.forEach(order => sellQuantities.set(order.orderId, order.quantity));

      // Match orders - use FIFO (First In First Out) approach
      let buyIndex = 0;
      let sellIndex = 0;

      while (buyIndex < group.buys.length && sellIndex < group.sells.length) {
        const buyOrder = group.buys[buyIndex];
        const sellOrder = group.sells[sellIndex];
        
        const buyRemaining = buyQuantities.get(buyOrder.orderId) || 0;
        const sellRemaining = sellQuantities.get(sellOrder.orderId) || 0;

        if (buyRemaining === 0) {
          buyIndex++;
          continue;
        }

        if (sellRemaining === 0) {
          sellIndex++;
          continue;
        }

        // Check if SELL comes after BUY (chronologically valid)
        const buyTime = new Date(buyOrder.createTime).getTime();
        const sellTime = new Date(sellOrder.createTime).getTime();
        
        if (sellTime < buyTime) {
          // This SELL is before the current BUY, move to next SELL
          sellIndex++;
          continue;
        }

        // Match the quantities
        const matchedQty = Math.min(buyRemaining, sellRemaining);
        
        // Create journal entry for matched quantity
        const duration = calculateDuration(new Date(buyOrder.createTime), new Date(sellOrder.createTime));
        
        const entryPrice = buyOrder.averageTradedPrice || buyOrder.price;
        const exitPrice = sellOrder.averageTradedPrice || sellOrder.price;
        
        const profitLoss = (exitPrice - entryPrice) * matchedQty;
        const profitLossPercentage = ((exitPrice - entryPrice) / entryPrice) * 100;

        const category = buyOrder.drvOptionType && buyOrder.drvOptionType !== 'NA' ? 'OPTION' : 'STOCK';

        // Calculate lot number (assuming 1 lot = original quantity from first order)
        const lotSize = Math.min(...group.buys.map(o => o.quantity), ...group.sells.map(o => o.quantity));
        const lotNumber = matchedQty / lotSize;

        console.log(`✅ Matched trade: ${buyOrder.tradingSymbol} - Qty: ${matchedQty} (${lotNumber} lot${lotNumber > 1 ? 's' : ''}), Entry: ₹${entryPrice.toFixed(2)} @ ${new Date(buyOrder.createTime).toLocaleTimeString()}, Exit: ₹${exitPrice.toFixed(2)} @ ${new Date(sellOrder.createTime).toLocaleTimeString()}, P&L: ₹${profitLoss.toFixed(2)}`);

        entries.push({
          id: `${buyOrder.orderId}_${sellOrder.orderId}_${entries.length}`,
          symbol: buyOrder.tradingSymbol,
          category: category as 'OPTION' | 'STOCK',
          optionType: buyOrder.drvOptionType === 'CALL' || buyOrder.drvOptionType === 'PUT' 
            ? buyOrder.drvOptionType 
            : null,
          strikePrice: buyOrder.drvStrikePrice || 0,
          expiryDate: buyOrder.drvExpiryDate || '',
          entryTime: buyOrder.createTime,
          exitTime: sellOrder.createTime,
          entryPrice,
          exitPrice,
          quantity: matchedQty,
          profitLoss,
          profitLossPercentage,
          duration,
          buyOrderId: buyOrder.orderId,
          sellOrderId: sellOrder.orderId,
        });

        // Update remaining quantities
        buyQuantities.set(buyOrder.orderId, buyRemaining - matchedQty);
        sellQuantities.set(sellOrder.orderId, sellRemaining - matchedQty);

        // Move to next order if current is fully matched
        if (buyRemaining - matchedQty === 0) {
          buyIndex++;
        }
        if (sellRemaining - matchedQty === 0) {
          sellIndex++;
        }
      }

      // Log unmatched quantities
      group.buys.forEach(buyOrder => {
        const remaining = buyQuantities.get(buyOrder.orderId) || 0;
        if (remaining > 0) {
          console.log(`⚠️ Unmatched BUY quantity: ${remaining} of ${buyOrder.tradingSymbol} (Order: ${buyOrder.orderId})`);
        }
      });

      group.sells.forEach(sellOrder => {
        const remaining = sellQuantities.get(sellOrder.orderId) || 0;
        if (remaining > 0) {
          console.log(`⚠️ Unmatched SELL quantity: ${remaining} of ${sellOrder.tradingSymbol} (Order: ${sellOrder.orderId})`);
        }
      });
    });

    console.log('📊 Matched journal entries:', entries.length);

    // Sort by exit time (most recent first)
    return entries.sort((a, b) => 
      new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime()
    );
  }, [orders]);

  // Get unique symbols for filter
  const symbols = useMemo(() => {
    const uniqueSymbols = new Set<string>();
    journalEntries.forEach(entry => uniqueSymbols.add(entry.symbol));
    // Also add symbols from all orders
    orders.forEach(order => uniqueSymbols.add(order.tradingSymbol));
    return Array.from(uniqueSymbols).sort();
  }, [journalEntries, orders]);

  // Filter journal entries
  const filteredEntries = useMemo(() => {
    return journalEntries.filter(entry => {
      // Symbol filter
      if (selectedSymbol !== 'ALL' && entry.symbol !== selectedSymbol) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && entry.category !== selectedCategory) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const exitDate = new Date(entry.exitTime);
        const now = new Date();
        
        if (dateFilter === 'custom' && customDate) {
          // Match specific date
          const selectedDate = new Date(customDate);
          const exitDateOnly = new Date(exitDate.getFullYear(), exitDate.getMonth(), exitDate.getDate());
          const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          
          if (exitDateOnly.getTime() !== selectedDateOnly.getTime()) return false;
        } else {
          const daysDiff = Math.floor((now.getTime() - exitDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dateFilter === 'today' && daysDiff > 0) return false;
          if (dateFilter === 'week' && daysDiff > 7) return false;
          if (dateFilter === 'month' && daysDiff > 30) return false;
        }
      }

      return true;
    });
  }, [journalEntries, selectedSymbol, selectedCategory, dateFilter, customDate]);

  // Filter all orders (for All Orders view)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Symbol filter
      if (selectedSymbol !== 'ALL' && order.tradingSymbol !== selectedSymbol) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL') {
        const isOption = order.drvOptionType && order.drvOptionType !== 'NA';
        const category = isOption ? 'OPTION' : 'STOCK';
        if (category !== selectedCategory) {
          return false;
        }
      }

      // Date filter
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.createTime);
        const now = new Date();
        
        if (dateFilter === 'custom' && customDate) {
          // Match specific date
          const selectedDate = new Date(customDate);
          const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
          const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          
          if (orderDateOnly.getTime() !== selectedDateOnly.getTime()) return false;
        } else {
          const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dateFilter === 'today' && daysDiff > 0) return false;
          if (dateFilter === 'week' && daysDiff > 7) return false;
          if (dateFilter === 'month' && daysDiff > 30) return false;
        }
      }

      return true;
    });
  }, [orders, selectedSymbol, selectedCategory, dateFilter, customDate]);

  // Calculate analytics
  const analytics = useMemo((): TradeAnalytics => {
    const totalTrades = filteredEntries.length;
    const totalProfitLoss = filteredEntries.reduce((sum, entry) => sum + entry.profitLoss, 0);
    const winningTrades = filteredEntries.filter(entry => entry.profitLoss > 0);
    const losingTrades = filteredEntries.filter(entry => entry.profitLoss < 0);
    
    const totalProfit = winningTrades.reduce((sum, entry) => sum + entry.profitLoss, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, entry) => sum + entry.profitLoss, 0));
    
    const averageProfit = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    const largestWin = winningTrades.length > 0 
      ? Math.max(...winningTrades.map(t => t.profitLoss)) 
      : 0;
    const largestLoss = losingTrades.length > 0 
      ? Math.min(...losingTrades.map(t => t.profitLoss)) 
      : 0;

    const totalBuyVolume = filteredEntries.reduce((sum, entry) => sum + (entry.entryPrice * entry.quantity), 0);
    const totalSellVolume = filteredEntries.reduce((sum, entry) => sum + (entry.exitPrice * entry.quantity), 0);

    // Calculate total points gain/loss
    const totalPoints = filteredEntries.reduce((sum, entry) => sum + (entry.exitPrice - entry.entryPrice), 0);

    return {
      totalTrades,
      totalProfitLoss,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageProfit,
      averageLoss,
      winRate,
      profitFactor,
      largestWin,
      largestLoss,
      totalBuyVolume,
      totalSellVolume,
      totalPoints,
    };
  }, [filteredEntries]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-gray-900">
      <Navbar 
        connectionStatus={connectionStatus}
        isRefreshing={isRefreshing}
        hasPositionsOrOrders={orders.length > 0}
        onMenuClick={() => setIsDrawerOpen(true)}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />
      <DrawerMenu 
        isOpen={isDrawerOpen} 
        connectionStatus={connectionStatus}
        onClose={() => setIsDrawerOpen(false)}
        onHowItWorksClick={() => setShowHowItWorks(true)}
      />
      <HowItWorksModal 
        isOpen={showHowItWorks} 
        onClose={() => setShowHowItWorks(false)} 
      />

      {alert && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert message={alert.message} type={alert.type} />
        </div>
      )}

      <div className="container mx-auto px-4 py-6 pt-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Trade Journal</h1>
                <p className="text-gray-300">Track and analyze your trading performance</p>
              </div>
              {/* Screenshot Button */}
              <button
                onClick={async () => {
                  try {
                    const element = document.getElementById('trade-journal-content');
                    if (!element) {
                      showAlert('Content not found', 'error');
                      return;
                    }

                    // Use dom-to-image-more which has better CSS4 support
                    const domtoimage = await import('dom-to-image-more');
                    
                    showAlert('Capturing screenshot... ⏳', 'info');
                    
                    // Convert element to blob with transparent filter
                    const blob = await domtoimage.toBlob(element, {
                      quality: 0.95,
                      width: element.offsetWidth,
                      height: element.offsetHeight,
                      style: {
                        margin: '0',
                        padding: '0',
                      },
                    });
                    
                    // Copy to clipboard
                    await navigator.clipboard.write([
                      new ClipboardItem({ 'image/png': blob })
                    ]);
                    
                    showAlert('Screenshot copied to clipboard! 📸', 'success');
                  } catch (error) {
                    console.error('Screenshot error:', error);
                    showAlert('Failed to capture screenshot. Try again.', 'error');
                  }
                }}
                title="Copy Screenshot"
                className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-xl"
              >
                📸
              </button>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-gray-800/50 p-1 rounded-lg border border-gray-700">
              <button
                onClick={() => setViewMode('journal')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'journal'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                📊 Journal
              </button>
              <button
                onClick={() => setViewMode('all-orders')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'all-orders'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                📋 All Orders
              </button>
            </div>
          </div>
        </div>

        {/* Wrap Analytics and Content for Screenshot */}
        <div id="trade-journal-content" className="-mx-4" style={{ background: 'linear-gradient(to bottom right, rgb(17, 24, 39), rgb(30, 58, 138), rgb(17, 24, 39))', padding: '0 1rem' }}>
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-5 rounded-xl">
            <div className="text-gray-400 text-sm mb-1">Total Trades</div>
            <div className="text-2xl font-bold text-white">{analytics.totalTrades}</div>
            <div className="flex gap-3 mt-2 text-sm">
              <span className="text-green-400">W: {analytics.winningTrades}</span>
              <span className="text-red-400">L: {analytics.losingTrades}</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <div className="text-gray-400 text-sm mb-1">Total P&L</div>
            <div className={`text-2xl font-bold ${analytics.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₹{analytics.totalProfitLoss.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Profit Factor: {analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <div className="text-gray-400 text-sm mb-1">Win Rate</div>
            <div className="text-2xl font-bold text-white">{analytics.winRate.toFixed(1)}%</div>
            <div className="flex gap-3 mt-2 text-sm">
              <span className="text-green-400">Avg Win: ₹{analytics.averageProfit.toFixed(0)}</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <div className="text-gray-400 text-sm mb-1">Total Points</div>
            <div className={`text-2xl font-bold ${analytics.totalPoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {analytics.totalPoints >= 0 ? '+' : ''}{analytics.totalPoints.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Avg: {analytics.totalTrades > 0 ? (analytics.totalPoints / analytics.totalTrades).toFixed(2) : '0.00'} pts/trade
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-5 rounded-xl mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Symbol Filter */}
            <div className="flex-1 min-w-50">
              <label className="block text-gray-300 text-sm mb-2">Symbol</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Symbols</option>
                {symbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex-1 min-w-50">
              <label className="block text-gray-300 text-sm mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Types</option>
                <option value="OPTION">Options</option>
                <option value="STOCK">Stocks</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex-1 min-w-50">
              <label className="block text-gray-300 text-sm mb-2">Period</label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value as any);
                  if (e.target.value !== 'custom') {
                    setCustomDate('');
                  }
                }}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Date</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Custom Date Picker */}
            {dateFilter === 'custom' && (
              <div className="flex-1 min-w-50">
                <label className="block text-gray-300 text-sm mb-2">Select Date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={fetchTrades}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? '⟳' : '↻'} Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Trade Journal Table or All Orders Table */}
        {viewMode === 'journal' ? (
          <div className="glass-card rounded-xl overflow-hidden">
            <div id="trade-journal-table" className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Entry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Exit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Capital
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    P&L %
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Entry Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Exit Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-gray-400">
                      Loading trades...
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-gray-400">
                      No completed trades found
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{entry.symbol}</div>
                        {entry.category === 'OPTION' && (
                          <div className="text-xs text-gray-400">
                            {entry.strikePrice} {entry.optionType}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.category === 'OPTION' 
                            ? 'bg-purple-500/20 text-purple-300' 
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {entry.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white">₹{entry.entryPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-white">₹{entry.exitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-white">{entry.quantity}</td>
                      <td className="px-4 py-3 text-white font-medium">
                        ₹{(entry.entryPrice * entry.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${(entry.exitPrice - entry.entryPrice) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(entry.exitPrice - entry.entryPrice) >= 0 ? '+' : ''}{(entry.exitPrice - entry.entryPrice).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${entry.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ₹{entry.profitLoss.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${entry.profitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {entry.profitLossPercentage >= 0 ? '+' : ''}{entry.profitLossPercentage.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{entry.duration}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {formatDateTime(entry.entryTime)}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {formatDateTime(entry.exitTime)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        ) : (
          /* All Orders Table */
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 bg-gray-800/50 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">All Orders</h3>
                  <p className="text-sm text-gray-400">Showing {filteredOrders.length} orders</p>
                </div>
                <div className="text-sm text-gray-400">
                  <input
                    type="text"
                    placeholder="Search Order ID..."
                    onChange={(e) => {
                      const searchValue = e.target.value;
                      console.log('🔍 Searching for order ID:', searchValue);
                      const found = orders.find(o => o.orderId === searchValue);
                      if (found) {
                        console.log('✅ Found order:', found);
                      } else if (searchValue) {
                        console.log('❌ Order not found in data');
                      }
                    }}
                    className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Side
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Avg Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                        Loading orders...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isOption = order.drvOptionType && order.drvOptionType !== 'NA';
                      const category = isOption ? 'OPTION' : 'STOCK';
                      
                      return (
                        <tr key={order.orderId} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="text-white font-mono text-sm">{order.orderId}</div>
                            {order.correlationId && (
                              <div className="text-xs text-gray-500">{order.correlationId}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-white font-medium">{order.tradingSymbol}</div>
                            {isOption && (
                              <div className="text-xs text-gray-400">
                                {order.drvStrikePrice} {order.drvOptionType}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              category === 'OPTION' 
                                ? 'bg-purple-500/20 text-purple-300' 
                                : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              order.transactionType === 'BUY'
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {order.transactionType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white">{order.quantity}</td>
                          <td className="px-4 py-3 text-white">₹{order.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-white">
                            {order.averageTradedPrice > 0 ? `₹${order.averageTradedPrice.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.orderStatus === 'TRADED' 
                                ? 'bg-green-500/20 text-green-300'
                                : order.orderStatus === 'PENDING'
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : order.orderStatus === 'REJECTED' || order.orderStatus === 'CANCELLED'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300 text-sm">
                            {formatDateTime(order.createTime)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-3">Volume Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Buy Volume:</span>
                <span className="text-white font-medium">₹{analytics.totalBuyVolume.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Sell Volume:</span>
                <span className="text-white font-medium">₹{analytics.totalSellVolume.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-3">Average Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Average Profit:</span>
                <span className="text-green-400 font-medium">₹{analytics.averageProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Average Loss:</span>
                <span className="text-red-400 font-medium">₹{analytics.averageLoss.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-3">Best & Worst</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Largest Win:</span>
                <span className="text-green-400 font-medium">₹{analytics.largestWin.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Largest Loss:</span>
                <span className="text-red-400 font-medium">₹{analytics.largestLoss.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        </div>
        {/* End Screenshot Wrapper */}
      </div>
    </div>
  );
}

// Helper function to calculate duration between two dates
function calculateDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const hours = Math.floor(diffSecs / 3600);
  const minutes = Math.floor((diffSecs % 3600) / 60);
  const seconds = diffSecs % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Helper function to format date time
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
