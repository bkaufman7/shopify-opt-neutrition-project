/**
 * Pixel Inspector - PERSISTENT VERSION
 * 
 * This version stays active across page navigations using localStorage
 * to automatically reinitialize on every page load.
 * 
 * INSTALLATION:
 * 1. Open Chrome DevTools (F12)
 * 2. Go to Sources tab → Snippets
 * 3. Create new snippet "PixelInspectorPersistent"
 * 4. Paste this code
 * 5. Run ONCE - it will auto-start on every page after that
 * 
 * USAGE:
 * - Run once to enable persistent mode
 * - Browse the site normally - it auto-captures on every page
 * - Type PixelInspector.stop(true) to disable persistent mode
 * - Type PixelInspector.stats() to see statistics
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const WEBHOOK_URL = "https://script.google.com/a/macros/horizonmedia.com/s/AKfycbwMhl7Dd9JUhWDJmsDjWOcX9Dd89MEUfd3Tn-yMg7lxqdodV8jkULvqlugvkSTHy58E/exec";
const SITE_NAME = "optimum-nutrition";

// ============================================================================
// PERSISTENT MODE SETUP
// ============================================================================

(function() {
  'use strict';
  
  const STORAGE_KEY = 'pixelInspectorPersistent';
  
  // Check if persistent mode is enabled
  const isPersistentMode = localStorage.getItem(STORAGE_KEY) === 'true';
  
  // Enable persistent mode
  function enablePersistentMode() {
    localStorage.setItem(STORAGE_KEY, 'true');
    console.log('%c[Pixel Inspector] ✓ Persistent mode ENABLED', 
                'color: green; font-weight: bold; font-size: 14px;');
    console.log('%cThe inspector will now auto-start on every page load!', 'color: green;');
    console.log('%cTo disable: PixelInspector.stop(true)', 'font-style: italic;');
  }
  
  // Disable persistent mode
  function disablePersistentMode() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('%c[Pixel Inspector] Persistent mode DISABLED', 
                'color: orange; font-weight: bold;');
    console.log('%cWill not auto-start on next page load', 'color: orange;');
  }
  
  // ============================================================================
  // MAIN INSPECTOR CODE
  // ============================================================================
  
  // Check if already running
  if (window.PixelInspector && window.PixelInspector.isRunning) {
    console.log('%c[Pixel Inspector] Already running. Use PixelInspector.stop() to stop first.', 
                'color: orange; font-weight: bold;');
    return;
  }
  
  console.log('%c[Pixel Inspector] Starting...', 'color: green; font-weight: bold;');
  
  if (isPersistentMode) {
    console.log('%c[Pixel Inspector] Auto-started (persistent mode active)', 
                'color: blue; font-style: italic;');
  }
  
  // Configuration
  const CONFIG = {
    WEBHOOK_URL: WEBHOOK_URL,
    SITE_NAME: SITE_NAME,
    DEBUG_MODE: true,
    BATCH_SIZE: 5, // Send more frequently for live viewing
    AUTO_SEND_INTERVAL: 3000, // 3 seconds for live updates
    MAX_RETRIES: 3,
    EVENT_FILTERS: {
      captureAll: true,
      eventNames: [],
      eventSources: []
    }
  };
  
  // State
  const State = {
    eventQueue: [],
    originalConsoleLog: console.log,
    originalDataLayerPush: null,
    isInitialized: false,
    isRunning: false,
    stats: {
      captured: 0,
      sent: 0,
      failed: 0,
      startTime: new Date()
    },
    sendTimer: null
  };
  
  // Utility: Debug logging
  function log(...args) {
    if (CONFIG.DEBUG_MODE) {
      State.originalConsoleLog.apply(console, [
        '%c[Pixel Inspector]',
        'color: blue; font-weight: bold;',
        ...args
      ]);
    }
  }
  
  // Utility: Error logging
  function logError(...args) {
    State.originalConsoleLog.apply(console, [
      '%c[Pixel Inspector ERROR]',
      'color: red; font-weight: bold;',
      ...args
    ]);
  }
  
  // Check if object is an event
  function isEventObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }
    
    return 'event' in obj || 
           'event_name' in obj || 
           'event_source' in obj || 
           'ecommerce' in obj || 
           'click_text' in obj ||
           'click_url' in obj;
  }
  
  // Normalize event to standard format
  function normalizeEvent(eventObj, source) {
    return {
      // Core event data
      event_name: eventObj.event || eventObj.event_name || 'unknown',
      event_source: eventObj.event_source || source || 'unknown',
      
      // Page context
      page_url: eventObj.page_url || window.location.href,
      page_path: eventObj.page_path || window.location.pathname,
      page_title: eventObj.page_title || document.title,
      page_referrer: eventObj.referrer || document.referrer || null,
      
      // Click data
      click_text: eventObj.click_text || eventObj.text || null,
      click_url: eventObj.click_url || eventObj.link_url || null,
      click_id: eventObj.click_id || eventObj.element_id || null,
      click_class: eventObj.click_class || null,
      click_target: eventObj.click_target || null,
      click_tag: eventObj.click_tag || null,
      
      // Ecommerce data
      ecommerce: eventObj.ecommerce || null,
      product_id: eventObj.product_id || null,
      product_name: eventObj.product_name || null,
      price: eventObj.price || null,
      quantity: eventObj.quantity || null,
      currency: eventObj.currency || 'USD',
      
      // Custom dimensions
      custom_data: eventObj.custom_data || null,
      
      // Metadata
      timestamp: new Date().toISOString(),
      site_name: CONFIG.SITE_NAME,
      user_agent: navigator.userAgent,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      
      // Full payload for debugging
      raw_payload: JSON.stringify(eventObj)
    };
  }
  
  // Capture event
  function captureEvent(eventObj, source) {
    try {
      const normalizedEvent = normalizeEvent(eventObj, source);
      
      // Apply filters
      if (!shouldCaptureEvent(normalizedEvent)) {
        log('Event filtered:', normalizedEvent.event_name);
        return;
      }
      
      State.eventQueue.push(normalizedEvent);
      State.stats.captured++;
      
      log(`Event captured [${State.stats.captured}]:`, normalizedEvent.event_name, normalizedEvent);
      
      // Auto-send if batch size reached
      if (State.eventQueue.length >= CONFIG.BATCH_SIZE) {
        sendEvents();
      }
    } catch (error) {
      logError('Error capturing event:', error);
    }
  }
  
  // Check if event should be captured
  function shouldCaptureEvent(event) {
    const filters = CONFIG.EVENT_FILTERS;
    
    if (filters.captureAll) {
      return true;
    }
    
    if (filters.eventNames.length > 0 && 
        !filters.eventNames.includes(event.event_name)) {
      return false;
    }
    
    if (filters.eventSources.length > 0 && 
        !filters.eventSources.includes(event.event_source)) {
      return false;
    }
    
    return true;
  }
  
  // Extract click data from DOM element
  function extractClickData(element, event) {
    const data = {
      click_text: null,
      click_url: null,
      click_id: null,
      click_class: null,
      click_target: null,
      click_tag: null,
      isRelevant: false
    };
    
    let currentElement = element;
    let depth = 0;
    const maxDepth = 5;
    
    while (currentElement && depth < maxDepth) {
      const tagName = currentElement.tagName ? currentElement.tagName.toLowerCase() : '';
      
      if (tagName === 'a' || 
          tagName === 'button' || 
          currentElement.hasAttribute('onclick') ||
          currentElement.hasAttribute('data-track')) {
        
        data.isRelevant = true;
        data.click_tag = tagName;
        data.click_text = (currentElement.innerText || currentElement.textContent || '').trim().substring(0, 200);
        data.click_url = currentElement.href || currentElement.getAttribute('data-href') || null;
        data.click_id = currentElement.id || null;
        data.click_class = currentElement.className || null;
        data.click_target = currentElement.target || null;
        break;
      }
      
      currentElement = currentElement.parentElement;
      depth++;
    }
    
    return data;
  }
  
  // Send events to webhook
  async function sendEvents(isFlush = false) {
    if (State.eventQueue.length === 0) {
      return;
    }
    
    const eventsToSend = [...State.eventQueue];
    State.eventQueue = [];
    
    log(`Sending ${eventsToSend.length} events...`);
    
    const payload = {
      events: eventsToSend,
      metadata: {
        site_name: CONFIG.SITE_NAME,
        sent_at: new Date().toISOString(),
        is_flush: isFlush,
        session_start: State.stats.startTime.toISOString(),
        user_agent: navigator.userAgent
      }
    };
    
    try {
      // Try sendBeacon for flush events
      if (isFlush && navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          CONFIG.WEBHOOK_URL,
          JSON.stringify(payload)
        );
        
        if (success) {
          State.stats.sent += eventsToSend.length;
          log(`✓ Sent ${eventsToSend.length} events via sendBeacon`);
          return;
        }
      }
      
      // Fallback to fetch
      const response = await fetch(CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: isFlush
      });
      
      if (response.ok) {
        State.stats.sent += eventsToSend.length;
        log(`✓ Sent ${eventsToSend.length} events via fetch`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      State.stats.failed += eventsToSend.length;
      logError(`✗ Failed to send ${eventsToSend.length} events:`, error);
      
      // Re-queue if not a flush
      if (!isFlush) {
        State.eventQueue.unshift(...eventsToSend);
      }
    }
  }
  
  // Intercept console.log
  function interceptConsoleLog() {
    console.log = function(...args) {
      // Call original
      State.originalConsoleLog.apply(console, args);
      
      // Check for event objects
      args.forEach(arg => {
        if (isEventObject(arg)) {
          captureEvent(arg, 'console');
        }
      });
    };
    
    log('console.log intercepted');
  }
  
  // Intercept dataLayer
  function interceptDataLayer() {
    if (typeof window.dataLayer !== 'undefined') {
      State.originalDataLayerPush = window.dataLayer.push;
      
      window.dataLayer.push = function(...args) {
        const result = State.originalDataLayerPush.apply(window.dataLayer, args);
        
        args.forEach(arg => {
          if (typeof arg === 'object' && arg !== null) {
            captureEvent(arg, 'datalayer');
          }
        });
        
        return result;
      };
      
      log('dataLayer.push intercepted');
    } else {
      log('No dataLayer found on this page');
    }
  }
  
  // Attach click listeners
  function attachClickListeners() {
    document.addEventListener('click', function(e) {
      try {
        const clickData = extractClickData(e.target, e);
        
        if (clickData.isRelevant) {
          captureEvent({
            event: 'click',
            event_source: 'dom_listener',
            ...clickData
          }, 'click');
        }
      } catch (error) {
        logError('Error in click listener:', error);
      }
    }, true);
    
    log('Click listeners attached');
  }
  
  // Capture initial pageview
  function capturePageView() {
    captureEvent({
      event: 'page_view',
      event_source: 'pixel_inspector',
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || null,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    }, 'pageview');
  }
  
  // Start auto-send timer
  function startAutoSendTimer() {
    if (State.sendTimer) {
      clearInterval(State.sendTimer);
    }
    
    State.sendTimer = setInterval(() => {
      if (State.eventQueue.length > 0) {
        sendEvents();
      }
    }, CONFIG.AUTO_SEND_INTERVAL);
    
    log('Auto-send timer started (3 second interval for live updates)');
  }
  
  // Initialize
  function init() {
    if (State.isInitialized) {
      log('Already initialized');
      return;
    }
    
    log('Initializing Pixel Inspector...');
    
    interceptConsoleLog();
    interceptDataLayer();
    attachClickListeners();
    capturePageView();
    startAutoSendTimer();
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => sendEvents(true));
    
    State.isInitialized = true;
    State.isRunning = true;
    
    console.log('%c[Pixel Inspector] ✓ Initialized successfully!', 
                'color: green; font-weight: bold; font-size: 14px;');
    console.log('%cCommands:', 'font-weight: bold;');
    console.log('  PixelInspector.stats() - View statistics');
    console.log('  PixelInspector.flush() - Send queued events now');
    console.log('  PixelInspector.stop(true) - Stop and disable persistent mode');
    console.log('  PixelInspector.config - View/edit configuration');
    
    if (!isPersistentMode) {
      console.log('%c\n👉 TIP: This is running in PERSISTENT mode - it will auto-start on every page!', 
                  'color: blue; font-weight: bold; background: #e3f2fd; padding: 8px;');
    }
  }
  
  // Stop
  function stop(disablePersistent = false) {
    log('Stopping Pixel Inspector...');
    
    sendEvents(true);
    
    if (State.sendTimer) {
      clearInterval(State.sendTimer);
    }
    
    if (State.originalConsoleLog) {
      console.log = State.originalConsoleLog;
    }
    
    if (State.originalDataLayerPush && window.dataLayer) {
      window.dataLayer.push = State.originalDataLayerPush;
    }
    
    State.isInitialized = false;
    State.isRunning = false;
    
    console.log('%c[Pixel Inspector] Stopped', 'color: red; font-weight: bold;');
    
    if (disablePersistent) {
      disablePersistentMode();
    }
  }
  
  // Get statistics
  function getStats() {
    const runtime = (new Date() - State.stats.startTime) / 1000;
    const stats = {
      ...State.stats,
      queued: State.eventQueue.length,
      site: CONFIG.SITE_NAME,
      initialized: State.isInitialized,
      running: State.isRunning,
      persistent_mode: isPersistentMode,
      runtime_seconds: Math.round(runtime),
      capture_rate: (State.stats.captured / runtime).toFixed(2) + ' events/sec'
    };
    
    console.table(stats);
    return stats;
  }
  
  // Public API
  window.PixelInspector = {
    init: init,
    stop: stop,
    flush: () => sendEvents(false),
    stats: getStats,
    sendEvent: (eventData) => captureEvent(eventData, 'manual'),
    enablePersistent: enablePersistentMode,
    disablePersistent: disablePersistentMode,
    config: CONFIG,
    state: State,
    isRunning: State.isRunning
  };
  
  // Auto-initialize
  init();
  
  // Enable persistent mode automatically
  if (!isPersistentMode) {
    enablePersistentMode();
  }
  
})();
