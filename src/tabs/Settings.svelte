<script>
  import { onMount } from 'svelte';

  // Content script specific states
  let isContentScriptToggling = false;
  let contentScriptEnabled = true;
  let contentScriptStatus = 'enabled'; // 'enabled', 'disabled', 'unknown'

  // Content scripts configuration
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
        "content-scripts/confetti.js",
      ],
      runAt: "document_idle"
    }
  ];

  onMount(() => {
    checkContentScriptStatus();
    loadContentScriptSetting();
  });

  async function loadContentScriptSetting() {
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['contentScriptEnabled'], resolve);
      });
      
      if (result.contentScriptEnabled !== undefined) {
        contentScriptEnabled = result.contentScriptEnabled;
      }
    } catch (error) {
      console.error('Error loading content script setting:', error);
    }
  }

  async function saveContentScriptSetting() {
    try {
      await new Promise((resolve) => {
        chrome.storage.local.set({ contentScriptEnabled }, resolve);
      });
    } catch (error) {
      console.error('Error saving content script setting:', error);
    }
  }

  async function checkContentScriptStatus() {
    try {
      const registeredScripts = await chrome.scripting.getRegisteredContentScripts();
      const isRegistered = registeredScripts.some(script => script.id === "herbie-main-scripts");
      
      contentScriptStatus = isRegistered ? 'enabled' : 'disabled';
      contentScriptEnabled = isRegistered;
    } catch (error) {
      console.error('Error checking content script status:', error);
      contentScriptStatus = 'unknown';
    }
  }

  async function toggleContentScripts() {
    if (isContentScriptToggling) return;
    
    isContentScriptToggling = true;
    
    try {
      if (contentScriptEnabled) {
        // Register content scripts
        await chrome.scripting.registerContentScripts(contentScripts);
        contentScriptStatus = 'enabled';
        console.log('Content scripts enabled successfully');
      } else {
        // Unregister content scripts
        await chrome.scripting.unregisterContentScripts({
          ids: ["herbie-main-scripts"]
        });
        contentScriptStatus = 'disabled';
        console.log('Content scripts disabled');
      }
      
      // Save the setting
      await saveContentScriptSetting();
      
    } catch (error) {
      console.error('Error toggling content scripts:', error);
      alert('Failed to toggle content scripts: ' + error.message);
      
      // Revert the setting on error
      contentScriptEnabled = !contentScriptEnabled;
      await checkContentScriptStatus();
    } finally {
      isContentScriptToggling = false;
    }
  }



  // Export the status check function for use by other components
  window.checkHerbieContentScriptStatus = checkContentScriptStatus;
  window.isHerbieContentScriptEnabled = () => contentScriptStatus === 'enabled';
</script>

<div class="settings-container">
  <div class="settings-header">
    <h1><i class="fas fa-cog"></i> Settings</h1>
  </div>

  <!-- Content Script Status Banner -->
  {#if contentScriptStatus === 'disabled'}
    <div class="status-banner disabled">
      <i class="fas fa-exclamation-triangle"></i>
      <span>Herbie is disabled. Herbie features will not work properly.</span>
    </div>
  {:else if contentScriptStatus === 'enabled'}
    <div class="status-banner enabled">
      <i class="fas fa-check-circle"></i>
      <span>Herbie is active. All Herbie features are available.</span>
    </div>
  {:else if contentScriptStatus === 'unknown'}
    <div class="status-banner unknown">
      <i class="fas fa-question-circle"></i>
      <span>Herbie status unknown. Please check your browser permissions.</span>
    </div>
  {/if}

  <!-- Main Settings Content -->
  <div class="settings-content">
    <div class="settings-section">
    
      
      <div class="setting-item">
        <div class="setting-header">
          <div class="setting-info">
            <h3>Enable Herbie</h3>
            <p class="setting-description">
              Allow Herbie to inject scripts into web pages for automation and testing features.
            </p>
          </div>
          
          <div class="toggle-container">
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                bind:checked={contentScriptEnabled}
                on:change={toggleContentScripts}
                disabled={isContentScriptToggling}
              />
              <span class="toggle-slider {contentScriptEnabled ? 'enabled' : 'disabled'}">
               
              </span>
            </label>
          </div>
        </div>

        <!-- Feature Status Grid -->
        <div class="feature-grid">
          <div class="feature-item {contentScriptStatus === 'enabled' ? 'enabled' : 'disabled'}">
            <i class="fas fa-play"></i>
            <span>Script Execution</span>
            <span class="status">{contentScriptStatus === 'enabled' ? 'Available' : 'Disabled'}</span>
          </div>
          
          <div class="feature-item {contentScriptStatus === 'enabled' ? 'enabled' : 'disabled'}">
            <i class="fas fa-search"></i>
            <span>Element Inspector</span>
            <span class="status">{contentScriptStatus === 'enabled' ? 'Available' : 'Disabled'}</span>
          </div>
          
          <div class="feature-item {contentScriptStatus === 'enabled' ? 'enabled' : 'disabled'}">
            <i class="fas fa-user-check"></i>
            <span>Usability Testing</span>
            <span class="status">{contentScriptStatus === 'enabled' ? 'Available' : 'Disabled'}</span>
          </div>
          
          <div class="feature-item {contentScriptStatus === 'enabled' ? 'enabled' : 'disabled'}">
            <i class="fas fa-check-circle"></i>
            <span>Verification</span>
            <span class="status">{contentScriptStatus === 'enabled' ? 'Available' : 'Disabled'}</span>
          </div>
          
          <div class="feature-item {contentScriptStatus === 'enabled' ? 'enabled' : 'disabled'}">
            <i class="fas fa-mouse-pointer"></i>
            <span>Element Interaction</span>
            <span class="status">{contentScriptStatus === 'enabled' ? 'Available' : 'Disabled'}</span>
          </div>
          
          <div class="feature-item {contentScriptStatus === 'enabled' ? 'enabled' : 'disabled'}">
            <i class="fas fa-syringe"></i>
            <span>Interface Injection</span>
            <span class="status">{contentScriptStatus === 'enabled' ? 'Available' : 'Disabled'}</span>
          </div>
        </div>
      </div>


    </div>
  </div>
</div>

<style>
  .settings-container {
    max-width: 400px;
    font-family: Arial, sans-serif;
    background: white;
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-height: 600px;
  }

  .settings-header {
    padding: 15px 20px;
    border-bottom: 1px solid #ddd;
    background: #f8f9fa;
  }

  .settings-header h1 {
    margin: 0;
    font-size: 20px;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-banner {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 500;
  }

  .status-banner.enabled {
    background: #d4edda;
    color: #155724;
    border-bottom: 1px solid #c3e6cb;
  }

  .status-banner.disabled {
    background: #f8d7da;
    color: #721c24;
    border-bottom: 1px solid #f5c6cb;
  }

  .status-banner.unknown {
    background: #fff3cd;
    color: #856404;
    border-bottom: 1px solid #ffeaa7;
  }

  .settings-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .settings-section h2 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: #333;
  }

  .section-description {
    margin: 0 0 20px 0;
    color: #666;
    font-size: 14px;
    line-height: 1.4;
  }

  .setting-item {
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    background: #f8f9fa;
  }

  .setting-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .setting-info h3 {
    margin: 0 0 5px 0;
    font-size: 16px;
    color: #333;
  }

  .setting-description {
    margin: 0;
    color: #666;
    font-size: 13px;
    line-height: 1.4;
  }

  .toggle-container {
    flex-shrink: 0;
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 30px;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
  }

  .toggle-slider.enabled {
    background-color: #28a745;
  }

  .toggle-slider.disabled {
    background-color: #dc3545;
  }

  .toggle-switch input:checked + .toggle-slider:before {
    transform: translateX(30px);
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  .toggle-switch input:checked + .toggle-slider:before {
    transform: translateX(26px);
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 20px;
  }

  .feature-item {
    padding: 12px;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 5px;
    font-size: 12px;
    transition: all 0.2s;
  }

  .feature-item.enabled {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .feature-item.disabled {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .feature-item i {
    font-size: 16px;
    margin-bottom: 4px;
  }

  .feature-item .status {
    font-weight: 500;
    font-size: 11px;
  }


</style>