import { useState } from 'react'

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    setIsLoading(true)
    
    const clientId = process.env.NEXT_PUBLIC_WEBFLOW_CLIENT_ID || 'your_client_id'
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_WEBFLOW_REDIRECT_URI || 'https://your-domain.com/auth/callback')
    const state = Date.now().toString() // Simple state for CSRF protection
    
    // Webflow OAuth scopes for Designer Extensions and Data Client
    const scopes = encodeURIComponent('sites:read sites:write assets:read assets:write cms:read cms:write forms:read')
    
    const authUrl = `https://webflow.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}`
    
    // Open OAuth flow in a new window
    window.location.href = authUrl
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="logo">🤖</div>
        <h1 className="title">Cursor AI Element Builder</h1>
        <p className="subtitle">Connect your Webflow account to get started</p>
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', fontSize: '14px' }}>
        <h3 style={{ marginBottom: '15px', color: '#495057' }}>What this app does:</h3>
        <ul style={{ marginLeft: '20px', lineHeight: '1.6', color: '#6c757d' }}>
          <li>Generate HTML and CSS elements using natural language prompts</li>
          <li>Insert elements directly into your Webflow Designer</li>
          <li>Use AI to create buttons, headers, cards, forms, and more</li>
          <li>Customize elements with specific styling requirements</li>
        </ul>
      </div>

      <div style={{ marginBottom: '30px', padding: '15px', background: '#e7f3ff', borderRadius: '6px', fontSize: '14px' }}>
        <strong>Required Permissions:</strong>
        <ul style={{ marginTop: '10px', marginLeft: '20px', lineHeight: '1.6' }}>
          <li>Read and write access to your sites</li>
          <li>Access to CMS collections and assets</li>
          <li>Ability to modify page elements</li>
        </ul>
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
          These permissions allow the app to insert AI-generated elements into your Webflow projects.
        </p>
      </div>

      <button
        className="button"
        onClick={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            Connecting to Webflow...
          </div>
        ) : (
          '🔗 Connect Webflow Account'
        )}
      </button>

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
        <p>
          By connecting your account, you agree to allow this app to access your Webflow sites and make modifications as directed.
        </p>
        <p style={{ marginTop: '10px' }}>
          Your data is secure and will only be used to provide the app's functionality.
        </p>
      </div>
    </div>
  )
}