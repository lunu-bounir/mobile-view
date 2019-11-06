'use strict';

const prefs = {
  'bypass-cache': false,
  'ua-android': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1',
  'ua-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
  'ua-kindle': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.0.146.3-Gen4_12000410) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=true',
  'mode': 'android',
  'css': ''
};

const onClicked = tab => {
  if (observers[tab.id]) {
    chrome.webRequest.onBeforeSendHeaders.removeListener(observers[tab.id]);
  }
  observers[tab.id] = ({requestHeaders}) => {
    for (let i = 0, name = requestHeaders[0].name; i < requestHeaders.length; i += 1, name = requestHeaders[i].name) {
      if (name === 'User-Agent' || name === 'user-agent') {
        requestHeaders[i].value = prefs['ua-' + prefs.mode];
        return {
          requestHeaders
        };
      }
    }
  };
  observe.check();
  icons[tab.id] = true;
  chrome.webRequest.onBeforeSendHeaders.addListener(observers[tab.id], {
    urls: ['*://*/*'],
    tabId: tab.id
  }, ['blocking', 'requestHeaders']);
  chrome.tabs.reload(tab.id, {
    bypassCache: prefs['bypass-cache']
  });
};

chrome.storage.onChanged.addListener(ps => Object.entries(ps).forEach(([key, v]) => {
  prefs[key] = v.newValue;
}));
chrome.storage.local.get(prefs, ps => {
  Object.assign(prefs, ps);
  chrome.contextMenus.create({
    title: 'Type: Android',
    id: 'android',
    type: 'radio',
    checked: prefs.mode === 'android',
    contexts: ['browser_action']
  });
  chrome.contextMenus.create({
    title: 'Type: iOS',
    id: 'ios',
    type: 'radio',
    checked: prefs.mode === 'ios',
    contexts: ['browser_action']
  });
  chrome.contextMenus.create({
    title: 'Type: Kindle',
    id: 'kindle',
    type: 'radio',
    checked: prefs.mode === 'kindle',
    contexts: ['browser_action']
  });
  chrome.contextMenus.create({
    title: 'Test my User-Agent',
    id: 'test-ua',
    contexts: ['browser_action']
  });
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'test-ua') {
    chrome.tabs.create({
      url: 'https://webbrowsertools.com/useragent/?method=normal&verbose=false&r=' + Math.random()
    });
  }
  else {
    chrome.storage.local.set({
      mode: info.menuItemId
    }, () => onClicked(tab));
  }
});

const observers = {};
const icons = {};

chrome.browserAction.onClicked.addListener(onClicked);

const observe = {};
observe.onRemoved = tabId => {
  delete observers[tabId];
  delete icons[tabId];
  observe.check();
};
observe.onCompleted = ({tabId, frameId}) => {
  if (frameId === 0 && observers[tabId]) {
    // console.log('removing');
    chrome.webRequest.onBeforeSendHeaders.removeListener(observers[tabId]);
    delete observers[tabId];
    observe.check();
  }
};
observe.onCommitted = ({tabId, frameId}) => {
  if (frameId === 0 && icons[tabId]) {
    chrome.browserAction.setIcon({
      tabId: tabId,
      path: {
        '16': 'data/icons/active/16.png',
        '19': 'data/icons/active/19.png',
        '32': 'data/icons/active/32.png',
        '38': 'data/icons/active/38.png',
        '48': 'data/icons/active/48.png',
        '64': 'data/icons/active/64.png'
      }
    });
    chrome.tabs.executeScript(tabId, {
      runAt: 'document_start',
      frameId,
      code: `{
        const script = document.createElement('script');
        script.textContent = \`{
          const o = '${encodeURIComponent(prefs['ua-' + prefs.mode])}';
          navigator.__defineGetter__('userAgent', () => {
            return decodeURIComponent(o);
          });
        }\`;
        document.documentElement.appendChild(script);
        script.remove();
      }`
    });
    if (prefs.css) {
      chrome.tabs.insertCSS(tabId, {
        code: prefs.css,
        runAt: 'document_start'
      });
    }
    delete icons[tabId];
  }
};
observe.install = () => {
  // console.log('installing observers');
  chrome.webNavigation.onCommitted.addListener(observe.onCommitted);
  chrome.webNavigation.onCompleted.addListener(observe.onCompleted);
  chrome.tabs.onRemoved.addListener(observe.onRemoved);
};
observe.remove = () => {
  // console.log('removing observers');
  chrome.webNavigation.onCommitted.removeListener(observe.onCommitted);
  chrome.webNavigation.onCompleted.removeListener(observe.onCompleted);
  chrome.tabs.onRemoved.removeListener(observe.onRemoved);
};
observe.check = () => {
  const len = Object.keys(observers).length;
  if (len) {
    if (chrome.webNavigation.onCompleted.hasListener(observe.onCompleted) === false) {
      observe.install();
    }
  }
  else {
    observe.remove();
  }
};

// FAQs and Feedback
{
  const {onInstalled, setUninstallURL, getManifest} = chrome.runtime;
  const {name, version} = getManifest();
  const page = getManifest().homepage_url;
  onInstalled.addListener(({reason, previousVersion}) => {
    chrome.storage.local.get({
      'faqs': true,
      'last-update': 0
    }, prefs => {
      if (reason === 'install' || (prefs.faqs && reason === 'update')) {
        const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
        if (doUpdate && previousVersion !== version) {
          chrome.tabs.create({
            url: page + '?version=' + version +
              (previousVersion ? '&p=' + previousVersion : '') +
              '&type=' + reason,
            active: reason === 'install'
          });
          chrome.storage.local.set({'last-update': Date.now()});
        }
      }
    });
  });
  setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
}
