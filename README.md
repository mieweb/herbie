# Herbie - Browser Automation & Testing Extension

Herbie is a powerful Chrome extension for browser automation and usability testing. It provides an intuitive interface for creating, executing, and managing test scripts with advanced verification capabilities.

## Features

### 🚀 Core Automation
- **Script Execution**: Run custom test scripts with natural language syntax
- **Element Inspection**: Point-and-click XPath/CSS selector capture
- **Keyword System**: Define reusable element selectors (global and site-specific)
- **Verification Engine**: Comprehensive validation of text, attributes, state, and page properties

### 🧪 Usability Testing
- **Live Testing Interface**: Inject floating control panel on any website
- **Automatic Verification**: Passive monitoring of test conditions
- **Timer & Tracking**: Built-in stopwatch and progress tracking
- **Test Management**: Start, monitor, and end usability tests seamlessly

### 📝 Script Management
- **Visual Script Builder**: Drag-and-drop interface for creating test scripts
- **Script Library**: Save, organize, and reuse test scripts
- **Import/Export**: Share scripts and keywords across team members
- **Live Logging**: Real-time execution logs and verification results

### ⚙️ Advanced Features
- **Content Script Management**: Enable/disable automation features
- **Cross-page Persistence**: Maintain interface across navigation
- **Multiple Verification Types**: Text content, form values, element states, page titles/URLs
- **Responsive Design**: Works across different screen sizes and layouts

## Installation

### From Chrome Web Store
*Coming soon - extension is currently in development*

### Manual Installation (Development)
1. Clone this repository:
   ```bash
   git clone https://github.com/mieweb/herbie.git
   cd herbie
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `public` folder

## Quick Start

### 1. Enable Content Scripts
- Click the Herbie extension icon
- Go to Settings tab
- Ensure "Enable Content Scripts" is toggled ON

### 2. Create Your First Script
Navigate to the main Herbie tab and try this simple script:
```
click "Submit"
verify text contains "Success" in "#result"
```

### 3. Use Keywords for Efficiency
Go to the Keywords tab to define reusable selectors:
- **Keyword**: `submit_button`
- **XPath**: `//button[@type='submit']`

Then use in scripts:
```
click submit_button
wait 2000
verify text contains "Form submitted" in result_message
```

## Script Syntax

Herbie uses a natural language syntax for test scripts:

### Basic Actions
```
click "Button Text"
type "Hello World" into "input_field"
wait 3000
navigate "https://example.com"
```

### Element Selection
```
# By text content
click "Submit"

# By keyword (defined in Keywords tab)
click submit_button

# By XPath
click "//button[@id='submit']"

# By CSS selector
click "#submit-btn"
```

### Verification
```
# Text verification
verify text equals "Welcome" in "#header"
verify text contains "Success" in result_area

# Attribute verification  
verify value equals "John" in "input[name='name']"
verify placeholder contains "Enter email" in email_field

# State verification
verify state is visible in submit_button
verify state is enabled in "#form-submit"
verify state is hidden in error_message

# Page verification
verify title equals "Dashboard"
verify url contains "/dashboard"
```

### Advanced Features
```
# Bulleted lists for form filling
* Name: John Doe
* Email: john@example.com
* Phone: 123-456-7890

# Variable keywords (use {$} placeholder)
# Define keyword: user_row with XPath: //tr[contains(., '{$}')]
click user_row "John Doe"
```

## Usability Testing

### Starting a Test
1. **From Test Platform**: Start a usability test that includes Herbie script
2. **Inject Interface**: Use "Inject Test Interface" button in Usability Testing tab
3. **Monitor Progress**: The floating interface shows test progress and verifications
4. **End Test**: Click "End Test" to complete and clean up

### Test Features
- **Automatic Script Loading**: Test scripts are automatically parsed and monitored
- **Passive Verification**: Verifications run in background without interrupting user flow
- **Real-time Results**: See verification status in the injected interface
- **Cross-page Persistence**: Interface stays active during navigation
- **Automatic Cleanup**: Interface removes itself when test ends

## Keywords System

### Global Keywords
Available across all websites:
```
Keyword: search_box
XPath: //input[@type='search']
```

### Local Keywords  
Site-specific selectors (automatically scoped to domain):
```
Keyword: login_button  
XPath: //button[contains(@class, 'site-login')]
```

### Variable Keywords
Dynamic selectors with placeholders:
```
Keyword: user_row
XPath: //tr[contains(., '{$}')]
Has Variable: ✓

Usage: click user_row "John Smith"
```

## Development

### Project Structure
```
├── public/
│   ├── manifest.json          # Extension manifest
│   ├── background/            # Background scripts
│   ├── content-scripts/       # Content scripts
│   ├── parser/               # Script parser
│   └── dist/                 # Built assets
├── src/
│   ├── tabs/                 # Extension popup tabs
│   ├── components/           # Svelte components
│   ├── utils/                # Utility functions
│   └── InjectedComponents/   # Injectable interfaces
└── rollup.config.js          # Build configuration
```

### Building
```bash
# Development build with watch
npm run dev

# Production build
npm run build

# Start development server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and submit a pull request

### Development Guidelines
- Follow existing code style and patterns
- Test all changes across different websites
- Update documentation for new features
- Ensure content scripts are optional and toggleable

## Troubleshooting

### Common Issues

**Scripts Not Running**
- Ensure content scripts are enabled in Settings
- Check that you're on a supported webpage (not chrome:// pages)
- Verify script syntax using the Parse button

**Elements Not Found**
- Use the Inspector tool to capture accurate selectors
- Test XPath/CSS selectors in browser developer tools
- Consider using keywords for more reliable element targeting

**Verification Failures**
- Check timing - add `wait` commands before verifications
- Verify element visibility and state
- Use specific verification operators (equals, contains, etc.)

**Usability Testing Issues**
- Ensure test includes valid Herbie script
- Check that injected interface appears on page
- Verify content scripts are enabled

### Support
- Documentation: [Getting Started Guide](https://mieweb.github.io/herbie/getting-started/Getting%20Started)
- Issues: [GitHub Issues](https://github.com/mieweb/herbie/issues)
- Discussions: [GitHub Discussions](https://github.com/mieweb/herbie/discussions)


## Acknowledgments

- Built by [MIE](https://www.mieweb.com/)
- Powered by [Svelte](https://svelte.dev/)
- Uses [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/)

---

**Version**: 2.1  
**Manifest**: v3  
**Minimum Chrome Version**: 88+