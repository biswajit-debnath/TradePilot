// API Route: Get Current Open Position (Options or Intraday Stocks)
import { NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';
import { DHAN_CONFIG } from '@/config';

/**
 * Helper function to extract option type from symbol for MCX
 * MCX options have CE (Call) or PE (Put) in their trading symbol
 */
function getOptionType(position: { drvOptionType: string | null; tradingSymbol: string; exchangeSegment: string }): 'CALL' | 'PUT' | null {
  // For NSE/BSE, use drvOptionType
  if (['NSE_FNO', 'BSE_FNO'].includes(position.exchangeSegment) && position.drvOptionType) {
    return position.drvOptionType as 'CALL' | 'PUT';
  }
  
  // For MCX, extract from trading symbol
  if (position.exchangeSegment === 'MCX_COMM') {
    const symbol = position.tradingSymbol.toUpperCase();
    if (symbol.includes('CE')) {
      return 'CALL';
    } else if (symbol.includes('PE')) {
      return 'PUT';
    }
  }
  
  // For stocks, no option type
  return null;
}

/**
 * Determine position category (Option or Stock)
 */
function getPositionCategory(position: { exchangeSegment: string; drvOptionType: string | null; tradingSymbol: string }): 'OPTION' | 'STOCK' {
  if (['NSE_EQ', 'BSE_EQ'].includes(position.exchangeSegment)) {
    return 'STOCK';
  }
  return 'OPTION';
}

export async function GET() {
  try {
    const position = await dhanApi.getLastOpenPosition();
    
    if (!position) {
      return NextResponse.json({
        success: false,
        error: 'No open LONG position found (options or intraday stocks)',
      });
    }

    // Get the actual buy price from the last traded order for THIS specific position
    // Pass securityId to ensure we get the order for the current position, not old orders
    const lastOrder = await dhanApi.getLastTradedBuyOrder(position.securityId);
    const buyPrice = lastOrder?.price || position.buyAvg;
    
    console.log(`📊 Position: ${position.tradingSymbol} (Security ID: ${position.securityId})`);
    console.log(`   Order Buy Price: ${lastOrder?.price || 'N/A'}`);
    console.log(`   Position Avg Price: ${position.buyAvg}`);
    console.log(`   Using: ${buyPrice} (from ${lastOrder?.price ? 'order' : 'position avg'})`);
    
    const slTriggerPrice = buyPrice + DHAN_CONFIG.SL_OFFSET;
    const optionType = getOptionType(position);
    const positionCategory = getPositionCategory(position);

    return NextResponse.json({
      success: true,
      position: {
        position_id: position.securityId, // Using securityId as identifier
        symbol: position.tradingSymbol,
        category: positionCategory,
        option_type: optionType,
        strike_price: position.drvStrikePrice || 0,
        expiry_date: position.drvExpiryDate || '',
        quantity: position.netQty, // Use net quantity
        buy_price: buyPrice,
        sl_trigger_price: slTriggerPrice,
        sl_offset: DHAN_CONFIG.SL_OFFSET,
        security_id: position.securityId,
        exchange_segment: position.exchangeSegment,
        product_type: position.productType,
        unrealized_profit: position.unrealizedProfit || 0,
        realized_profit: position.realizedProfit || 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
