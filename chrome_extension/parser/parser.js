async function ParseScript(script) {
    if (!script) {
        return [];
    }

    var lines = script.split('\n');
    var cmdtree = [];
    var stack = [];
    var currentIndentLevel = 0;

    function addCommand(cmd, indentLevel) {
        while (stack.length > 0 && indentLevel <= stack[stack.length - 1].indentLevel) {
            stack.pop();
        }
        if (stack.length === 0) {
            cmdtree.push(cmd);
        } else {
            stack[stack.length - 1].cmd.subcommands.push(cmd);
        }
        stack.push({ cmd: cmd, indentLevel: indentLevel });
    }

    // Create an array of promises for each line parsing
    let promises = lines.map(async (line, i) => {
        var indentLevel = line.search(/\S|$/); // Find the indentation level
        var cmd = { line: i, code: [], src: line.trim(), timeout: 5000, subcommands: [] };

        var stmt = line.trim().match(/\w+|'[^']+'|"[^"]+"|\{\{(.*?)\}\}|\*|:/g); // tokenize line
        if (stmt) {
            await parseStatement(stmt, cmd);
            addCommand(cmd, indentLevel);
        }
    });

    // Wait for all the parsing promises to complete
    await Promise.all(promises);

    return cmdtree;
}

async function parseStatement(stmt, cmd) {
    for (var j = 0; j < stmt.length; j++) {
        var z = stmt[j].charAt(0);
        if (z === '{' || z === '"' || z === '\'') {
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
                case 'wait':  // Handle the 'wait' command
                    cmd.code.push(candidate);
                    if (candidate === 'wait' && stmt[j + 1]) {
                        cmd.code.push(stmt[j + 1]);  // Add the wait duration
                        j++;  // Skip the next token as it has been added as wait duration
                    }
                    break;
                case 'switch':
                case 'navigate':
                case 'press':
                    cmd.code.push(candidate);
                    break;
                // nouns
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

    const foundKeyword = await new Promise((resolve) => {
        chrome.storage.local.get("globalKeywords", function(result) {
            if (result.globalKeywords) {
                const keywords = result.globalKeywords.map(item => item.keyword);
                
                function stripQuotesFromArray(arr) {
                    return arr.map(str => {
                        if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
                            return str.slice(1, -1);
                        }
                        return str;
                    });
                }
        
                function findKeyword(str) {
                    const cleanedStr = stripQuotesFromArray(str);
                    return result.globalKeywords.find(item => cleanedStr.includes(item.keyword)) || null;
                }
        
                const keyword = findKeyword(cmd.code);
                resolve(keyword);
            } else {
                resolve(null);
            }
        });
    });
    console.log(foundKeyword);
    if (foundKeyword) {
        if (foundKeyword.hasVariable) {
            const variables = cmd.code.filter(str => (str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'")))
                                        .map(str => str.slice(1, -1));

             let updatedXpath = foundKeyword.xpath;

            // For 'type' commands, skip the first variable, for others, use all variables
            const relevantVariables = cmd.code.includes("type") ? variables.slice(1) : variables;
            
            relevantVariables.forEach(variable => {
                updatedXpath = updatedXpath.replace('{$}', variable);
            });

            var inclause = cmd.code.indexOf("in");
            cmd.code[inclause + 1] = updatedXpath;

        } else {
            var inclause = cmd.code.indexOf("in");
            cmd.code[inclause + 1] = foundKeyword.xpath;
        }
    } else {
        console.log("The string does not contain any keywords.");
    }
}

function log(log_msg) {
    chrome.runtime.sendMessage({ action: 'log_msg', message: log_msg });
}

export { ParseScript, log };
