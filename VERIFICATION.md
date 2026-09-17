# Verification history

## Full-viewport modal windows, D&D 5.5e designer spellbook cards, and atmospheric background artwork — 2026-09-17 (local)

This entry records verification of the expanded modal dialog layout, designer D&D 5.5e spellbook card presentation, bespoke 25-spell WebP artwork library, faint card covers, and main page background covers:

- **Expanded 20px-Margin Modal Dialogs**: In `assets/style.scss`, `.card-modal` sizes to `width: calc(100vw - 40px - var(--depth)*16px)` and `height: calc(100dvh - 40px - var(--depth)*16px)` on desktop (12px on mobile), leaving exactly 20px margins on all sides. Topbar replaced with floating top-right window controls (`Full page ↗` pill + `×` close button). Nested card links unwrap cleanly inside `.card-body` to prevent click traps.
- **Designer D&D 5.5e Spellbook Modal Cards**: In `layouts/spellbook/list.html`, implemented the full designer layout (`.spell-modal-layout`) with spell glyph, badge row (Level, School, Reaction/Action, Role, Concentration), right-hand italic flavor quote with golden diamond divider (`--- ◇ ---`), left-hand description and note callouts with 4 Quick Use action tiles (Add/Cast, Copy Text, Share Link, Favorite), right-hand At a Glance specs table, Effect/Scaling card, Target card, cross-linked tactical plays, and D&D 5.5e reference footer.
- **Unique 25-Spell WebP Artwork & Faint Directory Covers**:
  - Generated and installed 25 bespoke 1376×768 WebPs under `static/spells/<slug>.webp` (~50–160 KB each, ~2.4 MB total).
  - In `assets/app.js`, dynamically reads `data-spell-bg` and injects `--spell-bg` on open.
  - In `assets/style.scss`, `.card-grid .spell-card` displays a subtle, atmospheric background cover via `radial-gradient(..., var(--spell-bg))` that brightens on hover while keeping 100% text contrast.
- **Main Page Atmospheric Background Covers**:
  - Created 6 dedicated high-resolution WebP landscapes under `static/pages/<page>.webp` (~49–96 KB) for Dashboard, Spellbook, Plays, Familiar, Rules, and Character.
  - In `layouts/_default/baseof.html`, detects `$pageKey` and emits `<body class="page-{{ $pageKey }}" data-page="{{ $pageKey }}">`.
  - In `assets/style.scss`, applies background artwork to `body.page-<name> .workspace` beneath deep radial vignettes with frosted topbar glassmorphism.
- **Automated gates: 35 targeted tests passed quietly**:
  - 13 pure state tests in `tests/state.test.cjs`.
  - 20 DOM controller tests in `tests/app.test.cjs`.
  - 2 storage engine tests in `tests/storage.test.cjs`.
  - 3 importer contract tests in `tests/sync_test.py`.
- **Static build & links**: Hugo build succeeded in 161ms without warnings (186 pages, 38 static files); link and asset audit verified clean across 185 generated HTML pages (`scripts/check_links.py public`).

## Scannable reading layouts, play/spell dashboards, and motor accessibility tap targets — 2026-09-17 (local)

This entry records verification of scannable reading dashboards, glance-first spell cards, reference dashboards, and motor accessibility touch targets:

- **Play Dashboards**: `layouts/plays/single.html` parses each play's 4 canonical H3 sections (`when-to-use-it`, `mechanics`, `at-the-table`, `the-rule-underneath`) into a container-queried dashboard (`.play-wrap`, `.play-dash`). Splits out `.play-lead` across the top, `.play-main` for when-to-use and mechanics, and `.play-side` for script dialogue, auto-detected `SPELLS IN THIS PLAY` mini-cards (`.spell-mini`) with casting/range/duration stats, collapsible `the-rule-underneath` fold, and cross-references. Verified on all 172 play pages.
- **Glance-First Spellbook**: `layouts/spellbook/list.html` formats spell cards with an immediate `.spell-glance` grid (Cast, Range, Duration) and critical cautions up front, tucking target, components, roll, effect, scaling, and source links into `<details class="fold">`. In `assets/app.js`, opening a spell via hash automatically unfolds details so modal views show full spell text immediately.
- **Reference Dashboards & TOC**: `layouts/_default/single.html` automatically detects long reference documents (4+ `<h2>` sections) and transforms them into a dashboard grid (`.ref-dash`) with an "ON THIS PAGE" chip navigation bar (`.toc`) driven by Hugo's goldmark Table of Contents.
- **Motor Accessibility & 44px Tap Targets**: In `assets/style.scss`, enforced a strict 44px minimum touch target height across all interactive elements (`button`, `summary`, `select`, `input`, `.toggle`, navigation links, chips, `.setup-link`, `.spell-mini`, `.text-link`, `.card-links a`), with 44px min-width on buttons, stretched full-card tap targets on play directory cards (`.card-link::after`), and non-reflowing inline link padding (`padding-block: 10px`), specifically accommodating players with motor impairments/MS.
- **Automated gates: 35 targeted tests passed quietly**:
  - 13 pure state tests in `tests/state.test.cjs`.
  - 20 DOM controller tests in `tests/app.test.cjs`.
  - 2 storage engine tests in `tests/storage.test.cjs`.
  - 3 importer contract tests in `tests/sync_test.py`.
- **Synchronization**: `python3 scripts/sync_content.py --check` in-sync across all 9 records, 25 spell references, and source fingerprints.
- **Static build & links**: Hugo production-shaped build (`--gc --minify`) succeeded in 205ms without warnings (186 pages); link and asset audit verified across 185 generated HTML pages (`scripts/check_links.py ./public`).

## Local state persistence & iPad tabletop reliability — 2026-09-17 (local)

This entry records verification of local state persistence, review findings resolution, and iPad tabletop resilience:

- **Review Fixes (2026-09-17 review resolution)**:
  - **[P1] Undo throws with storage engine loaded**: Exported `clearUndo` in `assets/storage.js` (calling `saveUndo(null)`). Injected `storageEngine` into `tests/app.test.cjs` harness by default so controller tests exercise the live storage API. Verified undo clears storage durably and restores saved session counters.
  - **[P1] Delayed startup recovery overwriting user edits**: Added `stateRevision` monotonic counter in `assets/app.js`. If user makes any change (`change()`, input, rest, import) while asynchronous `loadMirror()` is pending, the delayed mirror resolution detects `stateRevision !== startupRev` and discards the stale read, preserving user edits.
  - **[P1] Offline first-visit caching & async fallback bug**: In `assets/sw.js` (rendered by Hugo to `/sw.js`), precached the dashboard and all fingerprinted assets during worker `install`. Fixed `caches.match('./') || caches.match('/')` truthy Promise bug by properly awaiting the fallback chain.
  - **[P1] Service worker origin cache isolation**: Restricted cache activation deletion strictly to caches starting with `kief-site-`, preventing deletion of sibling apps on the shared GitHub Pages origin.
  - **[P2] Archival failure stops import and snapshot restoration**: In `importConfirm` and snapshot card restoration, checked `invalidStored` and called `model.backupUnreadable(localStorage)`. If unreadable preservation or current save archival fails (e.g. storage quota), the action halts immediately, reports error to the user, and leaves existing state untouched.
  - **[P2] Storage and wake-lock indicators distinguish actual states**:
    - Storage badge (`#storage-status`): distinguishes `Persistent 🔒` (granted non-evictable), `Mirrored ⚡` (IndexedDB confirmed working), `Local only 💾` (IndexedDB unavailable), and `Storage warning ⚠️` (write failure on either store).
    - Table mode (`#wake-lock-btn`): distinguishes confirmed ON (only when `wakeLock` successfully acquired), unavailable (when API is missing), and failed (when request rejects), notifying appropriately without falsely claiming screen will stay awake.
  - **Refined persistence claims**: Documented in `docs/architecture.md` that WebKit eviction deletes an origin's data as a whole. Dual-storage mirroring protects against single-store corruption or locks, but persistent storage permission and external file exports remain the defenses against origin-wide clearing.
- **Automated gates: 34 targeted tests passed quietly**:
  - 13 pure state tests in `tests/state.test.cjs`.
  - 16 DOM controller tests in `tests/app.test.cjs` (including undo with storage engine, startup race guard, archival failure blocks, import validation, and wake-lock unavailable handling).
  - 2 storage engine tests in `tests/storage.test.cjs` (exercising fallback and connected in-memory IndexedDB mock verifying mirroring, undo, and snapshot pruning at 10 items).
  - 3 importer contract tests in `tests/sync_test.py`.
- **Static build & links**: Hugo build succeeded in 172ms without warnings (186 pages); link and asset audit verified across 185 generated HTML pages (`scripts/check_links.py ./public`).

## Review bug fixes: turn context reload, hidden override clearing, and Subtle label — 2026-09-17 (local)

This entry records verification of three P2 fixes addressing review findings in the staged/unstaged changes:

- **Saved turn context persistence across reload/sync (Issue 1)**:
  - Added `kiefSlotSpent: false` to the pure state model contract in `assets/state.js` (`fresh()`, `normalize()` `turnDefaults`, `startTurn()`, `endTurn()`, and `cast()`).
  - When switching to off-turn, `model.endTurn(state)` preserves `kiefSlotSpent`. When switching back to Kief's turn, `slotSpentThisTurn` is restored from `state.kiefSlotSpent`.
  - Added regression tests in `tests/state.test.cjs` and `tests/app.test.cjs` verifying that an off-turn save round-tripping through `JSON.stringify` and `normalize()` retains `kiefSlotSpent: true`, so switching back to Kief's turn restores `slotSpentThisTurn: true` and blocks casting a second slot spell.
- **Hidden override clearance & storage event refresh (Issue 2)**:
  - In `assets/app.js`, cleared `castOverride.checked = false` whenever `castSpell`, `castMethod`, or `castMetamagic` change, and whenever `updateCastPreview()` hides the override control.
  - Guarded form submission so `const override = !castOverrideWrap.hidden && castOverride.checked;`, preventing hidden controls from bypassing restrictions.
  - Added `refreshOpenCast()` callback invoked on `storage` events, updating methods and refreshing preview when another tab saves changes while the cast modal is open, requiring renewed confirmation if restrictions are introduced.
  - Added regression test in `tests/app.test.cjs` reproducing the Subtle override -> no Metamagic -> cross-tab 0 HP update sequence, verifying that consent is cleared, the 0-HP restriction warning is displayed, and submit fails closed.
- **Subtle Spell material component exception label (Issue 3)**:
  - Updated `<option value="Subtle">` in `layouts/index.html` to `"Subtle Spell (1 SP) · Removes components except priced or consumed materials"`, aligning with `content/rulings.md:53`.
- Automated gates: 26 targeted tests passed:
  - 13 pure state tests in `tests/state.test.cjs`.
  - 10 DOM controller tests in `tests/app.test.cjs`.
  - 3 importer contract tests in `tests/sync_test.py`.
- Static build & links: Hugo build succeeded without warnings; link and asset audit verified across all 185 generated HTML pages.
- Synchronization: `python3 scripts/sync_content.py --check` in-sync across all 10 sources.

## Turn state implementation & review refinements — 2026-09-17 (local)

This entry records verification of the Turn State milestone and subsequent code-review refinements:

- Pure state model: extended `fresh()` and `normalize()` with `turnActive`, `actionReady`, `bonusActionReady`, and `slotSpentThisTurn` (with backward-compatible defaulting for prior saves). Added pure `model.startTurn(state)` and `model.endTurn(state)`.
- Bug fixes & rules alignment:
  - **Reaction checkbox restored**: Restored the change listener on `#reaction-ready` (layouts/index.html:35), maintaining full two-way synchronization between the checkbox, combat bar shortcut, and `#turn-reaction` pill.
  - **Override slot cost reporting**: When casting with table override and no slot available, `cast()` accurately reports `override (no ... slot spent)` instead of claiming a slot was spent.
  - **Ritual action economy**: Ritual casting (`method === 'ritual'`) and non-combat casting times skip action economy deduction, preserving Action and Bonus Action.
  - **Structural validation separation**: Table override permits bypassing resource limits (0 HP, exhausted slots, 0 SP, spent reaction, slot-per-turn limit) but strictly rejects invalid choices (invalid slot level, free method on spells without free uses, invalid rituals, unknown metamagic).
  - **One-slot-per-turn rule**: Enforced across all turns (Kief's turn and off-turns), aligning implementation with `docs/rules-arbitration.md:10`.
  - **Accidental reset prevention**: Turn context toggling (`#toggle-turn-btn` / `#combat-turn-btn`) preserves spent action economy and slot state across switches rather than routing through `startTurn()`. Dedicated advance button (`#advance-turn-btn` / `#new-turn`) remains the sole path for starting a new turn.
  - **Screen reader accessibility**: Replaced dynamic text replacement on action economy pills with fixed text labels (`Action`, `Bonus Action`, `Reaction`, `Spell slot`), allowing `aria-pressed` alone to carry state and eliminating conflicting screen-reader announcements.
- Cleanups:
  - Removed duplicate dot background color assignments in `render()`, relying on `.off-turn .live-dot` CSS.
  - Removed unnecessary DOM existence checks in `render()` after `#hp-input` early return.
  - Removed dead CSS rule `.combat-bar a:first-child{font-weight:bold;color:var(--text)}`.
  - Migrated styling pipeline to SCSS (`assets/style.scss`) with Hugo Pipes (`toCSS (dict "targetPath" "style.css") | minify | fingerprint`), utilizing SCSS nesting for combat bar, cast dialog, turn bar, and pills.
  - Migrated `#open-cast`, `#advance-turn-btn`, and `#cast-warning` inline styles into stylesheet.
  - Added spell list parity test in `tests/state.test.cjs` checking `data/spells.json` against `model.spells`.
  - Removed redundant `len(spells) != 25` check from `scripts/sync_content.py`.
- Automated gates: 24 targeted tests passed:
  - 12 pure state tests in `tests/state.test.cjs` (covering turn initialization, backward-compatible normalization, start/end turn transitions, one-slot-per-turn rule across turns, cantrip allowance, ritual action preservation, override slot deduction reporting, structural validation, and spell list parity).
  - 9 DOM controller tests in `tests/app.test.cjs` (covering turn advance, pill toggling, reaction checkbox synchronization, fixed accessibility labels, on-turn casting and slot locking, off-turn context switching without accidental reset, and Undo).
  - 3 importer contract tests in `tests/sync_test.py`.
- Static build & links: Hugo build succeeded without warnings; link and asset audit verified across all 185 generated HTML pages.
- Synchronization: `python3 scripts/sync_content.py --check` in-sync across all 10 sources.

## Cast workflow implementation — 2026-09-17 (local)

This entry records verification of the interactive Cast Workflow milestone:

- Pure state model: added `model.spells`, `model.previewCast`, and `model.cast` to `assets/state.js`. Validates slot spending, upcasting, Metamagic SP, concentration replacement, reaction deduction, and free-cast features (*Speak with Animals*, *Find Familiar*, rituals) with support for table overrides.
- Cast dialog UI & controller: added `<dialog id="cast-dialog">` with compile-time spell selector grouped by level, dynamic casting method/slot select, Metamagic picker, live pre-flight preview, resource exhaustion warnings, table override toggle, and atomic undoable execution. Integrated cast shortcut into the sticky combat bar, reserves panel, and modal spell reference cards.
- Automated gates: 20 targeted tests passed:
  - 9 pure state tests in `tests/state.test.cjs` (including cantrip/slot spending, upcasting, Metamagic, concentration replacement, reaction deduction, free features, and 0 HP checks).
  - 8 DOM controller tests in `tests/app.test.cjs` (including cast dialog opening, spell selection, slot/SP/concentration deduction, atomic Undo, reaction spending, and table overrides).
  - 3 importer contract tests in `tests/sync_test.py`.
- Static build & links: Hugo production-shaped build (`--gc --minify`) passed without warnings; link and asset audit succeeded across all 185 generated HTML pages.
- Synchronization: `python3 scripts/sync_content.py --check` passed in-sync across 9 records, 25 spell references, and source fingerprints.

## Trusted companion implementation — 2026-09-17 (local)

This entry is current for the local implementation; earlier entries below describe older versions and deployments.

- Shared authority: imported nine current Markdown records plus `../kief/spell-reference.json`; `sync_content.py --check` confirms exact generated-output agreement, including the engineering rules mirror and all ten input fingerprints. Existing sibling edits were preserved; archives and historical exports were not rewritten.
- Rules work: compared the linked 2024 rules and spell descriptions, separated pending DM interpretations, and corrected related site-authored plays. Each of the 25 spell records includes casting, targets, components, duration, resolution/effects, scaling, caution, source URL, and check date. This is not exhaustive adjudication of every possible interaction in 172 plays.
- Automated checks: seven state-model tests, six controller-event tests, and three importer-contract tests passed. These include invalid-save preservation, backup-write failure, recovery without rest, reset/Undo persistence, concentration damage, export payload, cross-tab update invalidation, changed-build rejection, incomplete/duplicate spell rejection, and read-only drift detection. Controller tests use a small DOM adapter; they do not substitute for browser tests.
- Build: Hugo 0.166.0 production-shaped build under `/kief-site/`, 186 generated pages; link/asset/anchor audit across 185 HTML files. Output was isolated under `/tmp`, not deployed.
- In-app browser: reopened a play after closing it; opened, closed, and reopened a nested Hypnotic Pattern card. Reopened cards retained the expected content and the spell card contained only that spell.
- In-app browser: Fly + 23 damage produced 24 HP and a CON +7 / DC 11 prompt. Undo restored 47 HP and Fly across reload. A real keyboard HP edit committed on focus change.
- In-app browser on isolated localhost port 18766: seeded malformed test data, tracked HP 19 temporarily, recovered without resting, and retained HP 19 after reload. Separately repeated malformed data → HP 19 → confirmed Long Rest → Undo → reload; HP remained 19.
- Backup: the automatic-download event did not complete in the embedded browser. Export now opens a dialog with an explicit download link and copyable JSON. Inspected payload contained visible HP 19, active raw save HP 19, and both exact malformed originals. The download-to-disk path remains unverified; copying the displayed JSON is the fallback. Backup import is not implemented.
- Mobile: actual viewports 375×812 and 320×740 reported document widths equal to viewport widths. HP appeared around document y=629 and y=637 respectively. The sticky Reaction shortcut placed its control below the bar. Spellbook and play-directory samples also fit at 320 px.
- Discovery: spell search for “diamond” isolated Chromatic Orb; play search for “critical hit” found three matching body-text entries. No browser console errors were observed in checked flows.
- Isolated preview counters were reset to full HP and no concentration after testing. Tests did not change any production browser save.

Not established: all browsers/devices, full keyboard or screen-reader acceptance, downloaded-file restoration, long-session durability, offline availability, full casting enforcement, real D&D Beyond state, or DM approval. Actual quota exhaustion was simulated in controller/model tests, not induced in the browser. No staging, commit, push, deployment, or publication occurred in this implementation.

## Original dashboard — 2026-09-16

Verified against the current local Kief level 5 records, with Hugo 0.166.0 and Node's built-in test runner.

- Production-shaped build under `/kief-site/` completed without warnings.
- Generated internal links, same-page anchors, and stylesheet/script paths checked across 12 HTML pages. The check caught and prompted repair of reference links that initially escaped the deployment subpath.
- Four focused state tests passed: counter bounds, capped once-per-rest restoration, persisted state roundtrip, and rejection of malformed/out-of-build state.
- In-app browser: HP 46, SP 4, Fly concentration, and active Innate Sorcery survived reload; DC displayed 15 while active.
- Long Rest reset showed full HP/SP, no concentration, and DC 14. Undo restored the preceding values. Cancellation left the prior tracker available.
- Play search displayed the empty state for a no-match query; direct `#k-1` navigation revealed the matching play. Third-level spell filtering displayed five spells.
- Dashboard at 375px and directories at 320px had no horizontal document overflow. Screenshots inspected at desktop and mobile sizes.
- No browser console errors were observed in the checked flows.

These checks do not establish full screen-reader compatibility, all-device coverage, blocked/quota-exhausted browser storage behavior, hosting availability, offline behavior, or live D&D Beyond correctness. Storage failures have explicit UI paths, but only malformed persisted data validation was exercised by the automated tests. No external deployment was performed.

## Play library expansion — 2026-09-16

- Added 172 play pages (72 Kief, 100 Mr. Big) adapted from the archived level 7 guides; the directory now lists pages instead of `data/plays.json`, which was removed along with its import step.
- Production-shaped build: 185 pages, no warnings. Internal links, anchors, and assets passed across 184 HTML pages, including every play-to-play cross-link.
- Importer rerun against `../kief` left content and data unchanged. State tests: 4 passed.
- Checked in generated HTML: previous/next play links run K-1 → K-72 → MB-1 → MB-100.
- Not yet checked in a browser: directory search/filter on 172 cards, `#k-1`-style anchors, and play pages at phone width.
- The play text is a manual rules adaptation, not an independent audit. It was reviewed against the current local record and 2024 rules as recalled, not against live D&D Beyond or the books.

## Internal links and stacked cards — 2026-09-16

- Build: no warnings; internal links and spell anchors passed across 184 HTML pages; state tests 4 passed. 180 spell autolinks (first mention per page).
- Chrome, local server: play card → spell card stacked (2 open, page scroll locked); spell card backlinks show 21 plays for Web; reopening an already-stacked card collapsed the stack; dashboard situation link updates (caster → K-4); reaction-list spell link opens a card. With real mouse clicks, Esc closed only the top card and focus returned to the triggering link. No console errors.
- Scripted (non-user) clicks let Chrome close the whole stack on one Esc; real clicks behaved correctly.
- Not checked: phone width (the window resize did not take effect), screen readers, and browser back-button behavior (back leaves the page rather than closing a card).

## GitHub Pages deployment — 2026-09-17

- Configured GitHub Pages deployment via GitHub Actions (`.github/workflows/deploy.yml`) on `ryan258/kief-site`.
- Verified CI pipeline: Hugo Extended production build (`--gc --minify`), 4/4 passing state machine tests (`tests/state.test.cjs`), and zero link/anchor audit errors across 184 HTML pages (`scripts/check_links.py ./public`).
- Artifact upload and deployment completed cleanly (GitHub Actions run `35232512094`).
- Live production endpoints verified returning HTTP 200:
  - Root HUD: <https://ryan258.github.io/kief-site/>
  - Tactical Plays: <https://ryan258.github.io/kief-site/plays/>
  - Spellbook: <https://ryan258.github.io/kief-site/spellbook/>

