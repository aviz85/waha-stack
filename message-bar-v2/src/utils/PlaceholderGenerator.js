// ===== PLACEHOLDER SPRITE GENERATOR =====
// Generates placeholder sprites until real assets are available

import { COLORS, CUSTOMER_TYPES, BOTTLE_TYPES, CUSTOMER_STATES } from '../game/constants.js';

// Create an offscreen canvas for generating sprites
const createCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

// Draw pixel-art style rectangle with glow
const drawPixelRect = (ctx, x, y, w, h, color, glow = true) => {
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;

  // Pixel border
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
};

// Draw text with pixel font style
const drawPixelText = (ctx, text, x, y, size = 12, color = '#fff') => {
  ctx.font = `bold ${size}px monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
};

// ===== CUSTOMER PLACEHOLDER SPRITES =====
export const generateCustomerSprites = () => {
  const sprites = {};
  const frameWidth = 80;
  const frameHeight = 120;

  CUSTOMER_TYPES.forEach((type) => {
    sprites[type.id] = {};

    // Generate sprite sheet for each state
    Object.values(CUSTOMER_STATES).forEach((state) => {
      const frameCount = getFrameCount(state);
      const canvas = createCanvas(frameWidth * frameCount, frameHeight);
      const ctx = canvas.getContext('2d');

      for (let i = 0; i < frameCount; i++) {
        const x = i * frameWidth;
        drawCustomerFrame(ctx, x, 0, frameWidth, frameHeight, type, state, i);
      }

      sprites[type.id][state] = {
        image: canvas,
        frameWidth,
        frameHeight,
        frameCount,
        frameDuration: getFrameDuration(state),
      };
    });
  });

  return sprites;
};

const getFrameCount = (state) => {
  switch (state) {
    case CUSTOMER_STATES.WALKING_IN:
    case CUSTOMER_STATES.WALKING_OUT:
    case CUSTOMER_STATES.STORMING_OFF:
      return 8;
    case CUSTOMER_STATES.IMPATIENT:
      return 6;
    case CUSTOMER_STATES.IDLE:
    case CUSTOMER_STATES.ANGRY:
    case CUSTOMER_STATES.HAPPY:
      return 4;
    default:
      return 4;
  }
};

const getFrameDuration = (state) => {
  switch (state) {
    case CUSTOMER_STATES.WALKING_IN:
    case CUSTOMER_STATES.WALKING_OUT:
      return 100;
    case CUSTOMER_STATES.STORMING_OFF:
      return 80;
    case CUSTOMER_STATES.IMPATIENT:
      return 150;
    case CUSTOMER_STATES.ANGRY:
      return 100;
    default:
      return 200;
  }
};

const drawCustomerFrame = (ctx, x, y, w, h, type, state, frame) => {
  const centerX = x + w / 2;
  const bounce = Math.sin(frame * 0.8) * 3;

  // Body
  const bodyY = y + 30 + bounce;
  drawPixelRect(ctx, centerX - 20, bodyY, 40, 50, type.color);

  // Head
  const headY = bodyY - 25;
  ctx.beginPath();
  ctx.arc(centerX, headY, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#FFE0BD';
  ctx.fill();
  ctx.strokeStyle = type.color;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Face expression based on state
  drawFace(ctx, centerX, headY, state, frame);

  // Legs with walk animation
  const legOffset = state.includes('walking') || state === 'storming_off'
    ? Math.sin(frame * 1.5) * 8
    : 0;

  ctx.fillStyle = '#333';
  ctx.fillRect(centerX - 15, bodyY + 50, 12, 25 + legOffset);
  ctx.fillRect(centerX + 3, bodyY + 50, 12, 25 - legOffset);

  // State indicator
  drawStateIndicator(ctx, centerX, y + 10, state, frame);

  // Name label
  drawPixelText(ctx, type.name.split(' ')[0], centerX, y + h - 10, 10, '#fff');
};

const drawFace = (ctx, x, y, state, frame) => {
  ctx.fillStyle = '#333';

  // Eyes
  const eyeY = y - 3;
  const blinkFrame = frame % 16 === 0;

  if (blinkFrame && state !== CUSTOMER_STATES.ANGRY) {
    // Blink
    ctx.fillRect(x - 8, eyeY, 6, 2);
    ctx.fillRect(x + 2, eyeY, 6, 2);
  } else if (state === CUSTOMER_STATES.ANGRY) {
    // Angry eyes
    ctx.fillRect(x - 8, eyeY - 2, 6, 4);
    ctx.fillRect(x + 2, eyeY - 2, 6, 4);
    // Angry eyebrows
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, eyeY - 6);
    ctx.lineTo(x - 4, eyeY - 3);
    ctx.moveTo(x + 10, eyeY - 6);
    ctx.lineTo(x + 4, eyeY - 3);
    ctx.stroke();
  } else if (state === CUSTOMER_STATES.HAPPY) {
    // Happy eyes (closed smile)
    ctx.beginPath();
    ctx.arc(x - 5, eyeY, 4, 0, Math.PI, true);
    ctx.arc(x + 5, eyeY, 4, 0, Math.PI, true);
    ctx.stroke();
  } else {
    // Normal eyes
    ctx.fillRect(x - 8, eyeY - 2, 5, 5);
    ctx.fillRect(x + 3, eyeY - 2, 5, 5);
  }

  // Mouth
  const mouthY = y + 6;
  if (state === CUSTOMER_STATES.HAPPY) {
    ctx.beginPath();
    ctx.arc(x, mouthY, 6, 0, Math.PI);
    ctx.stroke();
  } else if (state === CUSTOMER_STATES.ANGRY) {
    ctx.beginPath();
    ctx.arc(x, mouthY + 4, 6, Math.PI, 0);
    ctx.stroke();
  } else if (state === CUSTOMER_STATES.IMPATIENT) {
    ctx.fillRect(x - 4, mouthY, 8, 3);
  } else {
    ctx.fillRect(x - 3, mouthY, 6, 2);
  }
};

const drawStateIndicator = (ctx, x, y, state, frame) => {
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';

  switch (state) {
    case CUSTOMER_STATES.ANGRY:
      ctx.fillStyle = COLORS.DANGER_RED;
      ctx.fillText(frame % 2 === 0 ? '!' : '!!', x, y);
      break;
    case CUSTOMER_STATES.IMPATIENT:
      ctx.fillStyle = COLORS.NEON_ORANGE;
      ctx.fillText('...', x, y);
      break;
    case CUSTOMER_STATES.HAPPY:
      ctx.fillStyle = COLORS.NEON_GREEN;
      ctx.fillText(['♥', '★', '♥', '★'][frame % 4], x, y);
      break;
    default:
      break;
  }
};

// ===== BOTTLE PLACEHOLDER SPRITES =====
export const generateBottleSprites = () => {
  const sprites = {};
  const frameWidth = 64;
  const frameHeight = 96;

  BOTTLE_TYPES.forEach((type) => {
    const states = ['idle', 'pouring', 'empty', 'refilling'];
    sprites[type.id] = {};

    states.forEach((state) => {
      const frameCount = state === 'idle' ? 4 : state === 'refilling' ? 8 : 4;
      const canvas = createCanvas(frameWidth * frameCount, frameHeight);
      const ctx = canvas.getContext('2d');

      for (let i = 0; i < frameCount; i++) {
        const x = i * frameWidth;
        drawBottleFrame(ctx, x, 0, frameWidth, frameHeight, type, state, i, frameCount);
      }

      sprites[type.id][state] = {
        image: canvas,
        frameWidth,
        frameHeight,
        frameCount,
        frameDuration: 150,
      };
    });
  });

  return sprites;
};

const drawBottleFrame = (ctx, x, y, w, h, type, state, frame, totalFrames) => {
  const centerX = x + w / 2;
  const bottleWidth = 36;
  const bottleHeight = 70;
  const bottleX = centerX - bottleWidth / 2;
  const bottleY = y + 15;

  // Calculate fill level
  let fillLevel = 1;
  if (state === 'empty') {
    fillLevel = 0;
  } else if (state === 'pouring') {
    fillLevel = 1 - (frame / totalFrames);
  } else if (state === 'refilling') {
    fillLevel = frame / totalFrames;
  }

  // Bottle outline (glass)
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;

  // Bottle shape
  ctx.beginPath();
  ctx.moveTo(bottleX + 10, bottleY);
  ctx.lineTo(bottleX + bottleWidth - 10, bottleY);
  ctx.lineTo(bottleX + bottleWidth - 5, bottleY + 15);
  ctx.lineTo(bottleX + bottleWidth, bottleY + 20);
  ctx.lineTo(bottleX + bottleWidth, bottleY + bottleHeight);
  ctx.lineTo(bottleX, bottleY + bottleHeight);
  ctx.lineTo(bottleX, bottleY + 20);
  ctx.lineTo(bottleX + 5, bottleY + 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Liquid fill
  if (fillLevel > 0) {
    const liquidHeight = (bottleHeight - 25) * fillLevel;
    const liquidY = bottleY + bottleHeight - liquidHeight;

    // Glow effect
    ctx.shadowColor = type.color;
    ctx.shadowBlur = 15 + Math.sin(frame * 0.5) * 5;

    ctx.fillStyle = type.color;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(bottleX + 3, liquidY, bottleWidth - 6, liquidHeight - 3);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Bubbles
    if (state === 'refilling' || state === 'idle') {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      const bubbleY = liquidY + 10 + (frame * 5) % (liquidHeight - 20);
      ctx.beginPath();
      ctx.arc(centerX - 5, bubbleY, 3, 0, Math.PI * 2);
      ctx.arc(centerX + 8, bubbleY + 10, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Cork/cap
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(centerX - 8, bottleY - 8, 16, 10);

  // Emoji label
  ctx.font = '20px serif';
  ctx.textAlign = 'center';
  ctx.fillText(type.emoji, centerX, bottleY + bottleHeight / 2);

  // Locked overlay
  if (type.locked) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(bottleX - 5, bottleY - 10, bottleWidth + 10, bottleHeight + 20);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = COLORS.NEON_PINK;
    ctx.fillText('SOON', centerX, bottleY + bottleHeight / 2);
  }

  // Name
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText(type.name, centerX, y + h - 5);
};

// ===== BACKGROUND PLACEHOLDER =====
export const generateBackground = (width, height) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Dark gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.BG_PURPLE);
  gradient.addColorStop(0.5, COLORS.BG_DARK);
  gradient.addColorStop(1, COLORS.BAR_WOOD);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Brick pattern on back wall
  ctx.fillStyle = 'rgba(60,30,50,0.5)';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 20; col++) {
      const offsetX = row % 2 === 0 ? 0 : 35;
      ctx.fillRect(col * 70 + offsetX + 2, row * 40 + 2, 66, 36);
    }
  }

  // Shelf area
  ctx.fillStyle = 'rgba(30,15,40,0.9)';
  ctx.fillRect(0, 80, width, 180);

  // Shelves
  for (let i = 0; i < 3; i++) {
    const shelfY = 100 + i * 50;
    ctx.fillStyle = COLORS.BAR_WOOD_LIGHT;
    ctx.fillRect(0, shelfY + 40, width, 8);

    // Neon underglow
    ctx.shadowColor = i === 0 ? COLORS.NEON_PINK : i === 1 ? COLORS.NEON_CYAN : COLORS.NEON_PURPLE;
    ctx.shadowBlur = 15;
    ctx.fillStyle = ctx.shadowColor;
    ctx.fillRect(0, shelfY + 48, width, 2);
    ctx.shadowBlur = 0;
  }

  // Bar counter
  const barY = 470;
  ctx.fillStyle = COLORS.BAR_WOOD_LIGHT;
  ctx.fillRect(0, barY, width, 15);
  ctx.fillStyle = COLORS.BAR_WOOD;
  ctx.fillRect(0, barY + 15, width, 250);

  // Metal rail
  ctx.fillStyle = COLORS.BAR_METAL;
  ctx.fillRect(30, barY + 180, width - 60, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(30, barY + 180, width - 60, 3);

  // Neon sign placeholder
  ctx.strokeStyle = COLORS.NEON_PINK;
  ctx.lineWidth = 3;
  ctx.shadowColor = COLORS.NEON_PINK;
  ctx.shadowBlur = 20;
  ctx.strokeRect(width - 220, 20, 180, 50);
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = COLORS.NEON_PINK;
  ctx.textAlign = 'center';
  ctx.fillText('OPEN 24/7', width - 130, 52);
  ctx.shadowBlur = 0;

  return canvas;
};

// ===== EFFECT SPRITES =====
export const generateEffectSprites = () => {
  const effects = {};

  // Sparkle effect
  const sparkleFrames = 8;
  const sparkleSize = 64;
  const sparkleCanvas = createCanvas(sparkleSize * sparkleFrames, sparkleSize);
  const sparkleCtx = sparkleCanvas.getContext('2d');

  for (let i = 0; i < sparkleFrames; i++) {
    const x = i * sparkleSize + sparkleSize / 2;
    const y = sparkleSize / 2;
    const alpha = 1 - (i / sparkleFrames);
    const scale = 0.5 + (i / sparkleFrames) * 0.5;

    sparkleCtx.save();
    sparkleCtx.globalAlpha = alpha;

    // Draw sparkle star
    for (let j = 0; j < 8; j++) {
      const angle = (j / 8) * Math.PI * 2;
      const length = (15 + Math.random() * 10) * scale;
      sparkleCtx.strokeStyle = j % 2 === 0 ? COLORS.NEON_YELLOW : COLORS.NEON_CYAN;
      sparkleCtx.lineWidth = 2;
      sparkleCtx.beginPath();
      sparkleCtx.moveTo(x, y);
      sparkleCtx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      sparkleCtx.stroke();
    }

    sparkleCtx.restore();
  }

  effects.sparkle = {
    image: sparkleCanvas,
    frameWidth: sparkleSize,
    frameHeight: sparkleSize,
    frameCount: sparkleFrames,
    frameDuration: 80,
  };

  // Angry steam effect
  const steamFrames = 6;
  const steamSize = 48;
  const steamCanvas = createCanvas(steamSize * steamFrames, steamSize);
  const steamCtx = steamCanvas.getContext('2d');

  for (let i = 0; i < steamFrames; i++) {
    const x = i * steamSize + steamSize / 2;
    const y = steamSize - 10 - i * 5;

    steamCtx.fillStyle = COLORS.DANGER_RED;
    steamCtx.globalAlpha = 1 - (i / steamFrames) * 0.7;

    // Steam puffs
    steamCtx.beginPath();
    steamCtx.arc(x - 8, y, 8 - i, 0, Math.PI * 2);
    steamCtx.arc(x + 8, y - 5, 6 - i * 0.5, 0, Math.PI * 2);
    steamCtx.arc(x, y - 10, 7 - i * 0.7, 0, Math.PI * 2);
    steamCtx.fill();
  }

  effects.steam = {
    image: steamCanvas,
    frameWidth: steamSize,
    frameHeight: steamSize,
    frameCount: steamFrames,
    frameDuration: 120,
  };

  // Hearts effect
  const heartFrames = 6;
  const heartSize = 32;
  const heartCanvas = createCanvas(heartSize * heartFrames, heartSize);
  const heartCtx = heartCanvas.getContext('2d');

  for (let i = 0; i < heartFrames; i++) {
    const x = i * heartSize + heartSize / 2;
    const y = heartSize - 8 - i * 4;
    const scale = 1 - i * 0.1;

    heartCtx.save();
    heartCtx.globalAlpha = 1 - (i / heartFrames);
    heartCtx.fillStyle = COLORS.NEON_PINK;
    heartCtx.font = `${20 * scale}px serif`;
    heartCtx.textAlign = 'center';
    heartCtx.fillText('♥', x, y);
    heartCtx.restore();
  }

  effects.hearts = {
    image: heartCanvas,
    frameWidth: heartSize,
    frameHeight: heartSize,
    frameCount: heartFrames,
    frameDuration: 150,
  };

  return effects;
};

// ===== UI ELEMENTS =====
export const generateUISprites = () => {
  const ui = {};

  // Patience meter frame
  const meterWidth = 100;
  const meterHeight = 16;
  const meterCanvas = createCanvas(meterWidth, meterHeight);
  const meterCtx = meterCanvas.getContext('2d');

  meterCtx.fillStyle = 'rgba(0,0,0,0.7)';
  meterCtx.fillRect(0, 0, meterWidth, meterHeight);
  meterCtx.strokeStyle = COLORS.BAR_METAL;
  meterCtx.lineWidth = 2;
  meterCtx.strokeRect(1, 1, meterWidth - 2, meterHeight - 2);

  ui.patienceMeter = meterCanvas;

  // Message bubble
  const bubbleWidth = 180;
  const bubbleHeight = 60;
  const bubbleCanvas = createCanvas(bubbleWidth, bubbleHeight);
  const bubbleCtx = bubbleCanvas.getContext('2d');

  bubbleCtx.fillStyle = 'rgba(20,10,40,0.95)';
  bubbleCtx.strokeStyle = COLORS.NEON_CYAN;
  bubbleCtx.lineWidth = 2;

  // Rounded rectangle
  const radius = 8;
  bubbleCtx.beginPath();
  bubbleCtx.moveTo(radius, 0);
  bubbleCtx.lineTo(bubbleWidth - radius, 0);
  bubbleCtx.quadraticCurveTo(bubbleWidth, 0, bubbleWidth, radius);
  bubbleCtx.lineTo(bubbleWidth, bubbleHeight - radius - 10);
  bubbleCtx.quadraticCurveTo(bubbleWidth, bubbleHeight - 10, bubbleWidth - radius, bubbleHeight - 10);
  bubbleCtx.lineTo(30, bubbleHeight - 10);
  bubbleCtx.lineTo(20, bubbleHeight);
  bubbleCtx.lineTo(20, bubbleHeight - 10);
  bubbleCtx.lineTo(radius, bubbleHeight - 10);
  bubbleCtx.quadraticCurveTo(0, bubbleHeight - 10, 0, bubbleHeight - 10 - radius);
  bubbleCtx.lineTo(0, radius);
  bubbleCtx.quadraticCurveTo(0, 0, radius, 0);
  bubbleCtx.closePath();
  bubbleCtx.fill();
  bubbleCtx.stroke();

  ui.messageBubble = bubbleCanvas;

  return ui;
};

// Generate all placeholders
export const generateAllPlaceholders = () => {
  return {
    customers: generateCustomerSprites(),
    bottles: generateBottleSprites(),
    effects: generateEffectSprites(),
    ui: generateUISprites(),
    background: null, // Generated separately with dimensions
  };
};
