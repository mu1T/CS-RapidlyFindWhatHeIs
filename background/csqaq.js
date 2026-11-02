const CSQAQ_ALARM_NAME = 'csqaq_auto_bind';

let _csqaqLastGoodsReqAt = 0;

let _csqaqGoodsChain = Promise.resolve();
function csqaqAcquireGoodsSlot() {
    const run = _csqaqGoodsChain.then(async () => {
        const wait = 1200 - (Date.now() - _csqaqLastGoodsReqAt);
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
        _csqaqLastGoodsReqAt = Date.now();
    });
    _csqaqGoodsChain = run.catch(() => {});
    return run;
}

const CSQAQ_PRICE_TTL = 10 * 60e3;
const CSQAQ_PRICE_FAIL_TTL = 5 * 60e3;
const CSQAQ_PRICE_CACHE_PREFIX = CACHE_KEY_PREFIX + 'cqp_';
const CSQAQ_GOOD_ID_BATCH = 50;   

let _csqaqWriteFenceAt = 0;

function csqaqResetRateLimitsForCacheClear() {
    _csqaqWriteFenceAt = Date.now();
}

async function csqaqReadPriceCache(names) {
    
    const out = {};
    if (!names || !names.length) return out;
    try {
        const keys = names.map(n => CSQAQ_PRICE_CACHE_PREFIX + n);
        const store = await new Promise(r => chrome.storage.local.get(keys, d => r(d)));
        const now = Date.now();
        for (const n of names) {
            const wrap = store[CSQAQ_PRICE_CACHE_PREFIX + n];
            if (!wrap || !wrap.ts || typeof wrap.entry !== 'object' || wrap.entry === null) continue;
            const age = now - wrap.ts;
            if (Object.keys(wrap.entry).length ? age < CSQAQ_PRICE_TTL : age < CSQAQ_PRICE_FAIL_TTL) out[n] = wrap.entry;
        }
    } catch (e) {  }
    return out;
}

function csqaqWritePriceCache(map) {
    if (_csqaqWriteFenceAt && Date.now() - _csqaqWriteFenceAt < 10e3) return;   
    if (!map) return;
    const names = Object.keys(map);
    if (!names.length) return;
    try {
        
        const payload = {};
        const priced = [];
        const ts = Date.now();
        for (const n of names) {
            payload[CSQAQ_PRICE_CACHE_PREFIX + n] = { ts, entry: map[n] || {} };
            if (map[n] && Object.keys(map[n]).length) priced.push(n);   
        }
        storageSetCache(payload);
        
        if (typeof cacheNotifyPatches === 'function') cacheNotifyPatches('PRICES', 'csqaq', priced);
    } catch (e) {  }
}

async function csqaqFetchGoodsBatch(apiKey, batch) {
    for (let attempt = 0; attempt < 3; attempt++) {

        await csqaqAcquireGoodsSlot();
        let res;
        try {
            res = await fetchWithTimeout("https://api.csqaq.com/api/v1/goods/getPriceByMarketHashName", {
                method: "POST",
                headers: { "ApiToken": apiKey, "Content-Type": "application/json" },
                body: JSON.stringify({ marketHashNameList: batch })
            }, 10000);
        } catch (e) {
            if (attempt < 2) { await new Promise(r => setTimeout(r, 1200)); continue; }
            return null;   
        }
        if ((res.status === 429 || res.status === 403) && attempt < 2) { await new Promise(r => setTimeout(r, 1500)); continue; }
        if (!res.ok) return null;
        let json;
        try { json = await res.json(); } catch (e) { return null; }
        if (json.code === 400 || json.code === 401) return { authError: true };
        if (json.code !== 200 || !json.data) return null;
        return { success: json.data.success || {}, error: Array.isArray(json.data.error) ? json.data.error : [] };
    }
    return null;
}

function setupCSQAQAutoBind() {
    chrome.alarms.get(CSQAQ_ALARM_NAME, (alarm) => {
        chrome.storage.sync.get({
            sps_auto_bind_csqaq: true, sps_csqaq_bind_interval: 30
        }, (s) => {
            chrome.storage.local.get({ sps_csqaq_key: '' }, (lt) => {
                const csqaqKey = lt.sps_csqaq_key;
                if (!csqaqKey || s.sps_auto_bind_csqaq === false) {
                    if (alarm) {
                        chrome.alarms.clear(CSQAQ_ALARM_NAME);
                        addLog('[CSQAQ] Auto-bind disabled, alarm cleared');
                    }
                    return;
                }
                const minutes = Math.max(1, parseInt(( (s)).sps_csqaq_bind_interval) || 30);
                if (alarm && alarm.periodInMinutes === minutes) {
                    addLog('[CSQAQ] Auto-bind alarm already configured correctly');
                    return;
                }
                const isNew = !alarm;
                if (alarm) chrome.alarms.clear(CSQAQ_ALARM_NAME);
                chrome.alarms.create(CSQAQ_ALARM_NAME, { delayInMinutes: minutes, periodInMinutes: minutes });
                addLog(`[CSQAQ] Auto-bind alarm ${isNew ? 'created' : 'updated'} every ${minutes}min`);
                if (isNew) bindCSQAQIP(csqaqKey);
            });
        });
    });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === CSQAQ_ALARM_NAME) {
        chrome.storage.local.get({ sps_csqaq_key: '' }, (ss) => {
            if (ss.sps_csqaq_key) bindCSQAQIP(ss.sps_csqaq_key);
        });
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' && area !== 'local') return;
    const relevantKeys = ['sps_csqaq_key', 'sps_auto_bind_csqaq', 'sps_csqaq_bind_interval'];
    if (relevantKeys.some(k => changes[k])) {
        setupCSQAQAutoBind();
    }
});

chrome.runtime.onInstalled.addListener(() => setupCSQAQAutoBind());
chrome.runtime.onStartup.addListener(() => setupCSQAQAutoBind());

async function calculateValueWithCSQAQ(inventoryData, apiKey, platform = '1') {
    try {
        const itemMap = {}, descMap = {};
        if (inventoryData.descriptions) inventoryData.descriptions.forEach(d => { if(d.classid) descMap[d.classid] = d.market_hash_name; });
        if (inventoryData.assets) inventoryData.assets.forEach(a => { const n = descMap[a.classid]; if(n) itemMap[n] = (itemMap[n]||0)+1; });
        const hashNames = Object.keys(itemMap);
        if (hashNames.length === 0) return { value: "0.00", top_items: [], itemPrices: {}, itemGoodIds: {}, itemNamesCN: {} };

        let totalValue = 0;
        
        const itemPrices = {};
        
        const itemNamesCN = {};
        
        const itemGoodIds = {};
        let hasAuthError = false;

        const cached = await csqaqReadPriceCache(hashNames);
        
        const toCache = {};
        for (const name of hashNames) {
            const entry = cached[name];
            if (!entry) continue;
            if (entry.goodId) itemGoodIds[name] = entry.goodId;
            const price = parseFloat(entry[platform === '2' ? 'yyypSellPrice' : 'buffSellPrice'] || 0);
            if (price > 0) {
                totalValue += price * itemMap[name];
                itemPrices[name] = price;
                if (entry.name) itemNamesCN[name] = entry.name;
            }
        }
        const needNames = hashNames.filter(n => !cached[n]);

        for (let i = 0; i < needNames.length; i += 50) {
            const batch = needNames.slice(i, i + 50);
            const res = await csqaqFetchGoodsBatch(apiKey, batch);
            if (!res) break;   
            if (res.authError) { hasAuthError = true; break; }
            
            const batchEntries = {};
            for (const name of batch) {
                const entry = res.success[name];
                if (entry) {
                    batchEntries[name] = entry;
                    if (entry.goodId) itemGoodIds[name] = entry.goodId;
                    const priceField = platform === '2' ? 'yyypSellPrice' : 'buffSellPrice';
                    const price = parseFloat(entry[priceField] || 0);
                    if (price > 0) {
                        totalValue += price * itemMap[name];
                        itemPrices[name] = price;
                        if (entry.name) itemNamesCN[name] = entry.name;
                    }
                } else if (res.error && res.error.includes(name)) {
                    batchEntries[name] = {};   
                }
                
            }
            csqaqWritePriceCache(batchEntries);
        }
        if (hasAuthError) {
            addLog(`[CSQAQ] Auth error (400/401), will trigger auto-retry`);
            return { value: "0.00", top_items: [], itemPrices: {}, itemGoodIds: {}, itemNamesCN: {}, _authError: true };
        }
        const topItems = Object.entries(itemPrices)
            .filter(([, p]) => typeof p === 'number' && isFinite(p) && p > 0)
            .map(([name, p]) => ({ name, name_cn: itemNamesCN[name] || '', qty: itemMap[name]||1, unitPrice: p, total: p * (itemMap[name]||1) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 12);
        addLog(`[CSQAQ] Top5: ${topItems.map(t => `${t.name} ¥${t.total.toFixed(0)}`).join(', ')}`);
        return { value: totalValue.toFixed(2), top_items: topItems, itemPrices, itemGoodIds, itemNamesCN };
    } catch (e) { return { value: "0.00", top_items: [], itemPrices: {}, itemGoodIds: {}, itemNamesCN: {} }; }
}

const CSQAQ_DETAIL_TTL = 30 * 60e3;   

async function fetchCSQAQGoodDetail(goodId, apiKey) {
    if (!goodId || !apiKey) return null;
    const cacheKey = CACHE_KEY_PREFIX + 'gd_' + goodId;
    const wrap = await new Promise(r => chrome.storage.local.get(cacheKey, ( d) => r(d[cacheKey])));
    if (wrap && wrap.ts) {
        if (wrap.ok && Date.now() - wrap.ts < CSQAQ_DETAIL_TTL) return wrap.detail;
        if (!wrap.ok && Date.now() - wrap.ts < MKT_PRICE_FAIL_TTL) return null;
    }
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const resp = await fetchWithTimeout('https://api.csqaq.com/api/v1/info/good?id=' + encodeURIComponent(goodId), {
                headers: { 'ApiToken': apiKey }
            }, 10000);
            if (resp.status === 400 || resp.status === 401) {
                storageSetCache({ [cacheKey]: { ts: Date.now(), ok: false } });
                return null;
            }
            if (resp.status === 429 && attempt < 2) { await new Promise(r => setTimeout(r, 1200)); continue; }
            if (resp.ok) {
                const j = await resp.json();
                if (j && j.code === 200 && j.data) {
                    storageSetCache({ [cacheKey]: { ts: Date.now(), ok: true, detail: j.data } });
                    return j.data;
                }
            }
        } catch (e) { if (attempt < 2) { await new Promise(r => setTimeout(r, 1200)); continue; } }
        break;
    }
    storageSetCache({ [cacheKey]: { ts: Date.now(), ok: false } });
    return null;
}

async function applyCSQAQPhasePrices(topItems, goodIdsByHash, apiKey, platform) {
    if (!topItems || !topItems.length) return { rows: topItems, delta: 0 };
    
    const rows = [];
    let delta = 0;
    const detailCache = {}; 
    let lastDetailAt = 0;   
    for (const item of topItems) {
        rows.push(item);
        if (item.paintIndex === undefined) continue; 
        const gid = goodIdsByHash && goodIdsByHash[item.name];
        let detail = null;
        if (gid && !(gid in detailCache)) {
            const wait = 300 - (Date.now() - lastDetailAt);
            if (wait > 0) await new Promise(r => setTimeout(r, wait));
            lastDetailAt = Date.now();
            try { detailCache[gid] = await fetchCSQAQGoodDetail(gid, apiKey); } catch (e) { detailCache[gid] = null; }
        }
        if (gid) detail = detailCache[gid];
        const dpl = (detail && Array.isArray(detail.dpl)) ? detail.dpl : [];
        const entry = dpl.find(d => Number(d.paint_index) === Number(item.paintIndex));
        if (!entry) continue; 
        const oldUnit = Number(item.unitPrice) || 0;
        const qty = Number(item.qty) || 1;
        const sell = Number(entry.buff_sell_price) || 0;
        const buy = Number(entry.buff_buy_price) || 0;
        let newUnit = 0, buyQuoted = false;
        if (platform === '2') {
            const gi = (detail && detail.goods_info) || {};
            const mergedBuff = Number(gi.buff_sell_price) || 0;
            if (mergedBuff > 0 && sell > 0) newUnit = Math.max(1, Math.round((oldUnit * sell) / mergedBuff * 100) / 100);
            else if (sell > 0) newUnit = sell;
        } else {
            if (sell > 0) newUnit = sell;
            else if (buy > 0) { newUnit = buy; buyQuoted = true; } 
        }
        if (!(newUnit > 0) || !(oldUnit > 0)) continue;
        const newTotal = newUnit * qty;
        delta += newTotal - (Number(item.total) || oldUnit * qty);
        
        rows[rows.length - 1] = { ...item, unitPrice: newUnit, total: newTotal, phasePriced: true, mktNote: false, goodId: gid, buyQuote: buyQuoted ? true : undefined };
    }
    return { rows, delta };
}

async function fetchCsqaqPricesByNames(names, apiKey, platform) {
    
    const out = {};
    if (!names || !names.length) return out;
    const priceField = platform === '2' ? 'yyypSellPrice' : 'buffSellPrice';
    try {
        const cached = await csqaqReadPriceCache(names);
        for (const name of names) {
            const price = parseFloat((cached[name] && cached[name][priceField]) || 0);
            if (price > 0) out[name] = price;
        }
        const needNames = names.filter(n => !cached[n]);
        for (let i = 0; i < needNames.length; i += 50) {
            const batch = needNames.slice(i, i + 50);
            const res = await csqaqFetchGoodsBatch(apiKey, batch);
            if (!res || res.authError) break;   
            
            const batchEntries = {};
            for (const name of batch) {
                const entry = res.success[name];
                if (entry) batchEntries[name] = entry;

                else if (res.error && res.error.includes(name)) batchEntries[name] = {};
                const price = parseFloat((entry && entry[priceField]) || 0);
                if (price > 0) out[name] = price;

                const gid = entry && Number(entry.goodId) || 0;
                if (gid > 0) _csqaqGoodIdMemo[name] = gid;
            }
            csqaqWritePriceCache(batchEntries);
        }
    } catch (e) {  }
    return out;
}

const _csqaqGoodIdMemo = {};

function peekCsqaqGoodIds(names) {
    
    const out = {};
    if (!names || !names.length) return out;
    for (const name of names) {
        if (_csqaqGoodIdMemo[name] > 0) out[name] = _csqaqGoodIdMemo[name];
    }
    return out;
}

function prefetchCsqaqGoodIds(names, apiKey) {
    if (!names || !names.length || !apiKey) return null;
    const need = names.filter(n => _csqaqGoodIdMemo[n] === undefined);
    if (!need.length) return null;
    return (async () => {
        try {
            
            const cached = await csqaqReadPriceCache(need);
            for (const n of need) { const gid = cached[n] && Number(cached[n].goodId) || 0; if (gid > 0) _csqaqGoodIdMemo[n] = gid; }
            const missing = need.filter(n => _csqaqGoodIdMemo[n] === undefined);
            for (let i = 0; i < missing.length; i += CSQAQ_GOOD_ID_BATCH) {
                const batch = missing.slice(i, i + CSQAQ_GOOD_ID_BATCH);
                await csqaqAcquireGoodsSlot();
                const resp = await fetchWithTimeout("https://api.csqaq.com/api/v1/info/get_good_id", {
                    method: "POST",
                    headers: { "ApiToken": apiKey, "Content-Type": "application/json" },
                    body: JSON.stringify({ marketHashNameList: batch })
                }, 8000);
                if (!resp.ok) return;   
                const json = await resp.json();
                if (!json || json.code !== 200 || !json.data) return;   
                const success = json.data.success || {};
                for (const name of batch) {
                    const entry = success[name];
                    const gid = entry && (entry.goodId !== undefined ? entry.goodId : entry.good_id);
                    if (Number(gid) > 0) _csqaqGoodIdMemo[name] = Number(gid);
                    
                }
            }
        } catch (e) {  }
    })();
}

const CSQAQ_BIND_MIN_INTERVAL = 30e3;
let _csqaqLastBindAt = 0;
let _csqaqLastBindResult = null;   
let _csqaqBindInflight = null;
async function bindCSQAQIP(apiKey) {
    if (!apiKey) return { success: false, message: '未配置 API Token' };
    const wait = CSQAQ_BIND_MIN_INTERVAL - (Date.now() - _csqaqLastBindAt);
    if (wait > 0 && _csqaqLastBindResult) {
        addLog('[CSQAQ] IP bind throttled (30s window), reuse last result');
        return _csqaqLastBindResult;
    }
    if (_csqaqBindInflight) return _csqaqBindInflight;
    const p = (async () => {
        try {
            const res = await fetchWithTimeout("https://api.csqaq.com/api/v1/sys/bind_local_ip", {
                method: "POST",
                headers: { "ApiToken": apiKey, "Content-Type": "application/json" }
            }, 10000);
            const json = await res.json();
            if (json.code === 200) {
                addLog(`[CSQAQ] IP whitelist bound: ${json.data}`);
                try {
                    const ipRes = await fetchWithTimeout('https://api.ipify.org?format=json', {}, 8000);
                    const ipJson = await ipRes.json();

                    const prev = await new Promise(r => chrome.storage.local.get('_csqaq_last_ip', (d) => r(d && d._csqaq_last_ip)));
                    if (ipJson.ip && prev !== ipJson.ip) chrome.storage.local.set({ '_csqaq_last_ip': ipJson.ip });
                } catch (e) {}
                return { success: true, message: json.data || 'IP 绑定成功' };
            } else if (json.code === 401 || json.code === 400) {
                addLog(`[CSQAQ] IP bind auth failed: ${json.msg}`);
                return { success: false, message: 'Token 无效，请检查后重试' };
            } else {
                addLog(`[CSQAQ] IP bind failed: code=${json.code}, msg=${json.msg}`);
                return { success: false, message: json.msg || '绑定失败，请手动访问 csqaq.com 绑定' };
            }
        } catch (e) {
            addLog(`[CSQAQ] IP bind error: ${e.message}`);
            return { success: false, message: '网络错误，请手动访问 csqaq.com 绑定' };
        } finally {
            _csqaqLastBindAt = Date.now();   
        }
    })();
    _csqaqBindInflight = p;
    const result = await p;
    if (_csqaqBindInflight === p) _csqaqBindInflight = null;
    _csqaqLastBindResult = result;
    return result;
}

const IP_CACHE_KEY = '_csqaq_last_ip';

async function checkAndBindCSQAQ(apiKey) {
    try {
        const ipRes = await fetchWithTimeout('https://api.ipify.org?format=json', {}, 8000);
        const ipJson = await ipRes.json();
        const currentIp = ipJson.ip;
        if (!currentIp) return { bound: false, reason: 'IP 获取失败' };

        const stored = await new Promise(r => chrome.storage.local.get(IP_CACHE_KEY, ( d) => r(d[IP_CACHE_KEY])));
        if (stored === currentIp) {
            addLog(`[CSQAQ] IP unchanged (${currentIp}), skip bind`);
            return { bound: false, reason: 'IP 未变化' };
        }

        addLog(`[CSQAQ] IP changed: ${stored || '首次'} → ${currentIp}, auto-binding...`);
        const result = await bindCSQAQIP(apiKey);
        return { bound: result.success, reason: result.message };
    } catch (e) {
        addLog(`[CSQAQ] IP check failed: ${e.message}`);
        return { bound: false, reason: e.message };
    }
}

async function fetchCSQAQWithRetry(inventoryData, apiKey, platform) {
    let result = await calculateValueWithCSQAQ(inventoryData, apiKey, platform);
    if (result._authError) {
        addLog(`[CSQAQ] Auth error detected, auto-binding and retrying...`);
        const bindRes = await bindCSQAQIP(apiKey);
        if (bindRes && bindRes.success) {
            result = await calculateValueWithCSQAQ(inventoryData, apiKey, platform);
        }
    }
    if (result._authError) return { value: "0.00", top_items: [], itemPrices: {}, itemGoodIds: {}, itemNamesCN: {}, error: 'CSQAQ_AUTH' };
    return result;
}

