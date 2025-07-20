<script>
  import { onMount } from "svelte";
  let logs = [];


  // Load logs from storage
  function loadLogs() {
    chrome.storage.local.get({ logs: [] }, (result) => {
      logs = result.logs || [];
    });
  }

  // Delete a log entry
  function deleteLog(index) {
    logs.splice(index, 1);
    chrome.storage.local.set({ logs }, () => {
      console.log("Log deleted.");
    });
    loadLogs()
  }

  // Export logs to a file
  function exportLogs() {
    if (logs.length === 0) {
      alert("No logs available to export.");
      return;
    }

    const logText = logs
      .map(
        (log) =>
          `Time: ${log.timestamp}\n${log.entries.join("\n")}\n-----------------\n`
      )
      .join("");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "herbie-logs.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Load logs when the component is mounted
  onMount(loadLogs);
</script>

<style>
  .log-header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    color: black;
    border-radius: 5px;
  }

  .logs-container {
    margin: 10px;
    padding: 10px;
    background: #f9f9f9;
    border-radius: 5px;
    max-height: 300px;
    overflow-y: auto;
  }

  .log-entry {
    background: white;
    padding: 8px;
    margin: 5px 0;

    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .delete-button {
    background: none;
    border: none;
    color: red;
    cursor: pointer;
  }
</style>

<div id="tab2" class="tab-content active">
  <div class="log-header-container">
    <h2>Logs</h2>
    <button on:click={exportLogs} class="export-logs" aria-label="Export Logs">
      <i class="fas fa-file-export"></i> Export
    </button>
  </div>

  <div class="logs-progress-bar-container" id="logs-progress-bar-container">
    <div class="logs-progress-bar" id="logs-progress-bar"></div>
  </div>

  <div id="logs-container" class="logs-container">
    {#if logs.length === 0}
      <p>No logs available.</p>
    {:else}
      {#each logs as log, index}
        <div class="log-entry">
          <div>
            <strong>{log.timestamp}</strong>
            <ul>
              {#each log.entries as entry}
                <li>{entry}</li>
              {/each}
            </ul>
          </div>
          <button class="delete-button" on:click={() => deleteLog(index)}>
            <i class="fas fa-trash"></i>
          </button>
        </div>
      {/each}
    {/if}
  </div>
</div>
