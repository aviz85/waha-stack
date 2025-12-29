# MESSAGE BAR - Graphics & Sprites Specification

## Art Style
**Theme:** Retro Pixel Art Cyberpunk Bar
**Color Palette:** Dark purple/black background, neon pink (#FF2D95), cyan (#00FFFF), green (#39FF14), orange (#FF6B35)
**Resolution:** All sprites at 2x or 4x pixel density for crisp scaling
**Style:** 16-bit era pixel art, reminiscent of arcade games like Tapper, but with cyberpunk neon aesthetics

---

## 1. BACKGROUND & ENVIRONMENT

### 1.1 Main Bar Background
**Dimensions:** 1920 x 1080 px (or 960x540 at 2x)
**Prompt:**
```
Pixel art cyberpunk bar interior background, side-scrolling view. Dark purple and black atmosphere. Wooden bar counter at the bottom third of the screen. Behind the bar are shelves with glowing neon bottles. Neon signs on the walls saying "OPEN 24/7" in pink glow. Brick walls with purple ambient lighting. Ceiling with hanging industrial lamps. Rain visible through a window on the left. Arcade/retro 16-bit pixel art style. No characters, empty scene.
```

### 1.2 Bar Counter (Separate Layer)
**Dimensions:** 1920 x 200 px
**Prompt:**
```
Pixel art wooden bar counter top-down angled view, cyberpunk style. Dark polished wood with metal trim and brass rail. Neon strip lighting underneath giving pink/cyan underglow. Beer tap handles visible. Scratched and worn texture. 16-bit pixel art style. Seamless horizontal tile.
```

### 1.3 Drink Shelf Background
**Dimensions:** 1920 x 300 px
**Prompt:**
```
Pixel art bar shelf with neon backlighting, cyberpunk style. Three wooden shelves mounted on dark brick wall. Each shelf has subtle neon glow from behind (pink, cyan, purple). Empty bottle silhouette spots. Industrial metal brackets. 16-bit pixel art, dark moody atmosphere.
```

### 1.4 Neon Signs (Decorative)
**Dimensions:** 200 x 100 px each
**Variants needed:** 3-4 different signs

**Prompt 1 - "OPEN" sign:**
```
Pixel art neon sign saying "OPEN 24/7", hot pink neon tubes on dark background. Slight flicker effect baked in (2 frame animation). Cyberpunk style, 16-bit pixel art. Transparent background.
```

**Prompt 2 - Beer mug sign:**
```
Pixel art neon sign of a beer mug with foam, cyan and yellow neon tubes. Glowing effect. Cyberpunk bar decoration. 16-bit pixel art. Transparent background.
```

**Prompt 3 - "MESSAGE BAR" logo:**
```
Pixel art neon sign logo "MESSAGE BAR" with a chat bubble and beer mug icon. Pink and cyan neon. Retro arcade game title style. 16-bit pixel art. Transparent background.
```

---

## 2. CHARACTERS (CUSTOMERS)

### Character Design Guidelines
- **Size:** 128 x 128 px per frame (character centered, ~80px tall within frame)
- **Style:** Pixel art, diverse cyberpunk citizens
- **All characters need:** Walk cycle, idle, impatient, angry, happy states

### 2.1 Customer Type A - Office Worker
**Prompt for sprite sheet:**
```
Pixel art character sprite sheet, cyberpunk office worker. Male, wearing suit with loosened neon tie, tired expression, holding phone. Side view facing left. 16-bit style.

States needed (each row):
Row 1: Walk cycle (8 frames) - walking left
Row 2: Idle standing (4 frames) - subtle breathing, checking phone
Row 3: Impatient (6 frames) - tapping foot, looking at watch, sighing
Row 4: Angry (4 frames) - red face, steam from ears, arms crossed
Row 5: Happy/Served (4 frames) - smiling, thumbs up, relieved
Row 6: Walk away left (8 frames) - walking left satisfied
Row 7: Storm off right (8 frames) - angry walking right, stomping
```

### 2.2 Customer Type B - Punk Girl
**Prompt for sprite sheet:**
```
Pixel art character sprite sheet, cyberpunk punk girl. Mohawk hair (pink/cyan), leather jacket with LED strips, piercings, confident stance. Side view facing left. 16-bit style.

States needed (each row):
Row 1: Walk cycle (8 frames) - cool strut walking left
Row 2: Idle standing (4 frames) - chewing gum, arms crossed
Row 3: Impatient (6 frames) - eye roll, checking nails, huffing
Row 4: Angry (4 frames) - shouting, pointing, aggressive
Row 5: Happy/Served (4 frames) - nodding approval, slight smile
Row 6: Walk away left (8 frames) - satisfied exit
Row 7: Storm off right (8 frames) - flipping off, angry exit
```

### 2.3 Customer Type C - Robot/Android
**Prompt for sprite sheet:**
```
Pixel art character sprite sheet, friendly service robot/android. Rounded head with LED face display showing emotions, metallic body with neon accents, antenna. Side view facing left. 16-bit style, cute design.

States needed (each row):
Row 1: Walk cycle (8 frames) - mechanical walk, slight hover
Row 2: Idle standing (4 frames) - processing animation, blinking LEDs
Row 3: Impatient (6 frames) - error symbols on face, sparking
Row 4: Angry (4 frames) - red LED face, overheating steam
Row 5: Happy/Served (4 frames) - heart eyes on display, spinning antenna
Row 6: Walk away left (8 frames) - happy beeping implied
Row 7: Storm off right (8 frames) - glitching, sad face display
```

### 2.4 Customer Type D - Business Woman
**Prompt for sprite sheet:**
```
Pixel art character sprite sheet, cyberpunk business woman. Power suit with holographic accents, AR glasses, tablet in hand, confident. Side view facing left. 16-bit style.

States needed (each row):
Row 1: Walk cycle (8 frames) - purposeful stride
Row 2: Idle standing (4 frames) - checking tablet, waiting
Row 3: Impatient (6 frames) - tapping tablet aggressively, looking around
Row 4: Angry (4 frames) - pointing at tablet, demanding
Row 5: Happy/Served (4 frames) - professional nod, small smile
Row 6: Walk away left (8 frames) - satisfied businesslike exit
Row 7: Storm off right (8 frames) - furious typing while leaving
```

### 2.5 Customer Type E - Old Hacker
**Prompt for sprite sheet:**
```
Pixel art character sprite sheet, elderly cyberpunk hacker. Gray beard, VR visor pushed up on forehead, vintage tech-wear hoodie, cybernetic arm. Wise but impatient look. Side view facing left. 16-bit style.

States needed (each row):
Row 1: Walk cycle (8 frames) - slightly hunched walk
Row 2: Idle standing (4 frames) - stroking beard, mumbling
Row 3: Impatient (6 frames) - shaking head, checking cybernetic arm display
Row 4: Angry (4 frames) - waving fist, grumpy old man energy
Row 5: Happy/Served (4 frames) - rare smile, nod of approval
Row 6: Walk away left (8 frames) - content shuffle
Row 7: Storm off right (8 frames) - disappointed shuffle, shaking head
```

### 2.6 Customer Type F - Delivery Drone Pilot
**Prompt for sprite sheet:**
```
Pixel art character sprite sheet, young delivery drone pilot. Racing jacket with sponsor patches, goggles on head, energy drink in hand, impatient energy. Side view facing left. 16-bit style.

States needed (each row):
Row 1: Walk cycle (8 frames) - bouncy quick walk
Row 2: Idle standing (4 frames) - drinking energy drink, fidgeting
Row 3: Impatient (6 frames) - checking phone constantly, pacing
Row 4: Angry (4 frames) - throwing hands up, frustrated
Row 5: Happy/Served (4 frames) - fist pump, excited
Row 6: Walk away left (8 frames) - running exit
Row 7: Storm off right (8 frames) - kicking ground, upset exit
```

---

## 3. BOTTLES / MESSAGE TEMPLATES

### Bottle Design Guidelines
- **Size:** 64 x 96 px per bottle
- **Style:** Glowing neon liquid inside glass bottles, cyberpunk labels

### 3.1 Welcome Bottle (Green)
**Prompt:**
```
Pixel art potion bottle, cyberpunk style. Glass bottle with glowing green neon liquid inside. Label shows waving hand emoji icon. Cork top with small antenna. Bubbles floating in liquid. 16-bit pixel art. Transparent background.

Animation frames needed:
- Frame 1-4: Idle glow pulse (liquid slightly brighter/dimmer)
- Frame 5-8: Pouring/using (liquid draining, sparkles)
- Frame 9-12: Empty (dark bottle, no glow)
- Frame 13-20: Refilling (liquid rising back up with bubbles)
```

### 3.2 Thank You Bottle (Pink)
**Prompt:**
```
Pixel art potion bottle, cyberpunk style. Elegant glass bottle with glowing pink/magenta neon liquid. Label shows prayer hands/heart emoji icon. Fancy bottle shape. 16-bit pixel art. Transparent background.

Same animation frames as Welcome Bottle.
```

### 3.3 Reminder Bottle (Orange/Yellow)
**Prompt:**
```
Pixel art potion bottle, cyberpunk style. Alarm clock shaped bottle with glowing orange/yellow neon liquid. Label shows clock emoji icon. Urgency feeling. 16-bit pixel art. Transparent background.

Same animation frames as Welcome Bottle.
```

### 3.4 Celebration Bottle (Purple/Rainbow)
**Prompt:**
```
Pixel art potion bottle, cyberpunk style. Champagne-style bottle with glowing purple liquid that shifts colors slightly. Label shows party popper emoji icon. Confetti particles around. 16-bit pixel art. Transparent background.

Same animation frames as Welcome Bottle.
```

### 3.5 AI Bottle (Cyan/Holographic) - Coming Soon
**Prompt:**
```
Pixel art futuristic bottle, holographic/translucent. Floating hologram bottle with cyan energy swirling inside. Robot face icon. Glitchy/unstable appearance. "COMING SOON" text overlay. 16-bit pixel art. Transparent background.
```

---

## 4. UI ELEMENTS

### 4.1 Patience Meter Frame
**Dimensions:** 120 x 20 px
**Prompt:**
```
Pixel art health/progress bar frame, cyberpunk style. Metal frame with rivets, neon trim. Empty inside (for fill overlay). Industrial look. 16-bit pixel art. Transparent background.
```

### 4.2 Patience Meter Fills
**Dimensions:** 116 x 16 px (fits inside frame)
**Variants:** 4 colors
```
Pixel art progress bar fill, smooth gradient:
- Green/Cyan: Full patience (happy)
- Yellow/Orange: Medium patience (waiting)
- Orange/Red: Low patience (annoyed)
- Red/Flashing: Critical patience (about to leave)
16-bit pixel art. Transparent background.
```

### 4.3 Score Display Panel
**Dimensions:** 200 x 60 px
**Prompt:**
```
Pixel art arcade score display panel. Dark metal frame with neon pink border. Digital number display area (empty for dynamic numbers). "SCORE" label in pixel font. Retro arcade cabinet style. 16-bit pixel art. Transparent background.
```

### 4.4 Combo Counter
**Dimensions:** 150 x 80 px
**Prompt:**
```
Pixel art combo counter display, fighting game style. Explosive starburst background. "COMBO" text with flames. Space for "x5" style multiplier number. Neon colors, energetic. 16-bit pixel art. Transparent background.
```

### 4.5 Message Bubble
**Dimensions:** 200 x 100 px (scalable 9-slice)
**Prompt:**
```
Pixel art speech bubble, cyberpunk holographic style. Glowing cyan/pink border. Semi-transparent dark fill. Tail pointing down. Digital/holographic texture. 16-bit pixel art. Designed for 9-slice scaling.
```

### 4.6 Sound Toggle Icons
**Dimensions:** 48 x 48 px each
**Prompt:**
```
Pixel art sound icons set:
- Sound ON: Speaker with sound waves, cyan neon glow
- Sound OFF: Speaker with X, dimmed/gray
Cyberpunk style, 16-bit pixel art. Transparent background.
```

### 4.7 Timer/Clock Display
**Dimensions:** 80 x 40 px
**Prompt:**
```
Pixel art digital clock display, cyberpunk style. LED segment display look. Metal frame with neon underglow. Shows "00:00" format placeholder. Arcade cabinet style. 16-bit pixel art. Transparent background.
```

---

## 5. EFFECTS & PARTICLES

### 5.1 Serve Sparkles
**Dimensions:** 64 x 64 px sprite sheet
**Prompt:**
```
Pixel art sparkle/star burst effect animation, 8 frames. Gold and cyan sparkles exploding outward. Celebration effect. 16-bit pixel art. Transparent background. Sprite sheet horizontal layout.
```

### 5.2 Anger Steam/Smoke
**Dimensions:** 48 x 48 px sprite sheet
**Prompt:**
```
Pixel art angry steam puff animation, 6 frames. Red/orange cartoon anger steam rising. Emanates from character head. 16-bit pixel art. Transparent background. Sprite sheet horizontal layout.
```

### 5.3 Combo Fire
**Dimensions:** 128 x 64 px sprite sheet
**Prompt:**
```
Pixel art fire/flame animation for combo display, 8 frames. Hot pink and orange stylized flames. Intense burning effect. Loops seamlessly. 16-bit pixel art. Transparent background. Sprite sheet horizontal layout.
```

### 5.4 Happy Hearts
**Dimensions:** 32 x 32 px sprite sheet
**Prompt:**
```
Pixel art floating hearts animation, 6 frames. Pink pixel hearts floating upward and fading. Satisfaction effect. 16-bit pixel art. Transparent background. Sprite sheet horizontal layout.
```

### 5.5 Coin/Points Popup
**Dimensions:** 48 x 48 px
**Prompt:**
```
Pixel art golden coin with "+100" text. Shiny arcade coin design. Neon glow. For score popup animation. 16-bit pixel art. Transparent background.
```

### 5.6 Bottle Pour Effect
**Dimensions:** 32 x 64 px sprite sheet
**Prompt:**
```
Pixel art liquid pour animation, 8 frames. Glowing neon liquid stream pouring down. Splash at bottom. Magical/potion effect. 16-bit pixel art. Transparent background.
```

---

## 6. GAME SCREENS

### 6.1 Title Screen Background
**Dimensions:** 1920 x 1080 px
**Prompt:**
```
Pixel art title screen for "MESSAGE BAR" game. Cyberpunk bar exterior at night. Neon signs glowing. Rain falling. City skyline in background. Dark moody atmosphere. Space in center for logo. 16-bit pixel art style, detailed background.
```

### 6.2 Game Over Screen Background
**Dimensions:** 1920 x 1080 px
**Prompt:**
```
Pixel art game over screen, cyberpunk bar closing time. Lights dimming, chairs on tables, "CLOSED" neon sign. Sad/moody atmosphere. Empty bar. Space in center for "GAME OVER" text. 16-bit pixel art style.
```

### 6.3 Start Button
**Dimensions:** 300 x 80 px
**Prompt:**
```
Pixel art arcade button, "START GAME" text. Big chunky 3D button, hot pink with white text. Glowing neon edge. Arcade cabinet style. Pressed state variant also needed. 16-bit pixel art.
```

---

## 7. ANIMATION SPECIFICATIONS

### Customer Animation Timings
| Animation | Frames | Frame Duration | Loop |
|-----------|--------|----------------|------|
| Walk | 8 | 100ms | Yes |
| Idle | 4 | 200ms | Yes |
| Impatient | 6 | 150ms | Yes |
| Angry | 4 | 100ms | Yes |
| Happy | 4 | 150ms | No (play once) |
| Walk Away | 8 | 100ms | No |
| Storm Off | 8 | 80ms | No |

### Bottle Animation Timings
| Animation | Frames | Frame Duration | Loop |
|-----------|--------|----------------|------|
| Idle Glow | 4 | 150ms | Yes |
| Pour/Use | 4 | 100ms | No |
| Empty | 1 | - | - |
| Refill | 8 | 100ms | No |

### Effect Animation Timings
| Animation | Frames | Frame Duration | Loop |
|-----------|--------|----------------|------|
| Sparkles | 8 | 80ms | No |
| Steam | 6 | 120ms | Yes |
| Fire | 8 | 100ms | Yes |
| Hearts | 6 | 150ms | No |

---

## 8. SPRITE SHEET LAYOUTS

### Character Sprite Sheet Layout
```
+--------------------------------------------------+
| Walk L (8 frames, 128px each = 1024px)           |
+--------------------------------------------------+
| Idle (4 frames, 128px each = 512px)              |
+--------------------------------------------------+
| Impatient (6 frames = 768px)                     |
+--------------------------------------------------+
| Angry (4 frames = 512px)                         |
+--------------------------------------------------+
| Happy (4 frames = 512px)                         |
+--------------------------------------------------+
| Walk Away L (8 frames = 1024px)                  |
+--------------------------------------------------+
| Storm Off R (8 frames = 1024px)                  |
+--------------------------------------------------+

Total size: 1024 x 896 px per character
```

### Bottle Sprite Sheet Layout
```
+----------------------------------+
| Idle 1 | Idle 2 | Idle 3 | Idle 4 |  (64px each)
+----------------------------------+
| Pour 1 | Pour 2 | Pour 3 | Pour 4 |
+----------------------------------+
| Empty  | Refill 1-7...           |
+----------------------------------+

Total size: 256 x 288 px per bottle (or 512 x 192 horizontal)
```

---

## 9. COLOR PALETTE REFERENCE

```
Primary Colors:
- Neon Pink:    #FF2D95
- Neon Cyan:    #00FFFF
- Neon Green:   #39FF14
- Neon Orange:  #FF6B35
- Neon Purple:  #BF40FF
- Neon Yellow:  #FFFF00

Background Colors:
- Dark BG:      #0A0A15
- Darker BG:    #050508
- Purple BG:    #1A0A2E
- Panel BG:     #140A28

Bar Colors:
- Wood Dark:    #2D1810
- Wood Light:   #4A2C1C
- Metal:        #3A3A4A

UI Colors:
- Danger Red:   #FF0040
- Success:      #39FF14
- Warning:      #FFD93D
```

---

## 10. FILE NAMING CONVENTION

```
backgrounds/
  bg_bar_main.png
  bg_bar_counter.png
  bg_shelf.png
  bg_title.png
  bg_gameover.png

characters/
  char_office_worker_sheet.png
  char_punk_girl_sheet.png
  char_robot_sheet.png
  char_business_woman_sheet.png
  char_old_hacker_sheet.png
  char_drone_pilot_sheet.png

bottles/
  bottle_welcome_sheet.png
  bottle_thankyou_sheet.png
  bottle_reminder_sheet.png
  bottle_celebration_sheet.png
  bottle_ai_locked.png

ui/
  ui_patience_frame.png
  ui_patience_fill_green.png
  ui_patience_fill_yellow.png
  ui_patience_fill_orange.png
  ui_patience_fill_red.png
  ui_score_panel.png
  ui_combo_display.png
  ui_message_bubble.png
  ui_sound_on.png
  ui_sound_off.png
  ui_timer.png
  ui_button_start.png
  ui_button_start_pressed.png

effects/
  fx_sparkles_sheet.png
  fx_steam_sheet.png
  fx_fire_sheet.png
  fx_hearts_sheet.png
  fx_coin_popup.png
  fx_pour_sheet.png

decorations/
  deco_sign_open.png
  deco_sign_beer.png
  deco_sign_logo.png
```

---

## 11. IMPLEMENTATION NOTES

### For the New Game Folder Structure:
```
message-bar-v2/
├── public/
│   └── assets/
│       ├── backgrounds/
│       ├── characters/
│       ├── bottles/
│       ├── ui/
│       ├── effects/
│       └── decorations/
├── src/
│   ├── components/
│   │   ├── Game.jsx
│   │   ├── Customer.jsx
│   │   ├── Bottle.jsx
│   │   ├── Bar.jsx
│   │   └── UI/
│   ├── hooks/
│   │   ├── useSpriteAnimation.js
│   │   └── useGameLoop.js
│   ├── utils/
│   │   └── spriteLoader.js
│   └── App.jsx
└── package.json
```

### Canvas vs DOM Rendering
Recommend using **HTML5 Canvas** with a game loop for smooth sprite animations:
- 60 FPS game loop
- Sprite sheet slicing
- Layer management (background, characters, effects, UI)
- Camera/viewport for scrolling if needed

### Libraries to Consider
- **PixiJS** - Fast 2D WebGL renderer, great for sprite games
- **Phaser** - Full game framework with physics, animations
- **Or vanilla Canvas** - Full control, lighter weight

---

## SUMMARY - ASSETS NEEDED

| Category | Items | Priority |
|----------|-------|----------|
| Backgrounds | 5 | HIGH |
| Characters | 6 sprite sheets | HIGH |
| Bottles | 5 sprite sheets | HIGH |
| UI Elements | 12 pieces | MEDIUM |
| Effects | 6 sprite sheets | MEDIUM |
| Decorations | 3 signs | LOW |

**Total unique assets: ~37 files**
**Estimated generation prompts: ~50 (including variants)**
