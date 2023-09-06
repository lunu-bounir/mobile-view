'use strict';

const context = () => chrome.storage.local.get({
  'mode': 'android'
}, prefs => {
  chrome.contextMenus.create({
    title: 'Type: Android',
    id: 'android',
    type: 'radio',
    checked: prefs.mode === 'android',
    contexts: ['action']
  }, () => chrome.runtime.lastError);
  chrome.contextMenus.create({
    title: 'Type: iOS',
    id: 'ios',
    type: 'radio',
    checked: prefs.mode === 'ios',
    contexts: ['action']
  }, () => chrome.runtime.lastError);
  chrome.contextMenus.create({
    title: 'Type: Kindle',
    id: 'kindle',
    type: 'radio',
    checked: prefs.mode === 'kindle',
    contexts: ['action']
  }, () => chrome.runtime.lastError);
  chrome.contextMenus.create({
    title: 'Test my User-Agent',
    id: 'test-ua',
    contexts: ['action']
  }, () => chrome.runtime.lastError);
});
chrome.runtime.onStartup.addListener(context);
chrome.runtime.onInstalled.addListener(context);

chrome.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId === 'test-ua') {
    chrome.tabs.create({
      url: 'https://webbrowsertools.com/useragent/?method=normal&verbose=false&r=' + Math.random()
    });
  }
  else {
    chrome.storage.local.set({
      mode: info.menuItemId
    });
  }
});

chrome.action.onClicked.addListener(tab => {
  chrome.storage.local.get({
    'mode': 'android',
    'ua-android': 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    'ua-ios': 'Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1',
    'ua-kindle': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.0.146.3-Gen4_12000410) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=true',
    'bypass-cache': false
  }, async prefs => {
    const rules = await chrome.declarativeNetRequest.getSessionRules();
    if (rules.some(r => r.id === tab.id)) {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [tab.id]
      });
    }
    else {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [tab.id],
        addRules: [{
          'id': tab.id,
          'action': {
            'type': 'modifyHeaders',
            'requestHeaders': [{
              'header': 'user-agent',
              'operation': 'set',
              'value': prefs['ua-' + prefs.mode]
            }]
          },
          'condition': {
            'tabIds': [tab.id],
            'resourceTypes': [
              'main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping',
              'csp_report', 'media', 'websocket', 'webtransport', 'webbundle', 'other'
            ]
          }
        }]
      });
      chrome.action.setIcon({
        tabId: tab.id,
        path: {
          '16': '/data/icons/active/16.png',
          '32': '/data/icons/active/32.png',
          '48': '/data/icons/active/48.png'
        }
      });
    }
    chrome.tabs.reload(tab.id, {
      bypassCache: prefs['bypass-cache']
    });
  });
});

chrome.declarativeNetRequest.setExtensionActionOptions({
  displayActionCountAsBadgeText: true
});

chrome.tabs.onRemoved.addListener(tabId => chrome.declarativeNetRequest.updateSessionRules({
  removeRuleIds: [tabId]
}));

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
