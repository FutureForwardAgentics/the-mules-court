# Card Asset Specification - Phase 2 (Optional)

This document specifies the asset requirements for transitioning from Graphics API to texture-based card rendering (Phase 2 of implementation).

---

## Overview

**Total Assets Required**: 17 images
- 16 unique card faces (one per character)
- 1 card back (for hidden cards)

**Purpose**: Replace programmatic Graphics API rendering with professional card artwork.

**Timeline**: Phase 2 is optional and can be deferred indefinitely. Phase 1 (Graphics API) is fully functional.

---

## Image Specifications

### Technical Requirements

| Property | Value | Notes |
|----------|-------|-------|
| **Dimensions** | 512x768px | 2:3 aspect ratio (same as current cards) |
| **Format** | WebP (primary) + PNG (fallback) | WebP for size, PNG for compatibility |
| **Color Mode** | RGB | No alpha needed (use solid backgrounds) |
| **DPI** | 144 DPI (2x) | Retina display support |
| **File Size** | <100KB per image | Target 50-75KB (WebP compression) |
| **Total Size** | <1.5MB | All 17 images combined |

### Canvas Specifications

- **Bleed**: No bleed needed (digital only)
- **Safe Zone**: Keep text/important elements 32px from edges
- **Background**: Solid or gradient (match existing Tailwind gradients)
- **Border**: Optional decorative border within image

---

## Card Layout Template

Each card should follow this layout structure:

```
┌─────────────────────────────────┐  512px wide
│  [Icon]              [Value]    │  ← Top area (96px)
│                                  │
│  [Character Name]                │  ← Name area (64px)
│  "Brief description"             │
│                                  │
│                                  │
│  ┌─────────────────────────────┐│
│  │ [Illustration Area]          ││  ← Artwork (384px)
│  │                              ││
│  │                              ││
│  │                              ││
│  │                              ││
│  └─────────────────────────────┘│
│                                  │
│  ┌─────────────────────────────┐│
│  │ ABILITY                      ││  ← Ability box (160px)
│  │ [Ability text description]   ││
│  └─────────────────────────────┘│
│                                  │
│  "[Quote from character]"        │  ← Quote area (64px)
└─────────────────────────────────┘  768px tall
```

### Layout Dimensions (512x768px)

- **Top margin**: 16px
- **Icon area**: 80x80px (top-left, 16px from edges)
- **Value badge**: 64x64px (top-right, 16px from edges)
- **Character name**: 32px font, bold, 16px below icon
- **Description**: 14px font, italic, 8px below name
- **Illustration**: 480x384px (centered, 16px margins)
- **Ability box**: 480x144px, 16px from bottom of illustration
  - Background: Semi-transparent black (#000000 at 60% opacity)
  - Border: 2px solid (#CCCCCC)
  - Padding: 16px
  - Label: "ABILITY" in 12px uppercase, gray
  - Text: 14px white, 8px below label
- **Quote**: 12px italic, 16px from bottom, 16px side margins
- **Bottom margin**: 16px

---

## Card Back Specification

**Design Requirements**:
- Symmetrical (vertical and horizontal)
- No character-specific details
- Foundation universe theme (psychohistory, mentalics, galactic empire)
- Recognizable at small sizes (96x144px)

**Suggested Elements**:
- Central "Mule's eye" symbol (👁️ or custom icon)
- Radial pattern or geometric design
- Foundation trilogy iconography
- Gradient background (dark purple to black)
- Subtle texture or pattern

**File Name**: `card-back.webp` and `card-back.png`

---

## Card Face Specifications

### General Design Guidelines

**Art Style**:
- Consistent style across all 16 cards
- Foundation universe aesthetic (retro-futurism, 1950s sci-fi)
- Character portraits or symbolic representations
- Avoid modern technology (smartphones, laptops)
- Emphasize psychic/mental themes

**Color Palette**:
Match existing Tailwind gradient colors from `cards.ts`:

| Card | Current Gradient | Hex Colors |
|------|------------------|------------|
| Informant | `from-slate-700 to-slate-900` | #334155 → #0f172a |
| Han Pritcher | `from-blue-800 to-blue-950` | #1e40af → #172554 |
| Bail Channis | `from-indigo-800 to-indigo-950` | #3730a3 → #1e1b4b |
| Ebling Mis | `from-amber-800 to-amber-950` | #92400e → #451a03 |
| Magnifico | `from-purple-800 to-purple-950` | #6b21a8 → #3b0764 |
| Shielded Mind | `from-cyan-800 to-cyan-950` | #155e75 → #083344 |
| Bayta Darell | `from-rose-800 to-rose-950` | #9f1239 → #4c0519 |
| Toran Darell | `from-red-800 to-red-950` | #991b1b → #450a0a |
| Mayor Indbur | `from-yellow-700 to-yellow-900` | #a16207 → #713f12 |
| First Speaker | `from-emerald-800 to-emerald-950` | #065f46 → #022c22 |
| The Mule | `from-red-950 to-black` | #450a0a → #000000 |

**Typography**:
- **Name**: Bold, serif font (e.g., Playfair Display, Libre Baskerville)
- **Value**: Large, bold, sans-serif (e.g., Inter, Roboto)
- **Ability**: Small, readable sans-serif
- **Quote**: Italic, serif, smaller size

**Icons**:
Use existing emoji icons or create custom illustrations:
- Informant: 👤 (generic person)
- Han Pritcher: 🎖️ (military medal)
- Bail Channis: 🎭 (theatrical masks)
- Ebling Mis: 📚 (books)
- Magnifico: 🎵 (musical note)
- Shielded Mind: 🛡️ (shield)
- Bayta Darell: 💫 (stars/sparkles)
- Toran Darell: ⚔️ (crossed swords)
- Mayor Indbur: 👑 (crown)
- First Speaker: 🔮 (crystal ball)
- The Mule: 👁️ (eye)

---

## Individual Card Details

### 1. Informant (Value 1)
- **Color Scheme**: Slate gray gradient
- **Illustration**: Generic figure in shadows, hooded or faceless
- **Theme**: Anonymity, commonality
- **Quote**: "I have reason to believe someone here is not who they claim..."

### 2. Han Pritcher (Value 2)
- **Color Scheme**: Blue gradient
- **Illustration**: Military officer, medals, stern expression
- **Theme**: Converted loyalty, military precision
- **Quote**: "Your position grants you no secrets from me..."

### 3. Bail Channis (Value 2)
- **Color Scheme**: Indigo gradient
- **Illustration**: Young man, theatrical pose, knowing smile
- **Theme**: Deception, hidden motives
- **Quote**: "Let me help you understand the situation..."

### 4. Ebling Mis (Value 3)
- **Color Scheme**: Amber gradient
- **Illustration**: Scholar surrounded by books/holograms, frantic energy
- **Theme**: Knowledge, obsession, doom
- **Quote**: "Let us compare what we know..."

### 5. Magnifico Giganticus (Value 3)
- **Color Scheme**: Purple gradient
- **Illustration**: Clown/jester with Visi-Sonor instrument
- **Theme**: Performance, hidden truth, innocence
- **Quote**: "Listen to my Visi-Sonor and reveal yourself..."

### 6. Shielded Mind (Value 4)
- **Color Scheme**: Cyan gradient
- **Illustration**: Figure with glowing shield/aura, protective stance
- **Theme**: Mental protection, resistance
- **Quote**: "I know how to protect my thoughts from scrutiny..."

### 7. Bayta Darell (Value 5)
- **Color Scheme**: Rose gradient
- **Illustration**: Woman with intuitive expression, cosmic background
- **Theme**: Intuition, immunity, feminine strength
- **Quote**: "You must reveal yourself - we're searching for the Mule!"

### 8. Toran Darell (Value 5)
- **Color Scheme**: Red gradient
- **Illustration**: Man with determined expression, action pose
- **Theme**: Active searching, determination
- **Quote**: "We will find him, no matter the cost..."

### 9. Mayor Indbur (Value 6)
- **Color Scheme**: Yellow/gold gradient
- **Illustration**: Pompous official, ornate robes, arrogant posture
- **Theme**: Authority, unwitting conversion
- **Quote**: "As Mayor of Terminus, I command an exchange..."

### 10. First Speaker (Value 7)
- **Color Scheme**: Emerald gradient
- **Illustration**: Shadowed figure, psychohistory symbols, secrecy
- **Theme**: Hidden influence, Second Foundation
- **Quote**: "My presence must remain hidden from all eyes..."

### 11. The Mule (Value 8)
- **Color Scheme**: Red-to-black gradient
- **Illustration**: Mutant figure, large eye symbol, mental power radiating
- **Theme**: Domination, emotional conversion, ultimate power
- **Quote**: "I am the master of minds, the conqueror of wills..."

---

## File Naming Convention

### Directory Structure
```
public/assets/cards/
├── textures/
│   ├── card-back.webp
│   ├── card-back.png
│   ├── informant.webp
│   ├── informant.png
│   ├── han-pritcher.webp
│   ├── han-pritcher.png
│   ├── bail-channis.webp
│   ├── bail-channis.png
│   ├── ebling-mis.webp
│   ├── ebling-mis.png
│   ├── magnifico.webp
│   ├── magnifico.png
│   ├── shielded-mind.webp
│   ├── shielded-mind.png
│   ├── bayta-darell.webp
│   ├── bayta-darell.png
│   ├── toran-darell.webp
│   ├── toran-darell.png
│   ├── mayor-indbur.webp
│   ├── mayor-indbur.png
│   ├── first-speaker.webp
│   ├── first-speaker.png
│   ├── mule.webp
│   └── mule.png
├── spritesheet.json      (generated)
└── spritesheet.webp      (generated)
```

### File Naming Rules
- Lowercase with hyphens (kebab-case)
- Match `CardType` enum from `types/game.ts`
- WebP as primary format, PNG as fallback
- No spaces or special characters

---

## Texture Atlas (Spritesheet)

### Purpose
Combine all 17 images into a single texture for optimal GPU performance.

### Tool Options

**Option A: TexturePacker** (Recommended)
- Free tier: https://www.codeandweb.com/texturepacker
- Export format: PixiJS (JSON)
- Settings:
  - Algorithm: MaxRects
  - Sort by: Best
  - Max size: 2048x2048px
  - Padding: 2px
  - Extrude: 1px
  - Trim: Disabled (keep exact dimensions)
  - Format: JSON (PixiJS compatible)

**Option B: `@pixi/spritesheet`** (Programmatic)
```bash
npm install @pixi/spritesheet
```
Generate spritesheet programmatically in build step.

### Output Files
- `spritesheet.json` - Metadata (positions, dimensions)
- `spritesheet.webp` - Texture atlas image

### Spritesheet JSON Format
```json
{
  "frames": {
    "informant.webp": {
      "frame": { "x": 0, "y": 0, "w": 512, "h": 768 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 512, "h": 768 },
      "sourceSize": { "w": 512, "h": 768 }
    },
    "card-back.webp": {
      "frame": { "x": 512, "y": 0, "w": 512, "h": 768 },
      ...
    },
    ...
  },
  "meta": {
    "image": "spritesheet.webp",
    "format": "RGBA8888",
    "size": { "w": 2048, "h": 2048 },
    "scale": "1"
  }
}
```

---

## Asset Loading Code

### Loading in Application

```typescript
// src/pixi/card/CardTextures.ts
import { Assets } from 'pixi.js';
import type { CardType } from '../../types/game';

export async function loadCardTextures(): Promise<void> {
  await Assets.load('/assets/cards/spritesheet.json');
}

export function getCardTexture(type: CardType): Texture {
  return Assets.get(`${type}.webp`);
}

export function getCardBackTexture(): Texture {
  return Assets.get('card-back.webp');
}
```

### Usage in App

```tsx
// src/App.tsx
import { loadCardTextures } from './pixi/card/CardTextures';

function App() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    loadCardTextures()
      .then(() => setAssetsLoaded(true))
      .catch(err => console.error('Failed to load textures:', err));
  }, []);

  if (!assetsLoaded) {
    return <LoadingScreen message="Loading card artwork..." />;
  }

  return <GameComponent />;
}
```

---

## Sourcing Artwork

### Option A: Commission Professional Artist

**Pros**:
- Highest quality
- Unique, custom artwork
- Full creative control
- Ownership rights

**Cons**:
- Expensive ($500-$2000 for 17 images)
- Time-consuming (2-4 weeks)
- Requires art direction

**Recommended Platforms**:
- ArtStation (https://www.artstation.com/jobs)
- Fiverr (https://www.fiverr.com)
- Upwork (https://www.upwork.com)

**Budget Estimate**: $30-120 per card illustration

### Option B: AI-Generated Artwork

**Pros**:
- Fast (hours, not weeks)
- Inexpensive ($20-50 total)
- Consistent style (via same prompts)
- Iterative refinement

**Cons**:
- May lack artistic nuance
- Licensing unclear for commercial use
- Potential ethical concerns
- Style consistency can be challenging

**Recommended Tools**:
- Midjourney (https://www.midjourney.com) - Best quality, $10/month
- DALL-E 3 (https://openai.com/dall-e-3) - Good for portraits
- Stable Diffusion (https://stability.ai) - Free, requires setup

**Sample Prompt** (Midjourney):
```
Portrait of [Character Name], Foundation universe character,
retro-futurism style, 1950s sci-fi aesthetic,
[color palette] gradient background,
dramatic lighting, digital painting,
aspect ratio 2:3, high detail --ar 2:3 --v 6
```

### Option C: Public Domain / Creative Commons

**Pros**:
- Free
- Legal for commercial use (with proper license)
- Immediate availability

**Cons**:
- Limited selection (Foundation-specific art is rare)
- Inconsistent styles
- May not fit exact requirements
- Quality varies

**Recommended Sources**:
- Unsplash (https://unsplash.com) - High-quality photos
- Pexels (https://www.pexels.com) - Free stock photos
- Wikimedia Commons (https://commons.wikimedia.org)
- OpenGameArt (https://opengameart.org)

### Option D: Hybrid Approach (Recommended)

1. **Generate base images** with AI (Midjourney)
2. **Commission artist** to refine/polish 3-5 key cards (Mule, First Speaker, Bayta)
3. **Use existing images** for generic cards (Informant, card back)

**Budget**: $100-300 total
**Timeline**: 1-2 weeks

---

## Quality Checklist

Before finalizing assets:

- [ ] All 17 images created (16 cards + 1 back)
- [ ] Correct dimensions (512x768px)
- [ ] File size <100KB per image (WebP)
- [ ] Total size <1.5MB
- [ ] WebP + PNG formats for each
- [ ] Consistent art style across all cards
- [ ] Color palettes match specification
- [ ] Text is readable at small sizes (96x144px)
- [ ] Icons/symbols are recognizable
- [ ] Quotes are accurate and visible
- [ ] Card back is symmetrical
- [ ] Spritesheet.json generated correctly
- [ ] Assets load in browser (test in dev)
- [ ] No copyright issues (proper licensing)

---

## Fallback Strategy

If asset creation is delayed or blocked:

1. **Continue with Graphics API** (Phase 1)
   - Fully functional without textures
   - Visual parity with current HTML/CSS design

2. **Placeholder Textures**
   - Use solid color backgrounds + emoji icons
   - Generate programmatically with Canvas API
   - Quick and functional

3. **Partial Implementation**
   - Load textures for available cards
   - Fallback to Graphics API for missing cards
   - Incremental asset rollout

---

## Timeline & Budget Estimates

### Conservative Estimate (Commission Artist)
- **Timeline**: 3-4 weeks
- **Budget**: $1500-2000
- **Quality**: Highest

### Moderate Estimate (AI + Artist Refinement)
- **Timeline**: 1-2 weeks
- **Budget**: $100-300
- **Quality**: High

### Aggressive Estimate (AI Only)
- **Timeline**: 2-3 days
- **Budget**: $20-50
- **Quality**: Medium-High

### Free Option (Public Domain)
- **Timeline**: 1 week (searching/editing)
- **Budget**: $0
- **Quality**: Variable

---

## Conclusion

Phase 2 asset creation is optional and can be deferred. The Graphics API (Phase 1) provides a fully functional, professional-looking card system. When ready to pursue textures, this specification provides all necessary details for sourcing, creating, and implementing card artwork.

**Recommendation**: Complete Phases 1-4 first, gather user feedback, then decide if Phase 2 (assets) is worth the investment.
