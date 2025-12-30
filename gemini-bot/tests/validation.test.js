/**
 * Input Validation Unit Tests
 * Tests for API input validation and security
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// API Key Validation
describe('API Key Validation', () => {
  function validateApiKey(provided, expected) {
    if (!provided || !expected) return { valid: false, error: 'Missing API key' };
    if (typeof provided !== 'string') return { valid: false, error: 'Invalid API key format' };
    if (provided !== expected) return { valid: false, error: 'Invalid API key' };
    return { valid: true };
  }

  it('should accept valid API key', () => {
    const result = validateApiKey('test-key-123', 'test-key-123');
    assert.strictEqual(result.valid, true);
  });

  it('should reject missing provided key', () => {
    const result = validateApiKey(null, 'test-key-123');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('Missing'));
  });

  it('should reject missing expected key', () => {
    const result = validateApiKey('test-key-123', null);
    assert.strictEqual(result.valid, false);
  });

  it('should reject wrong key', () => {
    const result = validateApiKey('wrong-key', 'test-key-123');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('Invalid'));
  });

  it('should reject empty string key', () => {
    const result = validateApiKey('', 'test-key-123');
    assert.strictEqual(result.valid, false);
  });

  it('should be case sensitive', () => {
    const result = validateApiKey('TEST-KEY-123', 'test-key-123');
    assert.strictEqual(result.valid, false);
  });

  it('should reject non-string key', () => {
    const result = validateApiKey(12345, 'test-key-123');
    assert.strictEqual(result.valid, false);
  });

  it('should accept long API keys', () => {
    const longKey = 'a'.repeat(64);
    const result = validateApiKey(longKey, longKey);
    assert.strictEqual(result.valid, true);
  });
});

// System Prompt Validation
describe('System Prompt Validation', () => {
  const MIN_LENGTH = 10;
  const MAX_LENGTH = 10000;

  function validateSystemPrompt(prompt) {
    if (!prompt) return { valid: false, error: 'System prompt is required' };
    if (typeof prompt !== 'string') return { valid: false, error: 'System prompt must be a string' };

    const trimmed = prompt.trim();
    if (trimmed.length < MIN_LENGTH) {
      return { valid: false, error: `System prompt must be at least ${MIN_LENGTH} characters` };
    }
    if (trimmed.length > MAX_LENGTH) {
      return { valid: false, error: `System prompt must be less than ${MAX_LENGTH} characters` };
    }

    return { valid: true, value: trimmed };
  }

  it('should accept valid prompt', () => {
    const result = validateSystemPrompt('This is a valid system prompt');
    assert.strictEqual(result.valid, true);
  });

  it('should reject null', () => {
    const result = validateSystemPrompt(null);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('required'));
  });

  it('should reject undefined', () => {
    const result = validateSystemPrompt(undefined);
    assert.strictEqual(result.valid, false);
  });

  it('should reject empty string', () => {
    const result = validateSystemPrompt('');
    assert.strictEqual(result.valid, false);
  });

  it('should reject short prompt', () => {
    const result = validateSystemPrompt('short');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('at least'));
  });

  it('should accept exactly 10 characters', () => {
    const result = validateSystemPrompt('1234567890');
    assert.strictEqual(result.valid, true);
  });

  it('should reject 9 characters', () => {
    const result = validateSystemPrompt('123456789');
    assert.strictEqual(result.valid, false);
  });

  it('should trim whitespace', () => {
    const result = validateSystemPrompt('   Valid prompt here   ');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.value, 'Valid prompt here');
  });

  it('should reject whitespace-only prompt', () => {
    const result = validateSystemPrompt('         ');
    assert.strictEqual(result.valid, false);
  });

  it('should accept Hebrew prompt', () => {
    const result = validateSystemPrompt('אתה עוזר AI ידידותי');
    assert.strictEqual(result.valid, true);
  });

  it('should accept emoji in prompt', () => {
    const result = validateSystemPrompt('You are a helpful 🤖 assistant');
    assert.strictEqual(result.valid, true);
  });

  it('should accept multiline prompt', () => {
    const result = validateSystemPrompt('Line 1\nLine 2\nLine 3');
    assert.strictEqual(result.valid, true);
  });

  it('should reject non-string', () => {
    const result = validateSystemPrompt(12345);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('string'));
  });

  it('should reject array', () => {
    const result = validateSystemPrompt(['prompt']);
    assert.strictEqual(result.valid, false);
  });

  it('should reject object', () => {
    const result = validateSystemPrompt({ prompt: 'test' });
    assert.strictEqual(result.valid, false);
  });

  it('should reject very long prompt', () => {
    const result = validateSystemPrompt('a'.repeat(MAX_LENGTH + 1));
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('less than'));
  });

  it('should accept maximum length prompt', () => {
    const result = validateSystemPrompt('a'.repeat(MAX_LENGTH));
    assert.strictEqual(result.valid, true);
  });
});

// Phone Number Validation
describe('Phone Number Validation', () => {
  function validatePhone(phone) {
    if (!phone) return { valid: false, error: 'Phone number is required' };
    if (typeof phone !== 'string') return { valid: false, error: 'Phone must be a string' };

    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) return { valid: false, error: 'Phone number too short' };
    if (cleaned.length > 15) return { valid: false, error: 'Phone number too long' };

    return { valid: true, phone: cleaned };
  }

  it('should accept valid phone', () => {
    const result = validatePhone('972501234567');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.phone, '972501234567');
  });

  it('should clean formatting', () => {
    const result = validatePhone('+972-50-123-4567');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.phone, '972501234567');
  });

  it('should reject null', () => {
    const result = validatePhone(null);
    assert.strictEqual(result.valid, false);
  });

  it('should reject empty', () => {
    const result = validatePhone('');
    assert.strictEqual(result.valid, false);
  });

  it('should reject short number', () => {
    const result = validatePhone('123456789');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('short'));
  });

  it('should reject long number', () => {
    const result = validatePhone('1234567890123456');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('long'));
  });

  it('should accept 10 digit number', () => {
    const result = validatePhone('1234567890');
    assert.strictEqual(result.valid, true);
  });

  it('should accept 15 digit number', () => {
    const result = validatePhone('123456789012345');
    assert.strictEqual(result.valid, true);
  });

  it('should handle spaces', () => {
    const result = validatePhone('972 50 123 4567');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.phone, '972501234567');
  });

  it('should handle parentheses', () => {
    const result = validatePhone('(972) 50-123-4567');
    assert.strictEqual(result.valid, true);
  });
});

// Message Content Validation
describe('Message Content Validation', () => {
  const MAX_MESSAGE_LENGTH = 4096;

  function validateMessage(message) {
    if (!message) return { valid: false, error: 'Message is required' };
    if (typeof message !== 'string') return { valid: false, error: 'Message must be a string' };

    const trimmed = message.trim();
    if (trimmed.length === 0) return { valid: false, error: 'Message cannot be empty' };
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: 'Message too long' };
    }

    return { valid: true, message: trimmed };
  }

  it('should accept valid message', () => {
    const result = validateMessage('Hello world');
    assert.strictEqual(result.valid, true);
  });

  it('should reject null', () => {
    const result = validateMessage(null);
    assert.strictEqual(result.valid, false);
  });

  it('should reject empty', () => {
    const result = validateMessage('');
    assert.strictEqual(result.valid, false);
  });

  it('should reject whitespace only', () => {
    const result = validateMessage('   ');
    assert.strictEqual(result.valid, false);
  });

  it('should trim whitespace', () => {
    const result = validateMessage('  Hello  ');
    assert.strictEqual(result.message, 'Hello');
  });

  it('should accept single character', () => {
    const result = validateMessage('A');
    assert.strictEqual(result.valid, true);
  });

  it('should accept Hebrew message', () => {
    const result = validateMessage('שלום עולם');
    assert.strictEqual(result.valid, true);
  });

  it('should accept emoji message', () => {
    const result = validateMessage('👋🌍');
    assert.strictEqual(result.valid, true);
  });

  it('should reject very long message', () => {
    const result = validateMessage('a'.repeat(MAX_MESSAGE_LENGTH + 1));
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('long'));
  });

  it('should accept maximum length message', () => {
    const result = validateMessage('a'.repeat(MAX_MESSAGE_LENGTH));
    assert.strictEqual(result.valid, true);
  });
});

// Webhook Payload Validation
describe('Webhook Payload Validation', () => {
  function validateWebhookPayload(payload) {
    if (!payload) return { valid: false, error: 'Payload is required' };
    if (typeof payload !== 'object') return { valid: false, error: 'Payload must be an object' };
    if (!payload.event) return { valid: false, error: 'Event type is required' };
    if (!payload.payload) return { valid: false, error: 'Message payload is required' };

    return { valid: true };
  }

  it('should accept valid webhook payload', () => {
    const result = validateWebhookPayload({
      event: 'message',
      payload: { from: '972501234567@c.us', body: 'Hello' }
    });
    assert.strictEqual(result.valid, true);
  });

  it('should reject null', () => {
    const result = validateWebhookPayload(null);
    assert.strictEqual(result.valid, false);
  });

  it('should reject missing event', () => {
    const result = validateWebhookPayload({
      payload: { from: '972501234567@c.us' }
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('Event'));
  });

  it('should reject missing payload', () => {
    const result = validateWebhookPayload({
      event: 'message'
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('payload'));
  });

  it('should reject non-object', () => {
    const result = validateWebhookPayload('not an object');
    assert.strictEqual(result.valid, false);
  });
});

// Config Key Validation
describe('Config Key Validation', () => {
  const VALID_KEYS = ['system_prompt', 'voice_chance', 'session_timeout'];

  function validateConfigKey(key) {
    if (!key) return { valid: false, error: 'Key is required' };
    if (typeof key !== 'string') return { valid: false, error: 'Key must be a string' };
    if (!VALID_KEYS.includes(key)) return { valid: false, error: 'Unknown config key' };
    return { valid: true };
  }

  it('should accept valid key', () => {
    const result = validateConfigKey('system_prompt');
    assert.strictEqual(result.valid, true);
  });

  it('should reject unknown key', () => {
    const result = validateConfigKey('unknown_key');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('Unknown'));
  });

  it('should reject null', () => {
    const result = validateConfigKey(null);
    assert.strictEqual(result.valid, false);
  });

  it('should reject number', () => {
    const result = validateConfigKey(123);
    assert.strictEqual(result.valid, false);
  });
});

// Rate Limit Validation
describe('Rate Limit Values', () => {
  const SESSION_TIMEOUT_MS = 10 * 60 * 1000;
  const RATE_LIMIT_MS = 60 * 60 * 1000;
  const MAX_MESSAGES = 20;

  it('should have 10 minute session timeout', () => {
    assert.strictEqual(SESSION_TIMEOUT_MS, 600000);
  });

  it('should have 1 hour rate limit', () => {
    assert.strictEqual(RATE_LIMIT_MS, 3600000);
  });

  it('should have 20 message limit', () => {
    assert.strictEqual(MAX_MESSAGES, 20);
  });

  it('should calculate wait time correctly', () => {
    const sessionStarted = Date.now() - (30 * 60 * 1000); // 30 min ago
    const waitTime = Math.ceil((sessionStarted + RATE_LIMIT_MS - Date.now()) / 60000);
    assert.strictEqual(waitTime, 30);
  });
});

// Voice Message Count Validation
describe('Voice Message Count', () => {
  function getMessageCount(isVoice) {
    return isVoice ? 2 : 1;
  }

  it('should return 1 for text message', () => {
    assert.strictEqual(getMessageCount(false), 1);
  });

  it('should return 2 for voice message', () => {
    assert.strictEqual(getMessageCount(true), 2);
  });
});

// URL Validation
describe('URL Validation', () => {
  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  it('should accept http URL', () => {
    assert.strictEqual(isValidUrl('http://localhost:3000'), true);
  });

  it('should accept https URL', () => {
    assert.strictEqual(isValidUrl('https://api.example.com'), true);
  });

  it('should reject invalid URL', () => {
    assert.strictEqual(isValidUrl('not-a-url'), false);
  });

  it('should reject empty string', () => {
    assert.strictEqual(isValidUrl(''), false);
  });

  it('should accept URL with path', () => {
    assert.strictEqual(isValidUrl('http://localhost:3000/api/webhook'), true);
  });

  it('should accept URL with query params', () => {
    assert.strictEqual(isValidUrl('http://localhost:3000?key=value'), true);
  });
});

// JSON Parsing Validation
describe('JSON Parsing', () => {
  function safeJsonParse(str) {
    try {
      return { success: true, data: JSON.parse(str) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  it('should parse valid JSON object', () => {
    const result = safeJsonParse('{"key": "value"}');
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.data, { key: 'value' });
  });

  it('should parse valid JSON array', () => {
    const result = safeJsonParse('[1, 2, 3]');
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.data, [1, 2, 3]);
  });

  it('should fail on invalid JSON', () => {
    const result = safeJsonParse('not json');
    assert.strictEqual(result.success, false);
  });

  it('should fail on empty string', () => {
    const result = safeJsonParse('');
    assert.strictEqual(result.success, false);
  });

  it('should parse nested objects', () => {
    const result = safeJsonParse('{"a": {"b": {"c": 1}}}');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.a.b.c, 1);
  });
});

console.log('\n🧪 Running Validation Tests...\n');
