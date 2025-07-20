// Add this to the content-scripts.js file or create a new file called inspection.js
// that would be included in the manifest

let inspectionModeActive = false;
let originalStyles = new Map();

// Listen for messages from the extension popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'enableInspector') {
    // Enable inspection mode
    inspectionModeActive = true;
    
    // Create floating tooltip to indicate inspection mode is active
    const tooltip = document.createElement('div');
    tooltip.id = 'herbie-inspector-tooltip';
    tooltip.textContent = 'Inspection mode active. Hover over elements and click to capture XPath.';
    tooltip.style.position = 'fixed';
    tooltip.style.top = '10px';
    tooltip.style.left = '10px';
    tooltip.style.padding = '8px 12px';
    tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.borderRadius = '4px';
    tooltip.style.zIndex = '999999';
    tooltip.style.fontFamily = 'Arial, sans-serif';
    tooltip.style.fontSize = '14px';
    document.body.appendChild(tooltip);
    
    // Add event listeners for hover and click
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    
    // Respond to the popup/background
    sendResponse({ status: 'success', message: 'Inspection mode enabled' });
    return true;
  }
  
  if (message.action === 'disableInspector') {
    disableInspectionMode();
    sendResponse({ status: 'success', message: 'Inspection mode disabled' });
    return true;
  }
});

// Handle mouse over event
function handleMouseOver(event) {
  if (!inspectionModeActive) return;
  
  // Prevent bubbling
  event.stopPropagation();
  
  const target = event.target;
  
  // Save original style to restore later
  if (!originalStyles.has(target)) {
    originalStyles.set(target, {
      outline: target.style.outline,
      outlineOffset: target.style.outlineOffset,
      cursor: target.style.cursor
    });
  }
  
  // Highlight the element
  target.style.outline = '2px solid #03a9f4';
  target.style.outlineOffset = '2px';
  target.style.cursor = 'pointer';
  
  // Update tooltip with element info
  const tooltip = document.getElementById('herbie-inspector-tooltip');
  if (tooltip) {
    const tagName = target.tagName.toLowerCase();
    const id = target.id ? `#${target.id}` : '';
    const classes = Array.from(target.classList).map(c => `.${c}`).join('');
    tooltip.textContent = `${tagName}${id}${classes} - Click to capture XPath`;
  }
}

// Handle mouse out event
function handleMouseOut(event) {
  if (!inspectionModeActive) return;
  
  // Prevent bubbling
  event.stopPropagation();
  
  const target = event.target;
  
  // Restore original styles
  if (originalStyles.has(target)) {
    const original = originalStyles.get(target);
    target.style.outline = original.outline;
    target.style.outlineOffset = original.outlineOffset;
    target.style.cursor = original.cursor;
  }
}

// Handle click event
function handleClick(event) {
  if (!inspectionModeActive) return;
  
  // Prevent default actions
  event.preventDefault();
  event.stopPropagation();
  
  // Get XPath of the clicked element
  const xpath = getElementXPath(event.target);
  
  // Send the XPath back to the extension
  chrome.runtime.sendMessage({
    action: 'xpathCaptured',
    xpath: xpath
  });
  
  // Disable inspection mode
  disableInspectionMode();
}

// Handle key down event (escape key to cancel)
function handleKeyDown(event) {
  if (inspectionModeActive && event.key === 'Escape') {
    disableInspectionMode();
    chrome.runtime.sendMessage({
      action: 'inspectionCancelled'
    });
  }
}

// Disable inspection mode and clean up
function disableInspectionMode() {
  inspectionModeActive = false;
  
  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick);
  document.removeEventListener('keydown', handleKeyDown);
  
  // Remove tooltip
  const tooltip = document.getElementById('herbie-inspector-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
  
  // Restore original styles for all elements
  originalStyles.forEach((originalStyle, element) => {
    if (element) {
      element.style.outline = originalStyle.outline;
      element.style.outlineOffset = originalStyle.outlineOffset;
      element.style.cursor = originalStyle.cursor;
    }
  });
  
  // Clear the map
  originalStyles.clear();
}

// Function to get XPath of an element
function getElementXPath(element) {
  if (!element) return '';
  
  // Try to use id if available
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  // Build XPath based on element hierarchy
  let paths = [];
  for (; element && element.nodeType === Node.ELEMENT_NODE; element = element.parentNode) {
    let index = 0;
    let hasFollowingSiblings = false;
    
    // Count siblings with same tag name
    for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
      if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE) continue;
      if (sibling.nodeName === element.nodeName) ++index;
    }
    
    // Check if element has following siblings
    for (let sibling = element.nextSibling; sibling && !hasFollowingSiblings; sibling = sibling.nextSibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
        hasFollowingSiblings = true;
      }
    }
    
    // Build the path
    const tagName = element.nodeName.toLowerCase();
    const pathIndex = (index > 0 || hasFollowingSiblings) ? `[${index + 1}]` : '';
    paths.unshift(`${tagName}${pathIndex}`);
  }
  
  return '/' + paths.join('/');
}