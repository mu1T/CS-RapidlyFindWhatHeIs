

const GLOBAL_EPOCH_KEY = '_sps_global_epoch';
let _spsGlobalEpoch = 0;

let _epochSettled = false;

let _epochReadyPromise = null;

function spsEpochReady() {
    if (!_epochReadyPromise) {
        _epochReadyPromise = new Promise((resolve) => {
            try {
                chrome.storage.local.get(GLOBAL_EPOCH_KEY, (d) => {
                    const v = d && d[GLOBAL_EPOCH_KEY];
                    if (typeof v === 'number' && v > _spsGlobalEpoch) _spsGlobalEpoch = v;
                    _epochSettled = true;
                    resolve(_spsGlobalEpoch);
                });
            } catch (e) { _epochSettled = true; resolve(_spsGlobalEpoch); }   
        });
    }
    return _epochReadyPromise;
}

function isEpochSettled() { return _epochSettled; }

function cacheCurrentEpoch() { return _spsGlobalEpoch; }

function cacheBeginOp() { return _epochSettled ? _spsGlobalEpoch : undefined; }

const L1_CACHE_MAX = 256;

const _l1Cache = new Map();
function _l1Get(k) {
    const hit = _l1Cache.get(k);
    if (hit === undefined) return undefined;
    if (hit._bumped) return hit;   
    hit._bumped = true;
    _l1Cache.delete(k);
    _l1Cache.set(k, hit);
    setTimeout(() => { delete hit._bumped; }, 0);
    return hit;
}
function _l1Put(k, env) {
    if (_l1Cache.has(k)) _l1Cache.delete(k);
    _l1Cache.set(k, env);
    while (_l1Cache.size > L1_CACHE_MAX) {
        const oldest = _l1Cache.keys().next().value;
        _l1Cache.delete(oldest);
    }
}
function _l1Del(k) { _l1Cache.delete(k); }

function cacheClearL1() { _l1Cache.clear(); }

function cacheL1PutIfFresh(k, env) {
    if (env && typeof env.epoch === 'number' && env.epoch < _spsGlobalEpoch) return;
    _l1Put(k, env);
}

function cacheDel(k) {
    _l1Del(k);
    try { chrome.storage.local.remove(k, () => {}); } catch (e) {  }
}

const _inflight = new Map();

function cacheSingleflight(key, task) {
    const existing = _inflight.get(key);
    if (existing) return existing.promise;
    const slot = { promise:  (null) };
    slot.promise = (async () => {
        let value;
        try {
            value = await task();
        } catch (e) {
            if (_inflight.get(key) === slot) _inflight.delete(key);   
            throw e;
        }
        
        setTimeout(() => { if (_inflight.get(key) === slot) _inflight.delete(key); }, 0);
        return value;
    })();
    _inflight.set(key, slot);
    return slot.promise;
}

function cacheSingleflightHas(key) { return _inflight.has(key); }

function _spsL1Stats() { return { size: _l1Cache.size, max: L1_CACHE_MAX }; }
function _spsInflightStats() { return { keys: Array.from(_inflight.keys()).slice(0, 32) }; }

function _spsBreakersSnapshot() {
    const out = {};
    for (const [p, st] of _breakers) {
        out[p] = { kind: st.kind || '', streak: st.streak, until: st.until, remainingMs: Math.max(0, st.until - Date.now()), tripped: st.until > Date.now() };
    }
    return out;
}

const _cacheListeners = [];

function cacheSubscribe(fn) { _cacheListeners.push(fn); }
function _cacheEmit(evt) { for (const fn of _cacheListeners.slice()) { try { fn(evt); } catch (e) {  } } }

const _patchBuffer = { names:  (null), timer: 0 };

function cacheNotifyPatches(domain, target, names) {
    if (!names || !names.length) return;
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) return;   
    _patchBuffer.names = (_patchBuffer.names || []).concat(names);
    if (_patchBuffer.timer) return;
    _patchBuffer.timer = setTimeout(() => {
        _patchBuffer.timer = 0;
        const merged = _patchBuffer.names;
        _patchBuffer.names = null;
        try { chrome.runtime.sendMessage({ type: 'SPS_CACHE_PATCH', domain: domain, target: target, names: merged }).catch(() => {}); } catch (e) {  }
    }, 1200);
}

const CB_STAIR = [20e3, 45e3, 90e3];

const _breakers = new Map();

function breakerOpen(provider, kind) {
    const prev = _breakers.get(provider) || { streak: 0, until: 0, kind: '' };
    const isAuth = kind === 'auth';
    const idx = Math.min(isAuth ? CB_STAIR.length - 1 : prev.streak, CB_STAIR.length - 1);
    const st = {
        streak: isAuth ? CB_STAIR.length : prev.streak + 1,
        until: Date.now() + CB_STAIR[idx],
        kind: isAuth ? 'auth' : (prev.kind === 'auth' ? 'auth' : 'transient'),
    };
    _breakers.set(provider, st);
    _breakerSessionSave();
    addLog(`[Cache] provider "${provider}" circuit OPEN ${Math.round(CB_STAIR[idx] / 1e3)}s (${st.kind}, streak=${st.streak})`);
}

function breakerSuccess(provider) {
    const st = _breakers.get(provider);
    if (st && (st.streak > 0 || st.until > 0)) { _breakers.set(provider, { streak: 0, until: 0, kind: '' }); _breakerSessionSave(); }
}

function breakerTripped(provider) {
    const st = _breakers.get(provider);
    return !!(st && st.until > Date.now());
}

function breakerRetryAt(provider) {
    const st = _breakers.get(provider);
    return st ? st.until : 0;
}

function cacheResetBreakers() { _breakers.clear(); _breakerSessionSave(); }

const _BREAKER_SESSION_KEY = 'sps_breakers';
function _breakerSessionSave() {
    try {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.session) return;
        const flat = {};
        for (const [p, st] of _breakers) flat[p] = st;
        chrome.storage.session.set({ [_BREAKER_SESSION_KEY]: flat }, () => { if (chrome.runtime.lastError) {  } });
    } catch (e) {  }
}
try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
        chrome.storage.session.get([_BREAKER_SESSION_KEY], (d) => {
            try {
                if (chrome.runtime.lastError) return;
                const flat = d && d[_BREAKER_SESSION_KEY];
                if (flat && typeof flat === 'object') {
                    for (const p of Object.keys(flat)) {
                        const st = flat[p];
                        
                        if (st && typeof st.until === 'number' && st.until > Date.now()) {
                            _breakers.set(p, { streak: st.streak | 0, until: st.until, kind: st.kind || '' });
                        }
                    }
                }
            } catch (e) {  }
        });
    }
} catch (e) {  }

const CACHE_CLASS = { STATIC_IMMUTABLE: 0, HISTORICAL: 1, DYNAMIC: 2, VOLATILE: 3 };

const IMMUTABLE_KEY_RE = /_(zhname_v\d+|zhdesc_v\d+|floatname_v\d+|floatmap_v\d+|sdtbase_tables_v\d+|propschema\w*)$/;

function cacheClassForKey(k) {
    if (IMMUTABLE_KEY_RE.test(k)) return CACHE_CLASS.STATIC_IMMUTABLE;
    if (/^sps_cache_(cqp_|sdtp_|po_|bq_|gd_|mkt_)/.test(k)) return CACHE_CLASS.VOLATILE;
    if (/^sps_cache_(faceit6r_|faceit6_|faceit7h|leetify1_|csstats1_|pw|f5e|inv18_)/.test(k)) return CACHE_CLASS.HISTORICAL;
    return CACHE_CLASS.DYNAMIC;
}

const QUOTA_HIGH_WATER = 8 * 1024 * 1024;   

const PRUNE_COOLDOWN_MS = 60e3;     
let _pruneBusy = false;
let _pruneCooldownUntil = 0;

function cachePruneIfNeeded() {
    if (_pruneBusy) return;
    if (Date.now() < _pruneCooldownUntil) return;   
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local || !chrome.storage.local.getBytesInUse) return;
    _pruneBusy = true;
    try {
        chrome.storage.local.getBytesInUse(null, (bytes) => {
            if (typeof bytes !== 'number' || bytes <= QUOTA_HIGH_WATER) { _pruneBusy = false; return; }
            chrome.storage.local.get(null, (items) => {
                try {
                    const now = Date.now();
                    const rows =  (items || {});
                    const victims = [];
                    for (const [k, v] of Object.entries(rows)) {
                        if (!k.startsWith(CACHE_KEY_PREFIX) || !v || typeof v !== 'object') continue;
                        const cls = cacheClassForKey(k);
                        if (cls === CACHE_CLASS.STATIC_IMMUTABLE) continue;   
                        const ts = Number(v.ts) || 0;
                        const ttl = Number(v.ttl) || 0;
                        const expired = ttl > 0 && now - ts >= ttl;
                        victims.push({ k: k, cls: cls, expired: expired, ts: ts });
                    }
                    if (!victims.length) return;
                    
                    victims.sort((a, b) => (b.cls - a.cls) || ((b.expired ? 1 : 0) - (a.expired ? 1 : 0)) || (a.ts - b.ts));
                    const drop = victims.slice(0, Math.max(8, Math.ceil(victims.length * 0.2))).map(x => x.k);
                    for (const k of drop) _l1Del(k);
                    chrome.storage.local.remove(drop, () => {});
                    _pruneCooldownUntil = Date.now() + PRUNE_COOLDOWN_MS;   
                    addLog(`[Cache] high-water prune: dropped ${drop.length} entries (usage ${(bytes / 1048576).toFixed(2)}MB)`);
                } finally { _pruneBusy = false; }
            });
        });
    } catch (e) { _pruneBusy = false; }
}

function cacheSet(k, payload, opts) {
    const o = opts || {};

    if (!_epochSettled) { spsEpochReady().then(() => _cacheSetSettled(k, payload, o)); return true; }
    return _cacheSetSettled(k, payload, o);
}

function _cacheSetSettled(k, payload, opts) {
    const o = opts || {};
    const ep = _spsGlobalEpoch;
    if (o.epoch !== undefined && o.epoch !== ep) {
        addLog(`[Cache] stale-epoch write rejected for ${k} (op ${o.epoch} ≠ current ${ep})`);
        return false;
    }

    const env = Object.assign({ }, payload, { ts: Date.now(), epoch: ep });
    if (o.ttl !== undefined) env.ttl = o.ttl;
    if (o.broadcast) {
        
        if (cacheClassForKey(k) === CACHE_CLASS.STATIC_IMMUTABLE) env._p = CACHE_CLASS.STATIC_IMMUTABLE;
        else if (env.error) env._p = 2;
        else if (env.pendingTotal || env.incomplete) env._p = 1;
        else env._p = 0;
    }
    _l1Put(k, env);
    cachePruneIfNeeded();
    storageSetCache({ [k]: env });
    if (o.broadcast) _cacheEmit({ key: k });
    return true;
}

function cacheGet(k, opts) {
    const memoize = !(opts && opts.memoize === false);
    if (Array.isArray(k)) {
        const out = {};
        const missing = [];
        for (const key of k) {
            const l1 = _l1Get(key);
            if (l1 !== undefined) out[key] = l1; else missing.push(key);
        }
        if (!missing.length) return Promise.resolve(out);

        const sig = missing.join('\u0000');
        const pick = ( shared) => {
            for (const key of missing) if (shared[key] !== undefined) out[key] = shared[key];
            return out;
        };
        if (typeof cacheSingleflight !== 'function') return _cacheGetFromL2(missing, {}, memoize).then(pick);
        return cacheSingleflight('cacheget|' + (memoize ? 'm' : 'n') + '|' + sig, () => _cacheGetFromL2(missing, {}, memoize)).then(pick);
    }
    return new Promise((resolve) => {
        const l1 = _l1Get(k);
        if (l1) { resolve(l1); return; }
        let settled = false;
        const timer = setTimeout(() => {
            if (!settled) { settled = true; resolve(undefined); }
        }, 2500);
        try {
            chrome.storage.local.get(k, (d) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                const env =  (d && d[k]);
                if (env && typeof env === 'object') {

                    if (typeof env.epoch === 'number' && env.epoch < _spsGlobalEpoch) {
                        try { chrome.storage.local.remove(k, () => {}); } catch (e2) {  }
                        resolve(undefined);
                        return;
                    }
                    if (memoize) _l1Put(k, env);   
                }
                resolve(env);
            });
        } catch (e) {
            if (!settled) { settled = true; clearTimeout(timer); resolve(undefined); }
        }
    });
}

function cacheEntryValid(entry, shape, opts) {
    if (!entry || typeof entry !== 'object') return false;
    if (Number(entry.v) !== Number(shape)) return false;   
    const o = opts || {};
    if (o.ttl && !(Date.now() - Number(entry.ts) < (Number(entry.ttl) || o.ttl))) return false;
    if (typeof o.valid === 'function' && !o.valid(entry.data)) return false;
    return true;
}

async function cacheGetVersioned(k, shape, opts) {
    try {
        const e = await cacheGet(k, opts);
        return cacheEntryValid(e, shape, opts) ? e.data : null;
    } catch (e0) { return null; }
}

function cacheSetVersioned(k, data, shape, opts) {
    try { return cacheSet(k, { data, v: Number(shape) }, opts); } catch (e0) { return false; }
}

function _cacheGetFromL2(missing, out, memoize) {
    return new Promise((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (!settled) { settled = true; resolve(out); }
        }, 2500);
        try {
            chrome.storage.local.get(missing, (d) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                for (const key of missing) {
                    const env =  (d && d[key]);
                    if (env && typeof env === 'object') {
                        if (typeof env.epoch === 'number' && env.epoch < _spsGlobalEpoch) {
                            try { chrome.storage.local.remove(key, () => {}); } catch (e2) {  }
                            continue;   
                        }
                        if (memoize) _l1Put(key, env);   
                        out[key] = env;
                    }
                }
                resolve(out);
            });
        } catch (e) {
            if (!settled) { settled = true; clearTimeout(timer); resolve(out); }
        }
    });
}

const SWR_STALE_FACTOR = 3;   

function cacheHealth(env, ttl) {
    if (!env || typeof env !== 'object' || !env.ts) return 'MISS';
    const age = Date.now() - Number(env.ts);
    const effTtl = (env.ttl !== undefined ? Number(env.ttl) : ttl) || 0;
    const d = env.data;
    if (d && (d.pendingTotal || d.incomplete)) return 'PARTIAL';
    if (!effTtl) return 'FRESH';
    if (age < effTtl) return 'FRESH';
    if (age < effTtl * SWR_STALE_FACTOR) return 'STALE';
    return 'DEAD';
}

function cacheClearAll(reason) {
    _spsGlobalEpoch++;

    try { chrome.storage.local.set({ [GLOBAL_EPOCH_KEY]: _spsGlobalEpoch }, () => {}); } catch (e0) {  }
    cacheClearL1();
    cacheResetBreakers();
    _pruneCooldownUntil = 0;   
    if (_patchBuffer.timer) { clearTimeout(_patchBuffer.timer); _patchBuffer.timer = 0; _patchBuffer.names = null; }
    return new Promise((resolve) => {
        try {
            chrome.storage.local.get(null, (items) => {
                const keys = Object.keys(items || {}).filter(k => k.startsWith(CACHE_KEY_PREFIX) || k === 'sps_debug_logs');
                chrome.storage.local.remove(keys, () => {

                    try {
                        chrome.storage.local.get(null, (again) => {
                            const againRows =  (again || {});
                            const strays = Object.keys(againRows).filter(k => {
                                if (!k.startsWith(CACHE_KEY_PREFIX) || !againRows[k] || typeof againRows[k] !== 'object') return false;
                                const ep = againRows[k].epoch;
                                return typeof ep !== 'number' ? true : ep < _spsGlobalEpoch;   
                            });
                            if (strays.length) {
                                for (const k of strays) _l1Del(k);
                                chrome.storage.local.remove(strays, () => {});
                            }
                            addLog(`[Cache] atomic clear: epoch→${_spsGlobalEpoch}, removed ${keys.length + strays.length} keys${reason ? ' (' + reason + ')' : ''}`);
                            resolve(keys.length + strays.length);
                        });
                    } catch (e2) { resolve(keys.length); }
                });
            });
        } catch (e) { resolve(0); }
    });
}

spsEpochReady();

function cacheNotifyInventory(k) {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) return;
    try { chrome.runtime.sendMessage({ type: 'SPS_CACHE_PATCH', domain: 'INVENTORY', target: String(k), names: [] }).catch(() => {}); } catch (e) {  }
}
