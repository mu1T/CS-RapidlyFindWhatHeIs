

const STEAMDT_PLATFORMS = {
    buff:  { code: 'buff',  label: 'BUFF' },
    uuyp:  { code: 'uuyp',  label: 'UUYP' },
    igxe:  { code: 'igxe',  label: 'IGXE' },
    c5:    { code: 'c5',    label: 'C5' },
    steam: { code: 'steam', label: 'Steam' },
};

function steamdtPlatformMatchers(code) {
    switch (code) {
        case 'uuyp': return ['YOUPIN', 'UUYP', 'YOUYOU', '悠悠有品'];
        case 'igxe': return ['IGXE'];
        case 'c5':   return ['C5'];
        case 'steam': return ['STEAM', '蒸汽平台'];
        case 'buff':
        default: return ['BUFF'];
    }
}

function steamdtPlatformItemUrl(platformCode, platformItemId, hashName) {
    const enc = encodeURIComponent(hashName || '');
    switch (platformCode) {
        case 'buff': return (platformItemId > 0) ? `https://buff.163.com/goods/${platformItemId}` : `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${enc}`;
        case 'c5': return `https://www.c5game.com/nvn/search?keyword=${enc}`;
        case 'igxe': return `https://www.igxe.cn/market/csgo?keyword=${enc}`;
        case 'uuyp': return (platformItemId > 0) ? `https://www.youpin898.com/goodsDetail?goodsId=${platformItemId}` : `https://www.youpin898.com/goods-list?marketHashName=${enc}`;
        case 'steam':
        default: return `https://steamcommunity.com/market/listings/730/${enc}`;
    }
}

let _steamdtLastBatchAt = 0;
const STEAMDT_BATCH_MIN_INTERVAL = 61e3;      
const STEAMDT_BATCH_SKIP_THRESHOLD = 5e3;    

let _steamdtLastSingleAt = 0;
const STEAMDT_SINGLE_MIN_INTERVAL = 1100;     
let _steamdtSingleCooldownUntil = 0;          
let _steamdtSingle429Streak = 0;              
const STEAMDT_SINGLE_COOLDOWN = 20e3;

const STEAMDT_COOLDOWN_ABANDON_MS = 8e3;
const STEAMDT_BATCH_RETRY_DELAY = 20e3;       
const STEAMDT_FIRST_PAINT_DRAIN_MS = 12e3;    

const STEAMDT_FIRST_PAINT_POLL_MS = 1200;     

async function steamdtAcquireBatchSlot() {
    const wait = STEAMDT_BATCH_MIN_INTERVAL - (Date.now() - _steamdtLastBatchAt);
    if (wait > 0) {
        if (wait > STEAMDT_BATCH_SKIP_THRESHOLD) return false;   
        await new Promise(r => setTimeout(r, wait));
    }
    _steamdtLastBatchAt = Date.now();
    return true;
}

let _steamdtSingleChain = Promise.resolve();
function steamdtAcquireSingleSlot() {
    const run = _steamdtSingleChain.then(async () => {
        for (;;) {
            const now = Date.now();
            const wait = Math.max(
                STEAMDT_SINGLE_MIN_INTERVAL - (now - _steamdtLastSingleAt),
                _steamdtSingleCooldownUntil - now
            );
            if (wait <= 0) break;
            await new Promise(r => setTimeout(r, wait));
        }
        _steamdtLastSingleAt = Date.now();
    });
    _steamdtSingleChain = run.catch(() => {});
    return run;
}

function pickSteamDTPlatformPrice(list, platformCode) {
    if (!Array.isArray(list) || !list.length) return null;
    const norm = (s) => String(s || '').toUpperCase();
    const matchers = steamdtPlatformMatchers(platformCode).map(norm);
    const priceOf = (p) => parseFloat(p && p.sellPrice != null ? p.sellPrice : (p ? p.price : null));
    let best = list.find(p => p && matchers.some(m => norm(p.platform).includes(m)) && priceOf(p) > 0);
    if (!best) best = list.find(p => p && priceOf(p) > 0) || null;
    if (!best) return null;
    const price = priceOf(best);
    if (!(price > 0)) return null;
    return { price, source: best.platform || '', sell: Number(best.sellPrice) || 0, buy: Number(best.biddingPrice) || 0, itemId: Number(best.platformItemId) || 0 };
}

const STEAMDT_PRICE_TTL = 30 * 60e3;
const STEAMDT_PRICE_FAIL_TTL = 5 * 60e3;
const STEAMDT_CACHE_PREFIX = CACHE_KEY_PREFIX + 'sdtp_';

async function steamdtReadPriceCache(names) {
    
    const out = {};
    if (!names || !names.length) return out;
    try {
        const keys = names.map(n => STEAMDT_CACHE_PREFIX + n);
        const store = await new Promise(r => chrome.storage.local.get(keys, d => r(d)));
        const now = Date.now();
        for (const n of names) {
            const wrap = store[STEAMDT_CACHE_PREFIX + n];
            if (!wrap || !wrap.ts || !Array.isArray(wrap.list)) continue;
            if (wrap.epoch !== undefined && wrap.epoch !== _steamdtCacheEpoch) continue;   
            const age = now - wrap.ts;
            if (wrap.list.length ? age < STEAMDT_PRICE_TTL : age < STEAMDT_PRICE_FAIL_TTL) out[n] = wrap.list;
        }
    } catch (e) {  }
    return out;
}

function steamdtWritePriceCache(map, epoch) {
    if (!map) return;
    const names = Object.keys(map);
    if (!names.length) return;
    const ep = (epoch === undefined) ? _steamdtCacheEpoch : epoch;
    if (ep !== _steamdtCacheEpoch) return;   
    try {
        
        const payload = {};
        const priced = [];
        const ts = Date.now();
        for (const n of names) {
            payload[STEAMDT_CACHE_PREFIX + n] = { ts, list: map[n] || [], epoch: ep };
            if ((map[n] || []).length) priced.push(n);   
        }
        storageSetCache(payload);
        
        if (typeof cacheNotifyPatches === 'function' && priced.length) cacheNotifyPatches('PRICES', 'steamdt', priced);
    } catch (e) {  }
}

const STEAMDT_BATCH_SIZE = 60;   

async function querySteamDTBatchPriceList(apiKey, hashNames) {
    const res = await fetchWithTimeout("https://open.steamdt.com/open/cs2/v1/price/batch", {
        method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ marketHashNames: hashNames })
    }, 15000);
    if (res.status === 429) throw new Error("429");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success === false) throw new Error("API False");
    if (!json.data) return {};
    const items = Array.isArray(json.data) ? json.data : Object.values(json.data);
    
    const map = {};
    for (const item of items) {
        const name = item.marketHashName || item.market_hash_name;
        if (!name) continue;
        map[name] = item.dataList || item.prices || [];
    }
    return map;
}

const STEAMDT_BASE_TTL = 24 * 3600e3;
const _steamdtBaseFail = { until: 0, ttl: 10 * 60e3 };

const _steamdtBaseMemo = { ts: 0, items: null };
let _steamdtBaseLegacyCleaned = false;

async function fetchSteamDTBaseInfo(apiKey) {
    if (!_steamdtBaseLegacyCleaned) {
        _steamdtBaseLegacyCleaned = true;
        try { chrome.storage.local.remove(CACHE_KEY_PREFIX + 'sdtbase_v1', () => {}); } catch (e) {  }
    }
    if (!apiKey) return null;
    if (_steamdtBaseMemo.items && Date.now() - _steamdtBaseMemo.ts < STEAMDT_BASE_TTL) return _steamdtBaseMemo.items;
    if (Date.now() < _steamdtBaseFail.until) return null;
    try {
        const res = await fetchWithTimeout('https://open.steamdt.com/open/cs2/v1/base?type=1', { headers: { 'Authorization': 'Bearer ' + apiKey } }, 20000);
        if (!res.ok) { _steamdtBaseFail.until = Date.now() + _steamdtBaseFail.ttl; return null; }
        const j = await res.json();
        if (!j || j.success === false || !j.data) { _steamdtBaseFail.until = Date.now() + _steamdtBaseFail.ttl; return null; }
        const raw = Array.isArray(j.data) ? j.data : Object.values(j.data);
        const items = [];
        for (const it of raw) {
            if (!it) continue;
            
            const name = it.marketHashName || it.market_hash_name || '';
            const paint = it.paintIndex !== undefined ? it.paintIndex : it.paint_index;
            const mn = it.minFloat !== undefined ? it.minFloat : it.min_float;
            const mx = it.maxFloat !== undefined ? it.maxFloat : it.max_float;
            if (!name || paint == null || mn == null || mx == null) continue;
            items.push({ name: String(name), paintIndex: Number(paint), minFloat: Number(mn), maxFloat: Number(mx) });
        }

        if (items.length < 200) { _steamdtBaseFail.until = Date.now() + _steamdtBaseFail.ttl; return null; }
        _steamdtBaseMemo.ts = Date.now();
        _steamdtBaseMemo.items = items;
        return items;
    } catch (e) {
        _steamdtBaseFail.until = Date.now() + _steamdtBaseFail.ttl;
        return null;
    }
}

function buildFloatTablesFromBase(items) {
    
    const paintAcc = {};
    
    const nameAcc = {};
    for (const s of items || []) {
        if (!s || s.paintIndex == null || s.minFloat == null || s.maxFloat == null) continue;
        paintAcc[String(s.paintIndex)] = [s.minFloat, s.maxFloat];
        const key = normSkinName(s.name);
        if (key && !nameAcc[key]) nameAcc[key] = { range: [s.minFloat, s.maxFloat] };
    }
    return { byName: nameAcc, byPaint: paintAcc };
}

async function querySteamDTSinglePriceList(apiKey, hashName) {
    await steamdtAcquireSingleSlot();
    const res = await fetchWithTimeout(`https://open.steamdt.com/open/cs2/v1/price/single?marketHashName=${encodeURIComponent(hashName)}`, {
        method: "GET", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
    }, 10000);
    if (res.status === 429) {

        _steamdtSingle429Streak++;
        const cooldown = Math.min(STEAMDT_SINGLE_COOLDOWN * _steamdtSingle429Streak, 60e3);
        _steamdtSingleCooldownUntil = Math.max(_steamdtSingleCooldownUntil, Date.now() + cooldown);
        throw new Error("429");
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    if (!json.success) throw new Error(`API False${json.msg ? ': ' + json.msg : ''}`);
    if (!json.data) return [];
    const raw = json.data;
    return raw.dataList || raw.prices || (Array.isArray(raw) ? raw : []);
}

async function steamdtGetPriceList(apiKey, name) {
    const ep = _steamdtCacheEpoch;   
    const cached = await steamdtReadPriceCache([name]);
    if (cached[name]) return cached[name];
    try {
        const list = await querySteamDTSinglePriceList(apiKey, name);
        steamdtWritePriceCache({ [name]: list }, ep);
        _steamdtSingle429Streak = 0;   
        return list;
    } catch (e) { return null; }
}

function steamdtRankNames(itemMap, inventoryData) {
    const COMMODITY_RE = /(Sticker|Case|Capsule|Patch|Graffiti|Collectible|Music Kit|Agent|Key|Souvenir Package|Name Tag|Sealed Graffiti|X-Ray P250)/i;
    const commodityByName = {};
    if (inventoryData && inventoryData.descriptions) {
        for (const d of inventoryData.descriptions) {
            if (d.market_hash_name && d.commodity !== undefined) commodityByName[d.market_hash_name] = !!d.commodity;
        }
    }
    return Object.keys(itemMap)
        .map(name => {
            const commodity = commodityByName[name] || COMMODITY_RE.test(name);
            let w = 0;
            if (name.startsWith('★')) w += 1000;                       
            if (/StatTrak/.test(name)) w += 300;
            if (/Gloves|Sleeves|(^| )Sport|Hydra/.test(name)) w += 120;
            if (!commodity && /\|/.test(name)) w += 100;               
            w += Math.min(itemMap[name] || 1, 40) * 0.3;
            return { name, commodity, w };
        })
        .sort((a, b) => (b.commodity - a.commodity) || (b.w - a.w))
        .map(e => e.name);
}

function steamdtStickerHashName(s) {
    const raw = String(s && s.n || '');
    const core = s && s.slab ? raw.replace(/^(?:Sticker\s*Slab|印花板)\s*[:：]\s*/i, '') : raw;
    const norm = core.replace(/\s*\|\s*/g, ' | ').replace(/\s+/g, ' ').trim();
    const cat = s && s.slab ? 'Sticker Slab | ' : /^(?:Sticker|Charm|Souvenir)\b/i.test(norm) ? '' : (s && s.kc ? 'Charm | ' : 'Sticker | ');
    return norm ? cat + norm : '';
}

const STEAMDT_STICKER_NAME_CAP = 60;

const _steamdtSinglesQueue = { names: [], enrolled: {}, running: false };

const steamdtSinglesFailCount = {};

let _steamdtCacheEpoch = 0;

function steamdtResetRateLimitsForCacheClear() {
    _steamdtCacheEpoch++;
    _steamdtSinglesQueue.names.length = 0;
    for (const k of Object.keys(_steamdtSinglesQueue.enrolled)) delete _steamdtSinglesQueue.enrolled[k];
    for (const k of Object.keys(steamdtSinglesFailCount)) delete steamdtSinglesFailCount[k];
    _steamdtLastBatchAt = 0;
    _steamdtLastSingleAt = 0;
    _steamdtSingleCooldownUntil = 0;
    _steamdtSingle429Streak = 0;
}

function steamdtEnqueueSingles(names, apiKey) {
    if (!apiKey || !names || !names.length) return;
    const q = _steamdtSinglesQueue;
    (async () => {
        
        const cached = await steamdtReadPriceCache(names);
        for (const name of names) {
            if (cached[name] !== undefined || q.enrolled[name]) continue;
            q.enrolled[name] = true;
            q.names.push(name);
        }
        if (q.names.length) steamdtStartSinglesConsumer(apiKey);
    })();
}

let _steamdtSinglesRestartTimer = 0;   
function steamdtStartSinglesConsumer(apiKey) {
    const q = _steamdtSinglesQueue;
    if (q.running) return;
    q.running = true;
    (async () => {
        try {
            for (;;) {

                const cooldownLeft = _steamdtSingleCooldownUntil - Date.now();
                if (cooldownLeft > STEAMDT_COOLDOWN_ABANDON_MS) {
                    addLog(`[SteamDT] singles stream paused: 429 cooldown ${Math.ceil(cooldownLeft / 1e3)}s, ${q.names.length} names queued → auto-restart`);
                    
                    clearTimeout(_steamdtSinglesRestartTimer);
                    const pollRestart = () => {
                        const left = _steamdtSingleCooldownUntil - Date.now();
                        if (left > 0) { clearTimeout(_steamdtSinglesRestartTimer); _steamdtSinglesRestartTimer = setTimeout(pollRestart, Math.min(left, 2000)); return; }
                        if (q.names.length && !q.running) steamdtStartSinglesConsumer(apiKey);
                    };
                    _steamdtSinglesRestartTimer = setTimeout(pollRestart, Math.min(cooldownLeft, 2000));
                    return;
                }
                const name = q.names.shift();
                if (!name) return;
                delete q.enrolled[name];
                const list = await steamdtGetPriceList(apiKey, name);   
                if (list === null) {

                    const failCount = (steamdtSinglesFailCount[name] = (steamdtSinglesFailCount[name] || 0) + 1);
                    if (failCount <= 3) { q.enrolled[name] = true; q.names.push(name); }
                    else delete steamdtSinglesFailCount[name];   
                } else if (steamdtSinglesFailCount[name]) {
                    delete steamdtSinglesFailCount[name];   
                }
            }
        } finally {
            q.running = false;
        }
    })();
}

async function fetchSteamDTStickerPricesByNames(names, apiKey, platform = 'buff') {
    
    const out = {};
    if (!apiKey || !names || !names.length) return out;
    const cached = await steamdtReadPriceCache(names);
    for (const name of names) {
        const list = cached[name] !== undefined ? cached[name] : await steamdtGetPriceList(apiKey, name);
        const picked = pickSteamDTPlatformPrice(list || [], platform);
        if (picked && picked.price > 0) out[name] = picked.price;
    }
    return out;
}

async function calculateValueWithSteamDT(inventoryData, apiKey, platform = 'buff') {
    try {
        const itemMap =  ({}), descMap = {};
        if (inventoryData.descriptions) inventoryData.descriptions.forEach(d => { if(d.classid) descMap[d.classid] = d.market_hash_name; });
        if (inventoryData.assets) inventoryData.assets.forEach(a => { const n = descMap[a.classid]; if(n) itemMap[n] = (itemMap[n]||0)+1; });

        const allItems = Object.keys(itemMap);
        if (allItems.length === 0) return { value: "0.00", source: "", error: null };

        const ranked = steamdtRankNames(itemMap, inventoryData);
        
        const stickerNames = [];
        const seenSticker = {};
        
        const nameInfo = buildNameInfoMap(inventoryData);
        for (const name of ranked) {

            if (stickerNames.length >= STEAMDT_STICKER_NAME_CAP) break;
            if ((itemMap[name] || 1) !== 1) continue;
            const info = nameInfo[name];
            if (!info || !info.stickers || !info.stickers.length) continue;
            for (const s of info.stickers) {
                if (!s || !s.n) continue;
                const hn = steamdtStickerHashName(s);
                if (hn && !seenSticker[hn]) { seenSticker[hn] = 1; stickerNames.push(hn); }
                if (stickerNames.length >= STEAMDT_STICKER_NAME_CAP) break;
            }
        }

        const orderedNames = [...new Set([...stickerNames, ...ranked])];

        addLog(`[SteamDT] names=${orderedNames.length} (sticker=${stickerNames.length}) | plat: ${platform}`);

        const priced = {};
        const cachedLists = await steamdtReadPriceCache(orderedNames);
        for (const n of orderedNames) if (cachedLists[n]) priced[n] = cachedLists[n];
        let needNames = orderedNames.filter(n => !priced[n]);

        if (needNames.length) {
            const chunk = needNames.slice(0, STEAMDT_BATCH_SIZE);
            
            const confirmed = {};
            let batchOk = false;
            const batchEpoch = _steamdtCacheEpoch;   
            for (let attempt = 0; attempt < 2 && !batchOk; attempt++) {
                try {
                    if (!(await steamdtAcquireBatchSlot())) break;   
                    const m = await querySteamDTBatchPriceList(apiKey, chunk);
                    for (const n of chunk) {
                        if (Array.isArray(m[n])) { confirmed[n] = m[n]; batchOk = true; }
                    }
                    if (batchOk) {
                        Object.assign(priced, confirmed);   
                        steamdtWritePriceCache( (confirmed), batchEpoch);
                    }
                } catch (e) {
                    if (attempt === 0) {
                        await new Promise(r => setTimeout(r, STEAMDT_BATCH_RETRY_DELAY));
                        _steamdtLastBatchAt = 0;
                    }
                }
            }
        }

        const rest = orderedNames.filter(n => !priced[n]);
        if (rest.length) {
            addLog(`[SteamDT] pending=${rest.length} → background singles queue (global, 1.1s/name)`);
            steamdtEnqueueSingles(rest, apiKey);   
            ( (calculateValueWithSteamDT))._lastSinglesStream = Promise.resolve();   

            if (!Object.keys(priced).length) {
                const pendingBefore = rest.length;   
                const drainUntil = Date.now() + STEAMDT_FIRST_PAINT_DRAIN_MS;
                for (let i = 0; i < 10 && Date.now() < drainUntil; i++) {
                    await new Promise(r => setTimeout(r, STEAMDT_FIRST_PAINT_POLL_MS));
                    const nowCached = await steamdtReadPriceCache(rest);
                    if (rest.some(n => nowCached[n] && nowCached[n].length)) break;
                }
                const got = await steamdtReadPriceCache(rest);
                for (const n of rest) if (got[n] && got[n].length) priced[n] = got[n];
                const rest2 = orderedNames.filter(n => !priced[n]);
                rest.length = 0; rest.push(...rest2);   

                if (pendingBefore !== rest2.length) {
                    addLog(`[SteamDT] first-paint drain: +${pendingBefore - rest2.length} priced, ${rest2.length} names still pending`);
                }
            }
        }

        let totalValue = 0;
        
        const itemPrices = {};
        
        const itemSources = {};
        
        const itemPlatformIds = {};
        for (const name of orderedNames) {
            const picked = pickSteamDTPlatformPrice(priced[name] || [], platform);
            if (picked && picked.price > 0) {
                totalValue += picked.price * (itemMap[name] || 1);
                itemPrices[name] = picked.price;
                if (picked.source) itemSources[name] = picked.source;

                const entry = steamdtFindPlatformEntry(priced[name] || [], platform);
                itemPlatformIds[name] = entry || { platform: picked.source || '', itemId: picked.itemId };
            }
        }

        const topItems = Object.entries(itemPrices)
            .filter(([, p]) => typeof p === 'number' && isFinite(p) && p > 0)
            .map(([name, p]) => ({ name, qty: itemMap[name]||1, unitPrice: p, total: p * (itemMap[name]||1) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 12);

        const topSources = topItems.map(t => itemSources[t.name]).filter(Boolean);
        const sourceLabel = STEAMDT_PLATFORMS[platform] ? STEAMDT_PLATFORMS[platform].label : 'BUFF';
        const label = topSources.length && topSources.every(s => s.toUpperCase() === String(topSources[0]).toUpperCase()) ? String(topSources[0]) : sourceLabel;

        let pendingCount = rest.length;
        if (pendingCount > 0) {
            try {
                const cachedNow = await steamdtReadPriceCache(rest);   
                pendingCount = rest.filter(n => !(cachedNow[n] && cachedNow[n].length === 0)).length;
            } catch (e) {  }
        }
        const pending = pendingCount > 0;
        addLog(`[SteamDT] Top5: ${topItems.map(t => `${t.name} ¥${t.total.toFixed(0)}`).join(', ')}${pending ? ` | pending: ${pendingCount}/${rest.length}` : ''}`);
        return { value: totalValue.toFixed(2), source: label, error: null, top_items: topItems, itemPrices, itemPlatformIds, pendingTotal: pending, pendingCount };
    } catch (e) { return { value: "Error", source: "", error: e.message }; }
}
