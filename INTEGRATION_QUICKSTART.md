# Canvas Integration - Quick Reference

## 🚀 Implementation Summary

The Report Generator now supports three data ingestion methods with full security validation:

### ✅ **1. URL Parameter** (`?data=base64`)
- **Status:** Fully implemented
- **Files:** `urlIntegration.ts`, `report.tsx`
- **Limit:** 2MB
- **Use Case:** Direct links, shareable URLs

### ✅ **2. PostMessage API** 
- **Status:** Fully implemented  
- **Files:** `useCanvasIntegration.ts`, `integration.ts`, `integration.ts` (types)
- **Limit:** 10MB
- **Use Case:** Embedded iframe, real-time updates

### ✅ **3. Manual Upload**
- **Status:** Previously implemented
- **Files:** `ReportInputPanel.tsx`, `blueprintValidation.ts`
- **Limit:** 10MB
- **Use Case:** File/paste input

---

## 🔧 Usage from Canvas

### Method 1: Open in New Tab (URL Parameter)

```typescript
import { openReportInNewTab } from '../utils/reportIntegration';

// In your canvas component
const handleGenerateReport = () => {
  const result = openReportInNewTab(currentBlueprint);
  
  if (!result.success) {
    alert(result.error);
  } else if (result.warning) {
    console.warn(result.warning);
  }
};
```

### Method 2: Send via PostMessage (Embedded)

```typescript
import { sendBlueprintViaPostMessage } from '../utils/reportIntegration';

// Assuming you have an iframe ref
const reportIframeRef = useRef<HTMLIFrameElement>(null);

const handleSendToReport = () => {
  if (!reportIframeRef.current?.contentWindow) return;
  
  const result = sendBlueprintViaPostMessage(
    currentBlueprint,
    reportIframeRef.current.contentWindow,
    window.location.origin
  );
  
  if (!result.success) {
    alert(result.error);
  }
};
```

---

## 🔒 Security Features

### Origin Validation (PostMessage)
- ✅ Whitelist-based origin checking
- ✅ Automatic localhost allowance in dev mode
- ✅ Production filtering of localhost

### Rate Limiting
- ✅ 10 messages per 10 seconds per origin
- ✅ Automatic reset after window expires

### Size Validation
- ✅ URL: 2MB hard limit
- ✅ PostMessage: 10MB hard limit
- ✅ Pre-validation before processing

### Message Validation
- ✅ Source identifier check (`agentfactory-canvas`)
- ✅ Version compatibility check (`1.0`)
- ✅ Schema validation via Zod
- ✅ JSON structure validation

---

## 📝 Configuration

### Environment Variables

Create `.env.local`:

```bash
# Allowed origins for postMessage (comma-separated)
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Size limits in bytes
NEXT_PUBLIC_MAX_MESSAGE_SIZE=10485760  # 10MB
NEXT_PUBLIC_MAX_URL_PARAM_SIZE=2097152  # 2MB
```

---

## 🎯 Integration Points

### Report Generator Side (Receiver)

**Automatic Setup:**
- URL parameter parsing on page load ✅
- PostMessage listener active ✅
- Origin validation ✅
- Rate limiting ✅

**No additional code needed** - integration is automatic!

### Canvas Side (Sender)

**Option A: Add "Generate Report" button**

```typescript
// In BlueprintCreator.tsx header section
import { openReportInNewTab } from '../utils/reportIntegration';

// Add button
<button
  onClick={() => {
    const result = openReportInNewTab(currentBlueprint);
    if (!result.success) alert(result.error);
  }}
  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
>
  📊 Generate Report
</button>
```

**Option B: Embed report generator in split view**

```typescript
// Create new component or add to existing view
<div className="split-view">
  <BlueprintCanvas />
  <iframe ref={iframeRef} src="/report" />
</div>

// Send updates on blueprint change
useEffect(() => {
  if (iframeRef.current?.contentWindow) {
    sendBlueprintViaPostMessage(blueprint, iframeRef.current.contentWindow);
  }
}, [blueprint]);
```

---

## 🧪 Testing

### Test URL Integration

```bash
# Generate test URL
const testBlueprint = { id: "test", name: "Test", ... };
const base64 = btoa(JSON.stringify(testBlueprint));
const url = `http://localhost:3001/report?data=${encodeURIComponent(base64)}`;
console.log(url);
```

### Test PostMessage Integration

```javascript
// In browser console (from canvas page)
const testMessage = {
  type: 'LOAD_BLUEPRINT',
  source: 'agentfactory-canvas',
  version: '1.0',
  payload: {
    blueprint: { /* your blueprint */ },
    timestamp: Date.now(),
    origin: window.location.origin
  }
};

// Send to report iframe
iframe.contentWindow.postMessage(testMessage, window.location.origin);
```

---

## 📊 Security Monitoring

### Console Logs

**Success:**
```
[Integration] Blueprint loaded from URL parameter
[Integration] Blueprint loaded successfully from: http://localhost:3000
[Integration] Sent ready message to parent
```

**Security Rejections:**
```
[Security] Rejected message from unknown origin: https://malicious.com
[Security] Rate limit exceeded for origin: http://localhost:3000
[Integration] Payload exceeds size limit: 12.5MB
```

---

## 🚨 Error Messages

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| URL_TOO_LARGE | "URL parameter too large" | Blueprint > 2MB | Use postMessage |
| INVALID_BASE64 | "Invalid URL parameter format" | Malformed base64 | Re-encode properly |
| UNKNOWN_ORIGIN | "Message rejected (security)" | Unwhitelisted origin | Add to ALLOWED_ORIGINS |
| RATE_LIMITED | "Rate limit exceeded" | >10 msgs/10sec | Wait and retry |
| PAYLOAD_TOO_LARGE | "Payload too large" | Blueprint > 10MB | Reduce blueprint size |
| SCHEMA_INVALID | "Blueprint validation failed" | Invalid schema | Fix blueprint structure |

---

## 📚 Related Documentation

- **Full Integration Guide:** `CANVAS_INTEGRATION.md`
- **Data Ingestion Flow:** `REPORT_INGESTION_FLOW.md`
- **Validation Details:** `blueprintValidation.ts`

---

## ✅ Implementation Checklist

- [x] URL parameter decoding
- [x] Base64 validation
- [x] PostMessage listener
- [x] Origin validation
- [x] Rate limiting
- [x] Size limits (URL & postMessage)
- [x] Schema validation
- [x] Error handling
- [x] Security logging
- [x] Canvas helper functions
- [x] TypeScript types
- [x] Documentation

**Status:** ✅ Production Ready

---

**Last Updated:** October 22, 2025  
**Version:** 1.0
