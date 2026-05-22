// js/regulator.js

let checkpointResolve = null;

function showCheckpoint(section, agentName, regOutput) {
    return new Promise(resolve => {
        checkpointResolve = resolve;
        const sec = document.getElementById(section);
        const div = document.createElement('div');
        div.className = 'checkpoint';
        div.id = 'cp-current';

        const lines = regOutput.split('\\n');
        const sourceLines = lines.filter(l => l.includes('pubmed') || l.includes('scholar') || l.toLowerCase().includes('doi.org'));
        const annotLinks = sourceLines.slice(0, 4).map(l => {
            const urlMatch = l.match(/(https?:\\/\\/[^\\s]+)/);
            if (urlMatch) return `<a class="annot-link" href="\${urlMatch[1]}" target="_blank" rel="noopener">⚡ \${urlMatch[1].slice(0, 40)}...</a>`;
            return '';
        }).filter(Boolean).join('');

        div.innerHTML = `
      <div class="checkpoint-hdr">
        <span class="checkpoint-icon">⬡</span>
        <span class="checkpoint-title">REGULATOR INTERCEPT — Processing \${agentName}</span>
      </div>
      <div class="checkpoint-q">\${esc(regOutput)}</div>
      <div class="lbl" style="color:var(--reg)">Gate Matrix Telemetry</div>
      <div class="fixed-gates">
        \${FIXED_GATES.map(g => `<div class="gate-item"><div class="gate-label" style="color:var(--reg)">\${g.label}</div><div class="gate-q">\${g.q}</div><div class="gate-verdict pending" id="gv-\${g.label}">AWAIT</div></div>`).join('')}
      </div>
      \${annotLinks ? `<div class="lbl">Detected Reference Vectors</div><div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px">\${annotLinks}</div>` : ''}
      <div class="checkpoint-actions">
        <button class="btn btn-ok" onclick="resolveCheckpoint(true)">✓ OVERRIDE ACCEPT — Resume</button>
        <button class="btn btn-danger" onclick="resolveCheckpoint(false)">✕ ENFORCE HALT — Terminate</button>
        <button class="btn btn-ghost btn-sm" onclick="dlCheckpointMd()">↓ Backup Logs</button>
      </div>`;
        sec.appendChild(div);
        div.scrollIntoView({ behavior: 'smooth', block: 'start' });

        FIXED_GATES.forEach(g => {
            const el = document.getElementById('gv-' + g.label);
            if (!el) return;
            const rLow = regOutput.toLowerCase();
            const gLow = g.label.toLowerCase();
            const idx = rLow.indexOf(gLow);
            if (idx === -1) return;
            const snippet = rLow.slice(idx, idx + 200);
            if (snippet.includes('pass') || snippet.includes('yes') || snippet.includes('✓') || snippet.includes('valid')) {
                el.textContent = 'PASS';
                el.className = 'gate-verdict pass';
            } else if (snippet.includes('fail') || snippet.includes('no') || snippet.includes('block') || snippet.includes('suspect') || snippet.includes('✗')) {
                el.textContent = 'FAIL';
                el.className = 'gate-verdict fail';
            }
        });
    });
}

function resolveCheckpoint(pass) {
    const cp = document.getElementById('cp-current');
    if (cp) {
        cp.style.borderColor = pass ? 'var(--acc)' : 'var(--critic)';
        cp.style.opacity = '0.6';
        cp.querySelectorAll('.btn').forEach(b => b.disabled = true);
    }
    if (checkpointResolve) {
        checkpointResolve(pass);
        checkpointResolve = null;
    }
}

function dlCheckpointMd() {
    const cp = document.getElementById('cp-current');
    if (!cp) return;
    const txt = cp.querySelector('.checkpoint-q')?.textContent || '';
    const blob = new Blob(['# Regulator Override Logs\\n\\n' + txt], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'regulator_intercept_' + Date.now() + '.md';
    a.click();
}
