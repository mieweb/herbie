
(function($) {

var loaderCallback = null;
var stopScript = false;

window.Herbie = [];

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
};

// This function takes a human readable potientially multi-lined script and turns it into a structured array.
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
};

window.Herbie.StopScript = function() {
	stopScript = true;
};

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
};

window.Herbie.StartScript = function(opt, progress) {

	if (progress) {
		loaderCallback = progress;
	}
	stopScript = false;

	var script = '';
	var cmdtree = [];
	var options = undefined;
	if (!opt) {
		script = $('#herbie_script').val();
		cmdtree = ParseScript(script);
	} else if (typeof opt === 'object') {
		script = opt.script;
		cmdtree = ParseScript(script);
		options = { line: opt.line, delay: 100, cmdtree:cmdtree }
	} else {
		script = opt;
		cmdtree = ParseScript(script);
	}

	if (loaderCallback) {
		loaderCallback({
			event: 'starting',
			script: script,
			options: opt
		});
	}

	$('#herbie_run').text('Stop');

	if (cmdtree.length) {
		ExecuteScript(cmdtree, options, function (done, option, comment) {
			var out = $('#herbie_output');
			if (out.length) {
				if (done) {
					$('#herbie_run').text('Run');
				}
				if ((option) && (option.line < option.cmdtree.length)) {
					$('#herbie_line').val(option.line+1);
					out.append('Line: ' + (option.line+1) + ', Cmd:' + option.cmdtree[option.line].src + '\n');
				} else if (option) {
					$('#herbie_line').val('');
				}
				if (comment) {
					out.append('[' + comment + ']\n');
				}
				out.animate({ scrollTop: out[0].scrollHeight}, 10);
			} else {
				herbielog([done, option, comment]);
			}
			if (loaderCallback) {
				if (done) {
					loaderCallback({
						event: 'done',
						details: option,
						comment: comment
					});
				} else {
					loaderCallback({
						event: 'progress',
						details: option,
						comment: comment
					});
				}
			}
		});
	}
};

window.Herbie.Stop = function() {
	Herbie.StopScript();
	$('#herbie_div').hide();
};

window.Herbie.BuildUI = function(path, script, callback) {
	if (callback) {
		loaderCallback = callback;
	}

	// check to see if it's already in the page.  If it is, then no need to reload it.
	if ($('#herbie_div').show().length) {
		if (script) {
			$('#herbie_script').text(script);
		}
		if (loaderCallback) {
			loaderCallback( { event: 'UIdone'} );
		}
		return;
	}

	$('body').append('<div id="herbie"></div>');
	$('#herbie').load(path+'herbie.html', function() {
		$(this).contents().unwrap();
		$('#herbie_logo').attr('src',path+'../logos/herbie48.png');
		if (script) {
			$('#herbie_script').text(script);
		}

		// window moving
		$('#herbie_div').on('mousedown', function(e) {
			var div = $('#herbie_div'),
				maxX = $(window).width() - parseInt(div.css('width')),
				maxY = $(window).height() - parseInt(div.css('height')),
				offset = div.offset(),
				xStart = e.pageX - offset.left,
				yStart = e.pageY - offset.top,
				htmlmousemove = function(e) {
					div.css('right', 'auto').offset({
						left: rangeLimit(e.pageX - xStart, 0, maxX),
						top: rangeLimit(e.pageY - yStart, 0, maxY)
					});
				},
				htmlmouseup = function(e) {
					div.removeClass('herbie_dragging');
					$(this).off({
						'mousemove': htmlmousemove,
						'mouseup': htmlmouseup
					});
				};

			div.addClass('herbie_dragging');
			$('html').on({
				'mousemove': htmlmousemove,
				'mouseup': htmlmouseup
			});
			e.preventDefault();
		});

		$('.herbie_hide').on('click', function() {
			var ele = $(this),
				parent = ele.parent(),
				pparent = parent.parent();

			switch (ele.text()) {
				case 'Hide':
					pparent.find('div').hide();
					parent.show();
					pparent.css('width','auto').css('left','auto').css('right','0');
					ele.text('Show');
					break;
				case 'Small':
					parent.next().hide();
					ele.text('Hide');
					break;
				case 'Show':
					pparent.find('div').show();
					ele.text('Small');
					default:
			}
		});
		$('#herbie_add').click(function(){
			var cmd = $('#herbie_command');
			var script = $('#herbie_script');
			var txt = script.val();
		
			if (!txt.match(/\n$/)) {
				txt = txt + '\n'; // add a newline;
			}
			txt += cmd.val() + '\n';
			script.val(txt);
			cmd.val('').focus();
			if (loaderCallback) {
				loaderCallback({
					event: 'update',
					script: txt
				});
			}
		});
		$('#herbie_parse').click(function(){
			var cmdtree = ParseScript($('#herbie_script').val());
			$('#herbie_output').text(JSON.stringify(cmdtree,null,2));
		});
		$('#herbie_run').click(function(){
			switch ($(this).text()) {
			case 'Run':
				$('#herbie_output').text('');
				Herbie.StartScript({
					script: $('#herbie_script').val(),
					line: Math.max(Number($('#herbie_line').val())-1, 0)
				});
				break;
			case 'Stop':
				Herbie.StopScript();
				break;
			}
		});
		$('#herbie_inspect').click(function(){
			$('.herbie_bar').hide();
			$('.herbie_script').hide();
			$('.herbie_output').show();
			document.RunInspector($('#herbie_output'), function() {
				$('.herbie_bar').show();
				$('.herbie_script').show();
			});
		});

		if (loaderCallback) {
			loaderCallback( { event: 'UIdone'} );
		}
	});
};

function rangeLimit(num, min, max) {
	if (num > max) {
		return max;
	} else if (num < min) {
		return min;
	} else {
		return num;
	}
};

var herbielog = function(msg) {
	if (window.console && console.log) {
		console.log(msg);
	}
};

})(jQuery);
