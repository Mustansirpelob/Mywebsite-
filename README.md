# Zenith Lab Portfolio

Expanded multi-page premium portfolio with a sky-and-clouds visual system.

## Pages
- `index.html` — portfolio landing page with case studies, stack, and beyond-the-code section.
- `shop.html` — digital assets shop populated from JSON.
- `chat.html` — lightweight client chat workspace.

## Data & Database
- `data/products.json` contains shop inventory for frontend rendering.
- `database/schema.sql` provides SQL schema for users, shop items, orders, and chat messages.

## Run locally
```bash
python3 -m http.server 4173
```
Then open:
- `http://localhost:4173/index.html`
- `http://localhost:4173/shop.html`
- `http://localhost:4173/chat.html`

## Initialize SQLite DB (optional)
```bash
sqlite3 database/zenithlab.db < database/schema.sql
```
