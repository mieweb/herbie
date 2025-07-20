/**
 * Text Verification Module
 * Handles verification of text content on elements
 */

// Store active observers to allow cleanup, but don't overwrite existing
window.textVerificationObservers = window.textVerificationObservers || [];

/**
 * Sets up an observer to verify text content on an element
 * @param {Object} verifyData - The verification data object
 * @param {Function} callback - Callback to execute when verification succeeds
 * @returns {MutationObserver} - The created observer
 */
async function setupTextVerificationObserver(verifyData, callback) {
    if (!verifyData || !verifyData.verifyLocator) {
        console.error("Invalid verification data: missing locator");
        return null;
    }
    
    // Find the element to observe
    const element = await find_element(verifyData.verifyLocator);
    console.log("Initial element for text verification:", element);
    
    if (!element) {
        console.warn(`Element not found for text verification: ${verifyData.verifyLocator}`);
        return null;
    }
    
    // *** NEW CODE: Perform immediate verification check ***
    const actualText = element.innerText.trim();
    const expectedText = verifyData.verifyExpected;
    const operator = verifyData.verifyOperator || "contains";
    
    let initialResult = false;
    // Check text according to operator
    switch (operator) {
        case "equals":
            initialResult = actualText === expectedText;
            break;
        case "contains":
            initialResult = actualText.includes(expectedText);
            break;
        case "starts_with":
            initialResult = actualText.startsWith(expectedText);
            break;
        case "ends_with":
            initialResult = actualText.endsWith(expectedText);
            break;
    }
    
    // If verification already passes, report success immediately
    if (initialResult) {
        console.log(`Text verification passed immediately: ${operator} "${expectedText}"`);
        
        // Send verification result to background
        chrome.runtime.sendMessage({
            action: "verifyStatement",
            data: verifyData.src,
            result: {
                success: true,
                message: `Text ${operator.replace('_', ' ')} "${expectedText}" verified`,
                actualValue: actualText
            }
        });
        
        // Execute callback if provided
        if (typeof callback === 'function') {
            callback(true);
        }
        
        // No need to set up an observer
        return null;
    }
    
    // Create a mutation observer only if the initial check failed
    const observer = new MutationObserver(mutations => {
        // Check if element is still in the DOM
        const inDom = document.body.contains(element);
        
        // Check if element is visible
        let isVisible = false;
        if (inDom) {
            const style = window.getComputedStyle(element);
            isVisible = style.display !== "none" && 
                        style.visibility !== "hidden" && 
                        element.offsetWidth > 0 && 
                        element.offsetHeight > 0;
        }
        
        // If element is visible, verify text content
        if (isVisible) {
            const actualText = element.innerText.trim();
            const expectedText = verifyData.verifyExpected;
            const operator = verifyData.verifyOperator || "contains";
            
            let result = false;
            console.log(actualText);
            // Check text according to operator
            switch (operator) {
                case "equals":
                    result = actualText === expectedText;
                    break;
                case "contains":
                    result = actualText.includes(expectedText);
                    break;
                case "starts_with":
                    result = actualText.startsWith(expectedText);
                    break;
                case "ends_with":
                    result = actualText.endsWith(expectedText);
                    break;
            }
            
            // If verification passes, trigger callback
            if (result) {
                console.log(`Text verification passed: ${operator} "${expectedText}"`);
                
                // Send verification result to background
                chrome.runtime.sendMessage({
                    action: "verifyStatement",
                    data: verifyData.src,
                    result: {
                        success: true,
                        message: `Text ${operator.replace('_', ' ')} "${expectedText}" verified`,
                        actualValue: actualText
                    }
                });
                
                // Execute callback if provided
                if (typeof callback === 'function') {
                    callback(true);
                }
                
                // Disconnect observer once verified
                observer.disconnect();
                
                // Remove from active observers list
                const index = window.textVerificationObservers.indexOf(observer);
                if (index > -1) {
                    window.textVerificationObservers.splice(index, 1);
                }
            }
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    });
    
    return observer;
}

/**
 * Cleanup observer and any associated resources
 * @param {MutationObserver} observer - The observer to clean up
 */
function cleanupObserver(observer) {
    if (!observer) return;
    
    // Disconnect the observer
    observer.disconnect();
}

/**
 * Clean up all active observers
 */
function cleanupAllObservers() {
    if (window.textVerificationObservers && window.textVerificationObservers.length > 0) {
        console.log(`Cleaning up ${window.textVerificationObservers.length} text verification observers`);
        window.textVerificationObservers.forEach(cleanupObserver);
        window.textVerificationObservers = [];
    }
}

// Export functions for use in other modules
window.textVerification = {
    setupTextVerificationObserver,
    cleanupObserver,
    cleanupAllObservers
};