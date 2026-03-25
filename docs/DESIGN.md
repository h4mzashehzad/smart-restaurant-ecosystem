# Design System: Smart Restaurant Ecosystem

## 1. Overview
This is a web application explicitly optimized for mobile screens. The design is structured to handle fast-paced restaurant environments with minimal visual clutter. The theme relies heavily on generous negative space, intentional asymmetry, and controlled density rather than crowded, generic dashboard templates.

## 2. Aesthetics & Theme
- **Theme**: Pure Light Mode (Dark mode is strictly avoided).
- **Core Principles**: Minimal, clean, and highly structured layouts. Deep contrast is used sparingly. Space and typography lead the hierarchy.
- **Primary Accent**: Orange (`#f97316`). Focus on high-impact moments—the orange accent serves as the sole kinetic trigger across the app. Solid, dominant colors with sharp accents outperform timid palettes.
- **Background Details**: Employ incredibly subtle layered transparencies, dramatic soft shadows, or contextual textures on pure white cards, placed against a faint gray canvas (`#f9fafb`).

## 3. Typography & Next.js Optimization
- **Font Optimization (`next/font`)**: Exclusively use `next/font/google` at the root layout level, injecting fonts via CSS variables to guarantee zero layout shift. Avoid overused defaults like Inter, Roboto, or Arial.
- **Display Font**: *Outfit* (or similar characterful geometry). Use for striking, distinctive headings that elevate the brand's aesthetic.
- **Body Font**: *Plus Jakarta Sans*. Refined, modern, and highly legible for menus, labels, and paragraph copy in low-contrast mobile environments.

## 4. Components & Layout
- **Containers & Mobile-First**: Center all core views using `max-w-md` wrappers on larger screens to simulate and optimize for the mobile experience.
- **Inputs & Fields**: Touch-optimized (`py-3.5`). Clean borders (`border-gray-200`). On active states, borders transition to the Orange accent cleanly with a subtle ring. 
- **Buttons**: Substantially padded (`py-3.5`), rounded corners (`rounded-2xl`). Primary buttons use solid Orange backgrounds with white text and a soft ambient shadow (`shadow-orange-500/25`).
- **Motion**: Prioritize one well-orchestrated page load with staggered reveals using CSS `animation-delay` over cluttered micro-interactions.

## 5. Next.js Best Practices
- **Images**: All restaurant imagery must use `next/image` to prevent layout shift. Always leverage the `sizes` attribute (e.g., `sizes="(max-width: 768px) 100vw, 33vw"`), `priority` for above-the-fold hero images, and blurred placeholders for heavy culinary photos.
- **Boundaries**: Server components are the default. Keep client boundaries (`'use client'`) confined purely to interactive elements (forms, inputs, counters) to dodge serialization hydration errors and improve bundling.