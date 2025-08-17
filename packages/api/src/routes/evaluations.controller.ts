import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EvaluationsService } from '../services/evaluations.service';
import { RbacGuard, Roles } from '../guards/rbac.guard';
import type { EvalRun } from '../types';

@ApiTags('evaluations')
@Controller('evals')
@UseGuards(RbacGuard)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post('run')
  @Roles('Creator', 'Operator')
  @ApiOperation({ summary: 'Start an evaluation run for a deployed release' })
  @ApiResponse({ status: 201, description: 'Evaluation started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid evaluation request' })
  async runEvaluation(@Body() body: { releaseId: string }): Promise<EvalRun> {
    return this.evaluationsService.runEvaluation(body.releaseId);
  }

  @Get('runs/:id/metrics')
  @Roles('Creator', 'Operator', 'Auditor')
  @ApiOperation({ summary: 'Get metrics for an evaluation run' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Evaluation run not found' })
  async getRunMetrics(@Param('id') runId: string): Promise<EvalRun> {
    return this.evaluationsService.getRunMetrics(runId);
  }
}