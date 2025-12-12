/**
 * Popup UI Controller
 */

let globalState = {
  events: [],
  stats: {},
  tags: {},
  activeTabs: []
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

// Open full debugger window
document.getElementById('openFullDebugger').addEventListener('click', () => {
  const width = 1200;
  const height = 800;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  
  chrome.windows.create({
    url: chrome.runtime.getURL('debugger.html'),
    type: 'popup',
    width: width,
    height: height,
    left: Math.round(left),
    top: Math.round(top)
  });
});

// Clear all events
document.getElementById('clearAllEvents').addEventListener('click', () => {
  if (confirm('Clear all captured events?')) {
    chrome.runtime.sendMessage({ action: 'clearEvents' }, (response) => {
      if (response.status === 'cleared') {
        loadGlobalState();
      }
    });
  }
});

// Toggle event expansion - make it global
window.toggleEvent = function(id) {
  const event = document.querySelector('[data-event-id="' + id + '"]');
  if (event) {
    event.classList.toggle('expanded');
  }
};

// Update UI
function updateUI() {
  // Update header stats
  document.getElementById('totalEvents').textContent = globalState.stats.totalEvents || 0;
  document.getElementById('networkCount').textContent = globalState.stats.networkRequests || 0;
  document.getElementById('tabCount').textContent = globalState.activeTabs.length || 0;
  
  // Update overview cards
  document.getElementById('totalEventsCard').textContent = globalState.stats.totalEvents || 0;
  document.getElementById('networkCountCard').textContent = globalState.stats.networkRequests || 0;
  document.getElementById('clicksCard').textContent = globalState.stats.clicks || 0;
  document.getElementById('pageviewsCard').textContent = globalState.stats.pageviews || 0;
  
  // Update events list
  renderEvents();
  
  // Update tags list
  renderTags();
}

function renderEvents() {
  const container = document.getElementById('eventsList');
  const recentEvents = globalState.events.slice(-50).reverse();
  
  if (recentEvents.length === 0) {
    container.innerHTML = '<div class="empty-state">No events captured yet.<br>Navigate to any website to start tracking.</div>';
    return;
  }
  
  container.innerHTML = recentEvents.map(event => `
    <div class="event event-${event.color || 'gray'}" data-event-id="${event.id}" onclick="toggleEvent('${event.id}')">
      <div class="event-header">
        <div class="event-name">${escapeHtml(event.eventName || event.type)}</div>
        <div class="event-meta">
          <span class="badge">${escapeHtml(event.source || 'Unknown')}</span>
          <span class="badge">${escapeHtml(event.initiator || 'Unknown')}</span>
          <span>${new Date(event.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
      <div class="event-details">${JSON.stringify(event, null, 2)}</div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function renderTags() {
  const container = document.getElementById('tagsList');
  
  // Count tags
  const tagCounts = {};
  globalState.events.forEach(event => {
    if (event.tagType) {
      tagCounts[event.tagType] = (tagCounts[event.tagType] || 0) + 1;
    }
  });
  
  const tags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  
  if (tags.length === 0) {
    container.innerHTML = '<div class="empty-state">No tags detected yet.</div>';
    return;
  }
  
  container.innerHTML = tags.map(([tag, count]) => `
    <div class="event">
      <div class="event-name">${tag}</div>
      <div class="event-meta">
        <span class="badge">${count} requests</span>
      </div>
    </div>
  `).join('');
}

// Load global state from background script
function loadGlobalState() {
  chrome.runtime.sendMessage({ action: 'getGlobalState' }, (response) => {
    if (response) {
      globalState.events = response.events || [];
      globalState.stats = response.stats || {};
      globalState.activeTabs = response.activeTabs || [];
      updateUI();
    }
  });
}

// Listen for updates from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'eventUpdate') {
    globalState.events.push(message.event);
    globalState.stats = message.stats;
    updateUI();
  }
});

// Initial load
loadGlobalState();

// Refresh every 2 seconds
setInterval(loadGlobalState, 2000);
