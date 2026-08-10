# Visual Overhaul Design Plan: Seven Kingdoms

## Current State Summary
- **3 CSS files**: `got-theme.css` (569 lines), `raven.css` (420), `settlement.css` (387)
- **4 Google Fonts**: Cinzel, Cinzel Decorative, Inter, Cormorant Garamond (already good)
- **Dark theme**: near-black `#050505` + gold `#b08d57`
- **Light theme**: parchment cream `#f5f0e6`
- **No images/assets** — all textures are SVG noise
- **52 pages, 18 components** — mixed CSS classes + inline styles
- **Inconsistencies**: settlement.css uses different fallback colors, ObjectUI uses hardcoded hex, quest editors look like dev tools

---

## Phase 1: Enhanced Color & Texture System

### 1.1 Expanded Color Palette
```css
:root {
  /* Base surfaces */
  --got-black: #0a0a0a;
  --got-charcoal: #141414;
  --got-iron: #1e1e1e;
  --got-steel: #2a2a2a;
  --got-rust: #3d2817;
  --got-parchment: #e8dcc0;
  --got-ivory: #f0e6d3;

  /* Gold tiers */
  --got-gold: #c5a059;
  --got-gold-bright: #e0c674;
  --got-gold-dark: #8a6d3b;

  /* House colors */
  --got-blood: #8b1a1a;
  --got-blood-bright: #c41e3a;
  --got-forest: #2d5016;
  --got-ice: #3e5c7e;
  --got-fire: #ff6b1a;
  --got-leather: #3a2817;
  --got-stone: #4a4a4a;

  /* House sigil accents */
  --stark: #6b6b6b;
  --lannister: #a01010;
  --targaryen: #b81e1e;
  --baratheon: #c5a059;
  --tyrell: #2d5016;
  --greyjoy: #8a7a40;
  --martell: #c4661a;
  --tully: #2a4a7e;
  --arryn: #4a6a9e;
  --bolton: #c4a0a0;
  --nightswatch: #1a1a1a;
}
```

### 1.2 CSS Textures (Pure CSS, no images)
- **Parchment texture**: Enhanced SVG noise + warm gradients + aging spots (for cards, modals, raven messages)
- **Dark leather texture**: For navbar, card headers, footers (radial gradients + noise)
- **Stone wall texture**: For page backgrounds, hero section (brick pattern + noise)
- **Brushed steel**: For buttons, stat bars, borders (repeating-linear-gradient)
- **Hammered iron**: For card borders, dividers (radial gradients)
- **Aged paper**: For parchment/wiki/lore pages (warmer noise + spots)

### 1.3 Decorative Borders & Dividers
- **Ornate gold border**: `border-image` with gradient for card headers
- **Diamond pattern divider**: Repeating gradient for section breaks
- **Medieval divider**: Gradient line with center ornament
- **Double-line border**: For important cards/modals
- **Corner ornaments**: CSS pseudo-elements with decorative shapes

---

## Phase 2: Typography Enhancement

### 2.1 New Font Additions
```
ADD to Google Fonts import:
- EB Garamond (400, 500, 600) — replace Inter for body text (more period-appropriate)
- UnifrakturMaguntia (400) — for decorative/blackletter accents only
- MedievalSharp (400) — for handwritten-style notes/quests
- IM Fell English (400) — for old-book style lore text
```

### 2.2 Typography Hierarchy
```css
--font-display: 'Cinzel Decorative', serif     /* logo, hero title, 404 */
--font-heading: 'Cinzel', serif                /* page headers, card headers, buttons */
--font-body: 'EB Garamond', serif              /* body text — MORE medieval than Inter */
--font-ui: 'Inter', sans-serif                /* UI controls, inputs, small text */
--font-serif: 'Cormorant Garamond', serif      /* parchment, flavor text */
--font-blackletter: 'UnifrakturMaguntia', serif  /* decorative titles only */
--font-script: 'MedievalSharp', cursive        /* handwritten notes, quest text */
--font-lore: 'IM Fell English', serif          /* lore/wiki/compendium */
```

### 2.3 Drop Caps & Decorative Text
- First-letter drop caps on lore/wiki paragraphs (3-line height, gold, Cinzel)
- Small caps for section headers (`font-variant: small-caps`)
- Letter-spacing increased on headings (0.15-0.25em)
- Gold underline ornaments on section titles

---

## Phase 3: Navigation Redesign

### 3.1 Navbar
- **Leather texture background** instead of plain rgba blur
- **Gold rivet decorations** at corners (CSS pseudo-elements)
- **Animated underline** on nav links (gold gradient sweeps in on hover)
- **House sigil** next to username if house is set
- **Banner-style dropdown menus** (parchment texture, gold border)
- **Cinzel Decorative** for brand text with subtle gold glow
- **Theme toggle** styled as a sun/moon coin flip animation

### 3.2 Dropdown Menus
- Parchment-textured backgrounds with torn-edge bottom (CSS clip-path)
- Gold border with corner ornaments
- Hover items get gold left-border accent
- House-colored dots next to house-related items

---

## Phase 4: Card & Component Overhaul

### 4.1 Card Variants
```
.card                    — standard dark card (iron texture border)
.card-parchment          — parchment background for lore/wiki
.card-leather            — dark leather background for important data
.card-stone              — stone texture for headers/hero
.card-bordered           — ornate double gold border for modals
.card-house-{name}       — house-colored accent border
```

### 4.2 Enhanced Card Headers
- Gold gradient bar at top (2px, gradient sweep)
- Cinzel font, uppercase, wider letter-spacing
- Optional house sigil icon left of title
- Decorative corner ornaments (CSS pseudo-elements)

### 4.3 Buttons
```
.btn-primary             — gold metal gradient (steel + gold)
.btn-outline             — transparent with gold border + glow on hover
.btn-danger              — blood red gradient with fire glow
.btn-valyrian            — dark steel with faint glow (for magic items)
.btn-iron                — dark iron gradient (for Night's Watch/destructive)
```

### 4.4 Stat Bars
- **Steel-trimmed**: brushed steel background, gold/colored fill
- **Gem-tipped**: small gem-like circle at fill end (house-colored)
- **Engraved label**: Cinzel small caps, letter-spaced
- **HP variant**: red→crimson→green gradient with pulse animation when low

### 4.5 Tables
- Parchment-striped rows (alternating warm tones)
- Gold engraved headers (Cinzel, uppercase, letter-spaced)
- Hover row: warm gold tint
- Border: thin iron lines between rows

### 4.6 Badges
```
.badge-gold              — gold metal gradient
.badge-blood             — deep red with crimson border
.badge-forest            — forest green with gold border
.badge-ice               — ice blue with frost border
.badge-house-{name}      — house-colored with sigil
```

### 4.7 Tabs
- **Parchment-scroll tabs**: active tab looks like unrolled parchment
- Gold border-bottom replaced with ornate underline
- Inactive tabs: muted, dark leather background
- Hover: gold text + subtle border

---

## Phase 5: Atmospheric Effects

### 5.1 Page Backgrounds
- **Animated fog**: subtle drifting fog at page bottom (like hero, but site-wide)
- **Ember particles**: floating on pages related to fire/R'hllor/dragons
- **Snow effect**: on North/Stark/Winter-related pages
- **Vignette**: dark edges on all pages for depth

### 5.2 Hero Section Redesign
- **Castle silhouette**: CSS gradient silhouette at bottom
- **Animated falling embers**: floating particles
- **Scrolling fog layers**: multiple parallax fog layers
- **House sigil watermark**: faint house crest behind title
- **Gold particle shimmer**: subtle floating gold dots

### 5.3 Loading States
- **Parchment scroll**: skeleton lines styled as scroll text
- **House crest spinner**: rotating house sigil instead of plain circle
- **Shimmer**: gold sweep instead of gradient shimmer

---

## Phase 6: Icon System

### 6.1 Heraldic SVG Icons
Replace emoji with inline SVG icons from game-icons.net style:
- **Navigation**: shield (character), sword (adventure), scroll (community)
- **Actions**: quill (write), seal (confirm), broken-seal (cancel)
- **Status**: crown (admin), raven (notifications), flame (active)
- **Houses**: wolf, lion, dragon, stag, rose, kraken, sun, trout, falcon, flayed-man

### 6.2 Icon Component
```jsx
<Icon name="sword" size={24} color="gold" />
<Icon name="wolf" size={48} house="stark" />
```

---

## Phase 7: Page-Specific Redesigns

### 7.1 Home Page
- Full-screen hero with castle silhouette + animated fog + embers
- House sigil crests floating in hero background
- Intro cards as parchment scrolls with wax seals
- Server status as medieval "royal decree" board
- CTA section with animated gold border + fire glow

### 7.2 Login Page
- Styled as a "gate" with iron bars (CSS gradient)
- Parchment scroll for the form
- Wax seal decoration at top
- Discord button styled as "raven message"

### 7.3 Character/Profile Page
- Character sheet styled as parchment document
- House banner at top with sigil
- Stats as engraved stone tablet
- Inventory as leather-bound grid
- Wounds as blood-stained parchment entries

### 7.4 Data Pages (War, Economy, Diplomacy, etc.)
- Cards with house-colored accent borders
- Tables as medieval ledger pages
- Stat bars with steel + gem styling
- Charts with parchment background + gold grid lines

### 7.5 Raven Network
- Enhanced parchment texture with aging/wear
- Wax seal stamps on messages (CSS pseudo-elements)
- Ink-splatter decorations
- Raven feather watermark

### 7.6 ObjectUI (SL Prim faces)
- Refactor hardcoded colors to use CSS variables
- Match dark theme aesthetic
- Smaller, more compact medieval styling

---

## Phase 8: Animations & Transitions

### 8.1 New Animations
```css
@keyframes emberRise        /* floating embers upward */
@keyframes snowFall          /* gentle snow falling */
@keyframes goldShimmer       /* gold particle shimmer sweep */
@keyframes parchmentUnroll   /* page/section reveal */
@keyframes sealStamp          /* wax seal stamp impact */
@keyframes bladeGleam         /* sword/steel flash */
@keyframes crestPulse        /* house sigil glow pulse */
@keyframes fogRolling        /* slow fog drift */
@keyframes inkBleed          /* text ink bleeding in */
```

### 8.2 Enhanced Transitions
- Page transitions: fade + unroll animation
- Card hover: lift + gold border glow + shadow
- Button hover: metal gleam sweep (gradient shift)
- Tab switch: parchment slide transition
- Modal open: scale + fade with seal-stamp sound

---

## Phase 9: Consistency Fixes

### 9.1 Fix settlement.css
- Replace all fallback hex values (`#1a1a2e`, `#c8a85a`, `#3a3a5a`) with CSS variables
- Align with main theme's color system

### 9.2 Fix ObjectUI
- Replace all hardcoded colors with CSS variables
- Add a compact variant of the theme for prim faces

### 9.3 Fix Quest Editor
- Replace dev-tool aesthetic with medieval theme
- Use Cinzel for labels, parchment for panels
- Remove monospace fonts

### 9.4 Fix Profile Tabs
- Replace inline-styled tabs with CSS `.tab-btn` classes

---

## Implementation Order

| Phase | What | Effort | Impact |
|-------|------|--------|--------|
| 1 | Color & texture system | High | Foundation |
| 2 | Typography enhancement | Medium | High |
| 3 | Navigation redesign | Medium | High |
| 4 | Card & component overhaul | High | Highest |
| 5 | Atmospheric effects | Medium | High |
| 6 | Icon system | Medium | Medium |
| 7 | Page-specific redesigns | High | Highest |
| 8 | Animations | Medium | Medium |
| 9 | Consistency fixes | Low | Medium |

---

## Key Files to Modify

- `src/styles/got-theme.css` — full rewrite/enhancement (main stylesheet)
- `src/styles/raven.css` — enhance parchment textures
- `src/styles/settlement.css` — fix color variables
- `index.html` — add new Google Fonts
- `src/pages/ObjectUI.jsx` — refactor hardcoded colors
- `src/components/Navbar.jsx` — leather texture, dropdown redesign
- `src/pages/Home.jsx` — hero redesign, atmospheric effects
- `src/pages/Login.jsx` — gate styling
- `src/components/Skeleton.jsx` — parchment loading states
- All page components — className updates for new card variants
