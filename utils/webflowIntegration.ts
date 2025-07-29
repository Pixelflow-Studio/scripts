// Webflow Designer API integration
declare global {
  interface Window {
    Webflow?: {
      app?: any
      subscribe?: (event: string, callback: Function) => void
      getElementAt?: (x: number, y: number) => any
      getSelectedElements?: () => any[]
      insertElement?: (element: any, parent?: any) => any
      createStyleSheet?: () => any
      addStyleRule?: (selector: string, properties: any) => void
      ready?: (callback: Function) => void
    }
  }
}

interface WebflowElement {
  tag: string
  attributes?: Record<string, string>
  children?: (WebflowElement | string)[]
  styles?: Record<string, string>
}

export async function insertElementIntoWebflow(generatedCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if we're in the Webflow Designer
    if (typeof window === 'undefined' || !window.Webflow) {
      reject(new Error('Not in Webflow Designer environment'))
      return
    }

    try {
      // Wait for Webflow to be ready
      window.Webflow.ready?.(() => {
        try {
          // Parse the generated code
          const { html, css } = parseGeneratedCode(generatedCode)
          
          // Insert CSS styles
          insertStyles(css)
          
          // Convert HTML to Webflow element structure
          const webflowElement = htmlToWebflowElement(html)
          
          // Get the currently selected element or body
          const selectedElements = window.Webflow.getSelectedElements?.() || []
          const targetParent = selectedElements.length > 0 ? selectedElements[0] : null
          
          // Insert the element
          window.Webflow.insertElement?.(webflowElement, targetParent)
          
          resolve()
        } catch (error) {
          console.error('Error inserting element:', error)
          reject(error)
        }
      })
    } catch (error) {
      console.error('Error with Webflow integration:', error)
      reject(error)
    }
  })
}

function parseGeneratedCode(code: string): { html: string; css: string } {
  // Simple parser to separate HTML and CSS
  const htmlMatch = code.match(/<[\s\S]*>/g)
  const cssMatch = code.match(/\.[\s\S]*?\{[\s\S]*?\}/g)
  
  const html = htmlMatch ? htmlMatch.join('') : code
  const css = cssMatch ? cssMatch.join('\n') : ''
  
  return { html, css }
}

function insertStyles(css: string): void {
  if (!css.trim()) return
  
  try {
    // Create or get existing style element
    let styleElement = document.getElementById('cursor-ai-styles') as HTMLStyleElement
    
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'cursor-ai-styles'
      styleElement.type = 'text/css'
      document.head.appendChild(styleElement)
    }
    
    // Add new styles
    styleElement.textContent += '\n' + css
    
    // Also try to add to Webflow's style system if available
    if (window.Webflow?.addStyleRule) {
      const rules = parseCSSRules(css)
      rules.forEach(rule => {
        window.Webflow.addStyleRule?.(rule.selector, rule.properties)
      })
    }
  } catch (error) {
    console.error('Error inserting styles:', error)
  }
}

function parseCSSRules(css: string): Array<{ selector: string; properties: Record<string, string> }> {
  const rules: Array<{ selector: string; properties: Record<string, string> }> = []
  
  // Simple CSS parser
  const ruleMatches = css.match(/([^{]+)\{([^}]+)\}/g)
  
  ruleMatches?.forEach(ruleMatch => {
    const parts = ruleMatch.split('{')
    if (parts.length !== 2) return
    
    const selector = parts[0].trim()
    const propertiesText = parts[1].replace('}', '').trim()
    
    const properties: Record<string, string> = {}
    const propertyMatches = propertiesText.split(';')
    
    propertyMatches.forEach(prop => {
      const [key, value] = prop.split(':')
      if (key && value) {
        properties[key.trim()] = value.trim()
      }
    })
    
    if (Object.keys(properties).length > 0) {
      rules.push({ selector, properties })
    }
  })
  
  return rules
}

function htmlToWebflowElement(html: string): WebflowElement {
  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html.trim()
  
  const firstChild = tempDiv.firstElementChild
  if (!firstChild) {
    return {
      tag: 'div',
      children: [html]
    }
  }
  
  return domElementToWebflowElement(firstChild)
}

function domElementToWebflowElement(element: Element): WebflowElement {
  const webflowElement: WebflowElement = {
    tag: element.tagName.toLowerCase()
  }
  
  // Extract attributes
  if (element.attributes.length > 0) {
    webflowElement.attributes = {}
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i]
      webflowElement.attributes[attr.name] = attr.value
    }
  }
  
  // Extract children
  if (element.children.length > 0 || element.textContent?.trim()) {
    webflowElement.children = []
    
    // Add text content if present
    if (element.textContent?.trim() && element.children.length === 0) {
      webflowElement.children.push(element.textContent.trim())
    } else {
      // Add child elements
      for (let i = 0; i < element.children.length; i++) {
        webflowElement.children.push(domElementToWebflowElement(element.children[i]))
      }
    }
  }
  
  return webflowElement
}

// Fallback method for when Webflow API is not available
export function insertElementFallback(generatedCode: string): void {
  try {
    // Create a visual preview of what would be inserted
    const previewContainer = document.createElement('div')
    previewContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 2px solid #007bff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `
    
    previewContainer.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px; color: #007bff;">
        🤖 Element Generated
      </div>
      <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
        This element would be inserted into your Webflow page:
      </div>
      <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; max-height: 150px; overflow-y: auto;">
        ${generatedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </div>
      <button id="close-preview" style="
        margin-top: 15px;
        background: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
      ">
        Close Preview
      </button>
    `
    
    document.body.appendChild(previewContainer)
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      if (previewContainer.parentNode) {
        previewContainer.remove()
      }
    }, 10000)
    
    // Close button functionality
    const closeButton = document.getElementById('close-preview')
    closeButton?.addEventListener('click', () => {
      previewContainer.remove()
    })
    
  } catch (error) {
    console.error('Error showing preview:', error)
    alert('Element generated but could not be inserted. Please check the Webflow Designer API connection.')
  }
}