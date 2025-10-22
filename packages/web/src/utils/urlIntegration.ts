import { validateBlueprintJSON } from './blueprintValidation';
import { INTEGRATION_CONFIG } from '../config/integration';

/**
 * Decode and validate base64-encoded blueprint from URL parameter
 */
export function decodeUrlParameter(base64Data: string): {
  isValid: boolean;
  jsonString?: string;
  error?: string;
} {
  try {
    // Step 1: Decode URL encoding first
    const urlDecoded = decodeURIComponent(base64Data);
    
    // Step 2: Check size after URL decoding
    if (urlDecoded.length > INTEGRATION_CONFIG.maxUrlParamSize) {
      return {
        isValid: false,
        error: `URL parameter too large (${(urlDecoded.length / 1024).toFixed(2)}KB). Maximum allowed: ${(INTEGRATION_CONFIG.maxUrlParamSize / 1024).toFixed(0)}KB. Consider using manual upload or postMessage integration.`,
      };
    }

    // Step 3: Validate base64 format
    if (!isValidBase64(urlDecoded)) {
      return {
        isValid: false,
        error: 'Invalid URL parameter format. The data parameter must be valid base64-encoded JSON.',
      };
    }

    // Step 4: Decode base64
    const decodedString = atob(urlDecoded);

    // Step 5: Validate it's valid JSON
    try {
      JSON.parse(decodedString);
    } catch {
      return {
        isValid: false,
        error: 'Unable to parse blueprint data from URL parameter. The encoded data is not valid JSON.',
      };
    }

    return {
      isValid: true,
      jsonString: decodedString,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to decode URL parameter: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Encode blueprint to base64 for URL parameter
 * (For use in canvas component)
 */
export function encodeForUrlParameter(blueprint: any): {
  isValid: boolean;
  base64Data?: string;
  error?: string;
  warning?: string;
} {
  try {
    const jsonString = JSON.stringify(blueprint);
    const base64Data = btoa(jsonString);
    const encodedSize = encodeURIComponent(base64Data).length;

    // Check size limits
    if (encodedSize > INTEGRATION_CONFIG.maxUrlParamSize) {
      return {
        isValid: false,
        error: `Blueprint too large for URL parameter (${(encodedSize / 1024).toFixed(2)}KB). Use postMessage or manual upload instead.`,
      };
    }

    // Warn if approaching limit
    const warning =
      encodedSize > INTEGRATION_CONFIG.maxUrlParamSize * 0.8
        ? `Blueprint size (${(encodedSize / 1024).toFixed(2)}KB) is approaching URL parameter limit. Consider using postMessage for larger blueprints.`
        : undefined;

    return {
      isValid: true,
      base64Data: encodeURIComponent(base64Data),
      warning,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to encode blueprint: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if string is valid base64
 */
function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

/**
 * Load blueprint from URL parameter
 * Returns validation result for display
 */
export function loadFromUrlParameter(urlParams: URLSearchParams): {
  success: boolean;
  jsonString?: string;
  error?: string;
  source: 'url-param';
} {
  const dataParam = urlParams.get('data');

  if (!dataParam) {
    return {
      success: false,
      error: 'No data parameter found in URL',
      source: 'url-param',
    };
  }

  const decoded = decodeUrlParameter(dataParam);

  if (!decoded.isValid || !decoded.jsonString) {
    return {
      success: false,
      error: decoded.error,
      source: 'url-param',
    };
  }

  // Validate blueprint schema
  const validation = validateBlueprintJSON(decoded.jsonString);

  if (!validation.isValid) {
    return {
      success: false,
      error: `Blueprint validation failed:\n${validation.errors.join('\n')}`,
      source: 'url-param',
    };
  }

  return {
    success: true,
    jsonString: decoded.jsonString,
    source: 'url-param',
  };
}
