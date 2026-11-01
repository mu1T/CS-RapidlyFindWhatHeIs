function classifyInvType(type) {

    if (/CSGO_Type_WeaponCase|CSGO_Type_Container|Container|Weapon Case/i.test(type)) return 'cases';
    if (/CSGO_Type_Key/i.test(type)) return 'keys';
    if (/CSGO_Type_Agent/i.test(type)) return 'agents';
    if (/CSGO_Type_Graffiti/i.test(type)) return 'graffiti';
    if (/CSGO_Type_Pattern/i.test(type)) return 'stickers';

    if (/CSGO_Type_Weapon|CSGO_Type_Knife|CSGO_Type_Gloves|Weapon|Knife|Gloves|Rifle|Pistol|SMG|Shotgun|Machinegun/i.test(type)) return 'skins';
    return 'other';
}

function classifyByName(name) {

    if (/武器箱|胶囊|Container/i.test(name) || /\bCase(\s*\([^)]*\))?\s*$/i.test(name)) return 'cases';
    if (/音乐盒|Music Kit/i.test(name)) return 'other';   
    if (/探员|Agent/i.test(name)) return 'agents';
    if (/涂鸦|Graffiti/i.test(name)) return 'graffiti';
    if (/印花|Sticker|贴纸/i.test(name)) return 'stickers';
    if (/ \| /.test(name)) return 'skins';   
    return 'other';
}

function categorizeInventory(inventoryData, prices) {
    if (!inventoryData || !inventoryData.descriptions || !inventoryData.assets) return null;
    const selfFn =  (categorizeInventory);
    const memo = (selfFn._memo = selfFn._memo || new WeakMap());
    let base = memo.get(inventoryData);
    if (!base) {
        const cats = { skins: {c:0,v:0}, cases: {c:0,v:0}, keys: {c:0,v:0}, agents: {c:0,v:0}, stickers: {c:0,v:0}, graffiti: {c:0,v:0}, other: {c:0,v:0} };
        const countByClass = {};
        for (const a of inventoryData.assets) {
            countByClass[a.classid] = (countByClass[a.classid] || 0) + 1;
        }
        const seenTypes = {};
        const countedClass = {};  
        const rows = [];   
        for (const d of inventoryData.descriptions) {
            if (countedClass[d.classid]) continue;
            const n = countByClass[d.classid] || 0;
            if (!n) continue;
            countedClass[d.classid] = 1;
            const t = d.type || '(none)';
            seenTypes[t] = (seenTypes[t] || 0) + 1;
            let key = classifyInvType(t);
            if (key === 'other') key = classifyByName(d.market_hash_name || '');
            cats[key].c += n;
            rows.push({ cls: d.classid, name: d.market_hash_name || '', key, n });
        }
        base = { cats, rows, seenTypes };
        memo.set(inventoryData, base);
    }
    let cats;
    if (prices) {
        cats = {};
        for (const k of Object.keys(base.cats)) cats[k] = { c: base.cats[k].c, v: 0 };
        for (const r of base.rows) {
            const p = r.name ? prices[r.name] : 0;
            if (p > 0) cats[r.key].v += p * r.n;
        }
    } else {
        cats = base.cats;   
    }
    addLog(`[Inv] Types: ${JSON.stringify(base.seenTypes)}`);
    addLog(`[Inv] Categorize: ${JSON.stringify(cats)}`);
    return Object.values(cats).some(x => x.c > 0) ? cats : null;
}

const WEAR_CN = {
    'Factory New': '崭新出厂', 'Minimal Wear': '略有磨损', 'Field-Tested': '久经沙场',
    'Well-Worn': '破损不堪', 'Battle-Scarred': '战痕累累', 'Vanilla': '原版'
};

function parseStickerInfo(html) {
    const out = [];
    const re = /<img[^>]*>/g;
    let m;
    while ((m = re.exec(String(html || ''))) !== null) {
        const tag = m[0];
        const t = tag.match(/title="([^"]+)"/);
        const i = tag.match(/src="([^"]+)"/);
        if (t) {
            const slab = /^(?:Sticker\s*Slab|印花板)\s*[:：]/i.test(t[1]);
            const name = slab ? t[1].trim()
                : t[1].replace(/^(?:Sticker|Charm|Sealed Graffiti|挂件)\s*:\s*/i, '').trim();
            out.push({ n: name || t[1], i: i ? i[1] : '', ...(slab ? { slab: true } : {}) });
            if (out.length >= 8) break;
        }
    }
    return out;
}

function buildNameInfoMap(inventoryData) {

    const selfFn =  (buildNameInfoMap);
    const memo = (selfFn._memo = selfFn._memo || new WeakMap());
    if (inventoryData && memo.has(inventoryData)) return memo.get(inventoryData);
    const map = {};
    if (!inventoryData || !inventoryData.descriptions) return map;
    for (const d of inventoryData.descriptions) {
        const name = d && d.market_hash_name;
        if (!name) continue;   
        let rarityColor = '', exterior = '';
        if (Array.isArray(d.tags)) {
            const t = d.tags.find(t => t && t.category === 'Rarity');
            if (t && t.color) rarityColor = '#' + String(t.color).replace(/^#/, '');
        }
        const desc = [];
        let stickers = [];
        let contents = null;
        let itemset = '';   
        if (Array.isArray(d.descriptions)) {
            let inContents = false;   
            for (const sub of d.descriptions) {
                const v = sub && typeof sub.value === 'string' ? sub.value.trim() : '';
                if (!v) continue;

                if (sub.name === 'sticker_info' || /sticker_info|印花\s*:/i.test(v)) {
                    if (!stickers.length) stickers = parseStickerInfo(v);
                    continue;
                }

                if (sub.name === 'keychain_info' || /keychain_info|挂件\s*:|印花板\s*[:：]/i.test(v)) {
                    if (!stickers.some(s => s.kc)) stickers = stickers.concat(parseStickerInfo(v).map(x => ({ ...x, kc: true })));
                    continue;
                }
                if (v.length > 600) continue;
                if (/^(Exterior|外观)\s*:/i.test(v)) {
                    if (!exterior) exterior = v.split(':').slice(1).join(':').trim();
                    continue;
                }
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
                if (/包含下列|针对以下物品|购买报价|for the following|Contains one of the following/i.test(v)) {
                    inContents = true;
                    continue;
                }
                if (desc.length < 5) desc.push({ v, c: sub.color || '' });
            }
        }
        const tags = Array.isArray(d.tags) ? d.tags.map(t => (t && t.localized_tag_name) || '').filter(Boolean) : [];
        if (!itemset) {
            const itemsetTag = Array.isArray(d.tags) ? d.tags.find(t => t && t.category === 'ItemSet') : null;
            if (itemsetTag) itemset = String(itemsetTag.localized_tag_name || '');
        }
        const entry = { rarityColor, exterior, type: d.type || '', desc, stickers, tags, contents, itemset };
        const prev = map[name];
        if (!prev) { map[name] = entry; continue; }
        if (entry.desc.length > prev.desc.length) prev.desc = entry.desc;
        if (!prev.exterior && entry.exterior) prev.exterior = entry.exterior;
        if (!prev.type && entry.type) prev.type = entry.type;
        if (!prev.rarityColor && entry.rarityColor) prev.rarityColor = entry.rarityColor;
        if (!prev.stickers.length && entry.stickers.length) prev.stickers = entry.stickers;
        if (!prev.tags.length && entry.tags.length) prev.tags = entry.tags;
        if (!prev.contents && entry.contents) prev.contents = entry.contents;
        if (!prev.itemset && entry.itemset) prev.itemset = entry.itemset;
    }
    if (inventoryData) memo.set(inventoryData, map);
    return map;
}

function attachRarityInfo(topItems, inventoryData, isZh, nameInfoMap) {
    if (!topItems || !topItems.length) return topItems;
    try {
        nameInfoMap = nameInfoMap || buildNameInfoMap(inventoryData);
        const nameInfo = nameInfoMap;
        for (const it of topItems) {
            if (!it || !it.name) continue;
            const info = nameInfo[it.name];
            if (!info) continue;
            if (info.rarityColor) it.rarityColor = info.rarityColor;
            if (info.exterior) it.exterior = isZh ? (WEAR_CN[info.exterior] || info.exterior) : info.exterior;
            if (info.type) it.type = info.type;
            if (info.desc && info.desc.length) it.desc = info.desc;
            if (info.stickers && info.stickers.length) it.stickers = info.stickers;
            if (info.tags && info.tags.length) it.tags = info.tags;
            if (info.contents) it.contents = info.contents;
            if (info.itemset) it.itemset = info.itemset;
        }
    } catch (e) {  }
    return topItems;
}

