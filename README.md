# Mir4 Tools — Magic Stones

Client-side web app to manage your Mir4 magic stone **sets**, register each
stone (attribute, rarity, tier, enhancement and enchantments) and **filter by
enchantment** to compare values across stones and find which one to replace.

- 100% client-side (Vite + React + Tailwind v4). **No backend, no login.**
- Data is stored only in the browser's `localStorage` (private to each user).
- **Export/Import** sets to a JSON file for backup or moving between devices.

## Development

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## Deploy (Vercel)

Vercel auto-detects Vite. Settings if asked:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

The app uses `HashRouter`, so deep links work without any rewrite rules.
