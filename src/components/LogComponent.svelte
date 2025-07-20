<script>
  export let logs = [];

  // Function to clear logs
  function clearLogs() {
    logs = [];
  }
  
  // Determine if a log entry contains HTML
  function isHtmlLog(log) {
    return typeof log === 'string' && log.startsWith('<div class="verification-result');
  }
</script>

<style>
  #execution-logs-container {
    padding: 1rem;
    font-family: Arial, sans-serif;
    max-height: 200px; 
    overflow-y: auto; 
    background-color: #fff; 
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-top: 10px;
  }

  .log-entry {
    font-size: 1rem;
    line-height: 1.5;
    white-space: pre-wrap; /* Preserve whitespace and line breaks */
    margin: 0 0 5px 0; /* Add spacing between entries */
    padding: 5px 0; /* Add padding for better readability */
    border-bottom: 1px solid #f0f0f0; /* Light separator between entries */
    color: #333; /* Optional: Adjust text color */
  }
  
  .log-entry:last-child {
    border-bottom: none; /* Remove border from last entry */
  }
  
  .log-json {
    background-color: #f8f8f8;
    padding: 8px;
    border-radius: 3px;
    overflow-x: auto;
  }
</style>

<div>
  <div id="execution-logs-container">
    {#if logs.length > 0}
      {#each logs as log}
        <div class="log-entry">
          {#if typeof log === 'object'}
            <div class="log-json">
              {JSON.stringify(log, null, 2)}
            </div>
          {:else if isHtmlLog(log)}
            {@html log}
          {:else}
            {log}
          {/if}
        </div>
      {/each}
    {:else}
      <div class="log-entry">No logs to display.</div>
    {/if}
  </div>
</div>