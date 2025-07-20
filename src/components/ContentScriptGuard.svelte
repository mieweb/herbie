<script>
  import { onMount } from 'svelte';
  import ContentScriptModal from './ContentScriptModal.svelte';

  export let showModal = false;
  export let bypassCheck = false; // Allow certain tabs to bypass the check

  let contentScriptEnabled = true;
  let isChecking = true;

  onMount(() => {
    if (!bypassCheck) {
      checkContentScriptStatus();
    } else {
      isChecking = false;
    }
  });

  async function checkContentScriptStatus() {
    try {
      // First check storage setting
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['contentScriptEnabled'], resolve);
      });
      
      if (result.contentScriptEnabled === false) {
        contentScriptEnabled = false;
        showModal = true;
        isChecking = false;
        return;
      }

      // Then check if actually registered
      const registeredScripts = await chrome.scripting.getRegisteredContentScripts();
      const isRegistered = registeredScripts.some(script => script.id === "herbie-main-scripts");
      
      contentScriptEnabled = isRegistered;
      
      if (!isRegistered) {
        showModal = true;
      }
      
    } catch (error) {
      console.error('Error checking content script status:', error);
      // Assume disabled on error
      contentScriptEnabled = false;
      showModal = true;
    } finally {
      isChecking = false;
    }
  }

  async function enableContentScripts() {
    try {
      const contentScripts = [
        {
          id: "herbie-main-scripts",
          matches: ["<all_urls>"],
          js: [
            "dist/mie-simulijs.js",
            "content-scripts/execute.js",
            "content-scripts/findelement.js",
            "content-scripts/usability_testing/verification/textVerification.js",
            "content-scripts/usability_testing/verification/attributeVerification.js",
            "content-scripts/usability_testing/verification/stateVerification.js",
            "content-scripts/usability_testing/verification/pageVerification.js",
            "content-scripts/usability_testing/verificationManager.js",
            "content-scripts/usability_testing/verificationIntegration.js",
            "content-scripts/usability_testing/usabilityAutoSetup.js",
            "content-scripts/content-scripts.js",
            "content-scripts/dragdrop.js",
            "content-scripts/usability_testing/usabilitytesting.js",
            "content-scripts/inspector.js",
            "content-scripts/confetti.js"
          ],
          runAt: "document_idle"
        }
      ];

      await chrome.scripting.registerContentScripts(contentScripts);
      
      // Save setting
      await new Promise((resolve) => {
        chrome.storage.local.set({ contentScriptEnabled: true }, resolve);
      });
      
      contentScriptEnabled = true;
      showModal = false;
      
    } catch (error) {
      console.error('Error enabling content scripts:', error);
      alert('Failed to enable content scripts: ' + error.message);
    }
  }

  function handleSettingsRedirect() {
    // Dispatch event to parent to switch to settings tab
    const event = new CustomEvent('switchToSettings');
    window.dispatchEvent(event);
    showModal = false;
  }
</script>

{#if showModal && !contentScriptEnabled && !bypassCheck}
  <ContentScriptModal 
    on:enable={enableContentScripts}
    on:close={() => showModal = false}
    on:settings={handleSettingsRedirect}
  />
{/if}

{#if isChecking && !bypassCheck}
  <div class="checking-status">
    <i class="fas fa-spinner fa-spin"></i>
    <span>Checking content script status...</span>
  </div>
{:else if !contentScriptEnabled && !bypassCheck}
  <div class="content-disabled-overlay">
    <div class="disabled-message">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Content Scripts Disabled</h3>
      <p>This tab requires content scripts to function properly.</p>
      <button class="enable-button" on:click={() => showModal = true}>
        <i class="fas fa-power-off"></i>
        Enable Content Scripts
      </button>
    </div>
  </div>
{:else}
  <!-- Content is allowed to render -->
  <slot></slot>
{/if}

<style>
  .checking-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 40px;
    color: #6c757d;
    font-size: 14px;
  }

  .content-disabled-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 40px 20px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    margin: 20px;
  }

  .disabled-message {
    text-align: center;
    max-width: 300px;
  }

  .disabled-message i {
    font-size: 48px;
    color: #ffc107;
    margin-bottom: 16px;
  }

  .disabled-message h3 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 18px;
  }

  .disabled-message p {
    margin: 0 0 20px 0;
    color: #6c757d;
    font-size: 14px;
    line-height: 1.4;
  }

  .enable-button {
    background: #28a745;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    margin: 0 auto;
  }

  .enable-button:hover {
    background: #218838;
  }
</style>