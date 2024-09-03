import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

// Load last configuration if available
const configFilePath = path.join(process.cwd(), 'trading_config.json');

const loadLastConfig = () => {
  try {
    if (fs.existsSync(configFilePath)) {
      const lastConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
      return lastConfig;
    }
  } catch (error) {
    console.error('Failed to load last configuration:', error);
  }
  return null;
};

// Function to display and get trading configuration
async function getTradingConfig() {
  const lastConfig = loadLastConfig();
  const questions = [
    {
      type: 'list',
      name: 'exchange',
      message: 'Select the exchange:',
      choices: lastConfig
        ? [`Use Last Config (${lastConfig.exchange}, ${lastConfig.symbol})`, 'binanceusdm', 'ftx', 'bybit']
        : ['binanceusdm', 'ftx', 'bybit'],
    },
    {
      type: 'input',
      name: 'symbol',
      message: 'Enter the trading symbol (e.g., BTC/USDT perpetual):',
      default: lastConfig ? lastConfig.symbol : 'BTC/USDT',
      when: (answers) => answers.exchange !== `Use Last Config (${lastConfig.exchange}, ${lastConfig.symbol})`,
    },
    // Additional questions for parameters, entry/exit rules, etc.
  ];

  const answers = await inquirer.prompt(questions);
  if (answers.exchange === `Use Last Config (${lastConfig.exchange}, ${lastConfig.symbol})`) {
    return lastConfig;  // Return the last configuration if selected
  }

  fs.writeFileSync(configFilePath, JSON.stringify(answers, null, 2));
  console.log(`Trading configuration saved to ${configFilePath}`);
  return answers;
}

export async function runMenu() {
  console.log('Welcome to the Interactive Trading Menu!');
  try {
    const config = await getTradingConfig();
    console.log('Your configuration:', config);
  } catch (error) {
    console.error('Error running trading menu:', error);
  }
}
