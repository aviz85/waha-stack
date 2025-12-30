/**
 * ElevenLabs Client Unit Tests
 * Tests for TTS and STT functionality (mocked API calls)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Mock ElevenLabs client functions
const VOICE_MESSAGE_CHANCE = 0.15;
const VOICE_REPLY_CHANCE_TO_VOICE = 0.70;

function isEnabled(apiKey) {
  return !!apiKey;
}

function shouldSendVoice(apiKey) {
  if (!isEnabled(apiKey)) return false;
  return Math.random() < VOICE_MESSAGE_CHANCE;
}

function shouldSendVoiceReply(apiKey, replyingToVoice) {
  if (!isEnabled(apiKey)) return false;
  const chance = replyingToVoice ? VOICE_REPLY_CHANCE_TO_VOICE : VOICE_MESSAGE_CHANCE;
  return Math.random() < chance;
}

function validateTTSInput(text) {
  if (!text) return { valid: false, error: 'Text is required' };
  if (typeof text !== 'string') return { valid: false, error: 'Text must be a string' };
  if (text.trim().length === 0) return { valid: false, error: 'Text cannot be empty' };
  return { valid: true, text: text.trim() };
}

function truncateForVoice(text, maxLength = 500) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function validateAudioData(data) {
  if (!data) return { valid: false, error: 'Audio data is required' };
  if (typeof data !== 'string' && !Buffer.isBuffer(data)) {
    return { valid: false, error: 'Audio data must be a string or Buffer' };
  }
  return { valid: true };
}

function formatAudioResponse(base64, mimetype, size) {
  return {
    base64,
    mimetype: mimetype || 'audio/mpeg',
    size
  };
}

describe('ElevenLabs Configuration', () => {
  it('should be enabled when API key exists', () => {
    assert.strictEqual(isEnabled('valid-api-key'), true);
  });

  it('should be disabled when API key is null', () => {
    assert.strictEqual(isEnabled(null), false);
  });

  it('should be disabled when API key is empty', () => {
    assert.strictEqual(isEnabled(''), false);
  });

  it('should be disabled when API key is undefined', () => {
    assert.strictEqual(isEnabled(undefined), false);
  });
});

describe('Voice Message Probability', () => {
  it('should not send voice when disabled', () => {
    for (let i = 0; i < 100; i++) {
      assert.strictEqual(shouldSendVoice(null), false);
    }
  });

  it('should sometimes send voice when enabled', () => {
    // Over 1000 trials with 15% chance, we should get some true
    let trueCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (shouldSendVoice('api-key')) trueCount++;
    }
    assert.ok(trueCount > 0);
    assert.ok(trueCount < 300); // Should be around 150
  });

  it('should have correct normal chance', () => {
    assert.strictEqual(VOICE_MESSAGE_CHANCE, 0.15);
  });

  it('should have correct reply chance', () => {
    assert.strictEqual(VOICE_REPLY_CHANCE_TO_VOICE, 0.70);
  });

  it('should have higher chance when replying to voice', () => {
    let normalCount = 0;
    let voiceReplyCount = 0;
    const trials = 1000;

    for (let i = 0; i < trials; i++) {
      if (shouldSendVoiceReply('api-key', false)) normalCount++;
      if (shouldSendVoiceReply('api-key', true)) voiceReplyCount++;
    }

    // Voice reply should have more hits
    assert.ok(voiceReplyCount > normalCount);
  });
});

describe('TTS Input Validation', () => {
  it('should accept valid text', () => {
    const result = validateTTSInput('Hello world');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.text, 'Hello world');
  });

  it('should reject null', () => {
    const result = validateTTSInput(null);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('required'));
  });

  it('should reject empty string', () => {
    const result = validateTTSInput('');
    assert.strictEqual(result.valid, false);
  });

  it('should reject whitespace only', () => {
    const result = validateTTSInput('   ');
    assert.strictEqual(result.valid, false);
  });

  it('should trim whitespace', () => {
    const result = validateTTSInput('  Hello  ');
    assert.strictEqual(result.text, 'Hello');
  });

  it('should accept Hebrew text', () => {
    const result = validateTTSInput('שלום עולם');
    assert.strictEqual(result.valid, true);
  });

  it('should accept emoji', () => {
    const result = validateTTSInput('Hello 👋');
    assert.strictEqual(result.valid, true);
  });

  it('should accept multiline text', () => {
    const result = validateTTSInput('Line 1\nLine 2');
    assert.strictEqual(result.valid, true);
  });

  it('should reject non-string', () => {
    const result = validateTTSInput(12345);
    assert.strictEqual(result.valid, false);
  });
});

describe('Text Truncation', () => {
  it('should not truncate short text', () => {
    const result = truncateForVoice('Hello');
    assert.strictEqual(result, 'Hello');
  });

  it('should truncate long text', () => {
    const longText = 'A'.repeat(600);
    const result = truncateForVoice(longText);
    assert.strictEqual(result.length, 503); // 500 + '...'
  });

  it('should add ellipsis when truncating', () => {
    const longText = 'A'.repeat(600);
    const result = truncateForVoice(longText);
    assert.ok(result.endsWith('...'));
  });

  it('should keep text at exactly max length', () => {
    const text = 'A'.repeat(500);
    const result = truncateForVoice(text);
    assert.strictEqual(result.length, 500);
    assert.ok(!result.endsWith('...'));
  });

  it('should use custom max length', () => {
    const text = 'A'.repeat(200);
    const result = truncateForVoice(text, 100);
    assert.strictEqual(result.length, 103);
  });

  it('should handle empty string', () => {
    const result = truncateForVoice('');
    assert.strictEqual(result, '');
  });
});

describe('Audio Data Validation', () => {
  it('should accept string data', () => {
    const result = validateAudioData('base64data');
    assert.strictEqual(result.valid, true);
  });

  it('should accept Buffer data', () => {
    const result = validateAudioData(Buffer.from('test'));
    assert.strictEqual(result.valid, true);
  });

  it('should reject null', () => {
    const result = validateAudioData(null);
    assert.strictEqual(result.valid, false);
  });

  it('should reject undefined', () => {
    const result = validateAudioData(undefined);
    assert.strictEqual(result.valid, false);
  });

  it('should reject number', () => {
    const result = validateAudioData(12345);
    assert.strictEqual(result.valid, false);
  });

  it('should reject object', () => {
    const result = validateAudioData({ data: 'test' });
    assert.strictEqual(result.valid, false);
  });
});

describe('Audio Response Format', () => {
  it('should format audio response correctly', () => {
    const result = formatAudioResponse('base64data', 'audio/mpeg', 1024);

    assert.strictEqual(result.base64, 'base64data');
    assert.strictEqual(result.mimetype, 'audio/mpeg');
    assert.strictEqual(result.size, 1024);
  });

  it('should default to audio/mpeg mimetype', () => {
    const result = formatAudioResponse('data', null, 100);
    assert.strictEqual(result.mimetype, 'audio/mpeg');
  });

  it('should accept different mimetypes', () => {
    const result = formatAudioResponse('data', 'audio/ogg', 100);
    assert.strictEqual(result.mimetype, 'audio/ogg');
  });
});

describe('STT Model Validation', () => {
  const VALID_STT_MODELS = ['scribe_v1', 'whisper_v2'];

  function validateSTTModel(model) {
    if (!model) return 'scribe_v1'; // default
    if (!VALID_STT_MODELS.includes(model)) return 'scribe_v1';
    return model;
  }

  it('should return default for null', () => {
    const result = validateSTTModel(null);
    assert.strictEqual(result, 'scribe_v1');
  });

  it('should return default for undefined', () => {
    const result = validateSTTModel(undefined);
    assert.strictEqual(result, 'scribe_v1');
  });

  it('should accept valid model', () => {
    const result = validateSTTModel('scribe_v1');
    assert.strictEqual(result, 'scribe_v1');
  });

  it('should return default for invalid model', () => {
    const result = validateSTTModel('invalid_model');
    assert.strictEqual(result, 'scribe_v1');
  });
});

describe('TTS Model Validation', () => {
  const VALID_TTS_MODELS = ['eleven_multilingual_v2', 'eleven_turbo_v2_5'];

  function validateTTSModel(model) {
    if (!model) return 'eleven_multilingual_v2';
    if (!VALID_TTS_MODELS.includes(model)) return 'eleven_multilingual_v2';
    return model;
  }

  it('should return default for null', () => {
    const result = validateTTSModel(null);
    assert.strictEqual(result, 'eleven_multilingual_v2');
  });

  it('should accept valid model', () => {
    const result = validateTTSModel('eleven_turbo_v2_5');
    assert.strictEqual(result, 'eleven_turbo_v2_5');
  });

  it('should return default for invalid', () => {
    const result = validateTTSModel('invalid');
    assert.strictEqual(result, 'eleven_multilingual_v2');
  });
});

describe('Voice ID Validation', () => {
  const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

  function validateVoiceId(voiceId) {
    if (!voiceId || typeof voiceId !== 'string') return DEFAULT_VOICE_ID;
    if (voiceId.length < 10) return DEFAULT_VOICE_ID;
    return voiceId;
  }

  it('should return default for null', () => {
    const result = validateVoiceId(null);
    assert.strictEqual(result, DEFAULT_VOICE_ID);
  });

  it('should return default for empty', () => {
    const result = validateVoiceId('');
    assert.strictEqual(result, DEFAULT_VOICE_ID);
  });

  it('should accept valid voice ID', () => {
    const result = validateVoiceId('customVoiceId123');
    assert.strictEqual(result, 'customVoiceId123');
  });

  it('should return default for short ID', () => {
    const result = validateVoiceId('short');
    assert.strictEqual(result, DEFAULT_VOICE_ID);
  });
});

describe('Voice Settings', () => {
  function createVoiceSettings(options = {}) {
    return {
      stability: options.stability ?? 0.5,
      similarity_boost: options.similarity_boost ?? 0.75,
      style: options.style ?? 0.5,
      use_speaker_boost: options.use_speaker_boost ?? true
    };
  }

  it('should use default values', () => {
    const settings = createVoiceSettings();
    assert.strictEqual(settings.stability, 0.5);
    assert.strictEqual(settings.similarity_boost, 0.75);
    assert.strictEqual(settings.style, 0.5);
    assert.strictEqual(settings.use_speaker_boost, true);
  });

  it('should allow custom stability', () => {
    const settings = createVoiceSettings({ stability: 0.8 });
    assert.strictEqual(settings.stability, 0.8);
  });

  it('should allow custom similarity_boost', () => {
    const settings = createVoiceSettings({ similarity_boost: 0.9 });
    assert.strictEqual(settings.similarity_boost, 0.9);
  });

  it('should allow disabling speaker boost', () => {
    const settings = createVoiceSettings({ use_speaker_boost: false });
    assert.strictEqual(settings.use_speaker_boost, false);
  });
});

describe('Audio Mimetype Detection', () => {
  function detectMimetype(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimetypes = {
      'mp3': 'audio/mpeg',
      'ogg': 'audio/ogg',
      'wav': 'audio/wav',
      'opus': 'audio/opus'
    };
    return mimetypes[ext] || 'audio/ogg';
  }

  it('should detect mp3', () => {
    assert.strictEqual(detectMimetype('voice.mp3'), 'audio/mpeg');
  });

  it('should detect ogg', () => {
    assert.strictEqual(detectMimetype('voice.ogg'), 'audio/ogg');
  });

  it('should detect wav', () => {
    assert.strictEqual(detectMimetype('voice.wav'), 'audio/wav');
  });

  it('should detect opus', () => {
    assert.strictEqual(detectMimetype('voice.opus'), 'audio/opus');
  });

  it('should default to ogg for unknown', () => {
    assert.strictEqual(detectMimetype('voice.unknown'), 'audio/ogg');
  });

  it('should handle no extension', () => {
    assert.strictEqual(detectMimetype('voice'), 'audio/ogg');
  });
});

describe('Health Check Response', () => {
  function createHealthResponse(apiKey) {
    if (!apiKey) {
      return { enabled: false };
    }
    return {
      enabled: true,
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      ttsModel: 'eleven_multilingual_v2',
      sttModel: 'scribe_v1',
      voiceMessageChance: VOICE_MESSAGE_CHANCE
    };
  }

  it('should return disabled when no key', () => {
    const result = createHealthResponse(null);
    assert.strictEqual(result.enabled, false);
    assert.strictEqual(result.voiceId, undefined);
  });

  it('should return enabled with details when key exists', () => {
    const result = createHealthResponse('api-key');
    assert.strictEqual(result.enabled, true);
    assert.ok(result.voiceId);
    assert.ok(result.ttsModel);
    assert.ok(result.sttModel);
    assert.strictEqual(result.voiceMessageChance, VOICE_MESSAGE_CHANCE);
  });
});

console.log('\n🧪 Running ElevenLabs Tests...\n');
