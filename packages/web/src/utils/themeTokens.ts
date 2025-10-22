/**
 * Theme Token Injection System
 * 
 * Provides runtime token injection for report theming, allowing dynamic
 * customization of typography, spacing, colors, and print behavior.
 */

export interface ThemeTokens {
  // Typography Scale
  typography: {
    fontFamily: {
      sans: string;
      serif: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    lineHeight: {
      tight: string;
      normal: string;
      relaxed: string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };

  // Spacing Scale
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };

  // Table Density
  table: {
    density: 'compact' | 'normal' | 'comfortable';
    cellPadding: string;
    rowHeight: string;
    borderWidth: string;
  };

  // Heading Hierarchy
  headings: {
    h1: { fontSize: string; lineHeight: string; fontWeight: string; marginTop: string; marginBottom: string };
    h2: { fontSize: string; lineHeight: string; fontWeight: string; marginTop: string; marginBottom: string };
    h3: { fontSize: string; lineHeight: string; fontWeight: string; marginTop: string; marginBottom: string };
    h4: { fontSize: string; lineHeight: string; fontWeight: string; marginTop: string; marginBottom: string };
    h5: { fontSize: string; lineHeight: string; fontWeight: string; marginTop: string; marginBottom: string };
    h6: { fontSize: string; lineHeight: string; fontWeight: string; marginTop: string; marginBottom: string };
  };

  // Color Palette (with monochrome-friendly alternatives)
  colors: {
    mode: 'color' | 'monochrome';
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    border: {
      light: string;
      medium: string;
      dark: string;
    };
  };

  // Print Behavior
  print: {
    margins: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
    pageBreak: {
      before: string[]; // CSS selectors
      after: string[];
      inside: 'auto' | 'avoid';
    };
    orphans: number;
    widows: number;
  };
}

// Default theme tokens
export const defaultThemeTokens: ThemeTokens = {
  typography: {
    fontFamily: {
      sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
      mono: '"Courier New", Courier, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
    '4xl': '6rem',  // 96px
  },

  table: {
    density: 'normal',
    cellPadding: '0.75rem',
    rowHeight: 'auto',
    borderWidth: '1px',
  },

  headings: {
    h1: {
      fontSize: '2.25rem',
      lineHeight: '1.25',
      fontWeight: '700',
      marginTop: '0',
      marginBottom: '1.5rem',
    },
    h2: {
      fontSize: '1.875rem',
      lineHeight: '1.25',
      fontWeight: '600',
      marginTop: '2rem',
      marginBottom: '1rem',
    },
    h3: {
      fontSize: '1.5rem',
      lineHeight: '1.35',
      fontWeight: '600',
      marginTop: '1.5rem',
      marginBottom: '0.75rem',
    },
    h4: {
      fontSize: '1.25rem',
      lineHeight: '1.4',
      fontWeight: '600',
      marginTop: '1.25rem',
      marginBottom: '0.5rem',
    },
    h5: {
      fontSize: '1.125rem',
      lineHeight: '1.5',
      fontWeight: '600',
      marginTop: '1rem',
      marginBottom: '0.5rem',
    },
    h6: {
      fontSize: '1rem',
      lineHeight: '1.5',
      fontWeight: '600',
      marginTop: '1rem',
      marginBottom: '0.5rem',
    },
  },

  colors: {
    mode: 'color',
    primary: '#3b82f6',
    secondary: '#6366f1',
    accent: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
      muted: '#9ca3af',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
    },
    border: {
      light: '#e5e7eb',
      medium: '#d1d5db',
      dark: '#9ca3af',
    },
  },

  print: {
    margins: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in',
    },
    pageBreak: {
      before: ['.page-break-before', 'h1'],
      after: ['.page-break-after'],
      inside: 'avoid',
    },
    orphans: 3,
    widows: 3,
  },
};

// Monochrome palette for accessible printing
export const monochromeTokens: Partial<ThemeTokens> = {
  colors: {
    mode: 'monochrome',
    primary: '#1f2937',
    secondary: '#374151',
    accent: '#4b5563',
    success: '#1f2937',
    warning: '#6b7280',
    error: '#000000',
    info: '#4b5563',
    text: {
      primary: '#000000',
      secondary: '#374151',
      muted: '#6b7280',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
    },
    border: {
      light: '#e5e7eb',
      medium: '#9ca3af',
      dark: '#4b5563',
    },
  },
};

// Table density presets
export const tableDensityPresets = {
  compact: {
    cellPadding: '0.375rem',
    rowHeight: '2rem',
    borderWidth: '1px',
  },
  normal: {
    cellPadding: '0.75rem',
    rowHeight: 'auto',
    borderWidth: '1px',
  },
  comfortable: {
    cellPadding: '1rem',
    rowHeight: 'auto',
    borderWidth: '1px',
  },
};

/**
 * Inject theme tokens into the document as CSS custom properties
 */
export function injectThemeTokens(tokens: ThemeTokens, targetElement?: HTMLElement): void {
  const root = targetElement || document.documentElement;

  // Typography
  root.style.setProperty('--font-sans', tokens.typography.fontFamily.sans);
  root.style.setProperty('--font-serif', tokens.typography.fontFamily.serif);
  root.style.setProperty('--font-mono', tokens.typography.fontFamily.mono);

  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    root.style.setProperty(`--text-${key}`, value);
  });

  Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
    root.style.setProperty(`--leading-${key}`, value);
  });

  Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
    root.style.setProperty(`--font-${key}`, value);
  });

  // Spacing
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value);
  });

  // Table
  root.style.setProperty('--table-cell-padding', tokens.table.cellPadding);
  root.style.setProperty('--table-row-height', tokens.table.rowHeight);
  root.style.setProperty('--table-border-width', tokens.table.borderWidth);

  // Headings
  Object.entries(tokens.headings).forEach(([heading, styles]) => {
    Object.entries(styles).forEach(([property, value]) => {
      const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${heading}-${cssProperty}`, value);
    });
  });

  // Colors
  root.style.setProperty('--color-primary', tokens.colors.primary);
  root.style.setProperty('--color-secondary', tokens.colors.secondary);
  root.style.setProperty('--color-accent', tokens.colors.accent);
  root.style.setProperty('--color-success', tokens.colors.success);
  root.style.setProperty('--color-warning', tokens.colors.warning);
  root.style.setProperty('--color-error', tokens.colors.error);
  root.style.setProperty('--color-info', tokens.colors.info);

  root.style.setProperty('--color-text-primary', tokens.colors.text.primary);
  root.style.setProperty('--color-text-secondary', tokens.colors.text.secondary);
  root.style.setProperty('--color-text-muted', tokens.colors.text.muted);

  root.style.setProperty('--color-bg-primary', tokens.colors.background.primary);
  root.style.setProperty('--color-bg-secondary', tokens.colors.background.secondary);
  root.style.setProperty('--color-bg-tertiary', tokens.colors.background.tertiary);

  root.style.setProperty('--color-border-light', tokens.colors.border.light);
  root.style.setProperty('--color-border-medium', tokens.colors.border.medium);
  root.style.setProperty('--color-border-dark', tokens.colors.border.dark);

  // Print
  root.style.setProperty('--print-margin-top', tokens.print.margins.top);
  root.style.setProperty('--print-margin-right', tokens.print.margins.right);
  root.style.setProperty('--print-margin-bottom', tokens.print.margins.bottom);
  root.style.setProperty('--print-margin-left', tokens.print.margins.left);
}

/**
 * Generate a style tag with theme tokens
 * Useful for injecting into iframes or shadow DOM
 */
export function generateThemeStyleTag(tokens: ThemeTokens): string {
  const cssVars: string[] = [];

  // Typography
  cssVars.push(`--font-sans: ${tokens.typography.fontFamily.sans};`);
  cssVars.push(`--font-serif: ${tokens.typography.fontFamily.serif};`);
  cssVars.push(`--font-mono: ${tokens.typography.fontFamily.mono};`);

  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    cssVars.push(`--text-${key}: ${value};`);
  });

  Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
    cssVars.push(`--leading-${key}: ${value};`);
  });

  Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
    cssVars.push(`--font-${key}: ${value};`);
  });

  // Spacing
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars.push(`--spacing-${key}: ${value};`);
  });

  // Table
  cssVars.push(`--table-cell-padding: ${tokens.table.cellPadding};`);
  cssVars.push(`--table-row-height: ${tokens.table.rowHeight};`);
  cssVars.push(`--table-border-width: ${tokens.table.borderWidth};`);

  // Headings
  Object.entries(tokens.headings).forEach(([heading, styles]) => {
    Object.entries(styles).forEach(([property, value]) => {
      const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      cssVars.push(`--${heading}-${cssProperty}: ${value};`);
    });
  });

  // Colors
  cssVars.push(`--color-primary: ${tokens.colors.primary};`);
  cssVars.push(`--color-secondary: ${tokens.colors.secondary};`);
  cssVars.push(`--color-accent: ${tokens.colors.accent};`);
  cssVars.push(`--color-success: ${tokens.colors.success};`);
  cssVars.push(`--color-warning: ${tokens.colors.warning};`);
  cssVars.push(`--color-error: ${tokens.colors.error};`);
  cssVars.push(`--color-info: ${tokens.colors.info};`);

  cssVars.push(`--color-text-primary: ${tokens.colors.text.primary};`);
  cssVars.push(`--color-text-secondary: ${tokens.colors.text.secondary};`);
  cssVars.push(`--color-text-muted: ${tokens.colors.text.muted};`);

  cssVars.push(`--color-bg-primary: ${tokens.colors.background.primary};`);
  cssVars.push(`--color-bg-secondary: ${tokens.colors.background.secondary};`);
  cssVars.push(`--color-bg-tertiary: ${tokens.colors.background.tertiary};`);

  cssVars.push(`--color-border-light: ${tokens.colors.border.light};`);
  cssVars.push(`--color-border-medium: ${tokens.colors.border.medium};`);
  cssVars.push(`--color-border-dark: ${tokens.colors.border.dark};`);

  // Print
  cssVars.push(`--print-margin-top: ${tokens.print.margins.top};`);
  cssVars.push(`--print-margin-right: ${tokens.print.margins.right};`);
  cssVars.push(`--print-margin-bottom: ${tokens.print.margins.bottom};`);
  cssVars.push(`--print-margin-left: ${tokens.print.margins.left};`);

  // Generate page break rules
  const pageBreakRules: string[] = [];
  
  if (tokens.print.pageBreak.before.length > 0) {
    pageBreakRules.push(`
      ${tokens.print.pageBreak.before.join(', ')} {
        page-break-before: always;
        break-before: page;
      }
    `);
  }

  if (tokens.print.pageBreak.after.length > 0) {
    pageBreakRules.push(`
      ${tokens.print.pageBreak.after.join(', ')} {
        page-break-after: always;
        break-after: page;
      }
    `);
  }

  pageBreakRules.push(`
    table, figure, img {
      page-break-inside: ${tokens.print.pageBreak.inside};
      break-inside: ${tokens.print.pageBreak.inside};
    }
  `);

  return `
    <style>
      :root {
        ${cssVars.join('\n        ')}
      }

      @media print {
        @page {
          margin: ${tokens.print.margins.top} ${tokens.print.margins.right} ${tokens.print.margins.bottom} ${tokens.print.margins.left};
        }

        body {
          orphans: ${tokens.print.orphans};
          widows: ${tokens.print.widows};
        }

        ${pageBreakRules.join('\n        ')}
      }
    </style>
  `;
}

/**
 * Merge partial theme tokens with defaults
 */
export function mergeThemeTokens(
  base: ThemeTokens,
  overrides: Partial<ThemeTokens>
): ThemeTokens {
  return {
    typography: {
      ...base.typography,
      ...overrides.typography,
      fontFamily: {
        ...base.typography.fontFamily,
        ...overrides.typography?.fontFamily,
      },
      fontSize: {
        ...base.typography.fontSize,
        ...overrides.typography?.fontSize,
      },
      lineHeight: {
        ...base.typography.lineHeight,
        ...overrides.typography?.lineHeight,
      },
      fontWeight: {
        ...base.typography.fontWeight,
        ...overrides.typography?.fontWeight,
      },
    },
    spacing: {
      ...base.spacing,
      ...overrides.spacing,
    },
    table: {
      ...base.table,
      ...overrides.table,
    },
    headings: {
      ...base.headings,
      ...overrides.headings,
    },
    colors: {
      ...base.colors,
      ...overrides.colors,
      text: {
        ...base.colors.text,
        ...overrides.colors?.text,
      },
      background: {
        ...base.colors.background,
        ...overrides.colors?.background,
      },
      border: {
        ...base.colors.border,
        ...overrides.colors?.border,
      },
    },
    print: {
      ...base.print,
      ...overrides.print,
      margins: {
        ...base.print.margins,
        ...overrides.print?.margins,
      },
      pageBreak: {
        ...base.print.pageBreak,
        ...overrides.print?.pageBreak,
      },
    },
  };
}

/**
 * Apply table density preset
 */
export function applyTableDensity(
  tokens: ThemeTokens,
  density: 'compact' | 'normal' | 'comfortable'
): ThemeTokens {
  return {
    ...tokens,
    table: {
      ...tokens.table,
      density,
      ...tableDensityPresets[density],
    },
  };
}

/**
 * Switch between color and monochrome modes
 */
export function toggleColorMode(tokens: ThemeTokens): ThemeTokens {
  if (tokens.colors.mode === 'color') {
    return mergeThemeTokens(tokens, monochromeTokens);
  }
  // Restore color mode (would need to store original colors)
  return mergeThemeTokens(tokens, { colors: defaultThemeTokens.colors });
}

// High-Contrast Print Mode (WCAG AAA compliant)
export const highContrastPrintTokens: Partial<ThemeTokens> = {
  colors: {
    mode: 'monochrome',
    primary: '#000000',
    secondary: '#000000',
    accent: '#000000',
    success: '#000000',
    warning: '#000000',
    error: '#000000',
    info: '#000000',
    text: {
      primary: '#000000',
      secondary: '#000000',
      muted: '#333333',
    },
    background: {
      primary: '#ffffff',
      secondary: '#ffffff',
      tertiary: '#f5f5f5',
    },
    border: {
      light: '#cccccc',
      medium: '#666666',
      dark: '#000000',
    },
  },
};

/**
 * Dynamic Token System for Export-Time Injection
 * Allows placeholders like {{BrandName}}, {{FooterNote}}, {{Date}}, etc.
 */
export interface DynamicTokens {
  BrandName?: string;
  FooterNote?: string;
  ReportTitle?: string;
  ReportDate?: string;
  Author?: string;
  Version?: string;
  DocumentNumber?: string;
  Department?: string;
  CompanyLogo?: string; // URL or base64
  WatermarkText?: string;
  PageNumberFormat?: string; // e.g., "Page {page} of {total}"
  [key: string]: string | undefined; // Allow custom tokens
}

export const defaultDynamicTokens: DynamicTokens = {
  BrandName: 'AgentFactory',
  FooterNote: 'Generated by AgentFactory Report System',
  ReportTitle: 'Untitled Report',
  ReportDate: new Date().toLocaleDateString(),
  Author: '',
  Version: '1.0',
  DocumentNumber: '',
  Department: '',
  CompanyLogo: '',
  WatermarkText: '',
  PageNumberFormat: 'Page {page} of {total}',
};

/**
 * Replace token placeholders in HTML content
 * Supports both {{token}} and {token} syntax
 */
export function injectDynamicTokens(
  htmlContent: string,
  tokens: DynamicTokens
): string {
  let result = htmlContent;

  Object.entries(tokens).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Replace {{token}} syntax
      const doubleBraceRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(doubleBraceRegex, value);

      // Replace {token} syntax
      const singleBraceRegex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(singleBraceRegex, value);
    }
  });

  return result;
}

/**
 * Extract token placeholders from HTML content
 * Returns a list of all unique tokens found
 */
export function extractTokenPlaceholders(htmlContent: string): string[] {
  const doubleBraceMatches = htmlContent.match(/\{\{([^}]+)\}\}/g) || [];
  const singleBraceMatches = htmlContent.match(/\{([^}]+)\}/g) || [];

  const tokens = new Set<string>();

  doubleBraceMatches.forEach((match: string) => {
    const token = match.replace(/\{\{|\}\}/g, '');
    tokens.add(token);
  });

  singleBraceMatches.forEach((match: string) => {
    const token = match.replace(/\{|\}/g, '');
    // Only add if it looks like a token (not CSS or other syntax)
    if (/^[A-Z][a-zA-Z0-9_]*$/.test(token)) {
      tokens.add(token);
    }
  });

  return Array.from(tokens);
}

/**
 * Apply High-Contrast Print mode
 */
export function applyHighContrastPrint(tokens: ThemeTokens): ThemeTokens {
  return mergeThemeTokens(tokens, highContrastPrintTokens);
}

/**
 * Export Configuration with Theme and Dynamic Tokens
 */
export interface ExportConfiguration {
  theme: ThemeTokens;
  dynamicTokens: DynamicTokens;
  highContrastPrint: boolean;
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  includeHeaderFooter: boolean;
  watermark?: {
    text: string;
    opacity: number;
    rotation: number;
  };
}

export const defaultExportConfiguration: ExportConfiguration = {
  theme: defaultThemeTokens,
  dynamicTokens: defaultDynamicTokens,
  highContrastPrint: false,
  includeTableOfContents: false,
  includePageNumbers: true,
  includeHeaderFooter: true,
};

/**
 * Generate complete HTML with theme and tokens injected
 */
export function generateExportHTML(
  contentHTML: string,
  config: ExportConfiguration
): string {
  // Apply high contrast if enabled
  const finalTheme = config.highContrastPrint
    ? applyHighContrastPrint(config.theme)
    : config.theme;

  // Inject dynamic tokens
  const processedContent = injectDynamicTokens(contentHTML, config.dynamicTokens);

  // Generate theme styles
  const themeStyles = generateThemeStyleTag(finalTheme);

  // Generate header/footer if enabled
  const headerFooter = config.includeHeaderFooter
    ? generateHeaderFooterHTML(config.dynamicTokens)
    : '';

  // Generate page numbers if enabled
  const pageNumberStyles = config.includePageNumbers
    ? generatePageNumberStyles(config.dynamicTokens.PageNumberFormat || 'Page {page}')
    : '';

  // Generate watermark if configured
  const watermarkStyles = config.watermark
    ? generateWatermarkStyles(config.watermark)
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.dynamicTokens.ReportTitle || 'Report'}</title>
  ${themeStyles}
  ${pageNumberStyles}
  ${watermarkStyles}
  <style>
    /* Base document styles */
    body {
      font-family: var(--font-sans);
      font-size: var(--text-base);
      line-height: var(--leading-normal);
      color: var(--color-text-primary);
      background-color: var(--color-bg-primary);
      margin: 0;
      padding: var(--spacing-lg);
    }

    /* Heading styles */
    h1 {
      font-size: var(--h1-font-size);
      line-height: var(--h1-line-height);
      font-weight: var(--h1-font-weight);
      margin-top: var(--h1-margin-top);
      margin-bottom: var(--h1-margin-bottom);
    }

    h2 {
      font-size: var(--h2-font-size);
      line-height: var(--h2-line-height);
      font-weight: var(--h2-font-weight);
      margin-top: var(--h2-margin-top);
      margin-bottom: var(--h2-margin-bottom);
    }

    h3 {
      font-size: var(--h3-font-size);
      line-height: var(--h3-line-height);
      font-weight: var(--h3-font-weight);
      margin-top: var(--h3-margin-top);
      margin-bottom: var(--h3-margin-bottom);
    }

    h4 {
      font-size: var(--h4-font-size);
      line-height: var(--h4-line-height);
      font-weight: var(--h4-font-weight);
      margin-top: var(--h4-margin-top);
      margin-bottom: var(--h4-margin-bottom);
    }

    h5 {
      font-size: var(--h5-font-size);
      line-height: var(--h5-line-height);
      font-weight: var(--h5-font-weight);
      margin-top: var(--h5-margin-top);
      margin-bottom: var(--h5-margin-bottom);
    }

    h6 {
      font-size: var(--h6-font-size);
      line-height: var(--h6-line-height);
      font-weight: var(--h6-font-weight);
      margin-top: var(--h6-margin-top);
      margin-bottom: var(--h6-margin-bottom);
    }

    /* Table styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: var(--spacing-lg) 0;
      border: var(--table-border-width) solid var(--color-border-medium);
    }

    th, td {
      padding: var(--table-cell-padding);
      text-align: left;
      border: var(--table-border-width) solid var(--color-border-light);
    }

    th {
      background-color: var(--color-bg-secondary);
      font-weight: var(--font-semibold);
    }

    tr:nth-child(even) {
      background-color: var(--color-bg-secondary);
    }

    /* Print-specific styles */
    @media print {
      body {
        padding: 0;
      }

      a {
        color: var(--color-text-primary);
        text-decoration: none;
      }

      a[href]:after {
        content: " (" attr(href) ")";
        font-size: var(--text-sm);
        color: var(--color-text-muted);
      }
    }
  </style>
</head>
<body>
  ${headerFooter}
  <main>
    ${processedContent}
  </main>
</body>
</html>
  `.trim();
}

/**
 * Generate header/footer HTML for print
 */
function generateHeaderFooterHTML(tokens: DynamicTokens): string {
  return `
    <style>
      @media print {
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) 0;
          border-bottom: 2px solid var(--color-border-dark);
          margin-bottom: var(--spacing-lg);
        }

        .print-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) 0;
          border-top: 1px solid var(--color-border-medium);
          margin-top: var(--spacing-lg);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }
      }

      @media screen {
        .print-header, .print-footer {
          display: none;
        }
      }
    </style>

    <header class="print-header">
      <div class="header-left">
        ${tokens.CompanyLogo ? `<img src="${tokens.CompanyLogo}" alt="Logo" style="height: 40px;">` : ''}
        <strong>${tokens.BrandName || ''}</strong>
      </div>
      <div class="header-right">
        ${tokens.ReportTitle || ''}
      </div>
    </header>

    <footer class="print-footer">
      <div class="footer-left">
        ${tokens.FooterNote || ''}
      </div>
      <div class="footer-right">
        ${tokens.ReportDate || ''}
      </div>
    </footer>
  `;
}

/**
 * Generate page number styles
 */
function generatePageNumberStyles(format: string): string {
  return `
    <style>
      @media print {
        @page {
          @bottom-center {
            content: "${format.replace('{page}', '" counter(page) "').replace('{total}', '" counter(pages) "') }";
            font-size: var(--text-sm);
            color: var(--color-text-muted);
          }
        }
      }
    </style>
  `;
}

/**
 * Generate watermark styles
 */
function generateWatermarkStyles(watermark: { text: string; opacity: number; rotation: number }): string {
  return `
    <style>
      @media print {
        body::before {
          content: "${watermark.text}";
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(${watermark.rotation}deg);
          font-size: 120px;
          font-weight: bold;
          color: var(--color-text-muted);
          opacity: ${watermark.opacity};
          z-index: -1;
          pointer-events: none;
        }
      }
    </style>
  `;
}
