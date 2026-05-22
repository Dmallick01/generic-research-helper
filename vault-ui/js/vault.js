// js/vault.js

// ─── STATE ───────────────────────────────────────────────────────────────────
let vault = JSON.parse(localStorage.getItem('svault') || '[]');

function persistVault() {
    localStorage.setItem('svault', JSON.stringify(vault));
}

function clearVault() {
    if (confirm('Warning: Permanent memory purge?')) {
        vault = [];
        persistVault();
        renderVault();
    }
}

function exportAllMd() {
    if (!vault.length) {
        alert('Matrix empty.');
        return;
    }
    const txt = vault.map(i => '# ' + i.title + '\n_Timestamp: ' + i.ts + '_\n\n' + i.content).join('\n\n---\n\n');
    const blob = new Blob([txt], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'research_tank_archive_' + Date.now() + '.md';
    a.click();
}

function loadFromVault(target) {
    if (!vault.length) {
        alert('Matrix empty.');
        return;
    }
    const names = vault.map((v, i) => i + ': ' + v.title).join('\n');
    const idx = parseInt(prompt('Select array index:\n' + names));
    if (isNaN(idx) || !vault[idx]) return;
    if (target === 'cont') {
        document.getElementById('contPaste').value = vault[idx].content;
    }
}

function renderVault() {
    const el = document.getElementById('vaultList');
    if (!el) return;
    if (!vault.length) {
        el.innerHTML = '<div style="font-family:var(--mono);font-size:12px;color:var(--faint);padding:40px 0;text-align:center">Storage matrix is empty. Deploy a protocol to initialize.</div>';
        return;
    }
    el.innerHTML = vault.map((v, i) => `
    <div class="vcard">
      <div class="vcard-info"><div class="vcard-name">\${esc(v.title)}</div><div class="vcard-meta">\${v.ts}</div></div>
      <div class="vcard-actions">
        <button class="btn btn-ghost btn-sm" onclick="dlMdById(\${i})">↓ .md</button>
        <button class="btn btn-ghost btn-sm" onclick="loadVaultToCont(\${i})">↩ Re-hydrate</button>
        <button class="btn btn-danger btn-sm" onclick="removeVaultItem(\${i})">Purge</button>
      </div>
    </div>`).join('');
}

function dlMdById(i) {
    const v = vault[i];
    const blob = new Blob(['# ' + v.title + '\n_' + v.ts + '_\n\n' + v.content], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = v.title.replace(/[^a-z0-9]/gi, '_') + '.md';
    a.click();
}

function loadVaultToCont(i) {
    document.getElementById('contPaste').value = vault[i].content;
    if (typeof showTabById === 'function') {
        showTabById('continue');
    }
}

function removeVaultItem(i) {
    vault.splice(i, 1);
    persistVault();
    renderVault();
}

function saveToVault(vid) {
    const panel = document.querySelector(`[data-vid="\${vid}"]`);
    if (!panel) return;
    const item = { id: vid, title: panel.dataset.title, content: panel.dataset.content, ts: new Date().toLocaleString() };
    vault.push(item);
    persistVault();
    renderVault();
    alert('Encrypted to Vault: ' + item.title);
}

function addToVaultPaper(idx) {
    const card = document.querySelector(`.vcard[data-idx="\${idx}"]`);
    if (!card) return;
    try {
        const p = JSON.parse(card.dataset.pdata);
        vault.push({
            id: 'paper_' + Date.now(),
            title: p.title,
            content: `# \${p.title}\n**\${p.authors}** · \${p.journal} · \${p.year}\n\${p.pmid ? \`PubMed: https://pubmed.ncbi.nlm.nih.gov/\${p.pmid}\n\` : ''}\n\${p.abstract_summary}\n\n**Relevance:** \${p.relevance}`,
            ts: new Date().toLocaleString()
        });
        persistVault();
        renderVault();
        const btn = card.querySelector('.btn-ok');
        if(btn) {
            btn.textContent = '✓ Cached';
            setTimeout(() => { btn.textContent = '⊞ Cache'; }, 2000);
        }
    } catch (e) {
        alert('Crypto-vault fault.');
    }
}
