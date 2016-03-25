var commands = "";
var ports = {};

chrome.runtime.onConnect.addListener(function(port) {
    // Remember the port to talk to this endpoint
    ports[port.name] = port;

    port.onMessage.addListener(function(request, sender, sendResponse) {
        switch(request.type){
            case 'action':
                commands += request.message;

                // Forward the message to the popup
                ports['popup'].postMessage(request);
                break;
        }
    });

    if(port.name == 'popup') {
        // Tell the new popup what commands we have saved
        port.postMessage({
            type: 'opened', 
            message: commands
        });
    }
});
