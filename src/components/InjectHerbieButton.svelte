<script>
    import { onMount } from 'svelte';
    import { injectSvelteComponent, removeInjectedComponent } from '../utils/injectComponent';

    // Props (optional customization)
    export let buttonText = "Inject Herbie";
    export let removeText = "Remove Herbie";
    export let title = "Herbie Interface";
    export let testScript = "";
    
    // NEW: Additional props for usability testing
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

    // State
    let isInjected = false;
    let isLoading = false;

    // Check injection state
    async function checkInjectionState() {
        try {
            const result = await chrome.storage.local.get(['injectedComponent']);
            isInjected = !!(result.injectedComponent && result.injectedComponent.isActive);
        } catch (error) {
            console.error('Error checking injection state:', error);
            isInjected = false;
        }
    }

    // Toggle injection
    async function toggleInjection() {
        if (isInjected) {
            await removeHerbie();
        } else {
            await injectHerbie();
        }
    }

    // Inject Herbie with all props
    async function injectHerbie() {
        isLoading = true;
        try {
            await injectSvelteComponent({
                componentName: 'MainComponent',
                scriptPath: 'build/injected/main-component.js',
                cssPath: 'build/injected/css/main-style.css',
                props: { 
                    title: title,
                    testScript: testScript,
                    // NEW: Pass all usability testing data
                    taskName: taskName,
                    testerName: testerName,
                    description: description,
                    startTime: startTime,
                    elapsedTime: elapsedTime,
                    taskId: taskId,
                    isTestActive: isTestActive,
                    testStatus: testStatus,
                    verificationResults: verificationResults,
                    testMetadata: testMetadata
                },
                persist: true
            });
            
            await checkInjectionState();
            console.log('Herbie injected successfully with usability testing data');
        } catch (error) {
            console.error('Error injecting Herbie:', error);
            alert('Failed to inject Herbie: ' + error.message);
        } finally {
            isLoading = false;
        }
    }

    // Remove Herbie
    async function removeHerbie() {
        isLoading = true;
        try {
            await removeInjectedComponent();
            await checkInjectionState();
            console.log('Herbie removed successfully');
        } catch (error) {
            console.error('Error removing Herbie:', error);
            alert('Failed to remove Herbie: ' + error.message);
        } finally {
            isLoading = false;
        }
    }

    // Check state on mount
    onMount(() => {
        checkInjectionState();
    });
</script>

<button 
    class="inject-herbie-button {isInjected ? 'injected' : 'not-injected'} {!isTestActive ? 'test-inactive' : ''}"
    on:click={toggleInjection}
    disabled={isLoading || !isTestActive}
    title={!isTestActive ? 'Injection only available during active tests' : 
           (isTestActive ? `Active Test: ${taskName}` : (isInjected ? removeText : buttonText))}
>
    {#if isLoading}
        <i class="fas fa-spinner fa-spin"></i>
        {isInjected ? 'Removing...' : 'Injecting...'}
    {:else if !isTestActive}
        <i class="fas fa-lock"></i>
        Test Required
    {:else}
        <i class="fas {isInjected ? 'fa-times' : 'fa-robot'}"></i>
        {isInjected ? removeText : buttonText}
    {/if}
    
    <!-- Show test status indicator if active -->
    {#if isTestActive && isInjected}
        <span class="test-indicator">
            <i class="fas fa-circle pulse"></i>
        </span>
    {/if}
</button>

<!-- Show test info or requirement message -->
{#if isTestActive && taskName}
    <div class="test-info active">
        
    </div>
{:else if !isTestActive}
    <div class="test-info inactive">
        <small>
            <i class="fas fa-exclamation-triangle"></i> 
            Start a usability test to enable injection
        </small>
    </div>
{/if}

<style>
    .inject-herbie-button {
        padding: 12px 20px;
        font-size: 14px;
        font-weight: bold;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-width: 140px;
        position: relative;
    }

    .inject-herbie-button.not-injected {
        background: #28a745;
        color: white;
    }

    .inject-herbie-button.not-injected:hover {
        background: #218838;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(40, 167, 69, 0.3);
    }

    .inject-herbie-button.injected {
        background: #dc3545;
        color: white;
    }

    .inject-herbie-button.injected:hover {
        background: #c82333;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(220, 53, 69, 0.3);
    }

    .inject-herbie-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .inject-herbie-button.test-inactive {
        background: #6c757d !important;
        color: white;
    }

    .inject-herbie-button.test-inactive:hover {
        background: #5a6268 !important;
        transform: none;
        box-shadow: none;
    }

    .test-indicator {
        position: absolute;
        top: -5px;
        right: -5px;
        color: #ffc107;
        font-size: 10px;
    }

    .pulse {
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }

    .test-info {
        margin-top: 5px;
        text-align: center;
        font-size: 12px;
    }

    .test-info.active {
        color: #28a745;
    }

    .test-info.inactive {
        color: #ffc107;
    }

    .fa-spinner {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>