// ─── Tahcia Popup ─────────────────────────────────────────────────────────────

const POLL_SECONDS = 5;

const $ = id => document.getElementById(id);

const phaseCards = {
  IDLE:           $('phaseIdle'),
  AWAITING_LOGIN: $('phaseAwaiting'),
  CONNECTED:      $('phaseConnected'),
};
const phaseConsoleCards = {
  IDLE:           $('phaseConsoleIdle'),
  AWAITING_LOGIN: $('phaseConsoleAwaiting'),
  CONNECTED:      $('phaseConsoleConnected'),
};

const statusDot  = $('statusDot');
const phaseLabel = $('phaseLabel');
const pollLabel  = $('pollLabel');
const pollBar    = $('pollBar');

let pollTimer = null;
let pollStart = null;

let tabId = null;
let isConsole = false;
let isPermitted = false;



// ─── UI Rendering ─────────────────────────────────────────────────────────────

function renderState(state) {
  if (!state || !state.phase) return;
  const { phase, sessionId, controlledTabs,recording } = state;

  // Phase cards
  Object.values(phaseCards).forEach(c => c.classList.remove('active'));
  Object.values(phaseConsoleCards).forEach(c => c.classList.remove('active'));
  if (!isConsole) {
    if (phaseCards[phase]) phaseCards[phase].classList.add('active');
    $('btnAddTab').classList.remove('hidden');
    $('btnPermission').classList.remove('hidden');
    $(isPermitted || true ? 'btnPermission' : 'btnAddTab').classList.add('hidden');
    if (thisTabId in (controlledTabs || {})) $('btnAddTab').classList.add('hidden');
  }
  if (isConsole)
    if (phaseConsoleCards[phase]) phaseConsoleCards[phase].classList.add('active');

  // Dot
  statusDot.className = 'status-dot';
  if (phase === 'AWAITING_LOGIN') statusDot.classList.add('waiting');
  else if (phase === 'CONNECTED') statusDot.classList.add('connected');
  else statusDot.classList.add('idle');

  phaseLabel.textContent = phase;

  if (phase === 'CONNECTED') {
    $('sessionDisplay').textContent = sessionId || '—';
    renderTabs(controlledTabs || {});
    startPollAnimation();
    pollLabel.textContent = recording ? 'recording' : 'idle';
  } else {
    stopPollAnimation();
    pollLabel.textContent = recording ? 'recording' : 'idle';
  }
}

function renderTabs(tabs) {
  const list = $('tabsList');
  const entries = Object.entries(tabs);

  if (!entries.length) {
    list.innerHTML = '<div class="empty-state">No tabs registered</div>';
    return;
  }

  list.innerHTML = entries.map(([tabId, info]) => `
    <div class="tab-item" data-tabid="${tabId}">
      <div class="tab-item-info">
        <div class="tab-url">${cleanUrl(info.url)}</div>
        <div class="tab-id">tab #${tabId}</div>
      </div>
      <button class="tab-remove" data-tabid="${tabId}" title="Remove">×</button>
    </div>
  `).join('');
      // <span class="tab-badge ${info.permanent ? 'badge-perm' : 'badge-temp'}">
      //   ${info.permanent ? 'PERM' : 'TEMP'}
      // </span>

  list.querySelectorAll('.tab-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = parseInt(btn.dataset.tabid);
      chrome.runtime.sendMessage({ type: 'UNREGISTER_TAB', tabId });
    });
  });
}

function cleanUrl(url = '') {
  return url.replace(/^https?:\/\//, '').slice(0, 40);
}

// ─── Poll Animation ───────────────────────────────────────────────────────────

function startPollAnimation() {
  stopPollAnimation();
  pollStart = Date.now();
  pollBar.style.transition = 'none';
  pollBar.style.width = '0%';

  requestAnimationFrame(() => {
    pollBar.style.transition = `width ${POLL_SECONDS}s linear`;
    pollBar.style.width = '100%';
  });

  pollTimer = setInterval(() => {
    pollStart = Date.now();
    pollBar.style.transition = 'none';
    pollBar.style.width = '0%';
    requestAnimationFrame(() => {
      pollBar.style.transition = `width ${POLL_SECONDS}s linear`;
      pollBar.style.width = '100%';
    });
  }, POLL_SECONDS * 1000);
}

function stopPollAnimation() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  pollBar.style.transition = 'none';
  pollBar.style.width = '0%';
}

// ─── Event Wiring ─────────────────────────────────────────────────────────────

$('btnInit').addEventListener('click', () => {
  pollLabel.textContent = 'connecting…';
  chrome.runtime.sendMessage({ type: 'INIT' }, renderState);
});

$('btnStart').addEventListener('click', async () => {
  pollLabel.textContent = 'connecting…';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    const origin = new URL(tab.url).origin + "/*";
    chrome.permissions.request({origins: [origin]}, (granted) => {
      if (granted) {
        chrome.runtime.sendMessage({ type: 'INIT_CONSOLE', tabId: tab.id }, renderState);
      } else {
        console.log("User denied the request.");
      }
    });
  }
});
$('btnStop').addEventListener('click', async () => {
  pollLabel.textContent = 'stopping...';
  chrome.runtime.sendMessage({ type: 'RESET'}, renderState);
});

$('btnFocusConsole').addEventListener('click', async () => {
  const state = await getState();
  if (state.consoleTabId) {
    chrome.tabs.update(state.consoleTabId, { active: true });
  }
});

$('btnCancelLogin').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'RESET' }, renderState);
});

$('btnAddTab').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.runtime.sendMessage({ type: 'REGISTER_CURRENT_TAB', tabId: tab.id, permanent: true }, renderState);
  }
});


$('btnPermission').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    const origin = new URL(tab.url).origin + "/*";

    chrome.permissions.request({
      origins: [origin]
    }, (granted) => {
      if (granted) {
        isPermitted = true;
      } else {
        console.log("User denied the request.");
      }
    });

  }
});

$('btnDisconnect').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'RESET' }, renderState);
});

// ─── State Sync ───────────────────────────────────────────────────────────────

function getState() {
  return new Promise(resolve => chrome.runtime.sendMessage({ type: 'GET_STATE' }, resolve));
}

// Listen for background state broadcasts
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATE_UPDATE') renderState(msg.state);
});


var thisTabId = null;

getState().then(state => {

  chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => {
    tabId = t.id;
    thisTabId = t.id;
    if (t && t.url.indexOf(".tahcia.com/console") >4){
      isConsole = true;
      if (state) renderState(state);
      else renderState({ phase: 'IDLE', sessionId: null, controlledTabs: {} });
    }
    else {
      const origin = new URL(t.url).origin + "/*";
      chrome.permissions.contains({
        permissions: ['tabs'],
        origins: [origin]
      }, (result) => {
        if (result) isPermitted = true;

        if (state) renderState(state);
        else renderState({ phase: 'IDLE', sessionId: null, controlledTabs: {} });

      });
    }


  });


});
