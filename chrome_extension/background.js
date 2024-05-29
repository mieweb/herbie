function ParseScript(script) {
	if (!script) {
		return [];
	}
	
	var lines = script.split('\n');
	var cmdtree = [];

	for (i = 0; i < lines.length; i++) {  // Go thru each line.

		var cmd = { line: i, code: [], src: lines[i], timeout: 5000 };  // setup cmd structure

		var stmt = lines[i].match(/\w+|'[^']+'|"[^"]+"|\{\{(.*?)\}\}|\*|:/g);   // break the line into words, "quoted" or 'quoted' tokens, and {{tags}}
		if (stmt) {
			if (stmt[0].charAt(0)!=='*') { 					//  We support bulleted lists of field/value pair.  If this is not one, then we process it differently.
				for (j = 0; j < stmt.length; j++) {
					var z = stmt[j].charAt(0);
					if (z === '{' || z === '"' || z === '\'' ) {
						cmd.code.push(stmt[j]);
					} else {
						var candidate = stmt[j].toLowerCase();
						switch (candidate) {
							// verbs
							case 'click':
								cmd.code.push(candidate);
								cmd.code.push('in');
								break;
							case 'type':
							case 'capture':
							case 'test':
							case 'open':
							case 'wait':
							case 'switch':
							case 'navigate':
							case 'press':

							// nouns
							case 'button':
							case 'close':
							case 'autocomplete':
							case 'ok':
							case 'save':
								cmd.code.push(candidate);
								break;
							case 'on':
							case 'in':
							case 'into':
								if ((cmd.code.length) && (cmd.code[ cmd.code.length - 1 ] === 'in'))
									; // do nothing
								else
									cmd.code.push('in');
								break;
						}
					}
				}
			} else {  // this is a field value pair.  ie:  * Field: value
				cmd.code.push('type');
				stmt = lines[i].match(/\*[^:]+|:.+/g);
				cmd.code.push(stmt[1].slice(1).trim());
				cmd.code.push('in');
				cmd.code.push(stmt[0].slice(1).trim());
			}
		}
		cmdtree.push(cmd);
	}
	return cmdtree;
}



var cmdtree =[];
let currentLine = 0;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'parse') {
      const scriptContent = message.data;
      //console.log('Received script content:', scriptContent);
      
      var k = ParseScript(scriptContent);
      sendResponse({ status: 'success', data: k });
  }


  if (message.action === 'RUN') {
    const scriptContent = message.data;
    console.log('Received RUN script from extension to background.js:', scriptContent);
    
    var k = ParseScript(scriptContent);
	
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'RUN', data: k,line:0 }, (response) => {
              console.log('Response RUN script from content js:', response);
         
          });
      }
   }); 
   cmdtree = k;
   currentLine = 0; // Reset the current line counter
   sendResponse({ status: 'success', data: k });
}

if (message.action === 'log') {
		log(message.data);
        currentLine++;
        chrome.runtime.sendMessage({ action: 'progress', current: currentLine, total: cmdtree.length });
}
        sendResponse({ status: 'success', data: "log received" });
if(message.action === 'start_inspecting'){
	
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (tabs[0]) {
			chrome.tabs.sendMessage(tabs[0].id, { action: 'start_inspection', data: k }, (response) => {
				console.log('Response from inspector.js:', response);
		   
			});
		}
	 }); 


	sendResponse({ status: 'success', data: "move the mouse over inspection started" });
}


return true; // Keep the messaging channel open for asynchronous responses
});




function log(log_msg) {
	chrome.runtime.sendMessage({ action: 'log_msg', message: log_msg});
}






chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
	log("Navigating to :" +details.url)
	// Perform actions when the DOM content is fully loaded
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (tabs[0]) {
			chrome.tabs.sendMessage(tabs[0].id, { action: 'RUN', data: cmdtree,line:currentLine }, (response) => {
				console.log('Response RUN script from content js:', response);
		   
			});
		}
	 }); 
  });