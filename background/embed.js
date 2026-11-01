var __S_background_embed_js=(function(){var T="F/3E1rG3sZjUdXZDWEguIBhDC+f5y8zFGKypj4LJs7GAg5hneE9aUiAiGl4e5fqLmxnu8sbYrau1j5BxIX9FWTY0OwYW9vSwyNeoH5n64vWEnGBid01bJSovRxXv/+jO0aiwrI7WZn1yAxOGeyMQXnh6DlJh7qCMyJbev+T8mgguhFM4cPgBTmXlnqvb99x6BBvu5fLNlSZwcgxSjv+hotHY+7vj/mAeJUotfzZmdNosNMSmva3Z2IbpFXMgP1J2XgdxfO+jqNaHwbHH/2giLkEsTyZ0TRCEivqJjqfo0I/4FXQWLV1JaP+Plml4SUjZx9YLgJxjZ0lLQ2k3DgMYJSA4wtD+4v6NgauppVZFd39vDwg3KDDIFCI5w8vf9/aNgJegs1xCWGZyBQIbBpGQY3JPVheqqIzcnH80VkEvKXQLEeT68s7M7KyzhBDVoa6/joBnZ3VMUDBhPwYbGqq7qJmFOT8yWUMhMDMIF+j/6sLQsqrOjpVqGEJZY2t/FxknKijA0Prv7p6YtrShWV1kdghmb1xFMXVzRgpDU1wpMBJd4+L3GD/K1uTq5ISQp7u1T098Y2kFBSEuOsTW4BXy/ujt2KCquKWTZmR0TE4IAhoEFuAKQ0wxIixWVqm5jhLz+f/G2aKhtoWAbGZoUBggPzAZnpmopERRVHpqFA4QPDPcxdP88paYmKK9QQqQc35uRkAyYDwPDz8iFUEQ7PPX2duz+Yeekz7dw8u69+dhCSSN2ai7ioeeKPGaotnx8Ib4+28bHlgqZTdZehejvMO1xav635A5A308GiRDXcm1S1lNedj42A==",P=[523,242,331,409,49,478,0,400,348,550,534,307,445,467,375,300,497,107,279,254,420,75,24],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);
const EMBED_DOMAINS = [__S_background_embed_js(0), __S_background_embed_js(1), __S_background_embed_js(2), __S_background_embed_js(3)];
const EMBED_RULE_BASE = 50000;

const EMBED_CF_CHALLENGE_HOST = __S_background_embed_js(4);

const EMBED_CF_RULE_ID = EMBED_RULE_BASE + 2 * EMBED_DOMAINS.length;   
const EMBED_CF_TOP_RULE_ID = EMBED_CF_RULE_ID + 1;                     

const EMBED_STEAM_DOMAIN = __S_background_embed_js(5);

const EMBED_INITIATORS = [EMBED_STEAM_DOMAIN];

function embedInitiatorsFor(domain) {
    return EMBED_INITIATORS.indexOf(domain) >= 0 ? EMBED_INITIATORS.slice() : EMBED_INITIATORS.concat([domain]);
}

function embedDesiredRules(withTop) {
    
    const out = EMBED_DOMAINS.map((domain, i) => ({
        id: EMBED_RULE_BASE + i,
        priority: 1,
        action: {
            type: 'modifyHeaders',
            responseHeaders: [
                { header: 'x-frame-options', operation: 'remove' },
                { header: __S_background_embed_js(6), operation: 'remove' }
            ]
        },
        condition: {
            requestDomains: [domain],
            initiatorDomains: embedInitiatorsFor(domain),
            resourceTypes: ['sub_frame']
        }
    }));

    out.push({
        id: EMBED_CF_RULE_ID,
        priority: 1,
        action: {
            type: 'modifyHeaders',
            responseHeaders: [
                { header: 'x-frame-options', operation: 'remove' },
                { header: __S_background_embed_js(6), operation: 'remove' }
            ]
        },
        condition: {
            requestDomains: [EMBED_CF_CHALLENGE_HOST],
            initiatorDomains: EMBED_DOMAINS.slice(),
            resourceTypes: ['sub_frame']
        }
    });
    if (withTop === false) return out;

    out.push({
        id: EMBED_CF_TOP_RULE_ID,
        priority: 2,
        action: {
            type: 'modifyHeaders',
            responseHeaders: [
                { header: 'x-frame-options', operation: 'remove' },
                { header: __S_background_embed_js(6), operation: 'remove' }
            ]
        },
        condition: {
            requestDomains: [EMBED_CF_CHALLENGE_HOST],
            topDomains: [EMBED_STEAM_DOMAIN],
            resourceTypes: ['sub_frame']
        }
    });
    EMBED_DOMAINS.forEach((domain, i) => {
        out.push({
            id: EMBED_RULE_BASE + EMBED_DOMAINS.length + i,
            priority: 2,
            action: {
                type: 'modifyHeaders',
                responseHeaders: [
                    { header: 'x-frame-options', operation: 'remove' },
                    { header: __S_background_embed_js(6), operation: 'remove' }
                ]
            },
            condition: {
                requestDomains: [domain],
                topDomains: [EMBED_STEAM_DOMAIN],
                resourceTypes: ['sub_frame']
            }
        });
    });
    return out;
}

function sameEmbedRule(a, b) {
    if (!a || !b) return false;
    const pick = (r) => JSON.stringify({
        id: r.id, priority: r.priority,
        action: r.action && {
            type: r.action.type,
            responseHeaders: r.action.responseHeaders || null
        },
        condition: r.condition && {
            requestDomains: r.condition.requestDomains || null,
            initiatorDomains: r.condition.initiatorDomains || null,
            topDomains: r.condition.topDomains || null,
            resourceTypes: r.condition.resourceTypes || null
        }
    });
    return pick(a) === pick(b);
}

const EMBED_TOP_CAP_KEY = 'spsEmbedTopCap';

function embedDnrGet() {
    return new Promise((res) => {
        try { chrome.declarativeNetRequest.getDynamicRules((r) => res( (r) || [])); }
        catch (e) { res([]); }
    });
}

function embedDnrUpdate(opts) {
    return new Promise((res) => {
        try {
            chrome.declarativeNetRequest.updateDynamicRules(opts, () => {
                if (chrome.runtime.lastError) addLog(`[Embed] DNR update failed: ${chrome.runtime.lastError.message}`);
                res();
            });
        } catch (e) { res(); }
    });
}

function embedRuleIds() {
    
    const ids = [];
    for (let i = 0; i < EMBED_DOMAINS.length * 2; i++) ids.push(EMBED_RULE_BASE + i);
    ids.push(EMBED_CF_RULE_ID, EMBED_CF_TOP_RULE_ID);
    return ids;
}

async function installEmbedHeaderRules() {
    
    let cap = '';

    try { cap = String((await embedSessionGet(EMBED_TOP_CAP_KEY)) || ''); } catch (e) { cap = ''; }
    const desired = embedDesiredRules(cap !== 'no');
    const ids = desired.map(r => r.id);
    const allIds = embedRuleIds();
    const current = await embedDnrGet();
    const mine = current.filter(r => ids.includes(r.id));
    
    const stale = current.filter(r => allIds.includes(r.id) && !ids.includes(r.id)).map(r => r.id);
    
    if (!stale.length && mine.length === desired.length && desired.every((r) => sameEmbedRule(mine.find(c => c.id === r.id), r))) {
        addLog(`[Embed] DNR rules unchanged: ${desired.length} (${ids.join(',')})`);
        return;
    }
    
    await embedDnrUpdate({ removeRuleIds: allIds, addRules: desired });

    const after = await embedDnrGet();
    const badTop = after.filter((r) => {
        const wantTop = (r.id >= EMBED_RULE_BASE + EMBED_DOMAINS.length && r.id < EMBED_RULE_BASE + EMBED_DOMAINS.length * 2)
            || r.id === EMBED_CF_TOP_RULE_ID;
        if (!wantTop) return false;
        const td = r.condition && r.condition.topDomains;
        return !(Array.isArray(td) && td.length === 1 && td[0] === EMBED_STEAM_DOMAIN);
    });
    if (badTop.length) {
        await embedDnrUpdate({ removeRuleIds: badTop.map(r => r.id) });
        await embedSessionSet(EMBED_TOP_CAP_KEY, 'no');   
        addLog(`[Embed] 本内核不认 topDomains，已撤掉 ${badTop.length} 条 top 档（退回 initiator 档：帧内导航仍可能被拦）`);
    } else if (cap !== 'no') {
        await embedSessionSet(EMBED_TOP_CAP_KEY, 'ok');
    }

    const final = (await embedDnrGet()).filter(r => r.id >= EMBED_RULE_BASE && r.id < EMBED_RULE_BASE + 10);
    addLog(`[Embed] DNR rules active: ${final.length} (${final.map(r => r.id).join(',')})`);
}

function setupEmbedHeaderRules() {
    embedCookieInjectClearAll();
    installEmbedHeaderRules();
}

chrome.runtime.onInstalled.addListener(setupEmbedHeaderRules);
chrome.runtime.onStartup.addListener(setupEmbedHeaderRules);

installEmbedHeaderRules();

function fixCfCookies(hosts) {
    const list = hosts;
    const seen = new Set();
    return new Promise((resolve) => {
        let fixed = 0;
        let pending = list.length;
        if (!pending) { resolve(0); return; }
        const finish = () => {
            if (--pending > 0) return;
            addLog(`[Embed] CF ${__S_background_embed_js(15)} fix on ${list.join('+')}: ${fixed} ${__S_background_embed_js(15)}(s) attempted`);
            resolve(fixed);
        };
        list.forEach((host) => chrome.cookies.getAll({ domain: host }, (cookies) => {
            const setPromises = [];
            (cookies || []).forEach(c => {
                if (c.name !== 'cf_clearance' && c.name !== '__cf_bm') return;
                const k = embedCookieKey(c);
                if (seen.has(k)) return;      
                seen.add(k);
                const cd = (c.domain || host).replace(/^\./, '');
                const opts =  ({
                    url: __S_background_embed_js(7) + cd + '/',
                    name: c.name,
                    value: c.value,
                    path: c.path || '/',
                    secure: true,
                    httpOnly: c.httpOnly || false,
                    sameSite: 'no_restriction',
                    expirationDate: c.expirationDate
                });
                if (c.domain && !c.hostOnly) opts.domain = c.domain.replace(/^\./, '');
                setPromises.push(new Promise((resSet) => {
                    chrome.cookies.set(opts, () => { void chrome.runtime.lastError; resSet(0); });
                }));
                fixed++;
            });
            Promise.all(setPromises).then(finish).catch(finish);
        }));
    });
}

const EMBED_TOP_SITE = __S_background_embed_js(8);

function embedCookieGetAll(q) {
    return new Promise(( res) => {
        try {
            chrome.cookies.getAll(q, ( c) => {
                const le = chrome.runtime.lastError;
                res({ list: le ? [] : (c || []), err: le ? String(le.message || le) : '' });
            });
        } catch (e) { res({ list: [], err: String((e && e.message) || e) }); }
    });
}

function embedRegistrableDomain(host) {
    const h = String(host || '').toLowerCase();
    return EMBED_DOMAINS.find((d) => h === d || h.endsWith('.' + d)) || '';
}

function embedCookieKey(c) {
    return String((c && c.name) || '') + '|' + String((c && c.domain) || '') + '|' + String((c && c.path) || '/');
}

function embedCookieSet(details) {
    return new Promise(( res) => {
        try {
            chrome.cookies.set(details, ( cookie) => {
                const le = chrome.runtime.lastError;
                res({ ok: !le, err: le ? String(le.message || le) : '', cookie });
            });
        } catch (e) { res({ ok: false, err: String((e && e.message) || e), cookie: null }); }
    });
}

function embedCookieBase(c, host) {
    const cd = String((c && c.domain) || host).replace(/^\./, '');
    const opts =  ({
        url: __S_background_embed_js(7) + cd + '/',
        name: String(c.name),
        value: String(c.value || ''),
        path: (c && c.path) || '/',
        secure: true,                       
        httpOnly: !!(c && c.httpOnly),      
        sameSite: 'no_restriction'          
    });
    if (c && c.domain && !c.hostOnly) opts.domain = cd;
    if (c && c.expirationDate) opts.expirationDate = c.expirationDate;   
    return opts;
}

function embedHostKeys(host) {
    const reg = embedRegistrableDomain(host);
    if (!reg) return [];
    return host === reg ? [reg] : [host, reg];
}

async function embedMirrorCookies(hosts) {
    const reads = await Promise.all(hosts.map((h) => Promise.all([
        embedCookieGetAll({ domain: h }),
        embedCookieGetAll({ domain: h, partitionKey: {} }),
    ])));
    const plain =  ([]), parted =  ([]), errs =  ([]);
    for (let i = 0; i < reads.length; i++) {
        const [p, q] = reads[i], h = hosts[i];
        plain.push(...p.list); parted.push(...q.list);
        if (p.err) errs.push(h + ': ' + p.err);
        if (q.err) errs.push(h + '(分区): ' + q.err);
    }
    
    const readErr = errs.filter(Boolean).join(' | ');

    const inTarget = new Map();
    for (const c of parted) {
        const pk = c && c.partitionKey;
        if (pk && pk.topLevelSite === EMBED_TOP_SITE && !pk.hasCrossSiteAncestor) inTarget.set(embedCookieKey(c), String((c && c.value) || ''));
    }
    
    const src = new Map();
    for (const c of [].concat(plain, parted)) {
        if (!c || !c.name || !c.value) continue;
        const k = embedCookieKey(c);
        if (!src.has(k)) src.set(k, c);
    }
    let mirrored = 0, skipped = 0, failed = 0, ignored = 0, firstErr = readErr;
    for (const [k, c] of src) {
        if (inTarget.has(k) && inTarget.get(k) === String(c.value || '')) { skipped++; continue; }
        const r = await embedCookieSet(Object.assign(embedCookieBase(c, hosts[0]), {
            partitionKey: { topLevelSite: EMBED_TOP_SITE }
        }));

        const gotPk = r[__S_background_embed_js(15)] && r[__S_background_embed_js(15)].partitionKey && r[__S_background_embed_js(15)].partitionKey.topLevelSite === EMBED_TOP_SITE;
        if (r.ok && gotPk) mirrored++;
        else if (r.ok) {
            ignored++;
            if (!firstErr) firstErr = __S_background_embed_js(9);
            addLog(`[Embed] 分区被内核忽略 ${c.domain || hosts[0]} ${c.name}：set 成功但回读无 partitionKey`);
        }
        else { failed++; if (!firstErr) firstErr = r.err; addLog(`[Embed] 分区 ${__S_background_embed_js(15)} 写入失败 ${c.domain || hosts[0]} ${c.name}: ${r.err}`); }
    }
    addLog(`[Embed] ${__S_background_embed_js(15)} 镜像 ${hosts.join('+')} → 顶站分区 ${EMBED_TOP_SITE}: 可见 ${(plain.length + parted.length)} / 候选 ${src.size} / 写入 ${mirrored} / 已在 ${skipped} / 失败 ${failed} / 分区被忽略 ${ignored}${firstErr ? ' / 末次错误 ' + firstErr : ''}`);
    return { total: src.size, mirrored, skipped, failed, ignored };
}

const EMBED_COOKIE_RULE_BASE = 53000;          
const EMBED_COOKIE_RULE_LIMIT = 53099;

const EMBED_COOKIE_INJECT_DOMAINS = Object.freeze([__S_background_embed_js(1), __S_background_embed_js(0)]);
const EMBED_COOKIE_RESOURCE_TYPES = Object.freeze(['sub_frame', 'xmlhttprequest', 'websocket', 'image', 'stylesheet', 'script', 'font', 'media', 'ping', 'other']);
const EMBED_COOKIE_HEADER_MAX = 6000;          

const EMBED_COOKIE_INJECT_SPEC = Object.freeze({
    [__S_background_embed_js(1)]: Object.freeze({ op: 'append', types: EMBED_COOKIE_RESOURCE_TYPES }),
    [__S_background_embed_js(0)]: Object.freeze({ op: 'set', types: Object.freeze(['sub_frame']) })
});

const EMBED_COOKIE_SCOPES = Object.freeze([
    { mode: 'top', field: 'topDomains', domains: () => [EMBED_STEAM_DOMAIN] },              
    { mode: 'initiator', field: 'initiatorDomains', domains: () => [EMBED_STEAM_DOMAIN] }    
]);

function embedCookieRuleId(domain) {
    const i = EMBED_COOKIE_INJECT_DOMAINS.indexOf(String(domain || '').toLowerCase());
    return i < 0 ? 0 : EMBED_COOKIE_RULE_BASE + i;
}

function embedCookieReqPath(u) {
    try { return new URL(String(u || '')).pathname || '/'; } catch (e) { return '/'; }
}

function embedCookieIsHttps(u) {
    try { return String(new URL(String(u || '')).protocol) === 'https:'; } catch (e) { return false; }
}

function embedCookiePathMatches(cookiePath, reqPath) {
    const p = String(cookiePath || '/'), r = String(reqPath || '/');
    if (p === r) return true;
    if (!r.startsWith(p)) return false;
    return p.endsWith('/') || r.charAt(p.length) === '/';
}

async function embedCookieHeaderValue(hosts, reqPath) {
    const reads = await Promise.all(hosts.map((h) => Promise.all([
        embedCookieGetAll({ domain: h }),
        embedCookieGetAll({ domain: h, partitionKey: {} }),
    ])));
    const plain =  ([]), parted =  ([]), errs =  ([]);
    for (let i = 0; i < reads.length; i++) {
        const [p, q] = reads[i], h = hosts[i];
        plain.push(...p.list); parted.push(...q.list);
        if (p.err) errs.push(h + ': ' + p.err);
        if (q.err) errs.push(h + '(分区): ' + q.err);
    }
    
    const pairs = new Map();
    
    const seenNames = [];
    for (const c of [].concat(plain, parted)) {
        if (!c || !c.name) continue;
        const nm = String(c.name);
        if (seenNames.indexOf(nm) < 0) seenNames.push(nm);
        if (!c.value) continue;
        if (!embedCookiePathMatches(c.path, reqPath)) continue;
        if (!pairs.has(String(c.name))) pairs.set(String(c.name), String(c.value));
    }
    let header = '', sent = 0, dropped = 0;
    
    const names = [];
    for (const [name, value] of pairs) {
        if (header.length + name.length + value.length + 3 > EMBED_COOKIE_HEADER_MAX) { dropped++; continue; }
        header += (header ? '; ' : '') + name + '=' + value;
        sent++; names.push(name);
    }
    return { header, seen: pairs.size, pairs: sent, dropped, names, seenNames, err: errs.filter(Boolean).join(' | ') };
}

const EMBED_COOKIE_SURVEY_HOSTS = Object.freeze([__S_background_embed_js(1), __S_background_embed_js(10), __S_background_embed_js(11)]);
const EMBED_COOKIE_SURVEY_MAX = 24;            

async function embedCookieJarSurvey(reg, known) {
    const hosts = Array.from(EMBED_COOKIE_SURVEY_HOSTS).filter((h) => embedRegistrableDomain(h) === reg);
    if (!hosts.length) return { extra: null, err: 'NO_SURVEY_HOSTS' };
    
    const have = new Set(Array.isArray(known) ? known : []);
    
    const extra = [];
    
    const errs = [];
    let truncated = false;
    for (const h of hosts) {
        const r = await embedCookieGetAll({ url: __S_background_embed_js(7) + h });
        if (r.err) { errs.push(h + ': ' + r.err); continue; }
        for (const c of r.list) {
            const nm = String((c && c.name) || '');
            if (!nm || have.has(nm) || extra.indexOf(nm) >= 0) continue;
            
            if (extra.length >= EMBED_COOKIE_SURVEY_MAX) { truncated = true; continue; }
            extra.push(nm);
        }
    }

    return {
        extra: errs.length ? null : extra,
        err: errs.concat(truncated ? ['TRUNCATED@' + EMBED_COOKIE_SURVEY_MAX] : []).join(' | ')
    };
}

function embedSessionGet(key) {
    return new Promise(( res) => {
        try {
            const st =  (chrome.storage);
            if (!st || !st.session || typeof st.session.get !== 'function') { res(null); return; }
            st.session.get([key], ( d) => {
                void chrome.runtime.lastError;
                res(d ? d[key] : null);
            });
        } catch (e) { res(null); }
    });
}

function embedSessionSet(key, value) {
    return new Promise(( res) => {
        try {
            const st =  (chrome.storage);
            if (!st || !st.session || typeof st.session.set !== 'function') { res(false); return; }
            
            const obj = {};
            obj[key] = value;
            st.session.set(obj, () => { res(!chrome.runtime.lastError); });
        } catch (e) { res(false); }
    });
}

const EMBED_LS_SITE = __S_background_embed_js(1);
const EMBED_LS_CACHE_KEY = 'spsEmbedLeetifyLS';     
const EMBED_LS_DONE_KEY = __S_background_embed_js(12);  
const EMBED_LS_TTL_MS = 120000;                     
const EMBED_LS_MAX_KEYS = 40;
const EMBED_LS_MAX_KEY_LEN = 128;
const EMBED_LS_MAX_VALUE = 8192;
const EMBED_LS_MAX_BYTES = 65536;
const EMBED_LS_MAX_DONORS = 3;                      
const EMBED_LS_DONOR_WAIT_MS = 700;                 

function embedLsDonorOk(sender) {
    let u =  (null);
    try { u = new URL(String((sender && sender.url) || '')); } catch (e) { return false; }
    if (!u || u.protocol !== 'https:') return false;
    if (Number(sender && sender.frameId) !== 0) return false;
    return embedRegistrableDomain(String(u.hostname || '').toLowerCase()) === EMBED_LS_SITE;
}

function embedLsFrameOk(sender) {
    let u =  (null);
    try { u = new URL(String((sender && sender.url) || '')); } catch (e) { return false; }
    if (!u || u.protocol !== 'https:') return false;
    const fid = sender && sender.frameId;
    if (typeof fid !== 'number' || fid === 0) return false;   
    if (embedRegistrableDomain(String(u.hostname || '').toLowerCase()) !== EMBED_LS_SITE) return false;
    let t =  (null);
    try { t = new URL(String((sender.tab && sender.tab.url) || '')); } catch (e) { return false; }
    if (!t || t.protocol !== 'https:') return false;
    const th = String(t.hostname || '').toLowerCase();
    return th === EMBED_STEAM_DOMAIN || th.endsWith('.' + EMBED_STEAM_DOMAIN);
}

function embedLsClean(items) {
    const arr = Array.isArray(items) ? items : [];
    
    const out = [];
    const seen = [];
    let bytes = 0, dropped = 0;
    for (const it of arr) {
        if (!it || typeof it !== 'object') { dropped++; continue; }
        const k =  (it).k, v =  (it).v;
        if (typeof k !== 'string' || typeof v !== 'string' || !k) { dropped++; continue; }
        if (seen.indexOf(k) >= 0) continue;                                  
        if (k.length > EMBED_LS_MAX_KEY_LEN) { dropped++; continue; }
        if (out.length >= EMBED_LS_MAX_KEYS) { dropped++; continue; }
        if (v.length > EMBED_LS_MAX_VALUE) { dropped++; continue; }
        if (bytes + k.length + v.length > EMBED_LS_MAX_BYTES) { dropped++; continue; }
        seen.push(k); bytes += k.length + v.length;
        out.push({ k, v });
    }
    return { items: out, dropped };
}

function embedLsCachePut(items, src) {
    return embedSessionSet(EMBED_LS_CACHE_KEY, { at: Date.now(), src, items })
        .then(( ok) => (ok ? items.length : 0));
}

function embedLsCacheGet() {
    return embedSessionGet(EMBED_LS_CACHE_KEY).then(( v) => {
        if (!v || typeof v !== 'object' || !Array.isArray(v.items)) return null;
        const at = Number(v.at);
        if (!Number.isFinite(at) || at <= 0) return null;
        const age = Date.now() - at;
        if (age < 0 || age > EMBED_LS_TTL_MS) return null;   
        return v;
    });
}

function embedLsRelease() {
    return Promise.all([
        embedSessionSet(EMBED_LS_CACHE_KEY, null),
        embedSessionSet(EMBED_LS_DONE_KEY, null),
    ]).then(() => { });
}

function embedLsDonorTabs() {
    return new Promise(( res) => {
        const t =  (typeof chrome === 'undefined' ? null : chrome.tabs);
        if (!t || typeof t.query !== 'function') { res([]); return; }
        try {
            const p = t.query({ url: [__S_background_embed_js(7) + EMBED_LS_SITE + '/*', __S_background_embed_js(13) + EMBED_LS_SITE + '/*'] },
                ( list) => {
                    void chrome.runtime.lastError;
                    res(pickDonor(list));
                });
            
            if (p && typeof p.then === 'function')
                p.then(( list) => res(pickDonor(list)), () => res([]));
        } catch (e) { res([]); }
        
        function pickDonor(list) {
            const ids = [];
            for (const tab of Array.isArray(list) ? list : []) {
                const id = tab && tab.id;
                if (typeof id !== 'number') continue;
                
                const host = (() => {
                    try { return String(new URL(String((tab && tab.url) || '')).hostname || '').toLowerCase(); } catch (e) { return ''; }
                })();
                if (embedRegistrableDomain(host) !== EMBED_LS_SITE) continue;
                ids.push(id);
                if (ids.length >= EMBED_LS_MAX_DONORS) break;
            }
            return ids;
        }
    });
}

function embedLsAskDonor(tabId) {
    return new Promise(( res) => {
        const t =  (typeof chrome === 'undefined' ? null : chrome.tabs);
        if (!t || typeof t.sendMessage !== 'function') { res(null); return; }
        let done = false;
        const finish = ( v) => { if (!done) { done = true; res(v); } };
        const timer = setTimeout(() => finish(null), EMBED_LS_DONOR_WAIT_MS);
        try {
            const p = t.sendMessage(tabId, { type: __S_background_embed_js(14) }, { frameId: 0 },
                ( resp) => {
                    clearTimeout(timer);
                    void chrome.runtime.lastError;
                    finish(resp);
                });
            if (p && typeof p.then === 'function')
                p.then(( r) => { clearTimeout(timer); finish(r); }, () => { clearTimeout(timer); finish(null); });
        } catch (e) { clearTimeout(timer); finish(null); }
    });
}

function embedLsPageSnapshot(maxKeys, maxKeyLen, maxValue, maxBytes) {
    var items = [], dropped = 0, bytes = 0, host = '';
    try { host = String((window.location && window.location.hostname) || '').toLowerCase(); } catch (e) { host = ''; }
    var store = null;
    try { store = window.localStorage; } catch (e) { return { ok: false, host: host, items: [], dropped: 0, error: 'STORAGE_BLOCKED' }; }
    try {
        if (!store || typeof store.length !== 'number' || typeof store.key !== 'function')
            return { ok: false, host: host, items: [], dropped: 0, error: 'STORAGE_BLOCKED' };
        for (var i = 0; i < store.length; i++) {
            var k = '';
            try { k = String(store.key(i) || ''); } catch (e) { dropped++; continue; }
            if (!k) continue;
            if (items.length >= maxKeys || k.length > maxKeyLen) { dropped++; continue; }
            var v = '';
            try { v = String(store.getItem(k) || ''); } catch (e) { dropped++; continue; }
            if (v.length > maxValue || bytes + k.length + v.length > maxBytes) { dropped++; continue; }
            bytes += k.length + v.length;
            items.push({ k: k, v: v });
        }
    } catch (e) { return { ok: false, host: host, items: [], dropped: 0, error: 'READ_FAILED' }; }
    return { ok: true, host: host, items: items, dropped: dropped, error: dropped ? 'DROPPED' : '' };
}

function embedLsScriptPick(res) {
    const first = Array.isArray(res) ? res[0] : null;
    const r = first && first.result;
    if (!r || typeof r !== 'object' || !Array.isArray(r.items)) return null;
    if (embedRegistrableDomain(String(r.host || '')) !== EMBED_LS_SITE) return null;
    return r;
}

function embedLsScriptRead(tabId) {
    return new Promise(( res) => {
        const sc =  (typeof chrome === 'undefined' ? null : chrome.scripting);
        if (!sc || typeof sc.executeScript !== 'function') { res(null); return; }
        let done = false;
        
        const finish = (v) => { if (!done) { done = true; clearTimeout(timer); res(v); } };
        
        const timer = setTimeout(() => finish(null), EMBED_LS_DONOR_WAIT_MS);
        try {
            const p = sc.executeScript({
                target: { tabId, frameIds: [0] },
                func: embedLsPageSnapshot,
                args: [EMBED_LS_MAX_KEYS, EMBED_LS_MAX_KEY_LEN, EMBED_LS_MAX_VALUE, EMBED_LS_MAX_BYTES]
            }, ( out) => {
                const le = chrome.runtime.lastError;
                finish(le ? null : embedLsScriptPick(out));
            });
            
            if (p && typeof p.then === 'function')
                p.then(( out) => finish(embedLsScriptPick(out)), () => finish(null));
        } catch (e) { finish(null); }
    });
}

async function embedLsTake(r, src, reason) {
    if (!r || !r.ok) return { ok: false, items: [], count: 0, src: '', error: (r && r.error) ? String(r.error) : 'DONOR_NO_REPLY' };
    const c = embedLsClean(r.items);

    const dropped = (Number(r.dropped) || 0) + c.dropped;
    if (!c.items.length) return { ok: false, items: [], count: 0, src: '', error: dropped ? 'DROPPED' : 'DONOR_EMPTY' };
    await embedLsCachePut(c.items, src);
    
    addLog(`[Embed] leetify 存储镜像 取到 ${c.items.length} 把键 供体=${src} 丢弃=${dropped} 原因=${reason}`);
    return { ok: true, items: c.items, count: c.items.length, src, error: dropped ? 'DROPPED' : '' };
}

async function embedLsPull(reason, force) {
    if (!force) {
        const hit = await embedLsCacheGet();
        if (hit) return { items: hit.items, count: hit.items.length, src: String(hit.src || 'cache'), error: '' };
    }
    const ids = await embedLsDonorTabs();
    if (!ids.length) return { items: [], count: 0, src: '', error: 'NO_DONOR_TAB' };
    let lastErr = '';

    const keepErr = ( next) => {
        if (next && lastErr !== next && (lastErr === '' || lastErr === 'DONOR_NO_REPLY')) lastErr = next;
        else if (!lastErr) lastErr = next || '';
    };

    let sawRead = false;
    for (const id of ids) {
        const raw = await embedLsScriptRead(id);
        if (raw && raw.ok) sawRead = true;
        const r = await embedLsTake(raw, 'tab' + id, reason);
        if (r.ok) return r;
        keepErr(r.error);
    }
    if (!sawRead) {
        for (const id of ids) {
            const r = await embedLsTake(await embedLsAskDonor(id), 'tab' + id, reason);
            if (r.ok) return r;
            keepErr(r.error);
        }
    }
    addLog(`[Embed] leetify 存储镜像 没取到 ${lastErr} 原因=${reason}`);
    return { items: [], count: 0, src: '', error: lastErr || 'DONOR_FAILED' };
}

function embedLsDonePut(request) {
    
    const cnt = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.min(EMBED_LS_MAX_KEYS, Math.round(n)) : 0; };
    const data = {
        at: Date.now(),
        applied: cnt(request && request.applied),
        skipped: cnt(request && request.skipped),
        failed: cnt(request && request.failed)
    };
    return embedSessionSet(EMBED_LS_DONE_KEY, data).then(() => data);
}

function embedLsDoneGet() {
    return embedSessionGet(EMBED_LS_DONE_KEY).then(( v) =>
        (v && typeof v === 'object' && !Array.isArray(v)) ? v : null);
}

function embedLsPrepare(reason) {
    return embedLsPull(reason, true).then(async ( p) => {
        const done = await embedLsDoneGet();
        const give = (p.error && !p.count) ? '-' : String(p.count || 0);
        const parts = ['供' + give];
        parts.push('写' + (done ? done.applied : '-'));
        if (done && Number.isFinite(Number(done.at)) && Number(done.at) > 0)
            parts.push(Math.max(0, Math.round((Date.now() - Number(done.at)) / 1000)) + '秒前');
        if (p.error) parts.push(p.error);
        return { text: parts.join(' '), count: p.count || 0 };
    }).catch(() => ({ text: '-', count: 0 }));
}

function embedCookieUpdate(dnr, opts) {
    return new Promise(( res) => {
        try {
            dnr.updateSessionRules(opts, () => {
                const le = chrome.runtime.lastError;
                res(le ? String(le.message || le) : '');
            });
        } catch (e) { res(String((e && e.message) || e)); }
    });
}

function embedCookieReadBack(id) {
    return new Promise(( res) => {
        try {
            chrome.declarativeNetRequest.getSessionRules(( rules) => {
                res((rules || []).find((r) => r && r.id === id) || null);
            });
        } catch (e) { res(null); }
    });
}

function embedCookieScopeOk(rule, domain, scope) {
    const c = rule && rule.condition;
    if (!c || !scope || !scope.field || typeof scope.domains !== 'function') return false;
    const sameList = ( a,  b) =>
        Array.isArray(a) && Array.isArray(b) && a.length === b.length && b.every((x) => a.indexOf(x) >= 0);
    if (!sameList(c.requestDomains, [domain])) return false;

    const spec = EMBED_COOKIE_INJECT_SPEC[String(domain || '').toLowerCase()];
    if (!sameList(c.resourceTypes, Array.from((spec && spec.types) || EMBED_COOKIE_RESOURCE_TYPES))) return false;
    
    const want = scope.domains(domain);
    if (want.indexOf(EMBED_STEAM_DOMAIN) < 0) return false;
    if (!sameList(c[scope.field], want)) return false;
    return true;
}

async function embedCookieInjectApply(domain, header) {
    const id = embedCookieRuleId(domain);
    if (!id) return { installed: false, id: 0, scopeMode: '', error: 'NOT_ALLOWLISTED' };
    if (!header) return { installed: false, id, scopeMode: '', error: 'NO_COOKIE' };
    const spec = EMBED_COOKIE_INJECT_SPEC[domain] || null;
    if (!spec) return { installed: false, id, scopeMode: '', error: 'NOT_ALLOWLISTED' };
    const dnr =  (chrome.declarativeNetRequest);
    if (!dnr || typeof dnr.updateSessionRules !== 'function' || typeof dnr.getSessionRules !== 'function')
        return { installed: false, id, scopeMode: '', error: 'NO_SESSION_API' };
    
    const mkRule = (sc) => {
        const condition =  ({ requestDomains: [domain], resourceTypes: Array.from(spec.types) });
        condition[sc.field] = sc.domains(domain);
        return  ({
            id, priority: 5,
            action: { type: 'modifyHeaders', requestHeaders: [{ header: __S_background_embed_js(15), operation: spec.op, value: header }] },
            condition
        });
    };
    let lastErr = '';
    for (const sc of Array.from(EMBED_COOKIE_SCOPES)) {
        const err = await embedCookieUpdate(dnr, { removeRuleIds: [id], addRules: [mkRule(sc)] });
        const live = await embedCookieReadBack(id);
        const value = live && live.action && live.action.requestHeaders && live.action.requestHeaders[0] && live.action.requestHeaders[0].value;
        
        if (!err && live && embedCookieScopeOk(live, domain, sc) && value === header)
            return { installed: true, id, scopeMode: sc.mode, error: '' };
        await embedCookieUpdate(dnr, { removeRuleIds: [id] });
        lastErr = err || (live ? __S_background_embed_js(16) : 'RULE_NOT_STORED');
    }
    return { installed: false, id, scopeMode: '', error: lastErr };
}

async function embedCookieInjectRelease(domain) {
    const id = embedCookieRuleId(domain);
    if (!id) return { released: true, id: 0, error: 'NOT_ALLOWLISTED' };
    const dnr =  (chrome.declarativeNetRequest);
    if (!dnr || typeof dnr.updateSessionRules !== 'function') return { released: false, id, error: 'NO_SESSION_API' };
    const err = await embedCookieUpdate(dnr, { removeRuleIds: [id] });
    return { released: !err, id, error: err };
}

function embedCookieRuleShape(rule) {
    const h = rule && rule.action && rule.action.requestHeaders && rule.action.requestHeaders[0];
    const v = String((h && h.value) || '');
    if (!v) return { names: [], pairs: 0, bytes: 0 };
    const names = v.split(/;\s*/).map((s) => s.split('=')[0]).filter(Boolean);
    return { names, pairs: names.length, bytes: v.length };
}

function embedCookieInjectStatus() {
    const dnr =  (chrome.declarativeNetRequest);
    const base = {
        success: true,
        allowList: Array.from(EMBED_COOKIE_INJECT_DOMAINS),
        steamDomain: EMBED_STEAM_DOMAIN,
        scopeModes: Array.from(EMBED_COOKIE_SCOPES).map((s) => s.mode),
        ruleIds: EMBED_COOKIE_INJECT_DOMAINS.map((d) => embedCookieRuleId(d)),
        api: !!(dnr && typeof dnr.updateSessionRules === 'function' && typeof dnr.getSessionRules === 'function'),
        rules:  ([])
    };
    if (!base.api) return Promise.resolve(Object.assign(base, { error: 'NO_SESSION_API' }));
    return new Promise(( res) => {
        try {
            dnr.getSessionRules(( rules) => {
                const mine = (rules || []).filter((r) => r && r.id >= EMBED_COOKIE_RULE_BASE && r.id <= EMBED_COOKIE_RULE_LIMIT);
                base.rules = mine.map((r) => {
                    const shape = embedCookieRuleShape(r);
                    const c = (r && r.condition) || {};
                    const scoped = Array.from(EMBED_COOKIE_SCOPES).find((s) => embedCookieScopeOk(r, (c.requestDomains || [])[0], s));
                    return {
                        id: r.id, priority: r.priority,
                        requestDomains: c.requestDomains || null,
                        topDomains: c.topDomains || null,
                        initiatorDomains: c.initiatorDomains || null,
                        resourceTypes: c.resourceTypes || null,
                        
                        scopeMode: scoped ? scoped.mode : 'unscoped',
                        operation: ((EMBED_COOKIE_INJECT_SPEC[(c.requestDomains || [])[0]] || {}).op) || 'append',
                        cookieNames: shape.names, cookiePairs: shape.pairs, cookieBytes: shape.bytes
                    };
                });
                res(base);
            });
        } catch (e) { res(Object.assign(base, { success: false, error: String((e && e.message) || e) })); }
    });
}

function embedCfCookieBrief(c) {
    if (!c) return null;
    const exp = Number(c.expirationDate) || 0;
    return {
        name: String(c.name || ''),
        sameSite: String(c.sameSite || 'unspecified'),
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        expiresInMin: exp ? Math.round((exp * 1000 - Date.now()) / 60000) : null
    };
}

function embedCfNameList(list) {
    const names = (list || []).map((c) => String((c && c.name) || '')).filter(Boolean);
    return { count: names.length, names: names.slice(0, 24), truncated: names.length > 24 };
}

async function embedCfDiagnose(host, url) {
    const h = String(host || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    const reg = embedRegistrableDomain(h);
    if (!reg) return { success: false, error: 'NOT_EMBED_DOMAIN', host: h, allowList: Array.from(EMBED_DOMAINS) };
    const names = ['cf_clearance', '__cf_bm'];
    const probeUrl = /^https:\/\//i.test(String(url || '')) ? String(url) : __S_background_embed_js(7) + reg + '/';
    const plain = await embedCookieGetAll({ domain: reg });
    const parted = await embedCookieGetAll({ domain: reg, partitionKey: { topLevelSite: EMBED_TOP_SITE } });
    
    const sendPlain = await embedCookieGetAll({ url: probeUrl });
    const sendParted = await embedCookieGetAll({ url: probeUrl, partitionKey: { topLevelSite: EMBED_TOP_SITE } });
    const cookies = {};
    for (const n of names) {
        const b = (plain.list || []).find((c) => c && c.name === n) || null;
        const p = (parted.list || []).find((c) => c && c.name === n) || null;
        
        cookies[n] = {
            browser: embedCfCookieBrief(b),
            partition: embedCfCookieBrief(p),
            same: !!(b && p && String(b.value) === String(p.value))
        };
    }
    const sentInPartition = (sendParted.list || []).some((c) => c && c.name === 'cf_clearance');
    const cc = cookies.cf_clearance;
    const hasBrowser = !!cc.browser;
    const hasPart = !!cc.partition;
    const expired = (b) => !!(b && b.expiresInMin !== null && b.expiresInMin <= 0);
    
    let verdict = 'OK';

    if (!hasBrowser && !hasPart) verdict = 'NO_CLEARANCE';
    else if (expired(cc.browser) || expired(cc.partition)) verdict = 'CLEARANCE_EXPIRED';
    else if (!hasPart) verdict = 'PARTITION_MISSING';
    else if (hasBrowser && !cc.same) verdict = 'PARTITION_STALE';
    else if (!sentInPartition) verdict = 'PARTITION_NOT_SENT';
    else if (!hasBrowser) verdict = 'PARTITION_ONLY';
    const HINTS = {
        NO_CLEARANCE: '这台浏览器没在该域过过验证：去标签页打开一次并完成验证，回来点 ↻。帧内过不了。',
        CLEARANCE_EXPIRED: 'clearance 已过期：去标签页过一次验证，回来点 ↻。',
        PARTITION_MISSING: __S_background_embed_js(17),
        PARTITION_STALE: '能修：未分区那份是新值、分区里是旧值，点 ↻ 会重写。',
        PARTITION_NOT_SENT: '镜像写进去了但浏览器不会把它发给这一帧：镜像这条路的终点，只剩注头一层（要先把该域加进注头表）。',
        PARTITION_ONLY: '未分区那份已经不在（CF 自己也不认它了），但分区里那份发得出去 —— 这一层是通的；帧里还被拦就是 CF 判定必须人机验证，去标签页看。',
        OK: '两侧都有且同值、也发得出去：帧里仍被拦就是 CF 判定「这次请求必须人机验证」，帧内无解 —— 点 ↗ 到标签页看。'
    };

    let dyn = [];
    try {
        dyn = await new Promise((res) => {
            try { chrome.declarativeNetRequest.getDynamicRules((r) => res(r || [])); } catch (e) { res([]); }
        });
    } catch (e) { dyn = []; }
    const hdrRule = dyn.find((r) => r && r.condition && (r.condition.requestDomains || []).indexOf(reg) >= 0) || null;
    const out = {
        success: true,
        host: reg,
        
        readError: [plain.err, parted.err, sendPlain.err, sendParted.err].filter(Boolean).join(' | '),
        verdict,
        hint: HINTS[verdict],
        cookies,
        
        wouldSend: {
            url: probeUrl,
            browser: embedCfNameList(sendPlain.list),
            partition: embedCfNameList(sendParted.list),
            cfClearanceInPartition: sentInPartition
        },
        
        headerRule: hdrRule ? {
            id: hdrRule.id,
            requestDomains: (hdrRule.condition && hdrRule.condition.requestDomains) || null,
            initiatorDomains: (hdrRule.condition && hdrRule.condition.initiatorDomains) || null,
            resourceTypes: (hdrRule.condition && hdrRule.condition.resourceTypes) || null
        } : null,
        
        injectAllowed: EMBED_COOKIE_INJECT_DOMAINS.indexOf(reg) >= 0
    };
    addLog(`[Embed] CF 诊断 ${reg}: ${verdict} 未分区=${cc.browser ? '有' : '无'} 分区=${cc.partition ? '有' : '无'} 同值=${hasBrowser && hasPart ? (cc.same ? '是' : '否') : '不可比'} 分区剩余=${cc.partition && cc.partition.expiresInMin !== null ? cc.partition.expiresInMin + '分' : '-'} 发得出=${sentInPartition ? '是' : '否'} 剥头规则=${hdrRule ? '有' : '无'}`);
    return out;
}

function embedCookieInjectClearAll() {
    const dnr =  (chrome.declarativeNetRequest);
    if (!dnr || typeof dnr.updateSessionRules !== 'function') return;
    const ids = EMBED_COOKIE_INJECT_DOMAINS.map((d) => embedCookieRuleId(d)).filter((n) => n > 0);
    if (ids.length) embedCookieUpdate(dnr, { removeRuleIds: ids });
}

async function embedCheckPageBuild(tabId) {
    if (!tabId) return;
    
    const api = chrome.scripting;
    if (!api || typeof api.executeScript !== 'function') return;
    try {
        const r = await api.executeScript({
            target: { tabId },
            world: 'ISOLATED',
            func: () => { try { return  (globalThis).__SPS_CONTENT_BUILD || ''; } catch (e) { return ''; } }
        });
        const v = String((r && r[0] && r[0].result) || '');
        if (!v) addLog('[Embed] ⚠ 资料页里没有新版内容脚本（桥/点击接管都不在）—— 请按 F5 刷新本页');
        else if (v !== SPS_BUILD) addLog(`[Embed] ⚠ 资料页脚本 ${v} ≠ 后台 ${SPS_BUILD} —— 请按 F5 刷新本页`);
        else addLog(`[Embed] 资料页脚本 ${v}（与后台一致）`);
    } catch (e) { addLog(`[Embed] 读页面脚本版本失败：${String((e && e.message) || e)}`); }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'EMBED_FIX_COOKIE') {

        void embedCheckPageBuild(sender && sender.tab && sender.tab.id);
        const host = String(request.domain || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
        const frameUrl = String(request.url || '');

        const hosts = embedHostKeys(host);
        const reg = embedRegistrableDomain(host);
        if (hosts.length) {
            fixCfCookies(hosts).then(() => embedMirrorCookies(hosts)).then(async () => {
                const inject = await embedCookieInjectFor(reg, frameUrl, hosts);
                sendResponse({ success: true, inject });
            }).catch(() => sendResponse({ success: true }));
            return true;
        }
        sendResponse({ success: true });
        return true;
    }
    
    if (request.type === __S_background_embed_js(18)) {
        embedLsRelease();   
        embedCookieInjectRelease(embedRegistrableDomain(String(request.domain || '').toLowerCase()))
            .then((r) => sendResponse({ success: true, released: r.released, id: r.id, error: r.error }))
            .catch(() => sendResponse({ success: false }));
        return true;
    }
    if (request.type === 'EMBED_COOKIE_STATUS') {
        embedCookieInjectStatus().then((st) => sendResponse(st)).catch(() => sendResponse({ success: false }));
        return true;
    }

    if (request.type === 'EMBED_BRIDGE_READY') {

        const reg = embedRegistrableDomain(String(request.host || ''));
        if (!reg) { sendResponse({ success: false, error: 'BAD_HOST' }); return true; }
        addLog(`[Embed] 桥已就绪：${reg}（帧内交互可用：宽度自适应 / 返回 / 比赛链接接管）`);
        sendResponse({ success: true });
        return true;
    }

    if (request.type === 'EMBED_OPEN_TAB') {
        const u = String(request.url || '');
        const reg = embedRegistrableDomain(embedHostOfUrl(u));
        if (!/^https:\/\//i.test(u) || !reg) { sendResponse({ success: false, error: 'BAD_URL' }); return true; }
        let short = '';
        try { short = new URL(u).pathname.slice(0, 60); } catch (e) { short = ''; }
        const openNow = () => {
            try {
                chrome.tabs.create({ url: u, active: true }, () => { void chrome.runtime.lastError; });
                addLog(`[Embed] ${request.auto ? '被拦后自动' : '帧内点击'}在标签页打开 ${reg}：${short}`);
            } catch (e) { addLog(`[Embed] 开标签页失败：${String((e && e.message) || e)}`); }
            sendResponse({ success: true });
        };
        if (!request.auto) { openNow(); return true; }

        try {
            chrome.storage.sync.get({ sps_frame_auto_tab: true }, (s) => {
                if (s && s.sps_frame_auto_tab === false) { sendResponse({ success: false, error: 'DISABLED' }); return; }
                embedAutoOpenOnce(u).then((ok) => {
                    if (ok) openNow();
                    else sendResponse({ success: false, error: 'THROTTLED' });
                });
            });
        } catch (e) { openNow(); }
        return true;
    }

    if (request.type === 'EMBED_OPEN_WINDOW') {
        const u = String(request.url || '');
        const reg = embedRegistrableDomain(embedHostOfUrl(u));
        if (!/^https:\/\//i.test(u) || !reg) { sendResponse({ success: false, error: 'BAD_URL' }); return true; }
        
        const num = ( v,  min,  max,  dflt) => {
            const n = Math.round(Number(v));
            return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
        };

        const wantFocus = request.focus !== false;
        const winW = num(request.width, 360, 1600, 780);
        const winH = num(request.height, 320, 1200, 660);
        const winL = num(request.left, -20000, 20000, 80);
        const winT = num(request.top, -20000, 20000, 80);
        
        const fallbackTab = ( why) => {
            try {
                chrome.tabs.create({ url: u, active: true }, () => { void chrome.runtime.lastError; });
                addLog(`[Embed] 独立小窗开不成（${why}），已退回标签页：${reg}`);
            } catch (e) { addLog(`[Embed] 开标签页也失败：${String((e && e.message) || e)}`); }
            sendResponse({ success: true, windowId: 0, fallback: 'tab' });
        };
        const winApi =  (chrome.windows);
        if (!winApi || typeof winApi.create !== 'function') { fallbackTab('NO_WINDOWS_API'); return true; }
        
        const createWindow = ( opts) => new Promise(( res) => {
            try {
                winApi.create(opts, ( win) => {
                    const le = chrome.runtime.lastError;
                    res({ win, err: le ? String(le.message || le) : '' });
                });
            } catch (e) { res({ win: null, err: String((e && e.message) || e) }); }
        });
        (async () => {
            
            const map = await embedSurfaceMap();
            const prev = map[u] ? embedSurfaceEntry(map[u]) : null;
            const prevId = (prev && prev.kind === 'window') ? prev.surfaceId : 0;
            if (prevId) {
                const alive = await new Promise(( res) => {
                    try {
                        winApi.get(prevId, ( win) => {
                            res(!chrome.runtime.lastError && !!win);
                        });
                    } catch (e) { res(false); }
                });
                if (alive) {

                    if (wantFocus) {
                        try { winApi.update(prevId, { state: 'normal', focused: true }); } catch (e) {  }
                    } else {
                        void embedNotifySurface('window', prevId, 'hidden');
                    }
                    sendResponse({ success: true, windowId: prevId, focused: wantFocus });
                    return;
                }
            }

            const withBounds = await createWindow({ url: u, type: 'popup', width: winW, height: winH, left: winL, top: winT, focused: wantFocus });
            let win = withBounds.win;
            let err = withBounds.err;
            if (!win || !win.id) {
                addLog(`[Embed] 带位置的独立小窗被拒（${err || 'NO_WINDOW'}），改为由内核摆放`);
                const noBounds = await createWindow({ url: u, type: 'popup', width: winW, height: winH, focused: wantFocus });
                win = noBounds.win; err = noBounds.err;
            }
            if (!win || !win.id) { fallbackTab(err || 'NO_WINDOW'); return; }
            
            await embedSurfacePut(u, {
                kind: 'window',
                surfaceId: win.id,
                winId: win.id,
                originTabId: Number(sender && sender.tab && sender.tab.id) || 0,   
                name: String(request.name || reg)
            });
            let short = '';
            try { short = new URL(u).pathname.slice(0, 60); } catch (e) { short = ''; }
            addLog(`[Embed] 顶层小窗打开 ${reg} ${winW}×${winH}${wantFocus ? '' : '（不抢焦点）'}：${short}`);

            if (!wantFocus) void embedNotifySurface('window', win.id, 'hidden');
            sendResponse({ success: true, windowId: win.id, focused: wantFocus });
        })();
        return true;
    }

    if (request.type === 'EMBED_OPEN_BG_TAB') {
        const u = String(request.url || '');
        const reg = embedRegistrableDomain(embedHostOfUrl(u));
        if (!/^https:\/\//i.test(u) || !reg) { sendResponse({ success: false, error: 'BAD_URL' }); return true; }
        const tabsApi =  (chrome.tabs);
        if (!tabsApi || typeof tabsApi.create !== 'function') { sendResponse({ success: false, error: 'NO_TABS_API' }); return true; }
        (async () => {
            
            const map = await embedSurfaceMap();
            const prev = map[u] ? embedSurfaceEntry(map[u]) : null;
            if (prev && prev.kind === 'tab' && prev.surfaceId) {
                const alive = await new Promise(( res) => {
                    try { tabsApi.get(prev.surfaceId, ( t) => res(!chrome.runtime.lastError && !!t)); } catch (e) { res(false); }
                });
                if (alive) {
                    void embedNotifySurface('tab', prev.surfaceId, 'hidden');
                    sendResponse({ success: true, tabId: prev.surfaceId, existing: true });
                    return;
                }
            }
            try {
                tabsApi.create({ url: u, active: false }, async ( tab) => {
                    const le = chrome.runtime.lastError;
                    if (le || !tab || !tab.id) {
                        addLog(`[Embed] 后台标签页开不成（${le ? le.message : 'NO_TAB'}）：${reg}`);
                        sendResponse({ success: false, error: 'TAB_FAILED' });
                        return;
                    }
                    await embedSurfacePut(u, {
                        kind: 'tab',
                        surfaceId: tab.id,
                        winId: Number(tab.windowId) || 0,
                        originTabId: Number(sender && sender.tab && sender.tab.id) || 0,
                        name: String(request.name || reg)
                    });
                    let short = '';
                    try { short = new URL(u).pathname.slice(0, 60); } catch (e) { short = ''; }
                    addLog(`[Embed] 后台标签页打开 ${reg}（不打扰前台）：${short}`);
                    
                    void embedNotifySurface('tab', tab.id, 'hidden');
                    sendResponse({ success: true, tabId: tab.id });
                });
            } catch (e) { sendResponse({ success: false, error: 'TAB_FAILED' }); }
        })();
        return true;
    }

    if (request.type === 'EMBED_SURFACE_FOCUS') {
        const kind = request.kind === 'tab' ? 'tab' : 'window';
        const id = Number(request.surfaceId || request.windowId) || 0;
        if (!id) { sendResponse({ success: false, error: 'BAD_SURFACE' }); return true; }
        embedSurfaceMap().then((map) => {
            let known = false, winId = 0;
            for (const k of Object.keys(map)) {
                const e = embedSurfaceEntry(map[k]);
                if (e.kind === kind && e.surfaceId === id) { known = true; winId = e.winId; break; }
            }
            if (!known) { sendResponse({ success: false, error: 'UNKNOWN_SURFACE' }); return; }
            const done = ( err) => sendResponse({ success: !err, error: err });
            try {
                if (kind === 'tab') {
                    const tabsApi =  (chrome.tabs);
                    if (!tabsApi || typeof tabsApi.update !== 'function') { done('NO_TABS_API'); return; }
                    tabsApi.update(id, { active: true }, () => {
                        const le = chrome.runtime.lastError;
                        if (le) { done(String(le.message || le)); return; }
                        
                        const winApi =  (chrome.windows);
                        if (winId && winApi && typeof winApi.update === 'function') {
                            try { winApi.update(winId, { state: 'normal', focused: true }, () => { void chrome.runtime.lastError; }); } catch (e) {  }
                        }
                        done('');
                    });
                    return;
                }
                const winApi =  (chrome.windows);
                if (!winApi || typeof winApi.update !== 'function') { done('NO_WINDOWS_API'); return; }
                winApi.update(id, { state: 'normal', focused: true }, () => {
                    const le = chrome.runtime.lastError;
                    done(le ? String(le.message || le) : '');
                });
            } catch (e) { done('UPDATE_FAILED'); }
        }).catch(() => sendResponse({ success: false, error: 'NO_STATE' }));
        return true;
    }

    if (request.type === __S_background_embed_js(19)) {
        if (!embedLsFrameOk(sender)) { sendResponse({ ok: false, error: 'BAD_SENDER' }); return true; }
        embedLsPull('frame').then(( p) => {
            sendResponse({
                ok: !!p.count, count: p.count, items: p.items,
                error: p.count ? p.error : (p.error || 'NO_SNAPSHOT')
            });
        }).catch(() => sendResponse({ ok: false, error: 'PULL_FAILED' }));
        return true;
    }
    
    if (request.type === __S_background_embed_js(20)) {
        if (!embedLsFrameOk(sender)) { sendResponse({ ok: false, error: 'BAD_SENDER' }); return true; }
        embedLsDonePut(request).then(( d) => {
            addLog(`[Embed] leetify 存储镜像 落地 写入=${d.applied} 已有=${d.skipped} 失败=${d.failed}`);
            sendResponse({ ok: true });
        }).catch(() => sendResponse({ ok: false, error: 'DONE_FAILED' }));
        return true;
    }
});

async function embedCookieInjectFor(reg, frameUrl, hosts) {
    if (!EMBED_COOKIE_INJECT_DOMAINS.includes(reg)) return { installed: false, id: 0, error: reg ? 'NOT_ALLOWLISTED' : 'UNKNOWN_SITE' };
    if (!embedCookieIsHttps(frameUrl)) return { installed: false, id: embedCookieRuleId(reg), error: 'NOT_HTTPS' };

    const ls = reg === EMBED_LS_SITE ? embedLsPrepare('prewarm') : Promise.resolve({ text: '-', count: 0 });
    const snap = await embedCookieHeaderValue(hosts, embedCookieReqPath(frameUrl));

    const sv = await embedCookieJarSurvey(reg, snap.seenNames);
    if (sv.err) addLog(`[Embed] 查罐自证 ${reg}: ${sv.err} 已知名字=${snap.seenNames.length}`);
    else addLog(`[Embed] 查罐自证 ${reg}: domain 读到 ${snap.seenNames.length} 名 / url 查法多出 ${sv.extra.length} 名${sv.extra.length ? '（' + sv.extra.join(',') + '）' : ''}`);
    if (!snap.header) {
        return Object.assign({ installed: false, id: embedCookieRuleId(reg), error: snap.err ? 'JAR_READ_FAILED' : 'NO_COOKIE', pairs: 0, dropped: snap.dropped, names: [] }, sv, { sync: (await ls).text, syncCount: (await ls).count });
    }
    const r = await embedCookieInjectApply(reg, snap.header);
    addLog(`[Embed] ${__S_background_embed_js(15)} 注入 ${reg}: ${r.installed ? '已装' : '未装(' + r.error + ')'} id=${r.id} 限定=${r.scopeMode || '-'} 对数=${snap.pairs} 超长丢弃=${snap.dropped}`);
    return Object.assign({ pairs: snap.pairs, dropped: snap.dropped, names: snap.names || [] }, sv, r, { sync: (await ls).text, syncCount: (await ls).count });
}

const EMBED_WATCH_URLS = [
    ...EMBED_DOMAINS.map(d => `*://*.${d}/*`),
    __S_background_embed_js(21)
];

function embedBroadcastToTabs(msg) {
    try {
        if (chrome.tabs && typeof chrome.tabs.query === 'function') {
            chrome.tabs.query({ url: __S_background_embed_js(22) }, (tabs) => {
                void chrome.runtime.lastError;
                (tabs || []).forEach((t) => {
                    if (!t || !t.id) return;
                    try {
                        chrome.tabs.sendMessage(t.id, msg, () => { void chrome.runtime.lastError; });
                    } catch (e) {  }
                });
            });
        }
    } catch (e) {  }
    try { chrome.runtime.sendMessage(msg).catch(() => {}); } catch (e) {  }
}

chrome.webRequest.onBeforeRequest.addListener( ((details) => {
    if (!/cdn-cgi\/challenge-platform|challenges\.cloudflare\.com/i.test(details.url)) return;
    embedBroadcastToTabs({ type: 'CF_CHALLENGE', url: details.url });
}), { urls: EMBED_WATCH_URLS });

function embedHostOfUrl(u) {
    try { return new URL(String(u || '')).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

function embedFrameLimits(headers) {
    
    const get = (n) => {
        const h = (headers || []).find((x) => String(x && x.name || '').toLowerCase() === n);
        return h ? String(h.value || '') : '';
    };
    const xfo = get('x-frame-options');
    const csp = get(__S_background_embed_js(6));
    return { xfo, fa: (csp.match(/frame-ancestors[^;]*/i) || [''])[0] };
}

function embedReportFrameFail(url, reason) {
    embedBroadcastToTabs({ type: 'EMBED_FRAME_FAIL', url, reason });
}

chrome.webRequest.onCompleted.addListener((details) => {
    const reg = embedRegistrableDomain(embedHostOfUrl(details.url));

    if (!reg && details.type === 'sub_frame' && embedHostOfUrl(details.url) === EMBED_CF_CHALLENGE_HOST) {
        const mit = (details.responseHeaders || []).find((h) => /^cf-mitigated$/i.test(String(h.name || '')));
        const lim = embedFrameLimits(details.responseHeaders || []);
        let p2 = '';
        try { p2 = new URL(details.url).pathname.slice(0, 70); } catch (e) { p2 = ''; }
        addLog(`[Embed] CF 挑战页 ${details.statusCode}${mit ? ' cf-mitigated=' + mit.value : ''} xfo=${lim.xfo || '-'} fa=${lim.fa || '-'} ${p2}`);
    }
    if (reg && (details.type === 'sub_frame' || details.type === 'main_frame')) {
        const mit = (details.responseHeaders || []).find((h) => /^cf-mitigated$/i.test(String(h.name || '')));
        const lim = embedFrameLimits(details.responseHeaders || []);
        let path = '';
        try { path = new URL(details.url).pathname.slice(0, 80); } catch (e) { path = ''; }
        addLog(`[Embed] 帧请求 ${reg} ${details.type} ${details.statusCode}${mit ? ' cf-mitigated=' + mit.value : ''}${details.fromCache ? ' (cache)' : ''} xfo=${lim.xfo || '-'} fa=${lim.fa || '-'} ${path}`);

        if (details.type === 'sub_frame' && details.statusCode < 400 && (lim.xfo || lim.fa)) {
            embedReportFrameFail(details.url, lim.xfo
                ? `这一页带了 X-Frame-Options: ${lim.xfo}，插件没能剥掉（剥头规则没命中这次请求）`
                : `这一页带了 CSP ${lim.fa}，插件没能剥掉（剥头规则没命中这次请求）`);
        }
    }
    if (details.type !== 'main_frame' || details.statusCode !== 200) return;
    const cfPassedReg = embedRegistrableDomain(embedHostOfUrl(details.url));
    if (cfPassedReg) {
        const cfHosts = embedHostKeys(cfPassedReg);
        fixCfCookies(cfHosts).then(() => embedMirrorCookies(cfHosts)).then(async () => {
            await embedCookieInjectFor(cfPassedReg, details.url, cfHosts);
            embedBroadcastToTabs({ type: 'CF_PASSED', url: details.url });
        }).catch(() => {
            embedBroadcastToTabs({ type: 'CF_PASSED', url: details.url });
        });
        return;
    }
    embedBroadcastToTabs({ type: 'CF_PASSED', url: details.url });
}, { urls: EMBED_WATCH_URLS }, ['responseHeaders']);

const EMBED_AUTO_OPEN_KEY = 'spsEmbedAutoOpen';

const EMBED_WINDOW_KEY = 'spsEmbedWindow';
const EMBED_AUTO_OPEN_GAP = 60000;   

async function embedAutoOpenOnce(url) {
    const now = Date.now();
    
    let rec = null;
    try { rec = await embedSessionGet(EMBED_AUTO_OPEN_KEY); } catch (e) { rec = null; }
    if (rec && rec.url === url && now - (Number(rec.at) || 0) < EMBED_AUTO_OPEN_GAP) return false;
    try { await embedSessionSet(EMBED_AUTO_OPEN_KEY, { url, at: now }); } catch (e) {  }
    return true;
}

function embedSurfaceEntry(v) {
    if (v && typeof v === 'object') {
        return {
            kind: v.kind === 'tab' ? 'tab' : 'window',
            surfaceId: Number(v.surfaceId || v.id) || 0,
            winId: Number(v.winId) || 0,
            originTabId: Number(v.originTabId || v.tabId) || 0,
            name: String(v.name || '')
        };
    }
    return { kind: 'window', surfaceId: Number(v) || 0, winId: 0, originTabId: 0, name: '' };
}

async function embedSurfaceMap() {
    try {
        const m = await embedSessionGet(EMBED_WINDOW_KEY);
        return (m && typeof m === 'object') ? m : {};
    } catch (e) { return {}; }
}

async function embedSurfacePut(url, entry) {
    const map = await embedSurfaceMap();
    const next =  ({});
    for (const k of Object.keys(map).slice(-11)) next[k] = map[k];
    next[url] = entry;
    await embedSessionSet(EMBED_WINDOW_KEY, next).catch(() => { });
}

async function embedNotifySurface(kind, surfaceId, state) {
    if (!surfaceId) return;
    const map = await embedSurfaceMap();
    let url = '', originTabId = 0, name = '';
    for (const k of Object.keys(map)) {
        const e = embedSurfaceEntry(map[k]);
        if (e.kind === kind && e.surfaceId === surfaceId) { url = k; originTabId = e.originTabId; name = e.name; break; }
    }
    if (!url && state !== 'closed') return;
    if (state === 'closed' && url) {
        
        const next =  ({});
        for (const k of Object.keys(map)) if (k !== url) next[k] = map[k];
        embedSessionSet(EMBED_WINDOW_KEY, next).catch(() => { });
    }
    if (!originTabId) return;
    try {
        chrome.tabs.sendMessage(originTabId, { type: 'EMBED_SURFACE_STATE', kind, surfaceId, state, url, name }, () => {
            void chrome.runtime.lastError;   
        });
    } catch (e) {  }
}

async function embedNotifySurfaceFocus(kind, activeId) {
    const map = await embedSurfaceMap();
    for (const k of Object.keys(map)) {
        const e = embedSurfaceEntry(map[k]);
        if (e.kind !== kind || !e.surfaceId) continue;
        void embedNotifySurface(kind, e.surfaceId, e.surfaceId === activeId ? 'visible' : 'hidden');
    }
}
try {
    const winApi =  (chrome.windows);
    if (winApi && winApi.onBoundsChanged && typeof winApi.onBoundsChanged.addListener === 'function') {
        winApi.onBoundsChanged.addListener(( win) => {
            if (!win || !win.id) return;
            
            void embedNotifySurface('window', win.id, (win.state === 'minimized' || !win.focused) ? 'hidden' : 'visible');
        });
    }
    if (winApi && winApi.onFocusChanged && typeof winApi.onFocusChanged.addListener === 'function') {
        winApi.onFocusChanged.addListener(( windowId) => { void embedNotifySurfaceFocus('window', windowId); });
    }
    if (winApi && winApi.onRemoved && typeof winApi.onRemoved.addListener === 'function') {
        winApi.onRemoved.addListener(( windowId) => { void embedNotifySurface('window', windowId, 'closed'); });
    }
} catch (e) {  }

try {
    if (chrome.tabs.onActivated && typeof chrome.tabs.onActivated.addListener === 'function') {
        chrome.tabs.onActivated.addListener(( info) => {
            if (!info || !info.tabId) return;
            void embedNotifySurfaceFocus('tab', info.tabId);
        });
    }
    if (chrome.tabs.onRemoved && typeof chrome.tabs.onRemoved.addListener === 'function') {
        chrome.tabs.onRemoved.addListener(( tabId) => { void embedNotifySurface('tab', tabId, 'closed'); });
    }
} catch (e) {  }
chrome.webRequest.onErrorOccurred.addListener((details) => {
    const reg = embedRegistrableDomain(embedHostOfUrl(details.url));
    
    if (!reg && details.type === 'sub_frame' && embedHostOfUrl(details.url) === EMBED_CF_CHALLENGE_HOST) {
        addLog(`[Embed] CF 挑战页导航失败 ${details.error}`);
        return;
    }
    if (!reg) return;
    if (details.type !== 'sub_frame' && details.type !== 'main_frame') return;
    let path = '';
    try { path = new URL(details.url).pathname.slice(0, 80); } catch (e) { path = ''; }
    addLog(`[Embed] 帧请求失败 ${reg} ${details.type} ${details.error} ${path}`);

    if (details.type !== 'sub_frame') return;
    if (details.error !== 'net::ERR_BLOCKED_BY_RESPONSE' && details.error !== 'net::ERR_BLOCKED_BY_CSP') return;
    embedReportFrameFail(details.url, `这一页不允许被内嵌（${details.error}），已在新标签页打开`);
    embedAutoOpenOnce(details.url).then((ok) => {
        if (!ok) return;
        addLog(`[Embed] 这一页不允许内嵌，已改为在标签页打开：${path}`);
        try {
            chrome.tabs.create({ url: details.url, active: true }, () => { void chrome.runtime.lastError; });
        } catch (e) {  }
    });
}, { urls: EMBED_WATCH_URLS });

chrome.webRequest.onBeforeSendHeaders.addListener( ((details) => {
    if (details.type !== 'sub_frame' && details.type !== 'main_frame') return;
    const reg = embedRegistrableDomain(embedHostOfUrl(details.url));
    if (!reg) return;
    const ck = (details.requestHeaders || []).find((h) => /^cookie$/i.test(String(h.name || '')));
    const names = ck ? String(ck.value || '').split(/;\s*/).map((s) => s.split('=')[0]).filter(Boolean) : [];
    const has = ( n) => names.indexOf(n) >= 0;

    const dup = names.filter((n, i) => names.indexOf(n) !== i);
    let path = '';
    try { path = new URL(details.url).pathname.slice(0, 60); } catch (e) { path = ''; }
    addLog(`[Embed] 帧请求带 ${__S_background_embed_js(15)} ${reg} ${details.type} 共${names.length}个${dup.length ? ' 同名重复=' + dup.join(',') : ''} cf_clearance=${has('cf_clearance') ? '有' : '无'} __cf_bm=${has('__cf_bm') ? '有' : '无'} ${path}`);
}), { urls: EMBED_WATCH_URLS }, ['requestHeaders', 'extraHeaders']);

addLog(`[Embed] 帧请求观测已就绪：${EMBED_DOMAINS.length} 域（文档级：完成 + 失败 + 请求头都记）`);

try {
    if (chrome.cookies && chrome.cookies.onChanged && typeof chrome.cookies.onChanged.addListener === 'function') {
        chrome.cookies.onChanged.addListener((changeInfo) => {
            const c = changeInfo && changeInfo[__S_background_embed_js(15)];
            if (!c || (c.name !== 'cf_clearance' && c.name !== '__cf_bm')) return;
            if (changeInfo.removed) return;
            const cd = String(c.domain || '').replace(/^\./, '').toLowerCase();
            const reg = embedRegistrableDomain(cd);
            if (!reg) return;
            const liveUrl = __S_background_embed_js(7) + reg + '/';
            if (c.sameSite !== 'no_restriction') {
                const hosts = embedHostKeys(reg);
                fixCfCookies(hosts).then(() => embedMirrorCookies(hosts)).then(async () => {
                    await embedCookieInjectFor(reg, liveUrl, hosts);
                    embedBroadcastToTabs({ type: 'CF_PASSED', url: liveUrl });
                }).catch(() => {});
            } else {
                embedBroadcastToTabs({ type: 'CF_PASSED', url: liveUrl });
            }
        });
    }
} catch (e) {  }

try {  (globalThis).embedCookieInjectStatus = embedCookieInjectStatus; } catch (e) {  }

try {  (globalThis).embedCfDiagnose = embedCfDiagnose; } catch (e) {  }
try {  (globalThis).embedBroadcastToTabs = embedBroadcastToTabs; } catch (e) {  }

function embedCfProbeTab(url, timeoutMs) {
    const u = String(url || '');
    const reg = embedRegistrableDomain(embedHostOfUrl(u));
    if (!/^https:\/\//i.test(u) || !reg) return Promise.resolve({ success: false, error: 'BAD_URL', url: u });
    const limit = Math.max(2000, Number(timeoutMs) || 12000);
    return new Promise((res) => {
        let tabId = 0;
        let settled = false;
        
        let timer = null;
        const cleanup = () => {
            try { chrome.webRequest.onCompleted.removeListener(onDone); } catch (e) {  }
            try { chrome.webRequest.onErrorOccurred.removeListener(onErr); } catch (e) {  }
            if (tabId) { try { chrome.tabs.remove(tabId, () => { void chrome.runtime.lastError; }); } catch (e) {  } }
        };
        
        const finish = (r) => {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            cleanup();
            addLog(`[Embed] 探测 ${reg} ${r.verdict || r.error}${r.status ? ' ' + r.status : ''}${r.mitigated ? ' cf-mitigated=' + r.mitigated : ''}`);
            res(r);
        };

        const mine = (d) => d && d.type === 'main_frame' && embedRegistrableDomain(embedHostOfUrl(d.url)) === reg;
        
        const onDone = (d) => {
            if (!mine(d)) return;
            const mit = (d.responseHeaders || []).find((h) => /^cf-mitigated$/i.test(String(h.name || '')));
            const status = Number(d.statusCode) || 0;
            finish({
                success: true,
                verdict: mit ? 'CF_CHALLENGE' : (status >= 400 ? 'HTTP_' + status : 'OK'),
                status,
                mitigated: mit ? String(mit.value || '') : '',
                url: d.url,
                fromCache: !!d.fromCache,
                hint: mit
                    ? '标签页里也被 CF 拦：与内嵌无关，是这台机器/这条出口 IP 被判定要人机验证。'
                    : (status >= 400 ? '标签页里也是 HTTP ' + status + '：站点侧拒绝，与内嵌无关。'
                        : '标签页里能正常打开：那一页只是不允许被内嵌，问题在 frame 这一层。')
            });
        };
        
        const onErr = (d) => {
            if (!mine(d)) return;
            finish({ success: true, verdict: 'NAV_ERROR', status: 0, error: String(d.error || ''), url: d.url, hint: '导航在标签页里就失败了，网络层问题（出口/连接）。' });
        };
        timer = setTimeout(() => finish({ success: false, error: 'TIMEOUT', hint: '12s 内没等到主文档结果：可能是 CF 挑战页一直转，或标签页被拦截。' }), limit);
        try {
            chrome.webRequest.onCompleted.addListener(onDone, { urls: EMBED_WATCH_URLS }, ['responseHeaders']);
            chrome.webRequest.onErrorOccurred.addListener(onErr, { urls: EMBED_WATCH_URLS });
            chrome.tabs.create({ url: u, active: false }, (tab) => {
                if (chrome.runtime.lastError || !tab || !tab.id) { finish({ success: false, error: 'TAB_FAILED' }); return; }
                tabId = tab.id;
            });
        } catch (e) { finish({ success: false, error: String((e && e.message) || e) }); }
    });
}
try {  (globalThis).embedCfProbeTab = embedCfProbeTab; } catch (e) {  }

