# Kief companion roadmap

## Current milestone: trusted level-5 companion & executable turn

Implemented locally on 2026-09-17; see `VERIFICATION.md` for the checks actually performed. Publication is separate.

- Hugo dashboard with bounded browser-local tracking, 172 tactical plays, and 25 detailed source-linked spell cards.
- Shared canonical character/rules records in `../kief`, nine imported Markdown pages, shared spell JSON, exact source fingerprints, and a read-only drift check.
- Reviewed corrections to Shield, Alter Self, Web timing, Careful/Subtle assumptions, familiar senses and cargo, detection, and signals. Pending DM interpretations remain explicit.
- Cloned, reusable cached reference cards with serialized opening and unique dialog titles.
- Damage/healing entry, concentration-save prompts, one-change Undo, recoverable rest reset, unreadable-save preservation, and downloadable tracking backup.
- Sticky combat shortcuts, resource-first mobile layout, full-body play search, multiline spell autolinks, and resource/concentration warnings.
- **Interactive Cast Workflow:** choose spell, slot level, Metamagic, and free-cast/ritual sources; live preview of slot/SP/resource costs, concentration replacement, and Reaction consumption; atomic execution with single-click Undo and table override bypass.
- **Turn State Economy:** live tracking of Action, Bonus Action, Reaction, and slot spent. Context switching between Kief's turn and off-turn with cross-reload persistence (`kiefSlotSpent`); 2024 one-slot-per-turn limit enforcement; manual correction pills.
- **Full-Viewport Modal Windows (20px Margins):** Native `<dialog class="card-modal">` windows expanding to fill viewport bounds with 20px desktop margins (12px mobile), transparent headers with floating top-right controls, and layered depth stacking.
- **Designer D&D 5.5e Spellbook Cards:** Multi-column dashboard cards (`.spell-modal-layout`) featuring atmospheric artwork headers, school/action/role badges, italic quotes with diamond dividers, description and note callouts, Quick Use actions (Add/Cast, Copy, Share, Favorite), glance spec tables, and cross-linked tactical plays.
- **Unique 25-Spell WebP Artwork & Faint Directory Covers:** Bespoke 1376×768 compressed WebP illustrations for all 25 spells (`static/spells/`), injected into modal dialogs via `--spell-bg` and displayed as subtle atmospheric background covers on directory preview cards.
- **Main Page Atmospheric Background Covers:** High-resolution WebP landscapes across primary destinations (Dashboard, Spellbook, Plays, Familiar, Rules, Character) with frosted glassmorphism on the topbar and semantic `page-<name>` body classes.
- **Scannable Reading Dashboards:** container-queried play dashboards (`.play-dash`) parsing lead pitch, mechanics, table dialogue, spell mini-cards, and collapsible rules; glance-first spell cards with folded mechanics; and reference dashboards (`.ref-dash`) with on-page TOC chips (`.toc`).
- **Motor Accessibility & 44px Touch Targets:** strict 44px minimum tap targets across all interactive controls (buttons, inputs, toggles, chips, summaries, quick tiles), stretched full-card tap targets on directory cards, and non-reflowing link padding, specifically designed for tabletop stability and players with MS.
- SCSS asset pipeline via Hugo Pipes (`toCSS` + `minify` + `fingerprint`).
- Targeted pure state, DOM controller, and importer contract tests, Hugo version pinning, and static link checks.

This is a useful manual companion. The following capabilities remain open; a checked-in feature is not evidence of production deployment or table acceptance.

## Next: make turn guidance tactical

1. **Recommendations:** use actual available resources, equipment, concentration value, distance, target immunities, ally positioning, and agreed rulings. Explain why an option is suggested and provide a cheaper fallback. Current warnings are advisory, not this decision engine.
2. **Spell provenance:** assign stable IDs and explicit spell dependencies to every play. Replace formatting-based matching and implicit backward references with validated data relationships.

Acceptance: cast, undo, reload, and correct a representative turn without duplicate spending, losing concentration state, or promising an unavailable tactic.

## Next: survive a real session

- Temporary HP, death saves, conditions, exhaustion, damage-source handling, and an inspectable event history.
- Extra slots created through Font of Magic, explicit conversion costs, and a rest workflow covering actual Hit Dice decisions.
- Familiar HP, initiative, Reaction, presence/summoning status, senses, delivery range, and role assignments.
- Backup import with schema validation, preview, rollback, and migrations; recovery-copy management; stronger multi-tab conflict handling.
- Screen-reader audits, keyboard focus acceptance, and broad real phone/tablet testing (44px touch targets delivered).
- Installable offline support with visible cache/version status and safe updates during an active session. A normal cached page is not reliable offline availability.
- Print stylesheet and a compact two-sided rules/character sheet; printable spell and play cards.

Acceptance: recover from a reload, interrupted connection, mistaken tap, invalid import, and device handoff without losing the session or hiding uncertainty.

## Campaign readiness and content quality

- Confirm starting gold, inventory, focus/pouch, incense, diamond, healing supplies, cow appearance, and initial summoning.
- Record DM rulings with date, exact wording, affected spells/plays, and review status.
- Verify and update the actual D&D Beyond sheet as a separately authorized task.
- Consolidate overlapping plays into quick favorites and scenario bundles while retaining discoverability and stable links.
- Separate roleplay flavor, published mechanics, player judgment, and house rules consistently.
- Add spell/ruling source dates, change history, and automated checks for contradictory rule claims.
- Benchmark at the table: time to find a spell, taps to record a turn, correction time, and missed resource/effect reminders. Use those observations to choose features.

## Later: growth and reuse

- Level-6 build migration, new slot/SP totals, spell-choice review, and chosen Elemental Affinity. Do not infer a finalized ancestry/element or silently upgrade a saved character.
- Generalize character definitions only after the single-character workflows are dependable; avoid duplicating rules in many templates.
- Optional party sharing and VTT/export integrations with explicit ownership and conflict rules.
- Dice helpers that show the formula, modifiers, source, and manual override; do not obscure adjudication.
- Broader content and distribution review before marketing the companion as a reusable commercial product.
