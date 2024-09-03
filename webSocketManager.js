import WebSocket from 'ws';
import { logInfo, logError } from './logger.js';

let currentCandles = {};  // Store OHLCV candles keyed by interval

const initializeCandles = (ohlcvData) => {
  ohlcvData.forEach(candle => {
    const candleTime = Math.floor(candle.openTime / 60000) * 60000;  // Round down to minute
    currentCandles[candleTime] = { ...candle };
  });
};

export const connectToWebSocket = (ohlcvData, updateVolumes) => {
  initializeCandles(ohlcvData);  // Initialize with existing OHLCV data

  const ws = new WebSocket('wss://fstream.binance.com/ws/btcusdt@trade');  // Public Binance Futures WebSocket stream for BTCUSDT trades

  ws.on('open', () => {
    console.log('WebSocket connection opened.');
  });

  ws.on('message', (data) => {
    try {
      const message = typeof data === 'string' ? data : data.toString('utf8');
      const trade = JSON.parse(message);  // Parse the JSON data

      if (trade && trade.e === 'trade' && trade.p && trade.q) {  // Validate trade event and relevant fields
        //console.log(`Trade: ${trade.s} - ${trade.p} - ${trade.q}`);
        updateVolumes(Number(trade.p) || 0, Number(trade.q) || 0);  // Ensure numbers are passed

        // Update OHLCV candles with trade data
        updateCandles(trade);
      } else {
        console.warn('Received invalid trade data:', trade);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed.');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
};

// Function to update OHLCV candles with new trade data
const updateCandles = (trade) => {
  const tradeTime = Math.floor(trade.T / 60000) * 60000;  // Round down to minute

  if (!currentCandles[tradeTime]) {
    // Create a new candle if it doesn't exist
    currentCandles[tradeTime] = {
      openTime: tradeTime,
      open: Number(trade.p),
      high: Number(trade.p),
      low: Number(trade.p),
      close: Number(trade.p),
      volume: Number(trade.q),
    };
  } else {
    // Update existing candle
    const candle = currentCandles[tradeTime];
    candle.high = Math.max(candle.high, Number(trade.p));
    candle.low = Math.min(candle.low, Number(trade.p));
    candle.close = Number(trade.p);
    candle.volume += Number(trade.q);
  }
};
