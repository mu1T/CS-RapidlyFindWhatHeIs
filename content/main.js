    

    let _spsAdaptBound = false;
    let _spsAdaptSettings = null;
    let _spsAdaptBand = '';

    if (SPS_ACTIVE) chrome.storage.sync.get(defaults, function(settings) {
        chrome.storage.local.get(['sps_faceit_key', 'sps_csqaq_key', 'sps_leetify_key'], function(tokens) {
            Object.keys(tokens).forEach(k => { if (tokens[k] !== undefined) settings[k] = tokens[k]; });
            if (!settings.sps_enable) return;

            if (settings.sps_csqaq_accel && settings.sps_inv_source === 'csqaq' && settings.sps_csqaq_key) {
                safeSendMessage({ type: "CHECK_CSQAQ_IP", apiKey: String(settings.sps_csqaq_key || '') });
            }
            initPlugin(settings);
        });
    });

    let spsRebuildTimer = 0;
    function spsRebuildPanel() {
        document.querySelectorAll(
            '.sps-container.sps-showcase-mode, .profile_customization.sps-native, .sps-split-btn-wrapper, .sps-header-tools, .sps-split-id-row, .sps-showcase-leetify, .sps-showcase-csstats'
        ).forEach(el => el.remove());
        chrome.storage.sync.get(defaults, function(settings) {
            chrome.storage.local.get(['sps_faceit_key', 'sps_csqaq_key', 'sps_leetify_key'], function(tokens) {
                Object.keys(tokens).forEach(k => { if (tokens[k] !== undefined) settings[k] = tokens[k]; });
                if (!settings.sps_enable) return;   
                initPlugin(settings);
            });
        });
    }

    if (SPS_ACTIVE) chrome.storage.onChanged.addListener(function(changes, areaName) {
        if (areaName === 'sync' || areaName === 'local') {
            if (spsIsUserSettingChange(Object.keys(changes))) {
                safeSendMessage({ type: "CLEAR_CACHE" });
                clearTimeout(spsRebuildTimer);
                spsRebuildTimer = setTimeout(spsRebuildPanel, 800);
            }
        }
        if (areaName === 'local' && changes && typeof _spsCSStatsCards !== 'undefined') {
            for (const k of Object.keys(changes)) {
                if (k.startsWith('sps_cache_csstats1_')) {
                    const sid = k.replace('sps_cache_csstats1_', '');
                    const card = _spsCSStatsCards.get(sid);
                    if (card && typeof card.rerender === 'function') {
                        card.rerender();
                    }
                }
            }
        }
    });

    if (SPS_ACTIVE && typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('pageshow', function (event) {
            if (event.persisted || (typeof performance !== 'undefined' && performance.navigation && performance.navigation.type === 2)) {
                clearTimeout(spsRebuildTimer);
                spsRebuildTimer = setTimeout(spsRebuildPanel, 50);
            }
        });
    }

    function initPlugin(settings) {
        const steamID = getSteamID64();
        if (!steamID) return;
        const txt = I18N[settings.sps_language] || I18N.zh;
        const theme = detectProfileTheme();
        
        spsApplyTipMode(settings);
        spsBindTips();

        document.documentElement.style.setProperty('--sps-modal-opacity', String(settings.sps_modal_opacity));

        document.documentElement.style.setProperty('--sps-corner', settings.sps_corner_style === 'sharp' ? '2px' : '8px');

        if (settings.sps_ui_mode === 'showcase' || settings.sps_ui_mode === 'split') {
            document.documentElement.style.setProperty('--sps-bg-opacity', String(settings.sps_bg_opacity));
            document.documentElement.style.setProperty('--sps-main-opacity', String(settings.sps_opacity));
            document.documentElement.style.setProperty('--sps-scale', String(settings.sps_scale));

            const cStyle = settings.sps_container_style || 'auto';

            const applied = spsApplySurface(cStyle, theme.surface);

            spsBindAdaptation(settings);
            if (applied && !applied.ok) spsRetrySurfaceSample(settings, 2);
        } else {

            spsApplyTone(theme.surface, !!(theme.surface && theme.surface.isLight));
        }

        if (settings.sps_ui_mode === 'split') {
            renderSplitMode(steamID, settings, txt);
        } else if (settings.sps_ui_mode === 'native') {
            renderNativeMode(steamID, settings, txt);
        } else {
            renderShowcaseMode(steamID, settings, txt);
        }
    }

    function spsLayoutBand() {
        const w = window.innerWidth || 0;
        if (w <= 700) return 'mobile';
        if (w <= 910) return 'compact';
        return 'wide';
    }

    function spsBindAdaptation(settings) {
        _spsAdaptSettings = settings;           
        _spsAdaptBand = spsLayoutBand();
        if (_spsAdaptBound) return;
        _spsAdaptBound = true;

        const resample = () => {
            const st = _spsAdaptSettings;
            if (!st || (st.sps_ui_mode !== 'showcase' && st.sps_ui_mode !== 'split')) return;
            const band = spsLayoutBand();
            if (band === _spsAdaptBand) return;   
            _spsAdaptBand = band;
            spsApplySurface(st.sps_container_style || 'auto');
        };
        let debounce = 0;
        const onLayoutChange = () => { clearTimeout(debounce); debounce = setTimeout(resample, 200); };
        window.addEventListener('resize', onLayoutChange);
        if (typeof ResizeObserver === 'function') {
            
            try { new ResizeObserver(onLayoutChange).observe(document.documentElement); } catch (e) {  }
        }
        
        if (window.matchMedia) {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const onScheme = () => {
                const st = _spsAdaptSettings;
                if (!st || (st.sps_ui_mode !== 'showcase' && st.sps_ui_mode !== 'split')) return;
                spsApplySurface(st.sps_container_style || 'auto');
            };
            if (mq.addEventListener) mq.addEventListener('change', onScheme);
            else if (mq.addListener) mq.addListener(onScheme);
        }
    }

    function spsRetrySurfaceSample(settings, tries) {
        if (tries <= 0) return;
        const mode = settings.sps_ui_mode;
        setTimeout(() => {
            const cur = _spsAdaptSettings;
            if (!cur || cur.sps_ui_mode !== mode || (mode !== 'showcase' && mode !== 'split')) return;
            const s = spsSampleSurface();
            if (s.ok) {
                spsApplySurface(settings.sps_container_style || 'auto', s);
                addDebugLog('ui', 'surface: 延迟补采成功（首次采样时档案内容区还没就位）');
                return;
            }
            spsRetrySurfaceSample(settings, tries - 1);
        }, tries >= 2 ? 300 : 1000);
    }

