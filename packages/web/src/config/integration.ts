// Configuration for canvas integration
export const INTEGRATION_CONFIG = {
  // Allowed origins for postMessage communication
  allowedOrigins: process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  
  // Size limits (in bytes)
  maxMessageSize: parseInt(process.env.NEXT_PUBLIC_MAX_MESSAGE_SIZE || '10485760'), // 10MB
  maxUrlParamSize: parseInt(process.env.NEXT_PUBLIC_MAX_URL_PARAM_SIZE || '2097152'), // 2MB
  
  // Rate limiting
  rateLimitWindow: 10000, // 10 seconds
  rateLimitMaxMessages: 10,
  
  // Message source identifier
  canvasSourceId: 'agentfactory-canvas',
  reportSourceId: 'agentfactory-report',
  
  // Supported message version
  messageVersion: '1.0',
};

/**
 * Check if origin is allowed for postMessage communication
 */
export function isAllowedOrigin(origin: string): boolean {
  const { allowedOrigins } = INTEGRATION_CONFIG;
  
  // In production, filter out localhost
  if (process.env.NODE_ENV === 'production') {
    const prodOrigins = allowedOrigins.filter(o => !o.includes('localhost'));
    return prodOrigins.includes(origin);
  }
  
  // In development, allow all configured origins
  return allowedOrigins.includes(origin);
}

/**
 * Rate limiter for postMessage
 */
class RateLimiter {
  private messageCount: Map<string, { count: number; resetTime: number }> = new Map();

  isRateLimited(origin: string): boolean {
    const now = Date.now();
    const record = this.messageCount.get(origin);
    
    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.messageCount.set(origin, {
        count: 1,
        resetTime: now + INTEGRATION_CONFIG.rateLimitWindow,
      });
      return false;
    }
    
    if (record.count >= INTEGRATION_CONFIG.rateLimitMaxMessages) {
      return true;
    }
    
    record.count++;
    return false;
  }
  
  reset(origin: string) {
    this.messageCount.delete(origin);
  }
}

export const rateLimiter = new RateLimiter();
