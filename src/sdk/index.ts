/**
 * Atlas SDK for programmatic store generation
 * 
 * @example
 * ```typescript
 * import { AtlasClient } from 'atlas-copilot-cli';
 * 
 * const atlas = new AtlasClient('atlas_your_api_key');
 * 
 * // Generate a store
 * const job = await atlas.generate({
 *   url: 'https://amazon.com/dp/B08N5WRWNW',
 *   language: 'en',
 *   region: 'us'
 * });
 * 
 * // Wait for completion
 * const result = await atlas.waitForCompletion(job.job_id);
 * 
 * // Import to Shopify
 * if (result.status === 'completed') {
 *   await atlas.import(job.job_id);
 * }
 * ```
 */

export interface GenerateOptions {
  url?: string;
  shopifyProductId?: string;
  region?: string;
  language?: string;
  /** Generation type: 'single_product_shop' for full store, 'product_page' for page only */
  type?: 'single_product_shop' | 'product_page';
  /** Template source: 'atlas_library', 'existing_theme', or 'default' */
  templateSource?: 'atlas_library' | 'existing_theme' | 'default';
  /** Atlas template ID (for templateSource='atlas_library') */
  templateId?: string;
  /** Shopify theme ID (required for product_page, optional for existing_theme) */
  themeId?: string;
  /** Product page template source: 'atlas_default' or 'existing_page' */
  pageTemplateSource?: 'atlas_default' | 'existing_page';
  /** Existing product page template name (for pageTemplateSource='existing_page') */
  productPageTemplate?: string;
  /** Research context ID for ICP-specific generation */
  researchContextId?: string;
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
  };
  error?: string;
}

export interface ImportOptions {
  /** Only import the product, not the theme */
  onlyImportProduct?: boolean;
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

export class AtlasClient {
  private apiKey: string;
  private apiBase: string;

  constructor(apiKey: string, apiBase = 'https://atlas-app.herokuapp.com/api/v1') {
    this.apiKey = apiKey;
    this.apiBase = apiBase;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiBase}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Atlas-Api-Key': this.apiKey,
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
        `Expected JSON response but got ${contentType || 'unknown'}`,
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

  /**
   * Generate a new store from a product URL or existing Shopify product
   */
  async generate(options: GenerateOptions): Promise<GenerateResponse> {
    const body: Record<string, unknown> = {
      url: options.url,
      shopify_product_id: options.shopifyProductId,
      region: options.region || 'us',
      language: options.language || 'en',
      type: options.type || 'single_product_shop',
    };

    if (options.templateSource) body.template_source = options.templateSource;
    if (options.templateId) body.template_id = options.templateId;
    if (options.themeId) body.theme_id = options.themeId;
    if (options.pageTemplateSource) body.page_template_source = options.pageTemplateSource;
    if (options.productPageTemplate) body.product_page_template = options.productPageTemplate;
    if (options.researchContextId) body.research_context_id = options.researchContextId;

    return this.request<GenerateResponse>('/stores/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Get the status of a generation job
   */
  async getStatus(jobId: string): Promise<StatusResponse> {
    return this.request<StatusResponse>(`/stores/${jobId}/status`);
  }

  /**
   * Import a generated store to Shopify
   */
  async import(jobId: string, options?: ImportOptions): Promise<ImportResponse> {
    const body: Record<string, unknown> = {};
    if (options?.onlyImportProduct) body.only_import_product = true;

    return this.request<ImportResponse>(`/stores/${jobId}/import`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Get the status of an import job
   */
  async getImportStatus(jobId: string): Promise<StatusResponse> {
    return this.request<StatusResponse>(`/stores/${jobId}/import_status`);
  }

  /**
   * List generated stores
   */
  async listStores(limit = 20, offset = 0): Promise<ListStoresResponse> {
    return this.request<ListStoresResponse>(`/stores?limit=${limit}&offset=${offset}`);
  }

  /**
   * Get details of a specific store
   */
  async getStore(id: number): Promise<Store> {
    return this.request<Store>(`/stores/${id}`);
  }

  /**
   * List available Atlas theme templates
   */
  async listTemplates(limit = 20, offset = 0): Promise<ListTemplatesResponse> {
    return this.request<ListTemplatesResponse>(`/templates?limit=${limit}&offset=${offset}`);
  }

  /**
   * Get details of a specific template
   */
  async getTemplate(id: number): Promise<Template> {
    return this.request<Template>(`/templates/${id}`);
  }

  /**
   * List merchant's Shopify themes
   */
  async listThemes(): Promise<ListThemesResponse> {
    return this.request<ListThemesResponse>('/themes');
  }

  /**
   * Get details of a specific theme including product page templates
   */
  async getTheme(id: number): Promise<Theme> {
    return this.request<Theme>(`/themes/${id}`);
  }

  /**
   * Get product page templates for a specific theme
   */
  async getThemeProductTemplates(
    themeId: number
  ): Promise<{ theme_id: number; product_templates: ProductTemplate[] }> {
    return this.request(`/themes/${themeId}/product_templates`);
  }

  /**
   * Wait for a generation job to complete
   */
  async waitForCompletion(
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
      const status = await this.getStatus(jobId);

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

  /**
   * Wait for an import job to complete
   */
  async waitForImport(
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
      const status = await this.getImportStatus(jobId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new AtlasAPIError('Timeout waiting for import completion', 408);
  }

  /**
   * Generate a store and wait for completion
   */
  async generateAndWait(
    options: GenerateOptions,
    waitOptions?: {
      maxWaitMs?: number;
      pollIntervalMs?: number;
      onProgress?: (status: StatusResponse) => void;
    }
  ): Promise<{ job: GenerateResponse; result: StatusResponse }> {
    const job = await this.generate(options);
    const result = await this.waitForCompletion(job.job_id, waitOptions);
    return { job, result };
  }

  /**
   * Full pipeline: generate, wait, and import
   */
  async generateAndImport(
    options: GenerateOptions,
    waitOptions?: {
      maxWaitMs?: number;
      pollIntervalMs?: number;
      onGenerateProgress?: (status: StatusResponse) => void;
      onImportProgress?: (status: StatusResponse) => void;
    }
  ): Promise<{
    generateJob: GenerateResponse;
    generateResult: StatusResponse;
    importJob: ImportResponse;
    importResult: StatusResponse;
  }> {
    // Generate and wait
    const generateJob = await this.generate(options);
    const generateResult = await this.waitForCompletion(generateJob.job_id, {
      maxWaitMs: waitOptions?.maxWaitMs,
      pollIntervalMs: waitOptions?.pollIntervalMs,
      onProgress: waitOptions?.onGenerateProgress,
    });

    if (generateResult.status !== 'completed') {
      throw new AtlasAPIError(
        `Generation failed: ${generateResult.error || 'Unknown error'}`,
        400
      );
    }

    // Import and wait
    const importJob = await this.import(generateJob.job_id);
    const importResult = await this.waitForImport(importJob.import_job_id, {
      maxWaitMs: waitOptions?.maxWaitMs,
      pollIntervalMs: waitOptions?.pollIntervalMs,
      onProgress: waitOptions?.onImportProgress,
    });

    return { generateJob, generateResult, importJob, importResult };
  }
}

// Default export
export default AtlasClient;
