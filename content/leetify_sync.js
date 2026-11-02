

(function () {
    'use strict';
    const LS_SYNC = 'EMBED_LEETIFY_STORE_SYNC';    
    const LS_READ = 'EMBED_LEETIFY_STORE_READ';    
    const LS_DONE = 'EMBED_LEETIFY_STORE_DONE';    
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
