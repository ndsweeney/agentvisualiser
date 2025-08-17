import { describe, it, expect } from 'vitest';
import type { ProjectSpec } from '@agentfactory/types';
import { compileToAgentService, CompilerError } from '../src';

describe('Compiler', () => {
  const createValidProjectSpec = (): ProjectSpec => ({
    id: 'test-project',
    name: 'Test Project',
    version: '1.0.0',
    orchestration: {
      id: 'test-orchestration',
      name: 'Test Orchestration',
      agents: [
        {
          id: 'agent1',
          name: 'First Agent',
          prompt: 'You are the first agent',
          tools: ['tool1'],
          memory: { type: 'ephemeral', maxTokens: 1000 },
          policies: { maxIterations: 5, timeout: 30000 },
        },
        {
          id: 'agent2',
          name: 'Second Agent',
          prompt: 'You are the second agent',
          tools: ['tool2'],
        },
      ],
      tools: [
        {
          id: 'tool1',
          name: 'First Tool',
          kind: 'rest',
          config: { url: 'https://api.example.com' },
          auth: { type: 'bearer', credentials: { token: 'secret' } },
        },
        {
          id: 'tool2',
          name: 'Second Tool',
          kind: 'graph',
          config: { endpoint: 'https://graph.microsoft.com' },
        },
      ],
      gates: [
        {
          id: 'gate1',
          type: 'approval',
          approvers: ['user1', 'user2'],
        },
      ],
      edges: [
        { id: 'edge1', source: 'agent1', target: 'agent2' },
        { id: 'edge2', source: 'agent2', target: 'gate1' },
      ],
      startNode: 'agent1',
      outputs: ['gate1'],
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      author: 'test-user',
      tags: ['test', 'example'],
    },
  });

  describe('Happy Path', () => {
    it('should compile a valid project spec successfully', () => {
      const spec = createValidProjectSpec();
      const compiled = compileToAgentService(spec);

      expect(compiled.id).toBe(spec.id);
      expect(compiled.name).toBe(spec.name);
      expect(compiled.version).toBe(spec.version);
      expect(compiled.startAgent).toBe('agent1');
      expect(compiled.outputs).toEqual(['gate1']);
      expect(compiled.agents).toHaveLength(2);
      
      // Check deterministic sorting
      expect(compiled.agents[0].id).toBe('agent1');
      expect(compiled.agents[1].id).toBe('agent2');
      
      // Check agent1 details
      const agent1 = compiled.agents[0];
      expect(agent1.name).toBe('First Agent');
      expect(agent1.prompt).toBe('You are the first agent');
      expect(agent1.nextAgents).toEqual(['agent2']);
      expect(agent1.tools).toHaveLength(1);
      expect(agent1.tools[0].id).toBe('tool1');
      expect(agent1.memory).toEqual({ type: 'ephemeral', maxTokens: 1000 });
      expect(agent1.policies).toEqual({ maxIterations: 5, timeout: 30000 });

      // Check agent2 details
      const agent2 = compiled.agents[1];
      expect(agent2.nextAgents).toEqual(['gate1']);
      expect(agent2.tools[0].id).toBe('tool2');
    });

    it('should produce deterministic output', () => {
      const spec = createValidProjectSpec();
      const compiled1 = compileToAgentService(spec);
      const compiled2 = compileToAgentService(spec);

      expect(JSON.stringify(compiled1)).toBe(JSON.stringify(compiled2));
    });
  });

  describe('Missing Tool Validation', () => {
    it('should throw error when agent references non-existent tool', () => {
      const spec = createValidProjectSpec();
      spec.orchestration.agents[0].tools = ['non-existent-tool'];

      expect(() => compileToAgentService(spec)).toThrow(CompilerError);
      expect(() => compileToAgentService(spec)).toThrow('references non-existent tool');
    });
  });

  describe('Invalid Edge Validation', () => {
    it('should throw error for invalid source node', () => {
      const spec = createValidProjectSpec();
      spec.orchestration.edges[0].source = 'non-existent-source';

      expect(() => compileToAgentService(spec)).toThrow(CompilerError);
      expect(() => compileToAgentService(spec)).toThrow('invalid source node');
    });

    it('should throw error for invalid target node', () => {
      const spec = createValidProjectSpec();
      spec.orchestration.edges[0].target = 'non-existent-target';

      expect(() => compileToAgentService(spec)).toThrow(CompilerError);
      expect(() => compileToAgentService(spec)).toThrow('invalid target node');
    });
  });

  describe('Maker-Checker Merge Pattern', () => {
    it('should handle maker-checker workflow with merge gate', () => {
      const spec: ProjectSpec = {
        id: 'maker-checker',
        name: 'Maker-Checker Workflow',
        version: '1.0.0',
        orchestration: {
          id: 'maker-checker-orch',
          name: 'Maker-Checker Orchestration',
          agents: [
            {
              id: 'maker',
              name: 'Maker Agent',
              prompt: 'Create the initial proposal',
              tools: ['proposal-tool'],
            },
            {
              id: 'checker1',
              name: 'First Checker',
              prompt: 'Review the proposal',
              tools: ['review-tool'],
            },
            {
              id: 'checker2',
              name: 'Second Checker',
              prompt: 'Second review of the proposal',
              tools: ['review-tool'],
            },
            {
              id: 'finalizer',
              name: 'Finalizer Agent',
              prompt: 'Finalize the approved proposal',
              tools: ['finalize-tool'],
            },
          ],
          tools: [
            { id: 'proposal-tool', name: 'Proposal Tool', kind: 'rest', config: {} },
            { id: 'review-tool', name: 'Review Tool', kind: 'rest', config: {} },
            { id: 'finalize-tool', name: 'Finalize Tool', kind: 'rest', config: {} },
          ],
          gates: [
            {
              id: 'merge-gate',
              type: 'merge',
              mergeStrategy: 'all',
            },
          ],
          edges: [
            { id: 'e1', source: 'maker', target: 'checker1' },
            { id: 'e2', source: 'maker', target: 'checker2' },
            { id: 'e3', source: 'checker1', target: 'merge-gate' },
            { id: 'e4', source: 'checker2', target: 'merge-gate' },
            { id: 'e5', source: 'merge-gate', target: 'finalizer' },
          ],
          startNode: 'maker',
          outputs: ['finalizer'],
        },
      };

      const compiled = compileToAgentService(spec);
      
      expect(compiled.agents).toHaveLength(4);
      expect(compiled.startAgent).toBe('maker');
      
      const maker = compiled.agents.find(a => a.id === 'maker');
      expect(maker?.nextAgents.sort()).toEqual(['checker1', 'checker2']);
      
      const checker1 = compiled.agents.find(a => a.id === 'checker1');
      expect(checker1?.nextAgents).toEqual(['merge-gate']);
      
      const finalizer = compiled.agents.find(a => a.id === 'finalizer');
      expect(finalizer?.nextAgents).toEqual([]);
    });
  });

  describe('Cycle Detection', () => {
    it('should throw error when cycle is detected', () => {
      const spec = createValidProjectSpec();
      // Create a cycle: agent1 -> agent2 -> agent1
      spec.orchestration.edges.push({
        id: 'edge3',
        source: 'gate1',
        target: 'agent1',
      });

      expect(() => compileToAgentService(spec)).toThrow(CompilerError);
      expect(() => compileToAgentService(spec)).toThrow('Cycle detected');
    });
  });

  describe('Invalid Project Spec', () => {
    it('should throw error for invalid project spec schema', () => {
      const invalidSpec = {
        // Missing required fields
        name: 'Test',
      } as unknown as ProjectSpec;

      expect(() => compileToAgentService(invalidSpec)).toThrow(CompilerError);
      expect(() => compileToAgentService(invalidSpec)).toThrow('Invalid project specification');
    });
  });

  describe('Unreachable Nodes', () => {
    it('should handle unreachable nodes gracefully', () => {
      const spec = createValidProjectSpec();
      // Add an unreachable agent
      spec.orchestration.agents.push({
        id: 'unreachable',
        name: 'Unreachable Agent',
        prompt: 'This agent is unreachable',
        tools: [],
      });

      // Should still compile successfully (unreachable nodes are warnings, not errors)
      const compiled = compileToAgentService(spec);
      expect(compiled.agents).toHaveLength(3);
    });
  });
});