# Landing page: low-end mobile rescue + engagement uplift

**Audience**: Budget Android phones in Honduras (2–3 GB RAM, 3G/slow-4G, Adreno 5xx / Mali-G52). Goal: First Contentful Paint under 2s on a Moto E / Tecno Spark, smooth 60fps scroll, no functionality removed.

## Why the page is slow today (audit results)

1. **Image weight**: hero uses a 226 KB PNG; `public/lovable-uploads/` ships ~10 MB of unused logos; `src/assets/blue-arena.jpg` is 2.2 MB and `mma-cage-4k.png` 891 KB.
2. **`bg-fixed` + `blur-3xl`**: Ranking section uses `bg-fixed` (parallax) which forces full-screen repaints on every scroll frame. `UrbanDecorations` paints four 350–500 px `blur-3xl` orbs as `position: fixed` — catastrophic on mid-range GPUs.
3. **3 Ranking sections** render eagerly on `/` (UCC_MMA, FEDEHBOX, HHF_AMATEUR). Each: own data fetch, own background image, two realtime subscriptions, and a 4× layered "echo-stack" title.
4. **`Cache-Control: no-cache, no-store`** in `index.html` forces re-downloading every asset on each visit — disastrous on slow connections.
5. **Google Fonts**: 3 families with many weights, render-blocking.
6. **Eager realtime subscriptions** in below-fold sections fire WebSocket churn before the user scrolls.

## What we'll change (no features removed)

### 1. Asset diet
- Convert hero background `mma-cage-background.png` (226 KB) to **WebP + AVIF** at mobile/desktop sizes via `<picture>` (target ~25 KB mobile).
- Delete unused files in `public/lovable-uploads/` (the ~12 redundant `fighter-id-logo-*.png`, `mma-cage-4k.png`, `blue-arena.jpg`). Audit with `rg` to confirm zero references before deletion. Keep canonical logo only.
- Replace the Ranking section background image with a **CSS gradient** (no network cost, identical visual mood).
- Trim Google Fonts to **2 families, 3 weights total** (`Barlow Condensed 700` + `Inter 400/600`) with `&display=swap`.

### 2. Kill GPU-killers
- Remove `bg-fixed` from `Ranking.tsx` (replace with normal `bg-cover` or gradient).
- Replace `UrbanDecorations` blurred orbs with a single static **CSS radial-gradient** painted into `body::before`. Zero DOM nodes, zero blur cost.
- Drop the 4-layer **echo-stack title** in Ranking on mobile (`md:` breakpoint guard) — keep on desktop where it's free.

### 3. Smarter loading on `/`
- Render **only one Ranking section above the fold** (UCC_MMA). Mount the Boxeo block (FEDEHBOX + HHF_AMATEUR) behind a `<LazyMount>` using `IntersectionObserver` so its data fetch + realtime subs only fire when the user scrolls near it.
- Move the Boxeo "section divider" + both Boxeo Rankings into a single lazy chunk (`React.lazy` + `Suspense`).
- Gate `useRealtimeFighterUpdates` / `useRealtimeRankingUpdates` inside Ranking on an `inView` flag, so off-screen Rankings don't open WebSockets.
- Use `useDeviceCapability().isLowEnd` to **skip animations** (`animate-fade-in-up`, `hover:scale-105`, `animate-pulse-purple-neon`) and to render `compact` rankings with 3 entries instead of 5 on low-end.

### 4. Cache & network
- Remove the `no-cache / no-store / Expires: 0` meta tags from `index.html`. Vite already fingerprints built assets; these headers actively hurt repeat visits.
- Add `<link rel="preload" as="image" type="image/webp" href="...hero-mobile.webp" media="(max-width: 768px)">` for the hero.
- Add `fetchpriority="high"` to the hero `<img>` and `loading="lazy" decoding="async"` to all below-fold images.

### 5. Engagement uplift (the hero)
The current logged-out hero is a static title + stats chip + two buttons. Re-design as a **single-screen, 60fps, conversion-focused hero**:

```text
┌───────────────────────────────────────────┐
│  [LIVE pill or NEXT EVENT pill]           │  ← dynamic if data
│                                           │
│        FIGHTER  ID                        │  ← 1 paint, no echo on mobile
│        ───────                            │
│  Tu carrera de combate, certificada.      │  ← clearer value prop
│                                           │
│  ▶  Crea tu Fighter ID  (primary, big)    │  ← single dominant CTA
│     Iniciar sesión  ·  Explorar           │  ← secondary text-links
│                                           │
│  ── Trusted by ──                         │
│  [12k peleadores] [320 gimnasios]         │  ← live counters, animate once
│  [48 eventos]    [3 EN VIVO ●]            │
└───────────────────────────────────────────┘
```

Specifics:
- **One dominant CTA** (`Crea tu Fighter ID`) instead of two equal buttons → higher signup rate.
- **Live ticker pill** at top: shows EN VIVO event if any, otherwise next event countdown — instant proof of life.
- **Trust strip**: four real-time counters as a horizontal scroll on small screens (already a pattern in `QuickStats`), animated only once on entry, never on scroll.
- **Background**: WebP hero image + CSS gradient overlay; no fixed attachment.
- **Section below hero (logged-out)**: keep `QuickStats`, then a new compact **"Cómo funciona"** 3-step strip (Regístrate → Verifica → Compite) using emoji-free, Swiss-brutalist numbered blocks. No new images, pure CSS — adds engagement without payload.

### 6. Logged-in hero
Already lighter; apply the same image swap, drop the echo title, and reduce `min-h` by one step on mobile. No structural change.

## Files to touch

**Edit**
- `index.html` — remove no-cache metas, trim Google Fonts, add hero preload.
- `src/components/Hero.tsx` — restructure logged-out variant, single CTA, swap to `<picture>` with WebP/AVIF, drop echo on mobile, gate animations on `isLowEnd`.
- `src/components/UrbanDecorations.tsx` — replace fixed blur orbs with a single CSS gradient layer.
- `src/components/sections/Ranking.tsx` — remove `bg-fixed`, drop echo on mobile, gate realtime subscriptions on `inView`, accept `enabled` prop for lazy fetching.
- `src/pages/Index.tsx` — render only UCC_MMA Ranking eagerly; lazy-mount the Boxeo block via `IntersectionObserver`; add new `HowItWorks` strip for logged-out users.
- `src/index.css` — small additions for the new gradient backdrop and reduced-motion guards.

**New**
- `src/components/LazyMount.tsx` — tiny wrapper: render children only after element enters viewport (200 px rootMargin).
- `src/components/landing/HowItWorks.tsx` — 3-step Swiss-brutalist strip, pure CSS, ~2 KB.
- `src/assets/hero-cage.webp` and `hero-cage.avif` — generated from existing PNG (mobile + desktop sizes), via a one-shot script in `code--exec` using ImageMagick.

**Delete (after `rg` confirms no references)**
- Unused `public/lovable-uploads/fighter-id-logo-*` variants (~5 MB).
- `src/assets/blue-arena.jpg` (2.2 MB), `src/assets/mma-cage-4k.png` (891 KB) — verify unused first.

## Expected impact

| Metric | Before (est.) | After (target) |
|---|---|---|
| Landing transferred bytes (mobile, cold) | ~3.2 MB | ~600 KB |
| Hero image | 226 KB PNG | ~25 KB WebP |
| FCP on Moto E (3G) | ~5–7 s | ~1.8 s |
| Scroll jank (Ranking) | severe (`bg-fixed`+blur) | none |
| Realtime WebSockets at landing | 6 (3 sections × 2) | 2 (1 section) |
| Repeat-visit cache | broken (no-store) | full HTTP cache |

## Out of scope (kept intact)
- All routes, all navigation items, all Rankings (Boxeo simply mounts on scroll).
- `useRealTimeStats`, all data hooks, realtime functionality.
- Admin, license, and gym flows.
- Brand identity (Swiss-brutalist + UFC red preserved).

After approval I'll generate the WebP/AVIF assets, apply the edits, and verify with `browser--performance_profile` at 390×844 to confirm the FCP and scroll metrics.
