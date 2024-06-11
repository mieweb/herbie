
function addKeyword() {
    const keywordInput = document.getElementById('new-keyword');
    const xpathInput = document.getElementById('keyword-xpath');
    const globalCheckbox = document.getElementById('keyword-global');

    const keyword = keywordInput.value.trim();
    const xpath = escapeXpath(xpathInput.value.trim());
    const isGlobal = globalCheckbox.checked;

    if (keyword !== '' && xpath !== '') {
        const storageKey = isGlobal ? 'globalKeywords' : `keywords_${getCurrentPageKey()}`;
        
        chrome.storage.local.get({ [storageKey]: [] }, (result) => {
            const keywords = result[storageKey];
            keywords.push({ keyword, xpath, global: isGlobal });
            chrome.storage.local.set({ [storageKey]: keywords }, () => {
                keywordInput.value = '';
                xpathInput.value = '';
                globalCheckbox.checked = false;
                loadKeywords();
            });
        });
    }
}

function loadKeywords() {
    const globalKey = 'globalKeywords';
    const pageKey = `keywords_${getCurrentPageKey()}`;

    chrome.storage.local.get({ [globalKey]: [], [pageKey]: [] }, (result) => {
        const globalKeywords = result[globalKey];
        const pageKeywords = result[pageKey];
        const globalKeywordsList = document.getElementById('global-keywords-list');
        const localKeywordsList = document.getElementById('local-keywords-list');
        globalKeywordsList.innerHTML = '';
        localKeywordsList.innerHTML = '';

        displayKeywords(globalKeywords, globalKeywordsList);
        displayKeywords(pageKeywords, localKeywordsList);
    });
}

function displayKeywords(keywords, keywordsList) {
    keywords.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="keyword">${item.keyword}:</span> 
            <input type="text" class="xpath" value="${item.xpath}" data-index="${index}" data-global="${item.global}">
            <button class="delete-keyword"><i class="fas fa-trash-alt"></i></button>
        `;

        const deleteButton = li.querySelector('.delete-keyword');
        deleteButton.addEventListener('click', () => {
            deleteKeyword(index, item.global);
        });

        const xpathInput = li.querySelector('.xpath');
        xpathInput.addEventListener('focus', (e) => {
            xpathInput.setAttribute('data-old-value', xpathInput.value);
        });

        xpathInput.addEventListener('blur', (e) => {
            const newXpath = escapeXpath(xpathInput.value.trim());
            const oldXpath = xpathInput.getAttribute('data-old-value');
            if (newXpath !== oldXpath) {
                saveEditedXpath(index, newXpath, item.global);
            }
        });

        keywordsList.appendChild(li);
    });
}

function saveEditedXpath(index, newXpath, isGlobal) {
    const storageKey = isGlobal ? 'globalKeywords' : `keywords_${getCurrentPageKey()}`;
    chrome.storage.local.get({ [storageKey]: [] }, (result) => {
        const keywords = result[storageKey];
        keywords[index].xpath = newXpath;
        chrome.storage.local.set({ [storageKey]: keywords }, () => {
            loadKeywords();
        });
    });
}

function deleteKeyword(index, isGlobal) {
    const storageKey = isGlobal ? 'globalKeywords' : `keywords_${getCurrentPageKey()}`;

    chrome.storage.local.get({ [storageKey]: [] }, (result) => {
        const keywords = result[storageKey];
        keywords.splice(index, 1);
        chrome.storage.local.set({ [storageKey]: keywords }, () => {
            loadKeywords();
        });
    });
}

function escapeXpath(xpath) {
    return xpath.replace(/"/g, '&quot;');
}

function getCurrentPageKey() {
    return window.location.hostname.replace(/\./g, '_');
}
