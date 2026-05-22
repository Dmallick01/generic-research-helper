// js/api.js

window.API_KEY = '';

function getApiKey() {
    return localStorage.getItem('research_anthropic_key') || window.API_KEY;
}

function checkKey() {
    const v = document.getElementById('anthropic_key').value.trim();
    window.API_KEY = v;
    // status update logic could be added here if needed
}

async function claude(prompt, maxTok = 2000) {
    const key = getApiKey();
    if (!key) throw new Error('Anthropic API key required. Set it in the Pipeline tab configuration.');
    
    // Using CORS proxy or native fetch if allowed locally. Assuming native for this prototype.
    const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: maxTok,
            messages: [{ role: 'user', content: prompt }]
        })
    });
    
    if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error?.message || 'API fault: ' + r.status);
    }
    
    const d = await r.json();
    return d.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}
