var __S_content_5e_page_hook_js=(function(){var T="Dd/ezK29rYWDZ2dJQlRVeAMWLKa2wtjD6Y/2xI1peEVDRi0jFRIa/eHK8IO9uYiVk3Z2R1JbOCs6TQvj8sPdvPi/kJ1vUXpdQSo7MwIT7eyoz+iwvrWOlixJPQtlNQ5KNkC6yQ7iipipmo94R0deSSwlFznu4f7zkpa4y4kwICN4GRw1Y0QI3qHH6JuZsfCQxykoQQZlPmpzESWoyOGA4Kb5m97WMUoPckdxeh4N8Ovf0KqgtpaYcnpPQwttZTgaG+XosMjXqAqCoaGyioErcXBBQFJbQ1IyKCg7B6qm/tHug+KGiNt5IDATaGkMdTdW3tOy9tjrqdDAw1g5fAVnZg4jQibou9mAkPOIyazVIkRWGBsFjZ1xcXcP+9PKuLGJgWl3e1NdLiB/",P=[115,14,210,199,187,173,0,281,275,100],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);
function __VQfetch(u,o){var f=__VG[__S_content_5e_page_hook_js(8)];return f.call(__VG,u,o)}
var __VQxhr=__VG[__S_content_5e_page_hook_js(9)];


(function () {
    'use strict';
    if (window.__sps5eHookInstalled) return;   
    window.__sps5eHookInstalled = true;

    var JWT_RE = new RegExp(__S_content_5e_page_hook_js(0));   
    var TOKEN_KEY_RE = new RegExp(__S_content_5e_page_hook_js(1), 'i');   
    var BEARER_RE = new RegExp(__S_content_5e_page_hook_js(2), 'i');

    function isF5eUrl(u) {
        try {
            const h = new URL(String(u || ''), location.href).hostname.toLowerCase();
            return h === __S_content_5e_page_hook_js(3) || h.endsWith(__S_content_5e_page_hook_js(4));
        } catch (e) { return false; }
    }

    var SELF_ORIGIN = (function () {
        try { var o = location.origin; return (o && o !== 'null') ? o : '*'; } catch (e0) { return '*'; }
    })();

    function send(tok) {
        try { window.postMessage({ __sps5eToken: 1, token: tok }, SELF_ORIGIN); } catch (e) {  }
    }

    function scanText(txt) {
        if (!txt || typeof txt !== 'string' || txt.length > 2e6 || txt.indexOf('ey') < 0) return;
        const m = JWT_RE.exec(txt);
        if (m && TOKEN_KEY_RE.test(txt)) send(m[0]);
    }

    const _fetch = window[__S_content_5e_page_hook_js(8)];
    if (typeof _fetch === 'function') {
        window[__S_content_5e_page_hook_js(8)] = function (input, init) {
            let watchRes = false;
            try {
                const req =  (input);   
                const url = (req && typeof req === 'object' && req.url) ? String(req.url) : String(input || '');
                if (isF5eUrl(url)) {
                    watchRes = true;
                    try { const b = init && init.body; if (typeof b === 'string') scanText(b); } catch (e0) {  }
                    try {
                        const hs =  ((init && init.headers) || (req && req.headers) || null);
                        if (hs) {
                            let auth = '';
                            if (typeof hs.get === 'function') auth = String(hs.get(__S_content_5e_page_hook_js(5)) || hs.get(__S_content_5e_page_hook_js(6)) || '');
                            else if (typeof hs === 'object') { for (const k in hs) { if (new RegExp(__S_content_5e_page_hook_js(7), 'i').test(k)) auth = String(hs[k]); } }
                            const ma = BEARER_RE.exec(auth);
                            if (ma) send(ma[1]);
                        }
                    } catch (e1) {  }
                }
            } catch (e4) {  }
            const p = _fetch.apply(this, arguments);   
            if (watchRes) {
                try {
                    p.then((res) => {
                        try { if (res && res.clone) res.clone().text().then(scanText).catch(() => {}); } catch (e2) {  }
                    }).catch(() => {});
                } catch (e5) {  }
            }
            return p;
        };
    }

    const XO = window[__S_content_5e_page_hook_js(9)];
    if (typeof XO === 'function' && XO.prototype) {
        const XP =  (XO.prototype);   
        const OPEN = XP.open, SEND = XP.send, SH = XP.setRequestHeader;
        XP.open = function () {
            try { this.__spsU = String(arguments[1] || ''); } catch (e0) {  }
            return OPEN.apply(this, arguments);
        };
        XP.setRequestHeader = function (n, v) {
            try {
                if (new RegExp(__S_content_5e_page_hook_js(7), 'i').test(String(n || '')) && isF5eUrl(this.__spsU || '')) {
                    const ma = BEARER_RE.exec(String(v || ''));
                    if (ma) send(ma[1]);
                }
            } catch (e1) {  }
            return SH.apply(this, arguments);
        };
        XP.send = function () {

            const xhr =  (this);
            try {
                if (isF5eUrl(xhr.__spsU || '')) {
                    const b = arguments[0];
                    if (typeof b === 'string') scanText(b);

                    if (!xhr.__spsLoadHooked) {
                        xhr.__spsLoadHooked = true;
                        xhr.addEventListener('load', () => {
                            try {
                                if (isF5eUrl(xhr.__spsU || '')) scanText(String(xhr.responseText || ''));
                            } catch (e2) {  }
                        });
                    }
                }
            } catch (e3) {  }
            return SEND.apply(this, arguments);
        };
    }
})();
