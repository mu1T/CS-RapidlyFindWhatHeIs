var __S_background_pw_js=(function(){var T="C7HIy6K98Iica3wPQCspFVp3MQMLHuShk5nY++Tb3sk+dUAEBSxvVxNP76mVhNquvYOQYT5/H1B4eW1bE7Pu+Z/U++i5jpI9cy1OWXwhqsEtRVdXTDw2CADloPnI2rWrtZzYZmZvWVkwOSkDGOqsKGdoXUYwanJFB/Pw6c7aqb24hZcoZE1dTDd6AgEWp/bRyNPmsoadkiUpbmdUXUl9e04eDOnix83QprGKntN9elRHTmU7Ch9Q7+rB3O+pv4qbLiQ5RxYQHnglRxj34rPw2eio78HAWT59BkYUPQYAGvzg0MrAhoWwsZ5pcldCdS4hLBYDyeHW2rKoqc7J",P=[12,152,111,194,77,0],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);
const PW_BASE_SEASONS = 25;      
const PW_PROBE_MAX = 40;         
const PW_PROBE_EMPTY_STOP = 2;   
const PW_SCAN_CAP = 60;          
const PW_PROBE_COOLDOWN = 24 * 3600 * 1000;   
const PW_SEASON_CONCURRENCY = 5;

const PW_SEASON_SHAPE = 3;
const PW_MD_SHAPE = 2;

function seasonNum(s) {
    const m = String(s || '').match(/s(\d+)/i);
    return m ? parseInt(m[1], 10) : 0;
}

function pwRequestHeaders() {
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 WanmeiPVP/1.0',
        'platform': 'pc',
        'Origin': 'https://pvp.wanmei.com',
        'Referer': 'https://pvp.wanmei.com/',
        'Content-Type': 'application/json',
        'appversion': '3.5.4.172'
    };
}

function unwrapPWData(json) {
    if (!json || typeof json !== 'object') return null;
    if (json.code === 0 || json.code === 200) return json.result || json.data || json;
    if (json.statusCode === 0) return json.data || json.result || json;
    if (json.result && typeof json.result === 'object') return json.result;
    if (json.data && typeof json.data === 'object') return json.data;
    if (json.name || json.pvpScore !== undefined || json.seasonId || json.pwRating !== undefined) return json;
    return null;
}

function pwNum(v) { const n = parseFloat(v); return isFinite(n) ? n : 0; }
function pwPct(v) { const n = pwNum(v); return n > 1 ? n : n * 100; }

const PW_S_TIER_MIN = 2401;   

function pwTrustStars(season, stars, bestScore) {
    const n = seasonNum(season);
    if (n !== 0 && n < 7) return 0;                 
    const st = pwNum(stars);
    if (st <= 0) return 0;
    const bs = pwNum(bestScore);
    if (bs > 0 && bs < PW_S_TIER_MIN) return 0;     
    return st;
}

function normalizePWStats(raw, seasonHint) {
    seasonHint = String(seasonHint || '');
    const d = unwrapPWData(raw);
    if (!d) return null;
    const historyScores = (Array.isArray(d.historyScores) ? d.historyScores : []).map(pwNum);
    let currentScore = historyScores.length ? historyScores[0] : pwNum(d.pvpScore);
    if (!currentScore) currentScore = pwNum(d.score || d.currentScore || d.pvpRating);
    const cnt = pwNum(d.cnt || d.matchCount || d.totalMatches);
    const hasAny = d.name || currentScore || cnt ||
        Array.isArray(d.hotMaps) || Array.isArray(d.hotWeapons2) || d.pwRating !== undefined;
    if (!hasAny) return null;
    return {
        success: true,
        name: d.name || d.nickname || d.playerName || '未知玩家',
        avatar: d.avatar || '',
        summary: d.summary || d.tag || '',
        seasonId: String(d.seasonId || d.season || d.csgoSeasonId || d.season_id || seasonHint || ''),
        cnt,
        winRate: pwPct(d.winRate || d.winRatePercent),
        currentScore,
        historyScores: historyScores.slice(0, 5),
        pwRating: pwNum(d.pwRating),
        commonRating: pwNum(d.commonRating),
        kd: pwNum(d.kd !== undefined ? d.kd : d.killDeathRatio),
        adr: pwNum(d.adr),
        avgWe: pwNum(d.avgWe !== undefined ? d.avgWe : d.we),
        rws: pwNum(d.rws),
        hsRatio: pwPct(d.headShotRatio !== undefined ? d.headShotRatio : d.headShotRate),
        kills: pwNum(d.kills), deaths: pwNum(d.deaths), assists: pwNum(d.assists),
        mvpCount: pwNum(d.mvpCount),
        multiKill: pwNum(d.multiKill),
        k2: pwNum(d.k2), k3: pwNum(d.k3), k4: pwNum(d.k4), k5: pwNum(d.k5),
        vs1: pwNum(d.vs1), vs2: pwNum(d.vs2), vs3: pwNum(d.vs3), vs4: pwNum(d.vs4), vs5: pwNum(d.vs5),
        vs1WinRate: pwPct(d.vs1WinRate),
        shot: pwNum(d.shot), snipe: pwNum(d.snipe), breach: pwNum(d.breach),
        prop: pwNum(d.prop), victory: pwNum(d.victory),

        hotMaps: d.hotMaps || [],
        hotWeapons: d.hotWeapons2 || d.hotWeapons || [],
        scoreList: d.scoreList || [],
        weList: d.weList || [],

        stars: pwTrustStars(seasonHint, d.stars, Math.max(currentScore, ...historyScores, 0)),

        matchHistory: (Array.isArray(d.historyDates) ? d.historyDates : []).map((dt, i) => ({
            date: String(dt || ''),
            rating: pwNum((Array.isArray(d.ratings) ? d.ratings : (d.historyRatings || []))[i]),
            pwRating: pwNum((Array.isArray(d.pwRatings) ? d.pwRatings : (d.historyPwRatings || []))[i]),
            rws: pwNum((Array.isArray(d.rwsList) ? d.rwsList : (d.historyRws || []))[i]),
            score: pwNum(((d.scoreList || [])[i] || {}).score),
            stars: pwTrustStars(seasonHint, ((d.scoreList || [])[i] || {}).stars, ((d.scoreList || [])[i] || {}).score),   
            matchId: String(((d.scoreList || [])[i] || {}).matchId || ''),   
            we: i < 10 ? pwNum((d.weList || [])[i]) : 0,
            seasonId: ''
        }))
    };
}

function extractSeasonInfo(raw, seasonHint) {
    const d = unwrapPWData(raw);
    if (!d) return null;
    const hs = (Array.isArray(d.historyScores) ? d.historyScores : []).map(pwNum);
    const score = (hs.length ? hs[0] : 0) || pwNum(d.pvpScore) || pwNum(d.score || d.pvpRating);
    const cnt = pwNum(d.cnt || d.matchCount || d.totalMatches);
    if (cnt <= 0 && score <= 0 && !d.name) return null;
    let peak = score;
    for (const v of hs) { if (v > peak) peak = v; }

    const slRows = Array.isArray(d.scoreList) ? d.scoreList : [];
    const seasonKey = String(d.seasonId || d.season || d.csgoSeasonId || seasonHint || '');
    let peakStars = pwTrustStars(seasonKey, d.stars, peak);
    for (const r of slRows) { const st = pwTrustStars(seasonKey, (r || {}).stars, (r || {}).score); if (st > peakStars) peakStars = st; }
    return {
        season: seasonKey,
        score, peak, cnt,
        stars: pwTrustStars(seasonKey, d.stars, peak), peakStars,
        winRate: pwPct(d.winRate),
        name: d.name || '',
        latestDate: (Array.isArray(d.historyDates) && d.historyDates[0]) || ''
    };
}

async function fetchPWSeason(steamId, seasonId, headers) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    const bodySeason = seasonId ? String(seasonId) : '';
    try {
        const res = await fetch('https://api.wmpvp.com/api/v2/csgo/pvpDetailStats', {
            method: 'POST', headers, signal: controller.signal,
            body: JSON.stringify({ steamId64: String(steamId), csgoSeasonId: bodySeason })
        });
        if (!res.ok) return { error: `HTTP ${res.status}`, seasonId };
        const json = await res.json().catch(() => null);
        return { seasonId, json };
    } catch (e) {
        return { error: 'NETWORK_ERROR', seasonId };
    } finally { clearTimeout(timer); }
}

async function searchPWUser(keyword) {
    try {
        const headers = {
            'appversion': '3.5.4.172',
            'Content-Type': 'application/json'
        };
        const res = await fetch('https://appengine.wmpvp.com/steamcn/app/search/user', {
            method: 'POST', headers,
            body: JSON.stringify({ keyword, page: 1 })
        });
        const json = await res.json();
        if (json.code === 1) return { users: json.result || [] };
        return { error: json.message || 'SEARCH_FAILED' };
    } catch (e) { return { error: e.message }; }
}

function pwGlobalSeasonKeys() {
    return { season: 'sps_pw_global_latest_season', probe: 'sps_pw_last_probe_time' };
}

async function pwEnsureGlobalSeason(baseSeasons) {
    const keys = pwGlobalSeasonKeys();
    const store = await new Promise(r => chrome.storage.local.get([keys.season], ( d) => r(d || {})));
    const cur = parseInt(store[keys.season], 10);
    if (!Number.isFinite(cur) || cur < 1 || cur > 200) {
        await new Promise(r => chrome.storage.local.set({ [keys.season]: baseSeasons }, () => r()));
        addLog(`[PW] Global season self-heal: ${isNaN(cur) ? 'missing' : cur} -> ${baseSeasons}`);
        return baseSeasons;
    }
    return cur;
}

function pwPickPeakSeason(seasonList) {
    const starOf = ( s) => Math.max(pwNum(s.stars), pwNum(s.peakStars));
    let maxScore = 0, maxSeason = '', maxKey = null;
    for (const s of (seasonList || [])) {
        if (!s || typeof s !== 'object') continue;   
        const peak = pwNum(s.peak);

        if (peak <= 0) continue;
        const st = starOf(s);
        const key = [st > 0 ? 1 : 0, st, peak];
        if (!maxKey || key[0] > maxKey[0]
            || (key[0] === maxKey[0] && (key[1] > maxKey[1] || (key[1] === maxKey[1] && key[2] > maxKey[2])))) {
            maxKey = key; maxScore = peak; maxSeason = s.season;
        }
    }
    return { maxScore, maxSeason };
}

async function fetchPWStats(steamId, baseSeasons = PW_BASE_SEASONS, phase2Callback = null) {
    baseSeasons = Math.max(1, parseInt(String(baseSeasons), 10) || PW_BASE_SEASONS);
    if (!steamId) return { error: 'NO_STEAMID' };
    const headers = pwRequestHeaders();
    try {
        const live = await fetchPWSeason(steamId, '', headers);
        const liveData = ( (normalizePWStats(live.json))) || {};
        const liveInfo = live.json ? extractSeasonInfo(live.json) : null;
        const liveHasStats = !!(liveInfo && (liveInfo.cnt > 0 || liveInfo.score > 0));

        const keys = pwGlobalSeasonKeys();
        let latestNum = await pwEnsureGlobalSeason(baseSeasons);
        const store = await new Promise(r => chrome.storage.local.get(keys.probe, ( d) => r(d || {})));
        const lastProbe = Number(store[keys.probe]) || 0;
        const probeDue = liveHasStats && Date.now() - lastProbe >= PW_PROBE_COOLDOWN && latestNum < 200;
        if (probeDue) {
            await new Promise(r => chrome.storage.local.set({ [keys.probe]: Date.now() }, () => r()));   
        }
        const currentId = 's' + latestNum;

        const pwBanPromise = fetchPWBanShared(steamId);
        const overview = {
            success: true,
            name: liveData.name || '未知玩家',
            summary: liveData.summary || '',
            avatar: liveData.avatar || '',
            seasonList: [{ season: currentId, score: 0, peak: 0, cnt: 0, winRate: 0, latestDate: '', stars: liveData.stars || 0, current: true }],
            maxScore: 0, maxSeason: '',
            currentSeason: currentId,
            pwBan: { success: false, pending: true, records: [] },
            phase2: true
        };

        (async () => {
            try {
                const slotMap = {};
                const pwBan = await pwBanPromise;   
                
                const baseIds = Array.from({ length: Math.min(Math.max(baseSeasons, latestNum), PW_SCAN_CAP) }, (_, i) => 's' + (i + 1));
                let nextIdx = 0;
                const worker = async () => {
                    while (nextIdx < baseIds.length) {
                        const sid = baseIds[nextIdx++];
                        const r2 = await fetchPWSeason(steamId, sid, headers);
                        if (r2.json) {
                            const info = extractSeasonInfo(r2.json, sid);   
                            if (info) slotMap[sid] = info;
                        }
                    }
                };
                await Promise.all(Array.from({ length: Math.min(PW_SEASON_CONCURRENCY, baseIds.length) }, () => worker()));

                if (probeDue) {

                    let probeNum = latestNum + 1;
                    let emptyRun = 0;
                    let probeVerified = false;   
                    let probeAborted = false;
                    const probeMax = Math.max(PW_PROBE_MAX, latestNum + 5);
                    while (probeNum <= probeMax) {
                        const sid = 's' + probeNum;
                        const r2 = await fetchPWSeason(steamId, sid, headers);
                        const inner = r2.json ? unwrapPWData(r2.json) : null;
                        const info = r2.json ? extractSeasonInfo(r2.json, sid) : null;
                        addLog(`[PW] Probe ${sid}: ok=${!r2.error} cnt=${info ? info.cnt : '-'} score=${info ? info.score : '-'} date=${info ? info.latestDate : '-'}`);
                        if (r2.error || !inner || !info) {
                            if (!probeVerified) probeAborted = true;   
                            break;
                        }
                        probeVerified = true;
                        const sameAs = (a) => a && a.cnt === info.cnt && a.score === info.score && a.latestDate === info.latestDate;
                        const dupSlot = info.cnt > 0 ? Object.keys(slotMap).find(k => sameAs(slotMap[k])) : undefined;
                        const dupLive = info.cnt > 0 && sameAs(liveInfo);
                        if (dupSlot !== undefined || dupLive) {
                            if (probeNum === latestNum + 1 && dupSlot !== undefined && !dupLive) {

                                slotMap[sid] = info;
                                probeNum++;
                                continue;
                            }
                            break;   
                        }
                        slotMap[sid] = info;
                        if (info.cnt <= 0 && info.score <= 0) {

                            if (!liveHasStats) {
                                emptyRun++;
                                if (emptyRun >= PW_PROBE_EMPTY_STOP) break;
                            }
                        }
                        probeNum++;
                    }

                    if (probeAborted) {
                        await new Promise(r => chrome.storage.local.set({ [keys.probe]: lastProbe }, () => r()));
                        addLog('[PW] Probe aborted on first request, cooldown stamp restored');
                    }

                    const newLatest = probeNum - 1;
                    if (newLatest > latestNum) {
                        
                        addLog(`[PW] NEW SEASON detected: s${latestNum} -> s${newLatest}`);
                        latestNum = newLatest;
                        await new Promise(r => chrome.storage.local.set({ [keys.season]: latestNum }, () => r()));
                        chrome.storage.sync.get({ sps_pw_base_seasons: PW_BASE_SEASONS }, ( s) => {
                            if ((parseInt(s.sps_pw_base_seasons, 10) || 0) < latestNum) {
                                chrome.storage.sync.set({ sps_pw_base_seasons: latestNum });   
                            }
                        });
                        chrome.runtime.sendMessage({ type: 'PW_SEASON_UPDATE', seasonId: 's' + latestNum }).catch(() => {});
                    } else {
                        addLog(`[PW] Probe end: no new season (latest stays s${latestNum}), next check in 24h`);
                    }
                }

                const withData = Object.keys(slotMap)
                    .filter(k => slotMap[k].cnt > 0 || slotMap[k].score > 0)
                    .sort((a, b) => seasonNum(b) - seasonNum(a));

                if (!probeDue && latestNum < baseSeasons) {
                    addLog(`[PW] Global season self-heal (below base): s${latestNum} -> s${baseSeasons}`);
                    latestNum = baseSeasons;
                    await new Promise(r => chrome.storage.local.set({ [keys.season]: latestNum }, () => r()));
                }
                const latestId = 's' + latestNum;
                const seasonList = withData.map(sid => ({
                    season: sid, score: slotMap[sid].score, peak: slotMap[sid].peak,
                    cnt: slotMap[sid].cnt, winRate: slotMap[sid].winRate,
                    stars: slotMap[sid].stars || 0, peakStars: slotMap[sid].peakStars || 0,
                    latestDate: slotMap[sid].latestDate, current: sid === latestId
                }));
                if (!seasonList.some(s => s.season === latestId)) {
                    const li = slotMap[latestId];
                    seasonList.unshift({
                        season: latestId, score: li ? li.score : 0, peak: li ? li.peak : 0,
                        cnt: li ? li.cnt : 0, winRate: li ? li.winRate : 0,
                        stars: li ? li.stars || 0 : 0, peakStars: li ? li.peakStars || 0 : 0,
                        latestDate: li ? li.latestDate : '', current: true
                    });
                }
                const picked = pwPickPeakSeason(seasonList);
                const maxScore = picked.maxScore, maxSeason = picked.maxSeason;
                
                const liveMh = liveData.matchHistory;
                if (Array.isArray(liveMh) && liveMh.length) {
                    const seasonEnds = Object.keys(slotMap)
                        .map(sid => ({ sid, ts: Date.parse(String(slotMap[sid].latestDate || '').replace(' ', 'T') + '+08:00') }))
                        .filter(x => Number.isFinite(x.ts) && x.ts > 0)
                        .sort((a, b) => a.ts - b.ts);
                    for (const row of liveMh) {
                        const t = Date.parse(String(row.date || '').replace(' ', 'T') + '+08:00');
                        if (!Number.isFinite(t)) { row.season = ''; continue; }
                        const hit = seasonEnds.find(x => x.ts >= t);
                        row.season = hit ? hit.sid : (latestId || '');
                    }
                }
                addLog(`[PW] Phase2 ${steamId}: seasons=${seasonList.length} max=${maxScore}@${maxSeason} current=${latestId}`);
                if (phase2Callback) phase2Callback({
                    steamId,
                    name: liveData.name || '未知玩家',   
                    avatar: liveData.avatar || '',
                    summary: liveData.summary || '',
                    seasonList, maxScore, maxSeason,
                    currentSeason: latestId,
                    matchHistory: liveMh || [],
                    stars: liveData.stars || 0,   
                    pwBan,   
                    phase2: false
                });
            } catch (e) {
                addLog(`[PW] Phase2 failed: ${e && e.message ? e.message : e}`);
                if (phase2Callback) phase2Callback({ steamId, error: e && e.message ? e.message : 'PHASE2_FAILED' });
            }
        })();

        return overview;
    } catch (e) { return { error: e.message || 'EXCEPTION' }; }
}

const _pwBanInflight = new Map();

async function fetchPWBanShared(steamId, cacheTTL = 5 * 60000) {
    if (!steamId) return { error: 'NO_STEAMID' };
    const cacheKey = CACHE_KEY_PREFIX + 'pwb_' + steamId;

    const op = (typeof cacheBeginOp === 'function') ? cacheBeginOp() : undefined;
    try {
        const e = await cacheGet(cacheKey);
        if (e && e.data && e.data.success && Date.now() - e.ts < cacheTTL) return e.data;
    } catch (e) {  }
    const inflight = _pwBanInflight.get(steamId);
    if (inflight) return inflight;
    const p = fetchPWBanStatus(steamId).then(data => {
        
        if (data && data.success) {
            if (typeof cacheSet === 'function') cacheSet(cacheKey, { data }, op !== undefined ? { epoch: op } : undefined);
            else storageSetCache({ [cacheKey]: { data, ts: Date.now() } });
        }
        return data;
    }).finally(() => _pwBanInflight.delete(steamId));
    _pwBanInflight.set(steamId, p);
    return p;
}

function pwTsToLocal(ts) {
    const n = parseInt(String(ts), 10);
    if (!Number.isFinite(n) || n <= 0) return '';
    const d = new Date(n * 1000);
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function fetchPWBanStatus(steamId) {
    if (!steamId) return { error: 'NO_STEAMID' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(`https://esports.wanmei.com/match-api/forbid-info?uid_list=${encodeURIComponent(String(steamId))}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://pvp.wanmei.com/csgo/ban'
            },
            signal: controller.signal
        });
        if (!res.ok) return { error: `HTTP ${res.status}` };
        const json = await res.json().catch(() => null);
        if (!json || json.status !== 'success') return { error: (json && json.message) || 'API_FAILED' };
        const payload = json.result || {};
        const rawList = payload[String(steamId)] || [];
        const records = (Array.isArray(rawList) ? rawList : []).map(item => ({
            forbidType: String(item.forbid_type || ''),
            pac: String(item.forbid_type) === '1' || String(item.forbid_type) === '100',
            active: String(item.enable) === '1',
            begin: pwTsToLocal(item.create_time),
            end: pwTsToLocal(item.expire_time),
            nickname: String(item.nickname || '')
        }));
        addLog(`[PW] Ban ${steamId}: records=${records.length} active=${records.filter(r => r.active).length}`);
        return { success: true, records, queriedAt: Date.now() };
    } catch (e) {
        return { error: (e && e.name === 'AbortError') ? 'TIMEOUT' : 'NETWORK_ERROR' };
    } finally { clearTimeout(timer); }
}    

async function fetchPWSeasonData(steamId, seasonId) {
    if (!steamId || !seasonId) return { error: 'NO_PARAM' };
    const r = await fetchPWSeason(steamId, seasonId, pwRequestHeaders());
    if (r.error) return { error: r.error };
    const stats = normalizePWStats(r.json, seasonId);
    if (!stats) return { error: 'NO_DATA' };
    
    if (Array.isArray(stats.matchHistory)) {
        for (const row of stats.matchHistory) { row.seasonId = String(seasonId); }
    }

    return Object.assign({ fetchedAt: Date.now(), success: true }, stats);
}

function pwSidKeys() {
    return { sps_pw_mysteamid: '', sps_pw_my_steamid: '', sps_my_steamid: '' };
}

function pwDetailCreds(s) {

    return { token: String(s && s.sps_pw_token || '').trim(),
             mySteamId: String(s && (s.sps_pw_mysteamid || s.sps_pw_my_steamid || s.sps_my_steamid) || '').trim().replace(/\D/g, '') };
}

async function verifyPWCreds(token, mySteamId) {
    if (!token || !mySteamId) return { error: 'NO_PARAM' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch('https://api.wmpvp.com/api/csgo/home/match/list', {
            method: 'POST', signal: controller.signal,
            headers: { ...pwRequestHeaders(), 'token': token, 'gameType': '1,2', 'gameTypeStr': '1,2' },
            body: JSON.stringify({ csgoSeasonId: 'recent', dataSource: 3, mySteamId: String(mySteamId),
                page: 1, pageSize: 1, pvpType: -1, toSteamId: String(mySteamId) })
        });
        if (!res.ok) return { error: 'HTTP_' + res.status };
        const json = await res.json().catch(() => null);
        if (!json || json.statusCode !== 0) return { error: json && json.errorMessage ? String(json.errorMessage).slice(0, 80) : 'INVALID_TOKEN' };
        const list = json.data && Array.isArray(json.data.matchList) ? json.data.matchList : [];
        const self = list.find(( r) => String(r.playerId) === mySteamId);
        return { success: true, nickname: self ? String(self.steamNick || self.steamName || '') : '' };
    } catch (e) {
        return { error: (e && e.name === 'AbortError') ? 'TIMEOUT' : 'NETWORK_ERROR' };
    } finally { clearTimeout(timer); }
}

function pwLooksLikeToken(v) {
    const s = String(v == null ? '' : v).trim().replace(/^bearer\s+/i, '').trim();
    if (!/^[A-Za-z0-9._~+/=-]{16,512}$/.test(s)) return false;
    if (!/[A-Za-z]/.test(s)) return false;                       
    if (/(:\/\/|\.(?:com|cn|net|org|io|html?|js|json|png|jpe?g|gif|svg|css|woff2?|map)$)/i.test(s)) return false;   
    return true;
}

function pwTokenFingerprint(v) {
    const s = String(v || '');
    if (!s) return 'EMPTY';
    const cls = /^[0-9a-f]+$/i.test(s) ? 'hex' : (/^[A-Za-z0-9_-]+$/.test(s) ? 'b64url' : (/^[A-Za-z0-9+/=]+$/.test(s) ? 'b64' : 'mixed'));
    return cls + (s.split('.').length === 3 ? '+jwt' : '');
}

async function pwStoreTokenIfChanged(token) {
    const cur = await chrome.storage.local.get({ sps_pw_token: '' });
    if (String(cur.sps_pw_token || '').trim() === token) return false;
    await chrome.storage.local.set({ sps_pw_token: token });
    return true;
}

async function pwNoteMySteamId(id) {
    const mine = String(id || '').replace(/\D/g, '');
    if (!/^7656119\d{10}$/.test(mine)) return '';
    const s = await chrome.storage.sync.get({ sps_pw_mysteamid: '' });
    if (String(s.sps_pw_mysteamid || '').trim()) return '';     
    await chrome.storage.sync.set({ sps_pw_mysteamid: mine });
    addLog(`[PW] 本人 SteamID 已自动补记（${mine}，来自页面身份键）`);
    return mine;
}

function pwSteamIdFromToken(token) {
    try {
        const parts = String(token || '').split('.');
        if (parts.length !== 3) return '';
        const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
        const json = JSON.parse(atob(padded));
        const found = [];
        (function walk( v) {
            if (typeof v === 'string') { if (/^7656119[0-9]{10}$/.test(v)) found.push(v); return; }
            if (typeof v === 'number' && /^7656119[0-9]{10}$/.test(String(v))) { found.push(String(v)); return; }
            if (v && typeof v === 'object') { for (const k of Object.keys(v)) walk(v[k]); }
        })(json);
        return found[0] || '';
    } catch (e) { return ''; }
}

async function pwCaptureToken(token, steamid, source) {
    const t = String(token || '').trim();
    const src = String(source || 'url').replace(/[^A-Za-z_:]/g, '').slice(0, 24) || 'url';
    if (!pwLooksLikeToken(t)) {
        addLog(`[PW] 捕获被拒：不像凭证 source=${src} len=${t.length} fp=${pwTokenFingerprint(t)}`);
        return { success: false, error: 'BAD_SHAPE' };
    }
    const wrote = await pwStoreTokenIfChanged(t);
    await chrome.storage.local.set({ sps_pw_verify: null });
    let mine = String(steamid || '').replace(/\D/g, '');
    if (!/^7656119[0-9]{10}$/.test(mine)) mine = pwSteamIdFromToken(t);
    let steamIdSaved = '';
    if (mine) {
        const s = await chrome.storage.sync.get({ sps_pw_mysteamid: '' });
        if (!String(s.sps_pw_mysteamid || '').trim()) {
            await chrome.storage.sync.set({ sps_pw_mysteamid: mine });
            steamIdSaved = mine;
        }
    }
    if (wrote) addLog(`[PW] 登录凭证已捕获（source=${src} len=${t.length}${steamIdSaved ? '，本人 SteamID=' + steamIdSaved : ''}）`);
    return { success: true, changed: wrote, mySteamId: steamIdSaved };
}

async function fetchPWMatchListRaw(token, mySteamId, toSteamId, seasonId, page) {
    const pg = Math.max(1, parseInt(String(page || 1), 10) || 1);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch('https://api.wmpvp.com/api/csgo/home/match/list', {
            method: 'POST', signal: controller.signal,
            headers: { ...pwRequestHeaders(), 'token': token, 'gameType': '1,2', 'gameTypeStr': '1,2' },
            body: JSON.stringify({ csgoSeasonId: String(seasonId || 'recent'), dataSource: 3,
                mySteamId: String(mySteamId), page: pg, pageSize: 100, pvpType: -1,
                toSteamId: String(toSteamId) })
        });
        if (!res.ok) { addLog(`[PW] MatchList HTTP_${res.status} season=${seasonId} page=${pg}`); return { error: 'HTTP_' + res.status }; }
        const json = await res.json().catch(() => null);
        if (!json || json.statusCode !== 0) {
            const msg = json && json.errorMessage ? String(json.errorMessage).slice(0, 80) : 'REQUEST_FAILED';
            addLog(`[PW] MatchList fail season=${seasonId} page=${pg} code=${json && json.statusCode} msg=${msg}`);
            return { error: msg };
        }
        const list = json.data && Array.isArray(json.data.matchList) ? json.data.matchList : [];
        addLog(`[PW] MatchList ok season=${seasonId} page=${pg} rows=${list.length}`);
        return { list };
    } catch (e) {
        return { error: (e && e.name === 'AbortError') ? 'TIMEOUT' : 'NETWORK_ERROR' };
    } finally { clearTimeout(timer); }
}

function normalizePWMatchRows(list, seasonId) {
    return (list || []).map(( m) => {
        const myTeam = pwNum(m.team), winTeam = pwNum(m.winTeam);
        const s1 = pwNum(m.score1), s2 = pwNum(m.score2);

        const isTie = winTeam < 0 || (s1 > 0 && s1 === s2);
        return {
            matchId: String(m.matchId || ''),
            date: String(m.endTime || m.startTime || ''),  
            map: String(m.mapName || ''),
            kills: pwNum(m.kill), deaths: pwNum(m.death), assists: pwNum(m.assist),
            rating: pwNum(m.rating), pwRating: pwNum(m.pwRating),
            we: pwNum(m.we),
            hsRatio: 0,   
            score1: pwNum(m.score1), score2: pwNum(m.score2),
            isWin: myTeam > 0 && myTeam === winTeam,
            isTie,
            isMvp: m.mvp === true || m.pvpMvp === true,
            mode: String(m.mode || ''),
            score: pwNum(m.pvpScore), scoreChange: pwNum(m.pvpScoreChange),
            stars: pwNum(m.pvpStars), duration: pwNum(m.duration),
            seasonId: String(seasonId || '')
        };
    });
}

async function fetchPWOfficialSummary(token, mySteamId, toSteamId, seasonId) {
    const sid = String(seasonId || '');
    if (!sid || sid === 'recent') return { summary: '' };
    const upper = 'S' + sid.replace(/^s/i, '').replace(/\D/g, '');
    if (upper === 'S') return { summary: '' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch('https://api.wmpvp.com/api/csgo/home/pvp/detailStats', {
            method: 'POST', signal: controller.signal,
            headers: { ...pwRequestHeaders(), 'token': token },
            body: JSON.stringify({ toSteamId: String(toSteamId), csgoSeasonId: upper,
                mySteamId: String(mySteamId), accessToken: token })
        });
        if (!res.ok) return { summary: '' };
        const json = await res.json().catch(() => null);
        const data = json && json.statusCode === 0 ? json.data : null;
        return { summary: (data && typeof data.summary === 'string') ? data.summary.trim() : '' };
    } catch (e) {
        return { summary: '' };   
    } finally { clearTimeout(timer); }
}

async function fetchPWMatchList(token, mySteamId, toSteamId, seasonId, page, seasonDatesOrOpts) {
    if (!token || !mySteamId || !toSteamId) return { error: 'NO_PARAM' };
    const sidRaw = String(seasonId || 'recent');
    const sid = sidRaw === 'recent' ? 'recent' : ('S' + sidRaw.replace(/^s/i, '').replace(/\D/g, ''));
    if (sid !== 'recent' && sid === 'S') return { success: true, rows: [], page: 1, officialSummary: '' };
    let r = await fetchPWMatchListRaw(token, mySteamId, toSteamId, sid, 1);
    let activeMySid = mySteamId;
    
    if (r.error && (r.error === '无效的账号' || r.error === 'REQUEST_FAILED')) {
        const cands = (seasonDatesOrOpts && typeof seasonDatesOrOpts === 'object' && !Array.isArray(seasonDatesOrOpts) && Array.isArray(seasonDatesOrOpts.sidCandidates))
            ? seasonDatesOrOpts.sidCandidates
            : (Array.isArray(seasonDatesOrOpts) ? seasonDatesOrOpts : []);
        for (const raw of cands) {
            const cand = String(raw || '').replace(/\D/g, '');
            if (!cand || cand === mySteamId || !/^7656119\d{10}$/.test(cand)) continue;
            const r2 = await fetchPWMatchListRaw(token, cand, toSteamId, sid, 1);
            if (!r2.error) {
                r = r2;
                activeMySid = cand;
                addLog(`[PW] MatchList mySteamId 自动纠偏为有效账号: ${cand.slice(0, 4)}…${cand.slice(-3)}（同步更新凭据账号）`);
                try {
                    chrome.storage.sync.set({ sps_pw_mysteamid: cand });
                    chrome.storage.local.set({ sps_pw_verify: { ok: true, checkedAt: Date.now() } });
                } catch (e) {  }
                break;
            }
        }
    }
    if (r.error) return r;
    const rows = normalizePWMatchRows(r.list, sidRaw);
    addLog(`[PW] MatchList season rows: ${sid} total=${rows.length}`);
    
    const sum = await fetchPWOfficialSummary(token, activeMySid, toSteamId, sidRaw);
    return { success: true, rows, page: 1, officialSummary: sum.summary };
}

async function fetchPWMatchDetailOne(token, mySteamId, toSteamId, matchId) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {

        const hdrs = { ...pwRequestHeaders() };
        if (token) { hdrs.token = token; hdrs.accesstoken = token; }
        const res = await fetch('https://api.wmpvp.com/api/v1/csgo/match', {
            method: 'POST', signal: controller.signal,
            headers: hdrs,
            body: JSON.stringify({ matchId: String(matchId), platform: 'admin', dataSource: 3 })
        });
        if (!res.ok) return null;
        const json = await res.json().catch(() => null);
        const players = json && json.statusCode === 0 && json.data && Array.isArray(json.data.players) ? json.data.players : [];
        const me = players.find(( p) => String(p.playerId || '') === String(toSteamId));
        if (!me) return null;
        const adr = pwNum(me.adpr) || (pwNum(me.dmgHealth) > 0 ? pwNum(me.dmgHealth) : 0);
        
        const hs = pwNum(me.headShotRatio);
        
        const we = pwNum(me.we);
        return { adr, hsRatio: hs > 0 && hs <= 1 ? hs : (hs > 1 ? hs / 100 : 0), we };
    } catch (e) {
        return null;
    } finally { clearTimeout(timer); }
}

const PW_MATCH_SCOPED_PREFIXES = ['pwro_', 'pwmd_', 'pwdl_'];
const PW_ROSTER_SHAPE = 6;   

const SPS_STAT_CATS = ['out', 'multi', 'entry', 'clutch', 'util', 'kill', 'honors', 'other'];

function pwDig(obj, match, depth) {
    if (!obj || typeof obj !== 'object') return null;
    const max = (depth === undefined) ? 2 : depth;
    const keys = Object.keys(obj);
    for (const k of keys) {
        const v = obj[k];
        if (v === null || v === undefined || typeof v === 'object') continue;
        if (match(k, v)) return { key: k, value: v };
    }
    if (max > 0) {
        for (const k of keys) {
            const v = obj[k];
            if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
            const hit = pwDig(v, match, max - 1);
            if (hit) return { key: k + '.' + hit.key, value: hit.value };
        }
    }
    return null;
}

function pwPickName(p) {
    const direct = ['nickname', 'nickName', 'nick_name', 'steamNick', 'steamNickName', 'steamName', 'playerName', 'playerNick', 'nick', 'name', 'userName', 'username', 'displayName'];
    for (const k of direct) {
        const v = p[k];
        if (typeof v === 'string' && v.trim()) return { name: v.trim(), key: k };
    }

    const hit = pwDig(p, (k, v) => {
        const lk = String(k).toLowerCase();
        if (!/(nick|name|user)/.test(lk)) return false;
        if (/team|map|match|mode|host|server|client|group|tournament|clan|league|url|avatar|head|img|pic/.test(lk)) return false;
        return typeof v === 'string' && v.trim().length > 0 && v.trim().length <= 40;
    }, 2);
    if (hit) return { name: String(hit.value).trim(), key: hit.key };

    const idHit = pwDig(p, (k, v) => {
        const lk = String(k).toLowerCase();
        if (!/(steamid|playerid|accountid|userid|uid)/.test(lk)) return false;
        return typeof v === 'string' && /^\d{5,20}$/.test(v.trim());
    }, 2);
    return idHit ? { name: '', key: '', idKey: idHit.key } : { name: '', key: '' };
}

function pwPickAvatar(p) {
    const direct = ['avatar', 'avater', 'headImg', 'headimg', 'headImage', 'headPic', 'playerAvatar', 'steamAvatar'];
    for (const k of direct) {
        const v = p[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
    }
    const hit = pwDig(p, (k, v) => {
        const lk = String(k).toLowerCase();
        if (!/(avatar|head|face|img|pic)/.test(lk)) return false;
        return typeof v === 'string' && /^(https?:)?\/\/|\.(png|jpg|jpeg|webp|gif)/i.test(v);
    }, 2);
    return hit ? String(hit.value).trim() : '';
}

const PW_STAT_LABELS = {
    
    firstkill: '首杀', firstkillnum: '首杀', firstdeath: '首死', firstdeathnum: '首死',
    firstblood: '首杀（开局）', entrykill: '突破击杀', entrykillnum: '突破击杀', entrykillratio: '首杀率（官方）',
    entry: '突破', openingkill: '开局击杀',
    
    twokill: '双杀', twokillnum: '双杀', threekill: '三杀', threekillnum: '三杀',
    fourkill: '四杀', fourkillnum: '四杀', fivekill: '五杀', fivekillnum: '五杀',
    doublekill: '双杀', triplekill: '三杀', quadkill: '四杀', pentakill: '五杀',
    k1: '单杀回合', k2: '双杀回合', k3: '三杀回合', k4: '四杀回合', k5: '五杀回合',
    multikill: '多杀回合合计', multikills: '多杀回合合计', multi: '多杀', killstreak: '连杀',
    
    vs1: '1v1 残局', vs2: '1v2 残局', vs3: '1v3 残局', vs4: '1v4 残局', vs5: '1v5 残局',
    endingwin: '残局获胜合计（1vN）', clutch: '残局', clutches: '残局',
    vs1winrate: '1v1 残局胜率', vs2winrate: '1v2 残局胜率', endingwinrate: '残局胜率',
    
    kill: '击杀', kills: '击杀', killnum: '击杀', totalkill: '总击杀', totalkillnum: '总击杀',
    death: '死亡', deaths: '死亡', deathnum: '总死亡',
    assist: '助攻', assists: '助攻', assistnum: '助攻',
    headshot: '爆头数', headshotnum: '爆头数', headshotkillnum: '爆头击杀', headshotratio: '爆头率（官方）',
    hitrate: '命中率', accuracy: '命中率（Accuracy）',
    adr: 'ADR', adpr: 'ADR(每回合伤害)', totaladr: '总 ADR（逐回合累计）',
    rws: 'RWS', rwssum: 'RWS 合计', we: 'WE', avgwe: '平均 WE',
    rating: '评分', pwrating: '评分（完美）', ratingsum: '评分合计',
    commonscore: '同水平均值（官方）', commonrating: '同水平评分（官方）', kd: 'K/D', kast: 'KAST',
    avgtimetokill: '平均击杀耗时', weaponkill: '武器击杀', weaponheadshot: '武器爆头',
    
    plantedbomb: '下包', plantbomb: '下包', defusedbomb: '拆包', defusebomb: '拆包', explodebomb: 'C4 爆炸',
    frag: '手雷击杀', hegrenade: '高爆手雷', molotov: '燃烧弹', incendiary: '燃烧弹（T）', smoke: '烟雾弹',
    flash: '闪光', flashenemy: '致盲敌人', flashteam: '闪队友', flashcount: '闪光次数',
    flashduration: '致盲时长', damagerate: '伤害占比', damage: '伤害', utilitydamage: '道具伤害',
    
    awpkill: 'AWP 击杀', snipe: '狙击', snipekill: '狙杀',
    winnum: '胜场', wincount: '胜场', winrate: '胜率', totalmatch: '场次', matchnum: '场次', cnt: '场次',
    matchmvpnum: '本场 MVP 次数', mvpcount: 'MVP 次数', mvpnum: 'MVP 次数',
    pvprank: '排名', rank: '排名', stars: '星数', pvpscore: 'ELO/分数', score: '分数',
    gamesscore: '比赛分（官方）', gamescore: '比赛分（官方）', scuffle: '乱斗场',

    shot: '枪法（五维）', victory: '残局（五维）', prop: '道具（五维）', breach: '突破（五维）'
};

function pwStatLabel(key) {
    const k = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const c of [k, k.replace(/num$/, ''), k.replace(/count$/, ''), k.replace(/sum$/, '')]) {
        if (PW_STAT_LABELS[c]) return PW_STAT_LABELS[c];
    }
    const m = /^(k|kill)([1-5])$/.exec(k);
    if (m) return ['', '单杀回合', '双杀回合', '三杀回合', '四杀回合', '五杀回合'][parseInt(m[2], 10)];
    const e = /^end([1-5])v([1-5])$/.exec(k);
    if (e) return e[1] + 'v' + e[2] + ' 残局';
    const vn = /^v([1-5])num$/.exec(k);            
    if (vn) return '1v' + vn[1] + ' 残局';
    const vr = /^vs([1-5])winrate$/.exec(k);
    if (vr) return '1v' + vr[1] + ' 残局胜率';
    const lv = /^levelavg(.+)$/.exec(k);           
    if (lv) return '本段位均值·' + pwStatLabel(lv[1]);
    return String(key);
}

function pwStatCat(key) {
    const k = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (/^(firstkill|firstdeath|firstblood|entrykill|entry|opening|breach|awpkill|awp|snipe)/.test(k)) return 'entry';
    if (/^(vs[1-5]|v[1-5]num|end\d|end[1-5]v[1-5]|clutch|clutches|onev|win[1-5]v|endingwin)/.test(k)) return 'clutch';
    if (/^(k[1-5]|kill[1-5]|multi|manykill|multikill|killstreak|a[1-5]|manyassist|(two|three|four|five|double|triple|quad|penta)kill)/.test(k)) return 'multi';
    if (/^(flash|blind|smoke|molotov|incendiary|frag|hegrenade|grenade|plant|defus|explode|c4|throw|utility|prop|dmgby|damageby)/.test(k)) return 'util';
    if (/(perfect|assisted|revenge|jump|hold|teamkill|wallbang|noscope|penetrat|through|spray)/.test(k)) return 'kill';
    if (/^(rws|kast|damage|dmg|adr|adpr|accuracy|hitrate|headshot|hs|we|avgwe|rating|commonscore|commonrating|gamescore|kd|impact|kpr|killsperround|round|killnum|totalkill|deathnum|assistnum|avgtimetokill|rwssum|ratingsum|totaladr|weaponkill|shot|victory)/.test(k)) return 'out';
    if (/^(is_?mvp|is_?svp|mvp|mvpnum|mvpcount|matchmvpnum|svp|is_?win|win|winnum|wincount|title|honor|most)/.test(k)) return 'honors';
    return 'other';
}

function pwExtraStats(p) {
    const skip = /^(playerid|steamid|steamid64|id|matchid|uid|token|url|avatar|avater|head|img|pic|photo|nickname|nick|name|username|playername|steamnick|steamname|sign|expire|timestamp|time|date)/i;

    const shown = /^(kill|kills|death|deaths|assist|assists|adpr|adr|headshotratio|hs|we|rating|pwrating|mvps|mvp|team|camp|teamid|level|tier|win|iswin|is_win|is_?mvp|is_?svp|svp|rank|rankname|ranktext|grade|levelname|tiername|pvpscore|elo)$/i;
    
    const out = [];
    const seen = new Set();
    const push = ( k,  v) => {
        if (out.length >= 40 || seen.has(k)) return;
        if (typeof v !== 'number' && typeof v !== 'string') return;
        const n = pwNum(v);
        if (!Number.isFinite(n) || (n === 0 && String(v) !== '0')) return;   
        seen.add(k);
        out.push({ k: k, label: pwStatLabel(k), cat: pwStatCat(k), v: n });
    };
    Object.keys(p).forEach((k) => {
        if (skip.test(k) || shown.test(k)) return;
        if (/url|img|pic|avatar|head/i.test(k)) return;
        push(k, p[k]);
    });

    Object.keys(p).forEach((k) => {
        if (out.length >= 40 || skip.test(k) || shown.test(k) || seen.has(k)) return;
        const v = p[k];
        if (typeof v !== 'string') return;
        const sv = v.trim();
        if (!/^[A-Za-z][A-Za-z+-]{0,3}$/.test(sv)) return;   
        seen.add(k);
        out.push({ k: k, label: pwStatLabel(k), cat: pwStatCat(k), v: 0, s: sv });
    });

    Object.keys(p).forEach((k) => {
        if (skip.test(k) || shown.test(k) || seen.has(k)) return;
        const v = p[k];

        if (v === true || (typeof v === 'string' && (v === '1' || v.toLowerCase() === 'true'))) {
            seen.add(k);
            out.push({ k: k, label: pwStatLabel(k), cat: 'honors', v: 1 });
        }
    });
    return out;
}

function pwPickRankText(p) {
    const keys = ['rankName', 'levelName', 'tierName', 'rankText', 'gradeName', 'level_name', 'tier_name',
        'rank_name', 'pvpLevelName', 'pvpRankName', 'rankLevel', 'grade', 'level', 'tier', 'rank'];
    for (const k of keys) {
        const v = p[k];
        if (typeof v !== 'string') continue;
        const s = v.trim();
        if (!s || s.length > 20 || /^\d+$/.test(s)) continue;
        return s;
    }
    return '';
}

function pwRosterPlayer(p, opt) {
    if (!p || typeof p !== 'object') return null;

    const steamId = String(p.playerId || p.steamId || p.steamid || p.steamId64 || p.uid || '');
    const hs = pwNum(p.headShotRatio);
    const num = pwNum;
    const picked = pwPickName(p);
    const teamRaw = (p.team !== undefined) ? p.team : ((p.camp !== undefined) ? p.camp : p.teamId);
    return {
        steamId,
        
        idKey: (opt && opt.trace) ? picked.idKey : undefined,
        nickname: picked.name,
        
        nameKey: (opt && opt.trace) ? picked.key : undefined,
        avatar: pwPickAvatar(p),
        kills: num(p.kill !== undefined ? p.kill : p.kills),
        deaths: num(p.death !== undefined ? p.death : p.deaths),
        assists: num(p.assist !== undefined ? p.assist : p.assists),
        adr: num(p.adpr) || num(p.adr),
        hs: hs > 0 && hs <= 1 ? hs : (hs > 1 ? hs / 100 : 0),
        we: num(p.we),
        rating: num(p.rating !== undefined ? p.rating : p.pwRating),

        pwRating: num(p.pwRating !== undefined ? p.pwRating : p.pw_rating),
        mvps: num(p.mvps !== undefined ? p.mvps : p.mvp),
        level: num(p.level !== undefined ? p.level : p.tier),

        rankText: pwPickRankText(p),
        rankScore: num(p.pvpScore !== undefined ? p.pvpScore : (p.score !== undefined ? p.score : p.elo)),
        
        isMvp: p.mvp === true || p.isMvp === true || num(p.isMvp) === 1 || num(p.is_mvp) === 1,
        isSvp: p.svp === true || p.isSvp === true || num(p.isSvp) === 1 || num(p.is_svp) === 1,
        win: p.win === true || num(p.isWin) === 1 || num(p.is_win) === 1,
        team: num(teamRaw),
        
        extra: (opt && opt.trace) ? pwExtraStats(p) : []
    };
}

function pwMatchField(d, keys, fuzzy) {
    if (!d || typeof d !== 'object') return null;

    const hosts = [d.base, d];
    for (const host of hosts) {
        if (!host || typeof host !== 'object') continue;
        for (const k of keys) {
            const v = host[k];
            if (v !== undefined && v !== null && (typeof v === 'string' || typeof v === 'number')) {
                return { key: (host === d.base ? 'base.' + k : k), value: v };
            }
        }
    }
    if (!fuzzy) return null;
    return pwDig(d, ( k,  v) => {
        if (!fuzzy.test(k)) return false;
        return typeof v === 'string' ? v.trim().length > 0 : true;
    }, 2);
}

function pwPickDemoUrl(d) {
    const hit = pwMatchField(d, ['demoUrl', 'demo_url', 'demoURL', 'replayUrl', 'replay_url', 'downloadUrl', 'download_url', 'recordUrl', 'videoUrl'],
        /^(demo|demourl|demoid|download|downloadurl|replay|replayurl|record|recordurl|videourl|vodurl)$/i);
    if (!hit) return '';
    const v = String(hit.value || '').trim();
    
    if (/^(https?:)?\/\//i.test(v) || /\.(dem|zip|rar|7z)(\?|$)/i.test(v)) return v.slice(0, 500);
    return '';
}

function pwMatchRoster(json) {
    const d = json && json.statusCode === 0 && json.data ? json.data : null;
    if (!d || !Array.isArray(d.players)) return null;
    const players = d.players.map((p) => pwRosterPlayer(p, { trace: true })).filter((p) => !!p);
    if (!players.length) return null;

    const markRef = ( keys,  flag) => {
        const ref = pwMatchField(d, keys, null);
        if (!ref) return;
        const v = String(ref.value == null ? '' : ref.value).replace(/\D/g, '');
        if (v.length < 5) return;
        const hit = players.find((p) => p.steamId && (p.steamId.indexOf(v) >= 0 || v.indexOf(p.steamId) >= 0));
        if (hit) hit[flag] = true;
    };
    markRef(['mvpPlayerId', 'mvpSteamId', 'mvpUid', 'mvpId', 'mvpAccountId', 'mvp'], 'isMvp');
    markRef(['svpPlayerId', 'svpSteamId', 'svpUid', 'svpId', 'svpAccountId', 'svp'], 'isSvp');
    const teamVals = Array.from(new Set(players.map((p) => p.team).filter((v) => v > 0)));
    
    let teams;
    if (teamVals.length >= 2) {
        const t1 = players.filter((p) => p.team === teamVals[0]);
        const t2 = players.filter((p) => p.team === teamVals[1]);
        const rest = players.filter((p) => t1.indexOf(p) < 0 && t2.indexOf(p) < 0);
        if (!rest.length) teams = [t1, t2];
    }

    const fWin = pwMatchField(d, ['winTeam', 'win_team', 'winnerTeam'], /^(winteam|win_team|winnerteam)$/i);
    const rawWin = pwNum(fWin && fWin.value);
    const winIdx = (teams && rawWin > 0) ? teamVals.indexOf(rawWin) : -1;

    const named = players.filter((p) => p.nickname).length;
    const raw0 = d.players[0] && typeof d.players[0] === 'object' ? Object.keys(d.players[0]) : [];

    const fMap = pwMatchField(d, ['mapName', 'map', 'map_name', 'mapId', 'levelName'], /^(mapname|map|mapid|levelname)$/i);
    const fS1 = pwMatchField(d, ['score1', 'score_1', 'team1Score', 'myScore'], /^(score1|score_1|team1score|myscore|scorea)$/i);
    const fS2 = pwMatchField(d, ['score2', 'score_2', 'team2Score', 'opponentScore'], /^(score2|score_2|team2score|opponentscore|scoreb)$/i);
    const fRt = pwMatchField(d, ['roundTotal', 'totalRound', 'round', 'rounds'], /^(roundtotal|rounds?|totalround)$/i);
    const fDur = pwMatchField(d, ['duration', 'matchTime', 'gameTime'], /^(duration|matchtime|gametime)$/i);
    const fSt = pwMatchField(d, ['startTime', 'beginTime'], /^(starttime|begintime)$/i);
    const fEt = pwMatchField(d, ['endTime', 'finishTime'], /^(endtime|finishtime)$/i);
    return {
        success: true,
        matchId: String(d.matchId || d.id || ''),
        map: String((fMap && fMap.value) || ''),
        mapKey: fMap ? fMap.key : '',
        score1: pwNum(fS1 && fS1.value), score2: pwNum(fS2 && fS2.value),
        
        hasScore: !!(fS1 && fS2),
        roundTotal: pwNum(fRt && fRt.value),
        duration: pwNum(fDur && fDur.value),

        startTime: (fSt && fSt.value != null) ? String(fSt.value).trim() : '',
        endTime: (fEt && fEt.value != null) ? String(fEt.value).trim() : '',
        
        demoUrl: pwPickDemoUrl(d),

        winner: winIdx >= 0 ? winIdx + 1 : 0,
        teamVals: teamVals,
        teams, players,
        
        nameMissing: named === 0,
        rawKeys: named === 0 ? raw0.slice(0, 40) : []
    };
}

const _pwRosterInflight = new Map();   

async function fetchPWRoster(matchId) {
    const mid = String(matchId || '');
    if (!mid) return null;
    const key = CACHE_KEY_PREFIX + 'pwro_' + mid;
    try {
        const hit = await cacheGetVersioned(key, PW_ROSTER_SHAPE, {
            ttl: 24 * 3600e3,
            valid: ( d) => !!(d && d.success && ((Array.isArray(d.teams) && d.teams.length) || (Array.isArray(d.players) && d.players.length)))
        });
        if (hit) return hit;
    } catch (e0) {  }
    if (_pwRosterInflight.has(mid)) return _pwRosterInflight.get(mid);
    const p = (async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        try {
            const res = await fetch('https://api.wmpvp.com/api/v1/csgo/match', {
                method: 'POST', signal: controller.signal, headers: pwRequestHeaders(),
                body: JSON.stringify({ matchId: mid, platform: 'admin', dataSource: 3 })
            });
            if (!res.ok) return null;
            const json = await res.json().catch(() => null);
            const roster = pwMatchRoster(json);
            if (roster) { try { cacheSetVersioned(key, roster, PW_ROSTER_SHAPE, { ttl: 24 * 3600e3 }); } catch (e1) {  } }
            return roster;
        } catch (e) {
            return null;
        } finally { clearTimeout(timer); }
    })().finally(() => _pwRosterInflight.delete(mid));
    _pwRosterInflight.set(mid, p);
    return p;
}

async function fetchPWMatchDetails(token, mySteamId, toSteamId, matchIds) {
    const ids = (Array.isArray(matchIds) ? matchIds : []).map(String).filter(Boolean).slice(0, 100);
    
    const details = {};
    if (!ids.length) return { details };

    const CONC = 12;
    for (let i = 0; i < ids.length; i += CONC) {
        await Promise.all(ids.slice(i, i + CONC).map(async ( id) => {
            const one = await fetchPWMatchDetailOne(token, mySteamId, toSteamId, id);
            if (one && one.adr > 0) details[id] = one;
        }));
    }
    addLog(`[PW] MatchDetails: req=${ids.length} got=${Object.keys(details).length}`);
    return { details };
}

const PWA_WEB_API_APPID = 20000;
const PWA_SIGN_TAIL64 = __S_background_pw_js(0);

const PWA_DEMO_UA = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) perfectworldarena/1.0.26051411 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36';

const PW_DEMO_REFERER = 'https://client.wmpvp.com';

const PW_DEMO_RULE_ID = 52001;

const PW_DEMO_RESOURCE_TYPES = ['other', 'xmlhttprequest', 'main_frame', 'sub_frame'];

const PW_DEMO_LINK_PREFIX = 'pwdl_';

const PW_DEMO_LINK_SHAPE = 1;

const PW_DEMO_LINK_TTL = 24 * 3600e3;

const PW_DEMO_URL_PATTERN = __S_background_pw_js(1);

function pwMd5Hex(input) {
    const bytes = new TextEncoder().encode(String(input));
    const len = bytes.length;
    const total = (((len + 8) >> 6) + 1) << 6;   
    const buf = new Uint8Array(total);
    buf.set(bytes);
    buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(total - 8, (len << 3) >>> 0, true);
    dv.setUint32(total - 4, Math.floor(len / 536870912), true);   
    const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
    const K = new Uint32Array(64);
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
    const M = new Uint32Array(16);
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (let off = 0; off < total; off += 64) {
        for (let i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true);
        let A = a0, B = b0, C = c0, D = d0;
        for (let i = 0; i < 64; i++) {
            let f, g;
            if (i < 16) { f = (B & C) | (~B & D); g = i; }
            else if (i < 32) { f = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
            else if (i < 48) { f = B ^ C ^ D; g = (3 * i + 5) % 16; }
            else { f = C ^ (B | ~D); g = (7 * i) % 16; }
            const tmp = D; D = C; C = B;
            const sum = (A + f + K[i] + M[g]) >>> 0;
            const rot = S[(i >> 4) * 4 + (i & 3)];
            B = (B + ((sum << rot) | (sum >>> (32 - rot)))) >>> 0;
            A = tmp;
        }
        a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    const out = new Uint8Array(16);
    const odv = new DataView(out.buffer);
    odv.setUint32(0, a0, true); odv.setUint32(4, b0, true); odv.setUint32(8, c0, true); odv.setUint32(12, d0, true);
    let hex = '';
    for (let i = 0; i < 16; i++) hex += (out[i] < 16 ? '0' : '') + out[i].toString(16);
    return hex;
}

async function pwSha1Hex(input) {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(String(input)));
    const b = new Uint8Array(buf);
    let hex = '';
    for (let i = 0; i < b.length; i++) hex += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return hex;
}

async function pwDemoSign(randnum, ts, data) {
    const prefix = pwMd5Hex(String(randnum) + String(ts) + String(data));
    return pwSha1Hex(String(PWA_WEB_API_APPID) + prefix + PWA_SIGN_TAIL64);
}

async function pwDemoUrl(matchId, cupId, accessToken, opt) {
    const o = opt || {};
    const cup = String(cupId || 0);
    const params = { access_token: String(accessToken), cup_id: cup, match_id: String(matchId) };
    const data = Object.keys(params).sort().map((k) => k + '=' + params[k]).join('&');
    const randnum = o.randnum ? String(o.randnum) : String(Math.floor(100000 + Math.random() * 900000));
    const ts = o.ts ? String(o.ts) : String(Math.floor(Date.now() / 1000));
    const sig = await pwDemoSign(randnum, ts, data);
    return __S_background_pw_js(2) + String(matchId) + '_' + cup + '.dem'
        + '?a=' + PWA_WEB_API_APPID + '&r=' + randnum + '&s=' + sig + '&t=' + ts + '&' + data;
}

async function pwXSignature(steamid, ts, ipAddr) {
    const sid = String(steamid);
    const n = String(ts);
    const keyStr = n + sid.slice(n.length - 16);
    if (sid.length < 16 || keyStr.length !== 16) return '';   
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(keyStr), 'AES-CBC', false, ['encrypt']);
    const ct = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: enc.encode(sid.slice(-16)) }, key, enc.encode(String(ipAddr)));
    const b = new Uint8Array(ct);
    let hex = '';
    for (let i = 0; i < b.length; i++) hex += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return n + '-' + hex;
}

let _pwPublicIpCache = { ip: '', ts: 0 };
async function pwPublicIp() {
    const now = Date.now();
    if (_pwPublicIpCache.ip && now - _pwPublicIpCache.ts < 10 * 60000) return _pwPublicIpCache.ip;
    for (const u of ['https://api.ipify.org?format=json', 'https://ifconfig.me/ip']) {
        try {
            const res = await fetchWithTimeout(u, {}, 8000);
            const txt = await res.text();
            let ip = '';
            try { ip = String((JSON.parse(txt) || {}).ip || '').trim(); } catch (e) { ip = txt.trim(); }
            if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && ip.split('.').every(( p) => Number(p) < 256)) {
                _pwPublicIpCache = { ip: ip, ts: now };
                return ip;
            }
        } catch (e) {  }
    }
    return '';
}

const PW_DEMO_EXPIRE_MS = 15 * 86400 * 1000;

function pwParseMatchTime(v) {
    if (v == null) return 0;
    if (typeof v === 'number') {
        if (v <= 0 || !isFinite(v)) return 0;
        return v >= 1e11 ? v : v * 1000;
    }
    const s = String(v).trim();
    if (!s) return 0;
    if (/^\d{9,13}$/.test(s)) {
        const n = parseFloat(s);
        return s.length >= 12 ? n : n * 1000;
    }
    let parsed = Date.parse(s);
    if (isNaN(parsed)) parsed = Date.parse(s.replace(/-/g, '/'));
    return (!isNaN(parsed) && parsed > 0) ? parsed : 0;
}

function pwIsDemoExpired(v, nowMs) {
    const t = pwParseMatchTime(v);
    if (!t || t <= 0) return false;
    const now = typeof nowMs === 'number' && nowMs > 0 ? nowMs : Date.now();
    return (now - t) > PW_DEMO_EXPIRE_MS;
}

function pwDemoMatchId(matchId) {
    const raw = String(matchId || '').trim();
    if (!raw) return '';
    const at = raw.lastIndexOf('@');
    const tail = at >= 0 ? raw.slice(at + 1) : raw;
    return /^\d{1,32}$/.test(tail) ? tail : '';
}

async function pwDemoHeaders(creds, ts) {
    const sid = String((creds && creds.mySteamId) || '');
    const ip = await pwPublicIp();
    const xsig = ip ? await pwXSignature(sid, ts, ip) : '';
    
    const h = {
        referer: PW_DEMO_REFERER,
        origin: PW_DEMO_REFERER,
        'user-agent': PWA_DEMO_UA,
        'x-pwa-steamid': sid,
        pwasteamid: sid
    };
    if (xsig) h['x-pwa-signature'] = xsig;
    return h;
}

function pwDemoIsDirect(l) {
    const s = String(l || '');
    if (!/^https?:\/\//i.test(s)) return false;
    return new RegExp(__S_background_pw_js(3), 'i').test(s) || new RegExp(__S_background_pw_js(4), 'i').test(s);
}

async function pwDemoReadVerdict(res, sink) {
    if (!sink) {
        try { if (res && res.body && res.body.cancel) res.body.cancel(); } catch (e) {  }
        return;
    }
    try {
        const len = Number((res.headers && res.headers.get && res.headers.get('content-length')) || 0);
        if (len > 4096) {   
            if (res.body && res.body.cancel) res.body.cancel();
            return;
        }
        const txt = String(await res.text());
        const j = JSON.parse(txt.slice(0, 2048));
        if (j && (j.code !== undefined || j.msg !== undefined)) {
            sink.code = String(j.code === undefined || j.code === null ? '' : j.code).slice(0, 16);
            sink.msg = String(j.msg === undefined || j.msg === null ? '' : j.msg).slice(0, 80);
        }
    } catch (e) {  }
}

async function pwDemoHop(url, headers, mode, timeoutMs, sink) {
    return new Promise((resolve) => {
        let done = false;
        const ctl = new AbortController();
        
        const finish = ( v) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            try { chrome.webRequest.onBeforeRedirect.removeListener(onRedir); } catch (e) {  }
            try {
                if (typeof chrome !== 'undefined' && chrome.webRequest && chrome.webRequest.onHeadersReceived) {
                    chrome.webRequest.onHeadersReceived.removeListener( (onHdr));
                }
            } catch (e) {  }
            try { ctl.abort(); } catch (e) {  }
            resolve(String(v || ''));
        };
        const onHdr = ( d) => {
            try {
                if (!d || !d.responseHeaders) return;
                const u = String(d.url || '');
                if (u !== url && !u.startsWith(__S_background_pw_js(2))) return;
                for (const h of d.responseHeaders) {
                    if (h && String(h.name || '').toLowerCase() === 'location') {
                        const loc = String(h.value || '');
                        if (pwDemoIsDirect(loc) && loc !== url) {
                            finish(loc);
                            return;
                        }
                    }
                }
            } catch (e) {  }
        };
        const onRedir = ( d) => {
            try {
                if (!d) return;
                const u = String(d.url || '');
                if (u !== url && !u.startsWith(__S_background_pw_js(2))) return;
                const loc = String(d.redirectUrl || '');
                finish(pwDemoIsDirect(loc) && loc !== url ? loc : '');
            } catch (e) { finish(''); }
        };
        const timer = setTimeout(() => finish(''), timeoutMs);
        try {
            chrome.webRequest.onBeforeRedirect.addListener(onRedir, { urls: [PW_DEMO_URL_PATTERN] });
        } catch (e) { finish(''); return; }
        if (typeof chrome !== 'undefined' && chrome.webRequest && chrome.webRequest.onHeadersReceived) {
            try {
                chrome.webRequest.onHeadersReceived.addListener( (onHdr), { urls: [PW_DEMO_URL_PATTERN] }, ['responseHeaders']);
            } catch (e) {  }
        }
        try {
            fetch(url, { method: 'GET', headers: headers, redirect: mode, cache: 'no-store', signal: ctl.signal })
                
                .then(( res) => {
                    try {
                        const finalUrl = String((res && res.url) || '');
                        if (pwDemoIsDirect(finalUrl) && finalUrl !== url) {
                            finish(finalUrl);
                            return;
                        }
                        
                        const ctype = String((res && res.headers && res.headers.get && res.headers.get('content-type')) || '');
                        if (res && res.status === 200 && /json/i.test(ctype)) {
                            pwDemoReadVerdict(res, sink || null).then(() => finish(''));
                            return;
                        }
                        if (res && res.body && res.body.cancel) res.body.cancel();
                    } catch (e) {  }
                    finish('');
                })
                .catch(() => finish(''));
        } catch (e) { finish(''); }
    });
}

async function pwDemoRuleInstall(url, hdr) {
    
    const rule = {
        id: PW_DEMO_RULE_ID,
        priority: 50,
        action: {
            type: 'modifyHeaders',
            
            requestHeaders: Object.keys(hdr).map((k) => ({ header: k, operation: 'set', value: hdr[k] }))
        },
        
        condition: { urlFilter: '|' + url + '|', resourceTypes: PW_DEMO_RESOURCE_TYPES }
    };
    return await new Promise(( resolve) => {
        try {
            chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [PW_DEMO_RULE_ID], addRules: [rule] },
                () => resolve(!chrome.runtime.lastError));
        } catch (e) { resolve(false); }
    });
}

async function pwDemoResolveDirect(url, creds, sink) {
    const headers = await pwDemoHeaders(creds, String(Math.floor(Date.now() / 1000)));
    const ruled = await pwDemoRuleInstall(url, headers);
    try {
        for (const mode of ['manual', 'follow']) {
            const loc = await pwDemoHop(url, headers,  (mode), mode === 'manual' ? 3000 : 9000, sink);
            if (loc) return loc;
            if (sink && sink.code) return '';   
        }
        return '';
    } finally {
        
        if (ruled) pwDemoRuleCleanup();
    }
}

async function pwDemoDirectLink(mid, url, creds, sink) {
    const key = CACHE_KEY_PREFIX + PW_DEMO_LINK_PREFIX + mid;
    const hit = await cacheGetVersioned(key, PW_DEMO_LINK_SHAPE, {
        ttl: PW_DEMO_LINK_TTL,
        valid: (d) => !!(d && d.direct && pwNum(d.exp) * 1000 - Date.now() > 5 * 60000)
    });
    if (hit && hit.direct) return String(hit.direct);
    const direct = await pwDemoResolveDirect(url, creds, sink);
    if (direct) {
        const m = /[?&](?:Expires|x-oss-expires)=(\d+)/i.exec(direct);
        const exp = m ? pwNum(m[1]) : (Math.floor(Date.now() / 1000) + 86400);
        cacheSetVersioned(key, { direct: direct, exp: exp }, PW_DEMO_LINK_SHAPE, { ttl: PW_DEMO_LINK_TTL });
    }
    return direct;
}

async function pwDemoOpenTab(url) {
    return new Promise((resolve) => {
        try {
            chrome.tabs.create({ url: url, active: true }, ( t) => {
                resolve(chrome.runtime.lastError || !t || !t.id ? 0 : t.id);
            });
        } catch (e) { resolve(0); }
    });
}

function pwDemoHost(u) {
    try { return new URL(String(u)).host; } catch (e) { return ''; }
}

async function pwDemoLink(matchId, creds, cupId, open, matchTime) {
    const mtime = matchTime !== undefined ? matchTime : (creds && creds.matchTime);
    if (pwIsDemoExpired(mtime)) {
        return { success: true, resolved: false, code: 'EXPIRED', expired: true, matchTime: mtime };
    }
    const mid = pwDemoMatchId(matchId);
    const token = String((creds && creds.token) || '').trim();
    const sid = String((creds && creds.mySteamId) || '').trim();
    if (!mid) return { success: false, error: 'NO_MATCH' };
    if (!token || !sid) return { success: false, error: 'NO_TOKEN' };
    const ts = String(Math.floor(Date.now() / 1000));
    const cup = cupId || 0;
    const url = await pwDemoUrl(mid, cup, token, { ts: ts });
    
    const sink = { code: '', msg: '' };
    let direct = await pwDemoDirectLink(mid, url, { token: token, mySteamId: sid }, sink);

    let sidFixed = '';
    if (!direct && sink.code === '1003') {
        const cands = Array.isArray(creds && creds.sidCandidates) ? creds.sidCandidates : [];
        for (const raw of cands) {
            const cand = String(raw || '').replace(/\D/g, '');
            if (!cand || cand === sid || !/^7656119\d{10}$/.test(cand)) continue;
            const s2 = { code: '', msg: '' };
            const d2 = await pwDemoDirectLink(mid, url, { token: token, mySteamId: cand }, s2);
            if (d2) { direct = d2; sidFixed = cand; sink.code = ''; sink.msg = ''; break; }
        }
        if (sidFixed) {
            addLog(`[PW] Demo 的 SteamID 与 token 不同号：改用 ${sidFixed.slice(0, 4)}…${sidFixed.slice(-3)} 重试成功（设置页该改这个值）`);
        }
    }

    if (!open) {
        if (direct) return sidFixed ? { success: true, url: direct, resolved: true, sidFixed: sidFixed }
            : { success: true, url: direct, resolved: true };
        addLog(`[PW] Demo resolve rejected matchId=${mid} code=${sink.code || '-'} msg=${sink.msg || '-'} sid=…${sid.slice(-6)}`);
        return { success: true, resolved: false, code: sink.code, msg: sink.msg, sidUsed: sid };
    }
    
    if (direct) {
        const tabId = await pwDemoOpenTab(direct);
        if (!tabId) return { success: false, error: 'TABS_FAIL' };
        addLog(`[PW] Demo direct opened matchId=${mid} tab=${tabId} host=${pwDemoHost(direct)}`);
        return sidFixed ? { success: true, url: direct, opened: true, resolved: true, sidFixed: sidFixed }
            : { success: true, url: direct, opened: true, resolved: true };
    }

    const hdr = await pwDemoHeaders(creds, ts);
    if (!(await pwDemoRuleInstall(url, hdr))) return { success: false, error: 'DNR_FAIL' };
    const tabId = await pwDemoOpenTab(url);
    if (!tabId) {
        try { chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [PW_DEMO_RULE_ID] }); } catch (e) {  }
        return { success: false, error: 'TABS_FAIL' };
    }
    addLog(`[PW] Demo link opened in tab matchId=${mid} tab=${tabId}`);

    setTimeout(() => { try { chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [PW_DEMO_RULE_ID] }); } catch (e) {  } }, 120000);
    
    return { success: true, url: url, opened: true, resolved: false, code: sink.code, msg: sink.msg, sidUsed: sid };
}

function pwDemoRuleCleanup() {
    try { chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [PW_DEMO_RULE_ID] }); } catch (e) {  }
}

if (chrome.tabs && chrome.tabs.onUpdated) {
    chrome.tabs.onUpdated.addListener(( tabId,  info) => {
        try {
            
            if (!info || !info.url || String(info.url).indexOf(__S_background_pw_js(5)) < 0) return;
            setTimeout(pwDemoRuleCleanup, 1500);
        } catch (e) {  }
    });
}
if (chrome.tabs && chrome.tabs.onRemoved) {
    
    chrome.tabs.onRemoved.addListener(( tabId) => { try { pwDemoRuleCleanup(); } catch (e) {  } });
}
if (chrome.downloads && chrome.downloads.onChanged) {
    chrome.downloads.onChanged.addListener(( delta) => {
        try {
            const st = delta && delta.state && delta.state.current;
            if (st === 'complete' || st === 'interrupted') pwDemoRuleCleanup();
        } catch (e) {  }
    });
}
