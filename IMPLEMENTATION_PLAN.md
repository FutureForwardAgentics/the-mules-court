# Holographic Card Shader Implementation Plan

## Project Overview

Implement full GLSL shader-based holographic foil effect for all 16 cards in The Mule's Court, inspired by Magic: The Gathering's subtle foil aesthetic and Marvel Snap's autonomous animation, themed with Foundation universe colors (gold, silver, chrome, imperial tones).

**Timeline**: October 6-31, 2025 (~25 days)
**Technology**: BabylonJS ShaderMaterial with custom GLSL shaders
**Visual Reference**: MTG foil cards (elegant, subtle) + Marvel Snap (autonomous shimmer)
**Color Palette**: Metallic gold, silver, chrome, gunmetal, with character-specific accent colors

---

## Current State Assessment

### Assets Available
- 11 unique character portraits (4 variants each: `_0`, `_1`, `_2`, `_3`)
- Card frame template: `card_front_3.png` (black/gold art deco border)
- Card backs: `card_back_3.png`
- Color gradients defined in `cards.ts` (Tailwind format)

### Existing Architecture
- **BabylonCard.ts** (lines 1-284): 2D GUI-based card rendering
- **BabylonCardRenderer.tsx** (lines 1-294): React wrapper for GUI cards
- **BabylonCanvas.tsx** (lines 1-78): Engine/Scene lifecycle management
- **Game state**: Managed by React `useGameState` hook

### Architecture Change Required
- **From**: 2D GUI rectangles (`GUI.Rectangle`, `GUI.Image`, `GUI.TextBlock`)
- **To**: 3D plane meshes with `ShaderMaterial`
- **Reason**: Shaders only work on 3D meshes, not GUI controls

---

## Stage 1: Texture Asset Generation

**Goal**: Create all shader textures using ComfyUI
**Duration**: 2-3 days (Oct 6-9)
**Status**: Not Started

### Tasks
1. Generate rainbow gradient texture (horizontal spectrum, 1024x256px)
   - Smooth transition: Red → Orange → Yellow → Green → Cyan → Blue → Purple → Red
   - MTG-style: Subtle, not oversaturated
   - Format: PNG, sRGB color space

2. Generate distortion/flow map texture (1024x1024px)
   - Perlin/Simplex noise pattern for UV distortion
   - Grayscale (R=U offset, G=V offset, B=unused)
   - Subtle variation (not extreme warping)

3. Generate sparkle/star pattern texture (512x512px)
   - Random small white dots/stars on transparent background
   - MTG-style: Sparse, elegant (not Pokemon-level sparkly)
   - Alpha channel for blending

4. Optional: Normal map for depth (512x512px)
   - Subtle bumps/ridges for card texture
   - Low intensity (barely noticeable)

### Success Criteria
- [ ] All textures load in BabylonJS without errors
- [ ] Rainbow gradient is smooth and MTG-appropriate
- [ ] Distortion map creates subtle flow (not chaotic)
- [ ] Sparkle pattern enhances without overwhelming

### Tests
- Visual inspection in BabylonJS Playground
- Test at different zoom levels
- Verify file sizes (<500KB total)

---

## Stage 2: 3D Mesh Architecture

**Goal**: Replace 2D GUI with 3D plane meshes, maintain layout/positioning
**Duration**: 3-4 days (Oct 9-13)
**Status**: ✅ COMPLETED (Oct 6)

### Tasks
1. ✅ Create `BabylonCardMesh.ts` class
   - `MeshBuilder.CreatePlane()` for card geometry
   - Aspect ratio: 2:3 (standard card proportions)
   - Three sizes: small (1x1.5), medium (2x3), large (2.67x4)
   - ActionManager for hover/click interactions

2. ✅ Implement orthographic camera setup
   - ArcRotateCamera in orthographic mode
   - Camera locked (no user interaction)
   - Proper frustum sizing based on canvas dimensions

3. ✅ Create `BabylonCardRenderer3D.tsx` component
   - 3D scene with transparent background
   - Hemisphere lighting
   - Canvas resize handling

4. ✅ Create positioning system
   - World-space position calculation for layouts
   - Support horizontal/vertical/stack layouts
   - Approximate world units from pixel spacing

5. ✅ Maintain React integration
   - `useEffect` pattern for scene lifecycle
   - Proper cleanup on unmount
   - Raycasting-based click events via ActionManager

6. ✅ Create test demo component
   - `BabylonCard3DDemo` with interactive controls
   - Accessible via `?demo=3d` URL parameter
   - Test all sizes, layouts, revealed/hidden states

### Success Criteria
- [x] All 16 cards render as 3D planes
- [x] Layouts work (horizontal, vertical, stack)
- [x] Click events work via raycasting
- [x] Hover effects work (scale + brightness)
- [x] Build compiles without TypeScript errors (new files)
- [x] Dev server runs successfully
- [x] Demo accessible at localhost:5173/?demo=3d

### Tests
- ✅ Build test: TypeScript compilation successful
- ✅ Runtime test: Dev server starts
- ⏭️ Visual test: Manual testing required (view demo in browser)
- ⏭️ Performance test: FPS monitoring in browser DevTools

### Notes
- Temporary StandardMaterial with solid colors (will be replaced with ShaderMaterial in Stage 3)
- Kept old BabylonCard.ts as backup
- New implementation is drop-in compatible with existing BabylonCardRendererProps interface

---

## Stage 3: Basic Shader Implementation

**Goal**: Create functional holofoil shader with time-based animation
**Duration**: 5-7 days (Oct 13-20)
**Status**: Not Started

### Tasks
1. Write vertex shader (`holofoil.vertex.glsl`)
   ```glsl
   precision highp float;

   attribute vec3 position;
   attribute vec3 normal;
   attribute vec2 uv;

   uniform mat4 worldViewProjection;
   uniform mat4 world;
   uniform vec3 cameraPosition;

   varying vec2 vUV;
   varying vec3 vNormal;
   varying vec3 vViewDirection;

   void main() {
       vec4 worldPos = world * vec4(position, 1.0);
       gl_Position = worldViewProjection * vec4(position, 1.0);

       vUV = uv;
       vNormal = normalize((world * vec4(normal, 0.0)).xyz);
       vViewDirection = normalize(cameraPosition - worldPos.xyz);
   }
   ```

2. Write fragment shader (`holofoil.fragment.glsl`)
   ```glsl
   precision highp float;

   varying vec2 vUV;
   varying vec3 vNormal;
   varying vec3 vViewDirection;

   uniform sampler2D cardTexture;      // Card front image
   uniform sampler2D rainbowTexture;   // Gradient
   uniform sampler2D distortionTexture; // Flow map
   uniform sampler2D sparkleTexture;   // Stars

   uniform float time;                 // Animated
   uniform float holoIntensity;        // 0-1 strength
   uniform float distortionStrength;   // UV warp amount
   uniform vec3 accentColor;           // Character color

   void main() {
       // Base card texture
       vec4 cardColor = texture2D(cardTexture, vUV);

       // Animate distortion over time
       vec2 flowUV = vUV + vec2(time * 0.02, time * 0.03);
       vec2 distortion = texture2D(distortionTexture, flowUV).rg;
       distortion = (distortion * 2.0 - 1.0) * distortionStrength;

       // Calculate tangent-space view direction (for parallax)
       vec2 holoUV = vUV + distortion;
       holoUV.x += time * 0.05; // Slow horizontal scroll

       // Sample rainbow with distorted UVs
       vec4 rainbow = texture2D(rainbowTexture, holoUV);

       // Sample sparkles
       vec4 sparkles = texture2D(sparkleTexture, vUV + distortion);

       // Mix based on view angle (Fresnel-like effect)
       float fresnel = pow(1.0 - dot(vNormal, vViewDirection), 2.0);

       // Combine layers
       vec3 holo = rainbow.rgb * holoIntensity * fresnel;
       holo += sparkles.rgb * sparkles.a * 0.3;
       holo = mix(holo, holo * accentColor, 0.3); // Tint with character color

       // Blend with card
       vec3 finalColor = cardColor.rgb + holo * 0.5; // Additive blend

       gl_FragColor = vec4(finalColor, cardColor.a);
   }
   ```

3. Create `HolofoilMaterial.ts` wrapper class
   - Instantiate `ShaderMaterial`
   - Load shader files
   - Set up uniforms/samplers
   - Provide update method for animation

4. Implement time-based animation
   - Update `time` uniform each frame in render loop
   - Slow, gentle movement (not frenetic)
   - Loop seamlessly (use modulo or sine waves)

### Success Criteria
- [ ] Shader compiles without errors
- [ ] Rainbow effect visible and animates smoothly
- [ ] Distortion creates subtle flow (not chaos)
- [ ] Sparkles enhance without overwhelming
- [ ] Effect works on all 11 card types
- [ ] Performance: 60fps with shader active

### Tests
- Shader compilation test (catch GLSL errors)
- Visual test: Compare to MTG foil reference
- Performance test: GPU usage monitoring
- Animation test: Verify seamless looping

---

## Stage 4: Advanced Shader Features & Polish

**Goal**: Add masking, per-card customization, quality settings
**Duration**: 3-4 days (Oct 20-24)
**Status**: Not Started

### Tasks
1. Implement masking system
   - Create alpha masks for portrait vs border regions
   - Apply different holo intensity to different areas
   - Option: Stronger effect on borders, subtle on portraits

2. Per-character color tinting
   - Extract accent colors from `cards.ts` (Tailwind gradients)
   - Convert to RGB uniforms
   - Tint holo effect with character's theme color
   - Example: Bayta (rose), Mule (red-black), First Speaker (emerald)

3. Add quality settings
   - High: Full shader with all effects
   - Medium: Reduced sparkles, simpler distortion
   - Low: Fallback to static gradient overlay (no shader)
   - Auto-detect GPU capability

4. Implement card back shader
   - Separate shader for card backs (different texture)
   - Simpler effect (less detailed)
   - Consistent animation timing

5. Add subtle depth/lighting
   - Optional normal mapping
   - Fake specular highlights
   - Directional light response

### Success Criteria
- [ ] Masking works (border shimmers more than portrait)
- [ ] Each character has unique color tint
- [ ] Quality settings selectable via UI
- [ ] Card backs have appropriate effect
- [ ] Lighting enhances without overpowering

### Tests
- Visual test: Mask boundaries are clean
- Color test: All 11 characters have correct tints
- Performance test: Low-end device testing
- A/B test: Quality settings comparison

---

## Stage 5: Integration, Optimization & Documentation

**Goal**: Full deck integration, performance tuning, final polish
**Duration**: 3-4 days (Oct 24-28)
**Status**: Not Started

### Tasks
1. Apply shader to all 16 card instances
   - Generate mesh + material for each card
   - Handle card state (face-up, face-down, flipped)
   - Ensure portrait variants load correctly

2. Optimize performance
   - Profile GPU usage (Chrome DevTools, Spector.js)
   - Freeze offscreen cards (culling)
   - Reduce texture sizes if needed
   - Minimize uniform updates

3. Polish animations
   - Tune timing parameters (speed, intensity)
   - Add subtle variations (different phase offsets per card)
   - Ensure effect feels "alive" but not distracting

4. Test on multiple devices
   - Desktop: Chrome, Firefox, Safari
   - Mobile: iOS Safari, Android Chrome
   - Low-end: Reduce quality automatically

5. Update React components
   - Modify `GameBoard.tsx` to use new mesh system
   - Update `PlayerArea.tsx` for 3D cards
   - Ensure interaction handlers still work

6. Write documentation
   - Update CLAUDE.md with shader architecture
   - Document shader uniforms and parameters
   - Add comments to GLSL code
   - Create tuning guide for future adjustments

### Success Criteria
- [ ] All 16 cards have holo effect
- [ ] 60fps maintained on target devices
- [ ] Effect enhances without distracting from gameplay
- [ ] Code is well-documented
- [ ] No visual bugs or glitches

### Tests
- Full integration test: Play complete game
- Cross-browser testing
- Mobile device testing
- Performance benchmark: FPS over 5-minute session
- User testing: Visual appeal survey

---

## Definition of Done

- [ ] All 16 cards render with holographic shader
- [ ] Effect matches MTG aesthetic + Foundation colors
- [ ] Animation is autonomous (time-based, not mouse)
- [ ] Performance: 60fps on target devices
- [ ] All tests passing (unit, integration, visual)
- [ ] Code documented and reviewed
- [ ] No linter/formatter warnings
- [ ] Changes recorded via GitButler MCP tool
- [ ] IMPLEMENTATION_PLAN.md removed (work complete)

---

## Timeline Summary

| Stage | Duration | Dates | Focus |
|-------|----------|-------|-------|
| 1. Textures | 2-3 days | Oct 6-9 | ComfyUI asset generation |
| 2. Architecture | 3-4 days | Oct 9-13 | 2D GUI → 3D meshes |
| 3. Shader Core | 5-7 days | Oct 13-20 | GLSL implementation |
| 4. Polish | 3-4 days | Oct 20-24 | Masking, colors, quality |
| 5. Integration | 3-4 days | Oct 24-28 | Full deck, optimization |
| **Buffer** | 2-3 days | Oct 28-31 | Bug fixes, final tweaks |

**Total**: 18-25 days (fits within October)
