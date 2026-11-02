

function f5eNum(v) { const n = parseFloat(v); return isFinite(n) ? n : 0; }

function f5eLadderWiped(c, mode9) {
    const cc = c || {};
    if (!(f5eNum(cc.match_total) > 0) || f5eNum(cc.elo) !== 0 || f5eNum(cc.rank) !== 0 || f5eNum(cc.level_id) !== 0) return false;
    const m9 = mode9 || null;
    if (!m9) return false;   
    return !((f5eNum(m9.rank) || 0) > 0);   
}

function normalizeF5eBan(st, career, mode9) {
    const s = st || {};
    const status = parseInt(String(s.status != null ? s.status : 0), 10) || 0;
    const anticheat = parseInt(String(s.anticheatType != null ? s.anticheatType : 0), 10) || 0;
    const loginBannedUntil = f5eNum(s.loginBannedTime);   
    const abs = Math.abs(status);
    let kind = '';
    if (abs === 4) kind = (anticheat === 2 ? 'assoc' : 'cheat');
    else if (abs === 9) kind = 'vac';
    else if (abs === 2) kind = 'risk';
    else if (abs === 6) kind = 'unlawful';
    else if (abs === 1) kind = 'malicious';
    const temp = status === 0 && loginBannedUntil > (Date.now() / 1000);   
    const ladderWiped = f5eLadderWiped(career, mode9);
    if (ladderWiped && kind === '') kind = 'roster';   
    const banned = kind !== '';   
    return {
        success: true,
        status, anticheat,
        kind,                       
        banned, temp, active: banned || temp,
        ladderWiped,
        loginBannedUntil,
        queriedAt: Date.now()
    };
}

function normalizeF5eAccountStatus(acct, career, mode9) {
    const status = parseInt(String(acct != null ? acct : 0), 10) || 0;
    const abs = Math.abs(status);
    let kind = '';
    if (abs === 4) kind = 'cheat';
    else if (abs === 9) kind = 'vac';
    else if (abs === 11) kind = 'roster';
    else if (abs === 2) kind = 'risk';
    else if (abs === 6) kind = 'unlawful';
    else if (abs === 1) kind = 'malicious';
    const ladderWiped = f5eLadderWiped(career, mode9);
    if (ladderWiped && kind === '') kind = 'roster';
    return {
        success: true,
        status, anticheat: 0,
        kind,
        banned: kind !== '', temp: false, active: kind !== '',
        source: 'reddot',          
        queriedAt: Date.now()
    };
}

function f5eKindFromBanName(name) {
    const s = String(name || '').trim();
    if (!s) return '';
    if (s.includes('作弊')) return 'cheat';
    if (s.includes('恶意')) return 'malicious';      
    if (s.includes('排位资格')) return 'roster';     
    if (/vac/i.test(s) || s.includes('游戏封禁')) return 'vac';
    return '';
}

function normalizeF5eRosterBan(it, ban) {
    void ban;   
    const keyRaw = (it.banTypeKey !== undefined && it.banTypeKey !== null && it.banTypeKey !== '') ? it.banTypeKey : it.banType;
    const key = parseInt(String(keyRaw), 10) || 0;
    const days = parseInt(String(it.banTime), 10) || 0;
    let kind = '';
    if (key === -4) kind = 'cheat';
    else if (key === -1) kind = 'malicious';
    else if (key === -11) kind = 'roster';   

    if (!kind) kind = f5eKindFromBanName(it.banName || it.banType);
    const banned = kind !== '';
    const active = banned;
    return {
        success: true,
        kind,
        banned,
        temp: false,
        active,
        served: false,   
        
        banType: String(it.banName || it.banType || ''),
        banReason: String(it.banReason || ''),
        banDays: days,
        queriedAt: Date.now()
    };
}

function f5eRosterHit(roster, uuid, domain) {
    if (!Array.isArray(roster)) return null;
    return roster.find(( it) => it && (it.uuid === uuid || (domain && it.domain === domain))) || null;
}

function f5eKindFromBanType(t) {
    const k = f5eNum(t);
    if (k === -4) return 'cheat';
    if (k === -9) return 'vac';
    if (k === -1) return 'malicious';
    if (k === -2) return 'risk';
    if (k === -6) return 'unlawful';
    if (k === -11) return 'roster';
    return '';
}

function synthesizeF5eBan(src) {
    const s = src || {};
    const hit = f5eRosterHit(s.roster, s.uuid, s.domain);
    let ban = hit ? normalizeF5eRosterBan(hit, s.statusBan) : (s.statusBan || null);
    if (ban && ban.success && (!ban.kind || ban.kind === 'roster')) {
        const rd = normalizeF5eAccountStatus(s.accountStatus, s.career, s.mode9);
        if (rd.kind && (rd.kind !== 'roster' || !ban.kind)) ban = rd;   
    }
    return ban;
}
