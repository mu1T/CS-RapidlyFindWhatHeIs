async function getZhCacheTTL() {
    const { sps_zh_cache_ttl } = await new Promise(r => chrome.storage.sync.get({ sps_zh_cache_ttl: 1440 }, r));
    const minutes = parseInt(sps_zh_cache_ttl) || 1440;
    return Math.max(30, minutes) * 60e3;
}

let _zhV3Cleaned = false;

let _zhNetRetryUsed = false;
async function fetchZhDescMap(steamId, forceRefresh, needNames) {
    
    const cacheKey = CACHE_KEY_PREFIX + 'zhdesc_v4';
    if (!_zhV3Cleaned) { _zhV3Cleaned = true; chrome.storage.local.remove(CACHE_KEY_PREFIX + 'zhdesc_v3'); }   

    const zhOp = (typeof cacheBeginOp === 'function') ? cacheBeginOp() : undefined;
    const ttlMs = await getZhCacheTTL();

    const wrap = await (typeof cacheGet === 'function' ? cacheGet(cacheKey, { memoize: false }) : new Promise(r => chrome.storage.local.get(cacheKey, (d) => r(d[cacheKey]))));
    const cachedMap = (wrap && wrap.map) || {};
    const cacheFresh = wrap && wrap.ts && Date.now() - wrap.ts < ttlMs;
    
    const covered = Array.isArray(needNames) && needNames.length > 0 && needNames.every(n => !!cachedMap[n]);
    if (!forceRefresh && covered && cacheFresh) return cachedMap;
    
    if (wrap && wrap.ts && Date.now() - wrap.ts >= ttlMs) { if (typeof cacheDel === 'function') cacheDel(cacheKey); else chrome.storage.local.remove(cacheKey); }
    const map = cachedMap;
    const pullZh = async () => {

        if (typeof _steamInvBackoff !== 'undefined' && Date.now() < _steamInvBackoff.until) return map;
        const fetchPage = async ( url) => {
            try {
                const resp = await fetch(url, { headers: { 'Cache-Control': 'max-age=0' }, credentials: 'include' });
                let data = null, dataOk = false;
                try { data = await resp.json(); dataOk = true; } catch (e) {  }
                return { status: resp.status, ok: resp.ok, data, dataOk };
            } catch (e) { return null; }
        };

        const PAGE_SIZE = 2500, MAX_PAGES = 8, PAGE_GAP_MS = 450;
        
        const cursorOf = ( dd) => dd && dd.last_assetid
            ? String(dd.last_assetid)
            : ((dd && dd.assets && dd.assets.length) ? String(dd.assets[dd.assets.length - 1].assetid || '') : '');
        
        let acc = null;
        let netFail = false, firstStatus = 0;   
        for (let page = 0; page < MAX_PAGES; page++) {
            const url = page === 0
                ? `https://steamcommunity.com/inventory/${steamId}/730/2?l=schinese&count=${PAGE_SIZE}`
                : `https://steamcommunity.com/inventory/${steamId}/730/2?l=schinese&count=${PAGE_SIZE}&start_assetid=${acc.lastAssetid}`;
            const pd = await fetchPage(url);
            if (!pd) {
                if (page === 0) netFail = true;   
                break;
            }
            if (pd.status === 429) {
                
                try {
                    if (typeof _steamInvBackoff !== 'undefined') _steamInvBackoff.until = Date.now() + ((typeof STEAM_INV_BACKOFF_MS !== 'undefined') ? STEAM_INV_BACKOFF_MS : 60e3);
                } catch (eB) {  }
                if (page === 0) firstStatus = 429;
                break;
            }
            const d = pd.data;
            if (!d || !d.success || !Array.isArray(d.assets)) {
                if (page === 0) return { ok: pd.ok, status: pd.status, json: async () => d };   
                break;
            }
            if (!acc) {
                acc = { data: d, lastAssetid: cursorOf(d) };
            } else {
                if (!Array.isArray(acc.data.assets)) acc.data.assets = [];
                acc.data.assets.push(...d.assets);
                if (!Array.isArray(acc.data.descriptions)) acc.data.descriptions = [];
                if (Array.isArray(d.descriptions)) {
                    const seen = new Set(acc.data.descriptions.map(( x) => x && x.classid + '|' + x.instanceid));
                    for (const desc of d.descriptions) {
                        if (!desc) continue;
                        const k = desc.classid + '|' + desc.instanceid;
                        if (!seen.has(k)) { seen.add(k); acc.data.descriptions.push(desc); }
                    }
                }
                const cur = cursorOf(d);
                if (cur) acc.lastAssetid = cur;
            }
            
            if (!d.more_items || !acc.lastAssetid) break;
            if (page + 1 < MAX_PAGES) await new Promise(r => setTimeout(r, PAGE_GAP_MS));
        }
        if (!acc) {
            
            if (netFail) return { ok: false, status: 503, synthetic: true, json: async () => ({}) };
            return { ok: false, status: firstStatus || 503, json: async () => ({}) };
        }
        return { ok: true, status: 200, json: async () => acc.data };
    };
    try {
        let resp = await pullZh();

        if (!resp.ok && resp.synthetic && !_zhNetRetryUsed) {
            _zhNetRetryUsed = true;
            await new Promise(r => setTimeout(r, 1500));
            resp = await pullZh();
        }
        
        if (!resp.ok) return map;
        {
            
            const data = await resp.json();
            if (data && data.success && Array.isArray(data.descriptions)) {
                for (const d of data.descriptions) {
                    if (!d.market_hash_name) continue;
                    const desc = [];
                    let contents = null;
                    let inContents = false;
                    let itemset = '';   
                    if (Array.isArray(d.descriptions)) {
                        for (const sub of d.descriptions) {
                            const v = sub && typeof sub.value === 'string' ? sub.value.trim() : '';
                            if (!v || v.length > 600) continue;
                            if (/^(Exterior|外观)\s*:/i.test(v) || sub.name === 'sticker_info' || /sticker_info|印花\s*:/i.test(v)) continue;
                            
                            if (sub.name === 'keychain_info' || /keychain_info|挂件\s*:|印花板\s*[:：]/i.test(v)) continue;
                            if (sub.name === 'itemset_name' || /收藏品$|Collection$/i.test(v)) {
                                if (!itemset) itemset = v;
                                continue;
                            }
                            if (inContents) {
                                contents = contents || { items: [], rare: [] };
                                const rare = /极其稀有|Exceedingly Rare/i.test(v);
                                (rare ? contents.rare : contents.items).push(rare ? { n: v } : { n: v, r: sub.color || '' });
                                continue;
                            }
                            if (/包含下列|针对以下物品|购买报价|for the following|Contains one of the following/i.test(v)) { inContents = true; continue; }
                            if (desc.length < 5) desc.push({ v, c: sub.color || '' });
                        }
                    }
                    const tags = Array.isArray(d.tags) ? d.tags.map(t => (t && t.localized_tag_name) || '').filter(Boolean) : [];
                    let stickers = [];
                    const stiSub = d.descriptions.find(sub => sub.name === 'sticker_info');
                    if (stiSub) stickers = parseStickerInfo(stiSub.value).map(x => ({ ...x, n: x.n.replace(/^印花\s*:\s*/, '') }));
                    const kcSub = d.descriptions.find(sub => sub.name === 'keychain_info' || (sub && /keychain_info|挂件\s*:|印花板\s*[:：]/i.test(sub.value)));
                    
                    if (kcSub) stickers = stickers.concat(parseStickerInfo(kcSub.value).map(x => ({ ...x, n: x.n.replace(/^挂件\s*:\s*/, ''), kc: true })));
                    if (!itemset) {
                        const itemsetTag = Array.isArray(d.tags) ? d.tags.find(t => t && t.category === 'ItemSet') : null;
                        if (itemsetTag) itemset = String(itemsetTag.localized_tag_name || '');
                    }
                    const entry = {};
                    if (itemset) entry.itemset = itemset;
                    if (desc.length) entry.desc = desc;
                    if (contents) entry.contents = contents;
                    if (tags.length) entry.tags = tags;
                    if (stickers.length) entry.stickers = stickers;
                    if (Object.keys(entry).length) map[d.market_hash_name] = entry;
                }
                const MAX_ZH_ENTRIES = 4000;
                const ks = Object.keys(map);
                if (ks.length > MAX_ZH_ENTRIES) for (const k of ks.slice(0, ks.length - MAX_ZH_ENTRIES)) delete map[k];

                try {
                    const nmNames = Array.isArray(needNames) && needNames.length ? needNames : Object.keys(map);
                    const overlay = buildZhMarketOverlay(data);
                    const overlayOut = {};
                    for (const n of nmNames) if (overlay[n]) overlayOut[n] = overlay[n];
                    if (Object.keys(overlayOut).length) {
                        const ovKey = ZH_MARKET_NAME_KEY + steamId;

                        if (typeof cacheSet === 'function') cacheSet(ovKey, { map: overlayOut }, zhOp !== undefined ? { epoch: zhOp } : undefined);
                        else storageSetCache({ [ovKey]: { map: overlayOut, ts: Date.now() } });
                    }
                } catch (eOv) {  }
                
                if (typeof cacheSet === 'function') cacheSet(cacheKey, { map }, zhOp !== undefined ? { epoch: zhOp } : undefined);
                else storageSetCache({ [cacheKey]: { map, ts: Date.now() } });
            }
        }
    } catch (e) {  }
    return map;
}

