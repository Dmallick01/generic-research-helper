// js/tanks.js — Load research protocols from config/domains.json

let TANKS = {};
let FIXED_GATES = [];
let DEFAULT_CONTEXT = '';

async function loadDomainConfig() {
  try {
    const res = await fetch('config/domains.json');
    if (!res.ok) throw new Error('config fetch failed');
    const cfg = await res.json();
    TANKS = cfg.protocols || {};
    FIXED_GATES = cfg.gates || [];
    DEFAULT_CONTEXT = cfg.defaultContext || '';
    applyDomainConfigToUI();
  } catch (e) {
    console.warn('Using inline fallback config:', e);
    TANKS = {
      1: { name: 'Protocol 1', q: 'research topic primary question', desc: 'Primary research protocol.' }
    };
    FIXED_GATES = [{ label: 'RELEVANCE', q: 'Is evidence on-topic?' }];
    applyDomainConfigToUI();
  }
}

function applyDomainConfigToUI() {
  const ctx = document.getElementById('ctxInput');
  if (ctx && DEFAULT_CONTEXT && !ctx.dataset.userEdited) {
    ctx.value = DEFAULT_CONTEXT;
  }

  renderProtocolPills('#tab-pipeline .simplex-pills[data-role="protocols"]', 'selTank');
  renderProtocolPills('#tab-scraper .simplex-pills[data-role="scrape-protocols"]', 'selScrapeTank', 'ss');

  const contSelect = document.getElementById('contSimplex');
  if (contSelect) {
    contSelect.innerHTML = Object.entries(TANKS)
      .map(([id, t]) => `<option value="${id}">${t.name}</option>`)
      .join('');
  }
}

function renderProtocolPills(selector, clickFn, dataAttr = 's') {
  const container = document.querySelector(selector);
  if (!container) return;
  const entries = Object.entries(TANKS);
  container.innerHTML = entries
    .map(([id, t], i) =>
      `<button class="spill${i === 0 ? ' active' : ''}" data-${dataAttr}="${id}" onclick="${clickFn}(${id})"><span>P${id}</span><strong>${escHtml(t.name)}</strong></button>`
    )
    .join('');
  if (entries.length && typeof window.selSimp !== 'undefined') window.selSimp = parseInt(entries[0][0], 10);
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('ctxInput');
  if (ctx) {
    ctx.addEventListener('input', () => { ctx.dataset.userEdited = '1'; });
  }
  loadDomainConfig();
});
