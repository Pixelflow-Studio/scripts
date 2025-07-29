interface GeneratedElement {
  html: string
  css: string
  elementType: string
}

// This would integrate with your AI service (OpenAI, Claude, etc.)
export async function generateElement(prompt: string, elementType?: string): Promise<GeneratedElement> {
  try {
    // For demo purposes, we'll use a simple OpenAI integration
    // In production, you'd want to use your preferred AI service
    const response = await fetch('/api/generate-element', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        elementType,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate element')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error generating element:', error)
    throw error
  }
}

// Fallback function for when AI service is not available
export function generateElementFallback(prompt: string, elementType?: string): GeneratedElement {
  const type = elementType || 'div'
  
  // Simple template-based generation for common elements
  const templates = {
    button: {
      html: `<button class="ai-generated-button">${prompt.includes('button') ? extractButtonText(prompt) : 'Click Me'}</button>`,
      css: `
.ai-generated-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.ai-generated-button:hover {
  background: #0056b3;
}
      `
    },
    header: {
      html: `<h1 class="ai-generated-header">${extractHeaderText(prompt)}</h1>`,
      css: `
.ai-generated-header {
  font-size: 2.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 1rem;
  text-align: center;
}
      `
    },
    card: {
      html: `
<div class="ai-generated-card">
  <div class="card-content">
    <h3 class="card-title">Card Title</h3>
    <p class="card-description">${prompt}</p>
    <button class="card-button">Learn More</button>
  </div>
</div>
      `,
      css: `
.ai-generated-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-width: 300px;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: #2c3e50;
}

.card-description {
  color: #6c757d;
  margin-bottom: 15px;
  line-height: 1.5;
}

.card-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
      `
    },
    text: {
      html: `<p class="ai-generated-text">${prompt}</p>`,
      css: `
.ai-generated-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
  margin-bottom: 1rem;
}
      `
    }
  }

  const template = templates[type as keyof typeof templates] || templates.text
  
  return {
    html: template.html,
    css: template.css,
    elementType: type
  }
}

function extractButtonText(prompt: string): string {
  // Simple extraction - in production you'd use more sophisticated NLP
  const buttonWords = prompt.match(/["']([^"']+)["']/) || prompt.match(/says? (\w+(?:\s+\w+)*)/i)
  return buttonWords ? buttonWords[1] : 'Click Me'
}

function extractHeaderText(prompt: string): string {
  // Extract header text from prompt
  const headerWords = prompt.match(/["']([^"']+)["']/) || prompt.match(/header? (?:that )?says? (?:["'])?([^"',.]+)/i)
  return headerWords ? headerWords[1] : 'Your Header Here'
}