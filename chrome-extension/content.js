// Content script that runs on Webflow Designer pages
console.log('🤖 Cursor AI Element Builder loading...');

// Wait for Webflow Designer to be ready
function waitForDesigner() {
  return new Promise((resolve) => {
    const checkDesigner = () => {
      // Look for Webflow Designer indicators
      const designer = document.querySelector('[data-automation-id="designer-canvas"]') || 
                      document.querySelector('.designer-canvas') ||
                      document.querySelector('#canvas') ||
                      window.Webflow;
      
      if (designer || window.Webflow) {
        resolve();
      } else {
        setTimeout(checkDesigner, 1000);
      }
    };
    checkDesigner();
  });
}

// Create the AI Element Builder panel
function createAIPanel() {
  // Remove existing panel if it exists
  const existing = document.getElementById('cursor-ai-panel');
  if (existing) {
    existing.remove();
  }

  // Create panel container
  const panel = document.createElement('div');
  panel.id = 'cursor-ai-panel';
  panel.className = 'cursor-ai-panel';
  
  // Panel HTML
  panel.innerHTML = `
    <div class="cursor-ai-header">
      <div class="cursor-ai-logo">🤖</div>
      <h3 class="cursor-ai-title">AI Element Builder</h3>
      <button class="cursor-ai-close" id="cursor-ai-close">×</button>
    </div>
    
    <div class="cursor-ai-content">
      <div class="cursor-ai-tabs">
        <button class="cursor-ai-tab active" data-tab="create">Create</button>
        <button class="cursor-ai-tab" data-tab="settings">Settings</button>
      </div>
      
      <div class="cursor-ai-tab-content" id="create-tab">
        <div class="cursor-ai-element-types">
          <div class="cursor-ai-element-type" data-type="button">
            <div class="cursor-ai-element-icon">🔘</div>
            <span>Button</span>
          </div>
          <div class="cursor-ai-element-type" data-type="header">
            <div class="cursor-ai-element-icon">📋</div>
            <span>Header</span>
          </div>
          <div class="cursor-ai-element-type" data-type="card">
            <div class="cursor-ai-element-icon">🃏</div>
            <span>Card</span>
          </div>
          <div class="cursor-ai-element-type" data-type="form">
            <div class="cursor-ai-element-icon">📝</div>
            <span>Form</span>
          </div>
        </div>
        
        <div class="cursor-ai-form-group">
          <label class="cursor-ai-label">Describe your element:</label>
          <textarea 
            id="cursor-ai-prompt" 
            class="cursor-ai-textarea" 
            placeholder="e.g., 'Create a blue call-to-action button that says Get Started' or 'Make a modern pricing card with features list'"
            rows="4"
          ></textarea>
        </div>
        
        <button id="cursor-ai-generate" class="cursor-ai-button">
          <span class="cursor-ai-button-text">Generate Element</span>
          <div class="cursor-ai-spinner" style="display: none;"></div>
        </button>
        
        <div id="cursor-ai-preview" class="cursor-ai-preview" style="display: none;">
          <div class="cursor-ai-preview-header">
            <h4>Generated Code Preview</h4>
            <button id="cursor-ai-insert" class="cursor-ai-button cursor-ai-button-small">Insert into Page</button>
          </div>
          <div class="cursor-ai-preview-content">
            <pre id="cursor-ai-code-preview"></pre>
          </div>
        </div>
        
        <div id="cursor-ai-status" class="cursor-ai-status"></div>
      </div>
      
      <div class="cursor-ai-tab-content" id="settings-tab" style="display: none;">
        <div class="cursor-ai-form-group">
          <label class="cursor-ai-label">OpenAI API Key:</label>
          <input 
            type="password" 
            id="cursor-ai-api-key" 
            class="cursor-ai-input" 
            placeholder="sk-..."
          />
          <small class="cursor-ai-help">Your API key is stored locally and never shared</small>
        </div>
        
        <div class="cursor-ai-form-group">
          <label class="cursor-ai-label">API Endpoint:</label>
          <input 
            type="url" 
            id="cursor-ai-endpoint" 
            class="cursor-ai-input" 
            placeholder="https://your-api-endpoint.com"
            value="https://api.openai.com/v1/chat/completions"
          />
        </div>
        
        <button id="cursor-ai-save-settings" class="cursor-ai-button">Save Settings</button>
      </div>
    </div>
  `;

  // Add panel to page
  document.body.appendChild(panel);
  
  // Add event listeners
  setupEventListeners();
  
  // Load saved settings
  loadSettings();
}

// Create floating trigger button
function createTriggerButton() {
  const existing = document.getElementById('cursor-ai-trigger');
  if (existing) {
    existing.remove();
  }

  const trigger = document.createElement('div');
  trigger.id = 'cursor-ai-trigger';
  trigger.className = 'cursor-ai-trigger';
  trigger.innerHTML = `
    <div class="cursor-ai-trigger-icon">🤖</div>
    <div class="cursor-ai-trigger-text">AI Builder</div>
  `;
  
  trigger.addEventListener('click', () => {
    const panel = document.getElementById('cursor-ai-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    }
  });
  
  document.body.appendChild(trigger);
}

// Setup all event listeners
function setupEventListeners() {
  // Close panel
  document.getElementById('cursor-ai-close').addEventListener('click', () => {
    document.getElementById('cursor-ai-panel').style.display = 'none';
  });
  
  // Tab switching
  document.querySelectorAll('.cursor-ai-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update tab buttons
      document.querySelectorAll('.cursor-ai-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update tab content
      document.querySelectorAll('.cursor-ai-tab-content').forEach(content => {
        content.style.display = 'none';
      });
      document.getElementById(`${tabName}-tab`).style.display = 'block';
    });
  });
  
  // Element type selection
  document.querySelectorAll('.cursor-ai-element-type').forEach(type => {
    type.addEventListener('click', () => {
      document.querySelectorAll('.cursor-ai-element-type').forEach(t => t.classList.remove('selected'));
      type.classList.add('selected');
    });
  });
  
  // Generate element
  document.getElementById('cursor-ai-generate').addEventListener('click', generateElement);
  
  // Insert element
  document.getElementById('cursor-ai-insert').addEventListener('click', insertElement);
  
  // Save settings
  document.getElementById('cursor-ai-save-settings').addEventListener('click', saveSettings);
}

// Generate element using AI
async function generateElement() {
  const prompt = document.getElementById('cursor-ai-prompt').value.trim();
  const selectedType = document.querySelector('.cursor-ai-element-type.selected');
  const elementType = selectedType ? selectedType.dataset.type : undefined;
  
  if (!prompt) {
    showStatus('Please enter a description for your element', 'error');
    return;
  }
  
  const generateBtn = document.getElementById('cursor-ai-generate');
  const buttonText = generateBtn.querySelector('.cursor-ai-button-text');
  const spinner = generateBtn.querySelector('.cursor-ai-spinner');
  
  // Show loading state
  buttonText.textContent = 'Generating...';
  spinner.style.display = 'inline-block';
  generateBtn.disabled = true;
  
  try {
    const result = await callAIAPI(prompt, elementType);
    
    // Show preview
    const preview = document.getElementById('cursor-ai-preview');
    const codePreview = document.getElementById('cursor-ai-code-preview');
    
    codePreview.textContent = result.html + '\n\n' + result.css;
    preview.style.display = 'block';
    
    // Store generated code for insertion
    window.cursorAIGeneratedCode = result;
    
    showStatus('Element generated successfully!', 'success');
    
  } catch (error) {
    console.error('Generation error:', error);
    showStatus(error.message || 'Failed to generate element', 'error');
  } finally {
    // Reset button state
    buttonText.textContent = 'Generate Element';
    spinner.style.display = 'none';
    generateBtn.disabled = false;
  }
}

// Call AI API (OpenAI or your custom endpoint)
async function callAIAPI(prompt, elementType) {
  const settings = await getSettings();
  
  if (!settings.apiKey) {
    throw new Error('Please configure your OpenAI API key in settings');
  }
  
  const systemPrompt = `You are a web developer assistant that generates HTML and CSS code based on user descriptions.

Guidelines:
1. Generate clean, semantic HTML
2. Use modern CSS with proper styling
3. Make elements responsive when possible
4. Use appropriate classes for styling
5. Don't use external dependencies or frameworks
6. Keep the code simple but visually appealing
7. Use appropriate colors and spacing
8. Make sure the code is ready to be inserted into a web page

${elementType ? `Focus on creating a ${elementType} element.` : ''}

Return your response in this exact JSON format:
{
  "html": "your HTML code here",
  "css": "your CSS code here",
  "elementType": "${elementType || 'generic'}"
}

Make sure the JSON is valid and properly escaped.`;

  const response = await fetch(settings.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a web element based on this description: ${prompt}` }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from AI');
  }
  
  try {
    return JSON.parse(content);
  } catch (e) {
    // Fallback to template if JSON parsing fails
    return generateFallbackElement(prompt, elementType);
  }
}

// Insert element into Webflow Designer
function insertElement() {
  const generatedCode = window.cursorAIGeneratedCode;
  
  if (!generatedCode) {
    showStatus('No element to insert', 'error');
    return;
  }
  
  try {
    // Try to use Webflow's internal APIs if available
    if (window.Webflow && window.Webflow.designer) {
      insertViaWebflowAPI(generatedCode);
    } else {
      // Fallback: create a visual representation
      insertViaDOM(generatedCode);
    }
    
    showStatus('Element inserted successfully!', 'success');
    
    // Hide preview
    document.getElementById('cursor-ai-preview').style.display = 'none';
    document.getElementById('cursor-ai-prompt').value = '';
    
  } catch (error) {
    console.error('Insertion error:', error);
    showStatus(error.message || 'Failed to insert element', 'error');
  }
}

// Insert via Webflow's internal API (if available)
function insertViaWebflowAPI(generatedCode) {
  // This would require reverse engineering Webflow's internal APIs
  // For now, we'll use the DOM method
  insertViaDOM(generatedCode);
}

// Insert via DOM manipulation
function insertViaDOM(generatedCode) {
  // Find the designer canvas
  const canvas = document.querySelector('[data-automation-id="designer-canvas"]') ||
                document.querySelector('.designer-canvas') ||
                document.querySelector('#canvas iframe');
  
  if (!canvas) {
    throw new Error('Could not find Webflow canvas');
  }
  
  // Create element and styles
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = generatedCode.html;
  
  // Add CSS styles
  const styleElement = document.createElement('style');
  styleElement.textContent = generatedCode.css;
  document.head.appendChild(styleElement);
  
  // For demonstration, we'll show a modal with the code
  showInsertionModal(generatedCode);
}

// Show insertion modal (since direct insertion is complex)
function showInsertionModal(generatedCode) {
  const modal = document.createElement('div');
  modal.className = 'cursor-ai-modal';
  modal.innerHTML = `
    <div class="cursor-ai-modal-content">
      <div class="cursor-ai-modal-header">
        <h3>Element Generated!</h3>
        <button class="cursor-ai-modal-close">×</button>
      </div>
      <div class="cursor-ai-modal-body">
        <p>Your element has been generated. Copy the code below and paste it into your Webflow project:</p>
        <div class="cursor-ai-code-block">
          <h4>HTML:</h4>
          <textarea readonly>${generatedCode.html}</textarea>
          <h4>CSS:</h4>
          <textarea readonly>${generatedCode.css}</textarea>
        </div>
        <div class="cursor-ai-modal-actions">
          <button id="copy-html" class="cursor-ai-button cursor-ai-button-small">Copy HTML</button>
          <button id="copy-css" class="cursor-ai-button cursor-ai-button-small">Copy CSS</button>
          <button id="copy-all" class="cursor-ai-button">Copy All</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  modal.querySelector('.cursor-ai-modal-close').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Copy buttons
  document.getElementById('copy-html').addEventListener('click', () => {
    navigator.clipboard.writeText(generatedCode.html);
    showStatus('HTML copied to clipboard!', 'success');
  });
  
  document.getElementById('copy-css').addEventListener('click', () => {
    navigator.clipboard.writeText(generatedCode.css);
    showStatus('CSS copied to clipboard!', 'success');
  });
  
  document.getElementById('copy-all').addEventListener('click', () => {
    navigator.clipboard.writeText(generatedCode.html + '\n\n' + generatedCode.css);
    showStatus('All code copied to clipboard!', 'success');
  });
}

// Fallback element generation
function generateFallbackElement(prompt, elementType) {
  const templates = {
    button: {
      html: `<button class="ai-generated-button">${extractButtonText(prompt)}</button>`,
      css: `.ai-generated-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}`
    },
    header: {
      html: `<h1 class="ai-generated-header">${extractHeaderText(prompt)}</h1>`,
      css: `.ai-generated-header {
  font-size: 2.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 1rem;
  text-align: center;
}`
    },
    card: {
      html: `<div class="ai-generated-card">
  <h3 class="card-title">Card Title</h3>
  <p class="card-description">${prompt}</p>
  <button class="card-button">Learn More</button>
</div>`,
      css: `.ai-generated-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-width: 300px;
}`
    }
  };
  
  const template = templates[elementType] || templates.button;
  return {
    html: template.html,
    css: template.css,
    elementType: elementType || 'generic'
  };
}

// Utility functions
function extractButtonText(prompt) {
  const match = prompt.match(/["']([^"']+)["']/) || prompt.match(/says? (\w+(?:\s+\w+)*)/i);
  return match ? match[1] : 'Click Me';
}

function extractHeaderText(prompt) {
  const match = prompt.match(/["']([^"']+)["']/) || prompt.match(/header? (?:that )?says? (?:["'])?([^"',.]+)/i);
  return match ? match[1] : 'Your Header Here';
}

function showStatus(message, type = 'info') {
  const status = document.getElementById('cursor-ai-status');
  status.textContent = message;
  status.className = `cursor-ai-status cursor-ai-status-${type}`;
  
  setTimeout(() => {
    status.textContent = '';
    status.className = 'cursor-ai-status';
  }, 5000);
}

// Settings management
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiKey', 'endpoint'], (result) => {
      resolve({
        apiKey: result.apiKey || '',
        endpoint: result.endpoint || 'https://api.openai.com/v1/chat/completions'
      });
    });
  });
}

function saveSettings() {
  const apiKey = document.getElementById('cursor-ai-api-key').value;
  const endpoint = document.getElementById('cursor-ai-endpoint').value;
  
  chrome.storage.local.set({ apiKey, endpoint }, () => {
    showStatus('Settings saved successfully!', 'success');
  });
}

async function loadSettings() {
  const settings = await getSettings();
  document.getElementById('cursor-ai-api-key').value = settings.apiKey;
  document.getElementById('cursor-ai-endpoint').value = settings.endpoint;
}

// Initialize when DOM is ready
async function init() {
  console.log('🤖 Waiting for Webflow Designer...');
  await waitForDesigner();
  console.log('✅ Webflow Designer detected, injecting AI Element Builder...');
  
  createTriggerButton();
  createAIPanel();
  
  console.log('🚀 Cursor AI Element Builder ready!');
}

// Start the extension
init().catch(console.error);