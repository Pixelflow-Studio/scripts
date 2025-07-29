import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      const { code, error: authError, state } = router.query

      if (authError) {
        setError(`Authentication error: ${authError}`)
        setIsLoading(false)
        return
      }

      if (!code) {
        setError('No authorization code received')
        setIsLoading(false)
        return
      }

      try {
        // Exchange authorization code for access token
        const response = await fetch('/api/auth/exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to exchange code for token')
        }

        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }

        setAccessToken(data.access_token)
        
        // Store token in localStorage for the Designer Extension
        localStorage.setItem('webflow_access_token', data.access_token)
        localStorage.setItem('webflow_site_id', data.site_id || '')
        
        setIsLoading(false)

      } catch (err: any) {
        console.error('Authentication error:', err)
        setError(err.message || 'Authentication failed')
        setIsLoading(false)
      }
    }

    if (router.isReady) {
      handleCallback()
    }
  }, [router.isReady, router.query])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(accessToken)
      alert('Access token copied to clipboard!')
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = accessToken
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Access token copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="header">
          <div className="logo">🔐</div>
          <h1 className="title">Authenticating...</h1>
          <p className="subtitle">Processing your Webflow authorization</p>
        </div>
        <div className="loading">
          <div className="spinner"></div>
          Connecting to Webflow...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="header">
          <div className="logo">❌</div>
          <h1 className="title">Authentication Failed</h1>
          <p className="subtitle">There was an error connecting to Webflow</p>
        </div>
        <div className="error">{error}</div>
        <button 
          className="button"
          onClick={() => window.location.href = '/login'}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="logo">✅</div>
        <h1 className="title">Authentication Successful!</h1>
        <p className="subtitle">Your Webflow account has been connected</p>
      </div>

      <div className="success">
        Authentication completed successfully! You can now use the Cursor AI Element Builder in your Webflow Designer.
      </div>

      <div className="form-group">
        <label className="label">Access Token</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="input"
            value={accessToken}
            readOnly
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
          <button
            className="button secondary"
            onClick={copyToClipboard}
            style={{ width: 'auto', padding: '12px 16px' }}
          >
            Copy
          </button>
        </div>
        <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px', display: 'block' }}>
          This token has been automatically saved. You can also copy it for manual use.
        </small>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#e7f3ff', borderRadius: '6px', fontSize: '14px' }}>
        <strong>Next Steps:</strong>
        <ol style={{ marginTop: '10px', marginLeft: '20px' }}>
          <li>Open your Webflow project in the Designer</li>
          <li>Look for the "Cursor AI Element Builder" app in your Apps panel</li>
          <li>Start creating elements with natural language prompts!</li>
        </ol>
      </div>

      <button
        className="button"
        onClick={() => window.close()}
        style={{ marginTop: '20px' }}
      >
        Close Window
      </button>
    </div>
  )
}