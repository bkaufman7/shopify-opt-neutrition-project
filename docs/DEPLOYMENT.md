# Deployment Guide

## Prerequisites

Before deploying the Pixel Inspector, ensure you have:

- [ ] Google Account with access to:
  - Google Apps Script
  - Google Sheets
- [ ] Chrome browser (or Firefox/Safari with DevTools)
- [ ] Access to target Shopify storefront
- [ ] Basic understanding of browser DevTools
- [ ] Git/GitHub access (optional, for version control)

---

## Part 1: Google Apps Script Setup

### Step 1: Create New Apps Script Project

1. Navigate to https://script.google.com/
2. Click **"New Project"** button (top left)
3. Rename project: Click "Untitled project" → "Pixel Inspector - [Client Name]"
4. Click **Save** (disk icon)

### Step 2: Add Webhook Code

1. In the Apps Script editor, you should see `Code.gs`
2. Delete the default `myFunction()` code
3. Click **Files** → **+** → **Script**
4. Name it `webhook`
5. Copy entire contents of `src/apps-script/webhook.gs` from this repository
6. Paste into the `webhook.gs` file
7. Click **Save**

### Step 3: Add Reporting Code

1. Click **Files** → **+** → **Script**
2. Name it `reporting`
3. Copy entire contents of `src/apps-script/reporting.gs`
4. Paste into `reporting.gs` file
5. Click **Save**

### Step 4: Configure Apps Script

1. Click **Project Settings** (gear icon, left sidebar)
2. Scroll to "Script Properties"
3. Note: No properties needed for basic deployment
4. Return to **Editor** view

### Step 5: Deploy as Web App

**CRITICAL STEP - Follow carefully:**

1. Click **Deploy** button (top right)
2. Select **"New deployment"**
3. Click gear icon next to "Select type"
4. Choose **"Web app"**
5. Configure deployment:
   - **Description**: "Pixel Inspector Webhook v1.0"
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
     - ⚠️ Important: "Anyone" means anyone with the URL, not public
6. Click **"Deploy"**
7. **Authorization Required** dialog will appear:
   - Click **"Authorize access"**
   - Choose your Google account
   - Click **"Advanced"** (if you see a warning)
   - Click **"Go to Pixel Inspector (unsafe)"**
     - This is safe - it's your own script
   - Click **"Allow"**
8. **Copy the Web App URL** that appears
   - Format: `https://script.google.com/macros/s/[SCRIPT_ID]/exec`
   - **SAVE THIS URL** - You'll need it for browser configuration

### Step 6: Test Webhook

1. Copy your webhook URL
2. Paste into new browser tab
3. You should see: "Shopify Pixel Inspector Webhook" status page
4. If you see this, deployment successful! ✅

---

## Part 2: Google Sheets Setup

### Step 1: Create Spreadsheet

1. Go to https://sheets.google.com/
2. Click **"Blank"** to create new spreadsheet
3. Rename: "Pixel Inspector - [Client Name]"
   - Example: "Pixel Inspector - Optimum Nutrition"

### Step 2: Configure Sheet Permissions

1. Click **Share** button (top right)
2. Ensure the Google account used for Apps Script has **Editor** access
3. (Optional) Add team members with appropriate permissions:
   - **Editor**: Can run reports, modify data
   - **Viewer**: Can only view data

### Step 3: Initial Sheet Setup

The webhook will auto-create sheets on first POST request, but you can pre-create:

1. Rename "Sheet1" to "Events"
2. Optional: Create additional tabs:
   - "Expectations"
   - "Summary"
   - "Missing Events Report"
   - "URL Coverage"
   - "Click Analysis"

### Step 4: Link Apps Script to Sheet

**Method 1: Container-bound Script (Recommended)**

1. From Google Sheet, click **Extensions** → **Apps Script**
2. This creates a script bound to the sheet
3. Copy your webhook and reporting code here instead
4. Deploy from this project

**Method 2: Standalone Script (Current setup)**

The standalone script will write to whichever sheet is active when it runs. To ensure it uses the correct sheet:

1. Open your Apps Script project
2. Add this function:

```javascript
function setActiveSpreadsheet() {
  const sheetId = 'YOUR_SHEET_ID_HERE'; // From sheet URL
  const ss = SpreadsheetApp.openById(sheetId);
  // The webhook will now use this sheet
}
```

3. Or: Keep the sheet open in a tab while testing

---

## Part 3: Browser Interceptor Deployment

Choose **ONE** deployment method based on your use case:

---

### Method A: DevTools Snippet (Recommended for Development)

**Best for**: Development, testing, repeated use on same sites

**Pros**:
- Persistent across sessions
- Easy to edit and update
- No bookmark clutter
- Full debugging capabilities

**Steps**:

1. **Open DevTools**:
   - Windows/Linux: `F12` or `Ctrl+Shift+I`
   - Mac: `Cmd+Option+I`

2. **Navigate to Snippets**:
   - Click **Sources** tab
   - In left sidebar, click **Snippets**
   - If hidden: Click **>>** → **Snippets**

3. **Create Snippet**:
   - Click **"+ New snippet"**
   - Name it: `PixelInspector`

4. **Add Code**:
   - Copy entire contents of `src/browser/devtoolsSnippet.js`
   - Paste into snippet editor

5. **Configure Webhook URL**:
   - Find line ~24: `const WEBHOOK_URL = "<YOUR-APPS-SCRIPT-WEB-APP-URL>";`
   - Replace with your actual webhook URL from Part 1, Step 5

6. **Configure Site Name** (optional):
   - Find line ~25: `const SITE_NAME = "optimum-nutrition";`
   - Change to your client name

7. **Save**:
   - `Ctrl+S` (Windows) or `Cmd+S` (Mac)

8. **Run**:
   - Right-click snippet → **Run**
   - Or: Click **Run** button (▶️) at bottom

9. **Verify**:
   - Check console for: `[Pixel Inspector] ✓ Initialized successfully!`
   - Run: `PixelInspector.stats()`

**Usage**: 
- Run snippet once per page session
- Automatically initializes on execution

---

### Method B: Bookmarklet (Best for Quick Access)

**Best for**: Quick ad-hoc testing, sharing with non-technical users

**Pros**:
- One-click activation
- No DevTools needed
- Easy to share

**Cons**:
- Harder to update
- Less debugging visibility

**Steps**:

1. **Get Minified Code**:
   - Open `src/browser/bookmarklet.js`
   - Copy the MINIFIED version (line starting with `javascript:(function(){...`)

2. **Create Bookmark**:
   - **Chrome**: 
     - `Ctrl+D` or `Cmd+D`
     - Or: Bookmarks → Bookmark Manager → Add new bookmark
   - **Firefox**: 
     - `Ctrl+D` or `Cmd+D`
   - **Safari**: 
     - Bookmarks → Add Bookmark

3. **Configure Bookmark**:
   - **Name**: `Pixel Inspector`
   - **URL**: Paste the minified code

4. **Edit Code Before Saving**:
   - ⚠️ **CRITICAL**: Before using, you must edit the code
   - Find `WEBHOOK_URL:"<YOUR-APPS-SCRIPT-WEB-APP-URL>"`
   - Replace with your actual URL
   - Find `SITE_NAME:"optimum-nutrition"`
   - Update if needed

5. **Save Bookmark**

6. **Use**:
   - Navigate to target page
   - Click bookmarklet
   - Check console for initialization message

**Note**: Editing bookmarklets is difficult. Consider:
- Using a text editor to prepare the full code
- Or using a bookmarklet builder tool

---

### Method C: Direct Console Injection (Quick Testing)

**Best for**: One-time tests, troubleshooting

**Steps**:

1. Open DevTools Console
2. Copy entire contents of `src/browser/consoleInterceptor.js`
3. Edit `WEBHOOK_URL` and `SITE_NAME` in the code
4. Paste into console
5. Press Enter

**Pros**: Immediate, no setup
**Cons**: Must re-inject on every page load

---

## Part 4: Verification & Testing

### Test 1: Basic Initialization

1. Deploy interceptor using chosen method
2. Open DevTools console
3. Look for: `[Pixel Inspector] ✓ Initialized successfully!`
4. Run: `PixelInspector.stats()`
5. Expected output:
   ```javascript
   {
     captured: 1,
     sent: 0,
     failed: 0,
     queued: 1,
     site: "your-site-name",
     initialized: true,
     running: true
   }
   ```

### Test 2: Event Capture

```javascript
// Send test event
PixelInspector.sendEvent({
  event: 'test_event',
  event_source: 'manual',
  test_field: 'test_value'
});

// Check stats
PixelInspector.stats();
// Should show captured: 2
```

### Test 3: Data Transmission

```javascript
// Force send
PixelInspector.flush();

// Wait 3 seconds, then check Google Sheet
// Should see test event in "Events" tab
```

### Test 4: End-to-End Flow

1. Navigate to a product page
2. Initialize Pixel Inspector
3. Click on a link or button
4. Check console for captured click event
5. Wait 5-10 seconds
6. Check Google Sheet "Events" tab
7. Verify row appears with:
   - Timestamp
   - Event name
   - Page URL
   - Click details

---

## Part 5: Client-Specific Configuration

### For Each New Client:

1. **Update Site Name**:
   ```javascript
   const SITE_NAME = "client-name";
   ```

2. **Add to SiteConfig** (in consoleInterceptor.js):
   ```javascript
   const SiteConfig = {
     "client-name": {
       baseUrl: "https://www.client-site.com/",
       requiredEvents: [
         "page_view",
         "add_to_cart",
         "purchase"
       ],
       eventValidation: {
         page_view: ['page_url', 'page_title'],
         add_to_cart: ['product_id', 'price'],
         purchase: ['transaction_id', 'value']
       }
     }
   };
   ```

3. **Create Client Sheet**:
   - New Google Sheet: "Pixel Inspector - [Client Name]"
   - Or: New tab in existing multi-client sheet

4. **Configure Expectations**:
   - Open Google Sheet
   - Create "Expectations" tab
   - Add expected events per URL pattern

---

## Part 6: Team Onboarding

### For QA Team Members:

**Access Needed**:
- [ ] Google Sheet (Viewer or Editor)
- [ ] Bookmarklet or Snippet code
- [ ] This documentation

**Training Steps**:
1. Review README.md (15 min)
2. Watch deployment demo (if available)
3. Practice on test site (30 min)
4. Complete test checklist (src/testing/testPlan.md)
5. Shadow experienced team member (1 session)

### For Developers:

**Additional Access**:
- [ ] GitHub repository
- [ ] Apps Script project
- [ ] Full documentation

---

## Part 7: Production Deployment Checklist

Before deploying to production client site:

- [ ] Apps Script deployed successfully
- [ ] Webhook URL tested and working
- [ ] Google Sheet created with correct permissions
- [ ] Browser interceptor tested on staging/dev site
- [ ] Site name configured correctly
- [ ] Event filters configured (if needed)
- [ ] Expectations sheet populated
- [ ] Test events sent and verified
- [ ] All reports generated successfully
- [ ] Team trained on usage
- [ ] Client notified (if applicable)
- [ ] Documentation URL shared
- [ ] Backup/archive plan established

---

## Troubleshooting Deployment Issues

### Issue: "Authorization Required" won't complete

**Solution**:
1. Clear browser cache
2. Try incognito/private window
3. Ensure you're using the correct Google account
4. Check if Apps Script API is enabled

### Issue: Webhook returns 404

**Solution**:
1. Redeploy Apps Script
2. Ensure deployment type is "Web app"
3. Check "Execute as: Me" is selected
4. Copy NEW webhook URL after redeployment

### Issue: Events not appearing in Sheet

**Solution**:
1. Check Apps Script execution log:
   - Apps Script → Executions
2. Verify sheet name matches config
3. Check sheet permissions
4. Try manual test: `testWebhook()` in Apps Script

### Issue: "Script is disabled"

**Solution**:
1. Apps Script project settings
2. Ensure project is not archived
3. Redeploy if needed

---

## Updating Deployment

### Update Browser Code:

**Snippet**:
1. Edit snippet in DevTools
2. Save
3. Re-run

**Bookmarklet**:
1. Generate new minified code
2. Edit bookmark
3. Replace URL

### Update Apps Script:

**Via Web Interface**:
1. Edit code in Apps Script editor
2. Save
3. Deploy → Manage deployments
4. Click pencil icon next to active deployment
5. Version → New version
6. Deploy

**Via clasp CLI**:
```bash
clasp push
# Then redeploy via web interface
```

---

## Security Best Practices

### Production Deployment:

1. **Webhook Authentication** (Advanced):
   ```javascript
   function doPost(e) {
     const authToken = e.parameter.auth;
     if (authToken !== 'YOUR_SECRET_TOKEN') {
       return createResponse(401, 'Unauthorized');
     }
     // ... rest of code
   }
   ```

2. **IP Whitelisting** (if possible):
   - Not available in Apps Script
   - Consider alternative webhook service if needed

3. **Data Retention**:
   - Set `MAX_ROWS` appropriately
   - Implement auto-archiving
   - Regular data cleanup

4. **Access Control**:
   - Limit Google Sheet access
   - Use viewer permissions where possible
   - Audit access regularly

---

## Deployment Complete! 🎉

Your Pixel Inspector is now deployed and ready to use.

**Next Steps**:
1. Review usage guide in README.md
2. Complete test scenarios
3. Generate first reports
4. Train team members

**Support**: Refer to TROUBLESHOOTING.md for common issues
