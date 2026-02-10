import { getApiKey, getApiBase } from './config.js';

export interface GenerateOptions {
  url?: string;
  shopifyProductId?: string;
  region?: string;
  language?: string;
  type?: 'single_product_shop' | 'product_page';
  templateSource?: 'atlas_library' | 'existing_theme' | 'default';
  templateId?: string;
  themeId?: string;
  pageTemplateSource?: 'atlas_default' | 'existing_page';
  productPageTemplate?: string;
  researchContextId?: string;
}

export interface FunnelGenerateOptions {
  url?: string;
  shopifyProductId?: string;
  funnelType: 'listicle' | 'advertorial';
  themeId: string;
  headline?: string;
  angle?: 'problem_solution' | 'comparison' | 'story' | 'urgency';
  tone?: 'professional' | 'casual' | 'urgent' | 'luxury';
  language?: string;
}

export interface FunnelGenerateResponse {
  job_id: string;
  status: string;
  funnel_type: 'listicle' | 'advertorial';
  poll_url: string;
  message: string;
}

export interface FunnelStatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  percentage_complete: number;
  funnel_type?: 'listicle' | 'advertorial';
  result?: {
    page_title?: string;
    page_handle?: string;
    preview_url?: string;
    sections_count?: number;
  };
  error?: string;
}

export interface GenerateResponse {
  job_id: string;
  status: string;
  type: string;
  poll_url: string;
  message: string;
}

export interface StatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  percentage_complete: number;
  history_id?: number;
  import_url?: string;
  result?: {
    product_name?: string;
    product_price?: string;
    product_images?: number;
    theme_id?: number;
  };
  error?: string;
}

export interface ImportResponse {
  status: string;
  import_job_id: string;
  poll_url: string;
  message: string;
}

export interface Store {
  id: number;
  created_at: string;
  updated_at: string;
  theme_version?: string;
  type: string;
  product_name?: string;
  source_url?: string;
  theme_id?: number;
  status?: string;
}

export interface ListStoresResponse {
  stores: Store[];
  total: number;
  limit: number;
  offset: number;
}

export interface Template {
  id: number;
  name: string;
  theme_version: string;
  theme_version_folder: string;
  thumbnail_url?: string;
  thumbnail_mobile_url?: string;
  badge_text?: string;
  stores_using: number;
  category?: string;
  description?: string;
}

export interface ListTemplatesResponse {
  templates: Template[];
  total: number;
  limit: number;
  offset: number;
}

export interface Theme {
  id: number;
  name: string;
  role: string;
  is_atlas_theme: boolean;
  atlas_version?: string;
  created_at: string;
  updated_at: string;
  product_templates?: ProductTemplate[];
}

export interface ProductTemplate {
  key: string;
  name: string;
}

export interface ListThemesResponse {
  themes: Theme[];
}

export class AtlasAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AtlasAPIError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new AtlasAPIError(
      'No API key configured. Run: atlas auth --key YOUR_KEY',
      401
    );
  }

  const url = `${getApiBase()}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Atlas-Api-Key': apiKey,
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new AtlasAPIError(
      `Expected JSON response but got ${contentType || 'unknown'}. Server may be returning an error page.`,
      response.status,
      { rawResponse: text.substring(0, 500) }
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new AtlasAPIError(
      data.error || data.message || 'API request failed',
      response.status,
      data
    );
  }

  return data as T;
}

export async function generateStore(
  options: GenerateOptions
): Promise<GenerateResponse> {
  const body: Record<string, unknown> = {
    url: options.url,
    shopify_product_id: options.shopifyProductId,
    region: options.region || 'us',
    language: options.language || 'en',
    type: options.type || 'single_product_shop',
  };

  // Add template source options
  if (options.templateSource) {
    body.template_source = options.templateSource;
  }
  if (options.templateId) {
    body.template_id = options.templateId;
  }
  if (options.themeId) {
    body.theme_id = options.themeId;
  }

  // Add product page options
  if (options.pageTemplateSource) {
    body.page_template_source = options.pageTemplateSource;
  }
  if (options.productPageTemplate) {
    body.product_page_template = options.productPageTemplate;
  }

  // Add research context
  if (options.researchContextId) {
    body.research_context_id = options.researchContextId;
  }

  return request<GenerateResponse>('/stores/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getStatus(jobId: string): Promise<StatusResponse> {
  return request<StatusResponse>(`/stores/${jobId}/status`);
}

export async function importStore(
  jobId: string,
  options?: { onlyImportProduct?: boolean }
): Promise<ImportResponse> {
  const body: Record<string, unknown> = {};
  if (options?.onlyImportProduct) {
    body.only_import_product = true;
  }

  return request<ImportResponse>(`/stores/${jobId}/import`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getImportStatus(jobId: string): Promise<StatusResponse> {
  return request<StatusResponse>(`/stores/${jobId}/import_status`);
}

export async function listStores(
  limit = 20,
  offset = 0
): Promise<ListStoresResponse> {
  return request<ListStoresResponse>(`/stores?limit=${limit}&offset=${offset}`);
}

export async function getStore(id: number): Promise<Store> {
  return request<Store>(`/stores/${id}`);
}

// Template endpoints
export async function listTemplates(
  limit = 20,
  offset = 0
): Promise<ListTemplatesResponse> {
  return request<ListTemplatesResponse>(`/templates?limit=${limit}&offset=${offset}`);
}

export async function getTemplate(id: number): Promise<Template> {
  return request<Template>(`/templates/${id}`);
}

// Theme endpoints
export async function listThemes(): Promise<ListThemesResponse> {
  return request<ListThemesResponse>('/themes');
}

export async function getTheme(id: number): Promise<Theme> {
  return request<Theme>(`/themes/${id}`);
}

export async function getThemeProductTemplates(
  themeId: number
): Promise<{ theme_id: number; product_templates: ProductTemplate[] }> {
  return request(`/themes/${themeId}/product_templates`);
}

// Product types
export interface Product {
  id: string;
  numeric_id: number;
  title: string;
  handle: string;
  status: string;
  vendor?: string;
  product_type?: string;
  featured_image?: string;
  images_count?: number;
  variants_count?: number;
  price_range?: {
    min: string;
    max: string;
    currency: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface ProductDetails extends Product {
  description_html?: string;
  tags?: string[];
  images?: Array<{ id: string; url: string; altText?: string }>;
  variants?: Array<{
    id: string;
    title: string;
    price: string;
    compareAtPrice?: string;
    sku?: string;
    inventoryQuantity?: number;
  }>;
}

export interface ListProductsOptions {
  limit?: number;
  cursor?: string;
  query?: string;
}

export interface ListProductsResponse {
  products: Product[];
  page_info: {
    has_next_page: boolean;
    has_previous_page?: boolean;
    next_cursor?: string;
    end_cursor?: string;
  };
}

// Product endpoints
export async function listProducts(
  options: ListProductsOptions = {}
): Promise<ListProductsResponse> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.cursor) params.set('cursor', options.cursor);
  if (options.query) params.set('query', options.query);
  
  const queryString = params.toString();
  return request<ListProductsResponse>(`/products${queryString ? `?${queryString}` : ''}`);
}

export async function getProduct(id: string): Promise<ProductDetails> {
  return request<ProductDetails>(`/products/${id}`);
}

// Utility function to poll for completion
export async function waitForCompletion(
  jobId: string,
  options: {
    maxWaitMs?: number;
    pollIntervalMs?: number;
    onProgress?: (status: StatusResponse) => void;
  } = {}
): Promise<StatusResponse> {
  const { maxWaitMs = 300000, pollIntervalMs = 5000, onProgress } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getStatus(jobId);
    
    if (onProgress) {
      onProgress(status);
    }

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new AtlasAPIError('Timeout waiting for job completion', 408);
}

// Funnel (Listicle/Advertorial) endpoints
export async function generateFunnel(
  options: FunnelGenerateOptions
): Promise<FunnelGenerateResponse> {
  const body: Record<string, unknown> = {
    funnel_type: options.funnelType,
    theme_id: options.themeId,
    language: options.language || 'en',
  };

  if (options.url) {
    body.url = options.url;
  }
  if (options.shopifyProductId) {
    body.shopify_product_id = options.shopifyProductId;
  }
  if (options.headline) {
    body.headline = options.headline;
  }
  if (options.angle) {
    body.angle = options.angle;
  }
  if (options.tone) {
    body.tone = options.tone;
  }

  return request<FunnelGenerateResponse>('/funnels/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getFunnelStatus(jobId: string): Promise<FunnelStatusResponse> {
  return request<FunnelStatusResponse>(`/funnels/${jobId}/status`);
}

export async function waitForFunnelCompletion(
  jobId: string,
  options: {
    maxWaitMs?: number;
    pollIntervalMs?: number;
    onProgress?: (status: FunnelStatusResponse) => void;
  } = {}
): Promise<FunnelStatusResponse> {
  const { maxWaitMs = 300000, pollIntervalMs = 5000, onProgress } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getFunnelStatus(jobId);
    
    if (onProgress) {
      onProgress(status);
    }

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new AtlasAPIError('Timeout waiting for funnel generation', 408);
}
