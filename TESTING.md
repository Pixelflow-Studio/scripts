# Testing Guide for Webflow Cursor AI Element Builder

This guide will walk you through testing the app at different stages of development and deployment.

## 🏗️ Testing Phases

### Phase 1: Local Development Testing
### Phase 2: API Endpoint Testing  
### Phase 3: Webflow Integration Testing
### Phase 4: End-to-End Testing
### Phase 5: Production Testing

---

## Phase 1: Local Development Testing

### 1.1 Setup Environment

```bash
# Clone the repository
git clone https://github.com/your-username/webflow-cursor-ai-app.git
cd webflow-cursor-ai-app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### 1.2 Configure Environment Variables

Edit your `.env` file:

```bash
# For testing, you can use placeholder values initially
WEBFLOW_CLIENT_ID=test_client_id
WEBFLOW_CLIENT_SECRET=test_client_secret
WEBFLOW_REDIRECT_URI=http://localhost:3000/auth/callback

# You'll need a real OpenAI API key for AI testing
OPENAI_API_KEY=your_real_openai_api_key_here

# Local development URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WEBFLOW_APP_URL=http://localhost:3000
```

### 1.3 Start Development Server

```bash
npm run dev
```

The app should be running at `http://localhost:3000`

### 1.4 Test Basic Functionality

1. **Visit the main page**: `http://localhost:3000`
   - ✅ Should see the Designer Extension interface
   - ✅ Element type selector should be interactive
   - ✅ Prompt textarea should accept input

2. **Test without AI**: Try the fallback functionality
   - Enter a simple prompt like "Create a blue button"
   - The app should use fallback templates when OpenAI isn't configured

---

## Phase 2: API Endpoint Testing

### 2.1 Test AI Generation Endpoint

**Manual Testing with curl:**

```bash
# Test with valid prompt
curl -X POST http://localhost:3000/api/generate-element \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a blue button that says Click Me", "elementType": "button"}'

# Expected response:
# {
#   "html": "<button class=\"ai-generated-button\">Click Me</button>",
#   "css": ".ai-generated-button { ... }",
#   "elementType": "button"
# }
```

**Using the test script:**

```bash
# Install axios for testing
npm install axios

# Run the automated test
node test-ai-generation.js
```

### 2.2 Test Error Handling

```bash
# Test with empty prompt
curl -X POST http://localhost:3000/api/generate-element \
  -H "Content-Type: application/json" \
  -d '{"prompt": "", "elementType": "button"}'

# Should return: {"error": "Prompt is required"}

# Test with invalid method
curl -X GET http://localhost:3000/api/generate-element

# Should return: {"error": "Method not allowed"}
```

### 2.3 Test Authentication Endpoints

```bash
# Test auth exchange (will fail without valid code)
curl -X POST http://localhost:3000/api/auth/exchange \
  -H "Content-Type: application/json" \
  -d '{"code": "test_code"}'

# Should return error about missing/invalid code
```

---

## Phase 3: Webflow Integration Testing

### 3.1 Register Your App in Webflow

1. Go to [Webflow Dashboard](https://webflow.com/dashboard)
2. Navigate to **Workspace Settings > Apps & Integrations**
3. Click **Create an App**
4. Fill in details:
   - **Name**: Cursor AI Element Builder (Test)
   - **Description**: Testing version of AI element builder
   - **Capabilities**: Both Designer Extension and Data Client
   - **Redirect URI**: `http://localhost:3000/auth/callback` (for local testing)

5. Save the Client ID and Secret to your `.env` file

### 3.2 Test OAuth Flow

```bash
# Start ngrok to expose local server
ngrok http 3000

# Update your .env with the ngrok URL
NEXT_PUBLIC_WEBFLOW_APP_URL=https://your-ngrok-url.ngrok.io
```

1. **Test login flow**:
   - Visit `http://localhost:3000/login`
   - Click "Connect Webflow Account"
   - Should redirect to Webflow OAuth
   - After authorization, should return to callback page

2. **Test callback handling**:
   - Should display access token
   - Token should be saved to localStorage

### 3.3 Test in Webflow Designer

**Note**: This requires your app to be uploaded to Webflow as a bundle.

1. **Create app bundle**:
```bash
npm run build
npm run export

# The 'out' folder contains your static app
# Zip this folder and upload to Webflow
```

2. **Upload to Webflow**:
   - In your Webflow app settings, upload the zip file
   - Install the app in a test workspace

3. **Test in Designer**:
   - Open a Webflow project in Designer
   - Find your app in the Apps panel
   - Test the interface and element generation

---

## Phase 4: End-to-End Testing

### 4.1 Complete User Journey Test

1. **Authentication**:
   - ✅ User can connect Webflow account
   - ✅ Access token is properly stored
   - ✅ Error handling for auth failures

2. **Element Generation**:
   - ✅ User can enter prompts
   - ✅ Element types can be selected
   - ✅ AI generates appropriate HTML/CSS
   - ✅ Fallback works when AI fails

3. **Element Insertion**:
   - ✅ Generated elements can be previewed
   - ✅ Elements insert into Webflow Designer
   - ✅ CSS styles are applied correctly
   - ✅ Elements are properly formatted

### 4.2 Test Different Prompts

Create a test matrix:

| Element Type | Prompt | Expected Result |
|--------------|--------|----------------|
| Button | "Red button says Subscribe" | Red button with Subscribe text |
| Header | "Large hero title Welcome" | Large heading with Welcome |
| Card | "Product card with image" | Card layout with placeholder |
| Form | "Contact form with email" | Form with email field |
| Generic | "Navigation menu" | Nav element with styling |

### 4.3 Test Edge Cases

- **Very long prompts** (>500 characters)
- **Special characters** in prompts
- **Multiple element requests** in sequence
- **Network failures** during generation
- **Invalid HTML/CSS** generation

---

## Phase 5: Production Testing

### 5.1 Deploy to Production

**Vercel Deployment**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

**Other Platforms**:
```bash
npm run build
npm run export
# Upload 'out' folder to your hosting provider
```

### 5.2 Update Webflow App Settings

1. Update redirect URI to production URL
2. Update app homepage URL
3. Test OAuth flow with production URLs

### 5.3 Production Testing Checklist

- ✅ **HTTPS URLs**: All URLs use HTTPS
- ✅ **Environment Variables**: All secrets properly configured
- ✅ **CORS Headers**: Proper iframe permissions for Webflow
- ✅ **Performance**: App loads quickly in Designer
- ✅ **Error Handling**: Graceful error messages
- ✅ **Rate Limiting**: OpenAI API usage within limits

---

## 🧪 Automated Testing Scripts

### Test AI Generation
```bash
node test-ai-generation.js
```

### Test All Endpoints
```bash
# Create this script to test all API endpoints
npm run test:api
```

### Test UI Components
```bash
# If you add React testing
npm run test:ui
```

---

## 🐛 Common Issues & Solutions

### Issue: "Not in Webflow Designer environment"
**Solution**: Make sure you're testing inside the actual Webflow Designer, not just in a browser

### Issue: "Authentication failed"
**Solution**: 
- Check Client ID/Secret are correct
- Verify redirect URI matches exactly
- Ensure app has proper scopes

### Issue: "OpenAI API rate limited"
**Solution**:
- Check your OpenAI account billing
- Implement request throttling
- Use fallback templates

### Issue: "Element not inserting"
**Solution**:
- Check browser console for errors
- Verify Webflow Designer API is available
- Test with simpler HTML structures

### Issue: "CORS errors"
**Solution**:
- Check `next.config.js` CORS settings
- Verify iframe permissions
- Test with different browsers

---

## 📊 Testing Metrics

Track these metrics during testing:

- **Response Time**: API endpoints should respond < 2 seconds
- **Success Rate**: >95% successful element generations
- **Error Recovery**: Graceful handling of all error conditions
- **User Experience**: Smooth workflow from prompt to insertion
- **Cross-browser**: Works in Chrome, Firefox, Safari
- **Mobile Compatibility**: Responsive design in Designer

---

## 🚀 Ready for Production

Your app is ready for production when:

- ✅ All automated tests pass
- ✅ OAuth flow works end-to-end
- ✅ Element generation is reliable
- ✅ Webflow integration functions properly
- ✅ Error handling is comprehensive
- ✅ Performance meets standards
- ✅ Documentation is complete

---

## 🆘 Getting Help

If you encounter issues during testing:

1. **Check browser console** for JavaScript errors
2. **Review network tab** for failed API calls
3. **Test with simple prompts** first
4. **Verify environment variables** are set correctly
5. **Check Webflow app permissions** and scopes

Remember: Start with simple tests and gradually increase complexity. Each phase builds on the previous one, so make sure each phase passes before moving to the next!