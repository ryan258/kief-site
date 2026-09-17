const test = require('node:test');
const assert = require('node:assert/strict');
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
