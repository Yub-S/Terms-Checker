#  T&C Checker

**T&C Checker** is a browser extension that helps users understand Terms & Conditions easily. Select any text from Terms & Conditions on any webpage, click the extension, and get an AI-powered analysis of potential risks and important points in seconds.

## Features
- 🚀 Quick text selection and analysis
- ⚠️ Clear identification of potentially harmful clauses
- 📝 Easy-to-understand summaries
- ⚡ Instant results

## Installation Guide

### 1. Get the Code
```bash
git clone https://github.com/Yub-S/Terms-Checker.git
cd Terms-Checker
```

## 2. API Configuration
In the `config.js` file, replace the `"your gemini api key"` with your actual **GEMINI API KEY**:

```js
const config = {
    API_KEY: "your gemini api key",
};

export default config;
```
## 3. Origin Trial Token Configuration
1. Sign up for an origin trial and get a token.
2. Replace the placeholder token in `manifest.json` with your own token:

```json
"trial_tokens": [
  "Your-Origin-Trial-Token-Here"
]
```
## 4. Load the Extension in Chrome
1. Open Chrome browser.
2. Type `chrome://extensions/` in the address bar.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked".
5. Browse to the `Terms-Checker` folder and select it.
6. The extension icon should now appear in your browser toolbar.

## How to Use
1. Visit any website with Terms & Conditions.
2. Select the text you want to analyze.
3. Click on the T&C Checker extension icon in your browser.
4. Click the "Analyze" button.
5. Review any sneaky or serious terms identified in the Terms and Conditions.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

