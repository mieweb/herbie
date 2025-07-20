<script>
    import { onMount, onDestroy } from "svelte";
    import InjectHerbieButton from '../components/InjectHerbieButton.svelte';
    import ContentScriptGuard from '../components/ContentScriptGuard.svelte';
  
    let usabilityTest = null;
    let isRunning = false;
    let elapsedTime = 0;
    let startTime = 0;
    let interval;
    let showScript = false;
    
    // NEW: Additional state for enhanced button integration
    let verificationResults = [];
    let testStatus = "inactive";
    
    function loadUsabilityTest() {
       
        chrome.storage.local.get(null, (items) => {
            const tests = Object.keys(items)
                .filter((key) => key.startsWith("usabilityTest"))
                .map((key) => items[key]);
  
            if (tests.length > 0) {
                usabilityTest = tests[0]; 
                console.log("Loaded usability test:", usabilityTest);
                isRunning = true;
                testStatus = "running";
                startTime = usabilityTest.startTime || Date.now();
                startStopwatch();
                
                // Set up observer for the test
                chrome.runtime.sendMessage({
                    action: "setObserver",
                    herbie_script: usabilityTest.herbieScript,
                });
            }
        });
    }
  
    function startStopwatch() {
        interval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
        }, 10); 
    }
  
    function stopStopwatch() {
        clearInterval(interval);
    }
  
    async function endTest() {
        if (!isRunning) return;
        
        // Update UI state immediately
        isRunning = false;
        testStatus = "completed";
        stopStopwatch();

        const timeString = formatTime(elapsedTime);
        const testerName = usabilityTest.testerName || 'Unknown';
        const taskName = usabilityTest.taskName || 'Unknown Task';
        
        try {
            // Send end test message to background
            chrome.runtime.sendMessage({
                action: "endUsabilityTest",
                taskId: usabilityTest.taskId,
                taskName: taskName,
                testerName: testerName,
                time: timeString
            });

            // Auto-remove injected component when test ends
            const { removeInjectedComponent } = await import('../utils/injectComponent.js');
            await removeInjectedComponent();
            console.log("✓ Test completed - Injected interface automatically removed");
            
            // Optional: Show brief notification
            showNotification("Test completed successfully! Interface removed.", "success");
            
        } catch (error) {
            console.error("Error during test cleanup:", error);
            showNotification("Test ended but cleanup had issues", "warning");
        }

        // Clean up test data
        chrome.storage.local.remove("usabilityTest", () => {
            usabilityTest = null;
            console.log("✓ Test data cleaned up");
        });
    }

    // Simple notification function
    function showNotification(message, type = "info") {
        // You could implement a toast notification here
        // For now, just console log with clear formatting
        const icon = type === "success" ? "✓" : type === "warning" ? "⚠" : "ℹ";
        console.log(`${icon} Herbie Usability Test: ${message}`);
        
        // Optional: Could create a temporary visual notification
        if (typeof document !== 'undefined') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 10000;
                background: ${type === 'success' ? '#d4edda' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
                color: ${type === 'success' ? '#155724' : type === 'warning' ? '#856404' : '#0c5460'};
                padding: 12px 16px; border-radius: 4px; font-size: 14px;
                border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
    }
  
    function formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
    }
    
    function toggleScript() {
        showScript = !showScript;
    }

    // NEW: Listen for verification results to pass to injected component
    function setupVerificationListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "updateResult" || message.action === "verifyStatement") {
                const result = {
                    success: message.data?.success || message.result?.success || false,
                    message: message.data?.message || message.result?.message || 'Unknown result',
                    timestamp: Date.now()
                };
                
                // Add to verification results
                verificationResults = [result, ...verificationResults].slice(0, 10); // Keep last 10
                
                sendResponse({ status: "Verification result received" });
            }
        });
    }
  
    onMount(() => {
        loadUsabilityTest();
        setupVerificationListener();
    });
  
    onDestroy(() => {
        stopStopwatch();
    });

    // Reactive statement to create test metadata
    $: testMetadata = usabilityTest ? {
        taskId: usabilityTest.taskId,
        startTime: usabilityTest.startTime,
        herbieScript: usabilityTest.herbieScript,
        herbieScriptParsed: usabilityTest.herbieScriptParsed,
        initialVerifyStmpts: usabilityTest.initialVerifyStmpts,
        status: usabilityTest.status
    } : {};
</script>
  
<div id="usability-test">
    <h1>Usability Testing Mode</h1>
  
    <!-- NEW: Button container for side-by-side layout -->
    <div class="button-container">
        <!-- ENHANCED: Pass all usability test data to the button -->
        <InjectHerbieButton 
            buttonText="Inject Test Interface" 
            removeText="Remove Test Interface"
            title="Herbie - Usability Testing"
            testScript={usabilityTest?.herbieScript || ""}
            
            taskName={usabilityTest?.taskName || ""}
            testerName={usabilityTest?.testerName || ""}
            description={usabilityTest?.description || ""}
            startTime={startTime}
            elapsedTime={elapsedTime}
            taskId={usabilityTest?.taskId || ""}
            isTestActive={isRunning}
            testStatus={testStatus}
            verificationResults={verificationResults}
            testMetadata={testMetadata}
        />

        {#if usabilityTest}
            <button class="button-end" on:click={endTest}>
                <i class="fas fa-times-circle"></i> End Test
            </button>
        {/if}
    </div>

    {#if usabilityTest}
        <div class="test-details">
            <h2>{usabilityTest.taskName}</h2>
            <p class="description">
                <i class="fas fa-info-circle"></i> 
                {usabilityTest.description}
            </p>
  
            <!-- Centered Stopwatch -->
            <div class="stopwatch">
                <i class="fas fa-stopwatch"></i> {formatTime(elapsedTime)}
            </div>
  
            <p class="start-time">
                <i class="fas fa-clock"></i> 
                Start Time: {new Date(usabilityTest.startTime).toLocaleString()}
            </p>
            
            <!-- Test Status Display -->
            <div class="test-status-display">
                <div class="status-item">
                    <i class="fas fa-user"></i>
                    <strong>Tester:</strong> {usabilityTest.testerName || 'Anonymous'}
                </div>
                <div class="status-item">
                    <i class="fas fa-tasks"></i>
                    <strong>Task ID:</strong> {usabilityTest.taskId}
                </div>
                <div class="status-item">
                    <i class="fas fa-circle {testStatus === 'running' ? 'status-running' : 'status-inactive'}"></i>
                    <strong>Status:</strong> {testStatus}
                </div>
            </div>

            <!-- Verification Results Preview -->
            {#if verificationResults.length > 0}
                <div class="verification-preview">
                    <h4><i class="fas fa-check-circle"></i> Recent Verifications</h4>
                    <div class="verification-list">
                        {#each verificationResults.slice(0, 3) as result}
                            <div class="verification-item {result.success ? 'success' : 'failure'}">
                                <i class="fas {result.success ? 'fa-check' : 'fa-times'}"></i>
                                <span class="verification-message">{result.message}</span>
                                <small class="verification-time">
                                    {new Date(result.timestamp).toLocaleTimeString()}
                                </small>
                            </div>
                        {/each}
                    </div>
                    {#if verificationResults.length > 3}
                        <p class="more-results">
                            +{verificationResults.length - 3} more results in injected interface
                        </p>
                    {/if}
                </div>
            {/if}
            
            <!-- Show Script Toggle Button -->
            <button class="toggle-script-btn" on:click={toggleScript}>
                <i class="fas {showScript ? 'fa-eye-slash' : 'fa-eye'}"></i>
                {showScript ? 'Hide Herbie Script' : 'Show Herbie Script'}
            </button>
            
            <!-- Herbie Script Display -->
            {#if showScript && usabilityTest.herbieScript}
                <div class="herbie-script-container">
                    <h3>Herbie Script</h3>
                    <pre class="herbie-script">{usabilityTest.herbieScript}</pre>
                </div>
            {/if}
        </div>
    {:else}
        <div class="no-test-container">
            <p class="no-test">
                <i class="fas fa-exclamation-triangle"></i> 
                No usability test found.
            </p>
            <div class="test-requirements">
                <h3>To start testing:</h3>
                <ol>
                    <li><i class="fas fa-play"></i> Start a usability test from the test platform</li>
                    <li><i class="fas fa-robot"></i> Use the "Inject Test Interface" button above</li>
                    <li><i class="fas fa-eye"></i> The Herbie interface will appear on your test pages</li>
                    <li><i class="fas fa-stopwatch"></i> Complete your testing session</li>
                    <li><i class="fas fa-stop"></i> End the test to automatically remove the interface</li>
                </ol>
                <p class="note">
                    <i class="fas fa-info-circle"></i>
                    <strong>Note:</strong> The inject button is only available during active tests for clarity.
                </p>
            </div>
        </div>
    {/if}
</div>

  
<style>
    #usability-test {
        padding: 20px;
        width: 360px;
        font-family: 'Poppins', Arial, sans-serif;
        text-align: center;
        background: white;
        border-radius: 12px;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
        margin: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    h1 {
        font-size: 22px;
        font-weight: bold;
        margin-bottom: 20px;
    }

    /* NEW: Button container for side-by-side layout */
    .button-container {
        display: flex;
        gap: 10px;
        justify-content: center;
        align-items: center;
        margin-bottom: 20px;
        width: 100%;
        max-width: 320px;
    }

    .test-details {
        background: #f9f9f9;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        width: 100%;
        max-width: 320px;
    }

    .description {
        font-size: 16px;
        color: #555;
        margin-bottom: 15px;
    }

    .stopwatch {
        font-size: 24px;
        font-weight: bold;
        color: #007bff;
        margin: 15px 0;
        padding: 10px;
        background: #eef4ff;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 120px;
    }

    .start-time {
        font-size: 14px;
        color: #777;
        margin-top: 10px;
    }

    /* NEW: Test status display */
    .test-status-display {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        padding: 12px;
        margin: 15px 0;
        text-align: left;
    }

    .status-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 14px;
    }

    .status-item:last-child {
        margin-bottom: 0;
    }

    .status-running {
        color: #28a745;
        animation: pulse 2s infinite;
    }

    .status-inactive {
        color: #6c757d;
    }

    /* NEW: Verification preview */
    .verification-preview {
        background: #fff;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        margin: 15px 0;
        text-align: left;
    }

    .verification-preview h4 {
        margin: 0;
        padding: 8px 12px;
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        font-size: 13px;
        color: #495057;
    }

    .verification-list {
        max-height: 120px;
        overflow-y: auto;
    }

    .verification-item {
        padding: 8px 12px;
        border-bottom: 1px solid #f1f3f4;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
    }

    .verification-item:last-child {
        border-bottom: none;
    }

    .verification-item.success {
        background: #d4edda;
        color: #155724;
    }

    .verification-item.failure {
        background: #f8d7da;
        color: #721c24;
    }

    .verification-message {
        flex: 1;
        line-height: 1.3;
    }

    .verification-time {
        color: #6c757d;
        font-size: 10px;
    }

    .more-results {
        padding: 8px 12px;
        margin: 0;
        font-size: 11px;
        color: #6c757d;
        text-align: center;
        font-style: italic;
    }

    .button-end {
        padding: 12px 18px;
        font-size: 14px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: 0.3s;
        flex: 1;
        min-width: 120px;
    }

    .button-end:hover {
        background: #b02a37;
    }

    .no-test {
        font-size: 16px;
        color: #777;
        margin-bottom: 20px;
    }

    .no-test-container {
        text-align: left;
        max-width: 320px;
        margin: 0 auto;
    }

    .test-requirements {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 20px;
        margin-top: 15px;
    }

    .test-requirements h3 {
        margin: 0 0 15px 0;
        color: #495057;
        font-size: 16px;
        text-align: center;
    }

    .test-requirements ol {
        padding-left: 0;
        list-style: none;
        counter-reset: step-counter;
    }

    .test-requirements li {
        counter-increment: step-counter;
        margin-bottom: 12px;
        padding-left: 30px;
        position: relative;
        font-size: 14px;
        line-height: 1.4;
        color: #495057;
    }

    .test-requirements li::before {
        content: counter(step-counter);
        position: absolute;
        left: 0;
        top: 0;
        background: #007bff;
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
    }

    .test-requirements li i {
        margin-right: 8px;
        color: #007bff;
        width: 16px;
    }

    .test-requirements .note {
        margin-top: 15px;
        padding: 10px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        font-size: 13px;
        color: #856404;
    }

    .test-requirements .note i {
        color: #ffc107;
        margin-right: 8px;
    }

    .fas {
        margin-right: 8px;
    }

    /* Script display styling */
    .toggle-script-btn {
        margin-top: 10px;
        padding: 8px 12px;
        background-color: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s;
    }

    .toggle-script-btn:hover {
        background-color: #5a6268;
    }

    .herbie-script-container {
        margin-top: 15px;
        width: 100%;
        text-align: left;
    }

    .herbie-script-container h3 {
        font-size: 14px;
        margin-bottom: 5px;
        color: #495057;
    }

    .herbie-script {
        background-color: #f3f3f3;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px;
        font-family: monospace;
        font-size: 12px;
        white-space: pre-wrap;
        max-height: 150px;
        overflow-y: auto;
        text-align: left;
        color: #212529;
        margin-bottom: 15px;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
    }
</style>