import { ParseScript, log } from './parser/parser.js';

var cmdtree = [];
let currentLine = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'parse') {
        const scriptContent = message.data;
        //console.log('Received script content:', scriptContent);
        
        var k = ParseScript(scriptContent);
        sendResponse({ status: 'success', data: k });
    }

    if (message.action === 'RUN') {
        const scriptContent = message.data;
        console.log('Received RUN script from extension to background.js:', scriptContent);
        
        var k = ParseScript(scriptContent);
        
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
