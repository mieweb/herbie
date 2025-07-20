/**
 * API Utility Functions for Herbie
 * Handles posting test results to external APIs
 */

// Default API configuration
const DEFAULT_CONFIG = {
    baseUrl: 'http://localhost:3000', // Change this to your API server
    endpoints: {
        usabilityTestResults: '/api/usability-test-results'
    },
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
};

/**
 * Get API configuration from storage or use defaults
 */
async function getApiConfig() {
    try {
        const result = await new Promise((resolve) => {
            chrome.storage.local.get(['apiConfig'], resolve);
        });
        
        return {
            ...DEFAULT_CONFIG,
            ...result.apiConfig
        };
    } catch (error) {
        console.error('Error getting API config:', error);
        return DEFAULT_CONFIG;
    }
}

/**
 * Save API configuration to storage
 */
async function saveApiConfig(config) {
    try {
        await new Promise((resolve) => {
            chrome.storage.local.set({ apiConfig: config }, resolve);
        });
        return true;
    } catch (error) {
        console.error('Error saving API config:', error);
        return false;
    }
}

/**
 * Delay function for retry logic
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced test results formatter
 */
function formatTestResults(testResults) {
    const formatted = {
        // Basic test information
        taskId: testResults.taskId,
        taskName: testResults.taskName,
        testerName: testResults.testerName,
        
        // Timing information
        duration: testResults.time,
        startTime: testResults.startTime,
        endTime: new Date().toISOString(),
        
        // Verification results
        verificationStatements: {},
        
        // Additional metadata
        metadata: {
            herbieVersion: chrome.runtime.getManifest()?.version || '2.2',
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            testType: 'usability'
        }
    };

    // Parse verification statements if they exist
    try {
        if (testResults.verify_statements) {
            formatted.verificationStatements = typeof testResults.verify_statements === 'string' 
                ? JSON.parse(testResults.verify_statements) 
                : testResults.verify_statements;
        }
    } catch (error) {
        console.warn('Error parsing verification statements:', error);
        formatted.verificationStatements = {};
    }

    // Calculate verification summary
    const statements = formatted.verificationStatements;
    formatted.verificationSummary = {
        total: Object.keys(statements).length,
        passed: Object.values(statements).filter(v => v.success === true).length,
        failed: Object.values(statements).filter(v => v.success === false).length
    };

    return formatted;
}

/**
 * Post test results to external API with retry logic
 */
async function postTestResults(testResults) {
    const config = await getApiConfig();
    const url = `${config.baseUrl}${config.endpoints.usabilityTestResults}`;
    
    console.log('Posting test results to:', url);
    
    // Format the test results
    const formattedResults = formatTestResults(testResults);
    
    let lastError = null;
    
    // Retry logic
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
        try {
            console.log(`API Post attempt ${attempt}/${config.retryAttempts}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Herbie-Version': chrome.runtime.getManifest()?.version || '2.2',
                    'X-Request-Source': 'herbie-extension'
                },
                body: JSON.stringify(formattedResults),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const responseData = await response.json();
            
            console.log('✅ Test results posted successfully:', responseData);
            
            // Store success status
            await storeSyncStatus(testResults.taskId, 'success', {
                timestamp: Date.now(),
                response: responseData,
                attempt: attempt
            });
            
            return {
                success: true,
                data: responseData,
                attempt: attempt
            };
            
        } catch (error) {
            lastError = error;
            console.warn(`❌ API Post attempt ${attempt} failed:`, error.message);
            
            // Don't retry on certain errors
            if (error.name === 'AbortError') {
                console.error('Request timed out after', config.timeout, 'ms');
                break;
            }
            
            if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
                console.error('Client error - not retrying:', error.message);
                break;
            }
            
            // Wait before retrying (except on last attempt)
            if (attempt < config.retryAttempts) {
                await delay(config.retryDelay * attempt); // Exponential backoff
            }
        }
    }
    
    // All attempts failed
    console.error('❌ All API post attempts failed. Last error:', lastError);
    
    // Store failure status
    await storeSyncStatus(testResults.taskId, 'failed', {
        timestamp: Date.now(),
        error: lastError?.message || 'Unknown error',
        attempts: config.retryAttempts
    });
    
    return {
        success: false,
        error: lastError?.message || 'Unknown error',
        attempts: config.retryAttempts
    };
}

/**
 * Store sync status for tracking
 */
async function storeSyncStatus(taskId, status, details) {
    try {
        const syncHistory = await new Promise((resolve) => {
            chrome.storage.local.get(['apiSyncHistory'], (result) => {
                resolve(result.apiSyncHistory || []);
            });
        });
        
        // Add new entry
        syncHistory.unshift({
            taskId,
            status,
            details,
            timestamp: Date.now()
        });
        
        // Keep only last 50 entries
        const trimmedHistory = syncHistory.slice(0, 50);
        
        await new Promise((resolve) => {
            chrome.storage.local.set({ apiSyncHistory: trimmedHistory }, resolve);
        });
        
    } catch (error) {
        console.error('Error storing sync status:', error);
    }
}

/**
 * Get sync history for monitoring
 */
async function getSyncHistory() {
    try {
        const result = await new Promise((resolve) => {
            chrome.storage.local.get(['apiSyncHistory'], resolve);
        });
        
        return result.apiSyncHistory || [];
    } catch (error) {
        console.error('Error getting sync history:', error);
        return [];
    }
}

/**
 * Test API connection
 */
async function testApiConnection() {
    const config = await getApiConfig();
    const url = `${config.baseUrl}/health`; // Assuming your API has a health endpoint
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        return {
            success: response.ok,
            status: response.status,
            message: response.ok ? 'API connection successful' : `HTTP ${response.status}`
        };
        
    } catch (error) {
        return {
            success: false,
            status: 0,
            message: error.message
        };
    }
}

// Export functions for use in background script
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        postTestResults,
        getApiConfig,
        saveApiConfig,
        getSyncHistory,
        testApiConnection,
        formatTestResults
    };
} else {
    // Browser environment
    window.apiUtils = {
        postTestResults,
        getApiConfig,
        saveApiConfig,
        getSyncHistory,
        testApiConnection,
        formatTestResults
    };
}