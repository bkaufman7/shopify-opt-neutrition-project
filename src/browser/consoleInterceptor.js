/**
 * Shopify Custom Pixel Console Interceptor
 * 
 * Intercepts console.log events, dataLayer pushes, and custom pixel events
 * from Shopify storefronts where GTM is loaded inside an isolated iframe.
 * 
 * Sends all captured events to a Google Apps Script webhook for storage
 * and analysis in Google Sheets.
 * 
 * @version 1.0.0
 * @author Shopify Analytics Team
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const PIXEL_INSPECTOR_CONFIG = {
  // Google Apps Script webhook URL - MUST BE CONFIGURED BY USER
  WEBHOOK_URL: "<YOUR-APPS-SCRIPT-WEB-APP-URL>",
  
  // Site identifier for multi-client tracking
  SITE_NAME: "optimum-nutrition",
  
  // Enable debug logging to console
  DEBUG_MODE: true,
  
  // Batch size before auto-sending events
  BATCH_SIZE: 10,
  
  // Auto-send interval (ms)
  AUTO_SEND_INTERVAL: 5000,
  
  // Maximum retries for failed sends
  MAX_RETRIES: 3,
  
  // Event filters - only capture events matching these patterns
  EVENT_FILTERS: {
    captureAll: true, // Set to false to use specific filters
    eventNames: [
      'page_view',
      'custom_click_link_storefront',
      'add_to_cart',
      'begin_checkout',
      'purchase',
      'view_item',
      'scroll',
      'custom_pixel'
    ],
    eventSources: [
      'custom_pixel',
      'shopify',
      'gtm',
      'datalayer'
    ]
  }
};

// ============================================================================
// SITE CONFIGURATIONS
// ============================================================================

const SiteConfig = {
  "optimum-nutrition": {
    baseUrl: "https://www.optimumnutrition.com/",
    requiredEvents: [
      "page_view",
      "custom_click_link_storefront",
      "add_to_cart",
      "view_item"
    ],
    eventValidation: {
      page_view: ['page_url', 'page_title'],
      custom_click_link_storefront: ['click_text', 'click_url'],
      add_to_cart: ['product_id', 'product_name', 'price']
    }
  },
  // Add more client configurations here
  "client2": {
    baseUrl: "https://example.com/",
    requiredEvents: ["page_view", "purchase"],
    eventValidation: {}
  }
};

// ============================================================================
// GLOBAL STATE
// ============================================================================

const PixelInspector = {
  eventQueue: [],
  originalConsoleLog: null,
  originalDataLayerPush: null,
  isInitialized: false,
  stats: {
    captured: 0,
    sent: 0,
    failed: 0
  },
  sendTimer: null
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Initialize the Pixel Inspector
 */
function initializePixelInspector() {
  if (PixelInspector.isInitialized) {
    logDebug("Pixel Inspector already initialized");
    return;
  }

  logDebug("Initializing Pixel Inspector...");
  
  // Intercept console.log
  interceptConsoleLog();
  
  // Intercept dataLayer if it exists
  interceptDataLayer();
  
  // Start auto-send timer
  startAutoSendTimer();
  
  // Add event listeners for clicks
  attachClickListeners();
  
  // Listen for beforeunload to flush events
  window.addEventListener('beforeunload', flushEvents);
  
  PixelInspector.isInitialized = true;
  logDebug("Pixel Inspector initialized successfully");
  
  // Send initial pageview
  capturePageView();
}

/**
 * Intercept console.log to capture event objects
 */
function interceptConsoleLog() {
  PixelInspector.originalConsoleLog = console.log;
  
  console.log = function(...args) {
    // Call original console.log
    PixelInspector.originalConsoleLog.apply(console, args);
    
    // Check if any argument is an event object
    args.forEach(arg => {
      if (isEventObject(arg)) {
        captureEvent(arg, 'console');
      }
    });
  };
  
  logDebug("Console.log intercepted");
}

/**
 * Intercept dataLayer.push if dataLayer exists
 */
function interceptDataLayer() {
  // Check for GTM dataLayer
  if (typeof window.dataLayer !== 'undefined') {
    PixelInspector.originalDataLayerPush = window.dataLayer.push;
    
    window.dataLayer.push = function(...args) {
      // Call original push
      const result = PixelInspector.originalDataLayerPush.apply(window.dataLayer, args);
      
      // Capture each pushed object
      args.forEach(arg => {
        if (typeof arg === 'object' && arg !== null) {
          captureEvent(arg, 'datalayer');
        }
      });
      
      return result;
    };
    
    logDebug("dataLayer.push intercepted");
  }
  
  // Also check for custom dataLayer implementations
  if (typeof window.analytics !== 'undefined' && window.analytics.track) {
    const originalTrack = window.analytics.track;
    window.analytics.track = function(eventName, properties) {
      const result = originalTrack.apply(window.analytics, arguments);
      captureEvent({
        event: eventName,
        ...properties
      }, 'analytics');
      return result;
    };
  }
}

/**
 * Attach click listeners to capture CTA interactions
 */
function attachClickListeners() {
  document.addEventListener('click', function(e) {
    try {
      const element = e.target;
      const clickData = extractClickData(element, e);
      
      if (clickData.isRelevant) {
        captureEvent({
          event: 'click',
          event_source: 'dom_listener',
          ...clickData
        }, 'click');
      }
    } catch (error) {
      logDebug("Error in click listener:", error);
    }
  }, true); // Use capture phase
  
  logDebug("Click listeners attached");
}

/**
 * Extract relevant data from a click event
 * @param {HTMLElement} element - The clicked element
 * @param {Event} event - The click event
 * @returns {Object} Click metadata
 */
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
  
  // Traverse up to find an anchor or button
  let currentElement = element;
  let depth = 0;
  const maxDepth = 5;
  
  while (currentElement && depth < maxDepth) {
    const tagName = currentElement.tagName ? currentElement.tagName.toLowerCase() : '';
    
    // Check if it's a clickable element
    if (tagName === 'a' || tagName === 'button' || currentElement.hasAttribute('onclick')) {
      data.isRelevant = true;
      data.click_tag = tagName;
      data.click_text = currentElement.innerText?.trim() || currentElement.textContent?.trim() || '';
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

/**
 * Capture a page view event
 */
function capturePageView() {
  const pageViewEvent = {
    event: 'page_view',
    event_source: 'pixel_inspector',
    page_url: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
    referrer: document.referrer || null,
    timestamp: new Date().toISOString()
  };
  
  captureEvent(pageViewEvent, 'pageview');
}

/**
 * Check if an object is an event object
 * @param {*} obj - Object to check
 * @returns {boolean}
 */
function isEventObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  // Check for common event properties
  const hasEventName = 'event' in obj || 'event_name' in obj;
  const hasEventSource = 'event_source' in obj;
  const hasEcommerce = 'ecommerce' in obj;
  const hasClickData = 'click_text' in obj || 'click_url' in obj;
  
  return hasEventName || hasEventSource || hasEcommerce || hasClickData;
}

/**
 * Capture and normalize an event
 * @param {Object} eventObj - Raw event object
 * @param {string} source - Source of the event
 */
function captureEvent(eventObj, source) {
  try {
    const normalizedEvent = normalizeEvent(eventObj, source);
    
    // Apply filters
    if (!shouldCaptureEvent(normalizedEvent)) {
      logDebug("Event filtered out:", normalizedEvent.event_name);
      return;
    }
    
    // Add to queue
    PixelInspector.eventQueue.push(normalizedEvent);
    PixelInspector.stats.captured++;
    
    logDebug("Event captured:", normalizedEvent);
    
    // Check if we should send batch
    if (PixelInspector.eventQueue.length >= PIXEL_INSPECTOR_CONFIG.BATCH_SIZE) {
      sendEvents();
    }
  } catch (error) {
    logDebug("Error capturing event:", error);
  }
}

/**
 * Normalize event object to standard format
 * @param {Object} eventObj - Raw event object
 * @param {string} source - Event source
 * @returns {Object} Normalized event
 */
function normalizeEvent(eventObj, source) {
  const normalized = {
    // Core event data
    event_name: eventObj.event || eventObj.event_name || 'unknown',
    event_source: eventObj.event_source || source || 'unknown',
    
    // Page context
    page_url: eventObj.page_url || window.location.href,
    page_path: eventObj.page_path || window.location.pathname,
    page_title: eventObj.page_title || document.title,
    
    // Click data
    click_text: eventObj.click_text || eventObj.text || null,
    click_url: eventObj.click_url || eventObj.link_url || null,
    click_id: eventObj.click_id || eventObj.element_id || null,
    click_class: eventObj.click_class || null,
    click_target: eventObj.click_target || null,
    
    // Ecommerce data
    ecommerce: eventObj.ecommerce || null,
    product_id: eventObj.product_id || null,
    product_name: eventObj.product_name || null,
    price: eventObj.price || null,
    currency: eventObj.currency || 'USD',
    
    // Metadata
    timestamp: new Date().toISOString(),
    site_name: PIXEL_INSPECTOR_CONFIG.SITE_NAME,
    user_agent: navigator.userAgent,
    
    // Full payload for debugging
    raw_payload: JSON.stringify(eventObj)
  };
  
  return normalized;
}

/**
 * Check if event should be captured based on filters
 * @param {Object} event - Normalized event
 * @returns {boolean}
 */
function shouldCaptureEvent(event) {
  const filters = PIXEL_INSPECTOR_CONFIG.EVENT_FILTERS;
  
  if (filters.captureAll) {
    return true;
  }
  
  // Check event name filter
  if (filters.eventNames.length > 0) {
    if (!filters.eventNames.includes(event.event_name)) {
      return false;
    }
  }
  
  // Check event source filter
  if (filters.eventSources.length > 0) {
    if (!filters.eventSources.includes(event.event_source)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Send events to webhook
 * @param {boolean} isFlush - Whether this is a flush operation
 */
async function sendEvents(isFlush = false) {
  if (PixelInspector.eventQueue.length === 0) {
    return;
  }
  
  const eventsToSend = [...PixelInspector.eventQueue];
  PixelInspector.eventQueue = [];
  
  logDebug(`Sending ${eventsToSend.length} events to webhook...`);
  
  const payload = {
    events: eventsToSend,
    metadata: {
      site_name: PIXEL_INSPECTOR_CONFIG.SITE_NAME,
      sent_at: new Date().toISOString(),
      is_flush: isFlush,
      user_agent: navigator.userAgent
    }
  };
  
  try {
    // Try sendBeacon first (preferred for page unload)
    if (isFlush && navigator.sendBeacon) {
      const success = navigator.sendBeacon(
        PIXEL_INSPECTOR_CONFIG.WEBHOOK_URL,
        JSON.stringify(payload)
      );
      
      if (success) {
        PixelInspector.stats.sent += eventsToSend.length;
        logDebug("Events sent via sendBeacon");
        return;
      }
    }
    
    // Fallback to fetch
    const response = await fetch(PIXEL_INSPECTOR_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: isFlush // Keep connection alive for flush
    });
    
    if (response.ok) {
      PixelInspector.stats.sent += eventsToSend.length;
      logDebug("Events sent successfully via fetch");
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    PixelInspector.stats.failed += eventsToSend.length;
    logDebug("Failed to send events:", error);
    
    // Re-queue events if not a flush operation
    if (!isFlush) {
      PixelInspector.eventQueue.unshift(...eventsToSend);
    }
  }
}

/**
 * Flush all pending events
 */
function flushEvents() {
  logDebug("Flushing events...");
  sendEvents(true);
}

/**
 * Start auto-send timer
 */
function startAutoSendTimer() {
  if (PixelInspector.sendTimer) {
    clearInterval(PixelInspector.sendTimer);
  }
  
  PixelInspector.sendTimer = setInterval(() => {
    if (PixelInspector.eventQueue.length > 0) {
      sendEvents();
    }
  }, PIXEL_INSPECTOR_CONFIG.AUTO_SEND_INTERVAL);
  
  logDebug("Auto-send timer started");
}

/**
 * Debug logging
 * @param {...*} args - Arguments to log
 */
function logDebug(...args) {
  if (PIXEL_INSPECTOR_CONFIG.DEBUG_MODE) {
    PixelInspector.originalConsoleLog?.apply(console, ['[Pixel Inspector]', ...args]) ||
      console.log('[Pixel Inspector]', ...args);
  }
}

/**
 * Get current statistics
 * @returns {Object} Statistics object
 */
function getStats() {
  return {
    ...PixelInspector.stats,
    queued: PixelInspector.eventQueue.length,
    site: PIXEL_INSPECTOR_CONFIG.SITE_NAME,
    initialized: PixelInspector.isInitialized
  };
}

/**
 * Manually send an event
 * @param {Object} eventData - Event data to send
 */
function sendCustomEvent(eventData) {
  captureEvent(eventData, 'manual');
}

/**
 * Stop the inspector
 */
function stopPixelInspector() {
  if (!PixelInspector.isInitialized) {
    return;
  }
  
  // Flush remaining events
  flushEvents();
  
  // Clear timer
  if (PixelInspector.sendTimer) {
    clearInterval(PixelInspector.sendTimer);
  }
  
  // Restore original functions
  if (PixelInspector.originalConsoleLog) {
    console.log = PixelInspector.originalConsoleLog;
  }
  
  if (PixelInspector.originalDataLayerPush && window.dataLayer) {
    window.dataLayer.push = PixelInspector.originalDataLayerPush;
  }
  
  PixelInspector.isInitialized = false;
  logDebug("Pixel Inspector stopped");
}

// ============================================================================
// PUBLIC API
// ============================================================================

window.PixelInspector = {
  init: initializePixelInspector,
  stop: stopPixelInspector,
  flush: flushEvents,
  stats: getStats,
  sendEvent: sendCustomEvent,
  config: PIXEL_INSPECTOR_CONFIG
};

// ============================================================================
// AUTO-INITIALIZE
// ============================================================================

// Auto-initialize if not already running
if (!PixelInspector.isInitialized) {
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePixelInspector);
  } else {
    initializePixelInspector();
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.PixelInspector;
}
