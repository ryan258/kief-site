/* Shared pure state model; also exercised directly by Node's built-in test runner. */
(function (root) {
  'use strict';
  const key = 'kief-firelight.level5.session.v1';
  const limits = { hp: 47, sp: 5, innate: 2, animals: 3, familiar: 1, hitDice: 5 };
  const concentrations = ['', 'Web', 'Hypnotic Pattern', 'Fly', 'Invisibility', 'Fear', 'Alter Self', 'Dragon’s Breath', 'Detect Magic'];
  function fresh() {
    return { version: 1, ...limits, slots: { 1: [true, true, true, true], 2: [true, true, true], 3: [true, true] }, concentration: '', innateActive: false, reactionReady: true, restored: false, turnActive: true, actionReady: true, bonusActionReady: true, slotSpentThisTurn: false, kiefSlotSpent: false, savedAt: null };
  }
  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== 1) throw new Error('Unrecognized session data');
    const state = fresh();
    for (const [field, max] of Object.entries(limits)) {
      if (!Number.isInteger(raw[field]) || raw[field] < 0 || raw[field] > max) throw new Error(`Invalid ${field}`);
      state[field] = raw[field];
    }
    for (const [level, slots] of Object.entries(state.slots)) {
      const values = raw.slots?.[level];
      if (!Array.isArray(values) || values.length !== slots.length || values.some(value => typeof value !== 'boolean')) throw new Error('Invalid spell slots');
      state.slots[level] = [...values];
    }
    for (const field of ['innateActive', 'reactionReady', 'restored']) {
      if (typeof raw[field] !== 'boolean') throw new Error(`Invalid ${field}`);
      state[field] = raw[field];
    }
    const turnDefaults = { turnActive: true, actionReady: true, bonusActionReady: true, slotSpentThisTurn: false, kiefSlotSpent: false };
    for (const [field, def] of Object.entries(turnDefaults)) {
      if (raw[field] !== undefined && typeof raw[field] !== 'boolean') throw new Error(`Invalid ${field}`);
      state[field] = raw[field] !== undefined ? raw[field] : def;
    }
    if (!concentrations.includes(raw.concentration)) throw new Error('Invalid concentration');
    state.concentration = raw.concentration;
    if (raw.savedAt !== null && (typeof raw.savedAt !== 'string' || !Number.isFinite(Date.parse(raw.savedAt)))) throw new Error('Invalid timestamp');
    state.savedAt = raw.savedAt;
    return state;
  }
  function startTurn(state) {
    return { ...state, turnActive: true, actionReady: true, bonusActionReady: true, slotSpentThisTurn: false, kiefSlotSpent: false, reactionReady: true };
  }
  function endTurn(state) {
    return { ...state, turnActive: false, kiefSlotSpent: state.kiefSlotSpent || state.slotSpentThisTurn, slotSpentThisTurn: false };
  }
  function adjust(state, field, delta) {
    if (!(field in limits) || !Number.isInteger(delta)) return state;
    return { ...state, [field]: Math.max(0, Math.min(limits[field], state[field] + delta)) };
  }
  function restore(state) {
    if (state.restored || state.sp === limits.sp) return state;
    return { ...state, sp: Math.min(limits.sp, state.sp + 2), restored: true };
  }
  function damage(state, amount) {
    if (!Number.isInteger(amount) || amount < 1) throw new Error('Enter positive whole-number damage.');
    const hp = Math.max(0, state.hp - amount);
    const dc = state.concentration && hp > 0 ? Math.min(30, Math.max(10, Math.floor(amount / 2))) : null;
    return { state: { ...state, hp, concentration: hp === 0 ? '' : state.concentration }, dc,
      ended: Boolean(state.concentration && hp === 0) };
  }
  function guidance(state, situation) {
    const notes = [];
    const third = state.slots[3].some(Boolean);
    if ((situation === 'crowd' || situation === 'caster') && !third) notes.push('No 3rd-level slot remains. Use a cantrip or another available option.');
    if (situation === 'crowd' && !state.sp) notes.push('No SP remains for Careful. Keep allies outside the pattern.');
    if (situation === 'caster' && !state.reactionReady) notes.push('Reaction already spent; Counterspell is unavailable until your next turn.');
    if (situation === 'ally' && !state.slots[2].some(Boolean) && !third) notes.push('No slot remains for Fly or Invisibility.');
    if (state.concentration && (situation === 'crowd' || situation === 'ally')) notes.push(`Casting another concentration spell ends ${state.concentration}; agree on that trade first.`);
    if (state.hp === 0) notes.push('At 0 HP: resolve your condition and death saves at the table before acting.');
    return notes.join(' ') || 'Check targets, range, components, and timing at the table. References do not spend resources.';
  }
  const spells = {
    'Fire Bolt': { level: 0, time: 'Action', concentration: false },
    'Ray of Frost': { level: 0, time: 'Action', concentration: false },
    'Mind Sliver': { level: 0, time: 'Action', concentration: false },
    'Light': { level: 0, time: 'Action', concentration: false },
    'Prestidigitation': { level: 0, time: 'Action', concentration: false },
    'Minor Illusion': { level: 0, time: 'Action', concentration: false },
    'Mage Hand': { level: 0, time: 'Action', concentration: false },
    'Mending': { level: 0, time: '1 minute', concentration: false },
    'Shield': { level: 1, time: 'Reaction', concentration: false },
    'Feather Fall': { level: 1, time: 'Reaction', concentration: false },
    'Detect Magic': { level: 1, time: 'Action', concentration: true, ritual: true },
    'Misty Step': { level: 2, time: 'Bonus Action', concentration: false },
    'Web': { level: 2, time: 'Action', concentration: true },
    'Invisibility': { level: 2, time: 'Action', concentration: true },
    'Counterspell': { level: 3, time: 'Reaction', concentration: false },
    'Hypnotic Pattern': { level: 3, time: 'Action', concentration: true },
    'Fireball': { level: 3, time: 'Action', concentration: false },
    'Chromatic Orb': { level: 1, time: 'Action', concentration: false },
    'Command': { level: 1, time: 'Action', concentration: false },
    'Alter Self': { level: 2, time: 'Action', concentration: true },
    'Dragon’s Breath': { level: 2, time: 'Bonus Action', concentration: true },
    'Fear': { level: 3, time: 'Action', concentration: true },
    'Fly': { level: 3, time: 'Action', concentration: true },
    'Speak with Animals': { level: 1, time: 'Action', concentration: false, freeResource: 'animals', ritual: true },
    'Find Familiar': { level: 1, time: '1 hour', concentration: false, freeResource: 'familiar', ritual: true }
  };
  function previewCast(state, spellName, options = {}) {
    const meta = spells[spellName];
    if (!meta) throw new Error(`Unknown spell: ${spellName}`);
    const errors = [];
    const structuralErrors = [];
    const warnings = [];
    const override = Boolean(options.override);
    if (state.hp === 0 && !override) errors.push('Cannot cast while at 0 HP.');

    let method = options.method || 'slot';
    let slotLevel = Number(options.slotLevel ?? (meta.level > 0 ? meta.level : 0));
    let freeResource = null;

    if (meta.level === 0) {
      method = 'cantrip';
      slotLevel = 0;
    } else if (method === 'free') {
      if (!meta.freeResource) {
        errors.push(`${spellName} does not have a free-use feature.`);
        structuralErrors.push(`${spellName} does not have a free-use feature.`);
      } else {
        freeResource = meta.freeResource;
        slotLevel = 0;
        if (state[freeResource] < 1 && !override) errors.push(`No ${freeResource === 'animals' ? 'Speak with Animals' : 'Find Familiar'} free uses remain.`);
      }
    } else if (method === 'ritual') {
      if (!meta.ritual) {
        errors.push(`${spellName} cannot be cast as a ritual.`);
        structuralErrors.push(`${spellName} cannot be cast as a ritual.`);
      }
      slotLevel = 0;
    } else if (method === 'slot') {
      if (![1, 2, 3].includes(slotLevel) || slotLevel < meta.level) {
        const msg = `Invalid slot level ${slotLevel} for ${meta.level === 0 ? 'cantrip' : `level ${meta.level} spell`}.`;
        errors.push(msg);
        structuralErrors.push(msg);
      } else {
        const available = state.slots[slotLevel]?.filter(Boolean).length || 0;
        if (available < 1 && !override) errors.push(`No ${slotLevel}${slotLevel === 1 ? 'st' : slotLevel === 2 ? 'nd' : 'rd'}-level slot available.`);
      }
    } else {
      const msg = `Unknown casting method: ${method}`;
      errors.push(msg);
      structuralErrors.push(msg);
    }

    const metamagic = options.metamagic || '';
    let spCost = 0;
    if (metamagic) {
      if (!['Careful', 'Subtle'].includes(metamagic)) {
        const msg = `Unknown Metamagic: ${metamagic}`;
        errors.push(msg);
        structuralErrors.push(msg);
      } else {
        spCost = 1;
        if (state.sp < 1 && !override) errors.push('No Sorcery Points remain for Metamagic.');
      }
    }

    const usesReaction = meta.time.startsWith('Reaction');
    if (usesReaction && !state.reactionReady && !override) {
      errors.push('Reaction has already been spent this round.');
    }

    if (slotLevel > 0 && state.slotSpentThisTurn && !override) {
      errors.push('Already expended a spell slot this turn (2024 one-slot-per-turn rule). Cantrips or non-slot options allowed.');
    }

    if (state.turnActive && method !== 'ritual') {
      if (meta.time === 'Action' && !state.actionReady && !override) {
        warnings.push('Action has already been used this turn.');
      }
      if (meta.time === 'Bonus Action' && !state.bonusActionReady && !override) {
        warnings.push('Bonus Action has already been used this turn.');
      }
    }

    let concentration = null;
    let replacesConcentration = null;
    if (meta.concentration) {
      concentration = spellName;
      if (state.concentration && state.concentration !== spellName) {
        replacesConcentration = state.concentration;
        warnings.push(`Replaces active concentration on ${state.concentration}.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      structuralErrors,
      warnings,
      method,
      slotLevel,
      spCost,
      freeResource,
      usesReaction,
      concentration,
      replacesConcentration,
      time: meta.time
    };
  }
  function cast(state, spellName, options = {}) {
    const preview = previewCast(state, spellName, options);
    if (preview.structuralErrors && preview.structuralErrors.length > 0) {
      throw new Error(preview.structuralErrors[0]);
    }
    if (!options.override && preview.errors.length > 0) {
      throw new Error(preview.errors[0]);
    }
    const next = { ...state, slots: { 1: [...state.slots[1]], 2: [...state.slots[2]], 3: [...state.slots[3]] } };
    const parts = [];

    if (options.metamagic) parts.push(options.metamagic);
    parts.push(spellName);

    const costParts = [];
    if (preview.slotLevel > 0) {
      const idx = next.slots[preview.slotLevel].lastIndexOf(true);
      if (idx >= 0) {
        next.slots[preview.slotLevel][idx] = false;
        costParts.push(`1× ${preview.slotLevel}${preview.slotLevel === 1 ? 'st' : preview.slotLevel === 2 ? 'nd' : 'rd'}-level slot`);
      } else {
        costParts.push(`override (no ${preview.slotLevel}${preview.slotLevel === 1 ? 'st' : preview.slotLevel === 2 ? 'nd' : 'rd'}-level slot spent)`);
      }
    } else if (preview.method === 'free' && preview.freeResource) {
      if (next[preview.freeResource] > 0) {
        next[preview.freeResource] = Math.max(0, next[preview.freeResource] - 1);
        costParts.push(`${preview.freeResource === 'animals' ? 'Forest Gnome' : 'Magic Initiate'} free use`);
      } else {
        costParts.push('override (no free use spent)');
      }
    } else if (preview.method === 'ritual') {
      costParts.push('ritual (+10m, no slot)');
    } else {
      costParts.push('cantrip (no slot)');
    }

    if (preview.spCost > 0) {
      if (next.sp >= preview.spCost) {
        next.sp -= preview.spCost;
        costParts.push(`${preview.spCost} SP`);
      } else {
        const spent = next.sp;
        next.sp = 0;
        costParts.push(`${spent} SP (override: insufficient SP)`);
      }
    }

    const meta = spells[spellName];
    if (preview.slotLevel > 0) {
      next.slotSpentThisTurn = true;
      if (next.turnActive) next.kiefSlotSpent = true;
    }
    if (next.turnActive && preview.method !== 'ritual') {
      if (meta && meta.time === 'Action') next.actionReady = false;
      if (meta && meta.time === 'Bonus Action') next.bonusActionReady = false;
    }

    if (preview.usesReaction) {
      next.reactionReady = false;
    }

    if (preview.concentration) {
      next.concentration = preview.concentration;
    }

    let summary = `Cast ${parts.join(' ')} (${costParts.join(', ')}).`;
    if (preview.replacesConcentration) {
      summary += ` Ended concentration on ${preview.replacesConcentration}.`;
    } else if (preview.concentration) {
      summary += ` Concentrating on ${preview.concentration}.`;
    }
    if (preview.usesReaction) {
      summary += ' Reaction marked spent.';
    }

    return {
      state: next,
      summary,
      preview
    };
  }
  function backupUnreadable(storage, stamp = new Date().toISOString()) {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    try { normalize(JSON.parse(raw)); return null; } catch { /* preserve the exact unreadable bytes */ }
    let backupKey = `${key}.recovery.${stamp}`;
    while (storage.getItem(backupKey) !== null) backupKey += '-copy';
    storage.setItem(backupKey, raw); // Failure must prevent a replacement save.
    return backupKey;
  }
  function validateBackup(input) {
    let parsed = input;
    if (typeof input === 'string') {
      try {
        parsed = JSON.parse(input);
      } catch (err) {
        throw new Error('Invalid JSON: unable to parse backup text.');
      }
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Unrecognized backup format: expected an object.');
    }
    if (parsed.state && typeof parsed.state === 'object' && !Array.isArray(parsed.state)) {
      return normalize(parsed.state);
    }
    return normalize(parsed);
  }
  const api = { key, limits, concentrations, spells, fresh, normalize, adjust, restore, damage, guidance, backupUnreadable, validateBackup, previewCast, cast, startTurn, endTurn };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KiefState = api;
})(globalThis);
