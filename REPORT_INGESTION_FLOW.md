# Report Generator - Data Ingestion Flow

## Overview

The Report Generator implements a robust data ingestion pipeline with comprehensive validation, schema checking, and performance monitoring. All operations are client-side and work completely offline.

---

## 📥 Data Ingestion Flow

### 1. **File Upload Flow**

```
User selects file
    ↓
validateFileUpload() - Check size, type
    ↓
FileReader reads content
    ↓
validateBlueprintJSON() - Full schema validation
    ↓
setGraph() - Save to ReportContext
    ↓
Auto-generate report
```

**Steps:**
1. User clicks "📁 Upload JSON" button
2. File input triggers with `.json` filter
3. Pre-validation checks:
   - File type must be `application/json` or end with `.json`
   - File size < 10MB (hard limit)
   - Warning shown if > 5MB
4. FileReader loads content asynchronously
5. Full schema validation via `validateBlueprintJSON()`
6. If valid: Save to context and trigger report generation
7. If invalid: Display detailed error messages

**Performance Thresholds:**
- `MAX_FILE_SIZE_MB`: 10MB (rejected)
- `WARN_FILE_SIZE_MB`: 5MB (warning shown)
- `WARN_NODE_COUNT`: 50 nodes (performance warning)
- `WARN_EDGE_COUNT`: 100 edges (complexity warning)

---

### 2. **Paste JSON Flow**

```
User pastes JSON
    ↓
Quick syntax check (try JSON.parse)
    ↓
500ms debounce
    ↓
validateBlueprintJSON() - Full validation
    ↓
setGraph() - Save to context
    ↓
Auto-generate report
```

**Steps:**
1. User pastes JSON into textarea
2. Immediate syntax check (no error shown yet)
3. 500ms debounce to wait for complete paste
4. Full validation with `validateBlueprintJSON()`
5. Errors/warnings displayed inline
6. Valid blueprints automatically trigger report generation

**UX Considerations:**
- No intrusive errors while typing
- Validation errors shown after debounce
- Syntax highlighting via monospace font
- Scroll-enabled for large JSON

---

### 3. **Sample Blueprint Flow**

```
User clicks "Sample Blueprint"
    ↓
Load embedded SAMPLE_BLUEPRINT
    ↓
Stringify with pretty-print (2 spaces)
    ↓
setGraph() - Validate and save
    ↓
Auto-generate report
```

**Steps:**
1. User clicks "📋 Sample Blueprint"
2. Pre-defined sample loaded from constant
3. JSON stringified with formatting
4. Full validation (should always pass)
5. Report generated immediately

**Sample Blueprint Contains:**
- 2 agents (Triage, Resolution)
- 2 tools (REST API, SharePoint)
- 1 gate (Approval)
- 2 edges with conditions
- Complete metadata with telemetry

---

### 4. **Clear Flow**

```
User clicks "Clear"
    ↓
Confirmation prompt (if data exists)
    ↓
clearAll() - Reset context
    ↓
Clear localStorage
    ↓
Reset UI state
```

**Steps:**
1. User clicks "🗑️ Clear"
2. Confirmation prompt if data exists
3. `clearAll()` resets context to initial state:
   - `graphJson = null`
   - `telemetry = null`
   - `errors = {}`
   - `validationWarnings = []`
   - `blueprintMetadata = null`
   - Options reset to defaults
4. localStorage cleared (future persistence)
5. File input reset
6. Textarea cleared

---

## ✅ Schema Validation

### Validation Pipeline

**Step 1: JSON Parsing**
- Catch syntax errors
- Provide user-friendly error messages
- Example: "Invalid JSON syntax. Check for missing commas, brackets, or quotes."

**Step 2: Schema Version Check**
- Supported versions: `1.0`, `1.0.0`
- Warning if version mismatch
- Backward compatibility handling

**Step 3: Required Fields**
```typescript
Required at root:
- id: string
- name: string
- template OR spec: ProjectSpec
```

**Step 4: Zod Schema Validation**
- Uses `zProjectSpec` from `@agentfactory/types`
- Validates entire blueprint structure
- Provides path-based error messages
- Example: `"Schema validation error at 'orchestration → agents → 0 → name': Required"`

**Step 5: Performance Analysis**
```typescript
Node Count = agents + tools + gates
- Warn if > 50 nodes
- Suggest simplification if > 100 edges
```

**Step 6: Deprecated Fields**
- Detects old schema structures
- Warns about `spec` vs `template`
- Identifies legacy field names

**Step 7: Completeness Check**
- Validates `startNode` exists
- Warns if no outputs defined
- Warns if no agents defined

---

## ⚠️ Error Messages & UX

### Error Types

#### 1. **JSON Syntax Errors**
```
❌ Validation Failed
Invalid JSON format: Unexpected token } in JSON at position 243
Please ensure your JSON is properly formatted with matching brackets and quotes.
```

**User-Friendly Mapping:**
| Raw Error | User-Friendly Message |
|-----------|----------------------|
| "Unexpected token" | "Invalid JSON syntax. Check for missing commas, brackets, or quotes." |
| "Expected property name" | "Invalid JSON structure. Ensure all properties are properly named." |
| "Unexpected end" | "Incomplete JSON. The file may be truncated." |
| "duplicate key" | "Duplicate property names found. Each property must be unique." |

#### 2. **Schema Validation Errors**
```
❌ Validation Failed
1. Missing required field: 'id' at root level
2. Schema validation error at 'orchestration → agents → 0 → prompt': Required
3. Missing 'startNode' in orchestration. Unable to determine workflow entry point.
```

**Display Format:**
- Numbered list for multiple errors
- Path-based error locations
- Actionable error messages

#### 3. **File Upload Errors**
```
File validation failed:
1. File too large (12.5MB). Maximum allowed size is 10MB.
```

```
File validation failed:
1. Invalid file type. Please upload a JSON file.
```

---

### Warning Types

#### 1. **Performance Warnings**
```
⚠️ Warnings
• Large file detected (6.2MB). Processing may be slow.
• ⚠️ Large blueprint detected with 75 nodes. Report generation may take longer.
• ⚠️ Complex workflow detected with 150 connections. Consider simplifying for better readability.
```

**Display:**
- Yellow background (`bg-yellow-50`)
- Bullet list format
- Non-blocking (user can proceed)

#### 2. **Schema Warnings**
```
⚠️ Warnings
• Schema version '0.9.0' may not be fully compatible. Supported versions: 1.0, 1.0.0
• Blueprint contains deprecated fields. Consider updating to the latest schema.
• No output nodes defined. Consider specifying workflow outputs.
```

---

### Performance Summary

When blueprint loaded successfully:
```
📊 Blueprint Size: 12 nodes, 18 connections | 💾 File Size: 24.5 KB | 📋 Schema Version: 1.0.0
```

**Displayed in:**
- Blue info bar at top of input panel
- Shows at-a-glance metrics
- Updates on each validation

---

## 🚀 Performance Optimizations

### Large File Handling

**Detection:**
```typescript
if (nodeCount > PERFORMANCE_THRESHOLDS.WARN_NODE_COUNT) {
  warnings.push(`⚠️ Large blueprint detected with ${nodeCount} nodes.`);
}
```

**UX Response:**
1. Show warning message immediately
2. Display processing indicator
3. Use debouncing for live validation
4. Disable interactions during processing

**Thresholds:**
- **50+ nodes**: "Report generation may take longer"
- **100+ edges**: "Consider simplifying for better readability"
- **5MB+ file**: "Processing may be slow"
- **10MB+ file**: Reject upload

### Debouncing Strategy

**Paste Input:**
- 500ms debounce before full validation
- Quick syntax check (non-blocking)
- Prevents validation on every keystroke

**Benefit:**
- Reduces CPU usage
- Better UX for large JSON
- Allows complete paste operations

---

## 🔒 Validation Error Catalog

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid JSON format" | Syntax error in JSON | Check brackets, commas, quotes |
| "Missing required field: 'id'" | Blueprint missing ID | Add `"id": "unique-id"` at root |
| "Missing 'template' or 'spec'" | No orchestration data | Add `"template": {...}` field |
| "Missing 'startNode'" | No entry point defined | Add `"startNode": "agent-id"` |
| "Schema validation error at 'agents → 0 → name'" | Agent missing name | Add `"name": "..."` to agent |
| "File too large" | File exceeds 10MB | Split blueprint or compress |
| "Invalid file type" | Not a JSON file | Save as `.json` extension |

---

## 📊 Validation Metadata

After successful validation, metadata is captured:

```typescript
interface ValidationMetadata {
  nodeCount: number;        // Total agents + tools + gates
  edgeCount: number;        // Total connections
  fileSizeKB: number;       // File size in kilobytes
  schemaVersion?: string;   // Blueprint schema version
  hasDeprecatedFields: boolean; // Legacy field detection
}
```

**Usage:**
- Performance summary display
- Conditional warnings
- Analytics (future)
- Report generation optimization

---

## 🎯 Success Criteria

A blueprint is considered **valid** when:

✅ JSON is parseable  
✅ All required fields present (`id`, `name`, `template`)  
✅ Schema validation passes (Zod)  
✅ Orchestration has at least one agent  
✅ `startNode` is defined  
✅ All agent/tool/gate IDs are unique  
✅ Edge references point to existing nodes  

**Note:** Warnings do not prevent report generation, only errors do.

---

## 🔄 State Flow Diagram

```
┌─────────────────┐
│  User Action    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Validate │ ← File/Paste/Sample
    └────┬─────┘
         │
    ┌────▼─────────┐
    │ setGraph()   │ ← Save to Context
    └────┬─────────┘
         │
    ┌────▼────────────┐
    │ generateReport()│ ← Auto-trigger
    └────┬────────────┘
         │
    ┌────▼─────────┐
    │ Live Preview │
    └──────────────┘
```

---

## 💾 Local Storage (Future)

**Planned persistence:**
```typescript
localStorage.setItem('reportGenerator_lastBlueprint', jsonString);
localStorage.setItem('reportGenerator_options', JSON.stringify(options));
```

**Current implementation:**
- `clearAll()` includes localStorage cleanup
- No automatic persistence yet
- Can be enabled for draft recovery

---

## 📝 Usage Examples

### Example 1: Valid Upload
```json
{
  "id": "my-workflow",
  "name": "My Workflow",
  "template": {
    "id": "wf-1",
    "name": "Workflow",
    "version": "1.0.0",
    "orchestration": {
      "id": "orch-1",
      "name": "Main Orchestration",
      "agents": [...],
      "tools": [...],
      "gates": [],
      "edges": [...],
      "startNode": "agent-1",
      "outputs": ["result"]
    }
  }
}
```
**Result:** ✅ Report generated successfully

### Example 2: Missing Required Field
```json
{
  "name": "My Workflow",
  "template": {...}
}
```
**Result:** ❌ Error: "Missing required field: 'id' at root level"

### Example 3: Large Blueprint Warning
```json
{
  "id": "large-wf",
  "template": {
    "orchestration": {
      "agents": [/* 60 agents */],
      "edges": [/* 120 edges */]
    }
  }
}
```
**Result:** ⚠️ Warnings displayed, report still generated

---

## 🛠️ Developer Notes

### Extending Validation

Add new validation rules in `blueprintValidation.ts`:

```typescript
// Step 8: Custom validation
if (customCondition) {
  warnings.push('Your custom warning message');
}
```

### Testing Validation

Test with various inputs:
- Empty JSON: `{}`
- Malformed JSON: `{name: "test"` (missing quote)
- Large files: Generate 100+ node blueprint
- Old schema: Use `spec` instead of `template`
- Missing fields: Remove required properties

---

**Document Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** ✅ Implemented
