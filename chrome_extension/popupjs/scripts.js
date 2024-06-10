function saveScript() {
    const scriptContent = document.getElementById('herbie_script').value;
    const timestamp = new Date().toISOString();
    const scriptEntry = {
        time: timestamp,
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
        }
    });
}

function loadScript(index) {
    chrome.storage.local.get({ herbieScripts: [] }, (result) => {
        const scripts = result.herbieScripts;
        const script = scripts[scripts.length - 1 - index].script; // Adjust index for reversed array

        document.getElementById('herbie_script').value = script;

        document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tabContent => tabContent.classList.remove('active'));

        document.querySelector('[data-tab="tab1"]').classList.add('active');
        document.getElementById('tab1').classList.add('active');
    });
}

function deleteScript(index) {
    const confirmation = window.confirm("Are you sure you want to delete this script? This action cannot be undone.");
    
    if (confirmation) {
        chrome.storage.local.get({ herbieScripts: [] }, (result) => {
            const scripts = result.herbieScripts;
            scripts.splice(scripts.length - 1 - index, 1); // Adjust index for reversed array

            chrome.storage.local.set({ herbieScripts: scripts }, () => {
                loadSavedScripts(); // Reload the scripts to update the UI
            });
        });
    }
}

