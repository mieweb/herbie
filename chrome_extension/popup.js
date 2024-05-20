document.getElementById('startHerbie').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error('No active tabs found');
        return;
      }
  
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: simulateClick
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else {
            console.log('Simulated click executed successfully');
          }
        }
      );
    });
  });
  
  function simulateClick() {

    const element = document.querySelector('#OK'); 
    if (element) {
      element.click();
    } else {
      console.error('Element not found');
    }
  }
  