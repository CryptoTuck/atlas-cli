import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { listTemplates, getTemplate } from '../lib/api.js';

export const templatesCommand = new Command('templates')
  .description('List available Atlas theme templates')
  .option('-l, --limit <limit>', 'Number of templates to show', '20')
  .option('-o, --offset <offset>', 'Offset for pagination', '0')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const spinner = ora('Fetching templates...').start();

    try {
      const response = await listTemplates(
        parseInt(options.limit),
        parseInt(options.offset)
      );

      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      console.log(chalk.bold('\n📚 Atlas Theme Templates\n'));
      console.log(`Showing ${response.templates.length} of ${response.total} templates\n`);

      if (response.templates.length === 0) {
        console.log(chalk.yellow('No templates available.'));
        return;
      }

      for (const template of response.templates) {
        console.log(`  ${chalk.cyan(template.id.toString().padStart(3))}  ${chalk.bold(template.name)}`);
        console.log(`       Version: ${template.theme_version} | Used by: ${template.stores_using} stores`);
        if (template.badge_text) {
          console.log(`       ${chalk.green(`[${template.badge_text}]`)}`);
        }
        console.log('');
      }

      console.log(chalk.dim(`Use --template-id ${response.templates[0]?.id || '<id>'} with generate command\n`));
    } catch (error) {
      spinner.fail('Failed to fetch templates');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });

// Sub-command: atlas templates show <id>
templatesCommand
  .command('show <id>')
  .description('Show details for a specific template')
  .option('--json', 'Output as JSON')
  .action(async (id: string, options) => {
    const spinner = ora('Fetching template...').start();

    try {
      const template = await getTemplate(parseInt(id));
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(template, null, 2));
        return;
      }

      console.log(chalk.bold(`\n📄 Template: ${template.name}\n`));
      console.log(`  ${chalk.bold('ID:')} ${template.id}`);
      console.log(`  ${chalk.bold('Version:')} ${template.theme_version}`);
      console.log(`  ${chalk.bold('Folder:')} ${template.theme_version_folder}`);
      console.log(`  ${chalk.bold('Stores Using:')} ${template.stores_using}`);
      if (template.category) {
        console.log(`  ${chalk.bold('Category:')} ${template.category}`);
      }
      if (template.description) {
        console.log(`  ${chalk.bold('Description:')} ${template.description}`);
      }
      if (template.thumbnail_url) {
        console.log(`  ${chalk.bold('Preview:')} ${template.thumbnail_url}`);
      }
      console.log('');
    } catch (error) {
      spinner.fail('Failed to fetch template');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });
