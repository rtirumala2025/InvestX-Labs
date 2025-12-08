# InvestX Labs - Master Design System

**Based on OKAashish UI Design Principles**

> "Create interfaces that tell stories, feel intentional, and stand out through thoughtful design decisions."

---

## 🎨 Brand Narrative

**InvestX Labs** is an investment education platform for high school students. Our design tells the story of:
- **Growth** - Financial and personal development
- **Learning** - Accessible, empowering education
- **Confidence** - Building wealth knowledge step by step

Every design choice supports this narrative. Generic templates are forbidden.

---

## 📝 Typography System

### Font Families

**Display Font** - `DM Serif Display`
- Used for: Hero headlines, brand moments, major headings
- Why: Elegant serif that conveys sophistication and trust
- Weight: Regular (400), Italic

**Primary Sans** - `Space Grotesk`
- Used for: Body text, UI elements, navigation
- Why: Humanist grotesque with personality, modern yet approachable
- Weights: Light (300), Regular (400), Medium (500), Semibold (600), Bold (700)

**Monospace** - `JetBrains Mono`
- Used for: Financial data, code, figures, numbers
- Why: Clear, readable monospace with excellent number rendering
- Weights: Regular (400), Medium (500), Semibold (600)

### Type Scale

```css
h1: clamp(2.5rem, 5vw, 4.5rem)     /* Hero headlines */
h2: clamp(2rem, 4vw, 3.5rem)       /* Section titles */
h3: clamp(1.75rem, 3vw, 2.5rem)    /* Subsection titles */
h4: clamp(1.5rem, 2.5vw, 2rem)     /* Card titles */
h5: clamp(1.25rem, 2vw, 1.5rem)    /* Small headings */
h6: clamp(1.125rem, 1.5vw, 1.25rem) /* Labels */
body: 1rem                          /* Base text */
```

### Usage Guidelines

- **Never use**: Inter, Arial, Roboto, system-UI, Space Grotesk (as primary)
- **Display text**: Use serif for hero moments, brand statements
- **Data/Figures**: Always use monospace for financial numbers
- **Hierarchy**: Use font weight and size to create clear visual hierarchy

---

## 🎨 Color System

### Primary Palette: Deep Forest Green

**Meaning**: Growth, prosperity, financial success

```css
Primary 50:  #f0fdf4  /* Lightest */
Primary 500: #22c55e  /* Base */
Primary 600: #16a34a  /* Hover/Active */
Primary 900: #14532d  /* Darkest */
```

**Usage**:
- Primary actions (buttons, links)
- Success states
- Growth indicators
- Positive financial metrics

### Accent Palette: Rich Gold

**Meaning**: Wealth, achievement, milestones

```css
Accent 50:  #fffbeb  /* Lightest */
Accent 500: #f59e0b  /* Base */
Accent 600: #d97706  /* Hover/Active */
Accent 900: #78350f  /* Darkest */
```

**Usage**:
- Achievement badges
- Milestone celebrations
- Premium features
- Highlight important information

### Secondary Palette: Deep Navy

**Meaning**: Trust, stability, professionalism

```css
Secondary 50:  #f8fafc  /* Lightest */
Secondary 500: #64748b  /* Base */
Secondary 900: #0f172a  /* Darkest */
```

**Usage**:
- Backgrounds
- Secondary text
- Borders
- Neutral UI elements

### What We Avoid

❌ **Purple/Indigo gradients** on plain white backgrounds  
❌ **Generic blue** (#3b82f6) as primary  
❌ **Random color scattering** - every color must justify its presence

---

## 🌆 Background System

### Layered Depth

Our backgrounds use multiple layers to create atmosphere:

1. **Base Layer**: Deep dark (`#0a0f1a`)
2. **Gradient Layer**: Subtle color transitions
3. **Pattern Layer**: Geometric grid (60px × 60px, 2% opacity)
4. **Texture Layer**: Noise texture (0.03 opacity)

### Background Variants

```css
/* Primary Background */
background: var(--bg-base);
background-image: 
  var(--bg-gradient-primary),
  var(--bg-pattern-grid),
  var(--bg-pattern-noise);

/* Accent Overlay */
background-image: var(--bg-gradient-overlay);
/* Radial gradient from top with primary color tint */
```

### Guidelines

- **Never use**: Flat, solid-color backgrounds (unless intentionally minimalist)
- **Always layer**: Create depth through foreground, midground, background
- **Add atmosphere**: Backgrounds should reinforce brand identity
- **Dark mode first**: Design sophisticated dark modes, not just color inversions

---

## 🔮 Glass System

### Glass Components

**Base Glass Card**:
```css
.glass-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
```

**Colored Glass Variants**:
- `.glass-card-primary` - Green tint for growth-related content
- `.glass-card-accent` - Gold tint for achievements/milestones

### Glass Properties

- **Backdrop blur**: 24px (large), 16px (medium), 8px (small)
- **Background opacity**: 0.4 (base), 0.25 (subtle)
- **Border opacity**: 0.08 (base), 0.12 (hover)
- **Shadows**: Layered for depth

---

## 🎬 Motion & Interaction

### Animation Principles

1. **Purposeful**: Every animation serves the user or narrative
2. **Choreographed**: Staggered reveals, entrance sequences
3. **Respectful**: Honor `prefers-reduced-motion`
4. **Quality over quantity**: One high-quality animation beats many scattered micro-interactions

### Transition Timing

```css
--transition-fast: 0.15s    /* Hover states, quick feedback */
--transition-normal: 0.3s   /* Standard interactions */
--transition-slow: 0.5s     /* Page transitions, major changes */
--transition-bounce: 0.6s   /* Playful, celebratory moments */
```

### Easing Functions

- **Standard**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Smooth**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- **Spring**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- **Expo**: `cubic-bezier(0.19, 1, 0.22, 1)`

### Animation Examples

**Staggered Card Reveal**:
```jsx
<motion.div
  variants={fadeIn}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
  transition={{ delay: index * 0.1 }}
>
```

**Purposeful Hover**:
```css
.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary-lg);
  transition: all var(--transition-normal);
}
```

---

## 🎯 Component Guidelines

### Buttons

**Primary Button**:
- Background: Primary green gradient
- Text: White
- Shadow: Primary colored shadow
- Hover: Lift + stronger shadow

**Secondary Button**:
- Background: Glass with border
- Text: Primary color
- Hover: Colored border, subtle glow

### Cards

**Standard Card**:
- Glass background
- Rounded corners (1.5rem)
- Subtle border
- Hover: Lift + colored border

**Feature Card**:
- Glass background with colored tint
- Icon with colored background
- Hover: Enhanced glow

### Typography

**Hero Text**:
- Display font (serif)
- Large size (clamp for responsive)
- Gradient text (primary → accent)
- Negative letter spacing

**Data Display**:
- Monospace font
- Tabular numbers
- Primary or accent color
- Clear hierarchy

---

## ♿ Accessibility

### WCAG Compliance

- **Contrast Ratios**: Minimum AA (4.5:1), prefer AAA (7:1)
- **Focus States**: Clear, visible focus indicators
- **Reduced Motion**: All animations respect `prefers-reduced-motion`
- **High Contrast**: Support for high contrast mode

### Focus Indicators

```css
*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 4px;
  border-radius: var(--radius-sm);
}
```

### Color Usage

- **Never rely on color alone** to convey information
- Use icons, text, or patterns in addition to color
- Test with color blindness simulators

---

## 🚫 What to Avoid

### Design Anti-Patterns

1. ❌ **Generic fonts** (Inter, Arial, Roboto) without justification
2. ❌ **Purple/indigo gradients** on plain white
3. ❌ **Generic "startup aesthetic"** that lacks brand specificity
4. ❌ **Inaccessible colors** that fail WCAG standards
5. ❌ **Excessive animations** that distract from content
6. ❌ **Pretty but meaningless** designs that tell no story
7. ❌ **Homogenous components** with no aesthetic identity
8. ❌ **Repeating patterns** across different projects
9. ❌ **Safe defaults** when brand context demands boldness

### Creative Mandate

**Each interface must**:
- ✅ Tell a brand-specific story
- ✅ Exhibit unique visual identity
- ✅ Take thoughtful creative risks
- ✅ Maintain clean, elegant execution
- ✅ Build accessibility into creativity
- ✅ Surprise and delight

---

## 📚 Usage Examples

### Hero Section

```jsx
<h1 className="display-text text-gradient-hero">
  InvestX Labs
</h1>
<p className="text-lg text-neutral-300 max-w-2xl">
  Learn. Practice. Grow.
</p>
```

### Data Display

```jsx
<div className="mono-text text-primary-400 text-2xl font-semibold">
  $12,450.00
</div>
```

### Glass Card

```jsx
<div className="glass-card p-6">
  <h3 className="text-xl font-semibold mb-2">Portfolio Value</h3>
  <p className="mono-text text-3xl text-primary-400">$12,450.00</p>
</div>
```

### Primary Button

```jsx
<button className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-semibold shadow-primary hover:shadow-primary-lg transition-all">
  Get Started
</button>
```

---

## 🎨 Design Tokens

All design tokens are defined in `src/styles/design-system.css` and can be accessed via CSS variables:

- `--font-display` - Display font family
- `--font-primary` - Primary font family
- `--font-mono` - Monospace font family
- `--color-primary-*` - Primary color scale
- `--color-accent-*` - Accent color scale
- `--bg-base` - Base background color
- `--glass-*` - Glass component variables
- `--transition-*` - Transition timing
- `--shadow-*` - Shadow definitions

---

## 🔄 Migration Guide

### Updating Existing Components

1. **Typography**: Replace generic fonts with design system fonts
2. **Colors**: Update blue/purple to primary green/gold
3. **Backgrounds**: Add layered backgrounds with patterns
4. **Glass**: Use glass-card classes instead of plain cards
5. **Motion**: Add purposeful animations with proper timing

### Checklist

- [ ] Replace Inter/Arial/Roboto with Space Grotesk
- [ ] Replace blue (#3b82f6) with primary green (#22c55e)
- [ ] Remove purple/indigo gradients
- [ ] Add layered backgrounds
- [ ] Update glass components
- [ ] Add purposeful animations
- [ ] Test accessibility (contrast, focus states)
- [ ] Test reduced motion support

---

**Remember**: Design with conviction. Tell stories worth experiencing. Create interfaces that feel unmistakably human.

