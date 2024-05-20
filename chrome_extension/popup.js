document.getElementById('startHerbie').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
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
    // You can replace this with the actual logic you want Herbie to perform
    alert('Herbie is starting!');
  }
  