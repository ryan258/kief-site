# 2024 D&D (5.5e) Rules Arbitration Guide

This document records the exact mechanical adjudications and 2024 Player's Handbook (5.5e) rules-as-written (RAW) decisions implemented across the **Kief Firelight · Field Companion** tabletop site.

---

## 1. Action Economy & Spellcasting

### One Spell Slot Per Turn
* **Core Rule:** On any single turn, a creature can expend only **one spell slot** to cast a spell (2024 PHB p. 237).
* **Implication for Bonus Actions:** Casting a bonus action spell using a slot (such as *Misty Step*) prevents casting any Action spell that expends a slot on that same turn. Casting a cantrip (such as *Fire Bolt*, *Ray of Frost*, or *Mind Sliver*) or taking a non-spell action remains legal.
* **Innate Sorcery Interaction:** Activating *Innate Sorcery* is a Bonus Action granted by a class feature, **not** casting a spell. Kief can activate *Innate Sorcery* and cast a leveled spell (such as *Hypnotic Pattern* or *Fireball*) using a spell slot as an Action on the same turn.
* **Reactions on Kief's Turn:** If Kief casts a spell using a slot as an Action (e.g., *Fireball*), he **cannot** cast a Reaction spell using a slot (such as *Counterspell* or *Shield*) on that same turn, even if an enemy attempts to counterspell his spell.
* **Reactions on Other Turns:** Reactions taken on another creature's turn occur on a separate turn. Kief can freely cast *Counterspell*, *Shield*, or *Feather Fall* on other turns, provided his Reaction and a spell slot are available.

### Counterspell Adjudication (2024 Revision)
* **Trigger:** You see a creature within 60 feet casting a spell that has **Verbal, Somatic, or Material components**. Spells or innate abilities lacking perceptible components cannot be perceived as casting and cannot be counterspelled.
* **Saving Throw Mechanic:** The target makes a **Constitution saving throw** against Kief's spell save DC (**DC 14** base, or **DC 15** while *Innate Sorcery* is active). On a successful save, the spell is not interrupted and takes effect normally. On a failed save, the spell fails and has no effect.
* **Slot Preservation:** If the interrupted spell required a spell slot, the target caster does **not** lose the spell slot; only their action, bonus action, or reaction is expended.
* **No Auto-Cancellation:** Under 2024 rules, *Counterspell* no longer provides automatic cancellation based on spell slot level comparison. The Constitution saving throw applies across all interrupted spell levels.

---

## 2. Sorcerer Class Mechanics & Features

### Innate Sorcery
* **Action Cost & Uses:** Bonus Action; 2 uses per Long Rest. Lasts for 1 minute (10 rounds).
* **Benefits:**
  1. Spell save DC for Sorcerer spells increases by 1 (raising Kief's base DC 14 to **DC 15**).
  2. Kief gains **advantage** on attack rolls for Sorcerer spells (such as *Fire Bolt* and *Ray of Frost*).
* **Limits:** Does not apply bonus attack bonuses (+1 to hit); advantage only. Does not modify non-Sorcerer spells (e.g., wizard cantrips or racial spells unless cast via Sorcerer slots).

### Font of Magic & Sorcery Points (SP)
* **Pool:** 5 SP maximum at level 5.
* **Creating Spell Slots (Bonus Action):**
  * 1st-level slot: 2 SP
  * 2nd-level slot: 3 SP
  * 3rd-level slot: 5 SP (highest slot level producible at level 5)
* **Converting Slots to SP (No Action):** Expending a slot yields SP equal to the slot's level (1st = 1, 2nd = 2, 3rd = 3), never exceeding the 5 SP maximum.
* **Sorcerous Restoration:** Once per Long Rest upon finishing a Short Rest, Kief can recover up to **2 spent Sorcery Points**. If Kief is at full SP (5/5), the feature is not wasted and remains available.

### Metamagic Options (Level 5)
* **One Metamagic Per Spell:** Kief can apply only one Metamagic option when casting a spell, unless an exception explicitly applies.
* **Careful Spell (1 SP):**
  * When casting a spell that forces other creatures to make a saving throw, Kief can protect up to **3 creatures** (Charisma modifier = +3).
  * Chosen creatures automatically succeed on their saving throw against the spell.
  * If the spell normally deals half damage on a successful save (e.g., *Fireball*), protected creatures take **0 damage**.
  * **Hypnotic Pattern application:** Protected allies auto-succeed and avoid the Incapacitated/speed 0 effect entirely.
  * **Web limitation:** Careful Spell guarantees an initial save success, but does not grant continuing immunity to difficult terrain or saves made upon entering or ending turns in the webs.
* **Subtle Spell (1 SP):**
  * Removes Verbal and Somatic components, and Material components without a specified gold cost that are not consumed.
  * Spells cast with Subtle Spell cannot be interrupted by *Counterspell*, as the casting cannot be perceived.
  * Materials with a designated cost (e.g., the 50 GP diamond for *Chromatic Orb*) or consumed materials remain required.

---

## 3. Defense & Concentration Architecture

### Concentration Management
* **Strict Single Concentration:** Kief can concentrate on exactly one spell at a time. The following prepared spells compete directly for concentration:
  * *Web* (2nd)
  * *Hypnotic Pattern* (3rd)
  * *Fly* (3rd, Draconic)
  * *Invisibility* (2nd)
  * *Fear* (3rd, Draconic)
  * *Alter Self* (2nd, Draconic)
  * *Dragon's Breath* (2nd, Draconic)
  * *Detect Magic* (1st, ritual/slot)
* **Damage Concentration Checks:**
  * Constitution saving throw: **DC 10** or **half the damage taken**, whichever number is higher (2024 PHB cap: maximum DC 30).
  * Kief's Constitution save modifier is **+7** (Constitution 18 [+4] + Proficiency [+3]).
  * On a standard DC 10 check (damage $\le 21$), Kief succeeds on a roll of 3 or higher (**90% success rate**; only natural rolls of 1 or 2 fail).
* **Fly Landing Protocol:** Ending concentration on *Fly* causes airborne creatures to fall immediately unless they have an alternate means of landing or *Feather Fall* is available as a Reaction.

### Unarmored Defense & Survivability
* **Draconic Resilience:** AC equals $10 + \text{DEX modifier} (+2) + \text{CHA modifier} (+3) = \mathbf{15}$.
* **Draconic Hit Point Maximum:** $+1$ HP per Sorcerer level (+5 HP total), giving fixed HP **47** at level 5.
* **Shield Spell:** Reaction upon being hit or targeted by *Magic Missile*, granting $+5$ AC until the start of Kief's next turn (raising AC to **20**).

---

## 4. Mr. Big (Cat-Form Fey Familiar)

### Mechanical Statblock (2024 Cat)
* **Armor Class:** 12
* **Hit Points:** 2 ($1\text{d}4$)
* **Speed:** 40 ft., climb 40 ft.
* **Darkvision:** 60 ft.
* **Skills:** Perception +3, Stealth +4 (Passive Perception 13).
* **Trait:** *Jumper* (uses Dexterity instead of Strength for jump distance).

### Tabletop Capabilities & Boundaries
* **Creature Type & Appearance:** Fey familiar summoned via *Find Familiar*. Cosmetic appearance is a tiny, silent cow. This appearance is purely aesthetic; it grants no bovine carrying strength, trampling attacks, or physical weight advantages.
* **Attacks:** Mr. Big **cannot attack**.
* **Initiative & Actions:** Rolls his own initiative in combat. He can take standard non-attack actions, including *Dodge*, *Dash*, *Disengage*, *Hide*, and *Help*.
* **Help Action Dynamics:** To grant advantage on an ally's attack against an enemy, Mr. Big must be within 5 feet of that enemy during his turn. Because Mr. Big has only 2 HP and lacks the *Flyby* trait, positioning him within melee reach exposes him to opportunity attacks and area effects.
* **Touch Spell Delivery:**
  * When Kief casts a spell with a range of touch (e.g., *Fly*, *Invisibility*, *Alter Self*), Mr. Big can deliver the spell using his **Reaction**.
  * Mr. Big must be within 100 feet of Kief at the time of delivery and within touch range (5 feet) of the target.
  * Kief expends the spell slot and maintains concentration; Mr. Big only expends his Reaction.
* **Sensory Sharing:** Kief can use a Bonus Action to see through Mr. Big's eyes and hear through his ears until the start of Kief's next turn, during which Kief is blinded and deafened to his own surroundings.
* **Summoning Cost:** Requires 1 hour (or 70 minutes as a ritual) and consumes **10+ GP of charcoal, incense, and herbs**. Even the 1 free casting per Long Rest granted by *Magic Initiate* consumes the 10 GP material component.

---

## 5. Level 5 Boundary Audit

The companion site deliberately excludes features and capabilities that Kief has not yet unlocked:
* **No 4th-Level Spell Slots or Spells:** Spells such as *Polymorph*, *Dimension Door*, or *Banishment* are not prepared or available.
* **No Elemental Affinity:** No $+3$ Charisma modifier damage to fire spells and no damage resistance from draconic heritage (unlocks at Sorcerer 6).
* **No Sorcery Incarnate:** Cannot cast *Sorcery Incarnate* or use multiple Metamagic options on a single spell (unlocks at Sorcerer 7).
* **No Wand of Magic Missiles or Historical Magic Gear:** All plays and resources rely exclusively on innate class features, prepared spells, and mundane equipment.
