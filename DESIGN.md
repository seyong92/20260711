# Design System Strategy: The Modern Hanok Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Modern Hanok."** Much like traditional Korean architecture, this system prioritizes the "beauty of emptiness" (*Yeobaek-ui mi*). It is an editorial-first framework that treats digital space as a physical gallery. 

We move away from the rigid, boxed-in constraints of traditional web design, opting instead for a fluid, asymmetrical layout that feels curated rather than templated. By leveraging high-contrast typography scales and overlapping elements, we create a sense of romantic tension and premium intentionality. The goal is to make every scroll feel like turning the page of a high-end invitation or a luxury bridal lookbook.

## 2. Colors & Tonal Depth
This system eschews the clinical coldness of pure white for a palette of warm, "lived-in" neutrals. The colors are designed to feel like textured paper, silk ribbons, and natural stone.

*   **The "No-Line" Rule:** We do not use 1px solid borders to define sections. Period. Structure must be achieved through subtle shifts in background tones. For example, a section using `surface-container-low` (#f5f3ef) should sit against a `surface` (#fbf9f5) background to create a soft, organic boundary.
*   **Surface Hierarchy & Nesting:** Treat the UI as a series of stacked fine papers. Use `surface-container-lowest` (#ffffff) for the most prominent interactive elements (like an RSVP card) to make them "pop" against `surface-container` (#efeeea) backgrounds.
*   **The Glass & Gradient Rule:** For floating headers or navigation, use Glassmorphism. Apply a backdrop-blur (12px–20px) to a semi-transparent `surface` color. For call-to-action elements, use a subtle linear gradient from `primary` (#725a3a) to `primary-container` (#bfa27d) to add a metallic, silk-like luster.
*   **Signature Textures:** Incorporate the `secondary_container` (#f5dfc8) as a highlight tone for decorative accents, mimicking the warmth of traditional Korean *Hanji* paper.

## 3. Typography: The Editorial Voice
The typographic strategy relies on the interplay between the timeless `notoSerif` and the modern, architectural `manrope`.

*   **Display & Headlines (The Classic):** Use `display-lg` and `headline-lg` in `notoSerif` to anchor the page. These should be treated as hero elements. Don't be afraid of extreme letter-spacing or intentional overlapping with imagery to create an editorial "magazine" feel.
*   **Body & Labels (The Modern):** All functional information—dates, locations, and instructions—must use `manrope`. This ensures high legibility and a clean, contemporary counterpoint to the romantic serif headers.
*   **Hierarchy as Identity:** The massive scale jump from `display-lg` (3.5rem) to `body-md` (0.875rem) is intentional. This high-contrast scaling signals luxury and removes the "middle-ground" clutter found in standard web apps.

## 4. Elevation & Depth
In this design system, shadows are a last resort, not a default. We convey importance through **Tonal Layering.**

*   **The Layering Principle:** Depth is created by "nesting." A card component should not have a shadow; instead, it should be a `surface-container-lowest` (#ffffff) block sitting on a `surface-container-high` (#eae8e4) background.
*   **Ambient Shadows:** If an element must float (e.g., a modal or mobile menu), use an extra-diffused shadow: `box-shadow: 0 20px 50px rgba(27, 28, 26, 0.05)`. The shadow color is derived from `on-surface` (#1b1c1a) but at a very low opacity to mimic natural, ambient light.
*   **The "Ghost Border" Fallback:** If a container requires a definition for accessibility, use the `outline-variant` (#d0c5b8) at 20% opacity. This creates a "suggestion" of a border rather than a hard line.
*   **Glassmorphism:** Use semi-transparent layers for mobile navigation overlays, allowing the rich wedding imagery to bleed through the UI, maintaining a sense of place and atmosphere even when menus are open.

## 5. Components

### Buttons
*   **Primary:** A solid `primary` (#725a3a) fill with `on-primary` (#ffffff) text. Use the `md` (0.375rem) roundedness for a look that is soft but structured. 
*   **Secondary (The Editorial Button):** An `outline` (#7f766b) border at 30% opacity with `primary` text. No fill. This is used for less critical actions to keep the layout airy.
*   **Tertiary:** Purely text-based in `label-md`, using `primary` color with a 1px underline that only appears on hover.

### Cards & Lists (The "Paper" Rule)
*   **Cards:** Never use dividers. Separate content using the Spacing Scale (minimum 32px–48px of vertical whitespace). Use `surface-container-low` for card backgrounds to distinguish them from the main `surface`.
*   **Lists:** For wedding itineraries or gift registries, use asymmetrical grid layouts. Avoid standard vertical stacks; offset items slightly to create a more "scrapbook" or curated feel.

### Input Fields
*   **Text Inputs:** Use a "minimalist line" style. A single bottom border using `outline-variant` (#d0c5b8). On focus, the border transitions to `primary`. Labels should be in `label-sm` and always visible above the field to maintain an organized, premium look.

### Signature Component: The "Image Reveal"
*   Incorporate a component where high-quality wedding photography is framed in a `secondary_container` (#f5dfc8) border that is wider than the image itself, creating a "matted photograph" effect common in luxury galleries.

## 6. Do's and Don'ts

### Do:
*   **Embrace Whitespace:** If a section feels crowded, double the padding. This system breathes through its margins.
*   **Asymmetric Imagery:** Place images off-center. Let a `display-md` serif title overlap the corner of a photo.
*   **Tonal Transitions:** Use background color shifts to signal a change in content (e.g., moving from the "Ceremony" section to the "Registry" section).

### Don't:
*   **No Hard Shadows:** Never use high-contrast, dark drop shadows. They break the "soft paper" illusion.
*   **No Pure Black:** Never use #000000. Always use `on-background` (#1b1c1a) for text to maintain the warm, sophisticated tone.
*   **Avoid Grid Rigidity:** Don't force every element into a perfectly symmetrical column. The system should feel like it was hand-placed on the page.
*   **No Dividers:** Refrain from using horizontal rules (`<hr>`). If you need to separate content, use a background color block or increased whitespace.