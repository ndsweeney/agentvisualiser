export interface User {
  id: string;
  email: string;
  role: 'Creator' | 'Operator' | 'Auditor';
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface CompileRequest {
  spec: any;
}

export interface CompileResponse {
  compiled: any;
  warnings?: string[];
}

export interface DeployRequest {
  compiled: any;
  environment: 'dev' | 'staging' | 'prod';
}

export interface DeployResponse {
  releaseId: string;
  environment: string;
  deployedAt: string;
}

export interface Tool {
  id: string;
  name: string;
  kind: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Blueprint {
  id: string;
  name: string;
  description: string;
  category: string;
  spec: any;
}

export interface EvalRun {
  id: string;
  releaseId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  metrics?: Record<string, number>;
}