import { Blueprint } from '@agentfactory/types';
import zProjectSpec from '@agentfactory/types/src/schemas';
import { z } from 'zod';

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  WARN_NODE_COUNT: 50,
  WARN_EDGE_COUNT: 100,
  WARN_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_MB: 10,
};

// Schema version support
export const SUPPORTED_SCHEMA_VERSIONS = ['1.0', '1.0.0'];
export const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  blueprint?: Blueprint;
  metadata?: {
    nodeCount: number;
    edgeCount: number;
    fileSizeKB: number;
    schemaVersion?: string;
    hasDeprecatedFields: boolean;
  };
}

/**
 * Validate uploaded JSON file
 * Checks file size, type, and content
 */
export function validateFileUpload(file: File): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (!file.type.includes('json') && !file.name.endsWith('.json')) {
    errors.push('Invalid file type. Please upload a JSON file.');
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > PERFORMANCE_THRESHOLDS.MAX_FILE_SIZE_MB) {
    errors.push(
      `File too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is ${PERFORMANCE_THRESHOLDS.MAX_FILE_SIZE_MB}MB.`
    );
  } else if (fileSizeMB > PERFORMANCE_THRESHOLDS.WARN_FILE_SIZE_MB) {
    warnings.push(
      `Large file detected (${fileSizeMB.toFixed(2)}MB). Processing may be slow.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      nodeCount: 0,
      edgeCount: 0,
      fileSizeKB: file.size / 1024,
      hasDeprecatedFields: false,
    },
  };
}

/**
 * Validate JSON string and parse blueprint
 * Full schema validation with detailed error messages
 */
export function validateBlueprintJSON(jsonString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let parsedData: any;

  // Step 1: Parse JSON
  try {
    parsedData = JSON.parse(jsonString);
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `Invalid JSON format: ${error instanceof Error ? error.message : 'Unable to parse'}`,
        'Please ensure your JSON is properly formatted with matching brackets and quotes.',
      ],
      warnings: [],
    };
  }

  // Step 2: Check schema version
  const schemaVersion = parsedData.template?.version || parsedData.version;
  if (schemaVersion && !SUPPORTED_SCHEMA_VERSIONS.includes(schemaVersion)) {
    warnings.push(
      `Schema version '${schemaVersion}' may not be fully compatible. Supported versions: ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}`
    );
  }

  // Step 3: Check for required top-level fields
  if (!parsedData.id) {
    errors.push("Missing required field: 'id' at root level");
  }
  if (!parsedData.name) {
    errors.push("Missing required field: 'name' at root level");
  }
  if (!parsedData.template && !parsedData.spec) {
    errors.push(
      "Missing required field: 'template' or 'spec'. Blueprint must contain orchestration data."
    );
  }

  // Step 4: Validate blueprint structure using Zod schema
  const template = parsedData.template || parsedData.spec;
  if (template?.orchestration) {
    try {
      // Validate the ProjectSpec schema
      zProjectSpec.parse(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          const path = err.path.join(' → ');
          errors.push(`Schema validation error at '${path}': ${err.message}`);
        });
      } else {
        errors.push(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  // Step 5: Performance analysis
  const orch = template?.orchestration;
  const nodeCount =
    (orch?.agents?.length || 0) +
    (orch?.tools?.length || 0) +
    (orch?.gates?.length || 0);
  const edgeCount = orch?.edges?.length || 0;

  if (nodeCount > PERFORMANCE_THRESHOLDS.WARN_NODE_COUNT) {
    warnings.push(
      `⚠️ Large blueprint detected with ${nodeCount} nodes. Report generation may take longer.`
    );
  }

  if (edgeCount > PERFORMANCE_THRESHOLDS.WARN_EDGE_COUNT) {
    warnings.push(
      `⚠️ Complex workflow detected with ${edgeCount} connections. Consider simplifying for better readability.`
    );
  }

  // Step 6: Check for deprecated or missing fields
  const hasDeprecatedFields = checkDeprecatedFields(parsedData);
  if (hasDeprecatedFields) {
    warnings.push(
      'Blueprint contains deprecated fields. Consider updating to the latest schema.'
    );
  }

  // Step 7: Check orchestration completeness
  if (orch) {
    if (!orch.startNode) {
      errors.push("Missing 'startNode' in orchestration. Unable to determine workflow entry point.");
    }
    if (!orch.outputs || orch.outputs.length === 0) {
      warnings.push("No output nodes defined. Consider specifying workflow outputs.");
    }
    if (orch.agents && orch.agents.length === 0) {
      warnings.push('No agents defined in orchestration. Blueprint may not be functional.');
    }
  }

  // Return validation result
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    blueprint: errors.length === 0 ? (parsedData as Blueprint) : undefined,
    metadata: {
      nodeCount,
      edgeCount,
      fileSizeKB: new Blob([jsonString]).size / 1024,
      schemaVersion,
      hasDeprecatedFields,
    },
  };
}

/**
 * Check for deprecated fields in blueprint
 */
function checkDeprecatedFields(data: any): boolean {
  // Check for old field names or structures that have been deprecated
  const deprecated = [
    data.spec && !data.template, // Old 'spec' field instead of 'template'
    data.template?.orchestration?.nodes, // Old 'nodes' array instead of separate agents/tools/gates
    data.template?.flow, // Old 'flow' field
  ];

  return deprecated.some((check) => check === true);
}

/**
 * Get user-friendly error message for common issues
 */
export function getUserFriendlyError(error: string): string {
  const errorMap: Record<string, string> = {
    'Unexpected token': 'Invalid JSON syntax. Check for missing commas, brackets, or quotes.',
    'Expected property name': 'Invalid JSON structure. Ensure all properties are properly named.',
    'Unexpected end': 'Incomplete JSON. The file may be truncated.',
    'duplicate key': 'Duplicate property names found. Each property must be unique.',
    'Required': 'Missing required field in blueprint schema.',
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return message;
    }
  }

  return error;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return errors
    .map((err, idx) => `${idx + 1}. ${getUserFriendlyError(err)}`)
    .join('\n');
}

/**
 * Format validation warnings for display
 */
export function formatValidationWarnings(warnings: string[]): string {
  if (warnings.length === 0) return '';
  return warnings.map((warn) => `• ${warn}`).join('\n');
}

/**
 * Create a performance summary message
 */
export function getPerformanceSummary(metadata: ValidationResult['metadata']): string {
  if (!metadata) return '';

  const parts: string[] = [];
  
  parts.push(`📊 Blueprint Size: ${metadata.nodeCount} nodes, ${metadata.edgeCount} connections`);
  parts.push(`💾 File Size: ${metadata.fileSizeKB.toFixed(2)} KB`);
  
  if (metadata.schemaVersion) {
    parts.push(`📋 Schema Version: ${metadata.schemaVersion}`);
  }

  return parts.join(' | ');
}
