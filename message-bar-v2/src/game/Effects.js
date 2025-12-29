// ===== EFFECTS & PARTICLES SYSTEM =====

import { COLORS } from './constants.js';

// Base particle class
class Particle {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.gravity = options.gravity || 0;
    this.life = options.life || 1000;
    this.maxLife = this.life;
    this.size = options.size || 10;
    this.color = options.color || '#fff';
    this.alpha = 1;
    this.rotation = options.rotation || 0;
    this.rotationSpeed = options.rotationSpeed || 0;
    this.isDead = false;
  }

  update(deltaTime) {
    this.x += this.vx * (deltaTime / 16);
    this.y += this.vy * (deltaTime / 16);
    this.vy += this.gravity * (deltaTime / 16);
    this.rotation += this.rotationSpeed * (deltaTime / 16);

    this.life -= deltaTime;
    this.alpha = Math.max(0, this.life / this.maxLife);

    if (this.life <= 0) {
      this.isDead = true;
    }
  }

  render(ctx) {
    // Override in subclasses
  }
}

// Sparkle particle (for successful serve)
class SparkleParticle extends Particle {
  constructor(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;

    super(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      gravity: 0.1,
      life: 600 + Math.random() * 400,
      size: 3 + Math.random() * 4,
      color: Math.random() > 0.5 ? COLORS.NEON_YELLOW : COLORS.NEON_CYAN,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    });

    this.points = 4 + Math.floor(Math.random() * 3);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.alpha;

    // Star shape
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    for (let i = 0; i < this.points * 2; i++) {
      const radius = i % 2 === 0 ? this.size : this.size / 2;
      const angle = (i * Math.PI) / this.points;
      if (i === 0) {
        ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      } else {
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// Heart particle (for happy customer)
class HeartParticle extends Particle {
  constructor(x, y) {
    super(x, y, {
      vx: (Math.random() - 0.5) * 2,
      vy: -2 - Math.random() * 2,
      life: 1000,
      size: 12 + Math.random() * 8,
      color: COLORS.NEON_PINK,
    });
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.font = `${this.size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♥', this.x, this.y);
    ctx.restore();
  }
}

// Steam particle (for angry customer)
class SteamParticle extends Particle {
  constructor(x, y) {
    super(x, y, {
      vx: (Math.random() - 0.5) * 1,
      vy: -1 - Math.random() * 2,
      life: 800,
      size: 8 + Math.random() * 6,
      color: COLORS.DANGER_RED,
    });
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.7;
    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Score popup
class ScorePopup extends Particle {
  constructor(x, y, score, isCombo = false) {
    super(x, y, {
      vy: -2,
      life: 1500,
    });
    this.score = score;
    this.isCombo = isCombo;
    this.scale = 1;
  }

  update(deltaTime) {
    super.update(deltaTime);
    // Pop in effect
    if (this.life > this.maxLife - 200) {
      this.scale = 1.2 - (this.life - (this.maxLife - 200)) / 1000;
    } else {
      this.scale = Math.max(0.8, this.scale - 0.001 * deltaTime);
    }
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctx.font = `bold ${this.isCombo ? 24 : 18}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow
    ctx.fillStyle = '#000';
    ctx.fillText(`+${this.score}`, 2, 2);

    // Text
    ctx.fillStyle = this.isCombo ? COLORS.NEON_CYAN : COLORS.NEON_GREEN;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.fillText(`+${this.score}`, 0, 0);

    if (this.isCombo) {
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = COLORS.NEON_ORANGE;
      ctx.fillText('COMBO!', 0, 20);
    }

    ctx.restore();
  }
}

// Big combo display
class ComboDisplay extends Particle {
  constructor(combo) {
    super(640, 360, {
      life: 2000,
    });
    this.combo = combo;
    this.scale = 0;
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Zoom in then out
    const progress = 1 - (this.life / this.maxLife);
    if (progress < 0.2) {
      this.scale = progress * 5; // 0 to 1 in first 20%
    } else if (progress > 0.8) {
      this.scale = 1 - (progress - 0.8) * 5; // 1 to 0 in last 20%
    } else {
      this.scale = 1;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    // Rainbow cycling color
    const hue = (Date.now() / 10) % 360;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 30;

    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.combo}x COMBO!`, 0, 0);

    ctx.restore();
  }
}

// Main effects manager
export class EffectsManager {
  constructor() {
    this.particles = [];
    this.sprites = null;
  }

  setSprites(sprites) {
    this.sprites = sprites;
  }

  update(deltaTime) {
    // Update all particles
    this.particles.forEach(p => p.update(deltaTime));

    // Remove dead particles
    this.particles = this.particles.filter(p => !p.isDead);
  }

  render(ctx) {
    this.particles.forEach(p => p.render(ctx));
  }

  // Spawn sparkle burst (serve success)
  spawnSparkles(x, y, count = 15) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new SparkleParticle(x, y));
    }
  }

  // Spawn hearts (happy customer)
  spawnHearts(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.particles.push(new HeartParticle(x + (Math.random() - 0.5) * 40, y));
      }, i * 100);
    }
  }

  // Spawn steam (angry customer)
  spawnSteam(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new SteamParticle(x + (Math.random() - 0.5) * 30, y));
    }
  }

  // Show score popup
  showScore(x, y, score, isCombo = false) {
    this.particles.push(new ScorePopup(x, y, score, isCombo));
  }

  // Show big combo display
  showCombo(combo) {
    this.particles.push(new ComboDisplay(combo));
  }

  // Clear all effects
  clear() {
    this.particles = [];
  }
}

export default EffectsManager;
