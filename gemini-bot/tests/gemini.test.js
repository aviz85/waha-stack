/**
 * Gemini Client Unit Tests
 * Tests for Gemini API interactions (mocked)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Mock interaction ID management
class MockInteractionManager {
  constructor() {
    this.interactionIds = new Map();
  }

  get(phone) {
    return this.interactionIds.get(phone);
  }

  set(phone, id) {
    this.interactionIds.set(phone, id);
  }

  delete(phone) {
    this.interactionIds.delete(phone);
  }

  clear() {
    this.interactionIds.clear();
  }

  size() {
    return this.interactionIds.size;
  }
}

// Mock response parsing
function parseGeminiResponse(interaction) {
  if (!interaction || !interaction.outputs) {
    return { text: '', error: 'No outputs in response' };
  }

  let responseText = '';
  for (const output of interaction.outputs) {
    if (output.type === 'text' || output.text) {
      responseText += output.text || '';
    }
  }

  return { text: responseText.trim() || 'No response generated.' };
}

// Mock message sending result
function createSendResult(success, text, interactionId, error) {
  if (success) {
    return { success: true, text, interactionId };
  }
  return { success: false, error };
}

// Config validation
function validateGeminiConfig(config) {
  const errors = [];
  if (!config.model) errors.push('Model is required');
  if (!config.input) errors.push('Input is required');
  return { valid: errors.length === 0, errors };
}

describe('Interaction ID Management', () => {
  let manager;

  it('should create new manager', () => {
    manager = new MockInteractionManager();
    assert.ok(manager);
  });

  it('should return undefined for non-existent phone', () => {
    manager = new MockInteractionManager();
    assert.strictEqual(manager.get('972501234567'), undefined);
  });

  it('should store interaction ID', () => {
    manager = new MockInteractionManager();
    manager.set('972501234567', 'interaction-123');
    assert.strictEqual(manager.get('972501234567'), 'interaction-123');
  });

  it('should update interaction ID', () => {
    manager = new MockInteractionManager();
    manager.set('972501234567', 'interaction-123');
    manager.set('972501234567', 'interaction-456');
    assert.strictEqual(manager.get('972501234567'), 'interaction-456');
  });

  it('should delete interaction ID', () => {
    manager = new MockInteractionManager();
    manager.set('972501234567', 'interaction-123');
    manager.delete('972501234567');
    assert.strictEqual(manager.get('972501234567'), undefined);
  });

  it('should clear all IDs', () => {
    manager = new MockInteractionManager();
    manager.set('972501111111', 'id1');
    manager.set('972502222222', 'id2');
    manager.clear();
    assert.strictEqual(manager.size(), 0);
  });

  it('should track multiple phones', () => {
    manager = new MockInteractionManager();
    manager.set('972501111111', 'id1');
    manager.set('972502222222', 'id2');
    manager.set('972503333333', 'id3');
    assert.strictEqual(manager.size(), 3);
  });

  it('should return different IDs for different phones', () => {
    manager = new MockInteractionManager();
    manager.set('972501111111', 'id1');
    manager.set('972502222222', 'id2');
    assert.strictEqual(manager.get('972501111111'), 'id1');
    assert.strictEqual(manager.get('972502222222'), 'id2');
  });
});

describe('Response Parsing', () => {
  it('should parse text output', () => {
    const interaction = {
      outputs: [{ type: 'text', text: 'Hello world' }]
    };
    const result = parseGeminiResponse(interaction);
    assert.strictEqual(result.text, 'Hello world');
  });

  it('should parse multiple outputs', () => {
    const interaction = {
      outputs: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'world' }
      ]
    };
    const result = parseGeminiResponse(interaction);
    assert.strictEqual(result.text, 'Hello world');
  });

  it('should handle null interaction', () => {
    const result = parseGeminiResponse(null);
    assert.ok(result.error);
  });

  it('should handle missing outputs', () => {
    const result = parseGeminiResponse({});
    assert.ok(result.error);
  });

  it('should handle empty outputs array', () => {
    const result = parseGeminiResponse({ outputs: [] });
    assert.strictEqual(result.text, 'No response generated.');
  });

  it('should trim whitespace', () => {
    const interaction = {
      outputs: [{ type: 'text', text: '  Hello  ' }]
    };
    const result = parseGeminiResponse(interaction);
    assert.strictEqual(result.text, 'Hello');
  });

  it('should handle output without type', () => {
    const interaction = {
      outputs: [{ text: 'Hello' }]
    };
    const result = parseGeminiResponse(interaction);
    assert.strictEqual(result.text, 'Hello');
  });
});

describe('Send Result Creation', () => {
  it('should create success result', () => {
    const result = createSendResult(true, 'Hello', 'int-123');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.text, 'Hello');
    assert.strictEqual(result.interactionId, 'int-123');
  });

  it('should create error result', () => {
    const result = createSendResult(false, null, null, 'API Error');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'API Error');
  });

  it('should not include text in error result', () => {
    const result = createSendResult(false, 'ignored', 'ignored', 'Error');
    assert.strictEqual(result.text, undefined);
  });

  it('should not include error in success result', () => {
    const result = createSendResult(true, 'Hello', 'id');
    assert.strictEqual(result.error, undefined);
  });
});

describe('Config Validation', () => {
  it('should accept valid config', () => {
    const result = validateGeminiConfig({
      model: 'gemini-2.0-flash',
      input: 'Hello'
    });
    assert.strictEqual(result.valid, true);
  });

  it('should reject missing model', () => {
    const result = validateGeminiConfig({
      input: 'Hello'
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.includes('Model is required'));
  });

  it('should reject missing input', () => {
    const result = validateGeminiConfig({
      model: 'gemini-2.0-flash'
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.includes('Input is required'));
  });

  it('should reject empty config', () => {
    const result = validateGeminiConfig({});
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length, 2);
  });
});

describe('Model Validation', () => {
  const VALID_MODELS = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];

  function validateModel(model) {
    if (!model) return { valid: false, error: 'Model is required' };
    if (!VALID_MODELS.includes(model)) {
      return { valid: false, error: 'Invalid model' };
    }
    return { valid: true };
  }

  it('should accept gemini-2.0-flash', () => {
    const result = validateModel('gemini-2.0-flash');
    assert.strictEqual(result.valid, true);
  });

  it('should accept gemini-1.5-pro', () => {
    const result = validateModel('gemini-1.5-pro');
    assert.strictEqual(result.valid, true);
  });

  it('should reject null', () => {
    const result = validateModel(null);
    assert.strictEqual(result.valid, false);
  });

  it('should reject invalid model', () => {
    const result = validateModel('gpt-4');
    assert.strictEqual(result.valid, false);
  });
});

describe('System Instruction', () => {
  function createConfig(input, systemPrompt, previousId) {
    const config = {
      model: 'gemini-2.0-flash',
      input
    };

    if (!previousId && systemPrompt) {
      config.config = { systemInstruction: systemPrompt };
    }

    if (previousId) {
      config.previous_interaction_id = previousId;
    }

    return config;
  }

  it('should add system instruction for first message', () => {
    const config = createConfig('Hello', 'Be helpful', null);
    assert.strictEqual(config.config.systemInstruction, 'Be helpful');
  });

  it('should not add system instruction when previous ID exists', () => {
    const config = createConfig('Hello', 'Be helpful', 'prev-id');
    assert.strictEqual(config.config, undefined);
  });

  it('should add previous_interaction_id when provided', () => {
    const config = createConfig('Hello', 'Be helpful', 'prev-id');
    assert.strictEqual(config.previous_interaction_id, 'prev-id');
  });

  it('should not add previous_interaction_id when null', () => {
    const config = createConfig('Hello', 'Be helpful', null);
    assert.strictEqual(config.previous_interaction_id, undefined);
  });
});

describe('Error Handling', () => {
  function handleGeminiError(error, manager, phone) {
    const message = error.message || 'Unknown error';

    // If interaction ID is invalid, clear it
    if (message.includes('interaction') && manager.get(phone)) {
      manager.delete(phone);
      return { retry: true, cleared: true };
    }

    return { retry: false, error: message };
  }

  it('should suggest retry for interaction error', () => {
    const manager = new MockInteractionManager();
    manager.set('972501234567', 'id');

    const result = handleGeminiError(
      { message: 'Invalid interaction ID' },
      manager,
      '972501234567'
    );

    assert.strictEqual(result.retry, true);
    assert.strictEqual(result.cleared, true);
    assert.strictEqual(manager.get('972501234567'), undefined);
  });

  it('should not retry for other errors', () => {
    const manager = new MockInteractionManager();
    const result = handleGeminiError(
      { message: 'Rate limit exceeded' },
      manager,
      '972501234567'
    );

    assert.strictEqual(result.retry, false);
    assert.strictEqual(result.error, 'Rate limit exceeded');
  });

  it('should handle missing error message', () => {
    const manager = new MockInteractionManager();
    const result = handleGeminiError({}, manager, '972501234567');
    assert.strictEqual(result.error, 'Unknown error');
  });
});

describe('Session Clearing', () => {
  it('should clear interaction ID on session end', () => {
    const manager = new MockInteractionManager();
    manager.set('972501234567', 'id');

    manager.delete('972501234567');

    assert.strictEqual(manager.get('972501234567'), undefined);
  });

  it('should not affect other sessions', () => {
    const manager = new MockInteractionManager();
    manager.set('972501111111', 'id1');
    manager.set('972502222222', 'id2');

    manager.delete('972501111111');

    assert.strictEqual(manager.get('972501111111'), undefined);
    assert.strictEqual(manager.get('972502222222'), 'id2');
  });
});

describe('Health Check', () => {
  function createHealthCheck(success, model) {
    if (success) {
      return { healthy: true, model };
    }
    return { healthy: false, error: 'Connection failed' };
  }

  it('should return healthy when successful', () => {
    const result = createHealthCheck(true, 'gemini-2.0-flash');
    assert.strictEqual(result.healthy, true);
    assert.strictEqual(result.model, 'gemini-2.0-flash');
  });

  it('should return unhealthy with error', () => {
    const result = createHealthCheck(false);
    assert.strictEqual(result.healthy, false);
    assert.ok(result.error);
  });
});

describe('Input Sanitization', () => {
  function sanitizeInput(input) {
    if (!input) return '';
    if (typeof input !== 'string') return String(input);
    return input.trim();
  }

  it('should trim whitespace', () => {
    assert.strictEqual(sanitizeInput('  hello  '), 'hello');
  });

  it('should handle null', () => {
    assert.strictEqual(sanitizeInput(null), '');
  });

  it('should convert number to string', () => {
    assert.strictEqual(sanitizeInput(123), '123');
  });

  it('should handle empty string', () => {
    assert.strictEqual(sanitizeInput(''), '');
  });
});

describe('Response Text Extraction', () => {
  function extractText(outputs) {
    if (!Array.isArray(outputs)) return '';
    return outputs
      .filter(o => o.type === 'text' || o.text)
      .map(o => o.text || '')
      .join('')
      .trim();
  }

  it('should extract from single output', () => {
    const result = extractText([{ type: 'text', text: 'Hello' }]);
    assert.strictEqual(result, 'Hello');
  });

  it('should concatenate multiple outputs', () => {
    const result = extractText([
      { type: 'text', text: 'Hello ' },
      { type: 'text', text: 'World' }
    ]);
    assert.strictEqual(result, 'Hello World');
  });

  it('should handle empty array', () => {
    assert.strictEqual(extractText([]), '');
  });

  it('should handle non-array', () => {
    assert.strictEqual(extractText(null), '');
  });

  it('should filter non-text outputs', () => {
    const result = extractText([
      { type: 'image', url: 'http://...' },
      { type: 'text', text: 'Hello' }
    ]);
    assert.strictEqual(result, 'Hello');
  });
});

console.log('\n🧪 Running Gemini Client Tests...\n');
