# Atlas Store CLI

Generate complete Shopify stores or product pages from product URLs using AI. Transform Amazon, AliExpress, Etsy, or any product listing into a full Shopify store with AI-generated themes, copy, and optimized layouts.

## Installation

```bash
npm install -g atlas-store-cli
# or use directly with npx
npx atlas-store-cli
```

## Quick Start

```bash
# Configure your API key
atlas auth --key "atlas_your_api_key"

# Generate a store from a product URL
atlas generate --url "https://amazon.com/dp/B08N5WRWNW" --wait

# Import to Shopify
atlas import JOB_ID --wait
```

## Commands

| Command | Description |
|---------|-------------|
| `atlas auth` | Configure API authentication |
| `atlas generate` | Generate a store or product page |
| `atlas status` | Check generation job status |
| `atlas import` | Import generated store to Shopify |
| `atlas import-status` | Check import job status |
| `atlas list` | List your generated stores |
| `atlas show` | Show details of a specific store |
| `atlas templates` | List available Atlas theme templates |
| `atlas themes` | List your Shopify themes |

## Generation Types

### Full Store (default)
```bash
atlas generate --url "https://amazon.com/dp/B08N5WRWNW" --wait
```

### With Specific Template
```bash
atlas templates  # List available templates
atlas generate --url "..." --template-source atlas_library --template-id 5 --wait
```

### Product Page Only
```bash
atlas themes  # Get your theme ID
atlas generate --url "..." --type product_page --theme-id 123456789 --wait
```

### Based on Existing Theme
```bash
atlas generate --url "..." --template-source existing_theme --theme-id 123456789 --wait
```

## SDK Usage

```typescript
import { AtlasClient } from 'atlas-store-cli';

const atlas = new AtlasClient('atlas_your_api_key');

// Full pipeline: generate and import
const result = await atlas.generateAndImport({
  url: 'https://amazon.com/dp/B08N5WRWNW',
  language: 'en',
  region: 'us'
});

console.log('Theme ID:', result.importResult.result?.theme_id);

// List templates
const templates = await atlas.listTemplates();

// Generate product page
const job = await atlas.generate({
  url: 'https://amazon.com/dp/B08N5WRWNW',
  type: 'product_page',
  themeId: '123456789'
});
```

## Supported Sources

- Amazon (`amazon.com/dp/...`)
- AliExpress (`aliexpress.com/item/...`)
- Etsy (`etsy.com/listing/...`)
- eBay (`ebay.com/itm/...`)
- Walmart (`walmart.com/ip/...`)
- Target (`target.com/p/...`)
- Existing Shopify products

## Documentation

See [SKILL.md](./SKILL.md) for complete API documentation.

## License

MIT
