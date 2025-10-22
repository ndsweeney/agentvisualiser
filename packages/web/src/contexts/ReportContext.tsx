import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Blueprint } from '@agentfactory/types';
import { validateBlueprintJSON, ValidationResult } from '../utils/blueprintValidation';
import { getCachedDiagramImage } from '../utils/reportIntegration';

type AudienceType = 'leadership' | 'developer' | 'audit' | 'comprehensive';
type FormatType = 'markdown' | 'html' | 'pdf';

interface ReportOptions {
  audience: AudienceType;
  format: FormatType;
  includeKpis: boolean;
  printLayout: boolean;
}

interface ReportErrors {
  jsonParse: string | null;
  generation: string | null;
  export: string | null;
}

interface ReportContextState {
  graphJson: string | null;
  telemetry: Record<string, any> | null;
  audience: AudienceType;
  format: FormatType;
  includeKpis: boolean;
  printLayout: boolean;
  renderedMarkdown: string | null;
  renderedHtml: string | null;
  errors: ReportErrors;
  validationWarnings: string[]; // Add validation warnings
  blueprintMetadata: ValidationResult['metadata'] | null; // Add metadata
  diagramImage: string | null; // Add diagram image
}

interface ReportContextActions {
  setGraph: (jsonString: string) => void;
  setAudience: (audience: AudienceType) => void;
  setFormat: (format: FormatType) => void;
  toggleKpis: () => void;
  togglePrintLayout: () => void;
  generateReport: () => void;
  exportFile: (filename?: string) => void;
  clearAll: () => void;
}

type ReportContextType = ReportContextState & ReportContextActions;

const ReportContext = createContext<ReportContextType | undefined>(undefined);

const initialState: ReportContextState = {
  graphJson: null,
  telemetry: null,
  audience: 'comprehensive',
  format: 'markdown',
  includeKpis: false,
  printLayout: false,
  renderedMarkdown: null,
  renderedHtml: null,
  errors: {
    jsonParse: null,
    generation: null,
    export: null,
  },
  validationWarnings: [],
  blueprintMetadata: null,
  diagramImage: null,
};

export function ReportProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReportContextState>(initialState);
  const [shouldGenerate, setShouldGenerate] = useState(false);

  // Load cached diagram image on mount
  useEffect(() => {
    const cachedImage = getCachedDiagramImage();
    if (cachedImage) {
      setState(prev => ({
        ...prev,
        diagramImage: cachedImage,
      }));
      console.log('[Report] Loaded cached diagram image');
    }
  }, []);

  // Generate report when shouldGenerate flag is set
  useEffect(() => {
    if (shouldGenerate && state.graphJson) {
      try {
        const blueprint: Blueprint = JSON.parse(state.graphJson);
        const markdown = generateMarkdownReport(
          blueprint,
          state.audience,
          state.includeKpis,
          state.telemetry,
          state.diagramImage // Pass diagram image to report generator
        );

        const html = (state.format === 'html' || state.format === 'pdf')
          ? convertMarkdownToHtml(markdown, state.diagramImage) // Pass diagram image to HTML converter
          : null;

        setState(prev => ({
          ...prev,
          renderedMarkdown: markdown,
          renderedHtml: html,
          errors: { ...prev.errors, generation: null },
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            generation: error instanceof Error ? error.message : 'Failed to generate report',
          },
        }));
      }
      setShouldGenerate(false);
    }
  }, [shouldGenerate, state.graphJson, state.audience, state.includeKpis, state.telemetry, state.format, state.diagramImage]);

  const setGraph = useCallback((jsonString: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, jsonParse: null },
      validationWarnings: [],
    }));

    try {
      // Validate the blueprint JSON with full schema validation
      const validation = validateBlueprintJSON(jsonString);

      if (!validation.isValid) {
        setState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            jsonParse: validation.errors.join('\n'),
          },
          validationWarnings: validation.warnings,
          graphJson: null,
          telemetry: null,
          blueprintMetadata: validation.metadata || null,
        }));
        return;
      }

      // Extract telemetry from validated blueprint
      const telemetry = validation.blueprint?.template?.metadata || null;

      setState(prev => ({
        ...prev,
        graphJson: jsonString,
        telemetry,
        validationWarnings: validation.warnings,
        blueprintMetadata: validation.metadata || null,
        errors: { ...prev.errors, jsonParse: null },
      }));

      // Trigger report generation
      setShouldGenerate(true);
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          jsonParse: error instanceof Error ? error.message : 'Invalid JSON format',
        },
        validationWarnings: [],
      }));
    }
  }, []);

  const setAudience = useCallback((audience: AudienceType) => {
    setState(prev => ({
      ...prev,
      audience,
      errors: { ...prev.errors, generation: null },
    }));
    setShouldGenerate(true);
  }, []);

  const setFormat = useCallback((format: FormatType) => {
    setState(prev => {
      const newState = { ...prev, format };
      
      // Convert markdown to HTML if needed
      if ((format === 'html' || format === 'pdf') && prev.renderedMarkdown) {
        newState.renderedHtml = convertMarkdownToHtml(prev.renderedMarkdown);
      }
      
      return newState;
    });
  }, []);

  const toggleKpis = useCallback(() => {
    setState(prev => ({
      ...prev,
      includeKpis: !prev.includeKpis,
    }));
    setShouldGenerate(true);
  }, []);

  const togglePrintLayout = useCallback(() => {
    setState(prev => ({
      ...prev,
      printLayout: !prev.printLayout,
    }));
  }, []);

  const generateReport = useCallback(() => {
    setShouldGenerate(true);
  }, []);

  const exportFile = useCallback((filename?: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, export: null },
    }));

    try {
      const { format, renderedMarkdown, renderedHtml } = state;
      
      if (!renderedMarkdown && !renderedHtml) {
        throw new Error('No content to export');
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const defaultFilename = `agent-report-${timestamp}`;

      if (format === 'markdown') {
        downloadFile(
          renderedMarkdown!,
          `${filename || defaultFilename}.md`,
          'text/markdown'
        );
      } else if (format === 'html') {
        const styledHtml = wrapHtmlWithStyles(renderedHtml!);
        downloadFile(
          styledHtml,
          `${filename || defaultFilename}.html`,
          'text/html'
        );
      } else if (format === 'pdf') {
        // Trigger browser print dialog
        window.print();
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          export: error instanceof Error ? error.message : 'Failed to export file',
        },
      }));
    }
  }, [state]);

  const clearAll = useCallback(() => {
    // Clear context state
    setState(initialState);
    
    // Clear local storage (if any persistence was added)
    try {
      localStorage.removeItem('reportGenerator_lastBlueprint');
      localStorage.removeItem('reportGenerator_options');
    } catch (e) {
      // localStorage may not be available
      console.warn('Failed to clear local storage:', e);
    }
  }, []);

  const value: ReportContextType = {
    ...state,
    setGraph,
    setAudience,
    setFormat,
    toggleKpis,
    togglePrintLayout,
    generateReport,
    exportFile,
    clearAll,
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReport() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}

// Utility functions
function generateMarkdownReport(
  blueprint: Blueprint,
  audience: AudienceType,
  includeKpis: boolean,
  telemetry: Record<string, any> | null,
  diagramImage: string | null
): string {
  const sections: string[] = [];

  // Title
  sections.push(`# Agent Report: ${blueprint.name}\n`);
  sections.push(`**Generated:** ${new Date().toLocaleString()}\n`);
  sections.push(`**Audience:** ${audience.charAt(0).toUpperCase() + audience.slice(1)}\n`);

  // Agent Diagram (if available)
  if (diagramImage) {
    sections.push(`## Agent Diagram\n`);
    sections.push(`![Agent Diagram](${diagramImage})\n`);
    sections.push(`*Visual representation of the agent architecture*\n`);
  }

  // Executive Summary (all audiences)
  sections.push(`## Executive Summary\n`);
  sections.push(`${blueprint.description}\n`);
  sections.push(`**Category:** ${blueprint.category}\n`);
  if (blueprint.tags && blueprint.tags.length > 0) {
    sections.push(`**Tags:** ${blueprint.tags.join(', ')}\n`);
  }

  // KPIs (only if enabled AND telemetry exists)
  if (includeKpis && telemetry) {
    sections.push(`## Key Performance Indicators\n`);
    
    // Info banner explaining KPI data sources
    sections.push(`> **ℹ️ KPI Data Sources:** KPIs are calculated from agent structure (agents, tools, gates, connections) and telemetry metadata when available. Telemetry fields include execution metrics, performance data, success rates, and error counts.\n`);
    
    const agents = blueprint.template?.orchestration?.agents || [];
    const tools = blueprint.template?.orchestration?.tools || [];
    const gates = blueprint.template?.orchestration?.gates || [];
    const edges = blueprint.template?.orchestration?.edges || [];

    // Structural KPIs (always available)
    sections.push(`### Structural Metrics\n`);
    sections.push(`- **Total Agents:** ${agents.length}`);
    sections.push(`- **Tool Bindings:** ${tools.length}`);
    sections.push(`- **Gates/Controls:** ${gates.length}`);
    sections.push(`- **Connections:** ${edges.length}\n`);

    // Check if telemetry has meaningful data
    const hasTelemetryData = telemetry && Object.keys(telemetry).length > 0;
    const hasPerformanceMetrics = telemetry && (
      telemetry.executionCount !== undefined ||
      telemetry.successRate !== undefined ||
      telemetry.averageExecutionTime !== undefined ||
      telemetry.errorCount !== undefined
    );

    if (hasTelemetryData) {
      sections.push(`### Telemetry Metrics\n`);
      
      // Check for partial telemetry data
      const telemetryKeys = Object.keys(telemetry);
      const criticalFields = ['executionCount', 'successRate', 'averageExecutionTime', 'errorCount'];
      const missingCriticalFields = criticalFields.filter(field => telemetry[field] === undefined);
      
      if (missingCriticalFields.length > 0 && missingCriticalFields.length < criticalFields.length) {
        // Partial telemetry - show warning
        sections.push(`> ⚠️ **Insufficient Data:** Some telemetry metrics are unavailable. Missing fields: ${missingCriticalFields.join(', ')}. Complete telemetry data requires execution history with performance tracking enabled.\n`);
      } else if (missingCriticalFields.length === criticalFields.length) {
        // No critical telemetry fields at all
        sections.push(`> ⚠️ **Insufficient Data:** Performance telemetry metrics are not available. This agent may not have been executed yet, or telemetry collection was not enabled during execution.\n`);
      }
      
      // Display available telemetry fields
      if (telemetry.executionCount !== undefined) {
        sections.push(`- **Execution Count:** ${telemetry.executionCount}`);
      }
      if (telemetry.successRate !== undefined) {
        sections.push(`- **Success Rate:** ${(telemetry.successRate * 100).toFixed(1)}%`);
      }
      if (telemetry.averageExecutionTime !== undefined) {
        sections.push(`- **Avg Execution Time:** ${telemetry.averageExecutionTime}ms`);
      }
      if (telemetry.errorCount !== undefined) {
        sections.push(`- **Error Count:** ${telemetry.errorCount}`);
      }
      
      // Display any additional telemetry fields
      const additionalFields = Object.keys(telemetry).filter(
        key => !criticalFields.includes(key)
      );
      if (additionalFields.length > 0) {
        sections.push(`\n**Additional Telemetry:**\n`);
        additionalFields.forEach(key => {
          const value = telemetry[key];
          const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
          sections.push(`- **${key}:** ${displayValue}`);
        });
      }
      
      sections.push('');
    } else {
      // Telemetry object exists but is empty
      sections.push(`### Telemetry Metrics\n`);
      sections.push(`> ⚠️ **Insufficient Data:** No telemetry data is currently available for this agent. Execute the agent with telemetry collection enabled to populate performance metrics.\n`);
    }
  }

  // Architecture (developer & comprehensive)
  if (audience === 'developer' || audience === 'comprehensive') {
    sections.push(`## Architecture Overview\n`);
    const orch = blueprint.template?.orchestration;
    if (orch) {
      sections.push(`**Orchestration ID:** ${orch.id}`);
      sections.push(`**Start Node:** ${orch.startNode}`);
      sections.push(`**Outputs:** ${orch.outputs.join(', ')}\n`);
    }
  }

  // Agents
  const agents = blueprint.template?.orchestration?.agents || [];
  if (agents.length > 0) {
    sections.push(`## Agents (${agents.length})\n`);
    agents.forEach((agent, idx) => {
      sections.push(`### ${idx + 1}. ${agent.name}\n`);
      sections.push(`**ID:** ${agent.id}\n`);
      
      if (audience === 'leadership') {
        sections.push(`**Purpose:** ${agent.prompt.substring(0, 150)}...\n`);
      } else {
        sections.push(`**Prompt:** ${agent.prompt}\n`);
        sections.push(`**Tools:** ${agent.tools.join(', ') || 'None'}\n`);
        
        if (agent.memory) {
          sections.push(`**Memory:** ${agent.memory.type} (max: ${agent.memory.maxTokens || 'unlimited'})\n`);
        }
        
        if (agent.policies) {
          sections.push(`**Policies:**`);
          if (agent.policies.maxIterations) sections.push(`  - Max Iterations: ${agent.policies.maxIterations}`);
          if (agent.policies.timeout) sections.push(`  - Timeout: ${agent.policies.timeout}ms`);
          if (agent.policies.retryPolicy) sections.push(`  - Retry: ${agent.policies.retryPolicy}`);
          sections.push('');
        }
      }
    });
  }

  // Tools (developer & comprehensive)
  if ((audience === 'developer' || audience === 'comprehensive') && blueprint.template?.orchestration?.tools) {
    const tools = blueprint.template.orchestration.tools;
    if (tools.length > 0) {
      sections.push(`## Tool Bindings (${tools.length})\n`);
      tools.forEach((tool, idx) => {
        sections.push(`### ${idx + 1}. ${tool.name}\n`);
        sections.push(`**ID:** ${tool.id}`);
        sections.push(`**Kind:** ${tool.kind}`);
        if (tool.auth) sections.push(`**Auth:** ${tool.auth.type}\n`);
      });
    }
  }

  // Gates (audit & comprehensive)
  if ((audience === 'audit' || audience === 'comprehensive') && blueprint.template?.orchestration?.gates) {
    const gates = blueprint.template.orchestration.gates;
    if (gates.length > 0) {
      sections.push(`## Gates & Controls (${gates.length})\n`);
      gates.forEach((gate, idx) => {
        sections.push(`### ${idx + 1}. Gate ${gate.id}\n`);
        sections.push(`**Type:** ${gate.type}`);
        if (gate.condition) sections.push(`**Condition:** ${gate.condition}`);
        if (gate.approvers) sections.push(`**Approvers:** ${gate.approvers.join(', ')}`);
        if (gate.mergeStrategy) sections.push(`**Merge Strategy:** ${gate.mergeStrategy}`);
        sections.push('');
      });
    }
  }

  // Flow Analysis
  if (audience !== 'leadership') {
    const edges = blueprint.template?.orchestration?.edges || [];
    if (edges.length > 0) {
      sections.push(`## Workflow Flow (${edges.length} connections)\n`);
      edges.forEach((edge, idx) => {
        const label = edge.label ? ` (${edge.label})` : '';
        const condition = edge.condition ? ` [if: ${edge.condition}]` : '';
        sections.push(`${idx + 1}. ${edge.source} → ${edge.target}${label}${condition}`);
      });
      sections.push('');
    }
  }

  // Recommendations (audit & comprehensive)
  if (audience === 'audit' || audience === 'comprehensive') {
    sections.push(`## Recommendations\n`);
    sections.push(`- Ensure all agent prompts follow security guidelines`);
    sections.push(`- Verify tool authentication credentials are properly secured`);
    sections.push(`- Review gate approvers have appropriate permissions`);
    sections.push(`- Test all edge conditions for completeness\n`);
  }

  return sections.join('\n');
}

function convertMarkdownToHtml(markdown: string, diagramImage: string | null = null): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Images (handle markdown image syntax)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 1rem 0;" />');

  // Italic text in markdown (for caption)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```json\n([\s\S]*?)```/g, '<pre><code class="language-json">$1</code></pre>');
  html = html.replace(/```\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Lists - wrap consecutive list items in ul tags
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  return html;
}

function wrapHtmlWithStyles(html: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1 { color: #1a202c; border-bottom: 2px solid #3182ce; padding-bottom: 0.5rem; }
    h2 { color: #2d3748; margin-top: 2rem; }
    h3 { color: #4a5568; }
    img { 
      max-width: 100%; 
      height: auto; 
      display: block;
      margin: 1rem auto;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    em {
      display: block;
      text-align: center;
      color: #718096;
      font-size: 0.9em;
      margin-top: 0.5rem;
    }
    pre { background: #f7fafc; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { font-family: 'Courier New', monospace; font-size: 0.9em; }
    ul { padding-left: 1.5rem; }
    strong { color: #2d3748; }
    @media print {
      body { padding: 0; }
      h1, h2 { page-break-after: avoid; }
      img { page-break-inside: avoid; max-height: 600px; }
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
