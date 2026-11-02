

function steamdtFindPlatformEntry(list, platformCode) {
    if (!Array.isArray(list) || !list.length) return null;
    const norm = (s) => String(s || '').toUpperCase();
    const matchers = steamdtPlatformMatchers(platformCode).map(norm);
    const hit = list.find(p => p && matchers.some(m => norm(p.platform).includes(m)));
    if (!hit) return null;
    return { platform: String(hit.platform || ''), itemId: Number(hit.platformItemId) || 0 };
}

function buildTopItemMarketUrl(it, settings, platformIdsByName, goodIdsByName) {
    const enc = encodeURIComponent(it.name);
    if (!it || !it.name) return 'https://steamcommunity.com/market/listings/730/' + enc;   

    const linkSrc = settings && settings.sps_link_source;
    if (linkSrc && linkSrc !== 'auto') {
        if (linkSrc === 'steamdt') return `https://www.steamdt.com/cs2/${enc}?tab=trend&type=charts`;
        if (linkSrc === 'steam_mkt') return 'https://steamcommunity.com/market/listings/730/' + enc;
        if (linkSrc === 'csqaq') {
            const gid2 = Number(it.goodId) || Number(goodIdsByName && goodIdsByName[it.name]) || 0;
            
            return gid2 > 0 ? `https://csqaq.com/goods/${gid2}` : 'https://steamcommunity.com/market/listings/730/' + enc;
        }
    }
    if (settings && settings.sps_inv_source === 'steamdt') {
        return `https://www.steamdt.com/cs2/${enc}?tab=trend&type=charts`;   
    }
    const gid = Number(it.goodId) || Number(goodIdsByName && goodIdsByName[it.name]) || 0;
    if (gid > 0) return `https://csqaq.com/goods/${gid}`;
    return 'https://steamcommunity.com/market/listings/730/' + enc;   
}

async function resolveTopItemIcons(topItems, inventoryData, settings, platformIdsByName, goodIdsByName) {
    if (!topItems || !topItems.length) return topItems;
    try {
        const iconByClass = {};
        const iconByHash = {};
        if (inventoryData && inventoryData.descriptions) {
            for (const d of inventoryData.descriptions) {
                if (d.classid && d.icon_url && !iconByClass[d.classid]) iconByClass[d.classid] = d.icon_url;
                if (d.market_hash_name && d.icon_url && !iconByHash[d.market_hash_name]) iconByHash[d.market_hash_name] = d.icon_url;
            }
        }
        const needMaps = topItems.some(it => it && !it.classid && it.paintIndex !== undefined);
        const maps = needMaps ? buildInventoryPhaseMaps(inventoryData, 7) : null;
        const schema = await getPropertySchemaMap();
        const seedPid = schema['#attr_set_item_texture_seed'] !== undefined ? schema['#attr_set_item_texture_seed'] : 1;
        const prefabPid = schema['#attr_set_item_texture_prefab'] !== undefined ? schema['#attr_set_item_texture_prefab'] : 7;
        const nameByClass = {};
        if (inventoryData && inventoryData.descriptions) {
            for (const d of inventoryData.descriptions) {
                if (d.classid && d.market_hash_name && !nameByClass[d.classid]) nameByClass[d.classid] = d.market_hash_name;
            }
        }
        const propsByAsset = {};
        if (inventoryData && inventoryData.asset_properties) {
            for (const ap of inventoryData.asset_properties) propsByAsset[ap.assetid] = ap.asset_properties || [];
        }
        const needMeta = topItems.some(it => it && (it.nameTag === undefined || it.seed === undefined || (Number(it.qty) === 1 && it.float === undefined)));
        if (needMeta) {
            const meta = {};   
            for (const a of (inventoryData && inventoryData.assets) || []) {
                const name = nameByClass[a.classid];
                if (!name) continue;
                const m = meta[name] = meta[name] || { nameTag: '', float: null, seed: null, paint: null };
                for (const pr of propsByAsset[a.assetid] || []) {
                    if (!m.nameTag && pr.propertyid === 5 && pr.string_value) m.nameTag = pr.string_value;
                    if (m.float === null && pr.propertyid === 2 && pr.float_value !== undefined) m.float = pr.float_value;
                    if (m.seed === null && pr.propertyid === seedPid && pr.int_value !== undefined && pr.int_value !== '') m.seed = parseInt(pr.int_value, 10);
                    if (m.paint === null && pr.propertyid === prefabPid && pr.int_value !== undefined && pr.int_value !== '') m.paint = parseInt(pr.int_value, 10);
                }
            }
            for (const it of topItems) {
                const m = it && it.name && meta[it.name];
                if (!m) continue;
                if (it.nameTag === undefined && m.nameTag) it.nameTag = m.nameTag;
                if (it.float === undefined && Number(it.qty) === 1 && m.float !== null) it.float = m.float;
                if (it.seed === undefined && Number(it.qty) === 1 && m.seed !== null) it.seed = m.seed;
                if (it.paintIndex === undefined && Number(it.qty) === 1 && m.paint !== null) it.paintIndex = m.paint;   
            }
        }

        const needRange = topItems.some(it => it && it.float != null);
        if (needRange) {

            const { byName: byNameFloats, byPaint: floatMap } = await getFloatRangeTables();
            for (const it of topItems) {
                if (!it || it.float == null || it.floatRange) continue;
                let fr = null;
                if (it.paintIndex != null) fr = floatMap[String(it.paintIndex)];
                if (!fr && it.name) {
                    const e = byNameFloats[normSkinName(it.name)];
                    if (e) fr = e.range;
                }
                if (fr) it.floatRange = { min: fr[0], max: fr[1] };
            }
        }
        for (const it of topItems) {
            if (!it || it.img) continue;
            let cls = it.classid;
            if (!cls && maps && it.paintIndex !== undefined) cls = (maps.classByNamePaint[it.name] || {})[it.paintIndex];
            const src = (cls && iconByClass[cls]) || iconByHash[it.name];
            if (src) it.img = 'https://community.akamai.steamstatic.com/economy/image/' + String(src).replace(/^\//, '') + '/96fx96f';
        }

        for (const it of topItems) {
            if (!it || !it.name || it.mktUrl) continue;
            it.mktUrl = buildTopItemMarketUrl(it, settings, platformIdsByName, goodIdsByName);
        }
    } catch (e) {  }
    return topItems;
}

async function fetchCS2InventoryPreview(steamId, settings) {
    const mode = settings.sps_inv_source === 'steamdt' ? 'steamdt'
        : (settings.sps_inv_source === 'csqaq' ? 'csqaq'
        : (settings.sps_inv_source === 'steam_mkt' ? 'steam_mkt' : 'basic'));
    const key = CACHE_KEY_PREFIX + 'inv20_' + steamId + '_' + mode;   
    
    const cachedWrapper = (typeof cacheGet === 'function')
        ? await cacheGet(key)
        : await new Promise(r => chrome.storage.local.get(key, d => r(d[key])));
    if (isValidData(cachedWrapper ? cachedWrapper.data : null)) {
        const priced = cachedWrapper.data.total_value && cachedWrapper.data.total_value !== '-' && cachedWrapper.data.total_value !== '0.00';
        const userTTL = await getUserCacheTTL();
        const ttl = cachedWrapper.ttl !== undefined ? cachedWrapper.ttl : (priced ? userTTL : CACHE_DURATION);
        if (Date.now() - cachedWrapper.ts < ttl) return cachedWrapper.data;   
        
        if (Date.now() - cachedWrapper.ts < ttl * 3 && !cachedWrapper.data.pendingTotal) return cachedWrapper.data;
    }
    try {
        const resp = await tryFetchInventoryOnce(steamId);
        if (resp && resp.ok) {
            
            const data = await resp.json();
            if (data && data.success) {

                const pAssetCount = (data.assets && Array.isArray(data.assets)) ? data.assets.length : 0;
                const pTotalCount = data.total_inventory_count || 0;
                if (!pAssetCount && (pTotalCount > 0 || (data.descriptions && data.descriptions.length))) {
                    if (isValidData(cachedWrapper ? cachedWrapper.data : null)) return cachedWrapper.data;
                    return { item_count: -1, total_value: "-", error: "Rate Limited" };
                }
                const count = data.total_inventory_count || (pAssetCount || 0);
                
                return { item_count: count, total_value: "-", error: null, source_label: "", top_items: [], categories: null, incomplete: !!resp.partial || undefined, overCap: !!resp.overCap || undefined };
            }
            
            const perr = /private/i.test(String(data.Error || '')) ? 'Private' : 'API Fail';
            if (perr !== 'Private' && isValidData(cachedWrapper ? cachedWrapper.data : null)) return cachedWrapper.data;   
            return { item_count: 0, total_value: "-", error: perr };
        }
        const err = !resp ? 'Net Error' : (resp.status === 429 ? 'Rate Limited' : (resp.status === 403 ? 'Private' : `HTTP ${resp.status}`));

        if (err !== 'Private' && isValidData(cachedWrapper ? cachedWrapper.data : null)) return cachedWrapper.data;
        return { item_count: -1, total_value: "-", error: err };
    } catch (e) {
        if (isValidData(cachedWrapper ? cachedWrapper.data : null)) return cachedWrapper.data;
        return { item_count: -1, total_value: "-", error: "Net Error" };
    }
}

let _invCacheEpoch = 0;

function invResetForCacheClear() {
    _invCacheEpoch++;

    _invJsonRecent.clear();
    _invJsonInflight.clear();
}

function _invPipelineEpoch() {
    return (typeof cacheCurrentEpoch === 'function') ? cacheCurrentEpoch() : _invCacheEpoch;
}

const _invSwrBusy = new Set();

const _invJsonForced = new Map();

const INV_STICKER_WAIT_MS = 2500;

async function fetchCS2Inventory(steamId, settings, force) {
    addLog(`[Inv] Fetching for ${steamId}. Mode: ${settings.sps_inv_source}${force ? ' (forced revalidate)' : ''}`);
    const mode = settings.sps_inv_source === 'steamdt' ? 'steamdt'
        : (settings.sps_inv_source === 'csqaq' ? 'csqaq'
        : (settings.sps_inv_source === 'steam_mkt' ? 'steam_mkt' : 'basic'));
    const ep = _invPipelineEpoch();   

    const key = CACHE_KEY_PREFIX + 'inv20_' + steamId + '_' + mode;
    
    const cachedWrapper = (typeof cacheGet === 'function')
        ? await cacheGet(key)
        : await new Promise(r => chrome.storage.local.get(key, d => r(d[key])));

    if (isValidData(cachedWrapper ? cachedWrapper.data : null)) {
        const priced = cachedWrapper.data.total_value && cachedWrapper.data.total_value !== '-' && cachedWrapper.data.total_value !== '0.00';
        const userTTL = await getUserCacheTTL();
        const ttl = cachedWrapper.ttl !== undefined ? cachedWrapper.ttl : (priced ? userTTL : CACHE_DURATION);

        const envEpoch = typeof cachedWrapper.epoch === 'number' ? cachedWrapper.epoch : null;
        const epochOk = envEpoch === null || !(typeof cacheCurrentEpoch === 'function') || envEpoch >= cacheCurrentEpoch();
        const age = Date.now() - cachedWrapper.ts;
        if (age >= ttl && age < ttl * 3 && epochOk && !_invSwrBusy.has(key)) {
            _invSwrBusy.add(key);
            
            _invSwrBusy.add('__force__' + steamId);
            const revalP = fetchCS2Inventory(steamId, settings, true).finally(() => _invSwrBusy.delete('__force__' + steamId));
            revalP.finally(() => _invSwrBusy.delete(key));
            revalP.catch(() => {});
            addLog(`[Inv] SWR stale-while-revalidate: serving stale (${Math.round(age / 1e3)}s old), revalidating in background`);
            return await applyPendingStallGuard(cachedWrapper.data, steamId, mode);
        }
        if (Date.now() - cachedWrapper.ts < ttl) {
            addLog(`Cache hit (TTL=${ttl}ms).`);

            return await applyPendingStallGuard(cachedWrapper.data, steamId, mode);
        }
    }

    try {
        
        let snap = await tryFetchInventoryOnce(steamId, !!force || _invSwrBusy.has('__force__' + steamId));

        if (!snap) {
            if (isValidData(cachedWrapper ? cachedWrapper.data : null)) return cachedWrapper.data;
            return { item_count: 0, total_value: "-", error: "Net Error" };
        }
        const isTruncated = !!(snap.partial || snap.overCap);   
        const isOverCap = !!snap.overCap;   
        if (snap.status === 429) {
            if (isValidData(cachedWrapper ? cachedWrapper.data : null)) return await applyPendingStallGuard(cachedWrapper.data, steamId, mode);   
            return { item_count: 0, total_value: "-", error: "Rate Limited" };
        }
        if (snap.status === 403) return { item_count: 0, total_value: "-", error: "Private" };
        if (!snap.ok) return { item_count: 0, total_value: "-", error: `HTTP ${snap.status}` };

        const data = await snap.json();

        if (!data.success) {
            return { item_count: 0, total_value: "-", error: /private/i.test(String(data.Error || '')) ? 'Private' : 'API Fail' };
        }

        const assetCount = (data.assets && Array.isArray(data.assets)) ? data.assets.length : 0;
        const totalCount = data.total_inventory_count || 0;
        if (!assetCount && (totalCount > 0 || (data.descriptions && data.descriptions.length))) {
            addLog(`[Inv] 空壳响应: success=true 但 assets 空（total=${totalCount}, desc=${data.descriptions ? data.descriptions.length : 0}）→ 按限流处理`);
            _steamInvBackoff.until = Date.now() + STEAM_INV_BACKOFF_MS;
            if (isValidData(cachedWrapper ? cachedWrapper.data : null)) return await applyPendingStallGuard(cachedWrapper.data, steamId, mode);   
            return { item_count: -1, total_value: "-", error: "Rate Limited" };
        }

        const count = data.total_inventory_count || (assetCount || 0);
        addLog(`[Inv] Count: ${count}${isTruncated ? `（partial：已得 ${assetCount}/${data.total_inventory_count || assetCount}，下轮轮询续拉）` : ''}`);

        const withPhase = settings.sps_show_phase !== false;
        const categories = categorizeInventory(data);

        if (count === 0) {

            const res = { item_count: 0, total_value: "0.00", source_label: "", error: null, top_items: [], categories: null };
            saveCacheData(key, res, CACHE_DURATION, ep);
            return res;
        }

        const provider = getPriceProvider(settings.sps_inv_source, settings);
        if (settings.sps_inv_source === 'steam' || !provider) {
            const res = { item_count: count, total_value: "-", source_label: "", error: null, top_items: [], categories, incomplete: isTruncated || undefined, overCap: isOverCap || undefined };
            saveCacheData(key, res, undefined, ep);
            return res;
        }

        let res = { item_count: count, total_value: "-", source_label: "", error: null, top_items: [], categories, incomplete: isTruncated || undefined, overCap: isOverCap || undefined };
    
    let srcPrices = {};
    
    let srcGoodIds = {};
    
    let srcPlatformIds = {};   
    
    let srcCN = {};

        {
            const result = await provider.value(data, settings);
            const topItems = result.top_items || [];
            if (!provider.cnFromValue) await applyZhNamesFromDict(topItems);   
            for (const it of  (topItems)) { if (it && it.name && it.name_cn) srcCN[it.name] = it.name_cn; }   
            srcPrices = result.itemPrices || {};
            srcGoodIds = result.itemGoodIds || {};
            srcPlatformIds = result.itemPlatformIds || {};
            Object.assign(srcCN, result.itemNamesCN || {});
            const cats = categorizeInventory(data, srcPrices);
            res = { item_count: count, total_value: result.value, source_label: provider.label(result, settings), error: result.error || null, top_items: topItems, categories: cats, incomplete: isTruncated || undefined, overCap: isOverCap || undefined };

            if (result.pendingTotal) { res.pendingTotal = true; res.pendingCount = result.pendingCount || 0; }
        }

        if (withPhase && data.asset_properties && data.asset_properties.length) {
            try {
                const isZh = settings.sps_language !== 'en';
                const pid = await getPrefabPid();
                if (provider) {
                    const reval = await phaseAwareRevalue({ data, pid, isZh, source: settings.sps_inv_source, settings, prices: srcPrices, goodIds: srcGoodIds, cn: srcCN, baseTotal: res.total_value });
                    if (reval) {
                        res.top_items = reval.top_items;
                        res.total_value = reval.total_value;
                        if (reval.unitByName) res.categories = categorizeInventory(data, reval.unitByName);
                    }
                } else {
                    res.top_items = enrichTopItemsWithSteamPhase(res.top_items, data, isZh, pid);
                    res.top_items = markAggregateGemNotes(res.top_items);
                }
            } catch (e) {  }
        }

        if (res.top_items && res.top_items.length > 6) {
            const finalVal = parseFloat(res.total_value);
            const thresholdRaw = Number(settings.sps_top12_threshold);
            const threshold = Number.isFinite(thresholdRaw) ? thresholdRaw : 10000;
            if (!(Number.isFinite(finalVal) && finalVal >= threshold)) res.top_items = res.top_items.slice(0, 6);
        }

        attachRarityInfo(res.top_items, data, settings.sps_language !== 'en');

        try {
            const cur = settings.sps_inv_source === 'steam_mkt' && settings.sps_currency === 'USD' ? 'USD' : 'CNY';
            res.currency = cur;
            const tradableByName = {};
            if (data.descriptions) for (const d of data.descriptions) {
                if (d.market_hash_name && d.tradable !== undefined) tradableByName[d.market_hash_name] = d.tradable !== 0;
            }
            for (const it of res.top_items) {
                if (!it) continue;
                it.currency = cur;
                if (it.name && tradableByName[it.name] === false) it.tradable = false;
            }

            buildStickerHashNames(res.top_items);
            const stickerNames = new Set();
            for (const it of res.top_items) {
                if (Number(it.qty) !== 1 || !Array.isArray(it.stickers)) continue;
                for (const s of it.stickers) {
                    if (!s || !s.hn) continue;
                    stickerNames.add(s.hn);
                }
            }
            const nameList = [...stickerNames].slice(0, 60);   
            if (nameList.length && provider && provider.stickerPrices) {

                const stickerPromise = (async () => {
                    try {
                        let stickerPrices = await provider.stickerPrices(nameList, settings);

                        if (settings.sps_sticker_steam_fallback !== false && stickerPrices && res.top_items
                            && settings.sps_inv_source !== 'steam_mkt') {
                            const missing = [...new Set(nameList.filter(hn => !(stickerPrices[hn] > 0)))].slice(0, 12);
                            if (missing.length) {
                                addLog(`[Inv] sticker steam fallback: ${missing.length}/${nameList.length} names missing → priceoverview`);
                                for (const hn of missing) {
                                    try {
                                        const r = await fetchSteamPriceOverview(hn, res.currency === 'USD' ? 'USD' : 'CNY');
                                        if (!r.ok) { addLog('[Inv] sticker steam fallback stopped (rate limited)'); break; }   
                                        if (r.price > 0) stickerPrices[hn] = r.price;
                                    } catch (e) { break; }
                                }
                            }
                        }
                        if (!stickerPrices || !res.top_items) return false;

                        let any = false;
                        for (const it of res.top_items) {
                            if (Number(it.qty) !== 1 || !Array.isArray(it.stickers)) continue;
                            let sum = 0;
                            for (const s of it.stickers) {
                                const p = s && s.hn ? stickerPrices[s.hn] : undefined;
                                if (p > 0) { s.p = p; sum += p; any = true; }   
                            }
                            if (sum > 0) it.stickerValue = sum;
                        }
                        return any;
                    } catch (e) { return false;  }
                })();
                const waitOverride = (typeof globalThis !== 'undefined' && globalThis.SPS_STICKER_WAIT_MS_OVERRIDE) || INV_STICKER_WAIT_MS;
                const timeoutP = new Promise(r => setTimeout(r, waitOverride, false));
                const inTime = await Promise.race([stickerPromise, timeoutP]);
                if (!inTime) {

                    stickerPromise.then((ok) => {
                        
                        if (!ok || ep !== _invPipelineEpoch() || res.error === "Rate Limited" || res.pendingTotal || res.incomplete) return;
                        saveCacheData(key, res, undefined, ep);
                        if (typeof cacheNotifyInventory === 'function') cacheNotifyInventory(key);   
                        addLog(`[Inv] sticker prices backfilled after timeout → inv19_ rewritten (${nameList.length} names)`);
                    }).catch(() => {});
                }
            }
        } catch (e) {  }

        let zhDescOk = true;
        if (settings.sps_language !== 'en' && res.top_items && res.top_items.length) {
            try {
                const needNames = res.top_items.map(it => it && it.name).filter(Boolean);

                const zhMap = await fetchZhDescMap(steamId, false, needNames);
                zhDescOk = needNames.length > 0 && needNames.every(n => !!zhMap[n]);

                await applyZhMarketNameOverlay(res.top_items, steamId);
                for (const it of res.top_items) {
                    const zh = it && it.name && zhMap[it.name];
                    if (!zh) continue;
                    if (Array.isArray(zh.desc) && zh.desc.length) it.desc = zh.desc;
                    if (zh.contents) {
                        const eng = it.contents;
                        if (eng && Array.isArray(eng.items)) {
                            zh.contents.items.forEach((x, i) => {
                                if (!x.r && eng.items[i] && eng.items[i].r) x.r = eng.items[i].r;
                            });
                        }
                        it.contents = zh.contents;   
                    }
                    if (Array.isArray(zh.tags) && zh.tags.length) it.tags = zh.tags;   
                    if (zh.itemset) it.itemset = zh.itemset;   
                    if (Array.isArray(zh.stickers) && zh.stickers.length) {
                        
                        const eng = Array.isArray(it.stickers) ? it.stickers : [];
                        it.stickers = zh.stickers.map((zs, i) => {
                            const e = eng.find(x => x && x.n && (x.n === zs.n || (zs.en && zs.en === x.n))) || eng[i];
                            if (e) return { ...zs, p: e.p, hn: e.hn };   
                            return zs;
                        });
                    }
                }
            } catch (e) { zhDescOk = false;  }
        }

        try {
            const accNames = [];
            for (const it of res.top_items) {
                if (Number(it.qty) !== 1 || !Array.isArray(it.stickers)) continue;
                for (const s of it.stickers) if (s && s.hn) accNames.push(s.hn);
            }
            const accGids = peekCsqaqGoodIds([...new Set(accNames)]);
            for (const it of res.top_items) {
                if (Number(it.qty) !== 1 || !Array.isArray(it.stickers)) continue;
                for (const s of it.stickers) {
                    if (!s || !s.hn) continue;
                    s.accUrl = buildTopItemMarketUrl({ name: s.hn, goodId: accGids[s.hn] }, settings, null, accGids);
                }
            }
        } catch (e) {  }

        try {
            const cqKey = String(settings.sps_csqaq_key || '').trim();
            if (cqKey && res.top_items && res.top_items.length) {
                const topNames = res.top_items.map(it => it && it.name).filter(Boolean);
                const peeked = peekCsqaqGoodIds(topNames);
                for (const n of Object.keys(peeked)) if (srcGoodIds[n] === undefined) srcGoodIds[n] = peeked[n];
                const missing = topNames.filter(n => srcGoodIds[n] === undefined);
                if (missing.length) prefetchCsqaqGoodIds(missing, cqKey);   
            }
        } catch (e) {  }
        if (srcGoodIds && Object.keys(srcGoodIds).length) {
            for (const it of res.top_items) {
                if (it && it.name && it.goodId === undefined && srcGoodIds[it.name]) it.goodId = srcGoodIds[it.name];
            }
        }
        await resolveTopItemIcons(res.top_items, data, settings, srcPlatformIds, srcGoodIds);

        try {
            const diag = res.top_items || [];
            const withDesc = diag.filter(it => it && Array.isArray(it.desc) && it.desc.length).length;
            const withStickers = diag.filter(it => it && Array.isArray(it.stickers) && it.stickers.length).length;
            const withContents = diag.filter(it => it && it.contents).length;
            const withSeed = diag.filter(it => it && it.seed !== undefined).length;
            const fc = diag.find(it => it && it.contents && Array.isArray(it.contents.items) && it.contents.items.length);
            const fcColor = fc ? (fc.contents.items[0].r || '(空)') : '(无contents)';
            addLog(`[Inv] top_items=${diag.length} zhDescOk=${zhDescOk} desc=${withDesc} stickers=${withStickers} contents=${withContents} seed=${withSeed} 首内容色=${fcColor}`);
        } catch (e) {}

        if (res.error !== "Rate Limited") {
            if (ep === _invPipelineEpoch()) {   
                const userTTL = await getUserCacheTTL();

                const ttl = (res.pendingTotal || res.incomplete) ? CACHE_DURATION : (zhDescOk ? undefined : Math.min(userTTL, CACHE_DURATION));
                saveCacheData(key, res, ttl, ep);
                if (typeof cacheNotifyInventory === 'function') cacheNotifyInventory(key);   
            } else {
                addLog(`[Inv] cache epoch changed mid-pipeline → skip inv19_ write-back`);
            }
        }
        return await applyPendingStallGuard(res, steamId, mode);
    } catch (e) {
        if (isValidData(cachedWrapper ? cachedWrapper.data : null)) return await applyPendingStallGuard(cachedWrapper.data, steamId, mode);   
        return { item_count: 0, total_value: "-", error: "Except" };
    }
}

const INV_PENDING_STALL_MS = 8 * 60e3;

const _invPendingSince = {};

async function invPendingSince(steamId, mode) {
    const mem = _invPendingSince[steamId + '|' + mode];
    if (mem) return mem;
    const key = CACHE_KEY_PREFIX + 'inv18_' + steamId + '_' + mode;
    let ts = 0;
    try {
        const wrap = await new Promise(r => chrome.storage.local.get(key, ( d) => r(d[key])));
        if (wrap && wrap.ts) ts = Number(wrap.ts) || 0;
    } catch (e) {  }
    if (!ts) { ts = Date.now(); try { chrome.storage.local.set({ [key]: { ts } }, () => {}); } catch (e) {  } }
    _invPendingSince[steamId + '|' + mode] = ts;
    return ts;
}

async function applyPendingStallGuard(res, steamId, mode) {
    if (!res || res.error) return res;
    if (res.pendingTotal) {

        res = Object.assign({}, res);
        const since = await invPendingSince(steamId, mode);
        res.pendingSince = since;   
        if (Date.now() - since >= INV_PENDING_STALL_MS) {
            delete res.pendingTotal; delete res.pendingCount;
            addLog(`[Inv] pendingTotal stall > 8min → present as complete for ${steamId} (${mode})`);
        }
        return res;
    }
    
    delete _invPendingSince[steamId + '|' + mode];
    try { chrome.storage.local.remove(CACHE_KEY_PREFIX + 'inv18_' + steamId + '_' + mode, () => {}); } catch (e) {  }
    return res;
}

const INV_JSON_REUSE_MS = 30e3;

const _invJsonInflight = new Map();

const _invJsonRecent = new Map();

function tryFetchInventoryOnce(steamId, force) {

    const recent = _invJsonRecent.get(steamId);
    if (recent && Date.now() - recent.ts < INV_JSON_REUSE_MS && !force) return Promise.resolve(recent.snap);
    _invJsonRecent.delete(steamId);   
    const existing = force ? _invJsonForced.get(steamId) : _invJsonInflight.get(steamId);
    if (existing) return existing;
    const p = tryFetchInventory(steamId).then(async (resp) => {
        if (!resp) return null;
        try {
            const data = await resp.json();
            
            return { ok: resp.ok, status: resp.status, json: async () => data, partial: resp.partial === true ? true : undefined, overCap: resp.overCap === true ? true : undefined, assetCount: (data && Array.isArray(data.assets)) ? data.assets.length : 0 };
        } catch (e) {
            
            return { ok: resp.ok, status: resp.status, json: async () => { throw e; }, partial: resp.partial === true ? true : undefined, overCap: resp.overCap === true ? true : undefined, assetCount: 0 };
        }
    }).then((snap) => {
        if (snap) {

            const weightOf = ( s) => (s && s.snap && typeof s.snap.assetCount === 'number') ? s.snap.assetCount : 0;
            const incoming = (typeof snap.assetCount === 'number') ? snap.assetCount : 0;
            let totalWeight = incoming;
            for (const v of _invJsonRecent.values()) totalWeight += weightOf(v);

            while ((totalWeight > 20000 || _invJsonRecent.size >= 8) && _invJsonRecent.size) {
                let oldestKey = null, oldestTs = Infinity;
                for (const [k, v] of _invJsonRecent) { if (v.ts < oldestTs) { oldestTs = v.ts; oldestKey = k; } }
                if (!oldestKey) break;
                totalWeight -= weightOf(_invJsonRecent.get(oldestKey));
                _invJsonRecent.delete(oldestKey);
            }
            _invJsonRecent.set(steamId, { snap, ts: Date.now() });
        }
        return snap;
    }).finally(() => { _invJsonInflight.delete(steamId); if (_invJsonForced.get(steamId) === p) _invJsonForced.delete(steamId); });
    _invJsonInflight.set(steamId, p);
    if (force) _invJsonForced.set(steamId, p);
    return p;
}

const STEAM_INV_BACKOFF_MS = 60e3;
const _steamInvBackoff = { until: 0 };

const STEAM_INV_PAGE_SIZE = 2500;

const STEAM_INV_MAX_PAGES = 8;

const STEAM_INV_GIANT_MAX_PAGES = 16;

const STEAM_INV_PAGE_GAP_MS = 450;

async function tryFetchInventory(steamId) {
    if (Date.now() < _steamInvBackoff.until) return null;   
    const fetchOpts =  ({ headers: { 'Cache-Control': 'max-age=0' }, credentials: 'include' });
    try {

        const cursorOf = ( dd) => dd && dd.last_assetid
            ? String(dd.last_assetid)
            : ((dd && dd.assets && dd.assets.length) ? String(dd.assets[dd.assets.length - 1].assetid || '') : '');
        const fetchPage = async ( url) => {
            try {
                const resp = await fetch(url, fetchOpts);
                let data = null, dataOk = false;
                try { data = await resp.json(); dataOk = true; } catch (e) {  }
                return { status: resp.status, ok: resp.ok, data, dataOk };
            } catch (e) { return null; }   
        };
        
        let acc = null;            
        let truncated = false;     

        let giantBoosted = false;

        for (let page = 0; page < STEAM_INV_GIANT_MAX_PAGES; page++) {

            const urls = page === 0 ? [
                `https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=${STEAM_INV_PAGE_SIZE}&raw_asset_properties=1`,
                `https://steamcommunity.com/profiles/${steamId}/inventory/json/730/2/?l=english&count=${STEAM_INV_PAGE_SIZE}&raw_asset_properties=1`
            ] : [
                `https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=${STEAM_INV_PAGE_SIZE}&start_assetid=${acc.lastAssetid}&raw_asset_properties=1`
            ];
            let pageData = null;
            for (const url of urls) {
                const pd2 = await fetchPage(url);
                if (pd2) pageData = pd2;   
                
                if (pageData && (pageData.status === 429 || (pageData.status === 200 && pageData.data))) break;
            }
            if (!pageData) {
                
                if (page > 0 && acc) { truncated = true; break; }
                return null;
            }
            if (pageData.status === 429) {
                _steamInvBackoff.until = Date.now() + STEAM_INV_BACKOFF_MS;
                if (page > 0 && acc) { truncated = true; break; }   
                const pd = pageData;
                return { ok: false, status: 429, partial: false, json: async () => { if (!pd.dataOk) throw new Error('unparseable body'); return pd.data; } };
            }
            if (pageData.status !== 200) {

                if (page === 0) {
                    const pd = pageData;
                    return { ok: false, status: pd.status, partial: false, json: async () => { if (!pd.dataOk) throw new Error('unparseable body'); return pd.data; } };
                }
                truncated = true; break;
            }
            const d = pageData.data;
            if (!d || !Array.isArray(d.assets)) {

                if (page === 0) {
                    const body = d, bodyOk = pageData.dataOk;
                    return { ok: true, status: 200, partial: false, json: async () => { if (!bodyOk) throw new Error('unparseable body'); return body; } };
                }
                truncated = true; break;
            }
            if (!acc) {

                acc = { data: d, lastAssetid: cursorOf(d), pages: 1, assetIds: new Set((d.assets || []).map(( a) => (a && a.assetid !== undefined) ? String(a.assetid) : '').filter(Boolean)) };
            } else {

                if (!Array.isArray(acc.data.assets)) acc.data.assets = [];
                for (const a of d.assets) {
                    if (!a) continue;
                    const aid = a.assetid !== undefined ? String(a.assetid) : '';
                    if (aid && acc.assetIds.has(aid)) continue;
                    if (aid) acc.assetIds.add(aid);
                    acc.data.assets.push(a);
                }

                if (!Array.isArray(acc.data.descriptions)) acc.data.descriptions = [];
                if (Array.isArray(d.descriptions)) {
                    const seen = new Set(acc.data.descriptions.map(( x) => x && x.classid + '|' + x.instanceid));
                    for (const desc of d.descriptions) {
                        if (!desc) continue;
                        const k = desc.classid + '|' + desc.instanceid;
                        if (!seen.has(k)) { seen.add(k); acc.data.descriptions.push(desc); }
                    }
                }
                if (!Array.isArray(acc.data.asset_properties)) acc.data.asset_properties = [];
                if (d.asset_properties && d.asset_properties.length) acc.data.asset_properties.push(...d.asset_properties);
                if (d.total_inventory_count) acc.data.total_inventory_count = d.total_inventory_count;
                const cur = cursorOf(d);
                if (cur) acc.lastAssetid = cur;
                acc.pages++;
            }
            const got = acc.data.assets.length;
            const total = acc.data.total_inventory_count || 0;
            
            if (!d.more_items || !acc.lastAssetid || (total > 0 && got >= total)) break;
            const cap = giantBoosted ? STEAM_INV_GIANT_MAX_PAGES : STEAM_INV_MAX_PAGES;
            if (page + 1 < cap) {
                await new Promise(r => setTimeout(r, STEAM_INV_PAGE_GAP_MS));
                continue;
            }
            if (!giantBoosted && page + 1 >= STEAM_INV_MAX_PAGES && page + 1 < STEAM_INV_GIANT_MAX_PAGES) {
                giantBoosted = true;   
                addLog(`[Inv] 巨型库存探测：8 页已拉 ${got} 件仍未收束 → 放宽到 ${STEAM_INV_GIANT_MAX_PAGES} 页`);
                await new Promise(r => setTimeout(r, STEAM_INV_PAGE_GAP_MS));   
                continue;
            }
            
            acc.overCap = true;
            truncated = true;
            break;
        }
        if (!acc) return null;
        if (truncated) acc.partial = true;
        if (acc.overCap) addLog(`[Inv] 分页封顶退出（${STEAM_INV_GIANT_MAX_PAGES} 页上限）：已得 ${acc.data.assets.length}/${acc.data.total_inventory_count || '?'} 件，overCap 交慢轮询`);
        else if (acc.partial) addLog(`[Inv] 分页中断（429/异常页）：已得 ${acc.data.assets.length} 件标记 partial，下轮轮询续拉`);
        else addLog(`[Inv] 分页完成：${acc.data.assets.length}/${acc.data.total_inventory_count || acc.data.assets.length} 件，${acc.pages} 页`);
        return { ok: true, status: 200, partial: !!acc.partial, overCap: !!acc.overCap, json: async () => acc.data };
    } catch (e) { return null; }
}

function buildStickerHashNames(topItems) {
    if (!topItems || !topItems.length) return;
    for (const it of topItems) {
        if (!it || !Array.isArray(it.stickers)) continue;
        for (const s of it.stickers) {
            if (!s || !s.n || s.hn) continue;
            const raw = s.slab ? s.n.replace(/^(?:Sticker\s*Slab|印花板)\s*[:：]\s*/i, '') : s.n;
            const norm = raw.replace(/\s*\|\s*/g, ' | ').replace(/\s+/g, ' ').trim();
            
            const cat = s.slab ? 'Sticker Slab | ' : /^(?:Sticker|Charm|Souvenir)\b/i.test(norm) ? '' : (s.kc ? 'Charm | ' : 'Sticker | ');
            s.hn = norm ? cat + norm : '';
        }
    }
}

const SKIN_NAME_STRIP_RE = /^(?:StatTrak™ |Souvenir )+|(?:(?: StatTrak™)|(?: Souvenir ))+(?=[^|]*\|)/g;
const WEAR_TAIL_RE = /\s*\((?:Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/;
function normSkinName(name) { return String(name || '').replace(SKIN_NAME_STRIP_RE, '').replace(WEAR_TAIL_RE, '').trim(); }

async function getFloatRangeTables() {
    const nameKey = CACHE_KEY_PREFIX + 'floatname_v1';
    const mapKey = CACHE_KEY_PREFIX + 'floatmap_v1';
    const baseKey = CACHE_KEY_PREFIX + 'sdtbase_tables_v1';

    const floatOp = (typeof cacheBeginOp === 'function') ? cacheBeginOp() : undefined;

    const store = await (typeof cacheGet === 'function'
        ? cacheGet([nameKey, mapKey, baseKey], { memoize: false })
        : new Promise(r => chrome.storage.local.get([nameKey, mapKey, baseKey], ( d) => r(d || {}))));
    const nw = store[nameKey], mw = store[mapKey], bwrap = store[baseKey];
    const now = Date.now();
    const nameOk = nw && nw.map && now - nw.ts < 30 * 24 * 3600e3;
    const mapOk = mw && mw.map && now - mw.ts < 30 * 24 * 3600e3;
    if (nameOk && mapOk) return { byName: nw.map, byPaint: mw.map, src: 'bymykel' };
    
    let settings = null;
    try { settings = await new Promise(r => chrome.storage.sync.get({ sps_float_source: 'bymykel' }, ( s) => r(s))); } catch (e) {  }
    if (settings && settings.sps_float_source === 'steamdt') {
        const baseOk = bwrap && bwrap.tables && now - bwrap.ts < 24 * 3600e3;
        if (baseOk) return { byName: bwrap.tables.byName || {}, byPaint: bwrap.tables.byPaint || {}, src: 'steamdt' };
        
        const apiKey = await new Promise(r => chrome.storage.local.get('sps_steamdt_key', ( d) => r((d && d.sps_steamdt_key) || '')));
        if (apiKey) {
            const items = await fetchSteamDTBaseInfo( (apiKey));
            if (items) {
                const tables = buildFloatTablesFromBase(items);
                if (Object.keys(tables.byPaint).length) {
                    
                    if (typeof cacheSet === 'function') cacheSet(baseKey, { tables }, floatOp !== undefined ? { epoch: floatOp } : undefined);
                    else storageSetCache({ [baseKey]: { ts: now, tables } });
                    addLog(`[Float] data source: steamdt /base (${items.length} items)`);
                    return { byName: tables.byName, byPaint: tables.byPaint, src: 'steamdt' };   
                }
            }
        }
        addLog('[Float] steamdt /base unavailable → fallback to bymykel');   
    }
    
    const skins = await fetchSkinsApi();
    const byName = nameOk ? nw.map : {};
    const byPaint = mapOk ? mw.map : {};
    if (skins) {
        
        const paintAcc = {};
        
        const nameAcc = {};
        for (const s of skins) {
            if (!s || s.paint_index == null || s.min_float == null || s.max_float == null) continue;
            const range = [Number(s.min_float), Number(s.max_float)];
            paintAcc[String(s.paint_index)] = range;
            const key = normSkinName(s.name);
            if (key && !nameAcc[key]) nameAcc[key] = { range };   
        }
        
        if (typeof cacheSet === 'function') {
            if (!nameOk && Object.keys(nameAcc).length) { Object.assign(byName, nameAcc); cacheSet(nameKey, { map: byName }, floatOp !== undefined ? { epoch: floatOp } : undefined); }
            if (!mapOk && Object.keys(paintAcc).length) { Object.assign(byPaint, paintAcc); cacheSet(mapKey, { map: byPaint }, floatOp !== undefined ? { epoch: floatOp } : undefined); }
        } else {
            if (!nameOk && Object.keys(nameAcc).length) { Object.assign(byName, nameAcc); storageSetCache({ [nameKey]: { ts: now, map: byName } }); }
            if (!mapOk && Object.keys(paintAcc).length) { Object.assign(byPaint, paintAcc); storageSetCache({ [mapKey]: { ts: now, map: byPaint } }); }
        }
    }
    return { byName, byPaint, src: 'bymykel' };
}

const SKINS_API_FAIL_TTL = 5 * 60e3;
const SKINS_API_MIRROR_TIMEOUT = 12e3;   
const _skinsApiFail = { until: 0 };
async function fetchSkinsApi() {
    if (Date.now() < _skinsApiFail.until) return null;
    const hosts = [
        'https://cdn.jsdelivr.net/gh/ByMykel/CSGO-API@main/public/api/en/skins.json',
        'https://fastly.jsdelivr.net/gh/ByMykel/CSGO-API@main/public/api/en/skins.json',
        'https://gcore.jsdelivr.net/gh/ByMykel/CSGO-API@main/public/api/en/skins.json',
    ];
    for (const url of hosts) {
        try {
            const resp = await fetchWithTimeout(url, undefined, SKINS_API_MIRROR_TIMEOUT);
            if (!resp.ok) continue;
            return await resp.json();
        } catch (e) {  }
    }
    _skinsApiFail.until = Date.now() + SKINS_API_FAIL_TTL;   
    return null;
}

async function getFloatRangeMap() {
    const cacheKey = CACHE_KEY_PREFIX + 'floatmap_v1';
    const wrap = await new Promise(r => chrome.storage.local.get(cacheKey, ( d) => r(d && d[cacheKey])));
    return (wrap && wrap.map) || {};
}
