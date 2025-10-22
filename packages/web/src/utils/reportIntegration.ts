import { Blueprint } from '@agentfactory/types';

/**
 * Utility functions for integrating with the Report Generator from the Canvas
 * Use these functions in BlueprintCreator or other canvas components
 */

const CANVAS_CACHE_KEY = 'agentfactory_canvas_cache';
const CANVAS_DIAGRAM_IMAGE_KEY = 'agentfactory_diagram_image';
const CANVAS_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CanvasCache {
  blueprint: Blueprint;
  timestamp: number;
  nodes?: any[]; // ReactFlow nodes
  edges?: any[]; // ReactFlow edges
  viewport?: { x: number; y: number; zoom: number };
  diagramImage?: string; // Base64 encoded diagram image
}

/**
 * Cache the diagram image separately (to avoid size limits)
 */
export function cacheDiagramImage(imageDataUrl: string): { success: boolean; error?: string } {
  try {
    localStorage.setItem(CANVAS_DIAGRAM_IMAGE_KEY, imageDataUrl);
    console.log('[Canvas Cache] Diagram image cached successfully');
    return { success: true };
  } catch (error) {
    console.error('[Canvas Cache] Failed to cache diagram image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cache diagram image',
    };
  }
}

/**
 * Retrieve the cached diagram image
 */
export function getCachedDiagramImage(): string | null {
  try {
    return localStorage.getItem(CANVAS_DIAGRAM_IMAGE_KEY);
  } catch (error) {
    console.error('[Canvas Cache] Failed to retrieve diagram image:', error);
    return null;
  }
}

/**
 * Clear the cached diagram image
 */
export function clearDiagramImageCache(): void {
  try {
    localStorage.removeItem(CANVAS_DIAGRAM_IMAGE_KEY);
    console.log('[Canvas Cache] Diagram image cache cleared');
  } catch (error) {
    console.error('[Canvas Cache] Failed to clear diagram image cache:', error);
  }
}

/**
 * Cache the current canvas state to localStorage
 * Call this before navigating to the report page
 */
export function cacheCanvasState(
  blueprint: Blueprint,
  nodes?: any[],
  edges?: any[],
  viewport?: { x: number; y: number; zoom: number },
  diagramImage?: string
): { success: boolean; error?: string } {
  try {
    const cache: CanvasCache = {
      blueprint,
      timestamp: Date.now(),
      nodes,
      edges,
      viewport,
    };

    localStorage.setItem(CANVAS_CACHE_KEY, JSON.stringify(cache));
    
    // Cache diagram image separately if provided
    if (diagramImage) {
      cacheDiagramImage(diagramImage);
    }
    
    console.log('[Canvas Cache] State cached successfully');

    return { success: true };
  } catch (error) {
    console.error('[Canvas Cache] Failed to cache state:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cache canvas state',
    };
  }
}

/**
 * Restore cached canvas state from localStorage
 * Returns null if no valid cache exists
 */
export function restoreCanvasState(): CanvasCache | null {
  try {
    const cached = localStorage.getItem(CANVAS_CACHE_KEY);
    if (!cached) {
      return null;
    }

    const cache: CanvasCache = JSON.parse(cached);

    // Check if cache has expired
    const age = Date.now() - cache.timestamp;
    if (age > CANVAS_CACHE_EXPIRY) {
      console.log('[Canvas Cache] Cache expired, clearing');
      clearCanvasCache();
      return null;
    }

    console.log('[Canvas Cache] State restored successfully');
    return cache;
  } catch (error) {
    console.error('[Canvas Cache] Failed to restore state:', error);
    return null;
  }
}

/**
 * Clear the cached canvas state
 */
export function clearCanvasCache(): void {
  try {
    localStorage.removeItem(CANVAS_CACHE_KEY);
    clearDiagramImageCache();
    console.log('[Canvas Cache] Cache cleared');
  } catch (error) {
    console.error('[Canvas Cache] Failed to clear cache:', error);
  }
}

/**
 * Check if a valid canvas cache exists
 */
export function hasCanvasCache(): boolean {
  const cache = restoreCanvasState();
  return cache !== null;
}

/**
 * Open Report Generator and cache canvas state for return navigation
 * Best for: Direct navigation with ability to return to canvas
 * Limit: ~2MB (browser-dependent)
 */
export function openReportWithCache(
  blueprint: Blueprint,
  nodes?: any[],
  edges?: any[],
  viewport?: { x: number; y: number; zoom: number }
): {
  success: boolean;
  error?: string;
  warning?: string;
} {
  // Cache the canvas state first
  const cacheResult = cacheCanvasState(blueprint, nodes, edges, viewport);
  if (!cacheResult.success) {
    console.warn('[Canvas Cache] Failed to cache state:', cacheResult.error);
    // Continue anyway, just warn the user
  }

  // Then open the report
  return openReportInNewTab(blueprint);
}

/**
 * Open Report Generator in new tab with blueprint data via URL parameter
 * Best for: Direct navigation, shareable links
 * Limit: ~2MB (browser-dependent)
 */
export function openReportInNewTab(blueprint: Blueprint): {
  success: boolean;
  error?: string;
  warning?: string;
} {
  try {
    const jsonString = JSON.stringify(blueprint);
    const base64Data = btoa(jsonString);
    const encodedData = encodeURIComponent(base64Data);
    
    // Check size
    const sizeKB = encodedData.length / 1024;
    const maxSizeKB = 2048; // 2MB
    
    if (sizeKB > maxSizeKB) {
      return {
        success: false,
        error: `Blueprint too large (${sizeKB.toFixed(0)}KB) for URL parameter. Maximum: ${maxSizeKB}KB. Use embedded report generator instead.`,
      };
    }
    
    // Build URL
    const reportUrl = `/report?data=${encodedData}`;
    
    // Open in new tab
    window.open(reportUrl, '_blank');
    
    const warning = sizeKB > maxSizeKB * 0.8
      ? `Blueprint size (${sizeKB.toFixed(0)}KB) is approaching URL limit. Consider using postMessage for larger blueprints.`
      : undefined;
    
    return {
      success: true,
      warning,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to open report: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Send blueprint to Report Generator via postMessage
 * Best for: Embedded iframe, real-time updates
 * Limit: 10MB
 */
export function sendBlueprintViaPostMessage(
  blueprint: Blueprint,
  targetWindow: Window,
  targetOrigin: string = window.location.origin
): {
  success: boolean;
  error?: string;
} {
  try {
    // Check size
    const jsonString = JSON.stringify(blueprint);
    const sizeMB = new Blob([jsonString]).size / (1024 * 1024);
    
    if (sizeMB > 10) {
      return {
        success: false,
        error: `Blueprint too large (${sizeMB.toFixed(2)}MB). Maximum: 10MB.`,
      };
    }
    
    // Construct message
    const message = {
      type: 'LOAD_BLUEPRINT',
      source: 'agentfactory-canvas',
      version: '1.0',
      payload: {
        blueprint,
        timestamp: Date.now(),
        origin: window.location.origin,
      },
    };
    
    // Send message
    targetWindow.postMessage(message, targetOrigin);
    
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to send blueprint: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Example: Add to BlueprintCreator component
 * 
 * In BlueprintCreator.tsx header:
 * 
 * <button
 *   onClick={() => {
 *     const result = openReportInNewTab(currentBlueprint);
 *     if (!result.success) {
 *       alert(result.error);
 *     } else if (result.warning) {
 *       console.warn(result.warning);
 *     }
 *   }}
 *   className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
 * >
 *   📊 Generate Report
 * </button>
 */
