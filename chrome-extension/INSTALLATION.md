# Tag Mapper Debugger - Chrome Extension

## 🎯 Installation Instructions

### Step 1: Load the Extension in Chrome

1. **Open Chrome** and go to: `chrome://extensions/`

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to: `c:\Users\bkaufman\shopify opt neutrition project\chrome-extension`
   - Select the `chrome-extension` folder
   - Click "Select Folder"

4. **Verify Installation**
   - You should see "Tag Mapper Debugger v2.0.0" in your extensions list
   - The extension icon will appear in your Chrome toolbar

### Step 2: Using the Extension

**The extension now works AUTOMATICALLY on ALL websites!**

1. **Navigate to any website** (e.g., optimumnutrition.com)
   - The extension activates automatically
   - Check the console (F12) - you'll see: `[Tag Mapper Extension] ✓ Active on this page!`

2. **View captured data:**
   - Click the Tag Mapper icon in your toolbar
   - See real-time stats (events, network requests, clicks)
   - Browse the "Events" and "Tags" tabs

3. **The extension persists across:**
   - ✅ Page navigations
   - ✅ Different domains
   - ✅ New tabs (each tab tracks independently)
   - ✅ Browser sessions (until you close Chrome)

### Step 3: Key Features

**✨ What's Different from the Snippet:**

- **Always Active**: Runs automatically on every page
- **Cross-Domain**: Works across ALL websites
- **Persistent**: Doesn't turn off when navigating
- **Global Tracking**: Background script tracks events across all tabs
- **No Manual Activation**: No need to run code in DevTools

**📊 What It Captures:**

- DataLayer pushes (GTM events)
- Console events (Shopify Custom Pixel logs)
- Network requests (GA4, Facebook, TikTok, Floodlight, etc.)
- User interactions (clicks on links/buttons)
- Page views and navigation
- Tag initiators (GTM, gtag, Custom Pixel, etc.)

**🔄 Auto-Export:**

- Exports to Google Sheets every 100 events
- Same webhook URL as before
- Preserves all event data

### Step 4: Testing

1. Go to `optimumnutrition.com`
2. Open Chrome DevTools (F12) → Console tab
3. You should see: `[Tag Mapper Extension] ✓ Active on this page!`
4. Click around the site, navigate to different pages
5. Click the extension icon to see captured events
6. Navigate to a DIFFERENT domain (e.g., `google.com`)
7. The extension keeps working! 🎉

### Step 5: Viewing Full Debugger

Click the extension icon → Click "Open Full Debugger" button

This opens a full window with:
- Timeline view (all events chronologically)
- Tag Map (summary by tag type)
- Network requests
- DataLayer variables
- User journey

### Troubleshooting

**Extension not showing events?**
- Refresh the page after installing
- Check console for activation message
- Make sure the site allows tracking requests

**Need to update the extension?**
- Edit files in `chrome-extension` folder
- Go to `chrome://extensions/`
- Click the refresh icon on Tag Mapper Debugger

**Want to disable temporarily?**
- Go to `chrome://extensions/`
- Toggle off Tag Mapper Debugger

### Commands

Open console (F12) and type:

```javascript
TagMapper.stats()        // View current stats
TagMapper.export()       // Export to Sheets now
TagMapper.getEvents()    // See all events
TagMapper.getJourney()   // View user journey
```

### Next Steps

1. Install the extension
2. Visit optimumnutrition.com
3. Browse the site for 5-10 minutes
4. Check Google Sheets for exported data
5. Use the data to build your tag audit documentation!

---

## 🔧 Advanced: Creating Icons (Optional)

The extension currently references icon files that don't exist yet. To add custom icons:

1. Create 3 PNG files:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

2. Save them in the `chrome-extension` folder

3. Use any icon design tool or grab from: https://www.flaticon.com

For now, Chrome will use a default icon - the extension works perfectly without custom icons!
