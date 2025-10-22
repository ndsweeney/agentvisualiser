# Template Registry Design

## Overview

The Template Registry provides a tokenized template system for generating customizable reports from blueprint data. All templates are statically bundled and work completely offline, with sophisticated token replacement and conditional rendering.

---

## 🎯 Design Principles

1. **Offline-First**: All templates bundled at build time
2. **Token-Based**: Placeholder syntax for dynamic content
3. **Composable**: Mix and match sections per audience
4. **Graceful Degradation**: Hide empty sections automatically
5. **Audience-Aware**: Pre-configured templates per audience type
6. **Format-Agnostic**: Support Markdown and HTML output

---

## 📋 Token Catalog

### Standard Token Syntax

```
{{TOKEN_NAME}}                    # Simple replacement
{{#IF TOKEN}}...{{/IF}}          # Conditional block
{{#EACH ITEMS}}...{{/EACH}}      # Loop/iteration
{{TOKEN|filter}}                 # Filtered output
{{TOKEN ?? "fallback"}}          # Default value
```

### Token Categories

#### **1. Blueprint Metadata Tokens**
```
{{BLUEPRINT_ID}}                 # Unique identifier
{{BLUEPRINT_NAME}}               # Display name
{{BLUEPRINT_DESCRIPTION}}        # Description text
{{BLUEPRINT_CATEGORY}}           # Category classification
{{BLUEPRINT_TAGS}}               # Comma-separated tags
{{BLUEPRINT_VERSION}}            # Schema version
{{BLUEPRINT_AUTHOR}}             # Author name
{{CREATED_AT}}                   # Creation timestamp
{{UPDATED_AT}}                   # Last modified timestamp
{{GENERATED_AT}}                 # Report generation timestamp
```

#### **2. Orchestration Summary Tokens**
```
{{TOTAL_AGENTS}}                 # Count of agents
{{TOTAL_TOOLS}}                  # Count of tools
{{TOTAL_GATES}}                  # Count of gates
{{TOTAL_EDGES}}                  # Count of connections
{{START_NODE}}                   # Entry point ID
{{START_NODE_NAME}}              # Entry point name
{{OUTPUT_NODES}}                 # Comma-separated output IDs
{{OUTPUT_NODE_NAMES}}            # Comma-separated output names
{{ORCHESTRATION_ID}}             # Orchestration identifier
{{ORCHESTRATION_NAME}}           # Orchestration name
```

#### **3. Agent-Specific Tokens** (within loops)
```
{{AGENT_ID}}                     # Agent identifier
{{AGENT_NAME}}                   # Agent display name
{{AGENT_PROMPT}}                 # Agent instructions
{{AGENT_PROMPT_TRUNCATED}}       # First 150 chars + "..."
{{AGENT_TOOLS}}                  # Comma-separated tool IDs
{{AGENT_TOOL_NAMES}}             # Comma-separated tool names
{{AGENT_MEMORY_TYPE}}            # ephemeral/persistent
{{AGENT_MEMORY_MAX_TOKENS}}      # Max tokens or "unlimited"
{{AGENT_MAX_ITERATIONS}}         # Policy: max iterations
{{AGENT_TIMEOUT}}                # Policy: timeout in ms
{{AGENT_RETRY_POLICY}}           # Policy: retry strategy
{{IS_START_NODE}}                # Boolean: true if start node
{{IS_OUTPUT_NODE}}               # Boolean: true if output
```

#### **4. Tool-Specific Tokens** (within loops)
```
{{TOOL_ID}}                      # Tool identifier
{{TOOL_NAME}}                    # Tool display name
{{TOOL_KIND}}                    # rest/graph/sharepoint/etc
{{TOOL_ENDPOINT}}                # API endpoint URL
{{TOOL_AUTH_TYPE}}               # none/bearer/oauth2/apikey
{{TOOL_CONFIG_JSON}}             # JSON-formatted config
```

#### **5. Gate-Specific Tokens** (within loops)
```
{{GATE_ID}}                      # Gate identifier
{{GATE_TYPE}}                    # approval/condition/merge/split
{{GATE_CONDITION}}               # Condition expression
{{GATE_APPROVERS}}               # Comma-separated approvers
{{GATE_MERGE_STRATEGY}}          # all/any/majority
```

#### **6. Edge/Flow Tokens** (within loops)
```
{{EDGE_ID}}                      # Edge identifier
{{EDGE_SOURCE}}                  # Source node ID
{{EDGE_TARGET}}                  # Target node ID
{{EDGE_SOURCE_NAME}}             # Source node name
{{EDGE_TARGET_NAME}}             # Target node name
{{EDGE_LABEL}}                   # Edge label/description
{{EDGE_CONDITION}}               # Conditional expression
{{EDGE_INDEX}}                   # 1-based index in list
```

#### **7. KPI/Telemetry Tokens**
```
{{KPI_AVG_RESPONSE_TIME}}        # Average response time
{{KPI_SUCCESS_RATE}}             # Success percentage
{{KPI_TOTAL_EXECUTIONS}}         # Total runs
{{KPI_ERROR_RATE}}               # Error percentage
{{TELEMETRY_JSON}}               # Full telemetry as JSON
{{HAS_TELEMETRY}}                # Boolean: telemetry exists
```

#### **8. Conditional Tokens**
```
{{HAS_AGENTS}}                   # Boolean: agents exist
{{HAS_TOOLS}}                    # Boolean: tools exist
{{HAS_GATES}}                    # Boolean: gates exist
{{HAS_EDGES}}                    # Boolean: edges exist
{{HAS_TAGS}}                     # Boolean: tags exist
{{HAS_METADATA}}                 # Boolean: metadata exists
{{HAS_KPI_DATA}}                 # Boolean: KPI data exists
```

#### **9. Formatting Helper Tokens**
```
{{TIMESTAMP|date}}               # Format as date
{{TIMESTAMP|datetime}}           # Format as date+time
{{NUMBER|comma}}                 # Add thousands separator
{{TEXT|truncate:150}}            # Truncate to N chars
{{LIST|join:", "}}               # Join array with separator
{{JSON|pretty}}                  # Pretty-print JSON
{{TEXT|uppercase}}               # Convert to uppercase
{{TEXT|lowercase}}               # Convert to lowercase
{{TEXT|title}}                   # Title Case
```

---

## 📚 Template Keys

### Base Section Templates

Individual sections that can be composed:

```typescript
type TemplateSectionKey = 
  | 'executive'          // Executive summary
  | 'process'            // Process/workflow overview
  | 'technical'          // Technical architecture
  | 'governance'         // Compliance & controls
  | 'kpi'                // Key performance indicators
  | 'recommendations'    // Actionable recommendations
  | 'agents'             // Agent details
  | 'tools'              // Tool bindings
  | 'gates'              // Gates & controls
  | 'flow'               // Workflow connections
  | 'metadata';          // Blueprint metadata
```

### Audience Composite Templates

Pre-configured combinations for each audience:

```typescript
type AudienceTemplateKey =
  | 'leadership'         // executive + kpi + recommendations
  | 'developer'          // technical + process + agents + tools + flow
  | 'audit'              // governance + gates + metadata + recommendations
  | 'comprehensive';     // ALL sections
```

### Template Registry Structure

```typescript
interface TemplateRegistry {
  // Base sections (composable)
  sections: {
    [key in TemplateSectionKey]: {
      markdown: string;
      html: string;
    };
  };
  
  // Audience composites (pre-configured)
  audiences: {
    [key in AudienceTemplateKey]: {
      sections: TemplateSectionKey[];
      order: number[];
      markdown: string;  // Pre-composed template
      html: string;      // Pre-composed template
    };
  };
  
  // Metadata
  version: string;
  lastUpdated: string;
}
```

---

## 🎨 Template Definitions

### 1. **Executive Template**

**Purpose**: High-level summary for leadership  
**Tokens Used**: Metadata, summary counts, KPIs  
**Conditional**: Hide if no description

**Markdown Structure**:
```markdown
## Executive Summary

{{BLUEPRINT_DESCRIPTION}}

**Category:** {{BLUEPRINT_CATEGORY}}
{{#IF HAS_TAGS}}**Tags:** {{BLUEPRINT_TAGS}}{{/IF}}

### At a Glance
- **Total Agents:** {{TOTAL_AGENTS}}
- **Tool Integrations:** {{TOTAL_TOOLS}}
- **Control Points:** {{TOTAL_GATES}}
- **Workflow Connections:** {{TOTAL_EDGES}}

{{#IF HAS_TELEMETRY}}
### Performance Snapshot
- **Average Response Time:** {{KPI_AVG_RESPONSE_TIME ?? "N/A"}}
- **Success Rate:** {{KPI_SUCCESS_RATE ?? "N/A"}}
{{/IF}}
```

**Fallback Rules**:
- Hide entire section if `BLUEPRINT_DESCRIPTION` is empty
- Hide "Tags" line if `HAS_TAGS` is false
- Hide "Performance Snapshot" if `HAS_TELEMETRY` is false

---

### 2. **Process Template**

**Purpose**: Workflow and process flow overview  
**Tokens Used**: Orchestration, flow data  
**Conditional**: Hide if no edges

**Markdown Structure**:
```markdown
## Process Overview

**Orchestration:** {{ORCHESTRATION_NAME}} (ID: {{ORCHESTRATION_ID}})  
**Entry Point:** {{START_NODE_NAME}} ({{START_NODE}})  
**Output Nodes:** {{OUTPUT_NODE_NAMES}}

### Workflow Flow
{{#IF HAS_EDGES}}
{{#EACH EDGES}}
{{EDGE_INDEX}}. **{{EDGE_SOURCE_NAME}}** → **{{EDGE_TARGET_NAME}}**
   {{#IF EDGE_LABEL}}_Label:_ {{EDGE_LABEL}}{{/IF}}
   {{#IF EDGE_CONDITION}}_Condition:_ `{{EDGE_CONDITION}}`{{/IF}}
{{/EACH}}
{{ELSE}}
_No workflow connections defined._
{{/IF}}
```

**Fallback Rules**:
- Hide entire section if `TOTAL_EDGES` is 0
- Hide individual edge labels/conditions if empty
- Show fallback message if no edges exist

---

### 3. **Technical Template**

**Purpose**: Architecture and implementation details  
**Tokens Used**: Agents, memory, policies  
**Conditional**: Hide if no agents

**Markdown Structure**:
```markdown
## Technical Architecture

### System Configuration
- **Schema Version:** {{BLUEPRINT_VERSION}}
- **Agent Count:** {{TOTAL_AGENTS}}
- **Tool Bindings:** {{TOTAL_TOOLS}}

### Agent Specifications

{{#EACH AGENTS}}
#### {{AGENT_NAME}} {{#IF IS_START_NODE}}⭐ (Entry Point){{/IF}}

**ID:** `{{AGENT_ID}}`  
**Instructions:** {{AGENT_PROMPT}}

**Configuration:**
- **Tools:** {{AGENT_TOOL_NAMES ?? "None"}}
- **Memory:** {{AGENT_MEMORY_TYPE ?? "ephemeral"}} ({{AGENT_MEMORY_MAX_TOKENS ?? "unlimited"}} tokens)

{{#IF AGENT_MAX_ITERATIONS}}
**Policies:**
- Max Iterations: {{AGENT_MAX_ITERATIONS}}
- Timeout: {{AGENT_TIMEOUT}}ms
- Retry Strategy: {{AGENT_RETRY_POLICY}}
{{/IF}}

---
{{/EACH}}
```

**Fallback Rules**:
- Hide entire section if `HAS_AGENTS` is false
- Show "None" for empty tool lists
- Hide policies section if no policies defined
- Use defaults for missing memory/policy values

---

### 4. **Governance Template**

**Purpose**: Compliance, controls, and audit trail  
**Tokens Used**: Gates, metadata, approvers  
**Conditional**: Always show (with N/A messages)

**Markdown Structure**:
```markdown
## Governance & Compliance

### Audit Information
- **Blueprint ID:** `{{BLUEPRINT_ID}}`
- **Author:** {{BLUEPRINT_AUTHOR ?? "System"}}
- **Created:** {{CREATED_AT|datetime}}
- **Last Modified:** {{UPDATED_AT|datetime}}
- **Schema Version:** {{BLUEPRINT_VERSION}}

### Control Gates

{{#IF HAS_GATES}}
{{#EACH GATES}}
#### {{GATE_TYPE|title}} Gate ({{GATE_ID}})

{{#IF GATE_CONDITION}}**Condition:** `{{GATE_CONDITION}}`{{/IF}}
{{#IF GATE_APPROVERS}}**Approvers:** {{GATE_APPROVERS}}{{/IF}}
{{#IF GATE_MERGE_STRATEGY}}**Merge Strategy:** {{GATE_MERGE_STRATEGY}}{{/IF}}

---
{{/EACH}}
{{ELSE}}
_No control gates configured. Consider adding approval gates for sensitive operations._
{{/IF}}

### Compliance Checklist
- [ ] All agent prompts reviewed for security guidelines
- [ ] Tool authentication credentials verified
- [ ] Approval gates configured for critical paths
- [ ] Workflow tested in non-production environment
```

**Fallback Rules**:
- Always show section (governance critical)
- Show recommendation if no gates exist
- Use "System" as default author

---

### 5. **KPI Template**

**Purpose**: Metrics and performance indicators  
**Tokens Used**: KPI data, telemetry  
**Conditional**: Hide if no KPI data

**Markdown Structure**:
```markdown
## Key Performance Indicators

{{#IF HAS_KPI_DATA}}
### Workflow Metrics
- **Total Agents:** {{TOTAL_AGENTS}}
- **Total Tools:** {{TOTAL_TOOLS}}
- **Control Gates:** {{TOTAL_GATES}}
- **Workflow Connections:** {{TOTAL_EDGES}}

### Complexity Analysis
- **Workflow Complexity:** {{#IF TOTAL_EDGES > 50}}High{{ELSE IF TOTAL_EDGES > 20}}Medium{{ELSE}}Low{{/IF}}
- **Agent Density:** {{TOTAL_AGENTS / TOTAL_EDGES|fixed:2}} agents per connection

{{#IF HAS_TELEMETRY}}
### Performance Telemetry
```json
{{TELEMETRY_JSON|pretty}}
```
{{/IF}}

{{ELSE}}
_No KPI data available. KPIs will be populated once the workflow is deployed and executed._
{{/IF}}
```

**Fallback Rules**:
- Hide entire section if user disabled KPIs
- Show placeholder message if no telemetry
- Calculate complexity dynamically

---

### 6. **Recommendations Template**

**Purpose**: Actionable improvement suggestions  
**Tokens Used**: Counts, conditions  
**Conditional**: Always show (baseline recommendations)

**Markdown Structure**:
```markdown
## Recommendations

### Security
{{#IF TOTAL_AGENTS > 0}}
- ✅ Review all {{TOTAL_AGENTS}} agent prompts for sensitive data handling
- ✅ Implement input validation for all agent interactions
{{/IF}}
{{#IF TOTAL_TOOLS > 0}}
- ✅ Verify authentication credentials for {{TOTAL_TOOLS}} tool(s) are properly secured
- ✅ Use least-privilege access for all tool bindings
{{/IF}}

### Governance
{{#IF HAS_GATES}}
- ✅ Ensure {{TOTAL_GATES}} gate approvers have appropriate permissions
- ✅ Document approval workflows for audit compliance
{{ELSE}}
- ⚠️ **Consider adding approval gates** for sensitive operations
{{/IF}}

### Performance
{{#IF TOTAL_EDGES > 50}}
- ⚠️ **High workflow complexity** ({{TOTAL_EDGES}} connections) - consider breaking into sub-workflows
{{/IF}}
- ✅ Test all workflow paths in non-production environment
- ✅ Monitor agent response times and adjust timeouts accordingly

### Best Practices
- ✅ Implement comprehensive error handling for all agents
- ✅ Use descriptive names and documentation for maintainability
- ✅ Version control your blueprint definitions
- ✅ Regular security audits and penetration testing
```

**Fallback Rules**:
- Always show baseline recommendations
- Add conditional warnings based on metrics
- Emphasize missing controls (e.g., no gates)

---

## 🎭 Audience Composite Templates

### Leadership Composite

**Sections**: `executive` + `kpi` + `recommendations`  
**Focus**: High-level, business-oriented  
**Token Filters**: Truncate technical details

**Structure**:
```markdown
# {{BLUEPRINT_NAME}} - Executive Report
_Generated: {{GENERATED_AT|datetime}}_

[Executive Template - Full]
[KPI Template - Summary Only]
[Recommendations Template - Strategic Only]
```

**Special Rules**:
- Truncate agent prompts to 150 chars
- Hide technical configuration details
- Emphasize business metrics
- Simplify terminology

---

### Developer Composite

**Sections**: `technical` + `process` + `agents` + `tools` + `flow`  
**Focus**: Implementation details  
**Token Filters**: Full technical data

**Structure**:
```markdown
# {{BLUEPRINT_NAME}} - Technical Specification
_Generated: {{GENERATED_AT|datetime}}_

[Technical Template - Full]
[Process Template - Full]
[Agents Template - Detailed]
[Tools Template - Full]
[Flow Template - Full]
```

**Special Rules**:
- Show full agent prompts
- Include all configuration details
- Display raw JSON where relevant
- Technical terminology preferred

---

### Audit Composite

**Sections**: `governance` + `gates` + `metadata` + `recommendations`  
**Focus**: Compliance and controls  
**Token Filters**: Audit trail emphasis

**Structure**:
```markdown
# {{BLUEPRINT_NAME}} - Audit Report
_Generated: {{GENERATED_AT|datetime}}_

[Governance Template - Full]
[Gates Template - Detailed]
[Metadata Template - Audit Trail]
[Recommendations Template - Compliance Focus]
```

**Special Rules**:
- Emphasize security controls
- Highlight missing governance
- Show full audit trail
- Include compliance checklist

---

### Comprehensive Composite

**Sections**: ALL sections  
**Focus**: Complete documentation  
**Token Filters**: All data included

**Structure**:
```markdown
# {{BLUEPRINT_NAME}} - Comprehensive Report
_Generated: {{GENERATED_AT|datetime}}_

[Executive Template]
[Technical Template]
[Process Template]
[Governance Template]
[KPI Template]
[Agents Template]
[Tools Template]
[Gates Template]
[Flow Template]
[Metadata Template]
[Recommendations Template]
```

**Special Rules**:
- Include everything
- No truncation
- All technical details
- Complete audit trail

---

## 🔧 Template Engine Design

### Token Replacement Algorithm

```
1. Parse template string
2. Identify tokens ({{...}})
3. For each token:
   a. Check conditional blocks (IF/EACH)
   b. Apply filters (|filter)
   c. Get value from data context
   d. Apply fallback if value is null/undefined
   e. Replace token with value
4. Remove empty sections (consecutive newlines)
5. Return rendered string
```

### Conditional Block Processing

**IF Blocks**:
```
{{#IF TOKEN}}
  Content shown if TOKEN is truthy
{{ELSE}}
  Content shown if TOKEN is falsy
{{/IF}}
```

**EACH Blocks**:
```
{{#EACH COLLECTION}}
  {{ITEM_PROPERTY}}  # Access item properties
{{/EACH}}
```

### Filter Pipeline

```
{{TOKEN|filter1:arg1|filter2|filter3:arg1,arg2}}
```

**Supported Filters**:
- `date` - Format timestamp as date
- `datetime` - Format timestamp as date+time
- `comma` - Add thousands separator
- `truncate:N` - Truncate to N characters
- `join:sep` - Join array with separator
- `pretty` - Pretty-print JSON
- `uppercase` - Convert to uppercase
- `lowercase` - Convert to lowercase
- `title` - Title Case
- `fixed:N` - Fixed decimal places

---

## 📦 Static Template Loading

### Bundle Strategy

**Goal**: All templates bundled at build time, no runtime fetching

**Approach 1: TypeScript Module (Preferred)**

```
src/templates/
  index.ts              # Template registry export
  registry.ts           # Registry structure
  sections/
    executive.ts        # Executive template
    process.ts          # Process template
    technical.ts        # Technical template
    governance.ts       # Governance template
    kpi.ts             # KPI template
    recommendations.ts  # Recommendations template
  audiences/
    leadership.ts       # Leadership composite
    developer.ts        # Developer composite
    audit.ts           # Audit composite
    comprehensive.ts    # Comprehensive composite
```

**Export Pattern**:
```typescript
// templates/sections/executive.ts
export const executiveTemplate = {
  markdown: `
## Executive Summary
...template content...
  `,
  html: `
<section class="executive-summary">
  <h2>Executive Summary</h2>
  ...template content...
</section>
  `
};

// templates/index.ts
import { executiveTemplate } from './sections/executive';
// ... import all templates

export const TemplateRegistry: TemplateRegistry = {
  sections: {
    executive: executiveTemplate,
    // ... other sections
  },
  audiences: {
    leadership: {
      sections: ['executive', 'kpi', 'recommendations'],
      order: [1, 2, 3],
      markdown: leadershipTemplate.markdown,
      html: leadershipTemplate.html,
    },
    // ... other audiences
  },
  version: '1.0.0',
  lastUpdated: '2025-10-22T00:00:00Z',
};
```

**Benefits**:
- ✅ Type-safe
- ✅ Tree-shakeable
- ✅ No runtime loading
- ✅ Syntax highlighting in IDE
- ✅ Easy to test

---

**Approach 2: JSON with Import**

```
src/templates/
  templates.json        # All templates in JSON
  index.ts             # Import and type JSON
```

**Structure**:
```json
{
  "version": "1.0.0",
  "sections": {
    "executive": {
      "markdown": "## Executive Summary\n...",
      "html": "<section>...</section>"
    }
  },
  "audiences": {
    "leadership": {
      "sections": ["executive", "kpi", "recommendations"],
      "markdown": "...",
      "html": "..."
    }
  }
}
```

**Import**:
```typescript
import templatesJson from './templates.json';
export const TemplateRegistry = templatesJson as TemplateRegistry;
```

**Benefits**:
- ✅ Simple structure
- ✅ Easy to edit
- ✅ Version control friendly
- ⚠️ Less type safety

---

**Approach 3: Hybrid (Recommended)**

Sections as TypeScript, composites generated:

```typescript
// Base sections as TS modules
import { executiveTemplate } from './sections/executive';
import { kpiTemplate } from './sections/kpi';
// ...

// Generate composites dynamically
function composeTemplate(sections: TemplateSectionKey[]): string {
  return sections
    .map(key => TemplateRegistry.sections[key].markdown)
    .join('\n\n---\n\n');
}

export const TemplateRegistry: TemplateRegistry = {
  sections: {
    executive: executiveTemplate,
    kpi: kpiTemplate,
    // ...
  },
  audiences: {
    leadership: {
      sections: ['executive', 'kpi', 'recommendations'],
      order: [1, 2, 3],
      markdown: composeTemplate(['executive', 'kpi', 'recommendations']),
      html: composeHtml(['executive', 'kpi', 'recommendations']),
    },
  },
  version: '1.0.0',
  lastUpdated: '2025-10-22T00:00:00Z',
};
```

**Benefits**:
- ✅ Best of both worlds
- ✅ DRY principle
- ✅ Easy maintenance
- ✅ Automatic composition

---

## 🎯 Template Rendering Flow

```
1. User selects audience (e.g., "leadership")
2. Load corresponding composite template from registry
3. Build data context from blueprint
4. Pass template + context to template engine
5. Engine processes:
   a. Replace simple tokens
   b. Process conditional blocks
   c. Execute loops
   d. Apply filters
   e. Handle fallbacks
6. Post-process:
   a. Remove empty sections
   b. Collapse multiple newlines
   c. Trim whitespace
7. Return rendered Markdown/HTML
8. Convert to final format if needed
```

---

## 🔄 Fallback Rule Processing

### Empty Section Detection

**Rule**: Hide section if all content tokens are empty

```markdown
## Section Title
{{#IF HAS_CONTENT}}
  Content here
{{ELSE}}
  <!-- Section hidden automatically -->
{{/IF}}
```

**Auto-Detection**:
```typescript
function isEmptySection(rendered: string): boolean {
  const withoutHeaders = rendered.replace(/^#{1,6}\s+.+$/gm, '');
  const withoutWhitespace = withoutHeaders.trim();
  return withoutWhitespace.length === 0;
}
```

### Fallback Chain

```
{{TOKEN ?? FALLBACK_TOKEN ?? "default value"}}

Example:
{{AGENT_MEMORY_MAX_TOKENS ?? "unlimited"}}
{{KPI_SUCCESS_RATE ?? "N/A"}}
{{BLUEPRINT_AUTHOR ?? "System"}}
```

### Graceful Degradation

1. **Missing Data**: Show placeholder instead of error
2. **Empty Collections**: Show "None" or informative message
3. **Missing Sections**: Omit entirely, no blank space
4. **Invalid Filters**: Fallback to unfiltered value

---

## 📐 Template Versioning

### Version Strategy

```typescript
interface TemplateVersion {
  major: number;  // Breaking changes
  minor: number;  // New templates/tokens
  patch: number;  // Bug fixes
}

const CURRENT_VERSION = '1.0.0';
```

### Migration Plan

When templates change:
1. Increment version
2. Keep old templates for compatibility
3. Add migration notes
4. Support multi-version rendering

---

## 🧪 Testing Strategy

### Template Validation

1. **Token Coverage**: All tokens have fallbacks
2. **Conditional Logic**: All IF/EACH blocks valid
3. **Filter Validity**: All filters exist and work
4. **Empty Data**: Templates work with minimal data
5. **Full Data**: Templates work with complete data

### Test Cases

```typescript
describe('Template Registry', () => {
  it('loads all section templates', () => {
    expect(TemplateRegistry.sections.executive).toBeDefined();
  });
  
  it('composes audience templates correctly', () => {
    const leadership = TemplateRegistry.audiences.leadership;
    expect(leadership.sections).toContain('executive');
  });
  
  it('handles empty data gracefully', () => {
    const rendered = renderTemplate(emptyBlueprint, 'leadership');
    expect(rendered).not.toContain('undefined');
  });
  
  it('applies filters correctly', () => {
    const result = applyFilter('2025-10-22', 'date');
    expect(result).toBe('October 22, 2025');
  });
});
```

---

## 📊 Performance Considerations

### Bundle Size

**Current Estimate**:
- Base sections: ~15 KB each × 11 = 165 KB
- Audience composites: ~30 KB each × 4 = 120 KB
- **Total: ~285 KB uncompressed**
- **Gzipped: ~60 KB**

### Optimization Strategies

1. **Tree Shaking**: Only bundle used templates
2. **Code Splitting**: Lazy load rarely-used templates
3. **Compression**: Gzip templates in production
4. **Caching**: Store rendered templates in memory

---

## 🎨 HTML Template Design

### Styling Strategy

**Inline CSS** for offline HTML exports:
```html
<style>
  .report-container { max-width: 900px; margin: 0 auto; }
  .executive-summary { background: #f7fafc; padding: 2rem; }
  .agent-card { border: 1px solid #e2e8f0; border-radius: 8px; }
</style>
```

**Print Styles**:
```css
@media print {
  .no-print { display: none; }
  h1, h2 { page-break-after: avoid; }
  .agent-card { page-break-inside: avoid; }
}
```

---

## 🚀 Implementation Checklist

- [ ] Define all template section keys
- [ ] Create token catalog constant
- [ ] Implement base section templates (Markdown)
- [ ] Implement base section templates (HTML)
- [ ] Create audience composite templates
- [ ] Build template registry structure
- [ ] Implement token replacement engine
- [ ] Implement conditional block processor
- [ ] Implement loop/iteration processor
- [ ] Implement filter pipeline
- [ ] Add fallback handling
- [ ] Add empty section detection
- [ ] Create TypeScript types
- [ ] Bundle templates statically
- [ ] Write unit tests
- [ ] Document token usage
- [ ] Performance optimization

---

**Document Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** 📋 Design Complete - Ready for Implementation
