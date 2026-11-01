

const SPS_DEBUG_KEY = 'sps_debug_logs';
const SPS_DEBUG_MAX = 300;
const SPS_DEBUG_FLUSH_MS = 500;

let _spsDebugBuf = [];
let _spsDebugTimer = null;

let _spsDebugFlushChain = Promise.resolve();

function spsFlushDebugLogs() {
    if (!_spsDebugBuf.length) return;
    const batch = _spsDebugBuf;
    _spsDebugBuf = [];
    _spsDebugTimer = null;
    _spsDebugFlushChain = _spsDebugFlushChain.then(() => new Promise((resolve) => {
        try {
            chrome.storage.local.get(SPS_DEBUG_KEY, (d) => {
                const logs = Array.isArray(d[SPS_DEBUG_KEY]) ? d[SPS_DEBUG_KEY] : [];
                for (const e of batch) logs.push(e);
                while (logs.length > SPS_DEBUG_MAX) logs.shift();
                chrome.storage.local.set({ [SPS_DEBUG_KEY]: logs }, () => { void chrome.runtime.lastError; resolve(); });
            });
        } catch (e) { resolve(); }   
    })).catch(() => {});
}

function addDebugLog(tag, msg) {
    try {
        _spsDebugBuf.push({ t: Date.now(), tag: String(tag).slice(0, 24), m: String(msg).slice(0, 400) });
        if (!_spsDebugTimer) {
            _spsDebugTimer = setTimeout(spsFlushDebugLogs, SPS_DEBUG_FLUSH_MS);
            
        }
    } catch (e) {  }
}

function getDebugLogs() {
    
    spsFlushDebugLogs();
    return _spsDebugFlushChain.then(() => new Promise((resolve) => {
        try {
            chrome.storage.local.get(SPS_DEBUG_KEY, (d) => resolve(Array.isArray(d[SPS_DEBUG_KEY]) ? d[SPS_DEBUG_KEY] : []));
        } catch (e) { resolve([]); }
    }));
}

function clearDebugLogs() {
    try {
        _spsDebugBuf = [];
        if (_spsDebugTimer) { clearTimeout(_spsDebugTimer); _spsDebugTimer = null; }
        chrome.storage.local.remove(SPS_DEBUG_KEY);
    } catch (e) {}
}
