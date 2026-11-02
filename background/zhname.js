

let _zhNameDictPromise = null;

const ZHNAME_TTL = 30 * 24 * 3600e3;

const ZHNAME_DICT_MAX_ENTRIES = 20000;

function zhNameResetForCacheClear() { _zhNameDictPromise = null; }

const ZHNAME_WEAR_TAIL_RE = /\s*\((?:Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/;

const ZHNAME_STAR = '★';
const ZHNAME_STATTRAK = 'StatTrak™';

const ZHNAME_EN_PREFIX_VARIANTS = [
    { en: /^StatTrak™\s+/, zh: ZHNAME_STATTRAK },
    { en: /^Souvenir\s+/, zh: '纪念品' },
];

const ZHNAME_VARIANT_SUFFIXES = ['纪念品'];

const _zhSkinsApiFail = { until: 0 };

async function fetchZhSkinsApi() {

    if (Date.now() < _zhSkinsApiFail.until) return null;
    const hosts = [
        'https://cdn.jsdelivr.net/gh/ByMykel/CSGO-API@main/public/api/zh-CN/skins.json',
        'https://fastly.jsdelivr.net/gh/ByMykel/CSGO-API@main/public/api/zh-CN/skins.json',
        'https://gcore.jsdelivr.net/gh/ByMykel/CSGO-API@main/public/api/zh-CN/skins.json',
    ];
    for (const url of hosts) {
        try {
            const resp = await fetch(url);
            if (!resp.ok) continue;
            return await resp.json();
        } catch (e) {  }
    }
    _zhSkinsApiFail.until = Date.now() + 5 * 60e3;
    return null;
}

function zhComposeVariants(zhBase, variants) {
    if (!variants.length) return zhBase;
    const order = [ZHNAME_STAR, ZHNAME_STATTRAK, ...ZHNAME_VARIANT_SUFFIXES];
    const uniq = order.filter(v => variants.includes(v));
    const i = zhBase.indexOf('（');
    const j = zhBase.indexOf('）');
    if (i < 0 || j < i) {

        const sep = zhBase.indexOf(' | ');
        if (sep >= 0) return zhBase.slice(0, sep) + `（${uniq.join(' ')}）` + zhBase.slice(sep);
        return zhBase + `（${uniq.join(' ')}）`;
    }
    const head = zhBase.slice(0, i);
    const inner = zhBase.slice(i + 1, j).split(' ').filter(Boolean);
    const tail = zhBase.slice(j + 1);
    for (const v of uniq) if (!inner.includes(v)) inner.push(v);
    inner.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return head + `（${inner.join(' ')}）` + tail;
}

async function getZhNameDict() {
    if (_zhNameDictPromise) return _zhNameDictPromise;
    const p = (async () => {
        const cacheKey = CACHE_KEY_PREFIX + 'zhname_v2';

        const zhNameOp = (typeof cacheBeginOp === 'function') ? cacheBeginOp() : undefined;

        const wrap = await (typeof cacheGet === 'function' ? cacheGet(cacheKey, { memoize: false }) : new Promise(r => chrome.storage.local.get(cacheKey, ( d) => r(d[cacheKey]))));
        if (wrap && wrap.map && Date.now() - wrap.ts < ZHNAME_TTL) return wrap.map;
        
        const [enSkins, zhSkins] = [await fetchSkinsApi(), await fetchZhSkinsApi()];
        if (!enSkins || !zhSkins) return null;   
        const zhById = {};
        for (const s of zhSkins) { if (s && s.id && s.name) zhById[s.id] = s.name; }
        
        const map = {};
        for (const s of enSkins) {
            if (!s || !s.id || !s.name || !zhById[s.id]) continue;
            const enBase = String(s.name).replace(ZHNAME_WEAR_TAIL_RE, '').trim();
            const zhFull = String(zhById[s.id]);
            if (!enBase) continue;   
            
            const i = zhFull.indexOf('（');
            const j = zhFull.indexOf('）');
            let variants = [];
            let zhRest = zhFull;
            if (i > 0 && j > i) {
                variants = zhFull.slice(i + 1, j).split(' ').filter(Boolean);
                zhRest = zhFull.slice(0, i) + zhFull.slice(j + 1);
            }
            
            let enRest = enBase;
            for (const v of ZHNAME_EN_PREFIX_VARIANTS) {
                if (v.en.test(enRest)) {
                    enRest = enRest.replace(v.en, '');
                    if (!variants.includes(v.zh)) variants.push(v.zh);
                }
            }

            const dictKey = enRest.trim();
            if (!dictKey || !dictKey.includes(' | ') || dictKey.length > 120 || map[dictKey]) continue;
            map[dictKey] = zhComposeVariants(zhRest.trim(), variants) + '\u0000' + variants.join(',');
        }
        if (Object.keys(map).length && Object.keys(map).length <= ZHNAME_DICT_MAX_ENTRIES) {
            
            if (typeof cacheSet === 'function') cacheSet(cacheKey, { map }, zhNameOp !== undefined ? { epoch: zhNameOp } : undefined);
            else storageSetCache({ [cacheKey]: { ts: Date.now(), map } });
        }
        return map;
    })();
    _zhNameDictPromise = p;

    p.then((v) => { if (v === null && _zhNameDictPromise === p) _zhNameDictPromise = null; },
           () => { if (_zhNameDictPromise === p) _zhNameDictPromise = null; });
    return p;
}

const ZH_MARKET_NAME_TTL = 24 * 3600e3;
const ZH_MARKET_NAME_KEY = CACHE_KEY_PREFIX + 'zhname_cn_';   

async function getZhMarketNameMap(steamId) {
    const key = ZH_MARKET_NAME_KEY + steamId;
    
    const wrap = await (typeof cacheGet === 'function' ? cacheGet(key) : new Promise(r => chrome.storage.local.get(key, ( d) => r(d[key]))));
    if (wrap && wrap.map && Date.now() - wrap.ts < ZH_MARKET_NAME_TTL) return wrap.map;
    return {};
}

function buildZhMarketOverlay(zhInvData) {
    
    const map = {};
    if (!zhInvData || !Array.isArray(zhInvData.descriptions)) return map;
    for (const d of zhInvData.descriptions) {
        const hash = d && d.market_hash_name;
        const mn = d && d.market_name;
        if (!hash || !mn || map[hash]) continue;
        if (/[\u4e00-\u9fff]/.test(mn)) map[hash] = mn;
    }
    return map;
}

async function applyZhMarketNameOverlay(topItems, steamId) {
    if (!topItems || !topItems.length || !steamId) return topItems;
    try {
        const zhMap = await getZhMarketNameMap(steamId);
        if (!Object.keys(zhMap).length) return topItems;
        for (const it of topItems) {
            if (!it || !it.name || it.name_cn) continue;
            const zh = zhMap[it.name];
            if (zh) it.name_cn = zh;
        }
    } catch (e) {  }
    return topItems;
}

async function applyZhNamesFromDict(topItems) {
    if (!topItems || !topItems.length) return topItems;
    if (!topItems.some(it => it && it.name && it.name_cn === undefined)) return topItems;
    try {
        const dict = await getZhNameDict();
        if (!dict || !Object.keys(dict).length) return topItems;   
        for (const it of topItems) {
            if (!it || !it.name || it.name_cn !== undefined) continue;
            const raw = String(it.name);

            let base = raw.replace(ZHNAME_WEAR_TAIL_RE, '').trim();
            const starM = base.match(/^★\s+/);
            if (starM) base = base.slice(starM[0].length);
            
            const liveVariants = [];
            for (const v of ZHNAME_EN_PREFIX_VARIANTS) {
                if (v.en.test(base)) {
                    base = base.replace(v.en, '');
                    liveVariants.push(v.zh);
                }
            }
            
            const key = (starM ? ZHNAME_STAR + ' ' : '') + base.trim();
            const packed = dict[key];
            if (!packed) continue;
            const nul = packed.indexOf('\u0000');
            const zhBase = nul >= 0 ? packed.slice(0, nul) : packed;
            const dictVariants = nul >= 0 ? packed.slice(nul + 1).split(',').filter(Boolean) : [];

            const variants = dictVariants.filter(v => v === ZHNAME_STAR || liveVariants.includes(v));
            for (const lv of liveVariants) if (!variants.includes(lv)) variants.push(lv);   
            const zh = zhComposeVariants(zhBase, variants);
            const wear = (raw.match(/\(([^)]+)\)\s*$/) || [])[1] || '';
            it.name_cn = zh + (wear && WEAR_CN[wear] ? `（${WEAR_CN[wear]}）` : (wear ? ` (${wear})` : ''));
        }
    } catch (e) {  }
    return topItems;
}
