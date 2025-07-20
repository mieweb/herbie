import { ParseScript } from '../../parser/parser.js';

export async function handleParseLine(scriptContent, sendResponse) {
  try {
    // Get the current URL for local keyword context
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tabs.length > 0 ? tabs[0].url : '';
    
    // Select the first line from the input
    const firstLine = scriptContent.split('\n')[0].trim();
    console.log('Parsing single line:', firstLine);

    // Pass the current URL for local keyword context
    const result = await ParseScript(firstLine, currentUrl);
    console.log('Parsed result:', result);

    // Send success response
    sendResponse({ status: 'success', data: result });
  } catch (error) {
    console.error('Error parsing line:', error);
    sendResponse({ status: 'error', message: 'Failed to parse line', error: error.message });
  }
}

export async function handleParseScript(scriptContent, sendResponse) {
  try {
    // Get the current URL for local keyword context
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tabs.length > 0 ? tabs[0].url : '';
    
    console.log('Parsing entire script:', scriptContent);

    // Pass the current URL for local keyword context
    const result = await ParseScript(scriptContent, currentUrl);
    console.log('Parsed script result:', result);

    // Send success response
    sendResponse({ status: 'success', data: result });
  } catch (error) {
    console.error('Error parsing script:', error);
    sendResponse({ status: 'error', message: 'Failed to parse script', error: error.message });
  }
}