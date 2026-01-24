// API Route: Get Pending Orders from TradePilot (SL, TP, Exit orders)
import { NextRequest, NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';
import { getUserFromAuthHeader } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Extract user from Authorization header
    const authHeader = request.headers.get('Authorization');
    const user = getUserFromAuthHeader(authHeader);
    dhanApi.setUserContext(user || undefined);
    
    const [orders, positions] = await Promise.all([
      dhanApi.getPendingSLOrders(),
      dhanApi.getPositions()
    ]);
    
    // Create a map of positions by securityId for quick lookup
    const positionMap = new Map();
    positions.forEach((pos: any) => {
      if (pos.securityId && pos.buyAvg && pos.netQty !== 0) {
        positionMap.set(pos.securityId, {
          buyPrice: pos.buyAvg,
          quantity: Math.abs(pos.netQty),
          tradingSymbol: pos.tradingSymbol
        });
      }
    });
    
    const formattedOrders = orders.map((order) => {
      const position = positionMap.get(order.securityId);
      
      // Calculate points and P&L if we have position data
      let points = null;
      let potentialPL = null;
      let buyPrice = null;
      
      if (position && order.transactionType === 'SELL') {
        buyPrice = position.buyPrice;
        // Points = Sell Price - Buy Price
        const sellPrice = order.triggerPrice || order.price;
        points = sellPrice - buyPrice;
        // P&L = Points × Quantity
        potentialPL = points * order.quantity;
      }
      
      return {
        order_id: order.orderId,
        symbol: order.tradingSymbol,
        quantity: order.quantity,
        trigger_price: order.triggerPrice,
        limit_price: order.price,
        order_type: order.orderType,
        transaction_type: order.transactionType,
        status: order.orderStatus,
        create_time: order.createTime,
        security_id: order.securityId,
        buy_price: buyPrice,
        points: points,
        potential_pl: potentialPL,
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
