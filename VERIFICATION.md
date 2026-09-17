# Verification — 2026-09-16

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
