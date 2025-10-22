import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import type { Blueprint as Project } from '../types';
import type { ProjectSpec } from '@agentfactory/types';

@Injectable()
export class BlueprintsService {
  private readonly logger = new Logger(BlueprintsService.name);
  private readonly blueprintsPath = join(config.storage.path, 'projects');

  async getBlueprints(): Promise<Project[]> {
    try {
      // Get built-in projects
      const builtInProjects = await this.getBuiltInBlueprints();
      
      // Get custom projects from storage
      const customProjects = await this.getCustomBlueprints();
      
      // Combine and return all projects
      return [...builtInProjects, ...customProjects];
    } catch (error) {
      this.logger.error('Failed to get projects', error);
      // Return at least the built-in projects if storage fails
      return await this.getBuiltInBlueprints();
    }
  }

  async materializeBlueprint(projectId: string): Promise<ProjectSpec> {
    const projects = await this.getBlueprints();
    const project = projects.find(b => b.id === projectId);
    
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    this.logger.log(`Materializing project: ${project.name}`);
    
    // Handle both built-in projects (spec) and custom projects (template)
    const projectSpec = (project as any).spec || (project as any).template;
    
    if (!projectSpec) {
      throw new Error(`Project ${projectId} has no valid project specification`);
    }
    
    return projectSpec;
  }

  async createBlueprint(projectData: Omit<Project, 'id'>): Promise<Project> {
    this.logger.log(`Creating new project: ${projectData.name}`);
    
    const projectId = uuidv4();
    const project: Project = {
      id: projectId,
      ...projectData,
    };
    
    try {
      // Ensure projects directory exists
      await fs.mkdir(this.blueprintsPath, { recursive: true });
      
      const filePath = join(this.blueprintsPath, `${projectId}.json`);
      await fs.writeFile(filePath, JSON.stringify(project, null, 2));
      
      this.logger.log(`Successfully created project ${projectId}`);
      return project;
    } catch (error) {
      this.logger.error(`Failed to create project ${projectId}`, error);
      throw error;
    }
  }

  async updateBlueprint(projectId: string, projectData: Partial<Project>): Promise<Project> {
    this.logger.log(`Updating project: ${projectId}`);
    
    try {
      const existingProject = await this.getBlueprintById(projectId);
      const updatedProject: Project = {
        ...existingProject,
        ...projectData,
        id: projectId, // Ensure ID doesn't change
      };
      
      const filePath = join(this.blueprintsPath, `${projectId}.json`);
      await fs.writeFile(filePath, JSON.stringify(updatedProject, null, 2));
      
      this.logger.log(`Successfully updated project ${projectId}`);
      return updatedProject;
    } catch (error) {
      this.logger.error(`Failed to update project ${projectId}`, error);
      throw error;
    }
  }

  async deleteBlueprint(projectId: string): Promise<void> {
    this.logger.log(`Deleting project: ${projectId}`);
    
    // Check if it's a built-in project first
    const builtInIds = ['multi-agent', 'approval-chain', 'data-pipeline'];
    if (builtInIds.includes(projectId)) {
      throw new Error('Built-in projects cannot be deleted');
    }
    
    try {
      const filePath = join(this.blueprintsPath, `${projectId}.json`);
      
      // Check if file exists before trying to delete
      await fs.access(filePath);
      
      await fs.unlink(filePath);
      this.logger.log(`Successfully deleted project ${projectId}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.error(`Project file not found: ${projectId}`);
        throw new Error(`Project ${projectId} not found`);
      }
      this.logger.error(`Failed to delete project ${projectId}`, error);
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  async getBlueprintById(projectId: string): Promise<Project> {
    try {
      const filePath = join(this.blueprintsPath, `${projectId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`Failed to get project ${projectId}`, error);
      throw new Error(`Project ${projectId} not found`);
    }
  }

  private async getCustomBlueprints(): Promise<Project[]> {
    try {
      // Ensure projects directory exists
      await fs.mkdir(this.blueprintsPath, { recursive: true });
      
      const files = await fs.readdir(this.blueprintsPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const projects = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const filePath = join(this.blueprintsPath, file);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data) as Project;
          } catch (error) {
            this.logger.warn(`Failed to read project file ${file}`, error);
            return null;
          }
        })
      );
      
      return projects.filter(project => project !== null);
    } catch (error) {
      this.logger.error('Failed to get custom projects', error);
      return [];
    }
  }

  private async getBuiltInBlueprints(): Promise<Project[]> {
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
    // No longer used - kept for backwards compatibility
    return {} as ProjectSpec;
  }

  private createMakerCheckerBlueprint(): ProjectSpec {
    // No longer used - kept for backwards compatibility
    return {} as ProjectSpec;
  }
}