import { Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeploymentService } from '../services/deployment.service';
import { RbacGuard, Roles } from '../guards/rbac.guard';
import type { DeployRequest, DeployResponse } from '../types';

@ApiTags('deploy')
@Controller('deploy')
@UseGuards(RbacGuard)
export class DeployController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post()
  @Roles('Operator')
  @ApiOperation({ summary: 'Deploy a compiled agent service to an environment' })
  @ApiResponse({ status: 201, description: 'Service deployed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid deployment request' })
  async deploy(@Body() request: DeployRequest): Promise<DeployResponse> {
    return this.deploymentService.deploy(request);
  }

  @Get()
  @Roles('Operator', 'Auditor')
  @ApiOperation({ summary: 'Get all deployed releases' })
  @ApiResponse({ status: 200, description: 'List of deployed releases' })
  async getAllDeployments(): Promise<any[]> {
    return this.deploymentService.getAllReleases();
  }

  @Delete(':releaseId')
  @Roles('Operator')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a deployed release' })
  @ApiResponse({ status: 204, description: 'Release deleted successfully' })
  @ApiResponse({ status: 404, description: 'Release not found' })
  async deleteDeployment(@Param('releaseId') releaseId: string): Promise<void> {
    return this.deploymentService.deleteRelease(releaseId);
  }
}