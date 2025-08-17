import type { IToolAdapter, AdapterContext, RateLimitConfig } from '../types';
import { AdapterError, TokenBucket } from '../types';

export class RestAdapter implements IToolAdapter {
  public readonly id = 'rest-adapter';
  public readonly kind = 'rest';
  private rateLimiter = new TokenBucket(120, 12); // 12 requests per second, burst of 120

  async invoke(input: any, ctx: AdapterContext): Promise<any> {
    if (!(await this.rateLimiter.consume())) {
      throw new AdapterError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.performRestOperation(input, ctx);
      } catch (error) {
        if (attempt === maxRetries) {
          throw new AdapterError(
            `REST operation failed after ${maxRetries} attempts`,
            'REST_OPERATION_FAILED',
            { originalError: error, input, context: ctx }
          );
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new AdapterError('Unexpected error in retry logic', 'RETRY_LOGIC_ERROR');
  }

  private async performRestOperation(input: any, ctx: AdapterContext): Promise<any> {
    const hash = this.hashInput(input, ctx);
    const method = input?.method?.toLowerCase() || 'get';
    
    const responses = {
      get: {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-request-id': `req-${hash}`,
          'x-rate-limit-remaining': '99',
        },
        data: {
          id: hash % 10000,
          name: `Resource ${hash % 1000}`,
          status: hash % 2 === 0 ? 'active' : 'inactive',
          created_at: new Date(Date.now() - (hash % 86400000)).toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            version: `v${hash % 10}.${hash % 100}`,
            environment: ctx.env,
            user: ctx.user,
          },
        },
        success: true,
      },
      post: {
        status: 201,
        headers: {
          'content-type': 'application/json',
          'location': `/api/resources/${hash % 10000}`,
          'x-request-id': `req-${hash}`,
        },
        data: {
          id: hash % 10000,
          message: 'Resource created successfully',
          created_at: new Date().toISOString(),
          created_by: ctx.user,
        },
        success: true,
      },
      put: {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-request-id': `req-${hash}`,
        },
        data: {
          id: hash % 10000,
          message: 'Resource updated successfully',
          updated_at: new Date().toISOString(),
          updated_by: ctx.user,
        },
        success: true,
      },
      delete: {
        status: 204,
        headers: {
          'x-request-id': `req-${hash}`,
        },
        data: null,
        success: true,
      },
    };

    return responses[method as keyof typeof responses] || responses.get;
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
      requestsPerSecond: 12,
      burstLimit: 120,
    };
  }
}