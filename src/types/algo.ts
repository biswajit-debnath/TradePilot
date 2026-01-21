// Type definitions for Trading Algorithms

export type AlgoStatus = 'idle' | 'running' | 'completed' | 'error' | 'cancelled';

export interface AlgoCondition {
  type: 'price_above' | 'price_below' | 'points_gain' | 'points_loss';
  value: number; // Points relative to buy price
  description: string;
}

export interface AlgoAction {
  type: 'place_sl_order' | 'place_sell_order' | 'cancel_sl_orders' | 'modify_sl_order';
  params: {
    offset?: number; // Points above/below buy price
    description: string;
  };
}

export interface AlgoRule {
  id: string;
  condition: AlgoCondition;
  action: AlgoAction;
  executed: boolean;
  executedAt?: Date;
}

export interface TradingAlgorithm {
  id: string;
  name: string;
  shortName: string;
  description: string;
  detailedDescription: string;
  rules: AlgoRule[];
  status: AlgoStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  executionLog: AlgoLogEntry[];
}

export interface AlgoLogEntry {
  timestamp: Date;
  ruleId: string;
  message: string;
  type: 'info' | 'action' | 'error' | 'success';
}

export interface AlgoExecutionContext {
  buyPrice: number;
  currentPrice: number;
  quantity: number;
  securityId: string;
  exchangeSegment: string;
  productType: string;
  symbol: string;
}

// Pre-defined algorithm templates
export interface AlgoTemplate {
  id: string;
  name: string;
  shortName: string;
  description: string;
  detailedDescription: string;
  createRules: () => AlgoRule[];
}
