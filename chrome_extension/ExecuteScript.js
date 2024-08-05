var stopScript = false;

function ExecuteScript() {
    var cmdtree = arguments[0], options = { line: 0, delay: 100, cmdtree: cmdtree }, callback, tag = [];
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

    var i = options.line;
    if (i >= cmdtree.length) {
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

    var cmd = cmdtree[i];
    if (!cmd || !cmd.code) {
        console.error(`Invalid command at line ${i}:`, cmd);
        if (callback) {
            callback(true, options, 'Error: Invalid command');
        }
        return;
    }

    var inclause = $.inArray('in', cmd.code);
    if (inclause !== -1) {
        var tagname = cmd.code[inclause + 1];
       
        if(cmd.header){
            console.log("Subcommand : "+cmd.code[2]);
            tag=findElementThroughHeading(cmd.header,cmd.code[2],2);
            console.log(tag);
        }else{
            if (tagname.charAt(0) === '"' || tagname.charAt(0) === '\'') {
                tagname = tagname.slice(1, -1);
            }
            tag = FindDesc(tagname);
        }

        if (!tag.length) {
            if (cmd.timeout > 0) {
                cmd.timeout -= options.delay;
                console.log(`Waiting for element: ${tagname}`);
                return setTimeout(function () { ExecuteScript(cmdtree, options, callback); }, options.delay);
            } else {
                log(`Cannot find tag named: "${tagname}". Proceeding to next command.`);
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

    console.log(`Executing command: ${cmd.code.join(' ')}`);
    switch (cmd.code[0]) {
        case 'under':
            console.log("Running subcommands")
            ExecuteScript(cmd.subcommands, { line: 0, delay: 100, cmdtree: cmd.subcommands}, callback);
            break;
        case 'press':
            var seq = cmd.code[1];
            simulijs.simulateFocus(tag[0],function(){
                simulijs.simulateKeyPress(tag[0],seq);
            });
            return setTimeout(function () {
                options.line++;
                ExecuteScript(cmdtree, options, callback);
            }, options.delay);

        case 'type':
            var seq = cmd.code[1];
            if (seq.charAt(0) === '"' || seq.charAt(0) === '\'') {
                seq = seq.slice(1, -1);
            }

            if (tag.length) {
                simulijs.simulateFocus(tag[0],function(){
                    tag[0].value = "";
                    simulijs.simulateKeyPress(tag[0],seq);
                });
                return setTimeout(function () {
                    options.line++;
                    ExecuteScript(cmdtree, options, callback);
                }, options.delay);
            }
           
        case 'click':
            if (tag.length) {
                console.log(tag);
                simulijs.simulateClick(tag[0]);
            }
            return setTimeout(function () {
                options.line++;
                ExecuteScript(cmdtree, options, callback);
            }, options.delay);

        case 'wait':
            var waitTime = parseInt(cmd.code[1], 10);
            if (isNaN(waitTime)) {
                console.error(`Invalid wait time at line ${i}:`, cmd.code[1]);
                if (callback) {
                    callback(true, options, 'Error: Invalid wait time');
                }
                return;
            }
            console.log(`Waiting for ${waitTime} milliseconds`);
            return setTimeout(function () {
                options.line++;
                ExecuteScript(cmdtree, options, callback);
            }, waitTime);

        case 'mouseover':
            if (tag.length) {
                console.log(cmd.src)
                console.log(tag);
                simulijs.simulateMouseEnter(tag[0],function(){
                    console.log(tag[0].parentElement.parentElement.parentElement.parentElement.innerHTML)
                });
               
                
            }
            return setTimeout(function () {
                options.line++;
                ExecuteScript(cmdtree, options, callback);
            }, options.delay);

        case 'verify':
            var text = cmd.code[1];
            if (text.charAt(0) === '"' || text.charAt(0) === '\'') {
                text = text.slice(1, -1);
            }
            if (tag.length) {
                const element = tag[0];
                if (element.textContent.includes(text)) {
                    console.log(`Text "${text}" found in element ${tagname}.`);
                    chrome.runtime.sendMessage({ action: 'log', data: `Text "${text}" found in element ${tagname}.` });
                } else {
                    console.error(`Text "${text}" not found in element ${tagname}.`);
                    chrome.runtime.sendMessage({ action: 'log', data: `Text "${text}" not found in element ${tagname}.` });
                    stopScript = true; // Stop the script execution
                    if (callback) {
                        callback(true, options, `Verification failed: Text "${text}" not found`);
                    }
                    return;
                }
            } else {
                console.error(`Element not found for verification at line ${i}.`);
                chrome.runtime.sendMessage({ action: 'log', data: `Element not found for verification at line ${i}` });
                stopScript = true; // Stop the script execution
                if (callback) {
                    callback(true, options, 'Verification failed: Element not found');
                }
                return;
            }
            return setTimeout(function () {
                options.line++;
                ExecuteScript(cmdtree, options, callback);
            }, options.delay);

        case 'select':
            var value = cmd.code[1];
            if (value.charAt(0) === '"' || value.charAt(0) === '\'') {
                value = value.slice(1, -1);
            }
            if (tag.length) {
                var selectElement = tag[0];
                var optionFound = false;
                for (var j = 0; j < selectElement.options.length; j++) {
                    if (selectElement.options[j].value === value) {
                        selectElement.selectedIndex = j;
                        optionFound = true;
                        simulijs.simulateChange(selectElement);
                        break;
                    }
                }
                if (!optionFound) {
                    console.error(`Option "${value}" not found in select element at line ${i}.`);
                    if (callback) {
                        callback(true, options, `Error: Option "${value}" not found`);
                    }
                    return;
                }
            }
            return setTimeout(function () {
                options.line++;
                ExecuteScript(cmdtree, options, callback);
            }, options.delay);

        default:
            return setTimeout(function () {
                options.line++;
                ExecuteScript(cmdtree, options, callback);
            }, options.delay);
    }
}


