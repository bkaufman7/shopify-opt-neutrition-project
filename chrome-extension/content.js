/**
 * Tag Mapper & Debugger - Content Script
 * Automatically injected on all pages to track tags across domains
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
    MAX_EVENTS: 2000,
    AUTO_EXPORT_THRESHOLD: 100,
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
    tags: new Map(),
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
    const gtmMatch = url.match(/GTM-[A-Z0-9]+/);
    if (gtmMatch) return gtmMatch[0];
    
    const ga4Match = url.match(/G-[A-Z0-9]+/);
    if (ga4Match) return ga4Match[0];
    
    const uaMatch = url.match(/UA-\d+-\d+/);
    if (uaMatch) return uaMatch[0];
    
    const flMatch = url.match(/DC-\d+/);
    if (flMatch) return flMatch[0];
    
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
      
      if (event.category) {
        State.stats[`${event.category}s`] = (State.stats[`${event.category}s`] || 0) + 1;
      }
      
      if (event.tagType) {
        State.tags.set(event.tagType, (State.tags.get(event.tagType) || 0) + 1);
      }
      
      if (State.events.length > CONFIG.MAX_EVENTS) {
        State.events = State.events.slice(-CONFIG.MAX_EVENTS);
      }
      
      sendToDebugger('newEvent', event);
      
      // Send to background script for cross-tab tracking
      chrome.runtime.sendMessage({
        action: 'newEvent',
        event: event
      });
      
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
        State.originalConsole[method].apply(console, args);
        
        args.forEach(arg => {
          if (typeof arg === 'object' && arg !== null && !(arg instanceof Error)) {
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
    // Intercept if dataLayer already exists
    if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
      State.originalDataLayerPush = window.dataLayer.push;
      
      window.dataLayer.push = function(...args) {
        const result = State.originalDataLayerPush.apply(window.dataLayer, args);
        
        args.forEach(arg => {
          if (typeof arg === 'object' && arg !== null) {
            Object.assign(State.dataLayerState, arg);
            
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
      
      // Capture existing items
      if (window.dataLayer.length > 0) {
        window.dataLayer.forEach((item) => {
          if (typeof item === 'object') {
            Object.assign(State.dataLayerState, item);
          }
        });
      }
      
      log('dataLayer intercepted (found existing)');
    } else {
      // Set up proxy to intercept when dataLayer is created
      let dataLayerValue = window.dataLayer;
      
      Object.defineProperty(window, 'dataLayer', {
        get() {
          return dataLayerValue;
        },
        set(newValue) {
          dataLayerValue = newValue;
          
          if (Array.isArray(newValue) && !State.originalDataLayerPush) {
            State.originalDataLayerPush = newValue.push;
            
            newValue.push = function(...args) {
              const result = State.originalDataLayerPush.apply(newValue, args);
              
              args.forEach(arg => {
                if (typeof arg === 'object' && arg !== null) {
                  Object.assign(State.dataLayerState, arg);
                  
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
            
            log('dataLayer intercepted (via proxy)');
          }
        },
        configurable: true
      });
      
      log('dataLayer proxy set up');
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
        
        // Capture clicks on links, buttons, or any clickable element
        if (tagName === 'a' || tagName === 'button' || element.onclick || 
            element.getAttribute('role') === 'button' || 
            element.style.cursor === 'pointer') {
          
          const clickText = (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim().substring(0, 200);
          const clickUrl = element.href || element.getAttribute('data-href') || element.getAttribute('href') || null;
          
          const clickEvent = {
            type: 'interaction',
            category: 'click',
            eventName: 'click',
            eventData: {
              click_text: clickText,
              click_url: clickUrl,
              click_id: element.id || null,
              click_class: element.className || null,
              click_tag: tagName,
              click_path: getElementPath(element)
            },
            source: 'DOM click listener',
            initiator: 'User Interaction',
            color: 'teal'
          };
          
          captureEvent(clickEvent);
          State.stats.clicks++;
          
          log('Click captured:', clickText || clickUrl || tagName);
        }
      } catch (error) {
        logError('Error in click listener:', error);
      }
    }, true);
    
    log('Click listener attached');
  }
  
  function getElementPath(element) {
    const path = [];
    let current = element;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += '#' + current.id;
        path.unshift(selector);
        break;
      } else if (current.className) {
        selector += '.' + current.className.split(' ').join('.');
      }
      path.unshift(selector);
      current = current.parentElement;
      if (path.length > 5) break; // Limit path length
    }
    return path.join(' > ');
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
      source: 'Tag Mapper Extension',
      initiator: 'Navigation',
      color: 'indigo'
    });
    
    State.stats.pageviews++;
    
    State.journey.push({
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    });
  }
  
  // ============================================================================
  // DEBUGGER WINDOW (Using Extension Popup instead)
  // ============================================================================
  
  function sendToDebugger(action, data) {
    // Send to extension popup via background script
    chrome.runtime.sendMessage({
      action: 'updateDebugger',
      debuggerAction: action,
      data: data
    }).catch(() => {
      // Popup not open, that's okay
    });
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
  // INITIALIZATION
  // ============================================================================
  
  function init() {
    if (State.isInitialized) {
      log('Already initialized on this page');
      return;
    }
    
    log('Initializing Tag Mapper Extension on:', window.location.href);
    
    // Save original methods FIRST before any interception
    State.originalConsole.log = console.log;
    State.originalConsole.error = console.error;
    
    // Intercept everything
    interceptConsole();
    interceptDataLayer();
    interceptFetch();
    interceptXHR();
    
    // Attach click listener immediately if DOM is ready
    if (document.readyState !== 'loading') {
      attachClickListener();
    } else {
      document.addEventListener('DOMContentLoaded', attachClickListener);
    }
    
    // Capture initial pageview
    capturePageView();
    
    // Flush on unload
    window.addEventListener('beforeunload', () => {
      autoExport();
    });
    
    State.isInitialized = true;
    State.isRunning = true;
    
    console.log('%c[Tag Mapper Extension] ✓ Active on this page!', 
                'color: green; font-weight: bold; font-size: 14px;');
    console.log('%c🔍 Tracking all tags, pixels, and events across domains...', 
                'color: blue; font-weight: bold;');
    console.log('%c   • Console events: ' + (State.originalConsole.log ? '✓' : '✗'), 'color: #666;');
    console.log('%c   • DataLayer: ' + (window.dataLayer ? '✓ detected' : '○ watching'), 'color: #666;');
    console.log('%c   • Network: ✓', 'color: #666;');
    console.log('%c   • Clicks: ' + (document.readyState !== 'loading' ? '✓' : '○ pending'), 'color: #666;');
    
    // Notify background script
    chrome.runtime.sendMessage({
      action: 'contentScriptReady',
      url: window.location.href
    }).catch(() => {
      // Background script not ready yet, that's okay
    });
  }
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  window.TagMapper = {
    export: autoExport,
    stats: function() {
      console.table(State.stats);
      return State.stats;
    },
    getEvents: () => State.events,
    getNetworkRequests: () => State.networkRequests,
    getJourney: () => State.journey,
    config: CONFIG,
    state: State
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
