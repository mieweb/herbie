<script>
import { onMount } from 'svelte';
import { injectSvelteComponent, removeInjectedComponent } from '../utils/injectComponent';

let isInjected = false;
let injectionState = null;
let isLoading = false;



// Check injection state on mount
onMount(async () => {
  await checkInjectionState();
});

async function checkInjectionState() {
  try {
    const result = await chrome.storage.local.get(['injectedComponent']);
    if (result.injectedComponent && result.injectedComponent.isActive) {
      isInjected = true;
      injectionState = result.injectedComponent;
    } else {
      isInjected = false;
      injectionState = null;
    }
  } catch (error) {
    console.error('Error checking injection state:', error);
  }
}

async function injectHerbie() {
  isLoading = true;
  try {
    await injectSvelteComponent({
      componentName: 'MainComponent',
      scriptPath: 'build/injected/main-component.js',
      cssPath: 'build/injected/css/main-style.css',
      props: { title: "Herbie Interface" },
      persist: true // Enable persistence
    });
    
    await checkInjectionState();
    console.log('Herbie injected successfully with persistence');
  } catch (error) {
    console.error('Error injecting Herbie:', error);
    alert('Failed to inject Herbie: ' + error.message);
  } finally {
    isLoading = false;
  }
}

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

async function toggleInjection() {
  if (isInjected) {
    await removeHerbie();
  } else {
    await injectHerbie();
  }
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp).toLocaleString();
}
</script>

<div class="inject-herbie-container">
  <h2>Inject Herbie Interface</h2>
  
  <div class="status-section">
    <div class="status-indicator {isInjected ? 'active' : 'inactive'}">
      <i class="fas {isInjected ? 'fa-check-circle' : 'fa-times-circle'}"></i>
      <span>{isInjected ? 'Active' : 'Inactive'}</span>
    </div>
    
    {#if injectionState}
      <div class="injection-details">
        <p><strong>Component:</strong> {injectionState.componentName}</p>
        <p><strong>Injected:</strong> {formatTimestamp(injectionState.timestamp)}</p>
        <p><strong>Persistence:</strong> Enabled</p>
      </div>
    {/if}
  </div>

  <div class="control-section">
    <button 
      class="inject-button {isInjected ? 'remove' : 'inject'}"
      on:click={toggleInjection}
      disabled={isLoading}
    >
      {#if isLoading}
        <i class="fas fa-spinner fa-spin"></i>
        {isInjected ? 'Removing...' : 'Injecting...'}
      {:else}
        <i class="fas {isInjected ? 'fa-trash' : 'fa-plus'}"></i>
        {isInjected ? 'Remove Herbie' : 'Inject Herbie'}
      {/if}
    </button>
    
    <button 
      class="refresh-button"
      on:click={checkInjectionState}
      disabled={isLoading}
    >
      <i class="fas fa-sync-alt"></i>
      Refresh Status
    </button>
  </div>

  <div class="info-section">
    <h3>Features:</h3>
    <ul>
      <li><i class="fas fa-globe"></i> Persists across page navigation</li>
      <li><i class="fas fa-mouse"></i> Draggable interface</li>
      <li><i class="fas fa-stopwatch"></i> Built-in timer</li>
      <li><i class="fas fa-play"></i> Script execution controls</li>
      <li><i class="fas fa-times"></i> Easy removal</li>
    </ul>
    
    <div class="note">
      <i class="fas fa-info-circle"></i>
      <p>Once injected, the Herbie interface will automatically appear on every page you visit until you remove it.</p>
    </div>
  </div>
</div>

<style>
  .inject-herbie-container {
    padding: 20px;
    font-family: Arial, sans-serif;
    max-width: 400px;
  }

  h2 {
    margin: 0 0 20px 0;
    color: #333;
    text-align: center;
  }

  .status-section {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    border: 1px solid #e9ecef;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .status-indicator.active {
    color: #28a745;
  }

  .status-indicator.inactive {
    color: #dc3545;
  }

  .injection-details {
    font-size: 14px;
    color: #6c757d;
  }

  .injection-details p {
    margin: 5px 0;
  }

  .control-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .inject-button {
    padding: 12px 20px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
  }

  .inject-button.inject {
    background-color: #28a745;
    color: white;
  }

  .inject-button.inject:hover {
    background-color: #218838;
  }

  .inject-button.remove {
    background-color: #dc3545;
    color: white;
  }

  .inject-button.remove:hover {
    background-color: #c82333;
  }

  .inject-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .refresh-button {
    padding: 8px 16px;
    border: 1px solid #6c757d;
    border-radius: 4px;
    background: white;
    color: #6c757d;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.2s ease;
  }

  .refresh-button:hover {
    background-color: #f8f9fa;
    border-color: #495057;
  }

  .info-section {
    background: #e7f3ff;
    border-radius: 6px;
    padding: 15px;
    border-left: 4px solid #007bff;
  }

  .info-section h3 {
    margin: 0 0 10px 0;
    color: #007bff;
    font-size: 14px;
  }

  .info-section ul {
    list-style: none;
    padding: 0;
    margin: 0 0 15px 0;
  }

  .info-section li {
    padding: 4px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .info-section li i {
    color: #007bff;
    width: 16px;
  }

  .note {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    font-size: 12px;
    color: #495057;
    background: rgba(255, 255, 255, 0.7);
    padding: 8px;
    border-radius: 4px;
  }

  .note i {
    color: #007bff;
    margin-top: 2px;
  }

  .note p {
    margin: 0;
    line-height: 1.4;
  }

  .fa-spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>