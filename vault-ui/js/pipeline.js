// js/pipeline.js

window.running = false;

async function runPipeline() {
    if (window.running) return;
    if (!window.API_KEY) {
        alert('Security warning: Insert API key in config array.');
        return;
    }
    
    window.running = true;
    const ctx = document.getElementById('ctxInput').value.trim();
    // Default fallback to 1 if no simple selected
    const sn = typeof window.selProtocol !== 'undefined' ? window.selProtocol : 1;
    const sd = TANKS[sn].desc;
    const sec = 'outSection';
    
    document.getElementById(sec).innerHTML = '';
    resetAgents();
    setProgress(0);
    
    const runBtn = document.getElementById('runBtn');
    const spin = document.getElementById('spin');
    const globalStatus = document.getElementById('globalStatus');
    
    runBtn.disabled = true;
    spin.style.display = 'block';
    document.getElementById('runLabel').textContent = 'Computing...';
    globalStatus.textContent = '';
    
    // Convert FIXED_GATES to formatted string for prompts
    const fixedGatesDesc = FIXED_GATES.map((g, i) => `Gate \${i + 1} [\${g.label}]: \${g.q}`).join('\\n');

    const outs = {};
    try {
        // BASE
        setAgent('base', 'running');
        addThinking(sec, 'th-base', '[NODE: BASE] Formulating architecture array for Protocol ' + sn + '...');
        outs.base = await claude(PROMPTS.base(ctx, sn, sd), 1200);
        rmThinking('th-base');
        addPanel(sec, 'BASE', 'Architecture Shell — Protocol ' + sn, outs.base, 'badge-base');
        setAgent('base', 'done'); setProgress(15);

        // R1
        setAgent('r1', 'running');
        addThinking(sec, 'th-r1', '[NODE: R1] Aggregating literature primitives...');
        outs.r1 = await claude(PROMPTS.r1(ctx, sn, outs.base), 1500);
        rmThinking('th-r1');
        addPanel(sec, 'R1', 'Synthesis Vectors — Protocol ' + sn, outs.r1, 'badge-r1', { vecBadge: true });
        setAgent('r1', 'done'); setProgress(30);

        // REG 1
        setAgent('reg', 'running');
        addThinking(sec, 'th-reg1', '[NODE: REGULATOR] Auditing R1 topological boundaries...');
        outs.reg1 = await claude(PROMPTS.regulator(ctx, sn, 'R1', outs.r1, outs.base, fixedGatesDesc), 1000);
        rmThinking('th-reg1');
        addPanel(sec, 'REGULATOR', 'Audit Trajectory 1 — R1 Scan', outs.reg1, 'badge-reg');
        setAgent('reg', 'done'); setProgress(40);
        const pass1 = await showCheckpoint(sec, 'R1', outs.reg1);
        if (!pass1) {
            setAgent('reg', 'blocked');
            globalStatus.textContent = 'SYSTEM HALTED at Threshold 1.';
            throw new Error('BLOCKED_BY_REGULATOR');
        }

        // R2
        setAgent('r2', 'running');
        addThinking(sec, 'th-r2', '[NODE: R2] Generating adversarial modifiers...');
        outs.r2 = await claude(PROMPTS.r2(ctx, sn, outs.base, outs.r1), 1500);
        rmThinking('th-r2');
        addPanel(sec, 'R2', 'Annotated Extrapolation — Protocol ' + sn, outs.r2, 'badge-r2', { vecBadge: true });
        setAgent('r2', 'done'); setProgress(60);

        // REG 2
        setAgent('reg', 'running');
        addThinking(sec, 'th-reg2', '[NODE: REGULATOR] Auditing R2 adversarial vectors...');
        outs.reg2 = await claude(PROMPTS.regulator(ctx, sn, 'R2', outs.r2, outs.base, fixedGatesDesc), 1000);
        rmThinking('th-reg2');
        addPanel(sec, 'REGULATOR', 'Audit Trajectory 2 — R2 Scan', outs.reg2, 'badge-reg');
        setAgent('reg', 'done'); setProgress(70);
        const pass2 = await showCheckpoint(sec, 'R2', outs.reg2);
        if (!pass2) {
            setAgent('reg', 'blocked');
            globalStatus.textContent = 'SYSTEM HALTED at Threshold 2.';
            throw new Error('BLOCKED_BY_REGULATOR');
        }

        // CRITIC
        setAgent('critic', 'running');
        addThinking(sec, 'th-critic', '[NODE: CRITIC] Triaging structural dependencies...');
        outs.critic = await claude(PROMPTS.critic(ctx, sn, outs.base, outs.r1, outs.r2, outs.reg1 + '\\n\\n' + outs.reg2), 1200);
        rmThinking('th-critic');
        addPanel(sec, 'CRITIC', 'Triage Report — Protocol ' + sn, outs.critic, 'badge-critic');
        setAgent('critic', 'done'); setProgress(85);

        // FINAL
        setAgent('final', 'running');
        addThinking(sec, 'th-final', '[NODE: FINAL] Compiling apex manuscript matrix...');
        outs.final = await claude(PROMPTS.final(ctx, sn, outs.base, outs.r1, outs.r2, outs.reg1 + '\\n\\n' + outs.reg2, outs.critic), 2000);
        rmThinking('th-final');
        addPanel(sec, 'FINAL', 'Apex Node Output — Protocol ' + sn, outs.final, 'badge-final');
        setAgent('final', 'done'); setProgress(100);
        
        globalStatus.textContent = 'PROTOCOL COMPLETE ✓';

        vault.push({
            id: 'auto_' + Date.now(),
            title: '[T' + sn + '] ' + TANKS[sn].name + ' — Terminal Log',
            content: Object.entries(outs).map(([k, v]) => '## LAYER: ' + k.toUpperCase() + '\\n\\n' + v).join('\\n\\n---\\n\\n'),
            ts: new Date().toLocaleString()
        });
        persistVault();
        renderVault();

    } catch (e) {
        if (e.message !== 'BLOCKED_BY_REGULATOR') {
            const s = document.getElementById(sec);
            const d = document.createElement('div');
            d.className = 'opanel';
            d.innerHTML = `<div class="err-msg">⚠ FAILURE: \${esc(e.message)}</div>`;
            s.appendChild(d);
        }
    }
    
    window.running = false;
    runBtn.disabled = false;
    spin.style.display = 'none';
    document.getElementById('runLabel').textContent = '▶ Initialize Protocol';
}

async function runContinuation() {
    if (!window.API_KEY) {
        alert('Key missing.');
        return;
    }
    
    const pasted = document.getElementById('contPaste').value.trim();
    if (!pasted) {
        alert('No matrix data bound to text input.');
        return;
    }
    
    const fromAgent = document.getElementById('contFromAgent').value;
    const sn = parseInt(document.getElementById('contProtocol').value, 10);
    const ctx = document.getElementById('ctxInput').value.trim();
    const sd = TANKS[sn].desc;
    const sec = 'contSection';
    
    document.getElementById(sec).innerHTML = '';
    const contBtn = document.getElementById('contBtn');
    contBtn.disabled = true;
    document.getElementById('contSpin').style.display = 'block';
    document.getElementById('contLabel').textContent = 'Re-hydrating...';

    const outs = {
        [fromAgent]: pasted,
        base: fromAgent === 'base' ? pasted : '[Pre-computed from DOM]'
    };
    
    const agentOrder = ['base', 'r1', 'r2', 'critic', 'final'];
    const startIdx = agentOrder.indexOf(fromAgent) + 1;
    const remaining = agentOrder.slice(startIdx);

    try {
        for (const agent of remaining) {
            addThinking(sec, 'th-cont-' + agent, '[HYBRID] Formulating ' + agent.toUpperCase() + '...');
            let prompt;
            if (agent === 'r1') prompt = PROMPTS.r1(ctx, sn, outs.base);
            else if (agent === 'r2') prompt = PROMPTS.r2(ctx, sn, outs.base, outs.r1 || pasted);
            else if (agent === 'critic') prompt = PROMPTS.critic(ctx, sn, outs.base, outs.r1 || '', outs.r2 || pasted, '[Hybrid fast-path bypassed Regulators]');
            else if (agent === 'final') prompt = PROMPTS.final(ctx, sn, outs.base, outs.r1 || '', outs.r2 || '', outs.reg || '[Hybrid bypassed]', outs.critic || pasted);
            
            const out = await claude(prompt, 1500);
            outs[agent] = out;
            rmThinking('th-cont-' + agent);
            addPanel(sec, agent.toUpperCase(), '[Hydrated] ' + agent.toUpperCase() + ' — Protocol ' + sn, out, 'badge-' + agent);
        }
    } catch (e) {
        const s = document.getElementById(sec);
        const d = document.createElement('div');
        d.className = 'opanel';
        d.innerHTML = `<div class="err-msg">⚠ FAILURE: \${esc(e.message)}</div>`;
        s.appendChild(d);
    }
    
    contBtn.disabled = false;
    document.getElementById('contSpin').style.display = 'none';
    document.getElementById('contLabel').textContent = '↩ Relight Sequence';
}
