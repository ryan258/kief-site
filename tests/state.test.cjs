const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../assets/state.js');
test('resource spending and corrections stop at build limits', () => {
  const state = model.fresh();
  for (const [field, max] of Object.entries(model.limits)) {
    assert.equal(model.adjust(state, field, -100)[field], 0);
    assert.equal(model.adjust(state, field, 100)[field], max);
  }
  assert.equal(model.adjust(state, 'sp', 0.5), state);
  assert.equal(model.adjust(state, 'level4', 1), state);
});
test('restoration recovers at most two spent SP once; full SP does not waste it', () => {
  const fresh = model.fresh();
  assert.equal(model.restore(fresh), fresh);
  const spent = model.adjust(fresh, 'sp', -4);
  const restored = model.restore(spent);
  assert.equal(restored.sp, 3);
  assert.equal(restored.restored, true);
  assert.equal(model.restore(restored), restored);
  assert.equal(model.restore({ ...fresh, sp: 4 }).sp, 5);
});
test('valid session survives roundtrip without sharing slot arrays', () => {
  const state = { ...model.fresh(), hp: 19, sp: 0, concentration: 'Fly', innateActive: true, reactionReady: false, savedAt: '2026-09-17T00:00:00Z' };
  state.slots[3][0] = false;
  const restored = model.normalize(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
  restored.slots[3][0] = true;
  assert.equal(state.slots[3][0], false);
});
test('malformed and out-of-build saved state fails closed', () => {
  const invalid = [null, [], {}, { ...model.fresh(), version: 2 }, { ...model.fresh(), hp: 48 }, { ...model.fresh(), sp: '5' }, { ...model.fresh(), innateActive: 'false' }, { ...model.fresh(), concentration: 'Polymorph' }, { ...model.fresh(), savedAt: 'yesterday' }, { ...model.fresh(), slots: { 1: [true], 2: [], 3: [] } }];
  invalid.forEach(raw => assert.throws(() => model.normalize(raw)));
});
test('damage uses final damage for concentration DC, rounds down, caps at 30, and ends concentration at zero HP', () => {
  const state = { ...model.fresh(), concentration: 'Fly' };
  assert.equal(model.damage(state, 21).dc, 10);
  assert.equal(model.damage(state, 23).dc, 11);
  // An artificially high HP fixture isolates the DC cap independently of this build's HP maximum.
  assert.equal(model.damage({ ...state, hp: 200 }, 100).dc, 30);
  const down = model.damage(state, 47);
  assert.equal(down.state.hp, 0); assert.equal(down.state.concentration, '');
  assert.equal(down.dc, null); assert.equal(down.ended, true);
  assert.equal(state.hp, 47);
  for (const amount of [0, -1, NaN, 1.5]) assert.throws(() => model.damage(state, amount));
});
test('situational guidance exposes exhausted resources and concentration replacement', () => {
  const state = { ...model.fresh(), sp: 0, reactionReady: false, concentration: 'Fly' };
  state.slots[3] = [false, false];
  assert.match(model.guidance(state, 'crowd'), /No 3rd-level slot/);
  assert.match(model.guidance(state, 'crowd'), /No SP/);
  assert.match(model.guidance(state, 'crowd'), /ends Fly/);
  assert.match(model.guidance(state, 'caster'), /Reaction already spent/);
});
test('recovery preserves malformed bytes and refuses replacement if backup cannot be written', () => {
  const map = new Map([[model.key, '{broken']]);
  const storage = { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
  const key = model.backupUnreadable(storage, 'test');
  assert.equal(map.get(key), '{broken'); assert.equal(map.get(model.key), '{broken');
  const second = model.backupUnreadable(storage, 'test'); assert.notEqual(key, second);
  assert.throws(() => model.backupUnreadable({ ...storage, setItem() { throw new Error('Quota'); } }));
  map.set(model.key, JSON.stringify(model.fresh()));
  assert.equal(model.backupUnreadable(storage), null);
});
test('previewCast and cast: cantrip, slot spending, and upcasting', () => {
  const state = model.fresh();
  // Cantrip spends no slots or SP
  const cantrip = model.cast(state, 'Fire Bolt');
  assert.deepEqual(cantrip.state.slots, state.slots);
  assert.equal(cantrip.state.sp, state.sp);
  assert.match(cantrip.summary, /Cast Fire Bolt/);

  // 1st-level spell deducts a 1st-level slot
  const first = model.cast(state, 'Chromatic Orb', { slotLevel: 1 });
  assert.equal(first.state.slots[1].filter(Boolean).length, 3);
  assert.equal(first.state.slots[2].filter(Boolean).length, 3);

  // Upcast 1st-level spell at 2nd level
  const upcast = model.cast(state, 'Command', { slotLevel: 2 });
  assert.equal(upcast.state.slots[1].filter(Boolean).length, 4);
  assert.equal(upcast.state.slots[2].filter(Boolean).length, 2);
  assert.match(upcast.summary, /2nd-level slot/);

  // Cannot downcast below spell level
  assert.throws(() => model.cast(state, 'Web', { slotLevel: 1 }));
});
test('previewCast and cast: Metamagic, concentration replacement, reactions, and free uses', () => {
  let state = { ...model.fresh(), concentration: 'Fly' };
  // Careful Hypnotic Pattern replaces Fly, deducts 3rd-level slot and 1 SP
  const hypnotic = model.cast(state, 'Hypnotic Pattern', { slotLevel: 3, metamagic: 'Careful' });
  assert.equal(hypnotic.state.concentration, 'Hypnotic Pattern');
  assert.equal(hypnotic.state.sp, 4);
  assert.equal(hypnotic.state.slots[3].filter(Boolean).length, 1);
  assert.match(hypnotic.summary, /Ended concentration on Fly/);
  assert.equal(hypnotic.preview.replacesConcentration, 'Fly');

  // Reaction spell (Shield) taken on another creature's turn
  assert.throws(() => model.cast(hypnotic.state, 'Shield', { slotLevel: 1 }), /Already expended a spell slot this turn/);
  state = model.endTurn(hypnotic.state);
  const shield = model.cast(state, 'Shield', { slotLevel: 1 });
  assert.equal(shield.state.reactionReady, false);
  assert.match(shield.summary, /Reaction marked spent/);

  // Casting another reaction spell fails without override
  assert.throws(() => model.cast(shield.state, 'Counterspell', { slotLevel: 3 }));
  const forced = model.cast(shield.state, 'Counterspell', { slotLevel: 3, override: true });
  assert.equal(forced.state.reactionReady, false);

  // Free trait casting (Speak with Animals) decrements animals count, no slot
  const animals = model.cast(state, 'Speak with Animals', { method: 'free' });
  assert.equal(animals.state.animals, 2);
  assert.deepEqual(animals.state.slots, state.slots);

  // Ritual casting spends no slot and no free uses
  const ritual = model.cast(state, 'Detect Magic', { method: 'ritual' });
  assert.deepEqual(ritual.state.slots, state.slots);
  assert.equal(ritual.state.concentration, 'Detect Magic');

  // At 0 HP, casting fails without override
  assert.throws(() => model.cast({ ...state, hp: 0 }, 'Fire Bolt'));
  assert.ok(model.cast({ ...state, hp: 0 }, 'Fire Bolt', { override: true }));
});

test('turn economy: startTurn, endTurn, and 2024 slot-per-turn rules', () => {
  let state = model.fresh();
  assert.equal(state.turnActive, true);
  assert.equal(state.actionReady, true);
  assert.equal(state.bonusActionReady, true);
  assert.equal(state.slotSpentThisTurn, false);

  // Cast Misty Step (Bonus Action, 2nd-level slot)
  const misty = model.cast(state, 'Misty Step', { slotLevel: 2 });
  assert.equal(misty.state.bonusActionReady, false);
  assert.equal(misty.state.slotSpentThisTurn, true);
  assert.equal(misty.state.actionReady, true);

  // Attempting to cast Fireball with a slot on the same turn fails closed
  assert.throws(() => model.cast(misty.state, 'Fireball', { slotLevel: 3 }), /one-slot-per-turn/);

  // Casting a cantrip (Fire Bolt) on the same turn succeeds
  const bolt = model.cast(misty.state, 'Fire Bolt');
  assert.equal(bolt.state.actionReady, false);
  assert.equal(bolt.state.bonusActionReady, false);

  // Regression test 1: off-turn save roundtrips kiefSlotSpent before returning to Kief's turn
  const offTurn = model.endTurn(misty.state);
  assert.equal(offTurn.turnActive, false);
  assert.equal(offTurn.slotSpentThisTurn, false);
  assert.equal(offTurn.kiefSlotSpent, true);

  const reloadedOffTurn = model.normalize(JSON.parse(JSON.stringify(offTurn)));
  assert.equal(reloadedOffTurn.kiefSlotSpent, true);
  assert.equal(reloadedOffTurn.slotSpentThisTurn, false);

  // Returning to Kief's turn restores slot expenditure and blocks another slot spell
  const restoredKiefTurn = { ...reloadedOffTurn, turnActive: true, slotSpentThisTurn: reloadedOffTurn.kiefSlotSpent };
  assert.equal(restoredKiefTurn.slotSpentThisTurn, true);
  assert.throws(() => model.cast(restoredKiefTurn, 'Fireball', { slotLevel: 3 }), /one-slot-per-turn/);

  // Advance turn via startTurn() clears kiefSlotSpent
  const nextTurn = model.startTurn(bolt.state);
  assert.equal(nextTurn.turnActive, true);
  assert.equal(nextTurn.actionReady, true);
  assert.equal(nextTurn.bonusActionReady, true);
  assert.equal(nextTurn.slotSpentThisTurn, false);
  assert.equal(nextTurn.kiefSlotSpent, false);
  assert.equal(nextTurn.reactionReady, true);

  // Backward compatibility: normalize accepts older saves lacking turn fields
  const legacy = { ...model.fresh() };
  delete legacy.turnActive;
  delete legacy.actionReady;
  delete legacy.bonusActionReady;
  delete legacy.slotSpentThisTurn;
  delete legacy.kiefSlotSpent;
  const normalized = model.normalize(legacy);
  assert.equal(normalized.turnActive, true);
  assert.equal(normalized.actionReady, true);
  assert.equal(normalized.kiefSlotSpent, false);
});

test('spell list parity: state.js matches data/spells.json exactly', () => {
  const spellsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/spells.json'), 'utf8'));
  const dataMap = new Map(spellsData.map(s => [s.name, { level: s.level, concentration: Boolean(s.concentration) }]));
  assert.equal(Object.keys(model.spells).length, dataMap.size);
  for (const [name, meta] of Object.entries(model.spells)) {
    const expected = dataMap.get(name);
    assert.ok(expected, `Spell ${name} in state.js not found in data/spells.json`);
    assert.equal(meta.level, expected.level, `Level mismatch for ${name}`);
    assert.equal(Boolean(meta.concentration), expected.concentration, `Concentration mismatch for ${name}`);
  }
});

test('cast: override does not claim slot spent when empty, and rejects invalid choices', () => {
  const fresh = model.fresh();
  const empty3 = { ...fresh, slots: { ...fresh.slots, 3: [false, false] } };

  // Casting Fireball with override and no slot available reports override, does not claim 1× 3rd-level slot
  const overridden = model.cast(empty3, 'Fireball', { slotLevel: 3, override: true });
  assert.match(overridden.summary, /override \(no 3rd-level slot spent\)/);
  assert.doesNotMatch(overridden.summary, /1× 3rd-level slot/);
  assert.deepEqual(overridden.state.slots[3], [false, false]);

  // Ritual casting on Kief's turn preserves Action
  const ritual = model.cast(fresh, 'Detect Magic', { method: 'ritual' });
  assert.equal(ritual.state.actionReady, true);
  assert.match(ritual.summary, /ritual \(\+10m, no slot\)/);

  // Override bypasses resource limits, but CANNOT bypass structural validation
  assert.throws(() => model.cast(fresh, 'Fireball', { slotLevel: 1, override: true }), /Invalid slot level/);
  assert.throws(() => model.cast(fresh, 'Fireball', { method: 'free', override: true }), /does not have a free-use/);
  assert.throws(() => model.cast(fresh, 'Fireball', { method: 'ritual', override: true }), /cannot be cast as a ritual/);
  assert.throws(() => model.cast(fresh, 'Fireball', { metamagic: 'Twinned', override: true }), /Unknown Metamagic/);
});

test('validateBackup: accepts valid states and exported envelopes, rejects malformed payloads', () => {
  const fresh = model.fresh();
  const direct = model.validateBackup(fresh);
  assert.equal(direct.hp, 47);
  assert.equal(direct.sp, 5);

  const directJson = model.validateBackup(JSON.stringify(fresh));
  assert.equal(directJson.hp, 47);

  const envelope = {
    exportedAt: '2026-09-17T12:00:00.000Z',
    state: { ...fresh, hp: 32, concentration: 'Fly' },
    stored: '{}',
    recoveryData: {}
  };
  const fromEnvelope = model.validateBackup(envelope);
  assert.equal(fromEnvelope.hp, 32);
  assert.equal(fromEnvelope.concentration, 'Fly');

  const fromEnvelopeJson = model.validateBackup(JSON.stringify(envelope));
  assert.equal(fromEnvelopeJson.hp, 32);

  assert.throws(() => model.validateBackup('not json'), /Invalid JSON/);
  assert.throws(() => model.validateBackup([]), /Unrecognized backup format/);
  assert.throws(() => model.validateBackup(null), /Unrecognized backup format/);
  assert.throws(() => model.validateBackup({ version: 2 }), /Unrecognized session data/);
  assert.throws(() => model.validateBackup({ ...fresh, hp: 999 }), /Invalid hp/);
});

