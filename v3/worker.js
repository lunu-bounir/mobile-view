'use strict';

const context = async () => {
  if (context.once) {
    return;
  }
  context.once = true;

  const prefs = await chrome.storage.local.get({
    'mode': 'android'
  });
  chrome.contextMenus.create({
    title: 'Type: Android (Phone)',
    id: 'android',
    type: 'radio',
    checked: prefs.mode === 'android',
    contexts: ['action']
  }, () => chrome.runtime.lastError);
  chrome.contextMenus.create({
    title: 'Type: Android (Tablet)',
    id: 'android-tablet',
    type: 'radio',
    checked: prefs.mode === 'android-tablet',
    contexts: ['action']
  }, () => chrome.runtime.lastError);
  chrome.contextMenus.create({
    title: 'Type: iOS (Phone)',
    id: 'ios',
    type: 'radio',
    checked: prefs.mode === 'ios',
    contexts: ['action']
  }, () => chrome.runtime.lastError);
  chrome.contextMenus.create({
    title: 'Type: iOS (iPad)',
    id: 'ios-ipad',
    type: 'radio',
    checked: prefs.mode === 'ios-ipad',
    contexts: ['action']
  }, () => chrome.runtime.lastError);
  chrome.contextMenus.create({
    title: 'Type: Kindle',
    id: 'kindle',
    type: 'radio',
    checked: prefs.mode === 'kindle',
    contexts: ['action']
  }, () => chrome.runtime.lastError);
  // chrome.contextMenus.create({
  //   title: 'Test my User-Agent',
  //   id: 'test-ua',
  //   contexts: ['action']
  // }, () => chrome.runtime.lastError);
};
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

const ua = {
  async set(tab) {
    const prefs = await chrome.storage.local.get({
      'mode': 'android',
      'ua-android': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.199 Mobile Safari/537.36',
      'ua-android-tablet': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.199 Safari/537.36',
      'ua-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/149.0.7827.199 Mobile/15E148 Safari/604.1',
      'ua-ios-ipad': 'Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/149.0.7827.199 Mobile/15E148 Safari/604.1',
      'ua-kindle': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.0.146.3-Gen4_12000410) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=true',
    });

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
          'resourceTypes': Object.values(chrome.declarativeNetRequest.ResourceType)
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
  },
  remove(tab) {
    return chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [tab.id]
    });
  }
};

// persist icon
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === 'loading') {
    chrome.declarativeNetRequest.getSessionRules().then(rules => {
      for (const rule of rules) {
        if (rule.id === tabId) {
          chrome.action.setIcon({
            tabId: tabId,
            path: {
              '16': '/data/icons/active/16.png',
              '32': '/data/icons/active/32.png',
              '48': '/data/icons/active/48.png'
            }
          });
        }
      }
    });
  }
});

{
  const once = async () => {
    const rules = await chrome.declarativeNetRequest.getSessionRules();
    for (const rule of rules) {
      chrome.action.setIcon({
        tabId: rule.id,
        path: {
          '16': '/data/icons/active/16.png',
          '32': '/data/icons/active/32.png',
          '48': '/data/icons/active/48.png'
        }
      }).catch(() => {});
    }
  };
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}

chrome.action.onClicked.addListener(async tab => {
  const prefs = await chrome.storage.local.get({
    'bypass-cache': false,
    'reload-tab': true
  });
  const rules = await chrome.declarativeNetRequest.getSessionRules();
  if (rules.some(r => r.id === tab.id)) {
    await ua.remove(tab);
    if (prefs['reload-tab'] === false) {
      chrome.action.setIcon({
        tabId: tab.id,
        path: {
          '16': '/data/icons/16.png',
          '32': '/data/icons/32.png',
          '48': '/data/icons/48.png'
        }
      }).catch(() => {});
    }
  }
  else {
    await ua.set(tab);
  }
  if (prefs['reload-tab']) {
    chrome.tabs.reload(tab.id, {
      bypassCache: prefs['bypass-cache']
    });
  }
});

if ('setExtensionActionOptions' in chrome.declarativeNetRequest) {
  chrome.declarativeNetRequest.setExtensionActionOptions({
    displayActionCountAsBadgeText: true
  });
}

chrome.tabs.onRemoved.addListener(tabId => chrome.declarativeNetRequest.updateSessionRules({
  removeRuleIds: [tabId]
}));

// Update UA for active tabs
chrome.storage.onChanged.addListener(async ps => {
  if ('mode' in ps) {
    // update UA
    for (const {id} of await chrome.declarativeNetRequest.getSessionRules()) {
      ua.set({id});
    }
  }
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const {homepage_url: page, name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
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
