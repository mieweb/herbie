
var cmdtree = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'RUN') {
        const scriptContent = message.data;
        cmdtree = scriptContent;

        var options = { line: message.line, delay: 100, cmdtree: cmdtree };

        // Ensure cmdtree is properly structured
        if (!Array.isArray(cmdtree) || cmdtree.length === 0) {
            sendResponse({ status: 'error', data: 'Invalid script content received' });
            console.error('Invalid script content received:', scriptContent);
            return;
        }

        ExecuteScript(cmdtree, options, function (done, option, comment) {
            if (option) {
                var currentCmd = option.cmdtree[option.line];
                if (currentCmd && currentCmd.src) {
                    var txt = 'Line: ' + (option.line + 1) + ', Cmd:' + currentCmd.src + '\n';
                    log(txt);
                }
            }

            if (comment) {
                log(comment);
            }
        });

        sendResponse({ status: 'success', data: 'Script received' });
        console.log('Script content received from background:', scriptContent);
    }

    return true; // Keep the messaging channel open for asynchronous responses
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'start_inspecting') {
        document.addEventListener('mouseover', highlightElement);
        document.addEventListener('mouseout', removeHighlight);
        document.addEventListener('click', captureXPath, true);
    }
});

// content.js

// Function to handle drop event
function handleDrop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData('text');
    console.log('Dropped data:', data);

    if (event.target.tagName === 'INPUT' || event.target.tagName === 'BUTTON') {
        if (event.target.tagName === 'INPUT') {
            event.target.value = data;  // For input fields
        } else if (event.target.tagName === 'BUTTON') {
            event.target.textContent = data;  // For buttons
        }
        event.target.classList.remove('highlight');  // Remove highlight class after drop
    }
}

// Function to allow drop
function allowDrop(event) {
    event.preventDefault();
}

// Function to handle drag enter event
function handleDragEnter(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'BUTTON') {
        event.target.classList.add('highlight');  // Add highlight class on drag enter
    }
}

// Function to handle drag leave event
function handleDragLeave(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'BUTTON') {
        event.target.classList.remove('highlight');  // Remove highlight class on drag leave
    }
}

// Add event listeners for drag and drop
document.addEventListener('dragover', allowDrop);
document.addEventListener('drop', handleDrop);
document.addEventListener('dragenter', handleDragEnter);
document.addEventListener('dragleave', handleDragLeave);

// Add event listeners specifically for input fields and buttons
function addDragAndDropListeners() {
    const inputsAndButtons = document.querySelectorAll('input, button');
    inputsAndButtons.forEach(element => {
        element.addEventListener('dragover', allowDrop);
        element.addEventListener('drop', handleDrop);
        element.addEventListener('dragenter', handleDragEnter);
        element.addEventListener('dragleave', handleDragLeave);
    });
}

// Run the function to add event listeners
addDragAndDropListeners();
// Inject CSS for the highlight class
const style = document.createElement('style');
style.textContent = `
.highlight {
    border: 2px dashed #007bff;
}
`;
document.head.append(style);

