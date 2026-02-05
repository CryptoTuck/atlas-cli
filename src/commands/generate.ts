import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { input, select } from '@inquirer/prompts';
import { generateStore, waitForCompletion, StatusResponse } from '../lib/api.js';

export const generateCommand = new Command('generate')
  .description('Generate a new Shopify store from a product URL')
  .option('-u, --url <url>', 'Product URL (Amazon, AliExpress, Etsy, etc.)')
  .option('-p, --product-id <id>', 'Existing Shopify product ID')
  .option('-r, --region <region>', 'Region code (us, uk, de, etc.)', 'us')
  .option('-l, --language <lang>', 'Language code (en, es, de, etc.)', 'en')
  .option('-t, --type <type>', 'Generation type', 'single_product_shop')
  .option('--template <id>', 'Theme template ID to use')
  .option('--wait', 'Wait for generation to complete')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const isJson = options.json;

    // Interactive mode if no URL provided
    let url = options.url;
    let productId = options.productId;

    if (!url && !productId) {
      console.log(chalk.bold('\n🏪 Atlas Store Generator\n'));
      
      const source = await select({
        message: 'How would you like to generate your store?',
        choices: [
          { name: 'From a product URL (Amazon, AliExpress, Etsy, etc.)', value: 'url' },
          { name: 'From an existing Shopify product', value: 'product' },
        ],
      });

      if (source === 'url') {
        url = await input({
          message: 'Enter the product URL:',
          validate: (value) => {
            try {
              new URL(value);
              return true;
            } catch {
              return 'Please enter a valid URL';
            }
          },
        });
      } else {
        productId = await input({
          message: 'Enter the Shopify product ID:',
        });
      }
    }

    const spinner = ora('Starting store generation...').start();

    try {
      const response = await generateStore({
        url,
        shopifyProductId: productId,
        region: options.region,
        language: options.language,
        type: options.type,
        templateId: options.template,
      });

      if (isJson) {
        spinner.stop();
        console.log(JSON.stringify(response, null, 2));
      } else {
        spinner.succeed('Generation started!');
        console.log(`\n  ${chalk.bold('Job ID:')} ${chalk.cyan(response.job_id)}`);
        console.log(`  ${chalk.bold('Status:')} ${response.status}`);
      }

      // Wait for completion if requested
      if (options.wait) {
        if (!isJson) {
          console.log('\n  Waiting for generation to complete...\n');
        }
        
        const statusSpinner = ora('Generating store...').start();
        let lastPercent = 0;

        const finalStatus = await waitForCompletion(response.job_id, {
          maxWaitMs: 600000, // 10 minutes
          pollIntervalMs: 3000,
          onProgress: (status: StatusResponse) => {
            const percent = Math.round(status.percentage_complete || 0);
            if (percent > lastPercent) {
              lastPercent = percent;
              statusSpinner.text = `Generating store... ${percent}%`;
            }
          },
        });

        statusSpinner.stop();

        if (isJson) {
          console.log(JSON.stringify(finalStatus, null, 2));
        } else if (finalStatus.status === 'completed') {
          console.log(chalk.green('\n✓ Store generated successfully!\n'));
          console.log(`  ${chalk.bold('Product:')} ${finalStatus.result?.product_name || 'N/A'}`);
          console.log(`  ${chalk.bold('History ID:')} ${finalStatus.history_id || 'N/A'}`);
          console.log(`\n  To import to Shopify, run:`);
          console.log(chalk.cyan(`    atlas import ${response.job_id}\n`));
        } else {
          console.log(chalk.red('\n✗ Generation failed'));
          console.log(`  Error: ${finalStatus.error || 'Unknown error'}\n`);
        }
      } else if (!isJson) {
        console.log(`\n  To check status, run:`);
        console.log(chalk.cyan(`    atlas status ${response.job_id}\n`));
      }
    } catch (error) {
      spinner.fail('Generation failed');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });
