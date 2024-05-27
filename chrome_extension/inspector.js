function cssPath(el) {
    var fullPath    = 0,  // Set to 1 to build ultra-specific full CSS-path, or 0 for optimised selector
        useNthChild = 1,  // Set to 1 to use ":nth-child()" pseudo-selectors to match the given element
        cssPathStr = '',
        testPath = '',
        parents = [],
        parentSelectors = [],
        tagName,
        cssId,
        cssClass,
        tagSelector,
        vagueMatch,
        nth,
        i,
        c;

    while ( el ) {                              // Go up the list of parent nodes and build unique identifier for each:
        vagueMatch = 0;

        tagName = el.nodeName.toLowerCase(); 	      // Get the node's HTML tag name in lowercase
        cssId = ( el.id ) ? ( '#' + el.id ) : false;  // Get node's ID attribute, adding a '#'

        // Get node's CSS classes, replacing spaces with '.':
        cssClass = ( el.className ) ? ( '.' + el.className.replace(/\s+/g,".") ) : '';

        // Build a unique identifier for this parent node:
        if ( cssId ) {                          // Matched by ID:
            tagSelector = tagName + cssId + cssClass;
        } else if ( cssClass ) {                // Matched by class (will be checked for multiples afterwards):
            tagSelector = tagName + cssClass;
        } else {                                // Couldn't match by ID or class, so use ":nth-child()" instead:
            vagueMatch = 1;
            tagSelector = tagName;
        }


        // If using ":nth-child()" selectors and this selector has no ID / isn't the html or body tag:
        if ( useNthChild && !tagSelector.match(/#/) && !tagSelector.match(/^(html|body)$/) ) {

            // If there's no CSS class, or if the semi-complete CSS selector path matches multiple elements:
            if ( !tagSelector.match(/\./) || el.parentElement.childElementCount > 1 ) {

                // Count element's previous siblings for ":nth-child" pseudo-selector:
                for ( nth = 1, c = el; c.previousElementSibling; c = c.previousElementSibling, nth++ );

                // Append ":nth-child()" to CSS path:
                tagSelector += ":nth-child(" + nth + ")";
            }
        }

        parentSelectors.unshift( tagSelector )   // Add this full tag selector to the parentSelectors array:
        
        if ( cssId && !fullPath ) // If doing short/optimised CSS paths and this element has an ID, stop here:
            break;
        el = el.parentNode !== document ? el.parentNode : false;		// Go up to the next parent node
    }

    for (i=0; i<parentSelectors.length; i++)
        cssPathStr += parentSelectors[i] + ' ';

    // Return trimmed full CSS path:
    return cssPathStr.replace(/^[ \t]+|[ \t]+$/, '');
}


function getLabel(el) {
    var label;

    // If we have a label, our job is easy.
    label = $("label[for='"+el.id+"']");
    if (label.length===1) {
        return label.text();
    }

    switch (el.tagName) {
        case 'INPUT':
            switch (el.type) {
                case 'checkbox':
                    if (el.id=='')
                        label = "'" + el.value + "' checkbox";
                    else
                        label = "'#" + el.id + "' checkbox";
                    break;
                case 'text':
                    if (el.id=='')
                        label = "'" + el.name + "' input";
                    else
                        label = "'#" + el.id + "' input";
                    break;

                default:
                    label = cssPath(el);
            }
            break;

        case 'BUTTON':
            label = "'" + el.innerText + "' button";
            break;
        case 'SELECT':
            if (el.id=='')
                label = "'" + el.name + "' dropdown";
            else
                label = "'#" + el.id + "' dropdown";
            break;

        default:
            label = cssPath(el);
    }
    return label;
}
function getXPath(element) {
    if (element.id !== '') {
      return `//*[@id="${element.id}"]`;
    }
    if (element === document.body) {
      return '/html/body';
    }
  
    let index = 0;
    const siblings = element.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) {
        const tagName = element.tagName.toLowerCase();
        const nth = (index > 0) ? `[${index + 1}]` : '';
        return `${getXPath(element.parentNode)}/${tagName}${nth}`;
      }
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        index++;
      }
    }
  }
    
function mouseOverHandler(event) {
    if (event.target && event.target.style) {
      event.target.style.outline = '2px solid red';
    }
  }
  
  function mouseOutHandler(event) {
    if (event.target && event.target.style) {
      event.target.style.outline = '';
    }
  }

document.addEventListener('click', (e) => {
    console.log( cssPath(e.target) );
    console.log( getLabel(e.target) );
    console.log('XPath of the clicked element:', getXPath(e.target));
    document.removeEventListener('mouseout',mouseOutHandler,true);
    document.removeEventListener('mouseover',mouseOverHandler,true);
  });
  
  
  

  

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === 'start_inspection'){
        document.addEventListener('mouseover', mouseOverHandler, true);
        document.addEventListener('mouseout', mouseOutHandler, true);
        sendResponse({ status: 'success', data: 'inspector started' });
    }
    if(message.action === 'stop_inspection'){
        document.removeEventListener('mouseover', mouseOverHandler, true);
        document.removeEventListener('mouseout', mouseOutHandler, true);
        sendResponse({ status: 'success', data: 'inspector started' });
    }
  });