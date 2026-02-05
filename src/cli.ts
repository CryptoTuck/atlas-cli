#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { authCommand } from './commands/auth.js';
import { generateCommand } from './commands/generate.js';
import { statusCommand } from './commands/status.js';
import { importCommand, importStatusCommand } from './commands/import.js';
import { listCommand, showCommand } from './commands/list.js';

const program = new Command();

program
  .name('atlas')
  .description('CLI for AI agents to generate and manage Shopify stores via Atlas')
  .version('0.1.0');

// Add commands
program.addCommand(authCommand);
program.addCommand(generateCommand);
program.addCommand(statusCommand);
program.addCommand(importCommand);
program.addCommand(importStatusCommand);
program.addCommand(listCommand);
program.addCommand(showCommand);

// Default action - show help with branding
program.action(() => {
  console.log(`
${chalk.bold.magenta('  ▄▀█ ▀█▀ █░░ ▄▀█ █▀')}
${chalk.bold.magenta('  █▀█ ░█░ █▄▄ █▀█ ▄█')}

${chalk.dim('  AI-Powered Store Generation for Shopify')}

${chalk.bold('Quick Start:')}
  ${chalk.cyan('atlas auth --key YOUR_API_KEY')}    Configure API access
  ${chalk.cyan('atlas generate --url "..."')}       Generate a store from product URL
  ${chalk.cyan('atlas status JOB_ID')}              Check generation progress
  ${chalk.cyan('atlas import JOB_ID')}              Import to Shopify

${chalk.bold('Commands:')}
  ${chalk.cyan('auth')}          Configure API authentication
  ${chalk.cyan('generate')}      Generate a new store from product URL
  ${chalk.cyan('status')}        Check generation job status
  ${chalk.cyan('import')}        Import generated store to Shopify
  ${chalk.cyan('import-status')} Check import job status
  ${chalk.cyan('list')}          List your generated stores
  ${chalk.cyan('show')}          Show details of a specific store

${chalk.bold('Examples:')}
  ${chalk.dim('# Generate from Amazon product')}
  atlas generate --url "https://amazon.com/dp/B08N5WRWNW" --wait

  ${chalk.dim('# Generate with specific language and region')}
  atlas generate --url "..." --language de --region eu

  ${chalk.dim('# Full pipeline: generate and import')}
  atlas generate --url "..." --wait && atlas import JOB_ID --wait

${chalk.dim('Documentation: https://atlas-app.com/docs/api')}
  `);
});

program.parse();
