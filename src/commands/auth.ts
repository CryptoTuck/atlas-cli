import { Command } from 'commander';
import chalk from 'chalk';
import { input, confirm } from '@inquirer/prompts';
import { setApiKey, getApiKey, clearApiKey, setApiBase, getApiBase } from '../lib/config.js';

export const authCommand = new Command('auth')
  .description('Configure Atlas API authentication')
  .option('-k, --key <key>', 'Set API key directly')
  .option('--api-base <url>', 'Set custom API base URL')
  .option('--clear', 'Clear stored credentials')
  .option('--show', 'Show current configuration')
  .action(async (options) => {
    // Show current config
    if (options.show) {
      const key = getApiKey();
      const base = getApiBase();
      console.log(chalk.bold('\nCurrent Configuration:'));
      console.log(`  API Base: ${chalk.cyan(base)}`);
      console.log(`  API Key:  ${key ? chalk.green(key.slice(0, 12) + '...') : chalk.yellow('Not set')}`);
      return;
    }

    // Clear credentials
    if (options.clear) {
      const confirmed = await confirm({
        message: 'Clear stored API credentials?',
        default: false,
      });
      if (confirmed) {
        clearApiKey();
        console.log(chalk.green('✓ Credentials cleared'));
      }
      return;
    }

    // Set API base if provided
    if (options.apiBase) {
      setApiBase(options.apiBase);
      console.log(chalk.green(`✓ API base set to: ${options.apiBase}`));
    }

    // Set API key
    let key = options.key;
    if (!key) {
      console.log(chalk.bold('\nAtlas API Authentication'));
      console.log(chalk.dim('Get your API key from the Atlas app settings.\n'));
      
      key = await input({
        message: 'Enter your Atlas API key:',
        validate: (value) => {
          if (!value.startsWith('atlas_')) {
            return 'API key should start with "atlas_"';
          }
          if (value.length < 20) {
            return 'API key seems too short';
          }
          return true;
        },
      });
    }

    if (key) {
      setApiKey(key);
      console.log(chalk.green('\n✓ API key saved successfully'));
      console.log(chalk.dim('  You can now use atlas commands to generate stores.\n'));
    }
  });
