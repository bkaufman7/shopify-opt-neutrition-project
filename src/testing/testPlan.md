# Pixel Inspector Test Plan

## Overview
This document provides a comprehensive testing strategy for validating the Shopify Pixel Inspector tool across different scenarios and event types.

## Test Environment Setup

### Prerequisites
- [ ] Google Apps Script webhook deployed and URL copied
- [ ] Webhook URL configured in browser interceptor
- [ ] DevTools Snippet installed OR Bookmarklet created
- [ ] Google Sheet with Events tab created
- [ ] Access to Shopify storefront (Optimum Nutrition or test site)

### Configuration Checklist
1. Update `WEBHOOK_URL` in consoleInterceptor.js
2. Update `SITE_NAME` for the client being tested
3. Verify Apps Script has permissions to write to Google Sheets
4. Test webhook endpoint with GET request (should show status page)

---

## Test Suite 1: Installation & Initialization

### Test 1.1: DevTools Snippet Installation
**Objective**: Verify the snippet can be installed and runs without errors

**Steps**:
1. Open Chrome DevTools (F12)
2. Navigate to Sources > Snippets
3. Create new snippet named "Pixel Inspector"
4. Paste code from `src/browser/devtoolsSnippet.js`
5. Update `WEBHOOK_URL` constant
6. Right-click snippet and select "Run"

**Expected Results**:
- ✅ Green success message in console: `[Pixel Inspector] ✓ Initialized successfully!`
- ✅ No error messages
- ✅ `PixelInspector` object available in console
- ✅ `PixelInspector.stats()` returns valid statistics

**Pass/Fail**: ________

**Notes**: _____________________

---

### Test 1.2: Bookmarklet Installation
**Objective**: Verify bookmarklet can be created and activated

**Steps**:
1. Create new bookmark in browser
2. Copy bookmarklet code from `src/browser/bookmarklet.js`
3. Paste as bookmark URL
4. Navigate to any Shopify page
5. Click the bookmarklet

**Expected Results**:
- ✅ Console shows `[PI] Initializing...`
- ✅ Console shows `[PI] Initialized!`
- ✅ No JavaScript errors
- ✅ `PixelInspector` object available

**Pass/Fail**: ________

**Notes**: _____________________

---

## Test Suite 2: Event Capture

### Test 2.1: Page View Event
**Objective**: Verify page view events are captured on page load

**Test URLs**:
- Homepage: `https://www.optimumnutrition.com/`
- Product page: `https://www.optimumnutrition.com/products/gold-standard-100-whey`
- Collection page: `https://www.optimumnutrition.com/collections/protein-powder`

**Steps**:
1. Start Pixel Inspector
2. Navigate to test URL
3. Wait 5 seconds
4. Check console for captured events
5. Run `PixelInspector.stats()`

**Expected Results**:
- ✅ Console shows: `[Pixel Inspector] Event captured [1]: page_view`
- ✅ Event contains `page_url`, `page_title`, `page_path`
- ✅ Event source is `pixel_inspector`
- ✅ Stats show `captured: 1`

**Actual Results**:

| URL | Event Captured | Page Title Correct | Timestamp Present |
|-----|----------------|-------------------|-------------------|
| Homepage | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| Product | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| Collection | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |

**Pass/Fail**: ________

---

### Test 2.2: Click Event Capture
**Objective**: Verify click events on CTAs are captured

**Test Scenarios**:

#### Scenario A: Navigation Link Click
**Steps**:
1. Navigate to homepage
2. Start Pixel Inspector
3. Click on main navigation link (e.g., "Products")
4. Check console

**Expected Results**:
- ✅ Click event captured
- ✅ `click_text` contains link text
- ✅ `click_url` contains destination URL
- ✅ `click_tag` is "a"

**Actual Results**: _____________________

#### Scenario B: Button Click
**Steps**:
1. Navigate to product page
2. Click "Add to Cart" button
3. Check console

**Expected Results**:
- ✅ Click event captured
- ✅ `click_text` contains "Add to Cart" or similar
- ✅ `click_tag` is "button"

**Actual Results**: _____________________

#### Scenario C: Product Card Click
**Steps**:
1. Navigate to collection page
2. Click on a product image or title
3. Check console

**Expected Results**:
- ✅ Click event captured
- ✅ `click_url` points to product page
- ✅ Click metadata present

**Actual Results**: _____________________

**Pass/Fail**: ________

---

### Test 2.3: Console.log Event Capture
**Objective**: Verify events logged to console are intercepted

**Steps**:
1. Start Pixel Inspector
2. Open console
3. Run: `console.log({ event: 'test_event', event_source: 'manual_test', custom_field: 'test_value' })`
4. Check if event was captured

**Expected Results**:
- ✅ Console shows: `[Pixel Inspector] Event captured`
- ✅ Event appears in queue
- ✅ Original console.log still displays the object

**Actual Results**: _____________________

**Pass/Fail**: ________

---

### Test 2.4: DataLayer.push Capture
**Objective**: Verify dataLayer pushes are intercepted (if GTM present)

**Steps**:
1. Check if `window.dataLayer` exists: `console.log(typeof window.dataLayer)`
2. If exists, push test event: `window.dataLayer.push({ event: 'test_dl_event', test: true })`
3. Check Pixel Inspector console output

**Expected Results**:
- ✅ If dataLayer exists: Event captured with source `datalayer`
- ✅ If no dataLayer: Console shows "No dataLayer found"

**Actual Results**: _____________________

**Pass/Fail**: ________

---

### Test 2.5: Shopify Custom Pixel Events
**Objective**: Verify Shopify-specific events are captured

**Expected Events on Optimum Nutrition**:
- `custom_click_link_storefront`
- Custom pixel events from Shopify

**Steps**:
1. Navigate to product page
2. Start Pixel Inspector
3. Interact with page (clicks, scrolls)
4. Monitor console for Shopify events
5. Check for events with `event_source: "custom_pixel"`

**Expected Results**:
- ✅ Shopify pixel events appear in console
- ✅ Events contain `event_source: "custom_pixel"`
- ✅ Event metadata includes click/interaction data

**Actual Results**: _____________________

**Pass/Fail**: ________

---

## Test Suite 3: Data Transmission

### Test 3.1: Auto-Send Batch
**Objective**: Verify events auto-send when batch size reached

**Steps**:
1. Set `BATCH_SIZE: 3` in config
2. Start Pixel Inspector
3. Generate 3 events (page view + 2 clicks)
4. Watch console for send confirmation

**Expected Results**:
- ✅ Console shows: `Sending 3 events to webhook...`
- ✅ Console shows: `✓ Sent 3 events via fetch`
- ✅ `PixelInspector.stats()` shows `sent: 3`

**Actual Results**: _____________________

**Pass/Fail**: ________

---

### Test 3.2: Manual Flush
**Objective**: Verify manual flush sends queued events

**Steps**:
1. Start Pixel Inspector
2. Generate 1-2 events
3. Run: `PixelInspector.flush()`
4. Check console

**Expected Results**:
- ✅ Events sent immediately
- ✅ Queue emptied
- ✅ Stats updated

**Actual Results**: _____________________

**Pass/Fail**: ________

---

### Test 3.3: Page Unload Flush
**Objective**: Verify events flush on page navigation

**Steps**:
1. Start Pixel Inspector
2. Generate 1 event
3. Navigate to different page (before auto-send interval)
4. Check Google Sheet for event

**Expected Results**:
- ✅ Event appears in Google Sheet
- ✅ Sent via `sendBeacon` or `fetch` with `keepalive`

**Actual Results**: _____________________

**Pass/Fail**: ________

---

### Test 3.4: Google Sheet Data Validation
**Objective**: Verify data appears correctly in Google Sheets

**Steps**:
1. Send 5 test events with distinct data
2. Open Google Sheet
3. Check "Events" tab
4. Verify all columns populated correctly

**Expected Results**:
- ✅ All 5 events present
- ✅ Timestamp accurate
- ✅ Event Name correct
- ✅ Page URL captured
- ✅ Click data populated (for click events)
- ✅ Raw JSON column contains full payload

**Actual Results**:

| Column | Populated | Accurate |
|--------|-----------|----------|
| Timestamp | ☐ | ☐ |
| Event Name | ☐ | ☐ |
| Event Source | ☐ | ☐ |
| Page URL | ☐ | ☐ |
| Click Text | ☐ | ☐ |
| Click URL | ☐ | ☐ |
| Raw JSON | ☐ | ☐ |

**Pass/Fail**: ________

---

## Test Suite 4: Reporting

### Test 4.1: Generate Summary Report
**Objective**: Verify summary report generation

**Steps**:
1. Ensure at least 10 events in sheet
2. Open Google Apps Script editor
3. Run `generateSummaryReport()`
4. Check "Summary" sheet

**Expected Results**:
- ✅ Summary sheet created
- ✅ Total events count displayed
- ✅ Events by name aggregated
- ✅ Events by source aggregated
- ✅ Top URLs listed

**Actual Results**: _____________________

**Pass/Fail**: ________

---

### Test 4.2: Missing Events Detection
**Objective**: Verify missing events are detected

**Steps**:
1. Create "Expectations" sheet with sample expectations
2. Ensure some expected events are missing
3. Run `generateMissingEventsReport()`
4. Check "Missing Events Report" sheet

**Expected Results**:
- ✅ Missing events identified
- ✅ Required events highlighted
- ✅ URL patterns matched correctly

**Actual Results**: _____________________

**Pass/Fail**: ________

---

### Test 4.3: URL Coverage Report
**Objective**: Verify URL coverage matrix

**Steps**:
1. Generate events on multiple URLs
2. Run `generateURLCoverageReport()`
3. Check "URL Coverage" sheet

**Expected Results**:
- ✅ Matrix shows URLs vs. Events
- ✅ Counts accurate
- ✅ Easy to identify coverage gaps

**Actual Results**: _____________________

**Pass/Fail**: ________

---

### Test 4.4: Click Analysis Report
**Objective**: Verify click analysis

**Steps**:
1. Generate multiple click events
2. Run `generateClickAnalysisReport()`
3. Check "Click Analysis" sheet

**Expected Results**:
- ✅ Clicks aggregated by text/URL
- ✅ Click counts accurate
- ✅ Pages listed correctly

**Actual Results**: _____________________

**Pass/Fail**: ________

---

## Test Suite 5: Edge Cases & Error Handling

### Test 5.1: Invalid Webhook URL
**Objective**: Verify graceful handling of failed sends

**Steps**:
1. Set `WEBHOOK_URL` to invalid URL
2. Start Pixel Inspector
3. Generate events
4. Check console

**Expected Results**:
- ✅ Error logged gracefully
- ✅ `PixelInspector.stats()` shows `failed` count
- ✅ No JavaScript errors thrown
- ✅ Events re-queued (if not flush)

**Actual Results**: _____________________

**Pass/Fail**: ________

---

### Test 5.2: Large Payload Handling
**Objective**: Verify large payloads are handled

**Steps**:
1. Send event with large `ecommerce` object
2. Check Google Sheet

**Expected Results**:
- ✅ Event stored successfully
- ✅ Large JSON truncated if needed
- ✅ No errors

**Actual Results**: _____________________

**Pass/Fail**: ________

---

### Test 5.3: Rapid Click Detection
**Objective**: Verify rapid successive clicks are captured

**Steps**:
1. Start Pixel Inspector
2. Click same link 5 times rapidly
3. Check console

**Expected Results**:
- ✅ All 5 clicks captured
- ✅ No events dropped

**Actual Results**: _____________________

**Pass/Fail**: ________

---

### Test 5.4: Stop and Restart
**Objective**: Verify clean stop and restart

**Steps**:
1. Start Pixel Inspector
2. Generate events
3. Run `PixelInspector.stop()`
4. Run `PixelInspector.init()`
5. Generate more events

**Expected Results**:
- ✅ Stop flushes events
- ✅ Console.log restored
- ✅ Restart works correctly
- ✅ No duplicate captures

**Actual Results**: _____________________

**Pass/Fail**: ________

---

## Test Suite 6: Cross-Browser & Environment

### Test 6.1: Chrome Desktop
**Browser**: Chrome (latest)
**OS**: Windows/Mac
**Status**: ☐ Pass ☐ Fail
**Notes**: _____________________

---

### Test 6.2: Firefox Desktop
**Browser**: Firefox (latest)
**OS**: Windows/Mac
**Status**: ☐ Pass ☐ Fail
**Notes**: _____________________

---

### Test 6.3: Safari Desktop
**Browser**: Safari (latest)
**OS**: Mac
**Status**: ☐ Pass ☐ Fail
**Notes**: _____________________

---

### Test 6.4: Mobile Chrome
**Browser**: Chrome Mobile
**OS**: Android/iOS
**Status**: ☐ Pass ☐ Fail
**Notes**: _____________________

---

## Summary Report

**Total Tests**: 24
**Tests Passed**: ____
**Tests Failed**: ____
**Pass Rate**: ____%

**Critical Issues**: 
_____________________

**Recommendations**:
_____________________

**Tested By**: _____________________
**Date**: _____________________
**Version**: 1.0.0
