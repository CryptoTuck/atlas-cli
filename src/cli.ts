#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { authCommand } from './commands/auth.js';
import { generateCommand } from './commands/generate.js';
import { statusCommand } from './commands/status.js';
import { importCommand, importStatusCommand } from './commands/import.js';
import { listCommand, showCommand } from './commands/list.js';
import { templatesCommand } from './commands/templates.js';
import { themesCommand } from './commands/themes.js';
import { productsCommand } from './commands/products.js';

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
program.addCommand(templatesCommand);
program.addCommand(themesCommand);
program.addCommand(productsCommand);

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
  ${chalk.cyan('generate')}      Generate a new store or product page
  ${chalk.cyan('status')}        Check generation job status
  ${chalk.cyan('import')}        Import generated store to Shopify
  ${chalk.cyan('import-status')} Check import job status
  ${chalk.cyan('list')}          List your generated stores
  ${chalk.cyan('show')}          Show details of a specific store
  ${chalk.cyan('templates')}     List available Atlas theme templates
  ${chalk.cyan('themes')}        List your Shopify themes

${chalk.bold('Generation Types:')}
  ${chalk.dim('# Full store with theme (default)')}
  atlas generate --url "..." --type single_product_shop

  ${chalk.dim('# Product page only (into existing theme)')}
  atlas generate --url "..." --type product_page --theme-id 123

${chalk.bold('Template Sources:')}
  ${chalk.dim('# Use Atlas template library (default)')}
  atlas generate --url "..." --template-source atlas_library --template-id 5

  ${chalk.dim('# Base on your existing Shopify theme')}
  atlas generate --url "..." --template-source existing_theme --theme-id 123

  ${chalk.dim('# Use Atlas default template')}
  atlas generate --url "..." --template-source default

${chalk.bold('Examples:')}
  ${chalk.dim('# Generate from Amazon product')}
  atlas generate --url "https://amazon.com/dp/B08N5WRWNW" --wait

  ${chalk.dim('# Generate with specific template')}
  atlas templates                           # List available templates
  atlas generate --url "..." --template-id 5

  ${chalk.dim('# Generate product page into existing theme')}
  atlas themes                              # List your themes
  atlas generate --url "..." --type product_page --theme-id 123

  ${chalk.dim('# Full pipeline: generate and import')}
  atlas generate --url "..." --wait && atlas import JOB_ID --wait

${chalk.dim('Documentation: https://helloatlas.io/docs/api')}
  `);
});

program.parse();
