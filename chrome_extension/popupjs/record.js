document.addEventListener('DOMContentLoaded', () => {
    const recordClickButton = document.getElementById('record_click');
    const recordTypeButton = document.getElementById('record_type');
    const fetchActionsButton = document.getElementById('fetch_actions');
    const actionsContainer = document.getElementById('actions_container');
    const clearActionsButton = document.getElementById('clear_actions');

    const record_run = document.getElementById("record_run");

    recordClickButton.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', 'click');
        event.dataTransfer.effectAllowed = 'move';
    });

    recordTypeButton.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', 'type');
        event.dataTransfer.effectAllowed = 'move';
    });

    fetchActionsButton.addEventListener('click', () => {
        chrome.storage.local.get(['actions'], (result) => {
            const actions = result.actions || [];
            actionsContainer.innerHTML = '';
            actions.forEach((action) => {
                const actionElement = document.createElement('div');
                actionElement.textContent = JSON.stringify(action);
                actionsContainer.appendChild(actionElement);
            });
        });
    });

    clearActionsButton.addEventListener('click', () => {
        chrome.storage.local.remove('actions', () => {
            actionsContainer.innerHTML = '';
            console.log('Actions cleared from Chrome storage.');
        });
    });

    record_run.addEventListener('click', () => {
        chrome.storage.local.get(['actions'], (result) => {
            const actions = result.actions || [];
            console.log('Retrieved actions:', actions);
    
            // Get the current active tab
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                const activeTab = tabs[0];
                
                // Send the actions to the content script
                chrome.tabs.sendMessage(activeTab.id, { action: 'RUN', data: actions, line: 0 }, (response) => {
                    console.log('Response from content script:', response);
                });
            });
        });
    });
});
