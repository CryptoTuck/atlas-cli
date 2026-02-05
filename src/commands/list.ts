import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { listStores, getStore } from '../lib/api.js';

export const listCommand = new Command('list')
  .description('List your generated stores')
  .option('-l, --limit <number>', 'Number of stores to show', '20')
  .option('-o, --offset <number>', 'Offset for pagination', '0')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const isJson = options.json;
    const spinner = ora('Fetching stores...').start();

    try {
      const response = await listStores(
        parseInt(options.limit),
        parseInt(options.offset)
      );
      spinner.stop();

      if (isJson) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      console.log(chalk.bold(`\n🏪 Your Generated Stores (${response.total} total)\n`));

      if (response.stores.length === 0) {
        console.log(chalk.dim('  No stores found. Generate one with:'));
        console.log(chalk.cyan('    atlas generate --url "https://amazon.com/dp/..."\n'));
        return;
      }

      for (const store of response.stores) {
        const date = new Date(store.created_at).toLocaleDateString();
        const statusColor = 
          store.status === 'imported' ? chalk.green :
          store.status === 'ready' ? chalk.yellow :
          chalk.gray;
        
        console.log(`  ${chalk.bold(`#${store.id}`)} ${store.product_name || 'Untitled'}`);
        console.log(`    ${chalk.dim('Type:')} ${store.type}`);
        console.log(`    ${chalk.dim('Status:')} ${statusColor(store.status || 'unknown')}`);
        console.log(`    ${chalk.dim('Created:')} ${date}`);
        if (store.theme_id) {
          console.log(`    ${chalk.dim('Theme ID:')} ${store.theme_id}`);
        }
        console.log('');
      }

      if (response.total > response.offset + response.limit) {
        const nextOffset = response.offset + response.limit;
        console.log(chalk.dim(`  Showing ${response.stores.length} of ${response.total}. For more:`));
        console.log(chalk.cyan(`    atlas list --offset ${nextOffset}\n`));
      }
    } catch (error) {
      spinner.fail('Failed to fetch stores');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });

export const showCommand = new Command('show')
  .description('Show details of a specific store')
  .argument('<id>', 'Store ID')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options) => {
    const isJson = options.json;
    const spinner = ora('Fetching store details...').start();

    try {
      const store = await getStore(parseInt(id));
      spinner.stop();

      if (isJson) {
        console.log(JSON.stringify(store, null, 2));
        return;
      }

      console.log(chalk.bold(`\n🏪 Store #${store.id}\n`));
      console.log(`  ${chalk.bold('Product:')} ${store.product_name || 'Untitled'}`);
      console.log(`  ${chalk.bold('Type:')} ${store.type}`);
      console.log(`  ${chalk.bold('Status:')} ${store.status || 'unknown'}`);
      console.log(`  ${chalk.bold('Created:')} ${new Date(store.created_at).toLocaleString()}`);
      
      if (store.source_url) {
        console.log(`  ${chalk.bold('Source URL:')} ${store.source_url}`);
      }
      if (store.theme_id) {
        console.log(`  ${chalk.bold('Theme ID:')} ${store.theme_id}`);
      }
      if (store.theme_version) {
        console.log(`  ${chalk.bold('Theme Version:')} ${store.theme_version}`);
      }
      console.log('');
    } catch (error) {
      spinner.fail('Failed to fetch store');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });
