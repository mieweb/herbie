// public/content-scripts/usability_testing/usabilitytesting.js
// Complete file with persistent tester name functionality and GitHub markdown parsing

// Function to get stored tester name directly from Chrome storage
async function getStoredTesterName() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['persistentTesterName'], (result) => {
            resolve(result.persistentTesterName || null);
        });
    });
}

// Function to store tester name directly in Chrome storage
async function storeTesterName(testerName) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ 
            persistentTesterName: testerName,
            testerNameLastUpdated: Date.now()
        }, () => {
            resolve(true);
        });
    });
}

window.addEventListener("message", async (event) => {
    if (event.source !== window || !event.data) return;
  
    if (event.data.action === "startUsabilityTest") {
        console.log("Forwarding usability test start to background script:", event.data);
        
        // Get tester name from storage or use provided name
        let testerName = event.data.testerName;
        if (!testerName) {
            testerName = await getStoredTesterName() || "Anonymous";
        }
        
        chrome.runtime.sendMessage({
            action: "startUsabilityTest",
            taskId: event.data.taskId,
            taskName: event.data.taskName,
            description: event.data.description,
            testHerbieScript: event.data.testHerbieScript,
            testerName: testerName,
        });
        
        if (event.data.herbieKeywords) {
            chrome.storage.local.set({
                globalKeywords: event.data.herbieKeywords.globalKeywords,
                localKeywords: event.data.herbieKeywords.localKeywords
            });
        }
    }
    
    // Handle request for stored tester name
    if (event.data.action === "getStoredTesterName") {
        const storedName = await getStoredTesterName();
        window.postMessage({
            action: "storedTesterNameResponse",
            testerName: storedName
        }, "*");
    }
    
    // Handle updating tester name
    if (event.data.action === "updateTesterName") {
        const success = await storeTesterName(event.data.testerName);
        window.postMessage({
            action: "testerNameUpdateResponse",
            success: success
        }, "*");
    }
});

// NEW: Auto-detect and parse GitHub markdown files for usability tests
function detectAndParseGitHubMarkdown() {
    // Check if we're on a GitHub page with a markdown file
    if (!window.location.hostname.includes('github.com')) {
        console.log("Not on GitHub, skipping detection");
        return;
    }
    
    // Check if URL contains .md file
    if (!window.location.pathname.includes('.md')) {
        console.log("Not a markdown file, skipping detection");
        return;
    }
    
    // Look for the specific GitHub markdown textarea
    const markdownTextarea = document.querySelector('#read-only-cursor-text-area[data-testid="read-only-cursor-text-area"]') ||
                             document.querySelector('textarea[data-testid="read-only-cursor-text-area"]') ||
                             document.querySelector('.react-blob-textarea') ||
                             document.querySelector('textarea[aria-label="file content"]');
    
    if (!markdownTextarea) {
        console.log("Markdown textarea not found, trying fallback selectors...");
        // Fallback to other possible containers
        const fallbackContainer = document.querySelector('.blob-wrapper .highlight') || 
                                 document.querySelector('[data-target="react-app.embeddedData"]') ||
                                 document.querySelector('.js-file-line-container');
        
        if (!fallbackContainer) {
            console.log("No markdown content container found");
            return;
        }
        
        // Try to get text from fallback container
        const markdownText = fallbackContainer.textContent;
        if (markdownText && markdownText.trim()) {
            console.log("Found markdown content via fallback, attempting to parse...");
            processMarkdownContent(markdownText);
        }
        return;
    }
    
    // Extract raw markdown text from textarea
    const markdownText = markdownTextarea.value || markdownTextarea.textContent || '';
    
    if (!markdownText.trim()) {
        console.log("No markdown text found in textarea");
        return;
    }
    
    console.log("Found markdown content in textarea, attempting to parse...");
    console.log("First 100 chars:", markdownText.substring(0, 100));
    
    processMarkdownContent(markdownText);
}

// Process the markdown content and show details only
function processMarkdownContent(markdownText) {
    // Parse the markdown for usability test structure
    const testData = parseUsabilityTestMarkdown(markdownText);
    
    if (testData) {
        console.log("Successfully parsed usability test data:", testData);
        
        // Show the extracted details without starting the test
        showTestDetails(testData);
    } else {
        console.log("No valid usability test structure found in markdown");
        showNotification("No valid Herbie test structure found in this markdown file. Looking for '## Herbie' sections.", "warning");
    }
}

// Show extracted test details in a modal with tester name management
async function showTestDetails(testData) {
    // Get current stored tester name
    const currentTesterName = await getStoredTesterName() || '';
    
    // Create a modal to display the extracted details
    const modal = document.createElement('div');
    modal.id = 'herbie-test-details-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        position: relative;
    `;
    
    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 16px;">
            <h2 style="margin: 0; color: #333; font-size: 20px;">Herbie Test Details</h2>
            <button id="herbie-close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
        </div>
        
        <div style="margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Tester Name</h3>
            <div style="display: flex; gap: 8px; align-items: center;">
                <input type="text" id="herbie-tester-name" value="${currentTesterName}" placeholder="Enter your name" style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                <button id="herbie-save-name" style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 14px; white-space: nowrap;">Save</button>
            </div>
            <div id="herbie-name-status" style="margin-top: 4px; font-size: 12px; height: 16px;"></div>
        </div>
        
        <div style="margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Task Name</h3>
            <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; border-left: 4px solid #007bff;">
                ${testData.taskName || 'Not specified'}
            </div>
        </div>
        
        <div style="margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Description</h3>
            <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; border-left: 4px solid #28a745; white-space: pre-line;">
                ${testData.description || 'Not specified'}
            </div>
        </div>
        
        <div style="margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">URL</h3>
            <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; border-left: 4px solid ${testData.url ? '#ffc107' : '#dc3545'};">
                ${testData.url ? 
                    `<a href="${testData.url}" target="_blank" style="color: #007bff; text-decoration: none;">${testData.url}</a>` : 
                    '<span style="color: #dc3545; font-style: italic;">No URL specified in markdown</span>'
                }
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Herbie Script</h3>
            <div style="background: #f3f4f6; padding: 12px; border-radius: 4px; border-left: 4px solid #6f42c1; font-family: 'Courier New', monospace; font-size: 13px; white-space: pre-line; max-height: 200px; overflow-y: auto;">
                ${testData.herbieScript || 'Not specified'}
            </div>
        </div>
        
        <div style="margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Generated Task ID</h3>
            <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; border-left: 4px solid #17a2b8; font-family: monospace; font-size: 12px;">
                ${testData.taskId}
            </div>
        </div>
        
        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #eee;">
            <button id="herbie-start-test" style="background: ${testData.url ? '#28a745' : '#6c757d'}; color: white; border: none; padding: 12px 24px; border-radius: 4px; margin-right: 12px; cursor: ${testData.url ? 'pointer' : 'not-allowed'}; font-size: 14px; font-weight: bold;" ${!testData.url ? 'disabled' : ''}>
                ${testData.url ? 'Start Test' : 'No URL Specified'}
            </button>
            <button id="herbie-copy-details" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; margin-right: 12px; cursor: pointer; font-size: 14px;">
                Copy JSON
            </button>
            <button id="herbie-close-modal-btn" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                Close
            </button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeButtons = modal.querySelectorAll('#herbie-close-modal, #herbie-close-modal-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    });
    
    // Save tester name functionality
    const saveNameBtn = modal.querySelector('#herbie-save-name');
    const testerNameInput = modal.querySelector('#herbie-tester-name');
    const nameStatus = modal.querySelector('#herbie-name-status');
    
    saveNameBtn.addEventListener('click', async () => {
        const newName = testerNameInput.value.trim();
        if (newName) {
            await storeTesterName(newName);
            nameStatus.textContent = 'Name saved successfully!';
            nameStatus.style.color = '#28a745';
            
            // Clear status after 3 seconds
            setTimeout(() => {
                nameStatus.textContent = '';
            }, 3000);
        } else {
            nameStatus.textContent = 'Please enter a name';
            nameStatus.style.color = '#dc3545';
            
            setTimeout(() => {
                nameStatus.textContent = '';
            }, 3000);
        }
    });
    
    // Save name on Enter key
    testerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveNameBtn.click();
        }
    });
    
    // Start test functionality
    const startButton = modal.querySelector('#herbie-start-test');
    if (testData.url) {
        startButton.addEventListener('click', async () => {
            console.log("Starting usability test with data:", testData);
            
            // Get current tester name from input field
            const testerName = testerNameInput.value.trim() || 'Anonymous';
            
            // Save the name if it's not empty
            if (testerName !== 'Anonymous') {
                await storeTesterName(testerName);
            }
            
            try {
                // Create message data for background script
                const usabilityTestData = {
                    action: "startUsabilityTest",
                    taskId: testData.taskId,
                    taskName: testData.taskName,
                    description: testData.description,
                    testHerbieScript: testData.herbieScript,
                    testerName: testerName,
                    source: 'github_markdown',
                    url: testData.url
                };
                
                console.log("Forwarding usability test start to background script:", usabilityTestData);
                
                // Send to background script using existing infrastructure
                chrome.runtime.sendMessage(usabilityTestData, (response) => {
                    console.log("Usability test started successfully:", response);
                    
                    // Close the modal
                    document.body.removeChild(modal);
                    
                    // Open the URL in a new tab
                    window.open(testData.url, '_blank');
                });
                
            } catch (error) {
                console.error("Error starting usability test:", error);
                showNotification("Error starting test: " + error.message, "error");
            }
        });
        
        // Add hover effect for enabled button
        startButton.addEventListener('mouseenter', () => {
            startButton.style.backgroundColor = '#218838';
        });
        
        startButton.addEventListener('mouseleave', () => {
            startButton.style.backgroundColor = '#28a745';
        });
    }
    
    // Copy details functionality
    modal.querySelector('#herbie-copy-details').addEventListener('click', () => {
        const jsonData = JSON.stringify(testData, null, 2);
        navigator.clipboard.writeText(jsonData).then(() => {
            showNotification("Test details copied to clipboard!", "success");
        }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = jsonData;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showNotification("Test details copied to clipboard!", "success");
        });
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Store the parsed data globally for later use
    window.herbieTestData = testData;
    
    console.log("Test details modal displayed");
    showNotification("Herbie test details extracted! Data is stored in window.herbieTestData", "success");
}

// Parse markdown content to extract usability test information
function parseUsabilityTestMarkdown(markdownText) {
    try {
        const lines = markdownText.split('\n');
        const testData = {
            taskName: '',
            description: '',
            objective: '',
            task: '',
            url: '',
            herbieScript: '',
            taskId: generateTaskId()
        };
        
        let currentSection = '';
        let herbieScriptLines = [];
        let inHerbieScript = false;
        let descriptionLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) continue;
            
            // Detect sections - handle both # and ## formats
            if (line.match(/^##?\s*Herbie\s*$/)) {
                continue; // Main header
            } else if (line.startsWith('Task Name:')) {
                testData.taskName = line.replace('Task Name:', '').trim();
            } else if (line.match(/^##?\s*Description\s*$/)) {
                currentSection = 'description';
                continue;
            } else if (line.match(/^##?\s*URL\s*$/)) {
                currentSection = 'url';
                continue;
            } else if (line.match(/^##?\s*Herbie_Script\s*$/)) {
                currentSection = 'herbie_script';
                inHerbieScript = true;
                continue;
            } else if (line.match(/^##?\s/)) {
                // Any other section header
                currentSection = '';
                inHerbieScript = false;
                continue;
            }
            
            // Parse content based on current section
            if (currentSection === 'description') {
                if (line.startsWith('Objective:')) {
                    testData.objective = line.replace('Objective:', '').trim();
                    descriptionLines.push(`Objective: ${testData.objective}`);
                } else if (line.startsWith('Task:')) {
                    testData.task = line.replace('Task:', '').trim();
                    descriptionLines.push(`Task: ${testData.task}`);
                } else if (line && !line.startsWith('#')) {
                    // Any other description content
                    descriptionLines.push(line);
                }
            } else if (currentSection === 'url') {
                if (line.startsWith('http')) {
                    testData.url = line.trim();
                }
            } else if (inHerbieScript) {
                if (line && !line.startsWith('#')) {
                    herbieScriptLines.push(line);
                }
            }
        }
        
        // Combine description parts
        testData.description = descriptionLines.join('\n');
        testData.herbieScript = herbieScriptLines.join('\n');
        
        console.log("Parsed test data:", {
            taskName: testData.taskName,
            description: testData.description,
            url: testData.url,
            herbieScript: testData.herbieScript
        });
        
        // Validate required fields
        if (!testData.taskName) {
            console.warn("Missing task name in markdown");
            return null;
        }
        
        if (!testData.herbieScript) {
            console.warn("Missing Herbie script in markdown");
            return null;
        }
        
        return testData;
        
    } catch (error) {
        console.error("Error parsing markdown:", error);
        return null;
    }
}

// Generate a unique task ID
function generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Show notification to user
function showNotification(message, type = "info") {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 12px 16px;
        border-radius: 4px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Add detection button for manual triggering
function addDetectionButton() {
    // Only add if we're on GitHub and it's a markdown file
    if (!window.location.hostname.includes('github.com') || !window.location.pathname.includes('.md')) {
        console.log("Not on GitHub markdown file, skipping button creation");
        return;
    }
    
    // Check if button already exists
    if (document.getElementById('herbie-detect-btn')) {
        console.log("Herbie button already exists");
        return;
    }
    
    console.log("Creating Herbie detection button...");
    
    // Create button
    const button = document.createElement('button');
    button.id = 'herbie-detect-btn';
    button.innerHTML = 'Extract Test Details';
    button.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        z-index: 9999;
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: bold;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        box-shadow: 0 3px 6px rgba(0,0,0,0.16);
        transition: all 0.2s ease;
    `;
    
    // Add hover effect
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#0056b3';
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = '#007bff';
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16)';
    });
    
    button.addEventListener('click', () => {
        console.log("Herbie button clicked, extracting details...");
        button.innerHTML = 'Parsing...';
        button.style.backgroundColor = '#ffc107';
        button.style.color = '#000';
        
        setTimeout(() => {
            detectAndParseGitHubMarkdown();
            
            // Reset button after processing
            setTimeout(() => {
                button.innerHTML = 'Extract Test Details';
                button.style.backgroundColor = '#007bff';
                button.style.color = 'white';
            }, 2000);
        }, 100);
    });
    
    document.body.appendChild(button);
    console.log("Herbie button added to page");
}

// Initialize when DOM is ready - button only, no auto-detection
function initializeHerbieDetection() {
    console.log("Initializing Herbie detection...");
    console.log("Current URL:", window.location.href);
    
    // Only add the button - no auto-detection
    addDetectionButton();
}

// Enhanced initialization with multiple triggers
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeHerbieDetection, 1000);
    });
} else {
    setTimeout(initializeHerbieDetection, 1000);
}

// Also listen for navigation changes (GitHub is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log("Navigation detected, reinitializing Herbie detection");
        setTimeout(initializeHerbieDetection, 2000);
    }
}).observe(document, { subtree: true, childList: true });

// Keep existing message listeners for usability testing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "endUsabilityTest") {
        console.log("Ending usability test...");
        sendResponse({ status: "success", message: "Usability test ended on the page" });
    }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "updateUsabilityResults") {
        console.log("Updating usability test attribute:", message.data);

        let resultDiv = document.getElementById("usabilityTestResults");
        if (!resultDiv) {
            resultDiv = document.createElement("div");
            resultDiv.id = "usabilityTestResults";
            resultDiv.style.display = "none";
            document.body.appendChild(resultDiv);
        }

        resultDiv.setAttribute("data-test-results", JSON.stringify(message.data));
        console.log(message.data);

        sendResponse({ status: "Test results rendered successfully" });
    }
});

// Utility object for managing tester names (can be called from UI)
window.usabilityTesterManager = {
    // Get current stored tester name
    async getCurrentTesterName() {
        return await getStoredTesterName();
    },
    
    // Update tester name
    async updateTesterName(newName) {
        if (newName && newName.trim()) {
            const success = await storeTesterName(newName.trim());
            if (success) {
                console.log(`Updated tester name to: ${newName}`);
            }
            return success;
        }
        return false;
    },
    
    // Clear stored tester name
    async clearTesterName() {
        return new Promise((resolve) => {
            chrome.storage.local.remove(['persistentTesterName', 'testerNameLastUpdated'], () => {
                resolve(true);
            });
        });
    },
    
    // Check if tester name is stored
    async hasTesterName() {
        const name = await getStoredTesterName();
        return name !== null && name !== "Anonymous";
    }
};