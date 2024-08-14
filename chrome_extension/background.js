import { ParseScript, log } from './parser/parser.js';

var cmdtree = [];
let currentLine = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'parse') {
        const scriptContent = message.data;

        // Fetch global and local keywords from storage and then parse the script
        chrome.storage.local.get(['globalKeywords'], async (result) => {
            const globalKeywords = result.globalKeywords || [];
            
            // Fetch local keywords
            chrome.storage.local.get(['localKeywords'], async (localResult) => {
                const localKeywords = localResult.localKeywords || [];
                const keywords = globalKeywords.concat(localKeywords);
                
                // Await the parsing of the script
                try {
                    var k = await ParseScript(scriptContent, keywords);
                    sendResponse({ status: 'success', data: k });
                } catch (error) {
                    console.error('Error parsing script:', error);
                    sendResponse({ status: 'error', message: 'Failed to parse script' });
                }
            });
        });

        return true; // Keep the messaging channel open for asynchronous responses
    }

    if (message.action === 'RUN') {
        const scriptContent = message.data;
        console.log('Received RUN script from extension to background.js:', scriptContent);

        // Fetch global and local keywords from storage and then parse the script
        chrome.storage.local.get(['globalKeywords'], async (result) => {
            const globalKeywords = result.globalKeywords || [];
            
            // Fetch local keywords
            chrome.storage.local.get(['localKeywords'], async (localResult) => {
                const localKeywords = localResult.localKeywords || [];
                const keywords = globalKeywords.concat(localKeywords);
                
                // Await the parsing of the script
                try {
                    var k = await ParseScript(scriptContent, keywords);

                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs[0]) {
                            chrome.tabs.sendMessage(tabs[0].id, { action: 'RUN', data: k, line: 0 }, (response) => {
                                console.log('Response RUN script from content js:', response);
                            });
                        }
                    });
                    cmdtree = k;
                    currentLine = 0; // Reset the current line counter
                    sendResponse({ status: 'success', data: k });
                } catch (error) {
                    console.error('Error running script:', error);
                    sendResponse({ status: 'error', message: 'Failed to run script' });
                }
            });
        });

        return true; // Keep the messaging channel open for asynchronous responses
    }

    if (message.action === 'actions_run') {
        try {
            var k = message.data;

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'RUN', data: k, line: 0 }, (response) => {
                        console.log('Response RUN script from content js:', response);
                    });
                }
            });
            cmdtree = k;
            currentLine = 0; // Reset the current line counter
            sendResponse({ status: 'success', data: k });
        }catch (error) {
                    console.error('Error running script:', error);
                    sendResponse({ status: 'error', message: 'Failed to run script' });
        }
    }

    if (message.action === 'log') {
        log(message.data);
        const regex = /^Line: \d+.*/;
        if(regex.test(message.data)){
            currentLine++;
        }
        chrome.runtime.sendMessage({ action: 'progress', current: currentLine, total: cmdtree.length });
        sendResponse({ status: 'success', data: "log received" });
    }

    return true; // Keep the messaging channel open for asynchronous responses
});

chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
    log("\nNavigating to :" + details.url + "\n");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            sendMessageWithRetry(tabs[0].id, cmdtree, currentLine-1);
        }
    });
});


function sendMessageWithRetry(tabId, data, line, retries = 5) {
    if (retries === 0) {
        log("Nobody to receive after 5 attempts");
        return;
    }

    chrome.tabs.sendMessage(tabId, { action: 'RUN', data: data, line: line }, (response) => {
        if (chrome.runtime.lastError || !response) {
            log(`Retry ${6 - retries}: to inject content scripts after page navigation, trying again...\n`);
            setTimeout(() => {
                sendMessageWithRetry(tabId, data, line, retries - 1);
            }, 500); // Wait 500ms before retrying
        } else {
            console.log('Response RUN script from content js:', response);
        }
    });
}