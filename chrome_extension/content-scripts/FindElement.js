

function findElementThroughHeading(htext, childtext, depth) {
    // Construct the depth part of the XPath
    let parentPath = '';
    for (let i = 0; i < depth; i++) {
        parentPath += '/..';
    }
   
    // Construct the full XPath expression
    const xpath = `//*[self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::h6 or self::label or self::span or self::div][contains(text(),"${htext}")]${parentPath}/descendant::*[(contains(text(),${childtext}) or contains(@value,${childtext}) or contains(@title,${childtext}) or contains(@alt,${childtext}) or contains(@placeholder,${childtext}))]`;
   
    // Evaluate the XPath expression and return the matching elements
    const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const elements = [];
    for (let i = 0; i < result.snapshotLength; i++) {
        elements.push(result.snapshotItem(i));
    }
    return elements;
}

function FindDesc(desc) {
    try {
        var xpathResult = document.evaluate(desc, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (xpathResult.singleNodeValue) {
            el = $(xpathResult.singleNodeValue);
            logAttempt('XPath', el);
            if (el.length) return el;
        }
    } catch (e) {}
     
    var el, hadterm = 0;
    var originalDesc = desc;

    // Normalize description to be case-insensitive
    desc = desc.toLowerCase();

    // Append colon if not present
    if (!desc.match(':$')) {
        desc += ':';
    } else {
        hadterm = 1;
    }

    // Function to log attempts and results
    function logAttempt(method, result) {
        if (result.length) {
            console.log(`Found element using ${method} for description: "${originalDesc}"`);
        } else {
            console.log(`No element found using ${method} for description: "${originalDesc}"`);
        }
    }

    // 1. Try to find label with text containing the description
    try {
        el = $('label').filter(function() {
            return $(this).text().trim().toLowerCase().includes(desc);
        });
        if (el.length) {
            el = el.first();
            el = $('#' + el.attr('for'));
            logAttempt('label text', el);
            if (el.length) return el;
        }
    } catch (ex) {}

    // Remove trailing colon and try again
    desc = desc.slice(0, -1);

    try {
        el = $('label').filter(function() {
            return $(this).text().trim().toLowerCase().includes(desc);
        });
        if (el.length) {
            el = el.first();
            el = $('#' + el.attr('for'));
            logAttempt('label text without colon', el);
            if (el.length) return el;
        }
    } catch (ex) {}

    // Add colon back if it was originally present
    if (hadterm) {
        desc += ':';
    }

    // 2. Look for buttons containing the description
    try {
        el = $('button').filter(function() {
            return $(this).text().trim().toLowerCase().includes(desc);
        });
        logAttempt('button text', el);
        if (el.length) return el.first();
    } catch (ex) {}

    // 3. Look for links containing the description
    try {
        el = $('a').filter(function() {
            return $(this).text().trim().toLowerCase().includes(desc);
        });
        logAttempt('link text', el);
        if (el.length) return el.first();
    } catch (ex) {}

    // 4. Try to use the description as a jQuery selector
    try {
        el = $(desc);
        logAttempt('jQuery selector', el);
        if (el.length === 1) return el;
    } catch (e) {}

 

    // Log final failure
    console.log(`Failed to find element for description: "${originalDesc}"`);

    // Return empty array if no match is found
    return [];
}