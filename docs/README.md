# Tabletop Companion Documentation

This directory contains architectural specifications, mechanical arbitrations, and engineering guidelines for the **Kief Firelight · Field Companion** tabletop web application.

---

## Documents

* **[Rules Arbitration Guide](rules-arbitration.md):** Imported reference from `../../kief/rules-arbitration.md`, separating 2024 rules corrections from pending DM interpretations, including the One Spell Slot Per Turn rule, Innate Sorcery interactions, Metamagic constraints (Careful & Subtle), Counterspell resolution, Concentration saving throw math, and Mr. Big's 2024 Cat familiar capabilities.
* **[Technical Architecture](architecture.md):** Comprehensive system specification covering the zero-external-dependency Hugo foundation, client-side session state machine (`assets/state.js`), stacked `<dialog>` modal cards, compile-time autolinking pipeline, scannable play/spell/reference dashboards, 44px motor accessibility tap targets, and verification gates.
* **[Project Roadmap](../roadmap.md):** Complete development lifecycle, delivered milestone phases, and upcoming feature enhancements.
* **[Root Readme](../README.md):** Quickstart guide, local development workflow, and tabletop operating instructions.
* **[Verification Log](../VERIFICATION.md):** Audit record and test receipts across local browsers and automated test harnesses.
