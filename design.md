# Margin — Library design

Source of truth for Library language and look. Prefer a small vocabulary and quiet chrome.

Visual base: [Minimal Neutral (tweakcn)](https://tweakcn.com/themes/cmho4nr9l000h04l1gu419ckw) — monochrome, flat, `1rem` radius, DM Sans.

## Nouns

| Keep        | Prefer over               | Notes              |
| ----------- | ------------------------- | ------------------ |
| **Margin**  | —                         | Brand only         |
| **Library** | reading space / workspace | Primary place name |
| **Page**    | document / doc            | User-facing unit   |
| **Folder**  | —                         | Organization       |
| **Theme**   | —                         | Settings link      |
| **Search**  | —                         | Find pages         |

## Verbs

| Keep       | Prefer over                   |
| ---------- | ----------------------------- |
| **New**    | long marketing CTAs           |
| **Import** | Import a markdown file…       |
| **Export** | Export ZIP…                   |
| **Add**    | Add link                      |
| **Search** | long search placeholders      |
| **Listen** | reader only; not Library hero |

## Copy map

| Location        | Label                                     |
| --------------- | ----------------------------------------- |
| Hero badge      | Margin                                    |
| Hero h1         | Library                                   |
| Hero p          | Your pages on this device.                |
| Brand small     | Library                                   |
| Privacy         | On this device / Stored in this browser.  |
| Section         | Pages + `{n} pages`                       |
| Search          | Search                                    |
| Export / Import | Export / Import                           |
| New card        | New page / Start writing / Add to library |
| Link import     | Paste link / Add                          |
| Folder create   | Modal: Name + Cancel / Create             |

## Visual rules

- Minimal Neutral tokens with soft ambient library gradients
- DM Sans for UI; Lucide icons only
- Light rail sidebar; catalog-first layout
- Book-cover page cards: spine, monogram, cover title, snippet, progress
- Quiet motion: card enter fade, cover lift on hover
- Folder create: modal with name field + Cancel / Create

## Mobile

- Catalog first: pages list is the primary message when docs exist
- Header: brand + New page + More (Themes / Export / Import); search below
- Hide Welcome, Paste link, and dashed New page card when the library has docs
- Folder rail: chips + icon-only New folder (no “Folders” label)
- Empty library keeps Welcome + Paste link + dashed New page card

## Tokens (Margin Light)

Mapped from tweakcn Minimal Neutral light:

| Role           | Value              |
| -------------- | ------------------ |
| Background     | `oklch(1 0 0)`     |
| Surface / card | `oklch(0.995 0 0)` |
| Ink            | `oklch(0.145 0 0)` |
| Primary / CTA  | `oklch(0.205 0 0)` |
| Sidebar        | `oklch(0.985 0 0)` |
| Radius         | `1rem`             |
| Font           | DM Sans            |
