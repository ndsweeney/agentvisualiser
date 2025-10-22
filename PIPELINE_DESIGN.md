# In-Browser Report Generation Pipeline Design

## Overview

The Report Generator operates entirely client-side with a deterministic, multi-stage pipeline that transforms blueprint JSON into formatted reports. All processing happens in memory with selective caching to support offline operation and performance optimization.

---

## 🔄 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REPORT GENERATION PIPELINE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐   │
│  │  Parse   │───►│  Infer    │───►│ Normalize │───►│  Render  │   │
│  │  Graph   │    │  Flow     │    │ ViewModel │    │ Audience │   │
│  └──────────┘    └───────────┘    └───────────┘    └──────────┘   │
│       │               │                 │                │          │
│       ▼               ▼                 ▼                ▼          │
│   Blueprint       Flow Summary     View Model      Formatted       │
│   Object          Metadata         (Enriched)     Report           │
│                                                                      │
│                                    ▼                                │
│                              ┌──────────┐                           │
│                              │ Preview  │                           │
│                              └──────────┘                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

CACHING STRATEGY:
├─ Memory Cache (ReportContext State):
│  ├─ Blueprint Object (post-parse)
│  ├─ Flow Summary (post-infer)
│  ├─ View Model (post-normalize)
│  └─ Rendered Output (Markdown/HTML)
│
└─ Local Storage (Optional Persistence):
   ├─ Last successful blueprint JSON
   ├─ User preferences (audience, format, KPIs)
   └─ Template cache version
```

---

## 📋 Stage 1: Parse Graph

### Purpose
Validate and parse blueprint JSON into a strongly-typed Blueprint object with schema validation.

### Input
```typescript
interface ParseInput {
  jsonString: string;           // Raw JSON from upload/paste/URL
  source: 'upload' | 'paste' | 'url' | 'postMessage';
  validateSchema: boolean;      // Default: true
}
```

### Processing Steps
1. **JSON Syntax Validation**
   - Attempt `JSON.parse(jsonString)`
   - Catch syntax errors (missing brackets, invalid quotes, etc.)
   
2. **Schema Version Detection**
   - Extract `blueprint.template.version` or `blueprint.version`
   - Check against supported versions: `['1.0', '1.0.0']`
   - Flag incompatible versions with warning

3. **Zod Schema Validation**
   - Validate against `zProjectSpec` schema
   - Collect all validation errors with paths
   - Generate user-friendly error messages

4. **Size & Performance Analysis**
   - Count nodes: `agents.length + tools.length + gates.length`
   - Count edges: `edges.length`
   - Calculate file size in KB
   - Flag performance warnings (>50 nodes, >100 edges)

5. **Completeness Check**
   - Verify required fields: `id`, `name`, `template`
   - Check orchestration has `startNode`
   - Validate edges reference existing nodes
   - Check for circular dependencies (optional)

### Output
```typescript
interface ParseOutput {
  success: boolean;
  blueprint?: Blueprint;        // Parsed and validated blueprint
  metadata: {
    nodeCount: number;
    edgeCount: number;
    fileSizeKB: number;
    schemaVersion: string;
    hasDeprecatedFields: boolean;
  };
  errors: string[];            // Blocking errors
  warnings: string[];          // Non-blocking warnings
  parseTimeMs: number;         // Performance metric
}
```

### Primary Errors
| Error Type | Cause | Recovery Strategy |
|------------|-------|-------------------|
| **JSON_SYNTAX_ERROR** | Malformed JSON (missing comma, bracket) | Show syntax error with position, suggest JSON validator |
| **SCHEMA_VALIDATION_ERROR** | Missing required fields or invalid types | Display path-based errors, show which fields are missing |
| **INVALID_REFERENCE_ERROR** | Edge references non-existent node | List invalid references, suggest fixing in canvas |
| **SIZE_LIMIT_EXCEEDED** | Blueprint > 10MB | Reject load, suggest splitting blueprint |
| **CIRCULAR_DEPENDENCY** | Workflow has infinite loops | Show cycle path, suggest breaking loop |

### Caching Strategy
- **Memory**: Store parsed `Blueprint` object in `ReportContext.graphJson`
- **Local Storage**: Store raw JSON string for recovery (optional)
- **TTL**: Until user clears or loads new blueprint
- **Cache Key**: `reportGenerator_lastBlueprint`

### Performance Optimization
- Parse JSON only once per load
- Cache parsed object for re-rendering
- Skip re-validation on option changes
- Debounce re-parse on paste (500ms)

---

## 📊 Stage 2: Infer Flow Summary

### Purpose
Analyze the workflow graph to extract high-level flow characteristics, relationships, and metadata for report generation.

### Input
```typescript
interface InferInput {
  blueprint: Blueprint;         // From parse stage
  includeMetrics: boolean;      // Calculate complexity metrics
  inferNodeNames: boolean;      // Resolve IDs to names
}
```

### Processing Steps

#### 1. **Node Mapping**
Build lookup maps for fast access:
```typescript
const nodeMap = {
  agents: Map<id, AgentDef>,
  tools: Map<id, ToolBinding>,
  gates: Map<id, Gate>
};
```

#### 2. **Edge Analysis**
Analyze connections to determine:
- Entry points (nodes with no incoming edges)
- Exit points (nodes with no outgoing edges)
- Critical paths (longest path from start to output)
- Branch points (nodes with multiple outgoing edges)
- Merge points (nodes with multiple incoming edges)

#### 3. **Node Role Classification**
Classify each node by role:
- **Entry Node**: `startNode` specified in orchestration
- **Output Node**: Listed in `orchestration.outputs`
- **Processing Node**: Has both incoming and outgoing edges
- **Terminal Node**: Output node with no outgoing edges
- **Gate Node**: Control/approval gates

#### 4. **Relationship Inference**
Determine relationships:
- Agent → Tool bindings (from `agent.tools[]`)
- Node → Node flow (from edges)
- Conditional branches (edges with conditions)
- Parallel execution paths (same source, multiple targets)

#### 5. **Complexity Metrics**
Calculate workflow metrics:
- **Total Nodes**: Count of all nodes
- **Total Edges**: Count of all connections
- **Max Depth**: Longest path from start to end
- **Cyclomatic Complexity**: `E - N + 2P` (edges - nodes + 2*connected components)
- **Branch Factor**: Average outgoing edges per node
- **Convergence Factor**: Average incoming edges per node

#### 6. **Name Resolution**
Resolve all IDs to human-readable names:
```typescript
{
  edgeSourceName: nodeMap[edge.source].name,
  edgeTargetName: nodeMap[edge.target].name,
  agentToolNames: agent.tools.map(id => nodeMap[id]?.name)
}
```

### Deterministic Inference Rules

#### Rule 1: Entry Point Detection
```
IF orchestration.startNode is defined:
  entryNode = orchestration.startNode
ELSE IF only one node has no incoming edges:
  entryNode = that node
ELSE:
  entryNode = first agent in agents array
  WARNING: "Multiple potential entry points, using first agent"
```

#### Rule 2: Critical Path Detection
```
FOR each output node:
  Calculate all paths from entryNode to outputNode
  Select longest path (by edge count)
  Mark as critical path
```

#### Rule 3: Complexity Classification
```
IF nodeCount > 50 OR edgeCount > 100:
  complexity = "High"
ELSE IF nodeCount > 20 OR edgeCount > 50:
  complexity = "Medium"
ELSE:
  complexity = "Low"
```

#### Rule 4: Flow Type Detection
```
IF all edges form single linear chain:
  flowType = "Sequential"
ELSE IF multiple parallel paths exist:
  flowType = "Parallel"
ELSE IF conditional branches exist:
  flowType = "Conditional"
ELSE:
  flowType = "Complex"
```

#### Rule 5: Gate Coverage Analysis
```
gateRatio = (totalGates / totalNodes) * 100

IF gateRatio > 20%:
  governance = "Strong"
ELSE IF gateRatio > 10%:
  governance = "Moderate"
ELSE IF gateRatio > 0%:
  governance = "Weak"
ELSE:
  governance = "None"
  WARNING: "No control gates configured"
```

### Output
```typescript
interface FlowSummary {
  // Node classifications
  entryNode: { id: string; name: string; type: string };
  outputNodes: Array<{ id: string; name: string; type: string }>;
  processingNodes: Array<{ id: string; name: string; type: string }>;
  
  // Relationships
  nodeMap: {
    agents: Map<string, AgentDef & { resolvedTools: string[] }>;
    tools: Map<string, ToolBinding>;
    gates: Map<string, Gate>;
  };
  
  // Edge enrichment
  enrichedEdges: Array<{
    id: string;
    source: string;
    sourceName: string;
    target: string;
    targetName: string;
    label?: string;
    condition?: string;
    isCriticalPath: boolean;
  }>;
  
  // Flow characteristics
  flowType: 'Sequential' | 'Parallel' | 'Conditional' | 'Complex';
  criticalPath: string[];        // Array of node IDs
  maxDepth: number;
  
  // Metrics
  metrics: {
    totalNodes: number;
    totalEdges: number;
    totalAgents: number;
    totalTools: number;
    totalGates: number;
    complexity: 'Low' | 'Medium' | 'High';
    cyclomaticComplexity: number;
    branchFactor: number;
    convergenceFactor: number;
    governanceCoverage: 'None' | 'Weak' | 'Moderate' | 'Strong';
  };
  
  // Warnings
  warnings: string[];
  inferenceTimeMs: number;
}
```

### Primary Errors
| Error Type | Cause | Recovery Strategy |
|------------|-------|-------------------|
| **MISSING_START_NODE** | No entry point detected | Use first agent, show warning |
| **ORPHANED_NODES** | Nodes not connected to flow | List orphaned nodes, continue |
| **INVALID_EDGE_REFERENCE** | Edge points to non-existent node | Skip edge, show warning |
| **CIRCULAR_REFERENCE** | Infinite loop detected | Mark cycle, show warning |
| **EMPTY_ORCHESTRATION** | No agents or nodes | Return empty summary, show error |

### Caching Strategy
- **Memory**: Store `FlowSummary` in `ReportContext` state
- **Invalidation**: On blueprint change only
- **Recompute**: Never (deterministic from blueprint)
- **Size**: ~10-50 KB depending on blueprint size

### Performance Optimization
- Build maps once, reuse for lookups (O(1) access)
- Use memoization for repeated calculations
- Lazy compute metrics (only when KPIs enabled)
- Cache name resolutions

---

## 🎨 Stage 3: Normalize View Model

### Purpose
Transform Blueprint and FlowSummary into a token-ready view model optimized for template rendering across all audiences.

### Input
```typescript
interface NormalizeInput {
  blueprint: Blueprint;
  flowSummary: FlowSummary;
  audience: 'leadership' | 'developer' | 'audit' | 'comprehensive';
  includeKpis: boolean;
  telemetry?: Record<string, any>;  // Optional runtime telemetry
}
```

### Processing Steps

#### 1. **Token Value Extraction**
Extract all token values from blueprint and flow summary:

**Metadata Tokens:**
```typescript
{
  BLUEPRINT_ID: blueprint.id,
  BLUEPRINT_NAME: blueprint.name,
  BLUEPRINT_DESCRIPTION: blueprint.description,
  BLUEPRINT_CATEGORY: blueprint.category,
  BLUEPRINT_TAGS: blueprint.tags?.join(', ') ?? '',
  BLUEPRINT_VERSION: blueprint.template.version,
  BLUEPRINT_AUTHOR: blueprint.template.metadata?.author ?? 'System',
  CREATED_AT: blueprint.template.metadata?.createdAt,
  UPDATED_AT: blueprint.template.metadata?.updatedAt,
  GENERATED_AT: new Date().toISOString()
}
```

**Summary Tokens:**
```typescript
{
  TOTAL_AGENTS: flowSummary.metrics.totalAgents,
  TOTAL_TOOLS: flowSummary.metrics.totalTools,
  TOTAL_GATES: flowSummary.metrics.totalGates,
  TOTAL_EDGES: flowSummary.metrics.totalEdges,
  START_NODE: flowSummary.entryNode.id,
  START_NODE_NAME: flowSummary.entryNode.name,
  OUTPUT_NODES: flowSummary.outputNodes.map(n => n.id).join(', '),
  OUTPUT_NODE_NAMES: flowSummary.outputNodes.map(n => n.name).join(', ')
}
```

#### 2. **Conditional Boolean Flags**
Compute all `HAS_*` flags:
```typescript
{
  HAS_AGENTS: flowSummary.metrics.totalAgents > 0,
  HAS_TOOLS: flowSummary.metrics.totalTools > 0,
  HAS_GATES: flowSummary.metrics.totalGates > 0,
  HAS_EDGES: flowSummary.metrics.totalEdges > 0,
  HAS_TAGS: blueprint.tags && blueprint.tags.length > 0,
  HAS_METADATA: !!blueprint.template.metadata,
  HAS_TELEMETRY: !!telemetry,
  HAS_KPI_DATA: includeKpis && !!telemetry
}
```

#### 3. **Array Normalization**
Prepare collections for loops:

**Agents Array:**
```typescript
agents: flowSummary.nodeMap.agents.map((agent, index) => ({
  index: index + 1,
  AGENT_ID: agent.id,
  AGENT_NAME: agent.name,
  AGENT_PROMPT: agent.prompt,
  AGENT_PROMPT_TRUNCATED: truncate(agent.prompt, 150),
  AGENT_TOOLS: agent.tools.join(', '),
  AGENT_TOOL_NAMES: agent.resolvedTools.join(', ') || 'None',
  AGENT_MEMORY_TYPE: agent.memory?.type ?? 'ephemeral',
  AGENT_MEMORY_MAX_TOKENS: agent.memory?.maxTokens?.toString() ?? 'unlimited',
  AGENT_MAX_ITERATIONS: agent.policies?.maxIterations,
  AGENT_TIMEOUT: agent.policies?.timeout,
  AGENT_RETRY_POLICY: agent.policies?.retryPolicy,
  IS_START_NODE: agent.id === flowSummary.entryNode.id,
  IS_OUTPUT_NODE: flowSummary.outputNodes.some(n => n.id === agent.id)
}))
```

**Edges Array:**
```typescript
edges: flowSummary.enrichedEdges.map((edge, index) => ({
  index: index + 1,
  EDGE_ID: edge.id,
  EDGE_SOURCE: edge.source,
  EDGE_TARGET: edge.target,
  EDGE_SOURCE_NAME: edge.sourceName,
  EDGE_TARGET_NAME: edge.targetName,
  EDGE_LABEL: edge.label ?? '',
  EDGE_CONDITION: edge.condition ?? '',
  EDGE_INDEX: index + 1,
  IS_CRITICAL_PATH: edge.isCriticalPath
}))
```

#### 4. **Audience-Specific Filtering**
Apply audience-specific transformations:

**Leadership:**
- Truncate all prompts to 150 chars
- Hide technical configuration details
- Simplify terminology (use business terms)

**Developer:**
- Include full prompts and configurations
- Add technical details (memory, policies)
- Use precise terminology

**Audit:**
- Emphasize security and compliance data
- Include full audit trail
- Highlight missing controls

**Comprehensive:**
- No filtering, include everything

#### 5. **KPI Data Integration**
If `includeKpis` is true:
```typescript
kpi: {
  KPI_AVG_RESPONSE_TIME: telemetry?.avgResponseTime ?? 'N/A',
  KPI_SUCCESS_RATE: telemetry?.successRate ?? 'N/A',
  KPI_TOTAL_EXECUTIONS: telemetry?.totalExecutions ?? 0,
  KPI_ERROR_RATE: telemetry?.errorRate ?? 'N/A',
  TELEMETRY_JSON: JSON.stringify(telemetry, null, 2),
  
  // Computed metrics
  WORKFLOW_COMPLEXITY: flowSummary.metrics.complexity,
  AGENT_DENSITY: (flowSummary.metrics.totalAgents / flowSummary.metrics.totalEdges).toFixed(2),
  GOVERNANCE_COVERAGE: flowSummary.metrics.governanceCoverage
}
```

#### 6. **Computed/Derived Values**
Calculate dynamic values:
```typescript
computed: {
  COMPLEXITY_LABEL: flowSummary.metrics.complexity,
  FLOW_TYPE: flowSummary.flowType,
  CRITICAL_PATH_LENGTH: flowSummary.criticalPath.length,
  BRANCH_POINTS: countBranchPoints(flowSummary.enrichedEdges),
  MERGE_POINTS: countMergePoints(flowSummary.enrichedEdges)
}
```

### Output
```typescript
interface ViewModel {
  // All token values (90+ tokens)
  tokens: {
    // Metadata
    BLUEPRINT_ID: string;
    BLUEPRINT_NAME: string;
    // ... all 90+ tokens
  };
  
  // Boolean flags for conditionals
  flags: {
    HAS_AGENTS: boolean;
    HAS_TOOLS: boolean;
    // ... all conditional flags
  };
  
  // Arrays for loops
  collections: {
    agents: NormalizedAgent[];
    tools: NormalizedTool[];
    gates: NormalizedGate[];
    edges: NormalizedEdge[];
  };
  
  // Computed values
  computed: {
    COMPLEXITY_LABEL: string;
    FLOW_TYPE: string;
    CRITICAL_PATH_LENGTH: number;
  };
  
  // KPI data (if enabled)
  kpi?: KPIData;
  
  // Audience context
  audience: AudienceType;
  
  // Metadata
  normalizeTimeMs: number;
  viewModelSizeKB: number;
}
```

### Primary Errors
| Error Type | Cause | Recovery Strategy |
|------------|-------|-------------------|
| **MISSING_REQUIRED_TOKEN** | Required field is null/undefined | Use fallback value, show warning |
| **INVALID_ARRAY_INDEX** | Collection is empty or invalid | Return empty array, hide section |
| **TYPE_COERCION_ERROR** | Cannot convert value to expected type | Use string representation |
| **MEMORY_OVERFLOW** | View model exceeds size limit | Truncate large fields, show warning |

### Caching Strategy
- **Memory**: Store `ViewModel` in context state
- **Invalidation**: On blueprint, audience, or KPI toggle change
- **Recompute**: Only when inputs change (deterministic)
- **Size**: ~50-200 KB depending on blueprint

### Performance Optimization
- Compute view model once per render
- Memoize computed values
- Lazy-load KPI data (only if enabled)
- Use shallow equality checks for re-normalization

---

## 🖼️ Stage 4: Render Audience Report

### Purpose
Apply tokenized templates to the view model and generate formatted output (Markdown or HTML) for the selected audience.

### Input
```typescript
interface RenderInput {
  viewModel: ViewModel;
  audience: 'leadership' | 'developer' | 'audit' | 'comprehensive';
  format: 'markdown' | 'html' | 'pdf';
  includeKpis: boolean;
  printLayout: boolean;
}
```

### Processing Steps

#### 1. **Template Selection**
Load appropriate template from registry:
```typescript
const template = TemplateRegistry.audiences[audience][format];
// Returns pre-composed template string with tokens
```

#### 2. **Token Replacement**

**Simple Token Replacement:**
```typescript
// Replace {{TOKEN_NAME}} with value
template = template.replace(/\{\{(\w+)\}\}/g, (match, token) => {
  return viewModel.tokens[token] ?? '';
});
```

**Fallback Chain Replacement:**
```typescript
// Replace {{TOKEN ?? FALLBACK ?? "default"}}
const fallbackRegex = /\{\{(\w+)\s*\?\?\s*(\w+|\".+?\")\}\}/g;
template = template.replace(fallbackRegex, (match, token, fallback) => {
  const value = viewModel.tokens[token];
  if (value !== undefined && value !== null && value !== '') {
    return value;
  }
  // Try fallback token or use literal
  if (fallback.startsWith('"')) {
    return fallback.slice(1, -1); // Remove quotes
  }
  return viewModel.tokens[fallback] ?? '';
});
```

**Filtered Token Replacement:**
```typescript
// Replace {{TOKEN|filter:arg}}
const filterRegex = /\{\{(\w+)\|(\w+)(?::(.+?))?\}\}/g;
template = template.replace(filterRegex, (match, token, filter, args) => {
  const value = viewModel.tokens[token];
  return applyFilter(value, filter, args);
});
```

#### 3. **Conditional Block Processing**

**IF/ELSE Blocks:**
```typescript
// Process {{#IF FLAG}}...{{ELSE}}...{{/IF}}
const ifRegex = /\{\{#IF\s+(\w+)\}\}([\s\S]*?)(?:\{\{ELSE\}\}([\s\S]*?))?\{\{\/IF\}\}/g;

template = template.replace(ifRegex, (match, flag, ifContent, elseContent) => {
  const condition = viewModel.flags[flag];
  
  if (condition) {
    return ifContent;
  } else if (elseContent) {
    return elseContent;
  } else {
    return '';
  }
});
```

**Nested IF Handling:**
```typescript
// Recursively process nested conditionals
function processConditionals(template: string, depth = 0): string {
  if (depth > 10) return template; // Prevent infinite recursion
  
  const processed = template.replace(ifRegex, ...);
  
  // Check if more conditionals exist
  if (/\{\{#IF/.test(processed)) {
    return processConditionals(processed, depth + 1);
  }
  
  return processed;
}
```

#### 4. **Loop/Iteration Processing**

**EACH Block Processing:**
```typescript
// Process {{#EACH COLLECTION}}...{{/EACH}}
const eachRegex = /\{\{#EACH\s+(\w+)\}\}([\s\S]*?)\{\{\/EACH\}\}/g;

template = template.replace(eachRegex, (match, collectionName, itemTemplate) => {
  const collection = viewModel.collections[collectionName];
  
  if (!collection || collection.length === 0) {
    return ''; // Hide empty collections
  }
  
  return collection.map((item, index) => {
    // Replace item tokens within loop
    let itemContent = itemTemplate;
    
    // Replace {{ITEM_PROPERTY}} with item.ITEM_PROPERTY
    itemContent = itemContent.replace(/\{\{(\w+)\}\}/g, (m, prop) => {
      return item[prop] ?? '';
    });
    
    // Special loop variables
    itemContent = itemContent.replace(/\{\{INDEX\}\}/g, String(index + 1));
    itemContent = itemContent.replace(/\{\{IS_FIRST\}\}/g, String(index === 0));
    itemContent = itemContent.replace(/\{\{IS_LAST\}\}/g, String(index === collection.length - 1));
    
    return itemContent;
  }).join('\n\n');
});
```

#### 5. **Filter Application**

**Filter Pipeline:**
```typescript
function applyFilter(value: any, filterName: string, args?: string): string {
  const filters = {
    // Date/Time filters
    date: (val) => new Date(val).toLocaleDateString(),
    datetime: (val) => new Date(val).toLocaleString(),
    
    // String filters
    uppercase: (val) => String(val).toUpperCase(),
    lowercase: (val) => String(val).toLowerCase(),
    title: (val) => toTitleCase(String(val)),
    truncate: (val, n) => truncate(String(val), parseInt(n)),
    
    // Number filters
    comma: (val) => Number(val).toLocaleString(),
    fixed: (val, n) => Number(val).toFixed(parseInt(n)),
    
    // Array filters
    join: (val, sep) => Array.isArray(val) ? val.join(sep) : val,
    
    // Object filters
    pretty: (val) => JSON.stringify(val, null, 2),
    
    // Fallback
    default: (val) => String(val)
  };
  
  const filter = filters[filterName] || filters.default;
  return filter(value, args);
}
```

#### 6. **Empty Section Removal**

**Auto-hide Empty Sections:**
```typescript
function removeEmptySections(rendered: string): string {
  // Remove sections with only headers and whitespace
  const sectionRegex = /^#{1,6}\s+.+$\n+(?:[\s\n]*$)?/gm;
  
  return rendered.replace(sectionRegex, (match) => {
    // Check if section has content beyond header
    const lines = match.split('\n').filter(line => {
      return line.trim() && !line.match(/^#{1,6}\s/);
    });
    
    return lines.length > 0 ? match : '';
  });
}
```

**Collapse Excessive Whitespace:**
```typescript
function collapseWhitespace(rendered: string): string {
  // Replace 3+ consecutive newlines with 2
  return rendered.replace(/\n{3,}/g, '\n\n');
}
```

#### 7. **Format-Specific Post-Processing**

**Markdown Post-Processing:**
```typescript
function postProcessMarkdown(markdown: string): string {
  // Ensure proper list formatting
  markdown = markdown.replace(/^- /gm, '- ');
  
  // Ensure code block formatting
  markdown = markdown.replace(/```\n\n/g, '```\n');
  
  // Trim leading/trailing whitespace
  return markdown.trim();
}
```

**HTML Post-Processing:**
```typescript
function postProcessHtml(html: string): string {
  // Wrap in container
  html = `<div class="report-container">${html}</div>`;
  
  // Add inline styles for offline viewing
  html = wrapWithStyles(html);
  
  // Add print styles if print layout enabled
  if (printLayout) {
    html = addPrintStyles(html);
  }
  
  return html;
}
```

#### 8. **Print Layout Enhancement**
If `printLayout` is true:
```typescript
function enhanceForPrint(html: string): string {
  // Add page break hints
  html = html.replace(/<h1/g, '<h1 class="page-break-before"');
  html = html.replace(/<h2/g, '<h2 class="page-break-avoid-after"');
  
  // Add print-specific styles
  const printStyles = `
    @media print {
      .no-print { display: none; }
      h1, h2, h3 { page-break-after: avoid; }
      .agent-card, .tool-card { page-break-inside: avoid; }
      @page { margin: 2cm; }
    }
  `;
  
  return html + `<style>${printStyles}</style>`;
}
```

### Token Replacement Strategy

#### Priority Order
1. **Conditional blocks** (IF/ELSE) - Process first to remove/include sections
2. **Loop blocks** (EACH) - Expand collections second
3. **Filtered tokens** - Apply transformations third
4. **Fallback chains** - Handle missing data fourth
5. **Simple tokens** - Replace remaining tokens last

#### Execution Flow
```
Template String
    ↓
1. Process nested conditionals (recursive, depth-first)
    ↓
2. Expand loops (outer to inner)
    ↓
3. Apply filters (left to right in pipeline)
    ↓
4. Resolve fallback chains (left to right)
    ↓
5. Replace simple tokens (single pass)
    ↓
6. Remove empty sections
    ↓
7. Collapse whitespace
    ↓
8. Post-process by format
    ↓
Rendered Output
```

#### Deterministic Rules
- **Token Not Found**: Use empty string `''`
- **Null/Undefined Value**: Use fallback or empty string
- **Filter Not Found**: Use value as-is without filter
- **Invalid Filter Args**: Ignore args, apply filter with defaults
- **Empty Collection**: Hide entire EACH block
- **False Conditional**: Remove IF block content
- **Nested Depth Limit**: 10 levels maximum

### Output
```typescript
interface RenderOutput {
  success: boolean;
  content: string;              // Rendered Markdown or HTML
  format: 'markdown' | 'html';
  metadata: {
    templateVersion: string;
    tokensReplaced: number;
    conditionalsProcessed: number;
    loopsExpanded: number;
    filtersApplied: number;
    emptySectionsRemoved: number;
    outputSizeKB: number;
  };
  warnings: string[];          // Non-critical issues
  renderTimeMs: number;
}
```

### Primary Errors
| Error Type | Cause | Recovery Strategy |
|------------|-------|-------------------|
| **TEMPLATE_NOT_FOUND** | Invalid audience/format combo | Use comprehensive template |
| **INFINITE_LOOP** | Nested conditionals too deep | Limit depth to 10, show error |
| **TOKEN_REPLACEMENT_ERROR** | Malformed token syntax | Skip token, show warning |
| **FILTER_ERROR** | Invalid filter or args | Use unfiltered value |
| **MEMORY_LIMIT_EXCEEDED** | Rendered output too large | Truncate sections, show warning |

### Caching Strategy
- **Memory**: Store rendered output in `ReportContext.renderedMarkdown/renderedHtml`
- **Invalidation**: On any input change (viewModel, audience, format, options)
- **Recompute**: Always (templates may change)
- **Size**: ~100-500 KB depending on blueprint

### Performance Optimization
- Pre-compile templates at build time
- Cache filter functions
- Use regex compilation (compile once, reuse)
- Lazy render (only on demand)
- Debounce re-render on rapid option changes

---

## 👁️ Stage 5: Preview

### Purpose
Display the rendered report in the UI with copy, print, and export capabilities.

### Input
```typescript
interface PreviewInput {
  content: string;              // From render stage
  format: 'markdown' | 'html' | 'pdf';
  printLayout: boolean;
}
```

### Processing Steps

#### 1. **Format Detection**
Determine display format:
- **Markdown**: Display in `<pre>` with syntax highlighting
- **HTML**: Render in iframe or div (sanitized)
- **PDF**: Prepare for print dialog

#### 2. **Content Sanitization**
If HTML format:
```typescript
function sanitizeHtml(html: string): string {
  // Remove potentially dangerous elements
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  html = html.replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
  
  return html;
}
```

#### 3. **Syntax Highlighting** (Markdown Preview)
Apply syntax highlighting to code blocks:
```typescript
function highlightMarkdown(markdown: string): string {
  // Highlight JSON code blocks
  markdown = markdown.replace(/```json\n([\s\S]*?)```/g, (match, code) => {
    return `<pre><code class="language-json">${highlightJson(code)}</code></pre>`;
  });
  
  // Highlight other code blocks
  markdown = markdown.replace(/```\n([\s\S]*?)```/g, (match, code) => {
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  });
  
  return markdown;
}
```

#### 4. **Action Button State**
Determine button availability:
```typescript
{
  canCopy: content.length > 0,
  canPrint: format === 'html' || format === 'pdf',
  canExport: content.length > 0,
  canDownload: content.length > 0
}
```

#### 5. **Copy to Clipboard**
```typescript
function copyToClipboard(content: string): Promise<boolean> {
  return navigator.clipboard.writeText(content)
    .then(() => true)
    .catch(() => {
      // Fallback: Create textarea and copy
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    });
}
```

#### 6. **Print Handling**
```typescript
function handlePrint(): void {
  if (format === 'pdf' || printLayout) {
    // Use browser print dialog
    window.print();
  } else {
    // Print preview in new window
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(content);
    printWindow?.document.close();
    printWindow?.print();
  }
}
```

#### 7. **Export File**
```typescript
function exportFile(content: string, filename: string, mimeType: string): void {
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
```

### Output
```typescript
interface PreviewState {
  isReady: boolean;
  content: string;
  format: string;
  actions: {
    canCopy: boolean;
    canPrint: boolean;
    canExport: boolean;
  };
  displayMode: 'raw' | 'rendered' | 'iframe';
}
```

### Primary Errors
| Error Type | Cause | Recovery Strategy |
|------------|-------|-------------------|
| **COPY_FAILED** | Clipboard API not available | Show manual copy dialog |
| **PRINT_BLOCKED** | Browser blocks print | Show instruction to allow popups |
| **EXPORT_FAILED** | Blob API not available | Show "save as" with text content |
| **RENDER_ERROR** | HTML rendering fails | Fallback to plain text |

### Caching Strategy
- **Memory**: Preview state stored in component state
- **No Persistence**: Preview is ephemeral
- **Re-render**: On content change only

---

## 💾 Caching Strategy Summary

### Memory Cache (ReportContext State)

**Cached Items:**
```typescript
interface CachedState {
  // Stage 1: Parse
  graphJson: string | null;              // Raw JSON string
  
  // Stage 2: Infer (computed on-demand)
  // Not explicitly cached, recomputed from graphJson
  
  // Stage 3: Normalize (computed on-demand)
  telemetry: Record<string, any> | null; // Extracted metadata
  blueprintMetadata: ValidationMetadata;  // Size, counts, etc.
  
  // Stage 4: Render
  renderedMarkdown: string | null;       // Rendered Markdown
  renderedHtml: string | null;           // Rendered HTML
  
  // User Options
  audience: AudienceType;
  format: FormatType;
  includeKpis: boolean;
  printLayout: boolean;
  
  // Validation State
  errors: ReportErrors;
  validationWarnings: string[];
}
```

**Cache Invalidation Rules:**
```typescript
// Invalidate all on blueprint change
if (newBlueprint !== currentBlueprint) {
  clearAllRenderedContent();
  recomputeFlowSummary();
  regenerateReport();
}

// Invalidate render only on option change
if (audience !== prevAudience || includeKpis !== prevIncludeKpis) {
  clearRenderedContent();
  regenerateReport();
}

// Invalidate HTML only on format change
if (format !== prevFormat && prevFormat === 'markdown') {
  convertMarkdownToHtml();
}
```

**Memory Footprint:**
- Raw JSON: 10-500 KB
- Rendered Markdown: 50-200 KB
- Rendered HTML: 100-500 KB
- **Total: 160 KB - 1.2 MB** (depending on blueprint size)

---

### Local Storage (Optional Persistence)

**Persisted Items:**
```typescript
// Key: reportGenerator_lastBlueprint
{
  jsonString: string;
  timestamp: string;
  source: 'upload' | 'paste' | 'url' | 'postMessage';
}

// Key: reportGenerator_options
{
  audience: AudienceType;
  format: FormatType;
  includeKpis: boolean;
  printLayout: boolean;
}

// Key: reportGenerator_templateVersion
{
  version: string;
  lastUpdated: string;
}
```

**Persistence Rules:**
- **Save**: On successful blueprint load
- **Load**: On page load if no URL param
- **Clear**: On user "Clear" action or 7 days stale
- **Max Size**: 5 MB per item (localStorage limit)

**Storage Quota Management:**
```typescript
function saveToLocalStorage(key: string, data: any): boolean {
  try {
    const jsonString = JSON.stringify(data);
    
    // Check size (5 MB limit)
    if (jsonString.length > 5 * 1024 * 1024) {
      console.warn('Data exceeds localStorage limit');
      return false;
    }
    
    localStorage.setItem(key, jsonString);
    return true;
  } catch (e) {
    // QuotaExceededError
    console.error('localStorage quota exceeded');
    return false;
  }
}
```

---

## ⚡ Performance Optimization

### Computation Complexity

| Stage | Time Complexity | Space Complexity | Typical Time |
|-------|----------------|------------------|--------------|
| Parse | O(n) | O(n) | 10-50ms |
| Infer | O(n + e) | O(n + e) | 20-100ms |
| Normalize | O(n + e) | O(n + e) | 10-50ms |
| Render | O(t + n) | O(t) | 50-200ms |
| Preview | O(1) | O(1) | <10ms |

Where:
- `n` = number of nodes
- `e` = number of edges
- `t` = template size

### Optimization Strategies

1. **Memoization**
   - Cache computed values (complexity metrics, name resolutions)
   - Use React useMemo for expensive calculations

2. **Debouncing**
   - 500ms debounce on paste input
   - 100ms debounce on option changes

3. **Lazy Evaluation**
   - Compute FlowSummary only when needed
   - Generate view model only on render
   - Skip KPI calculation if disabled

4. **Incremental Rendering**
   - Render sections independently
   - Progressive enhancement for large reports

5. **Web Workers** (Future Enhancement)
   - Offload template rendering to worker thread
   - Parse large blueprints in background

---

## 🚨 Error Handling Strategy

### Error Propagation

```typescript
interface PipelineError {
  stage: 'parse' | 'infer' | 'normalize' | 'render' | 'preview';
  type: string;
  message: string;
  userMessage: string;        // User-friendly explanation
  recoverable: boolean;
  context?: any;              // Debug context
}
```

### Recovery Strategies

**Graceful Degradation:**
```
Parse Error → Show error, allow manual input
  ↓
Infer Error → Use minimal inference, show warning
  ↓
Normalize Error → Use defaults, show warning
  ↓
Render Error → Use fallback template
  ↓
Preview Error → Show raw text
```

**User Feedback:**
- **Blocking Errors**: Red banner with clear action
- **Warnings**: Yellow banner with dismissible message
- **Info**: Blue banner with helpful tips

---

## 📊 Pipeline Metrics

### Tracking

```typescript
interface PipelineMetrics {
  parseTime: number;
  inferTime: number;
  normalizeTime: number;
  renderTime: number;
  totalTime: number;
  
  tokensReplaced: number;
  conditionalsProcessed: number;
  loopsExpanded: number;
  sectionsRemoved: number;
  
  inputSizeKB: number;
  outputSizeKB: number;
  cacheHitRate: number;
}
```

### Performance Budget

- **Parse**: <100ms for 10MB blueprint
- **Infer**: <200ms for 100 nodes
- **Normalize**: <100ms for 100 nodes
- **Render**: <500ms for comprehensive report
- **Total**: <1s end-to-end

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Stage 1: Parse
test('parses valid blueprint JSON');
test('rejects malformed JSON');
test('validates schema version');
test('detects performance issues');

// Stage 2: Infer
test('identifies entry/exit nodes');
test('computes complexity metrics');
test('detects circular dependencies');
test('resolves node names');

// Stage 3: Normalize
test('extracts all token values');
test('computes boolean flags');
test('normalizes collections');
test('applies audience filters');

// Stage 4: Render
test('replaces simple tokens');
test('processes conditionals');
test('expands loops');
test('applies filters');
test('removes empty sections');

// Stage 5: Preview
test('displays rendered content');
test('handles copy action');
test('handles print action');
test('handles export action');
```

### Integration Tests

```typescript
test('full pipeline: JSON → rendered report');
test('caching: re-render with different audience');
test('error recovery: invalid JSON → error display');
test('performance: large blueprint < 1s');
```

---

**Document Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** 📋 Design Complete - Ready for Implementation
