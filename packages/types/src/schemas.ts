import { z } from 'zod';

export const zAgentDef = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  prompt: z.string().min(1),
  tools: z.array(z.string()),
  memory: z.object({
    type: z.enum(['ephemeral', 'persistent']),
    maxTokens: z.number().positive().optional(),
  }).optional(),
  policies: z.object({
    maxIterations: z.number().positive().optional(),
    timeout: z.number().positive().optional(),
    retryPolicy: z.enum(['exponential', 'linear', 'none']).optional(),
  }).optional(),
});

export const zToolBinding = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['graph', 'sharepoint', 'servicenow', 'dataverse', 'rest', 'mcp']),
  config: z.record(z.unknown()),
  auth: z.object({
    type: z.enum(['bearer', 'oauth2', 'apikey', 'none']),
    credentials: z.record(z.string()).optional(),
  }).optional(),
});

export const zGate = z.object({
  id: z.string().min(1),
  type: z.enum(['approval', 'condition', 'merge', 'split']),
  condition: z.string().optional(),
  approvers: z.array(z.string()).optional(),
  mergeStrategy: z.enum(['all', 'any', 'majority']).optional(),
});

export const zEdge = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  condition: z.string().optional(),
  label: z.string().optional(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export const zOrchestration = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  agents: z.array(zAgentDef),
  tools: z.array(zToolBinding),
  gates: z.array(zGate),
  edges: z.array(zEdge),
  startNode: z.string().min(1),
  outputs: z.array(z.string()),
});

export const zEvalMetric = z.object({
  name: z.string().min(1),
  type: z.enum(['accuracy', 'latency', 'cost', 'custom']),
  threshold: z.number().optional(),
  weight: z.number().min(0).max(1).optional(),
});

export const zEvalCase = z.object({
  id: z.string().min(1),
  input: z.record(z.unknown()),
  expectedOutput: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const zEvalSuite = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  metrics: z.array(zEvalMetric),
  testCases: z.array(zEvalCase),
  environment: z.enum(['dev', 'staging', 'prod']),
});

export const zProjectSpec = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  orchestration: zOrchestration,
  evaluations: z.array(zEvalSuite).optional(),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    nodePositions: z.record(z.object({
      x: z.number(),
      y: z.number(),
    })).optional(),
  }).optional(),
});

export const zCompiledAgent = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  prompt: z.string().min(1),
  tools: z.array(zToolBinding),
  nextAgents: z.array(z.string()),
  memory: zAgentDef.shape.memory,
  policies: zAgentDef.shape.policies,
});

export const zCompiledService = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  agents: z.array(zCompiledAgent),
  startAgent: z.string().min(1),
  outputs: z.array(z.string()),
  topology: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      type: z.enum(['agent', 'tool', 'gate']),
    })),
    edges: z.array(zEdge),
  }),
  metadata: zProjectSpec.shape.metadata,
});

/**
 * Theme Configuration Schema
 * Defines theming options for report generation and export
 */
export interface ThemeConfig {
  /** Typography scale multiplier (0.8 - 1.2) */
  fontScale?: number;
  /** Spacing scale multiplier (0.8 - 1.5) */
  spacingScale?: number;
  /** Table density: compact, normal, comfortable */
  tableDensity?: 'compact' | 'normal' | 'comfortable';
  /** Print margin preset */
  printMargins?: 'narrow' | 'normal' | 'wide';
  /** Enable high-contrast mode for printing */
  highContrastPrint?: boolean;
  /** Enable monochrome/grayscale mode */
  monochrome?: boolean;
  /** Custom CSS variables override */
  customVariables?: Record<string, string>;
  /** Page break behavior */
  pageBreaks?: PageBreakConfig;
}

/**
 * Page Break Configuration
 */
export interface PageBreakConfig {
  /** Avoid breaks after headings */
  avoidAfterHeadings?: boolean;
  /** Force break before H1 headings */
  breakBeforeChapters?: boolean;
  /** Avoid breaks inside tables */
  avoidInTables?: boolean;
  /** Avoid breaks inside figures/images */
  avoidInFigures?: boolean;
  /** Minimum lines at bottom of page (orphans) */
  orphans?: number;
  /** Minimum lines at top of page (widows) */
  widows?: number;
}

/**
 * Token Injection Schema
 * Defines dynamic tokens that can be replaced at export time
 */
export interface TokenInjection {
  /** Token name (e.g., "BrandName", "FooterNote") */
  name: string;
  /** Token value to inject */
  value: string;
  /** Token type for validation */
  type?: 'text' | 'date' | 'number' | 'url' | 'markdown';
  /** Default value if not provided */
  defaultValue?: string;
  /** Format string for dates/numbers */
  format?: string;
}

/**
 * Export Options with Theme and Tokens
 */
export interface ReportExportOptions {
  /** Output format */
  format: 'pdf' | 'html' | 'markdown' | 'docx';
  /** Theme configuration */
  theme?: ThemeConfig;
  /** Dynamic tokens to inject */
  tokens?: TokenInjection[];
  /** Include table of contents */
  includeToC?: boolean;
  /** Include page numbers */
  includePageNumbers?: boolean;
  /** Header template (supports tokens) */
  headerTemplate?: string;
  /** Footer template (supports tokens) */
  footerTemplate?: string;
  /** Metadata for document properties */
  metadata?: ReportMetadata;
  /** Filename for export */
  filename?: string;
}

/**
 * Report Metadata
 */
export interface ReportMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  created?: Date;
  modified?: Date;
  company?: string;
  comments?: string;
}

/**
 * Token Pattern Definition
 * Defines how tokens are identified in templates
 */
export interface TokenPattern {
  /** Regex pattern to match token (e.g., /\{\{(\w+)\}\}/g) */
  pattern: RegExp;
  /** Prefix for token (e.g., "{{") */
  prefix: string;
  /** Suffix for token (e.g., "}}") */
  suffix: string;
  /** Case sensitive matching */
  caseSensitive?: boolean;
}

/**
 * Default Token Patterns
 */
export const DEFAULT_TOKEN_PATTERNS: Record<string, TokenPattern> = {
  doubleBrace: {
    pattern: /\{\{(\w+)\}\}/g,
    prefix: '{{',
    suffix: '}}',
    caseSensitive: false,
  },
  singleBrace: {
    pattern: /\{(\w+)\}/g,
    prefix: '{',
    suffix: '}',
    caseSensitive: false,
  },
  dollar: {
    pattern: /\$\{(\w+)\}/g,
    prefix: '${',
    suffix: '}',
    caseSensitive: false,
  },
};

/**
 * Pre-defined theme presets
 */
export const THEME_PRESETS: Record<string, ThemeConfig> = {
  default: {
    fontScale: 1,
    spacingScale: 1,
    tableDensity: 'normal',
    printMargins: 'normal',
    highContrastPrint: false,
    monochrome: false,
  },
  compact: {
    fontScale: 0.9,
    spacingScale: 0.8,
    tableDensity: 'compact',
    printMargins: 'narrow',
    highContrastPrint: false,
    monochrome: false,
  },
  comfortable: {
    fontScale: 1.1,
    spacingScale: 1.2,
    tableDensity: 'comfortable',
    printMargins: 'wide',
    highContrastPrint: false,
    monochrome: false,
  },
  printOptimized: {
    fontScale: 1,
    spacingScale: 1,
    tableDensity: 'compact',
    printMargins: 'narrow',
    highContrastPrint: true,
    monochrome: true,
    pageBreaks: {
      avoidAfterHeadings: true,
      breakBeforeChapters: true,
      avoidInTables: true,
      avoidInFigures: true,
      orphans: 3,
      widows: 3,
    },
  },
  accessible: {
    fontScale: 1.15,
    spacingScale: 1.3,
    tableDensity: 'comfortable',
    printMargins: 'wide',
    highContrastPrint: true,
    monochrome: false,
  },
};

// Re-export the main schema for convenience
export default zProjectSpec;