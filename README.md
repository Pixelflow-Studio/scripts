# Cursor AI Element Builder for Webflow

A powerful Webflow app that integrates with Cursor AI to add elements to your pages using natural language prompts. Simply describe what you want, and watch as AI generates beautiful, functional web elements that are inserted directly into your Webflow Designer.

![Cursor AI Element Builder](https://your-domain.com/screenshot.png)

## 🌟 Features

- **Natural Language Element Generation**: Describe elements in plain English
- **AI-Powered Code Generation**: Uses OpenAI GPT to create HTML and CSS
- **Direct Webflow Integration**: Elements are inserted directly into the Designer
- **Multiple Element Types**: Supports buttons, headers, cards, forms, and more
- **Responsive Design**: Generated elements are mobile-friendly
- **Real-time Preview**: See generated code before inserting
- **Secure Authentication**: OAuth 2.0 integration with Webflow

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Webflow account with Designer access
- OpenAI API key
- Ngrok (for local development)

### 1. Clone and Setup

```bash
git clone https://github.com/your-username/webflow-cursor-ai-app.git
cd webflow-cursor-ai-app
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

```env
# Webflow App Configuration
WEBFLOW_CLIENT_ID=your_webflow_client_id_here
WEBFLOW_CLIENT_SECRET=your_webflow_client_secret_here
WEBFLOW_REDIRECT_URI=https://your-domain.com/auth/callback

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_WEBFLOW_APP_URL=https://your-domain.com

# For local development
# NEXT_PUBLIC_APP_URL=http://localhost:3000
# NEXT_PUBLIC_WEBFLOW_APP_URL=https://your-ngrok-url.ngrok.io
```

### 3. Register Your Webflow App

1. Go to your [Webflow Dashboard](https://webflow.com/dashboard)
2. Navigate to **Workspace Settings > Apps & Integrations**
3. Click **Create an App** in the App Development section
4. Fill in your app details:
   - **Name**: Cursor AI Element Builder
   - **Description**: Add elements to Webflow pages using AI prompts
   - **Homepage URL**: Your app's homepage
   - **Icon**: Upload a suitable icon

5. Select **Both capabilities**:
   - ✅ **Designer Extension**: For inserting elements
   - ✅ **Data Client**: For accessing site data

6. Configure OAuth settings:
   - **Scopes**: Select all necessary permissions (sites:read, sites:write, etc.)
   - **Redirect URI**: `https://your-domain.com/auth/callback`

7. Save your **Client ID** and **Client Secret** to your `.env` file

### 4. Development Setup

For local development, you'll need to expose your local server:

```bash
# Install ngrok if you haven't already
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose port 3000
ngrok http 3000
```

Update your `.env` file with the ngrok URL:
```env
NEXT_PUBLIC_WEBFLOW_APP_URL=https://your-ngrok-url.ngrok.io
```

### 5. Build and Deploy

```bash
# Build the app
npm run build

# Export static files for hosting
npm run export
```

Upload the contents of the `out` folder to your hosting provider.

## 📖 Usage Guide

### Using the App

1. **Install the App**: Add the Cursor AI Element Builder to your Webflow workspace
2. **Open Webflow Designer**: Open any project in the Webflow Designer
3. **Find the App**: Look for the app in your Apps panel
4. **Authenticate**: Connect your Webflow account (one-time setup)
5. **Create Elements**: Start describing elements you want to create!

### Example Prompts

Here are some example prompts to get you started:

**Buttons**:
- "Create a blue call-to-action button that says 'Get Started'"
- "Make a rounded button with a gradient background and white text"
- "Design a submit button with hover effects"

**Headers**:
- "Create a large hero heading that says 'Welcome to Our Platform'"
- "Make a gradient text header with modern styling"
- "Design a centered page title with subtle shadow"

**Cards**:
- "Create a product card with image, title, description, and price"
- "Make a testimonial card with quote, author name, and company"
- "Design a feature card with icon, heading, and description"

**Forms**:
- "Create a contact form with name, email, and message fields"
- "Make a newsletter signup form with email input and subscribe button"
- "Design a modern login form with username and password"

### Tips for Better Results

1. **Be Specific**: The more detailed your prompt, the better the result
2. **Include Colors**: Mention specific colors or color schemes
3. **Specify Layout**: Describe positioning, alignment, and spacing
4. **Mention Responsive**: Ask for mobile-friendly or responsive designs
5. **Use Examples**: Reference popular design patterns or websites

## 🛠️ Technical Details

### Architecture

The app consists of several key components:

- **Designer Extension** (`pages/index.tsx`): The main UI that runs inside Webflow
- **AI Generator** (`utils/aiGenerator.ts`): Handles AI prompt processing
- **Webflow Integration** (`utils/webflowIntegration.ts`): Manages element insertion
- **Authentication** (`pages/auth/`): OAuth flow for Webflow access
- **API Routes** (`pages/api/`): Backend endpoints for AI and auth

### API Endpoints

- `POST /api/generate-element`: Generate HTML/CSS from prompts
- `POST /api/auth/exchange`: Exchange OAuth code for access token

### Webflow Designer API

The app uses the Webflow Designer API to:
- Insert elements into the current page
- Access the selected element for context
- Add CSS styles to the page
- Monitor user interactions

## 🔧 Configuration

### Webflow App Settings

Update `webflow.json` to customize your app:

```json
{
  "name": "cursor-ai-element-builder",
  "displayName": "Cursor AI Element Builder",
  "version": "1.0.0",
  "description": "Add elements to your Webflow pages using natural language prompts powered by Cursor AI",
  "size": "comfortable",
  "capabilities": ["designer-extension", "data-client"]
}
```

### AI Model Configuration

The app uses OpenAI's GPT-3.5-turbo by default. You can modify the model and parameters in `pages/api/generate-element.ts`:

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo", // Change to gpt-4 for better results
  temperature: 0.7,       // Adjust creativity level
  max_tokens: 1000        // Increase for longer responses
})
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The app exports to static files and can be hosted on:
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting provider

## 🔒 Security

- OAuth 2.0 for secure Webflow authentication
- Environment variables for API keys
- CSRF protection with state parameter
- Input sanitization for AI prompts
- HTTPS required for production

## 🐛 Troubleshooting

### Common Issues

**"Not in Webflow Designer environment"**
- Make sure you're accessing the app from within the Webflow Designer
- Check that the app is properly installed in your workspace

**"Authentication failed"**
- Verify your Webflow Client ID and Secret are correct
- Ensure redirect URI matches exactly (including https://)
- Check that your app has the necessary OAuth scopes

**"Failed to generate element"**
- Verify your OpenAI API key is valid and has credits
- Check the API endpoint is accessible
- Try a simpler prompt first

**"Element not inserting"**
- Make sure you have an element selected in Webflow Designer
- Check browser console for JavaScript errors
- Verify the generated HTML is valid

### Getting Help

1. Check the browser console for error messages
2. Review the Network tab for failed API calls
3. Test with simple prompts first
4. Ensure all environment variables are set correctly

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Webflow](https://webflow.com) for the amazing Designer API
- [OpenAI](https://openai.com) for the GPT models
- [Next.js](https://nextjs.org) for the React framework
- [Cursor](https://cursor.sh) for the AI-powered development experience

## 📞 Support

- 📧 Email: support@your-domain.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/webflow-cursor-ai-app/issues)
- 💬 Discord: [Join our community](https://discord.gg/your-invite)

---

Made with ❤️ by [Your Name](https://github.com/your-username)