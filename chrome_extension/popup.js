
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('herbie_parse').addEventListener('click', parseCommand);
    document.getElementById('herbie_add').addEventListener('click', addCommand);
    document.getElementById('herbie_run').addEventListener('click', runCommand);
    document.getElementById('herbie_inspect').addEventListener('click', inspectCommand);
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if(message.action === 'log_msg'){
            appendLogMessage(message.message);
        }
        if (message.action === 'progress') {
            updateProgressBar(message.current, message.total);
        }
      });
  });
  


function inspectCommand(){
    chrome.runtime.sendMessage({ action: 'start_inspecting', data: "start_inspecting"}, (response) => {
        console.log('Response from background:', response.data);
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

function  runCommand(){
    document.getElementById('herbie_output').textContent="";
      // Get the content of the herbie_script textarea
      const scriptContent = document.getElementById('herbie_script').value;
      // Send the content to the background script
      chrome.runtime.sendMessage({ action: 'RUN', data: scriptContent }, (response) => {
         console.log('Response from background:', response.data);
         updateProgressBar(0,response.data.length);
      });
}
function parseCommand() {
     // Get the content of the herbie_script textarea
     const scriptContent = document.getElementById('herbie_script').value;
     // Send the content to the background script
     document.getElementById('herbie_output').textContent = "Loading.....";
     chrome.runtime.sendMessage({ action: 'parse', data: scriptContent }, (response) => {
        console.log('Response from background:', response.data);
        // Pretty print the JSON response
        const prettyResponse = JSON.stringify(response.data, null, 2);
        // Display the pretty JSON in the herbie_output div
        document.getElementById('herbie_output').textContent = prettyResponse;
     });

}

function appendLogMessage(msg) {
    const outputElement = document.getElementById('herbie_output');
    outputElement.textContent += `\n${msg}`;
    // Auto-scroll to the bottom of the output
    outputElement.scrollTop = outputElement.scrollHeight;
}

function updateProgressBar(current, total) {
    const progressBar = document.getElementById('herbie_progress');
    const percentage = Math.round((current / total) * 100);
    progressBar.style.width = `${percentage}%`;
}
