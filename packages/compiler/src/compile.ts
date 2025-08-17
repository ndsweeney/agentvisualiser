import type { ProjectSpec, CompiledService, CompiledAgent, ToolBinding } from '@agentfactory/types';
import { zProjectSpec } from '@agentfactory/types';
import { CompilerError, performAllGraphChecks } from './graphChecks.js';

export function compileToAgentService(spec: ProjectSpec): CompiledService {
  // Step 1: Validate the project spec using Zod
  try {
    zProjectSpec.parse(spec);
  } catch (error) {
    throw new CompilerError(
      'Invalid project specification',
      'INVALID_SPEC',
      { validationError: error }
    );
  }

  // Step 2: Perform graph validation checks
  const validationResult = performAllGraphChecks(spec.orchestration);
  if (!validationResult.isValid) {
    throw validationResult.errors[0]; // Throw the first error
  }

  // Step 3: Build tool lookup map
  const toolMap = new Map<string, ToolBinding>();
  for (const tool of spec.orchestration.tools) {
    toolMap.set(tool.id, tool);
  }

  // Step 4: Compile agents with their connections
  const compiledAgents: CompiledAgent[] = [];
  
  for (const agent of spec.orchestration.agents) {
    // Find next agents by following edges
    const nextAgents = spec.orchestration.edges
      .filter(edge => edge.source === agent.id)
      .map(edge => edge.target)
      .sort(); // Sort for deterministic output

    // Get tools for this agent
    const agentTools = agent.tools
      .map(toolId => toolMap.get(toolId))
      .filter((tool): tool is ToolBinding => tool !== undefined)
      .sort((a, b) => a.id.localeCompare(b.id)); // Sort for deterministic output

    compiledAgents.push({
      id: agent.id,
      name: agent.name,
      prompt: agent.prompt,
      tools: agentTools,
      nextAgents,
      memory: agent.memory,
      policies: agent.policies,
    });
  }

  // Sort agents by ID for deterministic output
  compiledAgents.sort((a, b) => a.id.localeCompare(b.id));

  // Step 5: Build topology information
  const topology = {
    nodes: [
      ...spec.orchestration.agents.map(a => ({ id: a.id, type: 'agent' as const })),
      ...spec.orchestration.tools.map(t => ({ id: t.id, type: 'tool' as const })),
      ...spec.orchestration.gates.map(g => ({ id: g.id, type: 'gate' as const })),
    ].sort((a, b) => a.id.localeCompare(b.id)), // Sort for deterministic output
    edges: [...spec.orchestration.edges].sort((a, b) => a.id.localeCompare(b.id)), // Sort for deterministic output
  };

  // Step 6: Sort outputs for deterministic output
  const sortedOutputs = [...spec.orchestration.outputs].sort();

  return {
    id: spec.id,
    name: spec.name,
    version: spec.version,
    agents: compiledAgents,
    startAgent: spec.orchestration.startNode,
    outputs: sortedOutputs,
    topology,
    metadata: spec.metadata,
  };
}

export function validateCompiledService(compiled: CompiledService): void {
  // Additional validation for compiled service
  const agentIds = new Set(compiled.agents.map(a => a.id));
  
  if (!agentIds.has(compiled.startAgent)) {
    throw new CompilerError(
      `Start agent "${compiled.startAgent}" not found in compiled agents`,
      'INVALID_START_AGENT',
      { startAgent: compiled.startAgent }
    );
  }

  // Validate that all next agents exist
  for (const agent of compiled.agents) {
    for (const nextAgentId of agent.nextAgents) {
      if (!agentIds.has(nextAgentId)) {
        throw new CompilerError(
          `Agent "${agent.id}" references non-existent next agent "${nextAgentId}"`,
          'INVALID_NEXT_AGENT',
          { agentId: agent.id, nextAgentId }
        );
      }
    }
  }
}