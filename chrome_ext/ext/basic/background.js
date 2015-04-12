// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Global variables only exist for the life of the page, so they get reset
// each time the page is unloaded.
var counter = 1;

var lastTabId = -1;
function sendMessage(id) {
  if (id) {
    lastTabId = id;
    chrome.tabs.sendMessage(lastTabId, "Background page started.");
  } else {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      lastTabId = tabs[0].id;
      chrome.tabs.sendMessage(lastTabId, "Background page started.");
    });
  }
}

sendMessage();
chrome.browserAction.setBadgeText({text: "ON"});
console.log("Loaded.");

chrome.runtime.onInstalled.addListener(function() {
  console.log("Installed.");

  // localStorage is persisted, so it's a good place to keep state that you
  // need to persist across page reloads.
  localStorage.counter = 1;

});


chrome.browserAction.onClicked.addListener(function() {
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    if (tabs && tabs.length) {
      var tab = tabs[0];
      chrome.tabs.executeScript(null, {file: "dist/jquery.min.js"}, function() {
        var id = tab.id;
        chrome.tabs.executeScript(null, {file: "content.js"}, function() {
          sendMessage(id);
        });
      });
    }
  });
});

chrome.commands.onCommand.addListener(function(command) {
  chrome.tabs.create({url: "http://www.google.com/"});
});

chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
  if (msg.setAlarm) {
    // For testing only.  delayInMinutes will be rounded up to at least 1 in a
    // packed or released extension.
    chrome.alarms.create({delayInMinutes: 0.1});
  } else if (msg.delayedResponse) {
    // Note: setTimeout itself does NOT keep the page awake. We return true
    // from the onMessage event handler, which keeps the message channel open -
    // in turn keeping the event page awake - until we call sendResponse.
    setTimeout(function() {
      sendResponse("Got your message.");
    }, 5000);
    return true;
  } else if (msg.getCounters) {
    sendResponse({counter: counter++,
                  persistentCounter: localStorage.counter++});
  }
  // If we don't return anything, the message channel will close, regardless
  // of whether we called sendResponse.
});

chrome.alarms.onAlarm.addListener(function() {
  console.log("Time's up!");
});

chrome.runtime.onSuspend.addListener(function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // After the unload event listener runs, the page will unload, so any
    // asynchronous callbacks will not fire.
    console.log("This does not show up.");
  });
  console.log("Unloading.");
  chrome.browserAction.setBadgeText({text: ""});
  chrome.tabs.sendMessage(lastTabId, "Background page unloaded.");
});
