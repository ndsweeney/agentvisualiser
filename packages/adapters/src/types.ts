export interface AdapterContext {
  user: string;
  env: 'dev' | 'staging' | 'prod';
  requestId?: string;
  timestamp?: number;
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  burstLimit: number;
}

export interface IToolAdapter {
  id: string;
  kind: string;
  invoke(input: any, ctx: AdapterContext): Promise<any>;
  getRateLimit(): RateLimitConfig;
}

export interface AdapterRegistry {
  register(adapter: IToolAdapter): void;
  get(kind: string): IToolAdapter | undefined;
  list(): IToolAdapter[];
}

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async consume(tokens = 1): Promise<boolean> {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

export class AdapterError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}