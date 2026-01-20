// Dhan WebSocket Service for Live Market Feed
// Documentation: https://dhanhq.co/docs/v2/live-market-feed/

import { DHAN_CONFIG } from '@/config';

export interface TickerData {
  securityId: string;
  exchangeSegment: string;
  ltp: number;
  lastTradeTime: number;
}

export type FeedMode = 'TICKER' | 'QUOTE' | 'FULL';

export interface DhanWebSocketConfig {
  onConnect?: () => void;
  onDisconnect?: (reason?: string) => void;
  onError?: (error: Error) => void;
  onTickerUpdate?: (data: TickerData) => void;
  onReconnect?: (attempt: number) => void;
  feedMode?: FeedMode; // Default: 'QUOTE' for faster updates
}

// Feed Request Codes (from Dhan Annexure)
const FEED_REQUEST_CODE = {
  TICKER: 15,      // Subscribe to Ticker (LTP + Time)
  QUOTE: 17,       // Subscribe to Quote (Full trade data)
  FULL: 21,        // Subscribe to Full (Complete with market depth)
  DISCONNECT: 12,  // Disconnect WebSocket
};

// Feed Response Codes (from Dhan Annexure)
const FEED_RESPONSE_CODE = {
  TICKER: 2,        // Ticker packet response
  QUOTE: 4,         // Quote packet response
  PREV_CLOSE: 6,    // Previous close packet
  FULL: 8,          // Full packet response
  DISCONNECT: 50,   // Disconnection packet
};

// Exchange Segment Codes (from Dhan Annexure)
const EXCHANGE_SEGMENT_CODE: { [key: string]: number } = {
  'NSE_EQ': 0,
  'NSE_FNO': 1,
  'NSE_CURR': 2,
  'BSE_EQ': 3,
  'BSE_FNO': 4,
  'BSE_CURR': 5,
  'MCX_COMM': 6,
  'IDX_I': 13,
};

export class DhanWebSocketService {
  private ws: WebSocket | null = null;
  private config: DhanWebSocketConfig;
  private subscribedInstruments: Map<string, { exchangeSegment: string; securityId: string }> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private isIntentionalDisconnect = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private feedMode: FeedMode;

  constructor(config: DhanWebSocketConfig = {}) {
    this.config = config;
    this.feedMode = config.feedMode || 'QUOTE'; // Default to QUOTE for faster updates
  }

  /**
   * Connect to Dhan WebSocket for Live Market Feed
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const accessToken = DHAN_CONFIG.ACCESS_TOKEN;
        const clientId = DHAN_CONFIG.CLIENT_ID;

        if (!accessToken || accessToken === 'YOUR_ACCESS_TOKEN') {
          throw new Error('⚠️ Access token not configured. Please set NEXT_PUBLIC_DHAN_ACCESS_TOKEN in .env.local');
        }
        
        if (!clientId || clientId === 'YOUR_DHAN_CLIENT_ID') {
          throw new Error('⚠️ Client ID not configured. Please set NEXT_PUBLIC_DHAN_CLIENT_ID in .env.local');
        }

        // Construct WebSocket URL with query parameters
        const wsUrl = `wss://api-feed.dhan.co?version=2&token=${accessToken}&clientId=${clientId}&authType=2`;

        console.log('🔌 Connecting to Dhan WebSocket...');
        console.log('📍 Client ID:', clientId);
        console.log('🔑 Token (first 10 chars):', accessToken.substring(0, 10) + '...');
        
        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          this.isIntentionalDisconnect = false;
          
          // Start ping-pong mechanism (optional, as browser handles it automatically)
          this.startPingPong();

          if (this.config.onConnect) {
            this.config.onConnect();
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            this.handleBinaryMessage(event.data);
          } else if (typeof event.data === 'string') {
            // Handle text messages (might be error messages from server)
            console.log('📨 Text message from server:', event.data);
            try {
              const jsonData = JSON.parse(event.data);
              console.log('📨 Parsed JSON message:', jsonData);
            } catch {
              console.log('📨 Raw text message:', event.data);
            }
          }
        };

        this.ws.onerror = (event) => {
          console.error('❌ WebSocket error event:', event);
          console.error('❌ WebSocket readyState:', this.ws?.readyState);
          console.error('❌ WebSocket URL (first 50 chars):', wsUrl.substring(0, 50) + '...');
          
          if (this.config.onError) {
            this.config.onError(new Error('WebSocket error'));
          }
          reject(new Error('WebSocket connection error'));
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:');
          console.log('   - Code:', event.code);
          console.log('   - Reason:', event.reason || '(no reason provided)');
          console.log('   - Was clean:', event.wasClean);
          
          this.cleanup();

          if (this.config.onDisconnect) {
            this.config.onDisconnect(event.reason);
          }

          // Auto-reconnect if not intentional disconnect
          if (!this.isIntentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            if (this.config.onReconnect) {
              this.config.onReconnect(this.reconnectAttempts);
            }

            setTimeout(() => {
              this.connect().then(() => {
                // Re-subscribe to all instruments
                this.resubscribeAll();
              });
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };
      } catch (error) {
        console.error('❌ Failed to connect:', error);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to instruments for ticker data (LTP updates)
   * @param instruments - Array of instruments to subscribe
   * @param mode - Feed mode: TICKER (1s), QUOTE (faster), or FULL (fastest with depth)
   */
  subscribe(instruments: { exchangeSegment: string; securityId: string }[], mode?: FeedMode): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected. Cannot subscribe.');
      return;
    }

    // Use provided mode or instance feedMode
    const subscriptionMode = mode || this.feedMode;
    const requestCode = subscriptionMode === 'TICKER' 
      ? FEED_REQUEST_CODE.TICKER 
      : subscriptionMode === 'FULL'
      ? FEED_REQUEST_CODE.FULL
      : FEED_REQUEST_CODE.QUOTE; // Default to QUOTE

    console.log(`📊 Subscription Mode: ${subscriptionMode}`);
    console.log(`   TICKER = 1 second updates`);
    console.log(`   QUOTE = Faster updates with full trade data`);
    console.log(`   FULL = Fastest with market depth`);

    // Dhan allows max 100 instruments per subscription message
    const batchSize = 100;
    for (let i = 0; i < instruments.length; i += batchSize) {
      const batch = instruments.slice(i, i + batchSize);
      
      // Per Dhan documentation: ExchangeSegment should be STRING like "NSE_EQ", "MCX_COMM"
      const subscriptionMessage = {
        RequestCode: requestCode,
        InstrumentCount: batch.length,
        InstrumentList: batch.map(inst => ({
          ExchangeSegment: inst.exchangeSegment,  // STRING as per Dhan docs
          SecurityId: inst.securityId,
        })),
      };

      console.log('📤 Subscribing to instruments:', JSON.stringify(subscriptionMessage, null, 2));
      this.ws.send(JSON.stringify(subscriptionMessage));

      // Store subscribed instruments for re-subscription on reconnect
      batch.forEach(inst => {
        const key = `${inst.exchangeSegment}_${inst.securityId}`;
        this.subscribedInstruments.set(key, inst);
      });
    }
  }

  /**
   * Re-subscribe to all previously subscribed instruments
   */
  private resubscribeAll(): void {
    if (this.subscribedInstruments.size > 0) {
      const instruments = Array.from(this.subscribedInstruments.values());
      console.log('🔄 Re-subscribing to', instruments.length, 'instruments');
      this.subscribe(instruments);
    }
  }

  /**
   * Handle binary messages from WebSocket
   * Data format: Little Endian
   */
  private handleBinaryMessage(data: ArrayBuffer): void {
    const view = new DataView(data);

    try {
      // Parse Response Header (8 bytes)
      const feedResponseCode = view.getUint8(0);
      const messageLength = view.getUint16(1, true); // Little Endian
      const exchangeSegmentCode = view.getUint8(3);
      const securityId = view.getInt32(4, true); // Little Endian

      // Get exchange segment name from code
      const exchangeSegment = Object.keys(EXCHANGE_SEGMENT_CODE).find(
        key => EXCHANGE_SEGMENT_CODE[key] === exchangeSegmentCode
      ) || 'UNKNOWN';

      // Handle different packet types
      switch (feedResponseCode) {
        case FEED_RESPONSE_CODE.TICKER:
          this.handleTickerPacket(view, exchangeSegment, securityId.toString());
          break;

        case FEED_RESPONSE_CODE.QUOTE:
          // Quote packet contains more data - extract LTP from it
          this.handleQuotePacket(view, exchangeSegment, securityId.toString());
          break;

        case FEED_RESPONSE_CODE.FULL:
          // Full packet contains market depth - extract LTP from it
          this.handleFullPacket(view, exchangeSegment, securityId.toString());
          break;

        case FEED_RESPONSE_CODE.PREV_CLOSE:
          // Previous close data (optional to handle)
          console.log('📊 Previous close data received');
          break;

        case FEED_RESPONSE_CODE.DISCONNECT:
          const disconnectCode = view.getUint16(8, true);
          console.log('🔌 Disconnect message:', disconnectCode);
          break;

        default:
          console.log('📦 Unknown packet type:', feedResponseCode);
      }
    } catch (error) {
      console.error('❌ Error parsing binary message:', error);
    }
  }

  /**
   * Parse Ticker Packet (LTP + Last Trade Time)
   * Structure:
   * 0-8: Response Header
   * 9-12: Last Traded Price (float32)
   * 13-16: Last Trade Time (int32, EPOCH)
   */
  private handleTickerPacket(view: DataView, exchangeSegment: string, securityId: string): void {
    try {
      const ltp = view.getFloat32(8, true); // Offset 8 (after header), Little Endian
      const lastTradeTime = view.getInt32(12, true); // Offset 12, Little Endian

      const tickerData: TickerData = {
        securityId,
        exchangeSegment,
        ltp,
        lastTradeTime,
      };

      console.log('📈 Ticker Update:', tickerData);

      if (this.config.onTickerUpdate) {
        this.config.onTickerUpdate(tickerData);
      }
    } catch (error) {
      console.error('❌ Error parsing ticker packet:', error);
    }
  }

  /**
   * Parse Quote Packet (Full trade data - faster updates)
   * Structure:
   * 0-8: Response Header
   * 8-12: Last Traded Price (float32)
   * 12-16: Last Trade Time (int32, EPOCH)
   * ... (more fields available but we only need LTP)
   */
  private handleQuotePacket(view: DataView, exchangeSegment: string, securityId: string): void {
    try {
      const ltp = view.getFloat32(8, true); // Offset 8 (after header), Little Endian
      const lastTradeTime = view.getInt32(12, true); // Offset 12, Little Endian

      const tickerData: TickerData = {
        securityId,
        exchangeSegment,
        ltp,
        lastTradeTime,
      };

      console.log('📊 Quote Update (faster):', tickerData);

      if (this.config.onTickerUpdate) {
        this.config.onTickerUpdate(tickerData);
      }
    } catch (error) {
      console.error('❌ Error parsing quote packet:', error);
    }
  }

  /**
   * Parse Full Packet (Complete with market depth - fastest)
   * Structure:
   * 0-8: Response Header
   * 8-12: Last Traded Price (float32)
   * 12-16: Last Trade Time (int32, EPOCH)
   * ... (much more data including market depth)
   */
  private handleFullPacket(view: DataView, exchangeSegment: string, securityId: string): void {
    try {
      const ltp = view.getFloat32(8, true); // Offset 8 (after header), Little Endian
      const lastTradeTime = view.getInt32(12, true); // Offset 12, Little Endian

      const tickerData: TickerData = {
        securityId,
        exchangeSegment,
        ltp,
        lastTradeTime,
      };

      console.log('🚀 Full Update (fastest):', tickerData);

      if (this.config.onTickerUpdate) {
        this.config.onTickerUpdate(tickerData);
      }
    } catch (error) {
      console.error('❌ Error parsing full packet:', error);
    }
  }

  /**
   * Start ping-pong mechanism (optional, browser handles it automatically)
   */
  private startPingPong(): void {
    // Server sends ping every 10s, connection closes after 40s of no response
    // WebSocket in browsers automatically handles ping-pong, but we can track it
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Browser automatically responds to pings
        console.log('💓 WebSocket alive');
      }
    }, 10000);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    console.log('🛑 Disconnecting WebSocket (intentional)...');
    this.isIntentionalDisconnect = true;

    if (this.ws) {
      const state = this.ws.readyState;
      console.log('📊 WebSocket state:', ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][state]);
      
      if (state === WebSocket.OPEN) {
        // Send disconnect message to server
        const disconnectMessage = {
          RequestCode: FEED_REQUEST_CODE.DISCONNECT,
        };

        console.log('🔌 Sending disconnect message to server');
        try {
          this.ws.send(JSON.stringify(disconnectMessage));
        } catch (error) {
          console.error('❌ Error sending disconnect message:', error);
        }

        // Close connection after a brief delay
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('🔌 Closing WebSocket connection');
            this.ws.close(1000, 'Client disconnect');
          }
        }, 500);
      } else if (state === WebSocket.CONNECTING) {
        // If still connecting, close immediately when connection opens
        console.log('⚠️ WebSocket still connecting, will close when opened');
        this.ws.close();
      } else if (state === WebSocket.CLOSING) {
        console.log('⚠️ WebSocket already closing');
      } else {
        console.log('✅ WebSocket already closed');
      }
    }

    this.cleanup();
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    console.log('🧹 Cleaning up WebSocket resources');
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Note: We don't clear subscribedInstruments here for potential reconnection
    // Only clear if it's an intentional disconnect
    if (this.isIntentionalDisconnect) {
      console.log('🗑️ Clearing subscriptions (intentional disconnect)');
      this.subscribedInstruments.clear();
      this.ws = null;
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get number of subscribed instruments
   */
  getSubscribedCount(): number {
    return this.subscribedInstruments.size;
  }
}
