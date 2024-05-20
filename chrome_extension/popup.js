document.getElementById('startHerbie').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error('No active tabs found');
        return;
      }
  
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: simulateTyping,
          args: ['#lastname', 'Hello, world!'] // Provide the selector and the text as arguments
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else {
            console.log('Simulated typing executed successfully');
          }
        }
      );
    });
  });
  
  function simulateTyping(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const keydownEvent = new KeyboardEvent('keydown', { key: char, bubbles: true });
        const keyupEvent = new KeyboardEvent('keyup', { key: char, bubbles: true });
        const inputEvent = new InputEvent('input', { bubbles: true, data: char });
        
        element.dispatchEvent(keydownEvent);
        element.value += char;
        element.dispatchEvent(inputEvent);
        element.dispatchEvent(keyupEvent);
      }
      const changeEvent = new Event('change', { bubbles: true });
      element.dispatchEvent(changeEvent);
    } else {
      console.error('Element not found');
    }
  }
  