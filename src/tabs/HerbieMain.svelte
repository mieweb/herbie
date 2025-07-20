<script>
  import { onMount } from "svelte";
  import EventEmitter from "../utils/EventEmitter.js";
  import LogComponent from '../components/LogComponent.svelte';
  import ContentScriptGuard from '../components/ContentScriptGuard.svelte';
    import HeraderSection from "../components/HerbieTabComponents/HeraderSection.svelte";
    import ProgressBar from "../components/HerbieTabComponents/ProgressBar.svelte";
  
  export let activeTab;
  let progress = 0;
  let logs = [];
  let scriptContent = "";
  let verificationResults = [];
  let lastVerificationResult = null;
  
  // Handle event subscriptions on mount
  onMount(() => {
    chrome.storage.local.get("herbie_script", (result) => {
      scriptContent = result.herbie_script || "";
    });
    
    chrome.storage.local.get(["herbiestop"], (result) => {
      if (result.herbiestop === undefined) {
        chrome.storage.local.set({ herbiestop: false });
      }
    });
    
    // Subscribe to progress updates
    EventEmitter.on("progressUpdate", (value) => {
      progress = value;
      updateProgressBar(progress);
    });

    // Subscribe to log events
    EventEmitter.on("logEvent", (message) => {
      logs = [...logs, message];
    });

    // Listen for settings redirect
    window.addEventListener('switchToSettings', () => {
      activeTab = 'tab8'; // Switch to settings tab
    });
  });

  // Popup script: Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updatePopupProgressBar") {
      console.log("Message received in popup:", message.data);
        var value = Math.round((message.data.line/message.data.total)*100)
      EventEmitter.emit("progressUpdate", value);
      sendResponse({ status: "Popup updated" });
    }
    
    if (message.action === "updateLogPopup") {
      console.log("Message received in popup:", message.data);
      EventEmitter.emit("logEvent", "Line: "+(message.data.line)+", "+message.data.desc);
      sendResponse({ status: "Popup updated" });
    }
    
    if (message.action === "updateResult") {
      console.log("Verification result received:", message.data);
      
      const result = {
        success: message.data.success,
        message: message.data.message,
        timestamp: new Date().toLocaleTimeString()
      };
      
      lastVerificationResult = result;
      verificationResults = [result, ...verificationResults].slice(0, 10);
      
      const resultClass = result.success ? "success" : "failure";
      const resultIcon = result.success ? "✅" : "❌";
      const formattedResult = `<div class="verification-result ${resultClass}">${resultIcon} ${result.message}</div>`;
      
      sendResponse({ status: "Verification result received" });
    }
    
    if (message.action === "updatePopupResult") {
      console.log("Message received in popup:", message.data);
     
      const isSuccess = message.data.success === true;
      const result = {
        success: isSuccess,
        message: message.data.value || message.data.message,
        timestamp: new Date().toLocaleTimeString()
      };
      
      lastVerificationResult = result;
      verificationResults = [result, ...verificationResults].slice(0, 10);
      
      const resultClass = isSuccess ? "success" : "failure";
      const resultIcon = isSuccess ? "✅" : "❌";
      const formattedResult = `<div class="verification-result ${resultClass}">${resultIcon} ${result.message}</div>`;
      
      sendResponse({ status: "Popup updated" });
    }
    
    return true;
  });

  // Save the script content to Chrome storage when it changes
  function saveScriptContent() {
    chrome.storage.local.set({ herbie_script: scriptContent }, () => {
      console.log("Script content saved to Chrome storage:", scriptContent);
    });
  }

  // Function to update the progress bar DOM
  function updateProgressBar(value) {
    const progressBar = document.getElementById("herbie_progress");
    if (progressBar) {
      progressBar.style.width = `${value}%`;
      progressBar.textContent = `${value}%`;
    }
  }



  function handleParseCommand() {
    const scriptContent = document.getElementById('herbie_command').value;

    chrome.runtime.sendMessage(
      {
        action: 'parseLine',
        payload: scriptContent,
      },
      (response) => {
        console.log('Background response:', response);
        EventEmitter.emit("logEvent", response.data)
      }
    );
  }
  
  function handleClearButton() {
    logs = [];
    lastVerificationResult = null;
  }
  

  function handleHerbieAdd() {
    var herbieCommand = document.getElementById("herbie_command");
    scriptContent = scriptContent + '\n' + herbieCommand.value;
    herbieCommand.value = "";
  }
  
  function saveLogs(logEntries) {
    if (!logEntries || logEntries.length === 0) {
      console.warn("No logs to save.");
      return;
    }

    const newLogEntry = {
      timestamp: new Date().toLocaleString(),
      entries: logEntries,
    };

    chrome.storage.local.get({ logs: [] }, (result) => {
      let savedLogs = result.logs || [];
      savedLogs.push(newLogEntry);

      chrome.storage.local.set({ logs: savedLogs }, () => {
        console.log("Logs saved successfully!");
      });
    });
    logs = [];
  }
</script>

  <div id="tab1" class="tab-content active">
    <div id="herbie_div">
     <HeraderSection></HeraderSection>

      <!-- Verification Results Display 
      {#if lastVerificationResult}
        <div class="verification-status-container">
          <div class="verification-status {lastVerificationResult.success ? 'success' : 'failure'}">
            <span class="verification-icon">
              {#if lastVerificationResult.success}
                <i class="fas fa-check-circle"></i>
              {:else}
                <i class="fas fa-times-circle"></i>
              {/if}
            </span>
            <span class="verification-message">
              {lastVerificationResult.message}
            </span>
          </div>
        </div>
      {/if}
      -->
     <ProgressBar percentage="50"></ProgressBar>
     
      <!-- Script Area -->
      <div class="herbie_script">
        <label class="prompt" for="herbie_script">Script:</label>
        <textarea
          id="herbie_script"
          bind:value={scriptContent}
          placeholder="Type or load your test scripts here..."
          name="Script"
          rows="10"
          cols="80"
          aria-label="Herbie Script Area"
          on:input={saveScriptContent}
        ></textarea>
      </div>

      <!-- Command Bar -->
      <div class="herbie_bar">
        <label for="herbie_command">Command:</label>
        <input
          id="herbie_command"
          type="text"
          name="Command"
          maxlength="100"
          aria-label="Herbie Command Input"
        />
        <div class="button-container">
          <button id="herbie_add" class="button" aria-label="Add Command" on:click={handleHerbieAdd} >
            <i class="fas fa-plus"></i> Add
          </button>
          <button id="herbie_parse" class="button" aria-label="Parse Command" on:click={handleParseCommand}>
            <i class="fas fa-code"></i> Parse
          </button>
          <button id="herbie_clear" class="button" aria-label="Clear Command" on:click={handleClearButton}>
            <i class="fas fa-trash-alt"></i> Clear
          </button>
          <button id="herbie_save_logs" class="button" aria-label="Save Command" on:click={() => saveLogs(logs)}>
            <i class="fas fa-save"></i> Save
          </button>
        </div>
      </div>

      <!-- Log Component -->
      <LogComponent {logs} />
    </div>
  </div>

<!-- Keep all the existing styles -->
<style>
  .progress-container {
    margin-top: 10px;
    width: 100%;
    height: 20px;
    background: #eee;
    border-radius: 5px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    width: 0;
    background: #0078d4;
    color: white;
    text-align: center;
    line-height: 20px;
    transition: width 0.5s ease;
  }
  
  .button {
    background-color: var(--primary-base, #007bff);
    color: var(--base-white, #ffffff);
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--button-border-radius-md, 8px);
    font-size: var(--font-size-md, 16px);
    transition: var(--transition-base, all 0.3s ease);
  }

  .button:hover {
    background-color: var(--primary-dark, #0056b3);
    box-shadow: var(--shadow-base-dark, 0px 4px 6px rgba(0, 0, 0, 0.2));
  }
  
  /* Verification results styling */
  :global(.verification-result) {
    padding: 8px 12px;
    margin: 5px 0;
    border-radius: 4px;
    font-family: monospace;
    display: flex;
    align-items: center;
    gap: 8px;
    line-height: 1.4;
  }
  
  :global(.verification-result.success) {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  :global(.verification-result.failure) {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  /* Verification status container */
  .verification-status-container {
    margin: 10px 0 5px 0;
    width: 100%;
  }
  
  .verification-status {
    padding: 10px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
    animation: fadeIn 0.5s;
  }
  
  .verification-status.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .verification-status.failure {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .verification-icon {
    margin-right: 10px;
    font-size: 18px;
    display: flex;
    align-items: center;
  }
  
  .verification-icon i {
    animation: pulse 1s;
  }
  
  .verification-message {
    flex: 1;
    font-size: 14px;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
</style>