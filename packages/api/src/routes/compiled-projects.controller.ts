import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CompiledProjectsService } from '../services/compiled-projects.service';
import { RbacGuard, Roles } from '../guards/rbac.guard';

@ApiTags('compiled')
@Controller('compiled')
@UseGuards(RbacGuard)
export class CompiledProjectsController {
  constructor(private readonly compiledProjectsService: CompiledProjectsService) {}

  @Post()
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Store a compiled project' })
  @ApiResponse({ status: 201, description: 'Compiled project stored successfully' })
  async storeCompiledProject(@Body() compiledProject: any): Promise<any> {
    return this.compiledProjectsService.storeCompiledProject(compiledProject);
  }

  @Get()
  @Roles('Creator', 'Operator', 'Auditor')
  @ApiOperation({ summary: 'Get all compiled projects' })
  @ApiResponse({ status: 200, description: 'List of compiled projects' })
  async getAllCompiledProjects(): Promise<any[]> {
    return this.compiledProjectsService.getAllCompiledProjects();
  }

  @Delete(':id')
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Delete a compiled project' })
  @ApiResponse({ status: 204, description: 'Compiled project deleted successfully' })
  async deleteCompiledProject(@Param('id') id: string): Promise<void> {
    return this.compiledProjectsService.deleteCompiledProject(id);
  }
}