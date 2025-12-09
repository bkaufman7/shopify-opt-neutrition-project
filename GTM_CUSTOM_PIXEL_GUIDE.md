# GTM Custom Pixel - Complete Guide

## Understanding the Problem

### Traditional GTM Implementation (Theme.liquid)
```
Website Base Code (theme.liquid)
  ↓
  GTM Container Script
  ↓
  Full DOM Access
  ↓
  GTM Preview Works ✅
  ↓
  dataLayer Visible ✅
```

### Custom Pixel Implementation (Current - Optimum Nutrition)
```
Website Base Code
  ↓
  Shopify Custom Pixel (Isolated Iframe)
    ↓
    GTM Container Script (Inside Iframe)
    ↓
    Limited/No DOM Access ❌
    ↓
    GTM Preview Doesn't Work ❌
    ↓
    dataLayer Hidden in Iframe ❌
```

## Why Shopify Recommends Custom Pixels

**Benefits (from Shopify's perspective):**
- Better site performance (async loading)
- Sandboxed security
- Won't break site if GTM misconfigured
- Easier for non-technical merchants

**Drawbacks (from your QA perspective):**
- No GTM Preview mode
- No Tag Assistant
- dataLayer not visible in parent window
- Can't validate tags easily
- Debugging is manual and tedious

## How to Work With Custom Pixel GTM

### Method 1: Console Inspection (What Client Showed You)

**View dataLayer in Console:**
```javascript
// Open F12 Console on Optimum Nutrition site

// Check if dataLayer exists in parent window
console.log(window.dataLayer);

// If empty/undefined, GTM is in the Custom Pixel iframe
// You need to access the iframe

// Find the Custom Pixel iframe
let pixelIframe = document.querySelector('iframe[name*="custom-pixel"]') || 
                  document.querySelector('iframe[src*="shopify"]');

// Try to access its dataLayer (may be blocked by CORS)
console.log(pixelIframe?.contentWindow?.dataLayer);
```

**The Problem:** If the iframe has strict security, you can't access it from parent console.

### Method 2: Event Listening (What Client is Probably Doing)

Many Custom Pixel implementations log events to console for debugging:

```javascript
// GTM tags often include console logging like:
console.log('GTM Event:', {
  event: 'page_view',
  page_path: '/products/whey',
  // ... other data
});
```

**Look for these patterns in console:**
- `GTM Event:` 
- `dataLayer.push:`
- Any object with `event:` property
- Pixel-specific logs

### Method 3: Pixel Inspector (Automated Solution)

This is what the tool in your project does automatically:

1. **Intercepts console.log** - Catches any events logged to console
2. **Hooks dataLayer.push** - If accessible, captures all pushes
3. **Tracks DOM clicks** - Even if GTM doesn't fire, you see user actions
4. **Sends to Google Sheets** - Centralized validation database
5. **Generates reports** - Automated QA validation

## Step-by-Step: Validating GTM on Optimum Nutrition

### Step 1: Understand Current Implementation

1. Go to https://www.optimumnutrition.com/
2. Open F12 Console
3. Type: `console.log(window.dataLayer)`
4. Take screenshot - this is your baseline

**Questions to Answer:**
- Does parent window have a dataLayer? (Yes/No)
- Do you see Custom Pixel iframe in Elements tab? (Yes/No)
- Do events appear in console as you navigate? (Yes/No)

### Step 2: Deploy Pixel Inspector

1. **Already Done:** Apps Script is deployed
2. **Get Webhook URL:** 
   - Apps Script → Deploy → Manage Deployments → Copy URL
3. **Update DevTools Snippet:**
   - Line 24: Paste your webhook URL
4. **Run Snippet:**
   - F12 → Sources → Snippets → PixelInspector → Run

### Step 3: Capture Events

1. Navigate to homepage
2. Check console for: `[Pixel Inspector] Event captured`
3. Click around (products, navigation, CTAs)
4. Add item to cart
5. Go to checkout (if possible)

### Step 4: Validate in Google Sheets

1. Open your Pixel Inspector Google Sheet
2. Check "Events" tab
3. Look for:
   - `page_view` events
   - `click` events
   - Any GTM events (event_source: 'console' or 'datalayer')

### Step 5: Generate Reports

1. In Google Sheets: Pixel Inspector menu → Generate All Reports
2. Review:
   - **Summary:** Event counts by type
   - **URL Coverage:** Which events fire on which pages
   - **Missing Events:** Compare to expected events

## Common GTM Events to Look For

### Standard Ecommerce Events
```javascript
// Page View
{ event: 'page_view', page_path: '/products/...' }

// View Item
{ 
  event: 'view_item',
  ecommerce: {
    items: [{ item_id: '...', item_name: '...', price: ... }]
  }
}

// Add to Cart
{
  event: 'add_to_cart',
  ecommerce: {
    items: [{ item_id: '...', quantity: 1 }]
  }
}

// Begin Checkout
{ event: 'begin_checkout' }

// Purchase
{
  event: 'purchase',
  ecommerce: {
    transaction_id: '...',
    value: ...,
    items: [...]
  }
}
```

### Shopify Custom Pixel Events
```javascript
// Custom Click Events (Shopify-specific)
{
  event: 'custom_click_link_storefront',
  click_text: '...',
  click_url: '...'
}

// Shopify Pixel Events
{
  event_source: 'custom_pixel',
  event: 'shopify_pixel_event',
  // ... Shopify-specific data
}
```

## Expected Events by Page Type

### Homepage
- ✅ `page_view`
- ✅ Click events on navigation
- ✅ Click events on hero CTAs
- ✅ Click events on product cards

### Product Page
- ✅ `page_view`
- ✅ `view_item` (GTM ecommerce)
- ✅ Click on "Add to Cart"
- ✅ `add_to_cart` event
- ✅ Variant selection (if tracked)

### Collection/Category Page
- ✅ `page_view`
- ✅ Click events on product cards
- ✅ Filter/sort interactions (if tracked)

### Cart Page
- ✅ `page_view`
- ✅ Quantity change events (if tracked)
- ✅ Click on "Checkout"
- ✅ `begin_checkout` event

### Checkout/Thank You Page
- ✅ `page_view`
- ✅ `purchase` event (on thank you page)
- ✅ Transaction data

## Troubleshooting GTM Custom Pixel Issues

### Issue: No Events Appearing in Console

**Check:**
1. Are GTM tags configured to log to console?
2. Is GTM container published?
3. Are triggers firing? (Check GTM preview if accessible)
4. Is Custom Pixel actually active?

**Solution:**
- Ask client to share GTM container access
- Verify tags have console.log debugging enabled
- Test with manual console commands

### Issue: Can't Access Iframe dataLayer

**This is Normal!** Cross-origin iframes are blocked by browser security.

**Workarounds:**
1. GTM tags must log to parent console
2. Use postMessage to send events from iframe to parent
3. Shopify pixels often fire parent-level events

### Issue: Events Fire But Not Captured

**Check Pixel Inspector:**
```javascript
// Is it running?
PixelInspector.stats()

// Check configuration
PixelInspector.config

// Check if event detection works
console.log({ event: 'test', event_source: 'manual' })
// Should show: [Pixel Inspector] Event captured
```

### Issue: Events Captured But Not in Google Sheets

**Check:**
1. Webhook URL configured correctly
2. Network tab shows successful POST to Apps Script
3. Apps Script execution log (no errors)
4. Google Sheet permissions

## Training the Client (If Needed)

If you need to ask the client for help, here are professional questions:

### Questions About GTM Setup
1. "Can you confirm GTM is implemented via Shopify Custom Pixel?"
2. "Are GTM tags configured to log events to console for debugging?"
3. "Is there a parent-level dataLayer or is everything in the pixel iframe?"
4. "Can you share the GTM container (view access) so we can see tag configurations?"

### Questions About Event Tracking
1. "Which events should fire on which pages? (page_view, add_to_cart, etc.)"
2. "Are there any custom events or naming conventions we should know?"
3. "Is there existing documentation for event tracking requirements?"

### Share Your Approach
"We've built an automated event validation tool that captures console events and provides comprehensive reporting. This will help us systematically validate all tags without relying on GTM Preview. Can we schedule a call to review the validation approach?"

**This positions you as proactive, not unprepared!**

## Best Practices Moving Forward

### 1. Document Everything
- Take screenshots of console events
- Export Google Sheets data regularly
- Keep validation reports

### 2. Create Event Expectations Sheet
In your Pixel Inspector Google Sheet, create "Expectations" tab:
```
Event Name          | URL Pattern       | Required | Notes
page_view           | *                 | Yes      | All pages
view_item           | */products/*      | Yes      | Product pages only
add_to_cart         | */products/*      | Yes      | On ATC button click
begin_checkout      | */cart            | Yes      | Checkout button click
purchase            | */thank-you       | Yes      | Post-purchase only
```

### 3. Automated Testing
Run test scenarios regularly:
- Homepage → Product → Add to Cart → Checkout
- Filter/search flows
- Cross-device testing (mobile vs desktop)

### 4. Regular Reporting
- Weekly: Review Missing Events Report
- Monthly: Full URL Coverage validation
- Quarterly: Update expectations as site changes

## Quick Reference Commands

### In Browser Console (F12)
```javascript
// Check for dataLayer
window.dataLayer

// Check Pixel Inspector status
PixelInspector.stats()

// Send test event
PixelInspector.sendEvent({ event: 'test', source: 'manual' })

// Force send queued events
PixelInspector.flush()

// View configuration
PixelInspector.config

// Find Custom Pixel iframe
document.querySelectorAll('iframe')
```

### In Google Apps Script
```javascript
// Test webhook
testWebhook()

// Generate all reports
generateAllReports()

// Check recent executions
// Apps Script → Executions tab
```

## Additional Resources

- **Shopify Custom Pixels Docs:** https://shopify.dev/docs/apps/marketing/pixels
- **GTM Ecommerce Events:** https://developers.google.com/tag-manager/ecommerce-ga4
- **Project Files:**
  - `README.md` - Full documentation
  - `QUICK_START.md` - 15-min setup
  - `TROUBLESHOOTING.md` - Issue resolution
  - `src/testing/testPlan.md` - Test scenarios

## Summary: You're Not Alone!

Many agencies struggle with Shopify Custom Pixel GTM implementations. The fact that:
- GTM Preview doesn't work
- dataLayer is hidden
- Console is the only debugging method

...is a **Shopify architectural decision**, not your lack of knowledge.

Your Pixel Inspector tool gives you:
1. Automated event capture
2. Systematic validation
3. Professional reporting
4. Evidence-based QA

You're now **better equipped than most** to handle this setup! 🚀
