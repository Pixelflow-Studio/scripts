// Background script for Cursor AI Element Builder Chrome Extension

// Install handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🤖 Cursor AI Element Builder installed');
  
  if (details.reason === 'install') {
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Cursor AI Element Builder',
      message: 'Extension installed! Visit a Webflow Designer page to start using AI-powered element generation.'
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Check if we're on a Webflow Designer page
  if (tab.url && (tab.url.includes('webflow.com/design/') || tab.url.includes('.webflow.com/design/'))) {
    // Toggle the AI panel
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: toggleAIPanel
    });
  } else {
    // Show notification to navigate to Webflow Designer
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Cursor AI Element Builder',
      message: 'Please navigate to a Webflow Designer page to use this extension.'
    });
  }
});

// Function to toggle AI panel (injected into page)
function toggleAIPanel() {
  const trigger = document.getElementById('cursor-ai-trigger');
  if (trigger) {
    trigger.click();
  }
}

// Listen for tab updates to show/hide extension based on URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isWebflowDesigner = tab.url.includes('webflow.com/design/') || tab.url.includes('.webflow.com/design/');
    
    // Update extension icon based on whether we're on a Webflow Designer page
    chrome.action.setIcon({
      tabId: tabId,
      path: {
        16: isWebflowDesigner ? 'icons/icon16.png' : 'icons/icon16-disabled.png',
        32: isWebflowDesigner ? 'icons/icon32.png' : 'icons/icon32-disabled.png',
        48: isWebflowDesigner ? 'icons/icon48.png' : 'icons/icon48-disabled.png',
        128: isWebflowDesigner ? 'icons/icon128.png' : 'icons/icon128-disabled.png'
      }
    });
    
    // Update extension title
    chrome.action.setTitle({
      tabId: tabId,
      title: isWebflowDesigner 
        ? 'Click to toggle Cursor AI Element Builder'
        : 'Cursor AI Element Builder (only works on Webflow Designer pages)'
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showNotification') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: request.title || 'Cursor AI Element Builder',
      message: request.message
    });
  }
  
  if (request.action === 'openOptionsPage') {
    chrome.runtime.openOptionsPage();
  }
  
  // Return true to indicate we will respond asynchronously
  return true;
});

// Context menu for quick access
chrome.contextMenus.create({
  id: 'cursor-ai-generate',
  title: 'Generate AI Element',
  contexts: ['selection'],
  documentUrlPatterns: [
    'https://webflow.com/design/*',
    'https://*.webflow.com/design/*'
  ]
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'cursor-ai-generate' && info.selectionText) {
    // Inject script to use selected text as prompt
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: useSelectedTextAsPrompt,
      args: [info.selectionText]
    });
  }
});

// Function to use selected text as prompt (injected into page)
function useSelectedTextAsPrompt(selectedText) {
  // Show AI panel if hidden
  const panel = document.getElementById('cursor-ai-panel');
  if (panel) {
    panel.style.display = 'flex';
  }
  
  // Set the selected text as the prompt
  const promptTextarea = document.getElementById('cursor-ai-prompt');
  if (promptTextarea) {
    promptTextarea.value = selectedText;
    promptTextarea.focus();
  }
}