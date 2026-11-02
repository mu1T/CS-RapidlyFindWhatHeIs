

const CSSTATS_CAPS_KEY = 'sps_csstats_carrier_caps';

const CSSTATS_CARRIER_ORDER = Object.freeze(['cdp', 'tab', 'window']);
const CSSTATS_CARRIER_OPEN_MS = 800;                    
const CSSTATS_CARRIER_COOLDOWN_MS = 10 * 60 * 1000;     

function csstatsCarrierDefaultCaps() {
    return {
        cdp: { state: 'unknown', at: 0 },
        tab: { state: 'unknown', at: 0 },
        window: { state: 'unknown', at: 0 }
    };
}

async function csstatsCarrierCaps() {
    const base = csstatsCarrierDefaultCaps();
    const raw = await csstatsSessionGet(CSSTATS_CAPS_KEY);
    if (raw && typeof raw === 'object') {
        for (const kind of CSSTATS_CARRIER_ORDER) {
            const e = raw[kind];
            if (e && typeof e === 'object' && e.state) {
                base[kind] = { state: String(e.state), at: Number(e.at || 0) };
            }
        }
    }
    return base;
}

function csstatsCarrierOrder(caps, now) {
    const t = Number(now) || Date.now();
    const out = [];
    for (const kind of CSSTATS_CARRIER_ORDER) {
        const e = (caps && caps[kind]) || { state: 'unknown', at: 0 };
        const state = String(e.state || 'unknown');
        let reason = '';
        if (state === 'no-api') reason = 'no-api';
        else if (state === 'failed' && t - Number(e.at || 0) < CSSTATS_CARRIER_COOLDOWN_MS) reason = 'cooldown';
        out.push({ kind, usable: !reason, reason });
    }
    return out;
}

async function csstatsCarrierNote(kind, state) {
    const caps = await csstatsCarrierCaps();
    if (!caps[kind]) return false;
    caps[kind] = { state: String(state || 'unknown'), at: Date.now() };
    return csstatsSessionSet(CSSTATS_CAPS_KEY, caps);
}

async function csstatsCarrierCapsReset() {
    return csstatsSessionSet(CSSTATS_CAPS_KEY, csstatsCarrierDefaultCaps());
}

function csstatsCarrierOpenTab(url) {
    return new Promise((resolve) => {
        let timer = null;
        let settled = false;
        const done = (r) => { if (settled) return; settled = true; if (timer) clearTimeout(timer); resolve(r); };
        timer = setTimeout(() => done({ ok: false, reason: 'TIMEOUT' }), CSSTATS_CARRIER_OPEN_MS);
        try {
            const tabsApi =  (chrome.tabs);
            if (!tabsApi || typeof tabsApi.create !== 'function') { done({ ok: false, reason: 'NO_API' }); return; }
            tabsApi.create({ url, active: false }, ( tab) => {
                const le = chrome.runtime.lastError;
                const err = le ? String(le.message || le) : '';
                if (!tab || !tab.id) {
                    if (typeof addDebugLog === 'function') {
                        addDebugLog('carrier', 'csstatsCarrierOpenTab failed: ' + (err || 'NO_TAB'));
                    }
                    done({ ok: false, reason: 'FAILED', error: err });
                    return;
                }
                done({ ok: true, kind: 'tab', tabId: Number(tab.id) });
            });
        } catch (e) {
            const err = e && e.message ? e.message : String(e);
            if (typeof addDebugLog === 'function') {
                addDebugLog('carrier', 'csstatsCarrierOpenTab exception: ' + err);
            }
            done({ ok: false, reason: 'FAILED', error: err });
        }
    });
}

function csstatsCarrierOpenWindow(url, isCef) {
    return new Promise((resolve) => {
        let timer = null;
        let settled = false;
        const done = (r) => { if (settled) return; settled = true; if (timer) clearTimeout(timer); resolve(r); };
        timer = setTimeout(() => done({ ok: false, reason: 'TIMEOUT' }), CSSTATS_CARRIER_OPEN_MS);
        try {
            const winApi =  (chrome.windows);
            if (!winApi || typeof winApi.create !== 'function') { done({ ok: false, reason: 'NO_API' }); return; }
            
            const createOpts = {
                url,
                focused: false,
                type: 'popup',
                width: isCef ? 400 : 520,
                height: isCef ? 300 : 640
            };
            winApi.create(createOpts, ( win) => {
                const le = chrome.runtime.lastError;
                const err = le ? String(le.message || le) : '';
                if (!win || !win.id) {
                    
                    try {
                        winApi.create({ url, focused: false }, ( fallbackWin) => {
                            const le2 = chrome.runtime.lastError;
                            const err2 = le2 ? String(le2.message || le2) : '';
                            if (!fallbackWin || !fallbackWin.id) {
                                if (typeof addDebugLog === 'function') {
                                    addDebugLog('carrier', 'csstatsCarrierOpenWindow failed: ' + (err2 || err || 'NO_WINDOW'));
                                }
                                done({ ok: false, reason: 'FAILED', error: err2 || err });
                                return;
                            }
                            const tabId = (fallbackWin.tabs && fallbackWin.tabs[0] && fallbackWin.tabs[0].id) ? Number(fallbackWin.tabs[0].id) : 0;
                            done({ ok: true, kind: 'window', tabId, windowId: Number(fallbackWin.id) });
                        });
                        return;
                    } catch (e2) {
                        if (typeof addDebugLog === 'function') {
                            addDebugLog('carrier', 'csstatsCarrierOpenWindow failed: ' + (err || 'NO_WINDOW'));
                        }
                        done({ ok: false, reason: 'FAILED', error: err });
                        return;
                    }
                }
                const tabId = (win.tabs && win.tabs[0] && win.tabs[0].id) ? Number(win.tabs[0].id) : 0;
                done({ ok: true, kind: 'window', tabId, windowId: Number(win.id) });
            });
        } catch (e) {
            const err = e && e.message ? e.message : String(e);
            if (typeof addDebugLog === 'function') {
                addDebugLog('carrier', 'csstatsCarrierOpenWindow exception: ' + err);
            }
            done({ ok: false, reason: 'FAILED', error: err });
        }
    });
}

function csstatsCarrierOpen(kind, url, carrierOpts) {
    const o = carrierOpts || {};
    if (kind === 'tab') return csstatsCarrierOpenTab(url);
    if (kind === 'window') return csstatsCarrierOpenWindow(url, o.isCef === true);
    if (kind === 'cdp') return csstatsCdpOpen(url);
    return Promise.resolve({ ok: false, reason: 'NO_ADAPTER' });
}

function csstatsCarrierClose(carrier) {
    const c = carrier || {};
    try {
        if (c.kind === 'cdp' && c.targetId) return csstatsCdpClose(c.targetId);
        if (c.kind === 'window' && c.windowId) {
            const winApi =  (chrome.windows);
            if (winApi && typeof winApi.remove === 'function') {
                winApi.remove(Number(c.windowId), () => { void chrome.runtime.lastError; });
                return true;
            }
        }
        if (c.tabId) { csstatsTabRemove(c.tabId); return true; }
    } catch (e) {  }
    return false;
}

function csstatsCarrierCloseByRole(role, tabId) {
    const c = (role && role.carrier && typeof role.carrier === 'object')
        ? Object.assign({}, role.carrier)
        : { kind: 'tab' };
    if (!c.tabId && tabId) c.tabId = Number(tabId);
    return csstatsCarrierClose(c);
}

const CSSTATS_PENDING_KEY = 'sps_csstats_pending';
const CSSTATS_PENDING_TTL_MS = 20 * 1000;   
const CSSTATS_CDP_PORT = 8080;

function csstatsCdpBase() {
    return 'http://127.0.0.1:' + CSSTATS_CDP_PORT;
}

async function csstatsCdpAvailable() {
    try {
        const res = await fetchWithTimeout(csstatsCdpBase() + '/json/version', {}, 1200).catch(() => null);
        return !!(res && res.status === 200);
    } catch (e) { return false; }
}

function csstatsCdpOpen(url) {
    return new Promise((resolve) => {
        try {
            fetchWithTimeout(csstatsCdpBase() + '/json/new?' + String(url || ''), { method: 'PUT' }, CSSTATS_CARRIER_OPEN_MS).then((res) => {
                if (!res || res.status !== 200) { resolve({ ok: false, reason: 'FAILED' }); return; }
                return res.text().then((txt) => {
                    let obj = null;
                    try { obj = JSON.parse(String(txt || '')); } catch (e) { obj = null; }
                    const id = obj && (obj.id || obj.targetId);
                    if (!id) { resolve({ ok: false, reason: 'FAILED' }); return; }
                    resolve({ ok: true, kind: 'cdp', targetId: String(id), tabId: 0 });
                }).catch(() => resolve({ ok: false, reason: 'FAILED' }));
            }).catch(() => resolve({ ok: false, reason: 'FAILED' }));
        } catch (e) { resolve({ ok: false, reason: 'FAILED' }); }
    });
}

function csstatsCdpClose(targetId) {
    try {
        fetchWithTimeout(csstatsCdpBase() + '/json/close/' + encodeURIComponent(String(targetId || '')), {}, 1500).catch(() => null);
        return true;
    } catch (e) { return false; }
}

async function csstatsPendingMap() {
    const raw = await csstatsSessionGet(CSSTATS_PENDING_KEY);
    return (raw && typeof raw === 'object') ? raw : {};
}

async function csstatsPendingNote(steamId, carrier) {
    const sid = String(steamId || '');
    if (!sid) return false;
    const map = await csstatsPendingMap();
    const now = Date.now();
    for (const key of Object.keys(map)) {
        if (now - Number((map[key] || {}).at || 0) > CSSTATS_PENDING_TTL_MS) delete map[key];
    }
    map[sid] = { at: now, carrier: carrier || null, claimed: false, token: '' };
    return csstatsSessionSet(CSSTATS_PENDING_KEY, map);
}

async function csstatsPendingClaim(steamId, userVisible) {
    const sid = String(steamId || '');
    if (!sid) return null;
    const map = await csstatsPendingMap();
    const e = map[sid];
    if (!e || e.claimed) return null;
    if (Date.now() - Number(e.at || 0) > CSSTATS_PENDING_TTL_MS) {
        delete map[sid];
        await csstatsSessionSet(CSSTATS_PENDING_KEY, map);
        return null;
    }
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    map[sid] = Object.assign({}, e, { claimed: true, token, userVisible: userVisible === true });
    await csstatsSessionSet(CSSTATS_PENDING_KEY, map);
    const check = await csstatsPendingMap();
    const got = check[sid];
    if (!got || got.token !== token) return null;   
    return got;
}

async function csstatsPendingTake(steamId) {
    const sid = String(steamId || '');
    if (!sid) return null;
    const map = await csstatsPendingMap();
    const e = map[sid];
    if (!e || !e.claimed) return null;
    delete map[sid];
    await csstatsSessionSet(CSSTATS_PENDING_KEY, map);
    return e;
}

async function csstatsCarrierDiag() {
    const caps = await csstatsCarrierCaps();
    const order = csstatsCarrierOrder(caps);
    let pendingCount = 0;
    try { pendingCount = Object.keys(await csstatsPendingMap()).length; } catch (e) { pendingCount = 0; }
    return {
        caps,
        order: order.map((o) => ({ kind: o.kind, usable: o.usable, reason: o.reason })),
        pendingCount
    };
}

async function csstatsPendingReap() {
    const map = await csstatsPendingMap();
    const now = Date.now();
    let closed = 0;
    let changed = false;
    for (const sid of Object.keys(map)) {
        const e = map[sid] || {};
        if (now - Number(e.at || 0) <= CSSTATS_PENDING_TTL_MS) continue;
        if (e.carrier) { csstatsCarrierClose(e.carrier); closed++; }
        delete map[sid];
        changed = true;
    }
    if (changed) await csstatsSessionSet(CSSTATS_PENDING_KEY, map);
    return closed;
}
