# Time Tracker UI Guide

Design system inspired by modern finance/productivity apps (e.g. Findex). Use this document as reference when building or updating UI components.

---

## Color Palette

### Light Theme

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | #f5f5f7 | Page background |
| `--bg-elevated` | #ffffff | Cards, elevated surfaces |
| `--bg-card` | #f0f0f2 | Secondary cards, inputs |
| `--text` | #1a1a1a | Primary text |
| `--text-muted` | #6b7280 | Secondary text, labels |
| `--accent` | #0d9488 | Primary actions, links |
| `--accent-hover` | #0f766e | Hover state |
| `--success` | #059669 | Positive values |
| `--danger` | #dc2626 | Destructive actions, negative |
| `--hero-bg` | linear-gradient(135deg, #0d9488 0%, #0ea5a2 50%, #a78bfa 100%) | Hero cards |

### Dark Theme (Findex-inspired)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | #0f0f0f | Page background |
| `--bg-elevated` | #1a1a1a | Cards, elevated surfaces |
| `--bg-card` | #252525 | Secondary cards, inputs |
| `--text` | #fafafa | Primary text |
| `--text-muted` | #9ca3af | Secondary text |
| `--accent` | #14b8a6 | Primary actions |
| `--accent-hover` | #2dd4bf | Hover state |
| `--success` | #22c55e | Positive values |
| `--danger` | #ef4444 | Destructive actions |
| `--hero-bg` | linear-gradient(135deg, #0d9488 0%, #7c3aed 100%) | Hero cards |

---

## Typography

| Level | Size | Weight | Use |
|-------|------|--------|-----|
| Display | 2.5rem–3rem | 700–800 | Timer, total hours |
| Section | 1.25rem | 600 | Page titles |
| Card title | 1rem | 500 | Card headers |
| Body | 0.875rem | 400 | Default text |
| Muted | 0.8125rem | 400 | Labels, metadata |

**Font:** Sora (already loaded)

---

## Component Patterns

### Hero Card

Full-width card for key metrics (timer, total hours).

- Background: `--hero-bg` gradient
- Text: White or high-contrast
- Radius: 20–24px
- Padding: 1.5–2rem
- Structure: Small label → Large value → Optional metadata

### Content Card

Standard card for lists and forms.

- Background: `--bg-elevated`
- Border: `--border-subtle` (light) or none (dark)
- Radius: 16px
- Shadow: `--shadow-sm`

### List Item

Compact row for projects, logs, tasks.

- Color dot or icon on left
- Title + optional metadata
- Actions on right
- Padding: 12–16px vertical

### Buttons

- **Primary:** Solid accent, white text
- **Secondary:** Muted fill or outline
- **Ghost:** Transparent, accent on hover
- **Danger:** Red for destructive actions
- Radius: 12px

---

## Spacing

4px base scale: 4, 8, 12, 16, 20, 24, 32, 40px

---

## Radius

- Cards: 16–20px
- Buttons: 12px
- Inputs: 8–10px
- Small elements: 6–7px
