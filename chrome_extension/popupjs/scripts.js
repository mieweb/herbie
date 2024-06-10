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
    chrome.storage.local.get({ herbieScripts: [] }, (result) => {
      const scripts = result.herbieScripts;
      const savedScriptsContainer = document.getElementById('saved-scripts-container');
      savedScriptsContainer.innerHTML = ''; // Clear the container
  
      if (scripts.length === 0) {
        savedScriptsContainer.innerHTML = "<p>No saved scripts available.</p>";
      } else {
        scripts.reverse();
  
        scripts.forEach((script, index) => {
          const scriptEntry = document.createElement('div');
          scriptEntry.classList.add('script-entry');
          scriptEntry.innerHTML = `
            <div class="script-header">
              <strong contenteditable="true" class="editable-title" data-index="${index}">${script.title}</strong> (${formatDate(script.time)})
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
  
        const deleteButtons = document.querySelectorAll('.delete-script');
        deleteButtons.forEach(button => {
          button.addEventListener('click', function () {
            const index = this.getAttribute('data-index');
            deleteScript(index);
          });
        });
  
        const loadButtons = document.querySelectorAll('.load-script');
        loadButtons.forEach(button => {
          button.addEventListener('click', function () {
            const index = this.getAttribute('data-index');
            loadScript(index);
          });
        });
  
        const editableTitles = document.querySelectorAll('.editable-title');
        editableTitles.forEach(title => {
          title.addEventListener('blur', function () {
            const index = this.getAttribute('data-index');
            saveEditedTitle(index, this.textContent);
          });
        });
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
  
  