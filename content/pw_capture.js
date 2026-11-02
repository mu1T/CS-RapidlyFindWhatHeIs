

(function () {
    'use strict';
    const TOKEN_MIN = 8, TOKEN_MAX = 1024;
    const URL_TOKEN_RE = /(?:^|[?&#])(token|access_token|accesstoken|steam_cn_token)=([^&#]+)/i;

    const TOKEN_CHARS_RE = /^[A-Za-z0-9._~+/=-]{16,512}$/;
    const TOKEN_URLISH_RE = /(:\/\/|\.(?:com|cn|net|org|io|html?|js|json|png|jpe?g|gif|svg|css|woff2?|map)$)/i;
    const SKIP_NAME_RE = /ey[A-Za-z0-9_-]+\.|:/;   
    const STORE_KEY_RE = /token/i;

    const STORE_KEY_SKIP_RE = /(expire|expiry|expired|time|count|flag)$/i;
    
    const NAME_RE = /^[A-Za-z0-9_.\-\[\]]{1,24}$/;
    const POLL_MS = 1000, POLL_WINDOW_MS = 600000, PING_MAX = 20;

    function pwCleanToken(v) {
        let t = String(v == null ? '' : v).trim();
        if (!t) return '';
        try { t = decodeURIComponent(t).trim(); } catch (e0) {  }
        if (!t || t.length < TOKEN_MIN || t.length > TOKEN_MAX) return '';
        if (/[\s<>"'\\]/.test(t)) return '';                       
        if (/^(null|undefined|none|false|true|0)$/i.test(t)) return '';
        return t;
    }

    function pwLooksLikeToken(v) {
        const s = String(v == null ? '' : v).trim().replace(/^bearer\s+/i, '').trim();
        if (!TOKEN_CHARS_RE.test(s)) return '';
        if (!/[A-Za-z]/.test(s)) return '';          
        if (TOKEN_URLISH_RE.test(s)) return '';      
        return s;
    }

    function pwFingerprint(v) {
        const s = String(v == null ? '' : v);
        if (!s) return 'empty';
        const cls = /^[0-9a-f]+$/i.test(s) ? 'hex' : (/^[A-Za-z0-9_-]+$/.test(s) ? 'b64url' : (/^[A-Za-z0-9+/=]+$/.test(s) ? 'b64' : 'mixed'));
        return s.length + cls;
    }

    function pwCleanSteamId(v) {
        const s = String(v == null ? '' : v).replace(/\D/g, '');
        return /^7656119\d{10}$/.test(s) ? s : '';
    }

    function pwPickTokenFromUrl(href) {
        const s = String(href || '');
        if (!s) return '';
        const cut = s.indexOf('#');
        const parts = cut >= 0 ? [s.slice(cut + 1), s.slice(0, cut)] : [s];
        for (const part of parts) {
            const m = URL_TOKEN_RE.exec(part);
            if (!m) continue;
            const t = pwCleanToken(m[2]);
            if (t) return t;
        }
        return '';
    }

    function pwPickSteamIdFromUrl(href) {
        const s = String(href || '');
        const m = /(?:^|[?&#])(?:steam_?id|steamid64|steam_id64)=(\d{17})(?:[&#]|$)/i.exec(s);
        return m ? m[1] : '';
    }

    function pwScanStore() {
        const out = [];
        for (const store of [window.localStorage, window.sessionStorage]) {
            try {
                if (!store || !store.length) continue;
                for (let i = 0; i < store.length; i++) {
                    const k = String(store.key(i) || '');
                    if (!k || !STORE_KEY_RE.test(k) || STORE_KEY_SKIP_RE.test(k)) continue;
                    let v = String(store.getItem(k) || '');
                    if (v.charAt(0) === '{' || v.charAt(0) === '[') {   
                        const m = /"(?:token|access_?token|accesstoken|steam_cn_token)"\s*:\s*"([^"]{8,1024})"/i.exec(v);
                        if (!m) continue;
                        v = m[1];
                    }
                    if (/^\d+$/.test(v.trim())) continue;               
                    const t = pwCleanToken(v);
                    if (t && out.indexOf(t) < 0) out.push(t);
                }
            } catch (e1) {  }
        }
        return out;
    }

    function pwUrlShape() {
        const shape = { page: '', route: '', keys: [] };
        try {
            const loc = window.location;
            shape.page = String(loc.origin || '') + String(loc.pathname || '');
            const cut = String(loc.href || '').indexOf('#');
            const frag = cut >= 0 ? String(loc.href).slice(cut + 1) : '';
            const q = frag.indexOf('?');
            const route = (q >= 0 ? frag.slice(0, q) : frag).replace(/[^A-Za-z0-9_\-/.]/g, '').slice(0, 40);
            shape.route = route;
            const names = [];
            for (const part of [q >= 0 ? frag.slice(q + 1) : '', String(loc.search || '').replace(/^\?/, '')]) {
                if (!part) continue;
                for (const kv of part.split('&')) {
                    const i = kv.indexOf('=');
                    if (i <= 0) continue;
                    const n = kv.slice(0, i);
                    if (!NAME_RE.test(n) || SKIP_NAME_RE.test(n)) continue;   
                    if (names.indexOf(n) < 0) names.push(n);
                }
            }
            shape.keys = names.slice(0, 8);
        } catch (e0) {  }
        return shape;
    }

    let sent = '';
    let sentRank = 0;
    let timer = null;
    let lastShape = '';
    let pings = 0;
    const startedAt = Date.now();

    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function pwRankOf(source) {
        const s = String(source || 'url');
        if (s === 'url') return 3;
        if (s.indexOf('page_hook') === 0) return 2;
        return 1;
    }

    function pwReportToken(token, steamid, source) {
        const t = String(token || '');
        const src = String(source || 'url');
        if (!t || t === sent) return false;
        const rank = pwRankOf(src);
        if (sent && rank < sentRank) { pwPing('skip:' + pwFingerprint(t)); return false; }   
        sent = t;   
        sentRank = rank;
        try {
            chrome.runtime.sendMessage({ type: 'PW_TOKEN_CAPTURE', token: t, steamid: steamid || '', source: src },
                function () { void chrome.runtime.lastError; });
            return true;
        } catch (e0) { sent = ''; sentRank = 0; return false; }   
    }

    function pwPing(why) {
        if (pings >= PING_MAX) return;
        const shape = pwUrlShape();
        const sig = shape.page + '|' + shape.route + '|' + shape.keys.join(',');
        if (why.indexOf('skip') !== 0 && sig === lastShape) return;   
        lastShape = sig;
        pings++;
        try {
            chrome.runtime.sendMessage({ type: 'PW_CAPTURE_PING', page: shape.page, route: shape.route, keys: shape.keys, why: why || '' },
                function () { void chrome.runtime.lastError; });
        } catch (e1) {  }
    }

    function pwTryCapture() {
        const url = String(window.location.href || '');
        const t = pwPickTokenFromUrl(url);
        if (t) { pwReportToken(t, pwPickSteamIdFromUrl(url), 'url'); return; }
        if (sent) return;                                  
        const store = pwScanStore();
        if (store.length) { pwReportToken(store[0], '', 'storage'); return; }
        pwPing('route');   
    }

    try {
        window.addEventListener('message', function (ev) {
            if (ev.source !== window) return;
            const d = ev && ev.data;
            if (!d || d.__spsPwToken !== 1) return;
            const token = pwLooksLikeToken(d.token);
            const sid = pwCleanSteamId(d.steamid);
            const src = String(d.source || '').replace(/[^A-Za-z_]/g, '').slice(0, 16);   
            if (!token) {

                if (sid) {
                    try { chrome.runtime.sendMessage({ type: 'PW_STEAMID_HINT', steamid: sid, source: 'page_hook' }, function () { void chrome.runtime.lastError; }); }
                    catch (e7) {  }
                }
                return;
            }
            pwReportToken(token, sid, 'page_hook' + (src ? ':' + src : ''));
        });
    } catch (e6) {  }

    pwPing('load');
    pwTryCapture();
    try { window.addEventListener('hashchange', pwTryCapture); } catch (e2) {  }
    try { window.addEventListener('popstate', pwTryCapture); } catch (e3) {  }
    try { window.addEventListener('storage', pwTryCapture); } catch (e4) {  }
    
    try {
        const recheck = function () { pwTryCapture(); };
        window.addEventListener('DOMContentLoaded', recheck);
        window.addEventListener('load', recheck);
        window.addEventListener('pageshow', recheck);
        window.addEventListener('visibilitychange', recheck);   
    } catch (e5) {  }
    
    timer = setInterval(function () {
        if (sent || Date.now() - startedAt > POLL_WINDOW_MS) { stop(); return; }
        pwTryCapture();
    }, POLL_MS);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { pwPickTokenFromUrl: pwPickTokenFromUrl, pwCleanToken: pwCleanToken, pwPickSteamIdFromUrl: pwPickSteamIdFromUrl, pwUrlShape: pwUrlShape };
    }
})();
