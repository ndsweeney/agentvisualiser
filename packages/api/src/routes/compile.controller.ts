import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CompilerService } from '../services/compiler.service';
import { CompiledProjectsService } from '../services/compiled-projects.service';
import { RbacGuard, Roles } from '../guards/rbac.guard';
import type { CompileRequest, CompileResponse } from '../types';

@ApiTags('compile')
@Controller('compile')
@UseGuards(RbacGuard)
export class CompileController {
  constructor(
    private readonly compilerService: CompilerService,
    private readonly compiledProjectsService: CompiledProjectsService
  ) {}

  @Post()
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Compile a project specification into an agent service' })
  @ApiResponse({ status: 201, description: 'Project compiled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid project specification' })
  async compile(@Body() request: CompileRequest): Promise<CompileResponse> {
    const result = await this.compilerService.compile(request);
    
    // Store the compiled project if compilation was successful
    if (result.compiled) {
      try {
        await this.compiledProjectsService.storeCompiledProject({
          blueprintId: request.spec.id,
          blueprintName: request.spec.name,
          compiled: result.compiled,
        });
      } catch (error) {
        // Log the error but don't fail the compilation
        console.warn('Failed to store compiled project:', error);
      }
    }
    
    return result;
  }
}