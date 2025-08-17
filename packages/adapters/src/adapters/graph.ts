import type { IToolAdapter, AdapterContext, RateLimitConfig } from '../types';
import { AdapterError, TokenBucket } from '../types';

export class GraphAdapter implements IToolAdapter {
  public readonly id = 'graph-adapter';
  public readonly kind = 'graph';
  private rateLimiter = new TokenBucket(100, 10); // 10 requests per second, burst of 100

  async invoke(input: any, ctx: AdapterContext): Promise<any> {
    if (!(await this.rateLimiter.consume())) {
      throw new AdapterError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
    }

    // Simulate retry logic
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.performGraphOperation(input, ctx);
      } catch (error) {
        if (attempt === maxRetries) {
          throw new AdapterError(
            `Graph operation failed after ${maxRetries} attempts`,
            'GRAPH_OPERATION_FAILED',
            { originalError: error, input, context: ctx }
          );
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new AdapterError('Unexpected error in retry logic', 'RETRY_LOGIC_ERROR');
  }

  private async performGraphOperation(input: any, ctx: AdapterContext): Promise<any> {
    // Deterministic stubbed response based on input and context
    const hash = this.hashInput(input, ctx);
    
    const responses = [
      {
        data: {
          '@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#users',
          value: [
            {
              id: `user-${hash % 1000}`,
              displayName: `Test User ${hash % 100}`,
              mail: `user${hash % 100}@example.com`,
              userPrincipalName: `user${hash % 100}@tenant.onmicrosoft.com`,
            },
          ],
        },
        success: true,
        timestamp: new Date().toISOString(),
      },
      {
        data: {
          '@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#sites',
          value: [
            {
              id: `site-${hash % 500}`,
              displayName: `SharePoint Site ${hash % 50}`,
              webUrl: `https://tenant.sharepoint.com/sites/site${hash % 50}`,
            },
          ],
        },
        success: true,
        timestamp: new Date().toISOString(),
      },
    ];

    return responses[hash % responses.length];
  }

  private hashInput(input: any, ctx: AdapterContext): number {
    const str = JSON.stringify({ input, user: ctx.user, env: ctx.env });
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getRateLimit(): RateLimitConfig {
    return {
      requestsPerSecond: 10,
      burstLimit: 100,
    };
  }
}