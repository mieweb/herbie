import { ParseScript, log } from './parser/parser.js';

var cmdtree = [];
let currentLine = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'parse') {
        const scriptContent = message.data;
        
        // Fetch global and local keywords from storage and then parse the script
        chrome.storage.local.get(['globalKeywords'], (result) => {
            const globalKeywords = result.globalKeywords || [];
            
            // Fetch local keywords
            chrome.storage.local.get(['localKeywords'], (localResult) => {
                const localKeywords = localResult.localKeywords || [];
                const keywords = globalKeywords.concat(localKeywords);
                var k = ParseScript(scriptContent, keywords);
                sendResponse({ status: 'success', data: k });
            });
        });

        return true; // Keep the messaging channel open for asynchronous responses
    }

    if (message.action === 'RUN') {
        const scriptContent = message.data;
        console.log('Received RUN script from extension to background.js:', scriptContent);

        // Fetch global and local keywords from storage and then parse the script
        chrome.storage.local.get(['globalKeywords'], (result) => {
            const globalKeywords = result.globalKeywords || [];
            
            // Fetch local keywords
            chrome.storage.local.get(['localKeywords'], (localResult) => {
                const localKeywords = localResult.localKeywords || [];
                const keywords = globalKeywords.concat(localKeywords);
                var k = ParseScript(scriptContent, keywords);

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
            });
        });

        return true; // Keep the messaging channel open for asynchronous responses
    }

    if (message.action === 'log') {
        log(message.data);
        currentLine++;
        chrome.runtime.sendMessage({ action: 'progress', current: currentLine, total: cmdtree.length });
        sendResponse({ status: 'success', data: "log received" });
    }

    return true; // Keep the messaging channel open for asynchronous responses
});

chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
    log("Navigating to :" + details.url + "\n");
    // Perform actions when the DOM content is fully loaded
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'RUN', data: cmdtree, line: currentLine }, (response) => {
                console.log('Response RUN script from content js:', response);
            });
        }
    });
});







function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0; // Convert to unsigned 32-bit integer
}

function getCurrentPageKey() {
    const url = new URL(window.location.href);
    const path = url.pathname;
    const params = url.search;
    const fullString = `${path}${params}`;
    const hashedKey = hashString(fullString);
    return `keywords_${hashedKey}`;
}



let actions = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'get_actions') {
        sendResponse({ actions: actions });
    } else if (message.action === 'update_actions') {
        actions = message.actions;
        sendResponse({ status: 'updated' });
    } else if (message.action === 'clear_actions') {
        actions = [];
        sendResponse({ status: 'cleared' });
    }
});
