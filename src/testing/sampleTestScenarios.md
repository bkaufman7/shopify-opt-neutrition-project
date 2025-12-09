# Sample Test Scenarios

## Quick Test Script for DevTools Console

Run these commands in DevTools console after initializing Pixel Inspector to quickly validate functionality.

```javascript
// 1. Check initialization
PixelInspector.stats()

// 2. Send test page view
PixelInspector.sendEvent({
  event: 'test_page_view',
  event_source: 'manual',
  page_url: window.location.href,
  page_title: document.title
})

// 3. Send test click
PixelInspector.sendEvent({
  event: 'test_click',
  event_source: 'manual',
  click_text: 'Test Button',
  click_url: 'https://example.com/test',
  click_id: 'test-btn'
})

// 4. Send test ecommerce event
PixelInspector.sendEvent({
  event: 'test_add_to_cart',
  event_source: 'manual',
  product_id: 'TEST123',
  product_name: 'Test Product',
  price: 29.99,
  currency: 'USD',
  ecommerce: {
    items: [{
      item_id: 'TEST123',
      item_name: 'Test Product',
      price: 29.99,
      quantity: 1
    }]
  }
})

// 5. Check stats again
PixelInspector.stats()

// 6. Force flush
PixelInspector.flush()

// 7. View configuration
PixelInspector.config
```

## Shopify-Specific Test Cases

### Test Case: Product Page View
**URL**: https://www.optimumnutrition.com/products/gold-standard-100-whey

**Expected Events**:
1. `page_view` - Page load event
2. `view_item` - Product view event (if implemented)
3. `custom_pixel` events from Shopify

**Validation**:
```javascript
// After page loads, check events
PixelInspector.stats()
// Should show captured > 1

// Check for specific event
// (This would appear in console as events are captured)
```

### Test Case: Add to Cart Flow
**URL**: Product page

**Steps**:
1. Navigate to product page
2. Click "Add to Cart" button
3. Check console for events

**Expected Events**:
1. `click` event with button details
2. `add_to_cart` event (if Shopify pixel fires it)
3. `custom_click_link_storefront` (Shopify custom pixel)

### Test Case: Checkout Initiation
**URL**: Cart page → Checkout

**Steps**:
1. Add item to cart
2. Navigate to cart
3. Click "Checkout"

**Expected Events**:
1. `begin_checkout`
2. Click event on checkout button
3. Shopify checkout pixel events

### Test Case: Navigation Tracking
**Test Links**:
- Header navigation
- Footer links
- Product cards
- CTA buttons

**Validation**: Each click should generate a `click` event with:
- `click_text`: Button/link text
- `click_url`: Destination URL
- `click_tag`: Element type (a/button)

## Automated Test Events Generator

Run this in console to generate a series of test events automatically:

```javascript
(function generateTestEvents() {
  const events = [
    { event: 'page_view', event_source: 'auto_test', page_url: 'https://example.com/page1' },
    { event: 'click', event_source: 'auto_test', click_text: 'Header Link', click_url: 'https://example.com/about' },
    { event: 'click', event_source: 'auto_test', click_text: 'CTA Button', click_url: 'https://example.com/products' },
    { event: 'view_item', event_source: 'auto_test', product_id: 'PROD001', product_name: 'Gold Standard Whey' },
    { event: 'add_to_cart', event_source: 'auto_test', product_id: 'PROD001', price: 59.99 },
    { event: 'page_view', event_source: 'auto_test', page_url: 'https://example.com/cart' },
    { event: 'begin_checkout', event_source: 'auto_test', currency: 'USD' },
    { event: 'click', event_source: 'auto_test', click_text: 'Complete Order', click_url: 'https://example.com/checkout' },
    { event: 'purchase', event_source: 'auto_test', transaction_id: 'TEST_' + Date.now(), value: 59.99 },
    { event: 'page_view', event_source: 'auto_test', page_url: 'https://example.com/thank-you' }
  ];
  
  let index = 0;
  const interval = setInterval(() => {
    if (index >= events.length) {
      clearInterval(interval);
      console.log('✅ All test events sent!');
      PixelInspector.stats();
      return;
    }
    
    PixelInspector.sendEvent(events[index]);
    console.log(`Sent event ${index + 1}/${events.length}: ${events[index].event}`);
    index++;
  }, 500);
})();
```

## Visual Test Checklist

Use this checklist when manually testing on live site:

### Homepage Tests
- [ ] Page loads → `page_view` captured
- [ ] Click main navigation → `click` captured with correct URL
- [ ] Click hero CTA → `click` captured
- [ ] Scroll page → scroll events (if tracking enabled)

### Product Page Tests
- [ ] Product page loads → `page_view` + `view_item`
- [ ] Click product image → `click` event
- [ ] Change variant → variant change event (if applicable)
- [ ] Click "Add to Cart" → `click` + `add_to_cart`
- [ ] Click breadcrumb → `click` with navigation data

### Collection Page Tests
- [ ] Collection loads → `page_view`
- [ ] Filter products → filter events (if applicable)
- [ ] Click product card → `click` with product URL
- [ ] Click "Load More" → `click` event

### Cart Tests
- [ ] View cart → `page_view`
- [ ] Update quantity → update events (if tracked)
- [ ] Click "Checkout" → `click` + `begin_checkout`

### Checkout Tests
- [ ] Checkout page loads → `page_view`
- [ ] Fill form fields → form events (if tracking enabled)
- [ ] Click "Place Order" → `click` event
- [ ] Thank you page → `page_view` + `purchase`

## Performance Testing

### Load Test
Generate 100 events rapidly to test queue management:

```javascript
for (let i = 0; i < 100; i++) {
  PixelInspector.sendEvent({
    event: 'load_test_event',
    event_source: 'load_test',
    iteration: i,
    timestamp: new Date().toISOString()
  });
}

console.log('Load test complete');
PixelInspector.stats();
```

**Expected**: 
- All events captured
- Auto-batching at BATCH_SIZE
- No browser freeze
- All events eventually sent

### Stress Test - Rapid Clicks
```javascript
let clickCount = 0;
const interval = setInterval(() => {
  if (clickCount >= 50) {
    clearInterval(interval);
    return;
  }
  
  document.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true
  }));
  
  clickCount++;
}, 10);
```

## Error Simulation Tests

### Invalid Webhook Test
```javascript
// Store original
const originalURL = PixelInspector.config.WEBHOOK_URL;

// Set invalid
PixelInspector.config.WEBHOOK_URL = 'https://invalid-url-12345.example.com';

// Send event
PixelInspector.sendEvent({ event: 'test_error', event_source: 'error_test' });

// Wait and check stats
setTimeout(() => {
  const stats = PixelInspector.stats();
  console.log('Failed count:', stats.failed);
  
  // Restore
  PixelInspector.config.WEBHOOK_URL = originalURL;
}, 3000);
```

### Network Offline Test
```javascript
// Simulate offline
console.log('Simulating offline...');

// Send events
PixelInspector.sendEvent({ event: 'offline_test', event_source: 'offline' });

// Events should be queued and retry when online
console.log('Events queued:', PixelInspector.stats().queued);
```

## Reporting Validation

After collecting test data, validate reports in Google Sheets:

### Summary Report Validation
1. Open "Summary" sheet
2. Verify totals match expectations
3. Check event name groupings
4. Validate date aggregations

### Missing Events Report Validation
1. Add expected events to "Expectations" sheet:
   ```
   Event Name                      | URL Pattern           | Required | Description
   page_view                       | *                     | Yes      | All pages
   custom_click_link_storefront    | */products/*          | Yes      | Product clicks
   add_to_cart                     | */products/*          | Yes      | Add to cart
   ```

2. Run `generateMissingEventsReport()`
3. Check which events are missing
4. Validate against actual test execution

### URL Coverage Validation
1. Run `generateURLCoverageReport()`
2. Verify matrix shows all tested URLs
3. Check event counts per URL
4. Identify gaps in coverage

## Expected Test Results Summary

**Minimum Passing Criteria**:
- ✅ Page view events: 100% capture rate
- ✅ Click events: 95%+ capture rate (some non-relevant clicks filtered)
- ✅ Data transmission: 100% success rate (with valid webhook)
- ✅ Google Sheets: All events appear within 10 seconds
- ✅ Reports: Generate without errors
- ✅ Browser compatibility: Works in Chrome, Firefox, Safari
- ✅ No console errors (except expected network errors in error tests)

**Performance Benchmarks**:
- Event capture latency: < 10ms
- Batch send latency: < 500ms
- Memory usage: < 5MB for 1000 events queued
- No noticeable impact on page performance
