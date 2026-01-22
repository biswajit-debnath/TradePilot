// Trading Algorithms - Core Logic and Templates

import { TradingAlgorithm, AlgoTemplate, AlgoRule, AlgoExecutionContext, AlgoLogEntry, AlgoStatus } from '@/types/algo';
import { apiService, PositionData } from '@/services/api';

// ============================================
// ALGORITHM TEMPLATES
// ============================================

export const ALGO_TEMPLATES: AlgoTemplate[] = [
  {
    id: 'trailing_sl_7_10',
    name: 'Trailing SL (7/10 Points)',
    shortName: 'TSL 7/10',
    description: 'Places SL at +2pts when price moves +7pts, sells at +10pts or places SL at -20pts if drops below buy price',
    detailedDescription: `
**Trailing Stop-Loss Algorithm (7/10 Points)**

This algorithm automatically manages your stop-loss based on price movement:

1. **When price moves +7 points or more above buy price:**
   - Places a Stop-Loss order 2 points ABOVE your buy price (locks in profit)

2. **When price moves +10 points or more above buy price:**
   - Places a SELL order to exit the position with profit
   - Cancels any existing SL orders

3. **When price drops 10 points or more below buy price:**
   - Places a Stop-Loss order 20 points BELOW your buy price (limits loss)

**Use Case:** Ideal for capturing profits while protecting against sudden reversals.
    `.trim(),
    createRules: () => [
      {
        id: 'rule_1_sl_at_plus_2',
        condition: {
          type: 'points_gain',
          value: 0.5,
          description: 'Price moves 1+ points above buy price',
        },
        action: {
          type: 'modify_sl_order',
          params: {
            offset: 0.2, // 0.5 points above buy price
            description: 'Cancel existing SL & Place SL order 0.5 points above buy price',
          },
        },
        executed: false,
      },
      {
        id: 'rule_2_sell_at_plus_10',
        condition: {
          type: 'points_gain',
          value: 2,
          description: 'Price moves 2+ points above buy price',
        },
        action: {
          type: 'place_sell_order',
          params: {
            offset: 0, // Sell at market
            description: 'Sell position and cancel SL orders',
          },
        },
        executed: false,
      },
      {
        id: 'rule_3_sl_at_minus_20',
        condition: {
          type: 'points_loss',
          value: 0.5,
          description: 'Price drops 4+ points below buy price',
        },
        action: {
          type: 'modify_sl_order',
          params: {
            offset: -20, // 20 points below buy price
            description: 'Cancel existing SL & Place SL order 20 points below buy price',
          },
        },
        executed: false,
      },
    ],
  },
  {
    id: 'quick_profit_5_8',
    name: 'Quick Profit (5/8 Points)',
    shortName: 'QP 5/8',
    description: 'Quick profit booking at +8pts with trailing SL at +3pts when +5pts reached',
    detailedDescription: `
**Quick Profit Algorithm (5/8 Points)**

Designed for quick scalping trades:

1. **When price moves +5 points above buy price:**
   - Places a Stop-Loss order 3 points ABOVE your buy price

2. **When price moves +8 points above buy price:**
   - Places a SELL order to book profit
   - Cancels any existing SL orders

3. **When price drops 5 points below buy price:**
   - Places a Stop-Loss order 10 points BELOW buy price

**Use Case:** Best for quick scalping with smaller profit targets.
    `.trim(),
    createRules: () => [
      {
        id: 'rule_1_sl_at_plus_3',
        condition: {
          type: 'points_gain',
          value: 5,
          description: 'Price moves 5+ points above buy price',
        },
        action: {
          type: 'place_sl_order',
          params: {
            offset: 3,
            description: 'Place SL order 3 points above buy price',
          },
        },
        executed: false,
      },
      {
        id: 'rule_2_sell_at_plus_8',
        condition: {
          type: 'points_gain',
          value: 8,
          description: 'Price moves 8+ points above buy price',
        },
        action: {
          type: 'place_sell_order',
          params: {
            offset: 0,
            description: 'Sell position at market',
          },
        },
        executed: false,
      },
      {
        id: 'rule_3_sl_at_minus_10',
        condition: {
          type: 'points_loss',
          value: 5,
          description: 'Price drops 5+ points below buy price',
        },
        action: {
          type: 'place_sl_order',
          params: {
            offset: -10,
            description: 'Place SL order 10 points below buy price',
          },
        },
        executed: false,
      },
    ],
  },
  {
    id: 'aggressive_trail_15_20',
    name: 'Aggressive Trail (15/20 Points)',
    shortName: 'AT 15/20',
    description: 'For larger moves - SL at +10pts when +15pts reached, sells at +20pts',
    detailedDescription: `
**Aggressive Trailing Algorithm (15/20 Points)**

For trades expecting larger price movements:

1. **When price moves +15 points above buy price:**
   - Places a Stop-Loss order 10 points ABOVE your buy price

2. **When price moves +20 points above buy price:**
   - Places a SELL order to book profit
   - Cancels any existing SL orders

3. **When price drops 15 points below buy price:**
   - Places a Stop-Loss order 25 points BELOW buy price

**Use Case:** For swing trades or high volatility instruments.
    `.trim(),
    createRules: () => [
      {
        id: 'rule_1_sl_at_plus_10',
        condition: {
          type: 'points_gain',
          value: 15,
          description: 'Price moves 15+ points above buy price',
        },
        action: {
          type: 'place_sl_order',
          params: {
            offset: 10,
            description: 'Place SL order 10 points above buy price',
          },
        },
        executed: false,
      },
      {
        id: 'rule_2_sell_at_plus_20',
        condition: {
          type: 'points_gain',
          value: 20,
          description: 'Price moves 20+ points above buy price',
        },
        action: {
          type: 'place_sell_order',
          params: {
            offset: 0,
            description: 'Sell position at market',
          },
        },
        executed: false,
      },
      {
        id: 'rule_3_sl_at_minus_25',
        condition: {
          type: 'points_loss',
          value: 15,
          description: 'Price drops 15+ points below buy price',
        },
        action: {
          type: 'place_sl_order',
          params: {
            offset: -25,
            description: 'Place SL order 25 points below buy price',
          },
        },
        executed: false,
      },
    ],
  },
  {
    id: 'conservative_3_5',
    name: 'Conservative (3/5 Points)',
    shortName: 'CON 3/5',
    description: 'Low risk - SL at +1pt when +3pts reached, exits at +5pts',
    detailedDescription: `
**Conservative Algorithm (3/5 Points)**

Minimal risk approach for cautious traders:

1. **When price moves +3 points above buy price:**
   - Places a Stop-Loss order 1 point ABOVE your buy price

2. **When price moves +5 points above buy price:**
   - Places a SELL order to book small profit
   - Cancels any existing SL orders

3. **When price drops 3 points below buy price:**
   - Places a Stop-Loss order 5 points BELOW buy price

**Use Case:** For risk-averse trading or uncertain market conditions.
    `.trim(),
    createRules: () => [
      {
        id: 'rule_1_sl_at_plus_1',
        condition: {
          type: 'points_gain',
          value: 3,
          description: 'Price moves 3+ points above buy price',
        },
        action: {
          type: 'place_sl_order',
          params: {
            offset: 1,
            description: 'Place SL order 1 point above buy price',
          },
        },
        executed: false,
      },
      {
        id: 'rule_2_sell_at_plus_5',
        condition: {
          type: 'points_gain',
          value: 5,
          description: 'Price moves 5+ points above buy price',
        },
        action: {
          type: 'place_sell_order',
          params: {
            offset: 0,
            description: 'Sell position at market',
          },
        },
        executed: false,
      },
      {
        id: 'rule_3_sl_at_minus_5',
        condition: {
          type: 'points_loss',
          value: 3,
          description: 'Price drops 3+ points below buy price',
        },
        action: {
          type: 'place_sl_order',
          params: {
            offset: -5,
            description: 'Place SL order 5 points below buy price',
          },
        },
        executed: false,
      },
    ],
  },
];

// ============================================
// ALGORITHM ENGINE
// ============================================

export class AlgorithmEngine {
  private algorithm: TradingAlgorithm;
  private context: AlgoExecutionContext;
  private onUpdate: (algo: TradingAlgorithm) => void;
  private onLog: (entry: AlgoLogEntry) => void;

  constructor(
    algorithm: TradingAlgorithm,
    context: AlgoExecutionContext,
    onUpdate: (algo: TradingAlgorithm) => void,
    onLog: (entry: AlgoLogEntry) => void
  ) {
    this.algorithm = { ...algorithm };
    this.context = context;
    this.onUpdate = onUpdate;
    this.onLog = onLog;
  }

  /**
   * Check and execute algorithm rules based on current price
   */
  async evaluate(currentPrice: number): Promise<void> {
    if (this.algorithm.status !== 'running') {
      console.log('⚠️ Algorithm not running, status:', this.algorithm.status);
      return;
    }

    // Update context with current price
    this.context.currentPrice = currentPrice;

    const pointsFromBuy = currentPrice - this.context.buyPrice;
    console.log(`📊 Evaluating price: ₹${currentPrice.toFixed(2)}, Points from buy: ${pointsFromBuy.toFixed(2)}`);

    for (const rule of this.algorithm.rules) {
      if (rule.executed) {
        console.log(`⏭️ Rule ${rule.id} already executed, skipping`);
        continue;
      }

      const shouldExecute = this.checkCondition(rule, pointsFromBuy);
      console.log(`🔍 Rule ${rule.id}: ${rule.condition.description} - Should execute: ${shouldExecute}`);

      if (shouldExecute) {
        console.log(`✅ Executing rule ${rule.id} - calling executeAction now...`);
        try {
          await this.executeAction(rule, currentPrice);
          console.log(`✅ Rule ${rule.id} executeAction completed`);
        } catch (err) {
          console.error(`❌ Error executing rule ${rule.id}:`, err);
        }
      }
    }

    // Check if all rules are executed
    const allExecuted = this.algorithm.rules.every(r => r.executed);
    if (allExecuted) {
      this.algorithm.status = 'completed';
      this.algorithm.completedAt = new Date();
      this.addLog(this.algorithm.rules[0].id, 'Algorithm completed - all rules executed', 'success');
      this.onUpdate({ ...this.algorithm });
    }
  }

  private checkCondition(rule: AlgoRule, pointsFromBuy: number): boolean {
    const { condition } = rule;

    console.log(`   🔎 Checking ${condition.type}: pointsFromBuy=${pointsFromBuy.toFixed(2)}, required=${condition.value}`);

    switch (condition.type) {
      case 'points_gain':
        const result = pointsFromBuy >= condition.value;
        console.log(`   📈 points_gain: ${pointsFromBuy.toFixed(2)} >= ${condition.value} = ${result}`);
        return result;
      case 'points_loss':
        return pointsFromBuy <= -condition.value;
      case 'price_above':
        return this.context.buyPrice + pointsFromBuy >= condition.value;
      case 'price_below':
        return this.context.buyPrice + pointsFromBuy <= condition.value;
      default:
        return false;
    }
  }

  private async executeAction(rule: AlgoRule, currentPrice: number): Promise<void> {
    const { action } = rule;

    console.log(`🚀 executeAction called for rule ${rule.id}, action type: ${action.type}`);

    try {
      this.addLog(rule.id, `Condition met: ${rule.condition.description}`, 'info');
      this.addLog(rule.id, `Executing: ${action.params.description}`, 'action');

      const positionData: PositionData = {
        symbol: this.context.symbol,
        security_id: this.context.securityId,
        exchange_segment: this.context.exchangeSegment,
        product_type: this.context.productType,
        quantity: this.context.quantity,
        buy_price: this.context.buyPrice,
      };

      console.log(`📦 Position data:`, positionData);

      switch (action.type) {
        case 'place_sl_order': {
          const triggerPrice = this.context.buyPrice + (action.params.offset || 0);
          
          // ⚠️ TESTING MODE - API call commented out
          const response = await apiService.placeStopLossMarketOrder({
            trigger_price: triggerPrice,
            position_data: positionData,
          });
          // const response = { success: true }; // Simulated response

          if (response.success) {
            this.addLog(rule.id, `✅ [TEST] SL order placed at ₹${triggerPrice.toFixed(2)}`, 'success');
          } else {
            this.addLog(rule.id, `❌ Failed to place SL order: ${response.error}`, 'error');
          }
          break;
        }

        case 'place_sell_order': {
          // First cancel any existing SL orders
          await this.cancelExistingSLOrders(rule.id);

          // ⚠️ TESTING MODE - API call commented out
          const response = await apiService.placeLimitOrder({
            offset: 0,
            is_tp: true,
            position_data: positionData,
          });
          // const response = { success: true }; // Simulated response

          if (response.success) {
            this.addLog(rule.id, `✅ [TEST] Sell order placed at ₹${currentPrice.toFixed(2)}`, 'success');
          } else {
            this.addLog(rule.id, `❌ Failed to place sell order: ${response.error}`, 'error');
          }
          break;
        }

        case 'cancel_sl_orders': {
          await this.cancelExistingSLOrders(rule.id);
          break;
        }

        case 'modify_sl_order': {
          // Cancel existing and place new
          await this.cancelExistingSLOrders(rule.id);
          const triggerPrice = this.context.buyPrice + (action.params.offset || 0);
          
          // ⚠️ TESTING MODE - API call commented out
          const response = await apiService.placeStopLossMarketOrder({
            trigger_price: triggerPrice,
            position_data: positionData,
          });
          // const response = { success: true }; // Simulated response

          if (response.success) {
            this.addLog(rule.id, `✅ [TEST] SL order modified to ₹${triggerPrice.toFixed(2)}`, 'success');
          } else {
            this.addLog(rule.id, `❌ Failed to modify SL order: ${response.error}`, 'error');
          }
          break;
        }
      }

      // Mark rule as executed
      rule.executed = true;
      rule.executedAt = new Date();
      this.onUpdate({ ...this.algorithm });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.addLog(rule.id, `❌ Error: ${errorMsg}`, 'error');
      this.algorithm.status = 'error';
      this.algorithm.error = errorMsg;
      this.onUpdate({ ...this.algorithm });
    }
  }

  private async cancelExistingSLOrders(ruleId: string): Promise<void> {
    try {
      // ⚠️ TESTING MODE - API calls commented out
      // const ordersResponse = await apiService.getPendingSLOrders();
      // if (ordersResponse.success && ordersResponse.orders) {
      //   const slOrders = ordersResponse.orders.filter(
      //     o => o.security_id === this.context.securityId && 
      //          (o.order_type === 'STOP_LOSS' || o.order_type === 'STOP_LOSS_MARKET')
      //   );

      //   for (const order of slOrders) {
      //     const cancelResponse = await apiService.cancelSLOrder(order.order_id);
      //     if (cancelResponse.success) {
      //       this.addLog(ruleId, `🗑️ Cancelled SL order ${order.order_id}`, 'info');
      //     }
      //   }
      // }
      
      this.addLog(ruleId, `🗑️ [TEST] Existing SL orders cancelled (if any)`, 'info');
    } catch (error) {
      this.addLog(ruleId, `⚠️ Warning: Could not cancel existing SL orders`, 'error');
    }
  }

  private addLog(ruleId: string, message: string, type: AlgoLogEntry['type']): void {
    const entry: AlgoLogEntry = {
      timestamp: new Date(),
      ruleId,
      message,
      type,
    };
    this.algorithm.executionLog.push(entry);
    this.onLog(entry);
  }

  cancel(): void {
    this.algorithm.status = 'cancelled';
    this.addLog('system', 'Algorithm cancelled by user', 'info');
    this.onUpdate({ ...this.algorithm });
  }

  /**
   * Manually execute a specific rule (for testing/manual intervention)
   */
  async manualExecuteRule(ruleId: string): Promise<void> {
    const rule = this.algorithm.rules.find(r => r.id === ruleId);
    if (!rule) {
      console.error(`Rule ${ruleId} not found`);
      return;
    }

    if (rule.executed) {
      console.log(`Rule ${ruleId} already executed`);
      this.addLog(ruleId, '⚠️ Rule already executed, skipping', 'info');
      return;
    }

    this.addLog(ruleId, '🔧 Manual trigger initiated', 'action');
    await this.executeAction(rule, this.context.currentPrice || this.context.buyPrice);
  }

  getAlgorithm(): TradingAlgorithm {
    return { ...this.algorithm };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function createAlgorithmFromTemplate(template: AlgoTemplate): TradingAlgorithm {
  return {
    id: template.id,
    name: template.name,
    shortName: template.shortName,
    description: template.description,
    detailedDescription: template.detailedDescription,
    rules: template.createRules(),
    status: 'idle',
    executionLog: [],
  };
}

export function getTemplateById(id: string): AlgoTemplate | undefined {
  return ALGO_TEMPLATES.find(t => t.id === id);
}
