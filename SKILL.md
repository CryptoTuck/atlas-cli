---
name: atlas-store-cli
version: 0.1.0
description: Generate and manage Shopify stores programmatically via Atlas AI. Create full stores from Amazon, AliExpress, or Etsy product URLs with AI-generated themes, copy, and images.
homepage: https://atlas-app.com
metadata: {"atlas":{"emoji":"🏪","category":"ecommerce","api_base":"https://atlas-app.herokuapp.com/api/v1"}}
---

# Atlas Store CLI

Generate complete Shopify stores from product URLs using AI. Transform Amazon, AliExpress, Etsy, or any product listing into a full Shopify store with AI-generated themes, copy, and optimized layouts.

## Quick Start

**Option 1: CLI (Recommended for agents)**
```bash
# Configure API key (one-time)
npx atlas-store-cli auth --key "atlas_your_api_key"

# Generate a store from product URL
npx atlas-store-cli generate --url "https://amazon.com/dp/B08N5WRWNW" --wait

# Import to Shopify
npx atlas-store-cli import JOB_ID --wait
```

**Option 2: SDK (For programmatic use)**
```typescript
import { AtlasClient } from 'atlas-store-cli';

const atlas = new AtlasClient('atlas_your_api_key');
const { generateResult, importResult } = await atlas.generateAndImport({
  url: 'https://amazon.com/dp/B08N5WRWNW'
});
```

**Option 3: API (curl)**
```bash
curl -X POST https://atlas-app.herokuapp.com/api/v1/stores/generate \
  -H "X-Atlas-Api-Key: atlas_your_key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://amazon.com/dp/B08N5WRWNW"}'
```

**Base URL:** `https://atlas-app.herokuapp.com/api/v1`

---

## Authentication

Get your API key from the Atlas app settings page, then configure:

```bash
npx atlas-store-cli auth --key "atlas_your_api_key"
```

Or set the environment variable:
```bash
export ATLAS_API_KEY="atlas_your_api_key"
```

---

## Generate a Store

Generate a complete Shopify store from a product URL:

### Via CLI
```bash
# From Amazon product
npx atlas-store-cli generate --url "https://amazon.com/dp/B08N5WRWNW"

# With options
npx atlas-store-cli generate \
  --url "https://amazon.com/dp/B08N5WRWNW" \
  --language en \
  --region us \
  --wait

# From AliExpress
npx atlas-store-cli generate --url "https://aliexpress.com/item/..." --wait

# From Etsy
npx atlas-store-cli generate --url "https://etsy.com/listing/..." --wait
```

### Via API
```bash
curl -X POST https://atlas-app.herokuapp.com/api/v1/stores/generate \
  -H "X-Atlas-Api-Key: atlas_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://amazon.com/dp/B08N5WRWNW",
    "region": "us",
    "language": "en",
    "type": "single_product_shop"
  }'
```

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes* | Product URL (Amazon, AliExpress, Etsy, etc.) |
| `shopify_product_id` | Yes* | OR use existing Shopify product ID |
| `region` | No | Region code: us, uk, de, fr, etc. (default: us) |
| `language` | No | Language: en, es, de, fr, etc. (default: en) |
| `type` | No | `single_product_shop` or `product_page` (default: single_product_shop) |
| `template_id` | No | Theme template ID to use as base |

*Either `url` or `shopify_product_id` is required.

**Response:**
```json
{
  "job_id": "abc123-def456-...",
  "status": "pending",
  "poll_url": "/api/v1/stores/abc123.../status",
  "message": "Store generation started. Poll the status endpoint to check progress."
}
```

---

## Check Generation Status

### Via CLI
```bash
npx atlas-store-cli status JOB_ID

# Wait for completion
npx atlas-store-cli status JOB_ID --wait
```

### Via API
```bash
curl https://atlas-app.herokuapp.com/api/v1/stores/JOB_ID/status \
  -H "X-Atlas-Api-Key: atlas_your_key"
```

**Response:**
```json
{
  "job_id": "abc123...",
  "status": "completed",
  "percentage_complete": 100,
  "history_id": 12345,
  "result": {
    "product_name": "Premium Wireless Headphones",
    "product_price": "$49.99",
    "product_images": 6
  }
}
```

**Status values:** `pending`, `processing`, `completed`, `failed`

---

## Import to Shopify

Once generation is complete, import the store to Shopify:

### Via CLI
```bash
npx atlas-store-cli import JOB_ID

# Wait for import to complete
npx atlas-store-cli import JOB_ID --wait
```

### Via API
```bash
curl -X POST https://atlas-app.herokuapp.com/api/v1/stores/JOB_ID/import \
  -H "X-Atlas-Api-Key: atlas_your_key"
```

**Response:**
```json
{
  "status": "importing",
  "import_job_id": "xyz789...",
  "poll_url": "/api/v1/stores/xyz789.../import_status",
  "message": "Import started. Poll the import status endpoint to check progress."
}
```

---

## List Generated Stores

### Via CLI
```bash
npx atlas-store-cli list
npx atlas-store-cli list --limit 50 --offset 0
```

### Via API
```bash
curl "https://atlas-app.herokuapp.com/api/v1/stores?limit=20&offset=0" \
  -H "X-Atlas-Api-Key: atlas_your_key"
```

---

## Full Pipeline Example

### CLI: Generate and Import
```bash
# Generate and wait for completion
npx atlas-store-cli generate --url "https://amazon.com/dp/B08N5WRWNW" --wait

# Note the job ID from output, then import
npx atlas-store-cli import abc123-job-id --wait
```

### SDK: Full Automation
```typescript
import { AtlasClient } from 'atlas-store-cli';

const atlas = new AtlasClient(process.env.ATLAS_API_KEY!);

async function createStore(productUrl: string) {
  console.log('Starting store generation...');
  
  const result = await atlas.generateAndImport(
    { url: productUrl, language: 'en', region: 'us' },
    {
      onGenerateProgress: (s) => console.log(`Generating: ${s.percentage_complete}%`),
      onImportProgress: (s) => console.log(`Importing: ${s.percentage_complete}%`),
    }
  );
  
  console.log('Store created!');
  console.log('Product:', result.generateResult.result?.product_name);
  console.log('Theme ID:', result.importResult.result?.theme_id);
  
  return result;
}

createStore('https://amazon.com/dp/B08N5WRWNW');
```

### API: Curl Pipeline
```bash
#!/bin/bash
API_KEY="atlas_your_key"
URL="https://amazon.com/dp/B08N5WRWNW"

# Start generation
JOB=$(curl -s -X POST "https://atlas-app.herokuapp.com/api/v1/stores/generate" \
  -H "X-Atlas-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\"}")

JOB_ID=$(echo $JOB | jq -r '.job_id')
echo "Job started: $JOB_ID"

# Poll until complete
while true; do
  STATUS=$(curl -s "https://atlas-app.herokuapp.com/api/v1/stores/$JOB_ID/status" \
    -H "X-Atlas-Api-Key: $API_KEY")
  
  CURRENT=$(echo $STATUS | jq -r '.status')
  PERCENT=$(echo $STATUS | jq -r '.percentage_complete')
  
  echo "Status: $CURRENT ($PERCENT%)"
  
  if [ "$CURRENT" = "completed" ] || [ "$CURRENT" = "failed" ]; then
    break
  fi
  
  sleep 5
done

# Import if successful
if [ "$CURRENT" = "completed" ]; then
  curl -X POST "https://atlas-app.herokuapp.com/api/v1/stores/$JOB_ID/import" \
    -H "X-Atlas-Api-Key: $API_KEY"
fi
```

---

## Supported Product Sources

Atlas can generate stores from products on:

- **Amazon** - `amazon.com/dp/...` or `amazon.com/gp/...`
- **AliExpress** - `aliexpress.com/item/...`
- **Etsy** - `etsy.com/listing/...`
- **eBay** - `ebay.com/itm/...`
- **Walmart** - `walmart.com/ip/...`
- **Target** - `target.com/p/...`
- **Shopify products** - Use `shopify_product_id` parameter

---

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error message here",
  "details": { ... }
}
```

**Common errors:**
| Status | Error | Solution |
|--------|-------|----------|
| 401 | Invalid API key | Check your API key is correct |
| 403 | Missing scope | API key needs the required permission |
| 404 | Job not found | Job ID doesn't exist or expired |
| 429 | Rate limited | Wait before making more requests |
| 422 | Invalid URL | Check the product URL is valid |

---

## Rate Limits

- **100 requests per minute** per API key
- Generation jobs may take 1-5 minutes depending on complexity
- Import jobs typically take 30-60 seconds

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stores/generate` | POST | Start store generation |
| `/stores/:id/status` | GET | Check generation status |
| `/stores/:id/import` | POST | Import to Shopify |
| `/stores/:id/import_status` | GET | Check import status |
| `/stores` | GET | List generated stores |
| `/stores/:id` | GET | Get store details |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ATLAS_API_KEY` | Your Atlas API key |
| `ATLAS_API_BASE` | Custom API base URL (optional) |

---

## Links

- **Documentation:** https://atlas-app.com/docs/api
- **Get API Key:** Atlas App > Settings > API Keys
- **Support:** support@helloatlas.io
