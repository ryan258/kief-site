# Kief Firelight — Field Companion

A standalone Hugo dashboard for the current **Forest Gnome / Draconic Sorcerer 5 / Sage** build, using the tabletop companion approach of `../joe-site`. The interface is built around helping the party, keeping concentration, and using scarce resources deliberately.

## Run locally

Requires Hugo 0.158+ (verified with 0.166.0). No npm packages, external fonts, CDNs, or build-time network access are needed. Python 3 is used only for source imports and link checks; Node is used only for the focused state tests.

```sh
cd /Users/ryanjohnson/Projects/nonsense/kief-site
hugo server --port 1314 --baseURL http://localhost:1314/kief-site/
```

Open <http://localhost:1314/kief-site/>. To build static files, run `hugo --minify`.

The configured production base URL follows Joe's GitHub Pages naming convention: `https://ryan258.github.io/kief-site/`. It is a build target only; a repository, Pages site, or deployment has not been created.

## Included

- Dashboard with situation-based turn guidance, core stats, and reaction reminders.
- HP, SP, 4/3/2 spell-slot, Hit Dice, Innate Sorcery, and origin-spell counters.
- Concentration selector, Innate Sorcery effect marker, and Reaction availability.
- Once-per-Long-Rest SP restoration; confirmed Long Rest with undo until the next tracker edit or reload.
- Searchable 25-spell reference and a 172-play directory (72 Kief, 100 Mr. Big). Each play has its own page (when to use it, mechanics, table phrasing, the rule underneath) and a direct anchor in the directory.
- Internal linking: the first italic mention of each spell links to its spellbook card; each spell card lists the plays that use it, and each play lists the plays that reference it. Built at compile time, no data to maintain.
- Stackable cards: play and spell links open as native `<dialog>` cards over the current page; links inside a card stack another card, Esc or × closes the top one, and reopening a card already in the stack closes the cards above it. Links stay real URLs, so new tabs, no-JS, and failed fetches fall back to normal pages.
- Current character record, rules card, teammate playbook, familiar guide, setup checklist, campaign checks, and growth notes.
- Responsive layout, labeled native controls, visible focus, and reduced-motion support.

## Source and authority

The intended build lives in `../kief`. Only its eight current root documents are imported. The July exports are excluded.

The play pages in `content/plays/kief/` and `content/plays/mr-big/` are **site-authored**, not imported. They adapt the archived level 7 guides (`../kief/archive/level-7-2026-09-16/`) to the current level 5 record and the 2024 Cat stat block, keeping the archive's numbering. Level 7 features, the wand, old gear, and Keen Smell were removed; plays that depended on them were replaced (for example Feather Fall, Detect Magic, Invisibility, and Mind Sliver plays). Rulings the plays flag as the DM's call remain open. The short Greatest Hits and Mr. Big summaries are still imported from the current records. D&D Beyond synchronization, starting gear, the cow appearance, and initial summoning remain pending. DM rulings govern play.

The quick references reproduce the local build; this work is not an independent rules audit or a live D&D Beyond verification. Links to the underlying rules remain on the character page.

To update source-derived reference pages and Sorcerer/cantrip notes:

```sh
python3 scripts/sync_content.py
```

`data/sources.json` records exact SHA-256 fingerprints of imported documents. The dashboard, resource limits, concentration options, and eight always-prepared spell summaries are curated for this build. Review them, and the play pages, whenever the source changes; imports are not a full character-sheet parser. The importer rejects an obvious level/HP mismatch. A level change requires reviewing `assets/state.js`, `assets/app.js`, `layouts/index.html`, and curated entries in the importer, then changing the storage version/key if necessary.

## Session data

Changes save to this browser's local storage under `kief-firelight.level5.session.v1`. Reloading and navigating within the site preserve valid data. Tabs on the same origin follow the latest save. The interface reports whether data was loaded, saved, or could not be saved. A new session starts at full resources and makes no claim about the character's actual current condition.

This is manual bookkeeping: selecting a play does not cast it or spend resources; toggling Innate Sorcery does not spend a use or run a timer. Short Rest restores only the selected SP feature; roll Hit Dice and adjust HP yourself. The site does not handle temporary HP, death saves, exhaustion, created extra spell slots, inventory, or automatic rules enforcement. Native reference pages and directories remain readable without JavaScript.

There is no cloud sync or offline service worker. Different browsers, ports, or domains have separate saves. Clearing browser storage removes saved sessions. Unreadable data is preserved until an explicit Long Rest starts a replacement save; meanwhile the tracker is temporary.

## Documentation

Engineering specifications, rules arbitrations, and project lifecycle milestones are maintained in the repository:

- **[Rules Arbitration Guide](docs/rules-arbitration.md)**: Authoritative 2024 D&D (5.5e) mechanical rulings for Kief and Mr. Big (One Spell Slot Per Turn, Innate Sorcery, Careful & Subtle Metamagic, Counterspell 2024, Concentration DC math with CON +7, and 2024 Cat familiar mechanics).
- **[Technical Architecture](docs/architecture.md)**: Deep-dive into the zero-dependency Hugo build, pure functional state machine (`assets/state.js`), native `<dialog>` card stacking, regex autolinking pipeline, and verification harnesses.
- **[Documentation Index](docs/README.md)**: Overview of all technical and operational guides.
- **[Project Roadmap](roadmap.md)**: Development phases, completed deliverables, and future enhancement paths (Session Zero ledger, offline PWA, Level 6 advancement).

## Targeted verification

```sh
node --test tests/state.test.cjs
hugo --minify --destination /tmp/kief-site-check
python3 scripts/check_links.py /tmp/kief-site-check
```

The state tests cover bounded counters, one-use SP restoration, save roundtrips, and malformed data. The link checker checks generated internal routes/assets and same-page anchors under the production subpath. See `VERIFICATION.md` for browser checks and their limits.

