const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const key = 'kief-firelight.level5.session-picks.v1';
const counterKey = 'kief-firelight.level5.session.v1';
const config = JSON.parse(fs.readFileSync(path.join(root, 'data/session_picks.json')));

// Run the actual app initialization with only the new panel mounted.
// Resource tracking returns at its existing #hp-input guard.
function harness(raw, { readFails = false, writeFails = false } = {}) {
  const stored = new Map([[counterKey, '{"hp":19,"concentration":"Fly"}']]);
  if (raw !== undefined) stored.set(key, raw);
  const nodes = new Map();
  const fields = config.map(group => {
    const options = group.options.map(option => ({ value: option.id, textContent: option.label,
      dataset: { href: `/kief-site/plays/kief/${option.id}/`, note: option.note } }));
    const select = { options, value: options[0].value, listeners: {},
      addEventListener(type, fn) { this.listeners[type] = fn; } };
    nodes.set(`#session-pick-${group.kind}`, select);
    nodes.set(`#session-note-${group.kind}`, {});
    nodes.set(`#session-open-${group.kind}`, { attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } });
    return { dataset: { sessionPick: group.kind } };
  });
  nodes.set('#session-picks-status', {});
  const events = new Map();
  const localStorage = { getItem(k) { if (readFails) throw Error('Blocked'); return stored.get(k) ?? null; },
    setItem(k, value) { if (writeFails) throw Error('Quota'); stored.set(k, value); } };
  const context = { window: {}, document: { querySelector: selector => nodes.get(selector) || null,
    querySelectorAll: selector => selector === '[data-session-pick]' ? fields : [], addEventListener() {} },
    localStorage, addEventListener(type, listener) { events.set(type, listener); }, clearTimeout() {}, setTimeout() {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8'), context);
  const node = selector => nodes.get(selector);
  const change = (kind, value) => {
    const select = node(`#session-pick-${kind}`); select.value = value;
    select.listeners.change();
  };
  return { stored, node, change, events };
}

test('session picks change the link and survive reload without changing combat counters', () => {
  const h = harness();
  h.change('combat', 'k-20');
  h.change('exploration', 'k-32');
  assert.equal(h.node('#session-open-combat').href, '/kief-site/plays/kief/k-20/');
  assert.match(h.node('#session-open-combat').attrs['aria-label'], /Command/);
  assert.match(h.node('#session-note-exploration').textContent, /landing/);
  assert.equal(h.stored.get(counterKey), '{"hp":19,"concentration":"Fly"}');
  const reload = harness(h.stored.get(key));
  assert.equal(reload.node('#session-pick-combat').value, 'k-20');
  assert.equal(reload.node('#session-pick-exploration').value, 'k-32');
  assert.equal(reload.node('#session-pick-whimsy').value, 'k-73');
});

test('unknown and malformed choices cannot become arbitrary play links or overwrite storage on load', () => {
  for (const raw of ['{broken', 'null', '[]', '"text"']) {
    const h = harness(raw);
    assert.equal(h.node('#session-pick-combat').value, 'k-2');
    assert.equal(h.stored.get(key), raw);
  }
  const h = harness(JSON.stringify({ combat: 'https://example.com', exploration: 'k-32', whimsy: 12 }));
  assert.equal(h.node('#session-open-combat').href, '/kief-site/plays/kief/k-2/');
  assert.equal(h.node('#session-pick-exploration').value, 'k-32');
  assert.equal(h.node('#session-pick-whimsy').value, 'k-73');
});

test('blocked reads and failed writes leave choices and real play links usable', () => {
  const h = harness(undefined, { readFails: true, writeFails: true });
  h.change('combat', 'k-25');
  assert.equal(h.node('#session-open-combat').href, '/kief-site/plays/kief/k-25/');
  assert.match(h.node('#session-picks-status').textContent, /could not save/);
  assert.equal(h.stored.get(counterKey), '{"hp":19,"concentration":"Fly"}');
  assert.equal(h.stored.has(key), false);
});

test('other-tab choices update, malformed updates preserve visible choices, and clearing resets defaults', () => {
  const h = harness();
  h.events.get('storage')({ key, newValue: '{"combat":"k-51","whimsy":"k-16"}' });
  assert.equal(h.node('#session-pick-combat').value, 'k-51');
  h.events.get('storage')({ key: counterKey, newValue: '{"hp":30}' });
  assert.equal(h.node('#session-pick-combat').value, 'k-51');
  h.events.get('storage')({ key, newValue: '{broken' });
  assert.equal(h.node('#session-pick-combat').value, 'k-51');
  h.events.get('storage')({ key: null, newValue: null });
  assert.equal(h.node('#session-pick-combat').value, 'k-2');
  assert.equal(h.node('#session-pick-whimsy').value, 'k-73');
});
