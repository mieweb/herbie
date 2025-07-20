// Event listeners for drag and drop operations
document.addEventListener('dragover', handleDragOver);
document.addEventListener('dragleave', handleDragLeave);
document.addEventListener('drop', handleDrop);

// Handle the drag over event
function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const data = event.dataTransfer.getData('text/plain');
    applyDragStyle(event.target, data);
}

// Handle the drag leave event
function handleDragLeave(event) {
    removeDragStyle(event.target);
}

// Handle the drop event
async function handleDrop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData('text/plain');
  
    if (data === 'click') {
      await handleDropClick(event);
    } else if (data === 'type' && isInputOrTextarea(event.target)) {
      await handleDropType(event);
    } else if (data === 'verify') {
      await handleDropVerify(event);
    } else {
      console.log('Dropped on a non-highlightable element:', event.target);
    }
  
    if (data === 'verify') {
      event.target.style.border = '2px dashed green';
    }
}

// Apply drag style to the target element
function applyDragStyle(target, data) {
    if (data === 'click') {
        target.style.border = '2px dashed red';
    } else if (data === 'type' && isInputOrTextarea(target)) {
        target.style.border = '2px dashed blue';
    }
}

// Remove drag style only if the element is not in the process of dropping
function removeDragStyle(target) {
    if (isHighlightableElement(target)) {
        target.style.border = ''; // Remove the border style
    }
}

// Check if the element is an input or textarea
function isInputOrTextarea(element) {
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
}

// Check if the element is highlightable
function isHighlightableElement(element) {
    return element.tagName === 'BUTTON' || 
           (element.tagName === 'INPUT' && 
           ['checkbox', 'radio', 'text'].includes(element.type)) || 
           element.tagName === 'TEXTAREA';
}

// Handle drop event for "click" action
async function handleDropClick(event) {
    console.log('Dropped click on:', event.target);
    const xpath = getElementXPath(event.target);

    const command = {
        line: 0, // Line number will be adjusted when fetching the existing actions
        code: ["click", "in", xpath],
        src: `Click on the '${xpath}' element.`,
        timeout: 5000,
        subcommands: []
    };

    await addActionToStorage(command);

    // Ensure the border remains after the drop
    event.target.style.border = '2px dashed red';
}

// Handle drop event for "type" action
async function handleDropType(event) {
    console.log('Dropped type on:', event.target);

    const container = createEditableContainer();
    positionContainer(container, event.target);
    document.body.appendChild(container);

    const plusButton = container.querySelector('button');
    const span = container.querySelector('span');

    plusButton.addEventListener('click', async () => {
        const inputValue = span.innerText.replace('+', '').trim();
        console.log('Input value:', inputValue);

        const xpath = getElementXPath(event.target);

        const command = {
            line: 0, // Line number will be adjusted when fetching the existing actions
            code: ["type", `'${inputValue}'`, "in", xpath],
            src: `Type '${inputValue}' in '${xpath}' input.`,
            timeout: 5000,
            subcommands: []
        };

        await addActionToStorage(command);
        container.remove(); // Remove the container after the action is stored

        // Ensure the border remains after the drop
        event.target.style.border = '2px dashed blue';
    });
}

// Create an editable container for the type action
function createEditableContainer() {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.zIndex = 1000;
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    const span = document.createElement('span');
    span.contentEditable = true;
    span.style.backgroundColor = 'blue';
    span.style.border = '1px solid blue';
    span.style.padding = '2px';
    span.style.color = 'white';
    span.innerText = 'Enter text';

    const plusButton = document.createElement('button');
    plusButton.innerText = '+';
    plusButton.style.marginLeft = '5px';
    plusButton.style.padding = '2px 5px';
    plusButton.style.backgroundColor = 'white';
    plusButton.style.border = '1px solid blue';
    plusButton.style.color = 'blue';
    plusButton.style.cursor = 'pointer';

    container.appendChild(span);
    container.appendChild(plusButton);

    return container;
}

// Position the editable container relative to the target element
function positionContainer(container, target) {
    const rect = target.getBoundingClientRect();
    container.style.top = `${rect.top - 25}px`;
    container.style.left = `${rect.left}px`;

    // Adjust position when the input/textarea moves
    const observer = new MutationObserver(() => {
        const newRect = target.getBoundingClientRect();
        container.style.top = `${newRect.top - 25}px`;
        container.style.left = `${newRect.left}px`;
    });

    observer.observe(target, { attributes: true, childList: true, subtree: true });
}

// Function to get the XPath of an element
function getElementXPath(element) {
    let paths = [];
    for (; element && element.nodeType === Node.ELEMENT_NODE; element = element.parentNode) {
        let index = 0;
        for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
            if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE) continue;
            if (sibling.nodeName === element.nodeName) ++index;
        }
        let tagName = element.nodeName.toLowerCase();
        let pathIndex = (index ? `[${index + 1}]` : '');
        paths.splice(0, 0, `${tagName}${pathIndex}`);
    }
    return paths.length ? `/${paths.join('/')}` : null;
}

// Function to add the action to Chrome storage
async function addActionToStorage(command) {
    // Fetch the existing actions from Chrome storage
    const result = await new Promise((resolve) => {
        chrome.storage.local.get(['actions'], resolve);
    });

    let actions = result.actions || [];
    
    // Update the line number for the new command
    command.line = actions.length;

    // Append the new command to the existing actions
    actions.push(command);

    // Store the updated actions array in Chrome storage
    await new Promise((resolve) => {
        chrome.storage.local.set({ actions: actions }, resolve);
    });

    console.log('Actions updated and saved to Chrome storage:', actions);
}
async function handleDropVerify(event) {
    console.log('Dropped verify on:', event.target);
  
    // Capture the XPath or selector for the element
    const xpath = getElementXPath(event.target);
  
    // Ask the user for the text they want to verify
    const verifyText = prompt('Enter the text to verify in this element:', '');
  
    if (verifyText) {
      const command = {
        line: 0,  // This will be updated when saving actions
        code: ["verify", `"${verifyText}"`, "in", `"${xpath}"`],
        src: `verify "${verifyText}" in "${xpath}"`,
        timeout: 5000,
        subcommands: []
      };
  
      // Add the command to storage
      await addActionToStorage(command);
  
      // Provide visual feedback
      event.target.style.border = '2px dashed green';
    } else {
      alert('Please enter valid text for verification.');
    }
  }
  
