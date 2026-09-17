# Project Roadmap: Kief Firelight Field Companion

This document outlines the development lifecycle, delivered capabilities, and future evolution of the **Kief Firelight · Field Companion** tabletop companion website.

---

## 🎯 Completed Milestones

### Phase 1: Core Architecture & Responsive HUD (Completed)
- [x] Zero-theme Hugo static site architecture with zero external runtime or build-time npm dependencies.
- [x] High-contrast, low-glare dark mode UI built with vanilla CSS design tokens optimized for low-light tabletop play.
- [x] Persistent client-side session HUD tracking HP, AC states, spell slots (4/3/2), Sorcery Points (5), Innate Sorcery (2), and concentration in `localStorage`.
- [x] Pure functional state machine (`assets/state.js`) with fail-closed validation on malformed or corrupted data.
- [x] Cross-tab live synchronization via browser `storage` events and Long Rest reset with one-click undo.

### Phase 2: Tactical Plays Database (Completed)
- [x] Indexed directory of 172 site-authored tactical plays (72 Kief plays `K-1`..`K-72`, 100 Mr. Big plays `MB-1`..`MB-100`).
- [x] Adapted legacy level 7 guides to 2024 Level 5 rules, removing obsolete gear, wand charges, and higher-tier spells.
- [x] Dedicated play pages with situation triggers, mechanical execution, verbal table phrasing, and underlying rule citations.
- [x] Real-time client-side search and actor facet filtering (Kief vs. Mr. Big) with deep-linkable `#play-id` anchors.
- [x] Compile-time bi-directional play-to-play cross-referencing backlinks (`REFERENCED BY`).

### Phase 3: Grimoire & Autolinking Pipeline (Completed)
- [x] Complete 2024 reference catalog for all 25 spells (8 cantrips, 9 Sorcerer preparations, 6 Draconic extras, 2 origin spells).
- [x] Automated compile-time autolinker (`layouts/partials/autolink.html`) linking the first italic mention of any spell to its spellbook card.
- [x] Compile-time spell card play counter aggregating every play that uses each spell (`IN X PLAYS`).
- [x] Visual tags for Concentration, spell level, and source lineage.

### Phase 4: Mr. Big (Management) Flight Deck (Completed)
- [x] Full alignment with the 2024 Cat statblock (AC 12, 2 HP, 40 ft speed/climb, Darkvision 60 ft, Stealth +4, Jumper).
- [x] Explicit separation of cosmetic Tiny Cow appearance from mechanical Cat capabilities.
- [x] Telepathic scouting protocols within 100-foot range, sensory sharing action costs, and 100 silent Mr. Big tactical routines.
- [x] Touch spell delivery via familiar Reaction rules and Help action melee risk guidance.

### Phase 5: Stacked Modal Dialog System (Completed)
- [x] Native HTML5 `<dialog>` stackable modal cards for rapid inspection of plays and spells without losing page context.
- [x] Dynamic CSS depth layering (`--depth`) with background scroll lock and visual card elevation.
- [x] Keyboard `Escape` and backdrop click dismissal popping only the topmost dialog.
- [x] Graceful progressive enhancement fallback to standard static page URLs on failed fetches or disabled JavaScript.

### Phase 6: Operational Documentation & Verification Gates (Completed)
- [x] Comprehensive architectural specification in `docs/architecture.md` and rules adjudications in `docs/rules-arbitration.md`.
- [x] Pure state unit test suite (`tests/state.test.cjs`) verified with Node.js's built-in test runner.
- [x] Static build and subpath link/anchor audit script (`scripts/check_links.py`) ensuring zero broken links or base-path escapes across all 185 generated pages.
- [x] Automated upstream content importer (`scripts/sync_content.py`) with SHA-256 fingerprint verification (`data/sources.json`).

---

## 🔮 Future Horizons & Enhancements

### Phase 7: Session Zero & Equipment Ledger
- [ ] Starting equipment ledger aligned with DM's campaign starting gold allowance.
- [ ] Consumable tracking for *Find Familiar* 10 GP incense portions and spell components.
- [ ] 50+ GP diamond acquisition tracker for unlocking *Chromatic Orb*.

### Phase 8: Tabletop Helpers & Offline PWA
- [ ] Progressive Web App (PWA) manifest with service worker caching for offline access at convention or low-connectivity tables.
- [ ] Tabletop dice macro roller for signature attacks (*Fire Bolt* `2d10`, *Ray of Frost* `2d8`, *Mind Sliver* `2d6`, *Fireball* `8d6`).
- [ ] Printable compact PDF cheat-sheet exporter formatted for physical physical index cards.

### Phase 9: Level 6 Advancement Readiness
- [ ] Automated migration schema to transition session data from Level 5 (`kief-firelight.level5.session.v1`) to Level 6.
- [ ] Draconic Sorcery Elemental Affinity integration (+3 fire damage to Sorcerer spells, fire resistance toggle).
- [ ] Additional 3rd-level spell slot (3 total) and Sorcery Point maximum expansion (6 SP).
