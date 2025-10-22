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
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Report Generator</h1>
                <p className="text-sm text-gray-600">Generate offline reports</p>
              </div>
              
              {/* Integration Status - moved next to title */}
              {urlLoadStatus.attempted && (
                <div className={`text-xs px-3 py-1 rounded ${
                  urlLoadStatus.success 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  {urlLoadStatus.success ? '✓ Loaded from JSON' : '⚠️ URL load failed'}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Back to Canvas Button */}
              {canReturnToCanvas && (
                <Link
                  href="/?restore=true"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  title="Return to your canvas with your work restored"
                >
                  <span>🎨</span>
                  <span>Back to Canvas</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* URL Load Error Banner */}
        {urlLoadStatus.attempted && !urlLoadStatus.success && urlLoadStatus.error && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-lg">⚠️</span>
              <div className="flex-1">
                <div className="font-semibold text-yellow-900 text-sm">
                  Failed to load blueprint from URL
                </div>
                <div className="text-yellow-700 text-xs mt-1">
                  {urlLoadStatus.error}
                </div>
                <div className="text-yellow-600 text-xs mt-2">
                  You can still upload a blueprint manually using the panel on the left.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Three Panel Layout */}
        <main className="flex-1 grid grid-cols-3 gap-0 overflow-hidden">
          <div className="overflow-hidden">
            <ReportInputPanel />
          </div>
          <div className="overflow-hidden">
            <ReportOptionsPanel />
          </div>
          <div className="overflow-hidden">
            <ReportPreviewPanel />
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
