

const LEE_API = 'https://api-public.cs-prod.leetify.com';

const _leetifyKeyOk = new Map();

function leetifyHeaders(apiKey) {
    const key = (typeof apiKey === 'string') ? apiKey.trim() : '';
    const h =  ({ 'Accept': 'application/json' });
    if (key) h['_leetify_key'] = key;
    return h;
}

async function leetifyValidateKey(apiKey) {
    const key = (typeof apiKey === 'string') ? apiKey.trim() : '';
    if (!key) return null;
    if (_leetifyKeyOk.has(key)) return _leetifyKeyOk.get(key);
    let out =  (null);
    try {
        const r = await fetchWithTimeout(LEE_API + '/api-key/validate', { headers: leetifyHeaders(key) }, 8000);
        if (r.ok) out = true;
        else if (r.status === 401) out = false;
    } catch (e) { out = null; }
    
    if (out !== null) _leetifyKeyOk.set(key, out);
    return out;
}

function aggregateLeetifyMatches(steamId, list, profileRanks, profileRecentMatches) {
    const arr = Array.isArray(list) ? list : [];
    let kdSum = 0, kdN = 0, hsKills = 0, kills = 0, adrSum = 0, adrN = 0;
    
    const rows = [];
    const pRecentMap = new Map();
    if (Array.isArray(profileRecentMatches)) {
        for (const pm of profileRecentMatches) {
            if (pm && pm.id) pRecentMap.set(String(pm.id), pm);
        }
    }
    for (const m of arr) {
        const mine = (m && Array.isArray(m.stats) ? m.stats : [])
            .find(s => s && String(s.steam64_id) === String(steamId));
        if (mine) {
            const kd = Number(mine.kd_ratio);
            if (Number.isFinite(kd)) { kdSum += kd; kdN++; }
            const adr = Number(mine.dpr);
            if (Number.isFinite(adr)) { adrSum += adr; adrN++; }
            hsKills += Number(mine.total_hs_kills) || 0;
            kills += Number(mine.total_kills) || 0;
            if (rows.length < 10) {
                const scores = m && Array.isArray(m.team_scores) ? m.team_scores : [];
                const myTeam = Number(mine.initial_team_number) || 0;
                const myScore = Number((scores.find(t => Number(t && t.team_number) === myTeam) || {}).score);
                const oppScore = Number((scores.find(t => Number(t && t.team_number) !== myTeam) || {}).score);
                const hasScore = myTeam > 0 && Number.isFinite(myScore) && Number.isFinite(oppScore);
                let scoreStr = hasScore ? `${myScore}-${oppScore}` : '-';
                if (!hasScore && typeof m.score === 'string' && m.score.trim()) {
                    scoreStr = m.score.replace(/\s+/g, '');
                }
                const isWin = hasScore ? (myScore > oppScore) : (m.outcome === 'win');
                const isDraw = hasScore ? (myScore === oppScore) : (m.outcome === 'tie' || m.outcome === 'draw');

                const ts = m && m.finished_at ? Math.round(Date.parse(m.finished_at) / 1000) : 0;
                const rawMap = String(m && m.map_name || '').replace(/^de_/, '');

                const pm = m && m.id ? pRecentMap.get(String(m.id)) : null;
                
                const isWingman = !!(
                    (pm && (pm.rank_type === 7 || (pm.data_source && String(pm.data_source).toLowerCase().includes('wingman')) || (pm.game_mode && String(pm.game_mode).toLowerCase().includes('wingman'))))
                    || (m && (
                        (m.data_source && String(m.data_source).toLowerCase().includes('wingman'))
                        || (m.game_mode && String(m.game_mode).toLowerCase().includes('wingman'))
                        || (m.game_type && String(m.game_type).toLowerCase().includes('scrimcomp2v2'))
                    ))
                );

                let rank = undefined;
                let rankResolved = false;
                if (pm && (pm.rank !== undefined || pm.premier !== undefined || pm.skill_level !== undefined)) {
                    rankResolved = true;
                    
                    const isFaceit = (pm.data_source && String(pm.data_source).toLowerCase().includes('faceit')) || pm.rank_type === 1;
                    if (!isFaceit) {
                        const rawRank = pm.premier ?? pm.rank ?? pm.skill_level;
                        const numRank = Number(rawRank);
                        if (Number.isFinite(numRank)) {
                            rank = numRank;
                        }
                    }
                } else if (mine && (mine.rank !== undefined || mine.skill_level !== undefined || mine.premier !== undefined || mine.premier_rating !== undefined)) {
                    rank = mine.premier ?? mine.premier_rating ?? mine.rank ?? mine.skill_level;
                    rankResolved = true;
                } else if (m && (m.rank !== undefined || m.skill_level !== undefined || m.premier !== undefined || m.premier_rating !== undefined)) {
                    rank = m.premier_rating ?? m.premier ?? m.rank ?? m.skill_level;
                    rankResolved = true;
                }
                if (!rankResolved && rank === undefined && profileRanks && typeof profileRanks === 'object') {
                    if (isWingman) {
                        
                        if (profileRanks.wingman !== undefined && Number(profileRanks.wingman) > 0) {
                            rank = Number(profileRanks.wingman);
                        }
                    } else {
                        const rawMapLower = rawMap.toLowerCase();
                        const compList = Array.isArray(profileRanks.competitive) ? profileRanks.competitive : [];
                        const mapMatch = compList.find(c => c && c.map_name && c.map_name.toLowerCase().replace(/^de_/, '') === rawMapLower);
                        if (mapMatch && Number(mapMatch.rank) > 0) {
                            rank = Number(mapMatch.rank);
                        } else if (profileRanks.premier !== undefined && Number(profileRanks.premier) > 0) {
                            rank = Math.round(Number(profileRanks.premier));
                        }
                    }
                }

                const k = Number(mine.total_kills);
                const d = Number(mine.total_deaths);
                const a = Number(mine.total_assists ?? mine.assists);
                let kdaStr = undefined;
                if (Number.isFinite(k) && Number.isFinite(d)) {
                    kdaStr = `${k}/${d}${Number.isFinite(a) ? '/' + a : ''}`;
                }

                let dateStr = undefined;
                if (Number.isFinite(ts) && ts > 0) {
                    const ed = new Date(ts * 1000);
                    const ym = ed.getMonth() + 1;
                    const yday = ed.getDate();
                    dateStr = `${ym < 10 ? '0' : ''}${ym}-${yday < 10 ? '0' : ''}${yday}`;
                }

                rows.push({
                    map: rawMap.charAt(0).toUpperCase() + rawMap.slice(1),
                    score: scoreStr,
                    win: isWin,
                    ...(isDraw ? { draw: true } : {}),
                    ...(isWingman ? { mode: 'wingman', rank_type: 7 } : (pm && pm.rank_type !== undefined ? { rank_type: pm.rank_type } : {})),
                    ...(rank !== undefined ? { rank } : {}),
                    ...(dateStr ? { date: dateStr } : {}),
                    finished_at: Number.isFinite(ts) ? ts : 0,
                    ...(kdaStr ? { kda: kdaStr } : {}),
                    kd: Number.isFinite(kd) ? kd.toFixed(2) : '',
                    adr: Number.isFinite(adr) ? String(adr) : '',
                    hs: killsRowPct(mine)
                });
            }
        }
    }
    const out =  ({});
    if (kdN > 0) out.kd = Math.round(kdSum / kdN * 100) / 100;
    if (adrN > 0) out.adr = Math.round(adrSum / adrN * 100) / 100;
    if (kills > 0) out.hs = Math.round(hsKills / kills * 100);
    if (rows.length) out.rows = rows;
    return out;
}

function killsRowPct(s) {
    const k = Number(s.total_kills) || 0;
    if (k <= 0) return '';
    return Math.round((Number(s.total_hs_kills) || 0) / k * 100) + '%';
}

async function fetchLeetifyAgg(steamId, apiKey, profileRanks, profileRecentMatches) {
    const r = await fetchWithTimeout(LEE_API + '/v3/profile/matches?steam64_id=' + encodeURIComponent(steamId), { headers: leetifyHeaders(apiKey) }, 9000);
    if (!r.ok) return {};
    const list = await r.json().catch(() => null);
    return aggregateLeetifyMatches(steamId, list, profileRanks, profileRecentMatches);
}

function buildLeetifyPayload(steamId, p, agg) {
    if (!p || typeof p !== 'object') return { has_leetify: false, error: 'NOT_FOUND' };
    const a = agg || {};
    const ranks = p.ranks && typeof p.ranks === 'object' ? p.ranks : {};
    const rating = p.rating && typeof p.rating === 'object' ? p.rating : {};
    const stats = p.stats && typeof p.stats === 'object' ? p.stats : {};
    const recent = Array.isArray(p.recent_matches) ? p.recent_matches : [];
    const bans = Array.isArray(p.bans) ? p.bans : [];
    const num = ( v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
    const pct2 = ( v) => { const n = num(v); return n !== undefined ? Math.round(n * 10000) / 100 : undefined; };
    const dec2 = ( v) => { const n = num(v); return n !== undefined ? Math.round(n * 100) / 100 : undefined; };
    const lr = num(ranks.leetify);
    const premier = num(ranks.premier);
    const winrate = num(p.winrate);
    const totalMatches = num(p.total_matches);
    const preaim = dec2(stats.preaim);
    const reaction = num(stats.reaction_time_ms);
    const compRaw = Array.isArray(ranks.competitive) ? ranks.competitive : [];
    return {
        has_leetify: true,
        name: typeof p.name === 'string' ? p.name : '',
        url: 'https://leetify.com/public/profile/' + steamId,
        leetify_rating: dec2(lr),
        premier: premier !== undefined ? Math.round(premier) : undefined,
        aim: num(rating.aim) !== undefined ? Math.round( (num(rating.aim))) : undefined,
        positioning: num(rating.positioning) !== undefined ? Math.round( (num(rating.positioning))) : undefined,
        utility: num(rating.utility) !== undefined ? Math.round( (num(rating.utility))) : undefined,
        clutch: pct2(rating.clutch),
        opening: pct2(rating.opening),
        preaim: preaim,
        reaction: reaction !== undefined ? Math.round(reaction) : undefined,
        win_rate: winrate !== undefined ? Math.round(winrate * 100) : undefined,
        total_matches: totalMatches,
        kd: a.kd,
        hs: a.hs,
        adr: a.adr,
        recent_rows: a.rows,
        
        competitive: compRaw
            .filter(( r) => r && typeof r === 'object' && Number(r.rank) > 0)
            .map(( r) => ({ map: String(r.map_name || ''), rank: Number(r.rank) })),
        wingman: num(ranks.wingman),

        recent: recent
            .map(( m) => (m && m.outcome === 'win') ? '1' : (m && /^(loss|lose)/.test(String(m.outcome || ''))) ? '0' : '')
            .filter(( x) => x !== '')
            .slice(0, 5),
        faceit_banned: bans.some(( b) => b && b.platform === 'faceit')
    };
}

async function fetchLeetifyData(steamId, apiKey) {
    if (!steamId) return { error: 'NOT_FOUND', has_leetify: false };
    const key = (typeof apiKey === 'string') ? apiKey.trim() : '';
    try {
        const r = await fetchWithTimeout(LEE_API + '/v3/profile?steam64_id=' + encodeURIComponent(steamId), { headers: leetifyHeaders(key) }, 9000);
        if (r.status === 404) {
            let ok = null;
            if (key) {
                ok = await leetifyValidateKey(key);
            }
            return { error: ok === false ? 'BAD_KEY' : 'NOT_FOUND', has_leetify: false };
        }
        if (r.status === 401) return { error: 'BAD_KEY', has_leetify: false };
        if (r.status === 429) return { error: 'HTTP 429', has_leetify: false };
        if (!r.ok) return { error: 'HTTP ' + r.status, has_leetify: false };
        const p = await r.json().catch(() => null);
        if (!p || typeof p !== 'object') return { error: 'NOT_FOUND', has_leetify: false };
        const agg = await fetchLeetifyAgg(steamId, key, p.ranks, p.recent_matches).catch(() => ({}));
        return buildLeetifyPayload(steamId, p, agg);
    } catch (e) { return { error: 'NETWORK_ERROR', has_leetify: false }; }
}
