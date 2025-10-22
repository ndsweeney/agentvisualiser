import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BlueprintsService as ProjectsService } from '../services/blueprints.service';
import { RbacGuard, Roles } from '../guards/rbac.guard';
import type { Blueprint as Project } from '../types';
import type { ProjectSpec } from '@agentfactory/types';

@ApiTags('projects')
@Controller('projects')
@UseGuards(RbacGuard)
export class BlueprintsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Roles('Creator', 'Operator', 'Auditor')
  @ApiOperation({ summary: 'Get all available project patterns' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  async getBlueprints(): Promise<Project[]> {
    return this.projectsService.getBlueprints();
  }

  @Post()
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ 
    description: 'Project data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Project description' },
        category: { type: 'string', description: 'Project category' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags' },
        template: { type: 'object', description: 'Project template specification' }
      },
      required: ['name', 'description', 'category', 'template']
    }
  })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid project data' })
  async createBlueprint(@Body() projectData: Omit<Project, 'id'>): Promise<Project> {
    return this.projectsService.createBlueprint(projectData);
  }

  @Put(':id')
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Update an existing project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async updateBlueprint(
    @Param('id') projectId: string,
    @Body() projectData: Partial<Project>
  ): Promise<Project> {
    return this.projectsService.updateBlueprint(projectId, projectData);
  }

  @Delete(':id')
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 204, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete built-in project' })
  async deleteBlueprint(@Param('id') projectId: string): Promise<void> {
    // Check if it's a built-in project
    const builtInIds = ['multi-agent', 'approval-chain', 'data-pipeline', 'helpdesk-automation', 'maker-checker'];
    if (builtInIds.includes(projectId)) {
      throw new Error('Built-in projects cannot be deleted');
    }
    
    return this.projectsService.deleteBlueprint(projectId);
  }

  @Get(':id')
  @Roles('Creator', 'Operator', 'Auditor')
  @ApiOperation({ summary: 'Get a specific project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getBlueprint(@Param('id') projectId: string): Promise<Project> {
    return this.projectsService.getBlueprintById(projectId);
  }

  @Post(':id/materialize')
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Materialize a project into a ProjectSpec' })
  @ApiResponse({ status: 201, description: 'Project materialized successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async materializeBlueprint(@Param('id') projectId: string): Promise<ProjectSpec> {
    return this.projectsService.materializeBlueprint(projectId);
  }
}