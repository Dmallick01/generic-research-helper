// js/synth_local.js — Zero-API Statistical Synthesis Engine
console.log('Statistical Synthesis v9 Loaded');
// Uses TF-IDF sentence scoring on fetched abstracts. No API key required.

// ─── TF-IDF CORE ─────────────────────────────────────────────────────────────

function tokenize(text) {
    return text.toLowerCase()
               .replace(/[^a-z0-9\s-]/g, ' ')
               .split(/\s+/)
               .filter(w => w.length > 3 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
    'this','that','with','from','have','were','been','they','their','which',
    'also','when','than','into','more','about','these','those','some','such',
    'will','would','could','should','there','here','what','then','both','each',
    'other','after','where','while','over','under','within','between','among',
    'however','therefore','thus','hence','patients','patient','results','study',
    'studies','data','analysis','conclusions','background','methods','conclusion',
    'objective','purpose','aims','using','used','found','showed','show','shows',
    'associated','both','result','significant','significantly','compared',
    'including','included','based','treatment','group','groups','dose','level'
]);

function computeTFIDF(sentences, allTokens) {
    const N = sentences.length;
    const idf = {};
    // Compute IDF
    allTokens.forEach(token => {
        if (idf[token]) return;
        const df = sentences.filter(s => s.tokens.includes(token)).length;
        idf[token] = df > 0 ? Math.log(N / df) : 0;
    });
    // Score each sentence
    return sentences.map(s => {
        const tf = {};
        s.tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
        const score = Object.entries(tf).reduce((sum, [t, freq]) => {
            return sum + (freq / s.tokens.length) * (idf[t] || 0);
        }, 0);
        return { ...s, score };
    });
}

// ─── SENTENCE EXTRACTOR ───────────────────────────────────────────────────────

function extractSentences(papers) {
    const sentences = [];
    papers.forEach((p, pi) => {
        if (!p.abstract || p.abstract.includes('[No abstract')) return;
        // Split on sentence boundaries
        const raw = p.abstract.split(/(?<=[.!?])\s+(?=[A-Z])/);
        raw.forEach((text, si) => {
            const cleaned = text.trim();
            if (cleaned.length < 60) return; // Skip very short fragments
            sentences.push({
                text: cleaned,
                paperIndex: pi,
                paperTitle: p.title,
                pmid: p.pmid,
                year: p.year,
                tokens: tokenize(cleaned),
                studyType: p.studyType,
            });
        });
    });
    return sentences;
}

// ─── THEME CLUSTERS (mapped to tank-specific focus areas) ─────────────────────

const THEME_CLUSTERS = {
    mechanism: {
        label: '🔬 Mechanistic Findings',
        desc: 'Biological and molecular mechanisms identified across the evidence pool',
        keywords: ['mechanism','pathway','signaling','receptor','binding','expression','activation','inhibition','mediator','molecular','cellular','enzyme','protein','gene','cascade'],
    },
    clinical: {
        label: '🏥 Clinical Evidence',
        desc: 'Patient outcomes, trial results, and clinical correlations',
        keywords: ['clinical','trial','patients','outcomes','incidence','prevalence','cohort','randomized','treatment','efficacy','safety','hospital','surgery','icu','perioperative'],
    },
    intervention: {
        label: '💊 Intervention Effects',
        desc: 'Effects of pharmacological and non-pharmacological interventions',
        keywords: ['intervention','administration','dose','dosing','therapy','prevention','reduce','reduction','improved','decrease','increase','effect','efficacy','protocol'],
    },
    limitation: {
        label: '⚠️ Limitations & Confounders',
        desc: 'Methodological constraints and confounding variables identified',
        keywords: ['limitation','confound','bias','heterogeneity','variability','confounding','unclear','unknown','uncertain','inconsistent','contradict','lacks','limited','insufficient'],
    },
};

// ─── MAIN LOCAL SYNTHESIS FUNCTION ──────────────────────────────────────────

async function runLocalSynthesis() {
    console.log('⚡ Starting Statistical Synthesis (TF-IDF)...');
    if (!window.lastSearchResults || lastSearchResults.length === 0) {
        alert('No evidence loaded. Run the Search Engine first.');
        return;
    }

    const outputDiv  = document.getElementById('localSynthOutput');
    const localBtn   = document.getElementById('localSynthBtn');
    const localSpin  = document.getElementById('localSynthSpin');
    const localLabel = document.getElementById('localSynthLabel');

    if (!outputDiv) return;
    outputDiv.innerHTML = '';
    localBtn.disabled = true;
    localSpin.style.display = 'block';
    localLabel.textContent = 'Analyzing...';
    await sleep(50);

    const papers = lastSearchResults;
    const tankId = window.lastSearchTankId || 1;
    const tank   = typeof TANKS !== 'undefined' ? TANKS[tankId] : {};

    function logStep(msg) {
        const span = document.createElement('div');
        span.style.color = '#4488ff';
        span.style.fontSize = '11px';
        span.style.fontFamily = 'var(--mono)';
        span.innerHTML = `⚡ ${msg}`;
        outputDiv.appendChild(span);
        outputDiv.scrollTop = outputDiv.scrollHeight;
    }

    logStep('Initializing statistical engine...');
    await sleep(300);

    logStep(`Extracting sentences from ${papers.length} source papers...`);
    const sentences = extractSentences(papers);
    logStep(`Loaded ${sentences.length} sentences for analysis.`);
    await sleep(200);

    logStep('Tokenizing and computing TF-IDF relevance weights...');
    const allTokens = [...new Set(sentences.flatMap(s => s.tokens))];
    const scored    = computeTFIDF(sentences, allTokens);
    scored.sort((a, b) => b.score - a.score);
    await sleep(200);

    logStep('Clustering findings into biological and clinical themes...');
    // Build clustered output
    const clusters = {};
    Object.entries(THEME_CLUSTERS).forEach(([key, theme]) => {
        const matching = scored.filter(s =>
            theme.keywords.some(kw => s.tokens.includes(kw))
        );
        // Pick top unique sentences (max 4 per cluster, no same paper twice if possible)
        const seen = new Set();
        clusters[key] = matching
            .filter(s => {
                if (seen.has(s.text.substring(0, 50))) return false;
                seen.add(s.text.substring(0, 50));
                return true;
            })
            .slice(0, 4);
    });
    logStep('Synthesis complete. Rendering report...');
    await sleep(300);

    // Identify papers with no abstract (gaps)
    const noAbstractCount = papers.filter(p => p.abstract.includes('[No abstract')).length;
    const recentCount = papers.filter(p => p.year >= '2020').length;
    const rctCount = papers.filter(p => p.studyType.includes('RCT')).length;
    const reviewCount = papers.filter(p => p.studyType.includes('Review') || p.studyType.includes('Meta')).length;

    // Generate cross-protocol dependency summary
    const crossLinks = {};
    papers.forEach(p => {
        p.connections.split(',').forEach(c => {
            const ct = c.trim();
            if (ct && ct !== '—') crossLinks[ct] = (crossLinks[ct] || 0) + 1;
        });
    });

    // Build HTML output
    const vid = 'lsynth_' + Date.now();
    let html = `
      <div class="opanel" data-vid="${vid}" data-title="Tank${tankId}_LocalSynthesis">
        <div class="opanel-hdr" style="background:rgba(100,180,255,0.08);">
          <span class="badge" style="background:#4488ff;color:#000;">⚡ STATISTICAL SYNTHESIS</span>
          <span class="opanel-title">Protocol ${tankId}: ${esc(tank.name || '')} — Zero-API Evidence Review</span>
        </div>
        <div class="opanel-body" style="padding:0;">

          <!-- Stats Bar -->
          <div style="display:flex;gap:20px;flex-wrap:wrap;padding:16px 20px;background:rgba(0,0,0,0.2);border-bottom:1px solid var(--border);">
            <div style="text-align:center;"><div style="font-size:22px;font-weight:700;color:var(--acc);">${papers.length}</div><div style="font-size:10px;color:var(--dim);">PAPERS</div></div>
            <div style="text-align:center;"><div style="font-size:22px;font-weight:700;color:var(--acc2);">${sentences.length}</div><div style="font-size:10px;color:var(--dim);">SENTENCES SCORED</div></div>
            <div style="text-align:center;"><div style="font-size:22px;font-weight:700;color:#44aaff;">${recentCount}</div><div style="font-size:10px;color:var(--dim);">POST-2020</div></div>
            <div style="text-align:center;"><div style="font-size:22px;font-weight:700;color:#ff9944;">${rctCount}</div><div style="font-size:10px;color:var(--dim);">RCTs</div></div>
            <div style="text-align:center;"><div style="font-size:22px;font-weight:700;color:#a080ff;">${reviewCount}</div><div style="font-size:10px;color:var(--dim);">REVIEWS/META</div></div>
          </div>

          <div style="padding:20px;display:flex;flex-direction:column;gap:24px;">`;

    // Render each cluster
    Object.entries(THEME_CLUSTERS).forEach(([key, theme]) => {
        const items = clusters[key];
        html += `
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:4px;">${theme.label}</div>
              <div style="font-size:11px;color:var(--dim);margin-bottom:12px;">${theme.desc}</div>`;

        if (items.length === 0) {
            html += `<div style="font-size:12px;color:var(--dim);font-style:italic;">No high-scoring sentences found in this cluster.</div>`;
        } else {
            items.forEach(s => {
                html += `
                <div style="margin-bottom:10px;padding:10px 14px;background:rgba(0,0,0,0.25);border-radius:6px;border-left:3px solid rgba(0,255,170,0.3);">
                    <div style="font-size:12px;color:var(--txt);line-height:1.7;">"${esc(s.text)}"</div>
                    <div style="margin-top:6px;font-size:10px;color:var(--dim);">
                        ↳ <a href="https://pubmed.ncbi.nlm.nih.gov/${s.pmid}" target="_blank" style="color:var(--acc2);">${esc(s.paperTitle.substring(0,70))}…</a>
                        (${s.year}) · ${s.studyType}
                    </div>
                </div>`;
            });
        }
        html += `</div>`;
    });

    // Cross-tank connection summary
    if (Object.keys(crossLinks).length > 0) {
        html += `<div>
          <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:8px;">🔗 Cross-Protocol Evidence Links</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">`;
        Object.entries(crossLinks)
            .sort((a,b) => b[1] - a[1])
            .forEach(([tank, count]) => {
                html += `<span style="background:rgba(160,128,255,0.1);border:1px solid rgba(160,128,255,0.3);border-radius:4px;padding:4px 10px;font-size:12px;color:#a080ff;">${tank}: ${count} papers</span>`;
            });
        html += `</div></div>`;
    }

    // Key dependables
    const topPapers = papers
        .filter(p => !p.abstract.includes('[No abstract'))
        .sort((a, b) => {
            const aScore = (a.studyType.includes('Meta') ? 3 : a.studyType.includes('RCT') ? 2 : a.studyType.includes('Review') ? 1 : 0)
                         + (a.year >= '2020' ? 1 : 0);
            const bScore = (b.studyType.includes('Meta') ? 3 : b.studyType.includes('RCT') ? 2 : b.studyType.includes('Review') ? 1 : 0)
                         + (b.year >= '2020' ? 1 : 0);
            return bScore - aScore;
        })
        .slice(0, 7);

    html += `<div>
        <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:8px;">📌 Key Dependables (Highest Evidence Grade)</div>
        <div style="display:flex;flex-direction:column;gap:6px;">`;
    topPapers.forEach((p, i) => {
        html += `<div style="font-size:12px;color:rgba(255,255,255,0.7);padding:8px 12px;background:rgba(0,0,0,0.2);border-radius:4px;">
            <span style="color:var(--acc2);margin-right:8px;">${p.studyType}</span>
            <a href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}" target="_blank" style="color:var(--acc);">${esc(p.title.substring(0, 80))}…</a>
            <span style="color:var(--dim);margin-left:6px;">(${p.year})</span>
        </div>`;
    });
    html += `</div></div>`;

    // Evidence gaps
    html += `<div style="padding:12px 16px;background:rgba(255,80,80,0.05);border:1px solid rgba(255,80,80,0.2);border-radius:6px;">
        <div style="font-size:13px;font-weight:700;color:#ff6644;margin-bottom:8px;">⚠️ Evidence Gaps Detected</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.65);line-height:1.7;">
            • ${noAbstractCount} of ${papers.length} papers returned no abstract — manual review via PubMed links required.<br>
            ${rctCount < 3 ? '• <strong>Insufficient RCT evidence</strong> — current pool is primarily observational/review literature. Findings need validation via controlled trials.' : ''}
            ${recentCount < papers.length * 0.4 ? '• <strong>Publication recency gap</strong> — majority of evidence predates 2020. Recent developments may not be captured.' : ''}
            ${Object.keys(crossLinks).length === 0 ? '• <strong>No cross-protocol connections detected</strong> — this domain may be insufficiently connected to adjacent research pillars.' : ''}
        </div>
    </div>`;

    html += `          </div>
        </div>
        <div class="opanel-actions">
          <button class="btn btn-ghost btn-sm" onclick="copyText(this,'${vid}')">Clone</button>
          <button class="btn btn-ghost btn-sm" onclick="exportLocalSynthMD(${tankId})">↓ Markdown</button>
          <button class="btn btn-ok btn-sm" onclick="saveToVault('${vid}')">⊞ Vault</button>
        </div>
      </div>`;

    outputDiv.innerHTML = html;
    // Store text content for vault/copy
    outputDiv.querySelector('.opanel').dataset.content =
        `Protocol ${tankId} Statistical Synthesis\n\nGenerated from ${papers.length} papers, ${sentences.length} sentences scored.\n\nSee full HTML report in interface.`;

    outputDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

    localBtn.disabled = false;
    localSpin.style.display = 'none';
    localLabel.textContent = '⚡ Run Statistical Synthesis';
}

function exportLocalSynthMD(tankId) {
    if (!window.lastSearchResults) return;
    const papers = lastSearchResults;
    const tank = typeof TANKS !== 'undefined' ? TANKS[tankId] : {};
    let md = `# Protocol ${tankId} Statistical Synthesis\n**${tank.name || ''}**\n*Generated: ${new Date().toLocaleString()} | Zero-API TF-IDF Engine*\n\n`;
    md += `## Evidence Pool Stats\n- Papers: ${papers.length}\n- RCTs: ${papers.filter(p=>p.studyType.includes('RCT')).length}\n- Reviews/Meta: ${papers.filter(p=>p.studyType.includes('Review')||p.studyType.includes('Meta')).length}\n- Post-2020: ${papers.filter(p=>p.year>='2020').length}\n\n`;
    md += `## Key Dependables\n`;
    papers.filter(p=>!p.abstract.includes('[No abstract')).slice(0,7).forEach(p => {
        md += `- ${p.studyType} — [${p.title}](https://pubmed.ncbi.nlm.nih.gov/${p.pmid}) (${p.year})\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Protocol_${tankId}_LocalSynth_${new Date().toISOString().slice(0,10)}.md`;
    a.click();
}
