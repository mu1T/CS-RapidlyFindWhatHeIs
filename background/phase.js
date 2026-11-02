const PAINT_PHASE_MAP = {
    415: 'Ruby', 416: 'Sapphire', 619: 'Sapphire', 417: 'Black Pearl', 617: 'Black Pearl',
    568: 'Emerald', 1119: 'Emerald',
    418: 'Phase 1', 852: 'Phase 1', 419: 'Phase 2', 618: 'Phase 2', 853: 'Phase 2',
    420: 'Phase 3', 854: 'Phase 3', 421: 'Phase 4', 855: 'Phase 4',
    569: 'Gamma Phase 1', 1120: 'Gamma Phase 1', 570: 'Gamma Phase 2', 1121: 'Gamma Phase 2',
    571: 'Gamma Phase 3', 1122: 'Gamma Phase 3', 572: 'Gamma Phase 4', 1123: 'Gamma Phase 4',
};

const PHASE_ZH_MAP = {
    'Ruby': '红宝石', 'Sapphire': '蓝宝石', 'Black Pearl': '黑珍珠', 'Emerald': '绿宝石',
    'Phase 1': 'P1', 'Phase 2': 'P2', 'Phase 3': 'P3', 'Phase 4': 'P4',
    'Gamma Phase 1': '伽马P1', 'Gamma Phase 2': '伽马P2', 'Gamma Phase 3': '伽马P3', 'Gamma Phase 4': '伽马P4',
};

const GEM_PAINTS = new Set([415, 416, 417, 568, 619, 617, 1119]);

function markAggregateGemNotes(rows) {
    if (!rows) return rows;
    for (let i = 0; i < rows.length; i++) {
        const it = rows[i];
        if (it && !it.phasePriced && it.paintIndex !== undefined && GEM_PAINTS.has(it.paintIndex)) rows[i] = { ...it, mktNote: true };
    }
    return rows;
}

function buildInventoryPhaseMaps(inventoryData, prefabPid) {
    const out = { paintsByName: {}, qtyByName: {}, classByNamePaint: {}, firstClassByName: {} };
    if (!inventoryData || !inventoryData.asset_properties || !inventoryData.assets) return out;
    const nameByClass = {};
    if (inventoryData.descriptions) {
        for (const d of inventoryData.descriptions) {
            if (d.classid && d.market_hash_name && !nameByClass[d.classid]) nameByClass[d.classid] = d.market_hash_name;
        }
    }
    const paintByAsset = {};
    for (const ap of inventoryData.asset_properties) {
        const arr = ap.asset_properties || [];
        for (const p of arr) {
            if (p.propertyid === prefabPid && p.int_value !== undefined && p.int_value !== '') {
                paintByAsset[ap.assetid] = parseInt(String(p.int_value), 10);
            }
        }
    }
    for (const a of inventoryData.assets) {
        const name = nameByClass[a.classid];
        if (!name) continue;
        out.qtyByName[name] = (out.qtyByName[name] || 0) + 1;
        if (out.firstClassByName[name] === undefined) out.firstClassByName[name] = a.classid;
        const paint = paintByAsset[a.assetid];
        if (paint !== undefined && paint !== null && !isNaN(paint) && PAINT_PHASE_MAP[paint] !== undefined) {
            (out.paintsByName[name] = out.paintsByName[name] || []).push(paint);
            if (out.classByNamePaint[name] === undefined) out.classByNamePaint[name] = {};
            if (out.classByNamePaint[name][paint] === undefined) out.classByNamePaint[name][paint] = a.classid;
        }
    }
    return out;
}

async function phaseAwareRevalue(opts) {
    const { data, pid, isZh, source, settings, prices, goodIds, cn, baseTotal } = opts;
    const maps = buildInventoryPhaseMaps(data, pid);
    const dopplerNames = Object.keys(maps.paintsByName).filter(n => (prices[n] || 0) > 0);
    if (!dopplerNames.length) return null;

    const phaseRows = [];
    for (const name of dopplerNames) {
        const paints = maps.paintsByName[name];
        const mergedUnit = Number(prices[name]) || 0;
        const totalQty = maps.qtyByName[name] || paints.length;
        const count = {};
        for (const p of paints) count[p] = (count[p] || 0) + 1;
        const knownQty = paints.length;
        const leftover = Math.max(0, totalQty - knownQty);
        const cnName = cn[name] || '';
        for (const p of Object.keys(count).map(Number)) {
            const qty = count[p];
            phaseRows.push({ name, name_cn: cnName, qty, unitPrice: mergedUnit, total: mergedUnit * qty, phase: getPhaseLabel(p, isZh), paintIndex: p, classid: (maps.classByNamePaint[name] || {})[p] });
        }
        if (leftover > 0) {
            phaseRows.push({ name, name_cn: cnName, qty: leftover, unitPrice: mergedUnit, total: mergedUnit * leftover, phase: '', classid: maps.firstClassByName[name] });
        }
    }

    let rows = phaseRows;
    try {
        if (source === 'csqaq') {
            const rp = await applyCSQAQPhasePrices(rows, goodIds, settings.sps_csqaq_key, settings.sps_csqaq_plat);
            rows = rp.rows;
        } else if (source === 'steam_mkt') {
            const rp = await applyPhaseMarketPrices(rows, data, pid);
            rows = rp.rows;
        }

    } catch (e) {  }
    rows = markAggregateGemNotes(rows);

    const pool = [];
    
    const unitByName = {};
    for (const [name, unit] of Object.entries(prices)) {
        if (dopplerNames.indexOf(name) >= 0) continue;
        const qty = maps.qtyByName[name] || 1;
        unitByName[name] = unit;
        pool.push({ name, name_cn: cn[name] || '', qty, unitPrice: unit, total: unit * qty, classid: maps.firstClassByName[name] });
    }
    const sumByDopplerName = {};
    for (const r of rows) {
        if (!r) continue;
        const n = r.name;
        sumByDopplerName[n] = (sumByDopplerName[n] || 0) + (Number(r.total) || 0);
    }
    for (const name of dopplerNames) {
        const qty = maps.qtyByName[name] || 1;
        const sum = sumByDopplerName[name];
        if (sum !== undefined && sum > 0 && qty > 0) unitByName[name] = sum / qty;
    }
    pool.push(...rows);
    pool.sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));
    const top = pool.slice(0, 12);

    const dopplerOld = dopplerNames.reduce((s, n) => s + (Number(prices[n]) || 0) * (maps.qtyByName[n] || 1), 0);
    const phaseNew = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
    const base = Number(baseTotal);
    const newTotal = isFinite(base) && base > 0 ? Math.max(0, base - dopplerOld + phaseNew) : phaseNew;
    addLog(`[Phase] aware revalue: dopplerNames=${dopplerNames.length} dopplerMerged=¥${dopplerOld.toFixed(0)} dopplerPhase=¥${phaseNew.toFixed(0)} top=${top.length}`);
    return { top_items: top, total_value: newTotal.toFixed(2), unitByName };
}

function getPhaseLabel(paintIndex, isZh) {
    const phase = PAINT_PHASE_MAP[paintIndex];
    if (!phase) return '';
    if (isZh) return `（${PHASE_ZH_MAP[phase] || phase}）`;
    return ` (${phase})`;
}

let _prefabPidCache = null;

function readVarint(bytes, off) {
    let r = 0, s = 0;
    while (off < bytes.length) {
        const b = bytes[off++];
        r |= (b & 0x7f) << s;
        if (!(b & 0x80)) break;
        s += 7;
    }
    return { v: r >>> 0, off };
}

function parsePropSchemaAll(bytes) {
    const map = {};
    let off = 0;
    const len = bytes.length;
    while (off < len) {
        const tag = readVarint(bytes, off); off = tag.off;
        const field = tag.v >>> 3, wire = tag.v & 7;
        if (field === 1 && wire === 2) {
            const l = readVarint(bytes, off); off = l.off;
            const end = off + l.v;
            let pid = -1, key = '';
            let o2 = off;
            while (o2 < end) {
                const t2 = readVarint(bytes, o2); o2 = t2.off;
                const f2 = t2.v >>> 3, w2 = t2.v & 7;
                if (w2 === 0) { const v2 = readVarint(bytes, o2); o2 = v2.off; if (f2 === 1) pid = v2.v; }
                else if (w2 === 2) {
                    const l2 = readVarint(bytes, o2); o2 = l2.off;
                    if (f2 === 2) key = new TextDecoder().decode(bytes.slice(o2, o2 + l2.v));
                    o2 += l2.v;
                }
                else if (w2 === 1) o2 += 8;
                else if (w2 === 5) o2 += 4;
                else break;
            }
            if (pid >= 0 && key) map[key] = pid;
            off = end;
        }
        else if (wire === 0) { const v = readVarint(bytes, off); off = v.off; }
        else if (wire === 2) { const l = readVarint(bytes, off); off = l.off + l.v; }
        else if (wire === 1) off += 8;
        else if (wire === 5) off += 4;
        else break;
    }
    return map;
}

let _propSchemaMapCache = null;
async function getPropertySchemaMap() {
    if (_propSchemaMapCache) return _propSchemaMapCache;
    const cacheKey = CACHE_KEY_PREFIX + 'propschema_map_v1';
    
    const wrap = await (typeof cacheGet === 'function' ? cacheGet(cacheKey) : new Promise(r => chrome.storage.local.get(cacheKey, ( d) => r(d[cacheKey]))));
    if (wrap && wrap.map && Date.now() - wrap.ts < 30 * 24 * 3600e3) {
        _propSchemaMapCache = wrap.map;
        return wrap.map;
    }
    let map = null;
    
    const schemaOp = (typeof cacheBeginOp === 'function') ? cacheBeginOp() : undefined;
    try {
        const resp = await fetch('https://api.steampowered.com/IEconService/GetAssetPropertySchema/v1?input_protobuf_encoded=CNoFEghzY2hpbmVzZQ%3D%3D');
        if (resp.ok) {
            const buf = new Uint8Array(await resp.arrayBuffer());
            map = parsePropSchemaAll(buf);
        }
    } catch (e) {  }
    if (!map || map['#attr_set_item_texture_prefab'] === undefined) {
        map = {
            '#attr_set_item_texture_seed': 1,
            '#attr_set_item_texture_wear': 2,
            '#attr_custom_name_attr': 5,
            '#attr_set_item_texture_prefab': 7
        };
    }
    _propSchemaMapCache = map;
    
    if (typeof cacheSet === 'function') cacheSet(cacheKey, { map }, schemaOp !== undefined ? { epoch: schemaOp } : undefined);
    else storageSetCache({ [cacheKey]: { map, ts: Date.now() } });
    return map;
}

async function getPrefabPid() {
    if (_prefabPidCache) return _prefabPidCache;
    const cacheKey = CACHE_KEY_PREFIX + 'propschema730';

    const pidOp = (typeof cacheBeginOp === 'function') ? cacheBeginOp() : undefined;
    
    const wrap = await (typeof cacheGet === 'function' ? cacheGet(cacheKey) : new Promise(r => chrome.storage.local.get(cacheKey, d => r(d[cacheKey]))));
    if (wrap && wrap.pid && Date.now() - wrap.ts < 30 * 24 * 3600e3) {
        _prefabPidCache = wrap.pid;
        return wrap.pid;
    }
    const map = await getPropertySchemaMap();
    const pid = map['#attr_set_item_texture_prefab'] !== undefined ? map['#attr_set_item_texture_prefab'] : 7;   
    _prefabPidCache = pid;
    
    if (typeof cacheSet === 'function') cacheSet(cacheKey, { pid }, pidOp !== undefined ? { epoch: pidOp } : undefined);
    else storageSetCache({ [cacheKey]: { pid, ts: Date.now() } });
    return pid;
}

function phaseResetForCacheClear() {
    _propSchemaMapCache = null;
    _prefabPidCache = null;
}

function enrichTopItemsWithSteamPhase(topItems, inventoryData, isZh, prefabPid) {
    if (!topItems || !topItems.length) return topItems;
    const assetProps = inventoryData && inventoryData.asset_properties;
    if (!assetProps || !assetProps.length) return topItems;

    const nameByClass = {};
    if (inventoryData.descriptions) {
        for (const d of inventoryData.descriptions) {
            if (d.classid && d.market_hash_name && !nameByClass[d.classid]) nameByClass[d.classid] = d.market_hash_name;
        }
    }
    const paintByAsset = {};
    for (const ap of assetProps) {
        const arr = ap.asset_properties || [];
        for (const p of arr) {
            if (p.propertyid === prefabPid && p.int_value !== undefined && p.int_value !== '') {
                paintByAsset[ap.assetid] = parseInt(String(p.int_value), 10);
            }
        }
    }
    const paintsByName = {};
    const classByNamePaint = {};
    const firstClassByName = {};
    if (inventoryData.assets) {
        for (const a of inventoryData.assets) {
            const name = nameByClass[a.classid];
            if (!name) continue;
            if (firstClassByName[name] === undefined) firstClassByName[name] = a.classid;
            const paint = paintByAsset[a.assetid];
            if (paint === undefined || paint === null || isNaN(paint)) continue;
            (paintsByName[name] = paintsByName[name] || []).push(paint);
            if (classByNamePaint[name] === undefined) classByNamePaint[name] = {};
            if (classByNamePaint[name][paint] === undefined) classByNamePaint[name][paint] = a.classid;
        }
    }
    if (!Object.keys(paintsByName).length) return topItems;

    const out = [];
    const unitPriceOf = (item) => Number(item.unitPrice) || 0;
    for (const item of topItems) {
        const paints = paintsByName[item.name];
        if (!paints || !paints.length) { out.push(item); continue; }
        const phaseCount = {}; 
        let unknown = 0;
        for (const pi of paints) {
            if (PAINT_PHASE_MAP[pi] !== undefined) phaseCount[pi] = (phaseCount[pi] || 0) + 1;
            else unknown++;
        }
        const phasePaints = Object.keys(phaseCount).map(Number);
        const itemQty = Number(item.qty) || paints.length;
        const noProp = Math.max(0, itemQty - paints.length); 
        if (!phasePaints.length) {
            out.push(item);
            continue;
        }
        const unitPrice = unitPriceOf(item);
        const knownTotal = phasePaints.reduce((s, pi) => s + phaseCount[pi], 0);
        if (phasePaints.length === 1 && unknown === 0 && noProp === 0) {
            out.push({ ...item, phase: getPhaseLabel(phasePaints[0], isZh), paintIndex: phasePaints[0], classid: (classByNamePaint[item.name] || {})[phasePaints[0]] });
            continue;
        }
        
        const rows = [];
        for (const pi of phasePaints) {
            const qty = phaseCount[pi];
            rows.push({ ...item, phase: getPhaseLabel(pi, isZh), paintIndex: pi, qty, total: unitPrice * qty, classid: (classByNamePaint[item.name] || {})[pi] });
        }
        const leftover = Math.max(0, itemQty - knownTotal);
        if (leftover > 0) rows.push({ ...item, qty: leftover, total: unitPrice * leftover, phase: '', classid: firstClassByName[item.name] });
        out.push(...rows);
    }
    return out;
}

