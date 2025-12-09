# Troubleshooting Guide

## Quick Diagnostics

Run these commands in console to diagnose issues:

```javascript
// 1. Check if Pixel Inspector is loaded
typeof PixelInspector

// 2. Check initialization status
PixelInspector.stats()

// 3. View configuration
PixelInspector.config

// 4. Check webhook URL
console.log(PixelInspector.config.WEBHOOK_URL)

// 5. Check event queue
PixelInspector.state?.eventQueue
```

---

## Common Issues & Solutions

### 1. Pixel Inspector Not Initializing

#### Symptom:
- No console messages
- `PixelInspector is not defined` error
- Script seems to do nothing

#### Diagnosis:
```javascript
typeof PixelInspector === 'undefined'  // Returns true
```

#### Solutions:

**A. Script not loaded**
- Verify you copied the entire script
- Check for JavaScript errors in console
- Ensure you pressed Enter after pasting

**B. Script loaded but not initialized**
- Check for errors during initialization
- Look for error messages in console
- Try manual initialization:
  ```javascript
  PixelInspector.init()
  ```

**C. Snippet not run**
- Right-click snippet → Run
- Or click Run button (▶️)

**D. Bookmarklet not working**
- Ensure code starts with `javascript:`
- Check for encoding issues
- Try recreating bookmarklet

---

### 2. Events Not Being Captured

#### Symptom:
- `PixelInspector.stats()` shows `captured: 0`
- No event messages in console
- Events firing but not detected

#### Diagnosis:
```javascript
// Check if console.log was intercepted
console.log === PixelInspector.state?.originalConsoleLog  // Should be false

// Check filters
PixelInspector.config.EVENT_FILTERS
```

#### Solutions:

**A. Events filtered out**
```javascript
// Disable all filters
PixelInspector.config.EVENT_FILTERS.captureAll = true;
```

**B. Events don't match detection criteria**

The interceptor looks for objects with these properties:
- `event` or `event_name`
- `event_source`
- `ecommerce`
- `click_text` or `click_url`

Manually send test event:
```javascript
console.log({
  event: 'test',
  event_source: 'manual'
});
```

**C. Console.log called before interceptor initialized**
- Events logged before Pixel Inspector loads won't be captured
- Reload page and initialize earlier

**D. Events in iframe**
- If events are in an isolated iframe, they won't be captured
- Pixel Inspector must run in the same context as events

---

### 3. Events Not Sending to Google Sheets

#### Symptom:
- `PixelInspector.stats()` shows `captured > 0` but `sent: 0`
- Events queued but not sending
- `failed` count increasing

#### Diagnosis:
```javascript
// Check stats
const stats = PixelInspector.stats();
console.log('Queued:', stats.queued);
console.log('Failed:', stats.failed);

// Check webhook URL
console.log('Webhook:', PixelInspector.config.WEBHOOK_URL);

// Try manual flush
PixelInspector.flush();
```

#### Solutions:

**A. Invalid webhook URL**
```javascript
// Verify URL format
const url = PixelInspector.config.WEBHOOK_URL;
console.log('Valid URL:', url.startsWith('https://script.google.com'));

// Update if wrong
PixelInspector.config.WEBHOOK_URL = 'YOUR_CORRECT_URL';
PixelInspector.flush();
```

**B. CORS error**

Check console for:
```
Access to fetch at 'https://script.google.com/...' from origin '...' has been blocked by CORS policy
```

Solutions:
1. Redeploy Apps Script
2. Ensure deployment is "Anyone" access
3. Check Apps Script execution log for errors

**C. Network error**

Check console for:
```
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

Solutions:
- Check internet connection
- Try different network (not behind strict firewall)
- Verify Apps Script is not down

**D. Apps Script error**

1. Open Apps Script project
2. View → Executions
3. Check for errors in execution log
4. Common errors:
   - "Cannot read property..." → Missing sheet
   - "Unauthorized" → Reauthorize deployment
   - "Timeout" → Large payload, reduce batch size

---

### 4. Data Appearing Incorrectly in Sheets

#### Symptom:
- Events in sheet but data is wrong
- Missing columns
- Corrupted JSON

#### Solutions:

**A. Sheet headers don't match**

In Apps Script, check `EVENT_HEADERS` array matches your sheet columns.

**B. Data truncated**

Large fields are auto-truncated. Check:
```javascript
// In webhook.gs
function truncateText(text, maxLength) {
  // Increase maxLength if needed
}
```

**C. JSON parse errors**

Events with circular references or invalid JSON fail. Check Apps Script execution log.

**D. Wrong sheet name**

```javascript
// In Apps Script, verify
const WEBHOOK_CONFIG = {
  SHEET_NAME: 'Events',  // Must match actual sheet name
  // ...
};
```

---

### 5. Click Events Not Captured

#### Symptom:
- Page views work
- Manual events work
- But clicks on links/buttons not captured

#### Diagnosis:
```javascript
// Check if click listener attached
// Click anywhere and check console for click event
```

#### Solutions:

**A. Click listener not attached**

Verify in console:
```javascript
// Should see this during init
[Pixel Inspector] Click listeners attached
```

If not, manually attach:
```javascript
// Reinitialize
PixelInspector.stop();
PixelInspector.init();
```

**B. Element not detected as clickable**

The interceptor looks for:
- `<a>` tags
- `<button>` tags  
- Elements with `onclick` attribute
- Elements with `data-track` attribute

For custom elements:
```javascript
// Manually send click event
PixelInspector.sendEvent({
  event: 'click',
  event_source: 'manual',
  click_text: 'Button Text',
  click_url: 'https://example.com'
});
```

**C. Click depth too shallow**

Interceptor traverses 5 levels up. If your element is nested deeper, increase:
```javascript
// In extractClickData function
const maxDepth = 5;  // Increase to 10
```

---

### 6. Reports Not Generating

#### Symptom:
- Apps Script menu item doesn't work
- Reports generate but are empty
- Script timeout errors

#### Solutions:

**A. No menu appearing**

Refresh the Google Sheet. Menu is added via `onOpen()` function.

Manually run:
```javascript
// In Apps Script editor
onOpen()
```

**B. Empty reports**

Check if Events sheet has data:
1. Open "Events" tab
2. Verify rows exist (beyond header)
3. Check sheet name matches config

**C. Script timeout**

For large datasets (>10,000 rows):
```javascript
// Process in batches
// Modify report functions to limit data range
const maxRows = 5000;
const data = eventsSheet.getRange(1, 1, Math.min(maxRows, eventsSheet.getLastRow()), eventsSheet.getLastColumn()).getValues();
```

**D. Permission errors**

Ensure Apps Script has permission to modify the sheet:
1. Run any report function manually
2. Authorize if prompted
3. Check execution log for permission errors

---

### 7. Missing Events Report Issues

#### Symptom:
- Report shows no missing events when you know there are
- Report shows false positives
- URL patterns not matching

#### Solutions:

**A. Expectations sheet not found**

Create "Expectations" sheet or run:
```javascript
// In Apps Script
createExpectationsTemplate()
```

**B. URL pattern not matching**

Test your patterns:
```javascript
// Add to reporting.gs for testing
function testPattern() {
  const url = 'https://example.com/products/test';
  const pattern = '*/products/*';
  console.log(urlPatternMatches(url, pattern));
}
```

Patterns:
- Exact match: `https://example.com/products`
- Wildcard: `*/products/*` matches any domain + path
- Specific: `https://example.com/products/*` matches only that domain

**C. Events present but not detected**

Check event_name exactly matches:
- Case-sensitive
- No extra spaces
- Underscores vs. hyphens

---

### 8. Performance Issues

#### Symptom:
- Page feels slow
- Browser freezing
- High memory usage

#### Solutions:

**A. Too many events queued**

```javascript
// Check queue size
PixelInspector.stats().queued

// Reduce batch size
PixelInspector.config.BATCH_SIZE = 5;

// Reduce auto-send interval
PixelInspector.config.AUTO_SEND_INTERVAL = 2000;  // 2 seconds
```

**B. Debug mode too verbose**

```javascript
// Disable debug logs
PixelInspector.config.DEBUG_MODE = false;
```

**C. Too many events captured**

```javascript
// Enable filtering
PixelInspector.config.EVENT_FILTERS = {
  captureAll: false,
  eventNames: ['page_view', 'purchase', 'add_to_cart'],
  eventSources: ['custom_pixel']
};
```

**D. Memory leak**

Stop and restart:
```javascript
PixelInspector.stop();
// Wait a few seconds
PixelInspector.init();
```

---

### 9. Bookmarklet Specific Issues

#### Symptom:
- Bookmarklet doesn't run
- Nothing happens when clicked
- Error: "Script error"

#### Solutions:

**A. URL encoding issues**

The bookmarklet must be properly encoded:
- Starts with `javascript:`
- No line breaks
- Special characters escaped

Use a bookmarklet generator or ensure single-line code.

**B. Browser security**

Some browsers block bookmarklets on certain sites:
- Try a different browser
- Use DevTools snippet instead

**C. Code too long**

Most browsers limit bookmark URL length to ~2000 characters.

If code is too long:
- Remove comments
- Use shorter variable names
- Host code externally and load via bookmarklet

**D. Permissions**

Bookmarklets may not work on:
- `chrome://` pages
- `about:` pages
- Some HTTPS sites with strict CSP

Use DevTools snippet as alternative.

---

### 10. Apps Script Deployment Issues

#### Symptom:
- Can't deploy
- "Authorization required" loop
- Deployment succeeds but webhook doesn't work

#### Solutions:

**A. Authorization loop**

1. Clear browser cache and cookies for `script.google.com`
2. Use incognito/private window
3. Try different browser
4. Ensure you're logged into correct Google account

**B. Script disabled**

Check if project is archived:
1. Apps Script → My Projects
2. Find your project
3. Ensure it's not in "Archived"

**C. API not enabled**

Some Google Workspace accounts require admin to enable Apps Script API:
1. Contact workspace admin
2. Request Apps Script API enablement

**D. Wrong deployment type**

Ensure you selected "Web app" not "API executable"

**E. Permissions too restrictive**

Set "Who has access" to "Anyone" (development) or specific users (production).

---

### 11. Multi-Site Configuration Issues

#### Symptom:
- Multiple sites logging to same sheet with same site name
- Can't distinguish between clients

#### Solutions:

**A. Update SITE_NAME per deployment**

For each client:
```javascript
const SITE_NAME = "client-1";  // Different for each client
```

**B. Dynamic site detection**

```javascript
// Auto-detect from domain
const SITE_NAME = window.location.hostname.split('.')[0];
// example.com → "example"
```

**C. Separate sheets per client**

Use different webhook URLs:
1. Deploy separate Apps Script for each client
2. Each points to different sheet
3. Maintain separate configurations

---

### 12. Shopify Custom Pixel Specific Issues

#### Symptom:
- Shopify pixel events not captured
- Custom pixel events missing

#### Solutions:

**A. Events in isolated iframe**

If Shopify loads custom pixels in a sandboxed iframe, you cannot intercept them directly.

**Workaround**:
- Use Shopify's analytics.track() if available
- Capture postMessage events from iframe
- Check Shopify documentation for custom pixel debugging

**B. Events fire before interceptor loads**

Shopify pixels may fire very early. Ensure interceptor loads ASAP:
- Add to page `<head>` if possible
- Run snippet immediately on page load
- Use bookmarklet before navigating

**C. Event format different**

Shopify custom pixels may use different event format:
```javascript
// Check actual event structure
console.log('Event object:', eventObject);

// Adjust isEventObject() function if needed
```

---

## Debugging Workflow

### Step 1: Identify Issue Category

| Symptom | Category |
|---------|----------|
| No console messages | Initialization |
| Console messages but no capture | Event Detection |
| Events captured but not sent | Transmission |
| Events sent but not in sheet | Apps Script/Sheets |
| Events in sheet but wrong data | Data Format |
| Reports not working | Apps Script |

### Step 2: Check Basics

```javascript
// 1. Is it loaded?
console.log(typeof PixelInspector);

// 2. Is it initialized?
console.log(PixelInspector.stats());

// 3. What's the configuration?
console.log(PixelInspector.config);

// 4. Any errors?
// Check console for red error messages
```

### Step 3: Test Each Component

```javascript
// Test event capture
console.log({ event: 'test', event_source: 'debug' });

// Test transmission
PixelInspector.sendEvent({ event: 'test_send', event_source: 'debug' });
PixelInspector.flush();

// Check after 5 seconds
setTimeout(() => {
  console.log('Stats:', PixelInspector.stats());
}, 5000);
```

### Step 4: Check Backend

1. Open Apps Script → Executions
2. Look for errors
3. Check Google Sheet for test events
4. Verify sheet structure

### Step 5: Isolate Variables

- Test on simple page first
- Use manual events before relying on automatic capture
- Test webhook independently: `testWebhook()` in Apps Script

---

## Getting Help

### Before Asking for Help

Gather this information:

1. **Environment**:
   - Browser & version
   - Deployment method (snippet/bookmarklet)
   - Site URL (if not confidential)

2. **Configuration**:
   ```javascript
   // Share configuration (remove sensitive URLs)
   console.log(JSON.stringify({
     site: PixelInspector.config.SITE_NAME,
     batchSize: PixelInspector.config.BATCH_SIZE,
     filters: PixelInspector.config.EVENT_FILTERS
   }, null, 2));
   ```

3. **Stats**:
   ```javascript
   console.log(JSON.stringify(PixelInspector.stats(), null, 2));
   ```

4. **Errors**:
   - Copy any console error messages
   - Screenshot if needed

5. **Steps to reproduce**:
   - What you did
   - What you expected
   - What actually happened

---

## Advanced Debugging

### Enable Verbose Logging

```javascript
// Add to consoleInterceptor.js
const VERBOSE_DEBUG = true;

function logDebug(...args) {
  if (PIXEL_INSPECTOR_CONFIG.DEBUG_MODE || VERBOSE_DEBUG) {
    PixelInspector.originalConsoleLog?.apply(console, [
      '%c[Pixel Inspector]',
      'color: blue; font-weight: bold;',
      new Date().toISOString(),
      ...args
    ]);
  }
}
```

### Monitor Network Requests

```javascript
// In DevTools
// Network tab → Filter: "script.google.com"
// Watch POST requests to webhook
// Inspect payload and response
```

### Intercept Fetch for Debugging

```javascript
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch called:', args);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('Fetch response:', response);
      return response;
    });
};
```

### Apps Script Debugging

```javascript
// Add to webhook.gs
function debugLog(message, data) {
  Logger.log(`[DEBUG] ${message}: ${JSON.stringify(data)}`);
  
  // Also write to sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let debugSheet = ss.getSheetByName('Debug Log');
  if (!debugSheet) {
    debugSheet = ss.insertSheet('Debug Log');
    debugSheet.appendRow(['Timestamp', 'Message', 'Data']);
  }
  debugSheet.appendRow([new Date(), message, JSON.stringify(data)]);
}
```

---

## Still Having Issues?

If none of these solutions work:

1. **Check GitHub Issues**: https://github.com/bkaufman7/shopify-opt-neutrition-project/issues
2. **Create New Issue**: Include all information from "Before Asking for Help"
3. **Contact Team Lead**: [Your contact info]
4. **Review Logs**:
   - Browser console log
   - Apps Script execution log
   - Google Sheet error log (if exists)

---

## Known Limitations

1. **Cannot intercept events in isolated iframes** - If Shopify Custom Pixel uses strict sandbox, events may not be accessible

2. **Page load events** - Events that fire before Pixel Inspector loads cannot be captured

3. **sendBeacon() reliability** - Page unload events may be lost if browser terminates too quickly

4. **Apps Script quotas** - Limited to 20,000 URL Fetch calls per day (shouldn't hit this normally)

5. **Browser compatibility** - Some older browsers may not support all features

6. **Ad blockers** - May interfere with script execution or network requests

---

## Preventive Measures

### Best Practices to Avoid Issues:

1. **Always test on staging first**
2. **Keep webhook URL secure but accessible**
3. **Document any customizations**
4. **Regularly check Apps Script execution log**
5. **Monitor Google Sheet for anomalies**
6. **Keep code updated with latest version**
7. **Train team on proper usage**
8. **Have rollback plan ready**

### Monitoring Checklist:

- [ ] Events flowing to sheet regularly
- [ ] No spike in `failed` count
- [ ] Apps Script executions succeeding
- [ ] Sheet not approaching row limit
- [ ] No unusual patterns in data
- [ ] Team members reporting no issues

---

## Emergency Procedures

### If System Goes Down:

1. **Stop data collection**:
   ```javascript
   PixelInspector.stop();
   ```

2. **Check Apps Script status**: View → Executions

3. **Verify webhook URL**: Test with GET request

4. **Rollback if needed**: Revert to previous Apps Script version

5. **Notify team**: Alert stakeholders of downtime

6. **Document issue**: Record what happened for future reference

### Recovery:

1. Fix underlying issue
2. Test thoroughly on dev/staging
3. Redeploy to production
4. Verify with test events
5. Monitor closely for 24 hours
6. Post-mortem meeting if major incident
