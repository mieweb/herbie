
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('herbie_parse').addEventListener('click', parseCommand);
  });
  
 
  
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
  