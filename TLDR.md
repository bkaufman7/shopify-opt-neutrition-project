# TL;DR - Pixel Inspector in 2 Minutes

## What Is This?

**A tool that captures and validates Google Tag Manager events on Shopify websites** - even when GTM Preview mode doesn't work.

## The Problem (In Plain English)

Shopify's new "Custom Pixel" method for installing GTM breaks all the normal debugging tools:
- ❌ GTM Preview doesn't work
- ❌ Can't see what tags are firing
- ❌ Can't validate tracking is working

Your client said "just check F12 console" - but that's manual and tedious.

## The Solution (What This Does)

This tool **automatically**:
1. Watches the browser console for events
2. Captures everything (clicks, page views, purchases)
3. Sends it all to a Google Sheet
4. Creates validation reports

**You get proof that tags are working - without manual console checking!**

## 5-Minute Setup

### Step 1: Deploy Webhook (One Time)
1. Go to https://script.google.com/
2. Your code is already there (project ID in appsscript.json)
3. Click **Deploy** → **New deployment** → **Web app**
4. Set "Who has access" to **Anyone**
5. Click **Deploy**
6. **Copy the URL** (you'll need it in Step 2)

**Alternative - Get URL from existing deployment:**
- Click **Deploy** → **Manage deployments**
- Copy the URL from the existing deployment

### Step 2: Install in Browser
1. Go to Optimum Nutrition website
2. Press **F12** to open DevTools
3. Go to **Sources** tab → **Snippets**
4. Click **+ New snippet** → Name it "PixelInspector"
5. Copy code from: `src/browser/devtoolsSnippet.js`
6. Paste it in
7. **Line 24:** Replace `<YOUR-APPS-SCRIPT-WEB-APP-URL>` with your URL from Step 1
8. Press **Ctrl+S** to save
9. Right-click the snippet → **Run**

### Step 3: Test It
In the console, type:
```javascript
PixelInspector.stats()
```

You should see:
```javascript
{
  captured: 1,
  sent: 0,
  queued: 1,
  initialized: true
}
```

✅ **It's working!**

## How to Use It

### Daily Usage:
1. Open Optimum Nutrition site
2. Press F12
3. Run your PixelInspector snippet (once per page session)
4. Navigate the site normally
5. Events are automatically captured and sent to Google Sheets

### To See Results:
1. Open your Google Sheet (you created this in setup)
2. Look at the "Events" tab
3. See all captured events with timestamps, page URLs, click data, etc.

### To Get Reports:
1. In Google Sheet: **Pixel Inspector menu** → **Generate All Reports**
2. Check these tabs:
   - **Summary** - How many of each event fired
   - **Missing Events** - Events that should have fired but didn't
   - **URL Coverage** - Which events fired on which pages
   - **Click Analysis** - What users clicked

## What Events Will It Capture?

### ✅ YES - It Captures:
- **Page views** (every page you visit)
- **Clicks** (all links, buttons, CTAs)
- **GTM events** (if they log to console - which they usually do)
- **Shopify pixel events**
- **Ecommerce events** (add to cart, purchases, etc.)

### ❌ NO - It Cannot Capture:
- Events that are completely hidden inside sandboxed iframes with zero logging
- (This is rare - most implementations log to console)

## Console Commands Cheat Sheet

```javascript
// Check status
PixelInspector.stats()

// Send events now (don't wait for auto-send)
PixelInspector.flush()

// Stop capturing
PixelInspector.stop()

// Start again
PixelInspector.init()

// Send a test event
PixelInspector.sendEvent({ event: 'test', source: 'manual' })
```

## Troubleshooting

### Not seeing events captured?
```javascript
// Test if it's working:
console.log({ event: 'test', event_source: 'manual' })
// Should show: [Pixel Inspector] Event captured
```

### Events not appearing in Google Sheets?
```javascript
// Check webhook URL:
console.log(PixelInspector.config.WEBHOOK_URL)
// Should start with: https://script.google.com/
```

### Nothing works?
```javascript
// Restart:
PixelInspector.stop()
// Wait 2 seconds
PixelInspector.init()
```

## What You Get

### 📊 **Automated Validation**
No more manually checking console - everything is captured automatically.

### 📈 **Reports**
- Which events fired where
- What's missing
- Click tracking analysis

### 🎯 **Proof for Clients**
Export Google Sheets data to show tag coverage.

### ⏱️ **Time Savings**
Instead of manually checking console on every page → automated capture across entire site.

## Files You Need to Know

### Must Read (Start Here):
- **This file (TLDR.md)** - You're reading it!
- **QUICK_REFERENCE.md** - Console commands on one page

### When You Need Help:
- **GTM_CUSTOM_PIXEL_GUIDE.md** - Understanding the GTM issue
- **TROUBLESHOOTING.md** - Fixing problems
- **OPTIMUM_NUTRITION_CHECKLIST.md** - Complete testing workflow

### Configuration:
- **src/browser/devtoolsSnippet.js** - The code you run in browser
- **src/browser/configHelper.js** - Interactive config tool (optional)

### Deep Dive:
- **README.md** - Complete documentation
- **ARCHITECTURE.md** - How it all works

## FAQ

**Q: Do I need to install anything?**  
A: No! Just Google Apps Script (free) and Google Sheets (free). The browser code runs in DevTools.

**Q: Will it slow down the website?**  
A: No. Zero impact on page performance.

**Q: Can I use this on multiple websites?**  
A: Yes! Just change the `SITE_NAME` in the config for each client.

**Q: What if the client asks how I'm validating tags?**  
A: "We've built an automated event validation system that captures all console events and provides comprehensive reporting. It's more thorough than manual console checking."

**Q: Is this better than GTM Preview mode?**  
A: For Custom Pixel implementations, yes - because GTM Preview doesn't work at all! This is the workaround.

**Q: How much does this cost?**  
A: $0. It uses free Google services.

## Expected Events on Optimum Nutrition

When you test, look for these events:

### Homepage
- `page_view`
- Clicks on navigation
- Clicks on hero buttons
- Clicks on product cards

### Product Page
- `page_view`
- `view_item` (GTM ecommerce)
- Click on "Add to Cart"
- `add_to_cart` event

### Cart
- `page_view`
- Click on "Checkout"
- `begin_checkout` event

### Thank You Page (after purchase)
- `page_view`
- `purchase` event

## Next Steps

1. **Right now:** Run the 5-minute setup above
2. **Today:** Test on Optimum Nutrition, capture some events
3. **This week:** Generate reports, validate tag coverage
4. **Ongoing:** Use for every client with GTM Custom Pixel

## Need More Detail?

- **Quick commands:** See `QUICK_REFERENCE.md`
- **Full setup guide:** See `QUICK_START.md`
- **Understanding GTM Custom Pixels:** See `GTM_CUSTOM_PIXEL_GUIDE.md`
- **Complete docs:** See `README.md`

---

## The Bottom Line

**You have:**
- A GTM implementation that breaks normal debugging tools

**You need:**
- To validate that tags are firing correctly

**This tool:**
- Automatically captures all events
- Stores them in Google Sheets
- Creates validation reports
- Works even when GTM Preview doesn't

**Time to value:** 5 minutes to set up, instant validation after that.

**Your advantage:** Most agencies are still manually checking console. You have automated validation and professional reporting.

🚀 **You're ready!** Start with the 5-minute setup above.
