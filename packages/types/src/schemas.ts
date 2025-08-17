import { z } from 'zod';

export const zAgentDef = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  prompt: z.string().min(1),
  tools: z.array(z.string()),
  memory: z.object({
    type: z.enum(['ephemeral', 'persistent']),
    maxTokens: z.number().positive().optional(),
  }).optional(),
  policies: z.object({
    maxIterations: z.number().positive().optional(),
    timeout: z.number().positive().optional(),
    retryPolicy: z.enum(['exponential', 'linear', 'none']).optional(),
  }).optional(),
});

export const zToolBinding = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['graph', 'sharepoint', 'servicenow', 'dataverse', 'rest', 'mcp']),
  config: z.record(z.unknown()),
  auth: z.object({
    type: z.enum(['bearer', 'oauth2', 'apikey', 'none']),
    credentials: z.record(z.string()).optional(),
  }).optional(),
});

export const zGate = z.object({
  id: z.string().min(1),
  type: z.enum(['approval', 'condition', 'merge', 'split']),
  condition: z.string().optional(),
  approvers: z.array(z.string()).optional(),
  mergeStrategy: z.enum(['all', 'any', 'majority']).optional(),
});

export const zEdge = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  condition: z.string().optional(),
  label: z.string().optional(),
});

export const zOrchestration = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  agents: z.array(zAgentDef),
  tools: z.array(zToolBinding),
  gates: z.array(zGate),
  edges: z.array(zEdge),
  startNode: z.string().min(1),
  outputs: z.array(z.string()),
});

export const zEvalMetric = z.object({
  name: z.string().min(1),
  type: z.enum(['accuracy', 'latency', 'cost', 'custom']),
  threshold: z.number().optional(),
  weight: z.number().min(0).max(1).optional(),
});

export const zEvalCase = z.object({
  id: z.string().min(1),
  input: z.record(z.unknown()),
  expectedOutput: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const zEvalSuite = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  metrics: z.array(zEvalMetric),
  testCases: z.array(zEvalCase),
  environment: z.enum(['dev', 'staging', 'prod']),
});

export const zProjectSpec = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  orchestration: zOrchestration,
  evaluations: z.array(zEvalSuite).optional(),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

export const zCompiledAgent = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  prompt: z.string().min(1),
  tools: z.array(zToolBinding),
  nextAgents: z.array(z.string()),
  memory: zAgentDef.shape.memory,
  policies: zAgentDef.shape.policies,
});

export const zCompiledService = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  agents: z.array(zCompiledAgent),
  startAgent: z.string().min(1),
  outputs: z.array(z.string()),
  topology: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      type: z.enum(['agent', 'tool', 'gate']),
    })),
    edges: z.array(zEdge),
  }),
  metadata: zProjectSpec.shape.metadata,
});

// Re-export the main schema for convenience
export default zProjectSpec;