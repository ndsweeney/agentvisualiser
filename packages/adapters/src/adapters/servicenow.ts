import type { IToolAdapter, AdapterContext, RateLimitConfig } from '../types';
import { AdapterError, TokenBucket } from '../types';

export class ServiceNowAdapter implements IToolAdapter {
  public readonly id = 'servicenow-adapter';
  public readonly kind = 'servicenow';
  private rateLimiter = new TokenBucket(30, 3); // 3 requests per second, burst of 30

  async invoke(input: any, ctx: AdapterContext): Promise<any> {
    if (!(await this.rateLimiter.consume())) {
      throw new AdapterError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.performServiceNowOperation(input, ctx);
      } catch (error) {
        if (attempt === maxRetries) {
          throw new AdapterError(
            `ServiceNow operation failed after ${maxRetries} attempts`,
            'SERVICENOW_OPERATION_FAILED',
            { originalError: error, input, context: ctx }
          );
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new AdapterError('Unexpected error in retry logic', 'RETRY_LOGIC_ERROR');
  }

  private async performServiceNowOperation(input: any, ctx: AdapterContext): Promise<any> {
    const hash = this.hashInput(input, ctx);
    
    const operations = [
      {
        operation: 'createIncident',
        data: {
          result: {
            sys_id: `INC${String(hash % 1000000).padStart(7, '0')}`,
            number: `INC${String(hash % 1000000).padStart(7, '0')}`,
            short_description: `Incident ${hash % 1000}`,
            state: hash % 2 === 0 ? 'New' : 'In Progress',
            priority: ['1 - Critical', '2 - High', '3 - Moderate', '4 - Low'][hash % 4],
            assigned_to: `user${hash % 10}@company.com`,
            created_on: new Date().toISOString(),
          },
        },
        success: true,
      },
      {
        operation: 'queryIncidents',
        data: {
          result: [
            {
              sys_id: `INC${String((hash + 1) % 1000000).padStart(7, '0')}`,
              number: `INC${String((hash + 1) % 1000000).padStart(7, '0')}`,
              short_description: `Service disruption ${(hash + 1) % 100}`,
              state: 'Resolved',
              priority: '2 - High',
              resolved_on: new Date(Date.now() - (hash % 86400000)).toISOString(),
            },
          ],
        },
        success: true,
      },
      {
        operation: 'updateIncident',
        data: {
          result: {
            sys_id: `INC${String(hash % 1000000).padStart(7, '0')}`,
            state: 'Resolved',
            resolution_notes: `Resolved via automated process ${hash % 100}`,
            resolved_by: ctx.user,
            resolved_on: new Date().toISOString(),
          },
        },
        success: true,
      },
    ];

    return operations[hash % operations.length];
  }

  private hashInput(input: any, ctx: AdapterContext): number {
    const str = JSON.stringify({ input, user: ctx.user, env: ctx.env });
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getRateLimit(): RateLimitConfig {
    return {
      requestsPerSecond: 3,
      burstLimit: 30,
    };
  }
}