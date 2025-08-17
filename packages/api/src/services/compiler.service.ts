import { Injectable, Logger } from '@nestjs/common';
import { compileToAgentService } from '@agentfactory/compiler';
import type { ProjectSpec, CompiledService } from '@agentfactory/types';
import type { CompileRequest, CompileResponse } from '../types';

@Injectable()
export class CompilerService {
  private readonly logger = new Logger(CompilerService.name);

  async compile(request: CompileRequest): Promise<CompileResponse> {
    this.logger.log('Starting compilation process');
    
    try {
      const compiled = compileToAgentService(request.spec as ProjectSpec);
      
      this.logger.log(`Successfully compiled project: ${compiled.name}`);
      
      return {
        compiled,
        warnings: [], // TODO: Extract warnings from compiler
      };
    } catch (error) {
      this.logger.error('Compilation failed', error);
      throw error;
    }
  }
}