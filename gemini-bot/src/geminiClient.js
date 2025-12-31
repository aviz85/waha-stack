import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Store chat sessions for each phone
const chatSessions = new Map();

/**
 * Get or create a chat session for a phone number
 */
function getOrCreateChat(phone, systemPrompt) {
  if (!chatSessions.has(phone)) {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt
    });
    const chat = model.startChat({
      history: []
    });
    chatSessions.set(phone, chat);
  }
  return chatSessions.get(phone);
}

/**
 * Send a message using Gemini Chat API
 */
async function sendMessage(phone, userMessage, systemPrompt) {
  try {
    const chat = getOrCreateChat(phone, systemPrompt);
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const responseText = response.text();

    return {
      success: true,
      text: responseText.trim() || 'No response generated.'
    };

  } catch (error) {
    console.error('Gemini API error:', error.message);

    // If session is corrupted, clear it and retry
    if (chatSessions.has(phone)) {
      chatSessions.delete(phone);
      // Retry once with fresh session
      try {
        const chat = getOrCreateChat(phone, systemPrompt);
        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        return {
          success: true,
          text: response.text().trim() || 'No response generated.'
        };
      } catch (retryError) {
        return {
          success: false,
          error: retryError.message || 'Failed to get response from Gemini'
        };
      }
    }

    return {
      success: false,
      error: error.message || 'Failed to get response from Gemini'
    };
  }
}

/**
 * Clear chat session when session ends
 */
function clearSession(phone) {
  chatSessions.delete(phone);
}

/**
 * Check if Gemini API is configured and working
 */
async function healthCheck() {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent('Say "OK" in one word');
    const response = await result.response;
    response.text(); // Will throw if failed
    return { healthy: true, model: MODEL };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

export { sendMessage, clearSession, healthCheck };
