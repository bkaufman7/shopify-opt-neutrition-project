# Optimum Nutrition - Testing Checklist

**Date:** _____________  
**Tester:** _____________  
**Pixel Inspector Version:** 1.0.0

---

## Pre-Testing Setup

- [ ] Read `GTM_CUSTOM_PIXEL_GUIDE.md` 
- [ ] Read `QUICK_REFERENCE.md`
- [ ] Apps Script webhook deployed
- [ ] Webhook URL: ________________________________
- [ ] Google Sheet created: ________________________________
- [ ] DevTools snippet configured and tested

---

## Initial Validation (Do This First!)

### Check GTM Implementation

1. Go to: https://www.optimumnutrition.com/
2. Open F12 Console
3. Run: `console.log(window.dataLayer)`

**Results:**
- [ ] Parent dataLayer exists (not undefined)
- [ ] Parent dataLayer is empty/has events: _____________
- [ ] No parent dataLayer found

**Screenshot saved?** [ ] Yes [ ] No

### Find Custom Pixel Iframe

4. In Console, run: `document.querySelectorAll('iframe')`

**Results:**
- Number of iframes found: _____________
- Custom Pixel iframe found: [ ] Yes [ ] No
- Iframe name/src: ________________________________

### Check Console for Events

5. Refresh page and watch console for 10 seconds
6. Click on a few navigation links
7. Click on a product card

**What appears in console:**
- [ ] Event objects being logged
- [ ] DataLayer pushes
- [ ] GTM-related logs
- [ ] Shopify pixel logs
- [ ] Nothing event-related appears

**Example event you saw:** ________________________________

**Screenshot saved?** [ ] Yes [ ] No

---

## Pixel Inspector Deployment

### Deploy Snippet

- [ ] F12 → Sources → Snippets
- [ ] Created "PixelInspector" snippet
- [ ] Pasted code from `src/browser/devtoolsSnippet.js`
- [ ] Updated `WEBHOOK_URL` on line 24
- [ ] Updated `SITE_NAME` to "optimum-nutrition" on line 25
- [ ] Saved (Ctrl+S)
- [ ] Right-click → Run

**Initialization message seen:** [ ] Yes [ ] No

### Verify Installation

Run in console:
```javascript
PixelInspector.stats()
```

**Results:**
- Captured: _____________
- Sent: _____________
- Failed: _____________
- Initialized: [ ] true [ ] false
- Running: [ ] true [ ] false

---

## Test Scenario 1: Homepage

**URL:** https://www.optimumnutrition.com/

### Actions
1. [ ] Page loads with Pixel Inspector running
2. [ ] Wait 5 seconds
3. [ ] Check console for captured events

### Expected Events
- [ ] `page_view` captured (event_source: 'pixel_inspector')
- [ ] Any GTM events logged to console
- [ ] Shopify pixel events (if any)

### Clicks to Test
- [ ] Click main navigation link → Check for click event
- [ ] Click hero CTA button → Check for click event
- [ ] Click product card → Check for click event
- [ ] Click footer link → Check for click event

**Events captured:** _____________  
**Screenshot saved:** [ ] Yes [ ] No

---

## Test Scenario 2: Product Page

**URL:** https://www.optimumnutrition.com/products/gold-standard-100-whey

### Actions
1. [ ] Navigate to product page
2. [ ] Wait 5 seconds
3. [ ] Check console

### Expected Events
- [ ] `page_view` captured
- [ ] `view_item` event (GTM ecommerce)
- [ ] Product data in event object
- [ ] Shopify pixel events

### Interactions to Test
- [ ] Click product image → Check for click
- [ ] Click "Add to Cart" button → Check for click
- [ ] Look for `add_to_cart` event after ATC click
- [ ] Change variant/quantity (if applicable) → Check for events

**Events captured:** _____________  
**Add to Cart event seen:** [ ] Yes [ ] No [ ] N/A  
**Event includes product data:** [ ] Yes [ ] No [ ] N/A

---

## Test Scenario 3: Collection/Category Page

**URL:** https://www.optimumnutrition.com/collections/protein-powder

### Actions
1. [ ] Navigate to collection page
2. [ ] Check for `page_view`
3. [ ] Click on multiple product cards
4. [ ] Try filters/sorting (if available)

### Expected Events
- [ ] `page_view` captured
- [ ] Click events on product cards (should have product URLs)
- [ ] Filter/sort events (if tracked)

**Events captured:** _____________

---

## Test Scenario 4: Cart & Checkout

⚠️ **Note:** May need actual cart items to test checkout

**Cart URL:** https://www.optimumnutrition.com/cart

### Cart Page
- [ ] Navigate to cart
- [ ] `page_view` captured
- [ ] Click "Checkout" button
- [ ] `begin_checkout` event seen (if GTM configured)

**Checkout Flow:**
- [ ] Checkout page loads
- [ ] Form interactions (if tracked)
- [ ] Can you access thank you page? [ ] Yes [ ] No

If yes:
- [ ] `purchase` event captured
- [ ] Transaction data included

---

## Data Validation in Google Sheets

### Check Events Sheet

1. [ ] Open Google Sheet
2. [ ] Go to "Events" tab
3. [ ] Verify events are appearing

**Total rows in sheet:** _____________  
**Time delay from capture to sheet:** _____________ seconds

### Verify Data Quality

Check random event row:
- [ ] Timestamp populated
- [ ] Site Name = "optimum-nutrition"
- [ ] Event Name populated
- [ ] Event Source populated
- [ ] Page URL correct
- [ ] Page Title correct
- [ ] Click data (if click event) populated
- [ ] Raw JSON column has data

**Data quality:** [ ] Good [ ] Issues (describe): __________________

---

## Generate Reports

### Summary Report
- [ ] Pixel Inspector menu → Generate Summary Report
- [ ] Report generated successfully
- [ ] Total events count matches expectations
- [ ] Events grouped by name
- [ ] Events grouped by source
- [ ] Top URLs listed

**Total events in summary:** _____________

### URL Coverage Report
- [ ] Generate URL Coverage Report
- [ ] Matrix shows URLs vs Events
- [ ] Can identify which events fire on which pages

**Coverage gaps identified:** _____________________________

### Missing Events Report

First, create Expectations:
- [ ] Create "Expectations" sheet
- [ ] Add expected events:
  - page_view on all pages (*)
  - view_item on product pages (*/products/*)
  - add_to_cart on product pages (*/products/*)
  - begin_checkout on cart (/cart)

Then generate:
- [ ] Generate Missing Events Report
- [ ] Review missing events
- [ ] Validate against actual testing

**Missing critical events:** _____________________________

### Click Analysis Report
- [ ] Generate Click Analysis Report
- [ ] Top clicks identified
- [ ] CTAs showing correct destination URLs

---

## Common Event Patterns to Look For

Based on client ping, you should see events like:

### GTM DataLayer Events
```javascript
{
  event: "page_view",
  // or other GTM event names
  // May include ecommerce data
}
```

### Shopify Custom Pixel Events
```javascript
{
  event: "custom_click_link_storefront",
  // Shopify-specific fields
}
```

### Which did you see?
- [ ] GTM-style events
- [ ] Shopify pixel events
- [ ] Both
- [ ] Neither (describe what you saw): __________________

---

## Performance Check

Run in console:
```javascript
PixelInspector.stats()
```

**Final Statistics:**
- Total captured: _____________
- Total sent: _____________
- Total failed: _____________
- Queued: _____________

**Success rate:** _____________ %  
**Any failures:** [ ] Yes (investigate) [ ] No (good!)

---

## Issues Encountered

### Technical Issues
Issue: _________________________________________________  
Resolution: _________________________________________________

Issue: _________________________________________________  
Resolution: _________________________________________________

### Data Issues
Issue: _________________________________________________  
Resolution: _________________________________________________

---

## Questions for Client (If Needed)

Based on testing, prepare these questions:

1. **GTM Container Access:**
   - [ ] Can we get view access to GTM container?
   - Reason: _________________________________________________

2. **Event Expectations:**
   - [ ] Which events should fire on which pages?
   - [ ] Are there naming conventions we should follow?

3. **Console Logging:**
   - [ ] Are all GTM tags configured to log to console?
   - [ ] If not, can this be enabled for QA purposes?

4. **Missing Events:**
   - [ ] We noticed [EVENT_NAME] doesn't fire on [PAGE_TYPE]
   - Is this expected? _________________________________________________

---

## Client Communication Template

**Subject:** Optimum Nutrition - GTM Event Validation Methodology

Hi [Client Name],

We've set up automated event validation for the GTM Custom Pixel implementation on Optimum Nutrition. 

Since GTM Preview mode doesn't work with Custom Pixel implementations, we've built a systematic validation tool that:

1. Captures all console-logged events
2. Records all user interactions
3. Stores data in Google Sheets
4. Generates comprehensive validation reports

**Initial Findings:**
- Total events captured during testing: [NUMBER]
- Events validated: [LIST KEY EVENTS]
- Coverage: [X] page types tested

**Questions:**
[INSERT SPECIFIC QUESTIONS FROM ABOVE SECTION]

We can schedule a call to review our validation approach and findings.

Best regards,
[Your Name]

---

## Follow-Up Actions

After initial testing:

- [ ] Schedule internal team review of findings
- [ ] Prepare client communication (use template above)
- [ ] Document any GTM configuration issues found
- [ ] Create ongoing monitoring schedule
- [ ] Add to Expectations sheet for automated validation
- [ ] Set up weekly reporting cadence

---

## Sign-Off

**Testing completed:** [ ] Yes [ ] Partial [ ] No  
**Ready for client discussion:** [ ] Yes [ ] No  
**Issues blocking progress:** _____________________________

**Overall assessment:**
- [ ] ✅ Tool working well, capturing events as expected
- [ ] ⚠️ Working but needs adjustments
- [ ] ❌ Issues preventing validation (escalate)

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

**Tester Signature:** ____________________  
**Date Completed:** ____________________
