export interface AgentDef {
  id: string;
  name: string;
  prompt: string;
  tools: string[];
  memory?: {
    type: 'ephemeral' | 'persistent';
    maxTokens?: number;
  };
  policies?: {
    maxIterations?: number;
    timeout?: number;
    retryPolicy?: 'exponential' | 'linear' | 'none';
  };
}

export interface ToolBinding {
  id: string;
  name: string;
  kind: 'graph' | 'sharepoint' | 'servicenow' | 'dataverse' | 'rest' | 'mcp';
  config: Record<string, unknown>;
  auth?: {
    type: 'bearer' | 'oauth2' | 'apikey' | 'none';
    credentials?: Record<string, string>;
  };
}

export interface Gate {
  id: string;
  type: 'approval' | 'condition' | 'merge' | 'split';
  condition?: string;
  approvers?: string[];
  mergeStrategy?: 'all' | 'any' | 'majority';
}

export interface Blueprint {
  id: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  template: ProjectSpec;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
}

export interface Orchestration {
  id: string;
  name: string;
  agents: AgentDef[];
  tools: ToolBinding[];
  gates: Gate[];
  edges: Edge[];
  startNode: string;
  outputs: string[];
}

export interface EvalMetric {
  name: string;
  type: 'accuracy' | 'latency' | 'cost' | 'custom';
  threshold?: number;
  weight?: number;
}

export interface EvalCase {
  id: string;
  input: Record<string, unknown>;
  expectedOutput?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface EvalSuite {
  id: string;
  name: string;
  description?: string;
  metrics: EvalMetric[];
  testCases: EvalCase[];
  environment: 'dev' | 'staging' | 'prod';
}

export interface ProjectSpec {
  id: string;
  name: string;
  version: string;
  description?: string;
  orchestration: Orchestration;
  evaluations?: EvalSuite[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    author?: string;
    tags?: string[];
    nodePositions?: Record<string, { x: number; y: number }>;
  };
}

export interface CompiledAgent {
  id: string;
  name: string;
  prompt: string;
  tools: ToolBinding[];
  nextAgents: string[];
  memory: AgentDef['memory'];
  policies: AgentDef['policies'];
}

export interface CompiledService {
  id: string;
  name: string;
  version: string;
  agents: CompiledAgent[];
  startAgent: string;
  outputs: string[];
  topology: {
    nodes: Array<{ id: string; type: 'agent' | 'tool' | 'gate' }>;
    edges: Edge[];
  };
  metadata: ProjectSpec['metadata'];
}

// Re-export all schemas from schemas.ts
export * from './schemas';
export { default as zProjectSpec } from './schemas';