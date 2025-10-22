# Report Generator - Canvas Integration

## Overview

The Report Generator integrates with the existing Blueprint Canvas through three data ingestion methods:
1. **URL Parameter** (`?data=base64encoded`)
2. **PostMessage API** (iframe communication)
3. **Manual Upload** (file/paste - already implemented)

All methods support the same Blueprint schema and enforce identical security policies.

---

## 🔗 Integration Methods

### 1. **URL Parameter Integration**

Load blueprint data via base64-encoded URL parameter.

**URL Format:**
```
https://app.example.com/report?data=eyJpZCI6InNhbXBsZS13b3JrZmxvdyIsIm5hbWUiOi...
```

**Encoding Process:**
```typescript
// From Canvas to Report Generator
const blueprintData = JSON.stringify(blueprint);
const base64Data = btoa(blueprintData);
const reportUrl = `/report?data=${encodeURIComponent(base64Data)}`;
window.open(reportUrl, '_blank');
```

**Decoding Process (Report Generator):**
```typescript
// In Report Generator
const urlParams = new URLSearchParams(window.location.search);
const base64Data = urlParams.get('data');
if (base64Data) {
  const jsonString = atob(decodeURIComponent(base64Data));
  validateAndLoad(jsonString);
}
```

**Characteristics:**
- ✅ Simple, stateless, shareable links
- ✅ Works without iframe communication
- ✅ Bookmarkable report URLs
- ⚠️ Limited by URL length (browser-dependent, ~2MB)
- ⚠️ Not suitable for very large blueprints

**Use Case:** Direct navigation from canvas, shareable report links

---

### 2. **PostMessage API Integration**

Real-time communication between canvas and report generator via `window.postMessage()`.

**Message Format:**
```typescript
interface CanvasToReportMessage {
  type: 'LOAD_BLUEPRINT' | 'UPDATE_BLUEPRINT' | 'CLEAR_BLUEPRINT';
  source: 'agentfactory-canvas';
  version: '1.0';
  payload: {
    blueprint: Blueprint;
    timestamp: number;
    origin: string;
  };
}
```

**Sending from Canvas (iframe parent):**
```typescript
const message: CanvasToReportMessage = {
  type: 'LOAD_BLUEPRINT',
  source: 'agentfactory-canvas',
  version: '1.0',
  payload: {
    blueprint: currentBlueprint,
    timestamp: Date.now(),
    origin: window.location.origin
  }
};

// Target the report generator iframe
reportIframe.contentWindow.postMessage(message, 'https://app.example.com');
```

**Receiving in Report Generator:**
```typescript
window.addEventListener('message', (event: MessageEvent) => {
  // Security: Validate origin
  if (!isAllowedOrigin(event.origin)) {
    console.warn('Rejected message from unknown origin:', event.origin);
    return;
  }

  // Validate message structure
  const message = event.data as CanvasToReportMessage;
  if (message.source !== 'agentfactory-canvas') {
    return;
  }

  // Handle message type
  switch (message.type) {
    case 'LOAD_BLUEPRINT':
      loadBlueprintFromMessage(message.payload.blueprint);
      break;
    case 'UPDATE_BLUEPRINT':
      updateBlueprintFromMessage(message.payload.blueprint);
      break;
    case 'CLEAR_BLUEPRINT':
      clearAll();
      break;
  }
});
```

**Characteristics:**
- ✅ Real-time bidirectional communication
- ✅ No URL length restrictions
- ✅ Secure with origin validation
- ✅ Supports live updates
- ⚠️ Requires iframe context
- ⚠️ Must handle cross-origin scenarios

**Use Case:** Embedded report generator in canvas UI, live preview

---

### 3. **Manual Upload**

Already implemented - file upload and paste JSON.

**See:** `REPORT_INGESTION_FLOW.md` for complete documentation.

---

## 📦 Payload Shape

### Blueprint Payload Structure

```typescript
interface BlueprintPayload {
  // Root fields (required)
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // Brief description
  category: string;              // Category classification
  tags?: string[];               // Optional tags

  // Template/Spec (required)
  template: {
    id: string;
    name: string;
    version: string;             // Schema version (e.g., "1.0.0")
    description?: string;
    
    // Orchestration (required)
    orchestration: {
      id: string;
      name: string;
      agents: AgentDef[];        // Array of agents
      tools: ToolBinding[];      // Array of tools
      gates: Gate[];             // Array of gates
      edges: Edge[];             // Array of connections
      startNode: string;         // Entry point agent ID
      outputs: string[];         // Output node IDs
    };

    // Metadata (optional)
    metadata?: {
      createdAt: string;         // ISO 8601 timestamp
      updatedAt: string;         // ISO 8601 timestamp
      author?: string;
      tags?: string[];
      nodePositions?: Record<string, { x: number; y: number }>;
      
      // Custom telemetry/metrics
      [key: string]: any;
    };
  };
}
```

**Minimal Valid Payload:**
```json
{
  "id": "min-blueprint",
  "name": "Minimal Blueprint",
  "description": "Simplest valid blueprint",
  "category": "Test",
  "template": {
    "id": "min-1",
    "name": "Minimal",
    "version": "1.0.0",
    "orchestration": {
      "id": "orch-1",
      "name": "Main",
      "agents": [
        {
          "id": "agent-1",
          "name": "Agent",
          "prompt": "Process task",
          "tools": []
        }
      ],
      "tools": [],
      "gates": [],
      "edges": [],
      "startNode": "agent-1",
      "outputs": ["agent-1"]
    }
  }
}
```

---

## 📏 Size Limits

### URL Parameter Method

| Limit Type | Value | Reason |
|------------|-------|--------|
| **Recommended Max** | 50 KB | URL length limits |
| **Practical Max** | 2 MB | Browser-dependent |
| **Hard Limit** | Reject if > 10 MB | Memory/performance |

**Browser URL Length Limits:**
- Chrome: ~2 MB (2,000,000 characters)
- Firefox: ~64 KB (65,536 characters)
- Safari: ~80 KB
- Edge: ~2 MB

**Size Estimation:**
```typescript
const jsonString = JSON.stringify(blueprint);
const base64Size = btoa(jsonString).length;
const urlSize = encodeURIComponent(base64Size).length;

if (urlSize > 50000) {
  console.warn('Blueprint may exceed URL limits. Consider postMessage.');
}
```

### PostMessage Method

| Limit Type | Value | Reason |
|------------|-------|--------|
| **Recommended Max** | 5 MB | Performance |
| **Warning Threshold** | 5 MB | Show warning |
| **Hard Limit** | 10 MB | Memory/security |

**Size Check:**
```typescript
const payloadSize = new Blob([JSON.stringify(message)]).size;
if (payloadSize > 10 * 1024 * 1024) {
  throw new Error('Payload exceeds 10MB limit');
}
```

### Manual Upload Method

See `REPORT_INGESTION_FLOW.md` - same 10MB hard limit.

---

## 🔒 Security Guidelines

### Origin Validation (PostMessage)

**Allowed Origins Configuration:**
```typescript
const ALLOWED_ORIGINS = [
  'https://agentfactory.example.com',
  'https://canvas.agentfactory.example.com',
  'http://localhost:3000',  // Development only
  'http://localhost:3001',  // Development only
];

function isAllowedOrigin(origin: string): boolean {
  // In production, use strict whitelist
  if (process.env.NODE_ENV === 'production') {
    return ALLOWED_ORIGINS.filter(o => !o.includes('localhost')).includes(origin);
  }
  
  // In development, allow localhost
  return ALLOWED_ORIGINS.includes(origin);
}
```

**Security Checklist:**
- ✅ Validate `event.origin` before processing
- ✅ Check `message.source` identifier
- ✅ Validate `message.version` compatibility
- ✅ Reject messages from unknown origins
- ✅ Log rejected messages for monitoring
- ✅ Rate-limit message processing
- ✅ Sanitize payload before processing

**Attack Prevention:**
```typescript
// 1. Origin validation
if (!isAllowedOrigin(event.origin)) {
  console.warn('[Security] Rejected message from:', event.origin);
  return;
}

// 2. Message structure validation
if (!message.source || message.source !== 'agentfactory-canvas') {
  console.warn('[Security] Invalid message source');
  return;
}

// 3. Payload size check
const payloadSize = new Blob([JSON.stringify(message)]).size;
if (payloadSize > MAX_MESSAGE_SIZE) {
  console.error('[Security] Payload exceeds size limit');
  return;
}

// 4. Rate limiting
if (isRateLimited(event.origin)) {
  console.warn('[Security] Rate limit exceeded for:', event.origin);
  return;
}
```

### URL Parameter Security

**Risks:**
- ❌ URL logging in browser history
- ❌ Server logs may capture sensitive data
- ❌ URL sharing may expose blueprint data
- ❌ XSS via malformed base64

**Mitigations:**
```typescript
// 1. Validate base64 format
function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

// 2. Size validation before decode
if (base64Data.length > MAX_BASE64_LENGTH) {
  throw new Error('URL parameter exceeds size limit');
}

// 3. Validate JSON structure after decode
const jsonString = atob(decodeURIComponent(base64Data));
if (!isValidJSON(jsonString)) {
  throw new Error('Invalid JSON in URL parameter');
}

// 4. Full schema validation
const validation = validateBlueprintJSON(jsonString);
if (!validation.isValid) {
  throw new Error('Invalid blueprint schema');
}
```

### Content Security Policy (CSP)

**Recommended CSP Headers:**
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  frame-ancestors 'self' https://agentfactory.example.com;
  connect-src 'self';
```

**For iframe embedding:**
```html
<!-- Allow specific origins to embed -->
<meta http-equiv="Content-Security-Policy" 
      content="frame-ancestors 'self' https://canvas.agentfactory.example.com">
```

---

## 🔄 Integration Flow Diagrams

### URL Parameter Flow
```
┌──────────────┐
│    Canvas    │
│   (Source)   │
└──────┬───────┘
       │
       │ 1. Serialize blueprint
       │ 2. Base64 encode
       │ 3. Generate URL with ?data=
       │ 4. Open new tab/window
       │
       ▼
┌──────────────────┐
│ Report Generator │
│   (New Tab)      │
└──────┬───────────┘
       │
       │ 5. Parse URL param
       │ 6. Decode base64
       │ 7. Validate schema
       │ 8. Load & generate report
       │
       ▼
┌──────────────┐
│    Report    │
│   Display    │
└──────────────┘
```

### PostMessage Flow
```
┌──────────────┐              ┌──────────────────┐
│    Canvas    │              │ Report Generator │
│  (Parent)    │              │    (iframe)      │
└──────┬───────┘              └──────┬───────────┘
       │                             │
       │ 1. User action              │
       │ 2. Prepare message          │
       │ 3. postMessage() ────────►  │
       │                             │ 4. Validate origin
       │                             │ 5. Validate source
       │                             │ 6. Validate payload
       │                             │ 7. Load blueprint
       │                             │ 8. Generate report
       │                             │
       │  ◄──────────────────────── │ 9. postMessage('READY')
       │                             │
       │ 10. User updates canvas     │
       │ 11. postMessage('UPDATE')──►│
       │                             │ 12. Update report
       │                             │
```

---

## 📝 Implementation Examples

### Example 1: Canvas Button to Report Generator

**In Canvas Component:**
```typescript
import { Blueprint } from '@agentfactory/types';

function CanvasToolbar({ currentBlueprint }: { currentBlueprint: Blueprint }) {
  const openReportGenerator = () => {
    const jsonString = JSON.stringify(currentBlueprint);
    const base64Data = btoa(jsonString);
    const reportUrl = `/report?data=${encodeURIComponent(base64Data)}`;
    
    // Open in new tab
    window.open(reportUrl, '_blank');
  };

  return (
    <button onClick={openReportGenerator}>
      📊 Generate Report
    </button>
  );
}
```

### Example 2: Embedded Report Generator with PostMessage

**Canvas Parent Component:**
```typescript
function CanvasWithReport({ blueprint }: { blueprint: Blueprint }) {
  const reportIframeRef = useRef<HTMLIFrameElement>(null);

  const sendBlueprintToReport = () => {
    if (!reportIframeRef.current) return;

    const message = {
      type: 'LOAD_BLUEPRINT',
      source: 'agentfactory-canvas',
      version: '1.0',
      payload: {
        blueprint,
        timestamp: Date.now(),
        origin: window.location.origin
      }
    };

    reportIframeRef.current.contentWindow?.postMessage(
      message,
      window.location.origin
    );
  };

  return (
    <div className="split-view">
      <div className="canvas-panel">
        <BlueprintCanvas blueprint={blueprint} />
        <button onClick={sendBlueprintToReport}>
          Send to Report Generator
        </button>
      </div>
      <iframe
        ref={reportIframeRef}
        src="/report"
        className="report-panel"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
```

### Example 3: Bidirectional Communication

**Report Generator Response:**
```typescript
// In Report Generator
function sendReadyMessage() {
  if (window.parent === window) return; // Not in iframe

  window.parent.postMessage({
    type: 'REPORT_READY',
    source: 'agentfactory-report',
    version: '1.0',
    payload: {
      ready: true,
      timestamp: Date.now()
    }
  }, '*'); // Parent will validate
}

// Call when report generator is mounted
useEffect(() => {
  sendReadyMessage();
}, []);
```

---

## 🧪 Testing & Validation

### Test Cases

**URL Parameter Method:**
```typescript
describe('URL Parameter Integration', () => {
  it('should load blueprint from valid base64 URL param', () => {
    const blueprint = { id: 'test', name: 'Test', ... };
    const base64 = btoa(JSON.stringify(blueprint));
    window.history.pushState({}, '', `/report?data=${base64}`);
    // Assert blueprint loaded
  });

  it('should reject malformed base64', () => {
    window.history.pushState({}, '', '/report?data=invalid!!!');
    // Assert error shown
  });

  it('should reject oversized payload', () => {
    const largeBlueprint = generateLargeBlueprint(15 * 1024 * 1024);
    // Assert rejection
  });
});
```

**PostMessage Method:**
```typescript
describe('PostMessage Integration', () => {
  it('should accept message from allowed origin', () => {
    const message = createValidMessage();
    window.dispatchEvent(new MessageEvent('message', {
      data: message,
      origin: 'https://agentfactory.example.com'
    }));
    // Assert blueprint loaded
  });

  it('should reject message from unknown origin', () => {
    const message = createValidMessage();
    window.dispatchEvent(new MessageEvent('message', {
      data: message,
      origin: 'https://malicious.com'
    }));
    // Assert rejection logged
  });

  it('should reject oversized message', () => {
    const largeMessage = createLargeMessage(15 * 1024 * 1024);
    // Assert rejection
  });
});
```

---

## 🚨 Error Handling

### URL Parameter Errors

| Error Type | Message | User Action |
|------------|---------|-------------|
| Invalid Base64 | "Invalid URL parameter format" | Re-generate link from canvas |
| Malformed JSON | "Unable to parse blueprint data" | Check source data |
| Schema Invalid | "Blueprint validation failed" | Fix blueprint structure |
| Too Large | "Blueprint exceeds size limit for URL" | Use postMessage or manual upload |

### PostMessage Errors

| Error Type | Message | User Action |
|------------|---------|-------------|
| Unknown Origin | "Message rejected (security)" | Check origin configuration |
| Invalid Source | "Unknown message source" | Verify message format |
| Invalid Schema | "Blueprint validation failed" | Fix blueprint structure |
| Rate Limited | "Too many messages" | Wait and retry |

---

## 🔧 Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_ALLOWED_ORIGINS=https://canvas.example.com,http://localhost:3001
NEXT_PUBLIC_MAX_MESSAGE_SIZE=10485760  # 10MB in bytes
NEXT_PUBLIC_MAX_URL_PARAM_SIZE=2097152  # 2MB in bytes
```

### Runtime Configuration

```typescript
// src/config/integration.ts
export const INTEGRATION_CONFIG = {
  allowedOrigins: process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',') || [],
  maxMessageSize: parseInt(process.env.NEXT_PUBLIC_MAX_MESSAGE_SIZE || '10485760'),
  maxUrlParamSize: parseInt(process.env.NEXT_PUBLIC_MAX_URL_PARAM_SIZE || '2097152'),
  rateLimitWindow: 10000, // 10 seconds
  rateLimitMaxMessages: 10,
};
```

---

## 📊 Monitoring & Analytics

### Metrics to Track

1. **Integration Usage:**
   - URL parameter loads: Count
   - PostMessage loads: Count
   - Manual uploads: Count

2. **Performance:**
   - Avg decode time
   - Avg validation time
   - Payload sizes (p50, p95, p99)

3. **Security:**
   - Rejected origins: Count by origin
   - Rate limit hits: Count
   - Validation failures: Count by type

4. **Errors:**
   - Decode errors: Count
   - Schema validation errors: Count
   - Size limit rejections: Count

---

## 📚 Migration Guide

### From Manual Upload Only to Integrated

**Step 1:** Add URL parameter support
```typescript
// pages/report.tsx
useEffect(() => {
  const urlData = getUrlParameter('data');
  if (urlData) {
    loadFromUrlParameter(urlData);
  }
}, []);
```

**Step 2:** Add postMessage listener
```typescript
useEffect(() => {
  const handleMessage = createMessageHandler();
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

**Step 3:** Update Canvas to send data
```typescript
// In Canvas component
<Link href={`/report?data=${encodeBlueprint(blueprint)}`}>
  Open Report
</Link>
```

---

**Document Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** ✅ Design Complete, Implementation Pending
