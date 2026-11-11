# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/line-price-ai/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, follow the rules below.

---

**Project:** line-price-ai (ส.เจริญชัย รีไซเคิล วงษ์พาณิชย์ - ระบบเช็คราคา)
**Product:** Internal price lookup and admin app, opened mostly on phones from LINE (LIFF) and as a PWA
**Source of truth:** `src/app/globals.css`, `src/app/layout.tsx`, and the Tailwind classes already used in `src/`. This file documents the existing look; it is not a redesign.
**Design Dials:** Variance 2/10 (Minimal) | Motion 2/10 (Subtle) | Density 6/10 (Standard)

---

## Global Rules

### Stack

- Tailwind CSS v4 utility classes. No CSS-in-JS, no component library, no animation library.
- Icons: `lucide-react` only.
- Shared classes in `src/app/globals.css`: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.card`, `.input`. Reuse them before writing new utility strings.

### Color Palette (light mode only)

| Role | Tailwind | Hex | Usage |
|------|----------|-----|-------|
| Primary | `green-500` / hover `green-600` | `#22C55E` / `#16A34A` | Primary buttons, active states, `theme-color` |
| Primary text | `green-600`, `green-700` | `#16A34A`, `#15803D` | Links, highlighted values |
| Primary surface | `green-50`, `green-100` | `#F0FDF4`, `#DCFCE7` | Selected rows, success badges |
| Background | `gray-50` (`--background`) | `#F9FAFB` | Page background |
| Surface | `white` | `#FFFFFF` | Cards, modals, forms |
| Subtle surface | `gray-100`, `gray-200` | `#F3F4F6`, `#E5E7EB` | Secondary buttons, table headers, dividers |
| Border | `gray-200`, `gray-300` | `#E5E7EB`, `#D1D5DB` | Card and input borders |
| Text strong | `gray-900`, `gray-800` | `#111827`, `#1F2937` | Headings, key numbers |
| Text body | `gray-700`, `gray-600` | `#374151`, `#4B5563` | Body text |
| Text muted | `gray-500`, `gray-400` | `#6B7280`, `#9CA3AF` | Captions, timestamps, placeholders |
| Danger | `red-500` / hover `red-600`, text `red-600`/`red-700`, surface `red-50`/`red-100` | `#EF4444` | Delete, errors |
| Warning | `yellow-100` surface | `#FEF9C3` | Pending states |
| Info | `blue-100` surface, `blue-600` text | `#DBEAFE`, `#2563EB` | Informational badges |

Status meaning must not rely on color alone: pair the color with a label or icon.

### Typography

- **Font:** Noto Sans Thai via `next/font/google` (`--font-noto-sans-thai`), weights 300–700, subsets thai + latin. Do not add Latin-only fonts; they have no Thai glyphs.
- **Language:** UI copy is Thai (`<html lang="th">`).
- **Scale:** `text-sm` for tables and meta, `text-base` for body, `text-lg`–`text-2xl` with `font-semibold`/`font-bold` for headings.
- Prices and quantities: use `tabular-nums` when values are compared in columns.

### Shape and Depth

- Radius: `rounded-lg` by default, `rounded-xl` for large cards and modals, `rounded-full` for avatars, badges, and pill buttons.
- Shadow: `shadow-sm` on cards. Use `shadow-lg` only for modals and popovers.
- Borders over shadows: cards are `bg-white border border-gray-200 shadow-sm`.

### Spacing

Tailwind's default scale. Page padding `px-4` on mobile, `sm:px-6`, content max width `max-w-7xl mx-auto`. Card padding `p-4` on mobile, `sm:p-6`. Gaps between stacked cards `space-y-4`.

---

## Component Specs

Use the existing classes from `src/app/globals.css`:

```css
.btn-primary   { @apply bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors; }
.btn-secondary { @apply bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors; }
.btn-danger    { @apply bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors; }
.card          { @apply bg-white rounded-lg border border-gray-200 shadow-sm; }
.input         { @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent; }
```

- Buttons: add `disabled:opacity-50 disabled:cursor-not-allowed` when a button can be disabled. Destructive actions go through `ConfirmModal`.
- Modals: `fixed inset-0 bg-black/50` overlay, `bg-white rounded-xl` panel, max width `max-w-md` on mobile.
- Tables on mobile: switch to stacked cards below `sm`, or wrap in `overflow-x-auto`. Never cause page-level horizontal scroll.
- Images: reuse `ImageLightbox` / `ImageGallery` for price images.

---

## Interaction and Motion

- `transition-colors` (150–200ms) on hover and focus. No transform-based hover that shifts layout.
- No scroll-reveal or page-entry animation; this is a lookup tool and content must show immediately.
- Respect `prefers-reduced-motion` with `motion-reduce:transition-none` on any added animation.
- Touch targets at least 44px tall on mobile (LIFF is the main entry point).

---

## Anti-Patterns (Do NOT Use)

- Dark theme or a second color system. Extend the green and gray palette instead.
- New fonts, icon sets, or UI libraries.
- Emojis as icons. Use `lucide-react`.
- Low contrast text (`text-gray-400` on white for essential content). Keep 4.5:1 for body text.
- Missing visible focus. Keep the `focus:ring-2 focus:ring-green-500` pattern.
- Fixed elements covering content inside the LINE in-app browser.

---

## Pre-Delivery Checklist

- [ ] Uses existing classes from `globals.css` where they fit
- [ ] Colors from the palette above, light mode only
- [ ] Thai copy renders in Noto Sans Thai
- [ ] Icons from `lucide-react`, no emojis
- [ ] `cursor-pointer` and visible focus on all interactive elements
- [ ] Text contrast 4.5:1 minimum
- [ ] Touch targets at least 44px on mobile
- [ ] Responsive at 375px, 768px, 1024px, 1440px with no horizontal page scroll
- [ ] Works inside the LINE in-app browser (no content hidden behind fixed navbars)
