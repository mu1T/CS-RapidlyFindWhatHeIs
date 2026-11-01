

(function autoRedirectEdge() {
    const isEdge = navigator.userAgent.indexOf("Edg") > -1;
    const isFullScreen = window.location.search.includes('fullscreen=true');
    if (isEdge && !isFullScreen) {
        chrome.tabs.create({ url: 'options.html?fullscreen=true' });
        window.close();
    }
})();

function escHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function updateRangeLabel(id, value) {
    const label = document.getElementById('val_' + id);
    if (!label) return;
    if (id === 'zh_cache_ttl') {
        const v = Math.round(value);
        label.textContent = v >= 1440 ? (v / 1440).toFixed(1).replace(/\.0$/, '') + '天' : v + '分';
    } else if (id === 'top12_threshold') {
        const v = Math.round(value);
        label.textContent = v >= 10000 ? (v / 10000) + '万' : String(v);
    } else if (id === 'mkt_query_limit') {
        label.textContent = Math.round(value) + '个';
    } else if (id === 'pw_base_seasons') {
        label.textContent = 'S' + Math.round(value);
    } else if (id === 'csstats_ttl') {
        const v = Math.round(value);
        label.textContent = v >= 60 ? (v / 60).toFixed(1).replace(/\.0$/, '') + '小时' : v + '分';
    } else if (id === 'csqaq_bind_interval' || id === 'cache_ttl' || id === 'faceit_cache_ttl') {
        label.textContent = Math.round(value) + '分';
    } else {
        label.textContent = Math.round(value * 100) + '%';
    }
}
['scale', 'bg_opacity', 'modal_opacity', 'csqaq_bind_interval', 'cache_ttl', 'faceit_cache_ttl', 'csstats_ttl', 'zh_cache_ttl', 'top12_threshold', 'mkt_query_limit', 'pw_base_seasons'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', (e) => updateRangeLabel(id, ( (e.target)).value));
});

document.getElementById('inv_source').addEventListener('change', function() {
    document.getElementById('steamdt_config').style.display = this.value === 'steamdt' ? 'block' : 'none';
    document.getElementById('csqaq_config').style.display = this.value === 'csqaq' ? 'block' : 'none';
    const hint = document.getElementById('steam_mkt_hint');
    if (hint) hint.style.display = this.value === 'steam_mkt' ? 'block' : 'none';
});

function toggleSplitClose() {
    const mode = document.getElementById('ui_mode').value;
    const isSplit = mode === 'split';
    const isNative = mode === 'native';
    const panel = document.getElementById('split_close_panel');
    if (panel) panel.style.display = isSplit ? 'block' : 'none';
    const nativeHint = document.getElementById('native_mode_hint');
    if (nativeHint) nativeHint.style.display = isNative ? 'block' : 'none';
    
    const appearance = document.getElementById('appearance_rows');
    if (appearance) appearance.style.display = isNative ? 'none' : 'block';
}
document.getElementById('ui_mode').addEventListener('change', toggleSplitClose);

function togglePasswordVisibility(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (!input || !btn) return;
    btn.addEventListener('click', () => {
        const isPw = input.type === 'password';
        input.type = isPw ? 'text' : 'password';
        btn.textContent = isPw ? '🙈' : '👁️';
    });
}
['faceit_key', 'csqaq_key', 'steamdt_key', 'pw_token', 'leetify_key'].forEach(id => togglePasswordVisibility(id, 'eye_' + id));

function toggleBgOpacity(enabled) {
    const slider = document.getElementById('bg_opacity');
    const hint = document.getElementById('bg_opacity_hint');
    if (!slider) return;
    slider.disabled = !enabled;
    slider.style.opacity = enabled ? '1' : '0.35';
    if (hint) hint.style.display = enabled ? 'none' : 'block';
}
document.getElementById('container_style').addEventListener('change', function() {
    toggleBgOpacity(this.value !== 'auto');
});

