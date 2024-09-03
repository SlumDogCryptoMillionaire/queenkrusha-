import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchOHLCVData } from './restClient.js';
import { logInfo, logError } from './logger.js';

// Simulate __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OHLCV_FILE_PATH = path.join(__dirname, 'ohlcv_data.json');
let ohlcvData = [];  // Initialize as an empty array

// Function to load or fetch OHLCV data
export const loadOHLCVData = async (symbol, timeframe = '1m') => {
  try {
    if (fs.existsSync(OHLCV_FILE_PATH)) {
      const fileContent = fs.readFileSync(OHLCV_FILE_PATH, 'utf-8');
      try {
        ohlcvData = JSON.parse(fileContent);
        console.log('Loaded OHLCV data from file.');

        // Validate and clean the data
        ohlcvData = ohlcvData.filter(candle => validateCandle(candle));

        // Ensure counter is accurate
        logInfo(`OHLCV file contains ${ohlcvData.length} candles.`);

        if (ohlcvData.length === 0) {
          console.warn('No valid OHLCV data in the file. Fetching new data...');
          ohlcvData = await fetchOHLCVData(symbol, timeframe);
          fs.writeFileSync(OHLCV_FILE_PATH, JSON.stringify(ohlcvData), 'utf-8');
          logInfo(`Fetched ${ohlcvData.length} new OHLCV candles for ${symbol}`);
        } else {
          // Calculate the number of missing candles
          await backfillMissingOHLCVData(symbol, timeframe);
        }

      } catch (error) {
        console.error('Error parsing OHLCV data from file:', error);
        ohlcvData = await fetchOHLCVData(symbol, timeframe);  // Fetch fresh data if parsing fails
        fs.writeFileSync(OHLCV_FILE_PATH, JSON.stringify(ohlcvData), 'utf-8');
        logInfo(`Fetched ${ohlcvData.length} new OHLCV candles for ${symbol}`);
      }
    } else {
      console.log('OHLCV file does not exist. Fetching new data...');
      ohlcvData = await fetchOHLCVData(symbol, timeframe);
      fs.writeFileSync(OHLCV_FILE_PATH, JSON.stringify(ohlcvData), 'utf-8');
      logInfo(`Fetched ${ohlcvData.length} new OHLCV candles for ${symbol}`);
    }
  } catch (error) {
    console.error('Error loading OHLCV data:', error);
    ohlcvData = [];  // Reset to an empty array if any error occurs
  }
  return ohlcvData;
};

// Function to calculate and backfill missing OHLCV data with API limit handling
const backfillMissingOHLCVData = async (symbol, timeframe) => {
  const lastCandle = ohlcvData[ohlcvData.length - 1];  // Get the last existing candle
  const currentTime = Date.now();
  
  // Calculate time difference in milliseconds
  const timeGap = currentTime - lastCandle.openTime;
  
  // Calculate the number of candles needed to fill the gap
  const candleDurationMs = 60000; // 1 minute in milliseconds for '1m' timeframe
  let candlesNeeded = Math.ceil(timeGap / candleDurationMs);

  console.log(`OHLCV data is missing ${candlesNeeded} candles. Fetching missing data...`);

  let totalFetched = 0;  // Initialize counter for total candles fetched

  while (candlesNeeded > 0) {
    const candlesToFetch = Math.min(candlesNeeded, 1000);  // Binance API limit of 1000 candles per request

    const fetchedData = await fetchOHLCVData(symbol, timeframe, lastCandle.openTime + candleDurationMs, candlesToFetch);
    if (fetchedData.length === 0) break;  // Break if no data is fetched, indicating no more data available

    // Append fetched data to existing OHLCV data
    ohlcvData = [...ohlcvData, ...fetchedData];
    fs.writeFileSync(OHLCV_FILE_PATH, JSON.stringify(ohlcvData, null, 2), 'utf-8');
    
    // Log the number of candles fetched
    logInfo(`Fetched ${fetchedData.length} candles to backfill OHLCV data.`);
    totalFetched += fetchedData.length;  // Update total fetched counter

    // Update the last candle and reduce the remaining candles needed
    lastCandle.openTime = fetchedData[fetchedData.length - 1].openTime;
    candlesNeeded -= candlesToFetch;
  }

  logInfo(`Total candles fetched to backfill OHLCV data: ${totalFetched}`);  // Log total candles fetched
};

// Function to validate a single candle data
const validateCandle = (candle) => {
  return (
    candle &&
    candle.close !== undefined &&
    !isNaN(candle.close) &&
    candle.open !== undefined &&
    !isNaN(candle.open) &&
    candle.high !== undefined &&
    !isNaN(candle.high) &&
    candle.low !== undefined &&
    !isNaN(candle.low) &&
    candle.volume !== undefined &&
    !isNaN(candle.volume)
  );
};

// Function to get OHLCV data
export const getOhlcvData = () => {
  if (ohlcvData.length === 0) {
    console.warn('OHLCV data is not loaded or empty. Returning empty array.');
    return [];
  }
  return ohlcvData;
};

// New function to save updated OHLCV data
export const saveOhlcvData = (data) => {
  try {
    fs.writeFileSync(OHLCV_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    logInfo(`OHLCV data saved to file with ${data.length} candles.`);
  } catch (error) {
    console.error('Error saving OHLCV data:', error);
  }
};
