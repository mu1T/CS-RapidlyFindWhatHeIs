var __S_background_csstats_tabs_js=(function(){var T="Ge3by5qxrJ+NZ2dTclgmNwoIEuT5/cjdvbMVs7iwj5dyP3FDTWs1Dx8f4ObO29WsFR0L+8rB3M+9t5eDon52Rm5MJDQAARZrVUFgLyoVB+H56fjToLq+t5NjZnBaFJKeiFd2UVxIKCIQLwnr9fvD26qo",P=[48,0,93,26,70],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);


const CSSTATS_ROLE_KEY = __S_background_csstats_tabs_js(0);
const CSSTATS_GATE_KEY = __S_background_csstats_tabs_js(1);
const CSSTATS_ROLE_TTL_MS = 10 * 60 * 1000;      
const CSSTATS_SILENT_IDLE_MS = 5 * 60 * 1000;    
const CSSTATS_GATE_WINDOW_MS = 10 * 60 * 1000;   
const CSSTATS_GATE_MAX_OPENS = 3;                
const CSSTATS_REAP_ALARM = __S_background_csstats_tabs_js(2);

function csstatsRoleArea() {
    try {
        if (!chrome.storage) return null;
        return chrome.storage.session || chrome.storage.local || null;
    } catch (e) { return null; }
}

function csstatsSessionGet(key) {
    return new Promise((resolve) => {
        try {
            const area = csstatsRoleArea();
            if (!area) { resolve(null); return; }
            area.get([key], ( d) => {
                void chrome.runtime.lastError;
                resolve(d && d[key] !== undefined ? d[key] : null);
            });
        } catch (e) { resolve(null); }
    });
}

function csstatsSessionSet(key, val) {
    return new Promise((resolve) => {
        try {
            const area = csstatsRoleArea();
            if (!area) { resolve(false); return; }
            area.set({ [key]: val }, () => {
                void chrome.runtime.lastError;
                resolve(true);
            });
        } catch (e) { resolve(false); }
    });
}

function csstatsTabRemove(tabId) {
    try {
        const tabsApi =  (chrome.tabs);
        if (tabsApi && typeof tabsApi.remove === 'function') {
            tabsApi.remove(Number(tabId), () => { void chrome.runtime.lastError; });
        }
    } catch (e) {  }
}

async function csstatsRoleMap() {
    const m = await csstatsSessionGet(CSSTATS_ROLE_KEY);
    return (m && typeof m === 'object') ? m : {};
}

async function csstatsTabRegister(tabId, entry) {
    const id = String(tabId || '');
    if (!id) return false;
    const map = await csstatsRoleMap();
    const base = Object.assign({ openedAt: Date.now(), activatedBy: null }, entry || {});
    base.touchedAt = Number(base.touchedAt || base.openedAt || Date.now());
    map[id] = base;
    return csstatsSessionSet(CSSTATS_ROLE_KEY, map);
}

async function csstatsTabRoleFor(tabId) {
    const id = String(tabId || '');
    if (!id) return null;
    const map = await csstatsRoleMap();
    const entry = map[id];
    if (!entry) return null;
    const now = Date.now();
    if (now - Number(entry.touchedAt || entry.openedAt || 0) > CSSTATS_ROLE_TTL_MS) {
        delete map[id];
        await csstatsSessionSet(CSSTATS_ROLE_KEY, map);
        return null;
    }
    entry.touchedAt = now;   
    await csstatsSessionSet(CSSTATS_ROLE_KEY, map);
    return Object.assign({ tabId: Number(id) }, entry);
}

async function csstatsTabForget(tabId) {
    const id = String(tabId || '');
    if (!id) return false;
    const map = await csstatsRoleMap();
    if (!map[id]) return false;
    delete map[id];
    await csstatsSessionSet(CSSTATS_ROLE_KEY, map);
    return true;
}

async function csstatsTabMarkActivated(tabId, by) {
    const id = String(tabId || '');
    if (!id) return false;
    const map = await csstatsRoleMap();
    if (!map[id]) return false;
    if (!map[id].activatedBy) map[id].activatedBy = by;
    await csstatsSessionSet(CSSTATS_ROLE_KEY, map);
    return true;
}

function csstatsTabWindowId(tabId) {
    return new Promise((resolve) => {
        try {
            const tabsApi =  (chrome.tabs);
            if (!tabsApi || typeof tabsApi.get !== 'function') { resolve(0); return; }
            tabsApi.get(Number(tabId), ( tab) => {
                void chrome.runtime.lastError;
                resolve(tab && tab.windowId ? Number(tab.windowId) : 0);
            });
        } catch (e) { resolve(0); }
    });
}

function csstatsForegroundWindowId() {
    return new Promise((resolve) => {
        try {
            const winApi =  (chrome.windows);
            if (!winApi || typeof winApi.getLastFocused !== 'function') { resolve(-1); return; }
            winApi.getLastFocused({ populate: false }, ( win) => {
                void chrome.runtime.lastError;
                resolve(win && win.focused ? Number(win.id) : -1);
            });
        } catch (e) { resolve(-1); }
    });
}

async function csstatsTabActivate(tabId) {
    const id = String(tabId || '');
    if (!id) return false;
    const role = await csstatsTabRoleFor(id);
    if (!role) return false;
    const fgWin = await csstatsForegroundWindowId();
    if (fgWin < 0) { csstatsBackfillNote('cf-activate-denied', role.steamId, __S_background_csstats_tabs_js(3)); return false; }   
    const winId = await csstatsTabWindowId(id);
    if (winId && winId !== fgWin) return false;        
    await csstatsTabMarkActivated(id, 'us');           
    csstatsBackfillNote('cf-activated', role.steamId, 'tab ' + id);
    return new Promise((resolve) => {
        try {
            const tabsApi =  (chrome.tabs);
            if (!tabsApi || typeof tabsApi.update !== 'function') { resolve(false); return; }
            tabsApi.update(Number(id), { active: true }, () => {
                void chrome.runtime.lastError;
                try {
                    const winApi =  (chrome.windows);
                    if (winId && winApi && typeof winApi.update === 'function') {
                        winApi.update(winId, { focused: true }, () => { void chrome.runtime.lastError; });
                    }
                } catch (e) {  }
                resolve(true);
            });
        } catch (e) { resolve(false); }
    });
}

const CSSTATS_GATE_FAIL_KEY = __S_background_csstats_tabs_js(4);

async function csstatsGateFailCount(steamId) {
    const sid = String(steamId || '');
    if (!sid) return 0;
    const m = await csstatsSessionGet(CSSTATS_GATE_FAIL_KEY);
    const map = (m && typeof m === 'object') ? m : {};
    return Number(map[sid] || 0);
}

async function csstatsGateFailNote(steamId, gated) {
    const sid = String(steamId || '');
    if (!sid) return;
    const m = await csstatsSessionGet(CSSTATS_GATE_FAIL_KEY);
    const map = (m && typeof m === 'object') ? m : {};
    if (gated) map[sid] = Math.min(9, Number(map[sid] || 0) + 1);
    else delete map[sid];
    await csstatsSessionSet(CSSTATS_GATE_FAIL_KEY, map);
}

function csstatsFetchMode(v) {
    const s = String(v || '');
    return (s === 'direct' || s === 'tab') ? s : 'auto';
}

function csstatsCefMode(v) {
    const s = String(v || '');
    return (s === 'visible' || s === 'off') ? s : 'auto';
}

function csstatsTtlMinutes(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return 30;
    return Math.min(240, Math.max(5, Math.round(n)));
}

const CSSTATS_BUCKET_KEY = 'sps_csstats_bucket';
const CSSTATS_BACKOFF_KEY = 'sps_csstats_backoff';
const CSSTATS_RATE_PER_MIN = 20;              
const CSSTATS_RATE_BURST = 6;                 
const CSSTATS_RATE_MAX_WAIT_MS = 5000;        
const CSSTATS_BACKOFF_MS = 10 * 60 * 1000;    

async function csstatsRateAcquire() {
    const deadline = Date.now() + CSSTATS_RATE_MAX_WAIT_MS;
    const perMs = CSSTATS_RATE_PER_MIN / 60000;
    for (;;) {
        const now = Date.now();
        const raw = await csstatsSessionGet(CSSTATS_BUCKET_KEY);
        const b = (raw && typeof raw === 'object') ? raw : {};
        const base = (b.tokens === undefined || b.tokens === null) ? CSSTATS_RATE_BURST : Number(b.tokens);
        const tokens = Math.min(CSSTATS_RATE_BURST, base + Math.max(0, now - Number(b.at || now)) * perMs);
        if (tokens >= 1) {
            await csstatsSessionSet(CSSTATS_BUCKET_KEY, { tokens: tokens - 1, at: now });
            return true;
        }
        const wait = Math.max(50, Math.ceil((1 - tokens) / perMs));
        if (now + wait > deadline) return false;
        await new Promise((r) => setTimeout(r, Math.min(wait, 500)));
    }
}

async function csstatsRateNoteLimited(retryAfterMs) {
    
    const wait = Number(retryAfterMs) > 0 ? Number(retryAfterMs) : CSSTATS_BACKOFF_MS;
    const until = Date.now() + Math.max(30 * 1000, wait);
    await csstatsSessionSet(CSSTATS_BACKOFF_KEY, { until });
    return until;
}

async function csstatsBackoffRemainingMs() {
    const raw = await csstatsSessionGet(CSSTATS_BACKOFF_KEY);
    const until = Number((raw && raw.until) || 0);
    return Math.max(0, until - Date.now());
}

function csstatsHasAnyData(data) {
    if (!data || data.error) return false;
    const prem = data.premier || null;
    return !!(
        (prem && (Number(prem.current) > 0 || Number(prem.best) > 0))
        || (Array.isArray(data.competitive) && data.competitive.length > 0)
        || (data.wingman && (data.wingman.current || data.wingman.best))
        || data.kd_ratio !== undefined || data.hltv_rating !== undefined
    );
}

function shouldBackfillCsstats(data, mode) {
    if (mode === 'direct') return false;
    if (mode === 'tab') return true;
    if (!data || data.error) return false;
    
    if (data.auth_gated === true) return true;
    const prem = data.premier || null;
    const hasRanks = !!(
        (prem && (Number(prem.current) > 0 || Number(prem.best) > 0))
        || (Array.isArray(data.competitive) && data.competitive.some((r) => r && (r.current || r.best)))
        || (data.wingman && (data.wingman.current || data.wingman.best))
    );
    if (!hasRanks) return false;
    const fields = ['kd_ratio', 'hltv_rating', 'win_rate', 'hs_percentage', 'adr', 'clutch'];
    return fields.every((f) => data[f] === undefined || data[f] === null);
}

async function csstatsBackfillReserve(steamId) {
    const sid = String(steamId || '');
    if (!sid) return false;
    const now = Date.now();
    const raw = await csstatsSessionGet(CSSTATS_GATE_KEY);
    const gate = (raw && typeof raw === 'object') ? raw : {};
    
    const rawById = (gate.byId && typeof gate.byId === 'object') ? gate.byId : {};
    const byId = {};
    for (const key of Object.keys(rawById)) {
        if (now - Number(rawById[key]) < CSSTATS_GATE_WINDOW_MS) byId[key] = rawById[key];
    }
    const opens = Array.isArray(gate.opens) ? gate.opens.filter((t) => now - Number(t) < CSSTATS_GATE_WINDOW_MS) : [];
    if (byId[sid] && now - Number(byId[sid]) < CSSTATS_GATE_WINDOW_MS) return false;
    if (opens.length >= CSSTATS_GATE_MAX_OPENS) return false;
    
    const map = await csstatsRoleMap();
    const live = Object.keys(map).filter((id) => {
        const e = map[id] || {};
        return e.role === 'silent' && now - Number(e.touchedAt || e.openedAt || 0) < CSSTATS_ROLE_TTL_MS;
    });
    if (live.length >= 1) return false;
    byId[sid] = now;
    opens.push(now);
    await csstatsSessionSet(CSSTATS_GATE_KEY, { byId, opens });
    return true;
}

async function csstatsTabOpen(steamId, carrierOpts) {
    const o = carrierOpts || {};
    const url = csstatsProfileUrl(steamId);
    
    if (o.allowCdp === true) {
        const capsNow = await csstatsCarrierCaps();
        if (capsNow.cdp.state !== 'ok') {
            const portOk = await csstatsCdpAvailable();
            await csstatsCarrierNote('cdp', portOk ? 'unknown' : 'failed');
        }
    }
    const caps = await csstatsCarrierCaps();
    const order = csstatsCarrierOrder(caps);
    for (const cand of order) {
        if (!cand.usable) continue;
        if (cand.kind === 'cdp' && o.allowCdp !== true) continue;
        if ((cand.kind === 'tab' || cand.kind === 'window') && o.allowVisible === false) continue;
        
        if ((cand.kind === 'tab' || cand.kind === 'window') && o.isOverlay === true) continue;
        
        if ((cand.kind === 'tab' || cand.kind === 'window') && o.isCef === true && o.isOverlay !== true) {
            const fgWin = await csstatsForegroundWindowId();
            if (fgWin < 0 && o.allowVisible !== true) {
                csstatsBackfillNote('cef-visible-denied', steamId, __S_background_csstats_tabs_js(3));
                continue;
            }
        }
        const r = await csstatsCarrierOpen(cand.kind, url, o);
        if (r && r.ok) {
            await csstatsCarrierNote(cand.kind, 'ok');
            return {
                ok: true,
                tabId: Number(r.tabId || 0),
                carrier: {
                    kind: r.kind,
                    tabId: Number(r.tabId || 0),
                    windowId: Number(r.windowId || 0),
                    targetId: r.targetId ? String(r.targetId) : ''
                }
            };
        }
        csstatsBackfillNote('carrier-fail', steamId, cand.kind + ': ' + ((r && (r.error || r.reason)) || 'fail'));
        await csstatsCarrierNote(cand.kind, (r && r.reason === 'NO_API') ? 'no-api' : 'failed');
    }
    return { ok: false, reason: 'NO_CARRIER' };
}

async function csstatsBackfillRelease(steamId) {
    const sid = String(steamId || '');
    if (!sid) return false;
    const raw = await csstatsSessionGet(CSSTATS_GATE_KEY);
    const gate = (raw && typeof raw === 'object') ? raw : {};
    const byId = (gate.byId && typeof gate.byId === 'object') ? gate.byId : {};
    const opens = Array.isArray(gate.opens) ? gate.opens.slice() : [];
    delete byId[sid];
    if (opens.length) opens.pop();
    await csstatsSessionSet(CSSTATS_GATE_KEY, { byId, opens });
    return true;
}

async function csstatsTabDedupe(keepTabId) {
    const map = await csstatsRoleMap();
    const now = Date.now();
    const live = Object.keys(map)
        .filter((id) => map[id] && map[id].role === 'silent'
            && now - Number(map[id].touchedAt || map[id].openedAt || 0) < CSSTATS_ROLE_TTL_MS)
        .sort((a, b) => Number(map[a].openedAt || 0) - Number(map[b].openedAt || 0) || (a < b ? -1 : 1));
    if (live.length <= 1) return true;
    if (String(live[0]) === String(keepTabId)) return true;
    csstatsCarrierCloseByRole(map[String(keepTabId)], keepTabId);
    await csstatsTabForget(keepTabId);
    return false;
}

async function csstatsTabCloseAfterSync(tabId) {
    const id = String(tabId || '');
    if (!id) return false;
    const role = await csstatsTabRoleFor(id);
    if (!role) return false;
    await csstatsTabForget(id);
    if (role.role !== 'silent') return false;   
    csstatsBackfillNote('synced', role.steamId, 'tab ' + id);
    if (role.activatedBy === 'user') return false;
    csstatsBackfillNote('closed', role.steamId, role.activatedBy === 'us' ? 'after-verify' : 'auto');
    const delay = role.activatedBy === 'us' ? 800 : 0;
    setTimeout(() => csstatsCarrierCloseByRole(role, id), delay);
    return true;
}

const CSSTATS_BACKFILL_LOG_KEY = 'sps_csstats_backfill_log.';
const CSSTATS_BACKFILL_LOG_MAX = 20;

function csstatsBackfillNote(action, steamId, reason) {
    try {
        const area = csstatsRoleArea();
        if (!area || typeof area.set !== 'function') return;
        const key = CSSTATS_BACKFILL_LOG_KEY + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const entry = { ts: new Date().toISOString(), action: String(action || ''), steamId: String(steamId || ''), reason: String(reason || '') };
        const patch = {};
        patch[key] = entry;
        area.set(patch, () => { void chrome.runtime.lastError; });
    } catch (e) {  }
}

function csstatsBackfillLog() {
    return new Promise((resolve) => {
        try {
            const area = csstatsRoleArea();
            if (!area || typeof area.get !== 'function') { resolve([]); return; }
            area.get(null, ( all) => {
                void chrome.runtime.lastError;
                const keys = Object.keys(all || {})
                    .filter((k) => k.indexOf(CSSTATS_BACKFILL_LOG_KEY) === 0)
                    .sort();
                const mask = ( v) => String(v || '').replace(/[0-9]{17}/g, '<steamid>');
                const list = keys.map((k) => all[k]).filter(Boolean);
                if (keys.length > CSSTATS_BACKFILL_LOG_MAX && typeof area.remove === 'function') {
                    try { area.remove(keys.slice(0, keys.length - CSSTATS_BACKFILL_LOG_MAX), () => { void chrome.runtime.lastError; }); } catch (e) {  }
                }
                resolve(list.slice(-CSSTATS_BACKFILL_LOG_MAX).map((e) => Object.assign({}, e, { steamId: mask(e.steamId) })));
            });
        } catch (e) { resolve([]); }
    });
}

function csstatsBackfillWanted(data, mode, visible) {
    if (visible === false) return false;
    return shouldBackfillCsstats(data, mode);
}

async function csstatsBackfillMaybe(steamId, data, mode, visible, carrierOpts) {
    try {
        if (carrierOpts && carrierOpts.disabled) return null;   
        if (!csstatsBackfillWanted(data, mode, visible)) {
            csstatsBackfillNote(visible === false ? 'skip-hidden' : (mode === 'direct' ? 'skip-mode' : 'skip-incomplete'), steamId, 'mode=' + mode);
            return null;
        }
        if (!(await csstatsBackfillReserve(steamId))) { csstatsBackfillNote('skip-throttle', steamId, 'mode=' + mode); return null; }
        const opened = await csstatsTabOpen(steamId, carrierOpts);
        if (!opened.ok) {
            csstatsBackfillNote('skip-no-carrier', steamId, String(opened.reason || ''));
            await csstatsBackfillRelease(steamId);           
            return null;
        }
        const openedTabId = Number(opened.tabId || 0);
        const kindLabel = (opened.carrier && opened.carrier.kind) ? opened.carrier.kind : 'tab';
        if (openedTabId) {
            await csstatsTabRegister(openedTabId, {
                steamId: String(steamId || ''),
                role: 'silent',
                carrier: opened.carrier
            });
            if (!(await csstatsTabDedupe(openedTabId))) return null;
        } else {

            await csstatsPendingNote(steamId, opened.carrier);
        }
        csstatsBackfillNote('open', steamId, kindLabel + ' ' + (openedTabId || 'bg'));
        addLog(`[CSStats] 静默补全开页 ${steamId} → ${kindLabel} ${openedTabId || 'bg'}（mode=${mode}）`);
        
        return openedTabId || -1;
    } catch (e) { return null; }
}

function csstatsBroadcastPartial(steamId, backfilling) {
    const msg = { type: 'CSSTATS_PARTIAL', steamId: String(steamId || ''), backfilling: !!backfilling };
    try {
        if (typeof embedBroadcastToTabs === 'function') { embedBroadcastToTabs(msg); return; }
    } catch (e) {  }
    try { chrome.runtime.sendMessage(msg).catch(() => { }); } catch (e) {  }
}

async function csstatsBackfillReap() {
    const now = Date.now();
    const map = await csstatsRoleMap();
    let changed = false;
    for (const id of Object.keys(map)) {
        const e = map[id] || {};
        const openedAt = Number(e.openedAt || 0);
        const touchedAt = Number(e.touchedAt || openedAt);
        const expired = now - touchedAt > CSSTATS_ROLE_TTL_MS;
        const idle = e.role === 'silent' && !e.activatedBy && now - openedAt > CSSTATS_SILENT_IDLE_MS;
        if (!expired && !idle) continue;

        if (idle) { csstatsCarrierCloseByRole(e, id); csstatsBackfillNote('recycled', e.steamId, 'tab ' + id); }
        delete map[id];
        changed = true;
    }
    if (changed) await csstatsSessionSet(CSSTATS_ROLE_KEY, map);
    
    try { await csstatsPendingReap(); } catch (e) {  }
}

function csstatsBackfillSetupReap() {
    try {
        if (!chrome.alarms || typeof chrome.alarms.create !== 'function') return;
        if (typeof chrome.alarms.get === 'function') {
            chrome.alarms.get(CSSTATS_REAP_ALARM, ( alarm) => {
                void chrome.runtime.lastError;
                if (alarm) return;
                try { chrome.alarms.create(CSSTATS_REAP_ALARM, { delayInMinutes: 1, periodInMinutes: 1 }); } catch (e) {  }
            });
            return;
        }
        chrome.alarms.create(CSSTATS_REAP_ALARM, { delayInMinutes: 1, periodInMinutes: 1 });
    } catch (e) {  }
}

try {
    if (chrome.tabs && chrome.tabs.onRemoved && chrome.tabs.onRemoved.addListener) {
        chrome.tabs.onRemoved.addListener(( tabId) => { void csstatsTabForget(tabId); });
    }
    if (chrome.tabs && chrome.tabs.onActivated && chrome.tabs.onActivated.addListener) {
        chrome.tabs.onActivated.addListener(( info) => {
            if (info && info.tabId) void csstatsTabMarkActivated(info.tabId, 'user');
        });
    }
} catch (e) {  }

try {
    if (chrome.alarms && chrome.alarms.onAlarm && chrome.alarms.onAlarm.addListener) {
        chrome.alarms.onAlarm.addListener(( alarm) => {
            if (alarm && alarm.name === CSSTATS_REAP_ALARM) void csstatsBackfillReap();
        });
    }
} catch (e) {  }

csstatsBackfillSetupReap();
