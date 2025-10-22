import React, { useState, useRef } from 'react';
import { useReport } from '../contexts/ReportContext';
import {
  validateFileUpload,
  validateBlueprintJSON,
  formatValidationErrors,
  formatValidationWarnings,
  getPerformanceSummary,
  PERFORMANCE_THRESHOLDS,
} from '../utils/blueprintValidation';

const SAMPLE_BLUEPRINT = {
  "id": "sample-workflow",
  "name": "Customer Support Workflow",
  "description": "Multi-agent system for automated customer support",
  "category": "Customer Service",
  "tags": ["support", "automation", "multi-agent"],
  "template": {
    "id": "cs-workflow-v1",
    "name": "Customer Support Workflow",
    "version": "1.0.0",
    "orchestration": {
      "id": "cs-orch",
      "name": "Support Orchestration",
      "agents": [
        {
          "id": "triage-agent",
          "name": "Triage Agent",
          "prompt": "Analyze incoming customer requests and categorize by urgency and type",
          "tools": ["ticket-system", "knowledge-base"],
          "memory": { "type": "ephemeral", "maxTokens": 4000 },
          "policies": { "maxIterations": 3, "timeout": 30000, "retryPolicy": "exponential" }
        },
        {
          "id": "resolution-agent",
          "name": "Resolution Agent",
          "prompt": "Provide solutions based on knowledge base and past resolutions",
          "tools": ["knowledge-base", "customer-db"],
          "memory": { "type": "persistent", "maxTokens": 8000 }
        }
      ],
      "tools": [
        {
          "id": "ticket-system",
          "name": "Ticket System API",
          "kind": "rest",
          "config": { "endpoint": "https://api.tickets.example.com" },
          "auth": { "type": "bearer" }
        },
        {
          "id": "knowledge-base",
          "name": "Knowledge Base",
          "kind": "sharepoint",
          "config": { "siteUrl": "https://company.sharepoint.com/kb" }
        }
      ],
      "gates": [
        {
          "id": "approval-gate",
          "type": "approval",
          "approvers": ["supervisor@company.com"]
        }
      ],
      "edges": [
        { "id": "e1", "source": "triage-agent", "target": "resolution-agent", "label": "Standard Issue" },
        { "id": "e2", "source": "resolution-agent", "target": "approval-gate", "condition": "requiresApproval" }
      ],
      "startNode": "triage-agent",
      "outputs": ["resolution", "ticket-status"]
    },
    "metadata": {
      "createdAt": "2025-10-22T00:00:00Z",
      "updatedAt": "2025-10-22T00:00:00Z",
      "author": "System",
      "avgResponseTime": "2.3s",
      "successRate": "94%"
    }
  }
};

export function ReportInputPanel() {
  const { setGraph, clearAll, errors, validationWarnings, blueprintMetadata } = useReport();
  const [jsonText, setJsonText] = useState('');
  const [localWarnings, setLocalWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setLocalWarnings([]);

    // Step 1: Validate file (size, type)
    const fileValidation = validateFileUpload(file);
    
    if (!fileValidation.isValid) {
      alert(`File validation failed:\n${formatValidationErrors(fileValidation.errors)}`);
      setIsProcessing(false);
      return;
    }

    // Show warnings for large files
    if (fileValidation.warnings.length > 0) {
      setLocalWarnings(fileValidation.warnings);
    }

    // Step 2: Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      // Step 3: Validate JSON schema and save to context
      setJsonText(content);
      setGraph(content); // This triggers full validation in context
      setIsProcessing(false);
    };
    
    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handlePasteChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setJsonText(value);
    setLocalWarnings([]);
    
    // Debounced validation on paste
    if (value.trim()) {
      // Quick syntax check without full validation
      try {
        JSON.parse(value);
        // If valid JSON, trigger full validation after a delay
        setTimeout(() => {
          setGraph(value);
        }, 500);
      } catch {
        // Don't show error yet, wait for user to finish typing
      }
    }
  };

  const handleLoadSample = () => {
    const sampleJson = JSON.stringify(SAMPLE_BLUEPRINT, null, 2);
    setJsonText(sampleJson);
    setLocalWarnings([]);
    setGraph(sampleJson);
  };

  const handleClear = () => {
    if (jsonText || errors.jsonParse) {
      if (!confirm('Clear all input and reset the report generator?')) {
        return;
      }
    }
    
    setJsonText('');
    setLocalWarnings([]);
    clearAll();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Combine local warnings with context warnings
  const allWarnings = [...localWarnings, ...validationWarnings];

  return (
    <section
      className="flex flex-col h-full bg-white border-r border-gray-200"
      role="region"
      aria-label="Report Input Panel"
    >
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Input</h2>
        <p className="text-sm text-gray-600 mt-1">Load or paste JSON</p>
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
        {/* Performance Summary */}
        {blueprintMetadata && (
          <div className="text-xs bg-blue-50 text-blue-800 p-2 rounded border border-blue-200">
            {getPerformanceSummary(blueprintMetadata)}
          </div>
        )}

        {/* Upload Button */}
        <div>
          <label
            htmlFor="file-upload"
            className={`block w-full px-4 py-3 text-center rounded-lg transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${
              isProcessing 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isProcessing ? '⏳ Processing...' : '📁 Upload JSON'}
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="sr-only"
              aria-label="Upload JSON file"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Max size: {PERFORMANCE_THRESHOLDS.MAX_FILE_SIZE_MB}MB
          </p>
        </div>

        {/* Paste JSON Textarea */}
        <div className="flex-1 flex flex-col">
          <label
            htmlFor="json-textarea"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Paste JSON
          </label>
          <textarea
            id="json-textarea"
            value={jsonText}
            onChange={handlePasteChange}
            placeholder='Paste JSON here...'
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
            aria-label="Paste JSON content"
            aria-describedby={errors.jsonParse ? 'json-error' : undefined}
            aria-invalid={errors.jsonParse ? 'true' : 'false'}
          />
          
          {/* Validation Errors */}
          {errors.jsonParse && (
            <div
              id="json-error"
              role="alert"
              className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200"
            >
              <div className="font-semibold mb-1">❌ Validation Failed</div>
              <pre className="whitespace-pre-wrap text-xs">{errors.jsonParse}</pre>
            </div>
          )}

          {/* Validation Warnings */}
          {allWarnings.length > 0 && !errors.jsonParse && (
            <div
              role="status"
              className="mt-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded border border-yellow-200"
            >
              <div className="font-semibold mb-1">⚠️ Warnings</div>
              <pre className="whitespace-pre-wrap text-xs">
                {formatValidationWarnings(allWarnings)}
              </pre>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleLoadSample}
            disabled={isProcessing}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Load sample JSON"
          >
            📋 Sample JSON
          </button>
          
          <button
            onClick={handleClear}
            disabled={isProcessing}
            className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Clear all input"
          >
            🗑️ Clear
          </button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
          <div className="font-semibold mb-1">💡 Tips:</div>
          <ul className="space-y-1 ml-4 list-disc">
            <li>Upload a JSON file or paste directly</li>
            <li>Schema version 1.0.0 is fully supported</li>
            <li>&gt;{PERFORMANCE_THRESHOLDS.WARN_NODE_COUNT} nodes may be slower</li>
            <li>Try the sample JSON to see how it works</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
