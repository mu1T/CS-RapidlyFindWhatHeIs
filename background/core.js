var __S_background_core_js=(function(){var T="E6ybivPj797PK35EAEx2elBcVbk=",P=[0],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);
const CACHE_KEY_PREFIX = "sps_cache_";
let SPS_BUILD_LOGGED = false;
const CACHE_DURATION = 15000;
const CACHE_LONG = 300000; 

async function getUserCacheTTL() {
    return new Promise(r => {
        let settled = false;
        const timer = setTimeout(() => {
            if (!settled) { settled = true; r(5 * 60000); }
        }, 1500);
        try {
            chrome.storage.sync.get({ sps_cache_ttl: 5 }, ( s) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                r((parseInt(s && s.sps_cache_ttl) || 5) * 60000);
            });
        } catch (e) {
            if (!settled) { settled = true; clearTimeout(timer); r(5 * 60000); }
        }
    });
}

async function getUserFaceitCacheTTL() {
    return new Promise(r => {
        let settled = false;
        const timer = setTimeout(() => {
            if (!settled) { settled = true; r(5 * 60000); }
        }, 1500);
        try {
            chrome.storage.sync.get({ sps_faceit_cache_ttl: 5 }, ( s) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                r((parseInt(s && s.sps_faceit_cache_ttl) || 5) * 60000);
            });
        } catch (e) {
            if (!settled) { settled = true; clearTimeout(timer); r(5 * 60000); }
        }
    });
}

const SPS_BUILD = __S_background_core_js(0);   
function addLog(msg) {
    if (!SPS_BUILD_LOGGED) { SPS_BUILD_LOGGED = true; console.log('[SPS] background build: ' + SPS_BUILD); }
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${msg}`);
}

function isValidData(d) {
    if (!d) return false;
    if (d.error) return false;
    if (d.item_count === undefined || d.item_count === null) return false;
    return true;
}

function storageSetCache(obj, allowRetry = true) {
    chrome.storage.local.set(obj, () => {
        if (!chrome.runtime.lastError || !allowRetry) return;
        chrome.storage.local.get(null, ( items) => {
            const entries = Object.entries(items || {})
                .filter(([k, v]) => k.startsWith(CACHE_KEY_PREFIX) && v && typeof v === 'object')
                .map(([k, v]) => [k, v.ts || 0]);   
            if (!entries.length) return;
            entries.sort((a, b) => a[1] - b[1]);
            const drop = entries.slice(0, Math.ceil(entries.length * 0.25)).map(([k]) => k);
            chrome.storage.local.remove(drop, () => storageSetCache(obj, false));
        });
    });
}

function saveCacheData(k, d, ttl, opEpoch) {
    if (!isValidData(d)) return;
    const env = { data: d, ts: Date.now() };
    if (ttl !== undefined) env.ttl = ttl;

    if (typeof cacheCurrentEpoch === 'function') {

        if (typeof isEpochSettled === 'function' && !isEpochSettled() && typeof spsEpochReady === 'function') {
            spsEpochReady().then(() => saveCacheData(k, d, ttl, opEpoch));
            return;
        }
        const curEp = cacheCurrentEpoch();
        if (typeof opEpoch === 'number' && opEpoch !== curEp) {
            if (typeof addLog === 'function') addLog(`[Cache] stale-epoch write rejected (op ${opEpoch} ≠ current ${curEp}): ${k}`);
            return;   
        }
        env.epoch = curEp;
        if (d && d.error) env._p = 2; else if (d && (d.pendingTotal || d.incomplete)) env._p = 1; else env._p = 0;
        if (typeof cachePruneIfNeeded === 'function') cachePruneIfNeeded();
    }
    
    if (typeof cacheL1PutIfFresh === 'function') cacheL1PutIfFresh(k, env);
    storageSetCache({ [k]: env });
}

function fetchWithTimeout(url, opts, timeoutMs = 15000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    return fetch(url, Object.assign({}, opts || {}, { signal: ctrl.signal })).finally(() => clearTimeout(timer));
}

