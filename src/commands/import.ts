import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { importStore, getImportStatus, StatusResponse } from '../lib/api.js';

export const importCommand = new Command('import')
  .description('Import a generated store to Shopify')
  .argument('<job-id>', 'The generation job ID to import')
  .option('--wait', 'Wait for import to complete')
  .option('--json', 'Output as JSON')
  .action(async (jobId: string, options) => {
    const isJson = options.json;
    const spinner = ora('Starting import...').start();

    try {
      const response = await importStore(jobId);

      if (isJson && !options.wait) {
        spinner.stop();
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      spinner.succeed('Import started!');
      console.log(`\n  ${chalk.bold('Import Job ID:')} ${chalk.cyan(response.import_job_id)}`);

      if (options.wait) {
        console.log('\n  Waiting for import to complete...\n');
        const importSpinner = ora('Importing to Shopify...').start();
        let lastPercent = 0;

        // Poll for import completion
        const maxWait = 300000; // 5 minutes
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
          const status = await getImportStatus(response.import_job_id);
          
          const percent = Math.round(status.percentage_complete || 0);
          if (percent > lastPercent) {
            lastPercent = percent;
            importSpinner.text = `Importing to Shopify... ${percent}%`;
          }

          if (status.status === 'completed') {
            importSpinner.succeed('Import completed!');
            
            if (isJson) {
              console.log(JSON.stringify(status, null, 2));
            } else {
              console.log(`\n  ${chalk.bold('Theme ID:')} ${status.result?.theme_id || 'N/A'}`);
              console.log(chalk.green('\n✓ Store imported successfully!\n'));
              console.log(chalk.dim('  View your new theme in Shopify Admin > Online Store > Themes\n'));
            }
            return;
          }

          if (status.status === 'failed') {
            importSpinner.fail('Import failed');
            console.error(chalk.red(`\n  Error: ${status.error || 'Unknown error'}\n`));
            process.exit(1);
          }

          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        importSpinner.fail('Import timed out');
        console.log(chalk.yellow('\n  Import is still processing. Check status with:'));
        console.log(chalk.cyan(`    atlas import-status ${response.import_job_id}\n`));
      } else {
        console.log(`\n  To check import status, run:`);
        console.log(chalk.cyan(`    atlas import-status ${response.import_job_id}\n`));
      }
    } catch (error) {
      spinner.fail('Import failed');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });

export const importStatusCommand = new Command('import-status')
  .description('Check the status of an import job')
  .argument('<job-id>', 'The import job ID to check')
  .option('--json', 'Output as JSON')
  .action(async (jobId: string, options) => {
    const isJson = options.json;
    const spinner = ora('Fetching import status...').start();

    try {
      const status = await getImportStatus(jobId);
      spinner.stop();

      if (isJson) {
        console.log(JSON.stringify(status, null, 2));
      } else {
        console.log(`\n${chalk.bold('Import Status')}`);
        console.log(`  ${chalk.bold('Job ID:')} ${status.job_id}`);
        
        const statusColor = 
          status.status === 'completed' ? chalk.green :
          status.status === 'failed' ? chalk.red :
          chalk.yellow;
        
        console.log(`  ${chalk.bold('Status:')} ${statusColor(status.status)}`);
        console.log(`  ${chalk.bold('Progress:')} ${Math.round(status.percentage_complete || 0)}%`);

        if (status.status === 'completed') {
          console.log(`\n  ${chalk.bold('Theme ID:')} ${status.result?.theme_id || 'N/A'}`);
          console.log(chalk.green('\n✓ Import completed!\n'));
        }

        if (status.status === 'failed') {
          console.log(chalk.red(`\n  Error: ${status.error || 'Unknown error'}\n`));
        }
      }
    } catch (error) {
      spinner.fail('Failed to fetch status');
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });
