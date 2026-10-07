# Tabletop Companion Documentation

This directory contains architectural specifications, mechanical arbitrations, and engineering guidelines for the **Kief Firelight · Sugar & Shadow** (Candy Land companion) tabletop web application.

---

## Documents

* **[Rules Arbitration Guide](rules-arbitration.md):** Imported reference from `../../kief/rules-arbitration.md`, separating 2024 rules corrections from pending DM interpretations. Includes the confirmed 2026-10-07 campaign familiar override (Mr. Big is an actual physical, intelligent companion; permanent death penalty; will not sacrifice himself on command; provisional 2024 Cat mechanics), DM table-flow guidance, the wit-and-whimsy campaign direction for cantrips (*Elementalism* and *Shape Water* with DM liquid scope), the One Spell Slot Per Turn rule, Innate Sorcery interactions, Metamagic constraints (Careful & Subtle), Counterspell resolution, Concentration saving throw math, condition immunities on creature stat blocks, and component pouch vs. class focus rules.
* **[Technical Architecture](architecture.md):** Comprehensive system specification covering the zero-external-dependency Hugo foundation, client-side session state machine (`assets/state.js`), stacked `<dialog>` modal cards, compile-time autolinking pipeline, scannable play/spell/reference dashboards across 273 tactical plays, 44px motor accessibility tap targets, and verification gates.
* **[Project Roadmap](../roadmap.md):** Complete development lifecycle, delivered milestone phases, and upcoming feature enhancements.
* **[Root Readme](../README.md):** Quickstart guide, local development workflow, and tabletop operating instructions.
* **[Verification Log](../VERIFICATION.md):** Audit record and test receipts across local browsers and automated test harnesses.
