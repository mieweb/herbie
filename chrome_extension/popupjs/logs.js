function loadLogs() {
    chrome.storage.local.get({ herbieLogs: [] }, (result) => {
        const logs = result.herbieLogs;
        const logsContainer = document.getElementById('logs-container');
        logsContainer.innerHTML = ''; // Clear the container

        if (logs.length === 0) {
            logsContainer.innerHTML = "<p>No logs available.</p>";
        } else {
            logs.reverse();

            logs.forEach((log, index) => {
                const logEntry = document.createElement('div');
                logEntry.classList.add('log-entry');
                logEntry.innerHTML = `
                    <div class="log-header">
                        <strong>${new Date(log.time).toLocaleString()}</strong>
                        <button class="delete-log" data-index="${index}" aria-label="Delete Log">
                            <i title="Delete" class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                    <pre>${log.log}</pre>
                `;
                logsContainer.appendChild(logEntry);
            });

            const deleteButtons = document.querySelectorAll('.delete-log');
            deleteButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const index = this.getAttribute('data-index');
                    deleteLog(index);
                });
            });
        }
    });
}

function deleteLog(index) {
    chrome.storage.local.get({ herbieLogs: [] }, (result) => {
        const logs = result.herbieLogs;
        logs.splice(logs.length - 1 - index, 1); // Adjust index for reversed array

        chrome.storage.local.set({ herbieLogs: logs }, () => {
            loadLogs(); // Reload the logs to update the UI
        });
    });
}

function exportLogs() {
    chrome.storage.local.get({ herbieLogs: [] }, (result) => {
        const logs = result.herbieLogs;
        let logText = '';
        const progressBarContainer = document.getElementById('logs-progress-bar-container');
        const progressBar = document.getElementById('logs-progress-bar');

        progressBarContainer.style.display = 'block'; // Show progress bar
        progressBar.style.width = '0%'; // Reset progress bar

        logs.reverse();

        logs.forEach((log, index) => {
            logText += `---- Log ${index + 1} ----\n`;
            logText += `Time: ${new Date(log.time).toLocaleString()}\n\n`;
            logText += `${log.log}\n\n`;
            const progress = Math.round(((index + 1) / logs.length) * 100);
            progressBar.style.width = `${progress}%`;
        });

        const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(logText);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "herbie_logs.txt");
        document.body.appendChild(downloadAnchorNode); // Required for Firefox
        downloadAnchorNode.click();
        document.body.removeChild(downloadAnchorNode); // Clean up

        progressBarContainer.style.display = 'none';
    });
}
