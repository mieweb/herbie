$(document).ready(function() {
    $('#startHerbie').on('click', function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs.length === 0) {
          console.error('No active tabs found');
          return;
        }
  
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: startHerbie
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
            } else {
              console.log('Herbie script executed successfully');
            }
          }
        );
      });
    });
  
    function startHerbie() {
      // Example usage of jQuery Simulate
      // This will simulate a click on an element with ID 'example' on the current tab
      $('#example').simulate('click');
      alert('Herbie is starting!');
    }
  });
  