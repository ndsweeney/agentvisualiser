import { Blueprint } from '@agentfactory/types';

/**
 * PostMessage types for canvas-to-report communication
 */
export type MessageType = 'LOAD_BLUEPRINT' | 'UPDATE_BLUEPRINT' | 'CLEAR_BLUEPRINT';
export type ResponseType = 'REPORT_READY' | 'REPORT_LOADED' | 'REPORT_ERROR';

export interface CanvasToReportMessage {
  type: MessageType;
  source: string;
  version: string;
  payload: {
    blueprint: Blueprint;
    timestamp: number;
    origin: string;
  };
}

export interface ReportToCanvasMessage {
  type: ResponseType;
  source: string;
  version: string;
  payload: {
    success: boolean;
    timestamp: number;
    error?: string;
  };
}

/**
 * Validate message structure
 */
export function isValidCanvasMessage(data: any): data is CanvasToReportMessage {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.type === 'string' &&
    typeof data.source === 'string' &&
    typeof data.version === 'string' &&
    data.payload &&
    typeof data.payload === 'object'
  );
}

/**
 * Create response message
 */
export function createResponseMessage(
  type: ResponseType,
  success: boolean,
  error?: string
): ReportToCanvasMessage {
  return {
    type,
    source: 'agentfactory-report',
    version: '1.0',
    payload: {
      success,
      timestamp: Date.now(),
      error,
    },
  };
}
