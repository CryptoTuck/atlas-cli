# Atlas Copilot CLI

Generate complete Shopify stores, product pages, and funnel pages from product URLs using AI. Transform Amazon, AliExpress, Etsy, or any product listing into a fully-functional Shopify store with AI-generated themes, copy, and optimized layouts.

## Installation

```bash
npm install -g atlas-copilot-cli

# Or use directly with npx
npx atlas-copilot-cli
```

## Quick Start

```bash
# 1. Configure your API key (get it from Atlas app settings)
atlas auth --key "atlas_your_api_key"

# 2. Generate a store from a product URL
atlas generate --url "https://amazon.com/dp/B08N5WRWNW" --wait

# 3. Import to Shopify
atlas import JOB_ID --wait
```

## Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `atlas auth` | Configure API authentication |
| `atlas generate` | Generate a store or product page |
| `atlas status` | Check generation job status |
| `atlas import` | Import generated store to Shopify |
| `atlas import-status` | Check import job status |
| `atlas list` | List your generated stores |
| `atlas show` | Show details of a specific store |

### Resource Commands

| Command | Description |
|---------|-------------|
| `atlas templates` | List available Atlas theme templates |
| `atlas themes` | List your Shopify themes |
| `atlas products` | List your Shopify products |

### Funnel Commands

| Command | Description |
|---------|-------------|
| `atlas funnels` | List existing funnel pages |
| `atlas funnels generate` | Interactive funnel generation |
| `atlas listicle` | Generate a listicle funnel page |
| `atlas advertorial` | Generate an advertorial funnel page |

## Generation Types

### Full Store (default)
Creates a complete Shopify theme + product from a URL:
```bash
atlas generate --url "https://amazon.com/dp/B08N5WRWNW" --wait
```

### With Specific Template
```bash
atlas templates  # List available templates
atlas generate --url "..." --template-source atlas_library --template-id 5 --wait
```

### Product Page Only
Adds a product page to an existing theme:
```bash
atlas themes  # Get your theme ID
atlas generate --url "..." --type product_page --theme-id 123456789 --wait
```

### From Existing Shopify Product
```bash
atlas products  # Get product ID
atlas generate --product-id 123456789 --wait
```

## Funnel Pages

Generate high-converting marketing pages that drive traffic to your products.

### Listicles
List-style articles like "Top 10 Reasons to Try [Product]":
```bash
atlas listicle --product-id 123456789 --theme-id 184197480726 --wait
```

### Advertorials
Editorial-style native ad content:
```bash
atlas advertorial --product-id 123456789 --theme-id 184197480726 --wait
```

### Interactive Mode
Walk through all options step-by-step:
```bash
atlas funnels generate
```

### Funnel Options

| Option | Values | Description |
|--------|--------|-------------|
| `--product-id` | number | Shopify product ID (required) |
| `--theme-id` | number | Target Shopify theme (required) |
| `--angle` | `problem_solution`, `comparison`, `story`, `urgency` | Marketing angle |
| `--tone` | `professional`, `casual`, `urgent`, `luxury` | Writing tone |
| `--headline` | string | Custom headline (optional) |

## SDK Usage

```typescript
import { AtlasClient } from 'atlas-copilot-cli';

const atlas = new AtlasClient('atlas_your_api_key');

// Full pipeline: generate and import
const { generateResult, importResult } = await atlas.generateAndImport({
  url: 'https://amazon.com/dp/B08N5WRWNW'
});

console.log('Theme ID:', importResult.result?.theme_id);

// Generate with specific template
const job = await atlas.generate({
  url: 'https://amazon.com/dp/B08N5WRWNW',
  templateSource: 'atlas_library',
  templateId: '5'
});

// Wait for completion
const result = await atlas.waitForCompletion(job.job_id);

// List resources
const templates = await atlas.listTemplates();
const themes = await atlas.listThemes();
const products = await atlas.listProducts();
```

## Supported Product Sources

| Source | URL Pattern |
|--------|-------------|
| Amazon | `amazon.com/dp/...` |
| AliExpress | `aliexpress.com/item/...` |
| Etsy | `etsy.com/listing/...` |
| eBay | `ebay.com/itm/...` |
| Walmart | `walmart.com/ip/...` |
| Target | `target.com/p/...` |
| Shopify | Use `--product-id` flag |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ATLAS_API_KEY` | API key (alternative to `atlas auth`) |
| `ATLAS_API_BASE` | Custom API base URL |

## Documentation

- **Full API Reference:** See [SKILL.md](./SKILL.md)
- **Get API Key:** Atlas App → Settings → API Keys
- **Website:** https://helloatlas.io

## License

MIT
