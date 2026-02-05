import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getStatus, waitForCompletion, StatusResponse } from '../lib/api.js';

export const statusCommand = new Command('status')
  .description('Check the status of a generation job')
  .argument('<job-id>', 'The job ID to check')
  .option('--wait', 'Wait for job to complete')
  .option('--json', 'Output as JSON')
  .action(async (jobId: string, options) => {
    const isJson = options.json;
    const spinner = ora('Fetching status...').start();

    try {
      if (options.wait) {
        spinner.text = 'Waiting for completion...';
        let lastPercent = 0;

        const status = await waitForCompletion(jobId, {
          maxWaitMs: 600000,
          pollIntervalMs: 3000,
          onProgress: (s: StatusResponse) => {
            const percent = Math.round(s.percentage_complete || 0);
            if (percent > lastPercent) {
              lastPercent = percent;
              spinner.text = `Processing... ${percent}%`;
            }
          },
        });

        spinner.stop();

        if (isJson) {
          console.log(JSON.stringify(status, null, 2));
        } else {
          printStatus(status);
        }
      } else {
        const status = await getStatus(jobId);
        spinner.stop();

        if (isJson) {
          console.log(JSON.stringify(status, null, 2));
        } else {
          printStatus(status);
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

function printStatus(status: StatusResponse): void {
  console.log(`\n${chalk.bold('Job Status')}`);
  console.log(`  ${chalk.bold('Job ID:')} ${status.job_id}`);
  
  const statusColor = 
    status.status === 'completed' ? chalk.green :
    status.status === 'failed' ? chalk.red :
    status.status === 'processing' ? chalk.yellow :
    chalk.gray;
  
  console.log(`  ${chalk.bold('Status:')} ${statusColor(status.status)}`);
  console.log(`  ${chalk.bold('Progress:')} ${Math.round(status.percentage_complete || 0)}%`);

  if (status.status === 'completed' && status.result) {
    console.log(`\n${chalk.bold('Result')}`);
    console.log(`  ${chalk.bold('Product:')} ${status.result.product_name || 'N/A'}`);
    console.log(`  ${chalk.bold('Price:')} ${status.result.product_price || 'N/A'}`);
    console.log(`  ${chalk.bold('Images:')} ${status.result.product_images || 0}`);
    
    if (status.history_id) {
      console.log(`\n  ${chalk.dim('Ready to import! Run:')}`);
      console.log(chalk.cyan(`    atlas import ${status.job_id}\n`));
    }
  }

  if (status.status === 'failed') {
    console.log(chalk.red(`\n  Error: ${status.error || 'Unknown error'}\n`));
  }
}
