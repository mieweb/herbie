import { ParseScript } from '../parser/parser.js';
import { handleParseLine, handleParseScript } from './utils/parseUtils.js';
import { handleRunScript, handleExecuteScript } from './utils/runUtils.js';
import { log, warn, error, info, debug } from './utils/logger.js'; // Import centralized logging

// ============================================================================
// GLOBAL STATE VARIABLES
// ============================================================================
let line = 0;
let cmdtree = null;
let verifyStmpts = {};
let usabilityHerbieScript = null;
let usabilityHerbieScriptParsed = null;

// ============================================================================
// CORE MESSAGE ROUTER
// ============================================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log("Background received message:", message.action);

  // Route to appropriate handler
  switch (message.action) {
    // Script Processing
    case 'parseLine':
      return handleParseLineMessage(message, sendResponse);
    case 'parseScript':
      return handleParseScriptMessage(message, sendResponse);
    case 'runScript':
      return handleRunScriptMessage(message, sendResponse);
    case 'excuteScript':
      return handleExecuteScriptMessage(message, sendResponse);

    // Progress and Logging
    case 'updateProgress':
      return handleProgressUpdate(message, sendResponse);
    case 'updateResult':
      return handleResultUpdate(message, sendResponse);
    case 'updateLog':
      return handleLogUpdate(message, sendResponse);

    // Usability Testing
    case 'startUsabilityTest':
      return handleStartUsabilityTest(message, sendResponse);
    case 'endUsabilityTest':
      return handleEndUsabilityTest(message, sendResponse);
    case 'setupUsabilityObservers':
      return handleSetupUsabilityObservers(message, sendResponse);
    case 'setObserver':
      return handleSetObserver(message, sendResponse);

    // Verification
    case 'verifyStatement':
      return handleVerifyStatement(message, sendResponse);

    // Element Inspection
    case 'startInspection':
      return handleStartInspection(message, sendResponse);
    case 'xpathCaptured':
      return handleXPathCaptured(message, sendResponse);
    case 'inspectionCancelled':
      return handleInspectionCancelled(message, sendResponse);

    // Component Injection State Management
    case 'setInjectionState':
      return handleSetInjectionState(message, sendResponse);
    case 'clearInjectionState':
      return handleClearInjectionState(message, sendResponse);
    case 'getInjectionState':
      return handleGetInjectionState(message, sendResponse);

    // Legacy/Other
    case 'executeScriptFromInject':
      return handleExecuteScriptFromInject(message, sendResponse);

    case 'setTesterName':
      return handleSetTesterName(message, sendResponse);
    case 'getTesterName':
      return handleGetTesterName(message, sendResponse);

    default:
      warn("Unhandled message action:", message.action);
      return false;
  }
});

// ============================================================================
// SCRIPT PROCESSING HANDLERS
// ============================================================================
async function handleParseLineMessage(message, sendResponse) {
  try {
    await handleParseLine(message.payload, sendResponse);
  } catch (err) {
    error("Error in handleParseLine:", err);
    sendResponse({ status: 'error', message: err.message });
  }
  return true;
}

async function handleParseScriptMessage(message, sendResponse) {
  try {
    await handleParseScript(message.payload, sendResponse);
  } catch (err) {
    error("Error in handleParseScript:", err);
    sendResponse({ status: 'error', message: err.message });
  }
  return true;
}

async function handleRunScriptMessage(message, sendResponse) {
  try {
    await handleRunScript(message.payload, sendResponse);
  } catch (err) {
    error("Error in handleRunScript:", err);
    sendResponse({ status: 'error', message: err.message });
  }
  return true;
}

async function handleExecuteScriptMessage(message, sendResponse) {
  try {
    cmdtree = await handleExecuteScript(message.payload, sendResponse);
  } catch (err) {
    error("Error in handleExecuteScript:", err);
    sendResponse({ status: 'error', message: err.message });
  }
  return true;
}

// ============================================================================
// PROGRESS AND LOGGING HANDLERS
// ============================================================================
function handleProgressUpdate(message, sendResponse) {
  log("Message received in popup:", message.data);
  chrome.runtime.sendMessage({
    action: "updatePopupProgressBar",
    data: message.data,
  });
  sendResponse({ status: "Message relayed to popup" });
  return true;
}

function handleResultUpdate(message, sendResponse) {
  log("Message received in popup:", message.data);
  chrome.runtime.sendMessage({
    action: "updatePopupResult",
    data: message.data,
  });
  sendResponse({ status: "Message relayed to popup" });
  return true;
}

function handleLogUpdate(message, sendResponse) {
  log("Message received in popup:", message.data);
  chrome.runtime.sendMessage({
    action: "updateLogPopup",
    data: message.data,
  });
  line = message.data.line;
  sendResponse({ status: "Message relayed to popup" });
  return true;
}

// ============================================================================
// USABILITY TESTING HANDLERS
// ============================================================================
async function handleStartUsabilityTest(message, sendResponse) {
  try {
    log("Starting usability test:", message.testerName);

    // Parse the Herbie script
    usabilityHerbieScript = message.testHerbieScript;
    usabilityHerbieScriptParsed = await ParseScript(usabilityHerbieScript);
    log("Parsed usability script:", usabilityHerbieScriptParsed);

    // Initialize verification statements
    verifyStmpts = {};

    // Add each verification statement from the parsed script with initial false status
    if (Array.isArray(usabilityHerbieScriptParsed)) {
      usabilityHerbieScriptParsed.forEach(command => {
        if (command.code[0] === "verify") {
          verifyStmpts[command.src] = {
            message: "Verification not yet met",
            success: false
          };
        }
      });
    }

    // Create test details with both raw and parsed scripts
    const testDetails = {
      taskId: message.taskId,
      taskName: message.taskName,
      testerName: message.testerName,
      description: message.description,
      status: "in-progress",
      startTime: Date.now(),
      herbieScript: usabilityHerbieScript,
      herbieScriptParsed: usabilityHerbieScriptParsed,
      initialVerifyStmpts: JSON.parse(JSON.stringify(verifyStmpts))
    };

    // Save to Chrome storage
    chrome.storage.local.set({ [`usabilityTest`]: testDetails }, () => {
      log(`Stored usability test: ${message.taskId}`);
    });

    sendResponse({ status: "success", message: `Usability test started for ${message.taskId}` });
  } catch (err) {
    error("Error starting usability test:", err);
    sendResponse({ status: "error", message: err.message });
  }
  return true;
}

async function handleEndUsabilityTest(message, sendResponse) {
  try {
    await chrome.storage.local.set({ trackingEnabled: false }, () => {
      log("User interaction tracking stopped.");
    });

    await chrome.storage.local.set({ trackingEnabled: false, userActions: [] }, () => {
      log("User interaction tracking stopped. Cleared stored interactions.");
    });

    await chrome.storage.local.set({ trackingEnabled: false, userActions: [] });

    let testResults = {
      "taskId": message.taskId,
      "time": message.time,
      "verify_statements": JSON.stringify(verifyStmpts),
      "taskName": message.taskName,
      "testerName": message.testerName,
    };

    sendTestResultsToTargetTab(testResults);

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "showConfetti",
          testData: {
            taskId: message.taskId,
            taskName: message.taskName,
            testerName: message.testerName,
            time: message.time
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            log("Confetti message failed:", chrome.runtime.lastError.message);
          } else {
            log("🎉 Confetti triggered successfully:", response);
          }
        });
      }
    } catch (confettiError) {
      log("Error showing confetti:", confettiError);
    }


    const response = await fetch("http://localhost:3000/api/usability-test-results ", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Herbie-Version': chrome.runtime.getManifest()?.version || '2.2',
                    'X-Request-Source': 'herbie-extension'
                },
                body: JSON.stringify(testResults),
    });

    // Clear verification statements
    for (const key in verifyStmpts) {
      if (Object.prototype.hasOwnProperty.call(verifyStmpts, key)) {
        delete verifyStmpts[key];
      }
    }

    sendResponse({ status: "Test results processed and sent." });
  } catch (err) {
    error("Error ending usability test:", err);
    sendResponse({ status: "error", message: err.message });
  }
  return true;
}

async function handleSetupUsabilityObservers(message, sendResponse) {
  try {
    log("Setting up usability observers specifically");

    // Parse the script for this specific URL
    const result = await ParseScript(message.herbieScript, message.url);
    log("Parsed usability script:", result);

    // Send to content script with a specific action for usability
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'setUsabilityObserver',
      herbie_object: result,
      isUsabilityAutoSetup: true
    });

    sendResponse({ status: 'success', message: 'Usability observers setup initiated' });
  } catch (err) {
    error("Error setting up usability observers:", err);
    sendResponse({ status: 'error', message: err.message });
  }
  return true;
}

async function handleSetObserver(message, sendResponse) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0 || !tabs[0].id) {
      error("No active tab found");
      sendResponse({ status: 'error', message: 'No active tab found' });
      return false;
    }

    const activeTabId = tabs[0].id;
    const currentUrl = tabs.length > 0 ? tabs[0].url : '';

    const result = await ParseScript(message.herbie_script, currentUrl);
    log("Parsed script for observer:", result);

    chrome.tabs.sendMessage(activeTabId, {
      action: 'setObserver',
      herbie_object: result
    });

    sendResponse({ status: 'success' });
  } catch (err) {
    error("Error setting observer:", err);
    sendResponse({ status: 'error', message: err.message });
  }
  return true;
}

// ============================================================================
// VERIFICATION HANDLERS
// ============================================================================
function handleVerifyStatement(message, sendResponse) {
  // Store all verification attempts, whether successful or not
  const data = message.data; // The verification statement text

  if (message.result) {
    // If we have a result object, store it with success status
    verifyStmpts[data] = {
      message: message.result.message,
      success: message.result.success || false
    };
  } else {
    // If no result object was provided, record it as a failed verification
    verifyStmpts[data] = {
      message: "Verification condition was not met during test",
      success: false
    };
  }

  sendResponse({ status: "Verification statement processed" });
  return true;
}

// ============================================================================
// ELEMENT INSPECTION HANDLERS
// ============================================================================
function handleStartInspection(message, sendResponse) {
  // Get the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const activeTab = tabs[0];

      // Send message to content script
      chrome.tabs.sendMessage(
        activeTab.id,
        { action: 'enableInspector' },
        (response) => {
          if (chrome.runtime.lastError) {
            error("Error communicating with content script:", chrome.runtime.lastError.message);
            sendResponse({
              status: 'error',
              message: 'Failed to enable inspector: ' + chrome.runtime.lastError.message
            });
          } else {
            log('Response from content script:', response);
            sendResponse(response);
          }
        }
      );
    } else {
      sendResponse({ status: 'error', message: 'No active tab found' });
    }
  });

  return true;
}

function handleXPathCaptured(message, sendResponse) {
  // Store the captured XPath in chrome.storage.local
  chrome.storage.local.set({ capturedXPath: message.xpath }, () => {
    log('XPath stored in storage:', message.xpath);

    // Forward the message to the popup if it's open
    chrome.runtime.sendMessage({
      action: 'updateXPathField',
      xpath: message.xpath
    });
  });

  return true;
}

function handleInspectionCancelled(message, sendResponse) {
  // Forward the cancellation message to the popup if it's open
  chrome.runtime.sendMessage({
    action: 'inspectionCancelled'
  });

  return true;
}

// ============================================================================
// COMPONENT INJECTION STATE HANDLERS
// ============================================================================
async function handleSetInjectionState(message, sendResponse) {
  try {
    await chrome.storage.local.set({
      injectedComponent: {
        ...message.componentData,
        isActive: true,
        timestamp: Date.now()
      }
    });
    sendResponse({ status: 'success', message: 'Injection state saved' });
  } catch (err) {
    sendResponse({ status: 'error', message: err.message });
  }
  return true;
}

async function handleClearInjectionState(message, sendResponse) {
  try {
    await chrome.storage.local.remove(['injectedComponent']);
    sendResponse({ status: 'success', message: 'Injection state cleared' });
  } catch (err) {
    sendResponse({ status: 'error', message: err.message });
  }
  return true;
}

async function handleGetInjectionState(message, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['injectedComponent']);
    sendResponse({
      status: 'success',
      data: result.injectedComponent || null
    });
  } catch (err) {
    sendResponse({ status: 'error', message: err.message });
  }
  return true;
}

// ============================================================================
// LEGACY HANDLERS
// ============================================================================
function handleExecuteScriptFromInject(message, sendResponse) {
  log("Hi from injected herbie");
  sendResponse({ status: "Hi from bg" });
  return true;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function sendTestResultsToTargetTab(testResults) {
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      if (tab.title && tab.title.includes("Usability Testing")) {
        chrome.tabs.sendMessage(tab.id, {
          action: "updateUsabilityResults",
          data: testResults
        }, (response) => {
          log("Sent test results to tab titled:", tab.title, response);
        });
        return; // Stop after finding the first matching tab
      }
    }
    log("No active tab found with 'Usability Testing' in the title");
  });
}

// ============================================================================
// NAVIGATION LISTENERS
// ============================================================================
chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
  log("\nNavigating to :" + details.url + "\n");
  log("Current line:", line);
});

// Enhanced navigation listener for component re-injection
chrome.webNavigation.onDOMContentLoaded.addListener(async (details) => {
  log("\nNavigating to :" + details.url + "\n");
  log("Current line:", line);

  // Only handle main frame navigations (not iframes)
  if (details.frameId === 0) {
    // Check if we need to re-inject components
    await handleComponentReinjection(details.tabId, details.url);
  }
});

// ============================================================================
// COMPONENT REINJECTION FUNCTIONALITY
// ============================================================================
async function handleComponentReinjection(tabId, url) {å
  try {
    // Get injection state from storage
    const result = await chrome.storage.local.get(['injectedComponent']);

    if (result.injectedComponent && result.injectedComponent.isActive) {
      log('Found active injection, re-injecting on new page:', url);

      // Import and use the re-injection function
      try {
        const { checkAndReinject } = await import('../utils/injectComponent.js');
        await checkAndReinject(tabId);
      } catch (importError) {
        error('Error importing injection utilities, using fallback:', importError);
        await reinjeetComponentDirect(tabId);
      }
    }
  } catch (err) {
    error('Error during component re-injection:', err);
  }
}

// Direct re-injection fallback function
async function reinjeetComponentDirect(tabId) {
  try {
    const result = await chrome.storage.local.get(['injectedComponent']);

    if (result.injectedComponent && result.injectedComponent.isActive) {
      const { componentName, scriptPath, cssPath, props, mountId } = result.injectedComponent;

      log('Re-injecting component on new page...');

      // Wait a bit for page to be ready
      setTimeout(async () => {
        try {
          // Inject styles
          if (cssPath) {
            await chrome.scripting.insertCSS({
              target: { tabId },
              files: [cssPath]
            });
          }

          // Inject script
          await chrome.scripting.executeScript({
            target: { tabId },
            files: [scriptPath]
          });

          // Mount component
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (id, componentName, props) => {
              // Check if already exists
              if (document.getElementById(id)) {
                console.log('Component already exists, skipping injection');
                return;
              }

              const mountEl = document.createElement('div');
              mountEl.id = id;
              document.body.insertBefore(mountEl, document.body.firstChild);

              const ComponentClass = window[componentName];
              if (ComponentClass) {
                new ComponentClass({
                  target: mountEl,
                  props
                });
                console.log(`Re-injected ${componentName} successfully`);
              } else {
                console.error(`Component ${componentName} not found during re-injection`);
                // Retry after a short delay
                setTimeout(() => {
                  const retryClass = window[componentName];
                  if (retryClass) {
                    new retryClass({ target: mountEl, props });
                    console.log(`Re-injected ${componentName} on retry`);
                  }
                }, 500);
              }
            },
            args: [mountId, componentName, props]
          });
        } catch (err) {
          error('Error during re-injection:', err);
        }
      }, 1500); // 1.5 second delay to ensure page is loaded
    }
  } catch (err) {
    error('Error checking for re-injection:', err);
  }
}


async function handleSetTesterName(message, sendResponse) {
  try {
    const { testerName } = message;
    
    // Store tester name persistently
    await chrome.storage.local.set({ 
      persistentTesterName: testerName,
      testerNameLastUpdated: Date.now()
    });
    
    console.log(`Stored tester name: ${testerName}`);
    sendResponse({ status: 'success', message: 'Tester name saved' });
  } catch (error) {
    console.error("Error storing tester name:", error);
    sendResponse({ status: 'error', message: error.message });
  }
  return true;
}

async function handleGetTesterName(message, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['persistentTesterName', 'testerNameLastUpdated']);
    
    sendResponse({ 
      status: 'success', 
      data: {
        testerName: result.persistentTesterName || null,
        lastUpdated: result.testerNameLastUpdated || null
      }
    });
  } catch (error) {
    console.error("Error retrieving tester name:", error);
    sendResponse({ status: 'error', message: error.message });
  }
  return true;
}
