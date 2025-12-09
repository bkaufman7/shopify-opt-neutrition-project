/**
 * Pixel Inspector Configuration Helper
 * 
 * Run this in console to get an interactive configuration setup.
 * This helps you configure the Pixel Inspector without editing code directly.
 * 
 * USAGE:
 * 1. Copy this entire file
 * 2. Paste into browser console
 * 3. Follow the prompts
 * 4. Copy the generated configuration
 * 5. Update your devtoolsSnippet.js with the config
 */

(function() {
  console.log('%c=== Pixel Inspector Configuration Helper ===', 'color: blue; font-size: 16px; font-weight: bold;');
  console.log('This helper will guide you through configuration.\n');
  
  // Configuration object to build
  const config = {
    WEBHOOK_URL: '',
    SITE_NAME: '',
    DEBUG_MODE: true,
    BATCH_SIZE: 10,
    AUTO_SEND_INTERVAL: 5000,
    EVENT_FILTERS: {
      captureAll: true,
      eventNames: [],
      eventSources: []
    }
  };
  
  // Step 1: Webhook URL
  console.log('%c[Step 1/4] Webhook URL', 'color: green; font-weight: bold;');
  console.log('Your Google Apps Script webhook URL is required.');
  console.log('Format: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
  console.log('\nTo get your webhook URL:');
  console.log('1. Go to: https://script.google.com/');
  console.log('2. Open your Pixel Inspector project');
  console.log('3. Deploy → Manage deployments → Copy Web App URL');
  console.log('\nRun this command with your URL:');
  console.log('%cPixelConfigHelper.setWebhookURL("YOUR_URL_HERE")', 'background: #f0f0f0; padding: 5px;');
  
  // Step 2: Site Name
  console.log('\n%c[Step 2/4] Site Name', 'color: green; font-weight: bold;');
  console.log('Enter a unique identifier for this client/site.');
  console.log('Examples: "optimum-nutrition", "client-name", "project-abc"');
  console.log('\nRun this command:');
  console.log('%cPixelConfigHelper.setSiteName("optimum-nutrition")', 'background: #f0f0f0; padding: 5px;');
  
  // Step 3: Event Filters
  console.log('\n%c[Step 3/4] Event Filters (Optional)', 'color: green; font-weight: bold;');
  console.log('By default, ALL events are captured.');
  console.log('To filter specific events, run:');
  console.log('%cPixelConfigHelper.setEventFilter(["page_view", "add_to_cart", "purchase"])', 'background: #f0f0f0; padding: 5px;');
  console.log('Or keep capturing all events (recommended for initial testing)');
  
  // Step 4: Advanced Settings
  console.log('\n%c[Step 4/4] Advanced Settings (Optional)', 'color: green; font-weight: bold;');
  console.log('Default settings work for most cases:');
  console.log('  - BATCH_SIZE: 10 (send after 10 events)');
  console.log('  - AUTO_SEND_INTERVAL: 5000ms (send every 5 seconds)');
  console.log('  - DEBUG_MODE: true (show console logs)');
  console.log('\nTo change, run:');
  console.log('%cPixelConfigHelper.setAdvanced({ BATCH_SIZE: 5, AUTO_SEND_INTERVAL: 3000 })', 'background: #f0f0f0; padding: 5px;');
  
  // Public API
  window.PixelConfigHelper = {
    setWebhookURL: function(url) {
      if (!url || !url.startsWith('https://script.google.com')) {
        console.error('❌ Invalid URL. Must start with https://script.google.com');
        return;
      }
      config.WEBHOOK_URL = url;
      console.log('✅ Webhook URL set:', url);
      this.checkComplete();
    },
    
    setSiteName: function(name) {
      if (!name || name.length < 3) {
        console.error('❌ Site name must be at least 3 characters');
        return;
      }
      config.SITE_NAME = name;
      console.log('✅ Site name set:', name);
      this.checkComplete();
    },
    
    setEventFilter: function(eventNames) {
      if (!Array.isArray(eventNames)) {
        console.error('❌ Event filter must be an array');
        return;
      }
      config.EVENT_FILTERS.captureAll = false;
      config.EVENT_FILTERS.eventNames = eventNames;
      console.log('✅ Event filter set:', eventNames);
      this.checkComplete();
    },
    
    setCaptureAll: function() {
      config.EVENT_FILTERS.captureAll = true;
      config.EVENT_FILTERS.eventNames = [];
      console.log('✅ Capture all events enabled');
      this.checkComplete();
    },
    
    setAdvanced: function(settings) {
      if (settings.BATCH_SIZE) config.BATCH_SIZE = settings.BATCH_SIZE;
      if (settings.AUTO_SEND_INTERVAL) config.AUTO_SEND_INTERVAL = settings.AUTO_SEND_INTERVAL;
      if (settings.DEBUG_MODE !== undefined) config.DEBUG_MODE = settings.DEBUG_MODE;
      console.log('✅ Advanced settings updated');
      this.checkComplete();
    },
    
    checkComplete: function() {
      if (config.WEBHOOK_URL && config.SITE_NAME) {
        console.log('\n%c✅ Configuration Complete!', 'color: green; font-size: 14px; font-weight: bold;');
        console.log('Run this command to see your configuration:');
        console.log('%cPixelConfigHelper.showConfig()', 'background: #f0f0f0; padding: 5px;');
      }
    },
    
    showConfig: function() {
      console.log('\n%c=== Your Configuration ===', 'color: blue; font-size: 14px; font-weight: bold;');
      console.log(JSON.stringify(config, null, 2));
      
      console.log('\n%c=== Copy This Code ===', 'color: blue; font-size: 14px; font-weight: bold;');
      console.log('Update lines 24-25 in your devtoolsSnippet.js:\n');
      
      const codeSnippet = `const WEBHOOK_URL = "${config.WEBHOOK_URL}";
const SITE_NAME = "${config.SITE_NAME}";

// Optional: Update CONFIG object
const CONFIG = {
  WEBHOOK_URL: WEBHOOK_URL,
  SITE_NAME: SITE_NAME,
  DEBUG_MODE: ${config.DEBUG_MODE},
  BATCH_SIZE: ${config.BATCH_SIZE},
  AUTO_SEND_INTERVAL: ${config.AUTO_SEND_INTERVAL},
  EVENT_FILTERS: ${JSON.stringify(config.EVENT_FILTERS, null, 2).replace(/\n/g, '\n  ')}
};`;
      
      console.log('%c' + codeSnippet, 'background: #f0f0f0; padding: 10px; font-family: monospace;');
      
      console.log('\n%c=== Next Steps ===', 'color: green; font-weight: bold;');
      console.log('1. Copy the code above');
      console.log('2. Open: Sources → Snippets → PixelInspector');
      console.log('3. Find lines 24-35 and replace with copied code');
      console.log('4. Save (Ctrl+S)');
      console.log('5. Right-click → Run');
      
      return config;
    },
    
    getConfig: function() {
      return config;
    },
    
    reset: function() {
      config.WEBHOOK_URL = '';
      config.SITE_NAME = '';
      config.EVENT_FILTERS.captureAll = true;
      config.EVENT_FILTERS.eventNames = [];
      console.log('⚠️ Configuration reset');
    },
    
    // Quick setup for Optimum Nutrition
    setupOptimumNutrition: function(webhookURL) {
      if (!webhookURL) {
        console.error('❌ Please provide webhook URL');
        console.log('Usage: PixelConfigHelper.setupOptimumNutrition("YOUR_WEBHOOK_URL")');
        return;
      }
      
      this.setWebhookURL(webhookURL);
      this.setSiteName('optimum-nutrition');
      this.setCaptureAll();
      
      console.log('\n✅ Optimum Nutrition preset configured!');
      console.log('Run: PixelConfigHelper.showConfig()');
    }
  };
  
  console.log('\n%c=== Quick Commands ===', 'color: blue; font-weight: bold;');
  console.log('Full setup:');
  console.log('  PixelConfigHelper.setWebhookURL("YOUR_URL")');
  console.log('  PixelConfigHelper.setSiteName("optimum-nutrition")');
  console.log('  PixelConfigHelper.showConfig()');
  console.log('\nQuick Optimum Nutrition setup:');
  console.log('  PixelConfigHelper.setupOptimumNutrition("YOUR_WEBHOOK_URL")');
  console.log('  PixelConfigHelper.showConfig()');
  
})();
