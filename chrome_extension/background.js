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

