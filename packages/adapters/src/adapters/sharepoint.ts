import type { IToolAdapter, AdapterContext, RateLimitConfig } from '../types';
import { AdapterError, TokenBucket } from '../types';

export class SharePointAdapter implements IToolAdapter {
  public readonly id = 'sharepoint-adapter';
  public readonly kind = 'sharepoint';
  private rateLimiter = new TokenBucket(50, 5); // 5 requests per second, burst of 50

  async invoke(input: any, ctx: AdapterContext): Promise<any> {
    if (!(await this.rateLimiter.consume())) {
      throw new AdapterError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.performSharePointOperation(input, ctx);
      } catch (error) {
        if (attempt === maxRetries) {
          throw new AdapterError(
            `SharePoint operation failed after ${maxRetries} attempts`,
            'SHAREPOINT_OPERATION_FAILED',
            { originalError: error, input, context: ctx }
          );
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new AdapterError('Unexpected error in retry logic', 'RETRY_LOGIC_ERROR');
  }

  private async performSharePointOperation(input: any, ctx: AdapterContext): Promise<any> {
    const hash = this.hashInput(input, ctx);
    
    const operations = [
      {
        operation: 'listItems',
        data: {
          value: [
            {
              id: hash % 1000,
              title: `Document ${hash % 100}`,
              fileType: 'docx',
              size: (hash % 10000) + 1024,
              lastModified: new Date(Date.now() - (hash % 86400000)).toISOString(),
              author: `user${hash % 20}@example.com`,
            },
          ],
        },
        success: true,
      },
      {
        operation: 'uploadFile',
        data: {
          id: `file-${hash}`,
          name: `uploaded-${hash % 100}.pdf`,
          url: `https://tenant.sharepoint.com/sites/site/documents/uploaded-${hash % 100}.pdf`,
          uploadStatus: 'completed',
        },
        success: true,
      },
      {
        operation: 'createList',
        data: {
          id: `list-${hash % 500}`,
          title: `List ${hash % 50}`,
          template: 'genericList',
          itemCount: hash % 100,
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
      requestsPerSecond: 5,
      burstLimit: 50,
    };
  }
}