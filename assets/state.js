/* Shared pure state model; also exercised directly by Node's built-in test runner. */
(function (root) {
  'use strict';
  const key = 'kief-firelight.level5.session.v1';
  const limits = { hp: 47, sp: 5, innate: 2, animals: 3, familiar: 1, hitDice: 5 };
  const concentrations = ['', 'Web', 'Hypnotic Pattern', 'Fly', 'Invisibility', 'Fear', 'Alter Self', 'Dragon’s Breath', 'Detect Magic'];
  function fresh() {
    return { version: 1, ...limits, slots: { 1: [true, true, true, true], 2: [true, true, true], 3: [true, true] }, concentration: '', innateActive: false, reactionReady: true, restored: false, savedAt: null };
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
    if (!concentrations.includes(raw.concentration)) throw new Error('Invalid concentration');
    state.concentration = raw.concentration;
    if (raw.savedAt !== null && (typeof raw.savedAt !== 'string' || !Number.isFinite(Date.parse(raw.savedAt)))) throw new Error('Invalid timestamp');
    state.savedAt = raw.savedAt;
    return state;
  }
  function adjust(state, field, delta) {
    if (!(field in limits) || !Number.isInteger(delta)) return state;
    return { ...state, [field]: Math.max(0, Math.min(limits[field], state[field] + delta)) };
  }
  function restore(state) {
    if (state.restored || state.sp === limits.sp) return state;
    return { ...state, sp: Math.min(limits.sp, state.sp + 2), restored: true };
  }
  const api = { key, limits, concentrations, fresh, normalize, adjust, restore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KiefState = api;
})(globalThis);
