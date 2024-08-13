document.addEventListener('DOMContentLoaded', () => {
    const recordClickButton = document.getElementById('record_click');
    const recordTypeButton = document.getElementById('record_type');
    const fetchActionsButton = document.getElementById('fetch_actions');
    const actionsContainer = document.getElementById('actions_container');
    const clearActionsButton = document.getElementById('clear_actions');
    const recordWaitButton = document.getElementById('record_wait');
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
            if(actions.length == 0){
                const actionsContainer = document.getElementById('actions_container');
                actionsContainer.innerHTML = 'No actions present';
            }else{
                displayActions(actions);
            }
            
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


function displayActions(actions) {
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    const actionsContainer = document.getElementById('actions_container');
    actionsContainer.innerHTML = ''; // Clear previous content

    actions.forEach((action, index) => {
        const actionDiv = document.createElement('div');
        actionDiv.classList.add('action-entry');

        // Extract the action type and tag (first and last elements of the "code" array)
        const actionType = action.code[0];
        const actionTag = action.code[action.code.length - 1];

        // Create the display text
        const displayText = `${capitalize(actionType)} on Tag`;

        // Create a clickable span for "Tag"
        const tagSpan = document.createElement('span');
        tagSpan.textContent = 'Tag';
        tagSpan.classList.add('clickable-tag');
        tagSpan.style.color = 'blue';
        tagSpan.style.cursor = 'pointer';

        // Hidden element for full XPath or details
        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('details');
        detailsDiv.textContent = actionTag;
        detailsDiv.style.display = 'none'; // Hide initially

        // Append the display text and the tag span to the action div
        actionDiv.innerHTML = displayText.replace('Tag', tagSpan.outerHTML);
        actionDiv.appendChild(detailsDiv);

        // Add click event to toggle the details visibility
        actionDiv.querySelector('.clickable-tag').addEventListener('click', () => {
            detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
        });

        // Append the action div to the container
        actionsContainer.appendChild(actionDiv);
    });
}


