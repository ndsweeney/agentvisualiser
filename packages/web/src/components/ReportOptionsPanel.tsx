import React, { useState } from 'react';
import { useReport } from '../contexts/ReportContext';
import {
  ExportConfiguration,
  DynamicTokens,
  defaultExportConfiguration,
  defaultDynamicTokens,
  extractTokenPlaceholders,
} from '../utils/themeTokens';

interface ReportOptionsPanelProps {
  onConfigChange?: (config: ExportConfiguration) => void;
  reportContent?: string;
}

export function ReportOptionsPanel({ onConfigChange, reportContent }: ReportOptionsPanelProps) {
  const { audience, format, includeKpis, printLayout, setAudience, setFormat, toggleKpis, togglePrintLayout } = useReport();
  const [config, setConfig] = useState<ExportConfiguration>(defaultExportConfiguration);
  const [detectedTokens, setDetectedTokens] = useState<string[]>([]);

  // Detect tokens in report content
  React.useEffect(() => {
    if (reportContent) {
      const tokens = extractTokenPlaceholders(reportContent);
      setDetectedTokens(tokens);
    }
  }, [reportContent]);

  const updateConfig = (updates: Partial<ExportConfiguration>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const updateDynamicToken = (key: string, value: string) => {
    const newTokens = { ...config.dynamicTokens, [key]: value };
    updateConfig({ dynamicTokens: newTokens });
  };

  return (
    <section
      className="flex flex-col h-full bg-white border-r border-gray-200"
      role="region"
      aria-label="Report Options Panel"
    >
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Options</h2>
        <p className="text-sm text-gray-600 mt-1">Configure report settings</p>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Audience Selection */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-3">
            Target Audience
          </legend>
          <div className="space-y-2">
            <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="radio"
                name="audience"
                value="leadership"
                checked={audience === 'leadership'}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                aria-label="Leadership audience"
              />
              <div className="ml-3">
                <span className="block font-medium text-gray-900">Leadership</span>
                <span className="block text-xs text-gray-600">High-level overview</span>
              </div>
            </label>

            <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="radio"
                name="audience"
                value="developer"
                checked={audience === 'developer'}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                aria-label="Developer audience"
              />
              <div className="ml-3">
                <span className="block font-medium text-gray-900">Developer</span>
                <span className="block text-xs text-gray-600">Technical details</span>
              </div>
            </label>

            <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="radio"
                name="audience"
                value="audit"
                checked={audience === 'audit'}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                aria-label="Audit audience"
              />
              <div className="ml-3">
                <span className="block font-medium text-gray-900">Audit</span>
                <span className="block text-xs text-gray-600">Compliance focus</span>
              </div>
            </label>

            <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="radio"
                name="audience"
                value="comprehensive"
                checked={audience === 'comprehensive'}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                aria-label="Comprehensive audience"
              />
              <div className="ml-3">
                <span className="block font-medium text-gray-900">Comprehensive</span>
                <span className="block text-xs text-gray-600">Everything</span>
              </div>
            </label>
          </div>
        </fieldset>

        {/* Format Selection */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-3">
            Output Format
          </legend>
          <div className="space-y-2">
            <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="radio"
                name="format"
                value="markdown"
                checked={format === 'markdown'}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                aria-label="Markdown format"
              />
              <div className="ml-3">
                <span className="block font-medium text-gray-900">Markdown</span>
                <span className="block text-xs text-gray-600">.md file</span>
              </div>
            </label>

            <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="radio"
                name="format"
                value="html"
                checked={format === 'html'}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                aria-label="HTML format"
              />
              <div className="ml-3">
                <span className="block font-medium text-gray-900">HTML</span>
                <span className="block text-xs text-gray-600">.html file</span>
              </div>
            </label>

            <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={format === 'pdf'}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                aria-label="PDF format"
              />
              <div className="ml-3">
                <span className="block font-medium text-gray-900">PDF</span>
                <span className="block text-xs text-gray-600">Print to PDF</span>
              </div>
            </label>
          </div>
        </fieldset>

        {/* Toggles */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-3">
            Additional Options
          </legend>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <span className="block font-medium text-gray-900">Include KPIs</span>
                <span className="block text-xs text-gray-600">Metrics and counts</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={includeKpis}
                onClick={toggleKpis}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  includeKpis ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-label="Toggle include KPIs"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeKpis ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <span className="block font-medium text-gray-900">Print Layout</span>
                <span className="block text-xs text-gray-600">Optimized for printing</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={printLayout}
                onClick={togglePrintLayout}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  printLayout ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-label="Toggle print layout"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    printLayout ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </fieldset>

        {/* Export Options */}
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Export Options</h3>

            {/* High-Contrast Print Mode */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.highContrastPrint}
                    onChange={(e) => updateConfig({ highContrastPrint: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="font-medium">High-Contrast Print Mode</span>
                </label>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                Converts all colors to monochrome for better print clarity and accessibility (WCAG AAA)
              </p>
            </div>

            {/* Other Print Options */}
            <div className="mt-4 space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includePageNumbers}
                  onChange={(e) => updateConfig({ includePageNumbers: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span>Include Page Numbers</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeHeaderFooter}
                  onChange={(e) => updateConfig({ includeHeaderFooter: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span>Include Header/Footer</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeTableOfContents}
                  onChange={(e) => updateConfig({ includeTableOfContents: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span>Include Table of Contents</span>
              </label>
            </div>
          </div>

          {/* Dynamic Tokens Section */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Document Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={config.dynamicTokens.BrandName || ''}
                  onChange={(e) => updateDynamicToken('BrandName', e.target.value)}
                  placeholder="{{BrandName}}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  value={config.dynamicTokens.ReportTitle || ''}
                  onChange={(e) => updateDynamicToken('ReportTitle', e.target.value)}
                  placeholder="{{ReportTitle}}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={config.dynamicTokens.Author || ''}
                  onChange={(e) => updateDynamicToken('Author', e.target.value)}
                  placeholder="{{Author}}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Date
                </label>
                <input
                  type="text"
                  value={config.dynamicTokens.ReportDate || ''}
                  onChange={(e) => updateDynamicToken('ReportDate', e.target.value)}
                  placeholder="{{ReportDate}}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Footer Note
                </label>
                <input
                  type="text"
                  value={config.dynamicTokens.FooterNote || ''}
                  onChange={(e) => updateDynamicToken('FooterNote', e.target.value)}
                  placeholder="{{FooterNote}}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={config.dynamicTokens.Version || ''}
                  onChange={(e) => updateDynamicToken('Version', e.target.value)}
                  placeholder="{{Version}}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Number
                </label>
                <input
                  type="text"
                  value={config.dynamicTokens.DocumentNumber || ''}
                  onChange={(e) => updateDynamicToken('DocumentNumber', e.target.value)}
                  placeholder="{{DocumentNumber}}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={config.dynamicTokens.Department || ''}
                  onChange={(e) => updateDynamicToken('Department', e.target.value)}
                  placeholder="{{Department}}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Logo URL
                </label>
                <input
                  type="text"
                  value={config.dynamicTokens.CompanyLogo || ''}
                  onChange={(e) => updateDynamicToken('CompanyLogo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Watermark Section */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Watermark (Optional)</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={config.watermark?.text || ''}
                  onChange={(e) =>
                    updateConfig({
                      watermark: {
                        text: e.target.value,
                        opacity: config.watermark?.opacity || 0.1,
                        rotation: config.watermark?.rotation || -45,
                      },
                    })
                  }
                  placeholder="CONFIDENTIAL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {config.watermark?.text && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opacity: {config.watermark.opacity}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.watermark.opacity}
                      onChange={(e) =>
                        updateConfig({
                          watermark: {
                            ...config.watermark!,
                            opacity: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rotation: {config.watermark.rotation}°
                    </label>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="5"
                      value={config.watermark.rotation}
                      onChange={(e) =>
                        updateConfig({
                          watermark: {
                            ...config.watermark!,
                            rotation: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Detected Tokens Info */}
          {detectedTokens.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Detected Tokens in Report</h4>
              <div className="flex flex-wrap gap-2">
                {detectedTokens.map((token) => (
                  <span
                    key={token}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono"
                  >
                    {`{{${token}}}`}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                These tokens will be replaced with the values above when exporting.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
