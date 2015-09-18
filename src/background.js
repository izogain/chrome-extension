var MAX_SEGMENTS = 10; // each segment is 3 seconds long
var WEBSITE_REGEX = /(youtube)|(twitch\.tv)|(.mp4)|(.webm)|(gfycat.com)|(vimeo.com)|(streamable.com)|(instagram.com)|(twitter.com)|(facebook)|(dailymotion.com)|(vine.co)/i
var APP_URL = 'http://staging.streamable.com';

var manager = {
  streams: {},

  trackSegment: function(tabId, url) {
    if (!manager.streams[tabId]) {
      manager.streams[tabId] = {urls: []};
    }
    var stream = manager.streams[tabId];
    stream.urls.push(url);
    if (stream.urls.length > MAX_SEGMENTS) {
      stream.urls = stream.urls.slice(-MAX_SEGMENTS);
    }
  },

  buildVideo: function(segmentUrls, callback) {
    $.get(APP_URL + '/ajax/transcoder', function(transcoderUrl) {
      var concatPayload = {
        userAgent: 'Streamable Chrome Extension',
        cookies: {},
        segments: segmentUrls
      };
      $.ajax({
        type: 'post',
        url: 'http://' + transcoderUrl + '/segments/concat',
        data: concatPayload,
        success: function(concatData) {
          callback(concatData.url);
        }
      });
    });
  },

  cleanup: function(tabId) {
    delete manager.streams[tabId];
  }
};

function notify(title, message, callback) {
  chrome.notifications.create({
    type: "basic",
    title: chrome.i18n.getMessage(title),
    message: chrome.i18n.getMessage(message),
    iconUrl: "icons/icon96.png"
  }, callback);
}

function popup(url, callback) {
  chrome.tabs.create({
    url: url
  }, callback);
}

function clipVideo(url, callback) {
  popup(APP_URL + '/clipper/' + url, callback);
}

function clipStream(tabId) {
  var stream = manager.streams[tabId];
  if (!(stream && stream.urls)) {
    return;
  }
  notify('clipStreamNotifyTitle', 'clipStreamNotifyMessage', function(notificationId) {
    manager.buildVideo(stream.urls, function(videoUrl) {
      clipVideo(videoUrl, function() {
        chrome.notifications.clear(notificationId);
      });
    });
  });
}

function togglePageAction(tab) {
  if (WEBSITE_REGEX.test(tab.url)) {
    chrome.pageAction.show(tab.id);
  }
  else {
    chrome.pageAction.hide(tab.id);
  }
}

chrome.webRequest.onCompleted.addListener(function(req) {
  chrome.tabs.get(req.tabId, function(tab) {
    manager.trackSegment(tab.id, req.url);
  });
}, {urls: ["http://*.ttvnw.net/*.ts"]});

chrome.pageAction.onClicked.addListener(function(tab) {
  var match = tab.url.match(WEBSITE_REGEX);
  if (!(match && match.length)) {
    return;
  }
  if (match[0] === "twitch.tv") {
    clipStream(tab.id);
  }
  else {
    clipVideo(tab.url);
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
  togglePageAction(tab);
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  manager.cleanup(tabId);
});

chrome.tabs.onActivated.addListener(function(info) {
  chrome.tabs.get(info.tabId, function(tab) {
    togglePageAction(tab);
  });
});