import type { Node, Edge } from '@xyflow/react';

export interface CanvasCache {
  nodes: Node[];
  edges: Edge[];
  blueprintInfo: {
    name: string;
    description: string;
    category: string;
    tags: string[];
  };
  timestamp: number;
}

const CACHE_KEY = 'agentfactory_canvas_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save the current canvas state to localStorage
 */
export function saveCanvasToCache(
  nodes: Node[],
  edges: Edge[],
  blueprintInfo: {
    name: string;
    description: string;
    category: string;
    tags: string[];
  }
): void {
  try {
    const cache: CanvasCache = {
      nodes,
      edges,
      blueprintInfo,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log('✅ Canvas state saved to cache');
  } catch (error) {
    console.error('Failed to save canvas to cache:', error);
  }
}

/**
 * Retrieve the cached canvas state from localStorage
 * Returns null if cache is expired or doesn't exist
 */
export function getCanvasFromCache(): CanvasCache | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache: CanvasCache = JSON.parse(cached);
    
    // Check if cache is expired
    const now = Date.now();
    if (now - cache.timestamp > CACHE_EXPIRY) {
      clearCanvasCache();
      return null;
    }

    return cache;
  } catch (error) {
    console.error('Failed to retrieve canvas from cache:', error);
    return null;
  }
}

/**
 * Clear the cached canvas state
 */
export function clearCanvasCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('✅ Canvas cache cleared');
  } catch (error) {
    console.error('Failed to clear canvas cache:', error);
  }
}

/**
 * Check if there is a valid cached canvas state
 */
export function hasCanvasCache(): boolean {
  return getCanvasFromCache() !== null;
}
