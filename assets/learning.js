'use strict';
(() => {
  // Native details remain usable without JavaScript. Enhance only reading and dismissal.
  const tips = () => [...document.querySelectorAll('.learning-tip')];
  let leaveTimer;
  const closeTips = except => tips().forEach(tip => { if (tip !== except) tip.open = false; });
  function position(tip) {
    const body = tip.querySelector('.learning-tip-body');
    if (!body || !tip.open) return;
    const anchor = tip.querySelector('summary').getBoundingClientRect();
    body.style.left = '16px';
    body.style.top = '16px';
    body.style.bottom = 'auto';
    const box = body.getBoundingClientRect();
    const left = Math.max(16, Math.min(anchor.left, innerWidth - box.width - 16));
    const below = anchor.bottom + 8;
    const top = below + box.height <= innerHeight - 16 ? below : Math.max(16, anchor.top - box.height - 8);
    body.style.left = `${left}px`;
    body.style.top = `${top}px`;
  }
  document.addEventListener('toggle', event => {
    const tip = event.target;
    if (!tip.matches('.learning-tip') || !tip.open) return;
    closeTips(tip);
    position(tip);
  }, true);
  document.addEventListener('pointerover', event => {
    const tip = event.target.closest('.learning-tip');
    if (tip) clearTimeout(leaveTimer);
    if (!tip || event.pointerType !== 'mouse' || tip.contains(event.relatedTarget)) return;
    closeTips(tip);
    tip.open = true;
    position(tip);
  });
  document.addEventListener('pointerout', event => {
    const tip = event.target.closest('.learning-tip');
    if (tip && event.pointerType === 'mouse' && !tip.contains(event.relatedTarget)) {
      // Allow the pointer to cross the small gap into the floating explanation.
      leaveTimer = setTimeout(() => { if (!tip.contains(document.activeElement)) tip.open = false; }, 200);
    }
  });
  document.addEventListener('focusin', event => {
    const tip = event.target.closest('.learning-tip');
    if (tip && event.target.matches('summary:focus-visible')) {
      closeTips(tip);
      tip.open = true;
      position(tip);
    }
  });
  document.addEventListener('focusout', event => {
    const tip = event.target.closest('.learning-tip');
    if (tip && !tip.contains(event.relatedTarget)) tip.open = false;
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.learning-tip')) closeTips();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !tips().some(tip => tip.open)) return;
    // Dismiss the hint first; do not accidentally dismiss the underlying cast/card dialog.
    event.preventDefault();
    event.stopImmediatePropagation();
    closeTips();
  }, true);
  addEventListener('resize', () => tips().filter(tip => tip.open).forEach(position));
  document.addEventListener('scroll', () => tips().filter(tip => tip.open).forEach(position), true);

  function revealLesson() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!id) return;
    const target = document.getElementById(id);
    const lesson = target && target.closest('.learning-lesson');
    if (!lesson) return;
    lesson.open = true;
    target.scrollIntoView({ block: 'start' });
  }
  addEventListener('hashchange', revealLesson);
  revealLesson();
  let printClosed = [];
  addEventListener('beforeprint', () => {
    closeTips();
    printClosed = [...document.querySelectorAll('.learning-lesson:not([open])')];
    printClosed.forEach(lesson => { lesson.open = true; });
  });
  addEventListener('afterprint', () => printClosed.forEach(lesson => { lesson.open = false; }));
})();
