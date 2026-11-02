# Fancrd

Clickable front end for Stage 1 (NFL, CFB, MLB). Served by GitHub Pages at the root of
fancrd.com. `preview/` only redirects old links to the homepage.

**Preview only:** sample data, and accounts, logs and photos are saved in the visitor's
own browser (localStorage). Nothing is sent to a server and passwords are never stored.

## Run locally

From the repo root:

```bash
python -m http.server 8123
```

Then open http://localhost:8123/

## Layout

| Path | What it is |
|---|---|
| `index.html` | Page shell, header, fonts, Leaflet map library |
| `css/styles.css` | All styling (brand colors are the `:root` variables at the top) |
| `js/main.js` | Router (`#/profile`, `#/venues`, …), header, search |
| `js/store.js` | Data layer: swap these functions for real API calls when the backend exists |
| `js/badges-engine.js` | Rules that decide when each badge is earned |
| `js/data/badges.js` | Generated from `Badges (cleaned).xlsx` |
| `js/data/venues.js` | Teams + venues (coordinates, capacity, surface are approximate) |
| `js/data/sample.js` | Sample fan, logs, friends, username blocklist |
| `js/views/` | One file per page |
| `js/components/` | Fancrd card, ticket stub, map, shared UI helpers |

## Before launch

- Replace sample data with a real sports data feed and verify venue details
- Add the backend (auth + database), e.g. Supabase or Firebase
- Photo moderation, a real username blocklist, and a hosted map tile provider
- Team logos need league licensing; the preview uses initials in team colors
