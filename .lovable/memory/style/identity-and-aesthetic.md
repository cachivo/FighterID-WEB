---
name: identity-and-aesthetic
description: Core branding rules, color schemes and typography parameters for Fighter ID
type: design
---
# Fighter ID — Editorial Sports System (v2)

Replaces the previous Swiss-Brutalist (Clash + Satoshi + #CE1010) direction.

## Palette
- Background `#0A0A0A` (`--fid-bg`)
- Surface `#111111` (`--fid-surface`)
- Borders `rgba(255,255,255,0.06)` / hover `0.12`
- Text 100% / 50% / 30% opacity for hierarchy (no color variation)
- Crimson accent `#DC2626` (`--fid-crimson`), deep `#B91C1C`
- One crimson focal point per viewport section. No gradients on UI.

## Typography
- Geist Sans 400/600/700/800 for display + body (loaded via Google Fonts)
- Geist Mono 500/700 for labels, stats, nav (positive tracking 0.08em)
- Sentence case everywhere; ALL CAPS only for "FIGHTER ID" wordmark and mono labels
- Negative tracking on headings (-0.02em to -0.03em)

## Surfaces
- 2px border-radius universally (sharp, editorial)
- 1px hairline borders, no glassmorphism, no shadows
- 8px base spacing unit
- Icons allowed but sparingly; prefer typography + space

## Tokens
Use CSS vars `var(--fid-bg|surface|border|border-strong|text|text-muted|text-dim|crimson|crimson-deep|crimson-muted)` or shadcn semantic tokens (`bg-background`, `text-foreground`, `border-border`, `bg-primary`). HSL semantic tokens are tuned to match: `--primary: 0 72% 51%`.

## Landing scope helper
Wrap pages with `.fid-landing` class to apply editorial defaults, `.font-display` and `.font-mono-label` helpers, and entrance keyframes (`fid-slide-up`, `fid-underline-scale`, `fid-fade-up`).
