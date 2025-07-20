chrome.storage.local.get({ herbiecmdtree:[], herbiestartline:0 }, (result) => {
  console.log("retrieving herbiecmd tree in chrome storage")
  console.log(result.herbiecmdtree)
  console.log(result.herbiestartline);
 
  if(result.herbiestartline < result.herbiecmdtree.length){
    executeCommands(result.herbiestartline+1, result.herbiecmdtree)
  }
  
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "executeCommandFrom") {
    console.log("Received executeCommandFrom message")
    sendResponse({ status: 'success', message: 'Commands received' });
    console.log("Executing commands:", message.data);

    const cmdtree = message.data;
    const startLine = message.line || 0; // Default to 0 if message.line is not provided

    chrome.storage.local.set({ herbiecmdtree: cmdtree, herbiestartline: startLine }, () => {
      console.log("Stored cmdtree in Chrome storage");
    });

    if (!Array.isArray(cmdtree) || cmdtree.length === 0) {
      chrome.runtime.sendMessage({ status: 'error', message: 'No valid commands to execute' });
      return;
    }

    executeCommands(startLine, cmdtree)
      .then(() => {
        chrome.runtime.sendMessage({ status: 'success', message: 'Execution completed successfully' });
      })
      .catch((error) => {
        console.error("Error during execution:", error);
        chrome.runtime.sendMessage({ status: 'error', message: error.message });
      });

    return true; // Keep the message channel open for async operations
  }
});

/**
 * Helper function to handle verification in executeCommands
 * @param {Object} item - The command item containing verification details
 * @param {string} xpath - The XPath or selector to find the element
 * @param {number} delay - Delay in milliseconds
 * @param {string} value - The value for verification (if applicable)
 * @returns {Promise} - Resolves with the verification result
 */
async function handleVerification(item, xpath, delay, value) {
  // Skip element finding for title/url verifications
  if (item.verifyType === 'title' || item.verifyType === 'url') {
      return await execute('verify', null, delay, value, item);
  } 
  
  // For other verifications, find the element
  try {
      const elementLocator = item.verifyLocator || xpath;
      let targetElement = null;
      
      if (elementLocator) {
          targetElement = await find_element(elementLocator);
      }
      
      // Special case: for 'hidden' state verification, it's okay if element is not found
      if (!targetElement && 
          !(item.verifyType === 'state' && item.verifyExpected === 'hidden')) {
          console.warn(`Element not found for verification: ${elementLocator}`);
          
          // Send element not found error to UI
          chrome.runtime.sendMessage({
              action: "updateResult",
              data: { 
                  success: false, 
                  message: `Element not found for verification: ${elementLocator}`,
                  value: `Element not found for verification: ${elementLocator}`
              }
          });
          
          return {
              success: false,
              message: `Element not found for verification: ${elementLocator}`
          };
      }
      
      return await execute('verify', targetElement, delay, value, item);
  } catch (error) {
      console.error("Verification error:", error);
      chrome.runtime.sendMessage({
          action: "updateResult",
          data: { 
              success: false, 
              message: `Verification error: ${error.message}`,
              value: `Verification error: ${error.message}`
          }
      });
      return {
          success: false,
          message: `Verification error: ${error.message}`
      };
  }
}
/**
 * Execute commands in sequence
 * @param {number} startLine - The line to start execution from
 * @param {Array} cmdtree - The array of commands to execute
 * @returns {Promise} - Resolves when all commands have been executed
 */
async function executeCommands(startLine, cmdtree) {
  // Make sure we execute commands sequentially
  for (let i = startLine; i < cmdtree.length; i++) {
    // Properly await retrieving storage value
    const storageData = await new Promise((resolve) => {
      chrome.storage.local.get({ herbiestop: false }, (data) => resolve(data.herbiestop));
    });

    // If herbiestop is true, break the loop to stop execution
    if (storageData) {
      console.log("Stopping the test case as herbiestop is set to true.");
      return;
    }
    
    const item = cmdtree[i];
    const action = item.code[0]; // Action type (e.g., "type", "click")
    
    // Fix: Extract value properly for verify commands too
    const value = (action === "type" || action === "select" || action === "verify") ? 
      item.code[1] ? item.code[1].replace(/"/g, "") : null : null;
    
    const xpath = item.code.indexOf("in") > -1 ? 
      item.code[item.code.indexOf("in") + 1] : null; // Extract XPath
    const delay = item.timeout || 500; // Default delay
    
    console.log(`Executing action: ${action}, Value: ${value}, XPath: ${xpath}, Delay: ${delay}`);
    
    try {
      if (action === 'verify') {
        // Handle verify actions - now passing the correct XPath
        await handleVerification(item, xpath, delay, value);
      } else {
        let element = null;
        
        if (action !== "wait") {
          element = await find_element(xpath);
          if (!element) {
            console.error(`Element not found for XPath: ${xpath}`);
            chrome.runtime.sendMessage({ 
              status: 'error', 
              message: `Element not found for XPath: ${xpath}` 
            });
            throw new Error(`Element not found for XPath: ${xpath}`);
          }
        }
        
        await execute(action, element, delay, value, item);
      }
      
      // Update progress only after command execution is complete
      chrome.runtime.sendMessage(
        {
          action: "updateProgress",
          data: { line: i + 1, total: cmdtree.length },
        },
        (response) => {
          console.log("Response from background script (progress):", response);
        }
      );

      // Update logs only after command execution is complete
      chrome.runtime.sendMessage(
        {
          action: "updateLog",
          data: { line: i + 1, desc: `Performed '${action}' on '${xpath}'` },
        },
        (response) => {
          console.log("Response from background script (logs):", response);
        }
      );
      
      // Save the current line as we've successfully completed it
      chrome.storage.local.set({ herbiestartline: i });
      
    } catch (error) {
      console.error(`Error executing command: ${error.message}`);
      chrome.runtime.sendMessage({
        action: "updateLog",
        data: { 
          line: i + 1, 
          desc: `❌ Error: '${action}' on '${xpath}' failed - ${error.message}` 
        }
      });
      
      // Stop execution on error unless configured to continue
      break;
    }
  }
}