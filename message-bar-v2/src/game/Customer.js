// ===== CUSTOMER ENTITY =====

import {
  CUSTOMER_STATES,
  CUSTOMER_TYPES,
  POSITIONS,
  GAME_CONFIG,
  DEMO_MESSAGES,
  DEMO_NAMES,
} from './constants.js';

let customerIdCounter = 0;

export class Customer {
  constructor(options = {}) {
    this.id = ++customerIdCounter;

    // Pick random type or use provided
    const typeIndex = options.typeIndex ?? Math.floor(Math.random() * CUSTOMER_TYPES.length);
    this.type = CUSTOMER_TYPES[typeIndex];

    // Customer data
    this.name = options.name || DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
    this.message = options.message || DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)];
    this.phone = options.phone || `demo_${this.id}`;
    this.isReal = options.isReal || false;

    // Position
    this.x = POSITIONS.CUSTOMER_SPAWN_X;
    this.y = POSITIONS.BAR_Y - 120; // Stand above bar
    this.targetX = null;
    this.slotIndex = null;

    // State
    this.state = CUSTOMER_STATES.WALKING_IN;
    this.patience = this.type.patience;
    this.maxPatience = this.type.patience;
    this.arrivedAt = Date.now();

    // Animation
    this.frame = 0;
    this.frameTimer = 0;
    this.animationSpeed = 150; // ms per frame

    // Flags
    this.isServed = false;
    this.isLeaving = false;
    this.isRemovable = false;

    // Scale and effects
    this.scale = 1;
    this.alpha = 1;
    this.shakeOffset = 0;
  }

  // Assign a slot at the bar
  assignSlot(slotIndex) {
    this.slotIndex = slotIndex;
    this.targetX = POSITIONS.CUSTOMER_SLOTS[slotIndex];
  }

  // Update customer state
  update(deltaTime, difficulty = 1) {
    // Update animation frame
    this.frameTimer += deltaTime;
    if (this.frameTimer >= this.animationSpeed) {
      this.frameTimer = 0;
      this.frame++;
    }

    // State machine
    switch (this.state) {
      case CUSTOMER_STATES.WALKING_IN:
        this.updateWalkingIn(deltaTime);
        break;
      case CUSTOMER_STATES.IDLE:
      case CUSTOMER_STATES.IMPATIENT:
      case CUSTOMER_STATES.ANGRY:
        this.updateWaiting(deltaTime, difficulty);
        break;
      case CUSTOMER_STATES.HAPPY:
        this.updateHappy(deltaTime);
        break;
      case CUSTOMER_STATES.WALKING_OUT:
      case CUSTOMER_STATES.STORMING_OFF:
        this.updateLeaving(deltaTime);
        break;
    }

    // Shake effect when angry
    if (this.state === CUSTOMER_STATES.ANGRY) {
      this.shakeOffset = (Math.random() - 0.5) * 6;
    } else {
      this.shakeOffset = 0;
    }
  }

  updateWalkingIn(deltaTime) {
    if (this.targetX === null) return;

    const speed = this.type.walkSpeed * (deltaTime / 16);
    this.x -= speed * 3;

    if (this.x <= this.targetX) {
      this.x = this.targetX;
      this.state = CUSTOMER_STATES.IDLE;
      this.frame = 0;
    }
  }

  updateWaiting(deltaTime, difficulty) {
    // Decay patience
    const decayRate = GAME_CONFIG.PATIENCE_DECAY_RATE * difficulty * (deltaTime / 1000);
    this.patience = Math.max(0, this.patience - decayRate);

    // Update state based on patience
    const patiencePercent = (this.patience / this.maxPatience) * 100;

    if (patiencePercent <= 0) {
      this.stormOff();
    } else if (patiencePercent < 25 && this.state !== CUSTOMER_STATES.ANGRY) {
      this.state = CUSTOMER_STATES.ANGRY;
      this.frame = 0;
      this.animationSpeed = 100;
    } else if (patiencePercent < 50 && this.state === CUSTOMER_STATES.IDLE) {
      this.state = CUSTOMER_STATES.IMPATIENT;
      this.frame = 0;
      this.animationSpeed = 150;
    }
  }

  updateHappy(deltaTime) {
    // Play happy animation then walk out
    if (this.frame >= 3) {
      this.state = CUSTOMER_STATES.WALKING_OUT;
      this.frame = 0;
      this.isLeaving = true;
    }
  }

  updateLeaving(deltaTime) {
    const speed = this.type.walkSpeed * (deltaTime / 16);

    if (this.state === CUSTOMER_STATES.WALKING_OUT) {
      this.x -= speed * 2;
      this.alpha = Math.max(0, this.alpha - 0.01);
    } else {
      // Storming off goes right
      this.x += speed * 4;
    }

    // Mark for removal when off screen
    if (this.x < POSITIONS.CUSTOMER_EXIT_X || this.x > POSITIONS.CUSTOMER_SPAWN_X) {
      this.isRemovable = true;
    }
  }

  // Customer is served
  serve() {
    if (this.isServed || this.isLeaving) return false;

    this.isServed = true;
    this.state = CUSTOMER_STATES.HAPPY;
    this.frame = 0;
    this.animationSpeed = 150;

    return true;
  }

  // Customer leaves angrily
  stormOff() {
    if (this.isLeaving) return;

    this.isLeaving = true;
    this.state = CUSTOMER_STATES.STORMING_OFF;
    this.frame = 0;
    this.animationSpeed = 80;
  }

  // Get patience as percentage
  getPatiencePercent() {
    return (this.patience / this.maxPatience) * 100;
  }

  // Get time waiting in seconds
  getWaitTime() {
    return Math.floor((Date.now() - this.arrivedAt) / 1000);
  }

  // Get patience level for UI coloring
  getPatienceLevel() {
    const percent = this.getPatiencePercent();
    if (percent > 70) return 'high';
    if (percent > 40) return 'medium';
    if (percent > 20) return 'low';
    return 'critical';
  }

  // Render the customer
  render(ctx, sprites) {
    if (this.alpha <= 0) return;

    const spriteData = sprites?.[this.type.id]?.[this.state];

    ctx.save();
    ctx.globalAlpha = this.alpha;

    if (spriteData && spriteData.image) {
      // For single-frame SVG images
      if (spriteData.frameCount === 1) {
        ctx.drawImage(
          spriteData.image,
          this.x - spriteData.frameWidth / 2 + this.shakeOffset,
          this.y,
          spriteData.frameWidth * this.scale,
          spriteData.frameHeight * this.scale
        );
      } else {
        // For sprite sheets with multiple frames
        const frameIndex = this.frame % spriteData.frameCount;
        const sourceX = frameIndex * spriteData.frameWidth;

        ctx.drawImage(
          spriteData.image,
          sourceX, 0,
          spriteData.frameWidth, spriteData.frameHeight,
          this.x - spriteData.frameWidth / 2 + this.shakeOffset,
          this.y,
          spriteData.frameWidth * this.scale,
          spriteData.frameHeight * this.scale
        );
      }
    } else {
      this.renderPlaceholder(ctx);
    }

    ctx.restore();

    // Render patience meter above head
    if (!this.isLeaving && !this.isServed) {
      this.renderPatienceMeter(ctx);
      this.renderMessageBubble(ctx);
    }
  }

  renderPlaceholder(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Simple placeholder rectangle
    ctx.fillStyle = this.type.color;
    ctx.fillRect(
      this.x - 30 + this.shakeOffset,
      this.y,
      60,
      100
    );

    // Name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, this.x + this.shakeOffset, this.y + 115);

    ctx.restore();
  }

  renderPatienceMeter(ctx) {
    const meterWidth = 80;
    const meterHeight = 10;
    const meterX = this.x - meterWidth / 2;
    const meterY = this.y - 25;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    // Fill based on patience
    const fillWidth = (this.getPatiencePercent() / 100) * (meterWidth - 4);
    const level = this.getPatienceLevel();

    let fillColor;
    switch (level) {
      case 'high': fillColor = '#39FF14'; break;
      case 'medium': fillColor = '#FFD93D'; break;
      case 'low': fillColor = '#FF6B35'; break;
      case 'critical': fillColor = '#FF0040'; break;
      default: fillColor = '#fff';
    }

    ctx.fillStyle = fillColor;
    ctx.fillRect(meterX + 2, meterY + 2, fillWidth, meterHeight - 4);

    // Border
    ctx.strokeStyle = '#3A3A4A';
    ctx.lineWidth = 2;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

    // Time badge
    ctx.fillStyle = level === 'critical' ? '#FF0040' : '#333';
    ctx.fillRect(meterX + meterWidth + 5, meterY - 2, 30, 14);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.getWaitTime()}s`, meterX + meterWidth + 20, meterY + 8);
  }

  renderMessageBubble(ctx) {
    if (this.state === CUSTOMER_STATES.WALKING_IN) return;

    const bubbleX = this.x - 80;
    const bubbleY = this.y - 70;
    const bubbleWidth = 160;
    const bubbleHeight = 40;

    // Bubble background
    ctx.fillStyle = 'rgba(20,10,40,0.95)';
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;

    // Rounded rect with tail
    ctx.beginPath();
    ctx.moveTo(bubbleX + 8, bubbleY);
    ctx.lineTo(bubbleX + bubbleWidth - 8, bubbleY);
    ctx.quadraticCurveTo(bubbleX + bubbleWidth, bubbleY, bubbleX + bubbleWidth, bubbleY + 8);
    ctx.lineTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight - 8);
    ctx.quadraticCurveTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight, bubbleX + bubbleWidth - 8, bubbleY + bubbleHeight);
    ctx.lineTo(bubbleX + 90, bubbleY + bubbleHeight);
    ctx.lineTo(bubbleX + 80, bubbleY + bubbleHeight + 10);
    ctx.lineTo(bubbleX + 70, bubbleY + bubbleHeight);
    ctx.lineTo(bubbleX + 8, bubbleY + bubbleHeight);
    ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleHeight, bubbleX, bubbleY + bubbleHeight - 8);
    ctx.lineTo(bubbleX, bubbleY + 8);
    ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + 8, bubbleY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Message text
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    const displayMessage = this.message.length > 22
      ? this.message.substring(0, 20) + '...'
      : this.message;
    ctx.fillText(`"${displayMessage}"`, bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2 + 4);
  }

  // Check if point is inside customer bounds (for clicking)
  containsPoint(px, py) {
    const bounds = {
      x: this.x - 40,
      y: this.y,
      width: 80,
      height: 120,
    };

    return px >= bounds.x && px <= bounds.x + bounds.width &&
           py >= bounds.y && py <= bounds.y + bounds.height;
  }
}

export default Customer;
