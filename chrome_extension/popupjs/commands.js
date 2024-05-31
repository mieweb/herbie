function clearCommand() {
    document.getElementById('herbie_output').textContent = "Cleared!";
}

function saveCommand() {
    const logsElement = document.getElementById('herbie_output');
    const logMessage = logsElement.textContent;

    const timestamp = new Date().toISOString();

    const logEntry = {
        time: timestamp,
        log: logMessage
    };

    chrome.storage.local.get({ herbieLogs: [] }, (result) => {
        const logs = result.herbieLogs;
        logs.push(logEntry);

        chrome.storage.local.set({ herbieLogs: logs }, () => {
            logsElement.textContent = "Logs saved!";
        });
    });
}

function addCommand() {
    const commandInput = document.getElementById('herbie_command').value;
    const scriptTextarea = document.getElementById('herbie_script');

    if (commandInput.trim() !== '') {
        scriptTextarea.value += `\n${commandInput}`;
        document.getElementById('herbie_command').value = '';  // Clear the input after adding
    }
}

function runCommand() {
    document.getElementById('herbie_output').textContent = "";
    const scriptContent = document.getElementById('herbie_script').value;
    chrome.runtime.sendMessage({ action: 'RUN', data: scriptContent }, (response) => {
        console.log('Response from background:', response.data);
        updateProgressBar(0, response.data.length);
    });
}

function parseCommand() {
    const scriptContent = document.getElementById('herbie_command').value;
    document.getElementById('herbie_output').textContent = "Loading.....";
    chrome.runtime.sendMessage({ action: 'parse', data: scriptContent }, (response) => {
        console.log('Response from background:', response.data);
        const prettyResponse = JSON.stringify(response.data, null, 2);
        document.getElementById('herbie_output').textContent = prettyResponse;
    });
}
