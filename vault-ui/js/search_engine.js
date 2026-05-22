// js/search_engine.js — v9: Sequential Deep Research Engine
console.log('Search Engine v9 Loaded');
// No API Key Required. Uses only PubMed E-Utilities.

// ─── DEEP RESEARCH QUERY BANKS (per Tank — unique endpoint-focused) ───────────

const TANK_QUERIES = {
    1: [ // ACETAMINOPHEN
        'acetaminophen opioid-sparing delirium prevention postoperative adults',
        'paracetamol delirium incidence randomized controlled trial ICU',
        'acetaminophen COX-3 central nervous system mechanism analgesia',
        'non-opioid analgesic postoperative cognitive dysfunction prevention review',
        'opioid analgesic delirium risk elderly perioperative systematic review',
        'intravenous acetaminophen opioid consumption reduction surgery',
        'HPA hypothalamic pituitary adrenal axis opioid stress response surgery',
        'acetaminophen serotonin cannabinoid endocannabinoid pain mechanism',
        'acetaminophen neuroinflammation microglial activation cytokine',
        'scheduled acetaminophen versus PRN opioid delirium outcomes',
        'multimodal analgesia delirium prevention perioperative protocol',
        'acetaminophen anti-inflammatory IL-6 TNF postoperative',
        'opioid elimination delirium risk reduction clinical evidence',
        'acetaminophen NMDA glutamate spinal cord pain modulation',
        'morphine equivalent dose delirium dose-response perioperative',
        'COX-2 inhibitor opioid sparing surgery postoperative delirium',
        'acetaminophen safety hepatotoxicity ICU critically ill monitoring',
        'non-pharmacological delirium prevention ABCDEF bundle analgesic',
    ],
    2: [ // PAIN THEORY
        'Weber Fechner law pain perception psychophysics clinical review',
        'Stevens power law pain thermal nociception quantification',
        'Emery Brown EEG consciousness anesthesia nociception quantification',
        'EEG gamma band 60-100Hz pain processing somatosensory cortex',
        'heart rate variability frequency domain nociception monitoring perioperative',
        'skin conductance galvanic response nociception autonomic perioperative',
        'nociception level index NOL monitor clinical validation',
        'algesia nociception index ANI heart rate variability validation',
        'closed loop analgesia automated drug delivery feedback control',
        'pain perception logarithmic model individual variability calculation',
        'pupillometry pupillary dilation reflex pain ICU assessment',
        'multimodal nociception monitoring composite index perioperative',
        'Bayesian state space estimation EEG pain analgesia',
        'individual variability pain threshold psychophysical modeling',
        'ICU pain assessment non-verbal CPOT behavioral scale validation',
        'EEG alpha suppression pain nociceptive response anesthesia',
        'prediction error Bayesian updating pain expectation modulation',
        'cognitive modulation pain prefrontal PAG descending control fMRI',
        'psychophysical pain model transition VAS intensity nonlinear',
        'neural correlates pain perception cortical oscillations gamma beta',
    ],
    3: [ // SPMs + POD
        'resolvins protectins maresins neuroinflammation review Serhan',
        'specialized pro-resolving mediators surgery postoperative outcomes',
        'DHA EPA lipid mediators inflammation resolution biology',
        'neutrophil apoptosis efferocytosis resolution Serhan lipoxin',
        'omega-3 fatty acids surgical inflammation perioperative',
        'postoperative delirium neuroinflammation mechanism review',
        'surgical trauma systemic inflammation brain microglial activation',
        'prostaglandin leukotriene class switching resolution lipid mediator',
        'resolvin D1 D2 neuroinflammation animal model cytokine',
        'lipid mediator resolution failure chronic inflammation',
        'postoperative delirium biomarker serum cerebrospinal fluid',
        'neuroinflammation blood brain barrier surgery cytokine',
        'omega-3 supplementation perioperative inflammation randomized trial',
        'arachidonic acid cascade COX LOX eicosanoid perioperative',
        'maresins protectin D1 macrophage microglia neuroinflammation',
        'SPM biosynthesis DHA 12-lipoxygenase 15-lipoxygenase pathway',
        'resolvin E1 E2 EPA derived neutrophil inflammation resolution',
        'postoperative neuroinflammation cognitive decline POCD review',
        'lipoxin A4 aspirin-triggered anti-inflammatory mechanism',
        'SPM receptor GPR32 ALX FPR2 signaling anti-inflammatory',
    ],
    4: [ // MANAGEMENT
        'ABCDEF bundle delirium prevention ICU evidence based protocol',
        'biomarker-guided analgesic management delirium ICU',
        'S100beta GFAP biomarker delirium postoperative brain injury',
        'eye tracking saccade delirium cognitive impairment',
        'hemolytic protein haptoglobin delirium ICU neuroinflammation',
        'CAM-ICU confusion assessment method validation critically ill',
        'delirium assessment tool ICU ICDSC validation review',
        'acetaminophen microdosing pain management optimization protocol',
        'opioid-free anesthesia multimodal analgesic delirium outcomes',
        'non-pharmacological delirium prevention mobilization light sleep',
        'sleep deprivation ICU delirium incidence cohort study',
        'circadian melatonin ramelteon ICU delirium prevention RCT',
        'dexmedetomidine delirium prevention sedation ICU trial',
        'haloperidol antipsychotic delirium treatment evidence review',
        'delirium prediction model risk score preoperative elderly',
        'neurocognitive monitoring EEG processed index delirium prevention',
        'PROSPECT guideline multimodal analgesia surgery recommendation',
        'IV versus oral acetaminophen pharmacokinetics clinical outcomes',
        'ketamine opioid sparing perioperative delirium evidence',
        'regional anesthesia opioid sparing delirium prevention surgery',
    ],
    5: [ // GRAND SYNTHESIS
        'postoperative delirium pathophysiology unified review framework',
        'neuroinflammation delirium perioperative integrated mechanism',
        'perioperative delirium multi-factorial mechanism systematic review',
        'delirium cognitive reserve brain vulnerability aging surgery',
        'SPM opioid circadian gut integrated delirium model',
        'neuroinflammation resolution failure clinical consequence review',
        'delirium Alzheimer dementia neurodegeneration connection review',
        'perioperative neurocognitive disorder POCD mechanisms prevention',
        'geriatric surgery delirium frailty outcomes review',
        'biomarker neuroinflammation delirium prediction serum',
        'multimodal intervention delirium prevention meta-analysis',
        'ICU delirium long term outcomes cognitive impairment survival',
        'pain inflammation delirium connection mechanism review',
        'gut microbiome circadian rhythm neuroinflammation convergence',
        'precision medicine delirium prevention individual risk stratification',
        'delirium preventable postoperative outcome population attributable',
        'economic burden delirium ICU cost hospitalization',
        'delirium subsyndromal prodrome clinical significance review',
    ],
    6: [ // GUT-BRAIN
        'gut microbiome ICU delirium dysbiosis prospective study',
        'gut-brain axis neuroinflammation perioperative review',
        'LPS lipopolysaccharide TLR4 neuroinflammation blood brain barrier',
        'microbiome dysbiosis surgery antibiotics postoperative complications',
        'intestinal barrier permeability I-FABP zonulin surgery',
        'gut bacteria Bacteroidetes Firmicutes ratio ICU critically ill',
        'butyrate short chain fatty acid microglia anti-inflammatory',
        'probiotics synbiotics ICU delirium prevention clinical trial',
        'PAMPs pathogen associated molecular patterns systemic inflammation BBB',
        'vagal nerve stimulation anti-inflammatory gut brain mechanism',
        'perioperative antibiotic gut flora delirium connection',
        'microbiome brain behavior cognition review preclinical clinical',
        'gut bacterial translocation systemic inflammation postoperative',
        'bifidobacterium lactobacillus CNS behavior clinical study',
        'fecal microbiota transplant neurological outcomes review',
        'inflammatory bowel disease neuropsychiatric cognitive symptoms',
        'NPO bowel prep surgery microbiome alteration outcomes',
        'microbiome metabolomics tryptophan serotonin brain behavior',
        'tryptophan kynurenine pathway neuroinflammation delirium',
        'gut permeability claudin occludin tight junction brain function',
    ],
    7: [ // CIRCADIAN
        'circadian rhythm disruption ICU delirium incidence cohort',
        'melatonin ICU delirium prevention randomized controlled trial',
        'ramelteon circadian delirium prevention critical care RCT',
        'microglial priming neuroinflammation exaggerated response aging',
        'sleep disruption ICU slow wave sleep delirium polysomnography',
        'amyloid tau subclinical burden surgery delirium cognitive',
        'APOE4 genotype delirium risk postoperative cognitive',
        'melatonin anti-inflammatory MT1 MT2 receptor mechanism',
        'circadian clock gene Per1 Per2 BMAL1 immune regulation',
        'light therapy chronotherapy ICU hospital delirium protocol',
        'suprachiasmatic nucleus SCN circadian entrainment immune',
        'microglial morphology reset sleep NREM wave depletion',
        'cortisol circadian rhythm disruption surgery ICU',
        'suvorexant orexin antagonist delirium sleep promotion ICU',
        'ICU noise light intervention circadian delirium protocol',
        'aging microglia phenotype M1 M2 primed sensitized review',
        'neuroinflammation sleep-wake cycle bidirectional review',
        'melatonin neuroprotection oxidative stress mechanism review',
        'chronobiology pharmacology timing drug administration outcomes',
        'sleep architecture REM NREM immune function review',
    ],
};

// ─── KEYWORD BANKS for eligibility matching ───────────────────────────────────

const TANK_KEYWORDS = {
    1: ['acetaminophen', 'paracetamol', 'opioid', 'delirium', 'cox', 'analgesia', 'pain', 'neuroinflammation', 'hpa', 'serotonin', 'multimodal'],
    2: ['pain', 'nociception', 'eeg', 'heart rate variability', 'gamma', 'weber', 'fechner', 'stevens', 'bayesian', 'closed loop', 'autonomic', 'psychophysic'],
    3: ['resolvin', 'protectin', 'maresin', 'lipoxin', 'spm', 'pro-resolving', 'serhan', 'dha', 'epa', 'neutrophil', 'efferocytosis', 'lipid mediator'],
    4: ['delirium', 'cam-icu', 'abcdef', 'biomarker', 's100', 'gfap', 'eye tracking', 'microdosing', 'protocol', 'management', 'bundle', 'ramelteon'],
    5: ['delirium', 'perioperative', 'neuroinflammation', 'cognitive', 'framework', 'synthesis', 'pathophysiology', 'prevention', 'unified'],
    6: ['microbiome', 'gut-brain', 'lps', 'dysbiosis', 'blood brain barrier', 'pamp', 'tlr4', 'scfa', 'butyrate', 'zonulin', 'intestinal', 'vagal'],
    7: ['circadian', 'melatonin', 'microglial', 'priming', 'amyloid', 'tau', 'sleep', 'ramelteon', 'suprachiasmatic', 'apoe', 'slow wave'],
};

const CROSS_TANK_KEYWORDS = {
    1: ['acetaminophen', 'paracetamol', 'opioid sparing', 'cox', 'multimodal'],
    2: ['nociception', 'eeg', 'weber fechner', 'heart rate variability', 'closed loop', 'psychophysic'],
    3: ['resolvin', 'protectin', 'maresin', 'spm', 'pro-resolving', 'lipid mediator', 'serhan'],
    4: ['abcdef', 'cam-icu', 'biomarker', 'management protocol', 'bundle', 'eye tracking'],
    5: ['unified', 'grand synthesis', 'integrated model'],
    6: ['microbiome', 'gut-brain', 'lps', 'dysbiosis', 'tlr4', 'intestinal barrier'],
    7: ['circadian', 'melatonin', 'microglial priming', 'slow wave sleep', 'amyloid'],
};

function generateEligibilityStatement(title, abstract, tankId) {
    const combined = (title + ' ' + abstract).toLowerCase();
    const keywords = TANK_KEYWORDS[tankId] || [];
    const matched = keywords.filter(kw => combined.includes(kw));
    if (matched.length === 0) return '⚠️ Tangential — manual review required';
    const score = matched.length >= 4 ? '🟢 HIGH' : matched.length >= 2 ? '🟡 MEDIUM' : '🟠 LOW';
    return `${score} relevance — Contains evidence on: ${matched.slice(0, 5).map(k => `<em>${k}</em>`).join(', ')}`;
}

function detectCrossTankConnections(title, abstract, currentTank) {
    const text = (title + ' ' + abstract).toLowerCase();
    const connections = [];
    for (const [tankId, kws] of Object.entries(CROSS_TANK_KEYWORDS)) {
        if (parseInt(tankId) === currentTank) continue;
        if (kws.some(kw => text.includes(kw))) connections.push(`T${tankId}`);
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
    console.log(`▶ Starting Sequential Research Engine for Tank ${tankId}...`);
    const queries = TANK_QUERIES[tankId] || [];
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
            <div style="color:var(--acc);margin-bottom:10px;">⟳ Sequential Query Engine Initializing — Tank ${tankId}</div>
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
            ⬡ Tank ${tankId} Evidence Matrix — <strong>${papers.length} papers</strong> | Click any row to expand abstract
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
    a.download = `Tank_${tankId}_Evidence_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
}

function exportEvidenceMD(tankId) {
    if (!lastSearchResults || lastSearchResults.length === 0) return;
    const tank = typeof TANKS !== 'undefined' ? TANKS[tankId] : {};
    let md = `# Tank ${tankId} Evidence Matrix\n**${tank.name || ''}**\n*Generated: ${new Date().toLocaleString()}*\n\n---\n\n`;
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
    a.download = `Tank_${tankId}_Evidence_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
}

// ─── QUERY PREVIEW (called from ui.js selScrapeTank) ─────────────────────────

function generateQueryPermutations(tankId) {
    return TANK_QUERIES[tankId] || [];
}
