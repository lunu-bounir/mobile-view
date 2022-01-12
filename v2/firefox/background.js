'use strict';

const prefs = {
  'bypass-cache': false,
  'ua-android': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
  'ua-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/91.0.4472.80 Mobile/15E148 Safari/604.1',
  'ua-kindle': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.0.146.3-Gen4_12000410) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=true',
  'mode': 'android',
  'css': ''
};

const onClicked = tab => {
  if (observers[tab.id]) {
    chrome.webRequest.onBeforeSendHeaders.removeListener(observers[tab.id]);
  }
  observers[tab.id] = d => {
    const {requestHeaders} = d;

    if (d.type === 'main_frame') {
      if (observers[tab.id].expired) {
        chrome.webRequest.onBeforeSendHeaders.removeListener(observers[tab.id]);
        return;
      }
      observers[tab.id].expired = true;
    }

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
    }, () => chrome.runtime.lastError);
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
