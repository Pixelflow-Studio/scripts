import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GenerateElementRequest {
  prompt: string
  elementType?: string
}

interface GeneratedElement {
  html: string
  css: string
  elementType: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeneratedElement | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, elementType }: GenerateElementRequest = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' })
  }

  try {
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

Make sure the JSON is valid and properly escaped.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Create a web element based on this description: ${prompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('No response from AI')
    }

    // Parse the JSON response
    const result = JSON.parse(response) as GeneratedElement

    // Validate the response
    if (!result.html || !result.css) {
      throw new Error('Invalid response format from AI')
    }

    res.status(200).json(result)

  } catch (error: any) {
    console.error('Error generating element:', error)
    
    // Fallback to simple template if AI fails
    const fallbackElement = generateFallbackElement(prompt, elementType)
    res.status(200).json(fallbackElement)
  }
}

function generateFallbackElement(prompt: string, elementType?: string): GeneratedElement {
  const type = elementType || 'div'
  
  const templates = {
    button: {
      html: `<button class="ai-generated-button">${extractButtonText(prompt)}</button>`,
      css: `
.ai-generated-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.ai-generated-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}
      `
    },
    header: {
      html: `<h1 class="ai-generated-header">${extractHeaderText(prompt)}</h1>`,
      css: `
.ai-generated-header {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  margin: 2rem 0;
  line-height: 1.2;
}
      `
    },
    card: {
      html: `
<div class="ai-generated-card">
  <div class="card-header">
    <h3 class="card-title">Generated Element</h3>
  </div>
  <div class="card-body">
    <p class="card-description">${prompt}</p>
    <button class="card-action">Get Started</button>
  </div>
</div>
      `,
      css: `
.ai-generated-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 350px;
  transition: transform 0.3s ease;
}

.ai-generated-card:hover {
  transform: translateY(-5px);
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  color: white;
}

.card-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.card-body {
  padding: 20px;
}

.card-description {
  color: #6c757d;
  margin-bottom: 20px;
  line-height: 1.6;
}

.card-action {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.card-action:hover {
  background: #0056b3;
}
      `
    },
    form: {
      html: `
<form class="ai-generated-form">
  <div class="form-group">
    <label class="form-label">Name</label>
    <input type="text" class="form-input" placeholder="Enter your name">
  </div>
  <div class="form-group">
    <label class="form-label">Email</label>
    <input type="email" class="form-input" placeholder="Enter your email">
  </div>
  <button type="submit" class="form-submit">Submit</button>
</form>
      `,
      css: `
.ai-generated-form {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
}

.form-submit {
  width: 100%;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.form-submit:hover {
  transform: translateY(-1px);
}
      `
    }
  }

  const template = templates[type as keyof typeof templates] || {
    html: `<div class="ai-generated-element">${prompt}</div>`,
    css: `
.ai-generated-element {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
  font-size: 16px;
  line-height: 1.6;
}
    `
  }

  return {
    html: template.html,
    css: template.css,
    elementType: type
  }
}

function extractButtonText(prompt: string): string {
  const patterns = [
    /["']([^"']+)["']/,
    /(?:says?|labeled?|text)\s+["']?([^"',.!?]+)["']?/i,
    /button\s+(?:that\s+)?(?:says?|labeled?)\s+["']?([^"',.!?]+)["']?/i
  ]
  
  for (const pattern of patterns) {
    const match = prompt.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return 'Click Me'
}

function extractHeaderText(prompt: string): string {
  const patterns = [
    /["']([^"']+)["']/,
    /(?:header|title|heading)\s+(?:that\s+)?(?:says?|reads?)\s+["']?([^"',.!?]+)["']?/i,
    /(?:says?|reads?)\s+["']?([^"',.!?]+)["']?/i
  ]
  
  for (const pattern of patterns) {
    const match = prompt.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return 'Your Header Here'
}