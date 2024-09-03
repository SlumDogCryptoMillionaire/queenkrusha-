import ccxt from 'ccxt';
import { logInfo, logError } from './logger.js';
import fs from 'fs';
import path from 'path';

let client = null;

const OHLCV_FILE_PATH = path.join(process.cwd(), 'ohlcv_data.json');

export const initializeRestClient = (exchangeId = 'binanceusdm', options = { enableRateLimit: true }) => {
  try {
    client = new ccxt[exchangeId]({
      ...options,
      apiKey: '',
      secret: '',
    });
    logInfo(`Initialized REST client for ${exchangeId}`);
  } catch (error) {
    logError(`Failed to initialize REST client: ${error.message}`);
  }
};

// Fetch OHLCV data and log the number of candles downloaded and in file
export const fetchOHLCVData = async (symbol, timeframe, since = undefined) => {
  if (!client) {
    logError('REST client not initialized.');
    return [];
  }

  try {
    const limit = 1000;
    const ohlcv = await client.fetchOHLCV(symbol, timeframe, since, limit);
    logInfo(`Fetched ${ohlcv.length} new OHLCV candles for ${symbol}`);

    // Load existing data from file
    let existingData = [];
    if (fs.existsSync(OHLCV_FILE_PATH)) {
      const fileContent = fs.readFileSync(OHLCV_FILE_PATH, 'utf-8');
      existingData = JSON.parse(fileContent);
      logInfo(`OHLCV file contains ${existingData.length} candles.`);
    } else {
      logInfo('OHLCV file does not exist. Creating new file.');
    }

    // Merge new data with existing data
    const mergedData = [...existingData, ...ohlcv].sort((a, b) => a[0] - b[0]);

    // Write merged data back to file
    fs.writeFileSync(OHLCV_FILE_PATH, JSON.stringify(mergedData, null, 2), 'utf-8');
    return mergedData.map(candle => ({
      openTime: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    }));
  } catch (error) {
    logError(`Error fetching OHLCV data: ${error.message}`);
    return [];
  }
};

// Function to load OHLCV data from local file
export const loadLocalOHLCVData = () => {
  if (fs.existsSync(OHLCV_FILE_PATH)) {
    const fileContent = fs.readFileSync(OHLCV_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    logInfo(`Loaded ${data.length} OHLCV candles from file.`);
    return data;
  }
  return [];
};
