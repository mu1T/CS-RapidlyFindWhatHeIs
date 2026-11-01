var __S_content_csstats_sync_js=(function(){var T="JPbfzLWh5cPWdWdFTFckOwwDDub81taSqrmO3414eEJYUi4rShdqVkBtLikUAOD66IXGu6G/xJRifnNPRRViYXVcUCw7cRoD4b3zy8HpvqufnXcYw8yxoqzW1ilwU15OJiASQBzvus/OyKq+HMHLqbiLkG9gd1JaKDoiRhbt4rPZxKy2tIaSdz4WRjYqPQQV7P3w39mtpafFm2p/MEVdaRS9WEtxc2sfBicw1MTM5uCEkY+ptwbI9cDVzb4=",P=[137,108,0,181,61,83,37,160],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);


(function () {
    'use strict';

    let isTop = false;
    try { isTop = (window.top === window.self); } catch (e) { isTop = false; }
    if (!isTop) return;

    let path = '';
    try { path = String(window.location.pathname || ''); } catch (e) { path = ''; }
    const m = path.match(/\/player\/(\d{17})/);
    if (!m) return;
    const steamId = m[1];
    const isProfileUrl = (u) => typeof u === 'string' && (u.includes(__S_content_csstats_sync_js(0)) || u.includes(__S_content_csstats_sync_js(1)));
    const fallbackProfileUrl = __S_content_csstats_sync_js(2) + steamId;

    let isHealFlow = false;
    let isSilentMode = false;
    
    let healReturnUrl = '';
    
    let challengeSince = 0;
    let activateAsked = false;
    const ACTIVATE_AFTER_MS = 8000;   

    function askTabRole(attempts) {
        return new Promise((resolve) => {
            let done = false;
            
            const finish = (info) => {
                if (done) return;
                done = true;
                if (info || attempts <= 0) { resolve(info); return; }
                setTimeout(() => { askTabRole(attempts - 1).then(resolve); }, 250);
            };
            
            const watchdog = setTimeout(() => finish(null), 400);
            try {
                if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
                    clearTimeout(watchdog);
                    finish(null);
                    return;
                }
                chrome.runtime.sendMessage({ type: 'CSSTATS_TAB_ROLE' }, (resp) => {
                    void chrome.runtime.lastError;
                    clearTimeout(watchdog);
                    finish((resp && resp.success && resp.role)
                        ? { role: String(resp.role), returnUrl: String(resp.returnUrl || '') }
                        : null);
                });
            } catch (e) { clearTimeout(watchdog); finish(null); }
        });
    }

    function bootWithRole(info) {
        if (!info) return;
        if (info.role === 'heal') {
            isHealFlow = true;
            healReturnUrl = info.returnUrl;
        } else if (info.role === 'silent') {
            isSilentMode = true;
        } else {
            return;
        }
        start();
    }

    function claimCapture(sid) {
        return new Promise((resolve) => {
            try {
                if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) { resolve(null); return; }
                let done = false;
                const finish = (v) => { if (done) return; done = true; resolve(v); };
                const watchdog = setTimeout(() => finish(null), 400);
                let pageVisible = true;
                try { pageVisible = !document.visibilityState || document.visibilityState === 'visible'; } catch (e) { pageVisible = true; }
                chrome.runtime.sendMessage({ type: 'CSSTATS_CLAIM', steamId: sid, visible: pageVisible }, (resp) => {
                    void chrome.runtime.lastError;
                    clearTimeout(watchdog);
                    finish((resp && resp.success && resp.role) ? { role: String(resp.role), returnUrl: '' } : null);
                });
            } catch (e) { resolve(null); }
        });
    }

    askTabRole(2).then((info) => info || claimCapture(steamId)).then(bootWithRole);

    let hasSynced = false;
    let hasSyncedMatches = false;
    let prefetchedStatsHtml = '';
    let prefetchedMatchesHtml = '';
    let prefetchStarted = false;
    let prefetchMatchesStarted = false;
    
    let checkTimer = null;
    let pollCount = 0;
    const POLL_MS = 150;   
    const MAX_POLLS = 200; 
    
    let statsIdlePolls = 0;
    const STATS_BOUNCE_POLLS = 14;  
    const hashStr = String(window.location.hash || '');
    const searchStr = String(window.location.search || '');

    const isOnMatchesPage = () => {
        try { return /\/player\/\d{17}\/matches\/?$/i.test(String(window.location.pathname || '')); } catch (e) { return false; }
    };
    
    let isMatchesView = isOnMatchesPage() || hashStr.includes('matches') || searchStr.includes('matches');
    
    function refreshMatchesView() {
        try {
            const h = String(window.location.hash || '');
            const s = String(window.location.search || '');
            isMatchesView = isOnMatchesPage() || h.includes('matches') || s.includes('matches');
        } catch (e) {  }
        return isMatchesView;
    }

    function prefetchStats() {
        if (prefetchStarted) return;
        prefetchStarted = true;
        try {
            const sUrl = '/player/' + steamId + '/stats';
            fetch(sUrl, { credentials: 'include', headers: { [__S_content_csstats_sync_js(3)]: 'text/html' } })
                .then(res => res.ok ? res.text() : '')
                .then(text => {
                    if (text && (text.includes('kpd') || text.includes('stat-panel') || text.includes('stat-heading') || text.includes(__S_content_csstats_sync_js(4)))) {
                        prefetchedStatsHtml = text;
                        
                        if (!hasSynced && typeof document !== 'undefined' && document.querySelector && document.querySelector('#player-name, .rank-panel, .player-ident, .cs2rating, .rk-row')) {
                            performSync();
                        }
                    }
                }).catch(() => {});
        } catch (e) {  }
    }

    function prefetchMatches() {
        if (prefetchMatchesStarted) return;
        prefetchMatchesStarted = true;
        try {
            const mUrl = '/player/' + steamId + '/matches';
            fetch(mUrl, { credentials: 'include', headers: { [__S_content_csstats_sync_js(3)]: 'text/html' } })
                .then(res => res.ok ? res.text() : '')
                .then(text => {
                    if (text && (text.includes('match-list-outer') || text.includes('match-row') || text.includes('matches'))) {
                        prefetchedMatchesHtml = text;
                        if (isStatsDataReady()) {
                            performSync(true);
                        }
                    }
                }).catch(() => {});
        } catch (e) {  }
    }

    function findMatchTableElement() {
        if (typeof document === 'undefined' || !document.querySelector) return null;

        const preferred = ['#match-list-outer', '#match-history', '.match-list-outer', '[data-tab-content="matches"]', '#matches', '.match-list'];
        for (const sel of preferred) {
            const el = document.querySelector(sel);
            if (el && el.querySelector && el.querySelector('table, tbody tr, .match-row')) {
                return  (el);
            }
        }
        try {
            const tables = Array.from(document.querySelectorAll('table'));
            for (const tbl of tables) {
                const h = tbl.innerHTML.toLowerCase();
                if ((h.includes('date') || h.includes('日期')) && (h.includes('map') || h.includes('地图') || h.includes('score') || h.includes('比分'))) {
                    return  (tbl);
                }
            }
        } catch (e) {}
        return null;
    }

    function hasDomMatchRows() {
        const tbl = findMatchTableElement();
        if (!tbl) return false;
        return !!tbl.querySelector('tbody tr td, tr td, .match-row');
    }

    function tryActivateMatchesTab() {
        if (typeof document === 'undefined' || !document.querySelector) return;
        if (hasDomMatchRows()) return;
        
        if (isOnMatchesPage()) return;
        try {
            if (isMatchesView && (!window.location.hash || !window.location.hash.includes('matches'))) {
                try { window.location.hash = '#/matches'; } catch (e) {}
            }
            const tabs = Array.from(document.querySelectorAll('a, button, [role="tab"], li, [data-tab], [data-target], .content-sub-nav a'));
            const matchTab =  (tabs.find(el => {
                const href = (el.getAttribute('href') || '').toLowerCase();
                const target = (el.getAttribute('data-target') || '').toLowerCase();
                const dtab = (el.getAttribute('data-tab') || '').toLowerCase();
                const txt = (el.textContent || '').trim().toLowerCase();
                if (href === __S_content_csstats_sync_js(5) || href === '/match') return false;
                return href.includes('#/matches') || href.includes('#matches') || href.endsWith('/matches')
                    || target.includes('matches') || dtab.includes('matches')
                    || txt === 'matches' || txt === '比赛' || txt === '战绩' || txt === '对局';
            }));
            if (matchTab) {

                const clickable =  (
                    matchTab.querySelector('[role="tab"], a, button, span[onclick]') || matchTab
                );
                try {
                    if (typeof clickable.click === 'function') clickable.click();
                } catch (e) {}
                try {
                    clickable.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                } catch (e) {}
            }
        } catch (e) {  }
    }

    function isElementVisible(el) {
        if (!el) return false;
        try {
            
            const anyEl = el;
            if (anyEl.offsetParent !== null) return true;
            if (anyEl.offsetWidth > 0 || anyEl.offsetHeight > 0) return true;
            const style = window.getComputedStyle(el);
            return style && style.display !== 'none' && style.visibility !== 'hidden';
        } catch (e) {
            return false;
        }
    }

    function isCloudflareChallenged() {
        const title = (document.title || '').toLowerCase();
        if (title.includes('just a moment') || title.includes('attention required')) return true;
        if (document.querySelector('#cf-challenge, #challenge-form, #cf-wrapper, .cf-browser-verification')) return true;
        return false;
    }

    function showNoticeBanner(msg) {
        try {
            let banner = document.getElementById(__S_content_csstats_sync_js(6));
            if (!banner) {
                banner = document.createElement('div');
                banner.id = __S_content_csstats_sync_js(6);
                banner.style.cssText = [
                    'position: fixed',
                    'top: 16px',
                    'left: 50%',
                    'transform: translateX(-50%)',
                    'z-index: 2147483647',
                    'background: rgba(18, 24, 38, 0.96)',
                    'border: 1px solid #3b82f6',
                    'box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 12px rgba(59,130,246,0.3)',
                    'border-radius: 8px',
                    'padding: 12px 20px',
                    'display: flex',
                    'align-items: center',
                    'gap: 14px',
                    'color: #ffffff',
                    'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    'font-size: 13px',
                    'line-height: 1.4'
                ].join(';');
                document.body.appendChild(banner);
            }
            banner.innerHTML = `
                <div style="font-size:18px;color:#3b82f6;line-height:1;">ℹ</div>
                <div>
                    <div style="font-weight:600;color:#e2e8f0;margin-bottom:2px;">CS2 Profile Stats 提示</div>
                    <div style="color:#94a3b8;font-size:12px;">${msg}</div>
                </div>
            `;
        } catch (e) {  }
    }

    function isNotFoundPage() {
        
        let currentPath = '';
        try {
            currentPath = (typeof window !== 'undefined' && window.location && typeof window.location.pathname === 'string')
                ? window.location.pathname
                : '';
        } catch (e) { currentPath = ''; }
        if (currentPath.includes('/stats')) return false;

        let pageTitle = '';
        try {
            pageTitle = (typeof document !== 'undefined' && typeof document.title === 'string') ? document.title : '';
        } catch (e) { pageTitle = ''; }
        if (/404|not found/i.test(pageTitle)) return true;

        try {
            const h1 = (typeof document !== 'undefined' && document.querySelector) ? document.querySelector('h1') : null;
            if (h1 && /404|not found/i.test(h1.textContent || '') && isElementVisible(h1)) return true;
        } catch (e) {  }
        return false;
    }

    function isStatsLanding404() {
        try {
            if (/404|not found/i.test(String(document.title || ''))) return true;
            const h1 = (typeof document.querySelector === 'function') ? document.querySelector('h1') : null;
            return !!(h1 && /404|not found/i.test(h1.textContent || ''));
        } catch (e) { return false; }
    }

    function isStatsDataReady() {
        if (isCloudflareChallenged()) return false;

        const loginReq = document.querySelector('#player-login-required');
        if (loginReq && isElementVisible(loginReq)) return true;

        const rateLimited = document.querySelector('#player-rate-limited');
        if (rateLimited && isElementVisible(rateLimited)) return true;

        const outerH1 = document.querySelector('#outer-wrapper h1');
        if (outerH1 && /private profile/i.test(outerH1.textContent || '') && isElementVisible(outerH1)) return true;

        if (isNotFoundPage()) return true;

        const gateDiv = document.querySelector('#player-stats-gate');
        if (gateDiv && isElementVisible(gateDiv)) {
            showNoticeBanner("请点击页面中的「Load stats」按钮以加载统计数据");
            return false;
        }

        const hasBaseProfile = !!document.querySelector('#player-name, .rank-panel, .player-ident, .cs2rating, .rk-row, .content-sub-nav, #kpd, #rating');
        if (!hasBaseProfile) {
            return false;
        }

        const preStats = (typeof prefetchedStatsHtml !== 'undefined') ? prefetchedStatsHtml : '';
        const hasPrefetchedStats = !!(preStats && (preStats.includes('kpd') || preStats.includes('stat-panel') || preStats.includes('stat-heading')));
        const isMatchFlow = (typeof isMatchesView !== 'undefined')
            ? isMatchesView
            : (typeof window !== 'undefined' && window.location && ((window.location.hash || '').includes('matches') || (window.location.search || '').includes('matches')));
        const preMatches = (typeof prefetchedMatchesHtml !== 'undefined') ? prefetchedMatchesHtml : '';
        const currentPolls = (typeof pollCount !== 'undefined') ? pollCount : 0;

        if (hasPrefetchedStats) {
            return true;
        }

        if (isMatchFlow) {
            const hasMatchRows = (typeof hasDomMatchRows === 'function') ? hasDomMatchRows() : (!!document.querySelector('#match-list-outer tbody tr td, #match-list-outer .table tr td, .match-row') || !!preMatches);
            const hasEmptyNotice = !!document.querySelector('.no-matches, #no-matches');
            if (!hasMatchRows && !hasEmptyNotice && currentPolls < 20) {
                if (typeof tryActivateMatchesTab === 'function') tryActivateMatchesTab();
                return false;
            }
        }

        const loadingSec = document.querySelector('#player-loading-section');
        if (loadingSec) {
            if (loadingSec.classList.contains('loading') || loadingSec.querySelector('.stats-skeleton')) {
                return false;
            }
        }

        const hasStatsNodes = !!document.querySelector('#kpd, #rating, .stat-panel, .stat-heading, .maps-body, [data-name], #match-list-outer, .match-row');
        if (hasStatsNodes) {
            if (isMatchFlow) {
                const hasMatchRows = (typeof hasDomMatchRows === 'function') ? hasDomMatchRows() : (!!document.querySelector('#match-list-outer tbody tr td, #match-list-outer .table tr td, .match-row') || !!preMatches);
                if (!hasMatchRows && currentPolls < 20) {
                    if (typeof tryActivateMatchesTab === 'function') tryActivateMatchesTab();
                    return false;
                }
            }
            return true;
        }

        if (loadingSec && loadingSec.innerHTML && !loadingSec.querySelector('.stats-skeleton')) {
            const inner = loadingSec.innerHTML.toLowerCase();
            if (inner.includes('kpd') || inner.includes('stat-heading') || inner.includes('stat-panel') || inner.includes('maps-body') || inner.includes('win rate')) {
                return true;
            }
        }

        return false;
    }

    function showSyncBanner() {
        try {
            let banner = document.getElementById(__S_content_csstats_sync_js(6));
            if (banner) {
                banner.remove();
            }
            banner = document.createElement('div');
            banner.id = __S_content_csstats_sync_js(6);
            banner.style.cssText = [
                'position: fixed',
                'top: 16px',
                'left: 50%',
                'transform: translateX(-50%)',
                'z-index: 2147483647',
                'background: rgba(18, 24, 38, 0.96)',
                'border: 1px solid #4caf50',
                'box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 12px rgba(76,175,80,0.3)',
                'border-radius: 8px',
                'padding: 12px 20px',
                'display: flex',
                'align-items: center',
                'gap: 14px',
                'color: #ffffff',
                'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                'font-size: 13px',
                'line-height: 1.4'
            ].join(';');

            let countdown = 1;
            banner.innerHTML = `
                <div style="font-size:18px;color:#4caf50;line-height:1;">✓</div>
                <div>
                    <div style="font-weight:600;color:#e2e8f0;margin-bottom:2px;">CS2 Profile Stats 验证成功</div>
                    <div style="color:#94a3b8;font-size:12px;">数据已同步至插件，正在返回 Steam 资料页… (<span id="sps-sync-sec" style="color:#4caf50;font-weight:600;">1</span>s)</div>
                </div>
                <button id="sps-sync-back" style="background:#22c55e;color:#0f172a;border:none;border-radius:4px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;margin-left:6px;">立即返回</button>
                <button id="sps-sync-cancel" style="background:transparent;color:#94a3b8;border:1px solid #475569;border-radius:4px;padding:5px 10px;font-size:12px;cursor:pointer;">留在此页</button>
            `;

            document.body.appendChild(banner);

            const backBtn = banner.querySelector('#sps-sync-back');
            const cancelBtn = banner.querySelector('#sps-sync-cancel');
            const secSpan = banner.querySelector('#sps-sync-sec');

            const doReturn = () => {
                
                const returnUrl = healReturnUrl;

                let backTriggered = false;
                try {
                    if (window.history && window.history.length > 1) {
                        backTriggered = true;
                        window.history.back();
                    }
                } catch (e) { backTriggered = false; }

                setTimeout(() => {
                    if (isProfileUrl(returnUrl)) {
                        try {
                            window.location.replace(returnUrl);
                            return;
                        } catch (e) {  }
                    }

                    try {
                        if (isProfileUrl(document.referrer)) {
                            window.location.replace(document.referrer);
                            return;
                        }
                    } catch (e) {  }

                    if (fallbackProfileUrl) {
                        try {
                            window.location.replace(fallbackProfileUrl);
                            return;
                        } catch (e) {  }
                    }

                    try {
                        if (window.history && window.history.length > 1) {
                            window.history.back();
                            return;
                        }
                    } catch (e) {  }
                    try {
                        window.history.back();
                    } catch (e) {
                        try {
                            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                                chrome.runtime.sendMessage({ type: 'CLOSE_CURRENT_TAB' });
                            }
                        } catch (e2) {  }
                        try { window.close(); } catch (e2) {  }
                    }
                }, backTriggered ? 350 : 0);
            };

            if (backBtn) backBtn.addEventListener('click', doReturn);

            let timerId = null;
            if (cancelBtn) cancelBtn.addEventListener('click', () => {
                if (timerId) clearTimeout(timerId);
                banner.remove();
            });

            timerId = setTimeout(() => {
                if (secSpan) secSpan.textContent = '0';
                doReturn();
            }, 500);
        } catch (e) {  }
    }

    async function performSync(forceSupplemental = false) {
        if (hasSynced && !forceSupplemental) return;

        const dataReady = isStatsDataReady();
        if (!dataReady && !forceSupplemental && pollCount < MAX_POLLS) {
            return;
        }

        const currentHtml = document.documentElement ? document.documentElement.outerHTML : '';
        const isStatsPage = window.location.pathname.includes('/stats');

        let profileHtml = isStatsPage ? '' : currentHtml;
        let statsHtml = '';

        if (isStatsPage) {
            
            statsHtml = currentHtml;
            
            try {
                const pUrl = '/player/' + steamId;
                const pRes = await fetch(pUrl, { credentials: 'include', headers: { Accept: 'text/html' } });
                if (pRes.ok) {
                    const pText = await pRes.text();
                    if (pText.includes('rank-panel') || pText.includes('cs2rating') || pText.includes('rk-row')) {
                        profileHtml = pText;
                    }
                }
            } catch (e) {  }
            if (!profileHtml) profileHtml = currentHtml;
        } else {

            if (isOnMatchesPage() && !/rank-panel|cs2rating|rk-row/.test(currentHtml)) {
                try {
                    const pRes = await fetch('/player/' + steamId, { credentials: 'include', headers: { Accept: 'text/html' } });
                    if (pRes.ok) {
                        const pText = await pRes.text();
                        if (pText.includes('rank-panel') || pText.includes('cs2rating') || pText.includes('rk-row')) {
                            profileHtml = pText;
                        }
                    }
                } catch (e) {  }
            }
            
            const statsSec = document.querySelector('#player-loading-section');
            if (statsSec && !statsSec.classList.contains('loading') && !statsSec.querySelector('.stats-skeleton')) {
                const secHtml = statsSec.innerHTML;
                if (secHtml.includes('kpd') || secHtml.includes('rating') || secHtml.includes('stat-panel') || secHtml.includes('stat-heading') || secHtml.includes('maps-body')) {
                    statsHtml = secHtml;
                }
            }

            if (!statsHtml || (!statsHtml.includes('kpd') && !statsHtml.includes('stat-panel') && !statsHtml.includes('stat-heading'))) {
                if (prefetchedStatsHtml && (prefetchedStatsHtml.includes('kpd') || prefetchedStatsHtml.includes('stat-panel') || prefetchedStatsHtml.includes('stat-heading') || prefetchedStatsHtml.includes(__S_content_csstats_sync_js(4)))) {
                    statsHtml = prefetchedStatsHtml;
                } else {
                    try {
                        const sUrl = '/player/' + steamId + '/stats';
                        const res = await fetch(sUrl, { credentials: 'include', headers: { Accept: 'text/html' } });
                        if (res.ok) {
                            const text = await res.text();
                            if (text.includes('kpd') || text.includes('rating') || text.includes('stat-panel') || text.includes('stat-heading') || text.includes(__S_content_csstats_sync_js(4))) {
                                statsHtml = text;
                            }
                        }
                    } catch (e) {
                        
                    }
                }
            }
        }

        try {
            const matchOuterEl = (typeof findMatchTableElement === 'function') ? findMatchTableElement() : document.querySelector('#match-list-outer');
            if (matchOuterEl) {
                const outerH = matchOuterEl.outerHTML || '';
                
                if (outerH && (!statsHtml || !statsHtml.includes(outerH.slice(0, 30)))) {
                    statsHtml = (statsHtml || '') + '\n' + outerH;
                }
                if (matchOuterEl.querySelector('tbody tr td, tr td, .match-row')) {
                    hasSyncedMatches = true;
                }
            }
            if (!hasSyncedMatches && prefetchedMatchesHtml) {
                if (!statsHtml || !statsHtml.includes(prefetchedMatchesHtml.slice(0, 30))) {
                    statsHtml = (statsHtml || '') + '\n' + prefetchedMatchesHtml;
                }

                if (/<tbody[\s\S]*?<tr[\s\S]*?<td/i.test(prefetchedMatchesHtml) || /class="[^"]*\bmatch-row\b/i.test(prefetchedMatchesHtml)) {
                    hasSyncedMatches = true;
                }
            }
        } catch (e) {  }

        const isNotFound = isNotFoundPage();
        const isPrivate = (document.querySelector('#player-login-required') && isElementVisible(document.querySelector('#player-login-required')))
            || (document.querySelector('#player-rate-limited') && isElementVisible(document.querySelector('#player-rate-limited')))
            || (document.querySelector('#outer-wrapper h1') && /private profile/i.test(document.querySelector('#outer-wrapper h1')?.textContent || '') && isElementVisible(document.querySelector('#outer-wrapper h1')))
            || isNotFound;

        const hasBasicStats = !!(statsHtml && (statsHtml.includes('kpd') || statsHtml.includes('stat-panel') || statsHtml.includes('stat-heading') || statsHtml.includes('maps-body') || statsHtml.includes(__S_content_csstats_sync_js(4)) || statsHtml.includes('match-list-outer')));

        if (!isPrivate && !hasBasicStats && pollCount < MAX_POLLS) {
            return;
        }

        hasSynced = true;
        if (hasSyncedMatches || !isMatchesView || pollCount >= MAX_POLLS) {
            if (checkTimer) { clearInterval(checkTimer); checkTimer = null; }
        }

        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                    type: 'CSSTATS_PAGE_SYNC',
                    steamId: steamId,
                    profileHtml: profileHtml,
                    statsHtml: statsHtml
                }, (resp) => {
                    void chrome.runtime.lastError;
                    if (resp && resp.success && isHealFlow) {
                        if (!isMatchesView || hasSyncedMatches || pollCount >= 24) {
                            showSyncBanner();
                        }
                    } else if (resp && resp.success && isSilentMode && activateAsked) {
                        
                        showNoticeBanner('已同步，正在关闭标签页…');
                    }
                });
            }
        } catch (e) {  }
    }

    function requestForeground() {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({ type: __S_content_csstats_sync_js(7) }, () => {
                    void chrome.runtime.lastError;
                });
            }
        } catch (e) {  }
        showNoticeBanner('请完成人机验证，通过后会自动继续');
    }

    function check() {
        pollCount++;
        refreshMatchesView();

        if (isSilentMode) {
            if (isCloudflareChallenged()) {
                if (!challengeSince) challengeSince = Date.now();
                if (!activateAsked && Date.now() - challengeSince >= ACTIVATE_AFTER_MS) {
                    activateAsked = true;
                    requestForeground();
                }
            } else {
                challengeSince = 0;
            }
        }

        if (window.location.pathname.includes('/stats')) {
            const hasRealStatsDom = !!document.querySelector('#kpd, #rating, .stat-panel, .stat-heading');
            if (isCloudflareChallenged() || hasRealStatsDom || !isStatsLanding404()) {
                statsIdlePolls = 0;
            } else if (++statsIdlePolls >= STATS_BOUNCE_POLLS) {
                try {
                    if (checkTimer) { clearInterval(checkTimer); checkTimer = null; }

                    window.location.replace('/player/' + steamId);
                    return;
                } catch (e) {  }
            }
        }

        if (!isCloudflareChallenged() && !window.location.pathname.includes('/stats')) {
            const hasBase = typeof document !== 'undefined' && document.querySelector && !!document.querySelector('#player-name, .rank-panel, .player-ident, .cs2rating, .rk-row');
            if (hasBase) {
                prefetchStats();
                if (isMatchesView) {
                    prefetchMatches();
                    tryActivateMatchesTab();
                }
            }
        }

        if (hasSynced && !hasSyncedMatches && isMatchesView) {
            tryActivateMatchesTab();
            const hasMatchRows = (typeof hasDomMatchRows === 'function') ? hasDomMatchRows() : (!!document.querySelector('#match-list-outer tbody tr td, #match-list-outer .table tr td, .match-row') || !!prefetchedMatchesHtml);
            if (hasMatchRows) {
                performSync(true);
                return;
            }
        }

        if (isStatsDataReady()) {
            performSync();
        } else if (pollCount >= MAX_POLLS) {
            
            performSync();
        }
    }

    function start() {
        
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            check();
        } else {
            window.addEventListener('DOMContentLoaded', check, { once: true });
        }

        checkTimer = setInterval(check, POLL_MS);

        try {
            window.addEventListener('hashchange', () => { refreshMatchesView(); check(); });
            window.addEventListener('popstate', () => { refreshMatchesView(); check(); });
        } catch (e) {  }

        try {
            const attachObserver = () => {
                const target = (typeof document !== 'undefined') ? (document.documentElement || document.body || document) : null;
                if (!target || typeof target.nodeType === 'undefined') return;
                const observer = new MutationObserver(() => {
                    if (!hasSynced) {
                        if (!prefetchStarted && !isCloudflareChallenged() && !window.location.pathname.includes('/stats')) {
                            if (document.querySelector && document.querySelector('#player-name, .rank-panel, .player-ident, .cs2rating, .rk-row')) {
                                prefetchStats();
                                if (isMatchesView) {
                                    prefetchMatches();
                                    tryActivateMatchesTab();
                                }
                            }
                        }
                        if (isStatsDataReady()) {
                            performSync();
                            if (hasSyncedMatches || !isMatchesView) observer.disconnect();
                        }
                    } else if (!hasSyncedMatches && isMatchesView) {
                        tryActivateMatchesTab();
                        const hasMatchRows = (typeof hasDomMatchRows === 'function') ? hasDomMatchRows() : (!!document.querySelector('#match-list-outer tbody tr td, #match-list-outer .table tr td, .match-row') || !!prefetchedMatchesHtml);
                        if (hasMatchRows) {
                            performSync(true);
                            observer.disconnect();
                        }
                    }
                });
                observer.observe(target, { childList: true, subtree: true });
            };
            if (typeof document !== 'undefined' && (document.documentElement || document.body)) {
                attachObserver();
            } else if (typeof document !== 'undefined' && document.addEventListener) {
                document.addEventListener('readystatechange', attachObserver, { once: true });
            }
        } catch (e) {  }
    }
})();
