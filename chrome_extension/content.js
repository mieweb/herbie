
// content.js is for holding chrome specific code to interface to herbie that runs in the page's content.
// This code is the interface between the background page and the herbie code that is meant to be browser independent.

function HerbieonMessage(msg) {
  console.log("Herbie Message", msg );
  chrome.runtime.sendMessage( msg );
}

chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
  //$('#herbie_output').append("Got message from background page: " + msg + "\n");
  console.log("onMessage: ",msg);

  try {
    var cmd;
    if (typeof msg === 'string') {
      cmd = msg;
    } else {
      cmd = msg.cmd;
    }

    switch (cmd) {
      case "Stop":
        Herbie.Stop();
        break;
      case "Show":
          Herbie.BuildUI(chrome.extension.getURL("/herbie/"), msg.script, HerbieonMessage);
        break;
      case "Run":
        Herbie.StartScript( { script: msg.script, line: msg.line } ,HerbieonMessage);
        break;
    }
  } catch (e) {
    console.log(e.stack);
  }
});
