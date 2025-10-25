import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ReportProvider, useReport } from '../src/contexts/ReportContext';
import { ReportInputPanel } from '../src/components/ReportInputPanel';
import { ReportOptionsPanel } from '../src/components/ReportOptionsPanel';
import { ReportPreviewPanel } from '../src/components/ReportPreviewPanel';
import { useCanvasIntegration } from '../src/hooks/useCanvasIntegration';
import { loadFromUrlParameter } from '../src/utils/urlIntegration';
import { hasCanvasCache } from '../src/utils/reportIntegration';
import Link from 'next/link';

function ReportPageContent() {
  const router = useRouter();
  const { setGraph } = useReport(); // Call hook at top level
  const [urlLoadStatus, setUrlLoadStatus] = useState<{
    attempted: boolean;
    success: boolean;
    error?: string;
  }>({ attempted: false, success: false });
  const [canReturnToCanvas, setCanReturnToCanvas] = useState(false);
  const [activePanel, setActivePanel] = useState<'input' | 'options' | 'preview'>('input');

  // Initialize canvas integration (postMessage)
  useCanvasIntegration();

  // Check if we can return to canvas (cache exists)
  useEffect(() => {
    setCanReturnToCanvas(hasCanvasCache());
  }, []);

  // Load blueprint from URL parameter on mount
  useEffect(() => {
    if (!router.isReady) return;

    const result = loadFromUrlParameter(new URLSearchParams(window.location.search));
    
    if (result.success && result.jsonString) {
      setGraph(result.jsonString);
      
      setUrlLoadStatus({
        attempted: true,
        success: true,
      });

      console.log('[Integration] Blueprint loaded from URL parameter');
    } else if (result.error) {
      setUrlLoadStatus({
        attempted: true,
        success: false,
        error: result.error,
      });

      console.warn('[Integration] Failed to load from URL parameter:', result.error);
    }
  }, [router.isReady, setGraph]);

  return (
    <>
      <Head>
        <title>Report Generator - Agent Factory</title>
        <meta name="description" content="Generate reports from agent blueprints" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="h-screen flex flex-col bg-gray-100">
        {/* Header - Mobile Responsive */}
        <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Report Generator</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Generate offline reports</p>
              </div>
              
              {/* Integration Status */}
              {urlLoadStatus.attempted && (
                <div className={`text-xs px-2 sm:px-3 py-1 rounded ${
                  urlLoadStatus.success 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  {urlLoadStatus.success ? '✓ Loaded' : '⚠️ Failed'}
                </div>
              )}
            </div>
            
            {/* Back to Canvas Button */}
            {canReturnToCanvas && (
              <Link
                href="/?restore=true"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px]"
                title="Return to your canvas"
              >
                <span>🎨</span>
                <span className="hidden sm:inline">Back to Canvas</span>
                <span className="sm:hidden">Canvas</span>
              </Link>
            )}
          </div>
        </header>

        {/* URL Load Error Banner */}
        {urlLoadStatus.attempted && !urlLoadStatus.success && urlLoadStatus.error && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-3 sm:px-6 py-2 sm:py-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-yellow-600 text-base sm:text-lg">⚠️</span>
              <div className="flex-1">
                <div className="font-semibold text-yellow-900 text-xs sm:text-sm">
                  Failed to load blueprint from URL
                </div>
                <div className="text-yellow-700 text-xs mt-1 hidden sm:block">
                  {urlLoadStatus.error}
                </div>
                <div className="text-yellow-600 text-xs mt-1 sm:mt-2">
                  You can still upload a blueprint manually.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Tabs - Only visible on mobile */}
        <div className="lg:hidden flex border-b bg-white">
          <button
            onClick={() => setActivePanel('input')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activePanel === 'input'
                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📁 Input
          </button>
          <button
            onClick={() => setActivePanel('options')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activePanel === 'options'
                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            ⚙️ Options
          </button>
          <button
            onClick={() => setActivePanel('preview')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activePanel === 'preview'
                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            👁️ Preview
          </button>
        </div>

        {/* Three Panel Layout - Responsive */}
        <main className="flex-1 overflow-hidden">
          {/* Desktop: 3-column grid */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-0 h-full">
            <div className="overflow-hidden">
              <ReportInputPanel />
            </div>
            <div className="overflow-hidden">
              <ReportOptionsPanel />
            </div>
            <div className="overflow-hidden">
              <ReportPreviewPanel />
            </div>
          </div>

          {/* Mobile: Show only active panel */}
          <div className="lg:hidden h-full">
            {activePanel === 'input' && <ReportInputPanel />}
            {activePanel === 'options' && <ReportOptionsPanel />}
            {activePanel === 'preview' && <ReportPreviewPanel />}
          </div>
        </main>
      </div>
    </>
  );
}

export default function ReportPage() {
  return (
    <ReportProvider>
      <ReportPageContent />
    </ReportProvider>
  );
}

// This ensures the page is client-side only and works offline
export const config = {
  unstable_runtimeJS: true,
};
