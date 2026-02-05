import { Command } from 'commander';
import chalk from 'chalk';
import { input, confirm } from '@inquirer/prompts';
import { setApiKey, getApiKey, clearApiKey, setApiBase, getApiBase } from '../lib/config.js';

export const authCommand = new Command('auth')
  .description('Configure Atlas API authentication')
  .option('-k, --key <key>', 'Set API key directly')
  .option('--api-base <url>', 'Set custom API base URL (for local dev, use your Shopify app URL)')
  .option('--local', 'Configure for local development (will prompt for tunnel URL)')
  .option('--clear', 'Clear stored credentials')
  .option('--show', 'Show current configuration')
  .action(async (options) => {
    // Show current config
    if (options.show) {
      const key = getApiKey();
      const base = getApiBase();
      const isLocal = base.includes('localhost') || base.includes('.trycloudflare.com') || base.includes('ngrok');
      console.log(chalk.bold('\nCurrent Configuration:'));
      console.log(`  API Base: ${chalk.cyan(base)} ${isLocal ? chalk.yellow('(local dev)') : ''}`);
      console.log(`  API Key:  ${key ? chalk.green(key.slice(0, 12) + '...') : chalk.yellow('Not set')}`);
      console.log('');
      if (isLocal) {
        console.log(chalk.dim('  Note: Using local dev URL. For production, run:'));
        console.log(chalk.dim('    atlas auth --api-base https://atlas-app.herokuapp.com/api/v1'));
      }
      return;
    }

    // Local development setup
    if (options.local) {
      console.log(chalk.bold('\n🔧 Local Development Setup\n'));
      console.log(chalk.dim('When running `shopify app dev`, your app gets a tunnel URL like:'));
      console.log(chalk.dim('  https://admin.shopify.com/store/YOUR-STORE/apps/YOUR-APP'));
      console.log(chalk.dim('  or a cloudflare/ngrok tunnel URL\n'));
      
      const tunnelUrl = await input({
        message: 'Enter your Shopify app URL or tunnel URL:',
        validate: (value) => {
          if (!value.startsWith('http')) {
            return 'URL should start with http:// or https://';
          }
          return true;
        },
      });
      
      // Clean up the URL and append /api/v1
      let apiBase = tunnelUrl.replace(/\/$/, '');
      if (!apiBase.endsWith('/api/v1')) {
        apiBase = `${apiBase}/api/v1`;
      }
      
      setApiBase(apiBase);
      console.log(chalk.green(`\n✓ API base set to: ${apiBase}`));
      console.log(chalk.dim('  Now set your API key with: atlas auth --key YOUR_KEY\n'));
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
