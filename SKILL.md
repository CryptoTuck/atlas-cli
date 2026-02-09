---
name: atlas-copilot-cli
version: 0.1.0
description: Generate and manage Shopify stores programmatically via Atlas AI. Create full stores or product pages from Amazon, AliExpress, or Etsy product URLs with AI-generated themes, copy, and images.
homepage: https://helloatlas.io
metadata: {"atlas":{"emoji":"🏪","category":"ecommerce","api_base":"https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1"}}
---

# Atlas Copilot CLI

Generate complete Shopify stores or product pages from product URLs using AI. Transform Amazon, AliExpress, Etsy, or any product listing into a full Shopify store with AI-generated themes, copy, and optimized layouts.

---

## What is Atlas?

Atlas is an AI-powered Shopify app that automates store creation for e-commerce entrepreneurs. Instead of manually building a Shopify store (which takes hours or days), Atlas can generate a complete, professional store in minutes.

### What Atlas Does

1. **Product Scraping**: Takes a product URL (Amazon, AliExpress, Etsy, etc.) and extracts all product data - title, description, images, variants, pricing
2. **AI Content Generation**: Uses AI to rewrite product descriptions, generate marketing copy, create SEO-optimized content, and craft compelling headlines
3. **Theme Generation**: Creates a complete Shopify theme with homepage, product pages, FAQ, contact page, and all necessary sections
4. **Product Import**: Creates the actual Shopify product with all variants, images, and metadata
5. **Theme Installation**: Installs the generated theme to the merchant's Shopify store

### The Atlas Theme System

Atlas uses its own custom Shopify theme called "Atlas Bolt" which has 35+ customizable sections. When you generate a store:
- The theme is pre-configured with your product's branding
- Colors, fonts, and styles are automatically selected based on the product
- All sections are populated with AI-generated content
- The theme is optimized for conversions with proven layouts

### Atlas Template Library

Atlas maintains a library of pre-designed theme templates that merchants can choose from. Each template has:
- Different visual styles (minimal, bold, luxury, etc.)
- Pre-configured section layouts
- Optimized for different product categories
- Proven conversion rates from real stores

---

## How Store Generation Works

### The Generation Pipeline

When you call the generate endpoint, here's what happens behind the scenes:

```
1. SCRAPE → Extract product data from source URL
2. ANALYZE → AI analyzes the product to understand category, target audience, brand voice
3. GENERATE → AI creates all store content (copy, headlines, descriptions)
4. BUILD → Theme files are assembled with the generated content
5. PREPARE → Everything is packaged and ready for import
```

### Generation Types Explained

#### 1. Full Store Generation (`single_product_shop`)

This is the default and most common flow. It creates:
- A complete Shopify product with all variants and images
- A full Atlas theme with homepage, product page, FAQ, contact page
- All theme sections populated with AI-generated content
- Color scheme and branding based on product images

**When to use**: Starting a new store, launching a new product line, creating a dedicated landing page store.

**What you get**:
- New Shopify theme (appears in Themes section)
- New Shopify product (appears in Products section)
- Ready-to-publish store

#### 2. Product Page Only (`product_page`)

This generates just a product page and adds it to an existing theme. It creates:
- A new product page template in the existing theme
- AI-generated content for that specific product
- The Shopify product with variants and images

**When to use**: Adding products to an existing store, expanding product catalog, A/B testing product pages.

**What you get**:
- New product page template added to existing theme
- New Shopify product
- No changes to homepage or other pages

---

## Template Sources Explained

### 1. Atlas Template Library (`atlas_library`)

Use a pre-designed template from Atlas's curated library. These templates are:
- Professionally designed by Atlas team
- Optimized for conversions
- Regularly updated with new designs
- Categorized by style and use case

**How it works**:
1. Call `GET /templates` to see available templates
2. Choose a template ID
3. Pass `template_source: "atlas_library"` and `template_id: X`
4. Atlas uses that template's layout but fills it with your product's content

**Best for**: Most users who want a proven, professional design.

### 2. Existing Theme (`existing_theme`)

Base the generation on a theme already in the merchant's Shopify store. This:
- Copies the layout and structure from their theme
- Preserves their existing branding and styles
- Fills in new content for the product

**How it works**:
1. Call `GET /themes` to list merchant's Shopify themes
2. Choose a theme ID
3. Pass `template_source: "existing_theme"` and `theme_id: X`
4. Atlas analyzes that theme and generates a new one with the same structure

**Best for**: Merchants who have a theme they love and want to replicate its style.

### 3. Atlas Default (`default`)

Uses the standard Atlas Default template. This is:
- The most tested and optimized template
- A safe choice that works for any product
- The fallback when no template is specified

**How it works**: Just don't pass any template parameters, or explicitly set `template_source: "default"`.

**Best for**: Quick generations, testing, or when you don't have a preference.

---

## Product Page Template Sources Explained

When generating a product page (`type: "product_page"`), you choose how the page layout is created:

### 1. Atlas Default Layout (`atlas_default`)

Uses Atlas's optimized product page section layout. This includes:
- Hero section with product images
- Product details with variants
- Trust badges and guarantees
- Customer reviews section
- FAQ section
- Related products

**Best for**: Most product pages, proven conversion layout.

### 2. Existing Page Template (`existing_page`)

Copies the layout from an existing product page in the theme. This:
- Finds a specific product page template (like `product.my-template.json`)
- Copies its section structure
- Fills it with new AI-generated content

**How it works**:
1. Call `GET /themes/:id/product_templates` to list product page templates
2. Choose a template name (e.g., "my-template")
3. Pass `page_template_source: "existing_page"` and `product_page_template: "my-template"`

**Best for**: Maintaining consistent product page layouts across your store.

---

## Step-by-Step Workflows

### Workflow 1: Generate a New Store from Scratch

```bash
# Step 1: Authenticate
atlas auth --key "atlas_your_api_key"

# Step 2: (Optional) Browse available templates
atlas templates

# Step 3: Generate the store
atlas generate --url "https://amazon.com/dp/B08N5WRWNW" --wait

# Step 4: Import to Shopify
atlas import JOB_ID --wait

# Done! Check Shopify admin for your new theme and product
```

### Workflow 2: Generate with a Specific Template

```bash
# Step 1: List available templates
atlas templates
# Output shows: 1=Atlas Default, 2=Lumin, 3=LucidLab, etc.

# Step 2: Generate with chosen template
atlas generate \
  --url "https://amazon.com/dp/B08N5WRWNW" \
  --template-source atlas_library \
  --template-id 2 \
  --wait

# Step 3: Import
atlas import JOB_ID --wait
```

### Workflow 3: Add Product Page to Existing Store

```bash
# Step 1: List your Shopify themes to find the one you want
atlas themes
# Output shows theme IDs and names

# Step 2: (Optional) See what product page templates exist
atlas themes product-templates 184197480726

# Step 3: Generate product page only
atlas generate \
  --url "https://amazon.com/dp/B08N5WRWNW" \
  --type product_page \
  --theme-id 184197480726 \
  --page-template-source atlas_default \
  --wait

# Step 4: Import (product only, no new theme)
atlas import JOB_ID --wait
```

### Workflow 4: Clone a Product Page Layout

```bash
# Step 1: Find the product page template you want to copy
atlas themes product-templates 184197480726
# Output: "premium-product", "default", etc.

# Step 2: Generate new product page using that template's layout
atlas generate \
  --url "https://amazon.com/dp/B08N5WRWNW" \
  --type product_page \
  --theme-id 184197480726 \
  --page-template-source existing_page \
  --product-page-template "premium-product" \
  --wait

# Step 3: Import
atlas import JOB_ID --wait
```

---

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
curl -X POST https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/stores/generate \
  -H "X-Atlas-Api-Key: atlas_your_key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://amazon.com/dp/B08N5WRWNW"}'
```

**Base URL:** `https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1`

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

## Complete API Reference

### Generate Store
```
POST /api/v1/stores/generate
```

**Full curl example:**
```bash
curl -X POST "https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/stores/generate" \
  -H "X-Atlas-Api-Key: atlas_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://amazon.com/dp/B08N5WRWNW",
    "type": "single_product_shop",
    "template_source": "atlas_library",
    "template_id": 1,
    "language": "en",
    "region": "us"
  }'
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

**curl example:**
```bash
curl "https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/stores/abc-123/status" \
  -H "X-Atlas-Api-Key: atlas_your_key"
```

**Response (in progress):**
```json
{
  "job_id": "abc-123",
  "status": "processing",
  "percentage_complete": 45
}
```

**Response (completed):**
```json
{
  "job_id": "abc123...",
  "status": "completed",
  "percentage_complete": 100,
  "history_id": 12345,
  "import_url": "/api/v1/stores/abc123/import",
  "result": {
    "product_name": "Premium Wireless Headphones",
    "product_price": "$49.99",
    "product_images": 6
  }
}
```

**Status values:**
- `pending` - Job queued, waiting to start
- `processing` - Generation in progress
- `completed` - Ready for import
- `failed` - Generation failed (check `error` field)

### Import to Shopify
```
POST /api/v1/stores/:job_id/import
```

**curl example:**
```bash
curl -X POST "https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/stores/abc-123/import" \
  -H "X-Atlas-Api-Key: atlas_your_key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| only_import_product | boolean | Only import product, not theme (for product pages) |

### List Templates
```
GET /api/v1/templates
```

**curl example:**
```bash
curl "https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/templates" \
  -H "X-Atlas-Api-Key: atlas_your_key"
```

**Response:**
```json
{
  "templates": [
    {
      "id": 1,
      "name": "Atlas Default",
      "theme_version": "3.0",
      "stores_using": 8937
    }
  ],
  "total": 3
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
      "id": 184197480726,
      "name": "Atlas Theme 13",
      "role": "unpublished",
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

**Response:**
```json
{
  "theme_id": 184197480726,
  "product_templates": [
    { "key": "templates/product.json", "name": "default" },
    { "key": "templates/product.premium.json", "name": "premium" }
  ]
}
```

---

## SDK Usage

```typescript
import { AtlasClient } from 'atlas-copilot-cli';

const atlas = new AtlasClient('atlas_your_api_key');

// List available templates
const templates = await atlas.listTemplates();

// Generate with specific template
const job = await atlas.generate({
  url: 'https://amazon.com/dp/B08N5WRWNW',
  templateSource: 'atlas_library',
  templateId: '5',
});

// Wait and import
const result = await atlas.waitForCompletion(job.job_id);
if (result.status === 'completed') {
  await atlas.import(job.job_id);
}

// Full pipeline
const { importResult } = await atlas.generateAndImport({
  url: 'https://amazon.com/dp/B08N5WRWNW',
});
```

---

## Generating from Existing Shopify Products

Instead of using a product URL, you can generate from products already in the merchant's Shopify store.

### List Available Products
```bash
atlas products
atlas products --limit 50
atlas products --query "headphones"
```

### Via API
```bash
curl "https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/products?limit=20" \
  -H "X-Atlas-Api-Key: atlas_your_key"
```

**Response:**
```json
{
  "products": [
    {
      "id": "gid://shopify/Product/123456789",
      "numeric_id": 123456789,
      "title": "Premium Wireless Headphones",
      "handle": "premium-wireless-headphones",
      "status": "ACTIVE",
      "featured_image": "https://cdn.shopify.com/...",
      "price_range": { "min": "49.99", "max": "79.99", "currency": "USD" }
    }
  ],
  "page_info": { "has_next_page": true, "next_cursor": "..." }
}
```

### Generate from Product ID
```bash
# Use numeric_id or full GID
atlas generate --product-id 123456789 --wait
```

Or via curl:
```bash
curl -X POST "https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/stores/generate" \
  -H "X-Atlas-Api-Key: atlas_your_key" \
  -H "Content-Type: application/json" \
  -d '{"shopify_product_id": "123456789"}'
```

---

## Funnel Pages: Listicles and Advertorials

Atlas can generate high-converting funnel pages that drive traffic to your products. These are standalone pages added to your theme that use proven marketing formats.

### What Are Funnel Pages?

**Listicles** are "list-style" articles like:
- "Top 10 Reasons to Switch to [Product]"
- "5 Ways [Product] Will Change Your Life"
- "Why Experts Recommend [Product] in 2026"

**Advertorials** are editorial-style native ad content that looks like a news article or blog post but promotes your product. They're designed to warm up cold traffic before sending them to your product page.

### Why Use Funnel Pages?

1. **Better for paid ads** - Cold traffic converts better when they read engaging content first
2. **SEO value** - Rank for informational keywords
3. **Build trust** - Editorial content feels less "salesy" than product pages
4. **Retargeting** - Warm up visitors before showing them your product

### Generating Funnel Pages

**Important:** Funnel generation requires an existing Shopify product. If you have a product URL (Amazon, AliExpress, etc.), first generate a store to create the product, then use that product for funnels.

**Recommended workflow:**
```bash
# Step 1: Generate a store from product URL (creates Shopify product)
atlas generate --url "https://amazon.com/dp/B08N5WRWNW" --wait

# Step 2: Import to create the product in Shopify
atlas import JOB_ID --wait

# Step 3: List your products to get the product ID
atlas products

# Step 4: Generate a funnel page using the product ID
atlas listicle --product-id 123456789 --theme-id 184197480726 --wait
```

**Interactive mode (recommended for first-time use):**
```bash
atlas funnels generate
```

This walks you through:
1. Choosing funnel type (listicle or advertorial)
2. Providing Shopify product ID
3. Selecting target theme
4. Choosing marketing angle and tone
5. Optional custom headline

**Direct commands:**
```bash
# Generate a listicle
atlas listicle --product-id 123456789 --theme-id 184197480726 --wait

# Generate an advertorial
atlas advertorial --product-id 123456789 --theme-id 184197480726 --wait
```

**With custom context:**
```bash
atlas listicle \
  --product-id 123456789 \
  --theme-id 184197480726 \
  --context "Focus on noise cancellation and battery life" \
  --wait
```

### Funnel Options

| Option | Required | Description |
|--------|----------|-------------|
| `--product-id` | Yes | Shopify product ID (numeric) |
| `--theme-id` | Yes | Target Shopify theme ID |
| `--context` | No | Custom context for AI generation |
| `--wait` | No | Wait for generation to complete |

### API Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `product_id` | Yes | Shopify product ID (numeric or GID) |
| `theme_id` | Yes | Shopify theme ID to add the page to |
| `custom_context` | No | Additional context for AI generation |

### Checking Funnel Status

```bash
atlas funnels status JOB_ID
```

### Via API

**Generate Listicle:**
```bash
curl -X POST "https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/funnels/listicle" \
  -H "X-Atlas-Api-Key: atlas_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "123456789",
    "theme_id": "184197480726",
    "custom_context": "Focus on noise cancellation features"
  }'
```

**Generate Advertorial:**
```bash
curl -X POST "https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/funnels/advertorial" \
  -H "X-Atlas-Api-Key: atlas_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "123456789",
    "theme_id": "184197480726"
  }'
```

**Response:**
```json
{
  "funnel_id": 123,
  "status": "generating",
  "content_type": "listicle",
  "poll_url": "/api/v1/funnels/123/status",
  "message": "Listicle generation started."
}
```

**Check Status:**
```bash
curl "https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/funnels/123/status" \
  -H "X-Atlas-Api-Key: atlas_your_key"
```

**Status Response:**
```json
{
  "id": 123,
  "status": "generated",
  "percentage_complete": 100,
  "content_type": "listicle",
  "import_url": "/api/v1/funnels/123/import"
}
```

**Import Funnel to Theme:**
```bash
curl -X POST "https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/funnels/123/import" \
  -H "X-Atlas-Api-Key: atlas_your_key"
```

**Import Response:**
```json
{
  "status": "importing",
  "job_id": "abc-123-def",
  "poll_url": "/api/v1/funnels/import_status/abc-123-def",
  "message": "Funnel import started. Poll the status endpoint to check progress."
}
```

**Check Import Status:**
```bash
curl "https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/funnels/import_status/abc-123-def" \
  -H "X-Atlas-Api-Key: atlas_your_key"
```

**Import Completed Response:**
```json
{
  "job_id": "abc-123-def",
  "status": "completed",
  "percentage_complete": 100,
  "page_handle": "10-reasons-premium-wireless-headphones",
  "template_suffix": "listicle-123"
}
```

**List All Funnels:**
```bash
curl "https://shopify-dropshipt-staging-a7146a2f286d.herokuapp.com/api/v1/funnels?content_type=listicle&limit=20" \
  -H "X-Atlas-Api-Key: atlas_your_key"
```

### Funnel Page Workflow

```bash
# Step 1: List your themes to find the target
atlas themes

# Step 2: List your products to get a product ID
atlas products

# Step 3: Generate a listicle for the product
atlas listicle --product-id 123456789 --theme-id 184197480726 --wait

# Step 4: The funnel page is added to your theme
# View at /pages/{page_handle}
```

**Note:** Funnels require an existing Shopify product. If starting from a product URL:
```bash
# First generate and import a store to create the product
atlas generate --url "https://amazon.com/dp/B08N5WRWNW" --wait
atlas import JOB_ID --wait

# Then use the product for funnels
atlas products  # Get the product ID
atlas listicle --product-id 123456789 --theme-id 184197480726 --wait
```

### Best Practices for Funnel Pages

1. **Create the product first** - Funnels require an existing Shopify product
2. **Use listicles for SEO** - They rank well for "best X", "top X" keywords
3. **Use advertorials for paid traffic** - They warm up cold traffic before the sale
4. **Add custom context** - Tell the AI what to focus on for better results
5. **Generate multiple variations** - Test different approaches for the same product

---

## Supported Product Sources

| Source | URL Pattern | Example |
|--------|-------------|---------|
| Amazon | `amazon.com/dp/...` | `https://amazon.com/dp/B08N5WRWNW` |
| AliExpress | `aliexpress.com/item/...` | `https://aliexpress.com/item/123.html` |
| Etsy | `etsy.com/listing/...` | `https://etsy.com/listing/123/name` |
| eBay | `ebay.com/itm/...` | `https://ebay.com/itm/123` |
| Walmart | `walmart.com/ip/...` | `https://walmart.com/ip/Name/123` |
| Target | `target.com/p/...` | `https://target.com/p/name/-/A-123` |
| **Shopify** | Use `--product-id` | `atlas generate --product-id 123456789` |

---

## Error Handling

**Common errors:**
| Status | Error | Solution |
|--------|-------|----------|
| 401 | Invalid API key | Check your API key |
| 403 | Missing scope | API key needs permission |
| 404 | Job not found | Job ID invalid or expired |
| 422 | theme_id required | Product page needs theme_id |

---

## Rate Limits

- **100 requests per minute** per API key
- **10 concurrent generation jobs** per shop
- Generation: 1-3 minutes
- Import: 30-60 seconds

---

## Links

- **Documentation:** https://helloatlas.io/docs/api
- **Get API Key:** Atlas App > Settings > API Keys
- **Support:** support@helloatlas.io
