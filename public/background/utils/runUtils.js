import { ParseScript } from '../../parser/parser.js'; 

export async function handleRunScript(scriptContent, sendResponse) {
    console.log("Run is a combination of parse and execute");
}

export async function handleExecuteScript(scriptContent, sendResponse) {
    try {
        // Get the active tab to determine current URL
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0 || !tabs[0].id) {
            console.error("No active tab found");
            sendResponse({ status: 'error', message: 'No active tab found' });
            return null;
        }

        const activeTabId = tabs[0].id;
        const currentUrl = tabs[0].url || '';
        
        console.log(`Executing script for URL: ${currentUrl}`);
        
        // Parse the script with the current URL as context
        const result = await ParseScript(scriptContent, currentUrl);
        
        console.log("Parsed script result:", result);
            
        // Send the parsed commands to the content script for execution
        chrome.tabs.sendMessage(
            activeTabId,
            { action: 'executeCommandFrom', data: result, line: 0 },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message to content script:", chrome.runtime.lastError.message);
                    sendResponse({ status: 'error', message: 'Failed to execute command' });
                } else {
                    console.log('Response from content script:', response);
                    sendResponse(response);
                }
            }
        );

        return result;
    } catch (error) {
        console.error("Error executing script:", error);
        sendResponse({ status: 'error', message: 'Failed to execute script', error: error.message });
        return null;
    }
}