// ===== BOTTLE ENTITY =====

import { BOTTLE_TYPES, BOTTLE_STATES, GAME_CONFIG, POSITIONS } from './constants.js';

export class Bottle {
  constructor(typeId, index) {
    this.type = BOTTLE_TYPES.find(t => t.id === typeId) || BOTTLE_TYPES[0];
    this.index = index;

    // Position
    this.x = POSITIONS.BOTTLE_START_X + index * POSITIONS.BOTTLE_SPACING;
    this.y = POSITIONS.BOTTLE_SHELF_Y;

    // State
    this.state = this.type.locked ? BOTTLE_STATES.EMPTY : BOTTLE_STATES.IDLE;
    this.cooldownEnd = 0;
    this.isSelected = false;

    // Animation
    this.frame = 0;
    this.frameTimer = 0;
    this.animationSpeed = 150;

    // Fill level (0-1)
    this.fillLevel = this.type.locked ? 0 : 1;

    // Visual effects
    this.glowIntensity = 0;
    this.hoverScale = 1;
  }

  // Check if bottle is on cooldown
  isOnCooldown() {
    return Date.now() < this.cooldownEnd;
  }

  // Get cooldown progress (0-1, where 1 is fully ready)
  getCooldownProgress() {
    if (!this.isOnCooldown()) return 1;

    const remaining = this.cooldownEnd - Date.now();
    return 1 - (remaining / GAME_CONFIG.BOTTLE_COOLDOWN);
  }

  // Use the bottle (starts cooldown)
  use() {
    if (this.type.locked || this.isOnCooldown()) return false;

    this.state = BOTTLE_STATES.POURING;
    this.frame = 0;
    this.fillLevel = 0;
    this.cooldownEnd = Date.now() + GAME_CONFIG.BOTTLE_COOLDOWN;

    return true;
  }

  // Update bottle state
  update(deltaTime) {
    // Update animation
    this.frameTimer += deltaTime;
    if (this.frameTimer >= this.animationSpeed) {
      this.frameTimer = 0;
      this.frame++;
    }

    // State transitions
    if (this.state === BOTTLE_STATES.POURING) {
      this.fillLevel = Math.max(0, this.fillLevel - deltaTime / 300);
      if (this.fillLevel <= 0) {
        this.state = BOTTLE_STATES.EMPTY;
        this.frame = 0;
      }
    } else if (this.state === BOTTLE_STATES.EMPTY && this.isOnCooldown()) {
      this.state = BOTTLE_STATES.REFILLING;
      this.frame = 0;
    } else if (this.state === BOTTLE_STATES.REFILLING) {
      this.fillLevel = this.getCooldownProgress();
      if (!this.isOnCooldown()) {
        this.state = BOTTLE_STATES.IDLE;
        this.fillLevel = 1;
        this.frame = 0;
      }
    }

    // Glow effect
    if (this.isSelected && !this.type.locked) {
      this.glowIntensity = 0.8 + Math.sin(Date.now() / 200) * 0.2;
    } else {
      this.glowIntensity = Math.max(0, this.glowIntensity - deltaTime / 200);
    }

    // Hover scale interpolation
    const targetScale = this.isSelected ? 1.1 : 1;
    this.hoverScale += (targetScale - this.hoverScale) * 0.1;
  }

  // Render the bottle
  render(ctx, sprites, isHovered = false) {
    // Get sprite data - either by state (sprite sheet) or just by id (single SVG)
    const spriteData = sprites?.[this.type.id]?.[this.state] || sprites?.[this.type.id];

    ctx.save();

    // Apply scale from center
    const scaleX = this.x + 32;
    const scaleY = this.y + 48;
    ctx.translate(scaleX, scaleY);
    ctx.scale(this.hoverScale, this.hoverScale);
    ctx.translate(-scaleX, -scaleY);

    // Glow effect
    if (this.glowIntensity > 0 && !this.type.locked) {
      ctx.shadowColor = this.type.color;
      ctx.shadowBlur = 20 * this.glowIntensity;
    }

    if (spriteData && spriteData.image) {
      // For single-frame SVG images
      if (spriteData.frameCount === 1) {
        ctx.drawImage(
          spriteData.image,
          this.x, this.y,
          spriteData.frameWidth, spriteData.frameHeight
        );
      } else {
        // For sprite sheets with multiple frames
        const frameIndex = this.frame % spriteData.frameCount;
        const sourceX = frameIndex * spriteData.frameWidth;

        ctx.drawImage(
          spriteData.image,
          sourceX, 0,
          spriteData.frameWidth, spriteData.frameHeight,
          this.x, this.y,
          spriteData.frameWidth, spriteData.frameHeight
        );
      }
    } else {
      this.renderPlaceholder(ctx);
    }

    ctx.restore();

    // Render cooldown overlay
    if (this.isOnCooldown()) {
      this.renderCooldownOverlay(ctx);
    }

    // Render selection indicator
    if (this.isSelected && !this.type.locked) {
      this.renderSelectionIndicator(ctx);
    }

    // Render hover tooltip
    if (isHovered && !this.type.locked) {
      this.renderTooltip(ctx);
    }
  }

  renderPlaceholder(ctx) {
    const bottleWidth = 50;
    const bottleHeight = 80;
    const bx = this.x + 7;
    const by = this.y + 8;

    // Bottle shape
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(bx + 15, by);
    ctx.lineTo(bx + bottleWidth - 15, by);
    ctx.lineTo(bx + bottleWidth - 10, by + 12);
    ctx.lineTo(bx + bottleWidth - 5, by + 18);
    ctx.lineTo(bx + bottleWidth - 5, by + bottleHeight);
    ctx.lineTo(bx + 5, by + bottleHeight);
    ctx.lineTo(bx + 5, by + 18);
    ctx.lineTo(bx + 10, by + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Liquid fill
    if (this.fillLevel > 0 && !this.type.locked) {
      const liquidHeight = (bottleHeight - 25) * this.fillLevel;
      const liquidY = by + bottleHeight - liquidHeight;

      ctx.shadowColor = this.type.color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = this.type.color;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(bx + 8, liquidY, bottleWidth - 16, liquidHeight - 5);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // Cork
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(bx + 18, by - 8, 14, 10);

    // Emoji
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.type.emoji, this.x + 32, this.y + 55);

    // Name
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(this.type.name, this.x + 32, this.y + 92);

    // Locked overlay
    if (this.type.locked) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(bx, by - 8, bottleWidth, bottleHeight + 16);

      ctx.fillStyle = '#FF2D95';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('SOON', this.x + 32, this.y + 50);
    }
  }

  renderCooldownOverlay(ctx) {
    const progress = this.getCooldownProgress();
    const overlayHeight = 80 * (1 - progress);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(this.x + 7, this.y + 8, 50, overlayHeight);

    // Refilling animation
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.fillText('⏳', this.x + 32, this.y + 50);

    // Progress text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`${Math.floor(progress * 100)}%`, this.x + 32, this.y + 70);
  }

  renderSelectionIndicator(ctx) {
    // Selection glow
    ctx.strokeStyle = '#39FF14';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 15;
    ctx.strokeRect(this.x + 2, this.y + 2, 60, 92);
    ctx.shadowBlur = 0;

    // "SELECTED" label
    ctx.fillStyle = '#39FF14';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SELECTED', this.x + 32, this.y + 105);
  }

  renderTooltip(ctx) {
    const tooltipX = this.x - 60;
    const tooltipY = this.y - 80;
    const tooltipWidth = 180;
    const tooltipHeight = 70;

    // Background
    ctx.fillStyle = 'rgba(20,10,40,0.95)';
    ctx.strokeStyle = this.type.color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Arrow
    ctx.fillStyle = 'rgba(20,10,40,0.95)';
    ctx.beginPath();
    ctx.moveTo(this.x + 25, tooltipY + tooltipHeight);
    ctx.lineTo(this.x + 32, tooltipY + tooltipHeight + 10);
    ctx.lineTo(this.x + 39, tooltipY + tooltipHeight);
    ctx.fill();

    // Title
    ctx.fillStyle = this.type.color;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.type.emoji} ${this.type.name}`, tooltipX + 10, tooltipY + 20);

    // Text preview
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    const lines = this.wrapText(this.type.text, 25);
    lines.forEach((line, i) => {
      ctx.fillText(line, tooltipX + 10, tooltipY + 38 + i * 14);
    });
  }

  wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let line = '';

    words.forEach(word => {
      if ((line + word).length > maxChars) {
        lines.push(line.trim());
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    });
    if (line.trim()) lines.push(line.trim());

    return lines.slice(0, 2); // Max 2 lines
  }

  // Check if point is inside bottle bounds
  containsPoint(px, py) {
    return px >= this.x && px <= this.x + 64 &&
           py >= this.y && py <= this.y + 96;
  }
}

export default Bottle;
