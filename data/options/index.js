'use strict';

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.local.set({
    'bypass-cache': document.getElementById('bypass-cache').checked,
    'ua-android': document.getElementById('ua-android').value,
    'ua-ios': document.getElementById('ua-ios').value,
    'ua-kindle': document.getElementById('ua-kindle').value,
    'css': document.getElementById('css').value
  }, () => {
    const info = document.getElementById('info');
    info.textContent = 'Options saved';
    window.setTimeout(() => info.textContent = '', 750);
  });
});

chrome.storage.local.get({
  'bypass-cache': false,
  'ua-android': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1',
  'ua-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
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
