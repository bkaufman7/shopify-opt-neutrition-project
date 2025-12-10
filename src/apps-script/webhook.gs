/**
 * Shopify Pixel Inspector - Webhook Receiver
 * 
 * Google Apps Script webhook that receives event data from the browser
 * interceptor and stores it in Google Sheets.
 * 
 * DEPLOYMENT:
 * 1. Open Google Apps Script Editor
 * 2. Create a new project or open existing
 * 3. Copy this code into a new file called "webhook.gs"
 * 4. Deploy as Web App:
 *    - Click "Deploy" > "New deployment"
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL
 * 6. Paste URL into browser interceptor WEBHOOK_URL config
 * 
 * SHEET STRUCTURE:
 * Creates/uses a sheet named "Events" with columns:
 * - Timestamp
 * - Site Name
 * - Event Name
 * - Event Source
 * - Page URL
 * - Page Title
 * - Click Text
 * - Click URL
 * - Click ID
 * - Click Class
 * - Product ID
 * - Product Name
 * - Price
 * - Currency
 * - Ecommerce Data
 * - User Agent
 * - Raw JSON
 * 
 * @version 1.0.0
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// Use var instead of const to avoid redeclaration errors when both files load
var WEBHOOK_CONFIG = WEBHOOK_CONFIG || {
  SHEET_NAME: 'Events',
  RAW_JSON_SHEET: 'Raw JSON',
  MAX_ROWS: 50000, // Archive after this many rows
  AUTO_CREATE_SHEETS: true,
  LOG_ERRORS: true
};

// Column headers for Events sheet
const EVENT_HEADERS = [
  'Timestamp',
  'Site Name',
  'Event Name',
  'Event Source',
  'Page URL',
  'Page Path',
  'Page Title',
  'Page Referrer',
  'Click Text',
  'Click URL',
  'Click ID',
  'Click Class',
  'Click Tag',
  'Product ID',
  'Product Name',
  'Price',
  'Quantity',
  'Currency',
  'Ecommerce Data',
  'Custom Data',
  'User Agent',
  'Viewport Width',
  'Viewport Height',
  'Client Timestamp',
  'Raw JSON'
];

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

/**
 * Handle CORS preflight requests
 * @returns {Object} Response with CORS headers
 */
function doOptions() {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify({ status: 'ok' }))
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
}

/**
 * Handle incoming POST requests
 * @param {Object} e - Event object from HTTP request
 * @returns {Object} Response object
 */
function doPost(e) {
  try {
    // Log incoming request for debugging
    logDebug('Received POST request');
    
    // Parse request body
    const requestData = JSON.parse(e.postData.contents);
    logDebug('Parsed request data:', requestData);
    
    // Extract events and metadata
    const events = requestData.events || [];
    const metadata = requestData.metadata || {};
    
    if (events.length === 0) {
      return createResponse(400, 'No events provided');
    }
    
    // Get or create Events sheet
    const sheet = getOrCreateSheet(WEBHOOK_CONFIG.SHEET_NAME, EVENT_HEADERS);
    
    // Process and store events
    const rowsAdded = processEvents(sheet, events, metadata);
    
    // Store raw JSON if configured
    if (WEBHOOK_CONFIG.RAW_JSON_SHEET) {
      storeRawJSON(requestData);
    }
    
    // Return success response
    return createResponse(200, {
      success: true,
      events_received: events.length,
      rows_added: rowsAdded,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logError('Error in doPost:', error);
    return createResponse(500, {
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

/**
 * Handle incoming GET requests (for testing)
 * @param {Object} e - Event object
 * @returns {Object} Response object
 */
function doGet(e) {
  const html = HtmlService.createHtmlOutput(`
    <h1>Shopify Pixel Inspector Webhook</h1>
    <p>Status: <strong style="color: green;">Active</strong></p>
    <p>This endpoint receives POST requests from the browser interceptor.</p>
    <h2>Test POST</h2>
    <button onclick="testWebhook()">Send Test Event</button>
    <pre id="result"></pre>
    <script>
      function testWebhook() {
        const testData = {
          events: [{
            event_name: 'test_event',
            event_source: 'webhook_test',
            page_url: 'https://example.com/test',
            timestamp: new Date().toISOString()
          }],
          metadata: {
            site_name: 'test',
            sent_at: new Date().toISOString()
          }
        };
        
        fetch(window.location.href, {
          method: 'POST',
          body: JSON.stringify(testData)
        })
        .then(r => r.json())
        .then(data => {
          document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        })
        .catch(err => {
          document.getElementById('result').textContent = 'Error: ' + err;
        });
      }
    </script>
  `);
  
  return html;
}

// ============================================================================
// EVENT PROCESSING
// ============================================================================

/**
 * Process and store events in the sheet
 * @param {Sheet} sheet - Target sheet
 * @param {Array} events - Array of event objects
 * @param {Object} metadata - Request metadata
 * @returns {number} Number of rows added
 */
function processEvents(sheet, events, metadata) {
  const rows = [];
  const now = new Date();
  
  events.forEach(event => {
    const row = buildEventRow(event, metadata, now);
    rows.push(row);
  });
  
  // Append all rows at once for efficiency
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, EVENT_HEADERS.length)
         .setValues(rows);
  }
  
  logDebug(`Added ${rows.length} rows to sheet`);
  return rows.length;
}

/**
 * Build a row array from an event object
 * @param {Object} event - Event object
 * @param {Object} metadata - Request metadata
 * @param {Date} receivedTime - Server receive time
 * @returns {Array} Row data array
 */
function buildEventRow(event, metadata, receivedTime) {
  return [
    receivedTime,                                    // Timestamp
    event.site_name || metadata.site_name || '',    // Site Name
    event.event_name || '',                         // Event Name
    event.event_source || '',                       // Event Source
    event.page_url || '',                           // Page URL
    event.page_path || '',                          // Page Path
    event.page_title || '',                         // Page Title
    event.page_referrer || '',                      // Page Referrer
    truncateText(event.click_text, 500),            // Click Text
    event.click_url || '',                          // Click URL
    event.click_id || '',                           // Click ID
    event.click_class || '',                        // Click Class
    event.click_tag || '',                          // Click Tag
    event.product_id || '',                         // Product ID
    event.product_name || '',                       // Product Name
    event.price || '',                              // Price
    event.quantity || '',                           // Quantity
    event.currency || '',                           // Currency
    event.ecommerce ? JSON.stringify(event.ecommerce) : '', // Ecommerce Data
    event.custom_data ? JSON.stringify(event.custom_data) : '', // Custom Data
    truncateText(event.user_agent, 200),            // User Agent
    event.viewport_width || '',                     // Viewport Width
    event.viewport_height || '',                    // Viewport Height
    event.timestamp || '',                          // Client Timestamp
    event.raw_payload || JSON.stringify(event)      // Raw JSON
  ];
}

/**
 * Store raw JSON data in separate sheet
 * @param {Object} data - Full request data
 */
function storeRawJSON(data) {
  try {
    const sheet = getOrCreateSheet(WEBHOOK_CONFIG.RAW_JSON_SHEET, ['Timestamp', 'JSON Data']);
    sheet.appendRow([
      new Date(),
      JSON.stringify(data, null, 2)
    ]);
  } catch (error) {
    logError('Error storing raw JSON:', error);
  }
}

// ============================================================================
// SHEET MANAGEMENT
// ============================================================================

/**
 * Get existing sheet or create new one
 * @param {string} sheetName - Name of the sheet
 * @param {Array} headers - Column headers
 * @returns {Sheet} The sheet object
 */
function getOrCreateSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    if (!WEBHOOK_CONFIG.AUTO_CREATE_SHEETS) {
      throw new Error(`Sheet "${sheetName}" not found and auto-create is disabled`);
    }
    
    logDebug(`Creating new sheet: ${sheetName}`);
    sheet = ss.insertSheet(sheetName);
    
    // Add headers
    if (headers && headers.length > 0) {
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      
      // Freeze header row
      sheet.setFrozenRows(1);
      
      // Auto-resize columns
      for (let i = 1; i <= headers.length; i++) {
        sheet.autoResizeColumn(i);
      }
    }
  } else {
    // Verify headers exist
    const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (existingHeaders.join('') === '') {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  
  // Check if archiving is needed
  if (sheet.getLastRow() > WEBHOOK_CONFIG.MAX_ROWS) {
    archiveOldData(sheet);
  }
  
  return sheet;
}

/**
 * Archive old data to a new sheet
 * @param {Sheet} sheet - Sheet to archive
 */
function archiveOldData(sheet) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const archiveName = `${sheet.getName()}_Archive_${Utilities.formatDate(new Date(), 'GMT', 'yyyyMMdd_HHmmss')}`;
    
    logDebug(`Archiving ${sheet.getName()} to ${archiveName}`);
    
    // Create archive sheet
    const archiveSheet = ss.insertSheet(archiveName);
    
    // Copy all data
    const data = sheet.getDataRange().getValues();
    archiveSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    
    // Clear original sheet (keep headers)
    if (sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
    
    logDebug('Archive complete');
  } catch (error) {
    logError('Error archiving data:', error);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create HTTP response with CORS headers
 * @param {number} code - HTTP status code
 * @param {Object|string} data - Response data
 * @returns {Object} Response object
 */
function createResponse(code, data) {
  const response = {
    statusCode: code,
    body: typeof data === 'string' ? data : JSON.stringify(data)
  };
  
  const output = ContentService
    .createTextOutput(response.body)
    .setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers to allow cross-origin requests
  // This is critical for the browser snippet to work from any domain
  output.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  
  return output;
}

/**
 * Truncate text to maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  const str = String(text);
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

/**
 * Log debug message
 * @param {...*} args - Arguments to log
 */
function logDebug(...args) {
  Logger.log(['[DEBUG]', ...args].join(' '));
}

/**
 * Log error message
 * @param {...*} args - Arguments to log
 */
function logError(...args) {
  Logger.log(['[ERROR]', ...args].join(' '));
  
  if (WEBHOOK_CONFIG.LOG_ERRORS) {
    // Optionally store errors in a separate sheet
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let errorSheet = ss.getSheetByName('Errors');
      
      if (!errorSheet) {
        errorSheet = ss.insertSheet('Errors');
        errorSheet.appendRow(['Timestamp', 'Error Message', 'Stack Trace']);
      }
      
      const errorMsg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      errorSheet.appendRow([new Date(), errorMsg, new Error().stack]);
    } catch (e) {
      Logger.log('[ERROR] Could not log to error sheet:', e);
    }
  }
}

/**
 * Get webhook URL for easy access
 * 
 * HOW TO GET YOUR WEBHOOK URL:
 * Option 1 (If already deployed):
 *   - Click "Deploy" → "Manage deployments"
 *   - Copy the "Web app" URL
 * 
 * Option 2 (If not yet deployed):
 *   - Click "Deploy" → "New deployment" → Web app
 *   - Execute as: Me
 *   - Who has access: Anyone
 *   - Click "Deploy"
 *   - Copy the URL shown
 * 
 * Option 3 (Get URL programmatically - doesn't always work):
 *   - Run this function: getWebhookURL()
 *   - Check the execution log for the URL
 * 
 * @returns {string} Web app URL
 */
function getWebhookURL() {
  const url = ScriptApp.getService().getUrl();
  Logger.log('===========================================');
  Logger.log('YOUR WEBHOOK URL:');
  Logger.log(url);
  Logger.log('===========================================');
  Logger.log('Copy this URL and paste it into:');
  Logger.log('src/browser/devtoolsSnippet.js line 24');
  Logger.log('Replace: <YOUR-APPS-SCRIPT-WEB-APP-URL>');
  Logger.log('===========================================');
  return url;
}

/**
 * Test function for manual testing
 */
function testWebhook() {
  const testRequest = {
    postData: {
      contents: JSON.stringify({
        events: [
          {
            event_name: 'test_event',
            event_source: 'manual_test',
            page_url: 'https://example.com/test',
            page_title: 'Test Page',
            click_text: 'Test Button',
            timestamp: new Date().toISOString(),
            site_name: 'test-site'
          }
        ],
        metadata: {
          site_name: 'test-site',
          sent_at: new Date().toISOString(),
          is_flush: false
        }
      })
    }
  };
  
  const response = doPost(testRequest);
  Logger.log('Test response:', response.getContent());
}
