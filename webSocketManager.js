const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const BINANCE_WS_URL = 'wss://fstream.binance.com/ws';
const SYMBOL = 'btcusdt';
const OHLCV_FILE_PATH = path.join(__dirname, 'ohlcv_data.json');

// Function to connect to Binance WebSocket and handle trades
const connectToWebSocket = (ohlcvData, updateVolumes) => {
  const ws = new WebSocket(`${BINANCE_WS_URL}/${SYMBOL}@trade`);
  let currentCandle = {};
  let buyVolume = 0;  // Track buy volume
  let sellVolume = 0;  // Track sell volume

  ws.on('message', (message) => {
    const trade = JSON.parse(message);
    const tradeTime = trade.T;
    const price = parseFloat(trade.p);
    const volume = parseFloat(trade.q);
    const isBuyerMaker = trade.m;  // Indicates if the buyer is the market maker

    const minute = Math.floor(tradeTime / 60000) * 60000; // Round down to the nearest minute

    if (!currentCandle.openTime || currentCandle.openTime !== minute) {
      if (currentCandle.openTime) {
        // Push completed candle to ohlcvData and save to file
        ohlcvData.push(currentCandle);
        if (ohlcvData.length > 1000) ohlcvData.shift();
        fs.writeFileSync(OHLCV_FILE_PATH, JSON.stringify(ohlcvData), 'utf-8');
        
        // Update volumes after candle close
        updateVolumes(buyVolume, sellVolume);
        
        // Reset buy and sell volumes for the new candle
        buyVolume = 0;
        sellVolume = 0;
      }

      // Start new candle
      currentCandle = {
        openTime: minute,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volume,
      };
    } else {
      // Update the current candle
      currentCandle.high = Math.max(currentCandle.high, price);
      currentCandle.low = Math.min(currentCandle.low, price);
      currentCandle.close = price;
      currentCandle.volume += volume;
    }

    // Update buy and sell volumes
    if (isBuyerMaker) {
      sellVolume += volume;  // If buyer is maker, it's a sell
    } else {
      buyVolume += volume;  // Otherwise, it's a buy
    }
  });

  ws.on('error', (error) => console.error('WebSocket error:', error));
  ws.on('close', () => console.log('WebSocket connection closed.'));
};

module.exports = { connectToWebSocket };
