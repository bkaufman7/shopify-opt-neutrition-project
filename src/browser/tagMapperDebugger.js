/**
 * Tag Mapper & Debugger - COMPLETE TAG DISCOVERY TOOL
 * 
 * Comprehensive tracking audit tool that captures:
 * - All console events (log, info, warn, error, debug)
 * - DataLayer pushes
 * - Network requests (GA4, Facebook, TikTok, Floodlight, etc.)
 * - User interactions (clicks, pageviews)
 * - Tag initiators (GTM, hardcoded, custom pixel)
 * 
 * Opens a persistent debugger window with:
 * - Timeline tab (chronological events)
 * - Tag Map tab (summary by tag type)
 * - Network tab (tracking requests)
 * - Variables tab (dataLayer state)
 * - Journey tab (user path)
 * 
 * Auto-exports to Google Sheets for documentation.
 * 
 * INSTALLATION:
 * 1. Open Chrome DevTools (F12)
 * 2. Go to Sources tab → Snippets
 * 3. Create new snippet "TagMapperDebugger"
 * 4. Paste this code
 * 5. Run ONCE - opens debugger window and auto-starts
 * 
 * @version 2.0.0
 */

(function() {
  'use strict';
  
  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  
  const CONFIG = {
    WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbwgFT5ZPaVarEkeSkh-yozj4wmlx5kzmBncxnu5_Aj9ghF2cgCOr3aTxIIbHlVAndLpLA/exec",
    SITE_NAME: window.location.hostname.replace('www.', '').split('.')[0],
    DEBUGGER_WINDOW_NAME: 'PixelInspectorDebugger',
    STORAGE_KEY: 'tagMapperPersistent',
    DEBUGGER_STORAGE_KEY: 'tagMapperEvents',
    MAX_EVENTS: 2000,
    AUTO_EXPORT_THRESHOLD: 100, // Export every 100 events
    DEBUG_MODE: true
  };
  
  // Tracking domains to monitor
  const TRACKING_DOMAINS = {
    'google-analytics.com': 'GA4/Universal Analytics',
    'googletagmanager.com': 'GTM',
    'googleadservices.com': 'Google Ads',
    'doubleclick.net': 'Floodlight/DV360',
    'fls.doubleclick.net': 'Floodlight',
    'facebook.com': 'Facebook Pixel',
    'connect.facebook.net': 'Facebook SDK',
    'analytics.tiktok.com': 'TikTok Pixel',
    'tr.snapchat.com': 'Snapchat Pixel',
    'ct.pinterest.com': 'Pinterest Tag',
    'bat.bing.com': 'Microsoft Ads',
    'analytics.twitter.com': 'Twitter Pixel',
    't.co': 'Twitter',
    'linkedin.com': 'LinkedIn Insight'
  };
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  const State = {
    events: [],
    networkRequests: [],
    dataLayerState: {},
    debuggerWindow: null,
    originalConsole: {},
    originalFetch: null,
    originalXHR: null,
    originalDataLayerPush: null,
    isInitialized: false,
    isRunning: false,
    stats: {
      totalEvents: 0,
      networkRequests: 0,
      consoleEvents: 0,
      dataLayerPushes: 0,
      clicks: 0,
      pageviews: 0,
      exported: 0,
      startTime: new Date()
    },
    gtmContainers: new Set(),
    ga4Properties: new Set(),
    tags: new Map(), // Tag type -> count
    journey: []
  };
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  function log(...args) {
    if (CONFIG.DEBUG_MODE && State.originalConsole.log) {
      State.originalConsole.log.apply(console, ['[Tag Mapper]', ...args]);
    }
  }
  
  function logError(...args) {
    if (State.originalConsole.error) {
      State.originalConsole.error.apply(console, ['[Tag Mapper ERROR]', ...args]);
    }
  }
  
  function generateId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  function detectTagType(url) {
    for (const [domain, tagType] of Object.entries(TRACKING_DOMAINS)) {
      if (url.includes(domain)) {
        return tagType;
      }
    }
    return 'Unknown Tag';
  }
  
  function extractTagId(url) {
    // Extract GTM container
    const gtmMatch = url.match(/GTM-[A-Z0-9]+/);
    if (gtmMatch) return gtmMatch[0];
    
    // Extract GA4 property
    const ga4Match = url.match(/G-[A-Z0-9]+/);
    if (ga4Match) return ga4Match[0];
    
    // Extract UA property
    const uaMatch = url.match(/UA-\d+-\d+/);
    if (uaMatch) return uaMatch[0];
    
    // Extract Floodlight activity
    const flMatch = url.match(/DC-\d+/);
    if (flMatch) return flMatch[0];
    
    // Extract Facebook Pixel ID
    const fbMatch = url.match(/id=(\d+)/);
    if (fbMatch) return `FB-${fbMatch[1]}`;
    
    return null;
  }
  
  function parseQueryString(url) {
    try {
      const urlObj = new URL(url);
      const params = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    } catch (e) {
      return {};
    }
  }
  
  function detectInitiator() {
    const stack = new Error().stack;
    
    if (stack.includes('gtm.js')) return 'GTM Container';
    if (stack.includes('gtag')) return 'gtag.js (Hardcoded)';
    if (stack.includes('custom_pixel')) return 'Shopify Custom Pixel';
    if (stack.includes('fbevents')) return 'Facebook SDK';
    if (stack.includes('analytics')) return 'Analytics Library';
    
    return 'Unknown';
  }
  
  // ============================================================================
  // EVENT CAPTURING
  // ============================================================================
  
  function captureEvent(eventData) {
    try {
      const event = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        timestampMs: Date.now(),
        ...eventData,
        page_url: window.location.href,
        page_path: window.location.pathname,
        page_title: document.title
      };
      
      State.events.push(event);
      State.stats.totalEvents++;
      
      // Update stats
      if (event.category) {
        State.stats[`${event.category}s`] = (State.stats[`${event.category}s`] || 0) + 1;
      }
      
      // Track tags
      if (event.tagType) {
        State.tags.set(event.tagType, (State.tags.get(event.tagType) || 0) + 1);
      }
      
      // Trim old events
      if (State.events.length > CONFIG.MAX_EVENTS) {
        State.events = State.events.slice(-CONFIG.MAX_EVENTS);
      }
      
      // Send to debugger window
      sendToDebugger('newEvent', event);
      
      // Auto-export check
      if (State.stats.totalEvents % CONFIG.AUTO_EXPORT_THRESHOLD === 0) {
        autoExport();
      }
      
      log('Event captured:', event.eventName || event.type, event);
    } catch (error) {
      logError('Error capturing event:', error);
    }
  }
  
  // ============================================================================
  // CONSOLE INTERCEPTION
  // ============================================================================
  
  function interceptConsole() {
    ['log', 'info', 'warn', 'error', 'debug'].forEach(method => {
      State.originalConsole[method] = console[method];
      
      console[method] = function(...args) {
        // Call original
        State.originalConsole[method].apply(console, args);
        
        // Check for event objects
        args.forEach(arg => {
          if (typeof arg === 'object' && arg !== null && !arg instanceof Error) {
            if (isEventObject(arg)) {
              captureEvent({
                type: 'console',
                category: 'consoleEvent',
                consoleMethod: method,
                eventName: arg.event || arg.event_name || 'console_log',
                eventData: JSON.parse(JSON.stringify(arg)),
                source: 'console.' + method,
                initiator: detectInitiator(),
                color: method === 'error' ? 'red' : method === 'warn' ? 'orange' : 'green'
              });
            }
          }
        });
      };
    });
    
    log('Console methods intercepted');
  }
  
  function isEventObject(obj) {
    return 'event' in obj || 
           'event_name' in obj || 
           'event_source' in obj || 
           'ecommerce' in obj ||
           'gtm' in obj;
  }
  
  // ============================================================================
  // DATALAYER INTERCEPTION
  // ============================================================================
  
  function interceptDataLayer() {
    if (typeof window.dataLayer !== 'undefined') {
      State.originalDataLayerPush = window.dataLayer.push;
      
      window.dataLayer.push = function(...args) {
        const result = State.originalDataLayerPush.apply(window.dataLayer, args);
        
        args.forEach(arg => {
          if (typeof arg === 'object' && arg !== null) {
            // Update dataLayer state
            Object.assign(State.dataLayerState, arg);
            
            // Capture event
            captureEvent({
              type: 'dataLayer',
              category: 'dataLayerPush',
              eventName: arg.event || 'dataLayer.push',
              eventData: JSON.parse(JSON.stringify(arg)),
              source: 'dataLayer.push',
              initiator: detectInitiator(),
              color: 'blue'
            });
          }
        });
        
        return result;
      };
      
      // Capture initial dataLayer
      if (window.dataLayer && window.dataLayer.length > 0) {
        window.dataLayer.forEach((item, index) => {
          if (typeof item === 'object') {
            Object.assign(State.dataLayerState, item);
          }
        });
      }
      
      log('dataLayer intercepted');
    }
  }
  
  // ============================================================================
  // NETWORK INTERCEPTION
  // ============================================================================
  
  function interceptFetch() {
    State.originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const options = args[1] || {};
      
      // Check if tracking request
      const tagType = detectTagType(url);
      if (tagType !== 'Unknown Tag') {
        const tagId = extractTagId(url);
        const params = parseQueryString(url);
        
        captureEvent({
          type: 'network',
          category: 'networkRequest',
          eventName: 'fetch_request',
          requestUrl: url,
          requestMethod: options.method || 'GET',
          requestBody: options.body,
          tagType: tagType,
          tagId: tagId,
          parameters: params,
          source: 'fetch()',
          initiator: detectInitiator(),
          color: 'purple'
        });
        
        State.networkRequests.push({
          url,
          tagType,
          tagId,
          timestamp: new Date().toISOString()
        });
        
        State.stats.networkRequests++;
        
        // Track container/property IDs
        if (tagId) {
          if (tagId.startsWith('GTM-')) State.gtmContainers.add(tagId);
          if (tagId.startsWith('G-')) State.ga4Properties.add(tagId);
        }
      }
      
      return State.originalFetch.apply(window, args);
    };
    
    log('fetch() intercepted');
  }
  
  function interceptXHR() {
    State.originalXHR = window.XMLHttpRequest;
    
    window.XMLHttpRequest = function() {
      const xhr = new State.originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      let method, url;
      
      xhr.open = function(m, u, ...rest) {
        method = m;
        url = u;
        return originalOpen.apply(xhr, [m, u, ...rest]);
      };
      
      xhr.send = function(body) {
        // Check if tracking request
        const tagType = detectTagType(url);
        if (tagType !== 'Unknown Tag') {
          const tagId = extractTagId(url);
          const params = parseQueryString(url);
          
          captureEvent({
            type: 'network',
            category: 'networkRequest',
            eventName: 'xhr_request',
            requestUrl: url,
            requestMethod: method,
            requestBody: body,
            tagType: tagType,
            tagId: tagId,
            parameters: params,
            source: 'XMLHttpRequest',
            initiator: detectInitiator(),
            color: 'purple'
          });
          
          State.networkRequests.push({
            url,
            tagType,
            tagId,
            timestamp: new Date().toISOString()
          });
          
          State.stats.networkRequests++;
          
          // Track container/property IDs
          if (tagId) {
            if (tagId.startsWith('GTM-')) State.gtmContainers.add(tagId);
            if (tagId.startsWith('G-')) State.ga4Properties.add(tagId);
          }
        }
        
        return originalSend.apply(xhr, [body]);
      };
      
      return xhr;
    };
    
    log('XMLHttpRequest intercepted');
  }
  
  // ============================================================================
  // USER INTERACTION TRACKING
  // ============================================================================
  
  function attachClickListener() {
    document.addEventListener('click', function(e) {
      try {
        const element = e.target;
        const tagName = element.tagName ? element.tagName.toLowerCase() : '';
        
        if (tagName === 'a' || tagName === 'button' || element.onclick) {
          const clickText = (element.innerText || element.textContent || '').trim().substring(0, 200);
          const clickUrl = element.href || element.getAttribute('data-href') || null;
          
          captureEvent({
            type: 'interaction',
            category: 'click',
            eventName: 'click',
            eventData: {
              click_text: clickText,
              click_url: clickUrl,
              click_id: element.id || null,
              click_class: element.className || null,
              click_tag: tagName
            },
            source: 'DOM click listener',
            initiator: 'User Interaction',
            color: 'teal'
          });
          
          State.stats.clicks++;
        }
      } catch (error) {
        logError('Error in click listener:', error);
      }
    }, true);
    
    log('Click listener attached');
  }
  
  function capturePageView() {
    captureEvent({
      type: 'pageview',
      category: 'pageview',
      eventName: 'page_view',
      eventData: {
        page_url: window.location.href,
        page_path: window.location.pathname,
        page_title: document.title,
        referrer: document.referrer || null
      },
      source: 'Tag Mapper',
      initiator: 'Navigation',
      color: 'indigo'
    });
    
    State.stats.pageviews++;
    
    // Add to journey
    State.journey.push({
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    });
  }
  
  // ============================================================================
  // DEBUGGER WINDOW
  // ============================================================================
  
  function openDebuggerWindow() {
    const windowFeatures = 'width=1000,height=700,left=100,top=100,resizable=yes,scrollbars=yes';
    
    State.debuggerWindow = window.open('', CONFIG.DEBUGGER_WINDOW_NAME, windowFeatures);
    
    if (!State.debuggerWindow) {
      alert('Popup blocked! Please allow popups for this site.');
      return;
    }
    
    // Check if window already has content (reused window)
    if (!State.debuggerWindow.document.getElementById('tagMapperApp')) {
      renderDebuggerHTML();
    }
    
    // Focus window
    State.debuggerWindow.focus();
    
    log('Debugger window opened');
  }
  
  function renderDebuggerHTML() {
    const doc = State.debuggerWindow.document;
    doc.open();
    doc.write(getDebuggerHTML());
    doc.close();
    
    // Inject initial data
    setTimeout(() => {
      sendToDebugger('init', {
        config: CONFIG,
        stats: State.stats,
        gtmContainers: Array.from(State.gtmContainers),
        ga4Properties: Array.from(State.ga4Properties),
        tags: Object.fromEntries(State.tags),
        events: State.events,
        journey: State.journey
      });
    }, 500);
  }
  
  function sendToDebugger(action, data) {
    if (State.debuggerWindow && !State.debuggerWindow.closed) {
      try {
        State.debuggerWindow.postMessage({
          source: 'tagMapper',
          action,
          data
        }, '*');
      } catch (error) {
        logError('Error sending to debugger:', error);
      }
    }
  }
  
  // ============================================================================
  // EXPORT TO GOOGLE SHEETS
  // ============================================================================
  
  async function autoExport() {
    if (!CONFIG.WEBHOOK_URL) return;
    
    log(`Auto-exporting ${State.events.length} events...`);
    
    try {
      const exportData = State.events.map(event => ({
        timestamp: event.timestamp,
        event_trigger: event.eventName,
        tag_type: event.tagType || event.type,
        tag_id: event.tagId || '',
        page_url: event.page_url,
        page_title: event.page_title,
        event_data: JSON.stringify(event.eventData || {}),
        source: event.source,
        initiator: event.initiator,
        request_url: event.requestUrl || '',
        parameters: JSON.stringify(event.parameters || {})
      }));
      
      const response = await fetch(CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: exportData,
          metadata: {
            site_name: CONFIG.SITE_NAME,
            export_time: new Date().toISOString(),
            total_events: State.stats.totalEvents,
            gtm_containers: Array.from(State.gtmContainers),
            ga4_properties: Array.from(State.ga4Properties),
            journey: State.journey
          }
        })
      });
      
      if (response.ok) {
        State.stats.exported += exportData.length;
        log(`✓ Exported ${exportData.length} events`);
        sendToDebugger('exportSuccess', { count: exportData.length });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      logError('Export failed:', error);
      sendToDebugger('exportError', { error: error.message });
    }
  }
  
  // ============================================================================
  // DEBUGGER HTML
  // ============================================================================
  
  function getDebuggerHTML() {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tag Mapper Debugger - ${CONFIG.SITE_NAME}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      background: #f5f5f5;
      color: #333;
    }
    
    #tagMapperApp {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    
    .header h1 {
      font-size: 18px;
      font-weight: 600;
    }
    
    .header-stats {
      display: flex;
      gap: 20px;
      font-size: 12px;
    }
    
    .stat {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .stat-value {
      font-weight: 700;
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 10px;
    }
    
    .tabs {
      display: flex;
      background: white;
      border-bottom: 2px solid #e0e0e0;
      padding: 0 20px;
    }
    
    .tab {
      padding: 12px 20px;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .tab:hover {
      background: #f8f8f8;
    }
    
    .tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }
    
    .content {
      flex: 1;
      overflow: auto;
      padding: 20px;
    }
    
    .tab-panel {
      display: none;
    }
    
    .tab-panel.active {
      display: block;
    }
    
    .event {
      background: white;
      margin-bottom: 8px;
      border-radius: 6px;
      border-left: 4px solid #ccc;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .event-header {
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }
    
    .event-header:hover {
      background: #fafafa;
    }
    
    .event-name {
      font-weight: 600;
      font-size: 14px;
    }
    
    .event-meta {
      font-size: 11px;
      color: #666;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    
    .badge {
      background: #e0e0e0;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
    }
    
    .event-details {
      display: none;
      padding: 16px;
      border-top: 1px solid #f0f0f0;
      background: #fafafa;
    }
    
    .event.expanded .event-details {
      display: block;
    }
    
    .event-blue { border-left-color: #2196F3; }
    .event-green { border-left-color: #4CAF50; }
    .event-purple { border-left-color: #9C27B0; }
    .event-orange { border-left-color: #FF9800; }
    .event-red { border-left-color: #f44336; }
    .event-teal { border-left-color: #009688; }
    .event-indigo { border-left-color: #3F51B5; }
    
    .data-tree {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .controls {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: #667eea;
      color: white;
    }
    
    .btn-primary:hover {
      background: #5568d3;
    }
    
    .btn-secondary {
      background: #e0e0e0;
      color: #333;
    }
    
    .btn-secondary:hover {
      background: #d0d0d0;
    }
    
    .search {
      flex: 1;
      min-width: 200px;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .stat-card {
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .stat-card-title {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .stat-card-value {
      font-size: 28px;
      font-weight: 700;
      color: #667eea;
    }
    
    .tag-list {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .tag-item {
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .tag-item:last-child {
      border-bottom: none;
    }
    
    .tag-name {
      font-weight: 500;
    }
    
    .tag-count {
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .journey-item {
      background: white;
      padding: 16px;
      margin-bottom: 8px;
      border-radius: 6px;
      border-left: 4px solid #667eea;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .journey-url {
      font-weight: 600;
      color: #667eea;
      margin-bottom: 4px;
    }
    
    .journey-title {
      color: #666;
      font-size: 12px;
    }
    
    .journey-time {
      color: #999;
      font-size: 11px;
      margin-top: 4px;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }
    
    .empty-state svg {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div id="tagMapperApp">
    <div class="header">
      <div>
        <h1>🔍 Tag Mapper Debugger - <span id="siteName">${CONFIG.SITE_NAME}</span></h1>
      </div>
      <div class="header-stats">
        <div class="stat">
          <span>Events:</span>
          <span class="stat-value" id="totalEvents">0</span>
        </div>
        <div class="stat">
          <span>Network:</span>
          <span class="stat-value" id="networkCount">0</span>
        </div>
        <div class="stat">
          <span>Exported:</span>
          <span class="stat-value" id="exportedCount">0</span>
        </div>
      </div>
    </div>
    
    <div class="tabs">
      <div class="tab active" data-tab="timeline">📊 Timeline</div>
      <div class="tab" data-tab="tagmap">🏷️ Tag Map</div>
      <div class="tab" data-tab="network">🌐 Network</div>
      <div class="tab" data-tab="variables">📋 Variables</div>
      <div class="tab" data-tab="journey">🗺️ Journey</div>
    </div>
    
    <div class="content">
      <!-- Timeline Tab -->
      <div class="tab-panel active" id="timeline">
        <div class="controls">
          <input type="text" class="search" id="searchEvents" placeholder="Search events...">
          <button class="btn btn-secondary" onclick="clearEvents()">Clear</button>
          <button class="btn btn-primary" onclick="exportNow()">Export Now</button>
        </div>
        <div id="eventsList"></div>
      </div>
      
      <!-- Tag Map Tab -->
      <div class="tab-panel" id="tagmap">
        <div class="stats-grid" id="statsGrid"></div>
        <h3 style="margin: 20px 0 12px; font-size: 16px;">Tags Detected</h3>
        <div class="tag-list" id="tagList"></div>
      </div>
      
      <!-- Network Tab -->
      <div class="tab-panel" id="network">
        <div class="controls">
          <input type="text" class="search" id="searchNetwork" placeholder="Search network requests...">
        </div>
        <div id="networkList"></div>
      </div>
      
      <!-- Variables Tab -->
      <div class="tab-panel" id="variables">
        <h3 style="margin-bottom: 16px; font-size: 16px;">Current DataLayer State</h3>
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <pre class="data-tree" id="dataLayerState">{}</pre>
        </div>
      </div>
      
      <!-- Journey Tab -->
      <div class="tab-panel" id="journey">
        <h3 style="margin-bottom: 16px; font-size: 16px;">User Journey</h3>
        <div id="journeyList"></div>
      </div>
    </div>
  </div>
  
  <script>
    let state = {
      events: [],
      stats: {},
      tags: {},
      journey: [],
      dataLayerState: {}
    };
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });
    
    // Event toggle
    function toggleEvent(id) {
      const event = document.querySelector(\`[data-event-id="\${id}"]\`);
      if (event) {
        event.classList.toggle('expanded');
      }
    }
    
    // Clear events
    function clearEvents() {
      if (confirm('Clear all events?')) {
        state.events = [];
        renderTimeline();
      }
    }
    
    // Export now
    function exportNow() {
      window.opener.postMessage({ source: 'debugger', action: 'exportNow' }, '*');
    }
    
    // Render timeline
    function renderTimeline() {
      const container = document.getElementById('eventsList');
      const search = document.getElementById('searchEvents').value.toLowerCase();
      
      const filtered = state.events.filter(e => {
        if (!search) return true;
        const str = JSON.stringify(e).toLowerCase();
        return str.includes(search);
      });
      
      if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><div>No events captured yet</div></div>';
        return;
      }
      
      container.innerHTML = filtered.slice(-100).reverse().map(event => \`
        <div class="event event-\${event.color || 'gray'}" data-event-id="\${event.id}" onclick="toggleEvent('\${event.id}')">
          <div class="event-header">
            <div>
              <div class="event-name">\${event.eventName || event.type}</div>
            </div>
            <div class="event-meta">
              <span class="badge">\${event.source}</span>
              <span class="badge">\${event.initiator}</span>
              <span>\${new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
          <div class="event-details">
            <div class="data-tree">\${JSON.stringify(event, null, 2)}</div>
          </div>
        </div>
      \`).join('');
    }
    
    // Render tag map
    function renderTagMap() {
      const statsGrid = document.getElementById('statsGrid');
      statsGrid.innerHTML = \`
        <div class="stat-card">
          <div class="stat-card-title">Total Events</div>
          <div class="stat-card-value">\${state.stats.totalEvents || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Network Requests</div>
          <div class="stat-card-value">\${state.stats.networkRequests || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Clicks</div>
          <div class="stat-card-value">\${state.stats.clicks || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Pageviews</div>
          <div class="stat-card-value">\${state.stats.pageviews || 0}</div>
        </div>
      \`;
      
      const tagList = document.getElementById('tagList');
      const tags = Object.entries(state.tags).sort((a, b) => b[1] - a[1]);
      
      if (tags.length === 0) {
        tagList.innerHTML = '<div class="empty-state">No tags detected yet</div>';
        return;
      }
      
      tagList.innerHTML = tags.map(([tag, count]) => \`
        <div class="tag-item">
          <div class="tag-name">\${tag}</div>
          <div class="tag-count">\${count}</div>
        </div>
      \`).join('');
    }
    
    // Render network
    function renderNetwork() {
      const container = document.getElementById('networkList');
      const networkEvents = state.events.filter(e => e.type === 'network');
      
      if (networkEvents.length === 0) {
        container.innerHTML = '<div class="empty-state">No network requests captured yet</div>';
        return;
      }
      
      container.innerHTML = networkEvents.slice(-100).reverse().map(event => \`
        <div class="event event-purple" data-event-id="\${event.id}" onclick="toggleEvent('\${event.id}')">
          <div class="event-header">
            <div>
              <div class="event-name">\${event.tagType} - \${event.tagId || 'Unknown ID'}</div>
            </div>
            <div class="event-meta">
              <span class="badge">\${event.requestMethod}</span>
              <span>\${new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
          <div class="event-details">
            <div class="data-tree">\${JSON.stringify(event, null, 2)}</div>
          </div>
        </div>
      \`).join('');
    }
    
    // Render journey
    function renderJourney() {
      const container = document.getElementById('journeyList');
      
      if (state.journey.length === 0) {
        container.innerHTML = '<div class="empty-state">No pages visited yet</div>';
        return;
      }
      
      container.innerHTML = state.journey.map((item, index) => \`
        <div class="journey-item">
          <div style="font-size: 11px; color: #999; margin-bottom: 8px;">Step \${index + 1}</div>
          <div class="journey-url">\${item.url}</div>
          <div class="journey-title">\${item.title}</div>
          <div class="journey-time">\${new Date(item.timestamp).toLocaleString()}</div>
        </div>
      \`).join('');
    }
    
    // Update header stats
    function updateHeaderStats() {
      document.getElementById('totalEvents').textContent = state.stats.totalEvents || 0;
      document.getElementById('networkCount').textContent = state.stats.networkRequests || 0;
      document.getElementById('exportedCount').textContent = state.stats.exported || 0;
    }
    
    // Listen for messages from parent
    window.addEventListener('message', (event) => {
      if (event.data.source !== 'tagMapper') return;
      
      const { action, data } = event.data;
      
      if (action === 'init') {
        state.stats = data.stats;
        state.tags = data.tags;
        state.events = data.events;
        state.journey = data.journey;
        updateHeaderStats();
        renderTimeline();
        renderTagMap();
        renderNetwork();
        renderJourney();
      }
      
      if (action === 'newEvent') {
        state.events.push(data);
        state.stats.totalEvents++;
        
        // Update tag count
        if (data.tagType) {
          state.tags[data.tagType] = (state.tags[data.tagType] || 0) + 1;
        }
        
        updateHeaderStats();
        
        // Auto-refresh current tab
        const activeTab = document.querySelector('.tab.active').dataset.tab;
        if (activeTab === 'timeline') renderTimeline();
        if (activeTab === 'tagmap') renderTagMap();
        if (activeTab === 'network') renderNetwork();
      }
      
      if (action === 'updateStats') {
        state.stats = data;
        updateHeaderStats();
      }
      
      if (action === 'updateJourney') {
        state.journey = data;
        renderJourney();
      }
      
      if (action === 'exportSuccess') {
        alert(\`Successfully exported \${data.count} events to Google Sheets!\`);
      }
      
      if (action === 'exportError') {
        alert(\`Export failed: \${data.error}\`);
      }
    });
    
    // Search handlers
    document.getElementById('searchEvents').addEventListener('input', renderTimeline);
    document.getElementById('searchNetwork').addEventListener('input', renderNetwork);
    
    // Initial render
    renderTimeline();
  </script>
</body>
</html>`;
  }
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  function init() {
    if (State.isInitialized) {
      log('Already initialized');
      return;
    }
    
    log('Initializing Tag Mapper Debugger...');
    
    // Save original methods
    State.originalConsole.log = console.log;
    
    // Enable persistent mode
    localStorage.setItem(CONFIG.STORAGE_KEY, 'true');
    
    // Intercept everything
    interceptConsole();
    interceptDataLayer();
    interceptFetch();
    interceptXHR();
    attachClickListener();
    
    // Capture initial pageview
    capturePageView();
    
    // Open debugger window
    openDebuggerWindow();
    
    // Flush on unload
    window.addEventListener('beforeunload', () => {
      autoExport();
    });
    
    State.isInitialized = true;
    State.isRunning = true;
    
    console.log('%c[Tag Mapper] ✓ Initialized successfully!', 
                'color: green; font-weight: bold; font-size: 14px;');
    console.log('%c🔍 Debugger window opened. Capturing all tags, pixels, and events...', 
                'color: blue; font-weight: bold;');
    console.log('%cCommands:', 'font-weight: bold;');
    console.log('  TagMapper.export() - Export to Google Sheets now');
    console.log('  TagMapper.stats() - View statistics');
    console.log('  TagMapper.stop() - Stop capturing');
  }
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  window.TagMapper = {
    init: init,
    stop: function() {
      State.isRunning = false;
      log('Tag Mapper stopped');
    },
    export: autoExport,
    stats: function() {
      console.table(State.stats);
      return State.stats;
    },
    getEvents: () => State.events,
    getNetworkRequests: () => State.networkRequests,
    getJourney: () => State.journey,
    openDebugger: openDebuggerWindow,
    config: CONFIG,
    state: State
  };
  
  // Auto-initialize
  init();
  
})();
