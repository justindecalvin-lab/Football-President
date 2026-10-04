# Product Engineering & Human UX Design Constitution (Must Follow Rules)

This document establishes the mandatory architectural, UX, UI, and code quality standards for the application. All future updates, features, and refactors MUST strictly follow these rules.

---

## 1. Visual & UI Craft
- **No AI Aesthetic Tropes**: Never default to dark slate themes filled with neon purple/cyan radial gradients, floating grid backdrops, or excessive glassmorphic blur effects unless explicitly directed by a distinct design token system.
- **Design Tokens Over Ad-Hoc Utility Chains**: Use a deliberate design scale for spacing (4px, 8px, 12px, 16px, 24px, 32px, 48px). Do not stack repetitive, conflicting utility classes (e.g., avoid `p-3 sm:p-4 md:p-3`).
- **Typography & Hierarchy**: Establish clean visual weight using 2–3 font sizes per view, strict line heights, and WCAG AA contrast (minimum 4.5:1 for body copy). Use `tabular-nums` for all financial figures, ratings, and statistics.
- **Iconography Over Emojis**: Never use emojis (🚀, ✨, ⚡, 💡, ⚽, 🏆, etc.) as interface assets, feature markers, or button accents. Use clean, monochromatic SVGs (Lucide icons) with explicit bounding boxes, matching stroke weights, and accessible labels.
- **Zero-Pill Static Metadata**: Informational labels, categories, and timestamps must be rendered as clean unboxed text separated by subtle typographic characters (`·`, `/`), reserving pill buttons strictly for interactive filter controls and tabs.

---

## 2. Complete State Design (Human UX)
Every view and interactive element must account for all lifecycle states—never design only the happy path:
- **Loading States**: Implement distinct skeleton screens matching exact layout dimensions or muted, disabled states with micro-spinners for active buttons. Prevent duplicate event triggers during submission.
- **Purposeful Empty States**: When lists, tables, or dashboards have zero items, display a purposeful empty state explaining what belongs there, why it is empty, and a direct call to action instead of collapsing borders or blank voids.
- **Actionable Error Handling**: Catch all runtime and network failures gracefully. Replace raw error strings (`Error: 500`, `undefined`) with human, actionable feedback with retry options.
- **Feedback & Confirmation**: Add subtle micro-feedback for user actions: toast notifications on save/delete/simulations, inline validation on form fields when blurred, and destructive confirmation modals before critical actions (e.g. releasing players, firing staff, terminating contracts).

---

## 3. Responsive & Interactive Integrity
- **Mobile-First Realism**: Ensure full usability down to 360px viewport widths. Do not hide primary navigation or allow text collisions, awkward wraps, or horizontal scrolling on small screens.
- **No Dead Elements**: If a button, link, filter, or pagination control is visible in the interface, it must be functional. If a feature or secondary page is not active, omit the element or use disabled tooltips rather than dummy `href="#"` links.
- **State Persistence**: Ensure URL query parameters or persistent storage maintain selected tabs, filters, pagination, and search terms so browser back/forward and refreshes retain user context.
- **Accessibility**: Include keyboard focus rings (`focus-visible:ring`), logical DOM tab ordering, and semantic HTML tags (`<nav>`, `<main>`, `<article>`, `<button type="button">` instead of clickable `<div>` elements).

---

## 4. Human Copywriting & Authentic Realism
- **Concrete, Plain English**: Eliminate buzzwords ("seamless next-generation orchestration"). Write interface copy that explains exact utility and realistic sports management terminology.
- **Realistic Data Integrity**: Never generate placeholder names like "Sarah J., Tech Enthusiast". Use context-accurate, diverse, authentic international names, realistic football clubs, real-world valuation curves, and natural edge-case contract clauses.
- **Production Metadata**: Maintain genuine page titles, favicon references, and proper Open Graph meta tags synced across `index.html` and `metadata.json`.

---

## 5. Code Quality & Architecture
- **Maintainable DOM Tree**: Avoid nesting unnecessary wrapper containers. Keep components modular, single-responsibility, and under 250 lines when feasible.
- **Zero Console Debt**: Ensure code renders without hydration mismatches, duplicate keys, memory leaks, or unhandled promise rejections.
- **Simulation Consistency**: Business logic, financial fair play (FFP), loan buybacks, disciplinary suspensions, transfer window timings, and fixture progressions must maintain absolute mathematical and algorithmic consistency.
