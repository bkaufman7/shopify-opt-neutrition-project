# Shopify Pixel Inspector

> **Production-ready tooling suite for validating tag firing on Shopify Custom Pixel implementations**

**🆕 NEW TO THIS?** → Read [TLDR.md](TLDR.md) first (2 minutes, simple explanations)  
**⚡ NEED QUICK SETUP?** → See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) (console commands)  
**🎯 OPTIMUM NUTRITION?** → Check [GTM_CUSTOM_PIXEL_GUIDE.md](GTM_CUSTOM_PIXEL_GUIDE.md) (your specific case)

---

A comprehensive solution for debugging and validating event tracking on Shopify storefronts where GTM (Google Tag Manager) is loaded inside a Custom Pixel iframe, making traditional debugging methods ineffective.

---

## 🎯 Problem Statement

**The GTM Custom Pixel Challenge:**

Shopify now recommends implementing GTM via "Custom Pixels" instead of hardcoding into theme.liquid. While this offers site reliability benefits, it creates major debugging challenges:

- ❌ **GTM runs inside an isolated iframe** - No direct access from parent page
- ❌ **GTM Preview mode doesn't work** - The debugger can't see inside the Custom Pixel
- ❌ **No Tag Assistant visibility** - Standard GTM debugging tools are blocked
- ❌ **dataLayer is hidden** - Can't see dataLayer in normal DevTools
- ❌ **Manual console inspection required** - The only way to validate is checking F12 console

**This is NOT a lack of GTM knowledge - it's a Shopify architectural limitation!**

### The Solution: Pixel Inspector

Console-based event interceptor that:
- ✅ **Captures console-logged events** - If GTM tags log to console, we catch them
- ✅ **Hooks dataLayer.push()** - Intercepts any parent-level dataLayer
- ✅ **Tracks DOM interactions** - Records all clicks even without GTM
- ✅ **Sends to Google Sheets** - Centralized validation database
- ✅ **Generates QA reports** - Automated validation instead of manual console checking

**Perfect for agencies working with Shopify Custom Pixel GTM implementations!**

---

## 📁 Project Structure

```
shopify-opt-neutrition-project/
├── src/
│   ├── browser/
│   │   ├── consoleInterceptor.js    # Main interceptor script
│   │   ├── bookmarklet.js           # Bookmarklet version
│   │   └── devtoolsSnippet.js       # DevTools snippet version
│   ├── apps-script/
│   │   ├── webhook.gs               # Webhook receiver
│   │   └── reporting.gs             # Report generation
│   ├── sheets/
│   │   └── templates/               # Google Sheets templates
│   └── testing/
│       ├── testPlan.md              # Comprehensive test plan
│       └── sampleTestScenarios.md   # Test scenarios & scripts
├── docs/
│   ├── DEPLOYMENT.md                # Deployment guide
│   ├── ARCHITECTURE.md              # Architecture documentation
│   └── TROUBLESHOOTING.md           # Common issues & solutions
├── .clasp.json                      # Apps Script project config
├── appsscript.json                  # Apps Script manifest
└── README.md                        # This file
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Shopify Storefront                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Custom Pixel (Isolated Iframe)                    │     │
│  │  ┌──────────────────────────────────────────┐     │     │
│  │  │  GTM Container                            │     │     │
│  │  │  • Tags fire                              │     │     │
│  │  │  • Events logged to console               │     │     │
│  │  │  • dataLayer pushes                       │     │     │
│  │  └──────────────────────────────────────────┘     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Pixel Inspector (Browser Console)                 │     │
│  │  • Intercepts console.log                          │     │
│  │  • Intercepts dataLayer.push                       │     │
│  │  • Captures DOM clicks                             │     │
│  │  • Normalizes events                               │     │
│  │  • Batches & sends to webhook                      │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP POST (JSON)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Google Apps Script Web App (Webhook)                │
│  • Receives POST requests                                    │
│  • Normalizes event data                                     │
│  • Writes to Google Sheets                                   │
│  • Handles errors gracefully                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ Writes
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Google Sheets                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Events    │  │   Summary    │  │  Missing Events  │   │
│  │  (Raw Data) │  │  (Analytics) │  │    (QA Report)   │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ URL Coverage │  │ Click Analysis│                        │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

> **For GTM Custom Pixel implementations:** See `GTM_CUSTOM_PIXEL_GUIDE.md` for detailed guidance on working with Shopify Custom Pixels.

### 1. Deploy Google Apps Script Webhook

1. **Open Google Apps Script**:
   - Go to https://script.google.com/
   - Click "New Project"

2. **Copy webhook code**:
   - Create file `webhook.gs`
   - Copy contents from `src/apps-script/webhook.gs`
   - Create file `reporting.gs`
   - Copy contents from `src/apps-script/reporting.gs`

3. **Deploy as Web App**:
   - Click "Deploy" → "New deployment"
   - Type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"
   - **Copy the Web App URL** (you'll need this)

4. **Create Google Sheet**:
   - Open Google Sheets
   - Create new spreadsheet
   - Name it "Pixel Inspector - [Client Name]"
   - Share it with yourself (same account as Apps Script)

5. **Link Apps Script to Sheet**:
   - In Apps Script, go to Project Settings
   - Note the Script ID
   - The webhook will auto-create sheets on first POST

### 2. Install Browser Interceptor

> **New!** Use the Configuration Helper for easier setup: `src/browser/configHelper.js`

Choose **ONE** of the following methods:

#### Option A: DevTools Snippet (Recommended)

1. Open Chrome DevTools (F12)
2. Go to **Sources** tab
3. Click **Snippets** in left sidebar
4. Click **+ New snippet**
5. Name it "Pixel Inspector"
6. Copy entire contents of `src/browser/devtoolsSnippet.js`
7. **IMPORTANT**: Update line 24:
   ```javascript
   const WEBHOOK_URL = "YOUR-APPS-SCRIPT-WEB-APP-URL";
   ```
8. Right-click snippet → **Run**

#### Option B: Bookmarklet

1. Create new bookmark in browser
2. Open `src/browser/bookmarklet.js`
3. Copy the MINIFIED code (starts with `javascript:(function(){...`)
4. Edit bookmark → Paste as URL
5. **Before using**: Edit the code to insert your webhook URL
6. Click bookmarklet on any page to activate

#### Option C: Direct Injection

1. Copy `src/browser/consoleInterceptor.js`
2. Update `WEBHOOK_URL` in configuration
3. Paste entire script into browser console
4. Press Enter

### 3. Test Installation

Open DevTools console and run:

```javascript
PixelInspector.stats()
```

You should see:
```javascript
{
  captured: 1,
  sent: 0,
  failed: 0,
  queued: 1,
  site: "optimum-nutrition",
  initialized: true
}
```

---

## 🔍 What Events Can This Capture?

### ✅ YES - Will Capture:

**GTM Events (if logged to console):**
- `page_view` events
- `view_item` (product views)
- `add_to_cart` 
- `begin_checkout`
- `purchase` (conversion tracking)
- Any custom GTM events that use `console.log()`

**Shopify Custom Pixel Events:**
- `custom_click_link_storefront`
- Shopify-specific pixel events
- Custom pixel implementations

**DOM Interactions:**
- All link clicks (`<a>` tags)
- Button clicks
- CTA interactions
- Product card clicks

**DataLayer (if accessible):**
- `window.dataLayer.push()` calls on parent page
- Any parent-level GTM implementation

### ❌ LIMITATIONS:

**Cannot capture events that:**
- Are ONLY fired inside a sandboxed iframe (no console logging)
- Don't use console.log, dataLayer, or DOM events
- Are completely isolated with no parent-level communication

**The Fix:** Most GTM implementations include console logging for debugging. If your GTM tags don't currently log to console, you can add a simple console.log() to each tag in GTM.

### 💡 How to Check What You'll See:

1. Open Optimum Nutrition site
2. Press F12 (open console)
3. Navigate and interact with the page
4. Look for objects being logged to console
5. If you see event objects → Pixel Inspector will capture them!

---

## 📊 Usage

### Capturing Events

Once initialized, the Pixel Inspector automatically captures:

1. **Page Views** - On page load
2. **Console Events** - Any `console.log()` with event objects
3. **DataLayer Pushes** - All `dataLayer.push()` calls
4. **DOM Clicks** - Clicks on links, buttons, tracked elements
5. **Shopify Custom Pixel Events** - Events from Shopify pixels

### Sending Events

Events are automatically sent when:
- Batch size reached (default: 10 events)
- Auto-send interval (default: 5 seconds)
- Page unload/navigation
- Manual flush: `PixelInspector.flush()`

### Viewing Data

**In Console**:
```javascript
// View statistics
PixelInspector.stats()

// Send events immediately
PixelInspector.flush()

// Stop capturing
PixelInspector.stop()

// Manually send event
PixelInspector.sendEvent({
  event: 'custom_event',
  custom_field: 'value'
})
```

**In Google Sheets**:
1. Open your Pixel Inspector spreadsheet
2. View "Events" tab for raw data
3. Use Apps Script menu → "Pixel Inspector" → "Generate All Reports"

---

## 📈 Reports

### Summary Report
Groups events by:
- Event name
- Event source
- Page URL
- Date

**Generate**: Apps Script menu → "Pixel Inspector" → "Summary Report"

### Missing Events Report
Compares actual events to expected events.

**Setup**:
1. Create "Expectations" sheet (or run "Create Expectations Template")
2. Add expected events:
   ```
   Event Name          | URL Pattern    | Required | Description
   page_view           | *              | Yes      | All pages
   add_to_cart         | */products/*   | Yes      | Product pages
   ```
3. Generate report to find missing events

**Generate**: Apps Script menu → "Pixel Inspector" → "Missing Events Report"

### URL Coverage Report
Matrix showing which events fired on which URLs.

**Generate**: Apps Script menu → "Pixel Inspector" → "URL Coverage Report"

### Click Analysis Report
Aggregates all click events showing:
- Click text
- Destination URL
- Click count
- Pages where clicked

**Generate**: Apps Script menu → "Pixel Inspector" → "Click Analysis Report"

---

## 🔧 Configuration

### Browser Interceptor Config

Edit in `consoleInterceptor.js` or `devtoolsSnippet.js`:

```javascript
const PIXEL_INSPECTOR_CONFIG = {
  // REQUIRED: Your Apps Script webhook URL
  WEBHOOK_URL: "<YOUR-APPS-SCRIPT-WEB-APP-URL>",
  
  // Site identifier (for multi-client tracking)
  SITE_NAME: "optimum-nutrition",
  
  // Show debug logs in console
  DEBUG_MODE: true,
  
  // Events to send before auto-sending
  BATCH_SIZE: 10,
  
  // Auto-send interval (milliseconds)
  AUTO_SEND_INTERVAL: 5000,
  
  // Event filtering
  EVENT_FILTERS: {
    captureAll: true,  // Set false to use filters below
    eventNames: ['page_view', 'click', 'add_to_cart'],
    eventSources: ['custom_pixel', 'datalayer']
  }
};
```

### Multi-Client Configuration

```javascript
const SiteConfig = {
  "optimum-nutrition": {
    baseUrl: "https://www.optimumnutrition.com/",
    requiredEvents: ["page_view", "add_to_cart", "view_item"],
    eventValidation: {
      page_view: ['page_url', 'page_title'],
      add_to_cart: ['product_id', 'price']
    }
  },
  "client2": {
    baseUrl: "https://example.com/",
    requiredEvents: ["page_view", "purchase"]
  }
};
```

### Apps Script Config

Edit in `webhook.gs`:

```javascript
const WEBHOOK_CONFIG = {
  SHEET_NAME: 'Events',
  RAW_JSON_SHEET: 'Raw JSON',
  MAX_ROWS: 50000,  // Auto-archive after this many
  AUTO_CREATE_SHEETS: true,
  LOG_ERRORS: true
};
```

---

## 🧪 Testing

See comprehensive test documentation:
- **Test Plan**: `src/testing/testPlan.md`
- **Test Scenarios**: `src/testing/sampleTestScenarios.md`

### Quick Test

```javascript
// After initializing Pixel Inspector, run:

// 1. Send test event
PixelInspector.sendEvent({
  event: 'test_event',
  event_source: 'manual_test',
  page_url: window.location.href
});

// 2. Check stats
PixelInspector.stats();

// 3. Force send
PixelInspector.flush();

// 4. Check Google Sheet in 5 seconds
```

### Automated Test Suite

Open `src/testing/sampleTestScenarios.md` and copy the automated test generator into your console.

---

## 🐛 Troubleshooting

### Events not appearing in Google Sheets

**Check**:
1. Webhook URL is correct in browser config
2. Apps Script is deployed as "Anyone" access
3. Console shows "✓ Sent X events via fetch"
4. No CORS errors in console
5. Sheet name matches `WEBHOOK_CONFIG.SHEET_NAME`

**Debug**:
```javascript
// Check config
console.log(PixelInspector.config.WEBHOOK_URL);

// Check stats
PixelInspector.stats();

// Try manual send
PixelInspector.flush();
```

### Console.log not intercepted

**Issue**: Events logged to console aren't captured

**Solution**: Ensure Pixel Inspector initialized BEFORE events fire
- For page load events: Use bookmarklet or snippet
- For subsequent events: Should work automatically

**Verify**:
```javascript
// Original console.log should be stored
console.log(PixelInspector.state?.originalConsoleLog);
```

### DataLayer not intercepted

**Issue**: `dataLayer.push()` not captured

**Cause**: dataLayer doesn't exist or loads after Pixel Inspector

**Solution**:
1. Check if dataLayer exists: `console.log(window.dataLayer)`
2. Initialize Pixel Inspector after GTM loads
3. Or: Manually capture: `PixelInspector.sendEvent(yourEventObject)`

### CORS Errors

**Issue**: "CORS policy blocked" error

**Solution**: Google Apps Script should handle CORS automatically. If errors persist:
1. Redeploy Apps Script
2. Ensure deployment is "Anyone" access
3. Check Apps Script execution log for errors

### Too many events captured

**Solution**: Use event filters

```javascript
PixelInspector.config.EVENT_FILTERS = {
  captureAll: false,
  eventNames: ['page_view', 'purchase', 'add_to_cart'],
  eventSources: ['custom_pixel']
};
```

---

## 📚 Advanced Usage

### Custom Event Validation

Add validation rules in `SiteConfig`:

```javascript
const SiteConfig = {
  "your-site": {
    baseUrl: "https://yoursite.com/",
    requiredEvents: ["page_view", "custom_event"],
    eventValidation: {
      custom_event: ['required_field1', 'required_field2']
    }
  }
};
```

### Event Enrichment

Modify `normalizeEvent()` function to add custom fields:

```javascript
function normalizeEvent(eventObj, source) {
  return {
    // ... existing fields
    custom_user_id: getCookieValue('user_id'),
    session_id: getSessionId(),
    // ... etc
  };
}
```

### Export Data

From Google Sheets:
1. File → Download → CSV/Excel
2. Or use Google Sheets API

From Apps Script:
```javascript
function exportEventsAsJSON() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Events');
  const data = sheet.getDataRange().getValues();
  
  Logger.log(JSON.stringify(data));
  return data;
}
```

---

## 🔒 Security & Privacy

### Data Collection
- Only collects event data you configure
- No PII unless explicitly tracked in events
- No third-party services (only Google Sheets)

### Access Control
- Apps Script: Set "Execute as: Me" for your control
- Google Sheet: Share only with authorized users
- Webhook URL: Keep confidential (no auth, rely on obscurity)

### Best Practices
- Don't track sensitive data (passwords, credit cards)
- Use "Anyone" deployment only for development
- For production: Consider adding authentication to Apps Script
- Regularly archive/delete old data

---

## 🛠️ Development

### Local Development

```bash
# Clone repository
git clone https://github.com/bkaufman7/shopify-opt-neutrition-project.git
cd shopify-opt-neutrition-project

# Install clasp for Apps Script deployment
npm install -g @google/clasp

# Login to Google
clasp login

# Pull latest from Apps Script
clasp pull
```

### Deploying Updates

**Browser Scripts**:
1. Edit files in `src/browser/`
2. Copy updated code to DevTools snippet
3. Or regenerate bookmarklet

**Apps Script**:
```bash
# After editing .gs files
clasp push

# Then redeploy in Apps Script UI
```

### Adding New Features

1. **New Event Type**:
   - Add to `isEventObject()` detection
   - Update `normalizeEvent()` for new fields
   - Add column to `EVENT_HEADERS` in webhook.gs

2. **New Report**:
   - Add function to `reporting.gs`
   - Add menu item in `onOpen()`
   - Create new sheet tab

3. **New Client**:
   - Add to `SiteConfig` object
   - Update `SITE_NAME` in browser config
   - Create new Google Sheet

---

## 📞 Support

### Common Questions

**Q: Can I use this without Apps Script?**
A: No, the webhook receiver requires Apps Script. Alternative: Use RequestBin or similar webhook service, but you'll need to build your own storage.

**Q: Will this slow down my website?**
A: No. Event capture is asynchronous and uses minimal resources. Batch sending is non-blocking.

**Q: Can I use this on multiple sites?**
A: Yes! Use different `SITE_NAME` values and the same webhook. Data will be tagged by site.

**Q: How long does data persist?**
A: Forever, unless you delete it. Auto-archiving happens at `MAX_ROWS`.

**Q: Can I customize what events are captured?**
A: Yes, use `EVENT_FILTERS` configuration.

---

## 🤝 Contributing

This is an internal tool for Optimum Nutrition project, but contributions welcome:

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

## 📄 License

Internal tool - All rights reserved.

---

## 🎓 Onboarding New Team Members

1. **Read this README fully**
2. **Review architecture diagram** (above)
3. **Complete deployment** (Quick Start section)
4. **Run test suite** (`src/testing/testPlan.md`)
5. **Review sample scenarios** (`src/testing/sampleTestScenarios.md`)
6. **Practice on test site** before production
7. **Ask questions** before deploying to client sites

---

## 📋 Checklist for Client Deployment

- [ ] Apps Script deployed
- [ ] Webhook URL copied
- [ ] Google Sheet created and shared
- [ ] Webhook URL configured in browser script
- [ ] Site name updated in config
- [ ] DevTools snippet tested
- [ ] Bookmarklet created (optional)
- [ ] Expectations sheet populated
- [ ] Test events sent and verified in sheet
- [ ] All reports generated successfully
- [ ] Team members trained
- [ ] Documentation URL shared with team

---

## 🔗 Resources

- **Google Apps Script Docs**: https://developers.google.com/apps-script
- **Google Sheets API**: https://developers.google.com/sheets
- **Shopify Custom Pixels**: https://shopify.dev/docs/apps/marketing/pixels
- **GTM Documentation**: https://developers.google.com/tag-manager

---

## 📝 Version History

**v1.0.0** (Current)
- Initial release
- Core event capture functionality
- Apps Script webhook & reporting
- DevTools snippet & bookmarklet
- Comprehensive test suite
- Full documentation

---

## ✨ Features Summary

✅ **Console-based event interception** - No site access needed
✅ **GTM iframe compatibility** - Works with isolated Custom Pixels
✅ **Multiple deployment options** - Snippet, bookmarklet, or direct injection
✅ **Automatic batching & retry** - Reliable event delivery
✅ **Google Sheets integration** - Easy data access & sharing
✅ **Automated reporting** - Summary, missing events, URL coverage, clicks
✅ **Multi-client support** - Track multiple sites in one sheet
✅ **Comprehensive testing** - Full test plan & scenarios included
✅ **Production-ready** - Error handling, logging, archiving
✅ **Developer-friendly** - Well-documented, modular, extensible

---

**Built for Optimum Nutrition Shopify Analytics QA**

For questions or support, contact: [Your Team/Contact Info]
