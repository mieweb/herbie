document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    const recordClickButton = document.getElementById('record_click');
    const recordTypeButton = document.getElementById('record_type');
    const fetchActionsButton = document.getElementById('fetch_actions');
    const clearActionsButton = document.getElementById('clear_actions');
    const recordRunButton = document.getElementById('record_run');
    const recordWaitButton = document.getElementById('record_wait');

    recordClickButton.addEventListener('dragstart', handleDragStart.bind(null, 'click'));
    recordTypeButton.addEventListener('dragstart', handleDragStart.bind(null, 'type'));
    fetchActionsButton.addEventListener('click', fetchAndDisplayActions);
    clearActionsButton.addEventListener('click', clearActions);
    recordRunButton.addEventListener('click', runActions);
    recordWaitButton.addEventListener('click', handleWaitButtonClick);
}

function handleDragStart(actionType, event) {
    event.dataTransfer.setData('text/plain', actionType);
    event.dataTransfer.effectAllowed = 'move';
}

function fetchAndDisplayActions() {
    chrome.storage.local.get(['actions'], (result) => {
        const actions = result.actions || [];
        if (actions.length === 0) {
            displayNoActionsMessage();
        } else {
            displayActions(actions);
        }
    });
}

function displayNoActionsMessage() {
    const actionsContainer = document.getElementById('actions_container');
    actionsContainer.innerHTML = 'No actions present';
}

function clearActions() {
    chrome.storage.local.remove('actions', () => {
        const actionsContainer = document.getElementById('actions_container');
        actionsContainer.innerHTML = '';
        console.log('Actions cleared from Chrome storage.');
    });
}

function runActions() {
    chrome.storage.local.get(['actions'], (result) => {
        const actions = result.actions || [];
        console.log('Retrieved actions:', actions);

        // Get the current active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (activeTab) {
                // Send the actions to the content script
                chrome.tabs.sendMessage(activeTab.id, { action: 'RUN', data: actions, line: 0 }, (response) => {
                    console.log('Response from content script:', response);
                });
            }
        });
    });
}

function handleWaitButtonClick() {
    const actionsContainer = document.getElementById('actions_container');

    // Create an input form for wait duration
    const inputContainer = document.createElement('div');
    inputContainer.style.marginTop = '10px';
    inputContainer.id = 'wait-input-container';  // Add an ID for easy reference

    const waitLabel = document.createElement('label');
    waitLabel.textContent = "Wait Duration (ms): ";
    waitLabel.style.marginRight = '10px';

    const waitInput = document.createElement('input');
    waitInput.type = 'number';
    waitInput.placeholder = 'Enter time in ms';
    waitInput.style.marginRight = '10px';

    const submitButton = document.createElement('button');
    submitButton.textContent = "Add Wait";
    submitButton.style.padding = '5px 10px';
    submitButton.style.cursor = 'pointer';

    inputContainer.appendChild(waitLabel);
    inputContainer.appendChild(waitInput);
    inputContainer.appendChild(submitButton);
    actionsContainer.appendChild(inputContainer);

    submitButton.addEventListener('click', () => {
        const waitDuration = waitInput.value.trim();

        if (waitDuration && !isNaN(waitDuration)) {
            addWaitAction(waitDuration);
            inputContainer.remove(); // Remove the input UI after adding the action
        } else {
            alert("Please enter a valid number for the wait duration.");
        }
    });
}

function addWaitAction(waitDuration) {
    chrome.storage.local.get(['actions'], (result) => {
        const actions = result.actions || [];

        const command = {
            line: actions.length,
            code: ["wait", waitDuration],
            src: `wait ${waitDuration}`,
            timeout: parseInt(waitDuration, 10),
            subcommands: []
        };

        actions.push(command);

        // Store the updated actions array in Chrome storage
        chrome.storage.local.set({ actions: actions }, () => {
            fetchAndDisplayActions(); // Refresh the entire actions list in the UI
            console.log('Wait action added to Chrome storage.');
        });
    });
}


function displayActions(actions) {
    const actionsContainer = document.getElementById('actions_container');
    actionsContainer.innerHTML = ''; // Clear previous content

    actions.forEach((action) => {
        const actionDiv = createActionDiv(action);
        actionsContainer.appendChild(actionDiv);
    });
}

function createActionDiv(action) {
    const actionDiv = document.createElement('div');
    actionDiv.classList.add('action-entry');

    // Extract the action type and tag (first and last elements of the "code" array)
    const actionType = capitalize(action.code[0]);
    const actionTag = action.code[action.code.length - 1];

    if (actionType.toLowerCase() === 'wait') {
        actionDiv.textContent = `Wait ${actionTag} ms`;
    } else {
        // Create a clickable span for "Tag"
        const tagSpan = document.createElement('span');
        tagSpan.textContent = `${actionType} on Tag`;
        tagSpan.classList.add('clickable-tag');
        tagSpan.style.color = 'blue';
        tagSpan.style.cursor = 'pointer';

        // Hidden element for full XPath or details
        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('details');
        detailsDiv.textContent = actionTag;  // This should be your XPath or tag value
        detailsDiv.style.display = 'none';  // Hide initially

        // Append the tagSpan and detailsDiv to the actionDiv
        actionDiv.appendChild(tagSpan);
        actionDiv.appendChild(detailsDiv);

        // Debugging to ensure the XPath is correct
        console.log('Action Tag:', actionTag);
        console.log('Details Div:', detailsDiv);

        // Add click event to toggle the details visibility
        tagSpan.addEventListener('click', () => {
            console.log("Tag clicked, toggling details visibility.");
            detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
            console.log("Details Div display state:", detailsDiv.style.display);
        });
    }

    return actionDiv;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
