import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ToolsService } from '../services/tools.service';
import { RbacGuard, Roles } from '../guards/rbac.guard';
import type { Tool } from '../types';

@ApiTags('tools')
@Controller('tools')
@UseGuards(RbacGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  @Roles('Creator', 'Operator', 'Auditor')
  @ApiOperation({ summary: 'Get all available tools' })
  @ApiResponse({ status: 200, description: 'Tools retrieved successfully' })
  async getTools(): Promise<Tool[]> {
    return this.toolsService.getTools();
  }

  @Post()
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Create a new tool configuration' })
  @ApiResponse({ status: 201, description: 'Tool created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid tool configuration' })
  async createTool(
    @Body() tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Tool> {
    return this.toolsService.createTool(tool);
  }
}