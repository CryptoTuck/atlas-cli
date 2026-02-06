import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { listProducts, getProduct } from '../lib/api.js';

export const productsCommand = new Command('products')
  .description('List your Shopify products')
  .option('-l, --limit <limit>', 'Number of products to show', '20')
  .option('-q, --query <query>', 'Search query to filter products')
  .option('-c, --cursor <cursor>', 'Pagination cursor')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const spinner = ora('Fetching products...').start();

    try {
      const response = await listProducts({
        limit: parseInt(options.limit),
        query: options.query,
        cursor: options.cursor,
      });

      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      console.log(chalk.bold('\n📦 Your Shopify Products\n'));

      if (response.products.length === 0) {
        console.log(chalk.yellow('No products found.'));
        return;
      }

      for (const product of response.products) {
        const price = product.price_range?.min 
          ? `$${product.price_range.min}` 
          : '';
        const status = product.status === 'ACTIVE' 
          ? chalk.green('[active]') 
          : chalk.dim(`[${product.status?.toLowerCase()}]`);

        console.log(`  ${chalk.cyan(product.numeric_id.toString().padStart(12))}  ${chalk.bold(product.title)} ${status}`);
        if (price) {
          console.log(`                ${chalk.dim(price)} · ${product.variants_count || 0} variants`);
        }
      }

      console.log('');

      if (response.page_info?.has_next_page) {
        console.log(chalk.dim(`More products available. Use --cursor "${response.page_info.next_cursor}" for next page\n`));
      }

      console.log(chalk.dim('Use --product-id <numeric_id> with generate command\n'));
    } catch (error) {
      spinner.fail('Failed to fetch products');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });

// Sub-command: atlas products show <id>
productsCommand
  .command('show <id>')
  .description('Show details for a specific product')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options) => {
    const spinner = ora('Fetching product...').start();

    try {
      const product = await getProduct(id);
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(product, null, 2));
        return;
      }

      console.log(chalk.bold(`\n📦 Product: ${product.title}\n`));
      console.log(`  ${chalk.bold('ID:')} ${product.numeric_id}`);
      console.log(`  ${chalk.bold('Handle:')} ${product.handle}`);
      console.log(`  ${chalk.bold('Status:')} ${product.status}`);
      console.log(`  ${chalk.bold('Vendor:')} ${product.vendor || 'N/A'}`);
      console.log(`  ${chalk.bold('Type:')} ${product.product_type || 'N/A'}`);
      console.log(`  ${chalk.bold('Images:')} ${product.images?.length || 0}`);
      console.log(`  ${chalk.bold('Variants:')} ${product.variants?.length || 0}`);
      if (product.price_range?.min) {
        console.log(`  ${chalk.bold('Price:')} $${product.price_range.min} - $${product.price_range.max}`);
      }
      console.log('');
    } catch (error) {
      spinner.fail('Failed to fetch product');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });
