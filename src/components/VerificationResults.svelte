<script>
    import { onMount, onDestroy } from 'svelte';
    
    // Props to receive logs from parent
    export let logs = [];
    
    // Local state for verification results
    let verificationResults = [];
    let messageListener;
    
    /**
     * Formats a verification result with appropriate styling
     * @param {Object} result - The verification result object
     * @returns {String} HTML string with formatted result
     */
    function formatVerificationResult(result) {
      const resultClass = result.success ? "success" : "failure";
      const resultIcon = result.success ? "✅" : "❌";
      return {
        html: `<div class="verification-result ${resultClass}">${resultIcon} ${result.message}</div>`,
        raw: result.message,
        success: result.success,
        timestamp: new Date().toISOString()
      };
    }
    
    /**
     * Initialize the component and set up message listeners
     */
    onMount(() => {
      // Listen for verification result messages from background script
      messageListener = (message, sender, sendResponse) => {
        if (message.action === "updateResult") {
          console.log("Verification result received:", message.data);
          
          // Format the result with appropriate styling
          const formattedResult = formatVerificationResult(message.data);
          
          // Add to verification results
          verificationResults = [...verificationResults, formattedResult];
          
          // Add to parent logs if needed
          logs = [...logs, formattedResult.html];
          
          sendResponse({ status: "Verification result received" });
          return true;
        }
      };
      
      // Add the listener
      chrome.runtime.onMessage.addListener(messageListener);
    });
    
    /**
     * Clean up listeners when component is destroyed
     */
    onDestroy(() => {
      if (messageListener) {
        chrome.runtime.onMessage.removeListener(messageListener);
      }
    });
    
    /**
     * Clear all verification results
     */
    function clearVerificationResults() {
      verificationResults = [];
    }
    
    /**
     * Export verification results to a file
     */
    function exportVerificationResults() {
      if (verificationResults.length === 0) {
        alert("No verification results to export");
        return;
      }
      
      // Format results for export
      const exportContent = verificationResults.map(result => {
        return `[${result.timestamp}] ${result.success ? 'PASS' : 'FAIL'}: ${result.raw}`;
      }).join('\n');
      
      // Create download link
      const blob = new Blob([exportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `herbie-verification-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  </script>
  
  <div class="verification-results-container">
    <div class="verification-header">
      <h3>Verification Results</h3>
      <div class="verification-actions">
        <button class="action-button" on:click={clearVerificationResults}>
          <i class="fas fa-trash-alt"></i> Clear
        </button>
        <button class="action-button" on:click={exportVerificationResults}>
          <i class="fas fa-file-export"></i> Export
        </button>
      </div>
    </div>
    
    <div class="results-list">
      {#if verificationResults.length === 0}
        <div class="no-results">No verification results yet</div>
      {:else}
        {#each verificationResults as result}
          {@html result.html}
        {/each}
      {/if}
    </div>
  </div>
  
  <style>
    .verification-results-container {
      margin-top: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    
    .verification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background-color: #f5f5f5;
      border-bottom: 1px solid #ddd;
    }
    
    .verification-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .verification-actions {
      display: flex;
      gap: 8px;
    }
    
    .action-button {
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 5px 10px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s ease;
    }
    
    .action-button:hover {
      background-color: #e9ecef;
    }
    
    .results-list {
      max-height: 200px;
      overflow-y: auto;
      padding: 10px;
    }
    
    .no-results {
      text-align: center;
      color: #777;
      padding: 15px;
      font-style: italic;
    }
    
    :global(.verification-result) {
      padding: 8px 12px;
      margin: 5px 0;
      border-radius: 4px;
      font-family: monospace;
      display: flex;
      align-items: center;
      gap: 8px;
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
  </style>