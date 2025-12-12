/**
 * Background Service Worker
 * Manages cross-tab event tracking and debugger state
 */

let globalEvents = [];
let globalStats = {
  totalEvents: 0,
  networkRequests: 0,
  consoleEvents: 0,
  dataLayerPushes: 0,
  clicks: 0,
  pageviews: 0,
  exported: 0
};
let activeTabs = new Set();

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'newEvent') {
    // Store event globally
    globalEvents.push(message.event);
    globalStats.totalEvents++;
    
    // Keep only last 5000 events
    if (globalEvents.length > 5000) {
      globalEvents = globalEvents.slice(-5000);
    }
    
    // Track active tab
    if (sender.tab) {
      activeTabs.add(sender.tab.id);
    }
    
    // Broadcast to popup if open
    chrome.runtime.sendMessage({
      action: 'eventUpdate',
      event: message.event,
      stats: globalStats
    }).catch(() => {
      // Popup not open
    });
  }
  
  if (message.action === 'getGlobalState') {
    sendResponse({
      events: globalEvents,
      stats: globalStats,
      activeTabs: Array.from(activeTabs)
    });
    return true;
  }
  
  if (message.action === 'contentScriptReady') {
    console.log('Content script ready on:', message.url);
    sendResponse({ status: 'acknowledged' });
  }
  
  if (message.action === 'clearEvents') {
    globalEvents = [];
    globalStats = {
      totalEvents: 0,
      networkRequests: 0,
      consoleEvents: 0,
      dataLayerPushes: 0,
      clicks: 0,
      pageviews: 0,
      exported: 0
    };
    sendResponse({ status: 'cleared' });
  }
});

// Track tab closures
chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
});

// Log when extension starts
console.log('Tag Mapper Extension - Background service worker started');
