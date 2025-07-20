export async function injectSvelteComponent({ componentName, scriptPath, cssPath, props = {}, persist = true }) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Generate a unique mount ID based on the component name
    const mountId = `injected-root-${componentName.toLowerCase()}`;

    // Store injection state for persistence
    if (persist) {
        await chrome.storage.local.set({
            injectedComponent: {
                componentName,
                scriptPath,
                cssPath,
                props,
                mountId,
                isActive: true,
                timestamp: Date.now()
            }
        });
    }

    // Remove existing instance if present
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (id) => {
            const existing = document.getElementById(id);
            if (existing) existing.remove();
        },
        args: [mountId]
    });

    // Inject styles dynamically
    if (cssPath) {
        await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: [cssPath]
        });
    }

    // Inject the component script dynamically
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [scriptPath]
    });

    // Mount the component dynamically
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (id, componentName, props) => {
            const mountEl = document.createElement('div');
            mountEl.id = id;
            document.body.insertBefore(mountEl, document.body.firstChild);
            
            // Ensure the component is properly registered in window
            const ComponentClass = window[componentName]; 
            if (ComponentClass) {
                new ComponentClass({ 
                    target: mountEl,
                    props
                });
                console.log(`Successfully injected ${componentName}`);
            } else {
                console.error(`Component ${componentName} not found on window object.`);
            }
        },
        args: [mountId, componentName, props]
    });
}

// Function to remove injected component and clear persistence
export async function removeInjectedComponent() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get current injection state
    const result = await chrome.storage.local.get(['injectedComponent']);
    if (result.injectedComponent) {
        const { mountId } = result.injectedComponent;
        
        // Remove from current page
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (id) => {
                const existing = document.getElementById(id);
                if (existing) {
                    existing.remove();
                    console.log(`Removed injected component: ${id}`);
                }
            },
            args: [mountId]
        });
        
        // Clear persistence state
        await chrome.storage.local.remove(['injectedComponent']);
        console.log('Injection persistence cleared');
    }
}

// Function to check and re-inject on new pages
export async function checkAndReinject(tabId) {
    try {
        const result = await chrome.storage.local.get(['injectedComponent']);
        
        if (result.injectedComponent && result.injectedComponent.isActive) {
            const { componentName, scriptPath, cssPath, props, mountId } = result.injectedComponent;
            
            console.log('Re-injecting component on new page...');
            
            // Small delay to ensure page is ready
            setTimeout(async () => {
                try {
                    // Inject styles
                    if (cssPath) {
                        await chrome.scripting.insertCSS({
                            target: { tabId },
                            files: [cssPath]
                        });
                    }

                    // Inject script
                    await chrome.scripting.executeScript({
                        target: { tabId },
                        files: [scriptPath]
                    });

                    // Mount component
                    await chrome.scripting.executeScript({
                        target: { tabId },
                        func: (id, componentName, props) => {
                            // Check if already exists
                            if (document.getElementById(id)) {
                                return;
                            }
                            
                            const mountEl = document.createElement('div');
                            mountEl.id = id;
                            document.body.insertBefore(mountEl, document.body.firstChild);
                            
                            const ComponentClass = window[componentName];
                            if (ComponentClass) {
                                new ComponentClass({ 
                                    target: mountEl,
                                    props
                                });
                                console.log(`Re-injected ${componentName} successfully`);
                            } else {
                                console.error(`Component ${componentName} not found during re-injection`);
                            }
                        },
                        args: [mountId, componentName, props]
                    });
                } catch (error) {
                    console.error('Error during re-injection:', error);
                }
            }, 1000); // 1 second delay
        }
    } catch (error) {
        console.error('Error checking for re-injection:', error);
    }
}