/**
 * Attribute Verification Module
 * Handles verification of element attributes (value, placeholder, etc.)
 * 
 * This module monitors HTML elements for specific attribute values and reports
 * verification results back to the background script.
 */

// Store active observers to allow cleanup
window.attributeVerificationObservers = window.attributeVerificationObservers || [];

/**
 * Sets up an observer to verify element attributes
 * @param {Object} verifyData - The verification data object
 * @param {Function} callback - Optional callback to execute when verification succeeds
 * @returns {MutationObserver|null} - The created observer or null if immediate verification
 */
async function setupAttributeVerificationObserver(verifyData, callback) {
    // Validate verification data
    if (!verifyData || !verifyData.verifyLocator || !verifyData.verifyType || !verifyData.src) {
        console.error("Invalid verification data for attribute verification:", verifyData);
        
        // Report as failed verification
        chrome.runtime.sendMessage({
            action: "verifyStatement",
            data: verifyData?.src || "unknown verification",
            result: {
                success: false,
                message: "Invalid attribute verification data: missing required properties"
            }
        });
        
        return null;
    }
    
    // Find the element to observe
    let element;
    try {
        element = await find_element(verifyData.verifyLocator);
        console.log(`Element for attribute verification (${verifyData.verifyType}):`, 
            element ? "Found" : "Not found");
    } catch (error) {
        console.error(`Error finding element for attribute verification: ${error.message}`);
        
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
    
    if (!element) {
        console.warn(`Element not found for attribute verification: ${verifyData.verifyLocator}`);
        
        // Report as failed verification
        chrome.runtime.sendMessage({
            action: "verifyStatement",
            data: verifyData.src,
            result: {
                success: false,
                message: `Element not found for attribute verification: ${verifyData.verifyLocator}`
            }
        });
        
        return null;
    }
    
    // Perform immediate verification check before setting up observer
    const immediateResult = performAttributeVerification(element, verifyData);
    if (immediateResult.success) {
        // If it's already verified, report it and don't set up an observer
        console.log(`Immediate attribute verification passed: ${verifyData.verifyType} ${verifyData.verifyOperator || "contains"} "${verifyData.verifyExpected}"`);
        
        chrome.runtime.sendMessage({
            action: "verifyStatement",
            data: verifyData.src,
            result: immediateResult
        });
        
        // Execute callback if provided
        if (typeof callback === 'function') {
            try {
                callback(true);
            } catch (error) {
                console.error("Error in callback after immediate attribute verification:", error);
            }
        }
        
        return null;
    }
    
    // Create a mutation observer to watch for attribute changes
    const observer = new MutationObserver(mutations => {
        try {
            // Check if element is still in the DOM
            const inDom = document.body.contains(element);
            
            // Check if element is available in the DOM
            if (inDom) {
                const verificationResult = performAttributeVerification(element, verifyData);
                
                // If verification passes, trigger callback
                if (verificationResult.success) {
                    console.log(`Attribute verification passed: ${verifyData.verifyType} ${verifyData.verifyOperator || "contains"} "${verifyData.verifyExpected}"`);
                    
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
                            console.error("Error in callback after attribute verification:", error);
                        }
                    }
                    
                    // Disconnect observer once verified
                    observer.disconnect();
                    
                    // Remove from active observers list
                    const index = window.attributeVerificationObservers.indexOf(observer);
                    if (index > -1) {
                        window.attributeVerificationObservers.splice(index, 1);
                    }
                }
            } else {
                // Element is no longer in DOM, report failure if not already reported
                console.warn(`Element removed from DOM during attribute verification: ${verifyData.verifyLocator}`);
                
                // We only report this once to avoid spam
                if (!observer.elementRemovedReported) {
                    chrome.runtime.sendMessage({
                        action: "verifyStatement",
                        data: verifyData.src,
                        result: {
                            success: false,
                            message: `Element removed from DOM during attribute verification: ${verifyData.verifyLocator}`
                        }
                    });
                    
                    observer.elementRemovedReported = true;
                    
                    // Clean up the observer since the element is gone
                    const index = window.attributeVerificationObservers.indexOf(observer);
                    if (index > -1) {
                        window.attributeVerificationObservers.splice(index, 1);
                    }
                    
                    observer.disconnect();
                }
            }
        } catch (error) {
            console.error("Error in attribute verification mutation observer:", error);
        }
    });
    
    // Determine which attribute to monitor specifically
    const attributeToWatch = determineAttributeToMonitor(element, verifyData.verifyType);
    
    // Start observing with optimized configuration
    try {
        observer.observe(element, {
            attributes: true,
            attributeFilter: [attributeToWatch],
            characterData: true,
            childList: false,
            subtree: false
        });
        
        // Add an interval check for properties that might not trigger mutation events
        // (like 'value' which can change programmatically without attribute change)
        if (['value', 'checked', 'selected'].includes(verifyData.verifyType)) {
            const intervalCheck = setInterval(() => {
                try {
                    if (!document.body.contains(element)) {
                        clearInterval(intervalCheck);
                        return;
                    }
                    
                    const result = performAttributeVerification(element, verifyData);
                    if (result.success) {
                        // Clear interval and trigger success
                        clearInterval(intervalCheck);
                        
                        console.log(`Attribute verification passed (interval check): ${verifyData.verifyType}`);
                        
                        // Send verification result to background
                        chrome.runtime.sendMessage({
                            action: "verifyStatement",
                            data: verifyData.src,
                            result: result
                        });
                        
                        // Execute callback if provided
                        if (typeof callback === 'function') {
                            try {
                                callback(true);
                            } catch (error) {
                                console.error("Error in callback after interval verification:", error);
                            }
                        }
                        
                        // Disconnect observer
                        observer.disconnect();
                        
                        // Remove from active observers list
                        const index = window.attributeVerificationObservers.indexOf(observer);
                        if (index > -1) {
                            window.attributeVerificationObservers.splice(index, 1);
                        }
                    }
                } catch (error) {
                    console.error("Error in interval check:", error);
                    clearInterval(intervalCheck);
                }
            }, 500);
            
            // Store interval ID for cleanup
            observer.intervalCheck = intervalCheck;
        }
        
        // Add to active observers list
        window.attributeVerificationObservers.push(observer);
        
        return observer;
    } catch (error) {
        console.error("Error setting up attribute verification observer:", error);
        
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
 * Determine which DOM attribute to monitor based on verification type
 * @param {Element} element - The DOM element
 * @param {string} verifyType - The type of verification (e.g., 'value', 'placeholder')
 * @returns {string} - The attribute name to monitor
 */
function determineAttributeToMonitor(element, verifyType) {
    switch (verifyType) {
        case 'value':
            return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || 
                element.tagName === 'SELECT' ? 'value' : 'textContent';
        case 'placeholder':
            return 'placeholder';
        case 'href':
            return 'href';
        case 'src':
            return 'src';
        case 'alt':
            return 'alt';
        case 'title':
            return 'title';
        case 'class':
            return 'class';
        case 'id':
            return 'id';
        case 'name':
            return 'name';
        case 'checked':
            return 'checked';
        case 'selected':
            return 'selected';
        case 'disabled':
            return 'disabled';
        case 'readonly':
            return 'readonly';
        case 'required':
            return 'required';
        default:
            // Default to the attribute name itself
            return verifyType;
    }
}

/**
 * Performs attribute verification on an element
 * @param {Element} element - The DOM element to verify
 * @param {Object} verifyData - The verification data object
 * @returns {Object} - Result object with success and message properties
 */
function performAttributeVerification(element, verifyData) {
    if (!element) {
        return {
            success: false,
            message: "Cannot verify attribute: element is null"
        };
    }
    
    const attributeName = verifyData.verifyType; // 'value', 'placeholder', etc.
    
    // Get the attribute value - either from attribute or property
    let actualValue;
    try {
        if (element[attributeName] !== undefined) {
            // Try as a property first (works better for value, checked, etc.)
            actualValue = element[attributeName];
        } else {
            // Fall back to attribute
            actualValue = element.getAttribute(attributeName) || '';
        }
        
        if (typeof actualValue !== 'string') {
            // Convert non-string values to string
            actualValue = String(actualValue);
        }
        
        actualValue = actualValue.trim();
    } catch (error) {
        return {
            success: false,
            message: `Error getting attribute value: ${error.message}`
        };
    }
    
    const expectedValue = verifyData.verifyExpected;
    const operator = verifyData.verifyOperator || "contains";
    
    let result = false;
    
    // Check attribute according to operator
    try {
        switch (operator) {
            case "equals":
                result = actualValue === expectedValue;
                break;
            case "contains":
                result = actualValue.includes(expectedValue);
                break;
            case "starts_with":
                result = actualValue.startsWith(expectedValue);
                break;
            case "ends_with":
                result = actualValue.endsWith(expectedValue);
                break;
            default:
                return {
                    success: false,
                    message: `Unknown operator: ${operator}`
                };
        }
    } catch (error) {
        return {
            success: false,
            message: `Error comparing attribute values: ${error.message}`
        };
    }
    
    return {
        success: result,
        message: result ? 
            `${attributeName} ${operator.replace('_', ' ')} "${expectedValue}" verified` : 
            `${attributeName} ${operator.replace('_', ' ')} "${expectedValue}" verification failed. Actual value: "${actualValue}"`,
        actualValue: actualValue
    };
}

/**
 * Cleanup observer and any associated resources
 * @param {MutationObserver} observer - The observer to clean up
 */
function cleanupObserver(observer) {
    if (!observer) return;
    
    try {
        // Clear any interval check
        if (observer.intervalCheck) {
            clearInterval(observer.intervalCheck);
            observer.intervalCheck = null;
        }
        
        // Disconnect the observer
        observer.disconnect();
    } catch (error) {
        console.error("Error cleaning up attribute verification observer:", error);
    }
}

/**
 * Clean up all active observers
 */
function cleanupAllObservers() {
    if (window.attributeVerificationObservers && window.attributeVerificationObservers.length > 0) {
        console.log(`Cleaning up ${window.attributeVerificationObservers.length} attribute verification observers`);
        
        window.attributeVerificationObservers.forEach(observer => {
            try {
                cleanupObserver(observer);
            } catch (error) {
                console.error("Error during attribute observer cleanup:", error);
            }
        });
        
        window.attributeVerificationObservers = [];
    }
}

// Export functions for use in other modules
window.attributeVerification = {
    setupAttributeVerificationObserver,
    cleanupObserver,
    cleanupAllObservers
};