// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

//document.body.innerHTML = "<h1>hi there</h1>";
$.when(
  $.getScript(chrome.extension.getURL("dist/jquery.simulate.js")),
  $.getScript(chrome.extension.getURL("dist/bililiteRange.js")),
  $.getScript(chrome.extension.getURL("dist/jquery.simulate.ext.js")),
  $.getScript(chrome.extension.getURL("dist/jquery.simulate.drag-n-drop.js")),
  $.getScript(chrome.extension.getURL("dist/jquery.simulate.key-sequence.js")),
  $.getScript(chrome.extension.getURL("dist/jquery.simulate.key-combo.js")),
  $.getScript(chrome.extension.getURL("herbie/inspector.js")),
  $.Deferred( function( deferred ) {
    $('body').append("<div id='herbie'></div>");
    $("#herbie").load(chrome.extension.getURL("herbie/herbie.html"), function(){
      $(this).contents().unwrap();  
      $('#herbie_logo').attr("src",chrome.extension.getURL("herbie48.png"));
    });
  }),
  $.Deferred( function( deferred ) { $( deferred.resolve ); } )
).done( function() {
  $.getScript(chrome.extension.getURL("herbie/herbie.js"))
  $("#herbie_script").text(
"Type 'hi' in to 'Address' input.\n\
Fill out the following fields: \n\
* Last Name: Horner\n\
* Phone: 260-459-6270\n\
Click on the 'Save' button. \n\
Click 'OK'.\n\
Click 'html body div.sample:nth-child(14) button:nth-child(24)'\n\
Click on the 'links' link.");
});

chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
  $('#herbie_output').append("Got message from background page: " + msg);
  console.log("Got message from background page: " + msg);
});
