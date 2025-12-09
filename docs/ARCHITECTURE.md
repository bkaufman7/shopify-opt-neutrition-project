# Architecture Documentation

## System Overview

The Shopify Pixel Inspector is a distributed event tracking and validation system designed to overcome the limitations of debugging Shopify Custom Pixel implementations where GTM runs inside isolated iframes.

---

## Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                         SHOPIFY STOREFRONT                             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    Custom Pixel Iframe                        │    │
│  │                        (Isolated)                             │    │
│  │  ┌────────────────────────────────────────────────────┐      │    │
│  │  │  GTM Container                                      │      │    │
│  │  │  • Triggers fire                                    │      │    │
│  │  │  • Tags execute                                     │      │    │
│  │  │  • console.log() called                             │      │    │
│  │  │  • dataLayer.push() executed                        │      │    │
│  │  └────────────────────────────────────────────────────┘      │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │               Page-Level JavaScript Context                   │    │
│  │                                                               │    │
│  │  ┌─────────────────────────────────────────────────────┐     │    │
│  │  │         Pixel Inspector (Interceptor)               │     │    │
│  │  │                                                      │     │    │
│  │  │  ┌──────────────┐  ┌───────────────┐               │     │    │
│  │  │  │ Console Hook │  │ DataLayer Hook│               │     │    │
│  │  │  └──────┬───────┘  └───────┬───────┘               │     │    │
│  │  │         │                   │                        │     │    │
│  │  │         v                   v                        │     │    │
│  │  │  ┌────────────────────────────────┐                 │     │    │
│  │  │  │      Event Normalizer          │                 │     │    │
│  │  │  │  • Detect event objects        │                 │     │    │
│  │  │  │  • Extract metadata            │                 │     │    │
│  │  │  │  • Standardize format          │                 │     │    │
│  │  │  └──────────────┬─────────────────┘                 │     │    │
│  │  │                 │                                    │     │    │
│  │  │                 v                                    │     │    │
│  │  │  ┌────────────────────────────────┐                 │     │    │
│  │  │  │       Event Filter             │                 │     │    │
│  │  │  │  • Apply inclusion rules       │                 │     │    │
│  │  │  │  • Check event types           │                 │     │    │
│  │  │  │  • Validate sources            │                 │     │    │
│  │  │  └──────────────┬─────────────────┘                 │     │    │
│  │  │                 │                                    │     │    │
│  │  │                 v                                    │     │    │
│  │  │  ┌────────────────────────────────┐                 │     │    │
│  │  │  │       Event Queue              │                 │     │    │
│  │  │  │  • Batching                    │                 │     │    │
│  │  │  │  • Rate limiting               │                 │     │    │
│  │  │  │  • Retry logic                 │                 │     │    │
│  │  │  └──────────────┬─────────────────┘                 │     │    │
│  │  │                 │                                    │     │    │
│  │  │                 v                                    │     │    │
│  │  │  ┌────────────────────────────────┐                 │     │    │
│  │  │  │     Transmission Layer         │                 │     │    │
│  │  │  │  • sendBeacon() (unload)       │                 │     │    │
│  │  │  │  • fetch() (normal)            │                 │     │    │
│  │  │  │  • keepalive flag              │                 │     │    │
│  │  │  └──────────────┬─────────────────┘                 │     │    │
│  │  └─────────────────┼─────────────────────────────────┘     │    │
│  │                    │                                         │    │
│  │  ┌─────────────────┼─────────────────────────────────┐     │    │
│  │  │   DOM Event     │                                  │     │    │
│  │  │   Listeners     │                                  │     │    │
│  │  │  • Click capture│                                  │     │    │
│  │  │  • Element data │                                  │     │    │
│  │  │  • Traversal    │                                  │     │    │
│  │  └─────────────────┼─────────────────────────────────┘     │    │
│  └────────────────────┼───────────────────────────────────────┘    │
└─────────────────────┬─┼───────────────────────────────────────────┘
                      │ │
                      │ └─────────────┐
                      │               │
                      v               v
            ┌─────────────────────────────────┐
            │  HTTPS POST (JSON payload)      │
            │  • Batch of events              │
            │  • Metadata                     │
            │  • Compression (optional)       │
            └─────────────┬───────────────────┘
                          │
                          v
┌─────────────────────────────────────────────────────────────────────┐
│                  GOOGLE APPS SCRIPT (Webhook)                        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                     doPost() Handler                        │    │
│  │  • Parse JSON payload                                       │    │
│  │  • Validate structure                                       │    │
│  │  • Log request metadata                                     │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                            │                                         │
│                            v                                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Event Processing Pipeline                      │    │
│  │  1. Extract events array                                    │    │
│  │  2. Normalize each event                                    │    │
│  │  3. Build row arrays                                        │    │
│  │  4. Validate data types                                     │    │
│  │  5. Truncate long fields                                    │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                            │                                         │
│                            v                                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │               Sheet Manager                                 │    │
│  │  • Get or create sheet                                      │    │
│  │  • Verify headers                                           │    │
│  │  • Check row limits                                         │    │
│  │  • Trigger archiving if needed                              │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                            │                                         │
│                            v                                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │               Batch Writer                                  │    │
│  │  • Append all rows at once                                  │    │
│  │  • Use range notation for efficiency                        │    │
│  │  • Apply formatting (optional)                              │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                            │                                         │
│                            v                                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Error Handler                                  │    │
│  │  • Catch exceptions                                         │    │
│  │  • Log to error sheet                                       │    │
│  │  • Return error response                                    │    │
│  └────────────────────────┬───────────────────────────────────┘    │
│                            │                                         │
│                            v                                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │           Response Generator                                │    │
│  │  • Build success/error response                             │    │
│  │  • Return JSON                                              │    │
│  │  • Set CORS headers                                         │    │
│  └────────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────────┐
│                       GOOGLE SHEETS                                  │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐     │
│  │    Events    │  │   Raw JSON   │  │    Expectations      │     │
│  │              │  │              │  │                      │     │
│  │ • Timestamp  │  │ • Full       │  │ • Event Name         │     │
│  │ • Event Name │  │   Request    │  │ • URL Pattern        │     │
│  │ • Source     │  │   Payload    │  │ • Required           │     │
│  │ • Page URL   │  │              │  │ • Description        │     │
│  │ • Click Data │  │              │  │                      │     │
│  │ • Ecommerce  │  │              │  │                      │     │
│  │ • Raw JSON   │  │              │  │                      │     │
│  └──────────────┘  └──────────────┘  └──────────────────────┘     │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐     │
│  │   Summary    │  │ URL Coverage │  │  Missing Events      │     │
│  │              │  │              │  │                      │     │
│  │ • By Event   │  │ • Matrix:    │  │ • Expected but       │     │
│  │ • By Source  │  │   URLs x     │  │   not found          │     │
│  │ • By Date    │  │   Events     │  │ • URL where missing  │     │
│  │ • By URL     │  │              │  │ • Required flag      │     │
│  └──────────────┘  └──────────────┘  └──────────────────────┘     │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │Click Analysis│  │   Errors     │                                │
│  │              │  │              │                                │
│  │ • Click Text │  │ • Timestamp  │                                │
│  │ • Dest URL   │  │ • Error Msg  │                                │
│  │ • Count      │  │ • Stack      │                                │
│  │ • Pages      │  │              │                                │
│  └──────────────┘  └──────────────┘                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │              Apps Script Functions (Menu)                 │      │
│  │  • generateSummaryReport()                                │      │
│  │  • generateMissingEventsReport()                          │      │
│  │  • generateURLCoverageReport()                            │      │
│  │  • generateClickAnalysisReport()                          │      │
│  │  • createExpectationsTemplate()                           │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Browser Interceptor Layer

**Purpose**: Capture events from page context without requiring site access or modifications.

**Components**:

#### 1.1 Console Hook
```javascript
PixelInspector.originalConsoleLog = console.log;
console.log = function(...args) {
  // Call original
  PixelInspector.originalConsoleLog.apply(console, args);
  
  // Inspect arguments for event objects
  args.forEach(arg => {
    if (isEventObject(arg)) {
      captureEvent(arg, 'console');
    }
  });
};
```

**Why**: GTM and custom pixels often log event data to console. By intercepting console.log, we can capture these without modifying GTM.

#### 1.2 DataLayer Hook
```javascript
window.dataLayer.push = function(...args) {
  // Call original push
  const result = originalPush.apply(window.dataLayer, args);
  
  // Capture pushed objects
  args.forEach(arg => captureEvent(arg, 'datalayer'));
  
  return result;
};
```

**Why**: Standard GTM pattern. Even in iframes, parent-level dataLayer may exist.

#### 1.3 DOM Event Listeners
```javascript
document.addEventListener('click', function(e) {
  const clickData = extractClickData(e.target);
  if (clickData.isRelevant) {
    captureEvent(clickData, 'click');
  }
}, true);  // Capture phase
```

**Why**: Captures user interactions even if no tracking is configured. Provides baseline data.

#### 1.4 Event Normalizer

**Purpose**: Convert various event formats into standardized structure.

**Process**:
1. Detect event type (console, dataLayer, DOM)
2. Extract common fields (event name, source, etc.)
3. Preserve original payload in `raw_payload`
4. Add metadata (timestamp, user agent, site)
5. Return normalized object

**Standard Format**:
```javascript
{
  event_name: string,
  event_source: string,
  page_url: string,
  page_path: string,
  page_title: string,
  click_text: string | null,
  click_url: string | null,
  ecommerce: object | null,
  timestamp: ISO8601 string,
  site_name: string,
  raw_payload: JSON string
}
```

#### 1.5 Event Filter

**Purpose**: Reduce noise by filtering unwanted events.

**Strategies**:
- **Whitelist**: Only capture specified event names
- **Blacklist**: Capture all except specified
- **Source filter**: Only capture from specific sources
- **Pattern matching**: Use regex for flexible filtering

**Configuration**:
```javascript
EVENT_FILTERS: {
  captureAll: false,
  eventNames: ['page_view', 'purchase'],
  eventSources: ['custom_pixel', 'gtm']
}
```

#### 1.6 Event Queue & Batching

**Purpose**: Optimize network requests and ensure reliability.

**Features**:
- **Batching**: Collect events until batch size reached
- **Auto-send**: Send at regular intervals
- **Flush on unload**: Use sendBeacon() when page closes
- **Retry logic**: Re-queue failed sends (except on flush)

**Algorithm**:
```
on event_captured:
  queue.push(event)
  if queue.length >= BATCH_SIZE:
    send()

on interval (every AUTO_SEND_INTERVAL):
  if queue.length > 0:
    send()

on page_unload:
  send(flush=true)  // Uses sendBeacon
```

---

### 2. Transmission Layer

**Purpose**: Reliably send events to webhook.

#### 2.1 sendBeacon API

**When used**: Page unload/navigation

**Advantages**:
- Non-blocking
- Survives page termination
- Browser-optimized

**Disadvantages**:
- No response handling
- Limited to POST
- May be blocked by some browsers

**Implementation**:
```javascript
if (isFlush && navigator.sendBeacon) {
  const success = navigator.sendBeacon(URL, JSON.stringify(payload));
  if (success) return;
}
```

#### 2.2 Fetch API

**When used**: Normal sends

**Advantages**:
- Response handling
- Error detection
- Retry capability

**Configuration**:
```javascript
fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  keepalive: isFlush  // Important for unload sends
})
```

#### 2.3 Payload Structure

```javascript
{
  events: [
    { /* normalized event 1 */ },
    { /* normalized event 2 */ },
    // ...
  ],
  metadata: {
    site_name: "optimum-nutrition",
    sent_at: "2025-12-09T...",
    is_flush: false,
    session_start: "2025-12-09T...",
    user_agent: "Mozilla/5.0..."
  }
}
```

---

### 3. Apps Script Webhook Layer

**Purpose**: Receive events and persist to Google Sheets.

#### 3.1 Request Handler (doPost)

**Process**:
1. Parse incoming JSON
2. Validate structure
3. Extract events array
4. Process each event
5. Write to sheet
6. Return response

**Error Handling**:
- Catch all exceptions
- Log to error sheet
- Return error response with details
- Don't crash on malformed data

#### 3.2 Event Processing Pipeline

**Steps**:
1. **Normalize**: Ensure all fields present (default to empty)
2. **Validate**: Check data types
3. **Transform**: Convert objects to JSON strings
4. **Truncate**: Limit field lengths (e.g., click_text max 500 chars)
5. **Build rows**: Create array format for sheet insertion

#### 3.3 Sheet Manager

**Responsibilities**:
- Get existing sheet or create new
- Verify headers match expected format
- Check row count against MAX_ROWS
- Trigger archiving if needed
- Handle sheet permissions errors

**Auto-archiving**:
```
if sheet.getLastRow() > MAX_ROWS:
  1. Create archive sheet with timestamp
  2. Copy all data to archive
  3. Clear main sheet (keep headers)
  4. Log archiving event
```

#### 3.4 Batch Writer

**Why batch**: Apps Script has quotas on write operations.

**Strategy**:
```javascript
// Inefficient (multiple writes):
events.forEach(event => {
  sheet.appendRow(buildRow(event));
});

// Efficient (single write):
const rows = events.map(event => buildRow(event));
sheet.getRange(startRow, 1, rows.length, columns.length)
     .setValues(rows);
```

---

### 4. Google Sheets Data Layer

**Purpose**: Persistent storage and analysis platform.

#### 4.1 Events Sheet (Raw Data)

**Columns**:
- Timestamp
- Site Name
- Event Name
- Event Source
- Page URL
- Page Path
- Page Title
- Click Text
- Click URL
- Product ID
- Price
- Ecommerce (JSON)
- Raw JSON

**Features**:
- Frozen header row
- Auto-sized columns
- Timestamp in local timezone
- Full-text search capable

#### 4.2 Raw JSON Sheet (Debug)

**Purpose**: Store complete request payloads for debugging.

**Use cases**:
- Investigate malformed events
- Audit full request metadata
- Troubleshoot missing fields

#### 4.3 Expectations Sheet (Configuration)

**Purpose**: Define expected events for validation.

**Format**:
```
Event Name          | URL Pattern    | Required | Description
page_view           | *              | Yes      | All pages must have pageview
add_to_cart         | */products/*   | Yes      | Product pages need add to cart
purchase            | */thank-you    | Yes      | Confirmation page
```

**URL Pattern Syntax**:
- `*` = wildcard
- Exact match: `https://example.com/page`
- Path wildcard: `*/products/*`

---

### 5. Reporting Layer

**Purpose**: Transform raw event data into actionable insights.

#### 5.1 Summary Report

**Aggregations**:
- Total event count
- Events by name (with counts)
- Events by source
- Events by date
- Top 20 URLs by event count

**Algorithm**:
```javascript
const summary = {};
events.forEach(event => {
  const key = event.event_name;
  summary[key] = (summary[key] || 0) + 1;
});

// Sort by count descending
const sorted = Object.entries(summary)
  .sort((a, b) => b[1] - a[1]);
```

#### 5.2 Missing Events Report

**Purpose**: QA validation - find events that should have fired but didn't.

**Algorithm**:
```
for each expectation:
  1. Find all URLs matching URL pattern
  2. Check if event fired on those URLs
  3. If not found:
     - Add to missing events list
     - Mark as required/optional
     - Include URL where missing
```

**Output**:
```
Event Name | URL | URL Pattern | Required | Status
add_to_cart | /products/whey | */products/* | Yes | Event not fired
```

#### 5.3 URL Coverage Report

**Purpose**: Matrix showing which events fired on which URLs.

**Format**:
```
URL                    | page_view | click | add_to_cart | purchase
/                      | 50        | 25    | 0           | 0
/products/whey         | 30        | 40    | 15          | 0
/cart                  | 20        | 10    | 0           | 0
/checkout/thank-you    | 10        | 5     | 0           | 10
```

**Algorithm**:
```javascript
const matrix = {};
events.forEach(event => {
  const url = event.page_url;
  const eventName = event.event_name;
  
  if (!matrix[url]) matrix[url] = {};
  matrix[url][eventName] = (matrix[url][eventName] || 0) + 1;
});
```

#### 5.4 Click Analysis Report

**Purpose**: Understand user interactions and CTA performance.

**Aggregations**:
- Click text (button/link text)
- Destination URL
- Number of clicks
- Number of pages clicked from
- List of pages

**Use cases**:
- Identify most-clicked CTAs
- Find broken links (clicks with no destination)
- Validate CTA tracking coverage

---

## Data Flow

### Happy Path

```
1. User loads page
   ↓
2. Pixel Inspector initializes
   ↓
3. console.log() intercepted
   ↓
4. Event object detected
   ↓
5. Event normalized
   ↓
6. Event passes filters
   ↓
7. Event added to queue
   ↓
8. Batch size reached OR interval elapsed
   ↓
9. POST request to webhook
   ↓
10. Apps Script receives request
    ↓
11. JSON parsed successfully
    ↓
12. Events processed
    ↓
13. Rows written to sheet
    ↓
14. Success response returned
    ↓
15. Browser updates stats
```

### Error Paths

**Network Failure**:
```
9. POST request fails
   ↓
10. Catch error
    ↓
11. If not flush: re-queue events
    ↓
12. Update failed count
    ↓
13. Retry on next interval
```

**Invalid Payload**:
```
11. JSON parse fails
    ↓
12. Catch exception
    ↓
13. Log to error sheet
    ↓
14. Return error response
    ↓
15. Browser logs error
```

**Sheet Write Failure**:
```
13. Sheet write fails (quota/permission)
    ↓
14. Catch exception
    ↓
15. Log to error sheet
    ↓
16. Return partial success response
```

---

## Security Architecture

### Threat Model

**Threats NOT protected against**:
- URL discovery (webhook URL is "security by obscurity")
- Malicious POST requests (anyone with URL can send data)
- Data exfiltration from sheet

**Threats protected against**:
- XSS via stored data (Apps Script sanitizes)
- Infinite loops (timeouts)
- Resource exhaustion (quotas + auto-archiving)

### Security Layers

1. **Apps Script Execution Scope**
   - Runs as specific user
   - Limited to that user's permissions
   - Cannot access other users' data

2. **Sheet Permissions**
   - Explicit sharing required
   - Can revoke access anytime
   - Audit log of viewers/editors

3. **Data Sanitization**
   - No code execution from stored data
   - JSON stored as strings
   - Special characters handled by Sheets

4. **Quotas**
   - Max 20,000 URL fetches/day
   - Max 6 min script execution time
   - Auto-archiving prevents runaway growth

### Recommendations for Production

1. **Add Authentication**:
```javascript
// In webhook.gs
function doPost(e) {
  const authToken = e.parameter.auth || 
                    JSON.parse(e.postData.contents).auth;
  
  if (authToken !== PropertiesService
      .getScriptProperties()
      .getProperty('WEBHOOK_SECRET')) {
    return createResponse(401, 'Unauthorized');
  }
  
  // Continue processing...
}
```

2. **Limit to Specific Sites**:
```javascript
// Whitelist domains
const ALLOWED_ORIGINS = [
  'https://www.optimumnutrition.com',
  'https://staging.optimumnutrition.com'
];

function doPost(e) {
  const origin = e.parameter.origin;
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return createResponse(403, 'Forbidden');
  }
  // ...
}
```

3. **Rate Limiting** (Advanced):
```javascript
const cache = CacheService.getScriptCache();
const ip = e.parameter.userip;
const key = `ratelimit_${ip}`;
const count = parseInt(cache.get(key) || '0');

if (count > 100) {  // Max 100 requests per minute
  return createResponse(429, 'Too Many Requests');
}

cache.put(key, count + 1, 60);  // 60 second expiry
```

---

## Performance Characteristics

### Browser Performance

**Memory Usage**:
- Base: ~100 KB
- Per queued event: ~1 KB
- Typical (100 events queued): ~200 KB
- **Negligible impact on page performance**

**CPU Usage**:
- Event capture: <1ms per event
- Normalization: <5ms per event
- Batch send: ~10-50ms
- **Non-blocking, async operations**

**Network Usage**:
- Per event: ~500 bytes (gzipped)
- Batch of 10: ~5 KB
- Auto-send interval: 5 seconds
- **Minimal bandwidth impact**

### Apps Script Performance

**Execution Time**:
- Parse JSON: ~10ms
- Process 10 events: ~50ms
- Write to sheet: ~100-500ms
- Total: ~200-600ms per request

**Quota Limits**:
- URL Fetch calls: 20,000/day
- Script runtime: 6 min max
- Triggers: 90 min/day

**Optimization**:
- Batch writes (single `setValues()` call)
- Minimize sheet operations
- Cache frequently accessed data

### Scalability

**Events per Day**:
- Low: <1,000 (single user testing)
- Medium: 1,000-10,000 (team testing)
- High: 10,000-100,000 (continuous monitoring)

**At 50,000 events/day**:
- ~35 requests/minute (batch of 10)
- Well within quotas
- Sheet grows by ~50,000 rows/day
- Archive weekly (~350K rows)

**Bottlenecks**:
1. **Sheet row limit**: 10M rows (archive before reaching)
2. **Apps Script quotas**: 20K URL fetches (OK for 200K events/day)
3. **Browser memory**: Queue size (auto-send prevents buildup)

---

## Extension Points

### Adding New Event Types

1. **Update Detection**:
```javascript
// In isEventObject()
return 'event' in obj || 
       'event_name' in obj ||
       'your_new_field' in obj;
```

2. **Update Normalization**:
```javascript
// In normalizeEvent()
return {
  // ... existing fields
  your_new_field: eventObj.your_new_field || null
};
```

3. **Update Sheet Headers**:
```javascript
// In webhook.gs
const EVENT_HEADERS = [
  // ... existing headers
  'Your New Field'
];
```

4. **Update Row Builder**:
```javascript
// In buildEventRow()
return [
  // ... existing fields
  event.your_new_field || ''
];
```

### Adding New Reports

1. **Create Report Function**:
```javascript
// In reporting.gs
function generateYourReport() {
  const sheet = getOrCreateSheet('Your Report');
  // Process data
  // Write to sheet
}
```

2. **Add to Menu**:
```javascript
// In onOpen()
ui.createMenu('Pixel Inspector')
  .addItem('Your Report', 'generateYourReport')
  .addToUi();
```

### Multi-Tenant Support

**Option 1: Single Sheet, Multiple Sites**
```javascript
// Already supported via SITE_NAME
// Filter by site in reports
const siteEvents = events.filter(e => e.site_name === 'client-name');
```

**Option 2: Separate Sheets per Site**
```javascript
// In webhook.gs
const SHEET_NAME = requestData.metadata.site_name + '_Events';
const sheet = getOrCreateSheet(SHEET_NAME, EVENT_HEADERS);
```

**Option 3: Separate Apps Script per Site**
- Deploy multiple instances
- Different webhook URLs
- Completely isolated

---

## Monitoring & Observability

### Browser-Side Monitoring

```javascript
// View statistics
PixelInspector.stats();

// Monitor in real-time
setInterval(() => {
  console.log('Queue:', PixelInspector.stats().queued);
}, 5000);
```

### Apps Script Monitoring

**Execution Log**:
1. Apps Script → Executions
2. View recent runs
3. Check for errors
4. See execution time

**Error Sheet**:
- Auto-created on first error
- Tracks all errors with stack traces
- Review regularly

**Performance**:
```javascript
// Add timing
const startTime = new Date();
// ... processing
const endTime = new Date();
Logger.log(`Processing took ${endTime - startTime}ms`);
```

### Sheet Monitoring

**Formulas for Dashboard**:
```
// Total events
=COUNTA(Events!A:A)-1

// Events today
=COUNTIF(Events!A:A, ">="&TODAY())

// Error rate
=COUNTA(Errors!A:A)/COUNTA(Events!A:A)
```

---

## Deployment Patterns

### Development
- Single developer
- Local DevTools snippet
- Test sheet
- Frequent updates

### Staging
- QA team
- Shared bookmarklet
- Staging sheet
- Expectation validation

### Production
- Client site
- Minimal intervention
- Production sheet with archiving
- Monitoring & alerts

### Multi-Client
- Multiple instances
- Site-specific configs
- Separate sheets or tabs
- Centralized reporting (advanced)

---

## Future Enhancements

### Potential Features

1. **Real-Time Dashboard**
   - Live event stream
   - Visual charts
   - Alerts for missing events

2. **Enhanced Filtering**
   - Regex support
   - Complex boolean logic
   - Dynamic filters via UI

3. **Automated Testing**
   - Scheduled validation runs
   - Regression detection
   - Email alerts

4. **Data Export API**
   - REST API for event data
   - Integration with BI tools
   - Automated reporting

5. **Enhanced Security**
   - OAuth authentication
   - IP whitelisting
   - Encrypted payloads

---

## Conclusion

The Shopify Pixel Inspector provides a robust, scalable solution for event validation in constrained environments. Its modular architecture allows for easy extension and customization while maintaining reliability and performance.
