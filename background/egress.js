var __S_background_egress_js=(function(){var T="COaG26T/tImAFs3vrL3EhWp3c0tDMSM7RhDg8/vJy7ULHeT20dfRuPSLlzUVitJveAtAKSo0BgD0/P6F2Ke7tIaSDuSE1aL9roOQanBqXkog",P=[32,0,66,9,44],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);


const EGRESS_RULE_BASE = 51000;

const EGRESS_RESOURCE_TYPES = ['xmlhttprequest', 'websocket', 'other'];

const EGRESS_CLEAN_HEADERS = ['origin', 'referer'];

const EGRESS_SIGNED_HEADERS = ['accept', 'accept-language', 'authorization', 'content-type',
    __S_background_egress_js(0), __S_background_egress_js(1), __S_background_egress_js(2), __S_background_egress_js(3), __S_background_egress_js(4)];

const EGRESS_ORIGIN_POLICY = [
    { domain: 'appengine.wmpvp.com', origin: 'https://pvp.wanmei.com', referer: 'https://pvp.wanmei.com/' },
    { domain: 'api.wmpvp.com', origin: 'https://pvp.wanmei.com', referer: 'https://pvp.wanmei.com/' },
    { domain: '5eplay.com', referer: 'https://view-arena.5eplay.com/' }
];

const EGRESS_SEC_FETCH = {
    enabled: true,
    headers: [['sec-fetch-site', 'cross-site'], ['sec-fetch-mode', 'cors'], ['sec-fetch-dest', 'empty']]
};

const EGRESS_EXCLUDED_DOMAINS = ['challenges.cloudflare.com'];

const EGRESS_NO_PERMISSION_HOSTS = ['buff.163.com', 'youpin898.com', 'igxe.cn', 'c5game.com',
    'gcore.jsdelivr.net', 'api.ipify.org'];

function egressExtensionId() {
    try { return String((chrome.runtime && chrome.runtime.id) || ''); } catch (e) { return ''; }
}

function egressGroupRules(extId) {
    
    const clean = [{
        id: EGRESS_RULE_BASE,
        priority: 30,
        action: {
            type: 'modifyHeaders',
            requestHeaders: EGRESS_CLEAN_HEADERS.map((h) => ({ header: h, operation: 'remove' }))
        },
        condition: {
            initiatorDomains: [extId],
            excludedRequestDomains: EGRESS_EXCLUDED_DOMAINS.concat(EGRESS_ORIGIN_POLICY.map((p) => p.domain)),
            resourceTypes: EGRESS_RESOURCE_TYPES
        }
    }];
    
    const platform = EGRESS_ORIGIN_POLICY.map((p, i) => {
        
        const requestHeaders = [];
        if (p.origin) requestHeaders.push({ header: 'origin', operation: 'set', value: p.origin });
        if (p.referer) requestHeaders.push({ header: 'referer', operation: 'set', value: p.referer });
        return {
            id: EGRESS_RULE_BASE + 10 + i,
            priority: 40,
            action: { type: 'modifyHeaders', requestHeaders: requestHeaders },
            condition: {
                requestDomains: [p.domain],
                initiatorDomains: [extId],
                resourceTypes: EGRESS_RESOURCE_TYPES
            }
        };
    });
    
    const secFetch = EGRESS_SEC_FETCH.enabled ? [{
        id: EGRESS_RULE_BASE + 20,
        priority: 20,
        action: {
            type: 'modifyHeaders',
            
            requestHeaders: EGRESS_SEC_FETCH.headers.map((kv) => ({ header: kv[0], operation: 'set', value: kv[1] }))
        },
        condition: {
            initiatorDomains: [extId],
            excludedRequestDomains: EGRESS_EXCLUDED_DOMAINS,
            resourceTypes: EGRESS_RESOURCE_TYPES
        }
    }] : [];
    return { clean: clean, platform: platform, secFetch: secFetch };
}

function sameEgressRule(a, b) {
    if (!a || !b) return false;
    const pick = (r) => JSON.stringify({
        id: r.id, priority: r.priority,
        action: r.action && { type: r.action.type, requestHeaders: r.action.requestHeaders || null },
        condition: r.condition && {
            initiatorDomains: r.condition.initiatorDomains || null,
            excludedRequestDomains: r.condition.excludedRequestDomains || null,
            requestDomains: r.condition.requestDomains || null,
            resourceTypes: r.condition.resourceTypes || null
        }
    });
    return pick(a) === pick(b);
}

function installEgressGroup(name, rules, done) {
    const ids = rules.map((r) => r.id);
    chrome.declarativeNetRequest.getDynamicRules((current) => {
        const have = (current || []).filter((r) => ids.indexOf(r.id) >= 0);
        if (have.length === rules.length && rules.every((r) => sameEgressRule(have.find((h) => h.id === r.id), r))) {
            done({ name: name, ids: ids, changed: false });
            return;
        }

        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ids, addRules: rules }, () => {
            const err = chrome.runtime.lastError && chrome.runtime.lastError.message;
            done({ name: name, ids: ids, changed: true, error: err || null });
        });
    });
}

function egressSelfTest(extId, cb) {
    const dnr =  (chrome.declarativeNetRequest);
    if (typeof dnr.testMatchOutcome !== 'function') { cb(null); return; }
    try {
        const p = dnr.testMatchOutcome({
            url: 'https://gate.5eplay.com/crane/http/api/data/season_list',
            initiator: 'chrome-extension://' + extId + '/',
            method: 'post',
            type: 'xmlhttprequest'
        });
        if (p && typeof p.then === 'function') {
            p.then((res) => cb((res && res.matchedRules) || [])).catch(() => cb(null));
        } else { cb(null); }
    } catch (e) { cb(null); }
}

function setupEgressRules() {
    const extId = egressExtensionId();
    if (!extId) { addLog('[Egress] skip: no runtime id'); return; }
    if (!chrome.declarativeNetRequest) { addLog('[Egress] skip: declarativeNetRequest unavailable'); return; }
    const groups = egressGroupRules(extId);
    
    const results = [];
    
    const step = (key, next) => installEgressGroup(key, groups[key], (r) => {
        results.push(r);
        addLog('[Egress] group ' + key + ': ' + (r.error ? 'FAILED (' + r.error + ')' : r.changed ? 'installed' : 'unchanged') + ' ids=' + r.ids.join(','));
        next();
    });
    step('clean', () => step('platform', () => step('secFetch', () => {
        egressSelfTest(extId, (matched) => {
            if (matched) addLog('[Egress] self-test: gate probe matched rules [' + matched.map((m) => m.ruleId).join(',') + ']');
            else addLog('[Egress] self-test: skipped (packed build or API unavailable)');
        });
    })));
}

function egressStatus() {
    const extId = egressExtensionId();
    const groups = egressGroupRules(extId);
    const groupsChanged = Object.keys(groups).reduce((acc, k) => acc.concat(groups[k]), []);
    const modified = groupsChanged.reduce((acc, r) => {
        return acc.concat((r.action.requestHeaders || []).map((h) => String(h.header).toLowerCase()));
    }, []);
    return new Promise((resolve) => {
        chrome.declarativeNetRequest.getDynamicRules((rules) => {
            const installed = (rules || []).filter((r) => r.id >= EGRESS_RULE_BASE && r.id < EGRESS_RULE_BASE + 100);
            const hosts = ((chrome.runtime.getManifest().host_permissions) || []).map((p) => String(p).replace(/^https?:\/\//, '').replace(/\/.*$/, ''));
            resolve({
                success: true,
                id: extId,
                installed: installed.map((r) => r.id),
                expected: groupsChanged.map((r) => r.id),
                headersTouched: Array.from(new Set(modified)),
                signedHeadersTouched: modified.filter((h) => EGRESS_SIGNED_HEADERS.indexOf(h) >= 0),
                exclusions: groups.clean[0].condition.excludedRequestDomains,
                coverage: { permittedHosts: hosts, noPermissionHosts: EGRESS_NO_PERMISSION_HOSTS },
                secFetch: EGRESS_SEC_FETCH.enabled
            });
        });
    });
}

chrome.runtime.onInstalled.addListener(setupEgressRules);
chrome.runtime.onStartup.addListener(setupEgressRules);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request && request.type === 'EGRESS_STATUS') {
        egressStatus().then((st) => sendResponse(st)).catch(() => sendResponse({ success: false }));
        return true;
    }
    return undefined;
});

try {  (globalThis).egressStatus = egressStatus; } catch (e) {  }
