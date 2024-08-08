
var cmdtree = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'RUN') {
        const scriptContent = message.data;
        cmdtree = scriptContent;

        var options = { line: message.line, delay: 100, cmdtree: cmdtree };

        // Ensure cmdtree is properly structured
        if (!Array.isArray(cmdtree) || cmdtree.length === 0) {
            sendResponse({ status: 'error', data: 'Invalid script content received' });
            console.error('Invalid script content received:', scriptContent);
            return;
        }

        ExecuteScript(cmdtree, options, function (done, option, comment) {
            if (option) {
                var currentCmd = option.cmdtree[option.line];
                if (currentCmd && currentCmd.src) {
                    var txt = 'Line: ' + (option.line + 1) + ', Cmd:' + currentCmd.src + '\n';
                    log(txt);
                }
            }

            if (comment) {
                log(comment);
            }
        });

        sendResponse({ status: 'success', data: 'Script received' });
        console.log('Script content received from background:', scriptContent);
    }

    return true; // Keep the messaging channel open for asynchronous responses
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'start_inspecting') {
        document.addEventListener('mouseover', highlightElement);
        document.addEventListener('mouseout', removeHighlight);
        document.addEventListener('click', captureXPath, true);
    }
});








