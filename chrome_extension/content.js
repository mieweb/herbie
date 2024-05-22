var cmdtree = []
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

function ExecuteScript(){
for(var i=0;i<cmdtree.length;i++){
  var inclause = $.inArray('in', cmdtree[i].code);
 
 var  tag= [];
 
  if(cmdtree[i].code[inclause+1]){
    //console.log(cmdtree[i].code[inclause+1]);
   //console.log(FindDesc(cmdtree[i].code[inclause+1]));
    tag=FindDesc(cmdtree[i].code[inclause+1]);
  }
  if(tag.length !=0){
    switch (cmdtree[i].code[0]) {
    
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
            });
        }
        
      case 'click':
        if (tag.length) {
          tag.fadeOut(100)
            .fadeIn(100)
            .fadeOut(100)
            .fadeIn(100)
            .simulate('click');
        }
    }
  }
  


}
}
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
    ExecuteScript();
    sendResponse({ status: 'success', data: 'Script received' });
    console.log('Script content received from background:',scriptContent);
    
  }
  return true;
});



