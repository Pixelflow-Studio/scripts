import { useState, useEffect } from 'react'
import { generateElement } from '../utils/aiGenerator'
import { insertElementIntoWebflow } from '../utils/webflowIntegration'

interface ElementType {
  id: string
  name: string
  icon: string
  description: string
}

const elementTypes: ElementType[] = [
  { id: 'header', name: 'Header', icon: '📋', description: 'Page headers and titles' },
  { id: 'button', name: 'Button', icon: '🔘', description: 'Call-to-action buttons' },
  { id: 'card', name: 'Card', icon: '🃏', description: 'Content cards and containers' },
  { id: 'form', name: 'Form', icon: '📝', description: 'Input forms and fields' },
  { id: 'text', name: 'Text', icon: '📄', description: 'Paragraphs and text content' },
  { id: 'image', name: 'Image', icon: '🖼️', description: 'Images and media' },
  { id: 'navigation', name: 'Navigation', icon: '🧭', description: 'Menus and navigation' },
  { id: 'section', name: 'Section', icon: '📦', description: 'Layout sections and containers' }
]

export default function DesignerExtension() {
  const [prompt, setPrompt] = useState('')
  const [selectedElementType, setSelectedElementType] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'prompt' | 'code'>('prompt')

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setError('')
    setSuccess('')

    try {
      const result = await generateElement(prompt, selectedElementType)
      setGeneratedCode(result.html + '\n\n' + result.css)
      setActiveTab('code')
      setSuccess('Element generated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to generate element')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInsertElement = async () => {
    if (!generatedCode) {
      setError('No element to insert')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      await insertElementIntoWebflow(generatedCode)
      setSuccess('Element inserted into Webflow!')
      setPrompt('')
      setGeneratedCode('')
      setSelectedElementType('')
      setActiveTab('prompt')
    } catch (err: any) {
      setError(err.message || 'Failed to insert element')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="logo">🤖</div>
        <h1 className="title">Cursor AI Element Builder</h1>
        <p className="subtitle">Add elements to your Webflow page using AI</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'prompt' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompt')}
        >
          Create Element
        </button>
        <button
          className={`tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
          disabled={!generatedCode}
        >
          Preview & Insert
        </button>
      </div>

      {activeTab === 'prompt' && (
        <div>
          <div className="form-group">
            <label className="label">Element Type (Optional)</label>
            <div className="element-types">
              {elementTypes.map((type) => (
                <div
                  key={type.id}
                  className={`element-type ${selectedElementType === type.id ? 'selected' : ''}`}
                  onClick={() => setSelectedElementType(selectedElementType === type.id ? '' : type.id)}
                  title={type.description}
                >
                  <div className="element-type-icon">{type.icon}</div>
                  <div className="element-type-name">{type.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="prompt">
              Describe the element you want to create
            </label>
            <textarea
              id="prompt"
              className="textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Create a blue call-to-action button with rounded corners that says Sign Up Now' or 'Make a responsive card with an image, title, description, and a button'"
              rows={4}
            />
          </div>

          <button
            className="button"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <div className="loading">
                <div className="spinner"></div>
                Generating Element...
              </div>
            ) : (
              'Generate Element'
            )}
          </button>
        </div>
      )}

      {activeTab === 'code' && generatedCode && (
        <div>
          <div className="preview">
            <div className="preview-title">Generated Code Preview</div>
            <div className="preview-content">
              <pre>{generatedCode}</pre>
            </div>
          </div>

          <button
            className="button"
            onClick={handleInsertElement}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <div className="loading">
                <div className="spinner"></div>
                Inserting Element...
              </div>
            ) : (
              'Insert into Webflow'
            )}
          </button>

          <button
            className="button secondary"
            onClick={() => setActiveTab('prompt')}
            style={{ marginTop: '10px' }}
          >
            Back to Create
          </button>
        </div>
      )}
    </div>
  )
}