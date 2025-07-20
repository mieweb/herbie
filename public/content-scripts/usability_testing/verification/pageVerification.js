/**
 * Page Verification Module
 * Handles verification of page properties (title, url)
 * 
 * This module periodically checks page properties like title and URL,
 * reporting verification results back to the background script.
 */

// Store active timers to allow cleanup
window.pageVerificationTimers = window.pageVerificationTimers || [];

// Configuration constants
const CHECK_INTERVAL = 500; // Check every 500ms
const MAX_VERIFICATION_TIME = 30000; // Maximum time to wait for verification (30 seconds)

/**
 * Sets up verification for page properties
 * @param {Object} verifyData - The verification data object
 * @param {Function} callback - Optional callback to execute when verification succeeds
 * @returns {Object|null} - The timer object for cleanup or null if immediate verification
 */
function setupPageVerificationCheck(verifyData, callback) {
    // Validate verification data
    if (!verifyData || !verifyData.verifyType || !verifyData.verifyExpected || !verifyData.src) {
        console.error("Invalid verification data for page verification:", verifyData);
        
        // Report as failed verification
        chrome.runtime.sendMessage({
            action: "verifyStatement",
            data: verifyData?.src || "unknown verification",
            result: {
                success: false,
                message: "Invalid page verification data: missing required properties"
            }
        });
        
        return null;
    }
    
    // Check if verification type is valid
    if (verifyData.verifyType !== 'title' && verifyData.verifyType !== 'url') {
        console.error(`Invalid page verification type: ${verifyData.verifyType}`);
        
        // Report as failed verification
        chrome.runtime.sendMessage({
            action: "verifyStatement",
            data: verifyData.src,
            result: {
                success: false,
                message: `Invalid page verification type: ${verifyData.verifyType}. Expected 'title' or 'url'.`
            }
        });
        
        return null;
    }
    
    // Check immediately first
    const immediateResult = performPageVerification(verifyData);
    if (immediateResult.success) {
        // If it's already verified, report it and don't set up an interval
        console.log(`Immediate page verification passed: ${verifyData.verifyType} ${verifyData.verifyOperator || "contains"} "${verifyData.verifyExpected}"`);
        
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
                console.error("Error in callback after immediate page verification:", error);
            }
        }
        
        return null;
    }
    
    // Create a timer object to manage both interval and timeout
    const timerObj = {
        startTime: Date.now(),
        checkCount: 0,
        lastCheckedValue: immediateResult.actualValue,
        stopped: false
    };
    
    // We'll check page properties periodically
    timerObj.checkInterval = setInterval(() => {
        // Skip if already stopped
        if (timerObj.stopped) return;
        
        timerObj.checkCount++;
        
        try {
            const verificationResult = performPageVerification(verifyData);
            
            // Keep track of the last checked value for the final report
            timerObj.lastCheckedValue = verificationResult.actualValue;
            
            // If verification passes, trigger callback
            if (verificationResult.success) {
                console.log(`Page verification passed: ${verifyData.verifyType} ${verifyData.verifyOperator || "contains"} "${verifyData.verifyExpected}" (after ${timerObj.checkCount} checks)`);
                
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
                        console.error("Error in callback after page verification:", error);
                    }
                }
                
                // Stop checking
                stopTimer(timerObj);
                
                // Remove from active timers list
                const index = window.pageVerificationTimers.indexOf(timerObj);
                if (index > -1) {
                    window.pageVerificationTimers.splice(index, 1);
                }
            }
        } catch (error) {
            console.error("Error during page verification check:", error);
        }
    }, CHECK_INTERVAL);
    
    // Set a timeout to report failure if verification doesn't succeed
    timerObj.failTimeout = setTimeout(() => {
        // Skip if already stopped
        if (timerObj.stopped) return;
        
        console.log(`Page verification timed out: ${verifyData.verifyType} ${verifyData.verifyOperator || "contains"} "${verifyData.verifyExpected}" (after ${timerObj.checkCount} checks)`);
        
        // Perform one last check
        try {
            const finalResult = performPageVerification(verifyData);
            
            // Track last checked value
            timerObj.lastCheckedValue = finalResult.actualValue;
            
            if (!finalResult.success) {
                // Send verification failure to background
                chrome.runtime.sendMessage({
                    action: "verifyStatement",
                    data: verifyData.src,
                    result: {
                        success: false,
                        message: `Page ${verifyData.verifyType} verification timed out after ${MAX_VERIFICATION_TIME/1000} seconds. Expected ${verifyData.verifyOperator || "contains"} "${verifyData.verifyExpected}" but got "${finalResult.actualValue}"`,
                        actualValue: finalResult.actualValue
                    }
                });
            }
        } catch (error) {
            console.error("Error during final page verification check:", error);
            
            // Report error
            chrome.runtime.sendMessage({
                action: "verifyStatement",
                data: verifyData.src,
                result: {
                    success: false,
                    message: `Error during page verification: ${error.message}`,
                    actualValue: timerObj.lastCheckedValue
                }
            });
        }
        
        // Clean up
        stopTimer(timerObj);
        
        const index = window.pageVerificationTimers.indexOf(timerObj);
        if (index > -1) {
            window.pageVerificationTimers.splice(index, 1);
        }
    }, MAX_VERIFICATION_TIME);
    
    // Add to active timers list
    window.pageVerificationTimers.push(timerObj);
    
    return timerObj;
}

/**
 * Stop a timer object and clean up its resources
 * @param {Object} timerObj - The timer object to stop
 */
function stopTimer(timerObj) {
    if (!timerObj || timerObj.stopped) return;
    
    try {
        // Mark as stopped to prevent further checks
        timerObj.stopped = true;
        
        // Clear interval and timeout
        if (timerObj.checkInterval) {
            clearInterval(timerObj.checkInterval);
            timerObj.checkInterval = null;
        }
        
        if (timerObj.failTimeout) {
            clearTimeout(timerObj.failTimeout);
            timerObj.failTimeout = null;
        }
    } catch (error) {
        console.error("Error stopping timer:", error);
    }
}

/**
 * Performs page verification check
 * @param {Object} verifyData - The verification data object
 * @returns {Object} - Result object with success and message properties
 */
function performPageVerification(verifyData) {
    const pageProperty = verifyData.verifyType; // 'title' or 'url'
    const expectedValue = verifyData.verifyExpected;
    const operator = verifyData.verifyOperator || "contains";
    
    let actualValue = '';
    let result = false;
    
    try {
        // Get the current page property value
        if (pageProperty === 'title') {
            actualValue = document.title;
        } else if (pageProperty === 'url') {
            actualValue = window.location.href;
        } else {
            return {
                success: false,
                message: `Unknown page property: ${pageProperty}`
            };
        }
        
        // Check against expected value with the specified operator
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
            message: `Error checking page property: ${error.message}`
        };
    }
    
    return {
        success: result,
        message: result ? 
            `Page ${pageProperty} ${operator.replace('_', ' ')} "${expectedValue}" verified` : 
            `Page ${pageProperty} ${operator.replace('_', ' ')} "${expectedValue}" verification failed. Actual value: "${actualValue}"`,
        actualValue: actualValue
    };
}

/**
 * Cleanup all timers
 */
function cleanupAllTimers() {
    if (window.pageVerificationTimers && window.pageVerificationTimers.length > 0) {
        console.log(`Cleaning up ${window.pageVerificationTimers.length} page verification timers`);
        
        window.pageVerificationTimers.forEach(timerObj => {
            try {
                stopTimer(timerObj);
            } catch (error) {
                console.error("Error during timer cleanup:", error);
            }
        });
        
        window.pageVerificationTimers = [];
    }
}

// Export functions for use in other modules
window.pageVerification = {
    setupPageVerificationCheck,
    cleanupAllTimers
};