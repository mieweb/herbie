async function execute(operation, element, delay, value = null, command = null) {
    console.log(operation);
    if(value){
        value = value.replace(/^'|'$/g, '');
    }
    return new Promise((resolve, reject) => {
        if (operation === 'wait') {
            delay = element;
        }

        setTimeout(() => {
            switch (operation) {
                case 'click':
                    if (element) {
                        console.log("Clicking element");
                        console.log(element);
                        simulijs.simulateClick(element);
                        resolve();
                    } else {
                        console.error("Element is required for 'click' operation.");
                        reject(new Error("Element is required for 'click' operation."));
                    }
                    break;

                case 'wait':
                    console.log("Waiting for " + delay + " ms");
                    resolve();
                    break;

                case 'press':
                case 'type': 
                    if (element) {
                        if (value !== null && value !== undefined) {
                            console.log(`Entering "${value}" into the element`);
                            console.log(element);
                            simulijs.simulateTyping(element, value);
                            resolve();
                        } else {
                            console.error(`Value is required for '${operation}' operation.`);
                            reject(new Error(`Value is required for '${operation}' operation.`));
                        }
                    } else {
                        console.error("Element is required for 'press' or 'type' operation.");
                        reject(new Error("Element is required for 'press' or 'type' operation."));
                    }
                    break;

                case 'navigate':
                    if (value) {
                        console.log(`Navigating to URL: ${value}`);
                        window.location.href = value;
                        resolve();
                    } else {
                        console.error("Value (URL) is required for 'navigate' operation.");
                        reject(new Error("Value (URL) is required for 'navigate' operation."));
                    }
                    break;

                case 'verify':
                    try {
                        let verificationResult;
                        
                        // Use enhanced verification if command has verification properties
                        if (command && command.verifyType) {
                            verificationResult = performVerification(element, command);
                        } 
                        // Otherwise fall back to legacy verification
                        else {
                            verificationResult = handleLegacyVerification(element, value);
                        }
                        
                        // Report verification result through message passing instead of alert
                        chrome.runtime.sendMessage({
                            action: "updateResult",
                            data: { 
                                success: verificationResult.success, 
                                message: verificationResult.message,
                                value: verificationResult.message // for backward compatibility
                            }
                        });
                        
                        resolve(verificationResult);
                    } catch (error) {
                        console.error("Verification error:", error);
                        const errorResult = {
                            success: false,
                            message: `Verification error: ${error.message}`
                        };
                        
                        // Report error through message passing instead of alert
                        chrome.runtime.sendMessage({
                            action: "updateResult",
                            data: { 
                                success: false, 
                                message: errorResult.message,
                                value: errorResult.message // for backward compatibility
                            }
                        });
                        
                        reject(error);
                    }
                    break;

                case 'select':
                    if (element) {
                        if (value !== null && value !== undefined) {
                            console.log(`Selecting "${value}" into the element`);
                            console.log(element);
                            simulijs.simulateFocus(element, () => {
                                simulijs.simulateChange(element, value, () => {
                                    console.log("Change event simulated with value:", value);
                                    resolve();
                                });
                            });
                        } else {
                            console.error(`Value is required for '${operation}' operation.`);
                            reject(new Error(`Value is required for '${operation}' operation.`));
                        }
                    } else {
                        console.error("Element is required for 'select' operation.");
                        reject(new Error("Element is required for 'select' operation."));
                    }
                    break;

                default:
                    console.error(`Unknown operation: ${operation}`);
                    reject(new Error(`Unknown operation: ${operation}`));
            }
        }, delay);
    });
}

/**
 * Performs verification based on the command type
 * @param {Element} element - The DOM element to verify (may be null for title/url)
 * @param {Object} command - The command object containing verification details
 * @returns {Object} - Result with success status and message
 */
function performVerification(element, command) {
    if (!command || !command.verifyType) {
        throw new Error("Invalid verification command");
    }
    
    switch (command.verifyType) {
        case 'text':
            return verifyText(element, command);
        case 'value':
        case 'placeholder':
            return verifyAttribute(element, command);
        case 'state':
            return verifyState(element, command);
        case 'title':
            return verifyTitle(command);
        case 'url':
            return verifyUrl(command);
        default:
            throw new Error(`Unknown verification type: ${command.verifyType}`);
    }
}

/**
 * Verifies text content of an element
 */
function verifyText(element, command) {
    if (!element) {
        return {
            success: false,
            message: "Element not found for text verification"
        };
    }
    
    const actualText = element.innerText.trim();
    const expectedText = command.verifyExpected;
    let result = false;
    
    switch (command.verifyOperator) {
        case 'equals':
            result = actualText === expectedText;
            break;
        case 'contains':
            result = actualText.includes(expectedText);
            break;
        case 'starts_with':
            result = actualText.startsWith(expectedText);
            break;
        case 'ends_with':
            result = actualText.endsWith(expectedText);
            break;
        default:
            return {
                success: false,
                message: `Unknown operator: ${command.verifyOperator}`
            };
    }
    
    return {
        success: result,
        message: result ? 
            `Verification passed: Text ${command.verifyOperator.replace('_', ' ')} "${expectedText}"` : 
            `Verification failed: Expected text to ${command.verifyOperator.replace('_', ' ')} "${expectedText}", got "${actualText}"`
    };
}

/**
 * Verifies attribute value of an element
 */
function verifyAttribute(element, command) {
    if (!element) {
        return {
            success: false,
            message: `Element not found for ${command.verifyType} verification`
        };
    }
    
    const attrValue = element.getAttribute(command.verifyType) || element[command.verifyType] || '';
    const expectedValue = command.verifyExpected;
    let result = false;
    
    switch (command.verifyOperator) {
        case 'equals':
            result = attrValue === expectedValue;
            break;
        case 'contains':
            result = attrValue.includes(expectedValue);
            break;
        case 'starts_with':
            result = attrValue.startsWith(expectedValue);
            break;
        case 'ends_with':
            result = attrValue.endsWith(expectedValue);
            break;
        default:
            return {
                success: false,
                message: `Unknown operator: ${command.verifyOperator}`
            };
    }
    
    return {
        success: result,
        message: result ? 
            `Verification passed: ${command.verifyType} ${command.verifyOperator.replace('_', ' ')} "${expectedValue}"` : 
            `Verification failed: Expected ${command.verifyType} to ${command.verifyOperator.replace('_', ' ')} "${expectedValue}", got "${attrValue}"`
    };
}

/**
 * Verifies state of an element (visible, enabled, etc.)
 */
function verifyState(element, command) {
    // Special case for 'hidden' - it's okay if element is not found
    if (!element && command.verifyExpected !== 'hidden') {
        return {
            success: false,
            message: "Element not found for state verification"
        };
    }
    
    let result = false;
    
    switch (command.verifyExpected) {
        case 'visible':
            result = element && isElementVisible(element);
            break;
        case 'hidden':
            result = !element || !isElementVisible(element);
            break;
        case 'enabled':
            result = element && !element.disabled;
            break;
        case 'disabled':
            result = element && element.disabled === true;
            break;
        case 'checked':
            result = element && element.checked === true;
            break;
        default:
            return {
                success: false,
                message: `Unknown state: ${command.verifyExpected}`
            };
    }
    
    return {
        success: result,
        message: result ? 
            `Verification passed: Element is ${command.verifyExpected}` : 
            `Verification failed: Element is not ${command.verifyExpected}`
    };
}

/**
 * Verifies page title
 */
function verifyTitle(command) {
    const pageTitle = document.title;
    const expectedTitle = command.verifyExpected;
    let result = false;
    
    switch (command.verifyOperator) {
        case 'equals':
            result = pageTitle === expectedTitle;
            break;
        case 'contains':
            result = pageTitle.includes(expectedTitle);
            break;
        case 'starts_with':
            result = pageTitle.startsWith(expectedTitle);
            break;
        case 'ends_with':
            result = pageTitle.endsWith(expectedTitle);
            break;
        default:
            return {
                success: false,
                message: `Unknown operator: ${command.verifyOperator}`
            };
    }
    
    return {
        success: result,
        message: result ? 
            `Verification passed: Page title ${command.verifyOperator.replace('_', ' ')} "${expectedTitle}"` : 
            `Verification failed: Expected title to ${command.verifyOperator.replace('_', ' ')} "${expectedTitle}", got "${pageTitle}"`
    };
}

/**
 * Verifies page URL
 */
function verifyUrl(command) {
    const pageUrl = window.location.href;
    const expectedUrl = command.verifyExpected;
    let result = false;
    
    switch (command.verifyOperator) {
        case 'equals':
            result = pageUrl === expectedUrl;
            break;
        case 'contains':
            result = pageUrl.includes(expectedUrl);
            break;
        case 'starts_with':
            result = pageUrl.startsWith(expectedUrl);
            break;
        case 'ends_with':
            result = pageUrl.endsWith(expectedUrl);
            break;
        default:
            return {
                success: false,
                message: `Unknown operator: ${command.verifyOperator}`
            };
    }
    
    return {
        success: result,
        message: result ? 
            `Verification passed: URL ${command.verifyOperator.replace('_', ' ')} "${expectedUrl}"` : 
            `Verification failed: Expected URL to ${command.verifyOperator.replace('_', ' ')} "${expectedUrl}", got "${pageUrl}"`
    };
}

/**
 * Checks if an element is visible in the DOM
 */
function isElementVisible(element) {
    if (!element) return false;
    
    // Check for physical dimensions first
    const hasSize = !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    
    // If it has no size, it's definitely not visible
    if (!hasSize) return false;
    
    // Get computed style to check visibility properties
    const computedStyle = window.getComputedStyle(element);
    
    // Check CSS visibility properties
    return !(
        computedStyle.display === 'none' || 
        computedStyle.visibility === 'hidden' || 
        computedStyle.opacity === '0' ||
        // Check if element or any ancestor has 'hidden' class
        element.closest('.hidden') !== null
    );
}

/**
 * Handles the legacy verification (old format)
 */
function handleLegacyVerification(element, value) {
    if (!element) {
        return {
            success: false,
            message: "Element not found for verification"
        };
    }
    
    const actualText = element.innerText.trim();
    const expectedText = value ? value.replace(/^"|"$/g, '') : '';
    const result = actualText.includes(expectedText);
    
    return {
        success: result,
        message: result ? 
            `Verification passed: Text contains "${expectedText}"` : 
            `Verification failed: Expected text to contain "${expectedText}", got "${actualText}"`
    };
}