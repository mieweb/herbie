// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Global variables only exist for the life of the page, so they get reset
// each time the page is unloaded.
var counter = 1;
var tabstack = [];
var enabled = false;
var runScript = false;  // this flag is set true while scripts are being executed.
var lastLine = 0;

var exampleScript = "Type 'hi' in to 'Address' input.\n\
Fill out the following fields: \n\
* Last Name: Horner\n\
* Phone: 260-459-6270\n\
Click on the 'Save' button. \n\
Click 'OK'.\n\
Type 'finally' in 'Slow Input'\n\
Click on the 'going away' link.\n\
Type 'it worked' in '#lst-ib'";

function sendMessage(id, message, callback) {
  if (id) {
    chrome.tabs.sendMessage(id, message);
    if (callback) callback();
  } else {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs.length) {
        chrome.tabs.sendMessage(tabs[0].id, message);
        if (callback) callback();
      }
    });
  }
}

//chrome.browserAction.setBadgeText({text: "ON"});
console.log("Loaded.");

chrome.runtime.onInstalled.addListener(function() {
  console.log("Installed.");

  // localStorage is persisted, so it's a good place to keep state that you
  // need to persist across page reloads.
  localStorage.counter++;

});

// InjectHerbie is just to load the code into the isolated content VM.  We want to be able to load the script, but not 
// modify the page until, and if we need to.
function InjectHerbie(tid, callback) {
//  if (tabstack.indexOf(tid) >= 0) {
//    chrome.tabs.sendMessage(tid, "Show", callback);
//    return;
//  }

  tabstack.push(tid);
  chrome.tabs.executeScript(tid, {file: "dist/jquery.min.js"}, function() {
    chrome.tabs.executeScript(tid, {file: "dist/jquery.simulate.js" }, function() {
      chrome.tabs.executeScript(tid, {file: "dist/bililiteRange.js" }, function() {
        chrome.tabs.executeScript(tid, {file: "dist/jquery.simulate.ext.js" }, function() {
          chrome.tabs.executeScript(tid, {file: "dist/jquery.simulate.drag-n-drop.js" }, function() {
            chrome.tabs.executeScript(tid, {file: "dist/jquery.simulate.key-sequence.js" }, function() {
              chrome.tabs.executeScript(tid, {file: "dist/jquery.simulate.key-combo.js" }, function() {
                chrome.tabs.executeScript(tid, {file: "herbie/inspector.js" }, function() {
                  chrome.tabs.executeScript(tid, {file: "herbie/herbie.js" }, function() {
                    chrome.tabs.executeScript(tid, {file: "content.js" }, function() {
                      if (callback) callback();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

chrome.browserAction.onClicked.addListener(function() {
  if (enabled) {  //  If we are enabled, then lets turn it all off and disable the UI.
    chrome.browserAction.setBadgeText({text: ""});
    enabled = false;
    tabstack.forEach( function (id) {
      chrome.tabs.sendMessage(id, "Stop");
    });
  } else {  //  Otherwise, lets show the UI on all enabled tabs.
    tabstack.forEach( function (id) {
      chrome.tabs.sendMessage(id, "Show");
    });
    chrome.tabs.query({currentWindow: true}, function(tabs) {
      if (tabs && tabs.length) {
        enabled = true;
        chrome.browserAction.setBadgeText({text: "ON"});
        InjectHerbie(tabs[0].id, function() {
          sendMessage(tabs[0].id, { cmd: "Show", script: exampleScript });
        });
      }
    });
  }
});

chrome.webNavigation.onCommitted.addListener(function(data) {
  if (enabled) 
    if (data.transitionType==='link') {
      InjectHerbie(data.tabId, function() { 
        if (runScript) 
          sendMessage(data.tabId, { cmd: "Run", script: exampleScript, line: lastLine+1 });
        else
          sendMessage(data.tabId, { cmd: "Show", script: exampleScript });
      });
    } else {
      var i = tabstack.indexOf(data.tabId);
      if (i>=0) tabstack.splice(i,1);
    }

  console.log("onCommitted", data);
});

/*
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

  console.log("onUpdated:", tabId ,", details: " , changeInfo , ", Tab:" , tab);

  if (changeInfo.status == "loading") {  // we need to remove the tab id from the tabstack, since the code is no longer loaded.
    var i = tabstack.indexOf(tabId);
    if (i>=0) tabstack.splice(i,1);

  } else if (enabled) {
    if (changeInfo.status == "complete") {
      InjectHerbie(tabId, function() { 
        if (runScript) 
          sendMessage(tabId, { cmd: "Run", script: exampleScript }) 
        else
          sendMessage(tabId, { cmd: "Show", script: exampleScript }) 
      });
    }
  }
});
*/

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
  } else if (msg.event === "update") {
    exampleScript = msg.script;
  } else if (msg.event === "starting") {
    runScript = true;
    exampleScript = msg.script;
  } else if (msg.event === "done") {
    runScript = false;
  } else if (msg.event === "progress") {
    runScript = true;
    lastLine = msg.details.line;
  }
  console.log("onMessage:",msg);
  // If we don't return anything, the message channel will close, regardless
  // of whether we called sendResponse.
});

chrome.alarms.onAlarm.addListener(function() {
  console.log("Time's up!");
});

chrome.runtime.onSuspend.addListener(function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // After the unload event listener runs, the page will unload, so any
    // asynchronous callback will not fire.
    console.log("This does not show up.");
  });
  console.log("Unloading.");
  chrome.tabs.sendMessage(null, "Background page unloaded.");
});

