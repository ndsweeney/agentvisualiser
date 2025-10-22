import React, { useRef } from 'react';
import { useReport } from '../contexts/ReportContext';

export function ReportPreviewPanel() {
  const { format, renderedMarkdown, renderedHtml, printLayout, exportFile, errors, graphJson, diagramImage } = useReport();
  const previewRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    const content = format === 'markdown' ? renderedMarkdown : renderedHtml;
    if (content) {
      try {
        await navigator.clipboard.writeText(content);
        alert('Copied to clipboard!');
      } catch (err) {
        alert('Failed to copy to clipboard');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const hasContent = renderedMarkdown || renderedHtml;

  return (
    <section
      className="flex flex-col h-full bg-white"
      role="region"
      aria-label="Report Preview Panel"
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
          <p className="text-sm text-gray-600 mt-1">Live report preview</p>
        </div>

        {hasContent && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Copy report content"
              title="Copy to clipboard"
            >
              📋 Copy
            </button>
            
            {format === 'pdf' && (
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Print report"
                title="Print report"
              >
                🖨️ Print
              </button>
            )}
            
            <button
              onClick={() => exportFile()}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Export report"
              title="Download report"
            >
              💾 Export
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {errors.generation && (
          <div
            role="alert"
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            <strong>Generation Error:</strong> {errors.generation}
          </div>
        )}

        {errors.export && (
          <div
            role="alert"
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            <strong>Export Error:</strong> {errors.export}
          </div>
        )}

        {!graphJson && !errors.generation && (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Blueprint Loaded</h3>
              <p className="text-gray-600">
                Upload or paste a blueprint JSON to generate a report
              </p>
            </div>
          </div>
        )}

        {hasContent && !errors.generation && (
          <div
            ref={previewRef}
            className={`report-preview ${printLayout ? 'print-layout' : ''}`}
            role="document"
            aria-live="polite"
            aria-atomic="false"
          >
            {/* Display diagram image if available */}
            {diagramImage && (
              <div className="diagram-preview mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Blueprint Diagram</h3>
                <div className="flex justify-center">
                  <img 
                    src={diagramImage} 
                    alt="Blueprint Diagram" 
                    className="max-w-full h-auto rounded shadow-md"
                    style={{ maxHeight: '600px' }}
                  />
                </div>
              </div>
            )}

            {format === 'markdown' && renderedMarkdown && (
              <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                {renderedMarkdown}
              </pre>
            )}

            {(format === 'html' || format === 'pdf') && renderedHtml && (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .report-preview.print-layout {
          max-width: 8.5in;
          margin: 0 auto;
        }

        @media print {
          .report-preview {
            max-width: 100%;
          }
        }

        .prose h1 {
          color: #1a202c;
          border-bottom: 2px solid #3182ce;
          padding-bottom: 0.5rem;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }

        .prose h2 {
          color: #2d3748;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          font-size: 1.5rem;
        }

        .prose h3 {
          color: #4a5568;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          font-size: 1.25rem;
        }

        .prose p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .prose pre {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .prose code {
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        .prose ul {
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }

        .prose li {
          margin: 0.25rem 0;
        }

        .prose strong {
          color: #2d3748;
          font-weight: 600;
        }

        .diagram-preview img {
          border: 1px solid #e2e8f0;
        }

        @media print {
          .prose h1,
          .prose h2,
          .prose h3 {
            page-break-after: avoid;
          }

          .prose pre,
          .prose ul {
            page-break-inside: avoid;
          }

          .diagram-preview {
            page-break-inside: avoid;
            margin-bottom: 2rem;
          }
        }
      `}</style>
    </section>
  );
}
