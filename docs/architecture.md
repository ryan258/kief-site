# Technical Architecture & System Specification

This document details the software architecture, data modeling, client-side state machine, and verification pipelines powering the **Kief Firelight · Field Companion** application.

---

## 1. Architectural Philosophy

The companion is designed as an ultra-reliable, zero-latency tabletop tool optimized for tablet and mobile browser use during active D&D sessions. It follows five strict engineering constraints:

1. **Zero External Runtime Dependencies:** No CDN scripts, third-party CSS frameworks, or external font requests. The entire site compiles to static HTML/CSS/JS and operates seamlessly offline once loaded.
2. **Deterministic Pure-Function State Core:** All session tracking logic is encapsulated in an isolated, pure JavaScript module (`assets/state.js`) with zero DOM dependencies, enabling headless unit testing via Node.js's native test runner.
3. **Progressive Enhancement & Accessible Standards:** All 172 tactical plays, 25 spellbook entries, and reference sheets are statically pre-rendered HTML. If JavaScript is disabled or fails to load, full navigation, reading, and deep-linking remain completely functional.
4. **Native Web APIs Over Libraries:** Modal cards use HTML5 `<dialog>` elements; responsive layouts use native CSS grid and custom properties; search filtering leverages direct DOM queries.
5. **Fail-Closed Storage Security:** The application strictly validates persistent data structures. Corrupted, legacy, or tampered `localStorage` entries fail closed to prevent runtime crashes, preserving invalid data until explicitly reset.

---

## 2. Directory Structure & File Map

```
kief-site/
├── .github/
│   └── workflows/
│       └── deploy.yml             # GitHub Actions continuous deployment to GitHub Pages
├── .gitignore                     # Ignores /public/, /resources/, .hugo_build.lock, .DS_Store
├── README.md                      # Quickstart, local run, and high-level guide
├── VERIFICATION.md                # Audit log and manual testing receipts
├── roadmap.md                     # Project lifecycle and phased deliverables
├── hugo.toml                      # Hugo configuration (subpath baseURL, taxonomy disables)
├── assets/
│   ├── app.js                     # DOM event wiring, directory search, modal dialog controller
│   ├── state.js                   # Pure state engine, limits, validation, and CJS/browser exports
│   └── style.css                  # Design tokens, dark mode palette, responsive layouts
├── content/
│   ├── character.md               # Synced character sheet and point-buy audit
│   ├── checks.md                  # Campaign checks and rule verifications
│   ├── familiar.md                # Mr. Big field guide
│   ├── greatest-hits.md           # Kief's signature moves
│   ├── growth.md                  # Advancement planning toward level 6
│   ├── history.md                 # Archived level 7 legacy references
│   ├── playbook.md                # Teammate tactical playbook
│   ├── rules.md                   # Core table rules and decision matrix
│   ├── setup.md                   # Session zero preparation checklist
│   ├── plays/                     # 172 site-authored tactical plays
│   │   ├── _index.md              # Plays directory landing
│   │   ├── kief/                  # Plays K-1 through K-72
│   │   └── mr-big/                # Plays MB-1 through MB-100
│   └── spellbook/
│       └── _index.md              # 25-spell searchable catalog
├── data/
│   ├── sources.json               # SHA-256 hashes of imported upstream records
│   └── spells.json                # Structured catalog of cantrips and prepared spells
├── docs/
│   ├── README.md                  # Documentation index
│   ├── architecture.md            # This document
│   └── rules-arbitration.md       # Mechanical RAW arbitrations
├── layouts/
│   ├── _default/
│   │   ├── baseof.html            # Shell markup, asset bundling, responsive sidebar, toast container
│   │   ├── single.html            # Standard prose page wrapper with autolinking
│   │   └── _markup/
│   │       └── render-link.html   # Subpath-safe Markdown link renderer
│   ├── index.html                 # Dashboard HUD, resource tracker, turn recommendation engine
│   ├── partials/
│   │   └── autolink.html          # Regex-based first-mention spellbook link injection
│   ├── plays/
│   │   ├── list.html              # Searchable plays grid with facet filters
│   │   └── single.html            # Play detail layout with cross-referencing backlinks
│   └── spellbook/
│       └── list.html              # Spell card catalog with back-computed play usage counts
├── scripts/
│   ├── check_links.py             # Build validation: broken links, anchors, and subpath escape audit
│   └── sync_content.py            # Upstream source importer and integrity verification
└── tests/
    └── state.test.cjs             # Focused Node.js unit tests for the state machine
```

---

## 3. Client-Side State Engine (`assets/state.js`)

The state machine manages active tabletop resources using an immutable functional pattern.

### Data Schema (`kief-firelight.level5.session.v1`)
```typescript
interface KiefSessionState {
  version: 1;
  hp: number;              // 0 to 47
  sp: number;              // 0 to 5
  innate: number;          // 0 to 2
  animals: number;         // 0 to 3
  familiar: number;        // 0 to 1
  hitDice: number;         // 0 to 5
  slots: {
    1: [boolean, boolean, boolean, boolean]; // 4 1st-level slots
    2: [boolean, boolean, boolean];          // 3 2nd-level slots
    3: [boolean, boolean];                   // 2 3rd-level slots
  };
  concentration: string;   // '' or one of 8 valid spell names
  innateActive: boolean;   // Controls DC 15 and spell attack advantage display
  reactionReady: boolean;  // Controls reaction indicator
  restored: boolean;       // Sorcerous Restoration used flag
  savedAt: string | null;  // ISO timestamp of last write
}
```

### Core Methods
* **`fresh()`**: Returns a clean state object with all resources at maximum capacity, no active concentration, reaction ready, and restoration available.
* **`normalize(raw)`**: Validates an untrusted JSON object against the strict level 5 schema. Throws descriptive errors if fields are missing, of invalid types, outside numerical bounds, or contain unauthorized concentration spells.
* **`adjust(state, field, delta)`**: Immutably adjusts a numerical resource within its clamp boundaries $[0, \text{limit}]$. Rejects non-integer deltas.
* **`restore(state)`**: Implements *Sorcerous Restoration*. Recovers $\min(2, 5 - \text{sp})$ Sorcery Points and sets `restored: true`. If `restored` is already true or `sp` is 5, returns the original state unchanged.

### Cross-Tab Synchronization & Fault Tolerance
* When updates occur, `assets/app.js` writes the serialized state to `localStorage.setItem(model.key, ...)`.
* The `window.addEventListener('storage', ...)` listener synchronizes state across multiple open tabs on the same origin in real time.
* If storage access fails (e.g., private browsing restrictions, security exceptions, or corrupted storage), the application catches the error, renders a non-blocking warning toast, and keeps tracking in volatile memory without crashing.

---

## 4. Interaction Architecture (`assets/app.js`)

### Stacked Modal Card Dialogs
* Play and spell card links are intercepted by a global click listener.
* Internal URLs matching `/plays/(kief|mr-big)/*/` or `/spellbook/#spell-*` load the target DOM asynchronously via `fetch` and render inside a native HTML5 `<dialog class="card-modal">`.
* **Stack Depth & Layering:** Each card increment sets a CSS `--depth` custom property, allowing cards to visually cascade.
* **Dismissal & Focus:** Pressing `Escape` or clicking the close button (`×`) closes only the topmost card. Re-clicking a link already present in the stack pops all cards above it.
* **Fallback:** If `HTMLDialogElement` is unsupported or `fetch` fails, the browser falls back directly to a standard page navigation.

### Search & Facet Directory Filtering
* Both the Plays Directory and the Spellbook include client-side filtering driven by `input` and `change` event listeners.
* Cards declare their searchable text via `data-search-text` attributes and filter values via `data-filter-value`.
* Direct hash navigation (e.g., `/plays/#k-4`) triggers `revealHash()`, which clears active filters, unhides matching cards, and scrolls the target directly into view.

---

## 5. Content Compilation & Link Engine

### First-Mention Spell Autolinking (`layouts/partials/autolink.html`)
Prose articles, play cards, and reference pages pass rendered HTML through the autolinking partial.
* Iterates through `hugo.Data.spells`.
* Uses regular expressions to match the first italicized occurrence of each spell name (e.g., `<em>Counterspell</em>`) on the page.
* Wraps the first occurrence in an anchor pointing to `spellbook/#spell-<name>`, while leaving subsequent mentions as clean italics to avoid link clutter.

### Play Cross-Referencing & Spell Inversion
* **Play-to-Play Backlinks (`layouts/plays/single.html`):** Scans all play pages at compile time for references matching `href=".../<slug>/"`. Any play referencing the current play is listed in a `REFERENCED BY` footer pill list.
* **Spell-to-Play Aggregation (`layouts/spellbook/list.html`):** For each spell, scans all 172 play files for mentions of `<em>Spell Name</em>`. Automatically renders an `IN X PLAYS` backlink strip on the spell card.

---

## 6. Verification Pipeline

The repository enforces three deterministic verification gates:

```sh
# 1. State Machine Unit Tests
node --test tests/state.test.cjs

# 2. Production Static Build
hugo --minify --destination /tmp/kief-site-check

# 3. Comprehensive Link & Anchor Audit
python3 scripts/check_links.py /tmp/kief-site-check
```

* **State Unit Tests:** Verify counter bounding, restoration exhaustion, deep serialization roundtrips, and rejection of invalid/out-of-level payloads.
* **Hugo Build:** Verifies Goldmark Markdown rendering, template partial execution, and asset minification across 185 pages.
* **Link Checker:** Parses all generated HTML documents, verifies every internal href and asset src, asserts that anchor fragments exist within destination page IDs, and ensures no URLs escape the `/kief-site/` base prefix.

### Continuous Deployment (`.github/workflows/deploy.yml`)

The repository deploys to GitHub Pages on every push to `main` using GitHub Actions with `build_type: workflow`:
1. Checks out the repository with full git history.
2. Configures Node.js 20, Python 3, and Hugo Extended (latest).
3. Executes `actions/configure-pages@v5` to dynamically inject the production base URL.
4. Compiles the production bundle via `hugo --gc --minify`.
5. Executes the automated test gate: runs `tests/state.test.cjs` and validates all links and anchors via `scripts/check_links.py ./public`.
6. Packages and deploys the artifact to GitHub Pages (`actions/deploy-pages@v4`).

