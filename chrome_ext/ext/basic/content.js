// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

//document.body.innerHTML = "<h1>hi there</h1>";
$.when(
  $.get(chrome.extension.getURL("dist/jquery.simulate.js"), eval),
  $.get(chrome.extension.getURL("dist/bililiteRange.js"), eval),
  $.get(chrome.extension.getURL("dist/jquery.simulate.ext.js"), eval),
  $.get(chrome.extension.getURL("dist/jquery.simulate.drag-n-drop.js"), eval),
  $.get(chrome.extension.getURL("dist/jquery.simulate.key-sequence.js"), eval),
  $.get(chrome.extension.getURL("dist/jquery.simulate.key-combo.js"), eval),
  $.get(chrome.extension.getURL("herbie/inspector.js"), eval),
  $.Deferred( function( deferred ) {
    $('body').append("<div id='herbie'></div>");
    $("#herbie").load(chrome.extension.getURL("herbie/herbie.html"), function(){
      $(this).contents().unwrap();  
      $('#herbie_logo').attr("src",chrome.extension.getURL("herbie48.png"));
      $( deferred.resolve );
    });
  }),
  $.Deferred( function( deferred ) { $( deferred.resolve ); } )
).done( function() {
  $.get(chrome.extension.getURL("herbie/herbie.js"),eval);
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
  $('#herbie_output').append("Got message from background page: " + msg + "\n");
  console.log("Got message from background page: " + msg);
});
