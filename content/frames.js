    const FRAME_SITES = {

        csstats: { name: 'CSStats', url: (id) => csstatsProfileUrl(id), carrier: 'frame' },
        leetify: { name: 'Leetify', url: (id) => `https://leetify.com/public/profile/${id}` },
        faceitfinder: { name: 'FaceitFinder', url: (id) => `https://faceitfinder.com/profile/${id}` },
        faceit: { name: 'FACEIT', url: (id) => id }   
    };
    const frameWindows = new Map();   

    const SPS_FRAME_LAYOUT_CAP = 1920;

    const SPS_FRAME_WIDE_BASE = 1280;

    let _spsFrameLastActive = null;   
    function syncFrameFocusShims() {
        for (const x of frameWindows.values()) {
            if (!x.frame) continue;
            const visible = x.modal && x.modal.style.display !== 'none';
            x.frame.classList.toggle('sps-frame-unfocused', visible && x.modal !== _spsFrameLastActive);
        }
    }
    function activateFrameWindow(w) {
        _spsFrameLastActive = w.modal;
        spsFocusWindow(w.modal);
        syncFrameFocusShims();
    }
    if (SPS_ACTIVE) document.addEventListener('sps-window-focus', (e) => {
        _spsFrameLastActive = (e && e.detail && e.detail.el) || null;
        syncFrameFocusShims();
    });

    function hostOf(u) {
        try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
    }

    const BADGE_BASE = 20, BADGE_GAP = 10;
    function layoutBadges() {
        const badges = [...document.querySelectorAll('.sps-frame-badge, .sps-pw-badge')]
            .filter(b => b.style.display !== 'none' && b.isConnected);
        let bottom = BADGE_BASE;
        for (const b of badges) {
            b.style.bottom = bottom + 'px';
            bottom += (b.offsetHeight || 40) + BADGE_GAP;
        }
    }
    function showBadgeAt(badge) {
        badge.style.display = 'flex';
        layoutBadges();
    }
    function hideBadgeAt(badge) {
        badge.style.display = 'none';
        layoutBadges();
    }

    function createFrameModal(w, settings) {
        const modal = document.createElement('div');
        modal.className = 'sps-frame-wrap' + ((settings.sps_frame_mode || 'pip') === 'modal' ? ' sps-frame-modal-mode' : '');
        modal.innerHTML = `
            <div class="sps-frame">
                <div class="sps-frame-header">
                    <span class="sps-frame-title">CSStats</span>
                    <button class="sps-frame-ctrl sps-frame-back" title="返回上一页" disabled>‹</button>
                    <span class="sps-frame-controls">
                        <span class="sps-frame-zoom-wrap">
                            <button class="sps-frame-ctrl sps-frame-zoom" title="选择视口大小">80%</button>
                            <span class="sps-frame-zoom-panel" style="display:none;">
                                <button class="sps-frame-zoom-step" data-step="-5">−</button>
                                <input type="range" class="sps-frame-zoom-range" min="50" max="200" step="5" value="100">
                                <button class="sps-frame-zoom-step" data-step="5">+</button>
                                <span class="sps-frame-zoom-val">100%</span>
                            </span>
                        </span>
                        <button class="sps-frame-ctrl sps-frame-wide" title="按桌面宽度铺开（帧底边会出现左右滚动条）" aria-pressed="false">↔</button>
                        <button class="sps-frame-ctrl sps-frame-refresh" title="刷新">↻</button>
                        <button class="sps-frame-ctrl sps-frame-full" title="全屏覆盖标签页">⛶</button>
                        <button class="sps-frame-ctrl sps-frame-mode" title="切换 模态/画中画">⬒</button>
                        <button class="sps-frame-ctrl sps-frame-min" title="最小化（挂起保留内容）">—</button>
                        <a class="sps-frame-ctrl sps-frame-open" target="_blank" title="在新标签页打开（登录同理）">↗</a>
                        <button class="sps-frame-ctrl sps-frame-close" title="关闭">×</button>
                    </span>
                </div>
                <div class="sps-frame-body">
                    <div class="sps-frame-hint" style="opacity:0;">💡 检测到安全验证，请点右上角 ↗ 在新标签页完成验证，切回本页后会自动加载</div>
                    <div class="sps-frame-loader">📡 加载中...</div>
                    <div class="sps-frame-suggest" style="display:none;">⚠️ 加载失败（可能被目标站点拦截或需人机验证），请在新标签页打开 ↗</div>
                    <div class="sps-frame-viewport">
                        <div class="sps-frame-scaler">
                            <iframe class="sps-frame-iframe" allow="clipboard-write; fullscreen"></iframe>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        w.modal = modal;
        w.frame = modal.querySelector('.sps-frame');
        w.iframe = modal.querySelector('.sps-frame-iframe');
        w.viewport = modal.querySelector('.sps-frame-viewport');
        w.scaler = modal.querySelector('.sps-frame-scaler');
        w.loader = modal.querySelector('.sps-frame-loader');
        w.suggest = modal.querySelector('.sps-frame-suggest');
        w.hint = modal.querySelector('.sps-frame-hint');
        w.backBtn = modal.querySelector('.sps-frame-back');

        w.hint.addEventListener('click', () => {
            if (!w.hint.classList.contains('sps-frame-hint-action')) return;   
            openFrameTopLevel(w, '帧内无法完成人机验证');
        });

        const focusShim = document.createElement('div');
        focusShim.className = 'sps-frame-shim';
        w.viewport.appendChild(focusShim);
        w.frame.addEventListener('pointerdown', () => activateFrameWindow(w), true);
        w.frame.addEventListener('focusin', () => activateFrameWindow(w), true);
        focusShim.addEventListener('pointerdown', (e) => {
            e.stopImmediatePropagation();   
            w.frame.classList.remove('sps-frame-unfocused');
        }, true);

        const fw = Math.min(w.w, window.innerWidth * 0.8);
        const fh = Math.min(w.h, window.innerHeight * 0.8);
        w.w = fw;
        w.h = fh;
        w.frame.style.width = fw + 'px';
        w.frame.style.height = fh + 'px';
        w.frame.style.left = (window.innerWidth - fw - 24 - (frameWindows.size % 5) * 28) + 'px';
        w.frame.style.top = (48 + (frameWindows.size % 5) * 28) + 'px';
        applyFrameSize(w);

        w.iframe.addEventListener('load', () => {

            try { if (!w.iframe.src || w.iframe.src === 'about:blank') return; } catch (e0) {  }
            clearTimeout(w.loadTimer);
            w.loader.style.display = 'none';
            w.suggest.style.display = 'none';
            w.iframe.style.opacity = '1';
            w.challenged = false;
            if (w.hint) hideFrameHint(w);   

            if (w.innerW) { w.innerW = 0; w._layoutW = 0; applyFrameSize(w); }
            const openEl = w.modal && w.modal.querySelector('.sps-frame-open');
            
            if (openEl) openEl.href = w.lastNavUrl || w.openUrl;
            postToFrame(w, { op: 'hello' });
            setTimeout(() => { if (frameWindows.get(w.key) === w) postToFrame(w, { op: 'hello' }); }, 900);
        });

        let drag = false, sx = 0, sy = 0, ox = 0, oy = 0;
        const headerEl = modal.querySelector('.sps-frame-header');
        headerEl.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.sps-frame-ctrl') || e.target.closest('.sps-frame-zoom-panel')) return;
            drag = true;
            headerEl.setPointerCapture(e.pointerId);
            sx = e.clientX; sy = e.clientY;
            const r = w.frame.getBoundingClientRect();
            ox = r.left; oy = r.top;
            freezeIframe(w, true);
        });
        headerEl.addEventListener('pointermove', (e) => {
            if (!drag) return;

            const pos = spsClampPanelPos( (w.frame), ox + e.clientX - sx, oy + e.clientY - sy);
            w.frame.style.left = pos.left + 'px';
            w.frame.style.top = pos.top + 'px';
        });
        headerEl.addEventListener('pointerup', () => { drag = false; freezeIframe(w, false); });

        w._disposeResize = spsBindResize({
            target: w.frame, min: { w: 400, h: 300 }, frac: { w: 1, h: 1 }, margin: 4,
            accent: true,
            onResize: (box, phase) => {
                if (phase === 'start') { freezeIframe(w, true); return; }
                if (phase === 'end') { freezeIframe(w, false); return; }
                w.w = box.width;
                w.h = box.height;
                applyFrameSize(w);
            }
        });

        const zoomPanel = modal.querySelector('.sps-frame-zoom-panel');
        const zoomBtn = modal.querySelector('.sps-frame-zoom');
        const zoomRange = modal.querySelector('.sps-frame-zoom-range');
        const zoomVal = modal.querySelector('.sps-frame-zoom-val');
        const setZoom = (pct) => {
            pct = Math.max(50, Math.min(200, Math.round(pct)));
            w.zoom = pct / 100;
            zoomBtn.textContent = pct + '%';
            zoomVal.textContent = pct + '%';
            zoomRange.value = pct;
            applyFrameSize(w);
        };
        zoomBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const show = zoomPanel.style.display === 'none';
            if (show) setZoom(Math.round(w.zoom * 100));
            zoomPanel.style.display = show ? 'flex' : 'none';
        });
        zoomRange.addEventListener('input', (e) => {
            e.stopPropagation();
            setZoom(parseInt(zoomRange.value, 10) || 100);
        });
        zoomPanel.querySelectorAll('.sps-frame-zoom-step').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                setZoom((Math.round(w.zoom * 100)) + (parseInt(btn.dataset.step, 10) || 0));
            });
        });
        zoomPanel.addEventListener('click', (e) => e.stopPropagation());
        w._zoomClose = () => { if (zoomPanel.isConnected) zoomPanel.style.display = 'none'; };
        document.addEventListener('click', w._zoomClose);

        modal.querySelector('.sps-frame-back').addEventListener('click', (e) => {
            e.stopPropagation();
            postToFrame(w, { op: 'back' });
        });

        modal.querySelector('.sps-frame-refresh').addEventListener('click', () => {

            const now = Date.now();
            if (w._lastReload && now - w._lastReload < 1200) return;
            w._lastReload = now;

            autoReloadWithCookieFix(w, 'refresh_btn');
        });

        const fullBtn = modal.querySelector('.sps-frame-full');
        let savedW = 0, savedH = 0;
        fullBtn.addEventListener('click', () => {
            const fill = w.frame.classList.toggle('sps-frame-fill');

            if (!SPS_IS_CEF) {
                w.iframe.style.opacity = '0.2';
                setTimeout(() => { w.iframe.style.opacity = '1'; }, 450);
            }
            if (fill) {
                savedW = w.w; savedH = w.h;
                w.w = Math.max(400, window.innerWidth);
                w.h = Math.max(300, window.innerHeight);
                fullBtn.title = '退出全屏';
            } else {
                w.w = savedW; w.h = savedH;
                fullBtn.title = '全屏覆盖标签页';
                w.frame.style.left = Math.max(12, Math.round((window.innerWidth - w.w) / 2)) + 'px';
                w.frame.style.top = Math.max(12, Math.round((window.innerHeight - w.h) / 2)) + 'px';
                try { w.iframe.contentWindow.scrollTo(0, 0); } catch (e) {  }
            }
            applyFrameSize(w);
        });

        modal.querySelector('.sps-frame-mode').addEventListener('click', () => {
            modal.classList.toggle('sps-frame-modal-mode');
        });
        modal.addEventListener('click', (e) => {
            if (modal.classList.contains('sps-frame-modal-mode') && e.target === modal) {
                hideFrameWindow(w);
            }
        });

        modal.querySelector('.sps-frame-min').addEventListener('click', () => minimizeFrameWindow(w));

        w._onResize = () => {
            if (w.frame && w.frame.classList.contains('sps-frame-fill')) {
                w.w = Math.max(400, window.innerWidth);
                w.h = Math.max(300, window.innerHeight);
                applyFrameSize(w);
            }
        };
        window.addEventListener('resize', w._onResize);

        w._onVisible = () => {
            if (document.hidden) return;
            const showSuggest = w.suggest && w.suggest.style.display !== 'none';
            if (w.modal && (w.challenged || showSuggest)) {
                autoReloadWithCookieFix(w, 'visibilitychange');
            }
        };
        document.addEventListener('visibilitychange', w._onVisible);

        const wideBtn = modal.querySelector('.sps-frame-wide');
        const setWide = (on) => {
            w.wide = !!on;
            if (wideBtn) {
                wideBtn.classList.toggle('is-on', w.wide);
                wideBtn.setAttribute('aria-pressed', w.wide ? 'true' : 'false');
            }
            applyFrameSize(w);
        };
        w._setWide = setWide;
        wideBtn.addEventListener('click', (e) => { e.stopPropagation(); setWide(!w.wide); });

        modal.querySelector('.sps-frame-close').addEventListener('click', () => destroyFrameWindow(w));

        setZoom(Math.round(w.zoom * 100));
        applyFrameSize(w);

        return modal;
    }

    function freezeIframe(w, freeze) {
        w.iframe.style.pointerEvents = freeze ? 'none' : '';
    }

    function reloadFrame(w, url) {
        const f = w && w.iframe;
        if (!f) return;
        if (!SPS_IS_CEF) {
            f.src = 'about:blank';
            setTimeout(() => { if (w.iframe) w.iframe.src = url; }, 50);
            return;
        }
        f.src = url;                 
        f.remove();
        if (w.scaler) w.scaler.appendChild(f);
    }

    function openFrameTopLevel(w, why) {
        const target = String(w && (w.lastNavUrl || w.openUrl) || '');
        if (!/^https:\/\//i.test(target)) return false;
        if (SPS_IS_CEF) { showOpenFallback(target, w.name, why || '帧内无法完成人机验证'); return true; }
        try { chrome.runtime.sendMessage({ type: 'EMBED_OPEN_TAB', url: target }).catch(() => { }); }
        catch (e) { return false; }   
        return true;
    }

    function showFrameHint(w, text, action) {
        if (!w || !w.hint) return;
        w.hint.textContent = text;
        w.hint.classList.toggle('sps-frame-hint-action', !!action);
        w.hint.classList.remove('sps-frame-hint-hide');
        w.hint.style.opacity = '1';   
    }

    function hideFrameHint(w) {
        if (!w || !w.hint) return;
        w.hint.style.opacity = '0';
        w.hint.classList.add('sps-frame-hint-hide');
        w.hint.classList.remove('sps-frame-hint-action');
    }

    function postToFrame(w, msg) {
        try {
            const cw = w && w.iframe && w.iframe.contentWindow;
            if (!cw) return;
            let origin = '';
            try { origin = new URL(String(w.openUrl || '')).origin; } catch (e0) { origin = ''; }
            if (!origin || origin === 'null') return;
            msg.__spsFrameHost = 1;
            msg.hostOrigin = location.origin;
            cw.postMessage(msg, origin);
        } catch (e) {  }
    }

    function startFrameLoad(w, url) {
        if (w.loader) w.loader.style.display = 'flex';
        if (w.suggest) w.suggest.style.display = 'none';
        if (w.iframe && !SPS_IS_CEF) w.iframe.style.opacity = '0';   

        w.innerW = 0;
        w._layoutW = 0;
        if (w.backBtn) w.backBtn.disabled = true;

        hideFrameHint(w);
        clearTimeout(w.loadTimer);
        w.loadTimer = setTimeout(() => {
            if (frameWindows.get(w.key) !== w) return;   
            if (w.loader) w.loader.style.display = 'none';
            if (w.suggest) w.suggest.style.display = 'block';
        }, 8000);
        reloadFrame(w, url);
    }

    function applyFrameSize(w) {
        const headerH = w.frame.querySelector('.sps-frame-header').offsetHeight || 36;
        const vw = w.w;
        const vh = w.h - headerH;
        const z = w.zoom;
        const fitW = vw / z;
        let layoutW = Math.max(fitW, Number(w.innerW) || 0, w.wide ? SPS_FRAME_WIDE_BASE : 0);
        if (layoutW > SPS_FRAME_LAYOUT_CAP) layoutW = SPS_FRAME_LAYOUT_CAP;
        w._layoutW = layoutW;   
        const layoutH = vh / z;

        const sx = Math.max(z, vw / layoutW);
        w.viewport.style.width = vw + 'px';
        w.viewport.style.height = vh + 'px';
        
        w.scaler.style.width = Math.max(vw, Math.round(layoutW * sx)) + 'px';
        w.scaler.style.height = vh + 'px';
        w.iframe.style.width = layoutW + 'px';
        w.iframe.style.height = layoutH + 'px';
        w.iframe.style.transform = `scale(${sx})`;
        w.iframe.style.transformOrigin = 'top left';
    }

    function frameBridgeOnMessage(e) {
        const d = e && e.data;
        if (!d || d.__spsFrameBridge !== 1 || !e.source) return;
        for (const w of frameWindows.values()) {
            if (!w.iframe || e.source !== w.iframe.contentWindow) continue;
            if (d.op === 'metrics') {

                if (!w.bridgeSeen) {
                    w.bridgeSeen = true;
                    try { chrome.runtime.sendMessage({ type: 'EMBED_BRIDGE_READY', host: hostOf(w.openUrl) }).catch(() => { }); }
                    catch (e) {  }
                }
                const sw = Math.max(0, Number(d.sw) || 0);

                const desired = Math.min(SPS_FRAME_LAYOUT_CAP, Math.max(w.w / (w.zoom || 1), sw));
                if (Math.abs(desired - (Number(w._layoutW) || 0)) > 2) {
                    w.innerW = sw;
                    applyFrameSize(w);
                }
                if (w.backBtn) w.backBtn.disabled = !d.canBack;

                if (!d.blk) w.lastNavUrl = '';
            } else if (d.op === 'open') {

                const href = typeof d.href === 'string' ? d.href : '';
                if (!/^https:\/\//i.test(href) || hostOf(href) !== hostOf(w.openUrl)) return;
                w.lastNavUrl = href;
                try {
                    chrome.runtime.sendMessage({ type: 'EMBED_OPEN_TAB', url: href }).catch(() => { });
                } catch (e) {  }

                postToFrame(w, { op: 'open-ack' });
            } else if (d.op === 'verify') {

                w.challenged = true;
                const vVisible = !!(w.modal && w.modal.style.display !== 'none');
                if (vVisible && openFrameTopLevel(w, '帧内无法完成人机验证')) {
                    showFrameHint(w, SPS_IS_CEF
                        ? '🛡️ 人机验证要在顶层做 —— 已给出「在当前页打开」的入口'
                        : '🛡️ 人机验证已转到标签页 —— 在那里点 Try again 即可，验完切回本页会自动加载', false);
                }
                return;
            } else if (d.op === 'blocked') {

                const href = typeof d.href === 'string' ? d.href : '';
                const sameSite = /^https:\/\//i.test(href) && hostOf(href) === hostOf(w.openUrl);
                if (sameSite) {
                    w.lastNavUrl = href;
                    const open = w.modal && w.modal.querySelector('.sps-frame-open');
                    if (open) open.href = href;
                }
                w.challenged = true;

                showFrameHint(w, SPS_IS_CEF
                    ? '🛡️ 这一页被人机验证拦住（帧内无法验证）—— 点这里在当前页打开'
                    : '🛡️ 这一页被 Cloudflare 拦在 iframe 里 —— 点这里在标签页完成验证，回来点 ↻ 即可', true);

                if (!sameSite) w.lastNavUrl = '';
                const autoUrl = sameSite ? href : String(w.openUrl || '');
                
                const wVisible = !!(w.modal && w.modal.style.display !== 'none');
                if (wVisible && !SPS_IS_CEF && /^https:\/\//i.test(autoUrl)) {
                    try { chrome.runtime.sendMessage({ type: 'EMBED_OPEN_TAB', url: autoUrl, auto: true }).catch(() => { }); }
                    catch (e) {  }
                }
            }
            return;
        }
    }
    window.addEventListener('message', frameBridgeOnMessage);

    function openFrameWindow(siteKey, steamId, settings, customUrl) {
        const site = FRAME_SITES[siteKey];
        if (!site) return;
        const url = customUrl || site.url(steamId);
        if (!url || !/^https?:\/\//i.test(url)) return;   
        const key = siteKey + '_' + url;
        let w = frameWindows.get(key);
        if (w) {
            showFrameWindow(w);
            return;
        }
        w = {
            key, name: site.name, openUrl: url,
            modal: null, frame: null, iframe: null, viewport: null, scaler: null,
            loader: null, suggest: null, hint: null,
            zoom: 0.8, w: 680, h: 560,
            
            innerW: 0,

            lastNavUrl: '',
            
            wide: false,
            loadTimer: null, challenged: false,
            badge: null, backBtn: null,
            
            bridgeSeen: false,
            _zoomClose: null, _onResize: null, _onVisible: null, _disposeResize: null, _lastReload: 0
        };
        createFrameModal(w, settings);
        frameWindows.set(key, w);
        w.modal.querySelector('.sps-frame-title').textContent = site.name;
        w.modal.querySelector('.sps-frame-open').href = w.openUrl;
        w.modal.querySelector('.sps-frame-suggest-link')?.remove();

        const fHost = hostOf(w.openUrl);
        if (fHost) safeSendMessage({ type: 'EMBED_FIX_COOKIE', domain: fHost, url: w.openUrl }, (resp) => {
            if (frameWindows.get(key) !== w) return;   
            void resp;   
            startFrameLoad(w, w.openUrl);
        }, 3000);
        else startFrameLoad(w, w.openUrl);
        showFrameWindow(w);
    }

    function showFrameWindow(w) {
        if (w.badge) hideBadgeAt(w.badge);
        document.body.appendChild(w.modal);
        w.modal.style.display = 'block';
        activateFrameWindow(w);   
        w.frame.classList.remove('sps-frame-in');
        void w.frame.offsetWidth;   
        w.frame.classList.add('sps-frame-in');
    }

    function hideFrameWindow(w) {
        if (w.modal) w.modal.style.display = 'none';   
    }

    function minimizeFrameWindow(w) {
        hideFrameWindow(w);
        if (w.badge) { w.badge.remove(); w.badge = null; }
        const badge = document.createElement('button');
        badge.className = 'sps-frame-badge';
        document.body.appendChild(badge);
        badge.addEventListener('click', () => showFrameWindow(w));
        badge.textContent = w.name;
        w.badge = badge;
        showBadgeAt(badge);
    }

    function surfaceSeen(kind, id) {
        try { return document.documentElement.hasAttribute('data-sps-seen-' + kind + '-' + id); } catch (e) { return false; }
    }
    
    function markSurfaceSeen(kind, id) {
        try { document.documentElement.setAttribute('data-sps-seen-' + kind + '-' + id, '1'); } catch (e) {  }
    }

    function surfaceBadgeOf(kind, id) {
        return document.querySelector('.sps-frame-badge[data-surf="' + kind + ':' + id + '"]');
    }
    
    function showSurfaceBadge(kind, id, name) {
        if (!id) return;
        const exist = surfaceBadgeOf(kind, id);
        if (exist) { showBadgeAt(exist); return; }   
        const badge = document.createElement('button');
        badge.className = 'sps-frame-badge';
        badge.dataset.surf = kind + ':' + id;
        badge.textContent = kind === 'tab'
            ? String(name || 'CSStats') + ' · 已打开'   
            : String(name || 'CSStats');
        badge.title = kind === 'tab'
            ? 'CSStats 已在后台标签页打开 —— 点这里切过去'
            : 'CSStats 已在小窗打开（当前不在前台）—— 点这里切过去';
        badge.addEventListener('click', () => {

            const gone = () => hideSurfaceBadge(kind, id);
            try {
                chrome.runtime.sendMessage({ type: 'EMBED_SURFACE_FOCUS', kind, surfaceId: id })
                    .then((r) => { if (r && r.success === false) gone(); })
                    .catch(() => { });   
            } catch (e) {  }
        });
        document.body.appendChild(badge);
        showBadgeAt(badge);
    }
    
    function hideSurfaceBadge(kind, id) {
        const badge = surfaceBadgeOf(kind, id);
        if (!badge) return;
        badge.remove();
        layoutBadges();
    }

    function destroyFrameWindow(w) {
        spsUnregisterWindow(w.modal);   
        if (_spsFrameLastActive === w.modal) { _spsFrameLastActive = null; syncFrameFocusShims(); }
        clearTimeout(w.loadTimer);
        if (w._zoomClose) { document.removeEventListener('click', w._zoomClose); w._zoomClose = null; }
        if (w._disposeResize) { w._disposeResize(); w._disposeResize = null; }
        if (w._onResize) { window.removeEventListener('resize', w._onResize); w._onResize = null; }
        if (w._onVisible) { document.removeEventListener('visibilitychange', w._onVisible); w._onVisible = null; }
        if (w.badge) { w.badge.remove(); w.badge = null; layoutBadges(); }
        if (w.modal) w.modal.remove();
        frameWindows.delete(w.key);

        const goneHost = hostOf(w.openUrl);
        if (goneHost) {
            let stillOpen = false;
            for (const x of frameWindows.values()) if (hostOf(x.openUrl) === goneHost) { stillOpen = true; break; }
            if (!stillOpen && chrome.runtime && chrome.runtime.id) {
                try { chrome.runtime.sendMessage({ type: 'EMBED_COOKIE_RELEASE', domain: goneHost }).catch(() => { }); } catch (e) {  }
            }
        }
    }

    function autoReloadWithCookieFix(w, reason) {
        if (!w || !w.modal) return;
        console.log('[SPS] 自动重载嵌入页: ' + reason);
        w.challenged = false;

        const target = w.lastNavUrl || w.openUrl;
        const doReload = () => {
            if (frameWindows.get(w.key) !== w) return;
            startFrameLoad(w, target);
        };
        const host = hostOf(target);
        if (host) safeSendMessage({ type: 'EMBED_FIX_COOKIE', domain: host, url: target }, (resp) => {
            void resp;   
            doReload();
        }, 3000);
        else doReload();
    }

    function showOpenFallback(url, name, why) {
        if (!/^https:\/\//i.test(url)) return;
        const old = document.getElementById('sps-open-fallback');
        if (old) old.remove();
        const box = document.createElement('div');
        box.id = 'sps-open-fallback';
        box.className = 'sps-open-fallback';
        const txt = document.createElement('span');
        txt.className = 'sps-of-text';
        txt.textContent = '⚠️ ' + why + ' —— 可以在这里直接打开：';
        const go = document.createElement('button');
        go.className = 'sps-of-btn sps-of-go';
        go.textContent = '在当前页打开 ' + String(name || '');
        go.title = '把当前页导航到 ' + url + '（用浏览器返回键可以回来）';
        go.addEventListener('click', () => {
            box.remove();
            try { location.href = url; } catch (e) {  }
        });
        const copy = document.createElement('button');
        copy.className = 'sps-of-btn';
        copy.textContent = '复制链接';
        copy.addEventListener('click', () => {
            const done = () => { copy.textContent = '已复制'; };
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(done, () => { });
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = url;
                    ta.style.position = 'fixed';
                    ta.style.left = '-9999px';
                    document.body.appendChild(ta);
                    ta.select();
                    try { document.execCommand('copy'); done(); } catch (e2) {  }
                    ta.remove();
                }
            } catch (e) {  }
        });
        const close = document.createElement('button');
        close.className = 'sps-of-btn sps-of-x';
        close.textContent = '×';
        close.title = '关掉这条提示';
        close.addEventListener('click', () => box.remove());
        box.appendChild(txt);
        box.appendChild(go);
        box.appendChild(copy);
        box.appendChild(close);
        document.body.appendChild(box);
        setTimeout(() => { if (box.isConnected) box.remove(); }, 15000);
    }

    if (SPS_ACTIVE) document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-frame-site]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();

        const site = FRAME_SITES[btn.dataset.frameSite];
        const siteUrl = String(btn.dataset.frameUrl || (site ? site.url(String(btn.dataset.steamid || '')) : '') || '');
        if (!chrome.runtime || !chrome.runtime.id) {
            if (site && site.carrier) showOpenFallback(siteUrl, site.name, '当前浏览器没有可用的扩展 API');
            return;
        }

        let answered = false;
        const watchdog = SPS_IS_CEF && site && site.carrier
            ? setTimeout(() => {
                if (answered) return;
                answered = true;
                showOpenFallback(siteUrl, site.name, 'Steam 内置浏览器读不到设置，无法在这里新开页面');
            }, 900)
            : 0;
        chrome.storage.sync.get({ sps_frame_mode: 'pip', sps_csstats_carrier: 'frame', sps_frame_window_nofocus: true }, (s) => {
            if (answered) return;   
            answered = true;
            if (watchdog) clearTimeout(watchdog);
            
            const carrier = (site && site.carrier) ? String(s.sps_csstats_carrier || site.carrier) : 'frame';
            if (site && carrier === 'tab') { openSiteTab(site, btn); return; }
            if (site && carrier === 'window') { openSiteWindow(site, btn, s.sps_frame_window_nofocus !== false); return; }
            openFrameWindow(btn.dataset.frameSite, btn.dataset.steamid, s, btn.dataset.frameUrl || '');
        });
    });

    function openSiteTab(site, btn) {
        const id = String(btn.dataset.steamid || '');
        const url = String(btn.dataset.frameUrl || site.url(id) || '');
        if (!/^https:\/\//i.test(url)) return;

        const giveUp = () => showOpenFallback(url, site.name, '这里开不了新页面');
        
        let settled = false;
        const once = (fn) => { if (settled) return; settled = true; clearTimeout(guard); fn(); };
        const guard = setTimeout(() => once(giveUp), 3000);
        try {
            chrome.runtime.sendMessage({ type: 'EMBED_OPEN_BG_TAB', url, name: site.name })
                .then((resp) => {
                    
                    if (!resp || resp.success === false) {
                        return chrome.runtime.sendMessage({ type: 'EMBED_OPEN_TAB', url })
                            .then((r2) => { if (!r2 || r2.success === false) once(giveUp); else once(() => { }); })
                            .catch(() => once(giveUp));
                    }
                    once(() => { });
                    return null;
                })
                .catch(() => once(giveUp));
        } catch (e) { once(giveUp); }
    }

    function openSiteWindow(site, btn, nofocus) {
        const id = String(btn.dataset.steamid || '');
        const url = String(btn.dataset.frameUrl || site.url(id) || '');
        if (!/^https:\/\//i.test(url)) return;
        let left = 80, top = 80, winW = 780, winH = 660;
        try {
            const availW = Number(window.screen && window.screen.availWidth) || 1920;
            const availH = Number(window.screen && window.screen.availHeight) || 1080;

            winW = Math.max(360, Math.min(winW, availW - 32));
            winH = Math.max(320, Math.min(winH, availH - 48));
            const r = btn.getBoundingClientRect();
            
            const chromeH = Math.max(0, (Number(window.outerHeight) || 0) - (Number(window.innerHeight) || 0));
            left = Math.round((Number(window.screenX) || 0) + r.left);
            top = Math.round((Number(window.screenY) || 0) + chromeH + r.bottom + 8);
            
            left = Math.max(8, Math.min(left, availW - winW - 16));
            top = Math.max(8, Math.min(top, availH - winH - 16));
        } catch (e) {  }
        const toTab = () => {
            try {
                chrome.runtime.sendMessage({ type: 'EMBED_OPEN_TAB', url })
                    .then((r) => { if (!r || r.success === false) showOpenFallback(url, site.name, '这里开不了新页面'); })
                    .catch(() => showOpenFallback(url, site.name, '这里开不了新页面'));
            } catch (e) { showOpenFallback(url, site.name, '这里开不了新页面'); }
        };
        try {
            chrome.runtime.sendMessage({ type: 'EMBED_OPEN_WINDOW', url, left, top, width: winW, height: winH, name: site.name, focus: nofocus !== true })
                .then((resp) => { if (!resp || resp.success === false) toTab(); })
                .catch(toTab);
        } catch (e) { toTab(); }
    }

    if (SPS_ACTIVE) document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
        const el =  (e.target && e.target.closest ? e.target.closest('[role="button"][tabindex]') : null);
        if (!el || el.tagName === 'BUTTON' || el.tagName === 'A') return;
        if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;
        e.preventDefault();   
        el.click();
    });

    if (SPS_ACTIVE) chrome.runtime.onMessage.addListener((msg) => {
        if (!msg) return;
        if (msg.type === 'CF_CHALLENGE') {
            const cHost = hostOf(msg.url || '');
            for (const w of frameWindows.values()) {
                const wHost = hostOf(w.openUrl);
                if (cHost && !/cloudflare/i.test(cHost) && wHost !== cHost) continue;
                w.challenged = true;

                if (w.modal && w.modal.style.display !== 'none' && w.hint) {
                    showFrameHint(w, '🛡️ 这一页需要人机验证（iframe 里点不动）—— 点这里在标签页完成验证，回来自动加载', true);
                }
            }
        } else if (msg.type === 'CF_PASSED') {
            const pHost = hostOf(msg.url || '');
            for (const w of frameWindows.values()) {
                if (w.challenged && (!pHost || hostOf(w.openUrl) === pHost)) {
                    autoReloadWithCookieFix(w, 'cf_passed');
                }
            }
        } else if (msg.type === 'EMBED_FRAME_FAIL') {

            const fHost = hostOf(msg.url || '');
            const href = typeof msg.url === 'string' ? msg.url : '';
            for (const w of frameWindows.values()) {
                if (!fHost || hostOf(w.openUrl) !== fHost) continue;
                if (/^https:\/\//i.test(href)) w.lastNavUrl = href;
                const openEl = w.modal && w.modal.querySelector('.sps-frame-open');
                if (openEl && /^https:\/\//i.test(href)) openEl.href = href;
                if (w.hint) showFrameHint(w, '🛡️ ' + String(msg.reason || '这一页不允许被内嵌') + ' —— 点这里在标签页打开', true);
            }
        } else if (msg.type === 'EMBED_SURFACE_STATE') {

            const kind = msg.kind === 'tab' ? 'tab' : 'window';
            const id = Number(msg.surfaceId) || 0;
            if (!id) return;
            if (msg.state === 'hidden') {

                if (kind === 'tab' && surfaceSeen(kind, id)) return;
                showSurfaceBadge(kind, id, msg.name);
            } else {
                if (msg.state === 'visible') markSurfaceSeen(kind, id);
                hideSurfaceBadge(kind, id);
            }
        }
    });

