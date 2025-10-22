import { useEffect, useCallback, useRef } from 'react';
import { useReport } from '../contexts/ReportContext';
import { isAllowedOrigin, rateLimiter, INTEGRATION_CONFIG } from '../config/integration';
import {
  isValidCanvasMessage,
  createResponseMessage,
  CanvasToReportMessage,
} from '../types/integration';
import { validateBlueprintJSON } from '../utils/blueprintValidation';

/**
 * Custom hook for handling postMessage integration with canvas
 */
export function useCanvasIntegration() {
  const { setGraph, clearAll } = useReport();
  const isProcessingRef = useRef(false);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Prevent concurrent message processing
      if (isProcessingRef.current) {
        console.warn('[Integration] Message processing already in progress');
        return;
      }

      try {
        isProcessingRef.current = true;

        // Step 1: Validate origin
        if (!isAllowedOrigin(event.origin)) {
          console.warn('[Security] Rejected message from unknown origin:', event.origin);
          sendErrorResponse(event.source, 'Unknown origin', event.origin);
          return;
        }

        // Step 2: Rate limiting
        if (rateLimiter.isRateLimited(event.origin)) {
          console.warn('[Security] Rate limit exceeded for origin:', event.origin);
          sendErrorResponse(event.source, 'Rate limit exceeded', event.origin);
          return;
        }

        // Step 3: Validate message structure
        if (!isValidCanvasMessage(event.data)) {
          console.warn('[Integration] Invalid message structure');
          return;
        }

        const message = event.data as CanvasToReportMessage;

        // Step 4: Validate source identifier
        if (message.source !== INTEGRATION_CONFIG.canvasSourceId) {
          console.warn('[Integration] Invalid message source:', message.source);
          return;
        }

        // Step 5: Check message version
        if (message.version !== INTEGRATION_CONFIG.messageVersion) {
          console.warn('[Integration] Unsupported message version:', message.version);
          sendErrorResponse(
            event.source,
            `Unsupported message version: ${message.version}`,
            event.origin
          );
          return;
        }

        // Step 6: Check payload size
        const payloadSize = new Blob([JSON.stringify(message)]).size;
        if (payloadSize > INTEGRATION_CONFIG.maxMessageSize) {
          console.error('[Integration] Payload exceeds size limit:', payloadSize);
          sendErrorResponse(
            event.source,
            `Payload too large: ${(payloadSize / 1024 / 1024).toFixed(2)}MB`,
            event.origin
          );
          return;
        }

        // Step 7: Handle message type
        switch (message.type) {
          case 'LOAD_BLUEPRINT':
            handleLoadBlueprint(message, event.source, event.origin);
            break;
          case 'UPDATE_BLUEPRINT':
            handleLoadBlueprint(message, event.source, event.origin);
            break;
          case 'CLEAR_BLUEPRINT':
            clearAll();
            sendSuccessResponse(event.source, event.origin);
            break;
          default:
            console.warn('[Integration] Unknown message type:', (message as any).type);
        }
      } finally {
        isProcessingRef.current = false;
      }
    },
    [setGraph, clearAll]
  );

  const handleLoadBlueprint = useCallback(
    (message: CanvasToReportMessage, source: MessageEventSource | null, origin: string) => {
      try {
        // Validate blueprint
        const jsonString = JSON.stringify(message.payload.blueprint);
        const validation = validateBlueprintJSON(jsonString);

        if (!validation.isValid) {
          sendErrorResponse(
            source,
            `Blueprint validation failed: ${validation.errors[0]}`,
            origin
          );
          return;
        }

        // Load blueprint into context
        setGraph(jsonString);

        // Send success response
        sendSuccessResponse(source, origin);

        console.log('[Integration] Blueprint loaded successfully from:', origin);
      } catch (error) {
        sendErrorResponse(
          source,
          `Failed to load blueprint: ${error instanceof Error ? error.message : 'Unknown error'}`,
          origin
        );
      }
    },
    [setGraph]
  );

  const sendSuccessResponse = (
    source: MessageEventSource | null,
    targetOrigin: string
  ) => {
    if (!source || typeof (source as any).postMessage !== 'function') return;

    const response = createResponseMessage('REPORT_LOADED', true);
    (source as Window).postMessage(response, targetOrigin);
  };

  const sendErrorResponse = (
    source: MessageEventSource | null,
    error: string,
    targetOrigin: string
  ) => {
    if (!source || typeof (source as any).postMessage !== 'function') return;

    const response = createResponseMessage('REPORT_ERROR', false, error);
    (source as Window).postMessage(response, targetOrigin);
  };

  const sendReadyMessage = useCallback(() => {
    // Check if we're in an iframe
    if (window.parent === window) return;

    const response = createResponseMessage('REPORT_READY', true);
    window.parent.postMessage(response, '*'); // Parent will validate
    console.log('[Integration] Sent ready message to parent');
  }, []);

  // Set up message listener
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Send ready message on mount
  useEffect(() => {
    sendReadyMessage();
  }, [sendReadyMessage]);

  return {
    sendReadyMessage,
  };
}
