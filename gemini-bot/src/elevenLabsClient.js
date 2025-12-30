/**
 * ElevenLabs Text-to-Speech & Speech-to-Text Client
 * - Generates voice audio from text for WhatsApp voice messages
 * - Transcribes incoming voice messages to text
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const ELEVENLABS_STT_MODEL = process.env.ELEVENLABS_STT_MODEL || 'scribe_v1';

// Voice message settings
const VOICE_MESSAGE_CHANCE = parseFloat(process.env.VOICE_MESSAGE_CHANCE || '0.15'); // 15% default

/**
 * Check if ElevenLabs is configured
 */
function isEnabled() {
  return !!ELEVENLABS_API_KEY;
}

/**
 * Check if we should send a voice message (random chance)
 */
function shouldSendVoice() {
  if (!isEnabled()) return false;
  return Math.random() < VOICE_MESSAGE_CHANCE;
}

/**
 * Generate speech audio from text using ElevenLabs API
 * Returns base64-encoded audio data or null on error
 */
async function generateSpeech(text) {
  if (!ELEVENLABS_API_KEY) {
    console.error('ElevenLabs API key not configured');
    return null;
  }

  // Limit text length for voice (WhatsApp voice messages shouldn't be too long)
  const maxLength = 500;
  const truncatedText = text.length > maxLength
    ? text.substring(0, maxLength) + '...'
    : text;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: truncatedText,
          model_id: ELEVENLABS_MODEL,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return null;
    }

    // Get audio as ArrayBuffer and convert to base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    console.log(`[ElevenLabs] Generated ${Math.round(audioBuffer.byteLength / 1024)}KB audio`);

    return {
      base64: base64Audio,
      mimetype: 'audio/mpeg',
      size: audioBuffer.byteLength
    };

  } catch (error) {
    console.error('ElevenLabs generation error:', error.message);
    return null;
  }
}

/**
 * Get available voices (for testing/configuration)
 */
async function getVoices() {
  if (!ELEVENLABS_API_KEY) {
    return [];
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.voices.map(v => ({
      id: v.voice_id,
      name: v.name,
      category: v.category
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Transcribe audio to text using ElevenLabs Speech-to-Text API
 * @param {Buffer|string} audioData - Audio buffer or base64 string
 * @param {string} mimetype - Audio mimetype (e.g., 'audio/ogg', 'audio/mpeg')
 * @returns {Promise<string|null>} Transcribed text or null on error
 */
async function transcribeAudio(audioData, mimetype = 'audio/ogg') {
  if (!ELEVENLABS_API_KEY) {
    console.error('ElevenLabs API key not configured');
    return null;
  }

  try {
    // Convert base64 to buffer if needed
    const audioBuffer = typeof audioData === 'string'
      ? Buffer.from(audioData, 'base64')
      : audioData;

    // Create form data for multipart upload
    const formData = new FormData();

    // Create a Blob from the buffer
    const blob = new Blob([audioBuffer], { type: mimetype });
    formData.append('file', blob, 'audio.ogg');
    formData.append('model_id', ELEVENLABS_STT_MODEL);

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs STT error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const transcribedText = data.text || '';

    console.log(`[ElevenLabs] Transcribed: "${transcribedText.substring(0, 50)}..."`);

    return transcribedText;

  } catch (error) {
    console.error('ElevenLabs transcription error:', error.message);
    return null;
  }
}

/**
 * Download audio from URL and return as buffer
 */
async function downloadAudio(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to download audio:', response.status);
      return null;
    }
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    console.error('Audio download error:', error.message);
    return null;
  }
}

/**
 * Health check for ElevenLabs
 */
async function healthCheck() {
  if (!isEnabled()) {
    return { enabled: false };
  }

  try {
    const voices = await getVoices();
    return {
      enabled: true,
      voiceId: ELEVENLABS_VOICE_ID,
      ttsModel: ELEVENLABS_MODEL,
      sttModel: ELEVENLABS_STT_MODEL,
      voiceMessageChance: VOICE_MESSAGE_CHANCE,
      availableVoices: voices.length
    };
  } catch (error) {
    return {
      enabled: true,
      error: error.message
    };
  }
}

export {
  isEnabled,
  shouldSendVoice,
  generateSpeech,
  transcribeAudio,
  downloadAudio,
  getVoices,
  healthCheck,
  VOICE_MESSAGE_CHANCE
};
