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
    const saveActionsButton = document.getElementById('save_actions');
    recordClickButton.addEventListener('dragstart', handleDragStart.bind(null, 'click'));
    recordTypeButton.addEventListener('dragstart', handleDragStart.bind(null, 'type'));
    //fetchActionsButton.addEventListener('click', fetchAndDisplayActions);
    clearActionsButton.addEventListener('click', clearActions);
    recordRunButton.addEventListener('click', runActions);
    recordWaitButton.addEventListener('click', handleWaitButtonClick);
    saveActionsButton.addEventListener('click', saveActions);
}

function saveActions() {
    chrome.storage.local.get(['actions', 'savedRecords'], (result) => {
        const actions = result.actions || [];
        let savedRecords = result.savedRecords || [];

        // Reference to the actions container
        const actionsContainer = document.getElementById('actions_container');

        // Check if actions array is empty
        if (actions.length === 0) {
            // Display a message indicating no actions to be saved
            actionsContainer.innerHTML = '<p>No actions are present to be saved.</p>';
        } else {
            // Create a record entry with a timestamp and the actions
            const timestamp = new Date().toISOString();
            const recordEntry = {
                time: timestamp,
                actions: actions
            };

            // Add the new record to the savedRecords list
            savedRecords.push(recordEntry);

            // Save the updated list back to Chrome storage and clear the actions
            chrome.storage.local.set({ savedRecords: savedRecords, actions: [] }, () => {
                console.log('Actions saved to savedRecords');

                // Display a success message in the actions_container
                actionsContainer.innerHTML = '<p>Actions have been saved successfully!</p>';
            });
        }
    });
}

function handleDragStart(actionType, event) {
    event.dataTransfer.setData('text/plain', actionType);
    event.dataTransfer.effectAllowed = 'move';
}

function fetchAndDisplayActions() {
    chrome.storage.local.get(['actions'], (result) => {
        const actions = result.actions || [];
        const actionsContainer = document.getElementById('actions_container');
        actionsContainer.innerHTML = ''; // Clear previous content

        if (actions.length === 0) {
            // Display a message if there are no actions
            const noActionsMessage = document.createElement('p');
            noActionsMessage.textContent = 'No actions available.';
            noActionsMessage.style.color = '#888'; // Optional: Gray color for the message
            noActionsMessage.style.textAlign = 'center'; // Optional: Center align the message
            actionsContainer.appendChild(noActionsMessage);
        } else {
            // Display each action
            actions.forEach((action, index) => {
                const actionDiv = createActionDiv(action, index);
                actionsContainer.appendChild(actionDiv);
            });
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

        chrome.runtime.sendMessage({ action: 'actions_run', data: actions }, (response) => {
            console.log('Response from background:', response.data);
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



function deleteAction(index) {
    chrome.storage.local.get(['actions'], (result) => {
        let actions = result.actions || [];

        if (index >= 0 && index < actions.length) {
            actions.splice(index, 1); // Remove the action at the specified index

            // Re-index the remaining actions
            actions.forEach((action, i) => {
                action.line = i; // Adjust the line numbers
            });

            // Save the updated actions array back to Chrome storage
            chrome.storage.local.set({ actions: actions }, () => {
                console.log('Action deleted and storage updated.');
                fetchAndDisplayActions(); // Refresh the displayed actions
            });
        }
    });
}


function createActionDiv(action, index) {
    const actionDiv = document.createElement('div');
    actionDiv.classList.add('action-entry');

    // Create a container to hold the main content and the delete button
    const contentContainer = document.createElement('div');
    contentContainer.style.display = 'flex';
    contentContainer.style.alignItems = 'center';
    contentContainer.style.justifyContent = 'space-between';

    // Extract the action type and tag (first and last elements of the "code" array)
    const actionType = capitalize(action.code[0]);
    const actionTag = action.code[action.code.length - 1];

    if (actionType.toLowerCase() === 'wait') {
        contentContainer.textContent = `Wait ${actionTag} ms`;
    } else {
        // Create a span for "Tag"
        const tagSpan = document.createElement('span');
        tagSpan.textContent = `Tag`;
        tagSpan.classList.add('clickable-tag');
        tagSpan.style.textDecoration = 'underline';
        tagSpan.style.cursor = 'pointer';

        // Create the text nodes for the surrounding text
        const beforeTagText = document.createTextNode(`${actionType} on `);

        // Hidden element for full XPath or details
        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('details');
        detailsDiv.textContent = actionTag;  // This should be your XPath or tag value
        detailsDiv.style.display = 'none';  // Hide initially

        // Create a delete button
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>'; // FontAwesome trash icon
        deleteButton.style.marginLeft = '10px';
        deleteButton.style.cursor = 'pointer';
        deleteButton.title = 'Delete this action';
        deleteButton.classList.add('delete-action');

        // Add click event to toggle the details visibility
        tagSpan.addEventListener('click', () => {
            detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
        });

        // Append the parts to the content container
        const textContainer = document.createElement('div');
        textContainer.appendChild(beforeTagText);
        textContainer.appendChild(tagSpan);
        textContainer.appendChild(detailsDiv);

        contentContainer.appendChild(textContainer);
        contentContainer.appendChild(deleteButton);
        // Add click event to delete the action
        deleteButton.addEventListener('click', () => {
            deleteAction(index);
         });
    }

    actionDiv.appendChild(contentContainer);

    

    return actionDiv;
}





function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
