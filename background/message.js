var __S_background_message_js=(function(){var T="ENie/ZqGkKe8SExzeXsTATIP64+Ci7WhsE1bfWxwDBcxDdrv45uX666nUV1UaXcNPCwaKeWl+PXDq7q7hRFHO153YQ0EGScpwNHN/uKWlA==",P=[33,0,61,17,47],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);


const INV_FINAL_REUSE_MS = 15e3;

const _invFinalInflight = new Map();

const _faceitHistInflight = new Map();

const _invFinalRecent = new Map();

const _pwStatsInflight = new Map();
const _pwMdInflight = new Map();   

const _f5eStatsInflight = new Map();

const invFinalKey = ( sid,  settings) =>
    sid + '|' + (settings && settings.sps_inv_source ? String(settings.sps_inv_source) : 'steam');

function csstatsReadSettings() {
    return new Promise((resolve) => {
        
        let timer = null;
        let settled = false;
        const done = ( v) => {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            const o = v || {};
            resolve({
                fetchMode: csstatsFetchMode(o.sps_csstats_fetch),
                cefMode: csstatsCefMode(o.sps_csstats_cef),
                ttlMinutes: csstatsTtlMinutes(o.sps_csstats_ttl)
            });
        };
        timer = setTimeout(() => done(null), 1500);
        try {
            chrome.storage.sync.get({ sps_csstats_fetch: 'auto', sps_csstats_cef: 'auto', sps_csstats_ttl: 30 }, ( s) => {
                void chrome.runtime.lastError;
                done(s);
            });
        } catch (e) { done(null); }
    });
}

function csstatsFetchThenBackfill(steamId, visible, sendResponse, cef, overlay) {
    const cacheKey = CACHE_KEY_PREFIX + 'csstats1_' + steamId;
    const partialTTL = 60e3;        
    const partialRetryMs = 60e3;    
    let replied = false;
    let backfillScheduled = false;
    
    let stale = null;
    
    const fail = () => {
        if (replied) return;
        replied = true;
        sendResponse({ success: true, data: { error: 'NETWORK_ERROR' } });
    };
    csstatsReadSettings().then(async (settings) => {
        const mode = settings.fetchMode;
        const csTTL = settings.ttlMinutes * 60e3;   
        const isOverlay = overlay === true;
        const isCef = cef === true;
        const backfillOpts = {
            allowCdp: isCef && settings.cefMode === 'auto',

            allowVisible: !isOverlay && (isCef ? settings.cefMode !== 'off' : true),
            isCef: isCef,
            isOverlay: isOverlay,
            disabled: isCef && settings.cefMode === 'off'
        };
        
        const replyOnce = (data) => {
            if (replied) return;
            replied = true;
            sendResponse({ success: true, data });
        };
        
        const reply = (data) => {
            if (data && data.auth_gated) {
                Promise.resolve(csstatsGateFailCount(steamId)).then((n) => {
                    replyOnce(Object.assign({}, data, { gateFails: n }));
                }).catch(() => replyOnce(data));
                return;
            }
            replyOnce(data);
        };
        
        const scheduleBackfill = (data, freshCache) => {
            if (backfillScheduled) return;
            if (mode === 'direct') return;
            if (mode === 'tab' && freshCache) return;
            if (!csstatsBackfillWanted(data, mode, visible)) return;
            backfillScheduled = true;
            Promise.resolve(csstatsBackfillMaybe(steamId, data, mode, visible, backfillOpts))
                .then((tabId) => { if (tabId) csstatsBroadcastPartial(steamId, true); })
                .catch(() => { });
        };
        
        const replyWithBackfill = (data, backfill) => {
            if (!backfill) { reply(data); return; }
            Promise.resolve(csstatsBackfillMaybe(steamId, data, mode, visible, backfillOpts)).then((tabId) => {
                if (replied) return;
                let out = data;
                if (tabId) out = Object.assign({}, data, { backfilling: true, pending: !csstatsHasAnyData(data) });
                else if (data && data.pending) out = { error: 'NETWORK_ERROR' };
                reply(out);
            }).catch(() => reply(data));
        };

        const runStaged = (silent) => fetchCSStatsProfile(steamId).then((first) => {
            const firstData = first.data;
            if (!firstData || firstData.error) {
                if (firstData && firstData.error === 'RATE_LIMITED') {
                    
                    const waitMs = Number(firstData.retryAfterMs) || 0;
                    Promise.resolve(csstatsRateNoteLimited(waitMs)).catch(() => { });
                    reply({ error: 'RATE_LIMITED', retryAfterMs: waitMs });
                    return;
                }
                const transient = !firstData || firstData.error === 'NETWORK_ERROR' || firstData.error === 'NO_RESPONSE' || firstData.error === 'UNKNOWN' || firstData.error === 'THROTTLED';
                if (transient && stale) {
                    reply(Object.assign({}, stale, { _stale: true }));
                    scheduleBackfill(stale, false);
                    return;
                }
                reply(firstData || { error: 'UNKNOWN' });
                return;
            }
            
            const partialData = Object.assign({}, firstData, { partial: true });
            if (!silent) reply(partialData);
            
            if (firstData.auth_gated) scheduleBackfill(partialData, false);
            
            const seeded = stale ? mergeCSStatsData(stale, firstData) : firstData;
            cacheSet(cacheKey, {
                data: Object.assign({}, seeded, { partial: true }),
                retryAt: Date.now() + partialRetryMs
            }, { ttl: partialTTL, epoch: cacheBeginOp() });
            return fetchCSStatsDetail(steamId, first.html).then((detail) => {
                if (detail && detail.error === 'RATE_LIMITED') csstatsRateNoteLimited(detail.retryAfterMs);
                const detailOk = !!(detail && !detail.error);
                const merged = detailOk ? mergeCSStatsData(seeded, detail) : seeded;
                
                if (detailOk) cacheSet(cacheKey, { data: merged }, { ttl: csTTL, epoch: cacheBeginOp() });
                csstatsBroadcastPartial(steamId, false);
                if (!firstData.auth_gated) scheduleBackfill(merged, false);
            }).catch(() => {
                csstatsBroadcastPartial(steamId, false);
                if (!firstData.auth_gated) scheduleBackfill(seeded, false);
            });
        }).catch(fail);

        const backoffMs = await csstatsBackoffRemainingMs();
        if (backoffMs > 0) {
            const cachedEntry = await cacheGet(cacheKey);
            const cached = (cachedEntry && cachedEntry.data && !cachedEntry.data.error) ? cachedEntry.data : null;
            reply(cached || { error: 'RATE_LIMITED', retryAfterMs: backoffMs });
            return;
        }

        const entry = await cacheGet(cacheKey);
        stale = (entry && entry.data && !entry.data.error) ? entry.data : null;

        const freshFull = !!(entry && !(entry.data && entry.data.partial)
            && (Date.now() - entry.ts < (entry.ttl || csTTL)));
        if (freshFull) {
            reply(entry.data);
            scheduleBackfill(entry.data, true);
            return;
        }

        const partialHit = !!(entry && entry.data && entry.data.partial
            && (Date.now() - entry.ts < (entry.ttl || partialTTL)));
        if (partialHit) {
            reply(entry.data);
            scheduleBackfill(entry.data, false);
            
            if (visible !== false && Date.now() >= Number(entry.retryAt || 0)) runStaged(true);
            return;
        }

        if (visible === false) {
            reply(stale || { pending: true });
            return;
        }

        if (mode === 'tab') {
            if (stale) { replyWithBackfill(stale, true); return; }
            return fetchCSStatsData(steamId, { profileOnly: true, timeoutMs: 3000 }).then((data) => {
                replyWithBackfill((data && !data.error) ? data : { pending: true }, true);
            }).catch(() => { replyWithBackfill({ pending: true }, true); });
        }

        return runStaged(false);
    }).catch(fail);
}

chrome.runtime.onMessage.addListener(( request,  sender,  sendResponse) => {
    if (request.type === "SPS_DEBUG_EXPORT") {

        (async () => {
            const logs = await getDebugLogs();

            const diagCacheCore = { epoch: cacheCurrentEpoch(), l1: _spsL1Stats(), inflight: _spsInflightStats(), breakers: _spsBreakersSnapshot() };
            const settings = await new Promise(r => chrome.storage.sync.get(null, ( s) => r(s)));
            const localData = await new Promise(r => chrome.storage.local.get(null, ( d) => r(d)));
            const cacheEntries = Object.entries(localData || {}).filter(([k]) => k.startsWith(CACHE_KEY_PREFIX) && k !== 'sps_debug_logs');
            const manifest = chrome.runtime.getManifest();

            const embedInject = await Promise.resolve(embedCookieInjectStatus()).catch(() => ({ success: false }));
            
            const safeSettings = {};
            for (const [k, v] of Object.entries(settings)) {
                safeSettings[k] = typeof v === 'string' && /key|tk$|token/i.test(k) && v ? `***(${v.length} chars)` : v;
            }
            const cacheSummary = cacheEntries.map(([k, v]) => {
                const name = k.replace(CACHE_KEY_PREFIX, '').replace(/[0-9]{17}/g, '<steamid>');
                return { key: name, ts: v && v.ts ? new Date(v.ts).toISOString() : null, bytes: JSON.stringify(v || '').length };
            });
            sendResponse( ({
                success: true,
                diagnostics: {
                    exportedAt: new Date().toISOString(),
                    extensionVersion: manifest.version,
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                    settings: safeSettings,
                    csstatsBackfill: (typeof csstatsBackfillLog === 'function')
                        ? await csstatsBackfillLog().catch(() => [])
                        : [],
                    csstatsCarrier: (typeof csstatsCarrierDiag === 'function')
                        ? await csstatsCarrierDiag().catch(() => null)
                        : null,
                    cacheCount: cacheEntries.length,
                    cacheSummary,
                    cacheCore: diagCacheCore,
                    embed: embedInject,
                    logs
                }
            }));
        })();
        return true;
    }
    if (request.type === "SPS_DEBUG_CLEAR") {
        clearDebugLogs();
        sendResponse( ({ success: true }));
        return;
    }
    if (request.type === "FETCH_FACEIT") {

        const cacheKey = CACHE_KEY_PREFIX + 'faceit6_' + request.steamId;
        getUserFaceitCacheTTL().then((faceitTTL) => {
            return cacheGet(cacheKey).then((entry) => {
                if (entry && (Date.now() - entry.ts < (entry.ttl || faceitTTL))) {
                    sendResponse({ success: true, data: entry.data });
                    return;
                }

                if (entry) cacheDel(cacheKey);

                const sfP = (typeof cacheSingleflight === 'function')
                    ? cacheSingleflight('faceit6|' + request.steamId, () => fetchFaceitData(request.steamId, request.apiKey))
                    : fetchFaceitData(request.steamId, request.apiKey);
                return sfP.then(data => {
                    const neg = data && (data.error === 'NOT_FOUND' || data.error === 'NO_CS2');

                    if (data && ((data.has_faceit && !data.error) || neg)) {
                        cacheSet(cacheKey, { data }, { ttl: neg ? 30 * 60e3 : faceitTTL, epoch: cacheBeginOp() });
                    }
                    sendResponse({ success: true, data: data });
                }).catch(() => {
                    sendResponse({ success: true, data: { error: 'NETWORK_ERROR' } });
                });
            });
        }).catch(() => {
            sendResponse({ success: true, data: { error: 'NETWORK_ERROR' } });
        });
        return true;
    }
    if (request.type === "FETCH_FACEIT_RANK") {

        chrome.storage.sync.get({ sps_panel_cache_ttl: null, sps_faceit_cache_ttl: null }, ( s) => {
            const raw = (s && (s.sps_panel_cache_ttl ?? s.sps_faceit_cache_ttl));
            const faceitTTL = (Math.min(1440, Math.max(5, parseInt(raw) || 30))) * 60000;
            const cacheKey = CACHE_KEY_PREFIX + 'faceit6r_' + request.faceitId;
            const read = ( entry) => {
                if (entry && entry.data && Date.now() - entry.ts < (entry.ttl || faceitTTL)) {
                    const d = entry.data;
                    
                    if (d && d.error) { sendResponse({ success: true, data: {} }); return; }
                    sendResponse({ success: true, data: d });
                    return;
                }
                fetchFaceitRanks(request.faceitId || '', request.region || '', request.country || '', request.apiKey).then((ranks) => {

                    if (ranks && ranks.error === 'NETWORK') { sendResponse({ success: true, data: { rankError: 'RETRY_LATER' } }); return; }
                    if (ranks && ranks.error) { sendResponse({ success: true, data: {} }); return; }
                    sendResponse({ success: true, data: ranks || {} });
                });
            };

            if (!request.faceitId) { sendResponse({ success: true, data: {} }); return; }
            cacheGet(cacheKey).then(read);
        });
        return true;
    }
    if (request.type === "FETCH_FACEIT_HISTORY") {

        const cacheKey = CACHE_KEY_PREFIX + 'faceit7h_' + request.steamId;
        const fastKey = CACHE_KEY_PREFIX + 'faceit7hf_' + request.steamId;

        const histTTL = 60 * 60e3;   
        cacheGet([cacheKey, fastKey]).then(( wrapper) => {
            const fullEntry = wrapper[cacheKey];
            const fastEntry = wrapper[fastKey];
            const fresh = ( e) => e && (Date.now() - e.ts < (e.ttl || histTTL));
            if (fullEntry && fresh(fullEntry) && fullEntry.data && Array.isArray(fullEntry.data.rows) && fullEntry.data.rows.length) {
                sendResponse({ success: true, data: fullEntry.data });
                return;
            }

            const mkey = 'fh_' + request.steamId;
            const statsInflight = _faceitHistInflight.get(mkey + ':stats');
            if (statsInflight) { statsInflight.then(sendResponse); return true; }

            if (fastEntry && fresh(fastEntry) && fastEntry.data && Array.isArray(fastEntry.data.rows) && fastEntry.data.rows.length) {
                sendResponse({ success: true, data: { complete: true, rows: fastEntry.data.rows, statsPending: false, statsMissing: true, faceitId: fastEntry.data.faceitId } });
                return;
            }
            
            const existing = _faceitHistInflight.get(mkey);
            if (existing) { existing.then(sendResponse); return true; }
            
            const p = fetchFaceitHistory(request.steamId, request.apiKey, request.faceitId).then(( data) => {
                if (data && data.error) return { success: true, data };

                if (data && data.complete && Array.isArray(data.rows) && data.rows.length) {
                    cacheSet(fastKey, { data: { rows: data.rows, faceitId: data.faceitId } }, { ttl: histTTL, epoch: cacheBeginOp() });
                }

                if (data && data._statsPromise) {
                    const tail = data._statsPromise.then(( final) => {
                        
                        if (final && final.complete) {
                            cacheSet(cacheKey, { data: final }, { ttl: histTTL, epoch: cacheBeginOp(), broadcast: true });

                            cacheDel(fastKey);
                        }
                        return { success: true, data: final };
                    });
                    _faceitHistInflight.set(mkey + ':stats', tail);
                    tail.finally(() => { if (_faceitHistInflight.get(mkey + ':stats') === tail) _faceitHistInflight.delete(mkey + ':stats'); });
                }
                const { _statsPromise, ...rest } = data || {};
                return { success: true, data: rest };
            });
            _faceitHistInflight.set(mkey, p);
            p.finally(() => { if (_faceitHistInflight.get(mkey) === p) _faceitHistInflight.delete(mkey); });
            p.then(sendResponse);
        });
        return true;
    }
    if (request.type === "FETCH_LEETIFY") {

        const handleLeetify = ( leeTTL) => {
            const cacheKey = CACHE_KEY_PREFIX + 'leetify1_' + request.steamId;
            cacheGet(cacheKey).then((entry) => {
                if (entry && (Date.now() - entry.ts < (entry.ttl || leeTTL))) {
                    sendResponse({ success: true, data: entry.data });
                    return;
                }
                if (entry) cacheDel(cacheKey);
                const sfP = (typeof cacheSingleflight === 'function')
                    ? cacheSingleflight('leetify1|' + request.steamId, () => fetchLeetifyData(request.steamId, request.apiKey))
                    : fetchLeetifyData(request.steamId, request.apiKey);
                return sfP.then(data => {

                    const neg = data && (data.error === 'NOT_FOUND' || data.error === 'BAD_KEY');
                    if (data && ((data.has_leetify && !data.error) || neg)) {
                        cacheSet(cacheKey, { data }, { ttl: neg ? 30 * 60e3 : leeTTL, epoch: cacheBeginOp() });
                    }
                    sendResponse({ success: true, data: data });
                }).catch(() => {
                    sendResponse({ success: true, data: { error: 'NETWORK_ERROR' } });
                });
            }).catch(() => {
                sendResponse({ success: true, data: { error: 'NETWORK_ERROR' } });
            });
        };
        try {
            chrome.storage.sync.get({ sps_panel_cache_ttl: 30 }, ( s) => {
                void chrome.runtime.lastError;
                handleLeetify((parseInt(s && s.sps_panel_cache_ttl) || 30) * 60e3);
            });
        } catch (e) {
            handleLeetify(30 * 60e3);
        }
        return true;
    }
    if (request.type === "CSSTATS_CLAIM") {

        const claimSid = String(request.steamId || '');
        if (!/^\d{17}$/.test(claimSid)) {
            sendResponse({ success: true, role: null, steamId: claimSid });
            return true;
        }
        csstatsPendingClaim(claimSid, request.visible === true).then((entry) => {
            sendResponse({
                success: true,
                role: entry ? 'silent' : null,
                steamId: claimSid
            });
        }).catch(() => sendResponse({ success: true, role: null, steamId: claimSid }));
        return true;
    }
    if (request.type === "CSSTATS_TAB_ROLE") {

        const tabId = sender && sender.tab ? sender.tab.id : 0;
        csstatsTabRoleFor(tabId).then((role) => {
            sendResponse({
                success: true,
                role: role ? role.role : null,
                steamId: role ? String(role.steamId || '') : '',
                returnUrl: role ? String(role.returnUrl || '') : ''
            });
        }).catch(() => {
            sendResponse({ success: true, role: null, steamId: '', returnUrl: '' });
        });
        return true;
    }
    if (request.type === "CSSTATS_ARM_HEAL") {

        const tabId = sender && sender.tab ? sender.tab.id : 0;
        const sid = String(request.steamId || '');
        if (!tabId || !/^\d{17}$/.test(sid)) {
            sendResponse({ success: false, error: 'BAD_TAB_OR_STEAMID' });
            return true;
        }
        csstatsTabRegister(tabId, { steamId: sid, role: 'heal', returnUrl: String(request.returnUrl || '') }).then((ok) => {
            sendResponse({ success: !!ok });
        }).catch(() => {
            sendResponse({ success: false });
        });
        return true;
    }
    if (request.type === "CSSTATS_ACTIVATE_TAB") {
        
        const tabId = sender && sender.tab ? sender.tab.id : 0;
        csstatsTabActivate(tabId).then((ok) => {
            sendResponse({ success: !!ok, error: ok ? undefined : 'NOT_FOREGROUND' });
        }).catch(() => {
            sendResponse({ success: false, error: 'ACTIVATE_FAILED' });
        });
        return true;
    }
    if (request.type === "FETCH_CSSTATS") {
        csstatsFetchThenBackfill(String(request.steamId || ''), request.visible, sendResponse, request.cef === true, request.overlay === true);
        return true;
    }
    if (request.type === "CSSTATS_PAGE_SYNC") {
        
        const sid = String(request.steamId || '');
        if (!/^\d{17}$/.test(sid)) {
            sendResponse({ success: false, error: 'BAD_STEAMID' });
            return true;
        }
        
        if (csstatsIsRateLimitedPage(String(request.profileHtml || '') + String(request.statsHtml || ''))) {
            Promise.resolve(csstatsRateNoteLimited(0)).catch(() => { });
            sendResponse({ success: false, error: 'RATE_LIMITED' });
            return true;
        }
        const data = parseCSStatsHtml(request.profileHtml, request.statsHtml);
        if (data && data.error === 'CF_CHALLENGE') {
            sendResponse({ success: false, error: 'CF_CHALLENGE' });
            return true;
        }
        const cacheKey = CACHE_KEY_PREFIX + 'csstats1_' + sid;
        const csTTL = 5 * 60e3;
        const neg = data && (data.error === 'NOT_FOUND' || data.error === 'PRIVATE');
        const liveUrl = 'https://csstats.gg/player/' + sid;
        const senderTabId = (sender && sender.tab && sender.tab.id) ? sender.tab.id : 0;
        const finish = (finalData) => {
            if (finalData && (!finalData.error || neg)) {
                cacheSet(cacheKey, { data: finalData }, { ttl: neg ? 30 * 60e3 : csTTL, epoch: cacheBeginOp() });
            }
            if (typeof embedBroadcastToTabs === 'function') {
                embedBroadcastToTabs({ type: 'CF_PASSED', url: liveUrl, steamId: sid });
            }
            sendResponse({ success: true, data: finalData });
            if (senderTabId) {
                
                Promise.resolve(csstatsTabRoleFor(senderTabId))
                    .then((role) => { if (role) return csstatsGateFailNote(sid, !!(finalData && finalData.auth_gated)); })
                    .catch(() => { });
                
                if (typeof csstatsTabCloseAfterSync === 'function') {
                    Promise.resolve(csstatsTabCloseAfterSync(senderTabId)).catch(() => { });
                }
            } else {
                
                Promise.resolve(csstatsPendingTake(sid)).then((entry) => {
                    if (!entry) return;
                    csstatsGateFailNote(sid, !!(finalData && finalData.auth_gated));
                    if (entry.carrier && !entry.userVisible) csstatsCarrierClose(entry.carrier);
                    csstatsBackfillNote('closed', sid, 'after-claim');
                }).catch(() => { });
            }
        };

        cacheGet(cacheKey).then((prevEntry) => {
            const merged = (typeof mergeCSStatsData === 'function')
                ? mergeCSStatsData(prevEntry && prevEntry.data, data)
                : data;
            finish(merged);
        }).catch(() => finish(data));
        return true;
    }
    if (request.type === "CLOSE_CURRENT_TAB") {
        if (sender && sender.tab && sender.tab.id) {
            try {
                chrome.tabs.remove(sender.tab.id, () => { void chrome.runtime.lastError; });
            } catch (e) {  }
        }
        sendResponse({ success: true });
        return true;
    }
    if (request.type === "FETCH_INVENTORY_PREVIEW") {

        chrome.storage.sync.get({
            sps_inv_source: 'steam', sps_language: 'zh', sps_csqaq_plat: '1', sps_steamdt_plat: 'buff'
        }, (settings) => {
            fetchCS2InventoryPreview(request.steamId,  ( (settings)))
                .then(data => sendResponse( ({ success: true, data })));
        });
        return true;
    }

    if (request.type === "FETCH_INVENTORY") {
        
        chrome.storage.sync.get({
            sps_inv_source: 'steam', sps_language: 'zh',
            sps_csqaq_plat: '1',
            sps_steamdt_plat: 'buff',
            sps_float_source: 'bymykel',   
            sps_show_topitems: true,
            sps_show_phase: true,  
            sps_top12_threshold: 10000,   
            sps_mkt_query_limit: 50,      
            sps_link_source: 'auto'       
        }, (settings) => {
            chrome.storage.local.get({ sps_steamdt_key: '', sps_csqaq_key: '' }, (lt) => {
                const merged = Object.assign(settings, lt);

                const sid = request.steamId;
                const mkey = invFinalKey(sid, merged);
                const recent = _invFinalRecent.get(mkey);
                if (recent && Date.now() - recent.ts < INV_FINAL_REUSE_MS) {
                    addLog(`[Inv] Final result reuse (15s) for ${mkey}`);
                    sendResponse({ success: true, data: recent.data });
                    return;
                }
                let answered = false;
                const fallback = () => {
                    if (answered) return;
                    answered = true;
                    try { sendResponse({ success: true, data: { item_count: -1, total_value: "-", error: "Rate Limited", pendingTotal: true, pendingCount: 0 } }); } catch (e) {  }
                };
                const guardTimer = setTimeout(fallback, 40000);
                const finish = (data) => {
                    clearTimeout(guardTimer);
                    if (!answered) { answered = true; sendResponse({ success: true, data }); }
                };
                const existing = _invFinalInflight.get(mkey);
                if (existing && !request.force) { existing.then(finish).catch(() => {}); return; }   
                const p = fetchCS2Inventory(sid, merged, !!request.force).then(data => {

                    if (data && !data.error && !data.pendingTotal) _invFinalRecent.set(mkey, { data, ts: Date.now() });
                    return data;
                }).finally(() => { if (_invFinalInflight.get(mkey) === p) _invFinalInflight.delete(mkey); });
                _invFinalInflight.set(mkey, p);
                
                if (request.force) {
                    _invFinalRecent.delete(mkey);
                    p.then(finish).catch(() => {});
                } else {
                    p.then(finish).catch(() => {});
                }
            });
        });
        return true;
    }

    if (request.type === "BIND_CSQAQ_IP") {
        bindCSQAQIP(request.apiKey).then(data => sendResponse({ success: true, data: data }));
        return true;
    }
    if (request.type === "CHECK_CSQAQ_IP") {
        checkAndBindCSQAQ(request.apiKey).then(data => sendResponse({ success: true, data: data }));
        return true;
    }

    if (request.type === "CLEAR_CACHE_DOMAIN") {
        const domain = String(request.domain || '');
        const domainRes = {
            INV: /^sps_cache_inv/,                          
            FACEIT: /^sps_cache_faceit/,                    
            LEETIFY: /^sps_cache_leetify/,                  
            CSSTATS: /^sps_cache_csstats/,                  
            PW: /^sps_cache_pw/,                            
            F5E: /^sps_cache_f5e/,                          
            ZH: /^sps_cache_(zhname|zhdesc)/,               

            PRICES: /^sps_cache_(sdtp_|cqp_|po_|bq_|gd_|mkt_)/
        };
        const re = domainRes[domain];
        if (!re) { sendResponse( ({ success: false, error: 'UNKNOWN_DOMAIN' })); return true; }
        chrome.storage.local.get(null, (items) => {
            const keys = Object.keys(items || {}).filter(( k) => re.test(k));
            for (const k of keys) cacheDel(k);

            if (domain === 'ZH') {
                if (typeof zhNameResetForCacheClear === 'function') zhNameResetForCacheClear();
                if (typeof phaseResetForCacheClear === 'function') phaseResetForCacheClear();
            }
            addLog(`[Cache] domain clear ${domain}: ${keys.length} keys`);
            sendResponse( ({ success: true, cleared: keys.length, domain }));
        });
        return true;
    }
    
    if (request.type === "SPS_CACHE_STATS") {
        const agg = () => {
            chrome.storage.local.get(null, (items) => {
                const domains = { INV: 0, FACEIT: 0, LEETIFY: 0, CSSTATS: 0, PW: 0, ZH: 0, PRICES: 0, F5E: 0, OTHER: 0 };
                const domainBytes = { INV: 0, FACEIT: 0, LEETIFY: 0, CSSTATS: 0, PW: 0, ZH: 0, PRICES: 0, F5E: 0, OTHER: 0 };
                for (const [k, v] of Object.entries(items || {})) {
                    if (!k.startsWith(CACHE_KEY_PREFIX)) continue;
                    const d = /^sps_cache_inv/.test(k) ? 'INV'
                        : /^sps_cache_faceit/.test(k) ? 'FACEIT'
                        : /^sps_cache_leetify/.test(k) ? 'LEETIFY'
                        : /^sps_cache_csstats/.test(k) ? 'CSSTATS'
                        : /^sps_cache_pw/.test(k) ? 'PW'
                        : /^sps_cache_f5e/.test(k) ? 'F5E'
                        : /^sps_cache_(zhname|zhdesc)/.test(k) ? 'ZH'
                        
                        : /^sps_cache_(sdtp_|cqp_|po_|bq_|gd_|mkt_)/.test(k) ? 'PRICES' : 'OTHER';
                    domains[d]++;
                    try { domainBytes[d] += JSON.stringify(v || '').length; } catch (e0) {  }
                }
                sendResponse( ({ success: true, stats: { totalBytes: lastBytes, quotaBytes: 10 * 1024 * 1024, domains, domainBytes } }));
            });
        };
        let lastBytes = 0;
        if (chrome.storage.local.getBytesInUse) {
            try { chrome.storage.local.getBytesInUse(null, (b) => { lastBytes = typeof b === 'number' ? b : 0; agg(); }); }
            catch (e) { agg(); }
        } else agg();
        return true;
    }
    if (request.type === "CLEAR_CACHE") {

        cacheClearAll('user CLEAR_CACHE').then((n) => {

            _invFinalRecent.clear();
            _invFinalInflight.clear();
            _pwStatsInflight.clear();   
            _f5eStatsInflight.clear();   
            if (typeof _invSwrBusy !== 'undefined' && _invSwrBusy && typeof _invSwrBusy.clear === 'function') _invSwrBusy.clear();   
            for (const k of Object.keys(_invPendingSince)) delete _invPendingSince[k];
            if (typeof invResetForCacheClear === 'function') invResetForCacheClear();   
            if (typeof steamdtResetRateLimitsForCacheClear === 'function') steamdtResetRateLimitsForCacheClear();
            if (typeof csqaqResetRateLimitsForCacheClear === 'function') csqaqResetRateLimitsForCacheClear();   
            
            if (typeof csstatsCarrierCapsReset === 'function') csstatsCarrierCapsReset();
            try { chrome.storage.session.remove([CSSTATS_BUCKET_KEY, CSSTATS_BACKOFF_KEY, CSSTATS_CAPS_KEY, CSSTATS_GATE_KEY], () => { void chrome.runtime.lastError; }); } catch (e) {  }
            sendResponse({ success: true, cleared: n });
        });
        return true;
    }
    if (request.type === "TRIGGER_CSQAQ_BIND") {
        chrome.storage.local.get({ sps_csqaq_key: '' }, (ss) => {
            if (ss.sps_csqaq_key) bindCSQAQIP(ss.sps_csqaq_key);
        });
        sendResponse({ success: true });
        return true;
    }
    if (request.type === "FETCH_PW_STATS") {
        chrome.storage.sync.get({ sps_cache_ttl: 5, sps_pw_base_seasons: 25 }, ( s) => {
            const cacheTTL = (parseInt(s.sps_cache_ttl) || 5) * 60000;

            const cacheKey = CACHE_KEY_PREFIX + 'pw7_' + request.steamId;

            const pwOp = cacheBeginOp();
            cacheGet(cacheKey).then(( cached) => {

                if (cached && cached.data && (Date.now() - cached.ts < (cached.ttl || cacheTTL))) {
                    const cd = cached.data;
                    
                    const valid = (cd.error && cached.ttl) ||
                        (cd.success === true && cd.phase2 !== true && !cd.error);
                    if (!valid) {
                        addLog(`[PW] Cache invalid (success=${!!cd.success} phase2=${!!cd.phase2} error=${!!cd.error}) for ${request.steamId}, refetch`);
                        cacheDel(cacheKey);   
                    } else {
                        addLog(`[PW] Cache hit for ${request.steamId}`);
                        sendResponse({ success: true, data: cd });
                        return;
                    }
                }

                const sid = request.steamId;
                const existing = _pwStatsInflight.get(sid);
                if (existing) {
                    existing.subs.push({ tabId: sender && sender.tab && sender.tab.id != null ? sender.tab.id : null });
                    existing.p.then(( data) => { sendResponse({ success: true, data }); }).catch(() => {});
                    return;
                }
                
                const slot = { subs: [], p:  (null) };

                const deliverPhase2 = ( phase2) => {

                    if (pwOp !== cacheCurrentEpoch()) return;
                    const msg = { type: 'PW_STATS_PHASE2', steamId: sid, data: phase2 };
                    let broadcastSent = false;
                    for (const sub of slot.subs) {
                        if (sub.tabId != null) {
                            try { chrome.tabs.sendMessage(sub.tabId, msg).catch(() => {}); } catch (e0) {  }
                        } else if (!broadcastSent) {
                            broadcastSent = true;
                            try { chrome.runtime.sendMessage(msg).catch(() => {}); } catch (e0) {  }
                        }
                    }
                };
                const releaseSlot = () => {
                    setTimeout(() => { if (_pwStatsInflight.get(sid) === slot) _pwStatsInflight.delete(sid); }, 0);
                };
                slot.p = new Promise((resolve) => {
                    fetchPWStats(sid, s.sps_pw_base_seasons, ( phase2) => {
                        
                        deliverPhase2(phase2);
                        releaseSlot();   

                        if (phase2 && !phase2.error) {
                            cacheGet(cacheKey).then(( cur) => {
                                const base = (cur && cur.data) || null;
                                const merged = (base && base.phase2) ? Object.assign({}, base, phase2, { phase2: false }) : Object.assign({}, phase2, { phase2: false });

                                merged.success = true;
                                merged.phase2 = false;
                                if (!merged.name && base) merged.name = base.name;
                                if (!merged.avatar && base) merged.avatar = base.avatar;
                                if (!merged.summary && base) merged.summary = base.summary;
                                cacheSet(cacheKey, { data: merged }, { epoch: pwOp, broadcast: true });
                            });
                        } else if (phase2 && phase2.error) {

                            cacheSet(cacheKey, { data: { error: phase2.error } }, { ttl: 30000, epoch: pwOp });
                        }
                    }).then(( data) => {

                        if (data && data.success && data.phase2 !== true) {
                            cacheSet(cacheKey, { data }, { epoch: pwOp });
                        }
                        resolve(data);
                    }).catch(( e0) => {
                        releaseSlot();   
                        resolve({ error: 'PW_PIPE_FAILED' });
                    });
                });
                slot.subs.push({ tabId: sender && sender.tab && sender.tab.id != null ? sender.tab.id : null });
                _pwStatsInflight.set(sid, slot);

                const leakTimer =  (setTimeout(() => { if (_pwStatsInflight.get(sid) === slot) _pwStatsInflight.delete(sid); }, 120e3));
                if (typeof leakTimer.unref === 'function') leakTimer.unref();   
                slot.p.then(( data) => { sendResponse({ success: true, data }); }).catch(() => {});
            });
        });
        return true;
    }
    if (request.type === "FETCH_PW_SEASON") {
        chrome.storage.sync.get({ sps_cache_ttl: 5 }, ( s) => {
            const cacheTTL = (parseInt(s.sps_cache_ttl) || 5) * 60000;
            const cacheKey = CACHE_KEY_PREFIX + 'pwse_' + request.steamId + '_' + request.seasonId;
            const pwOp = cacheBeginOp();   

            cacheGetVersioned(cacheKey, PW_SEASON_SHAPE, {
                ttl: cacheTTL,
                valid: ( d) => !!(d && d.success && d.name != null && d.cnt != null)
            }).then(( hit) => {
                if (hit) { sendResponse({ success: true, data: hit }); return; }
                fetchPWSeasonData(request.steamId, request.seasonId).then(data => {
                    if (data && data.success) {
                        cacheSetVersioned(cacheKey, data, PW_SEASON_SHAPE, { epoch: pwOp });
                    }
                    sendResponse({ success: true, data: data });
                }).catch(( e0) => {
                    addLog(`[PW] Season pipe failed: ${e0 && e0.message ? e0.message : e0}`);
                    sendResponse({ success: false, error: 'PW_PIPE_FAILED' });   
                });
            });
        });
        return true;
    }
    if (request.type === "CLEAR_PW_CACHE") {
        chrome.storage.local.get(null, ( items) => {
            const sid = String(request.steamId || '');
            const keys = Object.keys(items).filter(k =>
                k.startsWith(CACHE_KEY_PREFIX + 'pw') &&
                (!sid || k.includes(sid))
            );

            const keySet = new Set(keys);
            if (sid) {
                const mids = new Set();
                for (const k of keys) {
                    if (!k.startsWith(CACHE_KEY_PREFIX + 'pwml')) continue;
                    const rows = (items[k] && items[k].data && Array.isArray(items[k].data.rows)) ? items[k].data.rows : [];
                    for (const r of rows) { const mid = String((r && r.matchId) || ''); if (mid) mids.add(mid); }
                }
                for (const mid of mids) {
                    for (const pre of PW_MATCH_SCOPED_PREFIXES) {
                        const k2 = CACHE_KEY_PREFIX + pre + mid;
                        if (items[k2] && !keySet.has(k2)) keySet.add(k2);
                    }
                }
            }
            const allKeys = [...keySet];
            
            for (const k of allKeys) cacheDel(k);

            _pwStatsInflight.clear();
            sendResponse({ success: true, cleared: allKeys.length });
        });
        return true;
    }
    if (request.type === "FETCH_PW_BAN") {
        chrome.storage.sync.get({ sps_cache_ttl: 5 }, ( s) => {
            const cacheTTL = (parseInt(s.sps_cache_ttl) || 5) * 60000;
            const cacheKey = CACHE_KEY_PREFIX + 'pwb_' + request.steamId;
            cacheGet(cacheKey).then(( wrapper) => {
                if (wrapper && (Date.now() - wrapper.ts < cacheTTL)) {
                    addLog(`[PW] Ban cache hit for ${request.steamId}`);
                    sendResponse({ success: true, data: wrapper.data });
                    return;
                }

                fetchPWBanShared(request.steamId, cacheTTL).then(data => {
                    sendResponse({ success: true, data });
                });
            });
        });
        return true;
    }
    if (request.type === "SEARCH_PW_USER") {
        searchPWUser(request.keyword).then(data => sendResponse({ success: true, data: data }));
        return true;
    }

    if (request.type === "VERIFY_PW_TOKEN") {
        const c = pwDetailCreds(request);
        verifyPWCreds(c.token, c.mySteamId).then(( data) => {
            
            if (data && data.success) {
                chrome.storage.local.set({ sps_pw_verify: { ok: true, checkedAt: Date.now(), nickname: data.nickname || '' } });
            } else {
                chrome.storage.local.set({ sps_pw_verify: { ok: false, checkedAt: Date.now(), error: (data && data.error) || 'INVALID' } });
            }
            sendResponse({ success: !data.error, data });
        });
        return true;
    }
    if (request.type === "PW_TOKEN_STATUS") {

        chrome.storage.sync.get({ sps_pw_detail: false, ...pwSidKeys() }, ( s) => {
            chrome.storage.local.get({ sps_pw_token: '', sps_pw_verify: null }, ( l) => {
                
                const c0 = pwDetailCreds({ ...s, ...l });
                const token = c0.token;
                const mySteamId = c0.mySteamId;
                if (!token || !mySteamId) { sendResponse({ success: true, data: { configured: false } }); return; }
                const rec = l.sps_pw_verify && typeof l.sps_pw_verify === 'object' ? l.sps_pw_verify : null;
                const stale = !rec || (Date.now() - (rec.checkedAt || 0) > 12 * 3600 * 1000);
                if (!stale) {
                    sendResponse({ success: true, data: { configured: true, valid: !!rec.ok, nickname: rec.nickname || '', error: rec.error || '', checkedAt: rec.checkedAt || 0 } });
                    return;
                }
                verifyPWCreds(token, mySteamId).then(( data) => {
                    const out = { ok: !!(data && data.success), checkedAt: Date.now(), nickname: (data && data.nickname) || '', error: (data && !data.success && data.error) || '' };
                    chrome.storage.local.set({ sps_pw_verify: out });
                    sendResponse({ success: true, data: { configured: true, valid: out.ok, nickname: out.nickname, error: out.error, checkedAt: out.checkedAt } });
                });
            });
        });
        return true;
    }

    if (request.type === "PW_TOKEN_CAPTURE") {
        pwCaptureToken(request.token, request.steamid, request.source).then(( r) => sendResponse(r));
        return true;
    }
    if (request.type === "PW_STEAMID_HINT") {

        pwNoteMySteamId(String(request.steamid || '')).then(( id) => sendResponse({ success: true, mySteamId: id || '' }));
        return true;
    }
    if (request.type === "PW_TOKEN_CLEAR") {

        chrome.storage.local.set({ sps_pw_token: '', sps_pw_verify: null }, () => {
            addLog('[PW] 登录凭证已清除（设置页）');
            sendResponse({ success: true });
        });
        return true;
    }
    if (request.type === "PW_CAPTURE_PING") {

        const shape = [];
        if (request.route) shape.push('route=' + String(request.route).slice(0, 40));
        if (Array.isArray(request.keys) && request.keys.length) shape.push('fragKeys=' + request.keys.slice(0, 8).map(( k) => String(k).slice(0, 24)).join(','));
        if (request.why) shape.push('why=' + String(request.why).slice(0, 12));
        addLog(`[PW] 捕获探针命中 partner 页 page=${String(request.page || '').slice(0, 80)}${shape.length ? ' ' + shape.join(' ') : ''}`);
        sendResponse({ success: true });
        return true;
    }
    if (request.type === "FETCH_PW_MATCHLIST") {

        chrome.storage.sync.get({ sps_cache_ttl: 5, sps_pw_detail: false, ...pwSidKeys() }, ( s) => {
            chrome.storage.local.get({ sps_pw_token: '' }, ( l) => {
                const c = pwDetailCreds({ ...s, ...l });
                if (!s.sps_pw_detail) { sendResponse({ success: false, data: { error: 'PW_DETAIL_OFF', reason: '开关未开启' } }); return; }
                if (!c.token || !c.mySteamId) { sendResponse({ success: false, data: { error: 'PW_DETAIL_OFF', reason: '凭证未配置' } }); return; }
                const cacheTTL = (parseInt(s.sps_cache_ttl) || 5) * 60000;

                const cacheKey = CACHE_KEY_PREFIX + 'pwml8_' + request.steamId + '_' + request.seasonId + '_' + (request.page || 1);
                cacheGet(cacheKey).then(( entry) => {
                    if (entry && (Date.now() - entry.ts < cacheTTL)) { sendResponse({ success: true, data: entry.data }); return; }
                    const digits = ( v) => String(v || '').replace(/\D/g, '');
                    const cands = [c.mySteamId, l.sps_pw_mysteamid, s.sps_pw_mysteamid, s.sps_pw_my_steamid, s.sps_my_steamid, request.steamId]
                        .map(digits).filter((v, i, a) => v && /^7656119\d{10}$/.test(v) && a.indexOf(v) === i);
                    fetchPWMatchList(c.token, c.mySteamId, String(request.steamId), String(request.seasonId || 'recent'), request.page, { sidCandidates: cands })
                        .then(( data) => {
                            if (data && data.success && Array.isArray(data.rows) && data.rows.length) cacheSet(cacheKey, { data });
                            else if (data && data.officialSummary) cacheSet(cacheKey, { data });   
                            sendResponse({ success: !data.error, data });
                        });
                });
            });
        });
        return true;
    }

    if (request.type === "FETCH_PW_MATCHDETAILS") {
        chrome.storage.sync.get({ sps_pw_detail: false, ...pwSidKeys() }, ( s) => {
            chrome.storage.local.get({ sps_pw_token: '' }, ( l) => {
                const c = pwDetailCreds({ ...s, ...l });

                const ids = Array.isArray(request.matchIds) ? request.matchIds.map(String).filter(Boolean).slice(0, 30) : [];
                if (!ids.length) { sendResponse({ success: true, data: { details: {} } }); return; }
                
                const keys = ids.map(( id) => CACHE_KEY_PREFIX + 'pwmd_' + id);
                chrome.storage.local.get(keys, ( stored) => {
                    const details = {};
                    const miss = [];
                    ids.forEach(( id) => {
                        const e = stored[CACHE_KEY_PREFIX + 'pwmd_' + id];

                        if (cacheEntryValid(e, PW_MD_SHAPE, { ttl: 24 * 3600e3, valid: ( d) => !!(d && d.adr > 0) })) details[id] = e.data;
                        else miss.push(id);
                    });
                    const go = async () => {
                        if (!miss.length) { sendResponse({ success: true, data: { details } }); return; }
                        const r = await fetchPWMatchDetails(c.token, c.mySteamId, String(request.steamId), miss);
                        for (const id of Object.keys(r.details || {})) {
                            details[id] = r.details[id];
                            cacheSetVersioned(CACHE_KEY_PREFIX + 'pwmd_' + id, r.details[id], PW_MD_SHAPE);
                        }
                        sendResponse({ success: true, data: { details } });
                    };
                    if (miss.length) {
                        
                        const tag = miss[0] + '_' + miss.length;
                        if (_pwMdInflight.has(tag)) { _pwMdInflight.get(tag).then(go); return; }
                        const p = fetchPWMatchDetails(c.token, c.mySteamId, String(request.steamId), miss);
                        _pwMdInflight.set(tag, p);
                        p.finally(() => _pwMdInflight.delete(tag));
                    }
                    go();
                });
            });
        });
        return true;
    }
    if (request.type === "FETCH_PW_ROSTER") {

        (async () => {
            try {
                const roster = await fetchPWRoster(String(request.matchId || ''));
                let out = roster;
                if (roster) {

                    const s = await new Promise(r => chrome.storage.sync.get(pwSidKeys(), r));
                    const l = await new Promise(r => chrome.storage.local.get({ sps_pw_token: '', ...pwSidKeys() }, r));
                    const c = pwDetailCreds({ ...s, ...l });
                    const expired = pwIsDemoExpired(roster.startTime || roster.endTime);
                    out = { ...roster, matchId: String(request.matchId || roster.matchId || ''), demoReady: !!(c.token && c.mySteamId), demoExpired: expired };
                }
                sendResponse({ success: true, data: out || { error: 'NO_ROSTER' } });
            } catch (e0) {
                sendResponse({ success: false, error: 'PW_ROSTER_FAILED' });
            }
        })();
        return true;
    }
    if (request.type === "PW_DEMO_LINK") {

        const mtime = request.matchTime;
        if (pwIsDemoExpired(mtime)) {
            sendResponse({ success: true, resolved: false, code: 'EXPIRED', expired: true, matchTime: mtime });
            return true;
        }

        chrome.storage.sync.get(pwSidKeys(), ( s) => {
            chrome.storage.local.get({ sps_pw_token: '', ...pwSidKeys() }, ( l) => {
                const c = pwDetailCreds({ ...s, ...l });
                if (!c.token || !c.mySteamId) { sendResponse({ success: false, error: 'NO_TOKEN' }); return; }

                const digits = ( v) => String(v || '').replace(/\D/g, '');
                const cands = [l.sps_pw_mysteamid, l.sps_pw_my_steamid, s.sps_pw_mysteamid, s.sps_pw_my_steamid,
                    s.sps_my_steamid, request.steamId]
                    .map(digits).filter((v, i, a) => v && a.indexOf(v) === i);
                pwDemoLink(String(request.matchId || ''), { ...c, sidCandidates: cands, matchTime: mtime }, request.cupId || 0, !!request.open, mtime)
                    .then(( r) => sendResponse(r));
            });
        });
        return true;
    }

    if (request.type === __S_background_message_js(0)) {

        f5eScanJwtCookie().then(( jwt) => {
            if (jwt) {

                f5eStoreTokenIfChanged(jwt);
                sendResponse({ success: true, token: jwt, source: 'cookie' });
                return;
            }
            chrome.storage.local.get({ sps_f5e_token: '' }, ( d) => {
                sendResponse({ success: true, token: String(d[__S_background_message_js(4)] || ''), source: d[__S_background_message_js(4)] ? 'storage' : 'none' });
            });
        }).catch(() => {
            sendResponse({ success: true, token: '', source: 'none' });
        });
        return true;
    }
    if (request.type === "FETCH_F5E_STATS") {

        chrome.storage.sync.get({ sps_cache_ttl: 5 }, ( s) => {
            const cacheTTL = (parseInt(s.sps_cache_ttl) || 5) * 60000;

            const cacheKey = CACHE_KEY_PREFIX + 'f5e9_' + request.steamId + (request.domain ? '@' + request.domain : '');
            const f5eOp = cacheBeginOp();   
            cacheGet(cacheKey).then(( entry) => {

                if (entry && entry.data && (Date.now() - entry.ts < (entry.ttl || cacheTTL))) {
                    const cd = entry.data;

                    const valid = (cd.error && entry.ttl) ||
                        (cd.success === true && cd.phase2 !== true && !cd.error && cd.shape === F5E_OVERVIEW_SHAPE);
                    if (!valid) {
                        addLog(`[F5E] Cache invalid (success=${!!cd.success} phase2=${!!cd.phase2} error=${!!cd.error}) for ${request.steamId}, refetch`);
                        cacheDel(cacheKey);
                    } else {
                        addLog(`[F5E] Cache hit for ${request.steamId}`);
                        sendResponse({ success: true, data: cd });
                        return;
                    }
                }
                
                const slotKey = String(cacheKey);
                const existing = _f5eStatsInflight.get(slotKey);
                if (existing) {
                    existing.subs.push({ tabId: sender && sender.tab && sender.tab.id != null ? sender.tab.id : null });
                    existing.p.then(( data) => { sendResponse({ success: true, data }); }).catch(() => {});
                    return;
                }
                
                const slot = { subs: [], p:  (null) };

                const deliverPhase2 = ( phase2) => {
                    
                    if (f5eOp !== cacheCurrentEpoch()) return;

                    const gateKey = request.domain ? 'd:' + request.domain : String(request.steamId);
                    const msg = { type: 'F5E_STATS_PHASE2', key: gateKey, steamId: request.steamId, data: phase2 };
                    let broadcastSent = false;
                    for (const sub of slot.subs) {
                        if (sub.tabId != null) {
                            try { chrome.tabs.sendMessage(sub.tabId, msg).catch(() => {}); } catch (e0) {  }
                        } else if (!broadcastSent) {
                            broadcastSent = true;
                            try { chrome.runtime.sendMessage(msg).catch(() => {}); } catch (e0) {  }
                        }
                    }
                };
                const releaseSlot = () => {
                    setTimeout(() => { if (_f5eStatsInflight.get(slotKey) === slot) _f5eStatsInflight.delete(slotKey); }, 0);
                };
                slot.p = new Promise((resolve) => {

                    const seasonCacheWrite = ( uid,  season,  det,  ttl) => {
                        if (f5eOp !== cacheCurrentEpoch()) return;   

                        cacheSetVersioned(CACHE_KEY_PREFIX + 'f5es9_' + uid + '_' + season, det, F5E_SEASON_SHAPE, { epoch: f5eOp, ttl });
                    };
                    fetchF5eStatsWithToken(request.steamId, request.domain || undefined, ( phase2) => {
                        
                        deliverPhase2(phase2);
                        releaseSlot();

                        if (phase2 && !phase2.error) {
                            cacheGet(cacheKey).then(( cur) => {
                                const base = (cur && cur.data) || null;
                                const merged = (base && base.phase2) ? Object.assign({}, base, phase2, { phase2: false }) : Object.assign({}, phase2, { phase2: false });
                                merged.success = true;
                                merged.phase2 = false;
                                if (!merged.username && base) merged.username = base.username;
                                if (!merged.avatar && base) merged.avatar = base.avatar;
                                if (!merged.ban && base) merged.ban = base.ban;
                                if (!merged.uuid && base) merged.uuid = base.uuid;
                                if (!merged.elo && base) merged.elo = base.elo;
                                
                                if (merged.unranked === undefined && base) merged.unranked = base.unranked;
                                if (!merged.peakSeason && base) merged.peakSeason = base.peakSeason;
                                if (!merged.peakElo && base) merged.peakElo = base.peakElo;
                                if (!merged.peakLevelId && base) merged.peakLevelId = base.peakLevelId;
                                if (!merged.peakStarNum && base) merged.peakStarNum = base.peakStarNum;
                                if (!merged.levelId && base) merged.levelId = base.levelId;
                                merged.shape = F5E_OVERVIEW_SHAPE;
                                if (!merged.currentSeason && base) merged.currentSeason = base.currentSeason;   
                                if (!merged.advanced && base) merged.advanced = base.advanced;   
                                cacheSet(cacheKey, { data: merged }, { epoch: f5eOp, broadcast: true });
                            });
                        }
                    }, { seasonCacheWrite }).then(( data) => {

                        if (data && data.success && data.phase2 !== true) {
                            cacheSet(cacheKey, { data }, { epoch: f5eOp });
                        } else if (data && data.error === 'NOT_BINDDED') {
                            cacheSet(cacheKey, { data }, { ttl: 60000, epoch: f5eOp });
                        }
                        resolve(data);
                    }).catch(( e0) => {
                        releaseSlot();   
                        resolve({ error: 'F5E_PIPE_FAILED' });
                    });
                });
                slot.subs.push({ tabId: sender && sender.tab && sender.tab.id != null ? sender.tab.id : null });
                _f5eStatsInflight.set(slotKey, slot);
                
                const leakTimer =  (setTimeout(() => { if (_f5eStatsInflight.get(slotKey) === slot) _f5eStatsInflight.delete(slotKey); }, 120e3));
                if (typeof leakTimer.unref === 'function') leakTimer.unref();
                slot.p.then(( data) => { sendResponse({ success: true, data }); }).catch(() => {});
            });
        });
        return true;
    }
    if (request.type === "FETCH_F5E_BAN") {

        chrome.storage.sync.get({ sps_cache_ttl: 5 }, ( s) => {
            const cacheTTL = (parseInt(s.sps_cache_ttl) || 5) * 60000;
            const cacheKey = CACHE_KEY_PREFIX + 'f5eb_' + request.steamId;

            cacheGetVersioned(cacheKey, F5E_BAN_SHAPE, { ttl: cacheTTL }).then(( wrapper) => {
                if (wrapper && wrapper.success) {
                    addLog(`[F5E] Ban cache hit for ${request.steamId}`);
                    sendResponse({ success: true, data: wrapper });
                    return;
                }
                fetchF5eBanShared(request.steamId, cacheTTL).then(( data) => {
                    sendResponse({ success: true, data });
                }).catch(( e0) => {
                    addLog(`[F5E] Ban shared pipe failed: ${e0 && e0.message ? e0.message : e0}`);
                    sendResponse({ success: false, error: 'F5E_PIPE_FAILED' });   
                });
            });
        });
        return true;
    }
    if (request.type === "FETCH_F5E_SEASON") {

        chrome.storage.sync.get({ sps_cache_ttl: 5 }, ( s) => {
            const cacheTTL = (parseInt(s.sps_cache_ttl) || 5) * 60000;
            const cacheKey = CACHE_KEY_PREFIX + 'f5es9_' + (request.uuid || request.steamId) + '_' + request.season;
            const f5eOp = cacheBeginOp();

            cacheGetVersioned(cacheKey, F5E_SEASON_SHAPE, {
                ttl: cacheTTL,
                valid: ( d) => !!(d && d.success && Array.isArray(d.recentMatches))
            }).then(( hit) => {
                if (hit) { sendResponse({ success: true, data: hit }); return; }

                const ttl = request.season === request.currentSeason ? 30 * 60000 : 7 * 24 * 3600e3;
                fetchF5eSeasonData(request.steamId, request.season, request.uuid, undefined, request.beginUnix, request.endUnix).then(( data) => {
                    if (data && data.success) cacheSetVersioned(cacheKey, data, F5E_SEASON_SHAPE, { epoch: f5eOp, ttl });
                    sendResponse({ success: true, data });
                }).catch(( e0) => {
                    addLog(`[F5E] Season pipe failed: ${e0 && e0.message ? e0.message : e0}`);
                    sendResponse({ success: false, error: 'F5E_PIPE_FAILED' });   
                });
            });
        });
        return true;
    }
    if (request.type === "FETCH_F5E_MORE") {

        (async () => {
            try {
                const rows = await fetchF5eMatchPage(String(request.uuid || ''), undefined,
                    request.beginUnix, request.endUnix, request.page);

                const rawCount = Number(( (rows)).rawCount) || rows.length;
                sendResponse({ success: true, data: { season: String(request.season || ''), page: Math.max(1, parseInt(String(request.page || 1), 10) || 1), rows, rawCount } });
            } catch (e0) {
                sendResponse({ success: false, error: 'F5E_MORE_FAILED' });
            }
        })();
        return true;
    }
    if (request.type === "FETCH_F5E_KD") {

        (async () => {
            const tabId = sender && sender.tab && sender.tab.id != null ? sender.tab.id : null;
            _f5eKdProgressHook = ( prog) => {
                if (tabId == null) return;
                try { chrome.tabs.sendMessage(tabId, { type: 'F5E_KD_PROGRESS', season: String(request.season || ''), data: prog }).catch(() => {}); } catch (e0) {  }
            };
            try {
                const data = await fetchF5eSeasonKdSample(String(request.uuid || ''), undefined,
                    request.beginUnix, request.endUnix, request.seasonMatches);
                sendResponse(data);
            } catch (e0) {
                sendResponse({ success: false, error: 'F5E_KD_FAILED' });
            } finally {
                _f5eKdProgressHook = null;   
            }
        })();
        return true;
    }
    if (request.type === "FETCH_F5E_HS") {

        (async () => {

            const ids = Array.isArray(request.matchIds) ? request.matchIds.map(( x) => String(x)).filter(Boolean).slice(0, 30) : [];
            const uuid = String(request.uuid || '');
            if (!ids.length || !uuid) { sendResponse({ success: true, data: { hs: {} } }); return; }
            const keys = ids.map(( id) => CACHE_KEY_PREFIX + 'f5ehs_' + id);
            chrome.storage.local.get(keys, ( stored) => {
                const hs = {};
                const miss = [];
                ids.forEach(( id) => {
                    const e = stored[CACHE_KEY_PREFIX + 'f5ehs_' + id];

                    if (cacheEntryValid(e, F5E_HS_SHAPE, { ttl: 24 * 3600e3 })) hs[id] = e.data; else miss.push(id);
                });
                if (!miss.length) { sendResponse({ success: true, data: { hs } }); return; }

                let idx = 0;
                const worker = async () => {
                    while (idx < miss.length) {
                        const id = miss[idx++];
                        let v = null;
                        for (let attempt = 0; attempt < 2 && !v; attempt++) {
                            if (attempt) await new Promise(( r) => setTimeout(r, 400));
                            v = await ( (self)).fetchF5eMatchHs(id, uuid).catch(() => null);
                        }

                        if (v) {
                            hs[id] = v;
                            cacheSetVersioned(CACHE_KEY_PREFIX + 'f5ehs_' + id, v, F5E_HS_SHAPE);
                        }
                    }
                };
                Promise.all(Array.from({ length: Math.min(8, miss.length) }, () => worker())).then(() => sendResponse({ success: true, data: { hs } }));
            });
        })();
        return true;
    }
    if (request.type === "FETCH_F5E_ROSTER") {

        (async () => {
            try {
                const roster = await fetchF5eRoster(String(request.matchId || ''));
                sendResponse({ success: true, data: roster || { error: 'NO_ROSTER' } });
            } catch (e0) {
                sendResponse({ success: false, error: 'F5E_ROSTER_FAILED' });
            }
        })();
        return true;
    }
    if (request.type === "FETCH_F5E_ADVANCED") {

        (async () => {
            try {
                const jwt = await f5eGetJwt();
                const adv = await fetchF5eAdvanced(String(request.uuid || request.steamId || ''), jwt || '', String(request.season || ''));
                sendResponse({ success: !!adv, data: adv });
            } catch (e0) {
                sendResponse({ success: false, error: 'F5E_ADV_FAILED' });
            }
        })();
        return true;
    }
    if (request.type === "CLEAR_F5E_CACHE") {

        chrome.storage.local.get(null, ( items) => {

            const ov = request.steamId ? items[CACHE_KEY_PREFIX + 'f5e9_' + request.steamId] : null;
            const uuid = ov && ov.data && ov.data.uuid ? String(ov.data.uuid) : '';
            const keys = Object.keys(items).filter(k =>
                (k.startsWith(CACHE_KEY_PREFIX + 'f5e') || k.startsWith(CACHE_KEY_PREFIX + 'f5er')) &&
                (!request.steamId || k.includes(request.steamId) || (!!uuid && k.includes(uuid)) || k.endsWith('_roster') || k.includes('_ev'))
            );

            const keySet = new Set(keys);
            for (const gk of [CACHE_KEY_PREFIX + 'f5ecal_v1', CACHE_KEY_PREFIX + 'f5e_ev']) {
                if (items[gk] && !keySet.has(gk)) { cacheDel(gk); keySet.add(gk); }
            }

            {
                const mids = new Set();
                const grab = ( env) => {
                    const d = env && env.data ? env.data : null;
                    if (!d) return;
                    
                    const rows = [d.matches, d.recentMatches, d.rows].find((a) => Array.isArray(a)) || [];
                    for (const r of rows) { const mid = String((r && r.matchId) || ''); if (mid) mids.add(mid); }
                };
                if (ov) grab(ov);
                for (const k of keys) { if (k.startsWith(CACHE_KEY_PREFIX + 'f5es')) grab(items[k]); }
                for (const mid of mids) {
                    for (const pre of F5E_MATCH_SCOPED_PREFIXES) {
                        const k2 = CACHE_KEY_PREFIX + pre + mid;
                        if (items[k2] && !keySet.has(k2)) keySet.add(k2);
                    }
                }
            }
            const allKeys = [...keySet];
            if (typeof _f5eUsernameCache !== 'undefined' && _f5eUsernameCache && _f5eUsernameCache.clear) _f5eUsernameCache.clear();
            if (typeof _f5eResolveCache !== 'undefined' && _f5eResolveCache && _f5eResolveCache.clear) _f5eResolveCache.clear();
            for (const k of allKeys) cacheDel(k);
            _f5eStatsInflight.clear();
            _f5eBanInflight.clear();
            sendResponse({ success: true, cleared: allKeys.length });
        });
        return true;
    }
    if (request.type === "FETCH_F5E_CONTACT") {

        fetchF5eContact(request.steamId, request.uuid, request.domain).then(( data) => {
            sendResponse({ success: !!(data && data.success), data });
        }).catch(() => {
            sendResponse({ success: false, error: 'F5E_CONTACT_FAILED' });
        });
        return true;
    }
    if (request.type === "SEARCH_F5E_USER") {
        f5eSearchUser(request.keyword).then(data => sendResponse({ success: true, data: data }));
        return true;
    }
    if (request.type === __S_background_message_js(1)) {
        
        f5eReadToken().then(( token) => {
            let ok = false;
            try { ok = typeof chrome.cookies !== 'undefined' && !!chrome.cookies; } catch (e0) { ok = false; }
            const caps = (typeof f5eCaptureStats === 'function') ? f5eCaptureStats() : { bearer: 0, setCookie: 0 };
            f5eScanJwtDetailed().then(( s) => {
                sendResponse({ success: true, tokenPresent: !!token, tokenLen: token.length, cookiesApi: ok,
                    cookieScanHit: !!s.jwt, cookieScanLen: s.jwt ? s.jwt.length : 0,
                    cookieCount: s.total, cookieKnownNames: s.known, cookieJwtShaped: s.jwtShaped, cookiePartitioned: s.partitioned,
                    cookieApiErr: s.lastErr || '', extVersion: String(chrome.runtime.getManifest && chrome.runtime.getManifest().version || ''),
                    cookieAllCount: s.all, cookieCtrlCount: s.ctrl,
                    capturePing: (typeof f5eCapturePingStats === 'function') ? f5eCapturePingStats() : { n: -1, last: 0, censuses: [] },
                    bearerSeen: caps.bearer, setCookieSeen: caps.setCookie });
            }).catch(() => {
                sendResponse({ success: true, tokenPresent: !!token, tokenLen: token.length, cookiesApi: ok,
                    cookieScanHit: false, cookieScanLen: 0, cookieCount: -1, cookieKnownNames: [], cookieJwtShaped: 0, cookiePartitioned: 0,
                    cookieApiErr: 'scan threw', extVersion: String(chrome.runtime.getManifest && chrome.runtime.getManifest().version || ''),
                    cookieAllCount: -1, cookieCtrlCount: -1,
                    capturePing: (typeof f5eCapturePingStats === 'function') ? f5eCapturePingStats() : { n: -1, last: 0, censuses: [] },
                    bearerSeen: caps.bearer, setCookieSeen: caps.setCookie });
            });
        });
        return true;
    }
    if (request.type === "F5E_CAPTURE_PING") {

        if (typeof f5eCapturePing === 'function') { try { f5eCapturePing(request.census); } catch (e0) {  } }
        sendResponse({ success: true });
        return true;
    }
    if (request.type === __S_background_message_js(2)) {
        
        const t = String(request.token || '').trim();

        if (t && request.source === 'page_hook' && !/^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t)) {
            sendResponse({ success: true, stored: false });
            return true;
        }
        if (t && typeof f5ePageHookHit === 'function') { try { f5ePageHookHit(); } catch (e5) {  } }   
        
        f5eStoreTokenIfChanged(t).then(( wrote) => {
            sendResponse({ success: true, stored: !!t, changed: wrote });
        }).catch(() => sendResponse({ success: true, stored: !!t }));
        return true;
    }
    if (request.type === __S_background_message_js(3)) {
        chrome.storage.local.remove(__S_background_message_js(4), () => {
            
            if (typeof f5eResetJwtCache === 'function') { try { f5eResetJwtCache(); } catch (e0) {  } }
            sendResponse({ success: true });
        });
        return true;
    }
});

