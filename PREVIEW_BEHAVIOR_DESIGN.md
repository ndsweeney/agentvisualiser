# Report Preview Behavior Design

## Overview

The Report Preview Panel displays generated reports with format-specific rendering, print layout simulation, and comprehensive accessibility features. All rendering happens client-side with no external dependencies.

---

## 📺 Preview Modes

### Markdown Preview

**Display Method**: Rendered to screen with syntax highlighting

**Rendering Strategy**:
```
Raw Markdown String
    ↓
1. Escape HTML entities
    ↓
2. Syntax highlight code blocks (JSON, etc.)
    ↓
3. Render in <pre> with monospace font
    ↓
4. Enable horizontal scroll if needed
    ↓
Display in preview container
```

**Characteristics**:
- ✅ Display raw markdown with formatting preserved
- ✅ Syntax highlighting for code blocks
- ✅ Monospace font for readability
- ✅ Line numbers (optional)
- ✅ Copy button always visible
- ✅ No print stylesheet applied

**Use Cases**:
- Copy markdown for paste into documentation
- Save as .md file for version control
- Visual inspection before HTML export
- Cross-platform compatibility verification

---

### HTML Preview

**Display Method**: Rendered HTML with print stylesheet simulation

**Rendering Strategy**:
```
Rendered HTML String
    ↓
1. Sanitize HTML (remove scripts, iframes, event handlers)
    ↓
2. Inject print stylesheet
    ↓
3. Apply page layout styles
    ↓
4. Render in iframe or sandboxed div
    ↓
Display with print layout simulation
```

**Characteristics**:
- ✅ Full HTML rendering with styles
- ✅ Print stylesheet always active in preview
- ✅ A4 portrait page simulation
- ✅ Page boundaries visible when "Print Layout" enabled
- ✅ Print-optimized styles (margins, page breaks, etc.)
- ✅ No color dependence (print-safe palette)

**Use Cases**:
- Preview print output before printing
- Export as standalone HTML
- Print directly from browser
- Generate PDF via print dialog

---

## 🖨️ Print Stylesheet Requirements

### Page Configuration

**Paper Size & Orientation**:
```css
@media print {
  @page {
    size: A4 portrait;
    margin: 20mm 15mm;  /* Top/Bottom: 20mm, Left/Right: 15mm */
  }
}
```

**Physical Dimensions**:
- **A4 Portrait**: 210mm × 297mm (8.27" × 11.69")
- **Content Area**: 180mm × 257mm (after margins)
- **Margin Space**: 20mm top/bottom, 15mm left/right

### Page Break Management

**Page Break Hints**:
```css
/* Avoid breaks after headings */
h1, h2, h3, h4, h5, h6 {
  page-break-after: avoid;
  break-after: avoid;
}

/* Avoid breaks before headings */
h1 {
  page-break-before: always;  /* Sections start on new page */
  break-before: always;
}

h2, h3 {
  page-break-before: avoid;
  break-before: avoid;
}

/* Keep content blocks together */
.agent-card,
.tool-card,
.gate-card,
.recommendation-block,
.kpi-section {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Keep table rows together */
tr {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Avoid orphans and widows */
p {
  orphans: 3;  /* Min lines at bottom of page */
  widows: 3;   /* Min lines at top of page */
}
```

**Strategic Break Points**:
- **Force break before**: Main section headers (h1)
- **Avoid break after**: All headings
- **Avoid break inside**: Cards, tables, code blocks
- **Avoid orphans/widows**: Paragraphs split across pages

### Color Independence

**Print-Safe Palette**:
```css
@media print {
  /* Convert colored backgrounds to borders/patterns */
  .info-banner,
  .warning-banner,
  .success-banner {
    background: transparent !important;
    border: 2px solid #000;
    border-left-width: 5px;
  }
  
  /* Use grayscale for emphasis */
  .highlight {
    background: transparent;
    border-bottom: 2px solid #333;
  }
  
  /* Ensure text is black */
  body {
    color: #000;
  }
  
  /* Light backgrounds become borders */
  .card-background {
    background: transparent;
    border: 1px solid #333;
  }
  
  /* Remove shadows */
  * {
    box-shadow: none !important;
    text-shadow: none !important;
  }
}
```

**Design Principles**:
- ✅ No color dependence for information
- ✅ Use borders instead of background colors
- ✅ Black text on white background
- ✅ Patterns/borders for distinction
- ✅ High contrast ratios (minimum 7:1)

### Print-Only Adjustments

**Hide Interactive Elements**:
```css
@media print {
  .no-print,
  button,
  .action-button,
  .copy-button,
  nav,
  .header-actions {
    display: none !important;
  }
}
```

**Optimize Typography**:
```css
@media print {
  body {
    font-size: 11pt;
    line-height: 1.5;
  }
  
  h1 { font-size: 18pt; }
  h2 { font-size: 16pt; }
  h3 { font-size: 14pt; }
  h4 { font-size: 12pt; }
  
  code {
    font-size: 9pt;
    font-family: 'Courier New', monospace;
  }
}
```

**Display URLs for Links**:
```css
@media print {
  a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
  }
}
```

---

## 📐 Print Layout Toggle

### Behavior

**Toggle OFF** (Default):
- Preview shows continuous scroll
- No page boundaries visible
- Full-width content
- Screen-optimized styles

**Toggle ON** (Print Layout):
- Preview shows paginated layout
- Page boundaries visible (A4 dimensions)
- Page margins visible
- Print stylesheet fully applied
- Shadow/border around each page

### Visual Changes

**Page Boundary Indicators**:
```css
/* When Print Layout is enabled */
.preview-container.print-layout {
  background: #e0e0e0;  /* Gray background for "desk" */
  padding: 2rem;
}

.preview-content.print-layout {
  /* Simulate A4 paper */
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto 2rem;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20mm 15mm;  /* Match print margins */
}

/* Page break indicators */
.preview-content.print-layout .page-break {
  position: relative;
  margin: 2rem 0;
}

.preview-content.print-layout .page-break::after {
  content: "Page Break";
  display: block;
  text-align: center;
  color: #999;
  font-size: 0.75rem;
  border-top: 2px dashed #ccc;
  padding-top: 0.5rem;
  margin: 1rem 0;
}
```

**Page Simulation**:
- Container width: 210mm (A4 width)
- Container min-height: 297mm (A4 height)
- Visual page shadows
- Gray "desk" background
- Margin guides (subtle lines)

---

## ♿ Accessibility Features

### Headings Hierarchy

**Semantic Structure**:
```html
<!-- Proper heading hierarchy -->
<h1>Blueprint Name - Report Type</h1>
  <h2>Executive Summary</h2>
    <h3>At a Glance</h3>
  <h2>Technical Architecture</h2>
    <h3>Agent Specifications</h3>
      <h4>Agent Name</h4>
        <h5>Configuration</h5>
```

**Requirements**:
- ✅ Single h1 per report (document title)
- ✅ No skipped heading levels
- ✅ Logical nesting (h2 → h3 → h4)
- ✅ Descriptive heading text
- ✅ Programmatically determinable structure

**ARIA Landmarks**:
```html
<main role="main" aria-label="Report Content">
  <section aria-labelledby="executive-summary">
    <h2 id="executive-summary">Executive Summary</h2>
    <!-- Content -->
  </section>
</main>
```

### Table Accessibility

**Table Captions**:
```html
<table>
  <caption>Workflow Agents Configuration Summary</caption>
  <thead>
    <tr>
      <th scope="col">Agent Name</th>
      <th scope="col">Tools</th>
      <th scope="col">Memory Type</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Agent 1</th>
      <td>Tool A, Tool B</td>
      <td>Ephemeral</td>
    </tr>
  </tbody>
</table>
```

**Requirements**:
- ✅ Every table has `<caption>` describing content
- ✅ Use `<th scope="col">` for column headers
- ✅ Use `<th scope="row">` for row headers
- ✅ Complex tables use `headers` attribute
- ✅ Summary attribute for additional context

### High Contrast Support

**Color Contrast Ratios**:
- **Normal text**: Minimum 7:1 (AAA level)
- **Large text**: Minimum 4.5:1 (AAA level)
- **UI components**: Minimum 3:1

**High Contrast Mode**:
```css
@media (prefers-contrast: high) {
  .report-container {
    background: #fff;
    color: #000;
  }
  
  h1, h2, h3, h4, h5, h6 {
    color: #000;
    font-weight: 700;
  }
  
  .card-border {
    border: 2px solid #000;
  }
  
  a {
    color: #0000ff;
    text-decoration: underline;
  }
  
  a:visited {
    color: #800080;
  }
  
  /* Ensure all interactive elements are visible */
  button, .interactive {
    border: 2px solid #000;
    background: #fff;
    color: #000;
  }
}
```

### Keyboard Navigation

**Focus Indicators**:
```css
button:focus,
a:focus,
[tabindex]:focus {
  outline: 3px solid #4A90E2;
  outline-offset: 2px;
}

/* High contrast focus */
@media (prefers-contrast: high) {
  *:focus {
    outline: 3px solid #000;
    outline-offset: 2px;
  }
}
```

**Logical Tab Order**:
1. Copy button
2. Print button
3. Export dropdown
4. Preview content (if interactive)

### Screen Reader Support

**ARIA Labels**:
```html
<button aria-label="Copy report to clipboard">Copy</button>
<button aria-label="Print report">Print</button>
<div role="region" aria-label="Report preview">
  <!-- Preview content -->
</div>
```

**Live Regions**:
```html
<!-- For status updates -->
<div role="status" aria-live="polite" aria-atomic="true">
  Report copied to clipboard
</div>

<div role="alert" aria-live="assertive">
  Error: Failed to generate report
</div>
```

**Alternative Text**:
- All images have descriptive alt text
- Decorative images use `alt=""`
- Icon buttons include aria-label

---

## 🎨 CSS Class Responsibilities

### Layout Classes

```
.preview-container          # Root container for entire preview panel
.preview-header             # Header with title and action buttons
.preview-content            # Main content area (scrollable)
.preview-footer             # Footer with metadata/status
.preview-actions            # Action button group container
.preview-scroll-area        # Scrollable region wrapper
```

### Print Layout Classes

```
.print-layout               # Applied to container when toggle ON
.page-boundary              # Visual page boundary indicator
.page-break                 # Explicit page break marker
.page-margin-guide          # Visual margin guides
.page-number                # Page number display
.print-header               # Header repeated on each page
.print-footer               # Footer repeated on each page
```

### Content Structure Classes

```
.report-container           # Main report content wrapper
.report-section             # Major section container
.report-subsection          # Subsection container
.section-header             # Section header wrapper
.section-content            # Section body content
.section-footer             # Section footer/metadata
```

### Card/Block Classes

```
.agent-card                 # Individual agent display card
.tool-card                  # Tool binding display card
.gate-card                  # Gate/control display card
.kpi-card                   # KPI metric card
.recommendation-block       # Recommendation list item
.metadata-block             # Metadata display block
.info-banner                # Informational banner
.warning-banner             # Warning message banner
.error-banner               # Error message banner
.success-banner             # Success message banner
```

### Typography Classes

```
.heading-main               # Main document heading (h1)
.heading-section            # Section heading (h2)
.heading-subsection         # Subsection heading (h3)
.heading-minor              # Minor heading (h4-h6)
.text-body                  # Body text styling
.text-emphasis              # Emphasized text
.text-muted                 # De-emphasized text
.text-code                  # Inline code styling
.text-monospace             # Monospace text
```

### Table Classes

```
.data-table                 # Main data table wrapper
.table-container            # Scrollable table container
.table-header               # Table header row styling
.table-cell                 # Table cell styling
.table-row-even             # Even row styling
.table-row-odd              # Odd row styling
.table-caption              # Table caption styling
.table-summary              # Table summary text
```

### Code Block Classes

```
.code-block                 # Code block container
.code-block-header          # Code block header (language label)
.code-block-content         # Actual code content
.code-line                  # Individual code line
.code-line-number           # Line number indicator
.code-highlight             # Highlighted code line
.syntax-keyword             # Syntax highlighting: keywords
.syntax-string              # Syntax highlighting: strings
.syntax-number              # Syntax highlighting: numbers
.syntax-comment             # Syntax highlighting: comments
```

### List Classes

```
.list-unordered             # Unordered list styling
.list-ordered               # Ordered list styling
.list-item                  # List item styling
.list-nested                # Nested list styling
.checklist                  # Checkbox list
.checklist-item             # Checkbox list item
.checklist-checked          # Checked item styling
```

### Action/Interactive Classes

```
.action-button              # Generic action button
.button-primary             # Primary action button
.button-secondary           # Secondary action button
.button-icon                # Icon-only button
.button-group               # Button group container
.dropdown-trigger           # Dropdown trigger button
.dropdown-menu              # Dropdown menu container
.dropdown-item              # Dropdown menu item
.tooltip-trigger            # Tooltip trigger element
.tooltip-content            # Tooltip content display
```

### Status/State Classes

```
.is-loading                 # Loading state
.is-error                   # Error state
.is-success                 # Success state
.is-disabled                # Disabled state
.is-active                  # Active state
.is-focused                 # Focus state
.is-visible                 # Visibility state
.is-hidden                  # Hidden state
```

### Accessibility Classes

```
.sr-only                    # Screen reader only (visually hidden)
.focus-visible              # Visible focus indicator
.skip-link                  # Skip to content link
.aria-hidden                # Hidden from screen readers
.high-contrast              # High contrast mode styling
.reduced-motion             # Reduced motion preference
```

### Print-Specific Classes

```
.print-only                 # Visible only when printing
.no-print                   # Hidden when printing
.print-break-before         # Force page break before
.print-break-after          # Force page break after
.print-avoid-break          # Avoid page break inside
.print-page-header          # Content for printed page header
.print-page-footer          # Content for printed page footer
```

### Utility Classes

```
.margin-top-{size}          # Margin top utilities
.margin-bottom-{size}       # Margin bottom utilities
.padding-{size}             # Padding utilities
.text-align-{position}      # Text alignment
.display-{type}             # Display type utilities
.flex-container             # Flexbox container
.grid-container             # Grid container
.overflow-scroll            # Scrollable overflow
.overflow-hidden            # Hidden overflow
.border-{side}              # Border utilities
.rounded-{size}             # Border radius utilities
```

### Theme/Style Classes

```
.theme-light                # Light theme styling
.theme-dark                 # Dark theme styling
.color-primary              # Primary color
.color-secondary            # Secondary color
.color-accent               # Accent color
.color-success              # Success color
.color-warning              # Warning color
.color-error                # Error color
.background-light           # Light background
.background-dark            # Dark background
.border-subtle              # Subtle border
.shadow-sm                  # Small shadow
.shadow-md                  # Medium shadow
.shadow-lg                  # Large shadow
```

---

## 🖥️ Preview Container Structure

### HTML Structure

```html
<div class="preview-container" data-format="html" data-print-layout="true">
  <!-- Header -->
  <div class="preview-header">
    <h2 class="heading-section">Report Preview</h2>
    <div class="preview-actions">
      <button class="action-button button-secondary" aria-label="Copy report to clipboard">
        Copy
      </button>
      <button class="action-button button-secondary" aria-label="Print report">
        Print
      </button>
      <div class="dropdown-trigger">
        <button class="action-button button-secondary" aria-label="Export report">
          Export
        </button>
        <!-- Dropdown menu -->
      </div>
    </div>
  </div>
  
  <!-- Print Layout Toggle -->
  <div class="preview-controls">
    <label class="toggle-control">
      <input type="checkbox" id="print-layout-toggle" />
      <span>Show Print Layout</span>
    </label>
  </div>
  
  <!-- Preview Content -->
  <div class="preview-scroll-area">
    <div class="preview-content print-layout">
      <main role="main" aria-label="Report content">
        <div class="report-container">
          <!-- Generated report content -->
        </div>
      </main>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="preview-footer">
    <span class="text-muted">Generated: October 22, 2025 at 3:45 PM</span>
    <span class="text-muted">Size: 125 KB</span>
  </div>
  
  <!-- Status/Alert Region -->
  <div role="status" aria-live="polite" class="sr-only">
    <!-- Screen reader announcements -->
  </div>
</div>
```

---

## 📊 Preview State Management

### State Properties

```typescript
interface PreviewState {
  // Content
  content: string;
  format: 'markdown' | 'html';
  
  // Layout
  printLayout: boolean;
  pageBreaksVisible: boolean;
  
  // Actions
  canCopy: boolean;
  canPrint: boolean;
  canExport: boolean;
  
  // Status
  isLoading: boolean;
  error: string | null;
  
  // Metadata
  contentSize: number;
  generatedAt: string;
}
```

### State Transitions

```
Initial State
    ↓
Content Loaded → Enable actions
    ↓
Print Layout Toggle → Update container classes
    ↓
Copy Action → Show success feedback
    ↓
Print Action → Open print dialog
    ↓
Export Action → Download file
```

---

## 🎭 Responsive Behavior

### Breakpoints

```css
/* Mobile: < 768px */
@media (max-width: 767px) {
  .preview-container {
    padding: 1rem;
  }
  
  .preview-actions {
    flex-direction: column;
  }
  
  .print-layout .preview-content {
    width: 100%;  /* Full width on mobile */
  }
}

/* Tablet: 768px - 1024px */
@media (min-width: 768px) and (max-width: 1024px) {
  .preview-content.print-layout {
    width: 180mm;  /* Slightly smaller */
  }
}

/* Desktop: > 1024px */
@media (min-width: 1025px) {
  .preview-content.print-layout {
    width: 210mm;  /* Full A4 width */
  }
}
```

---

## ⚡ Performance Optimizations

### Rendering Strategy

1. **Virtual Scrolling**: For large reports (>500 sections)
2. **Lazy Loading**: Load images/charts on scroll
3. **Debounced Updates**: 100ms debounce on print layout toggle
4. **Memoized Rendering**: Cache rendered HTML elements

### Memory Management

- Limit preview history to 3 reports
- Clear rendered content on navigation
- Use CSS containment for isolation
- Optimize shadow DOM usage

---

## 🧪 Testing Requirements

### Visual Tests

- [ ] Markdown preview displays correctly
- [ ] HTML preview applies print stylesheet
- [ ] Print layout toggle shows page boundaries
- [ ] Page breaks appear in correct locations
- [ ] Colors are print-safe (no color dependence)
- [ ] High contrast mode works correctly

### Accessibility Tests

- [ ] Heading hierarchy is correct
- [ ] All tables have captions
- [ ] Focus indicators are visible
- [ ] Screen reader navigation works
- [ ] Keyboard shortcuts function
- [ ] ARIA labels are present

### Print Tests

- [ ] A4 portrait page size respected
- [ ] Margins are correct (20mm/15mm)
- [ ] Page breaks avoid splitting content
- [ ] Interactive elements hidden
- [ ] URLs displayed for links
- [ ] Print preview matches actual print

---

**Document Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** 📋 Design Complete - Ready for Implementation
