import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import type { Blueprint } from '../types';
import type { ProjectSpec } from '@agentfactory/types';

@Injectable()
export class BlueprintsService {
  private readonly logger = new Logger(BlueprintsService.name);
  private readonly blueprintsPath = join(config.storage.path, 'blueprints');

  async getBlueprints(): Promise<Blueprint[]> {
    try {
      // Get built-in blueprints
      const builtInBlueprints = await this.getBuiltInBlueprints();
      
      // Get custom blueprints from storage
      const customBlueprints = await this.getCustomBlueprints();
      
      // Combine and return all blueprints
      return [...builtInBlueprints, ...customBlueprints];
    } catch (error) {
      this.logger.error('Failed to get blueprints', error);
      // Return at least the built-in blueprints if storage fails
      return await this.getBuiltInBlueprints();
    }
  }

  async materializeBlueprint(blueprintId: string): Promise<ProjectSpec> {
    const blueprints = await this.getBlueprints();
    const blueprint = blueprints.find(b => b.id === blueprintId);
    
    if (!blueprint) {
      throw new Error(`Blueprint ${blueprintId} not found`);
    }

    this.logger.log(`Materializing blueprint: ${blueprint.name}`);
    
    // Handle both built-in blueprints (spec) and custom blueprints (template)
    const projectSpec = (blueprint as any).spec || (blueprint as any).template;
    
    if (!projectSpec) {
      throw new Error(`Blueprint ${blueprintId} has no valid project specification`);
    }
    
    return projectSpec;
  }

  async createBlueprint(blueprintData: Omit<Blueprint, 'id'>): Promise<Blueprint> {
    this.logger.log(`Creating new blueprint: ${blueprintData.name}`);
    
    const blueprintId = uuidv4();
    const blueprint: Blueprint = {
      id: blueprintId,
      ...blueprintData,
    };
    
    try {
      // Ensure blueprints directory exists
      await fs.mkdir(this.blueprintsPath, { recursive: true });
      
      const filePath = join(this.blueprintsPath, `${blueprintId}.json`);
      await fs.writeFile(filePath, JSON.stringify(blueprint, null, 2));
      
      this.logger.log(`Successfully created blueprint ${blueprintId}`);
      return blueprint;
    } catch (error) {
      this.logger.error(`Failed to create blueprint ${blueprintId}`, error);
      throw error;
    }
  }

  async updateBlueprint(blueprintId: string, blueprintData: Partial<Blueprint>): Promise<Blueprint> {
    this.logger.log(`Updating blueprint: ${blueprintId}`);
    
    try {
      const existingBlueprint = await this.getBlueprintById(blueprintId);
      const updatedBlueprint: Blueprint = {
        ...existingBlueprint,
        ...blueprintData,
        id: blueprintId, // Ensure ID doesn't change
      };
      
      const filePath = join(this.blueprintsPath, `${blueprintId}.json`);
      await fs.writeFile(filePath, JSON.stringify(updatedBlueprint, null, 2));
      
      this.logger.log(`Successfully updated blueprint ${blueprintId}`);
      return updatedBlueprint;
    } catch (error) {
      this.logger.error(`Failed to update blueprint ${blueprintId}`, error);
      throw error;
    }
  }

  async deleteBlueprint(blueprintId: string): Promise<void> {
    this.logger.log(`Deleting blueprint: ${blueprintId}`);
    
    // Check if it's a built-in blueprint first
    const builtInIds = ['multi-agent', 'approval-chain', 'data-pipeline', 'helpdesk-automation', 'maker-checker'];
    if (builtInIds.includes(blueprintId)) {
      throw new Error('Built-in blueprints cannot be deleted');
    }
    
    try {
      const filePath = join(this.blueprintsPath, `${blueprintId}.json`);
      
      // Check if file exists before trying to delete
      await fs.access(filePath);
      
      await fs.unlink(filePath);
      this.logger.log(`Successfully deleted blueprint ${blueprintId}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.error(`Blueprint file not found: ${blueprintId}`);
        throw new Error(`Blueprint ${blueprintId} not found`);
      }
      this.logger.error(`Failed to delete blueprint ${blueprintId}`, error);
      throw new Error(`Failed to delete blueprint: ${error.message}`);
    }
  }

  async getBlueprintById(blueprintId: string): Promise<Blueprint> {
    try {
      const filePath = join(this.blueprintsPath, `${blueprintId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`Failed to get blueprint ${blueprintId}`, error);
      throw new Error(`Blueprint ${blueprintId} not found`);
    }
  }

  private async getCustomBlueprints(): Promise<Blueprint[]> {
    try {
      // Ensure blueprints directory exists
      await fs.mkdir(this.blueprintsPath, { recursive: true });
      
      const files = await fs.readdir(this.blueprintsPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const blueprints = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const filePath = join(this.blueprintsPath, file);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data) as Blueprint;
          } catch (error) {
            this.logger.warn(`Failed to read blueprint file ${file}`, error);
            return null;
          }
        })
      );
      
      return blueprints.filter(blueprint => blueprint !== null);
    } catch (error) {
      this.logger.error('Failed to get custom blueprints', error);
      return [];
    }
  }

  private async getBuiltInBlueprints(): Promise<Blueprint[]> {
    return [
      {
        id: 'multi-agent',
        name: 'Multi-Agent Workflow',
        description: 'A workflow with multiple agents collaborating to complete a task',
        category: 'Collaboration',
        spec: this.createMultiAgentBlueprint(),
      },
      {
        id: 'approval-chain',
        name: 'Approval Chain',
        description: 'Sequential approval workflow with escalation',
        category: 'Approval',
        spec: this.createApprovalChainBlueprint(),
      },
      {
        id: 'data-pipeline',
        name: 'Data Processing Pipeline',
        description: 'ETL pipeline with validation and transformation agents',
        category: 'Data',
        spec: this.createDataPipelineBlueprint(),
      },
      {
        id: 'helpdesk-automation',
        name: 'Helpdesk Automation',
        description: 'Automated ticket routing and response system',
        category: 'Support',
        spec: this.createHelpdeskBlueprint(),
      },
      {
        id: 'maker-checker',
        name: 'Maker-Checker Workflow',
        description: 'Financial workflow with dual approval',
        category: 'Finance',
        spec: this.createMakerCheckerBlueprint(),
      },
    ];
  }

  private createMultiAgentBlueprint(): ProjectSpec {
    return {
      id: 'multi-agent-project',
      name: 'Multi-Agent Project',
      version: '1.0.0',
      description: 'A collaborative multi-agent workflow',
      orchestration: {
        id: 'multi-agent-orch',
        name: 'Multi-Agent Orchestration',
        agents: [
          {
            id: 'researcher',
            name: 'Research Agent',
            prompt: 'You are a research agent. Gather information on the given topic.',
            tools: ['web-search', 'knowledge-base'],
          },
          {
            id: 'analyzer',
            name: 'Analysis Agent',
            prompt: 'You are an analysis agent. Process and analyze the research data.',
            tools: ['data-analysis', 'ml-tools'],
          },
          {
            id: 'writer',
            name: 'Writer Agent',
            prompt: 'You are a writer agent. Create a comprehensive report.',
            tools: ['document-generator', 'editor'],
          },
        ],
        tools: [
          { id: 'web-search', name: 'Web Search', kind: 'rest', config: {} },
          { id: 'knowledge-base', name: 'Knowledge Base', kind: 'graph', config: {} },
          { id: 'data-analysis', name: 'Data Analysis', kind: 'rest', config: {} },
          { id: 'ml-tools', name: 'ML Tools', kind: 'mcp', config: {} },
          { id: 'document-generator', name: 'Document Generator', kind: 'rest', config: {} },
          { id: 'editor', name: 'Editor', kind: 'rest', config: {} },
        ],
        gates: [],
        edges: [
          { id: 'e1', source: 'researcher', target: 'analyzer' },
          { id: 'e2', source: 'analyzer', target: 'writer' },
        ],
        startNode: 'researcher',
        outputs: ['writer'],
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'AgentFactory',
        tags: ['collaboration', 'research', 'analysis'],
      },
    };
  }

  private createApprovalChainBlueprint(): ProjectSpec {
    return {
      id: 'approval-chain-project',
      name: 'Approval Chain Project',
      version: '1.0.0',
      orchestration: {
        id: 'approval-chain-orch',
        name: 'Approval Chain',
        agents: [
          {
            id: 'requestor',
            name: 'Request Agent',
            prompt: 'Process and validate the initial request',
            tools: ['validation-tool'],
          },
          {
            id: 'supervisor',
            name: 'Supervisor Agent',
            prompt: 'Review and approve/reject supervisor-level requests',
            tools: ['approval-tool'],
          },
          {
            id: 'manager',
            name: 'Manager Agent',
            prompt: 'Final approval for high-value requests',
            tools: ['approval-tool', 'notification-tool'],
          },
        ],
        tools: [
          { id: 'validation-tool', name: 'Validation', kind: 'rest', config: {} },
          { id: 'approval-tool', name: 'Approval', kind: 'rest', config: {} },
          { id: 'notification-tool', name: 'Notifications', kind: 'rest', config: {} },
        ],
        gates: [
          { id: 'amount-gate', type: 'condition', condition: 'amount > 1000' },
        ],
        edges: [
          { id: 'e1', source: 'requestor', target: 'supervisor' },
          { id: 'e2', source: 'supervisor', target: 'amount-gate' },
          { id: 'e3', source: 'amount-gate', target: 'manager' },
        ],
        startNode: 'requestor',
        outputs: ['manager', 'supervisor'],
      },
    };
  }

  private createDataPipelineBlueprint(): ProjectSpec {
    return {
      id: 'data-pipeline-project',
      name: 'Data Pipeline Project',
      version: '1.0.0',
      orchestration: {
        id: 'data-pipeline-orch',
        name: 'Data Pipeline',
        agents: [
          {
            id: 'extractor',
            name: 'Data Extractor',
            prompt: 'Extract data from various sources',
            tools: ['database-connector', 'api-connector'],
          },
          {
            id: 'transformer',
            name: 'Data Transformer',
            prompt: 'Clean and transform the extracted data',
            tools: ['data-cleaner', 'transformer-tool'],
          },
          {
            id: 'loader',
            name: 'Data Loader',
            prompt: 'Load processed data into target systems',
            tools: ['dataverse', 'storage-connector'],
          },
        ],
        tools: [
          { id: 'database-connector', name: 'Database', kind: 'rest', config: {} },
          { id: 'api-connector', name: 'API Connector', kind: 'rest', config: {} },
          { id: 'data-cleaner', name: 'Data Cleaner', kind: 'mcp', config: {} },
          { id: 'transformer-tool', name: 'Transformer', kind: 'mcp', config: {} },
          { id: 'dataverse', name: 'Dataverse', kind: 'dataverse', config: {} },
          { id: 'storage-connector', name: 'Storage', kind: 'rest', config: {} },
        ],
        gates: [],
        edges: [
          { id: 'e1', source: 'extractor', target: 'transformer' },
          { id: 'e2', source: 'transformer', target: 'loader' },
        ],
        startNode: 'extractor',
        outputs: ['loader'],
      },
    };
  }

  private createHelpdeskBlueprint(): ProjectSpec {
    return {
      id: 'helpdesk-project',
      name: 'Helpdesk Automation Project',
      version: '1.0.0',
      orchestration: {
        id: 'helpdesk-orch',
        name: 'Helpdesk Automation',
        agents: [
          {
            id: 'classifier',
            name: 'Ticket Classifier',
            prompt: 'Classify and prioritize incoming support tickets',
            tools: ['classification-ml', 'knowledge-base'],
          },
          {
            id: 'responder',
            name: 'Auto Responder',
            prompt: 'Generate automated responses for common issues',
            tools: ['template-engine', 'knowledge-base'],
          },
          {
            id: 'escalator',
            name: 'Escalation Agent',
            prompt: 'Escalate complex issues to human agents',
            tools: ['servicenow', 'notification-service'],
          },
        ],
        tools: [
          { id: 'classification-ml', name: 'ML Classifier', kind: 'mcp', config: {} },
          { id: 'knowledge-base', name: 'Knowledge Base', kind: 'graph', config: {} },
          { id: 'template-engine', name: 'Template Engine', kind: 'rest', config: {} },
          { id: 'servicenow', name: 'ServiceNow', kind: 'servicenow', config: {} },
          { id: 'notification-service', name: 'Notifications', kind: 'rest', config: {} },
        ],
        gates: [
          { id: 'complexity-gate', type: 'condition', condition: 'complexity > 0.8' },
        ],
        edges: [
          { id: 'e1', source: 'classifier', target: 'complexity-gate' },
          { id: 'e2', source: 'complexity-gate', target: 'escalator' },
          { id: 'e3', source: 'complexity-gate', target: 'responder' },
        ],
        startNode: 'classifier',
        outputs: ['responder', 'escalator'],
      },
    };
  }

  private createMakerCheckerBlueprint(): ProjectSpec {
    return {
      id: 'maker-checker-project',
      name: 'Maker-Checker Workflow',
      version: '1.0.0',
      orchestration: {
        id: 'maker-checker-orch',
        name: 'Maker-Checker',
        agents: [
          {
            id: 'maker',
            name: 'Maker Agent',
            prompt: 'Create and submit financial transactions',
            tools: ['transaction-creator', 'validator'],
          },
          {
            id: 'checker1',
            name: 'First Checker',
            prompt: 'First level verification of transactions',
            tools: ['risk-analyzer', 'compliance-checker'],
          },
          {
            id: 'checker2',
            name: 'Second Checker',
            prompt: 'Second level verification of transactions',
            tools: ['risk-analyzer', 'compliance-checker'],
          },
          {
            id: 'finalizer',
            name: 'Transaction Finalizer',
            prompt: 'Execute approved transactions',
            tools: ['payment-processor', 'audit-logger'],
          },
        ],
        tools: [
          { id: 'transaction-creator', name: 'Transaction Creator', kind: 'rest', config: {} },
          { id: 'validator', name: 'Validator', kind: 'rest', config: {} },
          { id: 'risk-analyzer', name: 'Risk Analyzer', kind: 'mcp', config: {} },
          { id: 'compliance-checker', name: 'Compliance', kind: 'rest', config: {} },
          { id: 'payment-processor', name: 'Payment Processor', kind: 'rest', config: {} },
          { id: 'audit-logger', name: 'Audit Logger', kind: 'rest', config: {} },
        ],
        gates: [
          { id: 'approval-gate', type: 'merge', mergeStrategy: 'all' },
        ],
        edges: [
          { id: 'e1', source: 'maker', target: 'checker1' },
          { id: 'e2', source: 'maker', target: 'checker2' },
          { id: 'e3', source: 'checker1', target: 'approval-gate' },
          { id: 'e4', source: 'checker2', target: 'approval-gate' },
          { id: 'e5', source: 'approval-gate', target: 'finalizer' },
        ],
        startNode: 'maker',
        outputs: ['finalizer'],
      },
    };
  }
}