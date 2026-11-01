

function collectTokens() {
    return {
        faceit_token: document.getElementById('faceit_key').value.trim(),
        csqaq_token: document.getElementById('csqaq_key').value.trim(),
        steamdt_token: document.getElementById('steamdt_key').value.trim(),
        pw_token: document.getElementById('pw_token').value.trim(),   
        leetify_token: document.getElementById('leetify_key').value.trim()   
    };
}

function applyTokens(tokens) {

    let t = tokens || {};
    if (t.tokens && typeof t.tokens === 'object') t = { ...t.tokens, ...t };
    const pick = ( obj,  short,  long) => {
        if (obj[long] !== undefined) return obj[long];
        if (obj[short] !== undefined) return obj[short];
        return undefined;
    };
    const faceit = pick(t, 'faceit_token', 'sps_faceit_key');
    const csqaq = pick(t, 'csqaq_token', 'sps_csqaq_key');
    const steamdt = pick(t, 'steamdt_token', 'sps_steamdt_key');
    const pw = pick(t, 'pw_token', 'sps_pw_token');
    const leetify = pick(t, 'leetify_token', 'sps_leetify_key');
    let filled = 0;
    if (faceit !== undefined) { document.getElementById('faceit_key').value = faceit; if (faceit) filled++; }
    if (csqaq !== undefined) { document.getElementById('csqaq_key').value = csqaq; if (csqaq) filled++; }
    if (steamdt !== undefined) { document.getElementById('steamdt_key').value = steamdt; if (steamdt) filled++; }
    if (pw !== undefined) { document.getElementById('pw_token').value = pw; if (pw) filled++; }
    if (leetify !== undefined) { document.getElementById('leetify_key').value = leetify; if (leetify) filled++; }
    return filled;   
}
