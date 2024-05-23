var cmdtree = []
const stopScript = false;
function FindDesc(desc) {
	var el, hadterm=0;

	if (!desc.match(':$')) { // We should first try to find labels ending with a :
		desc += ':';
	} else {
		hadterm = 1;
	}

	try {
		el = $('label').filter(':contains(' +desc+')');
		if (el.length) {
			el = el.first();
			return $('#'+el.attr('for'));  // return the element the label is for
		}
	} catch (ex) {}

	desc = desc.slice(0,-1);  // remove the traling :

	try {
		el = $('label').filter(':contains(' +desc+')');
		if (el.length) {
			el = el.first();
			return $('#'+el.attr('for'));  // return the element the label is for
		}
	} catch (ex) {}

	if (hadterm) {
		desc += ':';
	}

	try {
		el = $('button').filter(':contains(' +desc+')');  // look for buttons that contain that text.
		if (el.length) {
			return el.first();
		}
	} catch (ex) {}

	try {
		el = $('a').filter(':contains(' +desc+')');  // look for buttons that contain that text.
		if (el.length) {
			return el.first();
		}
	} catch (ex) {}

	// as a last ditch effort see if it's a path
	try {
		el = $( desc );
	} catch(e) {
		el = [];
	}
	if (el.length===1) {
		return el;
	}

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
				//  If we want to continue on error, we should callback(false), and then schedule the next call.
				if (callback) {
					callback(true, options, 'Aborting. Cannot find tag named: "' + tagname + '"');
				}
				return;
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


// function ExecuteScript(){
// for(var i=0;i<cmdtree.length;i++){
//   var inclause = $.inArray('in', cmdtree[i].code);
 
//  var  tag= [];
 
//   if(cmdtree[i].code[inclause+1]){
//     //console.log(cmdtree[i].code[inclause+1]);
//    //console.log(FindDesc(cmdtree[i].code[inclause+1]));
//     tag=FindDesc(cmdtree[i].code[inclause+1]);
//   }
//   if(tag.length !=0){
//     switch (cmdtree[i].code[0]) {
    
//       case 'type':
//         var seq = cmdtree[i].code[1];
//         if (seq.charAt(0)==='"'||seq.charAt(0)==='\'') {
//           seq = seq.slice(1,-1);
//         }
  
//         if (tag.length) {
//           tag.fadeOut(100)
//             .fadeIn(100)
//             .fadeOut(100)
//             .fadeIn(100)
//             .simulate('key-sequence', {
//               sequence: seq,
//             });
//         }
        
//       case 'click':
//         if (tag.length) {
//           tag.fadeOut(100)
//             .fadeIn(100)
//             .fadeOut(100)
//             .fadeIn(100)
//             .simulate('click');
//         }
//     }
//   }
  


// }
// }
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === 'RUN') {
    const scriptContent = message.data;
    cmdtree = scriptContent;
    // FindDesc(scriptContent[0].code[3]).fadeOut(100)
    // .fadeIn(100)
    // .fadeOut(100)
    // .fadeIn(100)
    // .simulate('key-sequence', {
    //   sequence: "Hello world",
      
    // });
  
	var options =  { line: 0, delay: 100, cmdtree:cmdtree };
    ExecuteScript(cmdtree,options,function (done, option, comment){
     
      if (option) {
        var txt = 'Line: ' + (option.line+1) + ', Cmd:' + option.cmdtree[option.line].src + '\n';
      log(txt);
      }
      if(comment){
       // console.log(comment);
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
