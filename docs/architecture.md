# Companion architecture

The companion is a Hugo static site with vanilla JavaScript and SCSS (processed via Hugo Pipes `toCSS`). It has no external runtime dependencies, backend, account system, or cloud synchronization. The current product is a level-5 character reference and manual session tracker; it is not a complete rules engine. An offline service worker and Web App Manifest (`static/manifest.webmanifest`) cache the static shell for uninterrupted tabletop play when offline or between iPad WebKit process purges. `assets/sw.js` is rendered by Hugo with the build's fingerprinted asset list, precaches it on install, and names its cache from those URLs, so each deploy replaces the previous cache.

## Authority and data flow

```text
../kief/current character documents ─┐
../kief/rules-arbitration.md ─────────┼─ sync_content.py ─ content/*.md
../kief/spell-reference.json ─────────┘                  data/spells.json
                                                       data/sources.json
                                                       docs/rules-arbitration.md
content/plays/{kief,mr-big}/*.md ─ site-authored tactics ─┐
layouts/ + assets/ + imported data ─────────────────────┴─ Hugo → static site
browser localStorage + IndexedDB mirror ↔ validated session state ↔ dashboard controls
```

Nine current Markdown records and one spell-reference JSON file are fingerprinted. Rules arbitration is also mirrored byte-for-byte into this directory. Edit shared character/rules material in `../kief`, then import; do not fix only the generated copies. Historical level-7 records, exports, and gear are excluded.

The importer merges the character's eight cantrips and nine preparations with six curated subclass spells and two origin spells. It requires all 25 names to match the detailed shared spell references, rejects missing fields and duplicate names, and checks the current HP, AC, save/attack, slots/SP, Constitution save, speed, Innate Sorcery, and restoration expectations before writing. `--check` compares every expected output without writing. This remains a curated import, not an arbitrary character-sheet parser.

The dashboard limits and labels remain explicit in `assets/state.js` and `layouts/index.html`. A changed build deliberately requires reviewing those consumers. Source fingerprints alone do not prove every tactical claim correct. Site-authored plays must be reviewed when character choices or table rulings change.

## Runtime state

`assets/state.js` exports the same pure API to browsers and Node tests. The persisted key remains `kief-firelight.level5.session.v1`; existing valid saves remain compatible. State includes HP 0–47, SP 0–5, daily uses, Hit Dice, fixed 4/3/2 slot booleans, concentration, Innate effect, Reaction, restoration-used flag, turn context (`turnActive`), Action/Bonus Action readiness (`actionReady`, `bonusActionReady`), turn slot spending (`slotSpentThisTurn`), turn slot persistence (`kiefSlotSpent`), and a save timestamp.

- `fresh`, `normalize`, `adjust`, and `restore` create, validate, or adjust bounded state without DOM access.
- `startTurn` and `endTurn` advance turns, restoring Action, Bonus Action, Reaction, and clearing on-turn slot limits while preserving Kief's slot expenditure state.
- `damage` uses the entered final damage, rounds half damage down, and caps concentration DC at 30. At 0 HP it clears concentration. Resolve temporary HP, resistances, separate damage sources, massive damage, and death saves at the table; they are not modeled.
- `guidance` warns about unavailable third-level slots, Careful SP, spent Reactions, ally-mobility slots, concentration replacement, and 0 HP. It does not select targets or enforce casting legality.
- `previewCast` and `cast` calculate and execute atomic casting transactions: validating slots, Metamagic SP, free uses, concentration replacement, Reaction consumption, and the 2024 one-slot-per-turn rule across all turns. Table overrides allow explicit bypass of resource constraints while strictly separating non-bypassable structural validation. Override consent is automatically cleared when casting choices change or controls become hidden, and open previews refresh on cross-tab storage events with renewed consent required when restrictions are introduced.
- `backupUnreadable` is the small storage adapter: it preserves exact unreadable bytes under a unique recovery key before an explicitly approved replacement. A failed backup blocks replacement.
- `validateBackup` parses and validates both raw state objects and complete export backup envelopes, guaranteeing schema compatibility before restoration.

`assets/storage.js` provides zero-dependency storage mirroring, persistent storage requests, and snapshot management:
- Mirrored persistence: every change commits synchronously to `localStorage` and asynchronously to IndexedDB (`kief-companion-v1`, `session` store). If `localStorage` is unreadable or empty on startup (and no edits have occurred since load), the app rescues and restores state from IndexedDB. This protects against single-store corruption, transient storage locks, or isolated clearing, but WebKit eviction normally deletes an origin's data as a whole. Mirroring is not an independent defense against whole-origin eviction.
- WebKit eviction defense: requests non-evictable storage classification via `navigator.storage.persist()`. When granted, persistent storage prevents browser-driven eviction under device storage pressure.
- Rolling snapshots: captures up to 10 recent historical states (validated with `normalize` and rendered as text before display, since same-origin pages can write the store) with timestamps and descriptions in IndexedDB (`snapshots` store) for 1-click recovery from accidental table resets or mistaps.
- Persistent undo: writes undo state durably to storage so one-step undo survives page reloads.

`assets/app.js` owns DOM events, persistence, Table Mode (Screen Wake Lock), lifecycle flushes, and dialogs. A normal edit snapshots preceding state. Rest Undo writes previous counters durably; it never reinstates a stale “do not save” flag after recovery. Reload and external storage events update the view. Valid same-origin saves update other tabs; removed or malformed external saves put the current tab into visibly temporary tracking.

Every change saves synchronously, so lifecycle guards on `visibilitychange` (hidden) and `pagehide` only commit an HP edit still focused in its input; they never re-save unchanged state or add snapshots. When the page becomes visible again it resyncs from `localStorage` through the same path as cross-tab `storage` events, which also invalidates in-memory Undo. Table mode (`navigator.wakeLock`) keeps the iPad screen awake when supported and confirmed, and reports unavailable/failed when unsupported or denied. Recover save preserves unreadable data and saves visible counters without a rest. Export tracking produces a downloadable or copyable JSON backup; an export kept outside the browser remains the ultimate recovery mechanism if an entire origin's storage is cleared. Import tracking parses JSON files or pasted text, validates counters, displays a preview, and requires successful archival of existing counters before applying. An archival failure blocks replacement.

## Reference cards and discovery

Internal play and spell links retain real URLs. JavaScript intercepts eligible links and fetches/caches parsed pages. Each opening clones the cached nodes instead of moving them. Opens are serialized to avoid duplicate dialogs from overlapping fetches. Unique title IDs label each native dialog. A link to an already-open card closes cards above it; failed fetches and unsupported dialogs fall back to page navigation.

Cards retain native Escape/close behavior. Browser Back still navigates page history; it is not a modal-stack control. Deep stacks and full screen-reader behavior need broader acceptance testing.

The play directory searches titles, summaries, groups, IDs, and rendered body text. Spell search includes purpose, effects, components, and cautions. Query whitespace is normalized. First italic spell mentions are linked at build time, allowing whitespace across lines and apostrophe variants. Spell backlinks use the same matching pattern. This is formatting-dependent: unitalicized mentions are not guaranteed links or backlinks.

The dashboard has sticky HP/concentration/Reaction shortcuts. Mobile presents resources before recommendations, compresses the decorative hero, and enlarges frequently used controls. Shortcuts navigate to controls; they do not spend resources.

## Reading layouts and tabletop accessibility

- **Candy Land Theme ("Sugar & Shadow") & Dark Fairytale Styling (`assets/candyland.css`):**
  - An overlay styling layer loaded alongside `style.scss`, minified and fingerprinted via Hugo Pipes.
  - Transforms the visual aesthetic from forest emerald to an atmospheric Candy Land fairytale: deep obsidian plum (`#100d17`), burnt caramel/molasses (`#cf7a3e`), frosted mint (`#5ce1b6`), cotton candy rose (`#e493b6`), and spun-sugar highlights.
  - Features radiant card borders, candy-cane decorative accents, deep shadow vignettes, and atmospheric night landscape background artwork (`static/pages/candyland-night.webp`).
  - Precached in the Service Worker (`sw.js`) alongside core application shell assets for tabletop offline resilience.

- **Full-Viewport Modal Windows (20px Margins):** Modal `<dialog class="card-modal">` containers expand to fill the full screen leaving exactly 20px margins (`width: calc(100vw - 40px - var(--depth)*16px)`, `height: calc(100dvh - 40px - var(--depth)*16px)` on desktop, 12px on mobile). A transparent header with a floating top-right `×` close button replaces the old gray top bar, integrating cleanly over the artwork without obscuring card contents.
- **Play Dashboards:** `layouts/plays/single.html` parses each play's four canonical H3 sections (`when-to-use-it`, `mechanics`, `at-the-table`, `the-rule-underneath`) into a container-queried dashboard (`.play-wrap`, `.play-dash`). At `>= 860px`, the pitch displays full width (`.play-lead`), action mechanics occupy the primary panel (`.play-main`), and table dialogue (`.play-script`), detected spell mini-cards (`.spell-mini`), foldable underlying rules (`<details class="fold">`), and cross-references occupy the sidebar (`.play-side`). In the expanded modal window, plays render natively in this rich multi-column dashboard.
- **Designer D&D 5.5e Spellbook Modal Cards:** `layouts/spellbook/list.html` formats each spell for both directory scanning and full-dashboard modal review (`.spell-modal-layout`):
  - **Hero Banner:** Spell glyph, `• SPELLS` eyebrow, large serif title, pitch line, badge row (Level, School, amber-tinted Reaction/Action, Role, Concentration), and right-hand italic flavor quote with a golden diamond divider (`--- ◇ ---`).
  - **Left Column:** *Spell Description* with typography and "ⓘ Note" callout box (e.g. Subtle Spell / Reaction reminders); *Quick Use* 4-tile grid (**Add to Spellbook / Cast**, **Copy Text**, **Share Link**, **Favorite / In Plays**).
  - **Right Column:** *At a Glance* spec table (Cast, Range, Duration, Components, Roll); *Effect & Scaling* card; *Target* card; *Referenced Plays* card.
  - **Footer:** 🎲 D&D 5.5e Spell Reference + external "View full rules ↗" link.
- **Unique Spell WebP Artwork & Faint Card Covers:**
  - `static/spells/<slug>.webp`: Bespoke 1376×768 compressed WebP artwork (~50–160 KB) for all 25 spells in Kief's spellbook.
  - `assets/app.js`: Injects `--spell-bg: url('<path>')` dynamically on open, rendering each spell's artwork beneath a dark emerald radial vignette with glassmorphism panels.
  - `layouts/spellbook/list.html` & `assets/style.scss`: Directory cards (`.card-grid .spell-card`) receive `--spell-bg` as a faint, atmospheric background cover (`radial-gradient(..., var(--spell-bg))`) that subtly illuminates the top-right corner while maintaining 100% text contrast across glance stats and cautions.
- **Main Page Atmospheric Background Covers:**
  - `static/pages/<page>.webp`: Dedicated high-resolution WebP landscapes (~49–96 KB) for all primary destinations: `dashboard.webp` (hearth & embers), `spellbook.webp` (divination runes), `plays.webp` (tactical sorcery), `familiar.webp` (pastoral glade), `rules.webp` (archival ledger), and `character.webp` (gnomish contemplation & dragon scales).
  - `layouts/_default/baseof.html`: Detects page context and applies semantic `page-<name>` classes to `<body>`.
  - `assets/style.scss`: Sets each page background on `body.page-<name> .workspace` beneath a deep radial vignette, with frosted glassmorphism across the topbar (`backdrop-filter: blur(8px)`).
- **Reference Dashboards & TOC:** `layouts/_default/single.html` automatically transforms reference documents with 4+ `<h2>` sections into a dashboard grid (`.ref-dash`) with an "ON THIS PAGE" chip navigation bar (`.toc`) generated from Hugo's Table of Contents.
- **Motor Accessibility & 44px Tap Targets:** Calibrated for tabletop stability and motor impairments (including Multiple Sclerosis), all interactive elements (`button`, `summary`, `select`, `input`, `.toggle`, navigation links, chips, `.setup-link`, `.spell-mini`, `.text-link`, `.card-links a`, `.quick-tile`) enforce a strict `min-height: 44px` (and `min-width: 44px` for buttons). Play directory cards stretch `.card-link::after` over the entire card area so the whole panel serves as an easy-to-hit tap target. Inline prose links utilize `padding-block: 10px` to expand touch targets without reflowing body text.

## Verification and delivery

Focused Node tests exercise the state model and tracker event wiring using a small DOM adapter. Python importer contract tests use temporary fixtures from checked-in data, so CI does not require the sibling repository. Browser checks remain necessary for dialogs, layout, focus, and downloads.

Hugo is pinned to 0.166.0 in GitHub Actions. CI builds the site, runs the focused tests, and checks links/assets. The sibling-aware `sync_content.py --check` is a local gate because CI checks out only this repository. See `../VERIFICATION.md` for evidence and limits.

A push to `main` triggers the existing deployment workflow. Local build success is not a deployment, a live-sheet update, a DM ruling, or proof of all-device accessibility.
