const MKT_LISTING_MAX_PAGES = 10;        
const MKT_LISTING_CACHE_TTL = 30 * 60e3; 
const MKT_PHASE_RATIO_MIN = 0.3;         
const MKT_PHASE_RATIO_MAX = 20;

const MKT_MAX_CONCURRENCY = 2;   
const MKT_MIN_GAP = 500;         
const MKT_JITTER = 250;          
const THROTTLE_429_WAIT = 5000;  
const MKT_429_BURST_LIMIT = 6;   
const MKT_429_WINDOW = 60e3;     
let _mktInflight = 0;
let _mktLastReq = 0;
let _mkt429Count = 0;
let _mkt429WindowStart = 0;

function sleepThrottled(ms) { return new Promise(r => setTimeout(r, ms)); }

async function throttledFetchRaw(url, options, retries) {
    for (let attempt = 0; ; attempt++) {
        let resp;
        try {
            resp = await fetch(url, options);
        } catch (e) {
            if (attempt >= retries) throw e;
            await sleepThrottled(1000 * Math.pow(2, attempt));
            continue;
        }
        if (resp.status === 429) {
            const now = Date.now();
            if (now - _mkt429WindowStart > MKT_429_WINDOW) { _mkt429Count = 0; _mkt429WindowStart = now; }
            _mkt429Count++;
            if (_mkt429Count >= MKT_429_BURST_LIMIT) throw Object.assign(new Error('rate limited burst'), { status: 429, burst: true });
            if (attempt >= 1) throw Object.assign(new Error('rate limited'), { status: 429 });
            await sleepThrottled(THROTTLE_429_WAIT);
            continue;
        }
        return resp;
    }
}

async function throttledFetch(url, options = {}, retries = 2) {
    
    for (;;) {
        if (_mktInflight < MKT_MAX_CONCURRENCY) { _mktInflight++; break; }
        await sleepThrottled(50);
    }
    try {
        const wait = MKT_MIN_GAP + Math.random() * MKT_JITTER - (Date.now() - _mktLastReq);
        if (wait > 0) await sleepThrottled(wait);
        _mktLastReq = Date.now();
        return await throttledFetchRaw(url, options, retries);
    } finally {
        _mktInflight--;
    }
}

const MKT_PRICE_CACHE_TTL = 30 * 60e3;
const MKT_PRICE_FAIL_TTL = 5 * 60e3;
const MKT_PRICE_QUERY_LIMIT = 50;   
const MKT_PRICE_QUERY_LIMIT_MAX = 50;   
const MKT_PRICE_COMMODITY_LIMIT = 15; 

async function fetchSteamPriceOverview(hashName, currency) {
    const cur = currency === 'USD' ? 'USD' : 'CNY';
    const cacheKey = CACHE_KEY_PREFIX + 'po_' + cur + '_' + hashName;
    const wrap = await new Promise(r => chrome.storage.local.get(cacheKey, ( d) => r(d[cacheKey])));
    if (wrap && wrap.ts) {
        const age = Date.now() - wrap.ts;
        if (wrap.ok && wrap.price !== null && wrap.price !== undefined && age < MKT_PRICE_CACHE_TTL) return { price: wrap.price, ok: true };
        if (age < MKT_PRICE_FAIL_TTL) {
            if (wrap.ok) return { price: null, ok: true };   
            return { price: null, ok: false };               
        }
    }
    
    const url = 'https://steamcommunity.com/market/priceoverview/?country=' + (cur === 'USD' ? 'US' : 'CN') +
        '&currency=' + (cur === 'USD' ? 1 : 23) + '&appid=730&market_hash_name=' + encodeURIComponent(hashName);
    let price = null, ok = false;
    try {
        const resp = await throttledFetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
        }, 1);
        if (resp.ok) {
            const j = await resp.json();
            if (j && j.success) {
                ok = true;
                const raw = j.median_price || j.lowest_price || '';
                price = parseFloat(String(raw).replace(/[^0-9.]/g, '')) || null;
            }
        }
    } catch (e) { if (e && e.burst) throw e;  }
    storageSetCache({ [cacheKey]: { ts: Date.now(), price, ok } });
    return { price, ok };
}

const MKT_BUY_TTL = 30 * 60e3;

async function fetchSteamDTBuyQuote(hashName, apiKey) {
    if (!apiKey) return null;
    const cacheKey = CACHE_KEY_PREFIX + 'bq_' + hashName;
    const wrap = await new Promise(r => chrome.storage.local.get(cacheKey, d => r(d[cacheKey])));
    if (wrap && wrap.ts) {
        if (wrap.price !== null && wrap.price !== undefined && Date.now() - wrap.ts < MKT_BUY_TTL) return wrap.price;
        if (wrap.price === null && Date.now() - wrap.ts < MKT_PRICE_FAIL_TTL) return null;
    }
    let price = null;
    try {
        
        const list = await querySteamDTSinglePriceList(apiKey, hashName);
        const buff = list.find(p => p && p.biddingPrice > 0 && String(p.platform || '').toUpperCase().includes('BUFF'));
        const any = buff || list.find(p => p && p.biddingPrice > 0);
        price = any ? (Number(any.biddingPrice) || null) : null;
    } catch (e) {  }
    storageSetCache({ [cacheKey]: { ts: Date.now(), price } });
    return price;
}

function rankMarketCandidates(itemMap, inventoryData, queryLimit = MKT_PRICE_QUERY_LIMIT) {
    const COMMODITY_RE = /(Sticker|Case|Capsule|Patch|Graffiti|Collectible|Music Kit|Agent|Key|Souvenir Package|Name Tag|Sealed Graffiti|X-Ray P250)/i;
    const commodityByName = {};
    if (inventoryData.descriptions) {
        for (const d of inventoryData.descriptions) {
            if (d.market_hash_name && d.commodity !== undefined) commodityByName[d.market_hash_name] = !!d.commodity;
        }
    }
    const entries = Object.entries(itemMap).map(([name, qty]) => {
        const commodity = commodityByName[name] || COMMODITY_RE.test(name);
        let w = 0;
        if (name.startsWith('★')) w += 1000;                       
        if (/StatTrak/.test(name)) w += 300;
        if (/Gloves|Sleeves|(^| )Sport|Hydra/.test(name)) w += 120;
        if (!commodity && /\|/.test(name)) w += 100;               
        w += Math.min(qty, 40) * 0.3;                              
        return { name, qty, commodity, w };
    });
    entries.sort((a, b) => (b.commodity - a.commodity) || (b.w - a.w));
    const nonCom = entries.filter(e => !e.commodity);
    const com = entries.filter(e => e.commodity).slice(0, Math.min(MKT_PRICE_COMMODITY_LIMIT, queryLimit));
    return [...nonCom, ...com].slice(0, queryLimit);
}

async function calculateValueWithSteamMarket(inventoryData, settings) {
    try {
        
        const itemMap = {};
        
        const descMap = {};
        if (inventoryData.descriptions) inventoryData.descriptions.forEach(d => { if (d.classid && d.market_hash_name) descMap[d.classid] = d.market_hash_name; });
        if (inventoryData.assets) inventoryData.assets.forEach(a => { const n = descMap[a.classid]; if (n) itemMap[n] = (itemMap[n] || 0) + 1; });
        if (Object.keys(itemMap).length === 0) return { value: "0.00", top_items: [], itemPrices: {} };
        
        const queryLimit = Math.min(MKT_PRICE_QUERY_LIMIT_MAX,
            Math.max(1, Math.round(Number(settings && settings.sps_mkt_query_limit)) || MKT_PRICE_QUERY_LIMIT));
        const usd = settings.sps_currency === 'USD';
        const candidates = rankMarketCandidates(itemMap, inventoryData, queryLimit);
        let totalValue = 0, queried = 0;
        
        const itemPrices = {};
        const buyQuoted = new Set(); 
        for (const c of candidates) {
            let price = null, ok = false;
            try {
                const r = await fetchSteamPriceOverview(c.name, settings.sps_currency);
                price = r.price; ok = r.ok;
            } catch (e) {
                if (e && e.burst) { addLog(`[SteamMkt] 429 burst, aborted after ${queried} queries`); break; }
            }
            if (price > 0) {
                itemPrices[c.name] = price;
                totalValue += price * c.qty;
            } else if (ok && !usd && settings && !(price > 0)) {   
                const bq = await fetchSteamDTBuyQuote(c.name, settings.sps_steamdt_key);
                if (bq > 0) { itemPrices[c.name] = bq; buyQuoted.add(c.name); totalValue += bq * c.qty; }
            }
            queried++;
        }
        const topItems = Object.entries(itemPrices)
            .filter(([, p]) => typeof p === 'number' && isFinite(p) && p > 0)
            .map(([name, p]) => ({ name, name_cn: '', qty: itemMap[name] || 1, unitPrice: p, total: p * (itemMap[name] || 1), buyQuote: buyQuoted.has(name) ? true : undefined }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 12);
        addLog(`[SteamMkt] queried=${queried}, priced=${Object.keys(itemPrices).length}, buyFallback=${buyQuoted.size}, total=¥${totalValue.toFixed(0)}`);
        return { value: totalValue.toFixed(2), top_items: topItems, itemPrices, currency: usd ? 'USD' : 'CNY' };
    } catch (e) { return { value: "0.00", top_items: [], itemPrices: {} }; }
}

function medianOf(prices) {
    if (!prices || !prices.length) return 0;
    const s = [...prices].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

async function fetchBucketListings(bucketGroupId, prefabPid) {
    const out = [];
    let start = 0;
    for (let page = 0; page < MKT_LISTING_MAX_PAGES; page++) {
        const args = { appid: 730, strItemName: bucketGroupId, filters: {}, accessoryFilters: {}, propertyFilters: {}, start };
        const url = 'https://steamcommunity.com/market/actions?q=QueryListingsForItem&qp=' + encodeURIComponent(JSON.stringify([args]));
        let resp;
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 8000);
            try {
                resp = await throttledFetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0', 'x-valve-request-type': 'queryAction', 'Accept': 'application/json' },
                    signal: ctrl.signal
                }, 1);
            } finally { clearTimeout(timer); }
        } catch (e) { break; }
        if (!resp.ok) break;
        let j;
        try { j = await resp.json(); } catch (e) { break; }
        const d = j && j.data;
        if (!d || !Array.isArray(d.listings) || !d.listings.length) break;
        for (const l of d.listings) {
            const name = l.description && l.description.market_hash_name;
            const props = (l.asset && l.asset.asset_properties) || [];
            const paintProp = props.find(p => p.propertyid === prefabPid);
            const price = Number(l.unPrice);
            if (name && paintProp && paintProp.int_value !== undefined && paintProp.int_value !== '' && isFinite(price) && price > 0) {
                out.push({ name, paint: parseInt(paintProp.int_value, 10), price });
            }
        }
        if (!d.more) break;
        start = (d.start || start) + d.listings.length;
    }
    return out;
}

async function getBucketPhaseStats(bucketGroupId, prefabPid) {
    const cacheKey = CACHE_KEY_PREFIX + 'mkt_' + bucketGroupId;
    const wrap = await new Promise(r => chrome.storage.local.get(cacheKey, d => r(d[cacheKey])));
    if (wrap && wrap.ts && Date.now() - wrap.ts < MKT_LISTING_CACHE_TTL) return wrap.stats || null;   
    const listings = await fetchBucketListings(bucketGroupId, prefabPid);
    if (!listings.length) {
        storageSetCache({ [cacheKey]: { ts: Date.now(), stats: null } });
        return null;
    }
    const byName = {};
    for (const l of listings) {
        const g = byName[l.name] = byName[l.name] || { all: [], byPaint: {} };
        g.all.push(l.price);
        (g.byPaint[l.paint] = g.byPaint[l.paint] || []).push(l.price);
    }
    const stats = {};
    for (const [name, g] of Object.entries(byName)) {
        const byPaint = {};
        for (const [p, arr] of Object.entries(g.byPaint)) byPaint[p] = medianOf(arr);
        stats[name] = { allMedian: medianOf(g.all), byPaint };
    }
    storageSetCache({ [cacheKey]: { ts: Date.now(), stats } });
    return stats;
}

async function applyPhaseMarketPrices(topItems, inventoryData, prefabPid) {
    if (!topItems || !topItems.length) return { rows: topItems, delta: 0 };
    const descs = (inventoryData && inventoryData.descriptions) || [];
    const groupIdByName = {};
    for (const d of descs) {
        if (d.market_hash_name && d.market_bucket_group_id && !groupIdByName[d.market_hash_name]) {
            groupIdByName[d.market_hash_name] = d.market_bucket_group_id;
        }
    }
    const bucketCache = {}; 
    let delta = 0;
    
    const rows = [];
    for (const item of topItems) {
        rows.push(item);
        if (!item.paintIndex) continue; 
        const gid = groupIdByName[item.name];
        if (!gid) continue;
        if (!(gid in bucketCache)) {
            try { bucketCache[gid] = await getBucketPhaseStats(gid, prefabPid); }
            catch (e) { bucketCache[gid] = null; }
        }
        const stats = bucketCache[gid];
        const nameStats = stats && stats[item.name];
        const phaseMed = nameStats && nameStats.byPaint && nameStats.byPaint[item.paintIndex];
        if (!nameStats || !phaseMed || !(nameStats.allMedian > 0)) {
            rows[rows.length - 1] = { ...item, mktNote: true };
            continue;
        }
        const ratio = phaseMed / nameStats.allMedian;
        if (!(ratio >= MKT_PHASE_RATIO_MIN && ratio <= MKT_PHASE_RATIO_MAX)) continue;
        const oldUnit = Number(item.unitPrice) || 0;
        if (!(oldUnit > 0)) continue;
        const qty = Number(item.qty) || 1;
        const newUnit = Math.max(1, Math.round(oldUnit * ratio));
        const newTotal = newUnit * qty;
        delta += newTotal - (Number(item.total) || oldUnit * qty);
        rows[rows.length - 1] = { ...item, unitPrice: newUnit, total: newTotal, phasePriced: true, mktNote: false };
    }
    return { rows, delta };
}

