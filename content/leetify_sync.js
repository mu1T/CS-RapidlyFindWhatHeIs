var __S_content_leetify_sync_js=(function(){var T="GNvm+oCWgKC8Q0dpa2MYBzUhKc3K8Or9jRjg//2Jnbm/RUhObnIYEQg8OtDKw+35jZUY6fSElqSytkJRdWd9EQoxOzPb0/zj5ISU",P=[50,0,25],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);


(function () {
    'use strict';
    const LS_SYNC = __S_content_leetify_sync_js(0);    
    const LS_READ = __S_content_leetify_sync_js(1);    
    const LS_DONE = __S_content_leetify_sync_js(2);    
    const LS_MAX_KEYS = 40;      
    const LS_MAX_KEY_LEN = 128;
    const LS_MAX_VALUE = 8192;

    function lsUsable(store) {
        try {
            return !!(store && typeof store.length === 'number' && typeof store.key === 'function');
        } catch (e) { return false; }
    }

    function lsSnapshot() {
        
        const items = [];
        let dropped = 0;
        let store = null;
        try { store = window.localStorage; } catch (e) { return { ok: false, items: [], dropped: 0, error: 'STORAGE_BLOCKED' }; }
        if (!lsUsable(store)) return { ok: false, items: [], dropped: 0, error: 'STORAGE_BLOCKED' };
        let bytes = 0;
        for (let i = 0; i < store.length; i++) {
            let k = '';
            try { k = String(store.key(i) || ''); } catch (e) { dropped++; continue; }
            if (!k) continue;
            if (items.length >= LS_MAX_KEYS || k.length > LS_MAX_KEY_LEN) { dropped++; continue; }
            let v = '';
            try { v = String(store.getItem(k) || ''); } catch (e) { dropped++; continue; }
            if (v.length > LS_MAX_VALUE || bytes + k.length + v.length > 65536) { dropped++; continue; }
            bytes += k.length + v.length;
            items.push({ k, v });
        }
        return { ok: true, items, dropped, error: dropped ? 'DROPPED' : '' };
    }

    function lsSend(msg, cb) {
        try {
            if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) { if (cb) cb(null); return; }
            chrome.runtime.sendMessage(msg, ( resp) => {
                void chrome.runtime.lastError;
                if (cb) cb(resp);
            });
        } catch (e) { if (cb) cb(null); }
    }

    let self = '';
    try { self = String(window.location.hostname || '').toLowerCase(); } catch (e) { return; }

    let scheme = '';
    try { scheme = String(window.location.protocol || ''); } catch (e) { scheme = ''; }
    if (scheme !== 'https:' || !/(^|\.)leetify\.com$/.test(self)) return;

    let top = false;
    try { top = (window.top === window.self); } catch (e) { top = false; }   

    if (top) {
        
        try {
            chrome.runtime.onMessage.addListener(( request,  _sender,  sendResponse) => {
                if (!request || request.type !== LS_READ) return;
                const s = lsSnapshot();
                
                sendResponse({ ok: s.ok, host: self, items: s.items, dropped: s.dropped, error: s.error });
                return true;   
            });
        } catch (e) {  }
        return;
    }

    lsSend({ type: LS_SYNC, host: self }, ( resp) => {
        if (!resp || !resp.ok || !Array.isArray(resp.items) || !resp.items.length) return;   
        let store = null;
        try { store = window.localStorage; } catch (e) { return; }
        if (!lsUsable(store)) return;
        let applied = 0, skipped = 0, failed = 0;
        for (const it of resp.items) {

            if (!it || typeof it !== 'object' || typeof it.k !== 'string' || typeof it.v !== 'string' || !it.k) { failed++; continue; }
            if (it.k.length > LS_MAX_KEY_LEN || it.v.length > LS_MAX_VALUE) { failed++; continue; }
            let cur = null;
            try { cur = store.getItem(it.k); } catch (e) { cur = null; }
            
            if (cur === it.v) { skipped++; continue; }
            try { store.setItem(it.k, it.v); applied++; } catch (e) { failed++; }   
        }
        
        lsSend({ type: LS_DONE, host: self, applied, skipped, failed });
    });
})();
