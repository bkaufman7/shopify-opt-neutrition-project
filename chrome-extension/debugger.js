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

// Event toggle - make it global for onclick
window.toggleEvent = function(id) {
  const event = document.querySelector(`[data-event-id="${id}"]`);
  if (event) {
    event.classList.toggle('expanded');
  }
};

// Clear events
window.clearEvents = function() {
  if (confirm('Clear all events?')) {
    chrome.runtime.sendMessage({ action: 'clearEvents' }, () => {
      loadGlobalState();
    });
  }
};

// Refresh data
window.refreshData = function() {
  loadGlobalState();
};

// Update UI
function updateUI() {
  document.getElementById('totalEvents').textContent = state.stats.totalEvents || 0;
  document.getElementById('networkCount').textContent = state.stats.networkRequests || 0;
  document.getElementById('clickCount').textContent = state.stats.clicks || 0;
  document.getElementById('exportedCount').textContent = state.stats.exported || 0;
  
  renderTimeline();
  renderTagMap();
  renderNetwork();
  renderVariables();
  renderJourney();
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
    container.innerHTML = '<div class="empty-state">No events captured yet.<br>Extension is running on all pages.</div>';
    return;
  }
  
  container.innerHTML = filtered.slice(-200).reverse().map(event => `
    <div class="event event-${event.color || 'gray'}" data-event-id="${event.id}" onclick="toggleEvent('${event.id}')">
      <div class="event-header">
        <div>
          <div class="event-name">${escapeHtml(event.eventName || event.type)}</div>
        </div>
        <div class="event-meta">
          <span class="badge">${escapeHtml(event.source || 'Unknown')}</span>
          <span class="badge">${escapeHtml(event.initiator || 'Unknown')}</span>
          <span>${event.page_path || '/'}</span>
          <span>${new Date(event.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
      <div class="event-details">
        <div class="data-tree">${JSON.stringify(event, null, 2)}</div>
      </div>
    </div>
  `).join('');
}

// Render tag map
function renderTagMap() {
  const statsGrid = document.getElementById('statsGrid');
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-title">Total Events</div>
      <div class="stat-card-value">${state.stats.totalEvents || 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-title">Network Requests</div>
      <div class="stat-card-value">${state.stats.networkRequests || 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-title">Clicks</div>
      <div class="stat-card-value">${state.stats.clicks || 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-title">Pageviews</div>
      <div class="stat-card-value">${state.stats.pageviews || 0}</div>
    </div>
  `;
  
  const tagList = document.getElementById('tagList');
  const tags = Object.entries(state.tags).sort((a, b) => b[1] - a[1]);
  
  if (tags.length === 0) {
    tagList.innerHTML = '<div class="empty-state">No tags detected yet</div>';
    return;
  }
  
  tagList.innerHTML = tags.map(([tag, count]) => `
    <div class="tag-item">
      <div class="tag-name">${escapeHtml(tag)}</div>
      <div class="tag-count">${count}</div>
    </div>
  `).join('');
}

// Render network
function renderNetwork() {
  const container = document.getElementById('networkList');
  const networkEvents = state.events.filter(e => e.type === 'network');
  
  if (networkEvents.length === 0) {
    container.innerHTML = '<div class="empty-state">No network requests captured yet</div>';
    return;
  }
  
  container.innerHTML = networkEvents.slice(-200).reverse().map(event => `
    <div class="event event-purple" data-event-id="${event.id}" onclick="toggleEvent('${event.id}')">
      <div class="event-header">
        <div>
          <div class="event-name">${escapeHtml(event.tagType || 'Unknown')} - ${escapeHtml(event.tagId || 'Unknown ID')}</div>
        </div>
        <div class="event-meta">
          <span class="badge">${event.requestMethod || 'GET'}</span>
          <span>${new Date(event.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
      <div class="event-details">
        <div class="data-tree">${JSON.stringify(event, null, 2)}</div>
      </div>
    </div>
  `).join('');
}

// Render variables
function renderVariables() {
  const container = document.getElementById('dataLayerState');
  
  // Merge all dataLayer states from events
  const mergedState = {};
  state.events
    .filter(e => e.type === 'dataLayer' && e.eventData)
    .forEach(e => Object.assign(mergedState, e.eventData));
  
  container.textContent = JSON.stringify(mergedState, null, 2);
}

// Render journey
function renderJourney() {
  const container = document.getElementById('journeyList');
  
  if (state.journey.length === 0) {
    container.innerHTML = '<div class="empty-state">No pages visited yet</div>';
    return;
  }
  
  container.innerHTML = state.journey.map((item, index) => `
    <div class="journey-item">
      <div style="font-size: 11px; color: #999; margin-bottom: 8px;">Step ${index + 1}</div>
      <div class="journey-url">${escapeHtml(item.url)}</div>
      <div class="journey-title">${escapeHtml(item.title)}</div>
      <div class="journey-time">${new Date(item.timestamp).toLocaleString()}</div>
    </div>
  `).join('');
}

// Helper to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load global state from background script
function loadGlobalState() {
  chrome.runtime.sendMessage({ action: 'getGlobalState' }, (response) => {
    if (response) {
      state.events = response.events || [];
      state.stats = response.stats || {};
      
      // Calculate tags from events
      state.tags = {};
      state.events.forEach(e => {
        if (e.tagType) {
          state.tags[e.tagType] = (state.tags[e.tagType] || 0) + 1;
        }
      });
      
      // Extract journey
      state.journey = state.events
        .filter(e => e.type === 'pageview')
        .map(e => ({
          url: e.page_url,
          title: e.page_title,
          timestamp: e.timestamp
        }));
      
      updateUI();
    }
  });
}

// Listen for updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'eventUpdate') {
    state.events.push(message.event);
    state.stats = message.stats;
    updateUI();
  }
});

// Search handlers
document.getElementById('searchEvents').addEventListener('input', renderTimeline);
document.getElementById('searchNetwork').addEventListener('input', renderNetwork);

// Initial load
loadGlobalState();

// Auto-refresh every 3 seconds
setInterval(loadGlobalState, 3000);
