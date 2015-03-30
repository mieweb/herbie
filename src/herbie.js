
function FindDesc(desc) {
	var el, hadterm=0;

	if (!desc.match(':$')) { // We should first try to find labels ending with a :
		desc += ':';
	} else 
		hadterm = 1;

	el = $('label:contains(' +desc+')');
	if (el.length===1) return $('#'+el.attr("for"));  // return the element the label is for

	desc = desc.slice(0,-1);  // remove the traling :

	el = $('label:contains(' +desc+')');
	if (el.length===1) return $('#'+el.attr("for")); // return the element the label is for

	if (hadterm) desc += ':';

//	if (desc.match('^#')) {
	// as a last ditch effort see if it's a path
		try {
			el = $( desc );
		} catch(e) {
			el = [];
		}
		if (el.length===1) return el;
//	}


}

// This function takes a human readable potientially multi-lined script and turns it into a structured array.
function ParseScript(script) {
	var lines = script.split('\n');
	var cmdtree = [];

	for (i = 0; i < lines.length; i++) {  // Go thru each line.

		var cmd = { line: i, code: [], src: lines[i] };  // setup cmd structure

		var stmt = lines[i].match(/\w+|'[^']+'|"[^"]+"|\{\{(.*?)\}\}|\*|:/g);   // break the line into words, "quoted" or 'quoted' tokens, and {{tags}}
		if (stmt)
			if (stmt[0].charAt(0)!=='*') {
				for (j = 0; j < stmt.length; j++) {
					var z = stmt[j].charAt(0);
					if (z == '{' || z == '"' || z == "'" ) {
						cmd.code.push(stmt[j]);
					} else {
						var candidate = stmt[j].toLowerCase();
						switch (candidate) {
							// verbs
							case 'click':
							case 'type':
							case 'capture':
							case 'test':
							case 'open':
							case 'wait':
							case 'switch':
							case 'navigate':

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
								cmd.code.push('in');
								break;
						}
					}
				}
			} else {
				cmd.code.push('type');
				stmt = lines[i].match(/\*[^:]+|:.+/g);
				cmd.code.push(stmt[1].slice(1).trim());
				cmd.code.push('in');
				cmd.code.push(stmt[0].slice(1).trim());
			}
		cmdtree.push(cmd);
	}
	return cmdtree;
}

function ExecuteScript(cmdtree) {
	
	for (var i=0; i<cmdtree.length;i++) {
		switch (cmdtree[i].code[0]) {
			case 'type':
				var inclause = $.inArray("in", cmdtree[i].code);
				var tag = FindDesc( cmdtree[i].code[inclause+1] );

				if (tag) tag.fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);

				var seq = cmdtree[i].code[1];
				if (seq.charAt(0)==='"'||seq.charAt(0)==="'")
					seq = seq.slice(1,-1);

				tag.simulate("key-sequence", {sequence: seq });


				break;
			default:
		}
	}
}
