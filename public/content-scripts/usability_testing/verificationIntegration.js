/**
 * Verification Integration Module
 * 
 * This module integrates different verification strategies for usability testing,
 * coordinating between text, attribute, state, and page verification systems.
 * It enables passive monitoring of web pages to validate test conditions without
 * direct execution.
 */

// Initialize verification containers if not already present
window.textVerificationObservers = window.textVerificationObservers || [];
window.attributeVerificationObservers = window.attributeVerificationObservers || [];
window.stateVerificationObservers = window.stateVerificationObservers || [];
window.pageVerificationTimers = window.pageVerificationTimers || [];

// Track verification setup status to avoid duplicates
const verificationSetupStatus = new Map();

/**
 * Main message handler for verification integration
 */
chrome.runtime.onMessage.addListener(async function(message, sender, sendResponse) {
    // Handle the setObserver message - this establishes passive verification
    if (message.action === "setObserver") {
        console.log("Setting up verification observers:", message.herbie_object);
        
        try {
            // Clear any existing setup status
            verificationSetupStatus.clear();
            
            // Process all verification items
            if (Array.isArray(message.herbie_object)) {
                // Handle verification items using enhanced system
                await setupAllVerifications(message.herbie_object);
            } else {
                console.error("Invalid herbie_object: expected an array", message.herbie_object);
            }
            
            // Optional: Send response that setup is complete
            if (sendResponse) {
                sendResponse({ status: "success", message: "Verification observers set up successfully" });
            }
        } catch (error) {
            console.error("Error setting up verification observers:", error);
            
            if (sendResponse) {
                sendResponse({ status: "error", message: `Error setting up observers: ${error.message}` });
            }
        }
        
        // Return true to indicate we'll handle the response asynchronously
        return true;
    }
    
 

    // Handle test end to clean up observers
    if (message.action === "endUsabilityTest") {
        console.log("Ending usability test, cleaning up all verification resources");
        
        try {
            // Capture any pending failures before cleanup
            reportPendingFailures();
            
            // Clean up all verification resources
            if (window.verificationManager) {
                window.verificationManager.cleanupAllVerifications();
            } else {
                // Fallback cleanup if the verification manager isn't loaded
                cleanupAllVerificationResources();
            }
            
            // Reset setup status
            verificationSetupStatus.clear();
            
            // Optional: Send response that cleanup is complete
            if (sendResponse) {
                sendResponse({ status: "success", message: "Verification resources cleaned up successfully" });
            }
        } catch (error) {
            console.error("Error cleaning up verification resources:", error);
            
            if (sendResponse) {
                sendResponse({ status: "error", message: `Error during cleanup: ${error.message}` });
            }
        }
    }
    
    // Continue normal processing for other messages
    return false;
});

/**
 * Set up all verifications from the Herbie script
 * @param {Array} verifyItems - Array of verification items
 */
async function setupAllVerifications(verifyItems) {
    const setupPromises = [];
    
    // Process each verification item
    for (const verifyItem of verifyItems) {
        if (!isValidVerificationItem(verifyItem)) {
            console.warn("Skipping invalid verification item:", verifyItem);
            continue;
        }
        
        // Create a unique key for this verification to avoid duplicates
        const verificationKey = `${verifyItem.verifyType}:${verifyItem.src}`;
        
        // Skip if we've already set up this verification
        if (verificationSetupStatus.has(verificationKey)) {
            console.log(`Skipping duplicate verification: ${verificationKey}`);
            continue;
        }
        
        // Mark this verification as being set up
        verificationSetupStatus.set(verificationKey, 'pending');
        
        // Check for element availability for non-page verifications
        if (needsElementVerification(verifyItem)) {
            try {
                // Add to setup promises
                setupPromises.push(setupElementVerification(verifyItem));
            } catch (error) {
                console.error(`Error setting up element verification: ${error.message}`, verifyItem);
                
                // Report error
                reportVerificationSetupFailure(verifyItem, error);
            }
        } else {
            try {
                // Set up page/title verification
                if (window.verificationManager) {
                    const result = window.verificationManager.setupVerificationObserver(verifyItem);
                    
                    // Mark as set up
                    verificationSetupStatus.set(verificationKey, result ? 'active' : 'failed');
                } else {
                    throw new Error("Verification manager not available");
                }
            } catch (error) {
                console.error(`Error setting up page verification: ${error.message}`, verifyItem);
                
                // Report error
                reportVerificationSetupFailure(verifyItem, error);
            }
        }
    }
    
    // Wait for all setup promises to complete
    if (setupPromises.length > 0) {
        try {
            await Promise.all(setupPromises);
        } catch (error) {
            console.error("Error in verification setup:", error);
        }
    }
}

/**
 * Set up verification for an element-based verification item
 * @param {Object} verifyItem - The verification item
 * @returns {Promise} - Promise that resolves when setup is complete
 */
async function setupElementVerification(verifyItem) {
    // Create a unique key for this verification
    const verificationKey = `${verifyItem.verifyType}:${verifyItem.src}`;
    
    try {
        // Special case for 'hidden' state - no need to find the element
        if (verifyItem.verifyType === 'state' && verifyItem.verifyExpected === 'hidden') {
            if (window.verificationManager) {
                const observer = window.verificationManager.setupVerificationObserver(verifyItem);
                verificationSetupStatus.set(verificationKey, observer ? 'active' : 'complete');
            }
            return;
        }
        
        // Try to find the element
        const element = await find_element(verifyItem.verifyLocator);
        
        if (!element) {
            console.warn(`Element not found for verification: ${verifyItem.verifyLocator}`);
            
            // Report element not found
            chrome.runtime.sendMessage({
                action: "verifyStatement",
                data: verifyItem.src,
                result: {
                    success: false,
                    message: `Element not found for verification: ${verifyItem.verifyLocator}`
                }
            });
            
            // Mark as failed
            verificationSetupStatus.set(verificationKey, 'failed');
            return;
        }
        
        // Element found, set up verification observer
        if (window.verificationManager) {
            const observer = window.verificationManager.setupVerificationObserver(verifyItem);
            
            // Mark as set up
            verificationSetupStatus.set(verificationKey, observer ? 'active' : 'complete');
        } else {
            throw new Error("Verification manager not available");
        }
    } catch (error) {
        console.error(`Error setting up element verification: ${error.message}`, verifyItem);
        
        // Report error
        reportVerificationSetupFailure(verifyItem, error);
        
        // Mark as failed
        verificationSetupStatus.set(verificationKey, 'failed');
        
        // Re-throw for Promise.all to catch
        throw error;
    }
}

/**
 * Check if a verification item requires element verification
 * @param {Object} verifyItem - The verification item
 * @returns {boolean} - True if it requires element verification
 */
function needsElementVerification(verifyItem) {
    return verifyItem.verifyLocator && 
           verifyItem.verifyType !== "title" && 
           verifyItem.verifyType !== "url";
}

/**
 * Check if a verification item is valid
 * @param {Object} verifyItem - The verification item to check
 * @returns {boolean} - True if the item is valid
 */
function isValidVerificationItem(verifyItem) {
    return verifyItem && 
           verifyItem.code && 
           Array.isArray(verifyItem.code) && 
           verifyItem.code[0] === "verify" &&
           verifyItem.src &&
           verifyItem.verifyType;
}

/**
 * Report a verification setup failure
 * @param {Object} verifyItem - The verification item
 * @param {Error} error - The error that occurred
 */
function reportVerificationSetupFailure(verifyItem, error) {
    chrome.runtime.sendMessage({
        action: "verifyStatement",
        data: verifyItem.src,
        result: {
            success: false,
            message: `Failed to set up verification: ${error.message}`
        }
    });
}

/**
 * Report any pending verification failures before cleanup
 */
function reportPendingFailures() {
    // Report any pending verifications as failed
    for (const [key, status] of verificationSetupStatus.entries()) {
        if (status === 'pending') {
            const [type, src] = key.split(':', 2);
            
            if (src) {
                chrome.runtime.sendMessage({
                    action: "verifyStatement",
                    data: src,
                    result: {
                        success: false,
                        message: `Verification incomplete: test ended before verification completed`
                    }
                });
            }
        }
    }
}

/**
 * Clean up all verification resources (fallback)
 */
function cleanupAllVerificationResources() {
    // Clean up text verification observers
    if (window.textVerificationObservers && window.textVerificationObservers.length > 0) {
        window.textVerificationObservers.forEach(observer => {
            try {
                if (observer && typeof observer.disconnect === 'function') {
                    observer.disconnect();
                }
            } catch (error) {
                console.error("Error disconnecting text observer:", error);
            }
        });
        window.textVerificationObservers = [];
    }
    
    // Clean up attribute verification observers
    if (window.attributeVerificationObservers && window.attributeVerificationObservers.length > 0) {
        window.attributeVerificationObservers.forEach(observer => {
            try {
                if (observer && typeof observer.disconnect === 'function') {
                    observer.disconnect();
                }
                // Clean up any interval timers
                if (observer && observer.intervalCheck) {
                    clearInterval(observer.intervalCheck);
                }
            } catch (error) {
                console.error("Error disconnecting attribute observer:", error);
            }
        });
        window.attributeVerificationObservers = [];
    }
    
    // Clean up state verification observers
    if (window.stateVerificationObservers && window.stateVerificationObservers.length > 0) {
        window.stateVerificationObservers.forEach(observer => {
            try {
                if (observer && typeof observer.disconnect === 'function') {
                    observer.disconnect();
                }
            } catch (error) {
                console.error("Error disconnecting state observer:", error);
            }
        });
        window.stateVerificationObservers = [];
    }
    
    // Clean up page verification timers
    if (window.pageVerificationTimers && window.pageVerificationTimers.length > 0) {
        window.pageVerificationTimers.forEach(timerObj => {
            try {
                if (timerObj) {
                    if (timerObj.checkInterval) {
                        clearInterval(timerObj.checkInterval);
                    }
                    if (timerObj.failTimeout) {
                        clearTimeout(timerObj.failTimeout);
                    }
                }
            } catch (error) {
                console.error("Error clearing page timer:", error);
            }
        });
        window.pageVerificationTimers = [];
    }
}

console.log("Enhanced verification integration system initialized");