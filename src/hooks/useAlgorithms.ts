// Custom hook to manage trading algorithms

import { useState, useCallback, useRef, useEffect } from 'react';
import { TradingAlgorithm, AlgoLogEntry, AlgoExecutionContext } from '@/types/algo';
import { ALGO_TEMPLATES, createAlgorithmFromTemplate, AlgorithmEngine } from '@/lib/trading-algorithms';
import { OrderDetails } from '@/types';

interface UseAlgorithmsReturn {
  algorithms: TradingAlgorithm[];
  runningAlgoId: string | null;
  activeAlgorithm: TradingAlgorithm | null;
  executionLogs: AlgoLogEntry[];
  startAlgorithm: (algoId: string) => void;
  stopAlgorithm: (algoId: string) => void;
  evaluatePrice: (currentPrice: number) => void;
  resetAlgorithms: () => void;
}

export function useAlgorithms(position: OrderDetails | null): UseAlgorithmsReturn {
  // Initialize algorithms from templates
  const [algorithms, setAlgorithms] = useState<TradingAlgorithm[]>(() =>
    ALGO_TEMPLATES.map(template => createAlgorithmFromTemplate(template))
  );
  
  const [runningAlgoId, setRunningAlgoId] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<AlgoLogEntry[]>([]);
  
  // Ref to hold the current engine instance
  const engineRef = useRef<AlgorithmEngine | null>(null);

  // Get the currently active algorithm
  const activeAlgorithm = algorithms.find(a => a.id === runningAlgoId) || null;

  // Handle algorithm updates from engine
  const handleAlgoUpdate = useCallback((updatedAlgo: TradingAlgorithm) => {
    setAlgorithms(prev => 
      prev.map(a => a.id === updatedAlgo.id ? updatedAlgo : a)
    );

    // If algorithm completed or errored, clear running state
    if (updatedAlgo.status === 'completed' || updatedAlgo.status === 'error' || updatedAlgo.status === 'cancelled') {
      setRunningAlgoId(null);
      engineRef.current = null;
    }
  }, []);

  // Handle log entries from engine
  const handleLogEntry = useCallback((entry: AlgoLogEntry) => {
    setExecutionLogs(prev => [...prev, entry]);
  }, []);

  // Start an algorithm
  const startAlgorithm = useCallback((algoId: string) => {
    if (!position) {
      console.error('Cannot start algorithm without a position');
      return;
    }

    // Stop any currently running algorithm
    if (engineRef.current) {
      engineRef.current.cancel();
    }

    // Find and reset the algorithm
    const algoIndex = algorithms.findIndex(a => a.id === algoId);
    if (algoIndex === -1) {
      console.error(`Algorithm ${algoId} not found`);
      return;
    }

    // Get fresh algorithm from template
    const template = ALGO_TEMPLATES.find(t => t.id === algoId);
    if (!template) {
      console.error(`Template ${algoId} not found`);
      return;
    }

    const freshAlgo = createAlgorithmFromTemplate(template);
    freshAlgo.status = 'running';
    freshAlgo.startedAt = new Date();

    // Update algorithms state
    setAlgorithms(prev => 
      prev.map(a => a.id === algoId ? freshAlgo : a)
    );

    // Create execution context
    const context: AlgoExecutionContext = {
      buyPrice: position.buy_price,
      currentPrice: position.buy_price, // Will be updated
      quantity: position.quantity,
      securityId: position.security_id,
      exchangeSegment: position.exchange_segment,
      productType: position.product_type,
      symbol: position.symbol,
    };

    // Create engine instance
    engineRef.current = new AlgorithmEngine(
      freshAlgo,
      context,
      handleAlgoUpdate,
      handleLogEntry
    );

    // Set running state
    setRunningAlgoId(algoId);
    setExecutionLogs([]); // Clear previous logs

    // Add initial log
    handleLogEntry({
      timestamp: new Date(),
      ruleId: 'system',
      message: `Started algorithm: ${freshAlgo.name}`,
      type: 'info',
    });
  }, [position, algorithms, handleAlgoUpdate, handleLogEntry]);

  // Stop an algorithm
  const stopAlgorithm = useCallback((algoId: string) => {
    if (engineRef.current && runningAlgoId === algoId) {
      engineRef.current.cancel();
      
      // Update algorithm state
      setAlgorithms(prev =>
        prev.map(a => {
          if (a.id === algoId) {
            return {
              ...a,
              status: 'cancelled' as const,
            };
          }
          return a;
        })
      );

      setRunningAlgoId(null);
      engineRef.current = null;

      handleLogEntry({
        timestamp: new Date(),
        ruleId: 'system',
        message: 'Algorithm cancelled by user',
        type: 'info',
      });
    }
  }, [runningAlgoId, handleLogEntry]);

  // Evaluate current price against algorithm rules
  const evaluatePrice = useCallback((currentPrice: number) => {
    if (engineRef.current && runningAlgoId) {
      engineRef.current.evaluate(currentPrice);
    }
  }, [runningAlgoId]);

  // Reset all algorithms to initial state
  const resetAlgorithms = useCallback(() => {
    // Stop any running algorithm
    if (engineRef.current) {
      engineRef.current.cancel();
      engineRef.current = null;
    }

    // Reset all algorithms from templates
    setAlgorithms(ALGO_TEMPLATES.map(template => createAlgorithmFromTemplate(template)));
    setRunningAlgoId(null);
    setExecutionLogs([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.cancel();
      }
    };
  }, []);

  // Reset algorithms when position changes (different security)
  const prevPositionRef = useRef<string | null>(null);
  useEffect(() => {
    const currentSecurityId = position?.security_id || null;
    
    if (prevPositionRef.current !== null && prevPositionRef.current !== currentSecurityId) {
      // Position changed, reset algorithms
      resetAlgorithms();
    }
    
    prevPositionRef.current = currentSecurityId;
  }, [position?.security_id, resetAlgorithms]);

  return {
    algorithms,
    runningAlgoId,
    activeAlgorithm,
    executionLogs,
    startAlgorithm,
    stopAlgorithm,
    evaluatePrice,
    resetAlgorithms,
  };
}
