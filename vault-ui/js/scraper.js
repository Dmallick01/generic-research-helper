// js/scraper.js — API Synthesis Layer (Requires Anthropic Key)
// Reads from lastSearchResults populated by search_engine.js

async function synthesizeScraped() {
    const key = typeof getApiKey === 'function' ? getApiKey() : '';
    if (!key) {
        alert('Anthropic API key required for synthesis. Set it in the Pipeline tab configuration.');
        return;
    }
    if (!window.lastSearchResults || lastSearchResults.length === 0) {
        alert('No evidence loaded. Run the Parallel Search first.');
        return;
    }

    const outSection = document.getElementById('scrapeSynthOutput');
    const synthBtn  = document.getElementById('synthBtn');
    const synthSpin = document.getElementById('synthSpin');
    const synthLabel = document.getElementById('synthLabel');

    outSection.innerHTML = '';
    synthBtn.disabled = true;
    synthSpin.style.display = 'block';
    synthLabel.textContent = 'Synthesizing textual output...';

    // Build context payload from evidence table data
    const tankId = window.selScrapeProtocol || 1;
    const tank   = TANKS[tankId] || {};

    const context = lastSearchResults.map((p, i) =>
        `[${i+1}] "${p.title}" — ${p.authors} · ${p.journal} · ${p.year} · ${p.studyType}`
    ).join('\n');

    const prompt =
`You are a rigorous research synthesizer operating on verified PubMed-indexed literature.

RESEARCH DOMAIN: ${tank.desc || ''}

VERIFIED EVIDENCE ARRAY (${lastSearchResults.length} papers from PubMed E-Utilities):
${context}

TASK:
Write a dense, publication-quality textual synthesis of this evidence in professional academic markdown format.

MANDATORY STRUCTURE:
## Overview
One paragraph summarizing the overarching state of evidence in this domain.

## Mechanistic Synthesis
2-3 paragraphs drawing mechanistic or clinical connections between the studies above.

## Evidence Gaps & Nuances
One paragraph explicitly identifying what these studies do NOT resolve, and what connects to adjacent research domains.

## Key Dependables
Bullet list of the 5-7 most reliable findings across this evidence pool.

STRICT RULE: Only draw on the paper titles listed above. Never cite authors or findings not present in the given list.`;

    try {
        const result = await claude(prompt, 2000);

        const vid = 'vsynth_' + Date.now();
        outSection.innerHTML = `
            <div class="opanel" data-vid="${vid}" data-content="">
               <div class="opanel-hdr">
                 <span class="badge" style="background:#00ffa6;color:#000;">🧠 RESEARCH SYNTHESIS</span>
                 <span class="opanel-title">Protocol ${tankId}: ${esc(tank.name || '')} — Textual Output</span>
               </div>
               <div class="opanel-body" id="synthBodyBlock" style="font-size:14px;line-height:1.8;"></div>
               <div class="opanel-actions">
                  <button class="btn btn-ghost btn-sm" onclick="copyText(this,'${vid}')">Clone Text</button>
                  <button class="btn btn-ghost btn-sm" onclick="dlMd('${vid}')">↓ Markdown</button>
                  <button class="btn btn-ok btn-sm" onclick="saveToVault('${vid}')">⊞ Vault</button>
               </div>
            </div>`;

        // Render result safely as pre-wrapped text
        const body = document.getElementById('synthBodyBlock');
        body.innerHTML = '<pre style="white-space:pre-wrap;font-family:var(--sans);font-size:13px;line-height:1.8;">' + esc(result) + '</pre>';
        outSection.querySelector('.opanel').dataset.content = result;
        outSection.querySelector('.opanel').dataset.title = `Protocol${tankId}_Synthesis`;

        // Cache to vault
        vault.push({
            id: 'synthesis_' + Date.now(),
            title: `[T${tankId}] Literature Synthesis — ${new Date().toLocaleDateString()}`,
            content: result,
            ts: new Date().toLocaleString()
        });
        persistVault();
        renderVault();

        outSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (e) {
        outSection.innerHTML = `<div class="err-msg" style="padding:15px;">⚠ Synthesis fault: ${esc(e.message)}</div>`;
    }

    synthBtn.disabled = false;
    synthSpin.style.display = 'none';
    synthLabel.textContent = '🧠 Synthesize Evidence';
}
