'use strict';
(() => {
  const model = window.KiefState;
  const storage = (typeof window !== 'undefined' && window.KiefStorage) || null;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  let toastTimer;
  function notify(message, undo) {
    clearTimeout(toastTimer);
    const toast = $('#toast');
    toast.textContent = message;
    if (undo) {
      const button = document.createElement('button');
      button.textContent = 'Undo';
      button.addEventListener('click', undo, { once: true });
      toast.append(button);
    } else toastTimer = setTimeout(() => { toast.textContent = ''; }, 6000);
  }

  // Play and spell links open as stacked cards; the href stays a real page for no-JS, new tabs, and failures.
  const cards = [];
  const pages = new Map();
  let cardSequence = 0;
  let cardQueue = Promise.resolve();
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
    if (source && ((source.classList && source.classList.contains('spell-card')) || source.querySelector('.spell-modal-layout'))) {
      card.classList.add('spell-card-modal');
      const rawBg = source.style.getPropertyValue('--spell-bg') || source.dataset.spellBg || (source.querySelector && source.querySelector('[data-spell-bg]')?.dataset.spellBg);
      if (rawBg) card.style.setProperty('--spell-bg', rawBg.startsWith('url(') ? rawBg : `url('${rawBg}')`);
    }
    card.dataset.key = key;
    card.dataset.depth = cards.length;
    card.style.setProperty('--depth', Math.min(cards.length, 6));
    card.innerHTML = '<div class="card-bar"><a class="text-link" data-no-card>Full page <span aria-hidden="true">↗</span></a><button type="button" aria-label="Close card">×</button></div><div class="card-body"></div>';
    card.querySelector('[data-no-card]').href = url.href;
    const body = card.querySelector('.card-body');
    body.append(...(url.hash ? [source] : [...source.children]).map(node => node.cloneNode(true)));
    // A spell card opened on purpose shows everything; folded sections stay folded on play cards.
    if (url.hash) body.querySelectorAll('details').forEach(node => { node.open = true; });
    body.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    body.querySelectorAll('[data-card]').forEach(node => node.removeAttribute('data-card'));
    body.querySelectorAll('a[href]').forEach(link => link.setAttribute('href', new URL(link.getAttribute('href'), url).href));
    const title = body.querySelector('h1, h2');
    if (title) {
      title.id = `card-title-${++cardSequence}`;
      card.setAttribute('aria-labelledby', title.id);
      const link = title.querySelector('a.card-link');
      if (link) title.textContent = link.textContent.trim();
      const spellName = title.textContent.trim();
      if (model.spells && model.spells[spellName] && typeof openCast === 'function') {
        const castBtn = document.createElement('button');
        castBtn.type = 'button';
        castBtn.className = 'button primary cast-action-btn';
        castBtn.style.cssText = 'margin-left: auto; font-size: 11px;';
        castBtn.textContent = `Cast ${spellName} ✧`;
        castBtn.addEventListener('click', () => { card.close(); openCast(spellName); });
        const top = body.querySelector('.card-top');
        if (top) top.append(castBtn); else body.append(castBtn);
      }
    }
    body.querySelectorAll('.action-cast').forEach(btn => {
      btn.addEventListener('click', () => {
        const spellName = btn.dataset.castName;
        card.close();
        if (typeof openCast === 'function') openCast(spellName);
      });
    });
    body.querySelectorAll('.action-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(btn.dataset.copyText).then(() => notify('Copied spell text to clipboard')).catch(() => notify('Failed to copy'));
        }
      });
    });
    body.querySelectorAll('.action-share').forEach(btn => {
      btn.addEventListener('click', () => {
        if (navigator.clipboard) {
          const shareUrl = new URL(btn.dataset.spellAnchor, location.href).href;
          navigator.clipboard.writeText(shareUrl).then(() => notify('Copied spell link to clipboard')).catch(() => notify('Failed to copy link'));
        }
      });
    });
    body.querySelectorAll('.action-fav').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = body.querySelector('#in-plays');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          notify('Saved ' + btn.dataset.favName + ' to favorites');
        }
      });
    });
    body.querySelectorAll('.text-link:not([data-no-card])').forEach(el => el.remove());
    card.querySelector('.card-bar button').addEventListener('click', () => card.close());
    card.addEventListener('click', event => { if (event.target === card) card.close(); });
    card.addEventListener('close', () => {
      const index = cards.indexOf(card);
      if (index >= 0) cards.splice(index, 1);
      card.remove();
    });
    document.body.append(card);
    cards.push(card);
    card.showModal();
  }
  let openCast = null;
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = cardTarget(event.target.closest('a[href]'));
    if (!url) return;
    event.preventDefault();
    cardQueue = cardQueue.then(() => openCard(url)).catch(() => { location.href = url.href; });
  });

  const directory = $('[data-directory]');
  if (directory) {
    const search = $('[data-search]');
    const filter = $('[data-filter]');
    const cards = $$('[data-card]');
    const noun = $('[data-count]').textContent.trim().split(' ').pop();
    function apply() {
      const query = search.value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
      let count = 0;
      for (const card of cards) {
        const match = card.dataset.searchText.toLocaleLowerCase().replace(/\s+/g, ' ').includes(query) && (!filter.value || filter.value === card.dataset.filterValue);
        card.hidden = !match;
        if (match) count++;
      }
      $('[data-count]').textContent = `${count} ${count === 1 ? noun.replace(/s$/, '') : noun}`;
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

  let selectedSituation = 'crowd';
  const situations = {
    crowd: ['k-2/', 'ACTION · 3RD LEVEL · CONCENTRATION', 'Give everyone a moment.', 'Careful Hypnotic Pattern. Spend 1 SP to protect up to three allies. Mark affected enemies and tell the party to avoid damaging them; they are Charmed and Incapacitated, not Unconscious.', '“Let’s all take a moment. Them especially.”'],
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
    selectedSituation = button.dataset.situation;
    ['#move-tag', '#move-title', '#move-body', '#move-quote'].forEach((id, index) => { $(id).textContent = copy[index]; });
    $('#move-link').href = $('#move-link').dataset.base + play;
    if ($('#move-status')) $('#move-status').textContent = model.guidance(state, selectedSituation);
  }));

  if (!$('#hp-input')) return;
  let state = model.fresh();
  let invalidStored = false;
  let saveNotice = 'New session · changes save on this browser';
  let saveWarning = false;
  let undoState = null;
  const time = value => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let storageLoaded = false;
  let stateRevision = 0;
  let isPersisted = false;
  let idbAvailable = false;
  let idbMirrorFailing = false;

  function updateStorageBadge() {
    const badge = $('#storage-status');
    if (!badge) return;
    if (saveWarning || idbMirrorFailing) {
      badge.textContent = 'Storage warning ⚠️';
      badge.title = 'Storage operation failed; changes may not be safely mirrored';
      badge.classList.add('warning');
    } else if (isPersisted) {
      badge.textContent = 'Persistent 🔒';
      badge.title = 'Non-evictable storage granted by browser';
      badge.classList.remove('warning');
    } else if (idbAvailable) {
      badge.textContent = 'Mirrored ⚡';
      badge.title = 'Saved in localStorage and mirrored in IndexedDB';
      badge.classList.remove('warning');
    } else {
      badge.textContent = 'Local only 💾';
      badge.title = 'Saved in localStorage only (IndexedDB unavailable)';
      badge.classList.remove('warning');
    }
  }

  try {
    const raw = localStorage.getItem(model.key);
    if (raw !== null) {
      state = model.normalize(JSON.parse(raw));
      saveNotice = state.savedAt ? `Loaded browser save · ${new Date(state.savedAt).toLocaleString()}` : 'Loaded browser save';
      storageLoaded = true;
    }
  } catch (error) {
    saveWarning = true;
    // Leave unreadable stored data untouched until an explicit long-rest reset.
    invalidStored = error.name !== 'SecurityError';
    saveNotice = invalidStored ? 'Saved data could not be read. Tracking is temporary. Use Recover save to preserve the old data and save these counters.' : 'Browser storage unavailable · tracking only in this open page';
  }

  // Dual-storage resilience: If localStorage was empty/cleared, rescue from IndexedDB mirror
  const startupRev = stateRevision;
  if (storage) {
    if (typeof storage.isAvailable === 'function') {
      storage.isAvailable().then(avail => {
        idbAvailable = Boolean(avail);
        updateStorageBadge();
      }).catch(() => {
        idbAvailable = false;
        updateStorageBadge();
      });
    }

    if (!storageLoaded && !invalidStored) {
      storage.loadMirror().then(mirrored => {
        // Revision guard: If user edited or imported or changed state while mirror read was pending, do NOT overwrite
        if (stateRevision !== startupRev || localStorage.getItem(model.key) !== null) {
          return;
        }
        if (mirrored) {
          try {
            state = model.normalize(mirrored);
            saveNotice = state.savedAt ? `Restored from IndexedDB backup · ${time(state.savedAt)}` : 'Restored from IndexedDB backup';
            saveWarning = false;
            try { localStorage.setItem(model.key, JSON.stringify(state)); } catch {}
            render();
            notify('Session restored from resilient IndexedDB backup.');
          } catch {}
        }
      }).catch(() => {});
    }

    storage.loadUndo().then(savedUndo => {
      if (stateRevision !== startupRev || undoState !== null) return;
      if (savedUndo) {
        try {
          undoState = model.normalize(savedUndo);
          if ($('#undo-change')) $('#undo-change').disabled = false;
        } catch {}
      }
    }).catch(() => {});

    storage.requestPersistence().then(persisted => {
      isPersisted = Boolean(persisted);
      updateStorageBadge();
    }).catch(() => {
      isPersisted = false;
      updateStorageBadge();
    });
  }
  updateStorageBadge();
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
    $('#recover-save').hidden = !invalidStored;
    $('#undo-change').disabled = !undoState;
    $('#combat-hp').textContent = `${state.hp}/47 HP`;
    $('#combat-focus').textContent = state.concentration || 'No concentration';
    $('#combat-reaction').textContent = state.reactionReady ? 'Reaction ready' : 'Reaction spent';
    $('#move-status').textContent = model.guidance(state, selectedSituation);

    const isKief = state.turnActive;
    $('#combat-turn-label').textContent = isKief ? 'Kief’s turn' : 'Off-turn';
    $('#combat-turn-btn').classList.toggle('off-turn', !isKief);
    $('#turn-label').textContent = isKief ? 'Kief’s turn' : 'Off-turn (another creature)';
    $('#toggle-turn-btn').classList.toggle('off-turn', !isKief);

    const setPill = (id, ready) => {
      const el = $(id);
      if (!el) return;
      el.classList.toggle('ready', ready);
      el.classList.toggle('spent', !ready);
      el.setAttribute('aria-pressed', String(ready));
    };
    setPill('#turn-action', state.actionReady);
    setPill('#turn-bonus', state.bonusActionReady);
    setPill('#turn-reaction', state.reactionReady);
    setPill('#turn-slot', !state.slotSpentThisTurn);
  }
  function save(summary) {
    stateRevision++;
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
      if (storage) {
        storage.saveMirror(state).then(ok => {
          if (ok === false) {
            idbMirrorFailing = true;
            updateStorageBadge();
          } else {
            idbMirrorFailing = false;
            idbAvailable = true;
            updateStorageBadge();
          }
        }).catch(() => {
          idbMirrorFailing = true;
          updateStorageBadge();
        });
        storage.saveUndo(undoState).catch(() => {});
        storage.addSnapshot(state, summary || 'Tracker change').catch(() => {});
      }
    }
    updateStorageBadge();
    render();
  }
  function change(next, summary) {
    undoState = structuredClone(state);
    if ($('#toast button')) $('#toast').textContent = '';
    state = next.hp === 0 ? { ...next, concentration: '' } : next;
    $('#damage-result').textContent = ''; save(summary);
  }
  function undo() {
    if (!undoState) return;
    state = undoState; undoState = null;
    $('#damage-result').textContent = '';
    save('Undone change'); notify('Last tracker change undone.');
  }
  $('#undo-change').addEventListener('click', undo);
  $('#apply-damage').addEventListener('click', () => {
    const amount = Number($('#hp-amount').value);
    try {
      const result = model.damage(state, amount);
      change(result.state);
      $('#damage-result').textContent = result.ended ? 'At 0 HP: concentration ended. Resolve death saves and massive damage at the table.' : result.dc ? `Concentration: make a CON save, +7 against DC ${result.dc}. On failure, clear concentration.` : 'Damage recorded.';
    } catch (error) { notify(error.message); }
  });
  $('#apply-healing').addEventListener('click', () => {
    const amount = Number($('#hp-amount').value);
    if (!Number.isInteger(amount) || amount < 1) { notify('Enter positive whole-number healing.'); return; }
    change(model.adjust(state, 'hp', amount)); $('#damage-result').textContent = 'Healing recorded, up to 47 HP.';
  });
  const recovery = $('#recovery-dialog');
  $('#recover-save').addEventListener('click', () => { recovery.returnValue = ''; recovery.showModal(); });
  recovery.addEventListener('close', () => {
    if (recovery.returnValue !== 'confirm') return;
    try { model.backupUnreadable(localStorage); }
    catch { notify('Could not preserve the old save. Export your tracking before changing browser storage.'); return; }
    invalidStored = false; save();
    notify(saveWarning ? 'Recovery could not finish; export your tracking.' : 'Current counters saved. The unreadable original is preserved in browser recovery storage.');
  });
  let exportUrl = null;
  $('#export-dialog').addEventListener('close', () => { if (exportUrl) URL.revokeObjectURL(exportUrl); exportUrl = null; });
  $('#export-save').addEventListener('click', () => {
    const recoveryData = {};
    let stored = null, storageReadable = true;
    try {
      stored = localStorage.getItem(model.key);
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`${model.key}.recovery.`)) recoveryData[key] = localStorage.getItem(key);
      }
    } catch { storageReadable = false; }
    const text = JSON.stringify({ exportedAt: new Date().toISOString(), state, stored, recoveryData, storageReadable }, null, 2);
    $('#export-text').value = text;
    exportUrl = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    $('#download-backup').href = exportUrl;
    $('#export-dialog').showModal();
  });
  $$('[data-resource]').forEach(button => button.addEventListener('click', () => change(model.adjust(state, button.dataset.resource, Number(button.dataset.delta)))));
  $('#hp-input').addEventListener('change', event => {
    const input = event.target.value;
    const value = Number(input);
    if (input === '' || !Number.isInteger(value) || value < 0 || value > model.limits.hp) {
      notify('Enter a whole number from 0 to 47.'); render(); return;
    }
    if (value === state.hp) return;
    change({ ...state, hp: value, concentration: value === 0 ? '' : state.concentration });
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
  const advanceTurn = () => {
    change(model.startTurn(state));
    notify('Started new turn · Action, Bonus Action, Reaction, and slot limit ready.', () => undo());
  };
  $('#new-turn')?.addEventListener('click', advanceTurn);
  $('#advance-turn-btn')?.addEventListener('click', advanceTurn);

  const toggleTurnContext = () => {
    if (state.turnActive) {
      change(model.endTurn(state));
      notify('Switched to off-turn (another creature).', () => undo());
    } else {
      change({ ...state, turnActive: true, slotSpentThisTurn: Boolean(state.kiefSlotSpent) });
      notify('Switched to Kief’s turn.', () => undo());
    }
  };
  $('#combat-turn-btn')?.addEventListener('click', toggleTurnContext);
  $('#toggle-turn-btn')?.addEventListener('click', toggleTurnContext);

  $('#turn-action')?.addEventListener('click', () => change({ ...state, actionReady: !state.actionReady }));
  $('#turn-bonus')?.addEventListener('click', () => change({ ...state, bonusActionReady: !state.bonusActionReady }));
  $('#turn-reaction')?.addEventListener('click', () => change({ ...state, reactionReady: !state.reactionReady }));
  $('#turn-slot')?.addEventListener('click', () => {
    const nextSpent = !state.slotSpentThisTurn;
    change({ ...state, slotSpentThisTurn: nextSpent, kiefSlotSpent: state.turnActive ? nextSpent : state.kiefSlotSpent });
  });
  $('#restore-sp').addEventListener('click', () => {
    const next = model.restore(state);
    if (next === state) return;
    const recovered = next.sp - state.sp;
    change(next); notify(`Recovered ${recovered} SP. Sorcerous Restoration is used until your next Long Rest.`);
  });
  const dialog = $('#rest-dialog');
  $('#long-rest').addEventListener('click', () => { dialog.returnValue = ''; dialog.showModal(); });
  dialog.addEventListener('close', () => {
    if (dialog.returnValue !== 'confirm') return;
    if (invalidStored) {
      try { model.backupUnreadable(localStorage); }
      catch { notify('Old save could not be preserved. Export your tracking before resetting.'); return; }
    }
    undoState = structuredClone(state);
    invalidStored = false; state = model.fresh(); $('#damage-result').textContent = ''; save();
    notify('New day · tracked resources restored.', () => {
      if (!undoState) return;
      undo();
    });
    dialog.returnValue = '';
  });

  let refreshOpenCast = null;
  const castDialog = $('#cast-dialog');
  if (castDialog) {
    const castSpell = $('#cast-spell');
    const castMethod = $('#cast-method');
    const castMetamagic = $('#cast-metamagic');
    const castPreview = $('#cast-preview');
    const castWarning = $('#cast-warning');
    const castOverrideWrap = $('#cast-override-wrap');
    const castOverride = $('#cast-override');
    const castSubmit = $('#cast-submit');

    function updateCastMethods(spellName) {
      const meta = model.spells[spellName];
      if (!meta) return;
      castMethod.innerHTML = '';
      let defaultVal = '';
      if (meta.level === 0) {
        castMethod.innerHTML = '<option value="cantrip">Cantrip (no slot)</option>';
        defaultVal = 'cantrip';
      } else {
        if (meta.freeResource) {
          const count = state[meta.freeResource] ?? 0;
          const label = meta.freeResource === 'animals' ? 'Forest Gnome (Speak with Animals)' : 'Magic Initiate (Find Familiar)';
          castMethod.innerHTML += `<option value="free">Free feature: ${label} (${count} left)</option>`;
          if (!defaultVal) defaultVal = 'free';
        }
        if (meta.ritual) {
          castMethod.innerHTML += '<option value="ritual">Ritual (+10 min, no slot)</option>';
          if (!defaultVal) defaultVal = 'ritual';
        }
        for (let lvl = meta.level; lvl <= 3; lvl++) {
          const avail = state.slots[lvl]?.filter(Boolean).length || 0;
          const total = state.slots[lvl]?.length || 0;
          const suffix = lvl === 1 ? 'st' : lvl === 2 ? 'nd' : 'rd';
          castMethod.innerHTML += `<option value="${lvl}">${lvl}${suffix}-level slot (${avail} of ${total} available)</option>`;
          if (!defaultVal) defaultVal = String(lvl);
        }
      }
      castMethod.value = defaultVal;
    }

    function updateCastPreview() {
      const spellName = castSpell.value || 'Fire Bolt';
      const methodVal = castMethod.value;
      const metamagic = castMetamagic.value;
      const override = castOverride.checked;

      let method = 'slot';
      let slotLevel = 0;
      if (methodVal === 'cantrip' || methodVal === 'free' || methodVal === 'ritual') {
        method = methodVal;
      } else {
        slotLevel = Number(methodVal) || 0;
      }

      const basePreview = model.previewCast(state, spellName, { method, slotLevel, metamagic });
      const preview = override ? model.previewCast(state, spellName, { method, slotLevel, metamagic, override: true }) : basePreview;

      let previewHtml = `<div class="preview-row"><span>Casting time</span><strong>${preview.time}</strong></div>`;
      if (preview.slotLevel > 0) {
        previewHtml += `<div class="preview-row"><span>Slot cost</span><strong>Level ${preview.slotLevel} slot</strong></div>`;
      } else if (preview.method === 'free') {
        previewHtml += `<div class="preview-row"><span>Resource</span><strong>${preview.freeResource === 'animals' ? 'Speak with Animals use' : 'Find Familiar use'}</strong></div>`;
      } else if (preview.method === 'ritual') {
        previewHtml += '<div class="preview-row"><span>Resource</span><strong>Ritual (no slot)</strong></div>';
      } else {
        previewHtml += '<div class="preview-row"><span>Resource</span><strong>Cantrip (no slot)</strong></div>';
      }

      if (preview.spCost > 0) {
        previewHtml += `<div class="preview-row"><span>Metamagic cost</span><strong>${preview.spCost} SP (${metamagic})</strong></div>`;
      }

      if (preview.concentration) {
        previewHtml += `<div class="preview-row"><span>Concentration</span><strong>${preview.concentration}</strong></div>`;
      } else {
        previewHtml += `<div class="preview-row"><span>Concentration</span><span>None ${state.concentration ? `(${state.concentration} remains active)` : ''}</span></div>`;
      }

      if (preview.usesReaction) {
        previewHtml += '<div class="preview-row"><span>Reaction</span><strong>Spends Reaction</strong></div>';
      }

      if (preview.replacesConcentration) {
        previewHtml += `<div class="cast-alert">⚠️ Replaces active concentration on <strong>${preview.replacesConcentration}</strong>.</div>`;
      }

      castPreview.innerHTML = previewHtml;

      if (basePreview.structuralErrors && basePreview.structuralErrors.length > 0) {
        castWarning.hidden = false;
        castWarning.textContent = basePreview.structuralErrors.join(' ');
        castOverrideWrap.hidden = true;
        castOverride.checked = false;
        castSubmit.disabled = true;
      } else if (basePreview.errors.length > 0) {
        castWarning.hidden = false;
        castWarning.textContent = basePreview.errors.join(' ');
        castOverrideWrap.hidden = false;
        castSubmit.disabled = !override;
      } else {
        castWarning.hidden = preview.warnings.length === 0;
        castWarning.textContent = preview.warnings.join(' ');
        castOverrideWrap.hidden = true;
        castOverride.checked = false;
        castSubmit.disabled = false;
      }
    }

    openCast = function (preset) {
      if (preset && model.spells[preset]) {
        castSpell.value = preset;
      } else if (!castSpell.value || !model.spells[castSpell.value]) {
        castSpell.value = 'Fire Bolt';
      }
      updateCastMethods(castSpell.value);
      castOverride.checked = false;
      updateCastPreview();
      castDialog.showModal();
    };

    $('#open-cast')?.addEventListener('click', () => openCast());
    $('#combat-cast')?.addEventListener('click', () => openCast());
    $('#cast-cancel')?.addEventListener('click', () => castDialog.close());

    castSpell?.addEventListener('change', () => {
      castOverride.checked = false;
      updateCastMethods(castSpell.value);
      updateCastPreview();
    });
    castMethod?.addEventListener('change', () => {
      castOverride.checked = false;
      updateCastPreview();
    });
    castMetamagic?.addEventListener('change', () => {
      castOverride.checked = false;
      updateCastPreview();
    });
    castOverride?.addEventListener('change', updateCastPreview);

    $('#cast-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const spellName = castSpell.value;
      const methodVal = castMethod.value;
      const metamagic = castMetamagic.value;
      const override = !castOverrideWrap.hidden && castOverride.checked;

      let method = 'slot';
      let slotLevel = 0;
      if (methodVal === 'cantrip' || methodVal === 'free' || methodVal === 'ritual') {
        method = methodVal;
      } else {
        slotLevel = Number(methodVal);
      }

      try {
        const result = model.cast(state, spellName, { method, slotLevel, metamagic, override });
        change(result.state);
        castDialog.close();
        notify(result.summary, () => undo());
      } catch (err) {
        notify(err.message);
      }
    });

    refreshOpenCast = () => {
      if (castDialog.open) {
        castOverride.checked = false;
        updateCastMethods(castSpell.value);
        updateCastPreview();
      }
    };
  }

  // Browser tabs on this same origin follow the latest valid saved session.
  addEventListener('storage', event => {
    if (event.key === model.key) syncFromStorage(event.newValue);
  });
  function syncFromStorage(newValue) {
    $('#damage-result').textContent = '';
    undoState = null;
    if ($('#toast button')) $('#toast').textContent = '';
    try {
      if (newValue === null) {
        invalidStored = true; saveWarning = true;
        saveNotice = 'Browser save removed elsewhere · tracking temporarily; Long Rest starts a new save.';
      } else {
        state = model.normalize(JSON.parse(newValue)); invalidStored = false; saveWarning = false;
        saveNotice = 'Updated from another tab on this browser';
      }
    } catch {
      invalidStored = true; saveWarning = true;
      saveNotice = 'Another tab saved unreadable data · tracking temporarily; Long Rest starts a new save.';
    }
    render();
    refreshOpenCast?.();
  }

  // Screen Wake Lock for iPad tabletop use
  let wakeLock = null;
  let wakeLockActive = false;
  const wakeBtn = $('#wake-lock-btn');

  function setWakeUi(on) {
    if (!wakeBtn) return;
    wakeBtn.classList.toggle('active', on);
    wakeBtn.innerHTML = `<span class="wake-dot"></span>Table mode${on ? ': ON' : ''}`;
  }

  async function acquireWakeLock(silent = false) {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      wakeLockActive = false;
      setWakeUi(false);
      notify('Table mode unavailable: Screen Wake Lock is not supported on this browser.');
      return;
    }
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLockActive = true;
      setWakeUi(true);
      if (!silent) notify('Table mode active: Screen will stay awake on the table.');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
        if (!wakeLockActive) setWakeUi(false);
      });
    } catch {
      wakeLock = null;
      wakeLockActive = false;
      setWakeUi(false);
      notify('Table mode failed: Could not acquire screen wake lock.');
    }
  }

  async function releaseWakeLock() {
    wakeLockActive = false;
    if (wakeLock) {
      try { await wakeLock.release(); } catch {}
      wakeLock = null;
    }
    setWakeUi(false);
    notify('Table mode deactivated. Screen will follow standard sleep settings.');
  }

  wakeBtn?.addEventListener('click', () => {
    if (wakeLockActive || wakeLock) releaseWakeLock();
    else acquireWakeLock();
  });

  // iPad lifecycle: every change already saves synchronously, so only commit an HP edit still sitting in the input.
  function flushPending() {
    const hpInput = $('#hp-input');
    if (document.activeElement !== hpInput) return;
    const val = Number(hpInput.value);
    if (hpInput.value !== '' && Number.isInteger(val) && val >= 0 && val <= model.limits.hp && val !== state.hp) {
      change({ ...state, hp: val, concentration: val === 0 ? '' : state.concentration }, 'HP edit on blur');
    }
  }

  // Suspended iOS tabs can miss storage events; catch up through the same path when shown again.
  function resyncIfStale() {
    let raw;
    try { raw = localStorage.getItem(model.key); } catch { return; }
    if (raw === null) return;
    try {
      if (JSON.parse(raw).savedAt === state.savedAt) return;
    } catch {
      if (invalidStored) return;
    }
    syncFromStorage(raw);
  }

  addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPending();
    } else if (document.visibilityState === 'visible') {
      resyncIfStale();
      if (wakeLockActive && !wakeLock) acquireWakeLock(true);
    }
  });
  addEventListener('pagehide', flushPending);

  // Import / restore backup
  const importDialog = $('#import-dialog');
  const importFile = $('#import-file');
  const importText = $('#import-text');
  const importPreview = $('#import-preview');
  const importError = $('#import-error');
  const importConfirm = $('#import-confirm');
  const importCancel = $('#import-cancel');
  let parsedImportState = null;

  const slotSummary = s => [1, 2, 3].map(level => `${s.slots[level].filter(Boolean).length}/${s.slots[level].length}`).join(', ');

  // Archive the active save (or preserve unreadable bytes) before replacing state; a failed archive blocks the replacement.
  function replaceState(next, label, archiveTag) {
    try {
      if (invalidStored) model.backupUnreadable(localStorage);
      else {
        const raw = localStorage.getItem(model.key);
        if (raw !== null) localStorage.setItem(`${model.key}.recovery.${archiveTag}.${new Date().toISOString()}`, raw);
      }
    } catch {
      notify('Could not archive current save, so nothing was replaced. Export tracking first.');
      return false;
    }
    undoState = structuredClone(state);
    state = next;
    invalidStored = false;
    save(label);
    return true;
  }

  function checkImport(content) {
    try {
      parsedImportState = model.validateBackup(content);
      if (importError) importError.hidden = true;
      if (importPreview) {
        importPreview.hidden = false;
        const s = parsedImportState;
        importPreview.innerHTML = `<strong>Valid backup found:</strong><br>HP: <strong>${s.hp}/${model.limits.hp}</strong> · SP: <strong>${s.sp}/${model.limits.sp}</strong> · Slots (1/2/3): <strong>${slotSummary(s)}</strong><br>Concentration: <strong>${s.concentration || 'None'}</strong> · Turn: <strong>${s.turnActive ? 'Kief' : 'Off-turn'}</strong>`;
      }
      if (importConfirm) importConfirm.disabled = false;
    } catch (err) {
      parsedImportState = null;
      if (importPreview) importPreview.hidden = true;
      if (importError) {
        importError.hidden = false;
        importError.textContent = err.message || 'Invalid backup format.';
      }
      if (importConfirm) importConfirm.disabled = true;
    }
  }

  $('#import-save')?.addEventListener('click', () => {
    parsedImportState = null;
    if (importFile) importFile.value = '';
    if (importText) importText.value = '';
    if (importPreview) importPreview.hidden = true;
    if (importError) importError.hidden = true;
    if (importConfirm) importConfirm.disabled = true;
    importDialog?.showModal();
  });

  importFile?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target.result;
      if (importText) importText.value = content;
      checkImport(content);
    };
    reader.readAsText(file);
  });

  importText?.addEventListener('input', () => {
    const val = importText.value.trim();
    if (!val) {
      parsedImportState = null;
      if (importPreview) importPreview.hidden = true;
      if (importError) importError.hidden = true;
      if (importConfirm) importConfirm.disabled = true;
      return;
    }
    checkImport(val);
  });

  importCancel?.addEventListener('click', () => importDialog?.close());

  importConfirm?.addEventListener('click', () => {
    if (!parsedImportState || !replaceState(parsedImportState, 'Imported session backup', 'pre-import')) return;
    importDialog?.close();
    notify('Backup restored successfully. Previous state archived in recovery storage.', () => undo());
  });

  // Session history & rolling snapshots
  const snapshotsDialog = $('#snapshots-dialog');
  const snapshotsList = $('#snapshots-list');

  $('#snapshots-btn')?.addEventListener('click', async () => {
    if (!storage || !snapshotsList) {
      notify('Session snapshot history requires IndexedDB support.');
      return;
    }
    // Same-origin pages (shared GitHub Pages host) can write this store: validate before display, render as text.
    const list = (await storage.getSnapshots()).flatMap(item => {
      try { return [{ ...item, state: model.normalize(item.state) }]; } catch { return []; }
    });
    snapshotsList.innerHTML = '';
    if (list.length === 0) {
      snapshotsList.innerHTML = `<div class="snapshots-empty">${idbAvailable ? 'No rolling snapshots recorded yet. Snapshots are automatically captured during table actions.' : 'Snapshot history is unavailable because IndexedDB could not be opened.'}</div>`;
    }
    for (const item of list) {
      const s = item.state;
      const when = new Date(item.timestamp);
      const timeStr = when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const card = document.createElement('div');
      card.className = 'snapshot-card';
      card.innerHTML = '<div class="snapshot-info"><div class="snapshot-time"></div><div class="snapshot-summary"></div><div class="snapshot-details"></div></div><button type="button" class="button">Restore</button>';
      card.querySelector('.snapshot-time').textContent = `${timeStr} · ${when.toLocaleDateString()}`;
      card.querySelector('.snapshot-summary').textContent = String(item.summary || 'Tracker state');
      card.querySelector('.snapshot-details').textContent = `${s.hp}/${model.limits.hp} HP · ${s.sp}/${model.limits.sp} SP · Slots: ${slotSummary(s)}${s.concentration ? ` · Conc: ${s.concentration}` : ''}`;
      card.querySelector('button').addEventListener('click', () => {
        if (!replaceState(s, 'Restored snapshot', 'pre-snapshot')) return;
        snapshotsDialog?.close();
        notify(`Restored snapshot from ${timeStr}. Previous state archived in recovery storage.`, () => undo());
      });
      snapshotsList.append(card);
    }
    snapshotsDialog?.showModal();
  });

  render();
})();
