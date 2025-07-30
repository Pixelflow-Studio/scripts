# Finsweet Slider Generator - Chrome Extension

A visual generator tool for creating Finsweet sliders in your Webflow projects. This Chrome extension provides an intuitive interface to configure and generate HTML, CSS, and JavaScript code for Finsweet Attributes sliders.

## Features

### 🎛️ **Three Slider Types Supported**
- **List Slider**: Create dynamic sliders from CMS collections or static content
- **Range Slider**: Build custom range sliders for filtering and form inputs
- **Custom Dots**: Generate custom navigation dots for existing sliders

### 🎨 **Visual Configuration**
- Interactive form controls for all slider options
- Live preview of your slider configuration
- Real-time code generation as you make changes
- Tabbed interface for easy navigation

### 📋 **Code Generation**
- **HTML**: Complete markup with proper Finsweet attributes
- **CSS**: Ready-to-use styles for your sliders
- **JavaScript**: Finsweet Attributes script tags
- **Copy to Clipboard**: One-click copying for all code types

### ⚡ **Smart Features**
- Automatic attribute generation based on Finsweet documentation
- Support for both CMS and static content
- Instance management for multiple sliders
- Responsive design optimized for Chrome extension popup

## Installation

### Option 1: Load Unpacked Extension (Development)

1. **Download the Extension**
   ```bash
   git clone [repository-url]
   cd finsweet-slider-generator
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the extension folder
   - The extension icon should appear in your Chrome toolbar

### Option 2: Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store for easy installation.

## Usage Guide

### Getting Started

1. **Click the Extension Icon** in your Chrome toolbar
2. **Choose a Slider Type** from the three available tabs:
   - List Slider
   - Range Slider  
   - Custom Dots

### List Slider Configuration

Configure dynamic sliders that work with Webflow CMS or static content:

- **Slider Name**: Unique identifier for your slider
- **Data Source**: Choose between CMS Collection or Static Content
- **Collection Name**: Name of your CMS collection (CMS only)
- **Items per Slide**: Number of items to display per slide
- **Options**: Auto Play, Infinite Scroll, Reset Interactions
- **Instance Name**: For multiple sliders on the same page

### Range Slider Configuration

Create custom range sliders for forms and filters:

- **Min/Max Values**: Set the range boundaries
- **Step Value**: Define increment steps
- **Start Value**: Initial position of the handle
- **Handles**: Single or dual handle configuration
- **Display Options**: Number formatting, update mode

### Custom Dots Configuration

Generate custom navigation dots for existing sliders:

- **Target Slider**: Name of the slider to enhance
- **Dot Content**: Text, Image, or Custom HTML
- **Active Class**: CSS class for active state
- **Cleanup Options**: Remove original content, clear nav

## Generated Code Structure

### HTML Output
The extension generates complete HTML markup including:
- Proper Finsweet attribute assignments
- Webflow-compatible class names
- Semantic structure for accessibility
- Placeholder content for easy customization

### CSS Output
Generated styles include:
- Modern, responsive design
- Hover and active states
- Smooth transitions and animations
- Cross-browser compatibility

### JavaScript Output
Includes the official Finsweet Attributes script tag:
```html
<script async type="module" 
  src="https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js"
  fs-list>
</script>
```

## Implementation in Webflow

### Step 1: Copy the HTML
1. Select the HTML tab in the extension
2. Click "Copy HTML"
3. Paste into your Webflow page structure

### Step 2: Add the CSS
1. Select the CSS tab
2. Click "Copy CSS"
3. Add to your page's custom CSS or embed block

### Step 3: Include the Script
1. Select the Script tab
2. Click "Copy Script"
3. Add to your page's `<head>` section or before `</body>`

### Step 4: Customize Content
Replace placeholder content with your actual CMS fields or static content.

## Best Practices

### Naming Conventions
- Use descriptive, kebab-case names for sliders
- Include project or section prefixes for organization
- Avoid spaces and special characters

### Performance Optimization
- Only include necessary Finsweet attributes
- Minimize custom CSS overrides
- Use appropriate image sizes for slider content

### Accessibility
- Include proper alt text for images
- Use semantic HTML structure
- Test keyboard navigation
- Ensure sufficient color contrast

## Troubleshooting

### Common Issues

**Slider Not Working**
- Ensure Finsweet script is properly loaded
- Check for JavaScript errors in browser console
- Verify attribute names match exactly

**Styling Issues**
- Check for CSS conflicts with existing styles
- Ensure proper CSS specificity
- Validate generated CSS syntax

**CMS Integration Problems**
- Verify CMS collection structure matches generated HTML
- Check collection list limits and filters
- Ensure proper field bindings

### Support Resources
- [Finsweet Attributes Documentation](https://finsweet.com/attributes/)
- [Webflow University](https://university.webflow.com/)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)

## Contributing

We welcome contributions to improve the Finsweet Slider Generator! Here's how you can help:

### Development Setup
1. Fork the repository
2. Make your changes
3. Test thoroughly with different configurations
4. Submit a pull request with detailed description

### Feature Requests
- Open an issue with the "enhancement" label
- Describe the feature and its use case
- Include mockups or examples if applicable

### Bug Reports
- Provide detailed reproduction steps
- Include browser version and extension version
- Attach screenshots if relevant

## Changelog

### Version 1.0.0
- Initial release
- Support for List Slider, Range Slider, and Custom Dots
- Real-time preview and code generation
- Copy to clipboard functionality
- Modern UI with tabbed interface

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- **Finsweet** for creating the amazing Attributes library
- **Webflow** for the powerful no-code platform
- **Chrome Extensions API** for enabling this tool

---

**Happy sliding!** 🎢

Built with ❤️ for the Webflow community.