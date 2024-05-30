
var cmdtree = []
const stopScript = false;
function FindDesc(desc) {
    var el, hadterm = 0;

    // Append colon if not present
    if (!desc.match(':$')) { 
        desc += ':';
    } else {
        hadterm = 1;
    }

    // Find label with text containing the description
    try {
        el = $('label').filter(':contains(' + desc + ')');
        if (el.length) {
            el = el.first();
            return $('#' + el.attr('for'));
        }
    } catch (ex) {}

    // Remove trailing colon and try again
    desc = desc.slice(0, -1);

    try {
        el = $('label').filter(':contains(' + desc + ')');
        if (el.length) {
            el = el.first();
            return $('#' + el.attr('for'));
        }
    } catch (ex) {}

    // Add colon back if it was originally present
    if (hadterm) {
        desc += ':';
    }

    // Look for buttons containing the description
    try {
        el = $('button').filter(':contains(' + desc + ')');
        if (el.length) {
            return el.first();
        }
    } catch (ex) {}

    // Look for links containing the description
    try {
        el = $('a').filter(':contains(' + desc + ')');
        if (el.length) {
            return el.first();
        }
    } catch (ex) {}

    // Try to use the description as a jQuery selector
    try {
        el = $(desc);
    } catch (e) {
        el = [];
    }

    // Return the element if only one match is found
    if (el.length === 1) {
        return el;
    }

    // Check if the description is an XPath
    try {
        var xpathResult = document.evaluate(desc, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (xpathResult.singleNodeValue) {
            return $(xpathResult.singleNodeValue);
        }
    } catch (e) {}

    // Return empty array if no match is found
    return [];
}



function ExecuteScript() {
	var cmdtree = arguments[0], options = { line: 0, delay: 100, cmdtree:cmdtree } , callback, tag = [];
	if (arguments.length === 2) { // only two arguments supplied
		if (Object.prototype.toString.call(arguments[1]) === '[object Function]') {
			callback = arguments[1]; // if is a function, set as 'callback'
		} else {
			options = arguments[1]; // if not a function, set as 'options'
		}
	} else if (arguments.length === 3) { // three arguments supplied
		if (arguments[1]) {
			options = arguments[1];
		}
		callback = arguments[2];
	}

	var i=options.line;
	if (i>=cmdtree.length) {
		if (callback) {
			callback(true, options, 'Finished.');
		}
		return;
	}
	if (stopScript) {
		if (callback) {
			callback(true, null, 'Stopped.');
		}
		return;
	}

	var inclause = $.inArray('in', cmdtree[i].code);
	if (inclause !== -1) {
		var tagname = cmdtree[i].code[inclause+1];
		if (tagname.charAt(0)==='"'||tagname.charAt(0)==='\'') {
			tagname = tagname.slice(1,-1);
		}

		tag = FindDesc( tagname );
		if (!tag.length) {
			if (cmdtree[i].timeout>0) {
				cmdtree[i].timeout -= options.delay;
				return setTimeout(function () { ExecuteScript(cmdtree,options,callback); }, options.delay);
			} else {
				log('Cannot find tag named: "' + tagname + '". Proceeding to next command.');
				options.line++; 
				return setTimeout(function () {
					ExecuteScript(cmdtree, options, callback);
				}, options.delay);
			}
		}
	}

	if (callback) {
		callback(false, options);
	}

	switch (cmdtree[i].code[0]) {
		case 'press':
			var seq = cmdtree[i].code[1];
			if (seq.charAt(0)==='"'||seq.charAt(0)==='\'') {
				seq = seq.slice(1,-1);
			}

			if (!tag.length) {
				tag = $( document.activeElement );
			}
			tag.simulate('key-combo', {combo: seq });
			tag.next().focus();
			return setTimeout(function () {
					options.line++; // ok, setting the options to the next line here.
					ExecuteScript(cmdtree,options,callback);
				}, options.delay);

		case 'type':
			var seq = cmdtree[i].code[1];
			if (seq.charAt(0)==='"'||seq.charAt(0)==='\'') {
				seq = seq.slice(1,-1);
			}

			if (tag.length) {
				tag.fadeOut(100)
					.fadeIn(100)
					.fadeOut(100)
					.fadeIn(100)
					.simulate('key-sequence', {
						sequence: seq,
						delay: options.delay,
						callback: function () {
							options.line++; // ok, setting the options to the next line here.
							ExecuteScript(cmdtree,options,callback);
						}
					});
			}
			return;
		case 'click':
			if (tag.length) {
				tag.fadeOut(100)
					.fadeIn(100)
					.fadeOut(100)
					.fadeIn(100)
					.simulate('click');
			}
			return setTimeout(function () {
				options.line++; // ok, setting the options to the next line here.
				ExecuteScript(cmdtree,options,callback);
			}, options.delay);

		default:
			return setTimeout(function () {
				options.line++; // ok, setting the options to the next line here.
				ExecuteScript(cmdtree,options,callback);
			}, options.delay);

	}
}


document.addEventListener('DOMContentLoaded', () => {
console.log("DOM fully loaded and altered");
})


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === 'RUN') {
    const scriptContent = message.data;
    cmdtree = scriptContent;
 
  
	var options =  { line: message.line, delay: 100, cmdtree:cmdtree };
    ExecuteScript(cmdtree,options,function (done, option, comment){
     
      if (option) {
        var txt = 'Line: ' + (option.line+1) + ', Cmd:' + option.cmdtree[option.line].src + '\n';
      	log(txt);
      }
	  
      if(comment){
        log(comment);
      }
	 
    });
    sendResponse({ status: 'success', data: 'Script received' });
    console.log('Script content received from background:',scriptContent);
    
  }

  return true;
});


function log(log){
  chrome.runtime.sendMessage({ action: 'log', data: log }, (response) => {
    console.log('Response from background:', response.data);
 });

}


