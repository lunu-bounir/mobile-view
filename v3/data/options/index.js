'use strict';

const toast = document.getElementById('toast');

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.local.set({
    'bypass-cache': document.getElementById('bypass-cache').checked,
    'reload-tab': document.getElementById('reload-tab').checked,
    'ua-android': document.getElementById('ua-android').value,
    'ua-android-tablet': document.getElementById('ua-android-tablet').value,
    'ua-ios': document.getElementById('ua-ios').value,
    'ua-ios-ipad': document.getElementById('ua-ios-ipad').value,
    'ua-kindle': document.getElementById('ua-kindle').value,
    'css': document.getElementById('css').value
  }, () => {
    toast.textContent = 'Options saved';
    window.setTimeout(() => toast.textContent = '', 750);
  });
});

chrome.storage.local.get({
  'bypass-cache': false,
  'reload-tab': true,
  'ua-android': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.199 Mobile Safari/537.36',
  'ua-android-tablet': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.199 Safari/537.36',
  'ua-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/149.0.7827.199 Mobile/15E148 Safari/604.1',
  'ua-ios-ipad': 'Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/149.0.7827.199 Mobile/15E148 Safari/604.1',
  'ua-kindle': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.0.146.3-Gen4_12000410) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=true',
  'mode': 'android',
  'css': ''
}, prefs => {
  document.getElementById('bypass-cache').checked = prefs['bypass-cache'];
  document.getElementById('reload-tab').checked = prefs['reload-tab'];
  document.getElementById('ua-android').value = prefs['ua-android'];
  document.getElementById('ua-android-tablet').value = prefs['ua-android-tablet'];
  document.getElementById('ua-ios').value = prefs['ua-ios'];
  document.getElementById('ua-ios-ipad').value = prefs['ua-ios-ipad'];
  document.getElementById('ua-kindle').value = prefs['ua-kindle'];
  document.getElementById('css').value = prefs['css'];
});

// reset
document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    toast.textContent = 'Double-click to reset!';
    window.setTimeout(() => toast.textContent = '', 750);
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
});
// support
document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));
// links
for (const a of [...document.querySelectorAll('[data-href]')]) {
  if (a.hasAttribute('href') === false) {
    a.href = chrome.runtime.getManifest().homepage_url + '#' + a.dataset.href;
  }
}
