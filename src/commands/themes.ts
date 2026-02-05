import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { listThemes, getTheme, getThemeProductTemplates } from '../lib/api.js';

export const themesCommand = new Command('themes')
  .description('List your Shopify themes')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const spinner = ora('Fetching themes...').start();

    try {
      const response = await listThemes();
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      console.log(chalk.bold('\n🎨 Your Shopify Themes\n'));

      if (response.themes.length === 0) {
        console.log(chalk.yellow('No themes found.'));
        return;
      }

      for (const theme of response.themes) {
        const roleTag = theme.role === 'main' 
          ? chalk.green(' [LIVE]') 
          : theme.role === 'unpublished' 
            ? chalk.dim(' [draft]')
            : '';
        
        const atlasTag = theme.is_atlas_theme 
          ? chalk.cyan(` [Atlas v${theme.atlas_version}]`)
          : '';

        console.log(`  ${chalk.cyan(theme.id.toString().padStart(12))}  ${chalk.bold(theme.name)}${roleTag}${atlasTag}`);
      }

      console.log('');
      console.log(chalk.dim('Use --theme-id <id> with generate command for product pages or existing_theme template\n'));
    } catch (error) {
      spinner.fail('Failed to fetch themes');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });

// Sub-command: atlas themes show <id>
themesCommand
  .command('show <id>')
  .description('Show details for a specific theme including product page templates')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options) => {
    const spinner = ora('Fetching theme details...').start();

    try {
      const theme = await getTheme(parseInt(id));
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(theme, null, 2));
        return;
      }

      console.log(chalk.bold(`\n🎨 Theme: ${theme.name}\n`));
      console.log(`  ${chalk.bold('ID:')} ${theme.id}`);
      console.log(`  ${chalk.bold('Role:')} ${theme.role}`);
      console.log(`  ${chalk.bold('Atlas Theme:')} ${theme.is_atlas_theme ? `Yes (v${theme.atlas_version})` : 'No'}`);
      console.log(`  ${chalk.bold('Updated:')} ${new Date(theme.updated_at).toLocaleDateString()}`);
      
      if (theme.product_templates && theme.product_templates.length > 0) {
        console.log(`\n  ${chalk.bold('Product Page Templates:')}`);
        for (const pt of theme.product_templates) {
          console.log(`    • ${pt.name || 'default'} (${pt.key})`);
        }
      }
      console.log('');
    } catch (error) {
      spinner.fail('Failed to fetch theme');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });

// Sub-command: atlas themes product-templates <id>
themesCommand
  .command('product-templates <id>')
  .description('List product page templates for a specific theme')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options) => {
    const spinner = ora('Fetching product templates...').start();

    try {
      const response = await getThemeProductTemplates(parseInt(id));
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      console.log(chalk.bold(`\n📄 Product Page Templates for Theme ${id}\n`));

      if (response.product_templates.length === 0) {
        console.log(chalk.yellow('No product page templates found.'));
        return;
      }

      for (const pt of response.product_templates) {
        console.log(`  • ${chalk.bold(pt.name || 'default')} (${chalk.dim(pt.key)})`);
      }
      
      console.log('');
      console.log(chalk.dim('Use --product-page-template <name> with generate for existing_page template source\n'));
    } catch (error) {
      spinner.fail('Failed to fetch product templates');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });
