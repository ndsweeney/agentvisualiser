import type { IToolAdapter, AdapterRegistry as IAdapterRegistry } from './types';
import { GraphAdapter } from './adapters/graph';
import { SharePointAdapter } from './adapters/sharepoint';
import { ServiceNowAdapter } from './adapters/servicenow';
import { DataverseAdapter } from './adapters/dataverse';
import { RestAdapter } from './adapters/rest';
import { McpAdapter } from './adapters/mcp';

export * from './types';
export * from './adapters/graph';
export * from './adapters/sharepoint';
export * from './adapters/servicenow';
export * from './adapters/dataverse';
export * from './adapters/rest';
export * from './adapters/mcp';

class AdapterRegistry implements IAdapterRegistry {
  private adapters = new Map<string, IToolAdapter>();

  constructor() {
    // Register all built-in adapters
    this.register(new GraphAdapter());
    this.register(new SharePointAdapter());
    this.register(new ServiceNowAdapter());
    this.register(new DataverseAdapter());
    this.register(new RestAdapter());
    this.register(new McpAdapter());
  }

  register(adapter: IToolAdapter): void {
    this.adapters.set(adapter.kind, adapter);
  }

  get(kind: string): IToolAdapter | undefined {
    return this.adapters.get(kind);
  }

  list(): IToolAdapter[] {
    return Array.from(this.adapters.values());
  }
}

// Global registry instance
const registry = new AdapterRegistry();

export function getAdapter(kind: string): IToolAdapter | undefined {
  return registry.get(kind);
}

export function getAllAdapters(): IToolAdapter[] {
  return registry.list();
}

export function registerAdapter(adapter: IToolAdapter): void {
  registry.register(adapter);
}

export { registry as default };