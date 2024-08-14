document.addEventListener('DOMContentLoaded', () => {
    const xpathTextarea = document.getElementById('keyword-xpath');
    chrome.storage.local.get(['saved_xpath'], (result) => {
        if (result.saved_xpath) {
            document.getElementById('keyword-xpath').value = result.saved_xpath;
        }
    });
    
    document.getElementById('inspect-element').addEventListener('click', startInspecting);
    document.getElementById('add-keyword').addEventListener('click', addKeyword);
    loadKeywords();
    xpathTextarea.addEventListener('input', () => {
        const currentValue = xpathTextarea.value;
        chrome.storage.local.set({ saved_xpath: currentValue }, () => {
          console.log('XPath value saved:', currentValue);
        });
      });
    
      // Optional: Save the value again when the popup is closed
      window.addEventListener('beforeunload', () => {
        const currentValue = xpathTextarea.value;
        chrome.storage.local.set({ saved_xpath: currentValue }, () => {
          console.log('XPath value saved on close:', currentValue);
        });
      });
});

function startInspecting() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'start_inspecting' }, response => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                }
            });
        }
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'set_xpath') {
        const xpathInput = document.getElementById('keyword-xpath');
        xpathInput.value = message.xpath;
        
        chrome.storage.local.set({ 'saved_xpath': message.xpath }, () => {
            console.log('XPath value saved:', message.xpath);
        });
        
        sendResponse({ status: 'success', data: message.xpath });
    }
});



function addKeyword() {
    const keywordInput = document.getElementById('new-keyword');
    const xpathInput = document.getElementById('keyword-xpath');
    const globalCheckbox = document.getElementById('keyword-global');
    const hasVariableCheckbox = document.getElementById('has-variable');

    const keyword = keywordInput.value.trim();
    const xpath = escapeXpath(xpathInput.value.trim());
    const isGlobal = globalCheckbox.checked;
    const hasVariable = hasVariableCheckbox.checked;

    if (keyword !== '' && xpath !== '') {
        const storageKey = isGlobal ? 'globalKeywords' : getCurrentPageKey();

        chrome.storage.local.get({ [storageKey]: [] }, (result) => {
            const keywords = result[storageKey];
            keywords.push({ keyword, xpath, global: isGlobal, hasVariable });
            chrome.storage.local.set({ [storageKey]: keywords }, () => {
                keywordInput.value = '';
                xpathInput.value = '';
                globalCheckbox.checked = false;
                hasVariableCheckbox.checked = false;
                loadKeywords();
            });
        });
    }
}

function saveEditedXpath(index, newXpath, isGlobal) {
    const storageKey = isGlobal ? 'globalKeywords' : getCurrentPageKey();
    chrome.storage.local.get({ [storageKey]: [] }, (result) => {
      const keywords = result[storageKey];
      keywords[index].xpath = newXpath;
      chrome.storage.local.set({ [storageKey]: keywords }, () => {
        loadKeywords();
      });
    });
  }
  function loadKeywords() {
    const globalKey = 'globalKeywords';
    const pageKey = getCurrentPageKey();
  
    chrome.storage.local.get({ [globalKey]: [], [pageKey]: [] }, (result) => {
        const globalKeywords = result[globalKey];
        const globalKeywordsList = document.getElementById('global-keywords-list');
        globalKeywordsList.innerHTML = '';

        globalKeywords.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'keyword-item';
  
            li.innerHTML = `
                <div class="keyword-header">
                    <span class="keyword-name">${item.keyword}</span>
                    <div class="keyword-actions">
                        <button class="delete-keyword" aria-label="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <div class="keyword-details" style="display: none;">
                    <textarea class="xpath">${item.xpath}</textarea>
                    <label>
                        <input type="checkbox" class="has-variable" ${item.hasVariable ? 'checked' : ''}> Has Variable
                    </label>
                </div>
            `;
  
            const deleteButton = li.querySelector('.delete-keyword');
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent the toggle when deleting
                deleteKeyword(index, true);
            });
  
            li.querySelector('.keyword-header').addEventListener('click', () => {
                const details = li.querySelector('.keyword-details');
                if (details.classList.contains('active')) {
                    details.style.display = 'none'; // Explicitly set display to none
                    details.classList.remove('active');
                } else {
                    details.style.display = 'flex'; // Explicitly set display to flex
                    details.classList.add('active');
                }
            });
  
            const xpathInput = li.querySelector('.xpath');
            xpathInput.addEventListener('blur', () => {
                const newXpath = escapeXpath(xpathInput.value.trim());
                saveEditedXpath(index, newXpath, true);
            });
  
            const hasVariableCheckbox = li.querySelector('.has-variable');
            hasVariableCheckbox.addEventListener('change', () => {
                const isChecked = hasVariableCheckbox.checked;
                saveHasVariable(index, isChecked, true);
            });
  
            globalKeywordsList.appendChild(li);
        });
    });
}
  

function saveEditedXpath(index, newXpath, isGlobal) {
    const storageKey = isGlobal ? 'globalKeywords' : getCurrentPageKey();
    chrome.storage.local.get({ [storageKey]: [] }, (result) => {
      const keywords = result[storageKey];
      keywords[index].xpath = newXpath;
      chrome.storage.local.set({ [storageKey]: keywords }, () => {
        loadKeywords();
      });
    });
  }
function deleteKeyword(index, isGlobal) {
  const storageKey = isGlobal ? 'globalKeywords' : getCurrentPageKey();

  chrome.storage.local.get({ [storageKey]: [] }, (result) => {
    const keywords = result[storageKey];
    keywords.splice(index, 1);
    chrome.storage.local.set({ [storageKey]: keywords }, () => {
      loadKeywords();
    });
  });
}

function escapeXpath(xpath) {
    // If the XPath contains double quotes, we'll escape them by using single quotes for XPath strings
    if (xpath.includes('"')) {
        // Handle cases where both single and double quotes are used
        xpath = xpath.replace(/"/g, '\"');  // Escape double quotes by adding a backslash before them
    }
    return xpath;
}


function getCurrentPageKey() {
    return window.location.hostname.replace(/\./g, '_');
}

function saveHasVariable(index, hasVariable, isGlobal) {
    const storageKey = isGlobal ? 'globalKeywords' : getCurrentPageKey();

    chrome.storage.local.get({ [storageKey]: [] }, (result) => {
        const keywords = result[storageKey];
        keywords[index].hasVariable = hasVariable; // Update the hasVariable property
        chrome.storage.local.set({ [storageKey]: keywords }, () => {
            console.log(`Has Variable status saved for keyword at index ${index}: ${hasVariable}`);
        });
    });
}
