$(document).ready(function(){
    // Set up a port to communicate with the extension
    var port = chrome.runtime.connect({name: "popup"});

    // Listen for responses to our openning message
    port.onMessage.addListener(function(request, sender, sendResponse) {
        var command_area = $('#commands');
        switch(request.type){
            case 'opened':
                command_area.val(request.message);
                break;
            case 'action':
                command_area.val(command_area.val() + request.message);
                break;
        }
    });
});
