/**
 * Pixel Inspector Bookmarklet
 * 
 * Minified version of the console interceptor for use as a browser bookmarklet.
 * 
 * INSTALLATION:
 * 1. Create a new bookmark in your browser
 * 2. Copy the code below (starting with javascript:)
 * 3. Paste it as the URL/Location of the bookmark
 * 4. Click the bookmark on any Shopify page to activate
 * 
 * USAGE:
 * - Click the bookmarklet to start capturing events
 * - Events will automatically send to the configured webhook
 * - Open DevTools console to see "[Pixel Inspector]" logs
 * - Run PixelInspector.stats() to see statistics
 * - Run PixelInspector.stop() to stop capturing
 */

// ============================================================================
// BOOKMARKLET CODE (COPY BELOW - SINGLE LINE)
// ============================================================================

javascript:(function(){const CONFIG={WEBHOOK_URL:"<YOUR-APPS-SCRIPT-WEB-APP-URL>",SITE_NAME:"optimum-nutrition",DEBUG_MODE:true,BATCH_SIZE:10,AUTO_SEND_INTERVAL:5000,EVENT_FILTERS:{captureAll:true}};const PI={eventQueue:[],originalConsoleLog:null,originalDataLayerPush:null,isInitialized:false,stats:{captured:0,sent:0,failed:0},sendTimer:null};function log(...args){if(CONFIG.DEBUG_MODE){(PI.originalConsoleLog||console.log).apply(console,['[PI]',...args])}}function isEventObj(obj){if(typeof obj!=='object'||obj===null)return false;return'event'in obj||'event_name'in obj||'event_source'in obj||'ecommerce'in obj||'click_text'in obj}function normalize(obj,src){return{event_name:obj.event||obj.event_name||'unknown',event_source:obj.event_source||src||'unknown',page_url:obj.page_url||location.href,page_path:obj.page_path||location.pathname,page_title:obj.page_title||document.title,click_text:obj.click_text||obj.text||null,click_url:obj.click_url||obj.link_url||null,click_id:obj.click_id||null,click_class:obj.click_class||null,ecommerce:obj.ecommerce||null,product_id:obj.product_id||null,product_name:obj.product_name||null,price:obj.price||null,currency:obj.currency||'USD',timestamp:new Date().toISOString(),site_name:CONFIG.SITE_NAME,raw_payload:JSON.stringify(obj)}}function capture(obj,src){try{const evt=normalize(obj,src);PI.eventQueue.push(evt);PI.stats.captured++;log('Captured:',evt.event_name);if(PI.eventQueue.length>=CONFIG.BATCH_SIZE){send()}}catch(e){log('Error:',e)}}async function send(flush=false){if(PI.eventQueue.length===0)return;const evts=[...PI.eventQueue];PI.eventQueue=[];log(`Sending ${evts.length} events`);const payload={events:evts,metadata:{site_name:CONFIG.SITE_NAME,sent_at:new Date().toISOString(),is_flush:flush}};try{if(flush&&navigator.sendBeacon){if(navigator.sendBeacon(CONFIG.WEBHOOK_URL,JSON.stringify(payload))){PI.stats.sent+=evts.length;log('Sent via beacon');return}}const resp=await fetch(CONFIG.WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:flush});if(resp.ok){PI.stats.sent+=evts.length;log('Sent via fetch')}else{throw new Error(`HTTP ${resp.status}`)}}catch(e){PI.stats.failed+=evts.length;log('Send failed:',e);if(!flush){PI.eventQueue.unshift(...evts)}}}function extractClick(el,ev){let data={click_text:null,click_url:null,click_id:null,click_class:null,isRelevant:false};let cur=el,depth=0;while(cur&&depth<5){const tag=cur.tagName?cur.tagName.toLowerCase():'';if(tag==='a'||tag==='button'||cur.hasAttribute('onclick')){data.isRelevant=true;data.click_text=cur.innerText?.trim()||cur.textContent?.trim()||'';data.click_url=cur.href||cur.getAttribute('data-href')||null;data.click_id=cur.id||null;data.click_class=cur.className||null;break}cur=cur.parentElement;depth++}return data}function init(){if(PI.isInitialized){log('Already initialized');return}log('Initializing...');PI.originalConsoleLog=console.log;console.log=function(...args){PI.originalConsoleLog.apply(console,args);args.forEach(arg=>{if(isEventObj(arg)){capture(arg,'console')}})};if(typeof window.dataLayer!=='undefined'){PI.originalDataLayerPush=window.dataLayer.push;window.dataLayer.push=function(...args){const res=PI.originalDataLayerPush.apply(window.dataLayer,args);args.forEach(arg=>{if(typeof arg==='object'&&arg!==null){capture(arg,'datalayer')}});return res}}document.addEventListener('click',function(e){try{const data=extractClick(e.target,e);if(data.isRelevant){capture({event:'click',event_source:'dom_listener',...data},'click')}}catch(err){log('Click error:',err)}},true);capture({event:'page_view',event_source:'pixel_inspector',page_url:location.href,page_path:location.pathname,page_title:document.title,referrer:document.referrer||null},'pageview');PI.sendTimer=setInterval(()=>{if(PI.eventQueue.length>0){send()}},CONFIG.AUTO_SEND_INTERVAL);window.addEventListener('beforeunload',()=>send(true));PI.isInitialized=true;log('Initialized!')}function stop(){send(true);if(PI.sendTimer){clearInterval(PI.sendTimer)}if(PI.originalConsoleLog){console.log=PI.originalConsoleLog}if(PI.originalDataLayerPush&&window.dataLayer){window.dataLayer.push=PI.originalDataLayerPush}PI.isInitialized=false;log('Stopped')}window.PixelInspector={init:init,stop:stop,flush:()=>send(true),stats:()=>({...PI.stats,queued:PI.eventQueue.length,site:CONFIG.SITE_NAME,initialized:PI.isInitialized}),config:CONFIG};init()})();

// ============================================================================
// FORMATTED VERSION (FOR REFERENCE - DO NOT USE AS BOOKMARKLET)
// ============================================================================

/**
 * This is the human-readable version of the bookmarklet above.
 * Use this for understanding the code, but use the minified version above
 * for the actual bookmarklet.
 */

/*
javascript:(function() {
  const CONFIG = {
    WEBHOOK_URL: "<YOUR-APPS-SCRIPT-WEB-APP-URL>",
    SITE_NAME: "optimum-nutrition",
    DEBUG_MODE: true,
    BATCH_SIZE: 10,
    AUTO_SEND_INTERVAL: 5000,
    EVENT_FILTERS: { captureAll: true }
  };
  
  const PI = {
    eventQueue: [],
    originalConsoleLog: null,
    originalDataLayerPush: null,
    isInitialized: false,
    stats: { captured: 0, sent: 0, failed: 0 },
    sendTimer: null
  };
  
  function log(...args) {
    if (CONFIG.DEBUG_MODE) {
      (PI.originalConsoleLog || console.log).apply(console, ['[PI]', ...args]);
    }
  }
  
  function isEventObj(obj) {
    if (typeof obj !== 'object' || obj === null) return false;
    return 'event' in obj || 'event_name' in obj || 'event_source' in obj || 
           'ecommerce' in obj || 'click_text' in obj;
  }
  
  function normalize(obj, src) {
    return {
      event_name: obj.event || obj.event_name || 'unknown',
      event_source: obj.event_source || src || 'unknown',
      page_url: obj.page_url || location.href,
      page_path: obj.page_path || location.pathname,
      page_title: obj.page_title || document.title,
      click_text: obj.click_text || obj.text || null,
      click_url: obj.click_url || obj.link_url || null,
      click_id: obj.click_id || null,
      click_class: obj.click_class || null,
      ecommerce: obj.ecommerce || null,
      product_id: obj.product_id || null,
      product_name: obj.product_name || null,
      price: obj.price || null,
      currency: obj.currency || 'USD',
      timestamp: new Date().toISOString(),
      site_name: CONFIG.SITE_NAME,
      raw_payload: JSON.stringify(obj)
    };
  }
  
  function capture(obj, src) {
    try {
      const evt = normalize(obj, src);
      PI.eventQueue.push(evt);
      PI.stats.captured++;
      log('Captured:', evt.event_name);
      if (PI.eventQueue.length >= CONFIG.BATCH_SIZE) {
        send();
      }
    } catch(e) {
      log('Error:', e);
    }
  }
  
  async function send(flush = false) {
    if (PI.eventQueue.length === 0) return;
    const evts = [...PI.eventQueue];
    PI.eventQueue = [];
    log(`Sending ${evts.length} events`);
    const payload = {
      events: evts,
      metadata: {
        site_name: CONFIG.SITE_NAME,
        sent_at: new Date().toISOString(),
        is_flush: flush
      }
    };
    try {
      if (flush && navigator.sendBeacon) {
        if (navigator.sendBeacon(CONFIG.WEBHOOK_URL, JSON.stringify(payload))) {
          PI.stats.sent += evts.length;
          log('Sent via beacon');
          return;
        }
      }
      const resp = await fetch(CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: flush
      });
      if (resp.ok) {
        PI.stats.sent += evts.length;
        log('Sent via fetch');
      } else {
        throw new Error(`HTTP ${resp.status}`);
      }
    } catch(e) {
      PI.stats.failed += evts.length;
      log('Send failed:', e);
      if (!flush) {
        PI.eventQueue.unshift(...evts);
      }
    }
  }
  
  function extractClick(el, ev) {
    let data = {
      click_text: null,
      click_url: null,
      click_id: null,
      click_class: null,
      isRelevant: false
    };
    let cur = el, depth = 0;
    while (cur && depth < 5) {
      const tag = cur.tagName ? cur.tagName.toLowerCase() : '';
      if (tag === 'a' || tag === 'button' || cur.hasAttribute('onclick')) {
        data.isRelevant = true;
        data.click_text = cur.innerText?.trim() || cur.textContent?.trim() || '';
        data.click_url = cur.href || cur.getAttribute('data-href') || null;
        data.click_id = cur.id || null;
        data.click_class = cur.className || null;
        break;
      }
      cur = cur.parentElement;
      depth++;
    }
    return data;
  }
  
  function init() {
    if (PI.isInitialized) {
      log('Already initialized');
      return;
    }
    
    log('Initializing...');
    
    PI.originalConsoleLog = console.log;
    console.log = function(...args) {
      PI.originalConsoleLog.apply(console, args);
      args.forEach(arg => {
        if (isEventObj(arg)) {
          capture(arg, 'console');
        }
      });
    };
    
    if (typeof window.dataLayer !== 'undefined') {
      PI.originalDataLayerPush = window.dataLayer.push;
      window.dataLayer.push = function(...args) {
        const res = PI.originalDataLayerPush.apply(window.dataLayer, args);
        args.forEach(arg => {
          if (typeof arg === 'object' && arg !== null) {
            capture(arg, 'datalayer');
          }
        });
        return res;
      };
    }
    
    document.addEventListener('click', function(e) {
      try {
        const data = extractClick(e.target, e);
        if (data.isRelevant) {
          capture({
            event: 'click',
            event_source: 'dom_listener',
            ...data
          }, 'click');
        }
      } catch(err) {
        log('Click error:', err);
      }
    }, true);
    
    capture({
      event: 'page_view',
      event_source: 'pixel_inspector',
      page_url: location.href,
      page_path: location.pathname,
      page_title: document.title,
      referrer: document.referrer || null
    }, 'pageview');
    
    PI.sendTimer = setInterval(() => {
      if (PI.eventQueue.length > 0) {
        send();
      }
    }, CONFIG.AUTO_SEND_INTERVAL);
    
    window.addEventListener('beforeunload', () => send(true));
    
    PI.isInitialized = true;
    log('Initialized!');
  }
  
  function stop() {
    send(true);
    if (PI.sendTimer) {
      clearInterval(PI.sendTimer);
    }
    if (PI.originalConsoleLog) {
      console.log = PI.originalConsoleLog;
    }
    if (PI.originalDataLayerPush && window.dataLayer) {
      window.dataLayer.push = PI.originalDataLayerPush;
    }
    PI.isInitialized = false;
    log('Stopped');
  }
  
  window.PixelInspector = {
    init: init,
    stop: stop,
    flush: () => send(true),
    stats: () => ({
      ...PI.stats,
      queued: PI.eventQueue.length,
      site: CONFIG.SITE_NAME,
      initialized: PI.isInitialized
    }),
    config: CONFIG
  };
  
  init();
})();
*/
