

function log(log) {
    chrome.runtime.sendMessage({ action: 'log', data: log }, (response) => {
        console.log('Response from background:', response.data);
    });
}

function highlightElement(event) {
    event.target.style.outline = '2px solid red';
}

function removeHighlight(event) {
    event.target.style.outline = '';
}

function captureXPath(event) {
    event.preventDefault();
    event.stopPropagation();
    
    document.removeEventListener('mouseover', highlightElement);
    document.removeEventListener('mouseout', removeHighlight);
    document.removeEventListener('click', captureXPath, true);
    
    const element = event.target;
    const xpath = getElementXPath(element);
    console.log(xpath);
    chrome.runtime.sendMessage({ action: 'set_xpath', xpath: xpath}, (response) => {
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

