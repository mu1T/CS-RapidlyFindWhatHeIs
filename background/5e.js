var __S_background_5e_js=(function(){var T="PvbfzLWh5cPWYXJUSBRyMRECGvG7wcDR5rWRkZNveUFGESMsEQJQ7enPnKSsrobbcWJ6UVAwYD0NAOL+/s/TCAopBhIc6+j0OT4XBA35rYue2aqsgNzKaWlKUjljOQgZrvz+zNGtu4OZhGxoZAVfMCUuRBn1+7DI2LKyz52WZm1EXDU0HQLz46eFmKOwqo7WMHdvQFg/fQMCF6j308/VrbuHmNNhYldAEisnDV4a6uzEndKtrYWbLxae3mNsN1RdJiA6HADw6rHB06K0uJiEFdeRqrfOg5RteUVFSzk9SB8a+PHJ1w0qFgDf66/C67WhsI2bM2NsUUJMdnZJFOH5/4mBpL63iYwsbHNEGTYjOBgV5f+xw8yxovCayClxQUNUIjA+Gwjt5wofCRAd2NDkgIr6C+/WqKeFg44qWWUbN0hZTjcnW0FU7/TWypL8s5OcnHM5R15TZC0WFw3u+Mjst6Suj5lkIXNcQTJgKlhZ5PXp9dutoqoOkNhhbjFaXyQ+PB4C9vQIweuwgcCRYm0P5bidnmpOf15MLSYwBxzoM+jy4LmIWiIgdWkxZXVBSbml+N3eqo6/noxtZnBHXCgvVQgl8/vKy9Xh6Mq0ojJKUG0WYw==",P=[243,72,0,389,374,184,207,295,130,318,398,63,414,306,229],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);


const F5E_SEARCH_API = 'https://arena.5eplay.com/api/search/player/1/16';
const F5E_ID_TRANSFER_API = 'https://gate.5eplay.com/userinterface/http/v1/userinterface/idTransfer';
const F5E_MATCH_LIST_API = 'https://gate.5eplay.com/crane/http/api/data/match/list';
const F5E_PLAYER_HOME_API = 'https://gate.5eplay.com/crane/http/api/data/v3/player/home';
const F5E_PLAYER_SEASON_API = 'https://gate.5eplay.com/crane/http/api/data/player/season';
const F5E_SEASON_LIST_API = 'https://gate.5eplay.com/crane/http/api/data/season_list';
const F5E_STEAM_USERNAME_API = 'https://api-client-arena.5eplay.com/api/user/steam_username';
const F5E_BANNED_USER_API = __S_background_5e_js(0);

const F5E_REDDOT_PLAYER_API = __S_background_5e_js(1);

const F5E_PLAYER_ADVANCED_API = __S_background_5e_js(2);

const F5E_ADV_DIMS = ['entry_scores', 'utility_scores', 'lurker_scores', 'game_understanding_scores', 'sniper_scores'];

function f5eHeaders(token) {
    
    const h = {
        'Accept': '*/*',
        'Accept-Language': 'zh-cn',
        'Content-Type': 'application/json',
        'Referer': 'https://view-arena.5eplay.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        [__S_background_5e_js(3)]: '5eplay',
        [__S_background_5e_js(4)]: 'pm/c+nYSScWXLOYG7WCczBallQAPFsQ+mu3szgvr7xg=',
        [__S_background_5e_js(5)]: 'Accept-Language,Authorization',
        [__S_background_5e_js(6)]: __S_background_5e_js(7)
    };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
}

const _f5eHsInflight = new Map();   

function f5eFightAgg(row) {
    if (!row) return null;
    const f = row.fight;
    if (f && typeof f === 'object' && f.kill != null) return f;
    const t = (row.fight_t && typeof row.fight_t === 'object') ? row.fight_t : null;
    const c = (row.fight_ct && typeof row.fight_ct === 'object') ? row.fight_ct : null;
    if (!t && !c) return null;
    const a = t || {}, b = c || {};
    const k1 = f5eNum(a.kill), k2 = f5eNum(b.kill);
    const kill = k1 + k2;
    const headshot = f5eNum(a.headshot) + f5eNum(b.headshot);
    return {
        kill,
        death: f5eNum(a.death) + f5eNum(b.death),
        assist: f5eNum(a.assist) + f5eNum(b.assist),
        headshot,
        per_headshot: kill > 0 ? headshot / kill : 0,
        adr: kill > 0 ? (f5eNum(a.adr) * k1 + f5eNum(b.adr) * k2) / kill : 0
    };
}

function f5eMatchDetailStats(data, uu) {
    if (!data) return null;
    const rows = [];
    let target = null;
    for (const g of [data.group_1, data.group_2]) {
        if (!Array.isArray(g)) continue;
        for (const row of g) {
            rows.push(row);
            const ud = row && row.user_info && row.user_info.user_data ? row.user_info.user_data : null;
            if (!target && ud && String(ud.uuid || '') === uu) target = row;
        }
    }
    if (!target) return null;
    const agg = f5eFightAgg(target);
    if (!agg) return null;
    const kill = f5eNum(agg.kill), hsk = f5eNum(agg.headshot);
    const rawHs = f5eNum(agg.per_headshot);
    const hs = (kill > 0 && agg.headshot != null) ? (hsk / kill) : (rawHs > 1 ? rawHs / 100 : rawHs);
    
    const lv = f5eNum(target.level_info && target.level_info.level_id);
    let seg = null;
    if (lv > 0) {
        let sum = 0, n = 0;
        for (const row of rows) {
            const ud = row && row.user_info && row.user_info.user_data ? row.user_info.user_data : null;
            if (!ud || String(ud.uuid || '') === uu) continue;                       
            if (f5eNum(row.level_info && row.level_info.level_id) !== lv) continue;   
            const a = f5eFightAgg(row);
            if (!a || a.rating3 == null) continue;
            const v = f5eNum(a.rating3);
            if (v === 0) continue;   
            sum += v; n++;
        }
        if (n > 0) seg = { sum, n };
    }
    return { hs, adr: f5eNum(agg.adr), assist: f5eNum(agg.assist), ss: agg.rating3 != null ? f5eNum(agg.rating3) : null, seg };
}

async function f5eMatchPayload(matchId) {
    const mid = String(matchId || '');
    if (!mid) return null;
    if (_f5eHsInflight.has(mid)) return _f5eHsInflight.get(mid);
    const p = (async () => {
        const url = __S_background_5e_js(8) + encodeURIComponent(mid);
        const raw = await f5eGateFetch(url, 'GET');
        return raw && raw.status === true && raw.data ? raw.data : (raw && raw.data ? raw.data : null);
    })().finally(() => _f5eHsInflight.delete(mid));
    _f5eHsInflight.set(mid, p);
    return p;
}

async function fetchF5eMatchHs(matchId, uuid) {
    const mid = String(matchId || '');
    const uu = String(uuid || '');
    if (!mid || !uu) return null;
    const data = await f5eMatchPayload(mid);
    return f5eMatchDetailStats(data, uu);
}

const F5E_MATCH_SCOPED_PREFIXES = ['f5ero_', 'f5ehs_'];
const F5E_ROSTER_SHAPE = 2;   

function f5eBool(v) { return v === true || v === 1 || String(v) === '1'; }

function f5eRosterPlayer(row) {
    if (!row || typeof row !== 'object') return null;
    const ud = (row.user_info && row.user_info.user_data) ? row.user_info.user_data : null;
    if (!ud) return null;
    const prof = ud.profile || {};
    const steam = ud.steam || {};
    const li = row.level_info || {};
    const agg = f5eFightAgg(row) || {};
    const n = f5eNum;
    const kill = n(agg.kill), hsk = n(agg.headshot);
    const rawHs = n(agg.per_headshot);
    const hs = (kill > 0 && agg.headshot != null) ? (hsk / kill) : (rawHs > 1 ? rawHs / 100 : rawHs);
    
    let liveUrl = '';
    try {
        const idl = (ud.identity && Array.isArray(ud.identity.identity_list)) ? ud.identity.identity_list : [];
        for (const it of idl) { const u = it && it.live_url ? String(it.live_url) : ''; if (u) { liveUrl = u; break; } }
    } catch (e0) {  }
    return {
        
        uid: n(ud.uid),
        uuid: String(ud.uuid || ''),
        username: String(ud.username || ''),
        nickname: String(prof.nickname || ud.username || ''),
        avatar: String(prof.avatarUrl || ud.avatarUrl || ''),
        domain: String(ud.domain || prof.domain || ''),
        steamId: String(steam.steamId || ''),
        levelId: n(li.level_id),
        levelType: n(li.level_type),
        starNum: n(li.star_num),
        
        elo: (() => { const o = n(li.origin_elo); return o > 0 ? o + n(li.change_elo) : 0; })(),
        liveUrl,
        
        teamId: n(agg.match_team_id || agg.group_id),
        roundTotal: n(agg.round_total),
        
        kills: kill,
        deaths: n(agg.death),
        assists: n(agg.assist),
        adr: n(agg.adr),
        hs,
        rws: n(agg.rws),
        ss: agg.rating3 != null ? n(agg.rating3) : null,
        kast: agg.kast != null ? n(agg.kast) : null,
        rating: n(agg.rating),
        rating2: n(agg.rating2),
        
        k1: n(agg.kill_1), k2: n(agg.kill_2), k3: n(agg.kill_3), k4: n(agg.kill_4), k5: n(agg.kill_5),
        a1: n(agg.many_assists_cnt1), a2: n(agg.many_assists_cnt2), a3: n(agg.many_assists_cnt3),
        a4: n(agg.many_assists_cnt4), a5: n(agg.many_assists_cnt5),
        
        firstKill: n(agg.first_kill), firstDeath: n(agg.first_death),
        awpKill: n(agg.awp_kill), benefitKill: n(agg.benefit_kill),
        
        end1: n(agg.end_1v1), end2: n(agg.end_1v2), end3: n(agg.end_1v3), end4: n(agg.end_1v4), end5: n(agg.end_1v5),
        
        flashEnemy: n(agg.flash_enemy), flashEnemyTime: n(agg.flash_enemy_time),
        flashTeam: n(agg.flash_team), flashTeamTime: n(agg.flash_team_time), flashTime: n(agg.flash_time),
        plantedBomb: n(agg.planted_bomb), defusedBomb: n(agg.defused_bomb), explodeBomb: n(agg.explode_bomb),
        throwHarm: n(agg.throw_harm), throwHarmEnemy: n(agg.throw_harm_enemy),
        
        perfectKill: n(agg.perfect_kill), assistedKill: n(agg.assisted_kill), revengeKill: n(agg.revenge_kill),
        jumpTotal: n(agg.jump_total), holdTotal: n(agg.hold_total), teamKill: n(agg.team_kill),
        
        isMvp: f5eBool(agg.is_mvp), isSvp: f5eBool(agg.is_svp),
        isWin: f5eBool(agg.is_win), isTie: f5eBool(agg.is_tie),
        most: {
            firstKill: f5eBool(agg.is_most_first_kill), awp: f5eBool(agg.is_most_awp),
            assist: f5eBool(agg.is_most_assist), headshot: f5eBool(agg.is_most_headshot),
            end: f5eBool(agg.is_most_end), jump: f5eBool(agg.is_most_jump), oneVtwo: f5eBool(agg.is_most_1v2)
        }
    };
}

function f5eMatchRoster(data) {
    if (!data || typeof data !== 'object') return null;
    const main = data.main || {};
    
    const teams = [];
    for (const g of [data.group_1, data.group_2]) {
        if (!Array.isArray(g)) continue;
        const players = g.map(f5eRosterPlayer).filter((p) => !!p);
        if (players.length) teams.push(players);
    }
    if (!teams.length) return null;
    const st = f5eNum(main.start_time), et = f5eNum(main.end_time);
    const score1 = f5eNum(main.group1_all_score), score2 = f5eNum(main.group2_all_score);

    const mw = f5eNum(main.match_winner);
    const winner = mw > 0 ? mw : (score1 > score2 ? 1 : (score2 > score1 ? 2 : 0));
    return {
        success: true,
        matchId: String(main.match_code || main.id || ''),
        map: String(main.map || ''),
        mapName: String(main.map_desc || ''),
        score1,
        score2,
        startTime: st,
        endTime: et,
        duration: (st > 0 && et > st) ? (et - st) : 0,
        season: String(main.season || ''),
        matchMode: f5eNum(main.match_mode),
        roundTotal: f5eNum(main.round_total),
        mvpUid: f5eNum(main.mvp_uid),
        gameName: String(main.game_name || ''),
        
        demoUrl: String(main.demo_url || ''),
        
        mostUid: {
            firstKill: f5eNum(main.most_first_kill_uid), awp: f5eNum(main.most_awp_uid),
            assist: f5eNum(main.most_assist_uid), headshot: f5eNum(main.most_headshot_uid),
            end: f5eNum(main.most_end_uid), jump: f5eNum(main.most_jump_uid), oneVtwo: f5eNum(main.most_1v2_uid)
        },
        winner,   
        teams
    };
}

const _f5eMatchRosterInflight = new Map();   

async function fetchF5eRoster(matchId) {
    const mid = String(matchId || '');
    if (!mid) return null;
    const key = CACHE_KEY_PREFIX + 'f5ero_' + mid;
    try {
        const hit = await cacheGetVersioned(key, F5E_ROSTER_SHAPE, {
            ttl: 24 * 3600e3,
            valid: ( d) => !!(d && d.success && Array.isArray(d.teams) && d.teams.length)
        });
        if (hit) return hit;
    } catch (e0) {  }
    if (_f5eMatchRosterInflight.has(mid)) return _f5eMatchRosterInflight.get(mid);
    const p = (async () => {
        const data = await f5eMatchPayload(mid);
        const roster = f5eMatchRoster(data);
        if (roster) {
            try { cacheSetVersioned(key, roster, F5E_ROSTER_SHAPE, { ttl: 24 * 3600e3 }); } catch (e1) {  }
        }
        return roster;
    })().finally(() => _f5eMatchRosterInflight.delete(mid));
    _f5eMatchRosterInflight.set(mid, p);
    return p;
}

function f5eSeasonOrder(season) {
    const m = /^(\d{4})s(\d+)$/i.exec(String(season || ''));
    return m ? (parseInt(m[1], 10) * 10 + parseInt(m[2], 10)) : 0;
}

async function f5eRequest(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs || 8000);
    try {
        const opts = Object.assign({}, options || {}, { signal: controller.signal });
        let res = await fetch(url, opts);

        const h =  (opts.headers);
        if ((res.status === 401 || res.status === 403) && h && h.Authorization) {
            const h2 = Object.assign({}, h);
            delete h2.Authorization;
            res = await fetch(url, Object.assign({}, opts, { headers: h2 }));
        }
        if (!res.ok) return null;
        return await res.json().catch(() => null);
    } catch (e) {
        return null;
    } finally { clearTimeout(timer); }
}

async function f5eStoreTokenIfChanged(jwt) {
    const t = String(jwt || '').trim();
    if (!t) return false;

    try {
        const cur = await new Promise(( r) => chrome.storage.local.get({ sps_f5e_token: '' }, ( dd) => r(String((dd && dd[__S_background_5e_js(14)]) || ''))));
        if (cur === t) return false;
    } catch (e0) {  }
    const ok = await new Promise(( r) => {
        try { chrome.storage.local.set({ sps_f5e_token: t }, () => r(true)); } catch (e1) { r(false); }
    });
    if (ok && typeof f5eResetJwtCache === 'function') { try { f5eResetJwtCache(); } catch (e2) {  } }
    return ok;
}

const _f5eUsernameCache = new Map();   
const _f5eResolveCache = new Map();    

const F5E_RESOLVE_L2_TTL = 30 * 24 * 3600e3;

async function f5eResolveL2Get(steamId) {
    try {
        const e = await cacheGet(CACHE_KEY_PREFIX + 'f5er_key_' + String(steamId));
        if (e && e.data && e.data.uuid && e.data.domain && Date.now() - e.ts < F5E_RESOLVE_L2_TTL) return e.data;
    } catch (e0) {  }
    return null;
}

function f5eResolveL2Set(steamId, v) {
    try { cacheSet(CACHE_KEY_PREFIX + 'f5er_key_' + String(steamId), { data: v }); } catch (e0) {  }
}

async function f5eResolveUuid(steamId, token) {
    if (!steamId) return { error: 'NO_STEAMID' };
    
    const l2 = await f5eResolveL2Get(String(steamId));
    if (l2) return Object.assign({}, l2);
    let username = String(_f5eUsernameCache.get(String(steamId)) || '');
    if (!username) {
        const uRes = await f5eRequest(F5E_STEAM_USERNAME_API + '/' + encodeURIComponent(String(steamId)), { headers: { 'Accept': '*/*' } });
        username = uRes && uRes.success && uRes.data && uRes.data.username ? String(uRes.data.username) : '';
        if (!username) return { error: 'NOT_BINDDED' };   
        if (_f5eUsernameCache.size >= 200) _f5eUsernameCache.delete(_f5eUsernameCache.keys().next().value);
        _f5eUsernameCache.set(String(steamId), username);
    }
    const sRes = await f5eRequest(F5E_SEARCH_API + '?keywords=' + encodeURIComponent(username), { headers: { 'Accept': '*/*' } });
    const list = (sRes && sRes.success && sRes.data && sRes.data.user && Array.isArray(sRes.data.user.list)) ? sRes.data.user.list : [];
    if (!list.length) return { error: 'NOT_BINDDED' };
    const hit = list.find(( u) => u.username === username) || list[0];
    const domain = hit && hit.domain ? String(hit.domain) : '';
    if (!domain) return { error: 'NOT_BINDDED' };
    const rc = _f5eResolveCache.get(domain);
    if (rc && Date.now() - rc.ts < 24 * 3600e3) return Object.assign({}, rc.v, { domain });
    const transBody = JSON.stringify({ trans: { domain } });
    let tRes = await f5eRequest(F5E_ID_TRANSFER_API, { method: 'POST', headers: f5eHeaders(token), body: transBody });
    let uuid = tRes && tRes.data && tRes.data.uuid ? String(tRes.data.uuid) : '';

    if (!uuid && token) {
        tRes = await f5eRequest(F5E_ID_TRANSFER_API, { method: 'POST', headers: f5eHeaders(), body: transBody });
        uuid = tRes && tRes.data && tRes.data.uuid ? String(tRes.data.uuid) : '';
    }
    if (!uuid) return { error: 'RESOLVE_FAILED' };
    const v = { uuid, username: String(hit.username || username), avatar: hit.avatar_url ? String(hit.avatar_url) : '' };
    if (_f5eResolveCache.size >= 200) _f5eResolveCache.delete(_f5eResolveCache.keys().next().value);
    _f5eResolveCache.set(domain, { v, ts: Date.now() });
    f5eResolveL2Set(String(steamId), { uuid: v.uuid, domain, username: v.username, avatar: v.avatar });   
    return Object.assign({ domain }, v);
}

const F5E_CONTACT_TTL = 10 * 60000;

const F5E_CONTACT_DENY = [];

function f5eContactDenied(ids) {
    const s = ids || {};
    const uuid = String(s.uuid || '');
    const domain = String(s.domain || '');
    const steamId = String(s.steamId || '');
    if (!uuid && !domain && !steamId) return false;
    return F5E_CONTACT_DENY.some(( w) =>
        (!!uuid && w.uuid === uuid) || (!!domain && w.domain === domain) || (!!steamId && w.steamId === steamId));
}

function f5eContactDeniedByName(d) {
    const name = d && d.username ? String(d.username) : '';
    return !!name && F5E_CONTACT_DENY.some(( w) => w.name === name);
}

let _f5eContactInflight = new Map();   

function f5eContactEnabled() {
    return new Promise((resolve) => {
        try {
            chrome.storage.sync.get({ sps_f5e_contact: false }, ( s) => {
                resolve(!!(s && s.sps_f5e_contact === true));
            });
        } catch (e0) { resolve(false); }
    });
}

async function fetchF5eContact(steamId, uuid, domain) {
    const sid = String(steamId || '');
    if (!sid) return { success: false, error: 'NO_STEAMID' };
    const cacheKey = CACHE_KEY_PREFIX + 'f5ec_' + sid;

    if (f5eContactDenied({ uuid, domain, steamId: sid })) {
        cacheDel(cacheKey);   
        addLog('[F5E] contact denied by whitelist (uuid/domain matched, zero network)');
        return { success: true, deny: true };
    }
    if (!(await f5eContactEnabled())) {
        cacheDel(cacheKey);   
        return { success: true, disabled: true };
    }
    try {
        const hit = await cacheGet(cacheKey);
        if (hit && hit.data && Date.now() - hit.ts < (hit.ttl || F5E_CONTACT_TTL)) {
            
            if (f5eContactDeniedByName(hit.data)) { cacheDel(cacheKey); return { success: true, deny: true }; }
            return Object.assign({ success: true }, hit.data);
        }
    } catch (e0) {  }
    const inflight = _f5eContactInflight.get(sid);
    if (inflight) return inflight;
    const p = (async () => {
        const raw = await f5eRequest(F5E_STEAM_USERNAME_API + '/' + encodeURIComponent(sid), { headers: { 'Accept': '*/*' } });
        const d = raw && raw.success && raw.data ? raw.data : null;
        if (!d) return { success: false, error: 'NOT_BINDDED' };

        if (f5eContactDeniedByName(d)) {
            addLog('[F5E] contact denied by whitelist (username matched post-fetch)');
            return { success: true, deny: true };
        }
        const v = { mobile: d.mobile ? String(d.mobile) : '', email: d.email ? String(d.email) : '' };
        try { cacheSet(cacheKey, { data: v }, { ttl: F5E_CONTACT_TTL }); } catch (e0) {  }
        addLog('[F5E] contact fetched (masked fields only, cached ' + Math.round(F5E_CONTACT_TTL / 60000) + 'min)');
        return Object.assign({ success: true }, v);
    })().finally(() => _f5eContactInflight.delete(sid));
    _f5eContactInflight.set(sid, p);
    return p;
}

function normalizeF5eHome(raw) {
    const d = raw && raw.code === 0 && raw.data ? raw.data : null;
    if (!d) return null;
    const ui = d.uinfo || {};
    const career = d.career || {};

    const sdata = d.season_data || {};
    
    let mode9 = null, eloSeq = [];
    try {
        mode9 = (d.elo_info && d.elo_info.modes && d.elo_info.modes['9']) || null;
        if (mode9 && mode9.special_data) {
            const sp = (typeof mode9.special_data === 'string') ? JSON.parse(mode9.special_data) : mode9.special_data;
            eloSeq = (Array.isArray(sp && sp.match_data) ? sp.match_data : [])
                .map(( m) => ({ isWin: m.is_win === true || f5eNum(m.is_win) === 1, changeElo: f5eNum(m.change_elo) }))
                .filter(( m) => m.changeElo !== 0 || m.isWin);
        }
    } catch (e0) {  }

    const curSeason = sdata && sdata.season ? String(sdata.season) : '';
    const mode9Season = mode9 && mode9.season ? String(mode9.season) : '';
    const mode9Current = !!mode9 && (!curSeason || !mode9Season || mode9Season === curSeason);
    
    const peakIsCurrent = !!(career.best_season && curSeason && String(career.best_season) === curSeason);

    const curLevelId = mode9Current ? f5eNum(mode9.level_id) : f5eNum(career.level_id);
    const curSeasonMatches = f5eNum(sdata.match_total) || f5eNum(mode9 && mode9.match_total);
    const curElo = mode9Current ? f5eNum(mode9.elo) : 0;
    const hasCurBlock = !!mode9 || curSeasonMatches > 0;

    return {
        success: true,
        shape: F5E_OVERVIEW_SHAPE,
        uuid: String(ui.uuid || ''),
        username: String(ui.username || '未知玩家'),
        avatar: ui.avatar_url ? String(ui.avatar_url) : '',
        domain: String(ui.domain || ''),
        credit: f5eNum(ui.credit),

        elo: mode9Current ? curElo : f5eNum(career.elo),
        levelId: curLevelId,
        
        levelType: f5eNum(mode9Current && mode9.level_type != null ? mode9.level_type : career.level_type),
        starNum: f5eNum(mode9 && mode9.star_num) || (peakIsCurrent ? f5eNum(career.star_num) : 0),
        starElo: f5eNum(mode9 && mode9.star_elo),

        rank: (mode9Current ? f5eNum(mode9.rank) : 0) || (peakIsCurrent ? f5eNum(career.rank) : 0),
        
        unranked: hasCurBlock ? !(curLevelId > 0 || curSeasonMatches > 0) : false,

        peakSeason: /^\d{4}s\d+$/i.test(String(career.best_season || '')) ? String(career.best_season) : '',
        peakElo: f5eNum(career.elo),
        peakLevelId: f5eNum(career.level_id),
        peakStarNum: f5eNum(career.star_num),
        matchTotal: f5eNum(career.match_total),
        matchWin: f5eNum(career.match_win),
        matchLoss: f5eNum(career.match_loss),
        matchTie: f5eNum(career.match_tie),
        eloSeq,   
        currentSeason: (d.season_data && d.season_data.season) ? String(d.season_data.season) : '',   
        
        seasonKd: f5eNum(sdata.death) > 0 ? f5eNum(sdata.kill) / f5eNum(sdata.death) : 0,

        seasonMatches: curSeasonMatches,

        ban: normalizeF5eBan(ui.status, career, mode9)
    };
}

const F5E_MODE_CORE = [9, 1, 0, 4, 6, 8, 11, 163];
const F5E_MODE_SOFT = [5, 2, 174, 37, 3];

const F5E_MODE_WHITELIST = F5E_MODE_CORE.concat(F5E_MODE_SOFT);

const F5E_OVERVIEW_SHAPE = 4;

const F5E_SEASON_SHAPE = 6;
const F5E_HS_SHAPE = 3;   

const F5E_BAN_SHAPE = 1;
const F5E_MODE_NAMES = { 9: '优先排位', 1: '对战匹配', 0: '新手匹配', 4: '5EPL', 6: '5EPL-C', 8: '5EPL-D', 11: '5EPL-A', 163: '全民联赛', 5: '十人约战', 2: '战队匹配', 174: '团队匹配', 37: '自定义房间', 3: '锦标赛' };

function f5eModeCodeFromMatchId(matchId) {
    const id = String(matchId || '');
    if (!/^g(?:12[17]|163)/i.test(id)) return 0;
    const m = /^g(\d{3})(?:$|-)/i.exec(id);
    return m ? (parseInt(m[1], 10) || 0) : 0;
}

function normalizeF5eMatches(raw) {
    const rows = raw && raw.code === 0 && Array.isArray(raw.data) ? raw.data : [];
    const mapped = rows.map(( m) => {
        const isWin = m.is_win === true || f5eNum(m.is_win) === 1;
        const s1 = f5eNum(m.group1_all_score), s2 = f5eNum(m.group2_all_score);
        const hi = Math.max(s1, s2), lo = Math.min(s1, s2);

        const isTie = m.is_tie === true || (s1 > 0 && s1 === s2);

        const gm0 = parseInt(String(m.game_mode), 10) || 0;
        const mtRaw = m.match_type != null && String(m.match_type).trim() !== ''
            ? parseInt(String(m.match_type), 10)
            : (gm0 === 103 || gm0 === 24 ? 9 : (gm0 > 0 ? gm0 : -1));

        const mtCode = f5eModeCodeFromMatchId(m.match_id);
        const mtGt = String(m.game_type || '').toLowerCase() === 'league' ? 163 : 0;
        const mtFinal = mtCode > 0 ? mtCode : (mtGt > 0 ? mtGt : mtRaw);
        return {
            matchId: String(m.match_id || ''),
            matchType: mtFinal,   
            isCredit: f5eNum(m.is_credit_match) === 1,             
            startTime: f5eNum(m.start_time),
            endTime: f5eNum(m.end_time),
            map: String(m.map || ''),
            mapName: String(m.map_name || ''),
            levelName: (m.level_info && m.level_info.level_name) ? String(m.level_info.level_name) : '',

            afterElo: (() => { const b = f5eNum(m.level_info && m.level_info.origin_elo); return b > 0 ? b + f5eNum(m.change_elo) : 0; })(),
            
            originElo: f5eNum(m.level_info && m.level_info.origin_elo),
            
            starNum: f5eNum(m.level_info && m.level_info.star_num),
            isWin,
            isTie,
            score1: isWin ? hi : lo,   
            score2: isWin ? lo : hi,   
            changeElo: f5eNum(m.change_elo),
            kills: f5eNum(m.kill),
            deaths: f5eNum(m.death),
            rws: f5eNum(m.rws),
            adr: f5eNum(m.adr),
            rating: f5eNum(m.rating),

            rating3: f5eNum(m.rating3),
            isMvp: m.is_mvp === true || f5eNum(m.is_mvp) === 1,
            isSvp: m.is_svp === true || f5eNum(m.is_svp) === 1
        };
    });

    const list = mapped.filter(( m) => m.matchId && F5E_MODE_WHITELIST.indexOf(m.matchType) >= 0);

    mapped.rawCount = mapped.length;
    list.rawCount = mapped.length;
    return list;
}

async function f5eSearchUser(keyword) {
    const kw = String(keyword || '').trim().slice(0, 64);   
    if (!kw) return { error: 'NO_KEYWORD' };
    const r = await f5eRequest(F5E_SEARCH_API + '?keywords=' + encodeURIComponent(kw), { headers: { 'Accept': '*/*' } });
    const list = (r && r.success && r.data && r.data.user && Array.isArray(r.data.user.list)) ? r.data.user.list : [];
    return {
        success: true,
        users: list.slice(0, 8).map(( u) => ({
            username: String(u.username || ''),
            domain: String(u.domain || ''),
            avatar: u.avatar_url ? String(u.avatar_url) : ''
        })).filter(( u) => u.username && u.domain)
    };
}

function f5eJwtExpired(jwt) {
    const parts = String(jwt || '').trim().split('.');
    if (parts.length !== 3) return false;   
    try {
        const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
        const payload = JSON.parse(atob(b64 + pad));
        const exp = Number(payload && payload.exp);
        if (!isFinite(exp) || exp <= 0) return false;   
        return exp * 1000 <= Date.now() + 60000;        
    } catch (e) { return false; }   
}

async function f5eReadToken() {
    try {
        const d = await new Promise(( r) => chrome.storage.local.get({ sps_f5e_token: '' }, ( dd) => r(dd)));
        const t = String((d && d[__S_background_5e_js(14)]) || '');
        return f5eJwtExpired(t) ? '' : t;
    } catch (e0) { return ''; }
}

const _f5eAdvCache = new Map();   
const _f5eAdvInflight = new Map();

async function fetchF5eAdvanced(uuid, token, season) {
    const uid = String(uuid || '');
    if (!uid) return null;
    const ck = uid + '|' + String(season || '');
    const hit = _f5eAdvCache.get(ck);
    if (hit && Date.now() - hit.ts < 10 * 60000) return hit.v;
    if (_f5eAdvInflight.has(ck)) return _f5eAdvInflight.get(ck);
    const p = (async () => {
        try {
            const url = F5E_PLAYER_ADVANCED_API + '?uuid=' + encodeURIComponent(uid) +
                (season ? '&season=' + encodeURIComponent(String(season)) : '');
            const headers = await f5eSignedHeaders('GET', url, undefined, token || '');   
            const raw = await f5eRequest(url, { headers });
            const d = raw && raw.code === 0 && raw.data ? raw.data : null;
            if (!d || !d.advanced) return null;
            const adv = d.advanced;
            const dim = ( k) => (adv[k] && typeof adv[k] === 'object') ? f5eNum(adv[k].final_score) : 0;

            const subs = {};
            for (const k of F5E_ADV_DIMS) {
                const blk = adv[k];
                if (!blk || typeof blk !== 'object') continue;
                subs[k] = Object.keys(blk)
                    .filter((f) => f !== 'final_score')
                    .map((f) => ({ k: f, v: f5eNum(blk[f]) }));
            }
            const roleInfo = d.role_info || {};
            return {
                season: String(season || ''),
                entry: dim('entry_scores'),           
                utility: dim('utility_scores'),       
                lurker: dim('lurker_scores'),         
                understanding: dim('game_understanding_scores'),   
                sniper: dim('sniper_scores'),         
                subs,                                 
                finalScore: f5eNum(adv.final_score),  
                professionValue: f5eNum(adv.profession_value),
                avgValue: f5eNum(adv.avg_value),
                role: String(d.role || roleInfo.role || ''),
                roleDesc: String(roleInfo.desc || ''),
                roleAdj: String(roleInfo.adj || ''),
                roleProperty: String(roleInfo.property || ''),
                gameCnt: f5eNum(d.game_cnt)
            };
        } catch (e) {
            return null;
        }
    })();
    _f5eAdvInflight.set(ck, p);
    try {
        const v = await p;
        if (v) _f5eAdvCache.set(ck, { v, ts: Date.now() });
        if (_f5eAdvCache.size > 100) _f5eAdvCache.delete(_f5eAdvCache.keys().next().value);
        return v;
    } finally {
        _f5eAdvInflight.delete(ck);
    }
}

let _f5eCalInflight = null;

async function fetchF5eSeasonList(token) {
    const calKey = CACHE_KEY_PREFIX + 'f5ecal_v1';
    const calTTL = 30 * 60000;
    try {
        const c = await cacheGet(calKey);
        if (c && Array.isArray(c.data) && c.data.length && Date.now() - c.ts < calTTL) return c.data;
        if (_f5eCalInflight) return _f5eCalInflight;   
    } catch (e0) {  }
    _f5eCalInflight = (async () => {
        const raw = await f5eRequest(F5E_SEASON_LIST_API, { headers: f5eHeaders(token) });
        const rows = raw && raw.code === 0 && raw.data && Array.isArray(raw.data.season_list) ? raw.data.season_list : [];
        const list = rows.map(( m) => ({
            season: String(m.season || ''),
            year: f5eNum(m.year),
            current: m.current_season === true,
            beginUnix: f5eNum(m.begin_unix),
            endUnix: f5eNum(m.end_unix)
        })).filter(( r) => r.season)
          .sort(( a,  b) => f5eSeasonOrder(b.season) - f5eSeasonOrder(a.season));
        if (list.length && typeof cacheSet === 'function') {
            try { cacheSet(calKey, { data: list }, { ttl: calTTL }); } catch (e1) {  }
        }
        return list;
    })().finally(() => { _f5eCalInflight = null; });
    return _f5eCalInflight;
}

function normalizeF5eSeason(raw, season) {
    const d = raw && raw.code === 0 && raw.data ? raw.data : null;
    const cd = d && d.contrast_data ? d.contrast_data : null;
    if (!cd) return null;
    const maps = (Array.isArray(d.map_data) ? d.map_data : [])
        .filter(( m) => f5eNum(m.match_total) > 0)
        .map(( m) => ({
            map: String(m.map || ''), cnt: f5eNum(m.match_total),
            winRate: f5eNum(m.per_win) * 100, rating: f5eNum(m.rating),
            rws: f5eNum(m.rws), adr: f5eNum(m.adr)
        }))
        .sort(( a,  b) => b.cnt - a.cnt);
    const weapons = (Array.isArray(d.weapon_data) ? d.weapon_data : [])
        .filter(( w) => f5eNum(w.kill_total) > 0)
        .map(( w) => ({ weapon: String(w.weapon || ''), kills: f5eNum(w.kill_total), hs: f5eNum(w.per_headshot) * 100 }))
        .sort(( a,  b) => b.kills - a.kills);   
    return {
        success: true,
        season: String(season || ''),
        matches: f5eNum(cd.match_total),
        wins: f5eNum(cd.win_match_total),
        losses: f5eNum(cd.loss_match_total),
        ties: f5eNum(cd.tie_total),
        elo: f5eNum(cd.elo),
        levelId: f5eNum(cd.level_id),

        levelType: f5eNum(cd.level_type),
        starNum: f5eNum(cd.star_num),
        rank: f5eNum(cd.rank),
        rating: f5eNum(cd.rating),

        rating3: f5eNum(cd.rating3),
        avgRating3: f5eNum(cd.avg_rating3),   
        maxRating3: f5eNum(cd.max_rating3),   
        rws: f5eNum(cd.rws),
        adr: f5eNum(cd.adr),
        hs: f5eNum(cd.per_headshot) * 100,
        mvp: f5eNum(cd.mvp_total),
        maxStreak: f5eNum(cd.max_streak),   
        maps, weapons
    };
}

async function fetchF5eSeasonData(steamId, season, uuid, token, beginUnix, endUnix, page) {
    if (!season) return { error: 'NO_SEASON' };
    if (!uuid && !steamId) return { error: 'NO_STEAMID' };
    const uid = String(uuid || '');
    if (!uid) {
        const resolved = await f5eResolveUuid(String(steamId), token || undefined);
        if (resolved.error || !resolved.uuid) return { error: resolved.error || 'RESOLVE_FAILED' };
    }
    
    const pg = Math.max(1, parseInt(String(page || 1), 10) || 1);
    if (pg > 1) {
        const rows = await fetchF5eMatchPage(uid, token, beginUnix, endUnix, pg);
        return { success: true, season: String(season || ''), matchesPage: pg, recentMatches: rows,
            recentMatchesRaw: ( (rows)).rawCount };   
    }
    const seasonP = f5eRequest(F5E_PLAYER_SEASON_API + '?uuid=' + encodeURIComponent(uid) +
        '&season=' + encodeURIComponent(String(season)) + '&match_type=9', { headers: f5eHeaders(token || undefined) });
    const b = f5eNum(beginUnix), e = f5eNum(endUnix);
    const matchesP = b > 0
        ? fetchF5eMatchPage(uid, token, beginUnix, endUnix, 1)
        : null;
    const [raw, recent] = await Promise.all([seasonP, matchesP]);
    const data = normalizeF5eSeason(raw, season);
    if (!data) return { error: 'NETWORK_ERROR' };
    if (recent) {
        data.recentMatches = recent;   
        data.recentMatchesRaw = ( (recent)).rawCount;   

        const agg = f5eKdAggregate(recent);
        if (agg.cnt > 0) {
            data.kd = agg.kd;
            data.kdCnt = agg.cnt;   
        }
    }
    return data;
}

function f5eKdAggregate(recent) {
    const rows = Array.isArray(recent) ? recent : [];
    const kdSrc = rows.filter(( m) => f5eNum(m.matchType) === 9);
    const kSum = kdSrc.reduce(( a,  m) => a + f5eNum(m.kills), 0);
    const dSum = kdSrc.reduce(( a,  m) => a + Math.max(0, f5eNum(m.deaths)), 0);
    const ok = kdSrc.length > 0 && kSum > 0 && dSum > 0;
    return { kd: ok ? Math.round(kSum / dSum * 100) / 100 : 0, cnt: ok ? kdSrc.length : 0, ladder: kdSrc.length };
}

const F5E_KD_MAX_PAGES = 8;

let _f5eKdProgressHook = null;   
async function fetchF5eSeasonKdSample(uid, token, beginUnix, endUnix, seasonMatches) {
    const cap = F5E_KD_MAX_PAGES * 25;

    const target = Math.max(1, Math.min(f5eNum(seasonMatches), cap));
    const rows = await fetchF5eMatchPage(uid, token, beginUnix, endUnix, 1);
    const all = Array.isArray(rows) ? rows.slice() : [];
    let rawCount = f5eNum(( (rows)).rawCount);
    let page = 1;
    const ladderCnt = () => all.reduce(( a,  m) => a + (f5eNum(m.matchType) === 9 ? 1 : 0), 0);
    
    const report = () => { if (_f5eKdProgressHook) { try { _f5eKdProgressHook({ page: page, cnt: ladderCnt(), target: target, maxPages: F5E_KD_MAX_PAGES }); } catch (e0) {  } } };
    report();
    while (rawCount >= 25 && page < F5E_KD_MAX_PAGES && ladderCnt() < target) {
        page++;
        const more = await fetchF5eMatchPage(uid, token, beginUnix, endUnix, page);
        if (!Array.isArray(more) || !more.length) break;
        more.forEach(( m) => all.push(m));
        rawCount = f5eNum(( (more)).rawCount);
        report();
    }
    const agg = f5eKdAggregate(all);
    return { success: true, data: { kd: agg.kd, cnt: agg.cnt, pages: page } };
}

async function fetchF5eMatchPage(uid, token, beginUnix, endUnix, page) {
    const b = f5eNum(beginUnix), e = f5eNum(endUnix);
    const pg = Math.max(1, parseInt(String(page || 1), 10) || 1);
    const raw = await f5eRequest(F5E_MATCH_LIST_API + '?match_type=-1&page=' + pg + '&data=0&start_time=' + (b > 0 ? b : 0) +
        '&end_time=' + (e > 0 ? e : 0) + '&uuid=' + encodeURIComponent(String(uid || '')) + '&limit=25&cs_type=0',
        { headers: f5eHeaders(token || undefined) });
    return normalizeF5eMatches(raw);
}

const F5E_SEASON_CONCURRENCY = 6;
const F5E_SEASON_SCAN_CAP = 12;

const F5E_SEASON_HIST_TTL = 7 * 24 * 3600e3;
const F5E_SEASON_CUR_TTL = 30 * 60000;

async function fetchF5eStats(steamId, domain, token, phase2Callback, opts) {
    if (!steamId && !domain) return { error: 'NO_STEAMID' };
    const H = f5eHeaders(token);

    const resolved = domain
        ? await (async () => {
            const tRes = await f5eRequest(F5E_ID_TRANSFER_API, { method: 'POST', headers: H, body: JSON.stringify({ trans: { domain } }) });
            const uuid = tRes && tRes.data && tRes.data.uuid ? String(tRes.data.uuid) : '';
            if (!uuid) return { error: 'RESOLVE_FAILED' };
            const v = { uuid, domain, username: '', avatar: '' };
            if (steamId) f5eResolveL2Set(String(steamId), v);   
            return v;
        })()
        : await f5eResolveUuid(String(steamId), token);
    if (resolved.error || !resolved.uuid) return { error: resolved.error || 'RESOLVE_FAILED' };

    fetchF5eBanRoster().catch(() => {});
    fetchF5eSeasonList(token).catch(() => {});
    const enc = encodeURIComponent(resolved.uuid);
    
    let curSeasonGuess = '';
    try {
        const cal = await cacheGet(CACHE_KEY_PREFIX + 'f5ecal_v1');
        if (cal && Array.isArray(cal.data) && cal.data.length) {
            const cur = cal.data.find(( r) => r.current) || cal.data[0];
            if (cur && cur.season) curSeasonGuess = String(cur.season);
        }
    } catch (e0) {}
    const [homeRaw, matchRaw, roster, reddotRaw, advGuess] = await Promise.all([
        f5eRequest(F5E_PLAYER_HOME_API + '?uuid=' + enc, { headers: H }),
        fetchF5eMatchPage(resolved.uuid, token, 0, 0, 1),
        fetchF5eBanRoster(),   

        f5eRequest(F5E_REDDOT_PLAYER_API + '?uuid=' + enc, { headers: f5eHeaders(token) }),

        curSeasonGuess ? fetchF5eAdvanced(resolved.uuid, token, curSeasonGuess) : null
    ]);
    const home = normalizeF5eHome(homeRaw);
    if (!home) return { error: 'NETWORK_ERROR' };   
    const actualCurSeason = home.currentSeason || curSeasonGuess || '';
    const advanced = (advGuess && curSeasonGuess === actualCurSeason)
        ? advGuess
        : await fetchF5eAdvanced(resolved.uuid, token, actualCurSeason);

    const rdUser = reddotRaw && reddotRaw.code === 0 && reddotRaw.data && reddotRaw.data.data ? reddotRaw.data.data.user : null;
    const homeData = homeRaw && homeRaw.code === 0 && homeRaw.data ? homeRaw.data : null;
    const careerObj = homeData ? homeData.career : null;
    const mode9Obj = (homeData && homeData.elo_info && homeData.elo_info.modes) ? homeData.elo_info.modes['9'] : null;
    let ban = synthesizeF5eBan({
        roster: Array.isArray(roster) ? roster : null,
        uuid: resolved.uuid, domain: resolved.domain,
        statusBan: home.ban, career: careerObj, mode9: mode9Obj,
        accountStatus: rdUser ? rdUser.account_status : undefined
    });

    ban = await f5eEnhanceBan(ban, resolved.uuid);

    const overview = {
        success: true,
        phase2: true,
        steamId: String(steamId || ''),
        domain: resolved.domain || home.domain,
        uuid: resolved.uuid,
        username: home.username,
        avatar: home.avatar,
        credit: home.credit,
        elo: home.elo,
        levelId: home.levelId,
        starNum: home.starNum,
        levelType: home.levelType,
        starElo: home.starElo,
        rank: home.rank,
        unranked: home.unranked === true,   
        peakSeason: home.peakSeason || '',   
        peakElo: home.peakElo,
        peakLevelId: home.peakLevelId,
        peakStarNum: home.peakStarNum,
        shape: F5E_OVERVIEW_SHAPE,   
        seasonKd: home.seasonKd,   
        matchTotal: home.matchTotal,
        matchWin: home.matchWin,
        matchLoss: home.matchLoss,
        matchTie: home.matchTie,
        eloSeq: home.eloSeq,
        ban,
        advanced: advanced || null,   
        matches: matchRaw,   
        seasonList: [],
        currentSeason: home.currentSeason || ''
    };

    (async () => {
        try {
            const cal = await fetchF5eSeasonList(token);
            const rows = cal.slice(0, F5E_SEASON_SCAN_CAP);
            
            const results = {};
            let nextIdx = 0;
            const worker = async () => {
                while (nextIdx < rows.length) {
                    const row = rows[nextIdx++];

                    try {
                        const fresh = row.current ? F5E_SEASON_CUR_TTL : F5E_SEASON_HIST_TTL;

                        const cd = await cacheGetVersioned(CACHE_KEY_PREFIX + 'f5es9_' + resolved.uuid + '_' + row.season,
                            F5E_SEASON_SHAPE, { ttl: fresh, valid: ( d) => !!(d && d.success && !d.error && Array.isArray(d.recentMatches)) });
                        if (cd) {
                            results[row.season] = cd;
                            continue;   
                        }
                    } catch (e0) {  }
                    const det = await fetchF5eSeasonData('', row.season, resolved.uuid, token, row.beginUnix, row.endUnix);
                    if (det && det.success) {
                        results[row.season] = det;
                        if (opts && typeof opts.seasonCacheWrite === 'function') {
                            try { opts.seasonCacheWrite(String(resolved.uuid), row.season, det, row.current ? F5E_SEASON_CUR_TTL : F5E_SEASON_HIST_TTL); } catch (e0) {  }
                        }
                    }
                }
            };
            await Promise.all(Array.from({ length: Math.min(F5E_SEASON_CONCURRENCY, rows.length) }, () => worker()));

            const currentRow = rows.find(( r) => r.current) || rows[0] || null;
            const currentId = currentRow ? currentRow.season : '';

            const seasonList = [];
            for (const r of rows) {
                const det = results[r.season];
                const hasData = !!(det && det.matches > 0);
                if (!hasData && r.season !== currentId) continue;
                seasonList.push({
                    season: r.season,
                    beginUnix: r.beginUnix,
                    endUnix: r.endUnix,
                    current: r.season === currentId,
                    matches: det ? det.matches : 0,
                    wins: det ? det.wins : 0,
                    losses: det ? det.losses : 0,
                    elo: det ? det.elo : 0,
                    rank: det ? det.rank : 0,
                    levelId: det ? det.levelId : 0,
                    levelType: det ? det.levelType : 0,
                    starNum: det ? det.starNum : 0   
                });
            }
            const maxElo = seasonList.reduce(( acc,  s) => (s.elo > acc ? s.elo : acc), 0);
            if (typeof phase2Callback === 'function') {
                phase2Callback({
                    steamId: String(steamId || ''),
                    uuid: resolved.uuid,          
                    username: overview.username,
                    avatar: overview.avatar,
                    credit: overview.credit,
                    elo: overview.elo,
                    seasonList,
                    currentSeason: currentId,
                    maxElo,

                    matches: overview.matches,
                    advanced: overview.advanced,   
                    ban,
                    domain: overview.domain,
                    matchTotal: overview.matchTotal,
                    matchWin: overview.matchWin,
                    matchLoss: overview.matchLoss,
                    matchTie: overview.matchTie,
                    eloSeq: overview.eloSeq,
                    levelId: overview.levelId,
                    starNum: overview.starNum,
                    levelType: overview.levelType,
                    starElo: overview.starElo,
                    rank: overview.rank,
                    unranked: overview.unranked === true,
                    peakSeason: overview.peakSeason || '',
                    peakElo: overview.peakElo,
                    peakLevelId: overview.peakLevelId,
                    peakStarNum: overview.peakStarNum,
                    shape: F5E_OVERVIEW_SHAPE,
                    seasonKd: overview.seasonKd,   
                    phase2: false
                });
            }
        } catch (e) {
            if (typeof phase2Callback === 'function') phase2Callback({ steamId: String(steamId || ''), error: 'PHASE2_FAILED' });
        }
    })();

    return overview;
}

async function fetchF5eStatsWithToken(steamId, domain, phase2Callback, opts) {
    const token = await f5eReadToken();
    return fetchF5eStats(steamId, domain, token || undefined, phase2Callback, opts);
}

const _f5eBanInflight = new Map();

const _f5eRosterInflight = new Map();

async function fetchF5eBanRoster() {
    const cacheKey = CACHE_KEY_PREFIX + 'f5er_roster';
    const TTL = 10 * 60000;
    try {
        const e = await cacheGet(cacheKey);
        if (e && e.data && Array.isArray(e.data.items) && Date.now() - e.ts < TTL) return e.data.items;
    } catch (e) {  }
    const inf = _f5eRosterInflight.get('roster');
    if (inf) return inf;
    const p = f5eRequest(F5E_BANNED_USER_API, { headers: { 'Accept': '*/*' } }).then(( raw) => {
        const items = raw && raw.data && Array.isArray(raw.data.items) ? raw.data.items : null;
        if (!items) return { error: 'NETWORK_ERROR' };   
        const op = (typeof cacheBeginOp === 'function') ? cacheBeginOp() : undefined;
        cacheSet(cacheKey, { data: { items } }, op !== undefined ? { epoch: op } : undefined);
        return items;
    }).finally(() => _f5eRosterInflight.delete('roster'));
    _f5eRosterInflight.set('roster', p);
    return p;
}

const F5E_MD5_EMPTY_JSON = 'XrY7u+Ae7tByyK+F7+Mmfw==';   
const F5E_GATE_LIST_API = __S_background_5e_js(9);

const F5E_EV_PAGE_SIZE = 50;
const F5E_EV_MAX_PAGES = 3;
const F5E_PLATFORM_UINFO_API = 'https://platform-api.5eplay.com/api/user/info';
const _f5eJwtMem = { v: '', ts: 0 };
const _f5eEvInflight = { p: null };

const F5E_JWT_COOKIE_NAMES = [__S_background_5e_js(10), __S_background_5e_js(11)];
const F5E_JWT_VALUE_RE = /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const F5E_SCAN_URL = 'https://arena.5eplay.com/';

const _f5eCookieApiErr = { last: '' };

function f5eCookieGetAll(q) {
    return new Promise(( res) => {
        try {
            chrome.cookies.getAll(q, ( c) => {
                if (chrome.runtime.lastError) { _f5eCookieApiErr.last = String(chrome.runtime.lastError.message || chrome.runtime.lastError); res([]); return; }
                _f5eCookieApiErr.last = '';
                res(c || []);
            });
        } catch (e) { _f5eCookieApiErr.last = String((e && e.message) || e); res([]); }
    });
}

function f5eCookieValDecode(v) {
    const s = String(v || '').trim();
    if (!s || !/%[0-9a-fA-F]{2}/.test(s)) return s;
    try { return decodeURIComponent(s); } catch (e) { return s; }
}

function f5ePickJwtCookie(cookies) {
    const list = cookies || [];
    for (const name of F5E_JWT_COOKIE_NAMES) {
        const hit = list.find(( c) => c && c.name === name && c.value);
        if (hit) return f5eCookieValDecode(hit.value);
    }
    const jwts = list.filter(( c) => c && F5E_JWT_VALUE_RE.test(String(c.value || '').trim()));
    jwts.sort(( a,  b) => {
        const auth = ( c) => (/token|auth|jwt|access/i.test(String(c.name || '')) ? 1 : 0);
        return auth(b) - auth(a) || String(b.value).length - String(a.value).length;
    });
    return jwts.length ? String(jwts[0].value).trim() : '';
}

async function f5eScanJwtDetailed() {
    if (typeof chrome === 'undefined' || !chrome.cookies || !chrome.cookies.getAll) {
        return { jwt: '', total: -1, known: [], jwtShaped: 0, partitioned: 0, lastErr: 'no cookies API', all: -1, ctrl: -1 };
    }
    const [urlPart, urlPlain, domPart, domPlain, rawAll, ctrlDom] = await Promise.all([
        f5eCookieGetAll({ url: F5E_SCAN_URL, partitionKey: {} }),   
        f5eCookieGetAll({ url: F5E_SCAN_URL }),                     
        f5eCookieGetAll({ domain: '5eplay.com', partitionKey: {} }),
        f5eCookieGetAll({ domain: '5eplay.com' }),                  
        f5eCookieGetAll({}),                                        
        f5eCookieGetAll({ domain: 'steamcommunity.com' })           
    ]);
    const seen = new Set();
    const merged = [];

    const fromAll = rawAll.filter(( c) => c && /(^|\.)5eplay\.com$/i.test(String(c.domain || '').replace(/^\./, '')));
    for (const c of urlPart.concat(urlPlain, domPart, domPlain, fromAll)) {
        const pk = c && c.partitionKey && c.partitionKey.topLevelSite ? String(c.partitionKey.topLevelSite) : '';
        const k = pk + '|' + String(c && c.name) + '=' + String(c && c.value);
        if (seen.has(k)) continue;
        seen.add(k); merged.push(c);
    }
    const known = F5E_JWT_COOKIE_NAMES.filter(( n) => merged.some(( c) => c && c.name === n && c.value));
    const jwtShaped = merged.filter(( c) => c && F5E_JWT_VALUE_RE.test(String(c.value || '').trim())).length;
    const partitioned = merged.filter(( c) => c && c.partitionKey && c.partitionKey.topLevelSite).length;
    return { jwt: f5ePickJwtCookie(merged), total: merged.length, known, jwtShaped, partitioned, lastErr: _f5eCookieApiErr.last,
        all: rawAll.length, ctrl: ctrlDom.length };
}

async function f5eScanJwtCookie() {
    const r = await f5eScanJwtDetailed();

    const sig = r.total + '|' + (r.jwt ? 'hit' : 'miss') + '|' + r.known.join(',') + '|' + r.jwtShaped;
    if (typeof addLog === 'function' && (sig !== _f5eScanLog.sig || Date.now() - _f5eScanLog.ts > 60000)) {
        _f5eScanLog.sig = sig; _f5eScanLog.ts = Date.now();
        try {
            addLog('[5E] cookie 扫描: cookies=' + r.total + ' 已知名=[' + r.known.join(',') + '] JWT形状=' +
                r.jwtShaped + ' 分区=' + r.partitioned + ' → ' + (r.jwt ? '命中(len=' + r.jwt.length + ')' : '未命中'));
        } catch (e0) {  }
    }
    return r.jwt;
}
const _f5eScanLog = { sig: '', ts: 0 };

async function f5eGetJwt() {
    
    if (_f5eJwtMem.v && Date.now() - _f5eJwtMem.ts < 300000 && !f5eJwtExpired(_f5eJwtMem.v)) return _f5eJwtMem.v;
    const jwt = await f5eScanJwtCookie();
    if (jwt && !f5eJwtExpired(jwt)) { _f5eJwtMem.v = jwt; _f5eJwtMem.ts = Date.now(); return jwt; }

    try { return await f5eReadToken(); } catch (e) { return ''; }
}

const F5E_BEARER_HDR_RE = /^Bearer\s+(ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\s*$/i;
const F5E_SETCOOKIE_JWT_RE = new RegExp(__S_background_5e_js(12), 'i');
const F5E_JWT_ANY_RE = /\b(ey[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/;
let _f5eBearerSaved = '';
const _f5eCapStats = { bearer: 0, setCookie: 0 };

const _f5eCapturePings = { n: 0, last: 0, censuses: [], pageHook: 0 };
function f5eCapturePing(census) {
    _f5eCapturePings.n++; _f5eCapturePings.last = Date.now();
    if (census && typeof census === 'object') {
        _f5eCapturePings.censuses.push({ t: Date.now(), ck: census.ck | 0, names: Array.isArray(census.names) ? census.names.slice(0, 8) : [], ls: census.ls | 0, ss: census.ss | 0 });
        if (_f5eCapturePings.censuses.length > 5) _f5eCapturePings.censuses.shift();
    }
}
function f5eCapturePingStats() { return { n: _f5eCapturePings.n, last: _f5eCapturePings.last, censuses: _f5eCapturePings.censuses.slice(), pageHook: _f5eCapturePings.pageHook | 0 }; }

function f5ePageHookHit() { _f5eCapturePings.pageHook = (_f5eCapturePings.pageHook | 0) + 1; }

function f5eSaveCapturedJwt(jwt, via) {
    if (!jwt || jwt === _f5eBearerSaved) return;
    _f5eBearerSaved = jwt;
    try {

        f5eStoreTokenIfChanged(jwt).then(( wrote) => {
            if (wrote && typeof addLog === 'function') { try { addLog('[5E] jwt captured via ' + via + ' (len=' + jwt.length + ')'); } catch (e1) {  } }
        }).catch(() => {});
    } catch (e0) {  }
}

try {
    if (typeof chrome !== 'undefined' && chrome.webRequest && chrome.webRequest.onSendHeaders) {

        chrome.webRequest.onSendHeaders.addListener(( details) => {
            try {
                const hs = (details && details.requestHeaders) || [];
                for (const h of hs) {
                    if (String((h && h.name) || '').toLowerCase() !== 'authorization') continue;
                    const m = F5E_BEARER_HDR_RE.exec(String((h && h.value) || ''));
                    if (!m) continue;
                    _f5eCapStats.bearer++;
                    f5eSaveCapturedJwt(m[1], 'request Authorization header');
                    return;
                }
            } catch (e0) {  }
        }, { urls: ['https://*.5eplay.com/*'] }, ['requestHeaders', 'extraHeaders']);
    }
} catch (e0) {  }

try {
    if (typeof chrome !== 'undefined' && chrome.webRequest && chrome.webRequest.onHeadersReceived) {

        chrome.webRequest.onHeadersReceived.addListener( (( details) => {
            try {
                const hs = (details && details.responseHeaders) || [];
                for (const h of hs) {
                    if (String((h && h.name) || '').toLowerCase() !== 'set-cookie') continue;
                    const v = String((h && h.value) || '');
                    const m = F5E_SETCOOKIE_JWT_RE.exec(v) || F5E_JWT_ANY_RE.exec(v);
                    if (!m) continue;
                    _f5eCapStats.setCookie++;
                    f5eSaveCapturedJwt(m[1], 'Set-Cookie response header');
                    return;
                }
            } catch (e0) {  }
        }), { urls: ['https://*.5eplay.com/*'] }, ['responseHeaders', 'extraHeaders']);
    }
} catch (e0) {  }

function f5eCaptureStats() { return { bearer: _f5eCapStats.bearer, setCookie: _f5eCapStats.setCookie }; }

function f5eSignString(method, url, bodyStr, jwt) {
    const u = new URL(url);
    const q = Array.from(u.searchParams.entries()).sort(( a,  b) => (a[0] < b[0] ? -1 : 1));
    const pp = u.pathname + (q.length ? '?' + q.map(( kv) => kv[0] + '=' + kv[1]).join('&') : '');
    const m = String(method || 'GET').toUpperCase();
    const hasBody = m !== 'GET' && m !== 'DELETE' && bodyStr;
    const cmd5 = hasBody ? F5E_MD5_EMPTY_JSON : '';   
    const ctype = m !== 'GET' && m !== 'DELETE' ? 'application/json' : '';
    const hl = 'accept-language:zh-cn\nauthorization:' + (jwt ? 'Bearer ' + jwt : '');   
    return [m, '*/*', cmd5, ctype, '', hl, pp].join('\n');
}

var _f5eWbHmac = (function() {
    const K = [1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];
    const _F5E_WB_H_IN = [350320250,3462232583,142758614,3825792905,4265092710,415975882,1210457945,1794251232];
    const _F5E_WB_H_OUT = [459983843,872364735,803622908,2960151732,781728089,696880518,1027836616,1476841001];

    function sha256Compress(state, block) {
    const w = new Uint32Array(64);
    for (let i = 0; i < 16; i++) {
        w[i] = (block[i * 4] << 24) | (block[i * 4 + 1] << 16) | (block[i * 4 + 2] << 8) | block[i * 4 + 3];
    }
    for (let i = 16; i < 64; i++) {
        const s0 = ((w[i - 15] >>> 7) | (w[i - 15] << 25)) ^ ((w[i - 15] >>> 18) | (w[i - 15] << 14)) ^ (w[i - 15] >>> 3);
        const s1 = ((w[i - 2] >>> 17) | (w[i - 2] << 15)) ^ ((w[i - 2] >>> 19) | (w[i - 2] << 13)) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = state[0], b = state[1], c = state[2], d = state[3];
    let e = state[4], f = state[5], g = state[6], h = state[7];
    for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ ((~e) & g);
        const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0;
        d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    return [
        (state[0] + a) >>> 0, (state[1] + b) >>> 0, (state[2] + c) >>> 0, (state[3] + d) >>> 0,
        (state[4] + e) >>> 0, (state[5] + f) >>> 0, (state[6] + g) >>> 0, (state[7] + h) >>> 0
    ];
}

    return function(input) {
        const bytes = new TextEncoder().encode(String(input));
        const len = bytes.length;
        const totalBits = (64 + len) * 8;
        const total = (((len + 8) >> 6) + 1) << 6;
        const buf = new Uint8Array(total);
        buf.set(bytes);
        buf[len] = 0x80;
        const dv = new DataView(buf.buffer);
        dv.setUint32(total - 8, Math.floor(totalBits / 0x100000000), false);
        dv.setUint32(total - 4, totalBits >>> 0, false);

        let state = _F5E_WB_H_IN;
        for (let offset = 0; offset < total; offset += 64) {
            state = sha256Compress(state, buf.subarray(offset, offset + 64));
        }

        const innerDigest = new Uint8Array(32);
        const dvInner = new DataView(innerDigest.buffer);
        for (let i = 0; i < 8; i++) dvInner.setUint32(i * 4, state[i], false);

        const outerBuf = new Uint8Array(64);
        outerBuf.set(innerDigest);
        outerBuf[32] = 0x80;
        const dvOuter = new DataView(outerBuf.buffer);
        dvOuter.setUint32(56, 0, false);
        dvOuter.setUint32(60, 768, false);

        const outerState = sha256Compress(_F5E_WB_H_OUT, outerBuf);
        let bin = '';
        for (let i = 0; i < 8; i++) {
            const v = outerState[i];
            bin += String.fromCharCode((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
        }
        return btoa(bin);
    };
})();
async function f5eSignedHeaders(method, url, bodyStr, jwt) {
    const m = String(method || 'GET').toUpperCase();
    const sts = f5eSignString(m, url, bodyStr, jwt);
    const sig = _f5eWbHmac(sts);
    const headers = { 'Accept-Language': 'zh-cn', 'Accept': '*/*', 'authorization': jwt ? 'Bearer ' + jwt : '',
        [__S_background_5e_js(5)]: 'Accept-Language,authorization', [__S_background_5e_js(3)]: '5eplay',
        [__S_background_5e_js(6)]: __S_background_5e_js(7), [__S_background_5e_js(4)]: sig };
    if (m !== 'GET' && m !== 'DELETE') { headers['Content-Type'] = 'application/json'; headers[__S_background_5e_js(13)] = bodyStr ? F5E_MD5_EMPTY_JSON : ''; }
    return headers;
}

async function f5eGateFetch(url, method) {
    const jwt = await f5eGetJwt();
    if (!jwt) return null;
    const m = String(method || 'GET').toUpperCase();
    const bodyStr = m === 'POST' ? '{}' : undefined;
    const headers = await f5eSignedHeaders(m, url, bodyStr, jwt);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
        const r = await fetch(url, { method: m, headers, cache: 'no-store', body: bodyStr, signal: controller.signal });
        if (!r.ok) return null;
        return await r.json();
    } catch (e) { return null; }
    finally { clearTimeout(timer); }
}

const F5E_EV_SHAPE = 3;

async function f5eFetchBanEvents() {
    if (_f5eEvInflight.p) return _f5eEvInflight.p;
    const p = (async () => {
        const cacheKey = CACHE_KEY_PREFIX + 'f5e_ev';
        try {
            const e = await cacheGet(cacheKey);
            if (e && e.data && e.data.byUuid && e.data.v === F5E_EV_SHAPE && Date.now() - e.ts < 6 * 3600 * 1000) return e.data;
        } catch (e) {  }

        const pages = await Promise.all(Array.from({ length: F5E_EV_MAX_PAGES }, (_, i) =>
            f5eGateFetch(F5E_GATE_LIST_API + '?page=' + (i + 1) + '&size=' + F5E_EV_PAGE_SIZE, 'GET')));
        const seen = new Set();
        
        const list = [];
        for (const raw of pages) {
            const rows = raw && raw.status === true && raw.data && Array.isArray(raw.data.list) ? raw.data.list : [];
            for (const it of rows) {
                if (!it) continue;
                const dk = String(it.uuid || '') + '|' + String(it.banTime || '') + '|' + String(it.banType || '');
                if (seen.has(dk)) continue;
                seen.add(dk);
                list.push(it);
            }
        }
        if (!list.length) {

            const raw = await f5eGateFetch(F5E_GATE_LIST_API + '?page=1&size=20', 'GET');
            const rows = raw && raw.status === true && raw.data && Array.isArray(raw.data.list) ? raw.data.list : [];
            for (const it of rows) {
                if (!it) continue;
                const dk = String(it.uuid || '') + '|' + String(it.banTime || '') + '|' + String(it.banType || '');
                if (seen.has(dk)) continue;
                seen.add(dk);
                list.push(it);
            }
        }
        if (!list.length) return null;
        const byUuid = {};
        for (const it of list) {
            const uu = String(it.uuid || '');
            if (!uu) continue;
            const start = f5eNum(it.banTime);

            const rawDays = parseInt(String(it.banDay), 10);
            const days = isNaN(rawDays) ? -1 : rawDays;
            const rec = {
                banName: String(it.banName || ''), banType: f5eNum(it.banType),
                banReason: String(it.banReason || ''),
                start: start > 0 ? start : 0,
                end: (start > 0 && days > 0) ? start + days * 86400 : 0,   
                days,   
                matchCode: String(it.matchCode || ''), matchStart: f5eNum(it.matchStartTime),
                mapName: String(it.mapName || ''), groupType: f5eNum(it.groupType)
            };

            const prev = byUuid[uu];
            if (!prev) { byUuid[uu] = rec; rec.list = [rec]; continue; }
            if (rec.start >= prev.start) {
                byUuid[uu] = rec;
                rec.list = [rec].concat(prev.list || [prev]);
            } else {
                const merged = [rec].concat(prev.list || [prev]);
                merged.sort(( a,  b) => b.start - a.start);   
                prev.list = merged;
            }
        }
        const data = { byUuid, fetchedAt: Date.now(), v: F5E_EV_SHAPE };
        const op = (typeof cacheBeginOp === 'function') ? cacheBeginOp() : undefined;
        if (typeof cacheSet === 'function') cacheSet(cacheKey, { data }, op !== undefined ? { epoch: op } : undefined);
        return data;
    })().finally(() => { _f5eEvInflight.p = null; });
    _f5eEvInflight.p = p;
    return p;
}

async function f5eUuidInfo(uuid) {
    const jwt = await f5eGetJwt();
    if (!jwt || !uuid) return null;
    const cacheKey = CACHE_KEY_PREFIX + 'f5e_ui_' + uuid;
    try {
        const e = await cacheGet(cacheKey);
        if (e && e.data && e.data.acct !== undefined && Date.now() - e.ts < 30 * 60000) return e.data;
    } catch (e) {  }
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);   
        let r;
        try {
            r = await fetch(F5E_PLATFORM_UINFO_API, {
                method: 'POST', cache: 'no-store', signal: controller.signal,
                headers: { 'Accept': '*/*', 'authorization': 'Bearer ' + jwt, 'Content-Type': 'application/json' },
                body: JSON.stringify({ uuids: [uuid] })
            });
        } finally { clearTimeout(timer); }
        if (!r.ok) return null;
        const j = await r.json();
        const d = j && j.code === 0 && j.data ? j.data[uuid] : null;
        if (!d) return null;
        const data = { acct: f5eNum(d.account_status), loginBannedUntil: f5eNum(d.login_banned_time), creditScore: f5eNum(d.credit_score) };
        const op = (typeof cacheBeginOp === 'function') ? cacheBeginOp() : undefined;
        if (typeof cacheSet === 'function') cacheSet(cacheKey, { data }, op !== undefined ? { epoch: op } : undefined);
        return data;
    } catch (e) { return null; }
}

async function f5eEnhanceBan(ban, uuid) {
    if (!ban || !ban.success || !uuid) return ban;
    let enh = true;
    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync && chrome.storage.sync.get) {
            const ss = await new Promise(( res) => chrome.storage.sync.get({ sps_f5e_enh: true }, ( v) => res(v)));
            enh = ss.sps_f5e_enh !== false;
        }
    } catch (e) {  }
    if (!enh) return ban;
    const jwt = await f5eGetJwt();
    if (!jwt) return ban;   
    const nowSec = Date.now() / 1000;
    const results = await Promise.all([f5eFetchBanEvents(), f5eUuidInfo(uuid)]);
    const out = Object.assign({}, ban);
    let changed = false;
    const events = results[0];
    const ev = events && events.byUuid ? events.byUuid[String(uuid)] : null;
    if (ev) {
        out.ev = ev;

        out.evList = Array.isArray(ev.list) && ev.list.length > 1 ? ev.list : undefined;
        out.evActive = !ev.end || ev.end > nowSec;   
        const k = f5eKindFromBanType(ev.banType);

        if (k && out.evActive && (!out.kind || out.kind === 'roster')) out.kind = k;
        changed = true;
    }
    const ui = results[1];
    if (ui) {
        out.uuidInfo = { acct: ui.acct, loginBannedUntil: ui.loginBannedUntil, creditScore: ui.creditScore };
        if (ui.loginBannedUntil > nowSec && (!out.kind || out.kind === 'roster')) {
            out.kind = 'roster';                 
            out.limitUntil = ui.loginBannedUntil;
            out.loginRestricted = true;
            changed = true;
        }
        const rd = normalizeF5eAccountStatus(ui.acct);
        if (rd.kind && (!out.kind || out.kind === 'roster')) { out.kind = rd.kind; changed = true; }   
        
        if (rd.kind && out.served) { out.served = false; changed = true; }
    }
    if (changed) {
        const evActive = !!(out.ev && out.evActive);
        const wasServed = out.served === true;   
        out.banned = (!!out.kind || evActive) && !wasServed;   
        out.temp = !!out.temp || (!!(out.limitUntil && out.limitUntil > nowSec));
        out.active = out.banned || out.temp || evActive;
        if (out.ev && !wasServed) out.served = !evActive && !out.banned && !out.temp;   
    }
    out.enhanced = true;   
    return out;
}

function f5eResetJwtCache() { _f5eJwtMem.v = ''; _f5eJwtMem.ts = 0; }

async function fetchF5eBanShared(steamId, cacheTTL) {
    if (!steamId) return { error: 'NO_STEAMID' };
    const ttl = cacheTTL || 5 * 60000;
    const cacheKey = CACHE_KEY_PREFIX + 'f5eb_' + steamId;
    const op = (typeof cacheBeginOp === 'function') ? cacheBeginOp() : undefined;

    try {
        const e = await cacheGetVersioned(cacheKey, F5E_BAN_SHAPE, { ttl });
        if (e && e.success) return e;
    } catch (e) {  }
    const inflight = _f5eBanInflight.get(steamId);
    if (inflight) return inflight;
    const _enhUuid = { v: '' };
    const p = (async () => {
        const token = await f5eReadToken();
        
        const resolved = await f5eResolveUuid(String(steamId), token || undefined);
        if (resolved.error || !resolved.uuid) return { error: resolved.error || 'RESOLVE_FAILED' };
        _enhUuid.v = resolved.uuid;
        
        const results = await Promise.all([
            fetchF5eBanRoster(),
            f5eRequest(F5E_PLAYER_HOME_API + '?uuid=' + encodeURIComponent(resolved.uuid), { headers: f5eHeaders(token || undefined) }),
            f5eRequest(F5E_REDDOT_PLAYER_API + '?uuid=' + encodeURIComponent(resolved.uuid), { headers: { 'Accept': '*/*' } })
        ]);
        const homeRaw = results[1];
        const home = normalizeF5eHome(homeRaw);

        const rdUser = results[2] && results[2].code === 0 && results[2].data && results[2].data.data ? results[2].data.data.user : null;
        const homeData = homeRaw && homeRaw.code === 0 && homeRaw.data ? homeRaw.data : null;
        const careerObj = homeData ? homeData.career : null;
        const mode9Obj = (homeData && homeData.elo_info && homeData.elo_info.modes) ? homeData.elo_info.modes['9'] : null;
        const ban = synthesizeF5eBan({
            roster: Array.isArray(results[0]) ? results[0] : null,
            uuid: resolved.uuid, domain: resolved.domain,
            statusBan: home ? home.ban : null, career: careerObj, mode9: mode9Obj,
            accountStatus: rdUser ? rdUser.account_status : undefined
        });
        return ban || { error: 'NETWORK_ERROR' };
    })().then(async ( data) => {
        if (data && data.success) data = await f5eEnhanceBan(data, _enhUuid.v);   
        if (data && data.success && typeof cacheSetVersioned === 'function') {
            cacheSetVersioned(cacheKey, data, F5E_BAN_SHAPE, op !== undefined ? { epoch: op } : undefined);
        } else if (data && data.success && typeof cacheSet === 'function') {
            cacheSet(cacheKey, { data }, op !== undefined ? { epoch: op } : undefined);   
        }
        return data;
    }).finally(() => _f5eBanInflight.delete(steamId));
    _f5eBanInflight.set(steamId, p);
    return p;
}
