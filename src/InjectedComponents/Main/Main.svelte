<script>
    import './Main.css'; // Your external CSS
    import { onMount } from 'svelte';
  
    // Basic props
    export let title = "Herbie Interface";
    export let testScript = "Write Amoxicillin 500mg capsule 2 caps daily for 7 days...";
    
    // NEW: Usability testing props
    export let taskName = "";
    export let testerName = "";
    export let description = "";
    export let startTime = null;
    export let elapsedTime = 0;
    export let taskId = "";
    export let isTestActive = false;
    export let testStatus = "inactive";
    export let verificationResults = [];
    export let testMetadata = {};

    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let popup;
  
    // Timer variables
    let timerInterval;
    let displayTime = '00:00:00.000';
    let currentElapsedTime = elapsedTime; // Local copy that updates

    // NEW: Persistence variables
    let persistenceStatus = 'enabled';
    let stateRestored = false;
    let autoSaveInterval;

    // Format time helper
    function formatTime(ms) {
        const totalMilliseconds = Math.floor(ms);
        const hours = Math.floor(totalMilliseconds / 3600000);
        const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
        const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
        const millis = totalMilliseconds % 1000;
        return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(millis, 3)}`;
    }

    function pad(num, size) {
        return String(num).padStart(size, '0');
    }

    // Update display time based on elapsed time or timer
    function updateDisplayTime() {
        if (isTestActive && startTime) {
            currentElapsedTime = Date.now() - startTime;
        } else {
            currentElapsedTime = elapsedTime;
        }
        displayTime = formatTime(currentElapsedTime);
    }

    // Start timer for active tests
    function startActiveTestTimer() {
        if (isTestActive && startTime) {
            timerInterval = setInterval(updateDisplayTime, 100);
        }
    }

    // Stop timer
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    /**
     * NEW: End test function for injected component
     */
    async function handleEndTest() {
        if (!isTestActive) return;

        try {
            const timeString = formatTime(currentElapsedTime);
            
            // Send end test message to background (same as tab does)
            chrome.runtime?.sendMessage({
                action: "endUsabilityTest",
                taskId: taskId,
                taskName: taskName,
                testerName: testerName,
                time: timeString
            });

       

            // Clean up test data from storage
            chrome.storage?.local.remove("usabilityTest");
            
            console.log("✓ Test ended from injected interface - Component removed");
            
        } catch (error) {
            console.error("Error ending test from injected component:", error);
           
        }
        handleRemove(); // Remove the popup after ending the test
        stopTimer(); // Stop the timer if it was running
    }

   
    /**
     * Dragging functionality (existing code)
     */
    function startDrag(event) {
        isDragging = true;
        const rect = popup.getBoundingClientRect();
        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;
        popup.style.left = '0px';
        popup.style.top = '0px';
        popup.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
        popup.classList.add('dragging');
        document.addEventListener('mousemove', onDrag, { passive: true });
        document.addEventListener('mouseup', stopDrag);
        event.preventDefault();
    }
  
    function onDrag(event) {
        if (!isDragging) return;
        let newX = event.clientX - offsetX;
        let newY = event.clientY - offsetY;
        const maxX = window.innerWidth - popup.offsetWidth;
        const maxY = window.innerHeight - popup.offsetHeight;
        newX = Math.max(0, Math.min(maxX, newX));
        newY = Math.max(0, Math.min(maxY, newY));
        popup.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  
    function stopDrag() {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        popup.classList.remove('dragging');
        const transform = popup.style.transform;
        if (transform) {
            const match = transform.match(/translate\((.+)px,\s*(.+)px\)/);
            if (match) {
                popup.style.left = `${parseFloat(match[1])}px`;
                popup.style.top = `${parseFloat(match[2])}px`;
                popup.style.transform = '';
            }
        }
        setTimeout(() => saveComponentState(), 100);
    }
  
    /**
     * Close popup with persistence cleanup
     */
    function handleRemove() {
        chrome.runtime?.sendMessage({ action: 'clearInjectionState' });
        if (autoSaveInterval) clearInterval(autoSaveInterval);
        chrome.storage?.local.remove(['herbieComponentState']);
        popup.remove();
    }
  
    /**
     * Script execution functions
     */
    function handleHerbieRun() {
        chrome.storage?.local.set({ herbiestop: false });
        const scriptEl = document.getElementById('herbie_script');
        const scriptContent = scriptEl ? scriptEl.value : testScript;
        chrome.runtime?.sendMessage(
            { action: 'excuteScript', payload: scriptContent },
            (response) => {
                console.log("Background response:", response);
            }
        );
        debouncedSave();
    }
  
    function handleHerbieStop() {
        console.log("Stopping Herbie...");
        chrome.storage?.local.set({ herbiestop: true });
        debouncedSave();
    }

    // State management functions
    let saveTimeout;
    function debouncedSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveComponentState, 500);
    }

    function saveComponentState() {
        if (!popup || isDragging) return;
        const scriptEl = document.getElementById('herbie_script');
        const currentState = {
            position: { left: popup.style.left, top: popup.style.top },
            scriptContent: scriptEl ? scriptEl.value : testScript,
            testingData: {
                taskName, testerName, description, startTime, 
                elapsedTime: currentElapsedTime, taskId, isTestActive, testStatus
            },
            lastUpdated: Date.now()
        };
        chrome.storage?.local.set({ herbieComponentState: currentState });
    }

    function restoreComponentState() {
        chrome.storage?.local.get(['herbieComponentState'], (result) => {
            if (result.herbieComponentState && !stateRestored) {
                const state = result.herbieComponentState;
                if (state.position && popup) {
                    popup.style.left = state.position.left || '20px';
                    popup.style.top = state.position.top || '20px';
                }
                if (state.scriptContent) {
                    const scriptEl = document.getElementById('herbie_script');
                    if (scriptEl) {
                        scriptEl.value = state.scriptContent;
                    }
                    testScript = state.scriptContent;
                }
                stateRestored = true;
            }
        });
    }

    function handleScriptChange() {
        debouncedSave();
    }

    /**
     * Enhanced onMount with usability testing support
     */
    onMount(() => {
        popup.style.position = 'fixed';
        popup.style.left = '20px';
        popup.style.top = '20px';
        popup.style.willChange = 'transform';
        
        // Initialize timer based on test state
        updateDisplayTime();
        if (isTestActive && startTime) {
            startActiveTestTimer();
        }
        
        setTimeout(() => restoreComponentState(), 100);
        
        autoSaveInterval = setInterval(() => {
            if (!isDragging) saveComponentState();
        }, 15000);
        
        setTimeout(() => {
            const scriptEl = document.getElementById('herbie_script');
            if (scriptEl) {
                scriptEl.addEventListener('input', handleScriptChange);
                scriptEl.addEventListener('paste', handleScriptChange);
            }
        }, 200);
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !isDragging) debouncedSave();
        });
        
        window.addEventListener('beforeunload', () => {
            if (!isDragging) saveComponentState();
        });

        // Cleanup on destroy
        return () => {
            stopTimer();
            if (autoSaveInterval) clearInterval(autoSaveInterval);
        };
    });
</script>
  
<!-- Main Popup Container -->
<div bind:this={popup} id="injected-root" class="{isTestActive ? 'usability-mode' : ''}">
    <div id="herbie_header" on:mousedown={startDrag}>
        <img
            src="https://github.com/mieweb/herbie/blob/master/logos/herbie128.png?raw=true"
            alt="Herbie Logo"
        />
        <span id="herbie_title">{title}</span>
        
        <!-- Show different indicator based on test state -->
        {#if isTestActive}
            <div class="usability-indicator" title="Usability Testing Mode - {taskName}">
                <i class="fas fa-user-check"></i>
            </div>
        {:else}
            <div class="persistence-indicator" title="Persistence: {persistenceStatus}">
                <i class="fas {persistenceStatus === 'enabled' ? 'fa-link' : 'fa-unlink'} {persistenceStatus === 'enabled' ? 'enabled' : 'disabled'}"></i>
            </div>
        {/if}
        
        <button class="close-button" on:click={handleRemove}>×</button>
    </div>

    <!-- NEW: Usability Test Info Header -->
    {#if isTestActive && taskName}
        <div class="test-header">
            <div class="test-info-line">
             
                <strong>{taskName}</strong>
            </div>
            {#if testerName}
                <div class="test-info-line">
                 
                    Name : {testerName}
                </div>
            {/if}
            {#if description}
                <div class="test-description">
                
                    {description}
                </div>
            {/if}
        </div>
    {/if}

    <!-- Control Buttons - Hidden in usability testing mode -->
    {#if !isTestActive}
        <div id="herbie_buttons">
            <button id="herbie_run" class="run-button" on:click={handleHerbieRun}>
                Run
            </button>
            <button id="herbie_stop" class="stop-button" on:click={handleHerbieStop}>
                Stop
            </button>
        </div>
    {/if}

    <!-- Enhanced Timer Display -->
    <div class="timer-display {isTestActive ? 'test-active' : ''}">
        {#if isTestActive}
            <i class="fas fa-stopwatch"></i>
            Time: {displayTime}
        {:else}
            Timer: {displayTime}
        {/if}
    </div>

    <!-- NEW: End Test Button - Only visible during active tests -->
    {#if isTestActive}
        <div class="end-test-section">
            <button class="end-test-button" on:click={handleEndTest}>
                
                End Test
            </button>
           
        </div>
    {/if}

    <!-- Script Input - Hidden in usability testing mode -->
    {#if !isTestActive}
        <div class="herbie_script">
            <label for="herbie_script">
                {isTestActive ? 'Test Script:' : 'Script:'}
            </label>
            <textarea
                bind:value={testScript}
                id="herbie_script"
                placeholder={isTestActive ? 
                    'Test script loaded from usability test...' : 
                    'Type or load your test scripts here...'}
            ></textarea>
        </div>
    {/if}
    
    <!-- Enhanced Status bar -->
    <div class="status-bar">
        {#if isTestActive}
            <span class="status-item">
                <i class="fas fa-user-check"></i>
                Usability Test Active
            </span>
            <span class="status-item test-status">
                <i class="fas fa-circle pulse"></i>
                {testStatus || 'Running'}
            </span>
        {:else}
            <span class="status-item">
                <i class="fas fa-save"></i>
                Auto-save enabled
            </span>
            <span class="status-item persistence-status {persistenceStatus}">
                <i class="fas {persistenceStatus === 'enabled' ? 'fa-check' : 'fa-times'}"></i>
                Persistence {persistenceStatus}
            </span>
        {/if}
    </div>

    <!-- NEW: Verification Results Display - Hidden in usability testing mode -->
    {#if !isTestActive && verificationResults && verificationResults.length > 0}
        <div class="verification-results">
            <h4><i class="fas fa-check-circle"></i> Verification Results</h4>
            <div class="results-list">
                {#each verificationResults.slice(-3) as result}
                    <div class="result-item {result.success ? 'success' : 'failure'}">
                        <i class="fas {result.success ? 'fa-check' : 'fa-times'}"></i>
                        {result.message}
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    /* Enhanced styling for usability testing mode */
    #injected-root.usability-mode {
        border: 2px solid #007bff;
        box-shadow: 0px 5px 15px rgba(0, 123, 255, 0.3);
        min-width: 450px;
        max-width: 500px;
    }
    
    #injected-root.usability-mode #herbie_header {
        background: linear-gradient(135deg, #007bff, #0056b3);
        color: white;
        margin: -20px -20px 15px -20px;
        padding: 15px 20px 10px 20px;
        border-radius: 10px 10px 0 0;
    }
    
    #injected-root.usability-mode #herbie_title {
        color: white;
    }

    /* Compact layout for usability testing mode */
    #injected-root.usability-mode .timer-display {
        margin: 10px 0;
        font-size: 18px;
    }

    #injected-root.usability-mode .test-header {
        margin-bottom: 10px;
    }

    #injected-root.usability-mode .end-test-section {
        margin: 10px 0;
        padding: 12px;
    }

    #injected-root.usability-mode .end-test-button {
        font-size: 13px;
        padding: 8px 16px;
    }

    /* NEW: Test header styling */
    .test-header {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 15px;
        font-size: 14px;
    }

    .test-info-line {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 5px;
        color: #495057;
    }

    .test-info-line:last-child {
        margin-bottom: 0;
    }

    .test-description {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 8px;
        font-size: 13px;
        color: #6c757d;
        line-height: 1.4;
    }

    /* Enhanced timer for test mode */
    .timer-display.test-active {
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        font-weight: bold;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);
    }

    /* NEW: End Test Section */
    .end-test-section {
        margin: 15px 0;
        text-align: center;
        padding: 15px;
        background: #fff5f5;
        border: 1px solid #fed7d7;
        border-radius: 8px;
    }

    .end-test-button {
        background: linear-gradient(135deg, #dc3545, #c82333);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
        min-width: 120px;
    }

    .end-test-button:hover {
        background: linear-gradient(135deg, #c82333, #bd2130);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
    }

    .end-test-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
    }

    .end-test-help {
        margin: 8px 0 0 0;
        font-size: 12px;
        color: #6c757d;
        line-height: 1.3;
    }

    .end-test-help i {
        color: #dc3545;
        margin-right: 4px;
    }

    /* Verification results styling */
    .verification-results {
        margin-top: 15px;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        overflow: hidden;
    }

    .verification-results h4 {
        margin: 0;
        padding: 8px 12px;
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        font-size: 13px;
        color: #495057;
    }

    .results-list {
        max-height: 120px;
        overflow-y: auto;
    }

    .result-item {
        padding: 6px 12px;
        font-size: 12px;
        border-bottom: 1px solid #f1f3f4;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .result-item:last-child {
        border-bottom: none;
    }

    .result-item.success {
        background: #d4edda;
        color: #155724;
    }

    .result-item.failure {
        background: #f8d7da;
        color: #721c24;
    }

    /* Test status animations */
    .pulse {
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
    }

    .test-status {
        color: #28a745;
        font-weight: 600;
    }

    /* Usability testing indicator */
    .usability-indicator {
        margin-right: 10px;
        color: #ffc107;
        animation: pulse 2s infinite;
    }

    /* All other existing styles remain the same */
    #injected-root {
        position: fixed;
        background: #fff;
        color: #333;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0px 5px 12px rgba(0, 0, 0, 0.2);
        z-index: 999999;
        width: 420px;
        font-family: Arial, sans-serif;
        border: 1px solid #ddd;
        box-sizing: border-box;
        will-change: transform;
    }

    /* ... rest of existing styles ... */
    #herbie_header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 10px;
        border-bottom: 2px solid #ddd;
        cursor: grab;
        touch-action: none;
    }

    #herbie_header:active { cursor: grabbing; }
    #herbie_header img { height: 30px; }
    
    #herbie_title {
        font-size: 20px;
        font-weight: bold;
        flex-grow: 1;
        margin-left: 10px;
    }

    .close-button {
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 26px;
        height: 26px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        transition: background 0.3s ease;
    }

    .close-button:hover { background: #cc0000; }

    #herbie_buttons {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-top: 15px;
    }

    .run-button, .stop-button {
        padding: 10px 15px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        width: 100px;
        transition: all 0.3s ease;
    }

    .run-button {
        background: #4caf50;
        color: white;
    }

    .run-button:hover { background: #388e3c; }

    .stop-button {
        background: #f44336;
        color: white;
    }

    .stop-button:hover { background: #d32f2f; }

    .timer-display {
        margin: 15px 0;
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        color: #333;
    }

    .herbie_script {
        margin-top: 15px;
        width: 100%;
        box-sizing: border-box;
    }

    .herbie_script label {
        font-weight: bold;
        display: block;
        margin-bottom: 5px;
        font-size: 14px;
    }

    .herbie_script textarea {
        width: 100%;
        max-width: 100%;
        padding: 12px;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-family: monospace;
        background: #f9f9f9;
        color: #333;
        resize: vertical;
        box-sizing: border-box;
        display: block;
        transition: all 0.2s ease;
        min-height: 100px;
    }

    .herbie_script textarea:focus {
        border-color: #007bff;
        outline: none;
        box-shadow: 0px 0px 5px rgba(0, 123, 255, 0.5);
    }

    .status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 15px;
        padding: 8px 12px;
        background: #f8f9fa;
        border-radius: 4px;
        font-size: 12px;
        border: 1px solid #e9ecef;
    }

    .status-item {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #6c757d;
    }

    .status-item i { font-size: 11px; }

    .persistence-status.enabled { color: #28a745; }
    .persistence-status.disabled { color: #dc3545; }
    
    .persistence-indicator { margin-right: 10px; }
    .persistence-indicator i.enabled { color: #4caf50; }
    .persistence-indicator i.disabled { color: #f44336; }
</style>