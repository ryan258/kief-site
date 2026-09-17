'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  let toastTimer;
  function notify(message, undo) {
    clearTimeout(toastTimer);
    const toast = $('#toast');
    toast.textContent = message;
    if (undo) {
      const button = document.createElement('button');
      button.textContent = 'Undo reset';
      button.addEventListener('click', undo, { once: true });
      toast.append(button);
    } else toastTimer = setTimeout(() => { toast.textContent = ''; }, 6000);
  }

  // Play and spell links open as stacked cards; the href stays a real page for no-JS, new tabs, and failures.
  const cards = [];
  const pages = new Map();
  function cardTarget(link) {
    if (!link || link.target || link.closest('[data-no-card]') || typeof HTMLDialogElement !== 'function') return null;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return null;
    if (/\/plays\/(kief|mr-big)\/[^/]+\/$/.test(url.pathname) && !url.hash) return url;
    if (url.pathname.endsWith('/spellbook/') && url.hash.startsWith('#spell-')) return url;
    return null;
  }
  function load(path) {
    if (!pages.has(path)) {
      pages.set(path, fetch(path).then(response => {
        if (!response.ok) throw new Error(response.status);
        return response.text();
      }).then(html => new DOMParser().parseFromString(html, 'text/html')).catch(error => { pages.delete(path); throw error; }));
    }
    return pages.get(path);
  }
  async function openCard(url) {
    const key = url.pathname + url.hash;
    const open = cards.findIndex(card => card.dataset.key === key);
    if (open >= 0) { cards.slice(open + 1).reverse().forEach(card => card.close()); return; }
    let source;
    try {
      const doc = await load(url.pathname);
      source = url.hash ? doc.getElementById(url.hash.slice(1)) : doc.querySelector('main');
    } catch { /* fall through to a normal page load */ }
    if (!source) { location.href = url.href; return; }
    const card = document.createElement('dialog');
    card.className = 'card-modal';
    card.dataset.key = key;
    card.dataset.depth = cards.length;
    card.style.setProperty('--depth', Math.min(cards.length, 6));
    card.innerHTML = '<div class="card-bar"><a class="text-link" data-no-card>Full page <span aria-hidden="true">↗</span></a><button type="button" aria-label="Close card">×</button></div><div class="card-body"></div>';
    card.querySelector('[data-no-card]').href = url.href;
    const body = card.querySelector('.card-body');
    body.append(...(url.hash ? [source] : source.children));
    body.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    body.querySelectorAll('[data-card]').forEach(node => node.removeAttribute('data-card'));
    body.querySelectorAll('a[href]').forEach(link => link.setAttribute('href', new URL(link.getAttribute('href'), url).href));
    const title = body.querySelector('h1, h2');
    if (title) { title.id = `card-title-${Date.now()}`; card.setAttribute('aria-labelledby', title.id); }
    card.querySelector('.card-bar button').addEventListener('click', () => card.close());
    card.addEventListener('click', event => { if (event.target === card) card.close(); });
    card.addEventListener('close', () => { cards.splice(cards.indexOf(card), 1); card.remove(); });
    document.body.append(card);
    cards.push(card);
    card.showModal();
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = cardTarget(event.target.closest('a[href]'));
    if (!url) return;
    event.preventDefault();
    openCard(url);
  });

  const directory = $('[data-directory]');
  if (directory) {
    const search = $('[data-search]');
    const filter = $('[data-filter]');
    const cards = $$('[data-card]');
    const noun = $('[data-count]').textContent.trim().split(' ').pop();
    function apply() {
      const query = search.value.trim().toLocaleLowerCase();
      let count = 0;
      for (const card of cards) {
        const match = card.dataset.searchText.toLocaleLowerCase().includes(query) && (!filter.value || filter.value === card.dataset.filterValue);
        card.hidden = !match;
        if (match) count++;
      }
      $('[data-count]').textContent = `${count} ${noun}`;
      $('[data-empty]').hidden = count > 0;
    }
    function revealHash() {
      const id = location.hash.slice(1);
      const target = cards.find(card => card.id === id);
      if (target) {
        search.value = ''; filter.value = ''; apply();
        target.scrollIntoView({ block: 'start' });
      }
    }
    search.addEventListener('input', apply);
    filter.addEventListener('change', apply);
    addEventListener('hashchange', revealHash);
    revealHash();
  }

  const situations = {
    crowd: ['k-2/', 'ACTION · 3RD LEVEL · CONCENTRATION', 'Give everyone a moment.', 'Careful Hypnotic Pattern. Spend 1 SP to protect up to three allies. Mark affected enemies and tell the party to leave them asleep.', '“Let’s all take a moment. Them especially.”'],
    ally: ['k-32/', 'CHOOSE THE HELP THEY NEED', 'Ask, then make a way.', 'Fly crosses the gap. Invisibility supports the scout. Both need concentration and a return plan. Feather Fall catches up to five falling creatures within 60 feet with your Reaction.', '“The stairs are more of a suggestion.”'],
    caster: ['k-4/', 'REACTION · 3RD LEVEL · 60 FEET', 'Disagree with enemy magic.', 'Keep a third-level slot and your Reaction. Counterspell needs sight of a creature casting with components within 60 feet. The enemy makes a Constitution save; cancellation does not consume its spell slot.', '“No, mate. That’s the wrong blend.”'],
    holding: ['k-51/', 'PRESERVE CONCENTRATION', 'A quiet turn is a good turn.', 'Take cover. Use Mind Sliver to set up an ally’s next saving-throw effect, Ray of Frost to slow pursuit, or Dodge. Spend another big slot only when it solves a new problem.', '“Everybody breathe. Except you, Mr. Big.”']
  };
  $$('[data-situation]').forEach(button => button.addEventListener('click', () => {
    $$('[data-situation]').forEach(other => {
      const active = other === button;
      other.classList.toggle('selected', active); other.setAttribute('aria-pressed', String(active));
    });
    const [play, ...copy] = situations[button.dataset.situation];
    ['#move-tag', '#move-title', '#move-body', '#move-quote'].forEach((id, index) => { $(id).textContent = copy[index]; });
    $('#move-link').href = $('#move-link').dataset.base + play;
  }));

  if (!$('#hp-input')) return;
  const model = window.KiefState;
  let state = model.fresh();
  let invalidStored = false;
  let saveNotice = 'New session · changes save on this browser';
  let saveWarning = false;
  let undoState = null;
  const time = value => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  try {
    const raw = localStorage.getItem(model.key);
    if (raw !== null) {
      state = model.normalize(JSON.parse(raw));
      saveNotice = state.savedAt ? `Loaded browser save · ${new Date(state.savedAt).toLocaleString()}` : 'Loaded browser save';
    }
  } catch (error) {
    saveWarning = true;
    // Leave unreadable stored data untouched until an explicit long-rest reset.
    invalidStored = error.name !== 'SecurityError';
    saveNotice = invalidStored ? 'Saved data could not be read. Tracking is temporary; a confirmed Long Rest starts a new save.' : 'Browser storage unavailable · tracking only in this open page';
  }
  function render() {
    $('#hp-input').value = state.hp;
    $('#hp-fill').style.width = `${state.hp / model.limits.hp * 100}%`;
    for (const field of Object.keys(model.limits).filter(field => field !== 'hp')) $(`#${field}-value`).textContent = `${state[field]} / ${model.limits[field]}`;
    $$('[data-resource]').forEach(button => {
      const value = state[button.dataset.resource];
      button.disabled = Number(button.dataset.delta) < 0 ? value === 0 : value === model.limits[button.dataset.resource];
    });
    $$('[data-slot]').forEach(button => {
      const available = state.slots[button.dataset.slot][button.dataset.index];
      button.classList.toggle('available', available); button.setAttribute('aria-pressed', String(available));
    });
    $('#concentration').value = state.concentration;
    $('#innate-active').checked = state.innateActive;
    $('#reaction-ready').checked = state.reactionReady;
    $('#reaction-dot').style.background = state.reactionReady ? 'var(--sage)' : 'var(--orange)';
    $('#spell-dc').textContent = state.innateActive ? '15' : '14';
    $('#dc-note').textContent = state.innateActive ? 'Sorcerer' : 'base';
    $('#attack-note').textContent = state.innateActive ? 'Sorcerer adv.' : 'to hit';
    $('#restore-sp').disabled = state.restored || state.sp === model.limits.sp;
    $('#restore-sp').textContent = state.restored ? 'SP restoration used' : 'Short rest: recover SP';
    $('#save-state').textContent = saveNotice;
    $('#save-state').classList.toggle('warning', saveWarning);
  }
  function save() {
    if (!invalidStored) {
      const timestamp = new Date().toISOString();
      try {
        localStorage.setItem(model.key, JSON.stringify({ ...state, savedAt: timestamp }));
        state.savedAt = timestamp;
        saveNotice = `Saved on this browser · ${time(timestamp)}`;
        saveWarning = false;
      } catch {
        saveNotice = 'Could not save · changes exist only in this open page';
        saveWarning = true;
      }
    }
    render();
  }
  function change(next) {
    undoState = null;
    if ($('#toast button')) $('#toast').textContent = '';
    state = next; save();
  }
  $$('[data-resource]').forEach(button => button.addEventListener('click', () => change(model.adjust(state, button.dataset.resource, Number(button.dataset.delta)))));
  $('#hp-input').addEventListener('change', event => {
    const input = event.target.value;
    const value = Number(input);
    if (input === '' || !Number.isInteger(value) || value < 0 || value > model.limits.hp) {
      notify('Enter a whole number from 0 to 47.'); render(); return;
    }
    change({ ...state, hp: value });
  });
  $$('[data-slot]').forEach(button => button.addEventListener('click', () => {
    const slots = structuredClone(state.slots);
    const { slot, index } = button.dataset;
    slots[slot][index] = !slots[slot][index];
    change({ ...state, slots });
  }));
  $('#concentration').addEventListener('change', event => {
    const previous = state.concentration;
    change({ ...state, concentration: event.target.value });
    if (previous && previous !== state.concentration) notify(`${previous} ended${state.concentration ? `; now concentrating on ${state.concentration}` : ''}.`);
  });
  $('#innate-active').addEventListener('change', event => change({ ...state, innateActive: event.target.checked }));
  $('#reaction-ready').addEventListener('change', event => change({ ...state, reactionReady: event.target.checked }));
  $('#new-turn').addEventListener('click', () => {
    change({ ...state, reactionReady: true }); notify('New turn · your Reaction is available.');
  });
  $('#restore-sp').addEventListener('click', () => {
    const next = model.restore(state);
    if (next === state) return;
    const recovered = next.sp - state.sp;
    change(next); notify(`Recovered ${recovered} SP. Sorcerous Restoration is used until your next Long Rest.`);
  });
  const dialog = $('#rest-dialog');
  $('#long-rest').addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('close', () => {
    if (dialog.returnValue !== 'confirm') return;
    undoState = { state: structuredClone(state), invalidStored, saveNotice, saveWarning };
    invalidStored = false; state = model.fresh(); save();
    notify('New day · tracked resources restored.', () => {
      if (!undoState) return;
      const previous = undoState;
      undoState = null;
      state = previous.state;
      invalidStored = previous.invalidStored;
      saveNotice = previous.saveNotice;
      saveWarning = previous.saveWarning;
      save(); notify('Rest reset undone.');
    });
    dialog.returnValue = '';
  });
  // Browser tabs on this same origin follow the latest valid saved session.
  addEventListener('storage', event => {
    if (event.key !== model.key) return;
    undoState = null;
    if ($('#toast button')) $('#toast').textContent = '';
    try {
      if (event.newValue === null) {
        invalidStored = true; saveWarning = true;
        saveNotice = 'Browser save removed elsewhere · tracking temporarily; Long Rest starts a new save.';
      } else {
        state = model.normalize(JSON.parse(event.newValue)); invalidStored = false; saveWarning = false;
        saveNotice = 'Updated from another tab on this browser';
      }
    } catch {
      invalidStored = true; saveWarning = true;
      saveNotice = 'Another tab saved unreadable data · tracking temporarily; Long Rest starts a new save.';
    }
    render();
  });
  render();
})();
