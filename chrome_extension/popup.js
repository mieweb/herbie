
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('herbie_parse').addEventListener('click', parseCommand);
    document.getElementById('herbie_add').addEventListener('click', addCommand);
    document.getElementById('herbie_run').addEventListener('click', runCommand);
    document.getElementById('herbie_clear').addEventListener('click', clearCommand);
    document.getElementById('herbie_save_logs').addEventListener('click', saveCommand);
    document.getElementById('herbie_save').addEventListener('click', saveScript);
    document.getElementById('export-logs').addEventListener('click', exportLogs);
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if(message.action === 'log_msg'){
            appendLogMessage(message.message);
        }
        if (message.action === 'progress') {
            updateProgressBar(message.current, message.total);
            if(message.current==message.total){
                document.getElementById("herbie_progress").style.width="0px";
            }
        }
      });

      const tabs = document.querySelectorAll('.tab-button');
      tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            
           
          // Remove active class from all tabs and tab buttons
          document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(tabContent => tabContent.classList.remove('active'));
          
          // Add active class to the clicked tab button and corresponding tab content
          tab.classList.add('active');
          const tabId = tab.getAttribute('data-tab');
          document.getElementById(tabId).classList.add('active');
          if (tabId === 'tab2') {
            loadLogs();
            }
           
                loadSavedScripts();
           
        });
      });
     
    loadLogs();
  });
  

function clearCommand(){
    document.getElementById('herbie_output').textContent="Cleared !";
}
function saveCommand() {
    // Save the logs in chrome storage and clear the log
    const logsElement = document.getElementById('herbie_output');
    const logMessage = logsElement.textContent;

    // Get the current timestamp
    const timestamp = new Date().toISOString();

    // Create the log object
    const logEntry = {
        time: timestamp,
        log: logMessage
    };

    // Retrieve existing logs from storage
    chrome.storage.local.get({ herbieLogs: [] }, (result) => {
        const logs = result.herbieLogs;
        logs.push(logEntry); // Add the new log entry to the array

        // Save the updated logs array back to storage
        chrome.storage.local.set({ herbieLogs: logs }, () => {
            logsElement.textContent = "Logs saved!";
        });
    });
}


function addCommand() {
    const commandInput = document.getElementById('herbie_command').value;
    const scriptTextarea = document.getElementById('herbie_script');

    if (commandInput.trim() !== '') {
        scriptTextarea.value += `\n${commandInput}`;
        document.getElementById('herbie_command').value = '';  // Clear the input after adding
    }
}

function  runCommand(){
    document.getElementById('herbie_output').textContent="";
      // Get the content of the herbie_script textarea
      const scriptContent = document.getElementById('herbie_script').value;
      // Send the content to the background script
      chrome.runtime.sendMessage({ action: 'RUN', data: scriptContent }, (response) => {
         console.log('Response from background:', response.data);
         updateProgressBar(0,response.data.length);
      });
}
function parseCommand() {
     // Get the content of the herbie_script textarea
     const scriptContent = document.getElementById('herbie_command').value;
     // Send the content to the background script
     document.getElementById('herbie_output').textContent = "Loading.....";
     chrome.runtime.sendMessage({ action: 'parse', data: scriptContent }, (response) => {
        console.log('Response from background:', response.data);
        // Pretty print the JSON response
        const prettyResponse = JSON.stringify(response.data, null, 2);
        // Display the pretty JSON in the herbie_output div
        document.getElementById('herbie_output').textContent = prettyResponse;
     });

}

function appendLogMessage(msg) {
    const outputElement = document.getElementById('herbie_output');
    outputElement.textContent += `\n${msg}`;
    // Auto-scroll to the bottom of the output
    outputElement.scrollTop = outputElement.scrollHeight;
}

function updateProgressBar(current, total) {
    const progressBar = document.getElementById('herbie_progress');
    const percentage = Math.round((current / total) * 100);
    progressBar.style.width = `${percentage}%`;
}


function loadLogs() {
    chrome.storage.local.get({ herbieLogs: [] }, (result) => {
        const logs = result.herbieLogs;
        const logsContainer = document.getElementById('logs-container');
        logsContainer.innerHTML = ''; // Clear the container

        if (logs.length === 0) {
            logsContainer.innerHTML = "<p>No logs available.</p>";
        } else {
            // Reverse the logs array to show the most recent first
            logs.reverse();

            logs.forEach((log, index) => {
                const logEntry = document.createElement('div');
                logEntry.classList.add('log-entry');
                logEntry.innerHTML = `
                    <div class="log-header">
                        <strong>${new Date(log.time).toLocaleString()}</strong>
                        <button class="delete-log" data-index="${index}" aria-label="Delete Log">
                            <i title="Delete" class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                    <pre>${log.log}</pre>
                `;
                logsContainer.appendChild(logEntry);
            });

            // Add event listeners for delete buttons
            const deleteButtons = document.querySelectorAll('.delete-log');
            deleteButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const index = this.getAttribute('data-index');
                    deleteLog(index);
                });
            });
        }
    });
}

function deleteLog(index) {
    chrome.storage.local.get({ herbieLogs: [] }, (result) => {
        const logs = result.herbieLogs;
        logs.splice(logs.length - 1 - index, 1); // Adjust index for reversed array

        chrome.storage.local.set({ herbieLogs: logs }, () => {
            loadLogs(); // Reload the logs to update the UI
        });
    });
}

function exportLogs() {
    chrome.storage.local.get({ herbieLogs: [] }, (result) => {
        const logs = result.herbieLogs;
        let logText = '';
        const progressBarContainer = document.getElementById('logs-progress-bar-container');
        const progressBar = document.getElementById('logs-progress-bar');

        progressBarContainer.style.display = 'block'; // Show progress bar
        progressBar.style.width = '0%'; // Reset progress bar

        // Reverse the logs array to show the most recent first
        logs.reverse();

        logs.forEach((log, index) => {
            logText += `---- Log ${index + 1} ----\n`;
            logText += `Time: ${new Date(log.time).toLocaleString()}\n\n`;
            logText += `${log.log}\n\n`;
            // Update progress bar
            const progress = Math.round(((index + 1) / logs.length) * 100);
            progressBar.style.width = `${progress}%`;
        });

        const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(logText);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "herbie_logs.txt");
        document.body.appendChild(downloadAnchorNode); // Required for Firefox
        downloadAnchorNode.click();
        document.body.removeChild(downloadAnchorNode); // Clean up

        // Hide progress bar after download is complete
        progressBarContainer.style.display = 'none';
    });
}

function saveScript() {
    const scriptContent = document.getElementById('herbie_script').value;
    const timestamp = new Date().toISOString();
    const scriptEntry = {
        time: timestamp,
        script: scriptContent
    };

    // Retrieve existing scripts from storage
    chrome.storage.local.get({ herbieScripts: [] }, (result) => {
        const scripts = result.herbieScripts;
        scripts.push(scriptEntry); // Add the new script entry to the array

        // Save the updated scripts array back to storage
        chrome.storage.local.set({ herbieScripts: scripts }, () => {
            // Show tick animation
            const saveButton = document.getElementById('herbie_save');
            saveButton.classList.add('saving');
            setTimeout(() => {
                saveButton.classList.remove('saving');
            }, 1000);
        });
    });
}


function loadSavedScripts() {
    chrome.storage.local.get({ herbieScripts: [] }, (result) => {
        const scripts = result.herbieScripts;
        const savedScriptsContainer = document.getElementById('saved-scripts-container');
        savedScriptsContainer.innerHTML = ''; // Clear the container

        if (scripts.length === 0) {
            savedScriptsContainer.innerHTML = "<p>No saved scripts available.</p>";
        } else {
            // Reverse the scripts array to show the most recent first
            scripts.reverse();

            scripts.forEach((script, index) => {
                const scriptEntry = document.createElement('div');
                scriptEntry.classList.add('script-entry');
                scriptEntry.innerHTML = `
                    <div class="script-header">
                        <strong>${new Date(script.time).toLocaleString()}</strong>
                        <button class="delete-script" data-index="${index}" aria-label="Delete Script">
                            <i title="Delete" class="fas fa-trash-alt"></i>
                        </button>
                        <button class="load-script" data-index="${index}" aria-label="Load Script">
                            <i title="Load" class="fas fa-upload"></i>
                        </button>
                    </div>
                    <pre>${script.script}</pre>
                `;
                savedScriptsContainer.appendChild(scriptEntry);
            });

            // Add event listeners for delete buttons
            const deleteButtons = document.querySelectorAll('.delete-script');
            deleteButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const index = this.getAttribute('data-index');
                    deleteScript(index);
                });
            });

            // Add event listeners for load buttons
            const loadButtons = document.querySelectorAll('.load-script');
            loadButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const index = this.getAttribute('data-index');
                    loadScript(index);
                });
            });
        }
    });
}


function loadScript(index) {
    chrome.storage.local.get({ herbieScripts: [] }, (result) => {
        const scripts = result.herbieScripts;
        const script = scripts[scripts.length - 1 - index].script; // Adjust index for reversed array

        // Load the script into herbie_script textarea
        document.getElementById('herbie_script').value = script;

        // Switch to tab1
        document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tabContent => tabContent.classList.remove('active'));

        document.querySelector('[data-tab="tab1"]').classList.add('active');
        document.getElementById('tab1').classList.add('active');
    });
}

function deleteScript(index) {
    chrome.storage.local.get({ herbieScripts: [] }, (result) => {
        const scripts = result.herbieScripts;
        scripts.splice(scripts.length - 1 - index, 1); // Adjust index for reversed array

        chrome.storage.local.set({ herbieScripts: scripts }, () => {
            loadSavedScripts(); // Reload the scripts to update the UI
        });
    });
}