# Companion architecture

The companion is a Hugo static site with vanilla JavaScript and SCSS (processed via Hugo Pipes `toCSS`). It has no external runtime dependencies, backend, account system, or cloud synchronization. The current product is a level-5 character reference and manual session tracker; it is not a complete rules engine. First-load navigation and uncached card fetches require a network connection. There is no offline service worker.

## Authority and data flow

```text
../kief/current character documents ─┐
../kief/rules-arbitration.md ─────────┼─ sync_content.py ─ content/*.md
../kief/spell-reference.json ─────────┘                  data/spells.json
                                                       data/sources.json
                                                       docs/rules-arbitration.md
content/plays/{kief,mr-big}/*.md ─ site-authored tactics ─┐
layouts/ + assets/ + imported data ─────────────────────┴─ Hugo → static site
browser localStorage ↔ validated session state ↔ dashboard controls
```

Nine current Markdown records and one spell-reference JSON file are fingerprinted. Rules arbitration is also mirrored byte-for-byte into this directory. Edit shared character/rules material in `../kief`, then import; do not fix only the generated copies. Historical level-7 records, exports, and gear are excluded.

The importer merges the character's eight cantrips and nine preparations with six curated subclass spells and two origin spells. It requires all 25 names to match the detailed shared spell references, rejects missing fields and duplicate names, and checks the current HP, AC, save/attack, slots/SP, Constitution save, speed, Innate Sorcery, and restoration expectations before writing. `--check` compares every expected output without writing. This remains a curated import, not an arbitrary character-sheet parser.

The dashboard limits and labels remain explicit in `assets/state.js` and `layouts/index.html`. A changed build deliberately requires reviewing those consumers. Source fingerprints alone do not prove every tactical claim correct. Site-authored plays must be reviewed when character choices or table rulings change.

## Runtime state

`assets/state.js` exports the same API to browsers and Node tests. The persisted key remains `kief-firelight.level5.session.v1`; existing valid saves remain compatible. State includes HP 0–47, SP 0–5, daily uses, Hit Dice, fixed 4/3/2 slot booleans, concentration, Innate effect, Reaction, restoration-used flag, turn context (`turnActive`), Action/Bonus Action readiness (`actionReady`, `bonusActionReady`), turn slot spending (`slotSpentThisTurn`), turn slot persistence (`kiefSlotSpent`), and a save timestamp.

- `fresh`, `normalize`, `adjust`, and `restore` create, validate, or adjust bounded state without DOM access.
- `startTurn` and `endTurn` advance turns, restoring Action, Bonus Action, Reaction, and clearing on-turn slot limits while preserving Kief's slot expenditure state.
- `damage` uses the entered final damage, rounds half damage down, and caps concentration DC at 30. At 0 HP it clears concentration. Resolve temporary HP, resistances, separate damage sources, massive damage, and death saves at the table; they are not modeled.
- `guidance` warns about unavailable third-level slots, Careful SP, spent Reactions, ally-mobility slots, concentration replacement, and 0 HP. It does not select targets or enforce casting legality.
- `previewCast` and `cast` calculate and execute atomic casting transactions: validating slots, Metamagic SP, free uses, concentration replacement, Reaction consumption, and the 2024 one-slot-per-turn rule across all turns. Table overrides allow explicit bypass of resource constraints while strictly separating non-bypassable structural validation. Override consent is automatically cleared when casting choices change or controls become hidden, and open previews refresh on cross-tab storage events with renewed consent required when restrictions are introduced.
- `backupUnreadable` is the small storage adapter: it preserves exact unreadable bytes under a unique recovery key before an explicitly approved replacement. A failed backup blocks replacement.

`assets/app.js` owns DOM events, persistence, and one-step in-memory Undo. A normal edit snapshots the preceding state. Rest Undo writes the previous counters durably; it never reinstates a stale “do not save” flag after recovery. Reload and external storage events invalidate Undo. Valid same-origin saves update other tabs; removed or malformed external saves put the current tab into visibly temporary tracking.

Recover save preserves unreadable data and saves the visible counters without a rest. Export tracking shows copyable JSON and a download link containing current counters, the active raw save, and available recovery copies. Import/automatic restoration from a downloaded backup is not yet implemented. A storage failure leaves visible counters usable and displays a warning; an export can still carry the in-memory state. Recovery copies remain browser-local until exported and are lost if browser storage is cleared.

## Reference cards and discovery

Internal play and spell links retain real URLs. JavaScript intercepts eligible links and fetches/caches parsed pages. Each opening clones the cached nodes instead of moving them. Opens are serialized to avoid duplicate dialogs from overlapping fetches. Unique title IDs label each native dialog. A link to an already-open card closes cards above it; failed fetches and unsupported dialogs fall back to page navigation.

Cards retain native Escape/close behavior. Browser Back still navigates page history; it is not a modal-stack control. Deep stacks and full screen-reader behavior need broader acceptance testing.

The play directory searches titles, summaries, groups, IDs, and rendered body text. Spell search includes purpose, effects, components, and cautions. Query whitespace is normalized. First italic spell mentions are linked at build time, allowing whitespace across lines and apostrophe variants. Spell backlinks use the same matching pattern. This is formatting-dependent: unitalicized mentions are not guaranteed links or backlinks.

The dashboard has sticky HP/concentration/Reaction shortcuts. Mobile presents resources before recommendations, compresses the decorative hero, and enlarges frequently used controls. Shortcuts navigate to controls; they do not spend resources.

## Verification and delivery

Focused Node tests exercise the state model and tracker event wiring using a small DOM adapter. Python importer contract tests use temporary fixtures from checked-in data, so CI does not require the sibling repository. Browser checks remain necessary for dialogs, layout, focus, and downloads.

Hugo is pinned to 0.166.0 in GitHub Actions. CI builds the site, runs the focused tests, and checks links/assets. The sibling-aware `sync_content.py --check` is a local gate because CI checks out only this repository. See `../VERIFICATION.md` for evidence and limits.

A push to `main` triggers the existing deployment workflow. Local build success is not a deployment, a live-sheet update, a DM ruling, or proof of all-device accessibility.
