// js/ui.js

// ─── TAB NAVIGATION ──────────────────────────────────────────────────────────
function showTab(id) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.app-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    const tabs = document.querySelectorAll('.app-tab');
    for (let t of tabs) {
        if (t.getAttribute('onclick').includes(`'\${id}'`)) {
            t.classList.add('active');
            break;
        }
    }
}
function showTabById(id) { showTab(id); }

// ─── PROTOCOL SELECTION ────────────────────────────────────────────────────
function selProtocol(n) {
    window.selProtocol = n;
    document.querySelectorAll('#tab-pipeline .spill[data-s]').forEach(b => b.classList.toggle('active', parseInt(b.dataset.s) === n));
    if(document.getElementById('scrapeQuery') && TANKS[n]) {
        document.getElementById('scrapeQuery').value = TANKS[n].q;
    }
}

function selScrapeProtocol(n) {
    window.selScrapeProtocol = n;
    document.querySelectorAll('#tab-scraper .spill[data-ss]').forEach(b => b.classList.toggle('active', parseInt(b.dataset.ss) === n));
    autoQuery();
    // Populate query preview if search_engine is loaded
    const preview = document.getElementById('queryPreviewList');
    if (preview && typeof generateQueryPermutations === 'function') {
        const queries = generateQueryPermutations(n);
        preview.innerHTML = queries.map((q, i) =>
            `<div class="query-chip" style="background:rgba(0,255,170,0.07);border:1px solid var(--border);border-radius:4px;padding:4px 10px;font-size:11px;font-family:var(--mono);color:var(--dim);"><span style="color:var(--acc2);margin-right:6px;">Q${i+1}</span>${esc(q)}</div>`
        ).join('');
    }
}

function autoQuery() {
    const el = document.getElementById('scrapeQuery');
    if (el && typeof window.selScrapeProtocol !== 'undefined' && TANKS[window.selScrapeProtocol]) {
        el.value = TANKS[window.selScrapeProtocol].q;
    }
}

// ─── AGENT STATE ──────────────────────────────────────────────────────────────
function setAgent(id, state) {
    const c = document.getElementById('ac-' + id), s = document.getElementById('as-' + id);
    if(!c || !s) return;
    c.className = 'acard';
    if (state === 'running') { c.classList.add('running'); s.textContent = 'computing...'; }
    else if (state === 'done') { c.classList.add('done'); s.textContent = 'verified ✓'; }
    else if (state === 'blocked') { c.classList.add('blocked'); s.textContent = 'HALTED'; }
    else { s.textContent = 'idle'; }
}

function setProgress(p) {
    const w = document.getElementById('progWrap'), b = document.getElementById('progBar');
    if(w && b) {
        w.style.display = 'block';
        b.style.width = p + '%';
    }
}

function resetAll() {
    if (window.running) return;
    ['base', 'r1', 'r2', 'reg', 'critic', 'final'].forEach(a => setAgent(a, 'idle'));
    const w = document.getElementById('progWrap');
    if(w) w.style.display = 'none';
    const b = document.getElementById('progBar');
    if(b) b.style.width = '0';
    const out = document.getElementById('outSection');
    if(out) out.innerHTML = '';
    const st = document.getElementById('globalStatus');
    if(st) st.textContent = '';
}

// ─── OUTPUT PANELS ────────────────────────────────────────────────────────────
function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function addPanel(section, agentKey, title, content, badgeCls, extra = {}) {
    const sec = document.getElementById(section);
    if(!sec) return null;
    const div = document.createElement('div');
    div.className = 'opanel';
    const vaultId = 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    div.innerHTML = `
    <div class="opanel-hdr">
      <span class="badge \${badgeCls}">\${agentKey}</span>
      <span class="opanel-title">\${title}</span>
      \${extra.vecBadge ? '<span class="vec-badge">⚡ Vector Fed</span>' : ''}
    </div>
    <div class="opanel-body">\${esc(content)}</div>
    <div class="opanel-actions">
      <button class="btn btn-ghost btn-sm" onclick="copyText(this,'\${vaultId}')">Clone DOM</button>
      <button class="btn btn-ghost btn-sm" onclick="dlMd('\${vaultId}')">↓ MarkDown</button>
      <button class="btn btn-ghost btn-sm" onclick="saveToVault('\${vaultId}')">⊞ Vault</button>
      <button class="btn btn-ghost btn-sm" onclick="sendToCont('\${vaultId}')">↩ Inject</button>
    </div>`;
    div.dataset.vid = vaultId;
    div.dataset.content = content;
    div.dataset.title = title;
    sec.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return div;
}

function addThinking(section, id, label) {
    const sec = document.getElementById(section);
    if(!sec) return;
    const d = document.createElement('div');
    d.className = 'opanel';
    d.id = id;
    d.innerHTML = `<div class="opanel-body"><div class="thinking"><span style="font-family:var(--display);font-size:14px">\${label}</span><div class="tdots"><span></span><span></span><span></span></div></div></div>`;
    sec.appendChild(d);
    d.scrollIntoView({ behavior: 'smooth' });
}

function rmThinking(id) {
    const e = document.getElementById(id);
    if (e) e.remove();
}

function copyText(btn, vid) {
    const panel = btn.closest('.opanel');
    navigator.clipboard.writeText(panel.dataset.content || '').then(() => {
        btn.textContent = 'Cloned!';
        setTimeout(() => btn.textContent = 'Clone DOM', 1500);
    });
}

function dlMd(vid) {
    const panel = document.querySelector(`[data-vid="\${vid}"]`);
    if (!panel) return;
    const blob = new Blob(['# ' + panel.dataset.title + '\n\n' + panel.dataset.content], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (panel.dataset.title || 'output').replace(/[^a-z0-9]/gi, '_') + '.md';
    a.click();
}

function sendToCont(vid) {
    const panel = document.querySelector(`[data-vid="\${vid}"]`);
    if (!panel) return;
    const cp = document.getElementById('contPaste');
    if(cp) cp.value = panel.dataset.content || '';
    showTabById('continue');
}

// Run renderVault on load
if(document.readyState !== 'loading') {
    renderVault();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        if(typeof renderVault === 'function') renderVault();
        if(typeof autoQuery === 'function') autoQuery();
    });
}
