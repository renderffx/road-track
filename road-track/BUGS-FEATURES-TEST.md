# RoadTrack - Bug Report & Non-Working Features

**Date:** April 6, 2026  
**Tested By:** Deep Code Analysis

---

## 🔴 CRITICAL - Build Failure

### 1. TypeScript Error: Missing `online` property in AppStore

**File:** `src/components/StatusBar.tsx:7`  
**Severity:** CRITICAL  
**Status:** BREAKING - Build fails

**Issue:** The `StatusBar` component accesses `online` from the store, but the `AppStore` interface in `src/store/index.ts` does not define this property.

```typescript
// StatusBar.tsx:7
const { online, gps, reports } = useStore();

// StatusBar.tsx:10-11 - Sets state that's not typed
const handleOnline = () => useStore.setState({ online: true });
const handleOffline = () => useStore.setState({ online: false });
```

**Missing in `src/store/index.ts`:**
```typescript
interface AppStore {
  // ...existing props
  online: boolean;  // MISSING
}
```

---

## 🟡 MEDIUM - Feature Not Working

### 2. Push Notifications - Completely Unimplemented

**Severity:** MEDIUM  
**Status:** BROKEN - No service worker, no VAPID keys

**Issues:**
- Service worker file `/public/sw.js` does not exist
- No VAPID keys in environment (requires `.env` with `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`)
- `pushManager` in `src/lib/notifications.ts` calls `navigator.serviceWorker.register('/sw.js')` which will fail
- The notification functions (`notifyReportSubmitted`, `notifyNearbyReport`, etc.) are defined but never called

**Required Files Missing:**
- `/public/sw.js` - Service worker for push notifications

### 3. Clustering Feature - Defined But Unused

**Severity:** MEDIUM  
**Status:** UNUSED

**Issues:**
- Clustering logic exists in both:
  - `src/lib/clustering.ts` - Client-side clustering library
  - `src/app/api/cluster/route.ts` - Server-side clustering API
- `MapView` component (`src/components/MapView.tsx`) renders all markers individually
- No cluster markers or grouped display implemented
- The clustering API endpoint is never called from any component

### 4. Analytics Module - Defined But Unused

**Severity:** MEDIUM  
**Status:** UNUSED

**Issues:**
- Complete analytics system exists in `src/lib/analytics.ts`:
  - `calculateAnalytics()` - Computes all metrics
  - `getPerformanceScore()` - Performance scoring
  - `getScoreGrade()` - Grade conversion
  - `generateHeatmapData()` - Heatmap generation
- Admin dashboard (`src/app/admin/page.tsx`) only shows basic stats, not analytics
- No charts, no trend visualization, no heatmap display

### 5. Real-time Updates - Fake "Real-time" (Polling Only)

**Severity:** MEDIUM  
**Status:** FUNCTIONAL BUT INEFFICIENT

**Issues:**
- `src/lib/realtime.ts` provides `useAutoRefresh` and `useManualRefresh` hooks
- Both are just setInterval wrappers, NOT actual WebSocket connections
- No WebSocket server implementation exists
- Uses 5-second polling (`src/store/index.ts:143`) which is inefficient

---

## 🟢 LOW - Configuration/Setup Issues

### 6. Image Upload Fallback - Base64 Data URLs

**Severity:** LOW  
**Status:** WORKS but inefficient

**Issue:** When `BLOB_READ_WRITE_TOKEN` is not set, images are stored as base64 data URLs:
- `src/app/api/upload/route.ts:14-18`
- Large images cause memory issues
- Data URLs can't be cached by CDNs
- Admin display may have issues with large base64 strings

**Recommendation:** Set up Vercel Blob:
```
BLOB_READ_WRITE_TOKEN=your_token_here
```

### 7. Data Persistence - In-Memory Storage Only

**Severity:** LOW  
**Status:** DATA LOSS ON RESTART

**Issue:** `src/lib/storage.ts` uses in-memory array:
- All reports lost on server restart
- No persistence configured by default
- To enable persistence, need Upstash KV:
```
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

### 8. AI Detection - TensorFlow.js Loading Issues

**Severity:** LOW  
**Status:** MAY FAIL ON MOBILE

**Issue:** `src/lib/ai-detection.ts` loads TensorFlow.js at startup:
- Large bundle (~2MB) may cause slow initial load
- Mobile devices may run out of memory
- COCO-SSD model loads separately
- Detection silently fails with console log, no user feedback

---

## 📋 Summary Table

| # | Feature | Status | Severity |
|---|---------|--------|----------|
| 1 | `online` property missing | 🔴 BROKEN | CRITICAL |
| 2 | Push Notifications | 🔴 BROKEN | MEDIUM |
| 3 | Clustering | 🟡 UNUSED | MEDIUM |
| 4 | Analytics Dashboard | 🟡 UNUSED | MEDIUM |
| 5 | Real-time Updates | 🟡 POLLING | MEDIUM |
| 6 | Image Upload | 🟢 WORKS | LOW |
| 7 | Data Persistence | 🟢 MISSING | LOW |
| 8 | AI Detection | 🟢 WORKS* | LOW |

*May have performance issues on low-end devices

---

## 🔧 Required Fixes

### Priority 1 (Must Fix for Build):
1. Add `online: boolean` to `AppStore` interface in `src/store/index.ts`
2. Add `online` to initial state: `{ ... , online: true }`

### Priority 2 (Should Implement):
1. Create `/public/sw.js` for push notifications
2. Add VAPID keys to environment
3. Connect clustering to MapView
4. Build analytics dashboard page

### Priority 3 (Nice to Have):
1. Implement actual WebSocket connections
2. Configure Vercel Blob for image storage
3. Configure Upstash KV for data persistence
