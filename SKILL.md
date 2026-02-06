---
name: atlas-copilot-cli
version: 0.1.0
description: Generate and manage Shopify stores programmatically via Atlas AI. Create full stores or product pages from Amazon, AliExpress, or Etsy product URLs with AI-generated themes, copy, and images.
homepage: https://helloatlas.io
metadata: {"atlas":{"emoji":"🏪","category":"ecommerce","api_base":"https://atlas-app.herokuapp.com/api/v1"}}
---

# Atlas Store CLI

Generate complete Shopify stores or product pages from product URLs using AI. Transform Amazon, AliExpress, Etsy, or any product listing into a full Shopify store with AI-generated themes, copy, and optimized layouts.

## Quick Start

**Option 1: CLI (Recommended for agents)**
```bash
# Configure API key (one-time)
npx atlas-copilot-cli auth --key "atlas_your_api_key"

# Generate a store from product URL
npx atlas-copilot-cli generate --url "https://amazon.com/dp/B08N5WRWNW" --wait

# Import to Shopify
npx atlas-copilot-cli import JOB_ID --wait
```

**Option 2: SDK (For programmatic use)**
```typescript
import { AtlasClient } from 'atlas-copilot-cli';

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
npx atlas-copilot-cli auth --key "atlas_your_api_key"
```

Or set the environment variable:
```bash
export ATLAS_API_KEY="atlas_your_api_key"
```

---

## Generation Types

### Full Store with Theme (default)
Generates a complete store including product, theme, and all pages.

```bash
atlas generate --url "..." --type single_product_shop
```

### Product Page Only
Generates just a product page and imports it into an existing theme.

```bash
atlas generate --url "..." --type product_page --theme-id 123456789
```

---

## Template Sources

### Atlas Template Library (default)
Use a pre-designed Atlas theme template.

```bash
# List available templates
atlas templates

# Generate with specific template
atlas generate --url "..." --template-source atlas_library --template-id 5
```

### Existing Theme
Base the generation on the merchant's existing Shopify theme.

```bash
# List merchant's themes
atlas themes

# Generate based on existing theme
atlas generate --url "..." --template-source existing_theme --theme-id 123456789
```

### Atlas Default
Use the default Atlas template (no template selection needed).

```bash
atlas generate --url "..." --template-source default
```

---

## Product Page Generation

When generating product pages (`--type product_page`):

### Atlas Default Layout
Use the standard Atlas product page sections.

```bash
atlas generate --url "..." --type product_page --theme-id 123 --page-template-source atlas_default
```

### Copy Existing Page Layout
Copy the layout from an existing product page template.

```bash
# List product page templates in a theme
atlas themes product-templates 123456789

# Generate with existing page template
atlas generate --url "..." --type product_page --theme-id 123 \
  --page-template-source existing_page --product-page-template "1"
```

---

## CLI Commands

### Generate a Store
```bash
# From Amazon product
npx atlas-copilot-cli generate --url "https://amazon.com/dp/B08N5WRWNW"

# With options
npx atlas-copilot-cli generate \
  --url "https://amazon.com/dp/B08N5WRWNW" \
  --language en \
  --region us \
  --template-source atlas_library \
  --template-id 5 \
  --wait

# Product page only
npx atlas-copilot-cli generate \
  --url "https://amazon.com/dp/B08N5WRWNW" \
  --type product_page \
  --theme-id 123456789 \
  --wait

# Interactive mode (prompts for all options)
npx atlas-copilot-cli generate
```

### List Templates
```bash
npx atlas-copilot-cli templates
npx atlas-copilot-cli templates show 5  # Show template details
```

### List Themes
```bash
npx atlas-copilot-cli themes
npx atlas-copilot-cli themes show 123456789  # Show theme details
npx atlas-copilot-cli themes product-templates 123456789  # List product page templates
```

### Check Status
```bash
npx atlas-copilot-cli status JOB_ID
npx atlas-copilot-cli status JOB_ID --wait
```

### Import to Shopify
```bash
npx atlas-copilot-cli import JOB_ID
npx atlas-copilot-cli import JOB_ID --wait
```

### List Stores
```bash
npx atlas-copilot-cli list
npx atlas-copilot-cli list --limit 50 --offset 0
```

---

## API Reference

### Generate Store
```
POST /api/v1/stores/generate
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | * | Product URL (Amazon, AliExpress, Etsy, etc.) |
| shopify_product_id | string | * | OR existing Shopify product ID |
| region | string | | Region code (us, uk, de, etc.) Default: us |
| language | string | | Language code (en, es, de, etc.) Default: en |
| type | string | | `single_product_shop` (default) or `product_page` |
| template_source | string | | `atlas_library`, `existing_theme`, or `default` |
| template_id | integer | | Atlas template ID (for template_source=atlas_library) |
| theme_id | integer | | Shopify theme ID (required for product_page) |
| page_template_source | string | | `atlas_default` or `existing_page` |
| product_page_template | string | | Product page template name |
| research_context_id | integer | | Research context ID for ICP-specific generation |

*One of `url` or `shopify_product_id` is required.

**Response:**
```json
{
  "job_id": "abc-123",
  "status": "pending",
  "type": "single_product_shop",
  "poll_url": "/api/v1/stores/abc-123/status",
  "message": "Store generation started."
}
```

### Check Status
```
GET /api/v1/stores/:job_id/status
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

### Import to Shopify
```
POST /api/v1/stores/:job_id/import
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| only_import_product | boolean | Only import product, not theme (for product pages) |

### List Templates
```
GET /api/v1/templates
```

**Response:**
```json
{
  "templates": [
    {
      "id": 1,
      "name": "Atlas Default",
      "theme_version": "3.0",
      "stores_using": 1500
    }
  ],
  "total": 15
}
```

### List Merchant Themes
```
GET /api/v1/themes
```

**Response:**
```json
{
  "themes": [
    {
      "id": 123456789,
      "name": "My Store Theme",
      "role": "main",
      "is_atlas_theme": true,
      "atlas_version": "3.0"
    }
  ]
}
```

### Get Theme Product Templates
```
GET /api/v1/themes/:id/product_templates
```

---

## SDK Usage

```typescript
import { AtlasClient } from 'atlas-copilot-cli';

const atlas = new AtlasClient('atlas_your_api_key');

// List available templates
const templates = await atlas.listTemplates();
console.log(templates.templates);

// List merchant themes
const themes = await atlas.listThemes();
console.log(themes.themes);

// Generate with specific template
const job = await atlas.generate({
  url: 'https://amazon.com/dp/B08N5WRWNW',
  templateSource: 'atlas_library',
  templateId: '5',
  language: 'en',
});

// Wait and import
const result = await atlas.waitForCompletion(job.job_id);
if (result.status === 'completed') {
  await atlas.import(job.job_id);
}

// Or use the full pipeline
const { importResult } = await atlas.generateAndImport({
  url: 'https://amazon.com/dp/B08N5WRWNW',
});
console.log('Theme ID:', importResult.theme_id);
```

### Product Page Generation

```typescript
// Get merchant's themes
const themes = await atlas.listThemes();
const atlasTheme = themes.themes.find(t => t.is_atlas_theme);

// Generate product page into existing theme
const job = await atlas.generate({
  url: 'https://amazon.com/dp/B08N5WRWNW',
  type: 'product_page',
  themeId: atlasTheme.id.toString(),
  pageTemplateSource: 'atlas_default',
});

// Import (only product, no theme)
await atlas.import(job.job_id, { onlyImportProduct: true });
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
| 422 | theme_id required | Product page generation requires theme_id |

---

## Rate Limits

- **100 requests per minute** per API key
- **10 concurrent generation jobs** per shop
- Generation jobs typically take 1-3 minutes
- Import jobs typically take 30-60 seconds

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stores/generate` | POST | Start store generation |
| `/stores/:id/status` | GET | Check generation status |
| `/stores/:id/import` | POST | Import to Shopify |
| `/stores/:id/import_status` | GET | Check import status |
| `/stores` | GET | List generated stores |
| `/stores/:id` | GET | Get store details |
| `/templates` | GET | List Atlas theme templates |
| `/templates/:id` | GET | Get template details |
| `/themes` | GET | List merchant Shopify themes |
| `/themes/:id` | GET | Get theme details |
| `/themes/:id/product_templates` | GET | List product page templates |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ATLAS_API_KEY` | Your Atlas API key |
| `ATLAS_API_BASE` | Custom API base URL (optional) |

---

## Links

- **Documentation:** https://helloatlas.io/docs/api
- **Get API Key:** Atlas App > Settings > API Keys
- **Support:** support@helloatlas.io
