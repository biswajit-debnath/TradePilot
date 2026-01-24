// API Route: Get All Open Positions (Options and Intraday Stocks)
import { NextRequest, NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';
import { getUserFromAuthHeader } from '@/lib/auth-middleware';
import { DHAN_CONFIG } from '@/config';

/**
 * Helper function to extract option type from symbol for MCX
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
  
  return null;
}

/**
 * Determine position category (Option or Stock)
 */
function getPositionCategory(position: { exchangeSegment: string }): 'OPTION' | 'STOCK' {
  if (['NSE_EQ', 'BSE_EQ'].includes(position.exchangeSegment)) {
    return 'STOCK';
  }
  return 'OPTION';
}

/**
 * Check if position is an option
 */
function isOptionPosition(position: any): boolean {
  if (['NSE_FNO', 'BSE_FNO'].includes(position.exchangeSegment)) {
    return ['CALL', 'PUT'].includes(position.drvOptionType || '');
  }
  
  if (position.exchangeSegment === 'MCX_COMM') {
    const symbol = position.tradingSymbol.toUpperCase();
    return symbol.includes('CE') || symbol.includes('PE');
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Extract user from Authorization header
    const authHeader = request.headers.get('Authorization');
    const user = getUserFromAuthHeader(authHeader);
    dhanApi.setUserContext(user || undefined);
    
    const positions = await dhanApi.getPositions();
    
    if (!positions || positions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No positions found',
      });
    }

    // Filter for open LONG positions (options or intraday stocks)
    const openPositions = positions.filter(
      (position: any) =>
        position.netQty > 0 && // Only long positions
        position.positionType !== 'CLOSED' &&
        (
          // Options in F&O or MCX
          (['NSE_FNO', 'BSE_FNO', 'MCX_COMM'].includes(position.exchangeSegment) && isOptionPosition(position)) ||
          // Intraday stocks in NSE/BSE EQ
          (['NSE_EQ', 'BSE_EQ'].includes(position.exchangeSegment) && position.productType === 'INTRADAY')
        )
    );

    if (openPositions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No open LONG positions found (options or intraday stocks)',
      });
    }

    // Map all positions to the standard format
    const mappedPositions = await Promise.all(
      openPositions.map(async (position: any) => {
        // Get the actual buy price from the last traded order for each position
        const lastOrder = await dhanApi.getLastTradedBuyOrder(position.securityId);
        const buyPrice = lastOrder?.price || position.buyAvg;
        
        const slTriggerPrice = buyPrice + DHAN_CONFIG.TP_OFFSET;
        const optionType = getOptionType(position);
        const positionCategory = getPositionCategory(position);

        return {
          position_id: position.securityId,
          symbol: position.tradingSymbol,
          category: positionCategory,
          option_type: optionType,
          strike_price: position.drvStrikePrice || 0,
          expiry_date: position.drvExpiryDate || '',
          quantity: position.netQty,
          buy_price: buyPrice,
          sl_trigger_price: slTriggerPrice,
          sl_offset: DHAN_CONFIG.TP_OFFSET,
          security_id: position.securityId,
          exchange_segment: position.exchangeSegment,
          product_type: position.productType,
          unrealized_profit: position.unrealizedProfit || 0,
          realized_profit: position.realizedProfit || 0,
        };
      })
    );

    // Sort positions: F&O first, then by security_id (desc)
    const sortedPositions = mappedPositions.sort((a, b) => {
      // F&O positions first
      const aIsFnO = ['NSE_FNO', 'BSE_FNO', 'MCX_COMM'].includes(a.exchange_segment);
      const bIsFnO = ['NSE_FNO', 'BSE_FNO', 'MCX_COMM'].includes(b.exchange_segment);
      
      if (aIsFnO && !bIsFnO) return -1;
      if (!aIsFnO && bIsFnO) return 1;
      
      // Within same category, sort by security_id (descending)
      return b.security_id.localeCompare(a.security_id);
    });

    return NextResponse.json({
      success: true,
      positions: sortedPositions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
