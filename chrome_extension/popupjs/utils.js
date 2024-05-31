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
