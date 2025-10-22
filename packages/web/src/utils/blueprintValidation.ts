import { Blueprint } from '@agentfactory/types';
import { zProjectSpec } from '@agentfactory/types/src/schemas';
import { z } from 'zod';

/**
 * Performance thresholds for validation warnings
 */
export const PERFORMANCE_THRESHOLDS = {
  MAX_FILE_SIZE_MB: 10,
  WARN_FILE_SIZE_MB: 5,
  WARN_NODE_COUNT: 50,
  WARN_EDGE_COUNT: 100,
  MAX_AGENT_PROMPT_LENGTH: 10000,
};

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  blueprint?: Blueprint;
  metadata?: {
    nodeCount: number;
    edgeCount: number;
    agentCount: number;
    toolCount: number;
    gateCount: number;
    fileSize?: number;
    complexity?: 'low' | 'medium' | 'high';
  };
}

/**
 * File upload validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  file?: File;
}

/**
 * Validate uploaded file before reading content
 */
export function validateFileUpload(file: File): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    errors.push('File must be a JSON file (.json)');
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > PERFORMANCE_THRESHOLDS.MAX_FILE_SIZE_MB) {
    errors.push(
      `File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size of ${PERFORMANCE_THRESHOLDS.MAX_FILE_SIZE_MB}MB`
    );
  } else if (fileSizeMB > PERFORMANCE_THRESHOLDS.WARN_FILE_SIZE_MB) {
    warnings.push(
      `Large file detected (${fileSizeMB.toFixed(2)}MB). Processing may take longer.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    file: errors.length === 0 ? file : undefined,
  };
}

/**
 * Validate blueprint JSON against schema
 */
export function validateBlueprintJSON(jsonString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let blueprint: Blueprint | undefined;
  let metadata: ValidationResult['metadata'] | undefined;

  try {
    // Step 1: Parse JSON
    const parsed = JSON.parse(jsonString);
    
    // Step 2: Check if it's a Blueprint structure
    if (!parsed.template && !parsed.spec) {
      errors.push('Invalid blueprint structure: missing "template" or "spec" property');
      return { isValid: false, errors, warnings };
    }

    // Step 3: Validate against schema
    const templateData = parsed.template || parsed.spec;
    
    try {
      zProjectSpec.parse(templateData);
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        zodError.errors.forEach((err) => {
          const path = err.path.join('.');
          errors.push(`${path}: ${err.message}`);
        });
      } else {
        errors.push('Schema validation failed: ' + String(zodError));
      }
      
      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }
    }

    // Step 4: Build blueprint object
    blueprint = {
      id: parsed.id || 'unknown',
      name: parsed.name || 'Untitled Blueprint',
      description: parsed.description || '',
      category: parsed.category,
      tags: parsed.tags || [],
      template: templateData,
    };

    // Step 5: Calculate metadata and check for warnings
    const orchestration = templateData.orchestration;
    const agentCount = orchestration?.agents?.length || 0;
    const toolCount = orchestration?.tools?.length || 0;
    const gateCount = orchestration?.gates?.length || 0;
    const edgeCount = orchestration?.edges?.length || 0;
    const nodeCount = agentCount + toolCount + gateCount;

    metadata = {
      nodeCount,
      edgeCount,
      agentCount,
      toolCount,
      gateCount,
      fileSize: new Blob([jsonString]).size,
      complexity: nodeCount > 30 ? 'high' : nodeCount > 10 ? 'medium' : 'low',
    };

    // Performance warnings
    if (nodeCount > PERFORMANCE_THRESHOLDS.WARN_NODE_COUNT) {
      warnings.push(
        `Large blueprint with ${nodeCount} nodes. Rendering may be slower.`
      );
    }

    if (edgeCount > PERFORMANCE_THRESHOLDS.WARN_EDGE_COUNT) {
      warnings.push(
        `High number of connections (${edgeCount}). Consider simplifying the workflow.`
      );
    }

    // Validation warnings
    if (!orchestration?.startNode) {
      warnings.push('No start node defined. Workflow may not execute properly.');
    }

    if (!orchestration?.outputs || orchestration.outputs.length === 0) {
      warnings.push('No output nodes defined. Results may not be captured.');
    }

    // Check for orphaned nodes
    const connectedNodes = new Set<string>();
    orchestration?.edges?.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const allNodeIds = [
      ...(orchestration?.agents?.map(a => a.id) || []),
      ...(orchestration?.tools?.map(t => t.id) || []),
      ...(orchestration?.gates?.map(g => g.id) || []),
    ];

    const orphanedNodes = allNodeIds.filter(id => !connectedNodes.has(id) && id !== orchestration?.startNode);
    if (orphanedNodes.length > 0) {
      warnings.push(
        `${orphanedNodes.length} orphaned node(s) detected: ${orphanedNodes.slice(0, 3).join(', ')}${orphanedNodes.length > 3 ? '...' : ''}`
      );
    }

    // Check for very long prompts
    orchestration?.agents?.forEach((agent) => {
      if (agent.prompt.length > PERFORMANCE_THRESHOLDS.MAX_AGENT_PROMPT_LENGTH) {
        warnings.push(
          `Agent "${agent.name}" has a very long prompt (${agent.prompt.length} chars). Consider shortening it.`
        );
      }
    });

    return {
      isValid: true,
      errors,
      warnings,
      blueprint,
      metadata,
    };
  } catch (error) {
    errors.push(
      `JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return {
      isValid: false,
      errors,
      warnings,
    };
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  
  return errors
    .map((err, idx) => `${idx + 1}. ${err}`)
    .join('\n');
}

/**
 * Format validation warnings for display
 */
export function formatValidationWarnings(warnings: string[]): string {
  if (warnings.length === 0) return '';
  
  return warnings
    .map((warn, idx) => `${idx + 1}. ${warn}`)
    .join('\n');
}

/**
 * Get performance summary text
 */
export function getPerformanceSummary(metadata: ValidationResult['metadata']): string {
  if (!metadata) return '';
  
  const parts: string[] = [];
  
  parts.push(`📊 ${metadata.nodeCount} nodes`);
  parts.push(`${metadata.edgeCount} connections`);
  
  if (metadata.complexity) {
    const complexityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🔴',
    };
    parts.push(`${complexityEmoji[metadata.complexity]} ${metadata.complexity} complexity`);
  }
  
  if (metadata.fileSize) {
    const sizeMB = (metadata.fileSize / (1024 * 1024)).toFixed(2);
    parts.push(`${sizeMB}MB`);
  }
  
  return parts.join(' • ');
}

/**
 * Validate blueprint structure without full schema validation (quick check)
 */
export function quickValidateBlueprint(data: any): boolean {
  return (
    data &&
    (data.template || data.spec) &&
    (data.template?.orchestration || data.spec?.orchestration)
  );
}
