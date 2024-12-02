// background.js
import config from '../config.js';

const API_KEY = config.API_KEY;
const API_URL = config.API_URL;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeTerms') {
        analyzeTerms(request.terms)
            .then(response => {
                console.log('API Response:', response); // Debug log
                console.log('Response Source:', response.apiSource);
                sendResponse(response);
            })
            .catch(error => {
                console.error('Analysis Error:', error); // Debug log
                sendResponse({ error: error.message });
            });
        return true; // Required for async response
    }
});

async function analyzeTerms(termsText) {
    try {
        // First, try the Prompt API
        const promptApiResult = await tryPromptApi(termsText);
        if (promptApiResult) {
            // Add source tracking
            promptApiResult.apiSource = 'Prompt API';
            return promptApiResult;
        }
    } catch (promptApiError) {
        console.warn('Prompt API failed:', promptApiError);
        // If Prompt API fails, fall back to Gemini
        const geminiResult = await tryGeminiApi(termsText);
        // Add source tracking
        geminiResult.apiSource = 'Gemini API';
        return geminiResult;
    }
}

async function tryPromptApi(termsText) {
    // Check if Prompt API is available
    const capabilities = await chrome.aiOriginTrial.languageModel.capabilities();
    
    if (capabilities.available === 'no') {
        throw new Error('Prompt API not available');
    }

    // Potentially handle 'after-download' scenario with download progress
    if (capabilities.available === 'after-download') {
        const session = await chrome.aiOriginTrial.languageModel.create({
            monitor(m) {
                m.addEventListener("downloadprogress", (e) => {
                    console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
                });
            },
            systemPrompt: 'You are an expert in analyzing terms and conditions, focusing on user risks.'
        });

        // Perform the analysis
        const result = await session.prompt(`Analyze these terms and conditions carefully and respond in JSON format:
        ${termsText}

        Your role is to identify potentially harmful or unusual terms and explain their real-world implications in simple language.

        Create a JSON response with exactly this structure:
        {
            "riskyClauses": [
                {
                    "impact": "Direct statement of what this means for the user in practical terms, focusing on consequences and risks"
                }
            ],
            "summary": "A concise summary of entire term and condition like what it contains in a simple, easy and understandable way. Not that much long just couple of sentences."
        }

        Guidelines:
        - Focus ONLY on identifying terms that:
          * Could have unexpected consequences for users
          * Involve financial risks or obligations
          * Affect user rights or property
          * Give unusual powers to the service provider
          * Are not standard in typical terms
        - For each risky clause:
          * Skip the legal language completely
          * State only the practical impact
          * Use direct, consequence-focused language
          * Explain why users should care
        - Keep language simple and conversational
        - Ensure the output is valid JSON`);

        // Parse the result
        let parsedContent;
        try {
            parsedContent = JSON.parse(result);
        } catch (parseError) {
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedContent = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Failed to parse Prompt API response as JSON');
            }
        }

        // Validate response structure
        if (!parsedContent.riskyClauses || !parsedContent.summary) {
            throw new Error('Invalid response structure from Prompt API');
        }

        return parsedContent;
    }

    // If available readily, proceed with session creation
    const session = await chrome.aiOriginTrial.languageModel.create({
        systemPrompt: 'You are an expert in analyzing terms and conditions, focusing on user risks.'
    });

    // Perform the analysis with the readily available Prompt API
    const result = await session.prompt(`Analyze these terms and conditions carefully and respond in JSON format:
    ${termsText}

    Your role is to identify potentially harmful or unusual terms and explain their real-world implications in simple language.

    Create a JSON response with exactly this structure:
    {
        "riskyClauses": [
            {
                "impact": "Direct statement of what this means for the user in practical terms, focusing on consequences and risks"
            }
        ],
        "summary": "A concise summary of entire term and condition like what it contains in a simple, easy and understandable way. Not that much long just couple of sentences."
    }

    Guidelines:
    - Focus ONLY on identifying terms that:
      * Could have unexpected consequences for users
      * Involve financial risks or obligations
      * Affect user rights or property
      * Give unusual powers to the service provider
      * Are not standard in typical terms
    - For each risky clause:
      * Skip the legal language completely
      * State only the practical impact
      * Use direct, consequence-focused language
      * Explain why users should care
    - Keep language simple and conversational
    - Ensure the output is valid JSON`);

    // Parse the result
    let parsedContent;
    try {
        parsedContent = JSON.parse(result);
    } catch (parseError) {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            parsedContent = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('Failed to parse Prompt API response as JSON');
        }
    }

    // Validate response structure
    if (!parsedContent.riskyClauses || !parsedContent.summary) {
        throw new Error('Invalid response structure from Prompt API');
    }

    return parsedContent;
}

async function tryGeminiApi(termsText) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': API_KEY
            },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{
                        text: `Analyze these terms and conditions carefully and respond in JSON format:
        ${termsText}

        Your role is to identify potentially harmful or unusual terms and explain their real-world implications in simple language.

        Create a JSON response with exactly this structure:
        {
            "riskyClauses": [
                {
                    "impact": "Direct statement of what this means for the user in practical terms, focusing on consequences and risks"
                }
            ],
            "summary": "A concise summary of entire term and condition like what it contains in a simple, easy and understandable way. Not that much long just couple of sentences."
        }

        Guidelines:
        - Focus ONLY on identifying terms that:
          * Could have unexpected consequences for users
          * Involve financial risks or obligations
          * Affect user rights or property
          * Give unusual powers to the service provider
          * Are not standard in typical terms
        - For each risky clause:
          * Skip the legal language completely
          * State only the practical impact
          * Use direct, consequence-focused language
          * Explain why users should care
        - Keep language simple and conversational
        - Ensure the output is valid JSON`
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 8192
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;

        let parsedContent;
        try {
            parsedContent = JSON.parse(responseText);
        } catch (parseError) {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedContent = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Failed to parse Gemini response as JSON');
            }
        }

        // Validate expected structure
        if (!parsedContent.riskyClauses || !parsedContent.summary) {
            throw new Error('Invalid response structure from Gemini');
        }

        return parsedContent;
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to analyze terms and conditions');
    }
}

// Error handling and request tracking
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 10;

setInterval(() => {
    requestCount = 0;
}, 60000); // Reset counter every minute