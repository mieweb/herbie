function updateProgressBar(current, total) {
    const progressBar = document.getElementById('herbie_progress');
    const percentage = Math.round((current / total) * 100);
    progressBar.style.width = `${percentage}%`;
}

function appendLogMessage(msg) {
    const outputElement = document.getElementById('herbie_output');
    outputElement.textContent += `\n${msg}`;
    outputElement.scrollTop = outputElement.scrollHeight;
}
function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0; // Convert to unsigned 32-bit integer
}

function getCurrentPageKey() {
    const url = new URL(window.location.href);
    const path = url.pathname;
    const params = url.search;
    const fullString = `${path}${params}`;
    const hashedKey = hashString(fullString);
    return `keywords_${hashedKey}`;
}

const draggableElement = document.getElementById('draggable-element');
draggableElement.addEventListener('dragstart', (e) => {
  e.dataTransfer.setData('text', 'This is a draggable element');
});