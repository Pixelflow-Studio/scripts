import { NextApiRequest, NextApiResponse } from 'next'

interface TokenResponse {
  access_token: string
  token_type: string
  scope: string
  site_id?: string
}

interface ErrorResponse {
  error: string
  error_description?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, state } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' })
  }

  const clientId = process.env.WEBFLOW_CLIENT_ID
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET
  const redirectUri = process.env.WEBFLOW_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({ error: 'Missing OAuth configuration' })
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange failed:', errorData)
      return res.status(400).json({
        error: errorData.error || 'Token exchange failed',
        error_description: errorData.error_description,
      })
    }

    const tokenData = await tokenResponse.json()

    // Get user info and site info if needed
    try {
      const userResponse = await fetch('https://api.webflow.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'accept-version': '1.0.0',
        },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        console.log('User authenticated:', userData.email)
      }
    } catch (userError) {
      console.error('Error fetching user info:', userError)
      // Don't fail the authentication if user info fails
    }

    // Return the access token
    res.status(200).json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      scope: tokenData.scope || '',
      site_id: state, // Use state parameter as site_id if provided
    })

  } catch (error: any) {
    console.error('OAuth exchange error:', error)
    res.status(500).json({
      error: 'Internal server error',
      error_description: error.message,
    })
  }
}