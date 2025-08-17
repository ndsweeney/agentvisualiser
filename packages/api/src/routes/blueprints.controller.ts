import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BlueprintsService } from '../services/blueprints.service';
import { RbacGuard, Roles } from '../guards/rbac.guard';
import type { Blueprint } from '../types';
import type { ProjectSpec } from '@agentfactory/types';

@ApiTags('blueprints')
@Controller('blueprints')
@UseGuards(RbacGuard)
export class BlueprintsController {
  constructor(private readonly blueprintsService: BlueprintsService) {}

  @Get()
  @Roles('Creator', 'Operator', 'Auditor')
  @ApiOperation({ summary: 'Get all available blueprint patterns' })
  @ApiResponse({ status: 200, description: 'Blueprints retrieved successfully' })
  async getBlueprints(): Promise<Blueprint[]> {
    return this.blueprintsService.getBlueprints();
  }

  @Post()
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Create a new blueprint' })
  @ApiBody({ 
    description: 'Blueprint data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Blueprint name' },
        description: { type: 'string', description: 'Blueprint description' },
        category: { type: 'string', description: 'Blueprint category' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags' },
        template: { type: 'object', description: 'Project template specification' }
      },
      required: ['name', 'description', 'category', 'template']
    }
  })
  @ApiResponse({ status: 201, description: 'Blueprint created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid blueprint data' })
  async createBlueprint(@Body() blueprintData: Omit<Blueprint, 'id'>): Promise<Blueprint> {
    return this.blueprintsService.createBlueprint(blueprintData);
  }

  @Put(':id')
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Update an existing blueprint' })
  @ApiResponse({ status: 200, description: 'Blueprint updated successfully' })
  @ApiResponse({ status: 404, description: 'Blueprint not found' })
  async updateBlueprint(
    @Param('id') blueprintId: string,
    @Body() blueprintData: Partial<Blueprint>
  ): Promise<Blueprint> {
    return this.blueprintsService.updateBlueprint(blueprintId, blueprintData);
  }

  @Delete(':id')
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Delete a blueprint' })
  @ApiResponse({ status: 204, description: 'Blueprint deleted successfully' })
  @ApiResponse({ status: 404, description: 'Blueprint not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete built-in blueprint' })
  async deleteBlueprint(@Param('id') blueprintId: string): Promise<void> {
    // Check if it's a built-in blueprint
    const builtInIds = ['multi-agent', 'approval-chain', 'data-pipeline', 'helpdesk-automation', 'maker-checker'];
    if (builtInIds.includes(blueprintId)) {
      throw new Error('Built-in blueprints cannot be deleted');
    }
    
    return this.blueprintsService.deleteBlueprint(blueprintId);
  }

  @Get(':id')
  @Roles('Creator', 'Operator', 'Auditor')
  @ApiOperation({ summary: 'Get a specific blueprint by ID' })
  @ApiResponse({ status: 200, description: 'Blueprint retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Blueprint not found' })
  async getBlueprint(@Param('id') blueprintId: string): Promise<Blueprint> {
    return this.blueprintsService.getBlueprintById(blueprintId);
  }

  @Post(':id/materialize')
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Materialize a blueprint into a ProjectSpec' })
  @ApiResponse({ status: 201, description: 'Blueprint materialized successfully' })
  @ApiResponse({ status: 404, description: 'Blueprint not found' })
  async materializeBlueprint(@Param('id') blueprintId: string): Promise<ProjectSpec> {
    return this.blueprintsService.materializeBlueprint(blueprintId);
  }
}