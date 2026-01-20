import { PendingSLOrder, OrderDetails } from '@/types';

interface PendingOrdersCardProps {
  orders: PendingSLOrder[];
  lastOrder: OrderDetails | null;
  onCancelOrder: (orderId: string) => void;
}

export default function PendingOrdersCard({
  orders,
  lastOrder,
  onCancelOrder,
}: PendingOrdersCardProps) {
  return (
    <div className="glass-card rounded-xl p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 md:mb-5">
        <h2 className="text-lg md:text-xl font-semibold text-cyan-400">
          ⏳ Pending Orders {lastOrder && `for ${lastOrder.symbol}`}
        </h2>
        <span className="text-xs md:text-sm text-gray-500">
          {orders.length} order(s)
        </span>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-2 md:space-y-3">
          {orders.map((order) => {
            // Determine order category based on order_type
            const getOrderCategory = () => {
              if (order.order_type === 'STOP_LOSS_MARKET') return { label: 'SL-Market', color: 'text-green-400', bg: 'bg-green-500/20' };
              if (order.order_type === 'STOP_LOSS') return { label: 'SL-Limit', color: 'text-orange-400', bg: 'bg-orange-500/20' };
              if (order.order_type === 'MARKET') return { label: 'Market', color: 'text-blue-400', bg: 'bg-blue-500/20' };
              if (order.order_type === 'LIMIT') return { label: 'Limit', color: 'text-purple-400', bg: 'bg-purple-500/20' };
              return { label: order.order_type, color: 'text-gray-400', bg: 'bg-gray-500/20' };
            };
            
            const category = getOrderCategory();
            
            return (
              <div key={order.order_id} className="bg-black/30 p-3 md:p-4 rounded-xl">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                      <p className="font-semibold text-base md:text-lg truncate">{order.symbol || 'Unknown'}</p>
                      <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-semibold shrink-0 ${category.bg} ${category.color}`}>
                        {category.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2 text-xs md:text-sm">
                      <p className="text-gray-400">
                        <span className="text-gray-500">Type:</span> {order.transaction_type}
                      </p>
                      <p className="text-gray-400">
                        <span className="text-gray-500">Quantity:</span> {order.quantity}
                      </p>
                      <p className="text-gray-400">
                        <span className="text-gray-500">
                          {order.order_type === 'LIMIT' ? 'Limit Price:' : 'Trigger:'}
                        </span>{' '}
                        <span className="text-yellow-400 font-semibold">
                          ₹{order.order_type === 'LIMIT' ? order.limit_price : order.trigger_price}
                        </span>
                      </p>
                      <p className="text-gray-400">
                        <span className="text-gray-500">Status:</span> {order.status}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onCancelOrder(order.order_id)}
                    className="ml-2 md:ml-4 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-lg bg-gradient-to-r from-red-500 to-red-700 hover:shadow-lg hover:shadow-red-500/30 transition font-semibold shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 md:py-8 text-gray-500">
          <p className="text-sm md:text-base">{lastOrder ? 'No pending orders for this position' : 'No position selected'}</p>
        </div>
      )}
    </div>
  );
}
