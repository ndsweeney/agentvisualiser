// Use native fetch in browsers, undici in Node.js
const fetchImpl = typeof window !== 'undefined' 
  ? globalThis.fetch 
  : require('undici').fetch;

import type { ProjectSpec } from '@agentfactory/types';

export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface CompileResponse {
  compiled: any;
  warnings?: string[];
}

export interface DeployResponse {
  releaseId: string;
  environment: string;
  deployedAt: string;
}

export interface EvalResponse {
  id: string;
  releaseId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  metrics?: Record<string, number>;
}

export class AgentFactoryClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.timeout = config.timeout || 30000;
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': '@agentfactory/sdk@1.0.0',
      // Development authentication headers for RBAC
      'x-dev-role': 'Operator',
      'x-dev-user': 'dev@agentfactory.com',
    };

    if (config.apiKey) {
      this.headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
  }

  async compile(spec: ProjectSpec): Promise<CompileResponse> {
    return this.request('POST', '/compile', { spec });
  }

  async deploy(compiled: any, environment: string): Promise<DeployResponse> {
    return this.request('POST', '/deploy', { compiled, environment });
  }

  async getDeployments(): Promise<any[]> {
    return this.request('GET', '/deploy');
  }

  async deleteDeployment(releaseId: string): Promise<void> {
    return this.request('DELETE', `/deploy/${releaseId}`);
  }

  async getBlueprints(): Promise<any[]> {
    return this.request('GET', '/blueprints');
  }

  async createBlueprint(blueprintData: Omit<any, 'id'>): Promise<any> {
    return this.request('POST', '/blueprints', blueprintData);
  }

  async updateBlueprint(blueprintId: string, blueprintData: Partial<any>): Promise<any> {
    return this.request('PUT', `/blueprints/${blueprintId}`, blueprintData);
  }

  async deleteBlueprint(blueprintId: string): Promise<void> {
    return this.request('DELETE', `/blueprints/${blueprintId}`);
  }

  async getBlueprint(blueprintId: string): Promise<any> {
    return this.request('GET', `/blueprints/${blueprintId}`);
  }

  async materializeBlueprint(blueprintId: string): Promise<ProjectSpec> {
    return this.request('POST', `/blueprints/${blueprintId}/materialize`);
  }

  async runEvaluation(releaseId: string): Promise<EvalResponse> {
    return this.request('POST', '/evals/run', { releaseId });
  }

  async getEvalMetrics(runId: string): Promise<EvalResponse> {
    return this.request('GET', `/evals/runs/${runId}/metrics`);
  }

  async getTools(): Promise<any[]> {
    return this.request('GET', '/tools');
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const options: any = {
      method,
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetchImpl(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = typeof errorData === 'object' && errorData && 'message' in errorData 
          ? errorData.message 
          : '';
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}` +
          (errorMessage ? ` - ${errorMessage}` : '')
        );
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return null;
      }

      // Check if response has content before trying to parse JSON
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      // If there's no content or it's not JSON, return null for successful requests
      if (contentLength === '0' || !contentType?.includes('application/json')) {
        return null;
      }

      // Try to parse JSON, but handle empty responses gracefully
      const text = await response.text();
      if (!text.trim()) {
        return null;
      }

      return JSON.parse(text);
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }
}

export function createClient(config: ClientConfig): AgentFactoryClient {
  return new AgentFactoryClient(config);
}