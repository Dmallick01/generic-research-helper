// js/search_engine.js — v9: Sequential Deep Research Engine
console.log('Search Engine v9 Loaded');
// No API Key Required. Uses only PubMed E-Utilities.

// ─── Protocol-driven queries (from config/domains.json via tanks.js) ─────────

const QUERY_SUFFIXES = [
    'systematic review',
    'meta-analysis',
    'randomized controlled trial',
    'longitudinal study',
    'mechanism pathway',
    'open questions',
    'limitations confounds',
    'replication study',
    'benchmark comparison',
    'survey paper',
];

const STOPWORDS = new Set([
    'with', 'from', 'that', 'this', 'your', 'research', 'primary', 'sources',
    'theory', 'model', 'review', 'analysis', 'design', 'experimental',
]);

function protocolMeta(protocolId) {
    return (typeof TANKS !== 'undefined' && TANKS[protocolId]) ? TANKS[protocolId] : null;
}

function protocolKeywords(protocolId) {
    const p = protocolMeta(protocolId);
    if (!p) return [];
    const blob = `${p.name} ${p.q} ${p.desc || ''}`.toLowerCase();
    const words = blob.match(/[a-z][a-z0-9-]{3,}/g) || [];
    return [...new Set(words.filter(w => !STOPWORDS.has(w)))].slice(0, 12);
}

function buildProtocolQueries(protocolId) {
    const p = protocolMeta(protocolId);
    if (!p) return [`research topic ${protocolId}`];
    if (Array.isArray(p.queryVariants) && p.queryVariants.length) {
        return [...new Set(p.queryVariants)].slice(0, 18);
    }
    const base = (p.q || p.name || '').trim();
    const variants = [base];
    QUERY_SUFFIXES.forEach(s => variants.push(`${base} ${s}`));
    return [...new Set(variants.filter(Boolean))].slice(0, 18);
}

function generateEligibilityStatement(title, abstract, tankId) {
    const combined = (title + ' ' + abstract).toLowerCase();
    const keywords = protocolKeywords(tankId);
    const matched = keywords.filter(kw => combined.includes(kw));
    if (matched.length === 0) return '⚠️ Tangential — manual review required';
    const score = matched.length >= 4 ? '🟢 HIGH' : matched.length >= 2 ? '🟡 MEDIUM' : '🟠 LOW';
    return `${score} relevance — Contains evidence on: ${matched.slice(0, 5).map(k => `<em>${k}</em>`).join(', ')}`;
}

function detectCrossTankConnections(title, abstract, currentTank) {
    const text = (title + ' ' + abstract).toLowerCase();
    const connections = [];
    if (typeof TANKS === 'undefined') return '—';
    for (const [protocolId] of Object.entries(TANKS)) {
        if (parseInt(protocolId, 10) === parseInt(currentTank, 10)) continue;
        const kws = protocolKeywords(protocolId);
        if (kws.some(kw => text.includes(kw))) connections.push(`P${protocolId}`);
    }
    return connections.length > 0 ? connections.join(', ') : '—';
}

function detectStudyType(pubTypeList) {
    if (!pubTypeList || pubTypeList.length === 0) return '⚗️ Original Research';
    const types = pubTypeList.map(t => (t.value || t).toLowerCase()).join(' ');
    if (types.includes('meta-analysis')) return '📊 Meta-Analysis';
    if (types.includes('systematic review')) return '📋 Sys. Review';
    if (types.includes('randomized controlled trial')) return '🔬 RCT';
    if (types.includes('clinical trial')) return '🏥 Clinical Trial';
    if (types.includes('review')) return '📖 Review';
    return '⚗️ Original Research';
}

function formatCitation(p) {
    return `${p.authors}. ${p.title} <em>${p.journal}</em>. ${p.year}. PMID: <a href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}" target="_blank">${p.pmid}</a>${p.doi ? '. DOI: <a href="https://doi.org/' + p.doi + '" target="_blank">' + p.doi + '</a>' : ''}.`;
}

// ─── CORS-RESILIENT FETCH ─────────────────────────────────────────────────────

async function proxyFetch(rawUrl) {
    console.log(`📡 Fetching: ${rawUrl.substring(0, 80)}...`);
    try { const r = await fetch(rawUrl); if (r.ok) return r; } catch (e) { }
    try { const r = await fetch('https://corsproxy.io/?' + encodeURIComponent(rawUrl)); if (r.ok) return r; } catch (e) { }
    try { 
        const r = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(rawUrl));
        if (r.ok) {
            const data = await r.json();
            return new Response(data.contents, { status: 200, headers: { 'Content-Type': 'text/plain' } });
        }
    } catch (e) { }
    return await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(rawUrl));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── PUBMED API FUNCTIONS ─────────────────────────────────────────────────────

// ─── EUROPE PMC (additional source, no API key) ─────────────────────────────

async function fetchEuropePMC(query, maxResults = 8) {
    const rawUrl = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&resultType=core&pageSize=${maxResults}&sort=RELEVANT`;
    try {
        const res = await proxyFetch(rawUrl);
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.resultList || !data.resultList.result) return [];
        return data.resultList.result.map(doc => ({
            pmid: doc.pmid || doc.id || '',
            title: doc.title || '',
            authors: doc.authorString ? (doc.authorString.length > 80 ? doc.authorString.substring(0, 80) + ' et al.' : doc.authorString) : 'Unknown',
            journal: doc.journalTitle || doc.source || 'Unknown',
            year: doc.pubYear ? String(doc.pubYear) : '?',
            doi: doc.doi || '',
            studyType: detectStudyType(doc.pubTypeList ? doc.pubTypeList.pubType : []),
            abstract: doc.abstractText || '[No abstract via Europe PMC]',
            source: 'europepmc',
        }));
    } catch (e) {
        return [];
    }
}

async function fetchPMIDsForQuery(query, retmax = 12) {
    const rawUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=${retmax}&tool=researchtank&email=researchtank@local.dev`;
    try {
        const res = await proxyFetch(rawUrl);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.esearchresult?.idlist) || [];
    } catch (e) { return []; }
}

async function fetchPaperSummaries(pmids) {
    if (!pmids || pmids.length === 0) return {};
    const rawUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json&tool=researchtank&email=researchtank@local.dev`;
    try {
        const res = await proxyFetch(rawUrl);
        if (!res.ok) return {};
        const data = await res.json();
        return data.result || {};
    } catch (e) { return {}; }
}

async function fetchAbstractsXML(pmids) {
    if (!pmids || pmids.length === 0) return {};
    const rawUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&rettype=xml&retmode=xml&tool=researchtank&email=researchtank@local.dev`;
    const abstracts = {};
    try {
        const res = await proxyFetch(rawUrl);
        if (!res.ok) return {};
        const xmlText = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const articles = doc.querySelectorAll('PubmedArticle');
        articles.forEach(article => {
            const pmid = article.querySelector('PMID')?.textContent?.trim();
            if (!pmid) return;
            const abstractNodes = article.querySelectorAll('AbstractText');
            let abstract = '';
            if (abstractNodes.length > 1) {
                abstract = Array.from(abstractNodes).map(n => {
                    const label = n.getAttribute('Label') || '';
                    return label ? `[${label}] ${n.textContent.trim()}` : n.textContent.trim();
                }).join(' ');
            } else if (abstractNodes.length === 1) {
                abstract = abstractNodes[0].textContent.trim();
            } else {
                abstract = '[No abstract available in PubMed for this record]';
            }
            abstracts[pmid] = abstract;
        });
    } catch (e) { /* silent — abstract fetch is best-effort */ }
    return abstracts;
}

// ─── SEQUENTIAL SEARCH ORCHESTRATOR ──────────────────────────────────────────

let lastSearchResults = [];
let lastSearchTankId = null;

async function runParallelSearch(tankId) {
    console.log(`▶ Starting Sequential Research Engine for Protocol ${tankId}...`);
    const queries = buildProtocolQueries(tankId);
    const container = document.getElementById('searchEngineOutput');
    const runBtn = document.getElementById('searchRunBtn');
    const runSpin = document.getElementById('searchRunSpin');
    const runLabel = document.getElementById('searchRunLabel');
    const synthBtn = document.getElementById('synthBtn');

    if (!container || !runBtn) return;

    runBtn.disabled = true;
    runSpin.style.display = 'block';
    if (synthBtn) synthBtn.disabled = true;

    const allPMIDs = new Set();
    const queryResults = {};

    container.innerHTML = `
        <div id="searchProgress" style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:8px;padding:16px;font-family:var(--mono);font-size:12px;">
            <div style="color:var(--acc);margin-bottom:10px;">⟳ Sequential Query Engine Initializing — Protocol ${tankId}</div>
            <div id="progressLog" style="display:flex;flex-direction:column;gap:4px;max-height:250px;overflow-y:auto;"></div>
            <div style="margin-top:12px;">
                <div style="color:var(--dim);margin-bottom:4px;">Progress: <span id="progressFrac">0/${queries.length}</span></div>
                <div style="background:rgba(255,255,255,0.1);border-radius:4px;height:4px;overflow:hidden;">
                    <div id="progressBar2" style="height:100%;background:var(--acc);width:0%;transition:width 0.3s ease;"></div>
                </div>
            </div>
        </div>`;

    const log = document.getElementById('progressLog');

    function logLine(msg, color = 'var(--dim)') {
        const line = document.createElement('div');
        line.innerHTML = `<span style="color:${color};">${msg}</span>`;
        log.appendChild(line);
        log.scrollTop = log.scrollHeight;
    }

    function updateBar(i) {
        const pct = Math.round((i / queries.length) * 100);
        const barEl = document.getElementById('progressBar2');
        const fracEl = document.getElementById('progressFrac');
        if (barEl) barEl.style.width = pct + '%';
        if (fracEl) fracEl.textContent = `${i}/${queries.length}`;
    }

    // ── PHASE 1: Sequential PubMed Query Execution ──
    window.lastQueryMap = {}; // query string → [pmids]
    for (let i = 0; i < queries.length; i++) {
        const q = queries[i];
        runLabel.textContent = `PubMed ${i + 1}/${queries.length}...`;
        logLine(`Q${i + 1} [PubMed]: "${q}"`, 'var(--dim)');
        const pmids = await fetchPMIDsForQuery(q, 12);
        pmids.forEach(id => allPMIDs.add(id));
        queryResults[q] = pmids;
        window.lastQueryMap[q] = pmids; // persist for refiner
        logLine(`   → ${pmids.length} PMIDs`, pmids.length > 0 ? 'var(--acc2)' : '#ff6644');
        updateBar(i + 1);
        await sleep(280);
    }

    logLine(`✓ PubMed complete — ${allPMIDs.size} unique PMIDs`, 'var(--acc)');

    // ── PHASE 1b: Europe PMC sequential sweep (direct paper objects) ──
    const europePMCPapers = [];
    const europePMCQueries = queries.slice(0, 8); // Sample top 8 queries to stay within rate limits
    logLine(`▶ Europe PMC sweep — ${europePMCQueries.length} queries...`, '#44aaff');
    for (let i = 0; i < europePMCQueries.length; i++) {
        const q = europePMCQueries[i];
        runLabel.textContent = `Europe PMC ${i + 1}/${europePMCQueries.length}...`;
        const papers = await fetchEuropePMC(q, 8);
        europePMCPapers.push(...papers);
        logLine(`   Q${i + 1} → ${papers.length} from Europe PMC`, papers.length > 0 ? '#44aaff' : '#ff6644');
        await sleep(350);
    }

    const totalUnique = allPMIDs.size;
    logLine(`✅ Phase 1 complete — ${totalUnique} unique PMIDs collected`, 'var(--acc)');

    if (totalUnique === 0) {
        container.innerHTML = `<div class="err-msg">⚠ Zero results returned across all queries. Check network and proxy.</div>`;
        runBtn.disabled = false;
        runSpin.style.display = 'none';
        runLabel.textContent = '▶ Run Sequential Search';
        return;
    }

    // ── PHASE 2: Fetch Paper Summaries (batched) ──
    logLine(`⟳ Phase 2: Fetching metadata for ${totalUnique} papers...`, 'var(--acc)');
    runLabel.textContent = `Fetching ${totalUnique} summaries...`;

    const allPMIDArr = [...allPMIDs];
    const BATCH = 40;
    let summaries = {};
    for (let b = 0; b < allPMIDArr.length; b += BATCH) {
        const batch = allPMIDArr.slice(b, b + BATCH);
        const batchData = await fetchPaperSummaries(batch);
        Object.assign(summaries, batchData);
        await sleep(350);
    }

    // ── PHASE 3: Fetch Abstracts (XML, batched) ──
    logLine(`⟳ Phase 3: Fetching abstracts via PubMed efetch...`, 'var(--acc)');
    runLabel.textContent = `Fetching abstracts...`;
    let abstracts = {};
    for (let b = 0; b < allPMIDArr.length; b += BATCH) {
        const batch = allPMIDArr.slice(b, b + BATCH);
        const batchAbstracts = await fetchAbstractsXML(batch);
        Object.assign(abstracts, batchAbstracts);
        await sleep(400);
    }
    logLine(`✅ Phase 3 complete — ${Object.keys(abstracts).length} abstracts loaded`, 'var(--acc)');

    // ── PHASE 4: Build & Deduplicate Paper Objects ──
    const seen = new Set();
    const papers = allPMIDArr
        .map(id => {
            const doc = summaries[id];
            if (!doc || !doc.title) return null;
            // Deduplicate by title (catches slight PMID variants)
            const titleKey = doc.title.toLowerCase().substring(0, 60);
            if (seen.has(titleKey)) return null;
            seen.add(titleKey);

            let authors = (doc.authors || []).map(a => a.name).join(', ');
            if (authors.length > 80) authors = authors.substring(0, 80) + ' et al.';
            let doi = '';
            (doc.articleids || []).forEach(a => { if (a.idtype === 'doi') doi = a.value; });
            const abstract = abstracts[id] || '[Abstract not available]';

            return {
                pmid: doc.uid,
                title: doc.title,
                authors,
                journal: doc.source || 'Unknown',
                year: doc.pubdate ? doc.pubdate.substring(0, 4) : '?',
                doi,
                studyType: detectStudyType(doc.pubtype || []),
                abstract,
                eligibility: generateEligibilityStatement(doc.title, abstract, tankId),
                connections: detectCrossTankConnections(doc.title, abstract, tankId),
                nuance: doc.pubdate > '2022' ? '🆕 Recent' : '',
            };
        })
        .filter(Boolean);

    lastSearchResults = papers;
    lastSearchTankId = tankId;

    // Merge Europe PMC papers not already in pool
    const existingTitles = new Set(papers.map(p => p.title.toLowerCase().substring(0, 60)));
    let epmc_added = 0;
    europePMCPapers.forEach(ep => {
        if (!ep.title) return;
        const key = ep.title.toLowerCase().substring(0, 60);
        if (existingTitles.has(key)) return;
        existingTitles.add(key);
        ep.eligibility = generateEligibilityStatement(ep.title, ep.abstract, tankId);
        ep.connections = detectCrossTankConnections(ep.title, ep.abstract, tankId);
        ep.nuance = (ep.year >= '2022') ? '🆕 Recent' : '';
        if (!ep.studyType) ep.studyType = '⚗️ Original Research';
        papers.push(ep);
        epmc_added++;
    });
    logLine(`✓ Europe PMC added ${epmc_added} unique papers`, '#44aaff');

    logLine(`✅ Deduplication complete — ${papers.length} unique papers`, 'var(--acc)');
    await sleep(500);

    // ── PHASE 5: Render Evidence Table ──
    runLabel.textContent = `Rendering ${papers.length} papers...`;
    renderEvidenceTable(papers, tankId);

    runBtn.disabled = false;
    runSpin.style.display = 'none';
    runLabel.textContent = '▶ Run Sequential Search';
    if (synthBtn) synthBtn.disabled = false;
}

//        return `
        <div class="vcard" id="${cardId}" style="flex-direction:column;gap:0;padding:0;overflow:hidden;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.02);">
            <!-- Systematic Header Row -->
            <div style="display:grid;grid-template-columns: 40px 1fr 140px;gap:16px;padding:16px;cursor:pointer;align-items:start;" onclick="toggleAbstract('${cardId}')">
                <div style="color:var(--dim);font-family:var(--mono);font-size:12px;padding-top:4px;text-align:center;">${i + 1}</div>
                <div style="min-width:0;">
                    <div style="font-weight:700;font-size:14px;color:var(--acc);line-height:1.4;margin-bottom:6px;">${esc(p.title)}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:8px;">${esc(p.authors)} | <em>${esc(p.journal)}</em> (${p.year})</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                        <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:4px;padding:2px 8px;font-weight:700;">${p.studyType}</span>
                        ${p.connections !== '—' ? `<span style="font-size:10px;text-transform:uppercase;background:rgba(160,128,255,0.1);border:1px solid rgba(160,128,255,0.3);border-radius:4px;padding:2px 8px;color:#a080ff;">🔗 ${p.connections}</span>` : ''}
                        ${p.nuance ? `<span style="font-size:10px;text-transform:uppercase;background:rgba(68,136,255,0.1);border:1px solid rgba(68,136,255,0.3);border-radius:4px;padding:2px 8px;color:#44aaff;">${p.nuance}</span>` : ''}
                    </div>
                </div>
                <div style="text-align:right;display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
                    <div style="font-size:11px;font-weight:700;color:${p.eligibility.includes('🟢')?'#22cc66':p.eligibility.includes('🟡')?'#ffcc44':'#ff6644'}">
                        ${p.eligibility.split(' relevance')[0]}
                    </div>
                    <div style="font-size:11px;color:var(--dim);">▼ Detail</div>
                </div>
            </div>

            <!-- Expandable Detail Block -->
            <div class="abstract-block" id="${cardId}_detail" style="display:none;border-top:1px solid var(--border);padding:20px;background:rgba(0,0,0,0.3);">
                <!-- Systematic Display Grid -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
                    <div>
                        <div style="font-size:10px;color:var(--dim);font-family:var(--mono);margin-bottom:8px;text-transform:uppercase;">Eligibility Statement</div>
                        <div style="font-size:12px;color:var(--txt);line-height:1.5;">${p.eligibility}</div>
                    </div>
                    <div>
                        <div style="font-size:10px;color:var(--dim);font-family:var(--mono);margin-bottom:8px;text-transform:uppercase;">Study Type Detail</div>
                        <div style="font-size:12px;color:var(--txt);">${p.studyType || 'N/A'}</div>
                    </div>
                </div>
                
                <div style="margin-bottom:20px;">
                    <div style="font-size:10px;color:var(--dim);font-family:var(--mono);margin-bottom:8px;text-transform:uppercase;">Abstract</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.7;white-space:pre-wrap;">${esc(p.abstract)}</div>
                </div>

                <div style="margin-bottom:20px;padding:12px;background:rgba(0,0,0,0.2);border-radius:6px;border:1px solid rgba(255,255,255,0.05);">
                    <div style="font-size:10px;color:var(--dim);font-family:var(--mono);margin-bottom:6px;text-transform:uppercase;">Full Citation</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.6);line-height:1.6;">${formatCitation(p)}</div>
                </div>

                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <a class="btn btn-ghost btn-sm" href="${pmLink}" target="_blank" rel="noopener">PubMed ↗</a>
                    ${doiLink ? `<a class="btn btn-ghost btn-sm" href="${doiLink}" target="_blank" rel="noopener">DOI ↗</a>` : ''}
                    <a class="btn btn-ghost btn-sm" href="${schLink}" target="_blank" rel="noopener">Scholar ↗</a>
                    <button class="btn btn-ok btn-sm" onclick="cacheEvidencePaper(${i})">⊞ Cache to Vault</button>
                </div>
            </div>
        </div>`;e:11px;color:rgba(255,255,255,0.6);line-height:1.6;">${formatCitation(p)}</div>
                </div>
                <!-- Action Buttons -->
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <a class="btn btn-ghost btn-sm" href="${pmLink}" target="_blank" rel="noopener">PubMed ↗</a>
                    ${doiLink ? `<a class="btn btn-ghost btn-sm" href="${doiLink}" target="_blank" rel="noopener">DOI ↗</a>` : ''}
                    <a class="btn btn-ghost btn-sm" href="${schLink}" target="_blank" rel="noopener">Scholar ↗</a>
                    <button class="btn btn-ok btn-sm" onclick="cacheEvidencePaper(${i})">⊞ Cache</button>
                </div>
            </div>
        </div>`;
    }).join('');

    container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
        <div style="font-family:var(--mono);font-size:13px;color:var(--acc);">
            ⬡ Protocol ${tankId} Evidence Matrix — <strong>${papers.length} papers</strong> | Click any row to expand abstract
        </div>
        <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost btn-sm" onclick="expandAllAbstracts()">Expand All</button>
            <button class="btn btn-ghost btn-sm" onclick="exportEvidenceCSV(${tankId})">↓ CSV</button>
            <button class="btn btn-ghost btn-sm" onclick="exportEvidenceMD(${tankId})">↓ Markdown</button>
        </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">${rows}</div>`;
}

// ─── INTERACTION HELPERS ──────────────────────────────────────────────────────

function toggleAbstract(cardId) {
    const detail = document.getElementById(cardId + '_detail');
    const card = document.getElementById(cardId);
    if (!detail) return;
    const isOpen = detail.style.display !== 'none';
    detail.style.display = isOpen ? 'none' : 'block';
    const arrow = card.querySelector('[onclick] > div:last-child');
    if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
}

function expandAllAbstracts() {
    document.querySelectorAll('.abstract-block').forEach(el => el.style.display = 'block');
}

function cacheEvidencePaper(idx) {
    const p = lastSearchResults[idx];
    if (!p || typeof vault === 'undefined') return;
    vault.push({
        id: 'paper_' + p.pmid + '_' + Date.now(),
        title: `[T${lastSearchTankId}] ${p.title.substring(0, 60)}...`,
        content: `# ${p.title}\n\n**Authors:** ${p.authors}\n**Journal:** ${p.journal} · ${p.year}\n**PMID:** ${p.pmid}\n**DOI:** ${p.doi || 'N/A'}\n\n## Abstract\n${p.abstract}\n\n## Eligibility\n${p.eligibility.replace(/<[^>]+>/g, '')}\n\n## Citation\n${p.authors}. ${p.title}. ${p.journal}. ${p.year}. PMID: ${p.pmid}.`,
        ts: new Date().toLocaleString()
    });
    persistVault();
    renderVault();
}

// ─── EXPORT FUNCTIONS ─────────────────────────────────────────────────────────

function exportEvidenceCSV(tankId) {
    if (!lastSearchResults || lastSearchResults.length === 0) return;
    const headers = ['#', 'Title', 'Authors', 'Journal', 'Year', 'Study Type', 'Cross-Tank', 'PMID', 'DOI', 'Abstract'];
    
    function cleanCSV(str) {
        if (!str) return '""';
        return `"${String(str).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ')}"`;
    }

    const rows = lastSearchResults.map((p, i) => [
        i + 1,
        cleanCSV(p.title),
        cleanCSV(p.authors),
        cleanCSV(p.journal),
        p.year, 
        cleanCSV(p.studyType), 
        cleanCSV(p.connections), 
        p.pmid, 
        cleanCSV(p.doi),
        cleanCSV(p.abstract)
    ].join(','));
    
    // Prefix with UTF-8 BOM for Excel compatibility
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Protocol_${tankId}_Evidence_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
}

function exportEvidenceMD(tankId) {
    if (!lastSearchResults || lastSearchResults.length === 0) return;
    const tank = typeof TANKS !== 'undefined' ? TANKS[tankId] : {};
    let md = `# Protocol ${tankId} Evidence Matrix\n**${tank.name || ''}**\n*Generated: ${new Date().toLocaleString()}*\n\n---\n\n`;
    lastSearchResults.forEach((p, i) => {
        md += `## ${i + 1}. ${p.title}\n`;
        md += `**${p.authors}** · *${p.journal}* · ${p.year} · ${p.studyType}\n\n`;
        md += `**Eligibility:** ${p.eligibility.replace(/<[^>]+>/g, '')}\n\n`;
        md += `**Abstract:** ${p.abstract}\n\n`;
        md += `**Citation:** ${p.authors}. ${p.title}. ${p.journal}. ${p.year}. PMID: ${p.pmid}${p.doi ? '. DOI: ' + p.doi : ''}.\n\n`;
        md += `**Links:** [PubMed](https://pubmed.ncbi.nlm.nih.gov/${p.pmid}) ${p.doi ? `| [DOI](https://doi.org/${p.doi})` : ''}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Protocol_${tankId}_Evidence_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
}

// ─── QUERY PREVIEW (called from ui.js selScrapeTank) ─────────────────────────

function generateQueryPermutations(tankId) {
    return buildProtocolQueries(tankId);
}
