# Kief Firelight — Sugar & Shadow (Candy Land Companion)

A standalone Hugo dashboard for the current **Forest Gnome / Draconic Sorcerer 5 / Sage** build, adapted for the Candy Land dark fairytale campaign ("Sugar & Shadow") using the tabletop companion approach of `../joe-site`. The interface is built around helping the party, keeping concentration, navigating dangerous travel, and using scarce resources deliberately.

## Run locally

Requires Hugo 0.158+ (verified with 0.166.0). No npm packages, external fonts, CDNs, or build-time network access are needed. Python 3 is used only for source imports and link checks; Node is used only for the focused state tests.

```sh
cd /Users/ryanjohnson/Projects/nonsense/kief-site
hugo server --port 1314 --baseURL http://localhost:1314/kief-site/
```

Open <http://localhost:1314/kief-site/>. To build static files, run `hugo --minify`.

The production site is deployed to GitHub Pages via GitHub Actions: <https://ryan258.github.io/kief-site/>. Continuous deployment runs on pushes to `main`.

## Included

- Three session selections (combat, exploration, whimsy) with native selectors, direct play links, and separate browser storage; defaults remain readable without JavaScript.
- Dashboard with situation-based turn guidance, core combat stats, and reaction reminders.
- **Learn & play:** the imported beginner guide, foldable lessons and practice scenes, a four-step turn-resumption card, and 44px question-mark hints beside stats, resources, turn economy, and casting controls. Hover, keyboard focus, or tap opens a hint; Escape dismisses it. The learning page is precached for offline use after the first successful online load.
- **Ability Scores & Saving Throws Strip:** Persistent 6-card display directly on the dashboard for STR 8 (-1), DEX 14 (+2), CON 18 (+4 / Save +7), INT 9 (-1 / Adv), WIS 10 (+0 / Adv), and CHA 16 (+3 / Save +6 / Adv), highlighting proficient saves and Gnomish Cunning advantage.
- **Skills, Passives & Proficiencies Quick Reference Card:** Expandable reference card on the front page detailing passive senses (Perception 10, Insight 13, Investigation 9), tool and weapon proficiencies, languages, and a complete 18-skill alphabetical grid with proficient skills (Arcana +2, History +2, Insight +3, Persuasion +6) tagged and highlighted. Includes a dedicated sticky combat-bar shortcut (`Stats & Skills ◈`) for instant jumping and auto-expansion.
- HP, SP, 4/3/2 spell-slot, Hit Dice, Innate Sorcery, and origin-spell counters.
- Concentration selector, Innate Sorcery effect marker, and Reaction availability.
- Once-per-Long-Rest SP restoration; confirmed Long Rest, damage/healing entry, concentration-save prompts, and one-step Undo.
- **Interactive Cast Workflow:** choose spell, slot level, Metamagic, and free-cast/ritual sources; review pre-flight costs, concentration replacement, and Reaction consumption; confirm as an atomic, undoable transaction with table override support.
- **Turn State Economy:** live tracking for Action, Bonus Action, Reaction, and slot usage; context switching between Kief's turn and off-turn with cross-reload persistence; enforcement of the 2024 one-slot-per-turn limit; manual adjustment pills.
- Searchable 25-spell reference with casting, range/targets, components, duration, rolls/effects, scaling, cautions, and source links, plus a 273-play directory (173 Kief, 100 Mr. Big) with dynamic DM override disclaimers on provisional familiar mechanics.
- **Full-Viewport Modal Dashboards:** Play and spell links open as native `<dialog class="card-modal">` windows expanding to fill the viewport leaving 20px margins, with a floating top-right `×` close button. Stacking support lets nested lookups peek underneath with depth offsets.
- **D&D 5.5e Designer Spellbook Cards:** Full-dashboard presentation (`.spell-modal-layout`) featuring atmospheric art headers, spell badge rows (Level, School, Reaction/Action, Role, Concentration), italic flavor quotes with diamond dividers, body description with "ⓘ Note" callouts, Quick Use action tiles (Add/Cast, Copy Text, Share Link, Favorite), At a Glance specs table, Effect/Scaling cards, Target specifications, and cross-linked tactical plays.
- **Unique 25-Spell WebP Artwork & Faint Card Covers:** Bespoke 1376×768 compressed WebP illustrations for all 25 spells (`static/spells/<slug>.webp`). Injected dynamically via `--spell-bg` into modal cards and displayed as subtle, atmospheric background covers on directory preview cards.
- **Main Page Atmospheric Background Covers:** Dedicated high-resolution WebP landscapes across primary destinations (Dashboard, Spellbook, Tactical Plays, Familiar, Table Rules, Character) layered beneath deep radial vignettes with frosted translucent topbar glassmorphism.
- **Scannable Play Dashboards:** Container-queried dashboard layout for all 273 plays (`.play-dash`), organizing content into a high-level lead pitch, primary action mechanics, table dialogue script, auto-detected spell mini-cards with quick stats, and foldable rules underneath.
- **Glance-First Spellbook:** Spell cards present cast time, range, duration, and critical cautions immediately up front, tucking extended components, scaling, and backlinked plays into collapsible folds.
- **Reference Dashboards & On-Page TOC:** Reference pages with 4+ sections automatically format as multi-column panel grids (`.ref-dash`) with an "ON THIS PAGE" chip navigation bar (`.toc`).
- **Motor Accessibility & 44px Tap Targets:** Built for tabletop use and motor impairments (including Multiple Sclerosis): strict 44px minimum touch targets on all interactive controls, buttons, toggles, chips, quick tiles, and summaries, whole-card click surfaces on play directory cards, and non-reflowing inline link padding.
- Internal linking: the first italic mention of each spell links to its spellbook card; each spell card lists the plays that use it, and each play lists the plays that reference it. Built at compile time, no data to maintain.
- Current character record, rules card, teammate playbook, familiar guide, setup checklist, campaign checks, and growth notes.
- Responsive layout and SCSS styling pipeline via Hugo Pipes, labeled native controls, visible focus, and reduced-motion support.
- **Candy Land Theme & Night Artwork (`candyland.css`):** Bespoke dark fairytale visual atmosphere for the Candy Land campaign ("Sugar & Shadow"), featuring a deep molasses/plum background (`#100d17`), burnt caramel, frosted mint, cotton candy rose (`#e493b6`), and taffy gold accents, translucent frosted topbar/sidebar glassmorphism, radiant card borders, and night fairytale background art (`candyland-night.webp`).
- **Every-page Table Controller:** A fixed bottom bar exposes saved HP, nine individually clickable spell-slot buttons (filled = available, hollow = spent), SP, Action/Bonus Action/Reaction markers, turn context, concentration, gold, and Mr. Big on every page. Click a slot directly to spend or restore it; its matching panel control stays synchronized. Short rest and Long rest shortcuts are on the bar. Short rest offers up to 2 SP recovery once per Long Rest; Long rest opens the reset confirmation. Open the sheet for HP/damage/healing, daily uses, focus, ability/save reference, backups, and history. The dashboard's tracking controls and dialogs now live in shared partials; all pages use the same state, storage, Undo, and casting controller. Gold and Mr. Big's HP/location start unset and are preserved through Long Rest. The bar has 44px controls, safe-area padding, and content clearance; Escape closes the nonmodal sheet and restores focus. Mobile rows scroll sideways when needed.
- **Sugar & Shadow Section Artwork:** Six additional generated illustrations in `static/pages/`, each exported as 1440×960 and 480×320 WebP. Spellbook, tactical plays/playbook, Mr. Big, beginner lessons, and reference pages receive coordinated section scenes; the dashboard adds the tea kettle and Mr. Big's portrait. `data/theme_art.json` maps routes to artwork. Decorative images have empty alt text, compact mobile crops, and print suppression. Full generation prompts and export settings are saved in `docs/theme-art-prompts.json`. All twelve exports are precached, with artwork-content hashes included in the service-worker version.
- **Service Worker Offline Precaching:** Service worker (`sw.js`) precaches core shell assets, the Candy Land theme stylesheet, atmospheric night background art, web app manifest, and icons for seamless offline and low-connectivity tabletop reliability.

## Source and authority

The intended build lives in `../kief`. Nine current root Markdown records, `docs/learning-dnd-5-5-ed-for-beginners-with-kief.md`, and `spell-reference.json` are imported. `rules-arbitration.md` is canonical for rulings and is also mirrored into `docs/rules-arbitration.md`. The July exports are excluded.

The play pages in `content/plays/kief/` and `content/plays/mr-big/` are **site-authored**, not imported. They adapt the archived level 7 guides (`../kief/archive/level-7-2026-09-16/`) to the current level 5 record and the 2024 Cat stat block, keeping the archive's numbering. Level 7 features, the wand, old gear, and Keen Smell were removed; plays that depended on them were replaced (for example Feather Fall, Detect Magic, Invisibility, and Mind Sliver plays). Rulings the plays flag as the DM's call remain open. The short Greatest Hits and Mr. Big summaries are still imported from the current records. D&D Beyond synchronization, starting gear, the cow appearance, and initial summoning remain pending. DM rulings govern play.

The September 23 rules check audited condition immunities (verifying that Fey/Undead/Construct creature types do not grant automatic immunity to Charm or Fear, preserving Fear's separate dropped-item resolution, and auditing 2024 Command syntax) and clarified component pouch vs. class spellcasting focus rules.

The October 7 update recorded the DM’s confirmed familiar campaign override (establishing Mr. Big as an actual physical, intelligent companion whose death harms Kief and cannot be solved by recasting, with provisional 2024 Cat mechanics) and table-flow guidance on *Mind Sliver* (permitted, but spamming is discouraged and prompts unusual enemy resistances/immunities; guidance directs use for coordinated setups).

To update source-derived reference pages and Sorcerer/cantrip notes:

```sh
python3 scripts/sync_content.py
python3 scripts/sync_content.py --check
```

`data/sources.json` records exact SHA-256 fingerprints of all eleven imported inputs. Edit the shared spell details in `../kief/spell-reference.json`, then regenerate. The check command rejects any generated-output drift without modifying files. The dashboard, resource limits, concentration options, and eight always-prepared spell memberships are curated for this build. Review them, and the play pages, whenever the source changes; imports are not a full character-sheet parser. The importer checks the dashboard’s expected build numbers and rejects incomplete or mismatched spell references. A level change requires reviewing `assets/state.js`, `assets/app.js`, `layouts/index.html`, and curated entries in the importer, then changing the storage version/key if necessary.

## Session data

Changes save to this browser's local storage under `kief-firelight.level5.session.v1`. Reloading and navigating within the site preserve valid data. Tabs on the same origin follow the latest save. The interface reports whether data was loaded, saved, or could not be saved. A new session starts at full resources and makes no claim about the character's actual current condition.

This is manual bookkeeping: selecting a play does not cast it or spend resources; toggling Innate Sorcery does not spend a use or run a timer. Short Rest restores only the selected SP feature; roll Hit Dice and adjust HP yourself. The site does not handle temporary HP, death saves, exhaustion, created extra spell slots, inventory, or automatic rules enforcement. Native reference pages and directories remain readable without JavaScript.

There is no cloud sync; `sw.js` precaches the shell for offline use, but session data stays per browser. Different browsers, ports, or domains have separate saves. Clearing browser storage removes saved sessions. Unreadable data leaves tracking temporary. Recover save preserves the exact unreadable bytes in browser recovery storage, then saves the current counters without a rest. A confirmed Long Rest also preserves unreadable data before replacement; Undo durably restores pre-rest counters. Export tracking shows copyable JSON and a download link for the visible state and available raw/recovery data. Backups can be restored via the built-in Import dialog with preview and automatic safety archival. Clearing browser storage also removes unexported recovery copies.

## Documentation

Engineering specifications, rules arbitrations, and project lifecycle milestones are maintained in the repository:

- **[Rules Arbitration Guide](docs/rules-arbitration.md)**: Imported 2024 D&D reference decisions, confirmed campaign overrides (Mr. Big physical familiar ruling and Mind Sliver table-flow guidance), and explicitly pending DM rulings for Kief and Mr. Big (One Spell Slot Per Turn, Innate Sorcery, Careful & Subtle Metamagic, Counterspell 2024, Concentration DC math with CON +7, and provisional 2024 Cat familiar mechanics).
- **[Technical Architecture](docs/architecture.md)**: Deep-dive into the zero-dependency Hugo build, pure functional state machine (`assets/state.js`), native `<dialog>` card stacking, regex autolinking pipeline, importer anchor fragment preservation, and verification harnesses.
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


The shared table dock provides quick access to HP, concentration, and Reaction/turn controls from any page. Situation guidance warns about some resource shortages and concentration replacement; it does not enforce casting. Play search includes the body text. Spell/play cards preserve their cached source nodes and can be reopened repeatedly.

## Familiar campaign override & spell table-flow guidance — 2026-10-07

The canonical ruling is in `../kief/rules-arbitration.md`, imported into `/rulings/`. Binyled’s message establishes a physical, intelligent, persistent familiar whose death is permanent loss and negatively affects Kief; it will not willingly sacrifice himself on command. Exact penalties and remaining mechanics are pending. Active tactical plays now remove disposable-spirit/recasting advice and unsupported Intelligence 3 limits; retained 2024 mechanics are explicitly provisional. Single-play layouts (`layouts/plays/single.html`) inject a prominent disclaimer banner linking to confirmed rulings and open questions. DM guidance also clarifies that *Mind Sliver* is allowed without a ban, but anti-spam table etiquette applies, directing use toward coordinated setups. Additionally, `scripts/sync_content.py` preserves anchor fragments (`#...`) across markdown links, with verified contract test coverage. Update canonical records first, run the importer, and review site-authored plays and spell metadata when further rulings arrive.

## Current cantrip choice — 2026-10-07

Ryan selected Elementalism in place of Mind Sliver. The canonical character/spell records and site tactics reflect the swap; the prior DM discussion remains context. The Elementalism card reuses `static/spell-vignette.webp` as its illustration. Live D&D Beyond reconciliation is pending.

Final cantrip choices on 2026-10-07: Shape Water replaces Light; Elementalism remains in place of Mind Sliver. Shape Water uses the DM-approved liquid scope. The Shape Water card also reuses the general spell vignette. Lighting tactics now require confirmed equipment or a teammate; live-sheet updates remain pending.

## 101 additional Kief plays — 2026-10-07

Added K-73 through K-173 as site-authored level-5 plays, retaining the existing URLs and numbering for K-1–72 and MB-1–100. The directory now contains 173 Kief plays and 100 Mr. Big plays. Its introduction links to eight new groups: liquid candy, elemental effects, illusions/comforts, object work, investigation, movement, combat, and party schemes. The dashboard count derives from the actual play collection.

Each new page has a situation, ordered actions, a short table line, and a specific rules boundary. Rules were checked against the current imported spell references and [2024 spell descriptions](https://www.dndbeyond.com/sources/dnd/br-2024/spell-descriptions), with [Shape Water](https://www.dndbeyond.com/spells/2397-shape-water) using the DM-approved liquid scope. Candy hardening, familiar details, and other pending rulings remain pending. Outcomes depending on checks, NPC reactions, geometry, or equipment are stated as attempts. The new plays do not change the character build or establish new campaign facts.

These pages stay in `content/plays/kief/`; the importer does not overwrite them. Review them when `../kief` changes. Narrative examples are suggestions, not records of events or rulings from play.

## Table enjoyment first pass — 2026-10-13

The source table card now leads with six familiar choices and a turn-resumption sequence. Six existing companion plays (K-2, K-25, K-51, K-20, K-24, K-73) include opening, follow-through, fallback, and teammate handoff. The familiar guide starts with jobs beside Kief before bounded tasks and deliberate exposure. No character build or spell changes.

The dashboard surfaces three session selections, defaulting to Pattern, the invisible scout, and the Syrup Witness. Each native selector offers a small curated set from `data/session_picks.json`; the links open existing play cards and do not cast or spend resources. Choices save separately under `kief-firelight.level5.session-picks.v1`, survive rest and reload, and follow other-tab selection changes. Invalid entries fall back to that category’s default; unavailable storage leaves the controls usable for the visit. Combat reset, Undo, and tracking import/export do not change or include these preferences.

## Learning at the table — 2026-10-14

Open **Learn & play** in the main navigation for the complete beginner guide, or use the combat-bar shortcut for the dashboard’s Situation → Concentration → Choice → Update reminder. Core lessons start expanded; other sections can be opened individually. Lesson links also expand their containing section, including practice and resumption references. Opening help is independent of resource tracking and never confirms a cast.

The full guide is generated as `content/learn.md` by the source importer. Nested source links, URL-encoded filenames, and fragments are mapped to current site references. The short dashboard reminders and `data/learning_hints.json` are curated summaries of that guide; review them when its rules or build change. Native `<details>` keep lessons and hints usable without JavaScript. `assets/learning.js` adds hover/focus, viewport positioning, Escape/outside-click dismissal, lesson-anchor expansion, and full-lesson printing. When a hint is open in the cast dialog, Escape dismisses the hint first and leaves the cast open.

The service worker precaches `/learn/` and the learning script with the existing shell. Offline access requires an initial successful online cache installation in that browser. The new section retains pending gear and familiar rulings from the source. It adds learning support without changing character numbers or resource rules.
