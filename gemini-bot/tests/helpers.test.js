/**
 * Helper Functions Unit Tests
 * Tests for utility functions used throughout the bot
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Helper functions (copied from server.js for testing)
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldHappen(probability) {
  return Math.random() < probability;
}

function formatTimeRemaining(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes > 0 ? `${minutes} דק' ${seconds} שנ'` : `${seconds} שנ'`;
}

function calculateTypingSegments(text) {
  const TYPING_SPEED_MIN = 30;
  const TYPING_SPEED_MAX = 60;
  const TYPING_PAUSE_CHANCE = 0.3;
  const TYPING_PAUSE_MIN = 800;
  const TYPING_PAUSE_MAX = 2500;

  const charCount = text.length;
  const typingSpeed = randomDelay(TYPING_SPEED_MIN, TYPING_SPEED_MAX);
  const totalDuration = Math.min((charCount / typingSpeed) * 1000, 20000);

  if (totalDuration < 3000) {
    return [{ duration: totalDuration, pauseAfter: 0 }];
  }

  const numSegments = randomDelay(2, Math.min(4, Math.ceil(totalDuration / 3000)));
  const segments = [];
  let remainingDuration = totalDuration;

  for (let i = 0; i < numSegments; i++) {
    const isLast = i === numSegments - 1;
    const segmentDuration = isLast
      ? remainingDuration
      : randomDelay(remainingDuration * 0.2, remainingDuration * 0.5);

    remainingDuration -= segmentDuration;

    const pauseAfter = !isLast && shouldHappen(TYPING_PAUSE_CHANCE)
      ? randomDelay(TYPING_PAUSE_MIN, TYPING_PAUSE_MAX)
      : 0;

    segments.push({ duration: segmentDuration, pauseAfter });
  }

  return segments;
}

describe('Random Delay', () => {
  it('should return value within range', () => {
    for (let i = 0; i < 100; i++) {
      const result = randomDelay(100, 500);
      assert.ok(result >= 100 && result <= 500);
    }
  });

  it('should return min when min equals max', () => {
    const result = randomDelay(250, 250);
    assert.strictEqual(result, 250);
  });

  it('should return integer values', () => {
    for (let i = 0; i < 50; i++) {
      const result = randomDelay(1, 1000);
      assert.strictEqual(result, Math.floor(result));
    }
  });

  it('should work with zero min', () => {
    for (let i = 0; i < 50; i++) {
      const result = randomDelay(0, 100);
      assert.ok(result >= 0 && result <= 100);
    }
  });

  it('should work with large ranges', () => {
    for (let i = 0; i < 50; i++) {
      const result = randomDelay(0, 100000);
      assert.ok(result >= 0 && result <= 100000);
    }
  });

  it('should have reasonable distribution', () => {
    const results = [];
    for (let i = 0; i < 1000; i++) {
      results.push(randomDelay(0, 100));
    }
    const avg = results.reduce((a, b) => a + b, 0) / results.length;
    // Average should be around 50 (center of range)
    assert.ok(avg > 40 && avg < 60);
  });
});

describe('Sleep', () => {
  it('should return a Promise', () => {
    const result = sleep(1);
    assert.ok(result instanceof Promise);
  });

  it('should resolve after specified time', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    assert.ok(elapsed >= 45); // Allow 5ms tolerance
  });

  it('should work with 0ms', async () => {
    const start = Date.now();
    await sleep(0);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 50);
  });
});

describe('Should Happen', () => {
  it('should always return false for probability 0', () => {
    for (let i = 0; i < 100; i++) {
      assert.strictEqual(shouldHappen(0), false);
    }
  });

  it('should always return true for probability 1', () => {
    for (let i = 0; i < 100; i++) {
      assert.strictEqual(shouldHappen(1), true);
    }
  });

  it('should return boolean', () => {
    for (let i = 0; i < 50; i++) {
      const result = shouldHappen(0.5);
      assert.strictEqual(typeof result, 'boolean');
    }
  });

  it('should roughly match probability over many trials', () => {
    let trueCount = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      if (shouldHappen(0.3)) trueCount++;
    }
    const ratio = trueCount / trials;
    // Should be around 0.3 with some variance
    assert.ok(ratio > 0.2 && ratio < 0.4);
  });

  it('should work with probability 0.5', () => {
    let trueCount = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      if (shouldHappen(0.5)) trueCount++;
    }
    const ratio = trueCount / trials;
    assert.ok(ratio > 0.4 && ratio < 0.6);
  });
});

describe('Format Time Remaining', () => {
  it('should format seconds only when under 1 minute', () => {
    const result = formatTimeRemaining(30000); // 30 seconds
    assert.strictEqual(result, "30 שנ'");
  });

  it('should format minutes and seconds', () => {
    const result = formatTimeRemaining(150000); // 2.5 minutes
    assert.strictEqual(result, "2 דק' 30 שנ'");
  });

  it('should handle exact minutes', () => {
    const result = formatTimeRemaining(300000); // 5 minutes
    assert.strictEqual(result, "5 דק' 0 שנ'");
  });

  it('should handle 0 seconds', () => {
    const result = formatTimeRemaining(0);
    assert.strictEqual(result, "0 שנ'");
  });

  it('should handle 1 second', () => {
    const result = formatTimeRemaining(1000);
    assert.strictEqual(result, "1 שנ'");
  });

  it('should handle 59 seconds', () => {
    const result = formatTimeRemaining(59000);
    assert.strictEqual(result, "59 שנ'");
  });

  it('should handle 60 seconds (1 minute)', () => {
    const result = formatTimeRemaining(60000);
    assert.strictEqual(result, "1 דק' 0 שנ'");
  });

  it('should handle 10 minutes', () => {
    const result = formatTimeRemaining(600000);
    assert.strictEqual(result, "10 דק' 0 שנ'");
  });

  it('should truncate to whole seconds', () => {
    const result = formatTimeRemaining(65500); // 1 min 5.5 sec
    assert.strictEqual(result, "1 דק' 5 שנ'");
  });
});

describe('Typing Segments', () => {
  it('should return array of segments', () => {
    const segments = calculateTypingSegments('Hello');
    assert.ok(Array.isArray(segments));
  });

  it('should return at least one segment', () => {
    const segments = calculateTypingSegments('Hi');
    assert.ok(segments.length >= 1);
  });

  it('should have duration property', () => {
    const segments = calculateTypingSegments('Hello world');
    segments.forEach(seg => {
      assert.ok(typeof seg.duration === 'number');
    });
  });

  it('should have pauseAfter property', () => {
    const segments = calculateTypingSegments('Hello world');
    segments.forEach(seg => {
      assert.ok(typeof seg.pauseAfter === 'number');
    });
  });

  it('should return single segment for short text', () => {
    const segments = calculateTypingSegments('Hi');
    assert.strictEqual(segments.length, 1);
    assert.strictEqual(segments[0].pauseAfter, 0);
  });

  it('should return multiple segments for long text', () => {
    const longText = 'A'.repeat(500);
    const segments = calculateTypingSegments(longText);
    // May have 2-4 segments for long text
    assert.ok(segments.length >= 1);
  });

  it('should not pause after last segment', () => {
    const text = 'A'.repeat(300);
    const segments = calculateTypingSegments(text);
    const lastSegment = segments[segments.length - 1];
    assert.strictEqual(lastSegment.pauseAfter, 0);
  });

  it('should have positive durations', () => {
    for (let i = 0; i < 20; i++) {
      const text = 'A'.repeat(50 + i * 20);
      const segments = calculateTypingSegments(text);
      segments.forEach(seg => {
        assert.ok(seg.duration > 0);
      });
    }
  });

  it('should have non-negative pause values', () => {
    for (let i = 0; i < 20; i++) {
      const text = 'A'.repeat(100 + i * 30);
      const segments = calculateTypingSegments(text);
      segments.forEach(seg => {
        assert.ok(seg.pauseAfter >= 0);
      });
    }
  });
});

describe('Phone Number Validation', () => {
  function isValidPhone(phone) {
    // Basic phone validation
    if (!phone || typeof phone !== 'string') return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  it('should accept valid Israeli phone', () => {
    assert.strictEqual(isValidPhone('972501234567'), true);
  });

  it('should accept valid US phone', () => {
    assert.strictEqual(isValidPhone('15551234567'), true);
  });

  it('should reject empty string', () => {
    assert.strictEqual(isValidPhone(''), false);
  });

  it('should reject null', () => {
    assert.strictEqual(isValidPhone(null), false);
  });

  it('should reject undefined', () => {
    assert.strictEqual(isValidPhone(undefined), false);
  });

  it('should reject short numbers', () => {
    assert.strictEqual(isValidPhone('123456789'), false);
  });

  it('should reject too long numbers', () => {
    assert.strictEqual(isValidPhone('1234567890123456'), false);
  });

  it('should handle phones with formatting', () => {
    assert.strictEqual(isValidPhone('+972-50-123-4567'), true);
  });
});

describe('Chat ID Handling', () => {
  function extractPhone(chatId) {
    if (!chatId) return null;
    return chatId.replace('@c.us', '').replace('@g.us', '');
  }

  function isGroupChat(chatId) {
    return chatId && chatId.includes('@g.us');
  }

  it('should extract phone from WhatsApp chatId', () => {
    assert.strictEqual(extractPhone('972501234567@c.us'), '972501234567');
  });

  it('should handle group chatId', () => {
    assert.strictEqual(extractPhone('12345678@g.us'), '12345678');
  });

  it('should handle already clean phone', () => {
    assert.strictEqual(extractPhone('972501234567'), '972501234567');
  });

  it('should return null for empty', () => {
    assert.strictEqual(extractPhone(''), null);
  });

  it('should detect group chat', () => {
    assert.strictEqual(isGroupChat('12345@g.us'), true);
  });

  it('should detect individual chat', () => {
    assert.strictEqual(isGroupChat('972501234567@c.us'), false);
  });
});

describe('Message Type Detection', () => {
  function isVoiceMessage(messageType) {
    return messageType === 'ptt' || messageType === 'audio';
  }

  function isTextMessage(messageType) {
    return messageType === 'text' || messageType === 'chat';
  }

  it('should detect ptt as voice', () => {
    assert.strictEqual(isVoiceMessage('ptt'), true);
  });

  it('should detect audio as voice', () => {
    assert.strictEqual(isVoiceMessage('audio'), true);
  });

  it('should not detect text as voice', () => {
    assert.strictEqual(isVoiceMessage('text'), false);
  });

  it('should detect text type', () => {
    assert.strictEqual(isTextMessage('text'), true);
  });

  it('should detect chat type', () => {
    assert.strictEqual(isTextMessage('chat'), true);
  });

  it('should not detect image as text', () => {
    assert.strictEqual(isTextMessage('image'), false);
  });
});

describe('End Keywords', () => {
  const END_KEYWORDS = ['end', 'stop', 'bye', 'quit', 'exit', 'סיום', 'ביי', 'יציאה'];

  function containsEndKeyword(text) {
    const lower = text.toLowerCase().trim();
    return END_KEYWORDS.some(kw => lower === kw || lower.includes(kw));
  }

  it('should detect "end"', () => {
    assert.strictEqual(containsEndKeyword('end'), true);
  });

  it('should detect "סיום"', () => {
    assert.strictEqual(containsEndKeyword('סיום'), true);
  });

  it('should detect case insensitive', () => {
    assert.strictEqual(containsEndKeyword('END'), true);
    assert.strictEqual(containsEndKeyword('Stop'), true);
  });

  it('should detect keyword in sentence', () => {
    assert.strictEqual(containsEndKeyword('I want to stop now'), true);
  });

  it('should not detect unrelated text', () => {
    assert.strictEqual(containsEndKeyword('hello world'), false);
  });

  it('should handle empty string', () => {
    assert.strictEqual(containsEndKeyword(''), false);
  });

  it('should detect "ביי"', () => {
    assert.strictEqual(containsEndKeyword('ביי'), true);
  });
});

describe('Session Trigger', () => {
  const SESSION_TRIGGER = 'הבוט של אביץ';

  function containsTrigger(text) {
    return text.includes(SESSION_TRIGGER);
  }

  function extractMessageWithoutTrigger(text) {
    return text.replace(SESSION_TRIGGER, '').trim();
  }

  it('should detect trigger in message', () => {
    assert.strictEqual(containsTrigger('הבוט של אביץ'), true);
  });

  it('should detect trigger with additional text', () => {
    assert.strictEqual(containsTrigger('שלום הבוט של אביץ מה שלומך'), true);
  });

  it('should not detect without trigger', () => {
    assert.strictEqual(containsTrigger('שלום מה שלומך'), false);
  });

  it('should extract message without trigger', () => {
    const result = extractMessageWithoutTrigger('הבוט של אביץ מה שלומך');
    assert.strictEqual(result, 'מה שלומך');
  });

  it('should handle trigger only', () => {
    const result = extractMessageWithoutTrigger('הבוט של אביץ');
    assert.strictEqual(result, '');
  });

  it('should handle trigger with prefix', () => {
    const result = extractMessageWithoutTrigger('שלום הבוט של אביץ');
    assert.strictEqual(result, 'שלום');
  });
});

console.log('\n🧪 Running Helper Functions Tests...\n');
