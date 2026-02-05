import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { input, select } from '@inquirer/prompts';
import { generateStore, waitForCompletion, StatusResponse, listTemplates, listThemes } from '../lib/api.js';

export const generateCommand = new Command('generate')
  .description('Generate a new Shopify store or product page from a product URL')
  .option('-u, --url <url>', 'Product URL (Amazon, AliExpress, Etsy, etc.)')
  .option('-p, --product-id <id>', 'Existing Shopify product ID')
  .option('-r, --region <region>', 'Region code (us, uk, de, etc.)', 'us')
  .option('-l, --language <lang>', 'Language code (en, es, de, etc.)', 'en')
  .option('-t, --type <type>', 'Generation type: single_product_shop (default) or product_page')
  .option('--template-source <source>', 'Template source: atlas_library (default), existing_theme, or default')
  .option('--template-id <id>', 'Atlas template ID (for template-source=atlas_library)')
  .option('--theme-id <id>', 'Shopify theme ID (required for product_page or existing_theme)')
  .option('--page-template-source <source>', 'Product page template: atlas_default or existing_page')
  .option('--product-page-template <name>', 'Existing product page template name')
  .option('--research-context-id <id>', 'Research context ID for ICP-specific generation')
  .option('--wait', 'Wait for generation to complete')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const isJson = options.json;

    // Interactive mode if no URL provided
    let url = options.url;
    let productId = options.productId;
    let type = options.type || 'single_product_shop';
    let templateSource = options.templateSource || 'atlas_library';
    let templateId = options.templateId;
    let themeId = options.themeId;
    let pageTemplateSource = options.pageTemplateSource;
    let productPageTemplate = options.productPageTemplate;

    if (!url && !productId) {
      console.log(chalk.bold('\n🏪 Atlas Store Generator\n'));
      
      // Step 1: Choose generation type
      type = await select({
        message: 'What would you like to generate?',
        choices: [
          { name: 'Full store with theme', value: 'single_product_shop' },
          { name: 'Product page only (add to existing theme)', value: 'product_page' },
        ],
      });

      // Step 2: Choose source
      const source = await select({
        message: 'How would you like to source the product?',
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

      // Step 3: For full store, choose template source
      if (type === 'single_product_shop') {
        templateSource = await select({
          message: 'Which theme template would you like to use?',
          choices: [
            { name: 'Atlas template library', value: 'atlas_library' },
            { name: 'Base on your existing Shopify theme', value: 'existing_theme' },
            { name: 'Atlas default template', value: 'default' },
          ],
        });

        if (templateSource === 'atlas_library') {
          // Fetch and display available templates
          try {
            const spinner = ora('Fetching templates...').start();
            const templates = await listTemplates();
            spinner.stop();

            if (templates.templates && templates.templates.length > 0) {
              const templateChoice = await select({
                message: 'Select a template:',
                choices: templates.templates.map((t: any) => ({
                  name: `${t.name} (${t.stores_using} stores using)`,
                  value: t.id.toString(),
                })),
              });
              templateId = templateChoice;
            }
          } catch (e) {
            console.log(chalk.yellow('Could not fetch templates, using default.'));
          }
        } else if (templateSource === 'existing_theme') {
          // Fetch and display merchant's themes
          try {
            const spinner = ora('Fetching your themes...').start();
            const themes = await listThemes();
            spinner.stop();

            if (themes.themes && themes.themes.length > 0) {
              const themeChoice = await select({
                message: 'Select a theme to base your store on:',
                choices: themes.themes.map((t: any) => ({
                  name: `${t.name}${t.role === 'main' ? ' (live)' : ''}${t.is_atlas_theme ? ' [Atlas]' : ''}`,
                  value: t.id.toString(),
                })),
              });
              themeId = themeChoice;
            }
          } catch (e) {
            console.log(chalk.yellow('Could not fetch themes.'));
            themeId = await input({ message: 'Enter theme ID:' });
          }
        }
      }

      // Step 4: For product page, must select theme
      if (type === 'product_page') {
        try {
          const spinner = ora('Fetching your themes...').start();
          const themes = await listThemes();
          spinner.stop();

          if (themes.themes && themes.themes.length > 0) {
            // Filter to Atlas themes for product page
            const atlasThemes = themes.themes.filter((t: any) => t.is_atlas_theme);
            const themeList = atlasThemes.length > 0 ? atlasThemes : themes.themes;

            if (atlasThemes.length === 0) {
              console.log(chalk.yellow('Note: Product pages work best with Atlas themes.'));
            }

            const themeChoice = await select({
              message: 'Select the theme to add the product page to:',
              choices: themeList.map((t: any) => ({
                name: `${t.name}${t.role === 'main' ? ' (live)' : ''}${t.is_atlas_theme ? ` [Atlas v${t.atlas_version}]` : ''}`,
                value: t.id.toString(),
              })),
            });
            themeId = themeChoice;

            // Choose page template source
            pageTemplateSource = await select({
              message: 'Which product page template to use?',
              choices: [
                { name: 'Atlas default page layout', value: 'atlas_default' },
                { name: 'Copy from existing product page', value: 'existing_page' },
              ],
            });

            if (pageTemplateSource === 'existing_page') {
              productPageTemplate = await input({
                message: 'Enter product page template name (e.g., "1" for product.1.json):',
              });
            }
          }
        } catch (e) {
          console.log(chalk.yellow('Could not fetch themes.'));
          themeId = await input({ message: 'Enter theme ID:' });
        }
      }
    }

    // Validate required params
    if (type === 'product_page' && !themeId) {
      console.error(chalk.red('Error: --theme-id is required for product_page generation'));
      process.exit(1);
    }

    if (templateSource === 'existing_theme' && !themeId) {
      console.error(chalk.red('Error: --theme-id is required when template-source is existing_theme'));
      process.exit(1);
    }

    const spinner = ora('Starting generation...').start();

    try {
      const response = await generateStore({
        url,
        shopifyProductId: productId,
        region: options.region,
        language: options.language,
        type,
        templateSource,
        templateId,
        themeId,
        pageTemplateSource,
        productPageTemplate,
        researchContextId: options.researchContextId,
      });

      if (isJson) {
        spinner.stop();
        console.log(JSON.stringify(response, null, 2));
      } else {
        const typeLabel = type === 'product_page' ? 'Product page' : 'Store';
        spinner.succeed(`${typeLabel} generation started!`);
        console.log(`\n  ${chalk.bold('Job ID:')} ${chalk.cyan(response.job_id)}`);
        console.log(`  ${chalk.bold('Type:')} ${response.type}`);
        console.log(`  ${chalk.bold('Status:')} ${response.status}`);
      }

      // Wait for completion if requested
      if (options.wait) {
        if (!isJson) {
          console.log('\n  Waiting for generation to complete...\n');
        }
        
        const statusSpinner = ora('Generating...').start();
        let lastPercent = 0;

        const finalStatus = await waitForCompletion(response.job_id, {
          maxWaitMs: 600000, // 10 minutes
          pollIntervalMs: 3000,
          onProgress: (status: StatusResponse) => {
            const percent = Math.round(status.percentage_complete || 0);
            if (percent > lastPercent) {
              lastPercent = percent;
              statusSpinner.text = `Generating... ${percent}%`;
            }
          },
        });

        statusSpinner.stop();

        if (isJson) {
          console.log(JSON.stringify(finalStatus, null, 2));
        } else if (finalStatus.status === 'completed') {
          console.log(chalk.green('\n✓ Generated successfully!\n'));
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
