# Portrait Generation Prompts

This file contains all the ComfyUI prompts used to generate character portraits for The Mule's Court card game. These prompts ensure reproducibility of the artwork.

## Generation Settings
- **Model**: Chroma1-Radiance-v0.2
- **Resolution**: 512x720
- **Steps**: 20
- **Sampler**: euler
- **CFG**: 3.5

---

## 1_informant.png

**Positive Prompt:**
```
Informant character portrait, common converted follower, mysterious shadowy figure, hooded silhouette, slate gray and dark colors, anonymous face partially obscured, Foundation universe sci-fi aesthetic, subtle menace, ordinary person controlled by the Mule, dark atmospheric lighting, Isaac Asimov inspired, portrait format
```

**Negative Prompt:**
```
bright, cheerful, colorful, detailed face, recognizable features, friendly, modern, photorealistic, low quality, blurry, text, watermark
```

---

## 2_han_pritcher.png

**Positive Prompt:**
```
Han Pritcher portrait, converted military captain from Foundation, stern military officer, blue uniform with medals, believing his loyalty is freely chosen, disciplined soldier face, short military haircut, Foundation universe sci-fi retro futurism, determined expression hiding mental conversion, Isaac Asimov inspired character, portrait format
```

**Negative Prompt:**
```
casual clothing, modern, friendly smile, bright colors, photorealistic, low quality, blurry, text, watermark, multiple people
```

---

## 2_bail_channis.png

**Positive Prompt:**
```
Bail Channis portrait, Foundation agent playing deeper game, indigo colored scheme, theatrical mask-like expression, clever strategist face, young intelligent agent, mysterious smile, sci-fi retro futurism aesthetic, duplicitous charm, Isaac Asimov Foundation character, portrait format
```

**Negative Prompt:**
```
military uniform, stern, old, bright colors, modern, photorealistic, low quality, blurry, text, watermark
```

---

## 3_ebling_mis.png

**Positive Prompt:**
```
Ebling Mis portrait, brilliant scholar from Foundation, amber colored scheme, elderly academic with books, exhausted genius face, racing toward deadly truth, spectacles, weary expression, psychohistorian researcher, sci-fi retro futurism aesthetic, Isaac Asimov character, portrait format
```

**Negative Prompt:**
```
young, military, healthy, cheerful, bright colors, modern, photorealistic, low quality, blurry, text, watermark
```

---

## 3_magnifico.png

**Positive Prompt:**
```
Magnifico Giganticus portrait, theatrical clown performer from Foundation, purple colored scheme, Visi-Sonor musician, enigmatic entertainer face, compelling performance aura, truth-revealing artist, mysterious performer, sci-fi retro futurism aesthetic, Isaac Asimov character, portrait format
```

**Negative Prompt:**
```
scary clown, horror, bright colors, modern, military, academic, photorealistic, low quality, blurry, text, watermark
```

---

## 4_shielded_mind.png

**Positive Prompt:**
```
Shielded Mind portrait, mental protection symbol from Foundation, cyan colored scheme, abstract representation of psychic shield, mysterious figure with defensive aura, protected thoughts visualization, mental barrier aesthetic, sci-fi retro futurism, glowing cyan energy, Isaac Asimov inspired, portrait format
```

**Negative Prompt:**
```
specific person, detailed face, bright colors, modern, photorealistic, low quality, blurry, text, watermark, weapons
```

---

## 5_bayta_darell.png

**Positive Prompt:**
```
Bayta Darell portrait, woman with intuition immunity from Foundation, rose colored scheme, determined female face, strong-willed woman, searching for the Mule, protective maternal energy, intelligent perceptive eyes, sci-fi retro futurism aesthetic, Isaac Asimov character, portrait format
```

**Negative Prompt:**
```
weak, timid, bright colors, modern fashion, photorealistic, low quality, blurry, text, watermark, multiple people
```

---

## 5_toran_darell.png

**Positive Prompt:**
```
Toran Darell portrait, male searcher from Foundation, red colored scheme, determined young man, husband searching for the Mule, touched by psychic power, resolute warrior expression, protective stance, sci-fi retro futurism aesthetic, Isaac Asimov character, portrait format
```

**Negative Prompt:**
```
old, weak, bright colors, modern, military uniform, photorealistic, low quality, blurry, text, watermark, multiple people
```

---

## 6_mayor_indbur.png

**Positive Prompt:**
```
Mayor Indbur portrait, Mayor of Terminus from Foundation, yellow and gold colored scheme, authoritative political leader, regal mayoral robes, certain of independence while converted, commanding dignified expression, Foundation bureaucrat, sci-fi retro futurism aesthetic, Isaac Asimov character, portrait format
```

**Negative Prompt:**
```
military, casual, young, weak, bright modern colors, photorealistic, low quality, blurry, text, watermark, crown
```

---

## 7_first_speaker.png

**Positive Prompt:**
```
The First Speaker portrait, Second Foundation leader, emerald green colored scheme, mysterious psychohistorian master, hooded enigmatic figure, must remain hidden, wise ancient mentor presence, secretive powerful psychic, sci-fi retro futurism aesthetic, Isaac Asimov Foundation character, portrait format
```

**Negative Prompt:**
```
young, visible detailed face, bright colors, modern, photorealistic, low quality, blurry, text, watermark, military
```

---

## 8_the_mule.png

**Positive Prompt:**
```
The Mule character portrait, mysterious powerful mutant from Foundation universe, pale gaunt face, intense piercing eyes, psychic energy aura, dark hooded cloak, ethereal glow, sci-fi retro futurism aesthetic, regal yet haunting presence, purple and gold color scheme, dramatic lighting, menacing expression, psychohistory disruptor, galactic conqueror appearance, high quality digital art, detailed face, Isaac Asimov Foundation inspired
```

**Negative Prompt:**
```
friendly, cheerful, bright colors, modern clothing, photorealistic, low quality, blurry, cartoon, anime, multiple faces, deformed, ugly, text, watermark
```

---

## Card Template Attempts

### Card Front Template (Ornate - First Attempt)
**File**: 2025-10-05_163122.png

**Positive Prompt:**
```
Playing card front template, mystical deep purple gradient background, ornate Art Nouveau style golden borders and decorative frames, multiple empty rectangular sections for card information, sci-fi Foundation universe aesthetic, elegant geometric patterns, intricate filigree details, beige cream colored frames with gold accents, symmetrical layout, professional game card design, clean empty spaces for text and artwork, luxurious royal appearance, psychohistory galactic empire theme, high quality vector illustration
```

**Negative Prompt:**
```
photorealistic, modern minimalist, cluttered, text, characters, people, low quality, blurry, pixelated, messy, asymmetric, crowded, busy background, watermark, signature, rough edges, amateur, simple borders, plain design, dull colors
```

### Card Front Template (Minimal - Second Attempt)
**File**: 2025-10-05_180916.png

**Positive Prompt:**
```
Card game template, three empty white rectangular sections divided by black borders with gold trim, top title banner, large center portrait area, bottom text panel, clean Art Deco geometric style, minimal sci-fi design, sharp corners with small gold diagonal accents, professional layout, Foundation universe theme, high contrast black and gold frame, white background areas, sleek modern appearance, vector style illustration
```

**Negative Prompt:**
```
ornate details, floral, curved decorations, Art Nouveau, purple, gradient, filled portrait, text content, characters, people, cluttered, busy patterns, medieval, fantasy, blurry, low quality, messy edges
```

---

## Notes

- All portraits generated on 2025-10-05
- ComfyUI workflow: Chroma-Radiance (text-to-image)
- Output format: PNG at 300 DPI
- Color schemes match the card definitions in `src/data/cards.ts`
- Each character's color scheme aligns with their thematic role in the game
