# Export Commands Design

## Overview

The Report Generator provides three export formats with standardized file naming, self-contained output, and embedded metadata footers. All exports are client-side operations with no server dependencies.

---

## 📥 Export Commands

### 1. Export Markdown

**Command**: `exportMarkdown()`

**Process Flow**:
```
Rendered Markdown String
    ↓
1. Append metadata footer
    ↓
2. Create Blob with MIME type 'text/markdown'
    ↓
3. Generate filename using naming rules
    ↓
4. Trigger browser download
    ↓
Complete
```

**Implementation**:
```typescript
function exportMarkdown(
  content: string,
  blueprintName: string,
  audience: AudienceType,
  metadata: ExportMetadata
): void {
  // 1. Append metadata footer
  const contentWithFooter = appendMetadataFooter(content, metadata, 'markdown');
  
  // 2. Create Blob
  const blob = new Blob([contentWithFooter], {
    type: 'text/markdown;charset=utf-8'
  });
  
  // 3. Generate filename
  const filename = generateFilename(blueprintName, audience, 'md');
  
  // 4. Download
  downloadBlob(blob, filename);
}
```

**Characteristics**:
- ✅ Plain text format
- ✅ UTF-8 encoding
- ✅ Cross-platform compatible
- ✅ Version control friendly
- ✅ Metadata footer in markdown format
- ✅ File size: ~50-200 KB

**MIME Type**: `text/markdown;charset=utf-8`

**Use Cases**:
- Documentation repositories (Git, GitHub, GitLab)
- Wiki systems (Confluence, Notion)
- Static site generators (Jekyll, Hugo)
- Markdown editors (Obsidian, Typora)

---

### 2. Export HTML (Self-Contained)

**Command**: `exportHtml()`

**Process Flow**:
```
Rendered HTML String
    ↓
1. Inline all CSS styles
    ↓
2. Append metadata footer (HTML)
    ↓
3. Wrap in complete HTML document structure
    ↓
4. Create Blob with MIME type 'text/html'
    ↓
5. Generate filename using naming rules
    ↓
6. Trigger browser download
    ↓
Complete
```

**Implementation**:
```typescript
function exportHtml(
  content: string,
  blueprintName: string,
  audience: AudienceType,
  metadata: ExportMetadata
): void {
  // 1. Inline all styles
  const styledContent = inlineStyles(content);
  
  // 2. Append metadata footer
  const contentWithFooter = appendMetadataFooter(styledContent, metadata, 'html');
  
  // 3. Wrap in complete HTML document
  const completeHtml = wrapInHtmlDocument(contentWithFooter, metadata);
  
  // 4. Create Blob
  const blob = new Blob([completeHtml], {
    type: 'text/html;charset=utf-8'
  });
  
  // 5. Generate filename
  const filename = generateFilename(blueprintName, audience, 'html');
  
  // 6. Download
  downloadBlob(blob, filename);
}
```

**HTML Document Structure**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="Agent Factory Report Generator v{{VERSION}}">
  <meta name="created" content="{{ISO_TIMESTAMP}}">
  <meta name="blueprint" content="{{BLUEPRINT_NAME}}">
  <meta name="audience" content="{{AUDIENCE}}">
  <title>{{BLUEPRINT_NAME}} - {{AUDIENCE}} Report</title>
  
  <!-- Inline CSS Styles -->
  <style>
    /* Reset & Base Styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm 15mm;
    }
    
    /* Typography */
    h1 { font-size: 18pt; margin: 1.5rem 0 1rem; page-break-after: avoid; }
    h2 { font-size: 16pt; margin: 2rem 0 0.75rem; page-break-after: avoid; }
    h3 { font-size: 14pt; margin: 1.5rem 0 0.5rem; page-break-after: avoid; }
    h4 { font-size: 12pt; margin: 1rem 0 0.5rem; page-break-after: avoid; }
    
    p { margin: 0.5rem 0; }
    
    /* Lists */
    ul, ol { margin: 0.75rem 0; padding-left: 1.5rem; }
    li { margin: 0.25rem 0; }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      page-break-inside: avoid;
    }
    caption {
      caption-side: top;
      text-align: left;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    th, td {
      border: 1px solid #333;
      padding: 0.5rem;
      text-align: left;
    }
    th {
      background: #f5f5f5;
      font-weight: 600;
    }
    
    /* Code */
    pre {
      background: #f7f7f7;
      padding: 1rem;
      border-radius: 4px;
      border: 1px solid #ddd;
      overflow-x: auto;
      margin: 1rem 0;
      page-break-inside: avoid;
    }
    code {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
    }
    
    /* Cards */
    .agent-card,
    .tool-card,
    .gate-card {
      border: 1px solid #333;
      padding: 1rem;
      margin: 1rem 0;
      page-break-inside: avoid;
    }
    
    /* Metadata Footer */
    .report-metadata-footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 2px solid #333;
      font-size: 9pt;
      color: #666;
    }
    
    /* Print Styles */
    @media print {
      @page {
        size: A4 portrait;
        margin: 20mm 15mm;
      }
      
      body {
        max-width: 100%;
        padding: 0;
      }
      
      h1 { page-break-before: always; }
      h1:first-child { page-break-before: avoid; }
      
      .no-print { display: none !important; }
      
      * {
        box-shadow: none !important;
        text-shadow: none !important;
      }
      
      a[href^="http"]::after {
        content: " (" attr(href) ")";
        font-size: 0.8em;
        color: #666;
      }
    }
  </style>
</head>
<body>
  <main role="main">
    <!-- Report Content -->
    {{REPORT_CONTENT}}
    
    <!-- Metadata Footer -->
    {{METADATA_FOOTER}}
  </main>
</body>
</html>
```

**Characteristics**:
- ✅ Fully self-contained (no external dependencies)
- ✅ All styles inlined
- ✅ Offline viewable
- ✅ Print-ready (A4 portrait)
- ✅ Accessible (semantic HTML, ARIA)
- ✅ File size: ~100-500 KB

**MIME Type**: `text/html;charset=utf-8`

**Use Cases**:
- Email attachments
- SharePoint/file server uploads
- Offline documentation
- Archive storage
- Print/PDF conversion

---

### 3. Export PDF

**Command**: `exportPdf()`

**Process Flow**:
```
Rendered HTML String
    ↓
1. Inline all CSS styles (print-optimized)
    ↓
2. Append metadata footer
    ↓
3. Wrap in print-friendly HTML document
    ↓
4. Open in new window/same window
    ↓
5. Call window.print()
    ↓
6. User saves as PDF via browser print dialog
    ↓
Complete
```

**Implementation**:
```typescript
function exportPdf(
  content: string,
  blueprintName: string,
  audience: AudienceType,
  metadata: ExportMetadata
): void {
  // 1. Inline all styles (print-optimized)
  const styledContent = inlineStyles(content, { printOptimized: true });
  
  // 2. Append metadata footer
  const contentWithFooter = appendMetadataFooter(styledContent, metadata, 'html');
  
  // 3. Wrap in print-friendly HTML document
  const printHtml = wrapInPrintHtmlDocument(contentWithFooter, metadata);
  
  // 4. Open print view
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    // Fallback: Use current window
    const printContainer = document.createElement('div');
    printContainer.innerHTML = printHtml;
    document.body.appendChild(printContainer);
    
    // 5. Call print dialog
    window.print();
    
    // Cleanup
    document.body.removeChild(printContainer);
  } else {
    // Write content to new window
    printWindow.document.write(printHtml);
    printWindow.document.close();
    
    // 5. Call print dialog after load
    printWindow.onload = () => {
      printWindow.print();
      // Note: Window closes automatically after print or cancel
    };
  }
}
```

**Print-Optimized HTML Enhancements**:
```html
<style>
  /* Additional print-specific styles */
  @media print {
    /* Hide print button if rendered */
    button, .no-print { display: none !important; }
    
    /* Ensure black text */
    body, p, li, td, th { color: #000 !important; }
    
    /* Page breaks */
    h1 { page-break-before: always; }
    h1:first-child { page-break-before: avoid; }
    h2, h3 { page-break-after: avoid; }
    
    /* Keep together */
    .agent-card,
    .tool-card,
    .gate-card,
    pre,
    table {
      page-break-inside: avoid;
    }
    
    /* Orphan/widow control */
    p, li { orphans: 3; widows: 3; }
    
    /* Links */
    a[href^="http"]::after {
      content: " (" attr(href) ")";
      font-size: 0.8em;
      color: #666;
    }
  }
</style>
```

**Characteristics**:
- ✅ Uses browser's native print-to-PDF
- ✅ Print dialog with preview
- ✅ User controls output filename
- ✅ Supports page setup (margins, orientation)
- ✅ High-quality PDF output
- ✅ No third-party dependencies

**Filename Suggestion**:
The browser's print dialog will suggest the filename based on the document title:
```html
<title>{{BLUEPRINT_NAME}}-{{AUDIENCE}}-{{TIMESTAMP}}</title>
```

**Use Cases**:
- Executive presentations
- Audit documentation
- Archive records
- Compliance reporting
- Professional distribution

---

## 📛 File Naming Rules

### Format Specification

**Pattern**: `{{BlueprintName}}-{{Audience}}-{{YYYYMMDD-HHmm}}.{{ext}}`

**Components**:

1. **BlueprintName**: Sanitized blueprint name
   - Source: `blueprint.name`
   - Sanitization: Remove invalid filename characters
   - Max length: 50 characters
   - Truncate with ellipsis if needed

2. **Audience**: Report audience type
   - Values: `leadership` | `developer` | `audit` | `comprehensive`
   - Capitalized: `Leadership` | `Developer` | `Audit` | `Comprehensive`

3. **YYYYMMDD-HHmm**: Timestamp
   - Format: ISO 8601 compact format
   - `YYYY`: 4-digit year
   - `MM`: 2-digit month (01-12)
   - `DD`: 2-digit day (01-31)
   - `HH`: 2-digit hour (00-23, 24-hour format)
   - `mm`: 2-digit minute (00-59)
   - Separator: Hyphen between date and time

4. **ext**: File extension
   - `md`: Markdown export
   - `html`: HTML export
   - `pdf`: PDF export (suggested filename)

### Implementation

```typescript
interface FileNamingOptions {
  blueprintName: string;
  audience: 'leadership' | 'developer' | 'audit' | 'comprehensive';
  timestamp?: Date;
  extension: 'md' | 'html' | 'pdf';
}

function generateFilename(options: FileNamingOptions): string {
  const {
    blueprintName,
    audience,
    timestamp = new Date(),
    extension
  } = options;
  
  // 1. Sanitize blueprint name
  const sanitized = sanitizeBlueprintName(blueprintName);
  
  // 2. Capitalize audience
  const audienceCapitalized = capitalizeAudience(audience);
  
  // 3. Format timestamp
  const timestampFormatted = formatTimestamp(timestamp);
  
  // 4. Combine components
  return `${sanitized}-${audienceCapitalized}-${timestampFormatted}.${extension}`;
}

function sanitizeBlueprintName(name: string): string {
  // Remove invalid filename characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
  let sanitized = name.replace(invalidChars, '_');
  
  // Replace multiple spaces/underscores with single
  sanitized = sanitized.replace(/[\s_]+/g, '_');
  
  // Remove leading/trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  
  // Truncate to max length
  const maxLength = 50;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength - 3) + '...';
  }
  
  // Fallback if empty
  if (!sanitized) {
    sanitized = 'Untitled';
  }
  
  return sanitized;
}

function capitalizeAudience(audience: string): string {
  return audience.charAt(0).toUpperCase() + audience.slice(1);
}

function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}-${hours}${minutes}`;
}
```

### Naming Examples

| Blueprint Name | Audience | Timestamp | Extension | Generated Filename |
|----------------|----------|-----------|-----------|-------------------|
| Customer Support Workflow | Leadership | 2025-10-22 14:30 | md | `Customer_Support_Workflow-Leadership-20251022-1430.md` |
| Data Processing Pipeline | Developer | 2025-10-22 09:15 | html | `Data_Processing_Pipeline-Developer-20251022-0915.html` |
| Compliance Review System | Audit | 2025-10-22 16:45 | pdf | `Compliance_Review_System-Audit-20251022-1645.pdf` |
| Multi-Agent Orchestration | Comprehensive | 2025-10-22 11:00 | md | `Multi-Agent_Orchestration-Comprehensive-20251022-1100.md` |
| Very Long Blueprint Name That Exceeds Limit | Leadership | 2025-10-22 13:20 | html | `Very_Long_Blueprint_Name_That_Exceeds_Limi...-Leadership-20251022-1320.html` |
| Blueprint/With:Invalid*Chars? | Developer | 2025-10-22 10:05 | md | `Blueprint_With_Invalid_Chars_-Developer-20251022-1005.md` |

### Special Cases

**Empty Blueprint Name**:
```
Filename: Untitled-Leadership-20251022-1430.md
```

**Blueprint Name with Emojis**:
```
Input: "🚀 Rocket Launch Workflow"
Output: "Rocket_Launch_Workflow-Developer-20251022-1200.md"
```

**Blueprint Name All Invalid Characters**:
```
Input: "***///???"
Output: "Untitled-Audit-20251022-1545.html"
```

---

## 📄 Metadata Footer

### Purpose

Embed generation metadata at the end of every exported report for:
- Attribution and provenance
- Version tracking
- Timestamp verification
- Blueprint identification
- Reproducibility

### Format-Specific Footers

#### Markdown Footer

**Structure**:
```markdown
---

## Report Metadata

**Report Title**: {{BLUEPRINT_NAME}} - {{AUDIENCE}} Report  
**Blueprint Version**: {{BLUEPRINT_VERSION}}  
**Generated**: {{TIMESTAMP_READABLE}}  
**Generator**: Agent Factory Report Generator v{{GENERATOR_VERSION}}  
**Format**: {{FORMAT}}  

---
*This report was automatically generated from blueprint specification. For questions or modifications, refer to the source blueprint JSON.*
```

**Implementation**:
```typescript
function generateMarkdownFooter(metadata: ExportMetadata): string {
  const {
    blueprintName,
    blueprintVersion,
    audience,
    timestamp,
    generatorVersion,
    format
  } = metadata;
  
  const readableTimestamp = formatReadableTimestamp(timestamp);
  const audienceCapitalized = capitalizeAudience(audience);
  
  return `
---

## Report Metadata

**Report Title**: ${blueprintName} - ${audienceCapitalized} Report  
**Blueprint Version**: ${blueprintVersion}  
**Generated**: ${readableTimestamp}  
**Generator**: Agent Factory Report Generator v${generatorVersion}  
**Format**: ${format.toUpperCase()}  

---
*This report was automatically generated from blueprint specification. For questions or modifications, refer to the source blueprint JSON.*
`;
}
```

**Example Output**:
```markdown
---

## Report Metadata

**Report Title**: Customer Support Workflow - Leadership Report  
**Blueprint Version**: 1.0.0  
**Generated**: October 22, 2025 at 2:30 PM (UTC)  
**Generator**: Agent Factory Report Generator v1.0.0  
**Format**: MARKDOWN  

---
*This report was automatically generated from blueprint specification. For questions or modifications, refer to the source blueprint JSON.*
```

#### HTML Footer

**Structure**:
```html
<footer class="report-metadata-footer" role="contentinfo">
  <h2 class="heading-minor">Report Metadata</h2>
  <dl class="metadata-list">
    <dt>Report Title</dt>
    <dd>{{BLUEPRINT_NAME}} - {{AUDIENCE}} Report</dd>
    
    <dt>Blueprint Version</dt>
    <dd>{{BLUEPRINT_VERSION}}</dd>
    
    <dt>Generated</dt>
    <dd>
      <time datetime="{{TIMESTAMP_ISO}}">{{TIMESTAMP_READABLE}}</time>
    </dd>
    
    <dt>Generator</dt>
    <dd>Agent Factory Report Generator v{{GENERATOR_VERSION}}</dd>
    
    <dt>Format</dt>
    <dd>{{FORMAT}}</dd>
  </dl>
  <p class="metadata-disclaimer">
    <em>This report was automatically generated from blueprint specification. 
    For questions or modifications, refer to the source blueprint JSON.</em>
  </p>
</footer>
```

**Implementation**:
```typescript
function generateHtmlFooter(metadata: ExportMetadata): string {
  const {
    blueprintName,
    blueprintVersion,
    audience,
    timestamp,
    generatorVersion,
    format
  } = metadata;
  
  const isoTimestamp = timestamp.toISOString();
  const readableTimestamp = formatReadableTimestamp(timestamp);
  const audienceCapitalized = capitalizeAudience(audience);
  
  return `
<footer class="report-metadata-footer" role="contentinfo">
  <h2 class="heading-minor">Report Metadata</h2>
  <dl class="metadata-list">
    <dt>Report Title</dt>
    <dd>${escapeHtml(blueprintName)} - ${audienceCapitalized} Report</dd>
    
    <dt>Blueprint Version</dt>
    <dd>${escapeHtml(blueprintVersion)}</dd>
    
    <dt>Generated</dt>
    <dd>
      <time datetime="${isoTimestamp}">${readableTimestamp}</time>
    </dd>
    
    <dt>Generator</dt>
    <dd>Agent Factory Report Generator v${generatorVersion}</dd>
    
    <dt>Format</dt>
    <dd>${format.toUpperCase()}</dd>
  </dl>
  <p class="metadata-disclaimer">
    <em>This report was automatically generated from blueprint specification. 
    For questions or modifications, refer to the source blueprint JSON.</em>
  </p>
</footer>
`;
}
```

**Footer Styles** (included in inline CSS):
```css
.report-metadata-footer {
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 2px solid #333;
  font-size: 9pt;
  color: #666;
  page-break-inside: avoid;
}

.report-metadata-footer h2 {
  font-size: 12pt;
  color: #333;
  margin-bottom: 0.5rem;
}

.metadata-list {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1rem;
  margin: 1rem 0;
}

.metadata-list dt {
  font-weight: 600;
  color: #333;
}

.metadata-list dd {
  margin: 0;
}

.metadata-disclaimer {
  margin-top: 1rem;
  font-size: 8pt;
  font-style: italic;
}

@media print {
  .report-metadata-footer {
    page-break-before: auto;
  }
}
```

**Example Output**:
```html
<footer class="report-metadata-footer" role="contentinfo">
  <h2 class="heading-minor">Report Metadata</h2>
  <dl class="metadata-list">
    <dt>Report Title</dt>
    <dd>Customer Support Workflow - Leadership Report</dd>
    
    <dt>Blueprint Version</dt>
    <dd>1.0.0</dd>
    
    <dt>Generated</dt>
    <dd>
      <time datetime="2025-10-22T14:30:00.000Z">October 22, 2025 at 2:30 PM (UTC)</time>
    </dd>
    
    <dt>Generator</dt>
    <dd>Agent Factory Report Generator v1.0.0</dd>
    
    <dt>Format</dt>
    <dd>HTML</dd>
  </dl>
  <p class="metadata-disclaimer">
    <em>This report was automatically generated from blueprint specification. 
    For questions or modifications, refer to the source blueprint JSON.</em>
  </p>
</footer>
```

### Metadata Fields

```typescript
interface ExportMetadata {
  blueprintName: string;        // From blueprint.name
  blueprintVersion: string;     // From blueprint.template.version
  blueprintId: string;          // From blueprint.id
  audience: AudienceType;       // Selected audience
  timestamp: Date;              // Generation timestamp
  generatorVersion: string;     // Tool version (e.g., "1.0.0")
  format: 'markdown' | 'html' | 'pdf';
  
  // Optional fields
  author?: string;              // From blueprint.template.metadata.author
  blueprintCreatedAt?: string;  // From blueprint.template.metadata.createdAt
  blueprintUpdatedAt?: string;  // From blueprint.template.metadata.updatedAt
}
```

### Timestamp Formatting

**ISO 8601 Format** (for `<time datetime>`):
```
2025-10-22T14:30:00.000Z
```

**Readable Format** (for display):
```
October 22, 2025 at 2:30 PM (UTC)
```

**Implementation**:
```typescript
function formatReadableTimestamp(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
    timeZoneName: 'short'
  };
  
  return date.toLocaleString('en-US', options);
}
```

---

## 🔧 Blob Download Utility

### Implementation

```typescript
function downloadBlob(blob: Blob, filename: string): void {
  // Create object URL
  const url = URL.createObjectURL(blob);
  
  // Create hidden anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  // Append to body, click, and cleanup
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
```

### Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 15+ | ✅ Full support |
| Firefox | 20+ | ✅ Full support |
| Safari | 10.1+ | ✅ Full support |
| Edge | 12+ | ✅ Full support |
| Opera | 15+ | ✅ Full support |

### Error Handling

```typescript
function downloadBlobSafe(blob: Blob, filename: string): boolean {
  try {
    downloadBlob(blob, filename);
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    
    // Fallback: Show save dialog with content
    showSaveDialog(blob, filename);
    return false;
  }
}

function showSaveDialog(blob: Blob, filename: string): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result;
    if (typeof content === 'string') {
      // Fallback: Copy to clipboard and notify user
      navigator.clipboard.writeText(content).then(() => {
        alert(`Failed to download file. Content copied to clipboard.\nSuggested filename: ${filename}`);
      });
    }
  };
  reader.readAsText(blob);
}
```

---

## 🧪 Export Flow Examples

### Example 1: Export Markdown

**Input**:
- Blueprint Name: "Customer Support Workflow"
- Audience: "leadership"
- Timestamp: 2025-10-22 14:30:00 UTC
- Content: 150 KB rendered markdown

**Process**:
1. Append metadata footer → 151 KB
2. Create Blob (text/markdown) → Success
3. Generate filename → `Customer_Support_Workflow-Leadership-20251022-1430.md`
4. Download → Browser saves file

**Output**:
- File: `Customer_Support_Workflow-Leadership-20251022-1430.md`
- Size: 151 KB
- Footer includes: Title, version, timestamp, generator

---

### Example 2: Export HTML

**Input**:
- Blueprint Name: "Data Processing Pipeline"
- Audience: "developer"
- Timestamp: 2025-10-22 09:15:00 UTC
- Content: 200 KB rendered HTML

**Process**:
1. Inline all CSS styles → 220 KB
2. Append metadata footer → 221 KB
3. Wrap in complete HTML document → 235 KB
4. Create Blob (text/html) → Success
5. Generate filename → `Data_Processing_Pipeline-Developer-20251022-0915.html`
6. Download → Browser saves file

**Output**:
- File: `Data_Processing_Pipeline-Developer-20251022-0915.html`
- Size: 235 KB
- Self-contained: ✅ No external dependencies
- Offline viewable: ✅ Opens in any browser

---

### Example 3: Export PDF

**Input**:
- Blueprint Name: "Compliance Review System"
- Audience: "audit"
- Timestamp: 2025-10-22 16:45:00 UTC
- Content: 180 KB rendered HTML

**Process**:
1. Inline print-optimized CSS → 200 KB
2. Append metadata footer → 201 KB
3. Wrap in print-friendly HTML → 215 KB
4. Open in new window → Success
5. Call window.print() → Print dialog opens
6. User saves as PDF → Browser suggests filename: `Compliance_Review_System-Audit-20251022-1645`

**Output**:
- User saves: `Compliance_Review_System-Audit-20251022-1645.pdf`
- Size: Depends on browser PDF engine (~100-300 KB)
- Quality: Vector graphics, high-resolution text
- A4 portrait with proper margins

---

## 🎯 Integration with ReportContext

### Context Interface Extension

```typescript
interface ReportContextValue {
  // ...existing properties...
  
  // Export methods
  exportMarkdown: () => void;
  exportHtml: () => void;
  exportPdf: () => void;
  
  // Generic export (uses current format)
  exportFile: () => void;
  
  // Export metadata
  exportMetadata: ExportMetadata | null;
  
  // Export state
  isExporting: boolean;
  exportError: string | null;
}
```

### Export Method Implementation

```typescript
// In ReportContext.tsx
const exportMarkdown = useCallback(() => {
  if (!renderedMarkdown || !blueprintMetadata) {
    setErrors(prev => ({ ...prev, export: 'No content to export' }));
    return;
  }
  
  setIsExporting(true);
  setErrors(prev => ({ ...prev, export: null }));
  
  try {
    const metadata: ExportMetadata = {
      blueprintName: blueprintMetadata.name,
      blueprintVersion: blueprintMetadata.version,
      blueprintId: blueprintMetadata.id,
      audience,
      timestamp: new Date(),
      generatorVersion: '1.0.0',
      format: 'markdown'
    };
    
    exportMarkdownFile(renderedMarkdown, metadata);
    
  } catch (error) {
    setErrors(prev => ({
      ...prev,
      export: `Export failed: ${error.message}`
    }));
  } finally {
    setIsExporting(false);
  }
}, [renderedMarkdown, blueprintMetadata, audience]);

const exportHtml = useCallback(() => {
  // Similar implementation for HTML
}, [renderedHtml, blueprintMetadata, audience]);

const exportPdf = useCallback(() => {
  // Similar implementation for PDF
}, [renderedHtml, blueprintMetadata, audience]);

const exportFile = useCallback(() => {
  // Use current format
  if (format === 'markdown') {
    exportMarkdown();
  } else if (format === 'html') {
    exportHtml();
  } else if (format === 'pdf') {
    exportPdf();
  }
}, [format, exportMarkdown, exportHtml, exportPdf]);
```

---

## ⚠️ Error Handling

### Export Errors

| Error Type | Cause | Recovery Strategy |
|------------|-------|-------------------|
| **NO_CONTENT** | No rendered content available | Show error, prompt user to generate report |
| **BLOB_CREATION_FAILED** | Browser Blob API unavailable | Fallback to copy-to-clipboard |
| **DOWNLOAD_BLOCKED** | Browser blocks download | Show instruction to allow downloads |
| **PRINT_DIALOG_BLOCKED** | Browser blocks window.print() | Show instruction to allow popups |
| **FILENAME_TOO_LONG** | Generated filename > 255 chars | Truncate blueprint name further |
| **METADATA_MISSING** | Required metadata unavailable | Use placeholder values |

### User Feedback

**Success State**:
```typescript
// Show toast notification
showToast({
  type: 'success',
  message: 'Report exported successfully!',
  duration: 3000
});
```

**Error State**:
```typescript
// Show error banner
setErrors(prev => ({
  ...prev,
  export: 'Failed to export report. Please try again.'
}));
```

---

## 📊 Export Metrics

### Tracking

```typescript
interface ExportMetrics {
  format: 'markdown' | 'html' | 'pdf';
  audience: AudienceType;
  fileSizeKB: number;
  exportTimeMs: number;
  success: boolean;
  errorType?: string;
}
```

### Performance Budget

- **Markdown Export**: <100ms
- **HTML Export**: <500ms (includes style inlining)
- **PDF Export**: <1s (includes window open + print dialog)

---

**Document Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** 📋 Design Complete - Ready for Implementation
