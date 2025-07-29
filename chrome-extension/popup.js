// Popup script for Cursor AI Element Builder Chrome Extension

document.addEventListener('DOMContentLoaded', async () => {
  const toggleButton = document.getElementById('toggle-panel');
  const openWebflowButton = document.getElementById('open-webflow');
  const statusDiv = document.getElementById('popup-status');
  const helpLink = document.getElementById('help-link');
  const settingsLink = document.getElementById('settings-link');
  const feedbackLink = document.getElementById('feedback-link');

  // Check if current tab is Webflow Designer
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isWebflowDesigner = tab.url && (
    tab.url.includes('webflow.com/design/') || 
    tab.url.includes('.webflow.com/design/')
  );

  // Update UI based on current page
  if (isWebflowDesigner) {
    statusDiv.className = 'popup-status active';
    statusDiv.innerHTML = '<strong>✅ Webflow Designer Detected</strong><br>Ready to generate AI elements!';
    toggleButton.disabled = false;
    toggleButton.textContent = 'Open AI Panel';
  } else {
    statusDiv.className = 'popup-status inactive';
    statusDiv.innerHTML = '<strong>❌ Not on Webflow Designer</strong><br>Navigate to a Webflow Designer page to use this extension.';
    toggleButton.disabled = true;
    toggleButton.textContent = 'Open AI Panel (Disabled)';
  }

  // Toggle AI panel
  toggleButton.addEventListener('click', async () => {
    if (isWebflowDesigner) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            const trigger = document.getElementById('cursor-ai-trigger');
            if (trigger) {
              trigger.click();
            }
          }
        });
        window.close();
      } catch (error) {
        console.error('Failed to toggle panel:', error);
      }
    }
  });

  // Open Webflow Designer
  openWebflowButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://webflow.com/dashboard' });
    window.close();
  });

  // Help link
  helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ 
      url: 'https://github.com/your-username/webflow-cursor-ai-app/blob/main/README.md' 
    });
    window.close();
  });

  // Settings link
  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (isWebflowDesigner) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Show AI panel and switch to settings tab
          const panel = document.getElementById('cursor-ai-panel');
          if (panel) {
            panel.style.display = 'flex';
            const settingsTab = document.querySelector('[data-tab="settings"]');
            if (settingsTab) {
              settingsTab.click();
            }
          }
        }
      });
      window.close();
    } else {
      alert('Please navigate to a Webflow Designer page to access settings.');
    }
  });

  // Feedback link
  feedbackLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ 
      url: 'https://github.com/your-username/webflow-cursor-ai-app/issues' 
    });
    window.close();
  });

  // Check for stored API key and show status
  chrome.storage.local.get(['apiKey'], (result) => {
    if (result.apiKey) {
      const apiStatus = document.createElement('div');
      apiStatus.style.cssText = `
        font-size: 12px;
        color: #28a745;
        text-align: center;
        margin-top: 10px;
        padding: 8px;
        background: #d4edda;
        border-radius: 4px;
      `;
      apiStatus.textContent = '✅ OpenAI API Key configured';
      document.querySelector('.popup-content').appendChild(apiStatus);
    } else {
      const apiStatus = document.createElement('div');
      apiStatus.style.cssText = `
        font-size: 12px;
        color: #dc3545;
        text-align: center;
        margin-top: 10px;
        padding: 8px;
        background: #f8d7da;
        border-radius: 4px;
      `;
      apiStatus.innerHTML = '⚠️ OpenAI API Key not configured<br><small>Click Settings to add your API key</small>';
      document.querySelector('.popup-content').appendChild(apiStatus);
    }
  });
});