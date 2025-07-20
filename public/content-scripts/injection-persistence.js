/**
 * Injection Persistence Content Script
 * Handles automatic re-injection of components on page load
 */

console.log('Injection persistence script loaded');

// Track if we've already attempted injection on this page
let injectionAttempted = false;

// Wait for DOM to be ready
function waitForDOM() {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}

// Check for existing injection and re-inject if needed
async function checkAndReinject() {
  if (injectionAttempted) {
    return;
  }
  
  injectionAttempted = true;
  
  try {
    // Wait for DOM to be ready
    await waitForDOM();
    
    // Get injection state from storage
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['injectedComponent'], resolve);
    });
    
    if (result.injectedComponent && result.injectedComponent.isActive) {
      const { componentName, mountId } = result.injectedComponent;
      
      // Check if component is already on the page
      if (document.getElementById(mountId)) {
        console.log('Component already exists on page');
        return;
      }
      
      console.log('Re-injecting component:', componentName);
      
      // Send message to background script to handle injection
      chrome.runtime.sendMessage({
        action: 'reinjectComponent',
        tabId: 'current'
      });
    }
  } catch (error) {
    console.error('Error during persistence check:', error);
  }
}

// Start the check process
checkAndReinject();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkInjectionStatus') {
    // Check if our component exists
    const result = chrome.storage.local.get(['injectedComponent'], (result) => {
      if (result.injectedComponent) {
        const exists = !!document.getElementById(result.injectedComponent.mountId);
        sendResponse({ exists, componentData: result.injectedComponent });
      } else {
        sendResponse({ exists: false, componentData: null });
      }
    });
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'manualReinject') {
    injectionAttempted = false;
    checkAndReinject();
    sendResponse({ status: 'triggered' });
  }
});

// Also check when the page becomes visible (tab switching)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Small delay to ensure page is ready
    setTimeout(() => {
      injectionAttempted = false;
      checkAndReinject();
    }, 500);
  }
});

// Observe for dynamic content changes that might remove our component
const observer = new MutationObserver((mutations) => {
  // Check if we need to re-inject after DOM changes
  chrome.storage.local.get(['injectedComponent'], (result) => {
    if (result.injectedComponent && result.injectedComponent.isActive) {
      const { mountId } = result.injectedComponent;
      if (!document.getElementById(mountId)) {
        console.log('Component removed from DOM, attempting re-injection');
        setTimeout(() => {
          injectionAttempted = false;
          checkAndReinject();
        }, 1000);
      }
    }
  });
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  observer.disconnect();
});