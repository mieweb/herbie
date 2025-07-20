/**
 * State Verification Module
 * Handles verification of element states (visible, enabled, checked, disabled, hidden)
 * 
 * This module sets up observers to monitor elements for specific states and reports
 * verification results back to the background script.
 */

// Store active observers to allow cleanup
window.stateVerificationObservers = window.stateVerificationObservers || [];

/**
 * Sets up an observer to verify element states
 * @param {Object} verifyData - The verification data object containing state expectations
 * @param {Function} callback - Optional callback to execute when verification succeeds
 * @returns {MutationObserver|null} - The created observer or null if immediate verification
 */
async function setupStateVerificationObserver(verifyData, callback) {
    // Validate verification data
    if (!verifyData || !verifyData.verifyExpected || !verifyData.src) {
        console.error("Invalid verification data: missing required properties");
        
        // Report immediately as failed verification
        chrome.runtime.sendMessage({
            action: "verifyStatement",
            data: verifyData?.src || "unknown verification",
            result: {
                success: false,
                message: "Invalid verification data: missing required properties"
            }
        });
        
        return null;
    }
    
    // For 'hidden' state, we might not find the element (which is expected)
    const isHiddenCheck = verifyData.verifyExpected === 'hidden';
    
    // If we have a locator, try to find the element
    let element = null;
    if (verifyData.verifyLocator) {
        try {
            element = await find_element(verifyData.verifyLocator);
            console.log(`Element for state verification ${isHiddenCheck ? '(hidden check)' : ''}:`, 
                element ? "Found" : "Not found");
        } catch (error) {
            console.error(`Error finding element for state verification: ${error.message}`);
            // Report as failed verification
            chrome.runtime.sendMessage({
                action: "verifyStatement",
                data: verifyData.src,
                result: {
                    success: false,
                    message: `Error finding element: ${error.message}`
                }
            });
            return null;
        }
    }
    
    // For 'hidden' state, if element is not found, it's considered a success
    if (isHiddenCheck && !element) {
        console.log("Element not found, which matches 'hidden' state requirement");
        
        // Send verification success to background
        chrome.runtime.sendMessage({
            action: "verifyStatement",
            data: verifyData.src,
            result: {
                success: true,
                message: `State verification passed: element is hidden (not in DOM)`
            }
        });
        
        // Execute callback if provided
        if (typeof callback === 'function') {
            try {
                callback(true);
            } catch (error) {
                console.error("Error in callback after successful hidden verification:", error);
            }
        }
        
        return null; // No observer needed
    }
    
    // If we're not checking for hidden and element is not found, report failure
    if (!isHiddenCheck && !element) {
        console.warn(`Element not found for state verification: ${verifyData.verifyLocator}`);
        
        // Report as failed verification
        chrome.runtime.sendMessage({
            action: "verifyStatement",
            data: verifyData.src,
            result: {
                success: false,
                message: `Element not found for state verification: ${verifyData.verifyLocator}`
            }
        });
        
        return null;
    }
    
    // Perform immediate verification check before setting up observer
    const immediateResult = performStateVerification(element, verifyData);
    if (immediateResult.success) {
        // If it's already verified, report it and don't set up an observer
        console.log(`Immediate state verification passed: ${verifyData.verifyExpected}`);
        
        chrome.runtime.sendMessage({
            action: "verifyStatement",
            data: verifyData.src,
            result: immediateResult
        });
        
        if (typeof callback === 'function') {
            try {
                callback(true);
            } catch (error) {
                console.error("Error in callback after immediate verification:", error);
            }
        }
        
        return null;
    }
    
    // Create a mutation observer to watch for changes
    const observer = new MutationObserver(mutations => {
        try {
            // Check if element is still in the DOM
            const inDom = element ? document.body.contains(element) : false;
            
            // Hidden check - if it's not in DOM, that satisfies hidden
            if (isHiddenCheck && !inDom) {
                console.log(`State verification passed: element is hidden (not in DOM)`);
                
                // Send verification result to background
                chrome.runtime.sendMessage({
                    action: "verifyStatement",
                    data: verifyData.src,
                    result: {
                        success: true,
                        message: `State verification passed: element is hidden (not in DOM)`
                    }
                });
                
                // Execute callback if provided
                if (typeof callback === 'function') {
                    try {
                        callback(true);
                    } catch (error) {
                        console.error("Error in callback after hidden verification:", error);
                    }
                }
                
                // Disconnect observer once verified
                observer.disconnect();
                
                // Remove from active observers list
                const index = window.stateVerificationObservers.indexOf(observer);
                if (index > -1) {
                    window.stateVerificationObservers.splice(index, 1);
                }
                
                return;
            }
            
            // Proceed only if element is in DOM (except for hidden check)
            if (inDom) {
                const verificationResult = performStateVerification(element, verifyData);
                
                // If verification passes, trigger callback
                if (verificationResult.success) {
                    console.log(`State verification passed: ${verifyData.verifyExpected}`);
                    
                    // Send verification result to background
                    chrome.runtime.sendMessage({
                        action: "verifyStatement",
                        data: verifyData.src,
                        result: verificationResult
                    });
                    
                    // Execute callback if provided
                    if (typeof callback === 'function') {
                        try {
                            callback(true);
                        } catch (error) {
                            console.error("Error in callback after successful verification:", error);
                        }
                    }
                    
                    // Disconnect observer once verified
                    observer.disconnect();
                    
                    // Remove from active observers list
                    const index = window.stateVerificationObservers.indexOf(observer);
                    if (index > -1) {
                        window.stateVerificationObservers.splice(index, 1);
                    }
                }
            }
        } catch (error) {
            console.error("Error in mutation observer handler:", error);
        }
    });
    
    // Start observing with optimized configuration for better performance
    try {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'disabled', 'checked', 'hidden', 'display', 'visibility'],
            characterData: false  // We don't need text changes for state verification
        });
        
        // Add to active observers list
        window.stateVerificationObservers.push(observer);
        
        return observer;
    } catch (error) {
        console.error("Error setting up observer:", error);
        
        // Report as failed verification
        chrome.runtime.sendMessage({
            action: "verifyStatement",
            data: verifyData.src,
            result: {
                success: false,
                message: `Error setting up observer: ${error.message}`
            }
        });
        
        return null;
    }
}

/**
 * Performs state verification on an element
 * @param {Element} element - The DOM element to verify
 * @param {Object} verifyData - The verification data object
 * @returns {Object} - Result object with success and message properties
 */
function performStateVerification(element, verifyData) {
    if (!element) {
        return {
            success: false,
            message: "Cannot verify state: element is null"
        };
    }
    
    const state = verifyData.verifyExpected;
    let result = false;
    let additionalInfo = '';
    
    try {
        switch (state) {
            case "visible":
                const style = window.getComputedStyle(element);
                result = style.display !== "none" && 
                         style.visibility !== "hidden" && 
                         element.offsetWidth > 0 && 
                         element.offsetHeight > 0;
                
                if (!result) {
                    // Add detailed information about why it's not visible
                    if (style.display === "none") additionalInfo = "display is 'none'";
                    else if (style.visibility === "hidden") additionalInfo = "visibility is 'hidden'";
                    else if (element.offsetWidth === 0 || element.offsetHeight === 0) 
                        additionalInfo = `element has no size (${element.offsetWidth}×${element.offsetHeight})`;
                }
                break;
                
            case "hidden":
                const hiddenStyle = window.getComputedStyle(element);
                result = hiddenStyle.display === "none" || 
                         hiddenStyle.visibility === "hidden" || 
                         element.offsetWidth === 0 || 
                         element.offsetHeight === 0;
                
                if (!result) {
                    additionalInfo = `element is visible (${element.offsetWidth}×${element.offsetHeight})`;
                }
                break;
                
            case "enabled":
                result = !element.disabled;
                if (!result) additionalInfo = "element has 'disabled' attribute";
                break;
                
            case "disabled":
                result = element.disabled === true;
                if (!result) additionalInfo = "element doesn't have 'disabled' attribute";
                break;
                
            case "checked":
                result = element.checked === true;
                if (!result) additionalInfo = "element is not checked";
                break;
                
            default:
                return {
                    success: false,
                    message: `Unknown state: ${state}`
                };
        }
    } catch (error) {
        return {
            success: false,
            message: `Error verifying state: ${error.message}`
        };
    }
    
    return {
        success: result,
        message: result ? 
            `State verification passed: element is ${state}` : 
            `State verification failed: element is not ${state}${additionalInfo ? ` (${additionalInfo})` : ''}`
    };
}

/**
 * Cleanup observer and any associated resources
 * @param {MutationObserver} observer - The observer to clean up
 */
function cleanupObserver(observer) {
    if (!observer) return;
    
    try {
        // Disconnect the observer
        observer.disconnect();
    } catch (error) {
        console.error("Error cleaning up observer:", error);
    }
}

/**
 * Clean up all active observers
 */
function cleanupAllObservers() {
    if (window.stateVerificationObservers && window.stateVerificationObservers.length > 0) {
        console.log(`Cleaning up ${window.stateVerificationObservers.length} state verification observers`);
        
        window.stateVerificationObservers.forEach(observer => {
            try {
                cleanupObserver(observer);
            } catch (error) {
                console.error("Error during observer cleanup:", error);
            }
        });
        
        window.stateVerificationObservers = [];
    }
}

// Export functions for use in other modules
window.stateVerification = {
    setupStateVerificationObserver,
    cleanupObserver,
    cleanupAllObservers
};