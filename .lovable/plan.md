## Problem

Time Master is the primary feature for 90%+ of users (mobile-first), but on mobile it's buried inside the hamburger menu sheet. It does not appear on the visible top bar at 390px width, so users have to open the menu, scroll, and find it.

## Goal

Make Time Master a first-class, always-visible entry point on mobile, without breaking the desktop layout.

## Changes (frontend only — `src/components/Header.tsx`)

1. **Add a persistent Time Master icon button to the mobile header bar**
   - Place it in the right-side actions cluster, immediately left of the notification bell.
   - Visible only on small screens (`md:hidden`); desktop already shows it in the nav.
   - Uses the `Timer` icon (already imported) with `min-h-[44px] min-w-[44px] touch-manipulation` for tap target.
   - Accent color (`text-primary`) so it stands out as the hero action.
   - `aria-label="Time Master"` for accessibility.
   - Links to `/time-master`.

2. **Promote Time Master to the top of the mobile sheet menu**
   - Reorder `navigationItems` so Time Master is the first item (currently 5th).
   - Add a subtle highlight (border-accent / bg-primary/5) to the Time Master row in the sheet so it reads as the primary action.

3. **Add Time Master to the medium-screen (md–lg) condensed nav**
   - That breakpoint currently omits it; add a compact button with the `Timer` icon so tablet users also see it.

## Out of scope

- No changes to `/time-master` page content, routing, business logic, or any other component.
- No design-system token changes.

## Verification

- Open preview at 390×844: Timer icon visible in header bar next to bell; tapping it routes to `/time-master`.
- Open hamburger sheet: Time Master is the first item, visually highlighted.
- Resize to 768–1024: condensed nav shows Time Master.
- Desktop (≥1024): unchanged.
