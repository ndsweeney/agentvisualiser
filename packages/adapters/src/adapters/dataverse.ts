import type { IToolAdapter, AdapterContext, RateLimitConfig } from '../types';
import { AdapterError, TokenBucket } from '../types';

export class DataverseAdapter implements IToolAdapter {
  public readonly id = 'dataverse-adapter';
  public readonly kind = 'dataverse';
  private rateLimiter = new TokenBucket(60, 6); // 6 requests per second, burst of 60

  async invoke(input: any, ctx: AdapterContext): Promise<any> {
    if (!(await this.rateLimiter.consume())) {
      throw new AdapterError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.performDataverseOperation(input, ctx);
      } catch (error) {
        if (attempt === maxRetries) {
          throw new AdapterError(
            `Dataverse operation failed after ${maxRetries} attempts`,
            'DATAVERSE_OPERATION_FAILED',
            { originalError: error, input, context: ctx }
          );
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new AdapterError('Unexpected error in retry logic', 'RETRY_LOGIC_ERROR');
  }

  private async performDataverseOperation(input: any, ctx: AdapterContext): Promise<any> {
    const hash = this.hashInput(input, ctx);
    
    const operations = [
      {
        operation: 'createRecord',
        data: {
          '@odata.context': 'https://org.crm.dynamics.com/api/data/v9.2/$metadata#accounts/$entity',
          accountid: `${hash.toString(16)}-1234-5678-9abc-def012345678`,
          name: `Account ${hash % 1000}`,
          accountnumber: `ACC-${String(hash % 100000).padStart(5, '0')}`,
          revenue: (hash % 10000000) + 10000,
          industrycode: hash % 10,
          createdon: new Date().toISOString(),
        },
        success: true,
      },
      {
        operation: 'queryRecords',
        data: {
          '@odata.context': 'https://org.crm.dynamics.com/api/data/v9.2/$metadata#contacts',
          value: [
            {
              contactid: `${(hash + 1).toString(16)}-1234-5678-9abc-def012345678`,
              fullname: `Contact ${(hash + 1) % 100}`,
              emailaddress1: `contact${(hash + 1) % 100}@example.com`,
              telephone1: `+1-555-${String((hash + 1) % 10000).padStart(4, '0')}`,
              parentcustomerid_account: {
                accountid: `${hash.toString(16)}-1234-5678-9abc-def012345678`,
                name: `Account ${hash % 1000}`,
              },
            },
          ],
        },
        success: true,
      },
      {
        operation: 'updateRecord',
        data: {
          '@odata.context': 'https://org.crm.dynamics.com/api/data/v9.2/$metadata#accounts/$entity',
          accountid: `${hash.toString(16)}-1234-5678-9abc-def012345678`,
          modifiedon: new Date().toISOString(),
          modifiedby: {
            systemuserid: `${ctx.user.split('@')[0]}-user-id`,
            fullname: ctx.user,
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
      requestsPerSecond: 6,
      burstLimit: 60,
    };
  }
}