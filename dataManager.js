import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchOHLCVData } from './restClient.js';
import { logInfo, logError } from './logger.js';

// Simulate __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants and global variables
const OHLCV_FILE_PATH = path.join(__dirname, 'ohlcv_data.json');
const MAX_CANDLES_PER_REQUEST = 1000; // Binance API limit for klines
let ohlcvData = [];  // Initialize as an empty array

// Load OHLCV data from file or fetch new data if file doesn't exist or data is invalid
export const loadOHLCVData = async (symbol, timeframe = '1m') => {
  try {
    // Step 1: Load data from the file if it exists
    if (fs.existsSync(OHLCV_FILE_PATH)) {
      const fileContent = fs.readFileSync(OHLCV_FILE_PATH, 'utf-8');
      ohlcvData = JSON.parse(fileContent).filter(validateCandle);

      // Remove duplicates by timestamp
      ohlcvData = removeDuplicates(ohlcvData);
      logInfo(`OHLCV file contains ${ohlcvData.length} unique candles after loading and validation.`);
    }

    // Step 2: Fetch new data if file is empty or invalid
    if (ohlcvData.length === 0) {
      logInfo('No valid OHLCV data found. Fetching new data...');
      ohlcvData = await fetchOHLCVData(symbol, timeframe);
      ohlcvData = removeDuplicates(ohlcvData);  // Ensure no duplicates in newly fetched data
      saveOhlcvData(ohlcvData);
      logInfo(`Fetched ${ohlcvData.length} new OHLCV candles for ${symbol}`);
    } else {
      // Step 3: Fetch any missing data and merge it properly
      await fetchMissingOHLCVData(symbol, timeframe);
    }
  } catch (error) {
    logError(`Error loading OHLCV data: ${error.message}`);
  }

  return ohlcvData;
};

// Fetch missing OHLCV data if there are gaps
const fetchMissingOHLCVData = async (symbol, timeframe) => {
  const lastCandleTime = ohlcvData[ohlcvData.length - 1].openTime;
  const currentTime = Date.now();
  const candleInterval = 60000; // 1 minute in milliseconds

  // Calculate the number of missing candles
  const missingCandlesCount = Math.ceil((currentTime - lastCandleTime) / candleInterval);

  if (missingCandlesCount > 0) {
    logInfo(`OHLCV data is missing ${missingCandlesCount} candles. Fetching missing data...`);
    let totalFetched = 0;

    // Initialize temporary storage for fetched data
    let fetchedCandles = [];

    while (totalFetched < missingCandlesCount) {
      const candlesToFetch = Math.min(missingCandlesCount - totalFetched, MAX_CANDLES_PER_REQUEST);
      const fetchedData = await fetchOHLCVData(symbol, timeframe, lastCandleTime + (totalFetched * candleInterval), candlesToFetch);

      if (fetchedData.length === 0) break; // No more data fetched; break loop

      // Add newly fetched candles to temporary storage without merging yet
      fetchedCandles = mergeOHLCVData(fetchedCandles, fetchedData);
      totalFetched += fetchedData.length;
    }

    // Merge the fetched candles into the main OHLCV data array only once
    const beforeMergeLength = ohlcvData.length;
    ohlcvData = mergeOHLCVData(ohlcvData, fetchedCandles);
    logInfo(`Merged OHLCV data. Number of candles before merging: ${beforeMergeLength}, after merging: ${ohlcvData.length}`);
    
    saveOhlcvData(ohlcvData); // Save the updated data
    logInfo(`Fetched ${totalFetched} candles to backfill OHLCV data. Total candles after merging: ${ohlcvData.length}`);
  }
};

// Merge new OHLCV data with existing data without duplication
const mergeOHLCVData = (existingData, newData) => {
  // Create a map of existing timestamps for quick lookup
  const existingTimestamps = new Set(existingData.map(candle => candle.openTime));

  // Filter out any new candles that already exist in the existing data
  const filteredNewData = newData.filter(candle => !existingTimestamps.has(candle.openTime));

  // Combine existing data with filtered new data
  const mergedData = [...existingData, ...filteredNewData];

  // Remove any potential duplicates that might exist after merging
  return removeDuplicates(mergedData);
};

// Remove duplicate candles based on their timestamp
const removeDuplicates = (data) => {
  const uniqueDataMap = new Map();
  data.forEach(candle => {
    if (!uniqueDataMap.has(candle.openTime)) {
      uniqueDataMap.set(candle.openTime, candle);
    }
  });
  return Array.from(uniqueDataMap.values());
};

// Validate individual OHLCV candle data
const validateCandle = (candle) => {
  return candle && !isNaN(candle.openTime) && !isNaN(candle.open) && !isNaN(candle.high) &&
         !isNaN(candle.low) && !isNaN(candle.close) && !isNaN(candle.volume);
};

// Save OHLCV data to file
export const saveOhlcvData = (data) => {
  try {
    fs.writeFileSync(OHLCV_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    logInfo(`OHLCV data saved to file with ${data.length} candles.`);
  } catch (error) {
    logError(`Error saving OHLCV data: ${error.message}`);
  }
};

// Export the function to get OHLCV data
export const getOhlcvData = () => ohlcvData;
