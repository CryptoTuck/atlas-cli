import Conf from 'conf';

interface AtlasConfig {
  apiKey?: string;
  apiBase: string;
}

const config = new Conf<AtlasConfig>({
  projectName: 'atlas-cli',
  defaults: {
    apiBase: 'https://atlas-app.herokuapp.com/api/v1',
  },
});

export function getApiKey(): string | undefined {
  return process.env.ATLAS_API_KEY || config.get('apiKey');
}

export function setApiKey(key: string): void {
  config.set('apiKey', key);
}

export function clearApiKey(): void {
  config.delete('apiKey');
}

export function getApiBase(): string {
  return process.env.ATLAS_API_BASE || config.get('apiBase');
}

export function setApiBase(url: string): void {
  config.set('apiBase', url);
}

export { config };
