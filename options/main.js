const TOKEN_KEYS = ['sps_faceit_key', 'sps_csqaq_key', 'sps_steamdt_key', 'sps_pw_token', 'sps_leetify_key'];

const SID_MIRROR_KEYS = ['sps_my_steamid', 'sps_pw_my_steamid'];

function sanitizeMySteamId(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }
function validMySteamId(s) { return /^7656\d{13}$/.test(String(s || '')); }

function renderMySteamIdStatus(s) {
    const el = document.getElementById('my-steamid-status');
    if (!el) return;
    
    if (!s) { el.textContent = '未设置'; return; }
    if (validMySteamId(s)) { el.textContent = '✅ 已设置：' + s; return; }
    el.textContent = '⚠️ 形状可疑：' + s + '（应为 17 位、以 7656 开头）';
}

function renderPWMySteamIdStatus(s) {
    const el = document.getElementById('pw-my-steamid-status');
    if (!el) return;
    if (!s) { el.textContent = '未设置'; return; }
    if (validMySteamId(s)) { el.textContent = '✅ 已设置：' + s; return; }
    el.textContent = '⚠️ 形状可疑：' + s + '（应为 17 位、以 7656 开头）';
}

const ACCOUNT_ID_KEYS = ['sps_my_steamid', 'sps_pw_my_steamid'];
let _accountInputsBound = false;   

const _accountDirty = { five: false, pw: false };

function readAccountIds(cb) {
    const finish = ( sync) => {
        try {
            chrome.storage.local.get(ACCOUNT_ID_KEYS, ( local) => {
                const pick = ( k) => sanitizeMySteamId((sync && sync[k]) || (local && local[k]) || '');
                cb(pick('sps_my_steamid'), pick('sps_pw_my_steamid'));
            });
        } catch (e) {
            cb(sanitizeMySteamId(sync && sync.sps_my_steamid), sanitizeMySteamId(sync && sync.sps_pw_my_steamid));
        }
    };
    try { chrome.storage.sync.get({ sps_my_steamid: '', sps_pw_my_steamid: '' }, finish); }
    catch (e) { finish({}); }
}

function renderAccountIdRows(five, pw) {
    const fiveEl =  (document.getElementById('my_steamid'));
    const fiveStatus = document.getElementById('my-steamid-status');
    if (fiveEl && fiveStatus && !_accountDirty.five && document.activeElement !== fiveEl) {
        fiveEl.value = five;
        renderMySteamIdStatus(five);
    }
    const pwEl =  (document.getElementById('pw_my_steamid'));
    const pwStatus = document.getElementById('pw-my-steamid-status');

    const shown = pw || five;
    if (pwEl && pwStatus && !_accountDirty.pw && document.activeElement !== pwEl) {
        pwEl.value = shown;
        renderPWMySteamIdStatus(shown);
    }
}

function bindAccountInputs() {
    if (_accountInputsBound) return;
    _accountInputsBound = true;
    const fiveEl = document.getElementById('my_steamid');
    if (fiveEl) fiveEl.addEventListener('input', ( e) => {
        _accountDirty.five = true;
        renderMySteamIdStatus(sanitizeMySteamId( (e.target).value));
    });
    const pwEl = document.getElementById('pw_my_steamid');
    if (pwEl) pwEl.addEventListener('input', ( e) => {
        _accountDirty.pw = true;
        renderPWMySteamIdStatus(sanitizeMySteamId( (e.target).value));
    });
}

function clearAccountDirty() { _accountDirty.five = false; _accountDirty.pw = false; }

if (chrome.storage && chrome.storage.onChanged && chrome.storage.onChanged.addListener) {
    chrome.storage.onChanged.addListener(( changes,  areaName) => {
        if (areaName !== 'sync' && areaName !== 'local') return;
        if (!ACCOUNT_ID_KEYS.some(k => Object.prototype.hasOwnProperty.call(changes || {}, k))) return;
        readAccountIds(renderAccountIdRows);
    });
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) return;
        try { readAccountIds(renderAccountIdRows); } catch (e) {  }
    });
}

(function bindCdpGrant() {
    const btn = document.getElementById('csstats_cdp_grant');
    if (!btn || !chrome.permissions) return;
    const origins = ['http://127.0.0.1/*'];
    let granted = false;
    const paint = (v) => { granted = !!v; btn.textContent = granted ? '已授权 127.0.0.1（点击撤销）' : '授权 127.0.0.1'; };
    try {
        chrome.permissions.contains({ origins }, (has) => { void chrome.runtime.lastError; paint(has); });
    } catch (e) {  }
    
    btn.addEventListener('click', () => {
        try {
            if (granted) chrome.permissions.remove({ origins }, (removed) => { void chrome.runtime.lastError; paint(!removed); });
            else chrome.permissions.request({ origins }, (ok) => { void chrome.runtime.lastError; paint(ok); });
        } catch (e) { btn.textContent = '当前浏览器不支持授权'; }
    });
})();

const defaultSettings = {
    sps_enable: true, sps_language: 'zh', sps_ui_mode: 'showcase',
    sps_scale: 1.0, sps_bg_opacity: 0.95, sps_modal_opacity: 0.85, sps_high_contrast: false,
    sps_show_csstats: true, sps_show_leetify: true, sps_frame_mode: 'pip', sps_frame_auto_tab: true, sps_csstats_carrier: 'frame', sps_csstats_fetch: 'auto', sps_csstats_cef: 'auto', sps_csstats_ttl: 30, sps_frame_window_nofocus: true, sps_show_topitems: true, sps_show_phase: true,
    sps_container_style: 'auto', sps_corner_style: 'rounded',
    sps_inv_source: 'steam', sps_steamdt_key: '', sps_steamdt_plat: 'buff',
    sps_float_source: 'bymykel',   
    sps_csqaq_key: '', sps_csqaq_plat: '1', sps_csqaq_accel: false, sps_sticker_steam_fallback: true, sps_link_source: 'auto', sps_faceit_key: '', sps_leetify_key: '',
    sps_auto_bind_csqaq: true, sps_csqaq_bind_interval: 30,
    sps_show_pw: false, sps_pw_search: true, sps_cache_ttl: 5,
    sps_pw_detail: false, sps_pw_mysteamid: '',   
    sps_show_5e: false, sps_f5e_search: true, sps_f5e_enh: true, sps_f5e_contact: false,
    sps_my_steamid: '',   
    sps_pw_my_steamid: '',   
    sps_panel_cache_ttl: 30,   
    sps_faceit_cache_ttl: 5,   
    sps_zh_cache_ttl: 1440,
    sps_top12_threshold: 10000,   
    sps_mkt_query_limit: 50,      
    sps_pw_base_seasons: 25,      
    sps_currency: 'CNY',          
    sps_split_close_mode: 'outside',
    
    sps_hover_mode: 'hover'
};

document.getElementById('float_source').addEventListener('change', () => {
    const h = document.getElementById('float_source_hint');
    if (h) h.style.display = document.getElementById('float_source').value === 'steamdt' ? 'block' : 'none';
});

document.getElementById('clear_cache').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: "CLEAR_CACHE" }, (res) => {
        const s = document.getElementById('status');
        s.textContent = res && res.success ? `✅ 清除 ${res.cleared} 条缓存` : '❌ 失败';
        setTimeout(() => s.textContent = '', 2000);
    });
});

function saveOptions() {
    const t12 = parseInt(document.getElementById('top12_threshold').value, 10);
    const mkt = Math.min(50, parseInt(document.getElementById('mkt_query_limit').value, 10) || 50);   
    
    const settings = {
        sps_enable: document.getElementById('enable_plugin').checked,
        sps_language: document.getElementById('language').value,
        sps_ui_mode: document.getElementById('ui_mode').value,
        sps_scale: parseFloat(document.getElementById('scale').value),
        sps_bg_opacity: parseFloat(document.getElementById('bg_opacity').value),
        sps_modal_opacity: parseFloat(document.getElementById('modal_opacity').value),
        sps_high_contrast: document.getElementById('high_contrast').checked,
        sps_show_csstats: document.getElementById('show_csstats').checked,
        sps_show_leetify: document.getElementById('show_leetify').checked,
        sps_frame_mode: document.getElementById('frame_mode').value,
        sps_frame_auto_tab: document.getElementById('frame_auto_tab').checked,
        sps_csstats_carrier: document.getElementById('csstats_carrier').value,
        sps_csstats_fetch: document.getElementById('csstats_fetch').value,
        sps_csstats_cef: document.getElementById('csstats_cef').value,
        sps_frame_window_nofocus: document.getElementById('window_nofocus').checked,
        sps_show_topitems: document.getElementById('show_topitems').checked,
        sps_show_phase: document.getElementById('show_phase').checked,
        sps_container_style: document.getElementById('container_style').value,
        sps_corner_style: document.getElementById('corner_style').value,
        sps_split_close_mode: document.getElementById('split_close_mode').value,
        sps_hover_mode: document.getElementById('hover_mode').value || 'hover',
        sps_inv_source: document.getElementById('inv_source').value,
        sps_steamdt_key: document.getElementById('steamdt_key').value.trim(),
        sps_steamdt_plat: (document.querySelector('input[name="steamdt_plat"]:checked') || {}).value || 'buff',
        sps_float_source: document.getElementById('float_source').value || 'bymykel',
        sps_csqaq_key: document.getElementById('csqaq_key').value.trim(),
        sps_csqaq_plat: document.querySelector('input[name="csqaq_plat"]:checked').value,
        sps_csqaq_accel: document.getElementById('csqaq_accel').checked,
        sps_sticker_steam_fallback: document.getElementById('sticker_steam_fallback').checked,
        sps_link_source: document.getElementById('link_source').value,
        sps_faceit_key: document.getElementById('faceit_key').value.trim(),
        sps_leetify_key: document.getElementById('leetify_key').value.trim(),
        sps_auto_bind_csqaq: document.getElementById('auto_bind_csqaq').checked,
        sps_csqaq_bind_interval: parseInt(document.getElementById('csqaq_bind_interval').value) || 30,
        sps_show_pw: document.getElementById('show_pw').checked,
        sps_show_5e: document.getElementById('show_5e').checked,
        sps_f5e_search: document.getElementById('f5e_search').checked,
        sps_f5e_enh: document.getElementById('f5e_enh').checked,
        sps_f5e_contact: document.getElementById('f5e_contact').checked,
        sps_my_steamid: sanitizeMySteamId(document.getElementById('my_steamid').value),
        sps_pw_my_steamid: sanitizeMySteamId(document.getElementById('pw_my_steamid').value),   
        sps_pw_search: document.getElementById('pw_search').checked,
        sps_pw_detail: document.getElementById('pw_detail').checked,
        sps_pw_mysteamid: document.getElementById('pw_mysteamid').value.trim().replace(/\D/g, ''),
        sps_pw_token: document.getElementById('pw_token').value.trim(),   
        sps_cache_ttl: parseInt(document.getElementById('cache_ttl').value) || 5,
        sps_panel_cache_ttl: parseInt(document.getElementById('panel_cache_ttl').value) || 30,
        sps_faceit_cache_ttl: parseInt(document.getElementById('panel_cache_ttl').value) || 30,
        sps_csstats_ttl: parseInt(document.getElementById('panel_cache_ttl').value) || 30,
        sps_zh_cache_ttl: parseInt(document.getElementById('zh_cache_ttl').value) || 1440,
        sps_top12_threshold: Number.isFinite(t12) ? t12 : 10000,
        sps_mkt_query_limit: (Number.isFinite(mkt) && mkt > 0) ? mkt : 50,
        sps_pw_base_seasons: parseInt(document.getElementById('pw_base_seasons').value) || 25,
        sps_currency: document.getElementById('currency').value || 'CNY'
    };

    const tokenPart =  ({}), normalPart =  ({});
    for (const k of Object.keys(settings)) {
        if (TOKEN_KEYS.includes(k)) tokenPart[k] = settings[k];
        else normalPart[k] = settings[k];
    }

    normalPart.sps_settings_rev = Date.now();

    chrome.storage.sync.set(normalPart, function() {
        chrome.storage.local.set(tokenPart, function() {

            chrome.storage.local.set({ sps_my_steamid: normalPart.sps_my_steamid, sps_pw_my_steamid: normalPart.sps_pw_my_steamid });
            
            clearAccountDirty();
            chrome.runtime.sendMessage({ type: "CLEAR_CACHE" });
            chrome.runtime.sendMessage({ type: "TRIGGER_CSQAQ_BIND" });
            const s = document.getElementById('status');
            s.textContent = '✅ 设置已保存';
            setTimeout(() => s.textContent = '', 2000);
        });
    });
}

function restoreOptions() {
    chrome.storage.sync.get(defaultSettings, function( items) {
        chrome.storage.local.get(TOKEN_KEYS.concat(SID_MIRROR_KEYS), function(tokens) {
            Object.keys(tokens).forEach(k => {
                if (tokens[k] === undefined) return;
                
                if (SID_MIRROR_KEYS.includes(k) && items[k]) return;
                items[k] = tokens[k];
            });
            document.getElementById('enable_plugin').checked = items.sps_enable;
            document.getElementById('language').value = items.sps_language;
            document.getElementById('ui_mode').value = items.sps_ui_mode;

            document.getElementById('scale').value = items.sps_scale;
            updateRangeLabel('scale', items.sps_scale);
            document.getElementById('bg_opacity').value = items.sps_bg_opacity;
            updateRangeLabel('bg_opacity', items.sps_bg_opacity);
            
            document.getElementById('modal_opacity').value = items.sps_modal_opacity;
            updateRangeLabel('modal_opacity', items.sps_modal_opacity);
            document.getElementById('high_contrast').checked = items.sps_high_contrast;

            document.getElementById('show_csstats').checked = items.sps_show_csstats;
            document.getElementById('show_leetify').checked = items.sps_show_leetify;
            document.getElementById('frame_mode').value = items.sps_frame_mode || 'pip';
            document.getElementById('frame_auto_tab').checked = items.sps_frame_auto_tab !== false;
            
            document.getElementById('csstats_carrier').value =
                ['frame', 'tab', 'window'].indexOf(items.sps_csstats_carrier) >= 0 ? items.sps_csstats_carrier : 'frame';
            
            document.getElementById('csstats_fetch').value =
                ['auto', 'direct', 'tab'].indexOf(items.sps_csstats_fetch) >= 0 ? items.sps_csstats_fetch : 'auto';
            
            document.getElementById('csstats_cef').value =
                ['auto', 'visible', 'off'].indexOf(items.sps_csstats_cef) >= 0 ? items.sps_csstats_cef : 'auto';
            document.getElementById('window_nofocus').checked = items.sps_frame_window_nofocus !== false;
            document.getElementById('show_topitems').checked = items.sps_show_topitems;
            document.getElementById('show_phase').checked = items.sps_show_phase !== false;
            document.getElementById('sticker_steam_fallback').checked = items.sps_sticker_steam_fallback !== false;
            document.getElementById('link_source').value = items.sps_link_source || 'auto';
            document.getElementById('container_style').value = items.sps_container_style || 'auto';
            document.getElementById('corner_style').value = items.sps_corner_style || 'rounded';
            document.getElementById('split_close_mode').value = items.sps_split_close_mode || 'outside';
            document.getElementById('hover_mode').value = items.sps_hover_mode || 'hover';
            toggleBgOpacity(items.sps_container_style !== 'auto');
            document.getElementById('inv_source').value = items.sps_inv_source;
            const mktHint = document.getElementById('steam_mkt_hint');
            if (mktHint) mktHint.style.display = items.sps_inv_source === 'steam_mkt' ? 'block' : 'none';
            document.getElementById('steamdt_key').value = items.sps_steamdt_key;
            const dtPlatRadio = document.querySelector(`input[name="steamdt_plat"][value="${items.sps_steamdt_plat || 'buff'}"]`);
            if (dtPlatRadio) ( (dtPlatRadio)).checked = true;
            document.getElementById('float_source').value = items.sps_float_source || 'bymykel';
            const floatHint = document.getElementById('float_source_hint');
            if (floatHint) floatHint.style.display = (items.sps_float_source === 'steamdt') ? 'block' : 'none';
            document.getElementById('csqaq_key').value = items.sps_csqaq_key;
            document.getElementById('auto_bind_csqaq').checked = items.sps_auto_bind_csqaq !== false;
            document.getElementById('csqaq_bind_interval').value = items.sps_csqaq_bind_interval || 30;
            updateRangeLabel('csqaq_bind_interval', items.sps_csqaq_bind_interval || 30);
            document.getElementById('csqaq_accel').checked = items.sps_csqaq_accel === true;
            const platRadio = document.querySelector(`input[name="csqaq_plat"][value="${items.sps_csqaq_plat}"]`);
            if (platRadio) ( (platRadio)).checked = true;
            document.getElementById('faceit_key').value = items.sps_faceit_key;
            document.getElementById('leetify_key').value = items.sps_leetify_key || '';
            document.getElementById('show_pw').checked = items.sps_show_pw === true;
            document.getElementById('show_5e').checked = items.sps_show_5e === true;
            document.getElementById('f5e_search').checked = items.sps_f5e_search !== false;
            document.getElementById('f5e_enh').checked = items.sps_f5e_enh !== false;
            document.getElementById('f5e_contact').checked = items.sps_f5e_contact === true;   

            renderAccountIdRows(sanitizeMySteamId(items.sps_my_steamid), sanitizeMySteamId(items.sps_pw_my_steamid));
            bindAccountInputs();
            document.getElementById('pw_search').checked = items.sps_pw_search !== false;
            document.getElementById('pw_detail').checked = items.sps_pw_detail === true;
            document.getElementById('pw_mysteamid').value = items.sps_pw_mysteamid || '';
            document.getElementById('pw_token').value = items.sps_pw_token || '';
            const pv = document.getElementById('pw-verify-status');
            if (pv) {
                pv.textContent = items.sps_pw_token ? '📡 校验中...' : '⭕ 未配置';
                pv.style.color = '';
            }

            chrome.runtime.sendMessage({ type: 'PW_TOKEN_STATUS' }, ( res) => {
                if (chrome.runtime.lastError || !res || !res.success) return;
                const d = res.data || {};
                if (!pv) return;
                if (!d.configured) {
                    pv.textContent = '⭕ 未配置';
                    pv.style.color = '';
                } else if (d.valid) {
                    const at = d.checkedAt ? new Date(d.checkedAt).toLocaleString() : '';
                    pv.textContent = `✅ 凭证有效${d.nickname ? '（本人：' + d.nickname + '）' : ''}${at ? ' · 校验于 ' + at : ''}`;
                    pv.style.color = '#4caf50';
                } else {
                    pv.textContent = `❌ 凭证已失效${d.error && d.error !== 'STALE' ? '（' + d.error + '）' : ''}，请点「Steam 登录获取」重新获取`;   
                    pv.style.color = '#c75050';
                }
            });
            document.getElementById('cache_ttl').value = items.sps_cache_ttl || 5;
            updateRangeLabel('cache_ttl', items.sps_cache_ttl || 5);
            const panelTtlVal = Number(items.sps_panel_cache_ttl) || Number(items.sps_csstats_ttl) || Number(items.sps_faceit_cache_ttl) || 30;
            const panelEl = document.getElementById('panel_cache_ttl');
            if (panelEl) {
                panelEl.value = panelTtlVal;
                updateRangeLabel('panel_cache_ttl', panelTtlVal);
            }
            document.getElementById('zh_cache_ttl').value = items.sps_zh_cache_ttl || 1440;
            updateRangeLabel('zh_cache_ttl', items.sps_zh_cache_ttl || 1440);
            document.getElementById('top12_threshold').value = Number.isFinite(parseInt(items.sps_top12_threshold)) ? parseInt(items.sps_top12_threshold) : 10000;
            updateRangeLabel('top12_threshold', Number.isFinite(parseInt(items.sps_top12_threshold)) ? parseInt(items.sps_top12_threshold) : 10000);
            document.getElementById('mkt_query_limit').value = parseInt(items.sps_mkt_query_limit) || 50;
            updateRangeLabel('mkt_query_limit', parseInt(items.sps_mkt_query_limit) || 50);
            document.getElementById('pw_base_seasons').value = parseInt(items.sps_pw_base_seasons) || 25;
            updateRangeLabel('pw_base_seasons', parseInt(items.sps_pw_base_seasons) || 25);
            document.getElementById('currency').value = items.sps_currency || 'CNY';

            document.getElementById('inv_source').dispatchEvent(new Event('change'));

            if (typeof toggleSplitClose === 'function') toggleSplitClose();
        });
    });
}

document.getElementById('export_settings').addEventListener('click', () => {
    chrome.storage.sync.get(null, (syncData) => {
        chrome.storage.local.get(TOKEN_KEYS, (tokens) => {
            const blob = new Blob([JSON.stringify({ settings: syncData, tokens }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sps-settings.json';
            a.click();
            URL.revokeObjectURL(url);
            const s = document.getElementById('status');
            s.textContent = '✅ 已导出 sps-settings.json';
            setTimeout(() => s.textContent = '', 2000);
        });
    });
});

document.getElementById('import_settings').addEventListener('click', () => {
    document.getElementById('settings_file_input').click();
});

document.getElementById('settings_file_input').addEventListener('change', (e) => {
    const file = ( (e.target)).files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(String(( (ev.target)).result || ''));
            if (!data || typeof data !== 'object' || !data.settings) throw new Error('bad format');
            chrome.storage.sync.set({ ...data.settings, sps_settings_rev: Date.now() }, () => {
                chrome.storage.local.set(data.tokens || {}, () => {
                    chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' });
                    const s = document.getElementById('status');
                    s.textContent = '✅ 已导入，页面即将刷新';
                    setTimeout(() => location.reload(), 800);
                });
            });
        } catch (err) {
            const s = document.getElementById('status');
            s.textContent = '❌ 文件格式错误';
            setTimeout(() => s.textContent = '', 3000);
        }
    };
    reader.readAsText(file);
    ( (e.target)).value = '';
});

(function () {
    const btn = document.getElementById('pw-verify-btn');
    const status = document.getElementById('pw-verify-status');
    if (!btn || !status) return;
    btn.addEventListener('click', () => {
        const token = document.getElementById('pw_token').value.trim();
        const mySteamId = document.getElementById('pw_mysteamid').value.trim().replace(/\D/g, '');
        if (!token || !mySteamId) { status.textContent = '⚠️ 请先填写 token 与本人 SteamID'; return; }
        status.textContent = '📡 验证中...';
        chrome.runtime.sendMessage({ type: 'VERIFY_PW_TOKEN', sps_pw_token: token, sps_pw_mysteamid: mySteamId }, ( res) => {
            const d = res && res.data;
            if (res && res.success && d && d.success) {
                status.textContent = '✅ 凭证有效' + (d.nickname ? ('（本人：' + d.nickname + '）') : '') + '，保存后开启明细';
            } else {
                const why = d && d.error ? d.error : '验证失败';
                status.textContent = '❌ ' + why + '（请确认 token 与 SteamID 同账号）';
            }
        });
    });
})();

(function () {
    const input = document.getElementById('settings_search');
    const clearBtn = document.getElementById('search_clear');
    if (!input) return;
    const cards = [...document.querySelectorAll('.main-wrap .card')];

    const tipTextOf = (root) => [...root.querySelectorAll('[data-tip]')].map(e => e.getAttribute('data-tip') || '').join(' ');
    const cardTexts = cards.map(card => ({
        card,
        text: ((card.textContent || '') + ' ' + tipTextOf(card)).toLowerCase(),
        rows: [...card.querySelectorAll('.row, .chk-row')].map(r => ({ el: r, text: ((r.textContent || '') + ' ' + tipTextOf(r)).toLowerCase() }))
    }));

    function setRowState(el, dim) {
        el.style.opacity = dim ? '0.45' : '';
        el.style.display = '';
    }
    function applyFilter() {
        const q = input.value.trim().toLowerCase();
        clearBtn.style.display = q ? 'block' : 'none';
        for (const { card, text, rows } of cardTexts) {
            if (!q) {
                
                card.style.display = '';
                rows.forEach(r => setRowState( (r.el), false));
                continue;
            }
            const cardHit = text.includes(q);
            card.style.display = cardHit ? '' : 'none';
            
            rows.forEach(r => setRowState( (r.el), cardHit && !r.text.includes(q)));
        }
    }
    input.addEventListener('input', applyFilter);
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { input.value = ''; applyFilter(); } });
    clearBtn.addEventListener('click', () => { input.value = ''; applyFilter(); input.focus(); });
})();

(function () {
    const fmtBytes = (n) => n >= 1048576 ? (n / 1048576).toFixed(2) + 'MB' : (n >= 1024 ? (n / 1024).toFixed(1) + 'KB' : n + 'B');
    const statsEl = document.getElementById('cache_stats');
    const DOMAIN_ZH = { INV: '库存', FACEIT: 'FACEIT', LEETIFY: 'Leetify', CSSTATS: 'CSStats', PW: '完美', ZH: '中文', PRICES: '价格', F5E: '5E', OTHER: '其它' };
    function renderStats( s) {
        if (!statsEl || !s) return;
        const parts = [];
        for (const d of ['INV', 'FACEIT', 'LEETIFY', 'CSSTATS', 'PW', 'F5E', 'ZH', 'PRICES']) {
            if (s.domains[d]) parts.push(`${DOMAIN_ZH[d]} ${s.domains[d]}条/${fmtBytes(s.domainBytes[d] || 0)}`);
        }
        statsEl.textContent = `📦 已用 ${fmtBytes(s.totalBytes || 0)} / ${fmtBytes(s.quotaBytes || 0)}` + (parts.length ? '　' + parts.join(' · ') : '（缓存为空）');
    }
    function loadStats() {
        chrome.runtime.sendMessage({ type: 'SPS_CACHE_STATS' }, ( res) => {
            if (res && res.success) renderStats(res.stats);
            else if (statsEl) statsEl.textContent = '📦 缓存占用统计不可用';
        });
    }

    const breakerEl = document.getElementById('breaker_status');
    const refreshBtn = document.getElementById('breaker_refresh');
    const PROVIDER_ZH = { csqaq: 'CSQAQ', steamdt: 'SteamDT', steam_mkt: 'Steam 市场' };
    const KIND_ZH = { auth: '鉴权失效', transient: '限流/瞬时' };
    const fmtLeft = ( ms) => ms >= 1000 ? Math.ceil(ms / 1000) + 's' : '<1s';
    function renderBreakers( brk) {
        if (!breakerEl) return;
        const rows = [];
        for (const p of Object.keys(brk || {})) {
            const st = brk[p];
            if (!st || !st.tripped) continue;   
            const left = Math.max(0, Number(st.remainingMs) || 0);
            rows.push(`${PROVIDER_ZH[p] || p}：${KIND_ZH[st.kind] || st.kind || '未知'}熔断，剩余 ${fmtLeft(left)}（连败 ${st.streak || 0} 次）`);
        }
        breakerEl.textContent = rows.length ? rows.join('；') : '全部提供方正常（无熔断）';
    }
    function loadBreakers() {
        if (!breakerEl) return;
        chrome.runtime.sendMessage({ type: 'SPS_DEBUG_EXPORT' }, ( res) => {
            if (res && res.success && res.diagnostics && res.diagnostics.cacheCore) {
                renderBreakers(res.diagnostics.cacheCore.breakers);
            } else {
                breakerEl.textContent = '熔断状态读取失败（后台未就绪或已休眠）';
            }
        });
    }
    loadBreakers();
    if (refreshBtn) refreshBtn.addEventListener('click', loadBreakers);
    loadStats();
    document.querySelectorAll('.cache-clear-btn').forEach(( btn) => {
        btn.addEventListener('click', () => {
            const domain = btn.getAttribute('data-domain');
            if (!domain) return;
            btn.disabled = true;
            chrome.runtime.sendMessage({ type: 'CLEAR_CACHE_DOMAIN', domain }, ( res) => {
                btn.disabled = false;
                const s = document.getElementById('status');
                if (s) {
                    s.textContent = res && res.success ? `✅ 已清除 ${DOMAIN_ZH[domain] || domain} ${res.cleared} 条缓存` : '❌ 清除失败';
                    setTimeout(() => { s.textContent = ''; }, 2000);
                }
                loadStats();   
                loadBreakers();   
            });
        });
    });
})();

document.getElementById('export_diagnostics').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'SPS_DEBUG_EXPORT' }, ( res) => {
        const s = document.getElementById('status');
        if (res && res.success && res.diagnostics) {
            const blob = new Blob([JSON.stringify(res.diagnostics, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sps-diagnostics-' + new Date().toISOString().slice(0, 10) + '.json';
            a.click();
            URL.revokeObjectURL(url);
            s.textContent = '✅ 已导出诊断包';
        } else {
            s.textContent = '❌ 导出失败';
        }
        setTimeout(() => s.textContent = '', 2000);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    restoreOptions();
    toggleSplitClose();
});
document.getElementById('save').addEventListener('click', saveOptions);

