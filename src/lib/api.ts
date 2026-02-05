import { getApiKey, getApiBase } from './config.js';

export interface GenerateOptions {
  url?: string;
  shopifyProductId?: string;
  region?: string;
  language?: string;
  type?: 'single_product_shop' | 'product_page';
  templateId?: string;
  researchContextId?: string;
}

export interface GenerateResponse {
  job_id: string;
  status: string;
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
  return request<GenerateResponse>('/stores/generate', {
    method: 'POST',
    body: JSON.stringify({
      url: options.url,
      shopify_product_id: options.shopifyProductId,
      region: options.region || 'us',
      language: options.language || 'en',
      type: options.type || 'single_product_shop',
      template_id: options.templateId,
      research_context_id: options.researchContextId,
    }),
  });
}

export async function getStatus(jobId: string): Promise<StatusResponse> {
  return request<StatusResponse>(`/stores/${jobId}/status`);
}

export async function importStore(jobId: string): Promise<ImportResponse> {
  return request<ImportResponse>(`/stores/${jobId}/import`, {
    method: 'POST',
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
