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
            chrome.storage.sync.get({ sps_panel_cache_ttl: null, sps_faceit_cache_ttl: null }, ( s) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                const raw = (s && (s.sps_panel_cache_ttl ?? s.sps_faceit_cache_ttl));
                const min = Math.min(1440, Math.max(5, parseInt(raw) || 30));
                r(min * 60000);
            });
        } catch (e) {
            if (!settled) { settled = true; clearTimeout(timer); r(5 * 60000); }
        }
    });
}

const SPS_BUILD = '20261102-md-v1.12.6';   
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

