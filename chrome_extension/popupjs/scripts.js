function formatDate(timestamp) {
    const date = new Date(timestamp);
    const options = {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    return date.toLocaleString('en-US', options);
  }
  
  function saveScript() {
    const scriptContent = document.getElementById('herbie_script').value;
    const scriptTitle = 'Untitled'; // Default title
    const timestamp = new Date().toISOString();
    const scriptEntry = {
      time: timestamp,
      title: scriptTitle,
      script: scriptContent
    };
  
    chrome.storage.local.get({ herbieScripts: [] }, (result) => {
      const scripts = result.herbieScripts;
      scripts.push(scriptEntry);
  
      chrome.storage.local.set({ herbieScripts: scripts }, () => {
        const saveButton = document.getElementById('herbie_save');
        saveButton.classList.add('saving');
        setTimeout(() => {
          saveButton.classList.remove('saving');
        }, 1000);
      });
    });
  }
  
  function loadSavedScripts() {
    chrome.storage.local.get({ herbieScripts: [], savedRecords: [] }, (result) => {
        const scripts = result.herbieScripts;
        const savedRecords = result.savedRecords;
        const savedScriptsContainer = document.getElementById('saved-scripts-container');
        savedScriptsContainer.innerHTML = ''; // Clear the container

        if (scripts.length === 0 && savedRecords.length === 0) {
            savedScriptsContainer.innerHTML = "<p>No saved scripts or records available.</p>";
        } else {
            // Display Herbie Scripts
            if (scripts.length > 0) {
                scripts.reverse();
                scripts.forEach((script, index) => {
                    const scriptEntry = document.createElement('div');
                    scriptEntry.classList.add('script-entry');
                    scriptEntry.innerHTML = `
                        <div class="script-header">
                            <strong contenteditable="true" class="editable-title-script" data-index="${index}">${script.title}</strong> (${formatDate(script.time)})
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

                const deleteScriptButtons = document.querySelectorAll('.delete-script');
                deleteScriptButtons.forEach(button => {
                    button.addEventListener('click', function () {
                        const index = this.getAttribute('data-index');
                        deleteScript(index);
                    });
                });

                const loadScriptButtons = document.querySelectorAll('.load-script');
                loadScriptButtons.forEach(button => {
                    button.addEventListener('click', function () {
                        const index = this.getAttribute('data-index');
                        loadScript(index);
                    });
                });

                const editableScriptTitles = document.querySelectorAll('.editable-title-script');
                editableScriptTitles.forEach(title => {
                    title.addEventListener('blur', function () {
                        const index = this.getAttribute('data-index');
                        saveEditedTitle(index, this.textContent);
                    });
                });
            }

            // Display Saved Records
            if (savedRecords.length > 0) {
                savedRecords.reverse();
                savedRecords.forEach((record, index) => {
                    const recordEntry = document.createElement('div');
                    recordEntry.classList.add('script-entry');
                    
                    // Replace the XPath with Tag labels
                    let tagCount = 1;
                    const actionsDisplay = record.actions.map(action => {
                        return `<div class="action-item"><span>${capitalize(action.code[0])} on Tag${tagCount++}</span></div>`;
                    }).join('');

                    recordEntry.innerHTML = `
                        <div class="script-header">
                            <strong contenteditable="true" class="editable-title-record" data-record-index="${index}">${record.title || `Record ${index + 1}`}</strong> (${formatDate(record.time)})
                            <button class="delete-record" data-index="${index}" aria-label="Delete Record">
                                <i title="Delete" class="fas fa-trash-alt"></i>
                            </button>
                            <button class="load-record" data-index="${index}" aria-label="Load Record">
                                <i title="Load" class="fas fa-upload"></i>
                            </button>
                        </div>
                        <div class="record-actions">
                            ${actionsDisplay}
                        </div>
                    `;
                    savedScriptsContainer.appendChild(recordEntry);
                });

                // Add event listeners for deleting saved records
                const deleteRecordButtons = document.querySelectorAll('.delete-record');
                deleteRecordButtons.forEach((button, buttonIndex) => {
                    button.addEventListener('click', function () {
                        // Use the index from the loop directly
                        const index = savedRecords.length - 1 - buttonIndex;
                        
                        // Deleting the record inside the event listener
                        chrome.storage.local.get({ savedRecords: [] }, (result) => {
                            let savedRecords = result.savedRecords;
                            savedRecords.splice(index, 1); // Remove the record at the specified index

                            chrome.storage.local.set({ savedRecords: savedRecords }, () => {
                                loadSavedScripts(); // Reload the saved scripts and records to update the UI
                            });
                        });
                    });
                });

                // Add event listeners for loading saved records
                const loadRecordButtons = document.querySelectorAll('.load-record');
                loadRecordButtons.forEach((button, buttonIndex) => {
                    button.addEventListener('click', function () {
                        // Use the index from the loop directly
                        const index = savedRecords.length - 1 - buttonIndex;

                        // Load the saved record and navigate to the Records tab
                        chrome.storage.local.get({ savedRecords: [] }, (result) => {
                            const record = result.savedRecords[index];

                            // Clear current actions and load the saved record actions
                            chrome.storage.local.set({ actions: record.actions }, () => {
                                // Navigate to the Records tab
                                document.querySelector('[data-tab="tab5"]').click(); // Simulate click on the Records tab

                                // Reload the actions in the Record tab (assuming there's a function for this)
                                fetchAndDisplayActions(); // Replace with your actual function to load actions into the UI
                            });
                        });
                    });
                });

                // Add event listener to save edited title for records
                const editableRecordTitles = document.querySelectorAll('.editable-title-record');
                editableRecordTitles.forEach((title, titleIndex) => {
                    title.addEventListener('blur', function () {
                        // Use the index from the loop directly
                        const index = savedRecords.length - 1 - titleIndex;
                        
                        // Save the edited title inside the event listener
                        chrome.storage.local.get({ savedRecords: [] }, (result) => {
                            let savedRecords = result.savedRecords;
                            savedRecords[index].title = this.textContent; // Save the new title

                            chrome.storage.local.set({ savedRecords: savedRecords }, () => {
                                console.log(`Title updated for record at index ${index}: ${this.textContent}`);
                            });
                        });
                    });
                });
            }
        }
    });
}


  
  function loadScript(index) {
    chrome.storage.local.get({ herbieScripts: [] }, (result) => {
      const scripts = result.herbieScripts;
      const script = scripts[scripts.length - 1 - index]; // Adjust index for reversed array
  
      document.getElementById('herbie_script').value = script.script;
  
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
  
  function saveEditedTitle(index, newTitle) {
    chrome.storage.local.get({ herbieScripts: [] }, (result) => {
      const scripts = result.herbieScripts;
      scripts[scripts.length - 1 - index].title = newTitle; // Adjust index for reversed array
  
      chrome.storage.local.set({ herbieScripts: scripts }, () => {
        loadSavedScripts(); // Reload the scripts to update the UI
      });
    });
  }
  function importScripts(event) {
    const file = event.target.files[0];
  
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const fileContent = event.target.result;
        processImportedScripts(fileContent);
      };
      reader.readAsText(file);
    } else {
      alert('Please select a file to import.');
    }
  }
  
  function processImportedScripts(fileContent) {
    const scripts = fileContent.split('\n\n'); // Assuming each script is separated by double newlines
    const timestamp = new Date().toISOString();
  
    chrome.storage.local.get({ herbieScripts: [] }, (result) => {
      const existingScripts = result.herbieScripts;
  
      scripts.forEach(script => {
        const scriptEntry = {
          time: timestamp,
          title: 'Imported Script',
          script: script.trim()
        };
        existingScripts.push(scriptEntry);
      });
  
      chrome.storage.local.set({ herbieScripts: existingScripts }, () => {
        loadSavedScripts(); // Reload the scripts to update the UI
      });
    });
  }
  
  