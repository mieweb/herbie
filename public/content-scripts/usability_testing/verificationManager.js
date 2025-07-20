/**
 * Verification Manager Module
 * 
 * This central module coordinates all verification types (text, attribute, state, page)
 * and provides a unified interface for setting up and cleaning up verifications.
 * It handles the routing of verification requests to appropriate handlers and
 * ensures proper reporting of results.
 */

// Configuration
const VERIFICATION_TIMEOUT = 60000; // Maximum time (ms) to wait for verification

/**
 * Sets up verification observers based on verification type
 * @param {Object} verifyData - The verification object from parser
 * @returns {MutationObserver|number|Object|null} - The created observer/timer or null
 */
function setupVerificationObserver(verifyData) {
    // Validate verification data
    if (!isValidVerificationData(verifyData)) {
        console.error("Invalid verification data:", verifyData);
        
        // Report as failed verification if we have a source reference
        if (verifyData && verifyData.src) {
            reportVerificationFailure(verifyData.src, "Invalid verification data");
        }
        
        return null;
    }
    
    console.log(`Setting up ${verifyData.verifyType} verification observer:`, 
        verifyData.verifyType === 'text' ? `"${verifyData.verifyExpected}"` : 
        verifyData.verifyType === 'state' ? `state: ${verifyData.verifyExpected}` : 
        `${verifyData.verifyType} ${verifyData.verifyOperator || "contains"} "${verifyData.verifyExpected}"`);
    
    let observer = null;
    
    try {
        // Set a timeout to report failure if verification doesn't complete
        const verificationTimeout = setTimeout(() => {
            // Only report if this verification isn't already in verifyStmpts
            chrome.runtime.sendMessage({
                action: "checkVerificationStatus",
                data: verifyData.src
            }, (response) => {
                // If verification is not already reported, report as timeout
                if (response && response.notFound) {
                    reportVerificationFailure(
                        verifyData.src, 
                        `Verification timed out after ${VERIFICATION_TIMEOUT/1000} seconds`
                    );
                }
            });
        }, VERIFICATION_TIMEOUT);
        
        // Route to the appropriate verification handler based on type
        switch (verifyData.verifyType) {
            case "text":
                // Text verification
                if (window.textVerification) {
                    observer = window.textVerification.setupTextVerificationObserver(verifyData);
                    if (observer) {
                        observer.verificationTimeout = verificationTimeout;
                        window.textVerificationObservers.push(observer);
                    } else {
                        clearTimeout(verificationTimeout);
                    }
                } else {
                    console.error("Text verification module not available");
                    reportModuleNotAvailable(verifyData, "text");
                    clearTimeout(verificationTimeout);
                }
                break;
                
            case "value":
            case "placeholder":
            case "href":
            case "src":
            case "alt":
            case "title":
            case "class":
            case "id":
            case "name":
            case "checked":
            case "selected":
            case "disabled":
            case "readonly":
            case "required":
                // Attribute verification
                if (window.attributeVerification) {
                    observer = window.attributeVerification.setupAttributeVerificationObserver(verifyData);
                    if (observer) {
                        observer.verificationTimeout = verificationTimeout;
                        window.attributeVerificationObservers.push(observer);
                    } else {
                        clearTimeout(verificationTimeout);
                    }
                } else {
                    console.error("Attribute verification module not available");
                    reportModuleNotAvailable(verifyData, "attribute");
                    clearTimeout(verificationTimeout);
                }
                break;
                
            case "state":
                // State verification
                if (window.stateVerification) {
                    observer = window.stateVerification.setupStateVerificationObserver(verifyData);
                    if (observer) {
                        observer.verificationTimeout = verificationTimeout;
                        window.stateVerificationObservers.push(observer);
                    } else {
                        clearTimeout(verificationTimeout);
                    }
                } else {
                    console.error("State verification module not available");
                    reportModuleNotAvailable(verifyData, "state");
                    clearTimeout(verificationTimeout);
                }
                break;
                
            case "title":
            case "url":
                // Page verification
                if (window.pageVerification) {
                    const timerObj = window.pageVerification.setupPageVerificationCheck(verifyData);
                    if (timerObj) {
                        timerObj.verificationTimeout = verificationTimeout;
                        window.pageVerificationTimers.push(timerObj);
                        observer = timerObj;
                    } else {
                        clearTimeout(verificationTimeout);
                    }
                } else {
                    console.error("Page verification module not available");
                    reportModuleNotAvailable(verifyData, "page");
                    clearTimeout(verificationTimeout);
                }
                break;
                
            default:
                // Unknown verification type
                console.warn(`Unsupported verification type: ${verifyData.verifyType}`);
                reportVerificationFailure(
                    verifyData.src, 
                    `Unsupported verification type: ${verifyData.verifyType}`
                );
                clearTimeout(verificationTimeout);
        }
    } catch (error) {
        console.error(`Error setting up ${verifyData.verifyType} verification:`, error);
        reportVerificationFailure(verifyData.src, `Error setting up verification: ${error.message}`);
    }
    
    return observer;
}

/**
 * Validate verification data object
 * @param {Object} verifyData - The verification data to validate
 * @returns {boolean} - True if valid
 */
function isValidVerificationData(verifyData) {
    if (!verifyData || typeof verifyData !== 'object') return false;
    
    // Must have a verification type and source
    if (!verifyData.verifyType || !verifyData.src) return false;
    
    // Must have expected value (except for some state verifications)
    if (!verifyData.verifyExpected && verifyData.verifyType !== 'state') return false;
    
    // Must have a locator for element-based verifications
    if (['text', 'value', 'placeholder', 'state'].includes(verifyData.verifyType) && 
        !verifyData.verifyLocator && 
        !(verifyData.verifyType === 'state' && verifyData.verifyExpected === 'hidden')) {
        return false;
    }
    
    return true;
}

/**
 * Report when a verification module is not available
 * @param {Object} verifyData - The verification data object
 * @param {string} moduleType - The type of verification module
 */
function reportModuleNotAvailable(verifyData, moduleType) {
    reportVerificationFailure(
        verifyData.src,
        `${moduleType} verification module not available`
    );
}

/**
 * Report a verification failure
 * @param {string} src - The verification statement source
 * @param {string} message - The failure message
 */
function reportVerificationFailure(src, message) {
    chrome.runtime.sendMessage({
        action: "verifyStatement",
        data: src,
        result: {
            success: false,
            message: message
        }
    });
}

/**
 * Clean up all verification resources
 */
function cleanupAllVerifications() {
    console.log("Cleaning up all verification resources");
    
    // Clean up all text verification observers
    if (window.textVerification) {
        try {
            window.textVerification.cleanupAllObservers();
        } catch (error) {
            console.error("Error cleaning up text verification observers:", error);
        }
    }
    
    // Clean up all attribute verification observers
    if (window.attributeVerification) {
        try {
            window.attributeVerification.cleanupAllObservers();
        } catch (error) {
            console.error("Error cleaning up attribute verification observers:", error);
        }
    }
    
    // Clean up all state verification observers
    if (window.stateVerification) {
        try {
            window.stateVerification.cleanupAllObservers();
        } catch (error) {
            console.error("Error cleaning up state verification observers:", error);
        }
    }
    
    // Clean up all page verification timers
    if (window.pageVerification) {
        try {
            window.pageVerification.cleanupAllTimers();
        } catch (error) {
            console.error("Error cleaning up page verification timers:", error);
        }
    }
    
    // Clean up all verification timeouts
    cleanupVerificationTimeouts();
}

/**
 * Clean up any lingering verification timeouts
 */
function cleanupVerificationTimeouts() {
    // Clear timeouts from text verification observers
    if (window.textVerificationObservers) {
        window.textVerificationObservers.forEach(observer => {
            if (observer && observer.verificationTimeout) {
                clearTimeout(observer.verificationTimeout);
                observer.verificationTimeout = null;
            }
        });
    }
    
    // Clear timeouts from attribute verification observers
    if (window.attributeVerificationObservers) {
        window.attributeVerificationObservers.forEach(observer => {
            if (observer && observer.verificationTimeout) {
                clearTimeout(observer.verificationTimeout);
                observer.verificationTimeout = null;
            }
        });
    }
    
    // Clear timeouts from state verification observers
    if (window.stateVerificationObservers) {
        window.stateVerificationObservers.forEach(observer => {
            if (observer && observer.verificationTimeout) {
                clearTimeout(observer.verificationTimeout);
                observer.verificationTimeout = null;
            }
        });
    }
    
    // Clear timeouts from page verification timers
    if (window.pageVerificationTimers) {
        window.pageVerificationTimers.forEach(timerObj => {
            if (timerObj && timerObj.verificationTimeout) {
                clearTimeout(timerObj.verificationTimeout);
                timerObj.verificationTimeout = null;
            }
        });
    }
}

// Export functions for use in other modules
window.verificationManager = {
    setupVerificationObserver,
    cleanupAllVerifications
};