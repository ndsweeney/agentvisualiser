import type { ProjectSpec, Orchestration, AgentDef, ToolBinding, Edge } from '@agentfactory/types';

export class CompilerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CompilerError';
  }
}

export interface GraphValidationResult {
  isValid: boolean;
  errors: CompilerError[];
  warnings: string[];
}

export function validateReachability(orchestration: Orchestration): GraphValidationResult {
  const errors: CompilerError[] = [];
  const warnings: string[] = [];

  const allNodes = new Set([
    ...orchestration.agents.map(a => a.id),
    ...orchestration.gates.map(g => g.id),
    ...orchestration.tools.map(t => t.id),
  ]);

  const reachableNodes = new Set<string>();
  const visited = new Set<string>();

  function dfs(nodeId: string): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    reachableNodes.add(nodeId);

    const outgoingEdges = orchestration.edges.filter(e => e.source === nodeId);
    for (const edge of outgoingEdges) {
      if (allNodes.has(edge.target)) {
        dfs(edge.target);
      }
    }
  }

  // Start DFS from the start node
  if (!allNodes.has(orchestration.startNode)) {
    errors.push(new CompilerError(
      `Start node "${orchestration.startNode}" does not exist`,
      'INVALID_START_NODE',
      { startNode: orchestration.startNode }
    ));
  } else {
    dfs(orchestration.startNode);
  }

  // Check for unreachable nodes
  const unreachableNodes = Array.from(allNodes).filter(id => !reachableNodes.has(id));
  for (const nodeId of unreachableNodes) {
    if (nodeId !== orchestration.startNode) {
      warnings.push(`Node "${nodeId}" is unreachable from start node`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateToolsExist(orchestration: Orchestration): GraphValidationResult {
  const errors: CompilerError[] = [];
  const warnings: string[] = [];

  const availableTools = new Set(orchestration.tools.map(t => t.id));

  for (const agent of orchestration.agents) {
    for (const toolId of agent.tools) {
      if (!availableTools.has(toolId)) {
        errors.push(new CompilerError(
          `Agent "${agent.id}" references non-existent tool "${toolId}"`,
          'MISSING_TOOL',
          { agentId: agent.id, toolId }
        ));
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateEdges(orchestration: Orchestration): GraphValidationResult {
  const errors: CompilerError[] = [];
  const warnings: string[] = [];

  const allNodes = new Set([
    ...orchestration.agents.map(a => a.id),
    ...orchestration.gates.map(g => g.id),
    ...orchestration.tools.map(t => t.id),
  ]);

  for (const edge of orchestration.edges) {
    if (!allNodes.has(edge.source)) {
      errors.push(new CompilerError(
        `Edge "${edge.id}" has invalid source node "${edge.source}"`,
        'INVALID_EDGE_SOURCE',
        { edgeId: edge.id, source: edge.source }
      ));
    }

    if (!allNodes.has(edge.target)) {
      errors.push(new CompilerError(
        `Edge "${edge.id}" has invalid target node "${edge.target}"`,
        'INVALID_EDGE_TARGET',
        { edgeId: edge.id, target: edge.target }
      ));
    }
  }

  // Check for duplicate edges
  const edgeKeys = new Set<string>();
  for (const edge of orchestration.edges) {
    const key = `${edge.source}->${edge.target}`;
    if (edgeKeys.has(key)) {
      warnings.push(`Duplicate edge from "${edge.source}" to "${edge.target}"`);
    }
    edgeKeys.add(key);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateTopology(orchestration: Orchestration): GraphValidationResult {
  const errors: CompilerError[] = [];
  const warnings: string[] = [];

  // Check for cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = orchestration.edges.filter(e => e.source === nodeId);
    for (const edge of outgoingEdges) {
      if (hasCycle(edge.target)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  const allNodes = [
    ...orchestration.agents.map(a => a.id),
    ...orchestration.gates.map(g => g.id),
    ...orchestration.tools.map(t => t.id),
  ];

  for (const nodeId of allNodes) {
    if (!visited.has(nodeId) && hasCycle(nodeId)) {
      errors.push(new CompilerError(
        'Cycle detected in agent graph',
        'CYCLE_DETECTED',
        { nodeId }
      ));
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateOutputs(orchestration: Orchestration): GraphValidationResult {
  const errors: CompilerError[] = [];
  const warnings: string[] = [];

  const allNodes = new Set([
    ...orchestration.agents.map(a => a.id),
    ...orchestration.gates.map(g => g.id),
    ...orchestration.tools.map(t => t.id),
  ]);

  for (const outputId of orchestration.outputs) {
    if (!allNodes.has(outputId)) {
      errors.push(new CompilerError(
        `Output node "${outputId}" does not exist`,
        'INVALID_OUTPUT_NODE',
        { outputId }
      ));
    }
  }

  if (orchestration.outputs.length === 0) {
    warnings.push('No output nodes defined');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function performAllGraphChecks(orchestration: Orchestration): GraphValidationResult {
  const checks = [
    validateReachability,
    validateToolsExist,
    validateEdges,
    validateTopology,
    validateOutputs,
  ];

  const allErrors: CompilerError[] = [];
  const allWarnings: string[] = [];

  for (const check of checks) {
    const result = check(orchestration);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}