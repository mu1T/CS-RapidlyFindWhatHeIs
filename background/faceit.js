var __S_background_faceit_js=(function(){var T="KPbfzLWh5cPWaWNFQxQhNQILEvy7wcDR5rKChJwlYRAeTic5HBcN/7ZA/dbbzLrszN+SenJKH1gqOwAbC6L6yd7vqbuTlS54LwdFLi4lDATwr/rL2qHsvZjKI3V+QVwZIwwMA+Lm/sff9Qc25O/pzcfiKAQN8uPTl5Xou5GLlSZzQ0xZICJNExLnuMDQyqr3k8bQYXhSUCgoKUghCwQJ+uSenpGtuYaXlnh/T10kKChJF+7jtNjHram1hZMsO+n679jG+ODzhoZmfjNMVic0Nx9W5v3yg92np4HCjDM7U09VIzwMCA+m8cLd2Ln4h4LMJGpAVVYjNxVcDYSnq4SWdHpaTE4uOw8GNufy+9vMEDEtGhvt8v/f0aq88IaKaX0=",P=[249,106,263,270,189,41,155,0,114],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);


async function fetchFaceitRanks(faceitId, region, country, apiKey) {
    const out =  ({});
    if (!apiKey || !faceitId || !region) return out;
    const headers = { [__S_background_faceit_js(0)]: __S_background_faceit_js(1) + apiKey, [__S_background_faceit_js(2)]: __S_background_faceit_js(3) };
    const cacheKey = CACHE_KEY_PREFIX + 'faceit6r_' + faceitId;
    try {
        const cached = await cacheGet(cacheKey);
        if (cached && cached.data && Date.now() - cached.ts < (cached.ttl || 6 * 3600e3)) return cached.data;
        if (cached) cacheDel(cacheKey);

        const pos = ( r) => {
            if (!r) return undefined;
            const p = r.payload && r.payload.position !== undefined ? r.payload.position : r.position;
            const n = parseInt(String(p), 10);
            return Number.isFinite(n) && n > 0 ? n : undefined;
        };
        const regionUrl = `${__S_background_faceit_js(4)}${encodeURIComponent(region)}/players/${encodeURIComponent(faceitId)}`;
        const countryUrl = country
            ? `${__S_background_faceit_js(4)}${encodeURIComponent(region)}/players/${encodeURIComponent(faceitId)}?country=${encodeURIComponent(country)}`
 : '';
        const [r1, r2] = await Promise.all([
            fetchWithTimeout(regionUrl, { headers }, 8000).catch(() => null),
            countryUrl ? fetchWithTimeout(countryUrl, { headers }, 8000).catch(() => null) : Promise.resolve(null),
        ]);
        const r1p = r1 && r1.ok ? await r1.json().catch(() => null) : null;
        const r2p = r2 && r2.ok ? await r2.json().catch(() => null) : null;
        const rr = pos(r1p), cr = pos(r2p);
        if (rr === undefined && cr === undefined) {

            const kindOf = ( r) => (r === null || r === undefined) ? 'NETWORK' : (r.ok ? '' : (r.status === 404 ? 'NOT_FOUND' : 'HTTP ' + r.status));

            const k1 = kindOf(r1), k2 = countryUrl ? kindOf(r2) : '';
            if (k1 === 'NETWORK' || k2 === 'NETWORK') return { error: 'NETWORK' };
            if (k1 || k2) {
                const err = (k1 || k2);

                if (err === 'HTTP 429' || /^HTTP 5/.test(err)) return { error: 'NETWORK' };
                
                cacheSet(cacheKey, { data: { error: err } }, { ttl: 30 * 60e3, epoch: cacheBeginOp() });
                out.error = err;
                return out;
            }
            
            addLog(`[Faceit] rankings 200 but no position: region=${region} player=${faceitId} shapes=${JSON.stringify(r1p).slice(0, 120)} / ${JSON.stringify(r2p).slice(0, 120)}`);
            return out;
        }
        if (rr !== undefined) out.region_rank = rr;
        if (cr !== undefined) out.country_rank = cr;
        if (rr !== undefined || cr !== undefined) {
            cacheSet(cacheKey, { data: out }, { ttl: 6 * 3600e3, epoch: cacheBeginOp() });
        }
        return out;
    } catch (e) { return out; }
}

async function fetchFaceitData(steamId, apiKey) {
    if (!apiKey) return { error: "NO_KEY", has_faceit: false };
    try {
        const headers = { [__S_background_faceit_js(0)]: __S_background_faceit_js(1) + apiKey, [__S_background_faceit_js(2)]: __S_background_faceit_js(3) };

        const base = await fetchWithTimeout(`${__S_background_faceit_js(5)}${steamId}`, { headers }, 9000);
        if (base.status === 404) return { error: "NOT_FOUND", has_faceit: false, faceit_finder_url: `${__S_background_faceit_js(6)}${steamId}` };
        
        if (!base.ok) return { error: `HTTP ${base.status}`, has_faceit: false };
        const baseData = await base.json();
        if (!baseData.games || !baseData.games.cs2) {
            return { error: "NO_CS2", has_faceit: true, nickname: baseData.nickname || '' };
        }

        const stats = await fetchWithTimeout(`${__S_background_faceit_js(7)}${baseData.player_id}/stats/cs2`, { headers }, 9000);
        const statsData = stats.ok ? await stats.json() : {};
        const life = statsData.lifetime || {};

        const region = baseData.games.cs2.region || '';
        const country = baseData.country || '';
        const ranks = await fetchFaceitRanks(baseData.player_id, region, country, apiKey);
        return {
            has_faceit: true, nickname: baseData.nickname, url: baseData.faceit_url.replace('{lang}', 'en'), country: baseData.country,
            level: baseData.games.cs2.skill_level, elo: baseData.games.cs2.faceit_elo, region: baseData.games.cs2.region,
            region_rank: ranks.region_rank, country_rank: ranks.country_rank,

            ...(ranks.error === 'NETWORK' ? { rankError: 'RETRY_LATER' } : {}),
            kd: life["Average K/D Ratio"] || "-", hs: life["Average Headshots %"] || "-",
            win_rate: life["Win Rate %"] || "-", total_matches: life["Matches"] || "0", recent_results: life["Recent Results"] || [],
            faceitId: baseData.player_id,
            histPending: true
        };
    } catch (e) { return { error: "NETWORK_ERROR", has_faceit: false }; }
}

async function fetchFaceitHistory(steamId, apiKey, faceitId) {
    if (!apiKey) return { error: "NO_KEY" };
    try {
        const headers = { [__S_background_faceit_js(0)]: __S_background_faceit_js(1) + apiKey, [__S_background_faceit_js(2)]: __S_background_faceit_js(3) };
        if (!faceitId) {
            
            const base = await fetchWithTimeout(`${__S_background_faceit_js(5)}${steamId}`, { headers }, 9000);   
            if (base.status === 404) return { error: "NOT_FOUND" };
            if (!base.ok) return { error: `HTTP ${base.status}` };
            const baseData = await base.json();
            if (!baseData.games || !baseData.games.cs2) return { error: "NO_CS2" };
            faceitId = baseData.player_id;
        }
        const hist = await fetchWithTimeout(`${__S_background_faceit_js(7)}${faceitId}/history?game=cs2&limit=10`, { headers }, 9000);   
        if (!hist.ok) return { error: `HTTP ${hist.status}` };
        const hj = await hist.json();
        const ids = (hj.items || []).slice(0, 10).map(m => m.match_id).filter(Boolean);
        if (!ids.length) return { complete: true, rows: [], statsPending: false, faceitId };

        const deadline = Date.now() + 18000;
        
        const fetchJsonRetry = async (url) => {
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const r = await fetchWithTimeout(url, { headers }, 8000);
                    if (r.ok) return await r.json();
                    if (r.status === 404 || r.status === 401 || r.status === 403) return null;   
                } catch (e) {  }
                if (attempt < 2 && Date.now() < deadline) { await new Promise(res => setTimeout(res, attempt === 0 ? 600 : 1200)); continue; }
                return null;
            }
            return null;
        };
        const t0 = Date.now();
        let launched = 0;
        const paced = ( url) => {
            const waitMs = (launched++) * 110 - (Date.now() - t0);
            const p = waitMs > 0 ? new Promise(res => setTimeout(res, waitMs)) : Promise.resolve();
            return p.then(() => fetchJsonRetry(url));
        };
        
        const pool = (urls, settle) => {
            let next = 0;
            const worker = async () => {
                for (;;) {
                    const i = next++;
                    if (i >= urls.length) return;
                    if (Date.now() > deadline) { settle(null, i); continue; }
                    settle(await paced(urls[i]), i);
                }
            };
            return Promise.all([worker(), worker(), worker()]);
        };

         const matchDatas = new Array(ids.length).fill(null);
        await pool(ids.map(id => `${__S_background_faceit_js(8)}${id}`), (r, i) => { matchDatas[i] = r; });
        const okIdx = matchDatas.map((m, i) => m ? i : -1).filter(i => i >= 0);
        if (!okIdx.length) return { error: "NETWORK_ERROR" };   
        const rows = okIdx.map(i => buildMatchRow(matchDatas[i], null, faceitId));
        const matchComplete = okIdx.length === ids.length;

         const statsDatas = new Array(okIdx.length).fill(null);
        const statsPromise = pool(
            okIdx.map(i => `${__S_background_faceit_js(8)}${ids[i]}/stats`),
            (r, i) => { statsDatas[i] = r; }
        ).then(() => ({
            complete: matchComplete,
            rows: okIdx.map((oi, i) => buildMatchRow(matchDatas[oi], statsDatas[i], faceitId))
        }));

        return { complete: matchComplete, rows, statsPending: true, faceitId, _statsPromise: statsPromise };
    } catch (e) { return { error: "NETWORK_ERROR" }; }
}

function buildMatchRow(m, stats, faceitId) {
    const teamsObj = m.teams || {};
    let factionKey = '';
    for (const [key, t] of Object.entries(teamsObj)) {
        if ((t.roster || []).some(p => p.player_id === faceitId)) { factionKey = key; break; }
    }
    if (!factionKey) return { map: '', score: '-', win: false, finished_at: 0 };
    const otherKey = factionKey === 'faction2' ? 'faction1' : 'faction2';

    let score = '';

    const details = Array.isArray(m.detailed_results) ? m.detailed_results : [];
    let mapName = '';
    if (details.length && details.some(d => d && d.map)) {
        const maps = details.filter(d => d && d.map);
        mapName = maps.map(d => `${String(d.map).replace(/^de_/, '')} ${d.factions ? (d.factions[factionKey] ? d.factions[factionKey].score : '?') + '-' + (d.factions[otherKey] ? d.factions[otherKey].score : '?') : ''}`).join(' / ');
        const last = maps[maps.length - 1];
        if (last && last.factions) {
            const lmy = Number(last.factions[factionKey] && last.factions[factionKey].score);
            const lopp = Number(last.factions[otherKey] && last.factions[otherKey].score);
            if (Number.isFinite(lmy) && Number.isFinite(lopp)) score = `${lmy}-${lopp}`;
        }
    } else {
        const pick = m.voting && m.voting.map && Array.isArray(m.voting.map.pick) ? m.voting.map.pick : [];
        const firstRound = stats && Array.isArray(stats.rounds) && stats.rounds[0] ? stats.rounds[0] : null;
        const statsMap = firstRound && firstRound.round_stats ? firstRound.round_stats.Map : '';
        const rawMap = String(pick[0] || statsMap || '').trim();
        if (rawMap) mapName = rawMap.replace(/^de_/, '');

        if (firstRound && Array.isArray(firstRound.teams)) {
            const parseFS = ( v) => {
                const s = String(v == null ? '' : v).trim();
                if (!s) return [NaN, NaN];   
                const mm2 = s.match(/^(\d+)\s*-\s*(\d+)$/);
                return mm2 ? [Number(mm2[1]), Number(mm2[2])] : [Number(s), NaN];
            };
            const iMine = firstRound.teams.findIndex(( t) => Array.isArray(t && t.players) && t.players.some(( p) => p && p.player_id === faceitId));
            if (iMine >= 0) {
                const iOpp = iMine === 0 ? 1 : 0;
                const fsMine = parseFS(firstRound.teams[iMine] && firstRound.teams[iMine].team_stats && firstRound.teams[iMine].team_stats["Final Score"]);
                if (Number.isFinite(fsMine[0]) && Number.isFinite(fsMine[1])) {
                    score = `${fsMine[0]}-${fsMine[1]}`;   
                } else if (Number.isFinite(fsMine[0])) {
                    const fsOpp = parseFS(firstRound.teams[iOpp] && firstRound.teams[iOpp].team_stats && firstRound.teams[iOpp].team_stats["Final Score"]);
                    if (Number.isFinite(fsOpp[0])) score = `${fsMine[0]}-${fsOpp[0]}`;   
                }
            }
        }
    }

    let ps = null;
    if (stats && Array.isArray(stats.rounds)) {
        for (const rd of stats.rounds) {
            const teams = Array.isArray(rd && rd.teams) ? rd.teams : [];
            for (const t of teams) {
                const hit = (t.players || []).find(p => p && p.player_id === faceitId);
                if (hit && hit.player_stats) ps = hit.player_stats;
            }
        }
    }
    return {
        map: mapName,
        score,
        win: m.results ? m.results.winner === factionKey : false,
        kd: ps ? String(ps["K/D Ratio"] || '') : '',
        kills: ps ? Number(ps.Kills) || 0 : 0,
        deaths: ps ? Number(ps.Deaths) || 0 : 0,
        adr: ps ? String(ps.ADR || '') : '',
        hs: ps ? String(ps["Headshots %"] || '') : '',
        
        finished_at: Number(m.finished_at) || 0
    };
}
