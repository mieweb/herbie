let actions = [];

document.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const data = event.dataTransfer.getData('text/plain');
    if (data === 'click') {
        event.target.style.border = '2px dashed red';
    } else if (data === 'type' && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
        event.target.style.border = '2px dashed blue';
    }
});

document.addEventListener('dragleave', (event) => {
    if (event.target.tagName === 'BUTTON' || (event.target.tagName === 'INPUT' && (event.target.type === 'checkbox' || event.target.type === 'radio' || event.target.type === 'text')) || event.target.tagName === 'TEXTAREA') {
        event.target.style.border = ''; // Remove the border when dragging leaves the element
    } else {
        event.target.style.border = ''; // Also remove the border for any other element
    }
});

document.addEventListener('drop', (event) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('text/plain');

    if (data === 'click') {
        event.target.style.border = '2px dashed red';
        console.log('Dropped click on:', event.target); // Log the drop event

        // Get the XPath of the target element
        const xpath = getElementXPath(event.target);

        // Create a command object for click
        const command = {
            line: actions.length,
            code: ["click", "in", xpath],
            src: `Click on the '${xpath}' element.`,
            timeout: 5000,
            subcommands: []
        };
        actions.push(command);
        console.log('Actions:', actions);
        // Store the actions array in Chrome storage
        chrome.storage.local.set({ actions: actions }, () => {
            console.log('Actions saved to Chrome storage.');
        });

    } else if (data === 'type' && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
        event.target.style.border = '2px dashed blue';
        console.log('Dropped type on:', event.target); // Log the drop event

        // Create a container for the editable span and the "+" button
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.zIndex = 1000;
        container.style.display = 'flex';
        container.style.alignItems = 'center';

        // Create an editable span
        const span = document.createElement('span');
        span.contentEditable = true;
        span.style.backgroundColor = 'blue';
        span.style.border = '1px solid blue';
        span.style.padding = '2px';
        span.style.color = 'white';
        span.innerText = 'Enter text';

        // Create the "+" button
        const plusButton = document.createElement('button');
        plusButton.innerText = '+';
        plusButton.style.marginLeft = '5px';
        plusButton.style.padding = '2px 5px';
        plusButton.style.backgroundColor = 'white';
        plusButton.style.border = '1px solid blue';
        plusButton.style.color = 'blue';
        plusButton.style.cursor = 'pointer';

        // Append the span and the "+" button to the container
        container.appendChild(span);
        container.appendChild(plusButton);

        // Position the container
        const rect = event.target.getBoundingClientRect();
        container.style.top = `${rect.top - 25}px`; // Adjust the position as needed
        container.style.left = `${rect.left}px`;

        // Append the container to the body
        document.body.appendChild(container);

        // Adjust the container's position when the input/textarea moves
        const observer = new MutationObserver(() => {
            const rect = event.target.getBoundingClientRect();
            container.style.top = `${rect.top - 25}px`;
            container.style.left = `${rect.left}px`;
        });

        observer.observe(event.target, { attributes: true, childList: true, subtree: true });

        // Handle the "+" button click event
        plusButton.addEventListener('click', () => {
            const inputValue = span.innerText.replace('+', '').trim(); // Remove the "+" character and trim
            console.log('Input value:', inputValue);

            // Get the XPath of the target element
            const xpath = getElementXPath(event.target);

            // Create a command object for type
            const command = {
                line: actions.length,
                code: ["type", `'${inputValue}'`, "in", xpath],
                src: `Type '${inputValue}' in '${xpath}' input.`,
                timeout: 5000,
                subcommands: []
            };
            actions.push(command);
            console.log('Actions:', actions);
            // Store the actions array in Chrome storage
            chrome.storage.local.set({ actions: actions }, () => {
                console.log('Actions saved to Chrome storage.');
            });
            // Remove the container
            container.remove();
        });
    } else {
        console.log('Dropped on a non-highlightable element:', event.target);
    }
});

function captureXPath(event) {
    event.preventDefault();
    event.stopPropagation();
    
    document.removeEventListener('mouseover', highlightElement);
    document.removeEventListener('mouseout', removeHighlight);
    document.removeEventListener('click', captureXPath, true);
    
    const element = event.target;
    const xpath = getElementXPath(element);
    console.log(xpath);
    chrome.runtime.sendMessage({ action: 'set_xpath', xpath: xpath }, (response) => {
        console.log(response);
    });
}

function getElementXPath(element) {
    let paths = [];
    for (; element && element.nodeType == Node.ELEMENT_NODE; element = element.parentNode) {
        let index = 0;
        for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
            if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE) continue;
            if (sibling.nodeName == element.nodeName) ++index;
        }
        let tagName = element.nodeName.toLowerCase();
        let pathIndex = (index ? `[${index + 1}]` : '');
        paths.splice(0, 0, `${tagName}${pathIndex}`);
    }
    return paths.length ? `/${paths.join('/')}` : null;
}
