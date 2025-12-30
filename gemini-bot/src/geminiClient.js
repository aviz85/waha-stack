import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Store interaction IDs for each phone (session)
const interactionIds = new Map();

/**
 * Send a message using Gemini Interactions API
 * Uses previous_interaction_id for server-side conversation history
 */
async function sendMessage(phone, userMessage, systemPrompt) {
  try {
    const previousInteractionId = interactionIds.get(phone);

    const config = {
      model: MODEL,
      input: userMessage,
    };

    // Add system instruction if this is the first message in session
    if (!previousInteractionId && systemPrompt) {
      config.config = {
        systemInstruction: systemPrompt
      };
    }

    // Use previous interaction ID for multi-turn conversation
    if (previousInteractionId) {
      config.previous_interaction_id = previousInteractionId;
    }

    const interaction = await ai.interactions.create(config);

    // Store the interaction ID for next turn
    interactionIds.set(phone, interaction.id);

    // Extract text response from outputs
    let responseText = '';
    if (interaction.outputs && interaction.outputs.length > 0) {
      for (const output of interaction.outputs) {
        if (output.type === 'text' || output.text) {
          responseText += output.text || '';
        }
      }
    }

    return {
      success: true,
      text: responseText.trim() || 'No response generated.',
      interactionId: interaction.id
    };

  } catch (error) {
    console.error('Gemini API error:', error.message);

    // If interaction ID is invalid, clear it and retry without
    if (error.message?.includes('interaction') && interactionIds.has(phone)) {
      interactionIds.delete(phone);
      return sendMessage(phone, userMessage, systemPrompt);
    }

    return {
      success: false,
      error: error.message || 'Failed to get response from Gemini'
    };
  }
}

/**
 * Clear interaction ID when session ends
 */
function clearSession(phone) {
  interactionIds.delete(phone);
}

/**
 * Check if Gemini API is configured and working
 */
async function healthCheck() {
  try {
    const interaction = await ai.interactions.create({
      model: MODEL,
      input: 'Hello'
    });
    return { healthy: true, model: MODEL };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

export { sendMessage, clearSession, healthCheck };
