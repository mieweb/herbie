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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === 'RUN') {
    const scriptContent = message.data;
    FindDesc(scriptContent[0].code[3]).fadeOut(100)
    .fadeIn(100)
    .fadeOut(100)
    .fadeIn(100)
    .simulate('key-sequence', {
      sequence: "Hello world",
      
    });
    sendResponse({ status: 'success', data: 'Script received' });
    console.log('Script content received from background:',scriptContent);
    
  }
  return true;
});



