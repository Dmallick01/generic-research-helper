// js/refiner.js — Query-Anchored Research Synthesis Refiner
console.log('Research Refiner v9 Loaded');
// Uses compromise.js (github.com/spencermountain/compromise) for NLP sentence parsing
// Falls back to regex sentencing if compromise is unavailable
// No API key required.

// ─── SENTENCE SPLITTER (compromise.js or regex fallback) ─────────────────────

function splitSentences(text) {
    if (typeof nlp === 'function') {
        try {
            console.log('NLP: Using compromise.js for sentence segmentation');
            return nlp(text).sentences().out('array').filter(s => s.trim().length > 50);
        } catch(e) { 
            console.error('NLP Error in compromise.js:', e);
        }
    }
    console.warn('NLP: compromise.js missing or failed. Using regex fallback.');
    // Regex fallback
    return text
        .split(/(?<=[.!?])\s+(?=[A-Z])/)
        .map(s => s.trim())
        .filter(s => s.length > 50);
}

// ─── QUERY-SENTENCE RELEVANCE SCORING ───────────────────────────────────────

function scoreQueryRelevance(sentence, queryTokens) {
    const sLower = sentence.toLowerCase();
    const stokens = sLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const stokenSet = new Set(stokens);
    let matchCount = 0;
    let exactPhraseBonus = 0;
    queryTokens.forEach(qt => {
        if (stokenSet.has(qt)) matchCount++;
        if (sLower.includes(qt)) exactPhraseBonus += 0.5; // phrase match bonus
    });
    return (matchCount + exactPhraseBonus) / Math.max(queryTokens.length, 1);
}

function tokenizeQuery(query) {
    const SKIP = new Set(['and','the','for','with','from','into','via','using','after','where','when']);
    return query.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !SKIP.has(w));
}

// ─── EXTRACT BEST SENTENCES FOR A QUERY FROM A PAPER ─────────────────────────

function extractBestSentences(abstract, queryTokens, maxSentences = 2) {
    if (!abstract || abstract.includes('[No abstract') || abstract.includes('[Abstract not')) return [];
    const sentences = splitSentences(abstract);
    const scored = sentences.map(s => ({
        text: s,
        score: scoreQueryRelevance(s, queryTokens),
    })).filter(s => s.score > 0);
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxSentences).map(s => s.text);
}

// ─── UTILITY: Format inline citation tag ─────────────────────────────────────

function fmtCiteTag(p) {
    const typeIcon = p.studyType ? p.studyType.split(' ')[0] : '⚗️';
    return `<span style="font-size:10px;background:rgba(0,255,170,0.08);border:1px solid rgba(0,255,170,0.2);border-radius:3px;padding:1px 5px;margin-right:6px;">${typeIcon} ${p.year}</span>`;
}

// ─── MAIN REFINER FUNCTION ───────────────────────────────────────────────────

    console.log('🔍 Starting Research Refiner (NLP Synthesis)...');
    if (!window.lastSearchResults || lastSearchResults.length === 0) {
        console.error('REFINE_ERROR: lastSearchResults is empty');
        alert('No evidence loaded. Run the Sequential Search first.');
        return;
    }
    const hasAbstracts = lastSearchResults.some(p => p.abstract && p.abstract.length > 50);
    if (!hasAbstracts) {
        console.warn('REFINE_WARNING: No scorable abstracts found in current result set.');
    }
    if (!window.lastQueryMap || Object.keys(lastQueryMap).length === 0) {
        alert('No query map found. Re-run the Sequential Search to capture per-query results.');
        return;
    }

    const outputDiv   = document.getElementById('refinerOutput');
    const refinerBtn  = document.getElementById('refinerBtn');
    const refinerSpin = document.getElementById('refinerSpin');
    const refinerLabel = document.getElementById('refinerLabel');

    if (!outputDiv) return;
    outputDiv.innerHTML = '';
    refinerBtn.disabled = true;
    refinerSpin.style.display = 'block';
    refinerLabel.textContent = 'Refining query answers...';

    await new Promise(r => setTimeout(r, 30));

    const allPapers = lastSearchResults;
    const tankId    = window.lastSearchTankId || 1;
    const tank      = typeof TANKS !== 'undefined' ? TANKS[tankId] : {};

    // Build PMID → paper lookup
    const paperByPMID = {};
    allPapers.forEach(p => { if (p.pmid) paperByPMID[p.pmid] = p; });

    // Track which queries actually returned anything useful
    const queryEntries = Object.entries(lastQueryMap);
    let querySectionsHTML = '';
    let mdExportLines = [];

    let queriesWithResults = 0;

    queryEntries.forEach(([query, pmids], qi) => {
        const queryTokens = tokenizeQuery(query);

        // Find paper objects for this query's PMIDs
        const papers = pmids
            .map(id => paperByPMID[id])
            .filter(Boolean);

        if (papers.length === 0) {
            querySectionsHTML += `
            <div style="margin-bottom:20px;opacity:0.5;">
                <div style="font-size:12px;color:var(--dim);font-family:var(--mono);">Q${qi+1}</div>
                <div style="font-size:13px;color:var(--dim);margin-bottom:4px;font-style:italic;">"${esc(query)}"</div>
                <div style="font-size:11px;color:#ff6644;padding:6px 10px;background:rgba(255,80,80,0.05);border-radius:4px;">No papers returned for this query.</div>
            </div>`;
            return;
        }

        queriesWithResults++;

        // For each paper in this query, extract best sentences relative to the query
        const bullets = [];
        papers.forEach(p => {
            const best = extractBestSentences(p.abstract, queryTokens, 2);
            if (best.length === 0) {
                // No abstract sentences scored — use title as fallback bullet
                bullets.push({
                    text: p.title,
                    paper: p,
                    isTitleFallback: true,
                });
            } else {
                best.forEach(sentence => {
                    bullets.push({ text: sentence, paper: p, isTitleFallback: false });
                });
            }
        });

        // Deduplicate bullets by text prefix
        const seenBullets = new Set();
        const uniqueBullets = bullets.filter(b => {
            const key = b.text.substring(0, 60).toLowerCase();
            if (seenBullets.has(key)) return false;
            seenBullets.add(key);
            return true;
        });

        // Sort: non-fallback first, then by year desc
        uniqueBullets.sort((a, b) => {
            if (a.isTitleFallback !== b.isTitleFallback) return a.isTitleFallback ? 1 : -1;
            return (parseInt(b.paper.year) || 0) - (parseInt(a.paper.year) || 0);
        });

        // Build query section HTML
        const bulletItems = uniqueBullets.map(b => {
            const pmLink = b.paper.pmid
                ? `https://pubmed.ncbi.nlm.nih.gov/${b.paper.pmid}`
                : (b.paper.doi ? `https://doi.org/${b.paper.doi}` : '#');
            const citeTag = fmtCiteTag(b.paper);
            const authorShort = b.paper.authors
                ? b.paper.authors.split(',')[0].trim() + (b.paper.authors.includes(',') ? ' et al.' : '')
                : 'Unknown';
            const fallbackStyle = b.isTitleFallback ? 'font-style:italic;color:rgba(255,255,255,0.5);' : '';

            return `
            <li style="margin-bottom:10px;padding:10px 14px;background:rgba(0,0,0,0.2);border-radius:6px;border-left:3px solid rgba(0,255,170,0.25);list-style:none;">
                <div style="font-size:12px;color:var(--txt);line-height:1.7;${fallbackStyle}">${esc(b.text)}${b.isTitleFallback ? ' <em style="color:var(--dim);">[title; no scorable abstract]</em>' : ''}</div>
                <div style="margin-top:5px;font-size:10px;color:var(--dim);display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
                    ${citeTag}
                    <a href="${pmLink}" target="_blank" rel="noopener" style="color:var(--acc2);">${esc(authorShort)}</a>
                    <span style="color:var(--dim);">· ${esc(b.paper.journal)}</span>
                    ${b.paper.studyType ? `<span style="color:rgba(255,255,255,0.35);">· ${b.paper.studyType}</span>` : ''}
                </div>
            </li>`;
        }).join('');

        const coverage = papers.filter(p => !p.abstract.includes('[No abstract')).length;
        querySectionsHTML += `
        <div class="refiner-block" style="margin-bottom:28px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span style="font-size:11px;color:var(--acc2);font-family:var(--mono);flex:0 0 auto;">Q${qi+1}</span>
                <div style="font-size:13px;font-weight:600;color:var(--txt);font-family:var(--sans);">"${esc(query)}"</div>
                <span style="flex:0 0 auto;font-size:10px;color:var(--dim);margin-left:auto;">${papers.length} papers · ${coverage} with abstract</span>
            </div>
            <ul style="margin:0;padding:0;">${bulletItems}</ul>
        </div>`;

        // Build MD export lines
        mdExportLines.push(`\n### Q${qi+1}: "${query}"\n`);
        uniqueBullets.forEach(b => {
            const authorShort = b.paper.authors ? b.paper.authors.split(',')[0].trim() + (b.paper.authors.includes(',') ? ' et al.' : '') : 'Unknown';
            mdExportLines.push(`- **${authorShort} (${b.paper.year}):** "${b.text}"  \n  → [PMID ${b.paper.pmid}](https://pubmed.ncbi.nlm.nih.gov/${b.paper.pmid})`);
        });
    });

    // Summary bar counts
    const totalBullets = document.querySelectorAll ? 0 : 0; // counted after render

    const vid = 'refiner_' + Date.now();
    const html = `
    <div class="opanel" data-vid="${vid}" data-title="Tank${tankId}_Refiner">
      <div class="opanel-hdr" style="background:rgba(80,255,120,0.07);">
        <span class="badge" style="background:#22cc66;color:#000;">🔍 RESEARCH REFINER</span>
        <span class="opanel-title">Protocol ${tankId}: ${esc(tank.name || '')} — Query-Anchored Synthesis</span>
      </div>

      <!-- Summary bar -->
      <div style="display:flex;gap:20px;flex-wrap:wrap;padding:14px 20px;background:rgba(0,0,0,0.2);border-bottom:1px solid var(--border);">
        <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#22cc66;">${queriesWithResults}</div><div style="font-size:10px;color:var(--dim);">QUERIES ANSWERED</div></div>
        <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--acc);">${allPapers.length}</div><div style="font-size:10px;color:var(--dim);">TOTAL PAPERS</div></div>
        <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--acc2);">${queryEntries.length}</div><div style="font-size:10px;color:var(--dim);">QUERIES RUN</div></div>
        <div style="font-size:11px;color:var(--dim);font-family:var(--mono);align-self:center;margin-left:auto;">
          NLP: ${typeof nlp === 'function' ? '<span style="color:#22cc66;">compromise.js active</span>' : '<span style="color:#ffaa44;">regex fallback</span>'}
        </div>
      </div>

      <div class="opanel-body" style="padding:20px;display:flex;flex-direction:column;gap:0;">
        <div style="font-size:11px;color:var(--dim);font-family:var(--mono);margin-bottom:20px;padding:8px 12px;background:rgba(0,0,0,0.2);border-radius:4px;">
          Each query below is answered directly by the highest-relevance sentences extracted from its PubMed result set. Bullets are sorted by keyword overlap with the original query, then by publication year.
        </div>
        ${querySectionsHTML}
      </div>

      <div class="opanel-actions">
        <button class="btn btn-ghost btn-sm" onclick="exportRefinerMD(${tankId}, ${JSON.stringify(mdExportLines).replace(/'/g, '&apos;')})">↓ Markdown</button>
        <button class="btn btn-ok btn-sm" onclick="saveRefinerToVault('${vid}', ${tankId})">⊞ Vault</button>
      </div>
    </div>`;

    outputDiv.innerHTML = html;
    outputDiv.querySelector('.opanel').dataset.content = mdExportLines.join('\n');

    outputDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    refinerBtn.disabled = false;
    refinerSpin.style.display = 'none';
    refinerLabel.textContent = '🔍 Run Research Refiner';
}

// ─── EXPORT FUNCTIONS ─────────────────────────────────────────────────────────

function exportRefinerMD(tankId, lines) {
    const tank = typeof TANKS !== 'undefined' ? TANKS[tankId] : {};
    const papers = window.lastSearchResults || [];
    
    let md = `# Research Synthesis Refiner — Protocol ${tankId}: ${tank.name || ''}\n`;
    md += `*Generated: ${new Date().toLocaleString()} | Query-Anchored NLP Engine*\n\n`;
    md += `> [!NOTE]\n`;
    md += `> This document contains a high-fidelity synthesis of ${papers.length} source papers, including query-specific bullet points and full source abstracts.\n\n`;
    
    md += `## 1. REFINED SYNTHESIS\n`;
    md += lines.join('\n') + '\n\n---\n\n';

    md += `## 2. SOURCE EVIDENCE LOGS (Full Abstracts)\n\n`;
    papers.forEach((p, i) => {
        md += `### [${i+1}] ${p.title}\n`;
        md += `**Citation:** ${p.authors} (${p.year}) | *${p.journal}* | PMID: ${p.pmid}\n\n`;
        md += `**Abstract:**  \n${p.abstract}\n\n`;
        md += `---\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Protocol_${tankId}_DeepRefiner_${new Date().toISOString().slice(0,10)}.md`;
    a.click();
}

function saveRefinerToVault(vid, tankId) {
    const panel = document.querySelector(`[data-vid="${vid}"]`);
    if (!panel || typeof vault === 'undefined') return;
    const tank = typeof TANKS !== 'undefined' ? TANKS[tankId] : {};
    vault.push({
        id: vid + '_vault',
        title: `[T${tankId}] Research Refiner — ${tank.name || ''} — ${new Date().toLocaleDateString()}`,
        content: panel.dataset.content || '',
        ts: new Date().toLocaleString()
    });
    persistVault();
    renderVault();
}
