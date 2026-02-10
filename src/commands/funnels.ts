import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { input, select } from '@inquirer/prompts';
import { 
  generateFunnel, 
  waitForFunnelCompletion, 
  listThemes, 
  FunnelStatusResponse 
} from '../lib/api.js';

export const funnelsCommand = new Command('funnels')
  .description('Generate listicles and advertorials (sales funnel pages)')
  .addCommand(
    new Command('generate')
      .description('Generate a listicle or advertorial funnel page')
      .option('-u, --url <url>', 'Product URL (Amazon, AliExpress, Etsy, etc.)')
      .option('-p, --product-id <id>', 'Existing Shopify product ID')
      .option('--type <type>', 'Funnel type: listicle or advertorial')
      .option('--theme-id <id>', 'Target Shopify theme ID')
      .option('--headline <text>', 'Custom headline for the funnel page')
      .option('--angle <angle>', 'Marketing angle: problem_solution, comparison, story, urgency')
      .option('--tone <tone>', 'Writing tone: professional, casual, urgent, luxury')
      .option('-l, --language <lang>', 'Language code (en, es, de, etc.)', 'en')
      .option('--wait', 'Wait for generation to complete')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        const isJson = options.json;

        let url = options.url;
        let productId = options.productId;
        let funnelType = options.type;
        let themeId = options.themeId;
        let headline = options.headline;
        let angle = options.angle;
        let tone = options.tone;

        // Interactive mode if required params not provided
        if (!url && !productId) {
          console.log(chalk.bold('\n📰 Atlas Funnel Generator\n'));

          // Step 1: Choose funnel type
          funnelType = await select({
            message: 'What type of funnel page would you like to generate?',
            choices: [
              { 
                name: 'Listicle - "Top 10 Reasons...", "5 Ways..." format', 
                value: 'listicle' 
              },
              { 
                name: 'Advertorial - Editorial-style native ad content', 
                value: 'advertorial' 
              },
            ],
          });

          // Step 2: Choose product source
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

          // Step 3: Choose target theme
          try {
            const spinner = ora('Fetching your themes...').start();
            const themes = await listThemes();
            spinner.stop();

            if (themes.themes && themes.themes.length > 0) {
              const atlasThemes = themes.themes.filter((t: any) => t.is_atlas_theme);
              const themeList = atlasThemes.length > 0 ? atlasThemes : themes.themes;

              if (atlasThemes.length === 0) {
                console.log(chalk.yellow('Note: Funnel pages work best with Atlas themes.'));
              }

              const themeChoice = await select({
                message: 'Select the theme to add the funnel page to:',
                choices: themeList.map((t: any) => ({
                  name: `${t.name}${t.role === 'main' ? ' (live)' : ''}${t.is_atlas_theme ? ` [Atlas v${t.atlas_version}]` : ''}`,
                  value: t.id.toString(),
                })),
              });
              themeId = themeChoice;
            }
          } catch (e) {
            console.log(chalk.yellow('Could not fetch themes.'));
            themeId = await input({ message: 'Enter theme ID:' });
          }

          // Step 4: Choose marketing angle
          angle = await select({
            message: 'What marketing angle should the content use?',
            choices: [
              { name: 'Problem/Solution - Focus on pain points and how product solves them', value: 'problem_solution' },
              { name: 'Comparison - Compare to alternatives and competitors', value: 'comparison' },
              { name: 'Story - Narrative-driven, testimonial style', value: 'story' },
              { name: 'Urgency - Scarcity, limited time, act now', value: 'urgency' },
            ],
          });

          // Step 5: Choose tone
          tone = await select({
            message: 'What tone should the content have?',
            choices: [
              { name: 'Professional - Authoritative, expert voice', value: 'professional' },
              { name: 'Casual - Friendly, conversational', value: 'casual' },
              { name: 'Urgent - High-energy, action-oriented', value: 'urgent' },
              { name: 'Luxury - Premium, sophisticated', value: 'luxury' },
            ],
          });

          // Step 6: Optional custom headline
          const useCustomHeadline = await select({
            message: 'Would you like to provide a custom headline?',
            choices: [
              { name: 'No, let AI generate the headline', value: false },
              { name: 'Yes, I have a specific headline in mind', value: true },
            ],
          });

          if (useCustomHeadline) {
            headline = await input({
              message: 'Enter your headline:',
            });
          }
        }

        // Validate required params
        if (!funnelType) {
          console.error(chalk.red('Error: --type (listicle or advertorial) is required'));
          process.exit(1);
        }

        if (!themeId) {
          console.error(chalk.red('Error: --theme-id is required for funnel generation'));
          process.exit(1);
        }

        const spinner = ora(`Starting ${funnelType} generation...`).start();

        try {
          const response = await generateFunnel({
            url,
            shopifyProductId: productId,
            funnelType: funnelType as 'listicle' | 'advertorial',
            themeId,
            headline,
            angle,
            tone,
            language: options.language,
          });

          if (isJson) {
            spinner.stop();
            console.log(JSON.stringify(response, null, 2));
          } else {
            const typeLabel = funnelType === 'listicle' ? 'Listicle' : 'Advertorial';
            spinner.succeed(`${typeLabel} generation started!`);
            console.log(`\n  ${chalk.bold('Job ID:')} ${chalk.cyan(response.job_id)}`);
            console.log(`  ${chalk.bold('Type:')} ${response.funnel_type}`);
            console.log(`  ${chalk.bold('Status:')} ${response.status}`);
          }

          // Wait for completion if requested
          if (options.wait) {
            if (!isJson) {
              console.log('\n  Waiting for generation to complete...\n');
            }
            
            const statusSpinner = ora('Generating...').start();
            let lastPercent = 0;

            const finalStatus = await waitForFunnelCompletion(response.job_id, {
              maxWaitMs: 600000, // 10 minutes
              pollIntervalMs: 3000,
              onProgress: (status: FunnelStatusResponse) => {
                const percent = Math.round(status.percentage_complete || 0);
                if (percent > lastPercent) {
                  lastPercent = percent;
                  statusSpinner.text = `Generating ${funnelType}... ${percent}%`;
                }
              },
            });

            statusSpinner.stop();

            if (isJson) {
              console.log(JSON.stringify(finalStatus, null, 2));
            } else if (finalStatus.status === 'completed') {
              console.log(chalk.green(`\n✓ ${funnelType === 'listicle' ? 'Listicle' : 'Advertorial'} generated successfully!\n`));
              console.log(`  ${chalk.bold('Page Title:')} ${finalStatus.result?.page_title || 'N/A'}`);
              console.log(`  ${chalk.bold('Page Handle:')} ${finalStatus.result?.page_handle || 'N/A'}`);
              console.log(`  ${chalk.bold('Theme ID:')} ${themeId}`);
              if (finalStatus.result?.preview_url) {
                console.log(`  ${chalk.bold('Preview:')} ${finalStatus.result.preview_url}`);
              }
              console.log(`\n  ${chalk.dim('The funnel page has been added to your theme.')}`);
              console.log(chalk.dim(`  View it at: /pages/${finalStatus.result?.page_handle || 'funnel'}\n`));
            } else {
              console.log(chalk.red('\n✗ Generation failed'));
              console.log(`  Error: ${finalStatus.error || 'Unknown error'}\n`);
            }
          } else if (!isJson) {
            console.log(`\n  To check status, run:`);
            console.log(chalk.cyan(`    atlas funnels status ${response.job_id}\n`));
          }
        } catch (error) {
          spinner.fail('Generation failed');
          if (error instanceof Error) {
            console.error(chalk.red(`\nError: ${error.message}`));
          }
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Check funnel generation status')
      .argument('<job_id>', 'The generation job ID')
      .option('--json', 'Output as JSON')
      .action(async (jobId, options) => {
        const { getFunnelStatus } = await import('../lib/api.js');
        
        try {
          const status = await getFunnelStatus(jobId);
          
          if (options.json) {
            console.log(JSON.stringify(status, null, 2));
          } else {
            console.log(`\n  ${chalk.bold('Job ID:')} ${status.job_id}`);
            console.log(`  ${chalk.bold('Status:')} ${status.status}`);
            console.log(`  ${chalk.bold('Progress:')} ${status.percentage_complete}%`);
            
            if (status.status === 'completed' && status.result) {
              console.log(`\n  ${chalk.bold('Page Title:')} ${status.result.page_title}`);
              console.log(`  ${chalk.bold('Page Handle:')} ${status.result.page_handle}`);
              if (status.result.preview_url) {
                console.log(`  ${chalk.bold('Preview:')} ${status.result.preview_url}`);
              }
            } else if (status.status === 'failed') {
              console.log(`\n  ${chalk.red('Error:')} ${status.error}`);
            }
            console.log();
          }
        } catch (error) {
          if (error instanceof Error) {
            console.error(chalk.red(`Error: ${error.message}`));
          }
          process.exit(1);
        }
      })
  );

// Shortcut commands for convenience
export const listicleCommand = new Command('listicle')
  .description('Generate a listicle funnel page (shortcut for: funnels generate --type listicle)')
  .option('-u, --url <url>', 'Product URL')
  .option('-p, --product-id <id>', 'Existing Shopify product ID')
  .option('--theme-id <id>', 'Target Shopify theme ID')
  .option('--headline <text>', 'Custom headline')
  .option('--angle <angle>', 'Marketing angle: problem_solution, comparison, story, urgency')
  .option('--tone <tone>', 'Writing tone: professional, casual, urgent, luxury')
  .option('-l, --language <lang>', 'Language code', 'en')
  .option('--wait', 'Wait for generation to complete')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    // Delegate to funnels generate with type set
    const { generateFunnel, waitForFunnelCompletion, listThemes } = await import('../lib/api.js');
    
    if (!options.url && !options.productId) {
      console.error(chalk.red('Error: --url or --product-id is required'));
      console.log(chalk.dim('Tip: Use `atlas funnels generate` for interactive mode.'));
      process.exit(1);
    }

    if (!options.themeId) {
      console.error(chalk.red('Error: --theme-id is required'));
      process.exit(1);
    }

    const spinner = ora('Starting listicle generation...').start();

    try {
      const response = await generateFunnel({
        url: options.url,
        shopifyProductId: options.productId,
        funnelType: 'listicle',
        themeId: options.themeId,
        headline: options.headline,
        angle: options.angle,
        tone: options.tone,
        language: options.language,
      });

      if (options.json) {
        spinner.stop();
        console.log(JSON.stringify(response, null, 2));
      } else {
        spinner.succeed('Listicle generation started!');
        console.log(`\n  ${chalk.bold('Job ID:')} ${chalk.cyan(response.job_id)}`);
        console.log(`  ${chalk.bold('Status:')} ${response.status}`);
      }

      if (options.wait) {
        const statusSpinner = ora('Generating listicle...').start();
        const finalStatus = await waitForFunnelCompletion(response.job_id, {
          maxWaitMs: 600000,
          pollIntervalMs: 3000,
          onProgress: (status: FunnelStatusResponse) => {
            statusSpinner.text = `Generating listicle... ${status.percentage_complete}%`;
          },
        });
        statusSpinner.stop();

        if (options.json) {
          console.log(JSON.stringify(finalStatus, null, 2));
        } else if (finalStatus.status === 'completed') {
          console.log(chalk.green('\n✓ Listicle generated successfully!'));
          console.log(`  ${chalk.bold('Page:')} /pages/${finalStatus.result?.page_handle}\n`);
        } else {
          console.log(chalk.red(`\n✗ Failed: ${finalStatus.error}\n`));
        }
      }
    } catch (error) {
      spinner.fail('Generation failed');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });

export const advertorialCommand = new Command('advertorial')
  .description('Generate an advertorial funnel page (shortcut for: funnels generate --type advertorial)')
  .option('-u, --url <url>', 'Product URL')
  .option('-p, --product-id <id>', 'Existing Shopify product ID')
  .option('--theme-id <id>', 'Target Shopify theme ID')
  .option('--headline <text>', 'Custom headline')
  .option('--angle <angle>', 'Marketing angle: problem_solution, comparison, story, urgency')
  .option('--tone <tone>', 'Writing tone: professional, casual, urgent, luxury')
  .option('-l, --language <lang>', 'Language code', 'en')
  .option('--wait', 'Wait for generation to complete')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const { generateFunnel, waitForFunnelCompletion } = await import('../lib/api.js');
    
    if (!options.url && !options.productId) {
      console.error(chalk.red('Error: --url or --product-id is required'));
      console.log(chalk.dim('Tip: Use `atlas funnels generate` for interactive mode.'));
      process.exit(1);
    }

    if (!options.themeId) {
      console.error(chalk.red('Error: --theme-id is required'));
      process.exit(1);
    }

    const spinner = ora('Starting advertorial generation...').start();

    try {
      const response = await generateFunnel({
        url: options.url,
        shopifyProductId: options.productId,
        funnelType: 'advertorial',
        themeId: options.themeId,
        headline: options.headline,
        angle: options.angle,
        tone: options.tone,
        language: options.language,
      });

      if (options.json) {
        spinner.stop();
        console.log(JSON.stringify(response, null, 2));
      } else {
        spinner.succeed('Advertorial generation started!');
        console.log(`\n  ${chalk.bold('Job ID:')} ${chalk.cyan(response.job_id)}`);
        console.log(`  ${chalk.bold('Status:')} ${response.status}`);
      }

      if (options.wait) {
        const statusSpinner = ora('Generating advertorial...').start();
        const finalStatus = await waitForFunnelCompletion(response.job_id, {
          maxWaitMs: 600000,
          pollIntervalMs: 3000,
          onProgress: (status: FunnelStatusResponse) => {
            statusSpinner.text = `Generating advertorial... ${status.percentage_complete}%`;
          },
        });
        statusSpinner.stop();

        if (options.json) {
          console.log(JSON.stringify(finalStatus, null, 2));
        } else if (finalStatus.status === 'completed') {
          console.log(chalk.green('\n✓ Advertorial generated successfully!'));
          console.log(`  ${chalk.bold('Page:')} /pages/${finalStatus.result?.page_handle}\n`);
        } else {
          console.log(chalk.red(`\n✗ Failed: ${finalStatus.error}\n`));
        }
      }
    } catch (error) {
      spinner.fail('Generation failed');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });
