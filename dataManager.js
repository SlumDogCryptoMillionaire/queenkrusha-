import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchOHLCVData } from './restClient.js';

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
        
        if (ohlcvData.length === 0) {
          console.warn('No valid OHLCV data in the file. Fetching new data...');
          ohlcvData = await fetchOHLCVData(symbol, timeframe);
          fs.writeFileSync(OHLCV_FILE_PATH, JSON.stringify(ohlcvData), 'utf-8');
        }

      } catch (error) {
        console.error('Error parsing OHLCV data from file:', error);
        ohlcvData = await fetchOHLCVData(symbol, timeframe);  // Fetch fresh data if parsing fails
        fs.writeFileSync(OHLCV_FILE_PATH, JSON.stringify(ohlcvData), 'utf-8');
      }
    } else {
      console.log('OHLCV file does not exist. Fetching new data...');
      ohlcvData = await fetchOHLCVData(symbol, timeframe);
      fs.writeFileSync(OHLCV_FILE_PATH, JSON.stringify(ohlcvData), 'utf-8');
    }
  } catch (error) {
    console.error('Error loading OHLCV data:', error);
    ohlcvData = [];  // Reset to an empty array if any error occurs
  }
  return ohlcvData;
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
