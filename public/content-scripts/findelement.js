async function find_element(desc, retries = 5, delay = 1000) {
    // Remove unnecessary quotes around desc
    desc = desc.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          //  console.log(`Attempt ${attempt}/${retries} - Searching for element using "${desc}"`);
            
            // Try finding the element using XPath (Only if it starts with //)
            if (desc.startsWith("//")) {
                const xpathResult = document.evaluate(
                    desc,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                );

                if (xpathResult.singleNodeValue) {
                    console.log(`Found element using XPath:`, xpathResult.singleNodeValue);
                    return xpathResult.singleNodeValue;
                }
            }

            // Try using CSS selector (Only if it's not an XPath)
            let el = null;
            try {
                el = document.querySelector(desc);
                if (el) {
                   // console.log(`Found element using CSS selector:`, el);
                    return el;
                }
            } catch (e) {
                //console.warn(`Invalid CSS selector: "${desc}"`);
            }

            // Normalize for case-insensitive search
            const normalizedDesc = desc.trim();
            //console.log(normalizedDesc)
            // Search for labels with matching text
            el = Array.from(document.querySelectorAll('label')).find(label =>
                label.textContent.trim().includes(normalizedDesc)
            );
            if (el) {
                const forAttr = el.getAttribute('for');
                if (forAttr) el = document.getElementById(forAttr);
                if (el) {
                  //  console.log(`Found element using label:`, el);
                    return el;
                }
            }

            // Search for buttons and links containing the description
            el = Array.from(document.querySelectorAll('button, a')).find(element =>
                element.textContent.trim().includes(normalizedDesc)
            );
            if (el) {
              //  console.log(`Found element using button or link text:`, el);
                return el;
            }

           // console.warn(`Attempt ${attempt}: Element not found for description: "${desc}"`);

            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            //console.error(`Error in find_element (attempt ${attempt}):`, error);
        }
    }

    //console.error(`Element not found after ${retries} attempts for description: "${desc}"`);
    return null;
}
