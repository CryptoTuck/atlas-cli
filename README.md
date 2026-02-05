# Atlas Store CLI

Generate complete Shopify stores from product URLs using AI. Transform Amazon, AliExpress, Etsy, or any product listing into a full Shopify store with AI-generated themes, copy, and optimized layouts.

## Installation

```bash
npm install -g atlas-store-cli
# or use directly with npx
npx atlas-store-cli
```

## Quick Start

```bash
# Configure your API key
npx atlas-store-cli auth --key "atlas_your_api_key"

# Generate a store from an Amazon product
npx atlas-store-cli generate --url "https://amazon.com/dp/B08N5WRWNW" --wait

# Import to Shopify
npx atlas-store-cli import JOB_ID --wait
```

## Commands

| Command | Description |
|---------|-------------|
| `atlas auth` | Configure API authentication |
| `atlas generate` | Generate a store from product URL |
| `atlas status` | Check generation job status |
| `atlas import` | Import generated store to Shopify |
| `atlas import-status` | Check import job status |
| `atlas list` | List your generated stores |
| `atlas show` | Show details of a specific store |

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
