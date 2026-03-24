# Design System: The Culinary Ether

## 1. Overview & Creative North Star
**Creative North Star: "The Intelligent Sommelier"**

This design system rejects the "SaaS-dashboard" aesthetic in favor of a high-end editorial experience. It is designed to feel like a digital concierge—sophisticated, anticipatory, and invisible until needed. By leveraging **Spatial UI** and **Bento Box layouts**, we organize complex AI data into digestible, tactile "plates." 

We break the "template" look through **intentional asymmetry**. Primary content shouldn't always sit on a rigid center axis; instead, use the `24 (8.5rem)` spacing tokens to create dramatic gutters that allow "blurred culinary backgrounds" to breathe through the interface. The goal is a frictionless transition between the high-glamour guest experience and the utilitarian precision required for the Kitchen Display System (KDS).

---

## 2. Colors & Surface Philosophy

### The Palette
The color system is anchored in `surface (#0c0e11)` for depth, punctuated by high-energy dynamic accents.
- **Primary (Saffron):** `primary (#ffab69)` — Used for critical calls to action and "active" culinary states.
- **Secondary (Mint):** `secondary (#73d964)` — Used for AI-driven insights, "ready" states, and freshness indicators.
- **Tertiary (Coral):** `tertiary (#ff987e)` — Reserved for subtle highlights and secondary dietary alerts.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. 
Structure is defined by:
1.  **Tonal Shifts:** Placing a `surface-container-high (#1d2024)` card against a `surface-container-low (#111417)` background.
2.  **Negative Space:** Utilizing the `8 (2.75rem)` or `10 (3.5rem)` spacing tokens to create "invisible" boundaries.

### Glass & Gradient Rule
To achieve the 2026 Spatial look, floating panels (modals, dropdowns, or KDS alerts) must use **Glassmorphism**. 
- **Recipe:** Apply `surface_container` at 60% opacity with a `24px` backdrop blur. 
- **Signature Polish:** Use a linear gradient on Primary CTAs transitioning from `primary (#ffab69)` to `primary_container (#dd8e4f)` at a 135-degree angle to provide "soul" and a tactile, sun-drenched feel.

---

## 3. Typography: Editorial Authority
We utilize a triple-font pairing to distinguish between brand storytelling, navigation, and utility.

*   **Display & Headlines (Epilogue):** An authoritative, wide-set sans-serif. Use `display-lg (3.5rem)` for hero AI recommendations. The high-contrast scale between `display-lg` and `body-md` creates an editorial, premium magazine feel.
*   **Titles & Body (Manrope):** The workhorse. `title-lg (1.375rem)` should be used for menu items. Manrope’s modern geometry ensures legibility in low-light restaurant environments.
*   **Labels (Epilogue):** Specialized for the KDS and technical metadata. `label-sm (0.6875rem)` provides ultra-crisp utility for timestamps and "Table ID" markers.

---

## 4. Elevation & Depth: Spatial Layering

### The Layering Principle
Forget traditional drop shadows. Depth is achieved by "stacking" the surface tiers:
1.  **Base:** `surface` (#0c0e11)
2.  **Secondary Content:** `surface-container-low`
3.  **Active Cards/Bento Cells:** `surface-container-high`
4.  **Interactive Overlays:** `surface-bright`

### Ambient Shadows
Where elements must "float" (e.g., a floating action button for the sommelier), use an **Ambient Shadow**:
- **X: 0, Y: 12, Blur: 40px**
- **Color:** `on_surface` (#f9f9fd) at **4% opacity**. This mimics the soft glow of a smart-kitchen environment rather than a harsh artificial shadow.

### The "Ghost Border" Fallback
If WCAG 2.2 contrast requirements demand a container edge in high-glare environments, use a **Ghost Border**: `outline-variant` (#46484b) at **15% opacity**.

---

## 5. Components & Bento Logic

### Bento Cards & Lists
Cards are the primary unit of the "Bento Box" layout. 
- **Styling:** Use `roundedness.lg (1rem)` for all container corners. 
- **Spacing:** Forbid divider lines. Separate items in a guest's order list using a background shift from `surface-container-low` to `surface-container-highest` on hover.

### Buttons (The Kinetic Trigger)
- **Primary:** `primary` background with `on_primary` text. Use `roundedness.full` for a "pill" look that feels frictionless.
- **Glass Secondary:** A `surface-variant` background at 20% opacity with a `16px` backdrop blur. This allows culinary photography to peek through the button.

### KDS-Specific Inputs
- **Frictionless Entry:** Text inputs use `surface_container_lowest` (#000000) for deep contrast. The "Active" state is indicated by a 2px `secondary (mint)` bottom-glow—never a full-box stroke.

### Specialized Component: The "AI Pulse" Chip
A custom chip for AI-driven dish suggestions. 
- **Style:** `secondary_container` background with a subtle pulse animation using `secondary` at 30% opacity.

---

## 6. Do’s and Don'ts

### Do:
- **Do** use `roundedness.xl` for large Bento hero sections to emphasize the "Spatial" feel.
- **Do** lean into fluid typography; allow `display-md` to shrink gracefully on smaller KDS tablets without losing its editorial weight.
- **Do** use `on_surface_variant` (#aaabaf) for de-emphasized metadata (like "average cook time").

### Don't:
- **Don't** use 100% black (#000000) for text. Use `on_surface` (#f9f9fd) to prevent "visual vibration" on OLED screens.
- **Don't** use standard "Information Blue." Use `secondary (mint)` for all positive AI feedback and system status updates.
- **Don't** nest more than three levels of surface containers. If you need more depth, use a backdrop blur overlay.

### Accessibility Note
This system is **WCAG 2.2 Compliant**. While we use glassmorphism, ensure that any text sitting on a blurred background maintains a 4.5:1 contrast ratio by using the `surface_bright` or `on_surface` tokens effectively. Use the `error (#ff7351)` token sparingly but boldly for immediate "Kitchen Alerts."