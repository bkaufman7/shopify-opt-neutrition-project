/**
 * Shopify Pixel Inspector - Reporting & Analysis
 * 
 * Google Apps Script functions for analyzing collected event data,
 * generating reports, and identifying missing events.
 * 
 * FEATURES:
 * - Event summary by type, URL, and source
 * - Missing event detection based on expectations
 * - Frequency analysis
 * - URL coverage reports
 * - Click tracking analysis
 * 
 * @version 1.0.0
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// Use var instead of const to avoid redeclaration errors if webhook.gs loads first
var REPORTING_CONFIG = REPORTING_CONFIG || {
  EVENTS_SHEET: 'Events',
  EXPECTATIONS_SHEET: 'Expectations',
  SUMMARY_SHEET: 'Summary',
  MISSING_EVENTS_SHEET: 'Missing Events Report',
  URL_COVERAGE_SHEET: 'URL Coverage',
  CLICK_ANALYSIS_SHEET: 'Click Analysis'
};

// ============================================================================
// MAIN REPORTING FUNCTIONS
// ============================================================================

/**
 * Generate all reports
 * Run this from the Apps Script menu
 */
function generateAllReports() {
  Logger.log('Starting report generation...');
  
  try {
    generateSummaryReport();
    generateMissingEventsReport();
    generateURLCoverageReport();
    generateClickAnalysisReport();
    
    SpreadsheetApp.getUi().alert('Reports generated successfully!');
    Logger.log('All reports generated successfully');
  } catch (error) {
    Logger.log('Error generating reports: ' + error);
    SpreadsheetApp.getUi().alert('Error generating reports: ' + error);
  }
}

/**
 * Generate summary report of all events
 */
function generateSummaryReport() {
  Logger.log('Generating summary report...');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eventsSheet = ss.getSheetByName(REPORTING_CONFIG.EVENTS_SHEET);
  
  if (!eventsSheet) {
    throw new Error('Events sheet not found');
  }
  
  // Get all event data
  const data = eventsSheet.getDataRange().getValues();
  const headers = data[0];
  const events = data.slice(1);
  
  // Column indices
  const eventNameCol = headers.indexOf('Event Name');
  const eventSourceCol = headers.indexOf('Event Source');
  const pageUrlCol = headers.indexOf('Page URL');
  const timestampCol = headers.indexOf('Timestamp');
  
  // Aggregate data
  const summary = {
    byEventName: {},
    byEventSource: {},
    byPageUrl: {},
    byDate: {}
  };
  
  events.forEach(row => {
    const eventName = row[eventNameCol] || 'unknown';
    const eventSource = row[eventSourceCol] || 'unknown';
    const pageUrl = row[pageUrlCol] || 'unknown';
    const timestamp = new Date(row[timestampCol]);
    const date = Utilities.formatDate(timestamp, 'GMT', 'yyyy-MM-dd');
    
    // Count by event name
    summary.byEventName[eventName] = (summary.byEventName[eventName] || 0) + 1;
    
    // Count by event source
    summary.byEventSource[eventSource] = (summary.byEventSource[eventSource] || 0) + 1;
    
    // Count by page URL
    summary.byPageUrl[pageUrl] = (summary.byPageUrl[pageUrl] || 0) + 1;
    
    // Count by date
    summary.byDate[date] = (summary.byDate[date] || 0) + 1;
  });
  
  // Create or clear summary sheet
  let summarySheet = ss.getSheetByName(REPORTING_CONFIG.SUMMARY_SHEET);
  if (!summarySheet) {
    summarySheet = ss.insertSheet(REPORTING_CONFIG.SUMMARY_SHEET);
  } else {
    summarySheet.clear();
  }
  
  // Write summary data
  let currentRow = 1;
  
  // Total events
  summarySheet.getRange(currentRow, 1, 1, 2).setValues([['Total Events', events.length]]);
  summarySheet.getRange(currentRow, 1, 1, 2).setFontWeight('bold').setBackground('#e8f0fe');
  currentRow += 2;
  
  // By Event Name
  summarySheet.getRange(currentRow, 1, 1, 2).setValues([['Event Name', 'Count']]);
  summarySheet.getRange(currentRow, 1, 1, 2).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  currentRow++;
  
  const eventNameData = Object.entries(summary.byEventName)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => [name, count]);
  
  if (eventNameData.length > 0) {
    summarySheet.getRange(currentRow, 1, eventNameData.length, 2).setValues(eventNameData);
    currentRow += eventNameData.length + 1;
  }
  
  // By Event Source
  summarySheet.getRange(currentRow, 1, 1, 2).setValues([['Event Source', 'Count']]);
  summarySheet.getRange(currentRow, 1, 1, 2).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  currentRow++;
  
  const eventSourceData = Object.entries(summary.byEventSource)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => [source, count]);
  
  if (eventSourceData.length > 0) {
    summarySheet.getRange(currentRow, 1, eventSourceData.length, 2).setValues(eventSourceData);
    currentRow += eventSourceData.length + 1;
  }
  
  // By Date
  summarySheet.getRange(currentRow, 1, 1, 2).setValues([['Date', 'Events']]);
  summarySheet.getRange(currentRow, 1, 1, 2).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  currentRow++;
  
  const dateData = Object.entries(summary.byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => [date, count]);
  
  if (dateData.length > 0) {
    summarySheet.getRange(currentRow, 1, dateData.length, 2).setValues(dateData);
    currentRow += dateData.length + 1;
  }
  
  // Top URLs
  summarySheet.getRange(currentRow, 1, 1, 2).setValues([['Top 20 URLs', 'Events']]);
  summarySheet.getRange(currentRow, 1, 1, 2).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  currentRow++;
  
  const urlData = Object.entries(summary.byPageUrl)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([url, count]) => [url, count]);
  
  if (urlData.length > 0) {
    summarySheet.getRange(currentRow, 1, urlData.length, 2).setValues(urlData);
  }
  
  // Auto-resize columns
  summarySheet.autoResizeColumns(1, 2);
  
  Logger.log('Summary report generated');
}

/**
 * Generate missing events report
 * Compares actual events to expected events from Expectations sheet
 */
function generateMissingEventsReport() {
  Logger.log('Generating missing events report...');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eventsSheet = ss.getSheetByName(REPORTING_CONFIG.EVENTS_SHEET);
  const expectationsSheet = ss.getSheetByName(REPORTING_CONFIG.EXPECTATIONS_SHEET);
  
  if (!eventsSheet) {
    throw new Error('Events sheet not found');
  }
  
  if (!expectationsSheet) {
    Logger.log('Expectations sheet not found - creating template');
    createExpectationsTemplate();
    return;
  }
  
  // Get actual events
  const eventsData = eventsSheet.getDataRange().getValues();
  const eventHeaders = eventsData[0];
  const actualEvents = eventsData.slice(1);
  
  const eventNameCol = eventHeaders.indexOf('Event Name');
  const pageUrlCol = eventHeaders.indexOf('Page URL');
  const pagePathCol = eventHeaders.indexOf('Page Path');
  
  // Get expected events
  const expectationsData = expectationsSheet.getDataRange().getValues();
  const expHeaders = expectationsData[0];
  const expectations = expectationsData.slice(1);
  
  const expEventCol = expHeaders.indexOf('Event Name');
  const expUrlCol = expHeaders.indexOf('URL Pattern');
  const expRequiredCol = expHeaders.indexOf('Required');
  
  // Build actual events set
  const actualEventSet = new Set();
  actualEvents.forEach(row => {
    const eventName = row[eventNameCol];
    const pageUrl = row[pageUrlCol] || row[pagePathCol];
    if (eventName && pageUrl) {
      actualEventSet.add(`${eventName}|${pageUrl}`);
    }
  });
  
  // Check expectations
  const missingEvents = [];
  
  expectations.forEach(row => {
    const eventName = row[expEventCol];
    const urlPattern = row[expUrlCol];
    const required = row[expRequiredCol];
    
    if (!eventName || !urlPattern) return;
    
    // Check if event fired on matching URLs
    const matchingUrls = actualEvents
      .filter(e => {
        const url = e[pageUrlCol] || e[pagePathCol];
        return url && urlPatternMatches(url, urlPattern);
      })
      .map(e => e[pageUrlCol] || e[pagePathCol]);
    
    const uniqueUrls = [...new Set(matchingUrls)];
    
    // Check if event fired on those URLs
    uniqueUrls.forEach(url => {
      const key = `${eventName}|${url}`;
      if (!actualEventSet.has(key)) {
        missingEvents.push([
          eventName,
          url,
          urlPattern,
          required === true || required === 'TRUE' || required === 'Yes' ? 'Yes' : 'No',
          'Event not fired'
        ]);
      }
    });
    
    // If no matching URLs found at all
    if (uniqueUrls.length === 0) {
      missingEvents.push([
        eventName,
        'N/A',
        urlPattern,
        required === true || required === 'TRUE' || required === 'Yes' ? 'Yes' : 'No',
        'No matching URLs found'
      ]);
    }
  });
  
  // Create or clear missing events sheet
  let missingSheet = ss.getSheetByName(REPORTING_CONFIG.MISSING_EVENTS_SHEET);
  if (!missingSheet) {
    missingSheet = ss.insertSheet(REPORTING_CONFIG.MISSING_EVENTS_SHEET);
  } else {
    missingSheet.clear();
  }
  
  // Write headers
  const headers = ['Event Name', 'URL', 'URL Pattern', 'Required', 'Status'];
  missingSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  missingSheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#ea4335')
    .setFontColor('#ffffff');
  
  // Write missing events
  if (missingEvents.length > 0) {
    missingSheet.getRange(2, 1, missingEvents.length, 5).setValues(missingEvents);
    
    // Highlight required events
    for (let i = 0; i < missingEvents.length; i++) {
      if (missingEvents[i][3] === 'Yes') {
        missingSheet.getRange(i + 2, 1, 1, 5).setBackground('#fce8e6');
      }
    }
  } else {
    missingSheet.getRange(2, 1, 1, 1).setValue('No missing events detected!');
  }
  
  // Auto-resize
  missingSheet.autoResizeColumns(1, headers.length);
  missingSheet.setFrozenRows(1);
  
  Logger.log(`Missing events report generated: ${missingEvents.length} issues found`);
}

/**
 * Generate URL coverage report
 * Shows which events fired on which URLs
 */
function generateURLCoverageReport() {
  Logger.log('Generating URL coverage report...');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eventsSheet = ss.getSheetByName(REPORTING_CONFIG.EVENTS_SHEET);
  
  if (!eventsSheet) {
    throw new Error('Events sheet not found');
  }
  
  const data = eventsSheet.getDataRange().getValues();
  const headers = data[0];
  const events = data.slice(1);
  
  const eventNameCol = headers.indexOf('Event Name');
  const pageUrlCol = headers.indexOf('Page URL');
  
  // Build coverage matrix
  const coverage = {};
  
  events.forEach(row => {
    const eventName = row[eventNameCol] || 'unknown';
    const pageUrl = row[pageUrlCol] || 'unknown';
    
    if (!coverage[pageUrl]) {
      coverage[pageUrl] = {};
    }
    
    coverage[pageUrl][eventName] = (coverage[pageUrl][eventName] || 0) + 1;
  });
  
  // Get unique event names
  const eventNames = [...new Set(events.map(row => row[eventNameCol] || 'unknown'))].sort();
  
  // Create or clear sheet
  let coverageSheet = ss.getSheetByName(REPORTING_CONFIG.URL_COVERAGE_SHEET);
  if (!coverageSheet) {
    coverageSheet = ss.insertSheet(REPORTING_CONFIG.URL_COVERAGE_SHEET);
  } else {
    coverageSheet.clear();
  }
  
  // Write headers
  const headerRow = ['URL', ...eventNames];
  coverageSheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
  coverageSheet.getRange(1, 1, 1, headerRow.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');
  
  // Write coverage data
  const urls = Object.keys(coverage).sort();
  const coverageData = urls.map(url => {
    const row = [url];
    eventNames.forEach(eventName => {
      row.push(coverage[url][eventName] || 0);
    });
    return row;
  });
  
  if (coverageData.length > 0) {
    coverageSheet.getRange(2, 1, coverageData.length, headerRow.length).setValues(coverageData);
  }
  
  // Auto-resize
  coverageSheet.autoResizeColumns(1, headerRow.length);
  coverageSheet.setFrozenRows(1);
  coverageSheet.setFrozenColumns(1);
  
  Logger.log('URL coverage report generated');
}

/**
 * Generate click analysis report
 */
function generateClickAnalysisReport() {
  Logger.log('Generating click analysis report...');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eventsSheet = ss.getSheetByName(REPORTING_CONFIG.EVENTS_SHEET);
  
  if (!eventsSheet) {
    throw new Error('Events sheet not found');
  }
  
  const data = eventsSheet.getDataRange().getValues();
  const headers = data[0];
  const events = data.slice(1);
  
  const eventNameCol = headers.indexOf('Event Name');
  const clickTextCol = headers.indexOf('Click Text');
  const clickUrlCol = headers.indexOf('Click URL');
  const pageUrlCol = headers.indexOf('Page URL');
  
  // Filter click events
  const clickEvents = events.filter(row => {
    const eventName = row[eventNameCol] || '';
    return eventName.toLowerCase().includes('click') || row[clickTextCol];
  });
  
  // Aggregate clicks
  const clickSummary = {};
  
  clickEvents.forEach(row => {
    const clickText = row[clickTextCol] || 'No text';
    const clickUrl = row[clickUrlCol] || 'No URL';
    const pageUrl = row[pageUrlCol] || 'Unknown page';
    
    const key = `${clickText}|${clickUrl}`;
    
    if (!clickSummary[key]) {
      clickSummary[key] = {
        text: clickText,
        url: clickUrl,
        count: 0,
        pages: new Set()
      };
    }
    
    clickSummary[key].count++;
    clickSummary[key].pages.add(pageUrl);
  });
  
  // Create report data
  const reportData = Object.values(clickSummary)
    .map(item => [
      item.text,
      item.url,
      item.count,
      item.pages.size,
      [...item.pages].join(', ')
    ])
    .sort((a, b) => b[2] - a[2]); // Sort by count descending
  
  // Create or clear sheet
  let clickSheet = ss.getSheetByName(REPORTING_CONFIG.CLICK_ANALYSIS_SHEET);
  if (!clickSheet) {
    clickSheet = ss.insertSheet(REPORTING_CONFIG.CLICK_ANALYSIS_SHEET);
  } else {
    clickSheet.clear();
  }
  
  // Write headers
  const headerRow = ['Click Text', 'Destination URL', 'Click Count', 'Pages Count', 'Pages'];
  clickSheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
  clickSheet.getRange(1, 1, 1, headerRow.length)
    .setFontWeight('bold')
    .setBackground('#34a853')
    .setFontColor('#ffffff');
  
  // Write data
  if (reportData.length > 0) {
    clickSheet.getRange(2, 1, reportData.length, headerRow.length).setValues(reportData);
  } else {
    clickSheet.getRange(2, 1, 1, 1).setValue('No click events found');
  }
  
  // Auto-resize
  clickSheet.autoResizeColumns(1, headerRow.length);
  clickSheet.setFrozenRows(1);
  
  Logger.log(`Click analysis report generated: ${reportData.length} unique clicks`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if URL matches pattern
 * Supports wildcards (*) and exact matches
 * @param {string} url - URL to check
 * @param {string} pattern - Pattern to match
 * @returns {boolean}
 */
function urlPatternMatches(url, pattern) {
  if (!url || !pattern) return false;
  
  // Exact match
  if (url === pattern) return true;
  
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*/g, '.*'); // Convert * to .*
  
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(url);
}

/**
 * Create expectations template sheet
 */
function createExpectationsTemplate() {
  Logger.log('Creating Expectations template...');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(REPORTING_CONFIG.EXPECTATIONS_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(REPORTING_CONFIG.EXPECTATIONS_SHEET);
  } else {
    sheet.clear();
  }
  
  // Headers
  const headers = ['Event Name', 'URL Pattern', 'Required', 'Description'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#fbbc04')
    .setFontColor('#000000');
  
  // Sample expectations
  const samples = [
    ['page_view', '*', 'Yes', 'Page view should fire on all pages'],
    ['custom_click_link_storefront', '*/products/*', 'Yes', 'Click tracking on product pages'],
    ['add_to_cart', '*/products/*', 'Yes', 'Add to cart on product pages'],
    ['view_item', '*/products/*', 'Yes', 'Product view tracking'],
    ['begin_checkout', '*/checkout', 'Yes', 'Checkout initiation'],
    ['purchase', '*/thank-you', 'Yes', 'Purchase confirmation']
  ];
  
  sheet.getRange(2, 1, samples.length, headers.length).setValues(samples);
  
  // Auto-resize
  sheet.autoResizeColumns(1, headers.length);
  sheet.setFrozenRows(1);
  
  // Add instructions
  sheet.getRange(samples.length + 3, 1, 1, 1).setValue('Instructions:');
  sheet.getRange(samples.length + 3, 1, 1, 1).setFontWeight('bold');
  
  const instructions = [
    '1. Add expected events with URL patterns (* for wildcard)',
    '2. Mark Required = Yes for critical events',
    '3. Run generateAllReports() to check for missing events'
  ];
  
  instructions.forEach((instr, i) => {
    sheet.getRange(samples.length + 4 + i, 1, 1, 1).setValue(instr);
  });
  
  Logger.log('Expectations template created');
}

/**
 * Add custom menu to spreadsheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Pixel Inspector')
    .addItem('Generate All Reports', 'generateAllReports')
    .addSeparator()
    .addItem('Summary Report', 'generateSummaryReport')
    .addItem('Missing Events Report', 'generateMissingEventsReport')
    .addItem('URL Coverage Report', 'generateURLCoverageReport')
    .addItem('Click Analysis Report', 'generateClickAnalysisReport')
    .addSeparator()
    .addItem('Create Expectations Template', 'createExpectationsTemplate')
    .addItem('Get Webhook URL', 'showWebhookURL')
    .addToUi();
}

/**
 * Show webhook URL in dialog
 */
function showWebhookURL() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput(`
    <h3>Webhook URL</h3>
    <p>Copy this URL and paste it into your browser interceptor configuration:</p>
    <textarea style="width: 100%; height: 100px; font-family: monospace;">${url}</textarea>
    <br><br>
    <button onclick="google.script.host.close()">Close</button>
  `).setWidth(500).setHeight(200);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Webhook URL');
}
