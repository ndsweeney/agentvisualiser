import type { IToolAdapter, AdapterContext, RateLimitConfig } from '../types';
import { AdapterError, TokenBucket } from '../types';

export class McpAdapter implements IToolAdapter {
  public readonly id = 'mcp-adapter';
  public readonly kind = 'mcp';
  private rateLimiter = new TokenBucket(100, 10); // 10 requests per second, burst of 100

  async invoke(input: any, ctx: AdapterContext): Promise<any> {
    if (!(await this.rateLimiter.consume())) {
      throw new AdapterError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.performMcpOperation(input, ctx);
      } catch (error) {
        if (attempt === maxRetries) {
          throw new AdapterError(
            `MCP operation failed after ${maxRetries} attempts`,
            'MCP_OPERATION_FAILED',
            { originalError: error, input, context: ctx }
          );
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new AdapterError('Unexpected error in retry logic', 'RETRY_LOGIC_ERROR');
  }

  private async performMcpOperation(input: any, ctx: AdapterContext): Promise<any> {
    const hash = this.hashInput(input, ctx);
    
    const operations = [
      {
        operation: 'listTools',
        data: {
          jsonrpc: '2.0',
          id: hash % 10000,
          result: {
            tools: [
              {
                name: `mcp-tool-${hash % 10}`,
                description: `MCP tool ${hash % 10} for data processing`,
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string' },
                    limit: { type: 'number', default: 10 },
                  },
                },
              },
            ],
          },
        },
        success: true,
      },
      {
        operation: 'callTool',
        data: {
          jsonrpc: '2.0',
          id: hash % 10000,
          result: {
            content: [
              {
                type: 'text',
                text: `MCP tool executed successfully with hash ${hash}`,
              },
              {
                type: 'resource',
                resource: {
                  uri: `mcp://local/resource-${hash % 1000}`,
                  name: `Resource ${hash % 1000}`,
                  mimeType: 'application/json',
                },
              },
            ],
            isError: false,
          },
        },
        success: true,
      },
      {
        operation: 'listResources',
        data: {
          jsonrpc: '2.0',
          id: hash % 10000,
          result: {
            resources: [
              {
                uri: `mcp://local/resource-${hash % 1000}`,
                name: `Resource ${hash % 1000}`,
                description: `MCP resource ${hash % 1000}`,
                mimeType: 'application/json',
              },
              {
                uri: `mcp://local/resource-${(hash + 1) % 1000}`,
                name: `Resource ${(hash + 1) % 1000}`,
                description: `MCP resource ${(hash + 1) % 1000}`,
                mimeType: 'text/plain',
              },
            ],
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
      requestsPerSecond: 10,
      burstLimit: 100,
    };
  }
}