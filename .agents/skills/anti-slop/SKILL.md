---
name: anti-slop
description: >-
  Enforces the MyPhotoBut Dual-Theme Pop-Editorial & Tactile Studio design system
  from desain.png (#181818 Obsidian, #FFFFFF Crisp White, #D8FF54 Acid Lime,
  #C575F8 Electric Lavender) and "Parkinsans" typography while eliminating generic
  AI visual slop. Activate whenever designing, building, or reviewing UI components,
  Tailwind CSS v4 tokens, landing pages, studio controls, or Canvas photo strips.
---

# Anti-Slop UI & Design System Skill (`MyPhotoBut`)

This skill enforces strict visual, typographic, and interaction quality across `web/src/` so the application looks like an authentic, high-contrast studio product ([desain.png](file:///home/muliaandiki/project/myphotobut/desain.png)) rather than generic AI-generated SaaS slop.

---

## 1. The 5 Anti-Slop Commandments (What is Strictly Forbidden)

1. **NO Purple-to-Cyan / Indigo Neon Gradients**:
   - Never use `bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500` or floating blurred glow blobs (`blur-3xl opacity-20`).
   - All accent surfaces must be **solid, punchy color blocks**: Acid Lime (`bg-brand-lime` / `#D8FF54`), Electric Lavender (`bg-brand-lavender` / `#C575F8`), Crisp White (`bg-brand-white` / `#FFFFFF`), or Obsidian (`bg-brand-obsidian` / `#181818`).
2. **NO White Text on Acid Lime or Electric Lavender**:
   - Text and icons placed on `#D8FF54` (Acid Lime) or `#C575F8` (Electric Lavender) must **ALWAYS** use `#181818` (`text-brand-obsidian`) for razor-sharp WCAG contrast.
3. **NO Wrong Fonts (`Inter Tight` or System Arial Fallbacks)**:
   - Use **`"Parkinsans"`** (`font-sans` and `font-display`) for all headings, action cards, buttons, and photo strip captions.
   - Use **`"JetBrains Mono"`** with `font-tabular` (`tabular-nums`) for countdown overlays (`03`, `02`, `01`), share codes (`MORA-8X2A`), and date stamps (`2026.11.25 // 08:00`).
4. **NO Muddy Glassmorphism Soup**:
   - Do not stack translucent `bg-white/5 backdrop-blur-xl` cards inside other translucent cards. Use solid `--card`, `--card-contrast`, `--primary`, or `--accent` surfaces with crisp `1px` or `2px` borders.
5. **NO `ctx.filter` in Canvas 2D**:
   - Never use `ctx.filter = '...'` for webcam or photo strip filtering (broken on iOS Safari). Always use `applyPixelFilterToImageData()` (`getImageData` + `Uint8Array(256)` LUT).

---

## 2. Signature Component Patterns from `desain.png`

### A. Action Pill Cards (`rounded-[20px]`)
Every primary interactive card in `desain.png` follows this anatomy:
- **Outer Card**: `rounded-[20px] p-4 sm:p-5 transition-transform active:scale-[0.99]`
- **Color Variants**:
  - **Lime Primary**: `bg-brand-lime text-brand-obsidian`
  - **Lavender Accent**: `bg-brand-lavender text-brand-obsidian`
  - **Contrast Surface**: `bg-card-contrast text-card-contrast-foreground` (`#FFFFFF` card on `#181818` Dark Mode; `#181818` card on `#FFFFFF` Light Mode)
- **Left Circular Icon Badge**:
  ```tsx
  <span className="icon-badge-obsidian size-11 shrink-0">
    <Plus className="size-5" aria-hidden />
  </span>
  ```
- **Typography**:
  - Title: `font-display text-lg font-bold tracking-[-0.015em]`
  - Subtitle: `font-sans text-xs sm:text-sm opacity-80`

### B. Editorial Headline with Lavender Accent Word
Match the hero typography from `desain.png` (*"What do you want to do **today?**"*):
```tsx
<h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] leading-[1.05] sm:text-6xl">
  What do you want to capture{' '}
  <span className="font-bold italic text-brand-lavender">today?</span>
</h1>
```

### C. Tilted Sticker Callouts
Use `sticker-tilt-left` (`-2.5deg`) or `sticker-tilt-right` (`+2.5deg`) for playful stamp badges:
```tsx
<span className="sticker-tilt-right inline-block rounded-md bg-brand-lavender px-3 py-1.5 font-display text-xs font-extrabold tracking-wider text-brand-obsidian uppercase">
  PHOTOS MEET PEOPLE ☺
</span>
```

---

## 3. Dual-Theme Verification Checklist

Before completing any UI task, verify both themes:
- [ ] **Theme 1 — Light Mode (`:root`)**: Background is `#FFFFFF`, elevated panels are `#F4F4F6`, main text is `#181818`, primary CTA is `#D8FF54` with `#181818` text, accent badges are `#C575F8` with `#181818` text.
- [ ] **Theme 2 — Dark Mode (`.dark`)**: Background is `#181818`, elevated panels are `#222222`, main text is `#FFFFFF`, contrast action cards are `#FFFFFF` with `#181818` text, primary CTA is `#D8FF54` with `#181818` text.
- [ ] Run `cd web && bun run typecheck` to ensure zero TypeScript or JSX errors.
