# Cursor AI Element Builder - Chrome Extension

A Chrome extension that injects an AI-powered element builder directly into the Webflow Designer, similar to how Finsweet tools work. Generate HTML and CSS elements using natural language prompts without going through Webflow's official app marketplace.

## 🚀 Features

- **Direct Designer Integration**: Appears as a floating panel in Webflow Designer
- **No App Store Approval Needed**: Install directly as a Chrome extension
- **AI-Powered Generation**: Uses OpenAI GPT to create elements from text descriptions
- **Multiple Element Types**: Buttons, headers, cards, forms, navigation, and more
- **Code Preview & Copy**: See generated code before using it
- **Right-Click Integration**: Generate elements from selected text
- **Local Settings**: API keys stored securely in browser

## 📦 Installation

### Option 1: Install from Chrome Web Store (Coming Soon)
*Extension is currently in development for Chrome Web Store submission*

### Option 2: Manual Installation (Developer Mode)

1. **Download the extension files**:
   ```bash
   git clone https://github.com/your-username/webflow-cursor-ai-app.git
   cd webflow-cursor-ai-app/chrome-extension
   ```

2. **Open Chrome Extensions page**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the extension**:
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - The extension should now appear in your browser

4. **Configure API Key**:
   - Click the extension icon in Chrome toolbar
   - Click "Settings" (or visit a Webflow Designer page first)
   - Enter your OpenAI API key
   - Click "Save Settings"

## 🎯 How to Use

### Basic Usage

1. **Open Webflow Designer**:
   - Navigate to any Webflow project
   - Open the Designer interface

2. **Find the AI Builder**:
   - Look for the floating 🤖 "AI Builder" button (top right)
   - Or click the Chrome extension icon and select "Open AI Panel"

3. **Generate Elements**:
   - Select an element type (optional)
   - Describe what you want in the text area
   - Click "Generate Element"
   - Preview the generated code
   - Copy or insert into your project

### Advanced Features

#### Right-Click Generation
- Select any text on a Webflow Designer page
- Right-click and choose "Generate AI Element"
- The selected text becomes your prompt automatically

#### Keyboard Shortcuts
- Click the extension icon to quickly toggle the AI panel
- Extension icon changes color based on whether you're on a Webflow Designer page

#### Context Menu
- Right-click on selected text in Webflow Designer
- Choose "Generate AI Element" to use selection as prompt

## 💡 Example Prompts

### Buttons
- "Create a blue call-to-action button that says 'Get Started'"
- "Make a rounded button with gradient background and hover effects"
- "Design a submit button with subtle shadow and modern styling"

### Headers
- "Create a large hero heading that says 'Welcome to Our Platform'"
- "Make a gradient text header with modern typography"
- "Design a centered page title with subtle animation"

### Cards
- "Create a pricing card with title, features list, and subscribe button"
- "Make a testimonial card with quote, author name, and company"
- "Design a product card with image placeholder, title, and description"

### Forms
- "Create a contact form with name, email, and message fields"
- "Make a newsletter signup with email input and subscribe button"
- "Design a modern login form with username and password"

## ⚙️ Settings

Access settings by:
1. Clicking the extension icon → "Settings"
2. Or opening the AI panel and clicking the "Settings" tab

### Available Settings:
- **OpenAI API Key**: Your personal API key for AI generation
- **API Endpoint**: Custom endpoint URL (default: OpenAI)

## 🔧 Technical Details

### How It Works
1. **Content Script Injection**: Runs on Webflow Designer pages
2. **DOM Manipulation**: Creates floating UI elements
3. **API Integration**: Calls OpenAI API with your key
4. **Code Generation**: Produces clean HTML/CSS
5. **Copy/Preview**: Allows code review before use

### Permissions Required
- **activeTab**: To inject scripts into Webflow Designer pages
- **storage**: To save your API key and settings locally
- **scripting**: To add UI elements to Webflow pages
- **webflow.com/***: To run only on Webflow domains

### File Structure
```
chrome-extension/
├── manifest.json          # Extension configuration
├── content.js             # Main injection script
├── background.js          # Background service worker
├── popup.html             # Extension popup UI
├── popup.js              # Popup functionality
├── styles.css            # Extension styling
├── icons/                # Extension icons
└── README.md             # This file
```

## 🐛 Troubleshooting

### Extension Not Working
- **Check Developer Mode**: Make sure it's enabled in `chrome://extensions/`
- **Reload Extension**: Click the refresh icon in extensions page
- **Check Console**: Open DevTools and look for error messages

### AI Generation Failing
- **API Key**: Verify your OpenAI API key is correct and has credits
- **Network**: Check internet connection and firewall settings
- **Rate Limits**: Wait a moment if you're making many requests

### UI Not Appearing
- **Page Detection**: Make sure you're on a Webflow Designer page (URL contains `/design/`)
- **Conflicting Extensions**: Disable other Webflow-related extensions temporarily
- **Browser Refresh**: Reload the Webflow Designer page

### Generated Code Issues
- **Invalid HTML**: Try simpler prompts or check the fallback templates
- **Styling Problems**: Generated CSS might conflict with Webflow's styles
- **Responsive Issues**: Ask for "mobile-friendly" or "responsive" in your prompt

## 🔐 Security & Privacy

- **API Keys**: Stored locally in your browser, never transmitted to our servers
- **Data Protection**: Extension only runs on Webflow domains
- **No Tracking**: No analytics or user data collection
- **Open Source**: Full source code available for review

## 🚀 Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/your-username/webflow-cursor-ai-app.git
cd webflow-cursor-ai-app/chrome-extension

# Make changes to the files
# No build process required - it's vanilla JavaScript
```

### Loading for Development
1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test your changes in a Webflow Designer page

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly in Webflow Designer
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the main project LICENSE file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/your-username/webflow-cursor-ai-app/issues)
- **Documentation**: See main project README for full documentation
- **Community**: Join discussions in GitHub Discussions

## 🙏 Acknowledgments

- Inspired by Finsweet's approach to Webflow tooling
- Built with Chrome Extensions Manifest V3
- Powered by OpenAI's GPT models
- Designed for the Webflow community

---

**Note**: This extension is not affiliated with Webflow, Inc. It's a community-built tool that enhances the Webflow Designer experience.