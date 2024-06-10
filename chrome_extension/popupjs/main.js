document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for command buttons
    document.getElementById('herbie_parse').addEventListener('click', parseCommand);
    document.getElementById('herbie_add').addEventListener('click', addCommand);
    document.getElementById('herbie_run').addEventListener('click', runCommand);
    document.getElementById('herbie_clear').addEventListener('click', clearCommand);
    document.getElementById('herbie_save_logs').addEventListener('click', saveCommand);
    document.getElementById('herbie_save').addEventListener('click', saveScript);
    document.getElementById('export-logs').addEventListener('click', exportLogs);
    document.getElementById('import-button').addEventListener('click', () => {
        document.getElementById('import-file').click();
      });
      document.getElementById('import-file').addEventListener('change', importScripts);
    // Chrome runtime message listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'log_msg') {
            appendLogMessage(message.message);
        }
        if (message.action === 'progress') {
            updateProgressBar(message.current, message.total);
            if (message.current == message.total) {
                document.getElementById("herbie_progress").style.width = "0px";
            }
        }
    });

    // Tab navigation
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tabContent => tabContent.classList.remove('active'));

            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            if (tabId === 'tab2') {
                loadLogs();
            }
            if (tabId === 'tab3') {
                loadSavedScripts();
            }
        });
    });

    loadLogs();
    loadSavedScripts();
});
