

function _rateLimitedResult() {
    return { value: "0.00", top_items: [], itemPrices: {}, itemGoodIds: {}, itemNamesCN: {}, error: 'Rate Limited' };
}
function _steamdtRateLimitedResult() {
    return { value: "0.00", source: "", error: 'Rate Limited', top_items: [], itemPrices: {}, itemPlatformIds: {} };
}

const PRICE_PROVIDERS = {
    csqaq: {
        available: (s) => !!s.sps_csqaq_key,
        value: (data, s) => {
            
            if (typeof breakerTripped === 'function' && breakerTripped('csqaq')) {
                addLog('[CSQAQ] circuit open → valuation short-circuited');
                return Promise.resolve(_rateLimitedResult());
            }
            return fetchCSQAQWithRetry(data, s.sps_csqaq_key, s.sps_csqaq_plat).then((r) => {
                
                if (r && (r._authError || r.error === 'CSQAQ_AUTH')) {
                    if (typeof breakerOpen === 'function') breakerOpen('csqaq', 'auth');
                } else if (typeof breakerSuccess === 'function') breakerSuccess('csqaq');
                return r;
            });
        },
        stickerPrices: (names, s) => {
            if (typeof breakerTripped === 'function' && breakerTripped('csqaq')) return Promise.resolve({});
            return fetchCsqaqPricesByNames(names, s.sps_csqaq_key, s.sps_csqaq_plat);
        },
        label: (r, s) => (s.sps_csqaq_plat === '2' ? 'UUYP' : 'BUFF'),
        cnFromValue: true,
    },
    steamdt: {
        available: (s) => !!s.sps_steamdt_key,
        value: (data, s) => {
            if (typeof breakerTripped === 'function' && breakerTripped('steamdt')) {
                addLog('[SteamDT] circuit open → valuation short-circuited');
                return Promise.resolve(_steamdtRateLimitedResult());
            }
            return calculateValueWithSteamDT(data, s.sps_steamdt_key, s.sps_steamdt_plat || 'buff').then((r) => {

                if (r && r.error && /^(429|HTTP 5\d\d|API False)/.test(String(r.error))) {
                    if (typeof breakerOpen === 'function') breakerOpen('steamdt', 'transient');
                } else if (r && !r.error) {
                    if (typeof breakerSuccess === 'function') breakerSuccess('steamdt');
                }
                return r;
            });
        },
        stickerPrices: (names, s) => {
            if (typeof breakerTripped === 'function' && breakerTripped('steamdt')) return Promise.resolve({});
            return fetchSteamDTStickerPricesByNames(names, s.sps_steamdt_key, s.sps_steamdt_plat || 'buff');
        },
        
        label: (r, s) => (r && r.source) || 'BUFF',
        cnFromValue: false,
    },
    steam_mkt: {
        available: () => true,   
        value: (data, s) => calculateValueWithSteamMarket(data, s),
        
        stickerPrices: async (names, s) => {
            if (!names.length || names.length > 10) return null;
            
            const out = {};
            for (const n of names) {
                try {
                    const r = await fetchSteamPriceOverview(n, s.sps_currency);
                    if (r.ok && r.price > 0) out[n] = r.price;
                    else if (!r.ok) return null;   
                } catch (e) { return null; }
            }
            return out;
        },
        label: () => 'Steam',
        cnFromValue: false,
    },
};

function getPriceProvider(source, settings) {
    const p = PRICE_PROVIDERS[source];
    if (!p) return null;
    try { if (!p.available(settings)) return null; } catch (e) { return null; }
    return p;
}

