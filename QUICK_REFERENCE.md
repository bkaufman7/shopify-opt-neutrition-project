# Pixel Inspector - Quick Reference Card

## 🚀 Instant Setup (3 Commands)

```javascript
// 1. Paste config helper into console
// (Copy from: src/browser/configHelper.js)

// 2. Configure for Optimum Nutrition
PixelConfigHelper.setupOptimumNutrition("YOUR_WEBHOOK_URL_HERE");

// 3. Show config and copy into snippet
PixelConfigHelper.showConfig();
```

## 📋 Essential Console Commands

```javascript
// Check if Pixel Inspector is running
typeof PixelInspector

// View statistics
PixelInspector.stats()

// Send events immediately
PixelInspector.flush()

// Stop capturing
PixelInspector.stop()

// Restart capturing
PixelInspector.init()

// View configuration
PixelInspector.config

// Send a test event
PixelInspector.sendEvent({
  event: 'test_event',
  event_source: 'manual',
  custom_field: 'test'
})
```

## 🔍 GTM Custom Pixel Console Commands

```javascript
// Check for dataLayer on parent page
console.log(window.dataLayer)

// Find Custom Pixel iframes
document.querySelectorAll('iframe')

// Look for Shopify pixel iframes specifically
document.querySelector('iframe[name*="shopify"]')
document.querySelector('iframe[src*="custom-pixel"]')

// Test if dataLayer exists and is accessible
if (window.dataLayer) {
  console.log('✅ dataLayer found:', window.dataLayer.length, 'events')
} else {
  console.log('❌ No parent-level dataLayer')
}
```

## 📊 Expected Events by Page

### Homepage
- `page_view`
- Click events on navigation
- Click events on hero CTAs
- Click events on product cards

### Product Page
- `page_view`
- `view_item` (GTM ecommerce)
- Click: "Add to Cart" button
- `add_to_cart` event
- Click events on images/related products

### Collection Page
- `page_view`
- Click events on product cards
- Click events on filters (if tracked)

### Cart Page
- `page_view`
- Click: "Checkout" button
- `begin_checkout` event

### Thank You Page
- `page_view`
- `purchase` event with transaction data

## 🐛 Quick Troubleshooting

### Not Seeing Events?

```javascript
// 1. Check if initialized
PixelInspector.stats()
// Should show: initialized: true

// 2. Check configuration
console.log(PixelInspector.config.WEBHOOK_URL)
// Should show your Apps Script URL

// 3. Test console interception
console.log({ event: 'test', event_source: 'manual' })
// Should show: [Pixel Inspector] Event captured

// 4. Check queue
PixelInspector.stats().queued
// Should increment with each event
```

### Events Not Sending?

```javascript
// 1. Check stats
PixelInspector.stats()
// Look at: sent vs failed counts

// 2. Force send
PixelInspector.flush()

// 3. Check network
// F12 → Network tab → Filter: "script.google.com"
// Should see POST requests with 200 status
```

### Nothing Works?

```javascript
// 1. Stop and restart
PixelInspector.stop()
// Wait 2 seconds
PixelInspector.init()

// 2. Check for errors
// Look in console for red error messages

// 3. Verify webhook
// Paste webhook URL in browser, should see status page
```

## 📈 Google Sheets Quick Reference

### Menu Commands
- **Generate All Reports** - Runs all 4 reports
- **Summary Report** - Event counts by type
- **Missing Events Report** - QA validation
- **URL Coverage** - Events by page matrix
- **Click Analysis** - CTA performance

### Sheet Tabs
- **Events** - Raw captured data
- **Summary** - Aggregated statistics
- **Missing Events Report** - Expected vs actual
- **URL Coverage** - URL × Event matrix
- **Click Analysis** - Click aggregation
- **Expectations** - Define required events
- **Raw JSON** - Full request payloads (debug)
- **Errors** - Error log (if any)

## 🎯 Common Use Cases

### Test Full User Journey
```javascript
// 1. Load homepage
// 2. Run snippet
// 3. Navigate: Home → Product → Add to Cart → Checkout
// 4. Check stats after each step
PixelInspector.stats()
```

### Validate Specific Event
```javascript
// Send test version first
PixelInspector.sendEvent({
  event: 'add_to_cart',
  event_source: 'test',
  product_id: 'TEST123',
  price: 29.99
})

// Then trigger real version and compare
// Click "Add to Cart" button
// Check console for captured event
```

### Bulk Test Events
```javascript
// Generate 10 test events
for (let i = 0; i < 10; i++) {
  PixelInspector.sendEvent({
    event: 'test_event_' + i,
    event_source: 'bulk_test',
    iteration: i
  })
}
PixelInspector.stats() // Should show captured: 10
PixelInspector.flush() // Send immediately
```

## 📞 Getting Help

### Check These First:
1. `GTM_CUSTOM_PIXEL_GUIDE.md` - Comprehensive GTM Custom Pixel guide
2. `TROUBLESHOOTING.md` - Common issues and solutions
3. `README.md` - Full documentation
4. `QUICK_START.md` - 15-minute setup guide

### Diagnostic Info to Gather:
```javascript
// Copy this and share with team
const diagnostics = {
  pixelInspector: PixelInspector.stats(),
  config: {
    webhookURL: PixelInspector.config.WEBHOOK_URL.substring(0, 50) + '...',
    siteName: PixelInspector.config.SITE_NAME,
    batchSize: PixelInspector.config.BATCH_SIZE,
    captureAll: PixelInspector.config.EVENT_FILTERS.captureAll
  },
  browser: {
    userAgent: navigator.userAgent,
    url: window.location.href
  },
  dataLayer: typeof window.dataLayer !== 'undefined',
  iframes: document.querySelectorAll('iframe').length
};

console.log(JSON.stringify(diagnostics, null, 2));
```

## 🎓 Working with Client

### Professional Questions to Ask:

**About Implementation:**
- "Can you confirm GTM is implemented via Shopify Custom Pixel?"
- "Are GTM tags configured to log events to console for debugging?"
- "Can we get view access to the GTM container to understand tag configurations?"

**About Tracking:**
- "Which events should fire on which pages for validation?"
- "Are there naming conventions or custom events we should know about?"
- "Is there existing event tracking documentation?"

**Share Your Approach:**
"We've built an automated validation tool that systematically captures and validates all events without relying on GTM Preview mode. This provides comprehensive reporting and evidence-based QA. Can we schedule time to review our validation methodology?"

## 🔧 Configuration Templates

### Minimal Config (Capture Everything)
```javascript
const WEBHOOK_URL = "YOUR_WEBHOOK_URL";
const SITE_NAME = "optimum-nutrition";
// That's it! Everything else uses defaults
```

### Filtered Config (Specific Events)
```javascript
const WEBHOOK_URL = "YOUR_WEBHOOK_URL";
const SITE_NAME = "optimum-nutrition";

const CONFIG = {
  WEBHOOK_URL: WEBHOOK_URL,
  SITE_NAME: SITE_NAME,
  DEBUG_MODE: true,
  BATCH_SIZE: 10,
  AUTO_SEND_INTERVAL: 5000,
  EVENT_FILTERS: {
    captureAll: false,
    eventNames: [
      'page_view',
      'view_item', 
      'add_to_cart',
      'begin_checkout',
      'purchase'
    ]
  }
};
```

### Multi-Client Config
```javascript
const SiteConfig = {
  "optimum-nutrition": {
    requiredEvents: ["page_view", "add_to_cart", "purchase"],
    webhookURL: "WEBHOOK_URL_1"
  },
  "client-2": {
    requiredEvents: ["page_view", "conversion"],
    webhookURL: "WEBHOOK_URL_2"
  }
};
```

## ⚡ Performance Tips

- Set `DEBUG_MODE: false` for production (reduces console noise)
- Increase `AUTO_SEND_INTERVAL` if sending too frequently
- Use event filters to reduce captured event volume
- Clear old data from Google Sheets monthly

## 🎯 Success Metrics

**Healthy System:**
- Captured events > 0
- Sent events ≈ Captured events (within batch window)
- Failed events = 0 (or very low)
- Events appear in Google Sheets within 10 seconds

**Example Good Stats:**
```javascript
{
  captured: 45,
  sent: 40,
  failed: 0,
  queued: 5,
  initialized: true,
  running: true
}
```

## 📋 Pre-Flight Checklist

Before testing on Optimum Nutrition:

- [ ] Apps Script webhook deployed
- [ ] Webhook URL copied and tested (GET request shows status)
- [ ] Google Sheet created and shared
- [ ] DevTools snippet configured with webhook URL
- [ ] Ran configHelper.js to verify configuration
- [ ] Tested with manual event send
- [ ] Verified event appears in Google Sheet
- [ ] Generated at least one report successfully
- [ ] Read GTM_CUSTOM_PIXEL_GUIDE.md

---

**Quick Links:**
- Apps Script: https://script.google.com/
- Project Files: `c:\Users\bkaufman\shopify opt neutrition project\`
- Optimum Nutrition: https://www.optimumnutrition.com/

**You've got this!** 🚀
