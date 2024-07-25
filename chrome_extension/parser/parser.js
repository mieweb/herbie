function ParseScript(script) {
    if (!script) {
        return [];
    }

    var lines = script.split('\n');
    var cmdtree = [];
    var stack = [];

    function addCommand(cmd, indentLevel) {
        // Remove commands from the stack until the correct indent level is found
        while (stack.length > 0 && indentLevel <= stack[stack.length - 1].indentLevel) {
            stack.pop();
        }
        // Add command to the correct place in the tree and add header attribute
        if (stack.length === 0) {
            cmdtree.push(cmd);
        } else {
            var parentCmd = stack[stack.length - 1].cmd;
            cmd.header = extractHeader(parentCmd.src); // Set header attribute to parent command's header value
            stack[stack.length - 1].cmd.subcommands.push(cmd);
        }
        stack.push({ cmd: cmd, indentLevel: indentLevel });
    }

    function extractHeader(src) {
        var match = src.match(/"(.*?)"/);
        return match ? match[1] : null;
    }

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var indentLevel = line.search(/\S|$/); // Find the indentation level
        var cmd = { line: i, code: [], src: line.trim(), timeout: 5000, subcommands: [] };

        var stmt = line.trim().match(/\w+|'[^']+'|"[^"]+"|\{\{(.*?)\}\}|\*|:/g); // Tokenize line
        if (stmt) {
            parseStatement(stmt, cmd, line);
            addCommand(cmd, indentLevel);
        }
    }

    return cmdtree;
}

function parseStatement(stmt, cmd, line) {

  if (stmt[0].charAt(0)!=='*') {
    for (var j = 0; j < stmt.length; j++) {
        var z = stmt[j].charAt(0);
        if (z === '{' || z === '"' || z === '\'') {
            cmd.code.push(stmt[j]);
        } else {
            var candidate = stmt[j].toLowerCase();
            switch (candidate) {
                // Verbs
                case 'click':
                    cmd.code.push(candidate);
                    cmd.code.push('in');
                    break;
                case 'type':
                case 'capture':
                case 'test':
                case 'open':
                case 'wait': // Handle the 'wait' command
                    cmd.code.push(candidate);
                    if (candidate === 'wait' && stmt[j + 1]) {
                        cmd.code.push(stmt[j + 1]); // Add the wait duration
                        j++; // Skip the next token as it has been added as wait duration
                    }
                    break;
                case 'switch':
                case 'navigate':
                case 'press':
                    cmd.code.push(candidate);
                    break;
                // Nouns
                case 'button':
                case 'close':
                case 'autocomplete':
                case 'ok':
                case 'save':
                    cmd.code.push(candidate);
                    break;
                case 'on':
                    if (cmd.code.length && cmd.code[cmd.code.length - 1] !== 'in') {
                        cmd.code.push('in');
                    }
                    break;
                case 'in':
                case 'into':
                    if (cmd.code.length && cmd.code[cmd.code.length - 1] !== 'in') {
                        cmd.code.push('in');
                    }
                    break;
                case 'under':
                    cmd.code.push('under');
                    break;
                case 'mouseover':
                    cmd.code.push('mouseover');
            }
        }
    }
  } else {
    cmd.code.push('type');
				stmt = line.match(/\*[^:]+|:.+/g);
				cmd.code.push(stmt[1].slice(1).trim());
				cmd.code.push('in');
				cmd.code.push(stmt[0].slice(1).trim());
  }
}

function log(log_msg) {
    chrome.runtime.sendMessage({ action: 'log_msg', message: log_msg });
}

export { ParseScript, log };
