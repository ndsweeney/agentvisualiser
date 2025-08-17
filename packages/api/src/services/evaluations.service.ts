import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { EvalRun } from '../types';

@Injectable()
export class EvaluationsService {
  private readonly logger = new Logger(EvaluationsService.name);
  private readonly runs = new Map<string, EvalRun>();

  async runEvaluation(releaseId: string): Promise<EvalRun> {
    const runId = uuidv4();
    const run: EvalRun = {
      id: runId,
      releaseId,
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    this.runs.set(runId, run);
    this.logger.log(`Started evaluation run ${runId} for release ${releaseId}`);

    // Simulate async evaluation
    setTimeout(() => {
      this.completeEvaluation(runId);
    }, 2000);

    return run;
  }

  async getRunMetrics(runId: string): Promise<EvalRun> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Evaluation run ${runId} not found`);
    }
    return run;
  }

  private completeEvaluation(runId: string): void {
    const run = this.runs.get(runId);
    if (!run) return;

    // Generate deterministic synthetic metrics
    const hash = this.hashString(runId);
    const metrics = {
      accuracy: 0.85 + (hash % 15) / 100, // 0.85-0.99
      latency: 150 + (hash % 100), // 150-249ms
      cost: 0.05 + (hash % 20) / 1000, // $0.05-0.069
      successRate: 0.95 + (hash % 5) / 100, // 0.95-0.99
      throughput: 50 + (hash % 50), // 50-99 requests/minute
    };

    run.status = 'completed';
    run.completedAt = new Date().toISOString();
    run.metrics = metrics;

    this.runs.set(runId, run);
    this.logger.log(`Completed evaluation run ${runId}`);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}