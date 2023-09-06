'use strict';

const toast = document.getElementById('toast');

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.local.set({
    'bypass-cache': document.getElementById('bypass-cache').checked,
    'ua-android': document.getElementById('ua-android').value,
    'ua-ios': document.getElementById('ua-ios').value,
    'ua-kindle': document.getElementById('ua-kindle').value,
    'css': document.getElementById('css').value
  }, () => {
    toast.textContent = 'Options saved';
    window.setTimeout(() => toast.textContent = '', 750);
  });
});

chrome.storage.local.get({
  'bypass-cache': false,
  'ua-android': 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  'ua-ios': 'Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1',
  'ua-kindle': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.0.146.3-Gen4_12000410) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=true',
  'mode': 'android',
  'css': ''
}, prefs => {
  document.getElementById('bypass-cache').checked = prefs['bypass-cache'];
  document.getElementById('ua-android').value = prefs['ua-android'];
  document.getElementById('ua-ios').value = prefs['ua-ios'];
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
