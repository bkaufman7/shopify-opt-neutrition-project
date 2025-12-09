# Quick Start Guide

## 🚀 Get Started in 15 Minutes

This guide will get your Pixel Inspector up and running quickly.

---

## Step 1: Deploy Google Apps Script (5 minutes)

### 1.1 Open Apps Script Project

The Apps Script is already deployed at:
https://script.google.com/u/0/home/projects/1eULLzAXi7T_kq_Fof0x3YRaBcPrEeGnKZduLuVIX198MsoUXxW0020EM/edit

**The code has been pushed to this project.**

### 1.2 Deploy as Web App

1. Click **Deploy** → **Manage deployments**
2. If no deployment exists, click **"Create deployment"**:
   - Type: **Web app**
   - Description: "Pixel Inspector Webhook"
   - Execute as: **Me**
   - Who has access: **Anyone**
3. If deployment exists, click pencil icon to edit:
   - Version: **New version**
4. Click **Deploy**
5. **COPY THE WEB APP URL** - you'll need this!

### 1.3 Test Webhook

Paste your webhook URL in browser. You should see:
"Shopify Pixel Inspector Webhook - Status: Active"

✅ **Webhook is ready!**

---

## Step 2: Create Google Sheet (2 minutes)

1. Go to https://sheets.google.com/
2. Create **New** spreadsheet
3. Name it: "Pixel Inspector - Optimum Nutrition"
4. Leave it open (the webhook will auto-create tabs)

✅ **Sheet is ready!**

---

## Step 3: Install Browser Interceptor (5 minutes)

### Option A: DevTools Snippet (Recommended)

1. **Open Chrome DevTools**: Press `F12`

2. **Go to Snippets**:
   - Click **Sources** tab
   - Click **Snippets** in left sidebar

3. **Create Snippet**:
   - Click **+ New snippet**
   - Name it: `PixelInspector`

4. **Add Code**:
   - Open: `src/browser/devtoolsSnippet.js`
   - Copy ALL the code
   - Paste into snippet

5. **Configure**:
   - Find line 24: `const WEBHOOK_URL = "<YOUR-APPS-SCRIPT-WEB-APP-URL>";`
   - Replace with YOUR webhook URL from Step 1.2
   - Example: `const WEBHOOK_URL = "https://script.google.com/macros/s/ABC123.../exec";`

6. **Save**: `Ctrl+S` (Windows) or `Cmd+S` (Mac)

7. **Run**: Right-click snippet → **Run**

8. **Verify**: Check console for:
   ```
   [Pixel Inspector] ✓ Initialized successfully!
   ```

✅ **Interceptor is running!**

---

## Step 4: Test End-to-End (3 minutes)

### 4.1 Send Test Event

In DevTools console, run:

```javascript
PixelInspector.sendEvent({
  event: 'test_event',
  event_source: 'manual_test',
  page_url: window.location.href,
  page_title: document.title
});
```

### 4.2 Check Stats

```javascript
PixelInspector.stats()
```

You should see:
```javascript
{
  captured: 2,  // 1 auto pageview + 1 test event
  sent: 0,
  queued: 2,
  ...
}
```

### 4.3 Force Send

```javascript
PixelInspector.flush()
```

Console should show:
```
[Pixel Inspector] Sending 2 events...
[Pixel Inspector] ✓ Sent 2 events via fetch
```

### 4.4 Check Google Sheet

Wait 5 seconds, then:
1. Refresh your Google Sheet
2. You should see an "Events" tab auto-created
3. Check for 2 rows of data (plus header)

✅ **System is working end-to-end!**

---

## Step 5: Navigate and Capture Real Events

### 5.1 Navigate to Shopify Site

Go to: https://www.optimumnutrition.com/

### 5.2 Run Snippet Again

The snippet only runs on the current page. After navigating:
1. Open DevTools
2. Go to Snippets
3. Right-click `PixelInspector` → **Run**

### 5.3 Interact with Page

- Click on navigation links
- Click on product cards
- Click on CTAs
- Scroll the page

### 5.4 Monitor Console

Watch for:
```
[Pixel Inspector] Event captured [3]: click
[Pixel Inspector] Event captured [4]: click
[Pixel Inspector] Sending 10 events...
[Pixel Inspector] ✓ Sent 10 events via fetch
```

### 5.5 Check Sheet Again

Your Google Sheet should now have real event data!

✅ **Capturing real events!**

---

## Step 6: Generate Reports (2 minutes)

### 6.1 Open Apps Script Menu

In your Google Sheet:
1. Refresh the page
2. Look for custom menu: **"Pixel Inspector"**
3. If not visible, wait 10 seconds and refresh again

### 6.2 Generate Summary

1. Click **Pixel Inspector** menu
2. Select **"Generate All Reports"**
3. Wait 10-30 seconds
4. Check for new tabs:
   - Summary
   - Missing Events Report
   - URL Coverage
   - Click Analysis

### 6.3 Review Reports

**Summary Tab**: Shows event counts by type, source, date

**URL Coverage**: Matrix of which events fired on which URLs

**Click Analysis**: All clicks aggregated

✅ **Reports generated!**

---

## You're Done! 🎉

Your Pixel Inspector is fully operational.

---

## What to Do Next

### Daily Use

1. Navigate to page you want to test
2. Run DevTools snippet
3. Interact with page
4. Check console for captured events
5. Review Google Sheet for data
6. Generate reports as needed

### Commands to Remember

```javascript
// View statistics
PixelInspector.stats()

// Send events now
PixelInspector.flush()

// Stop capturing
PixelInspector.stop()

// Restart
PixelInspector.init()

// Send custom event
PixelInspector.sendEvent({ event: 'my_event', data: 'value' })
```

---

## Common First-Time Issues

### "PixelInspector is not defined"

**Solution**: Run the snippet first
- DevTools → Sources → Snippets → Right-click → Run

### Events not appearing in sheet

**Solution**: Check webhook URL
```javascript
console.log(PixelInspector.config.WEBHOOK_URL)
```
Make sure it matches your Apps Script URL.

### No "Pixel Inspector" menu in Sheets

**Solution**: Refresh the Google Sheet page
- The menu is added by Apps Script onOpen() trigger
- May take 10-30 seconds to appear

---

## Quick Reference

### File Locations

- **Browser Code**: `src/browser/devtoolsSnippet.js`
- **Webhook Code**: `src/apps-script/webhook.gs`
- **Reports Code**: `src/apps-script/reporting.gs`
- **Full Docs**: `README.md`

### Important URLs

- **Apps Script**: https://script.google.com/u/0/home/projects/1eULLzAXi7T_kq_Fof0x3YRaBcPrEeGnKZduLuVIX198MsoUXxW0020EM/edit
- **GitHub**: https://github.com/bkaufman7/shopify-opt-neutrition-project
- **Test Site**: https://www.optimumnutrition.com/

### Configuration Variables

**In Browser**:
- `WEBHOOK_URL` - Your Apps Script URL (REQUIRED)
- `SITE_NAME` - Client identifier (default: "optimum-nutrition")
- `BATCH_SIZE` - Events before auto-send (default: 10)
- `AUTO_SEND_INTERVAL` - Milliseconds (default: 5000)

**In Apps Script**:
- `SHEET_NAME` - Name of events sheet (default: "Events")
- `MAX_ROWS` - Archive threshold (default: 50000)

---

## Getting Help

1. **Console Errors**: Check browser console for error messages
2. **Apps Script Errors**: Apps Script → Executions → View logs
3. **Documentation**: 
   - README.md - Complete guide
   - DEPLOYMENT.md - Detailed deployment steps
   - TROUBLESHOOTING.md - Issue resolution
   - ARCHITECTURE.md - Technical details
4. **GitHub Issues**: Open an issue with details

---

## Bookmarklet (Optional Alternative)

If you prefer a bookmarklet instead of DevTools snippet:

1. Open `src/browser/bookmarklet.js`
2. Copy the minified code (line starting with `javascript:(function()...`)
3. Before using, edit the code to insert your webhook URL
4. Create new bookmark
5. Paste code as bookmark URL
6. Click bookmark on any page to activate

---

## For Your Team

Share these files with team members:
- ✅ This file (QUICK_START.md)
- ✅ README.md
- ✅ Your webhook URL (securely)
- ✅ Link to Google Sheet
- ✅ src/testing/testPlan.md (for QA)

---

## Success Checklist

- [ ] Apps Script deployed
- [ ] Webhook URL copied
- [ ] Google Sheet created
- [ ] DevTools snippet installed
- [ ] Webhook URL configured in snippet
- [ ] Test event sent successfully
- [ ] Test event appears in sheet
- [ ] Real events captured on Optimum Nutrition site
- [ ] Reports generated successfully
- [ ] Team members can access sheet

---

**Congratulations! You're ready to start validating events.**

For detailed usage, see README.md  
For troubleshooting, see docs/TROUBLESHOOTING.md  
For testing, see src/testing/testPlan.md
