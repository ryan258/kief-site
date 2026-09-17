# Kief Firelight — Field Companion

A standalone Hugo dashboard for the current **Forest Gnome / Draconic Sorcerer 5 / Sage** build, using the tabletop companion approach of `../joe-site`. The interface is built around helping the party, keeping concentration, and using scarce resources deliberately.

## Run locally

Requires Hugo 0.158+ (verified with 0.166.0). No npm packages, external fonts, CDNs, or build-time network access are needed. Python 3 is used only for source imports and link checks; Node is used only for the focused state tests.

```sh
cd /Users/ryanjohnson/Projects/nonsense/kief-site
hugo server --port 1314 --baseURL http://localhost:1314/kief-site/
```

Open <http://localhost:1314/kief-site/>. To build static files, run `hugo --minify`.

The production site is deployed to GitHub Pages via GitHub Actions: <https://ryan258.github.io/kief-site/>. Continuous deployment runs on pushes to `main`.

## Included

- Dashboard with situation-based turn guidance, core stats, and reaction reminders.
- HP, SP, 4/3/2 spell-slot, Hit Dice, Innate Sorcery, and origin-spell counters.
- Concentration selector, Innate Sorcery effect marker, and Reaction availability.
- Once-per-Long-Rest SP restoration; confirmed Long Rest, damage/healing entry, concentration-save prompts, and one-step Undo.
- **Interactive Cast Workflow:** choose spell, slot level, Metamagic, and free-cast/ritual sources; review pre-flight costs, concentration replacement, and Reaction consumption; confirm as an atomic, undoable transaction with table override support.
- **Turn State Economy:** live tracking for Action, Bonus Action, Reaction, and slot usage; context switching between Kief's turn and off-turn with cross-reload persistence; enforcement of the 2024 one-slot-per-turn limit; manual adjustment pills.
- Searchable 25-spell reference with casting, range/targets, components, duration, rolls/effects, scaling, cautions, and source links, plus a 172-play directory (72 Kief, 100 Mr. Big).
- **Full-Viewport Modal Dashboards:** Play and spell links open as native `<dialog class="card-modal">` windows expanding to fill the viewport leaving 20px margins, with floating top-right window controls (`Full page ↗` pill + `×` close button). Stacking support lets nested lookups peek underneath with depth offsets.
- **D&D 5.5e Designer Spellbook Cards:** Full-dashboard presentation (`.spell-modal-layout`) featuring atmospheric art headers, spell badge rows (Level, School, Reaction/Action, Role, Concentration), italic flavor quotes with diamond dividers, body description with "ⓘ Note" callouts, Quick Use action tiles (Add/Cast, Copy Text, Share Link, Favorite), At a Glance specs table, Effect/Scaling cards, Target specifications, and cross-linked tactical plays.
- **Unique 25-Spell WebP Artwork & Faint Card Covers:** Bespoke 1376×768 compressed WebP illustrations for all 25 spells (`static/spells/<slug>.webp`). Injected dynamically via `--spell-bg` into modal cards and displayed as subtle, atmospheric background covers on directory preview cards.
- **Main Page Atmospheric Background Covers:** Dedicated high-resolution WebP landscapes across primary destinations (Dashboard, Spellbook, Tactical Plays, Familiar, Table Rules, Character) layered beneath deep radial vignettes with frosted translucent topbar glassmorphism.
- **Scannable Play Dashboards:** Container-queried dashboard layout for all 172 plays (`.play-dash`), organizing content into a high-level lead pitch, primary action mechanics, table dialogue script, auto-detected spell mini-cards with quick stats, and foldable rules underneath.
- **Glance-First Spellbook:** Spell cards present cast time, range, duration, and critical cautions immediately up front, tucking extended components, scaling, and backlinked plays into collapsible folds.
- **Reference Dashboards & On-Page TOC:** Reference pages with 4+ sections automatically format as multi-column panel grids (`.ref-dash`) with an "ON THIS PAGE" chip navigation bar (`.toc`).
- **Motor Accessibility & 44px Tap Targets:** Built for tabletop use and motor impairments (including Multiple Sclerosis): strict 44px minimum touch targets on all interactive controls, buttons, toggles, chips, quick tiles, and summaries, whole-card click surfaces on play directory cards, and non-reflowing inline link padding.
- Internal linking: the first italic mention of each spell links to its spellbook card; each spell card lists the plays that use it, and each play lists the plays that reference it. Built at compile time, no data to maintain.
- Current character record, rules card, teammate playbook, familiar guide, setup checklist, campaign checks, and growth notes.
- Responsive layout and SCSS styling pipeline via Hugo Pipes, labeled native controls, visible focus, and reduced-motion support.

## Source and authority

The intended build lives in `../kief`. Nine current root Markdown records and `spell-reference.json` are imported. `rules-arbitration.md` is canonical for rulings and is also mirrored into `docs/rules-arbitration.md`. The July exports are excluded.

The play pages in `content/plays/kief/` and `content/plays/mr-big/` are **site-authored**, not imported. They adapt the archived level 7 guides (`../kief/archive/level-7-2026-09-16/`) to the current level 5 record and the 2024 Cat stat block, keeping the archive's numbering. Level 7 features, the wand, old gear, and Keen Smell were removed; plays that depended on them were replaced (for example Feather Fall, Detect Magic, Invisibility, and Mind Sliver plays). Rulings the plays flag as the DM's call remain open. The short Greatest Hits and Mr. Big summaries are still imported from the current records. D&D Beyond synchronization, starting gear, the cow appearance, and initial summoning remain pending. DM rulings govern play.

The September 17 rules reconciliation checked the cited 2024 references and corrected the identified contradictions. Pending interpretations are listed on Table rulings. This is not a live D&D Beyond verification or a claim that every tactical scenario has been exhaustively adjudicated.

To update source-derived reference pages and Sorcerer/cantrip notes:

```sh
python3 scripts/sync_content.py
python3 scripts/sync_content.py --check
```

`data/sources.json` records exact SHA-256 fingerprints of all ten imported inputs. Edit the shared spell details in `../kief/spell-reference.json`, then regenerate. The check command rejects any generated-output drift without modifying files. The dashboard, resource limits, concentration options, and eight always-prepared spell memberships are curated for this build. Review them, and the play pages, whenever the source changes; imports are not a full character-sheet parser. The importer checks the dashboard’s expected build numbers and rejects incomplete or mismatched spell references. A level change requires reviewing `assets/state.js`, `assets/app.js`, `layouts/index.html`, and curated entries in the importer, then changing the storage version/key if necessary.

## Session data

Changes save to this browser's local storage under `kief-firelight.level5.session.v1`. Reloading and navigating within the site preserve valid data. Tabs on the same origin follow the latest save. The interface reports whether data was loaded, saved, or could not be saved. A new session starts at full resources and makes no claim about the character's actual current condition.

This is manual bookkeeping: selecting a play does not cast it or spend resources; toggling Innate Sorcery does not spend a use or run a timer. Short Rest restores only the selected SP feature; roll Hit Dice and adjust HP yourself. The site does not handle temporary HP, death saves, exhaustion, created extra spell slots, inventory, or automatic rules enforcement. Native reference pages and directories remain readable without JavaScript.

There is no cloud sync or offline service worker. Different browsers, ports, or domains have separate saves. Clearing browser storage removes saved sessions. Unreadable data leaves tracking temporary. Recover save preserves the exact unreadable bytes in browser recovery storage, then saves the current counters without a rest. A confirmed Long Rest also preserves unreadable data before replacement; Undo durably restores pre-rest counters. Export tracking shows copyable JSON and a download link for the visible state and available raw/recovery data. Downloaded backup restoration remains manual; there is no import UI. Clearing browser storage also removes unexported recovery copies.

## Documentation

Engineering specifications, rules arbitrations, and project lifecycle milestones are maintained in the repository:

- **[Rules Arbitration Guide](docs/rules-arbitration.md)**: Imported 2024 D&D reference decisions and explicitly pending DM rulings for Kief and Mr. Big (One Spell Slot Per Turn, Innate Sorcery, Careful & Subtle Metamagic, Counterspell 2024, Concentration DC math with CON +7, and 2024 Cat familiar mechanics).
- **[Technical Architecture](docs/architecture.md)**: Deep-dive into the zero-dependency Hugo build, pure functional state machine (`assets/state.js`), native `<dialog>` card stacking, regex autolinking pipeline, and verification harnesses.
- **[Documentation Index](docs/README.md)**: Overview of all technical and operational guides.
- **[Project Roadmap](roadmap.md)**: Development phases, completed deliverables, and future enhancement paths (Session Zero ledger, offline PWA, Level 6 advancement).

## Targeted verification

```sh
node --test tests/state.test.cjs tests/app.test.cjs
PYTHONDONTWRITEBYTECODE=1 python3 tests/sync_test.py
hugo --minify --cleanDestinationDir --noBuildLock --destination /tmp/kief-site-check
python3 scripts/check_links.py /tmp/kief-site-check
```

The focused tests cover resource bounds, restoration, concentration damage, guidance, malformed saves, preservation failures, reset/recovery Undo, external-tab updates, and importer drift/rejection paths. The link checker checks generated internal routes/assets and same-page anchors under the production subpath. See `VERIFICATION.md` for browser checks and their limits.


The dashboard’s sticky combat bar jumps to HP, concentration, and Reaction controls. Situation guidance now warns about some resource shortages and concentration replacement; it does not enforce casting. Play search includes the body text. Spell/play cards preserve their cached source nodes and can be reopened repeatedly.
