import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { RbacGuard } from './guards/rbac.guard';
import { CompilerService } from './services/compiler.service';
import { DeploymentService } from './services/deployment.service';
import { ToolsService } from './services/tools.service';
import { BlueprintsService } from './services/blueprints.service';
import { EvaluationsService } from './services/evaluations.service';
import { CompiledProjectsService } from './services/compiled-projects.service';
import { CompileController } from './routes/compile.controller';
import { DeployController } from './routes/deploy.controller';
import { ToolsController } from './routes/tools.controller';
import { BlueprintsController } from './routes/blueprints.controller';
import { EvaluationsController } from './routes/evaluations.controller';
import { CompiledProjectsController } from './routes/compiled-projects.controller';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

@Module({
  imports: [],
  controllers: [
    CompileController,
    DeployController,
    ToolsController,
    BlueprintsController,
    EvaluationsController,
    CompiledProjectsController,
  ],
  providers: [
    CompilerService,
    DeploymentService,
    ToolsService,
    BlueprintsService,
    EvaluationsService,
    CompiledProjectsService,
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}