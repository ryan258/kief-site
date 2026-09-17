const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const model = require('../assets/state.js');
// Small DOM adapter for tracker event paths, not a browser/layout substitute.
function harness(raw, failWrites = false) {
  const nodes = new Map(), events = new Map(), stored = new Map();
  if (raw !== undefined) stored.set(model.key, raw);
  const initialText = {
    '#turn-action': 'Action',
    '#turn-bonus': 'Bonus Action',
    '#turn-reaction': 'Reaction',
    '#turn-slot': 'Spell slot'
  };
  function node(id) {
    if (!nodes.has(id)) {
      const classes = new Set();
      const attrs = {};
      nodes.set(id, {
        value: '',
        textContent: initialText[id] || '',
        innerHTML: '',
        dataset: {},
        style: {},
        classList: {
          toggle(cls, force) {
            if (force === undefined) {
              if (classes.has(cls)) classes.delete(cls); else classes.add(cls);
            } else if (force) classes.add(cls); else classes.delete(cls);
          },
          contains: cls => classes.has(cls)
        },
        listeners: {},
        addEventListener(type, fn) { this.listeners[type] = fn; },
        append() {},
        showModal() { this.open = true; },
        close() { this.open = false; },
        setAttribute(name, val) { attrs[name] = String(val); },
        getAttribute(name) { return attrs[name] ?? null; }
      });
    }
    return nodes.get(id);
  }
  const storage = { get length() { return stored.size; }, key: index => [...stored.keys()][index], getItem: key => stored.get(key) ?? null, setItem(key, value) { if (failWrites) throw new Error('Quota'); stored.set(key, value); } };
  const context = { document: { querySelector: id => id === '[data-directory]' || id === '#toast button' ? null : node(id), querySelectorAll: () => [], addEventListener() {}, createElement: () => node('created') }, window: { KiefState: model }, Blob, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }, localStorage: storage, structuredClone, clearTimeout() {}, setTimeout() {}, addEventListener: (type, fn) => events.set(type, fn), console };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/app.js'), 'utf8'), context);
  const fire = (id, type, value) => {
    const element = node(id); if (value !== undefined) element.value = value;
    if (element.listeners[type]) element.listeners[type]({ target: element, preventDefault() {} });
  };
  return { node, stored, fire, events };
}
test('unreadable save: temporary edits, confirmed reset, and undo persist the visible pre-rest counters', () => {
  const h = harness('{broken');
  h.fire('#hp-input', 'change', '19');
  assert.equal(h.stored.get(model.key), '{broken');
  h.node('#damage-result').textContent = 'Old concentration check';
  h.node('#rest-dialog').returnValue = 'confirm'; h.fire('#rest-dialog', 'close');
  assert.equal(JSON.parse(h.stored.get(model.key)).hp, 47);
  assert.equal(h.node('#damage-result').textContent, '');
  h.fire('#undo-change', 'click');
  assert.equal(JSON.parse(h.stored.get(model.key)).hp, 19);
  assert.equal(h.node('#hp-input').value, 19);
  assert.ok([...h.stored.entries()].some(([key, raw]) => key.includes('.recovery.') && raw === '{broken'));
});
test('recovery saves current counters without pretending to take a rest', () => {
  const h = harness('{broken'); h.fire('#hp-input', 'change', '19');
  h.node('#recovery-dialog').returnValue = 'confirm'; h.fire('#recovery-dialog', 'close');
  assert.equal(JSON.parse(h.stored.get(model.key)).hp, 19);
  assert.equal(h.node('#recover-save').hidden, true);
});
test('backup failure preserves unreadable data and current visible counters', () => {
  const h = harness('{broken', true); h.fire('#hp-input', 'change', '19');
  h.node('#rest-dialog').returnValue = 'confirm'; h.fire('#rest-dialog', 'close');
  assert.equal(h.stored.get(model.key), '{broken');
  assert.equal(h.node('#hp-input').value, 19);
  assert.match(h.node('#toast').textContent, /could not be preserved/);
});
test('damage and undo restore concentration and saved HP; invalid amounts do not mutate', () => {
  const h = harness(JSON.stringify({ ...model.fresh(), concentration: 'Fly' }));
  h.node('#hp-amount').value = '23'; h.fire('#apply-damage', 'click');
  assert.equal(JSON.parse(h.stored.get(model.key)).hp, 24);
  assert.match(h.node('#damage-result').textContent, /DC 11/);
  h.fire('#undo-change', 'click'); assert.equal(JSON.parse(h.stored.get(model.key)).hp, 47);
  h.node('#hp-amount').value = '47'; h.fire('#apply-damage', 'click');
  assert.equal(JSON.parse(h.stored.get(model.key)).concentration, '');
  h.fire('#undo-change', 'click'); assert.equal(JSON.parse(h.stored.get(model.key)).concentration, 'Fly');
  h.node('#hp-amount').value = '1.5'; h.fire('#apply-damage', 'click');
  assert.equal(JSON.parse(h.stored.get(model.key)).hp, 47);
});
test('canceled reset does nothing; a valid other-tab update invalidates undo', () => {
  const h = harness(JSON.stringify(model.fresh()));
  h.fire('#hp-input', 'change', '19');
  h.node('#rest-dialog').returnValue = 'cancel'; h.fire('#rest-dialog', 'close');
  assert.equal(JSON.parse(h.stored.get(model.key)).hp, 19);
  h.events.get('storage')({ key: model.key, newValue: JSON.stringify({ ...model.fresh(), hp: 30 }) });
  assert.equal(h.node('#hp-input').value, 30); assert.equal(h.node('#undo-change').disabled, true);
});

test('export exposes current counters, raw active save, and preserved unreadable originals', () => {
  const h = harness('{broken'); h.fire('#hp-input', 'change', '19');
  h.node('#recovery-dialog').returnValue = 'confirm'; h.fire('#recovery-dialog', 'close');
  h.fire('#export-save', 'click');
  const backup = JSON.parse(h.node('#export-text').value);
  assert.equal(backup.state.hp, 19);
  assert.equal(JSON.parse(backup.stored).hp, 19);
  assert.ok(Object.values(backup.recoveryData).includes('{broken'));
  assert.equal(backup.storageReadable, true);
  assert.equal(h.node('#download-backup').href, 'blob:test');
});

test('cast workflow: spell selection, slot deduction, concentration replacement, and atomic undo', () => {
  const h = harness(JSON.stringify({ ...model.fresh(), concentration: 'Web' }));
  h.fire('#combat-cast', 'click');
  assert.equal(h.node('#cast-dialog').open, true);

  // Set cast spell to Hypnotic Pattern
  h.node('#cast-spell').value = 'Hypnotic Pattern';
  h.fire('#cast-spell', 'change');
  assert.match(h.node('#cast-preview').innerHTML, /Replaces active concentration on <strong>Web<\/strong>/);

  h.node('#cast-method').value = '3';
  h.fire('#cast-method', 'change');
  h.node('#cast-metamagic').value = 'Careful';
  h.fire('#cast-metamagic', 'change');

  // Submit cast
  h.fire('#cast-form', 'submit');

  const saved = JSON.parse(h.stored.get(model.key));
  assert.equal(saved.slots[3].filter(Boolean).length, 1);
  assert.equal(saved.sp, 4);
  assert.equal(saved.concentration, 'Hypnotic Pattern');
  assert.match(h.node('#toast').textContent, /Cast Careful Hypnotic Pattern/);

  // Undo restores Web, SP 5, and the slot
  h.fire('#undo-change', 'click');
  const restored = JSON.parse(h.stored.get(model.key));
  assert.equal(restored.slots[3].filter(Boolean).length, 2);
  assert.equal(restored.sp, 5);
  assert.equal(restored.concentration, 'Web');
});

test('cast workflow: reaction spell spending and resource override', () => {
  const h = harness(JSON.stringify({ ...model.fresh(), sp: 0 }));
  h.node('#cast-spell').value = 'Shield';
  h.fire('#cast-spell', 'change');
  h.node('#cast-method').value = '1';
  h.fire('#cast-form', 'submit');

  let saved = JSON.parse(h.stored.get(model.key));
  assert.equal(saved.reactionReady, false);
  assert.equal(saved.slots[1].filter(Boolean).length, 3);

  // Attempting to cast Counterspell when reaction spent triggers warning
  h.node('#cast-spell').value = 'Counterspell';
  h.fire('#cast-spell', 'change');
  assert.equal(h.node('#cast-submit').disabled, true);
  assert.match(h.node('#cast-warning').textContent, /Reaction has already been spent/);

  // Enabling override allows casting
  h.node('#cast-override').checked = true;
  h.fire('#cast-override', 'change');
  assert.equal(h.node('#cast-submit').disabled, false);
});

test('turn state controller: turn advancement, manual pill overrides, and turn-aware casting', () => {
  const h = harness(JSON.stringify(model.fresh()));
  // Initial state: Kief's turn, Action/Bonus/Reaction ready, slot spent false
  assert.equal(h.node('#turn-label').textContent, 'Kief’s turn');
  assert.equal(h.node('#turn-action').textContent, 'Action');
  assert.equal(h.node('#turn-action').getAttribute('aria-pressed'), 'true');
  assert.equal(h.node('#turn-slot').textContent, 'Spell slot');
  assert.equal(h.node('#turn-slot').getAttribute('aria-pressed'), 'true');

  // Bug 1 fix: Unchecking reaction-ready checkbox updates state and reaction pill
  h.node('#reaction-ready').checked = false;
  h.fire('#reaction-ready', 'change');
  let state = JSON.parse(h.stored.get(model.key));
  assert.equal(state.reactionReady, false);
  assert.equal(h.node('#combat-reaction').textContent, 'Reaction spent');
  assert.equal(h.node('#turn-reaction').getAttribute('aria-pressed'), 'false');
  assert.ok(h.node('#turn-reaction').classList.contains('spent'));

  // Clicking reaction pill toggles it back and updates checkbox
  h.fire('#turn-reaction', 'click');
  state = JSON.parse(h.stored.get(model.key));
  assert.equal(state.reactionReady, true);
  assert.equal(h.node('#reaction-ready').checked, true);
  assert.equal(h.node('#turn-reaction').getAttribute('aria-pressed'), 'true');

  // Cast Misty Step (Bonus Action, Level 2 slot)
  h.node('#cast-spell').value = 'Misty Step';
  h.fire('#cast-spell', 'change');
  h.node('#cast-method').value = '2';
  h.fire('#cast-form', 'submit');

  state = JSON.parse(h.stored.get(model.key));
  assert.equal(state.bonusActionReady, false);
  assert.equal(state.slotSpentThisTurn, true);
  // Fixed label accessibility check: text stays fixed, aria-pressed reflects state
  assert.equal(h.node('#turn-bonus').textContent, 'Bonus Action');
  assert.equal(h.node('#turn-bonus').getAttribute('aria-pressed'), 'false');
  assert.ok(h.node('#turn-bonus').classList.contains('spent'));
  assert.equal(h.node('#turn-slot').textContent, 'Spell slot');
  assert.equal(h.node('#turn-slot').getAttribute('aria-pressed'), 'false');
  assert.ok(h.node('#turn-slot').classList.contains('spent'));

  // Accidental reset check: clicking turn toggle twice (Kief -> off-turn -> Kief) preserves spent resources
  h.fire('#toggle-turn-btn', 'click');
  state = JSON.parse(h.stored.get(model.key));
  assert.equal(state.turnActive, false);
  assert.match(h.node('#turn-label').textContent, /Off-turn/);

  h.fire('#toggle-turn-btn', 'click');
  state = JSON.parse(h.stored.get(model.key));
  assert.equal(state.turnActive, true);
  assert.equal(state.bonusActionReady, false, 'Bonus Action should still be spent after toggling back to Kief');
  assert.equal(state.slotSpentThisTurn, true, 'Slot spent should still be spent after toggling back to Kief');

  // Manual toggle correction: click slot pill to unmark slot spent
  h.fire('#turn-slot', 'click');
  state = JSON.parse(h.stored.get(model.key));
  assert.equal(state.slotSpentThisTurn, false);
  assert.equal(h.node('#turn-slot').getAttribute('aria-pressed'), 'true');

  // Advance turn via advance-turn-btn resets economy
  h.fire('#advance-turn-btn', 'click');
  state = JSON.parse(h.stored.get(model.key));
  assert.equal(state.turnActive, true);
  assert.equal(state.actionReady, true);
  assert.equal(state.bonusActionReady, true);
  assert.equal(state.slotSpentThisTurn, false);
  assert.equal(state.reactionReady, true);

  // Undo restores previous state
  h.fire('#undo-change', 'click');
  state = JSON.parse(h.stored.get(model.key));
  assert.equal(state.bonusActionReady, false);
});

test('regression: saved turn context survives reload and off-turn toggling', () => {
  const h1 = harness(JSON.stringify(model.fresh()));
  // Cast Misty Step on Kief's turn
  h1.node('#cast-spell').value = 'Misty Step';
  h1.fire('#cast-spell', 'change');
  h1.node('#cast-method').value = '2';
  h1.fire('#cast-form', 'submit');

  let state1 = JSON.parse(h1.stored.get(model.key));
  assert.equal(state1.slotSpentThisTurn, true);
  assert.equal(state1.kiefSlotSpent, true);

  // Switch to off-turn
  h1.fire('#toggle-turn-btn', 'click');
  let offState = JSON.parse(h1.stored.get(model.key));
  assert.equal(offState.turnActive, false);
  assert.equal(offState.slotSpentThisTurn, false);
  assert.equal(offState.kiefSlotSpent, true);

  // Simulate page reload by starting a new harness from saved storage
  const h2 = harness(h1.stored.get(model.key));
  let state2 = JSON.parse(h2.stored.get(model.key));
  assert.equal(state2.kiefSlotSpent, true);

  // Switch back to Kief's turn
  h2.fire('#toggle-turn-btn', 'click');
  let restored = JSON.parse(h2.stored.get(model.key));
  assert.equal(restored.turnActive, true);
  assert.equal(restored.slotSpentThisTurn, true, 'slotSpentThisTurn must be restored from kiefSlotSpent');
  assert.equal(h2.node('#turn-slot').getAttribute('aria-pressed'), 'false');

  // Attempting to cast another slot spell on restored turn fails closed
  h2.node('#cast-spell').value = 'Fireball';
  h2.fire('#cast-spell', 'change');
  h2.node('#cast-method').value = '3';
  assert.equal(h2.node('#cast-submit').disabled, true);
  assert.match(h2.node('#cast-warning').textContent, /one-slot-per-turn/);
});

test('regression: hidden override clears consent on choice change and syncs on storage event', () => {
  const h = harness(JSON.stringify({ ...model.fresh(), sp: 0 }));
  h.fire('#combat-cast', 'click');
  assert.equal(h.node('#cast-dialog').open, true);

  // Fire Bolt with Subtle costs 1 SP -> triggers insufficient SP error and shows override
  h.node('#cast-spell').value = 'Fire Bolt';
  h.fire('#cast-spell', 'change');
  h.node('#cast-metamagic').value = 'Subtle';
  h.fire('#cast-metamagic', 'change');

  assert.equal(h.node('#cast-override-wrap').hidden, false);
  assert.equal(h.node('#cast-submit').disabled, true);

  // User checks override
  h.node('#cast-override').checked = true;
  h.fire('#cast-override', 'change');
  assert.equal(h.node('#cast-submit').disabled, false);

  // User switches back to no Metamagic -> override should hide and uncheck
  h.node('#cast-metamagic').value = '';
  h.fire('#cast-metamagic', 'change');

  assert.equal(h.node('#cast-override-wrap').hidden, true);
  assert.equal(h.node('#cast-override').checked, false, 'Override checkbox must be cleared when choice changes / wrap hides');

  // Another tab sends storage update setting HP to 0
  h.events.get('storage')({
    key: model.key,
    newValue: JSON.stringify({ ...model.fresh(), hp: 0 })
  });

  // Open cast dialog must refresh: show 0-HP error, show override wrap unchecked (requiring renewed consent), and disable submit
  assert.match(h.node('#cast-warning').textContent, /0 HP/);
  assert.equal(h.node('#cast-override-wrap').hidden, false);
  assert.equal(h.node('#cast-override').checked, false, 'Override must require renewed consent when synchronized state introduces restriction');
  assert.equal(h.node('#cast-submit').disabled, true);

  // Submitting fails closed
  h.fire('#cast-form', 'submit');
  assert.match(h.node('#toast').textContent, /0 HP/);
});

