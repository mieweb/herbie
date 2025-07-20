<script>
  function handleHerbieRun() {
    chrome.storage.local.set({ herbiestop: false });
    EventEmitter.emit("progressUpdate", 0);
    const scriptContent = document.getElementById('herbie_script').value;
    logs = [];
    lastVerificationResult = null;
    chrome.runtime.sendMessage({
      action: 'excuteScript',
      payload: scriptContent,
    }, (response) => {
      console.log('Background response:', response);
    });
  }

    function handleHerbieStop() {
    chrome.storage.local.set({ herbiestop: true }, () => {
      console.log("Herbie stopped, herbiestop set to true.");
    });
  }
  
  function handleHerbieSave() {
    chrome.storage.local.get(["savedScripts"], (result) => {
      let allScripts = result.savedScripts || [];

      const newScript = {
        title: `Test Script ${new Date().toLocaleTimeString()}`,
        content: scriptContent,
        timestamp: Date.now()
      };

      allScripts.push(newScript);
      allScripts.sort((a, b) => b.timestamp - a.timestamp);

      chrome.storage.local.set({ savedScripts: allScripts }, () => {
        console.log("Script saved to 'savedScripts':", newScript);
        activeTab = "tab3";
      });
    });
  }


</script>

<div id="herbie_buttons">
        <img
          id="herbie_logo"
          align="left"
          src="logos/herbie48.png"
          alt="Herbie Logo"
          height="30"
          style="padding-top: 2px; padding-left: 4px;"
        />
        <span id="herbie_documentation">
          <a target="_blank" href="http://mieweb.github.io/herbie/">Herbie</a>
        </span>

        <!-- Herbie Run Button -->
        <button
          id="herbie_run"
          title="Run"
          class="run-button"
          aria-label="Run Herbie"
          on:click={handleHerbieRun}
        >
          <i class="fas fa-play"></i>
        </button>
        <!-- Herbie Stop Button -->
        <button
          id="herbie_stop"
          title="Stop"
          class="stop-button"
          aria-label="Stop Herbie"
          on:click={handleHerbieStop}
        >
          <i class="fas fa-stop"></i>
        </button>

        <button
          id="herbie_save"
          title="Add to Saved Scripts"
          class="save-button"
          aria-label="Save Herbie"
          on:click={handleHerbieSave}
        >
          <i class="fas fa-save"></i>
          <i class="fas fa-check"></i>
        </button>
 </div>

 <style>
  #herbie_stop {
    background-color: #d9534f;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  

 </style>