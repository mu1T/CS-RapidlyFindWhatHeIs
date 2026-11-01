var __S_content_pw_js=(function(){var T="Fe3by+iiqMGUbj5ESE4mPQ1DH+H0xRogIRYfRqa51MfK5KDX35F5fwoAD3xpSQD26hXL3/P3iZGLv6pPTkhqfgcVCSs+yMIkXzAlLhhCqr3s2NynvoOCl2phT0dPMXsBABGm5tHf26O7gYLRCNrLuKmVyS8iCLu5lN6QZXNB",P=[22,108,71,117,49,0],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);
    

    function pwBanBadgeInfo(banData, txt) {
        if (!banData || !banData.success || !Array.isArray(banData.records)) return null;
        const active = banData.records.filter(r => r.active);
        if (!active.length) return { cls: 'ok', label: txt.pw_ban_badge_ok, tip: txt.pw_ban_ok_tip };
        const pac = active.find(r => r.pac);
        if (pac) return { cls: 'pac', label: txt.pw_ban_badge_pac, tip: txt.pw_ban_pac_tip };
        const tmp = active[0];
        return {
            cls: 'tmp',
            label: txt.pw_ban_badge_tmp,
            tip: txt.pw_ban_tmp_tip(tmp.begin || '—', tmp.end || '—')
        };
    }

    function pwBanDetailTip(banData, txt) {
        if (!banData || !banData.success || !Array.isArray(banData.records)) return txt.pw_ban_fetch_fail;
        if (!banData.records.length) return txt.pw_ban_ok_tip;
        const typeLabel = (t) => PW_FORBID_TYPE_ZH[t] || `${txt.pw_ban_unknown_type}(${t || '?'})`;
        return banData.records.map(r => {
            const state = r.active ? (r.pac ? txt.pw_ban_badge_pac : txt.pw_ban_badge_tmp) : txt.pw_ban_expired_note;
            return `${typeLabel(r.forbidType)} · ${state}\n${txt.pw_ban_tmp_tip(r.begin || '—', r.end || '—')}`;
        }).join('\n');
    }

    function pwBanBadgeHtml(banData, txt) {
        const info = pwBanBadgeInfo(banData, txt);
        if (!info) return '';
        return `<span class="sps-pw-ban-badge sps-pw-ban-${info.cls}"${spsTipAttr(pwBanDetailTip(banData, txt))}>${esc(info.label)}</span>`;
    }

    const PW_FORBID_TYPE_ZH = {
        '1': '外挂作弊', '2': '消极比赛', '3': '谩骂侮辱', '4': '挂机', '5': '骚扰',
        '6': '传播违规信息', '7': '数据异常', '8': '破坏游戏秩序', '9': '恶意伤害队友',
        '10': '小号炸鱼', '11': '黑号', '12': '战绩异常', '100': '硬件指纹封禁',
        '13':'硬件异常','14': '信誉分过低'
    };

    function pwBanReasonTip(banData, txt) {
        if (!banData || !banData.success || !Array.isArray(banData.records)) return txt.pw_ban_fetch_fail;
        const active = banData.records.filter(r => r.active);
        if (!active.length) return txt.pw_ban_ok_tip;
        const typeLabel = (t) => PW_FORBID_TYPE_ZH[t] || `${txt.pw_ban_unknown_type}(${t || '?'})`;
        return active.map(r => r.pac ? txt.pw_ban_pac_tip : typeLabel(r.forbidType)).join('\n');
    }

    function autoFetchPWBanStatus(steamID, settings, txt, titleHeader) {
        if (!settings.sps_show_pw) return;
        safeSendMessage({ type: 'FETCH_PW_BAN', steamId: steamID }, (res) => {
            if (!chrome.runtime || !chrome.runtime.id) return;   
            const banData = res && res.success ? res.data : null;
            const info = pwBanBadgeInfo(banData, txt);
            if (!info) return;   
            const cls = info.cls;   
            const btn = document.querySelector('.sps-header-tool.btn-pw');
            if (btn) btn.title = `${txt.pw_btn} · ${info.label}`;
            document.querySelectorAll('.sps-native-btn-pw, .btn-pw.sps-btn:not(.sps-header-tool):not(.sps-native-btn-pw)').forEach(b => {
                b.title = `${b.textContent || txt.pw_btn} · ${info.label}`;
            });
            if (cls !== 'ok' && titleHeader && !titleHeader.querySelector('.sps-pw-ban-flag')) {   
                const flag = document.createElement('span');
                flag.className = 'sps-pw-ban-flag sps-pw-ban-' + cls;
                flag.textContent = cls === 'pac' ? txt.pw_ban_badge_pac : txt.pw_ban_badge_tmp;
                spsSetTip(flag, pwBanReasonTip(banData, txt));
                titleHeader.appendChild(flag);
            }
            addDebugLog('pw', `ban=${cls} steamid=${steamID}`);
        }, 15000);
    }

    function bindPWButton(steamID, settings) {
        if (!settings.sps_show_pw) return;
        
        function attachPWClick() {
            document.querySelectorAll('.btn-pw').forEach(btn => {
                if (btn._pwBound) return;
                btn._pwBound = true;
                const sid = btn.dataset.steamid || steamID;
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!chrome.runtime || !chrome.runtime.id) return;   
                    openPWModal(sid, settings);
                });
            });
        }
        attachPWClick();
        const obs = new MutationObserver(() => attachPWClick());
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => obs.disconnect(), 10000);
    }

    let _pwActiveClose = null;

    function openPWModal(steamId, settings) {
        const txt = I18N[settings.sps_language] || I18N.zh;
        const isZh = txt.region === '地区';
        
        const canSearch = settings.sps_pw_search !== false;
        if (_pwActiveClose) _pwActiveClose();   
        else {

            document.querySelector('.sps-pw-modal:not(.sps-f5e-modal)')?.remove();
            document.querySelector('.sps-pw-badge:not(.sps-f5e-badge)')?.remove();
            _pwClearDoc();
        }

        const modal = document.createElement('div');
        modal.className = 'sps-pw-modal';
        const cornerVal = settings.sps_corner_style === 'sharp' ? '2px' : '12px';
        const cStyle = (settings.sps_container_style || 'auto');
        const panelBgCls = cStyle === 'solid' ? ' sps-pw-solid' : (cStyle === 'glass' ? ' sps-pw-glass' : '');

        const isFrameModal = (settings.sps_frame_mode || 'pip') === 'modal';
        modal.className = 'sps-pw-modal' + (isFrameModal ? '' : ' sps-pw-pip-mode');
        modal.innerHTML = `<div class="sps-pw-overlay"></div>
            <div class="sps-pw-panel${panelBgCls}" style="--sps-corner:${cornerVal};">
                <div class="sps-pw-header"><span class="sps-pw-header-title">${txt.pw_title}</span><span class="sps-pw-header-actions"><button type="button" class="sps-frame-ctrl sps-f5e-setme sps-pw-setme" title="${isZh ? '把当前资料页设为我（比赛详情里高亮）' : 'Set current profile as me (highlight in match details)'}">★</button><button class="sps-frame-ctrl sps-pw-refresh" title="${isZh ? '刷新（清除缓存重新查询）' : 'Refresh (clear cache)'}">↻</button><button class="sps-frame-ctrl sps-pw-min" title="${isZh ? '最小化（挂起保留数据）' : 'Minimize'}">—</button><button class="sps-frame-ctrl sps-pw-close">&times;</button></span></div>
                <div class="sps-pw-body">
                    ${canSearch ? `<div class="sps-pw-search-row">
                        <input type="text" class="sps-pw-search-input" placeholder="${isZh ? '输入昵称搜索...' : 'Search by nickname...'}">
                        <button class="sps-pw-search-btn">${isZh ? '搜索' : 'Search'}</button>
                    </div>
                    <div class="sps-pw-search-results" style="display:none;"></div>` : ''}
                    <div class="sps-pw-result-area"><div class="sps-pw-loading">${isZh ? '📡 读取中...' : '📡 Loading...'}</div></div>
                </div>
            </div>`;
        document.body.appendChild(modal);

        spsFocusWindow(modal);
        document.dispatchEvent(new CustomEvent('sps-window-focus', { detail: { el: modal } }));
        document._pwDragging = false;
        document._pwClosing = false;

        const pwSetMe = modal.querySelector('.sps-pw-setme');
        if (pwSetMe) {
            pwSetMe.addEventListener('click', ( e) => {
                e.stopPropagation();
                const sid = String(steamId || '');
                if (!/^7656\d{13}$/.test(sid)) {
                    pwSetMe.title = isZh ? '当前资料页 SteamID 无效' : 'Invalid SteamID';
                    return;
                }
                spsWriteAccountId(SPS_PW_MY_SID_KEY, sid, ( ok) => {
                    pwSetMe.classList.toggle('on', ok);
                    pwSetMe.title = ok ? (isZh ? '已设为我：' + sid : 'Set as me: ' + sid) : (isZh ? '设置失败（存储未生效）' : 'Failed (not stored)');
                });
            });
            spsReadAccountId([SPS_PW_MY_SID_KEY, 'sps_my_steamid'], ( sid) => {
                if (!modal.isConnected || !sid) return;
                if (sid === String(steamId || '')) {
                    pwSetMe.classList.add('on');
                    pwSetMe.title = isZh ? '已设为我：' + sid : 'Set as me: ' + sid;
                } else {
                    pwSetMe.title = isZh ? '当前设为我：' + sid + '（点此改为本页）' : 'Me: ' + sid + ' (click to change)';
                }
            });
        }
        const panel = modal.querySelector('.sps-pw-panel');
        const header = modal.querySelector('.sps-pw-header');
        
        panel.addEventListener('pointerdown', () => {
            spsFocusWindow(modal);
            document.dispatchEvent(new CustomEvent('sps-window-focus', { detail: { el: modal } }));
        });

        const PW_MIN_W = 360, PW_MIN_H = 240, PW_DEF_W = 560;
        if (window.innerWidth < PW_DEF_W + 8) {
            panel.style.width = Math.max(80, window.innerWidth - 8) + 'px';   
        }
        const disposeResize = spsBindResize({ target:  (panel), min: { w: PW_MIN_W, h: PW_MIN_H } });

        let isDragging = false, startX, startY, origX, origY;
        header.style.cursor = 'grab';
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.sps-pw-close') || e.target.closest('.sps-pw-refresh') || e.target.closest('.sps-pw-min') || e.target.closest('.sps-pw-setme')) return;
            document._pwDragging = true;
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            startX = e.clientX; startY = e.clientY;
            origX = rect.left; origY = rect.top;
            header.style.cursor = 'grabbing';
            panel.style.position = 'fixed';
            panel.style.left = origX + 'px';
            panel.style.top = origY + 'px';
            panel.style.margin = '0';
            e.preventDefault();
        });
        _pwOnDoc('mousemove', (e) => {
            if (!isDragging) return;

            const pos = spsClampPanelPos( (panel),
                origX + e.clientX - startX, origY + e.clientY - startY);
            panel.style.left = pos.left + 'px';
            panel.style.top = pos.top + 'px';
        });
        _pwOnDoc('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'grab';
                setTimeout(() => { document._pwDragging = false; }, 100);
            }
        });

        const cleanupFns = [];
        
        cleanupFns.push(disposeResize);
        const pwRuntimeListener = ( msg) => { onRuntimeMessage(msg); };
        chrome.runtime.onMessage.addListener(pwRuntimeListener);
        cleanupFns.push(() => chrome.runtime.onMessage.removeListener(pwRuntimeListener));
        cleanupFns.push(() => { if (_pwGateTimer) { clearTimeout(_pwGateTimer); _pwGateTimer = null; } });

        const closeModal = () => {
            spsUnregisterWindow(modal);   
            document._pwClosing = true;
            for (const fn of cleanupFns.splice(0)) { try { fn(); } catch (e) {  } }
            _pwActiveClose = null;
            modal.remove();
            _pwClearDoc();

            try { spsCloseModeFilterPop(); } catch (e) {  }
            const badge = document.querySelector('.sps-pw-badge:not(.sps-f5e-badge)');
            if (badge) { badge.remove(); layoutBadges(); }
        };
        _pwActiveClose = closeModal;
        
        modal.querySelector('.sps-pw-close').addEventListener('click', closeModal);
        modal.querySelector('.sps-pw-overlay').addEventListener('click', () => {
            const badge = document.querySelector('.sps-pw-badge:not(.sps-f5e-badge)');   
            if (badge) { modal.style.display = 'none'; }
            else closeModal();
        });
        modal.querySelector('.sps-pw-min').addEventListener('click', () => {
            modal.style.display = 'none';
            let badge = document.querySelector('.sps-pw-badge:not(.sps-f5e-badge)');   
            if (!badge) {
                badge = document.createElement('button');
                badge.className = 'sps-pw-badge';
                document.body.appendChild(badge);
        badge.addEventListener('click', () => {
            const m = document.querySelector('.sps-pw-modal:not(.sps-f5e-modal)');   
            if (m) {
                m.style.display = 'flex';
                spsFocusWindow(m);   
                document.dispatchEvent(new CustomEvent('sps-window-focus', { detail: { el: m } }));
            }
            hideBadgeAt(badge);
        });
            }
            badge.textContent = txt.pw_btn || '完美平台';
            showBadgeAt(badge);
        });

        modal.querySelector('.sps-pw-refresh').addEventListener('click', () => {
            const btn = modal.querySelector('.sps-pw-refresh');
            btn.classList.add('spinning');
            safeSendMessage({ type: 'CLEAR_PW_CACHE', steamId: activeSid }, () => {
                setTimeout(() => btn.classList.remove('spinning'), 600);
                fetchAndRender(activeSid);
            });
        });

        const resultArea = modal.querySelector('.sps-pw-result-area');

        if (canSearch) {
            const searchInput = modal.querySelector('.sps-pw-search-input');
            const searchBtn = modal.querySelector('.sps-pw-search-btn');
            const searchResults = modal.querySelector('.sps-pw-search-results');
            let searchTimer = null;

            function doSearch() {
                const kw = searchInput.value.trim();
                if (!kw) {
                    searchResults.style.display = 'none';
                    searchResults.innerHTML = '';
                    return;
                }
                searchResults.style.display = 'block';
                searchResults.innerHTML = `<div class="sps-pw-loading">${isZh ? '搜索中...' : 'Searching...'}</div>`;
                safeSendMessage({ type: 'SEARCH_PW_USER', keyword: kw }, (res) => {
                    if (res?.success && res.data?.users?.length) {
                        searchResults.innerHTML = res.data.users.map(u =>
                            `<div class="sps-pw-search-item" data-sid="${esc(u.steamId)}">
                                ${esc(u.pvpNickName) || '?'} <span class="sps-pw-search-item-sub">${esc(u.appNickName)||''} · ${esc(u.steamId)}</span>
                             </div>`
                        ).join('');
                        searchResults.querySelectorAll('.sps-pw-search-item').forEach(el => {
                            el.addEventListener('click', () => {
                                searchResults.style.display = 'none';
                                searchResults.innerHTML = '';
                                fetchAndRender(el.dataset.sid);
                            });
                        });
                    } else {
                        searchResults.innerHTML = '<div class="sps-pw-error">' + (isZh ? '未找到玩家' : 'No users found') + '</div>';
                    }
                });
            }

            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimer);
                const kw = searchInput.value.trim();
                if (!kw) {
                    searchResults.style.display = 'none';
                    searchResults.innerHTML = '';
                    return;
                }
                searchTimer = setTimeout(doSearch, 500);
            });
            searchBtn.addEventListener('click', doSearch);
            searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { clearTimeout(searchTimer); doSearch(); } });
        }

        let activeSid = steamId;
        let _overviewReq = 0;
        let _seasonReq = 0;
        let overview = null;
        let _pwPendingPhase2 = null;   
        let _pwGateTimer = null;       
        let lastSelectedSeason = '';   

        function selectSeason(seasonId) {
            if (!overview || !seasonId) return;
            lastSelectedSeason = seasonId;   
            const drawerCur = resultArea.querySelector('.sps-pw-drawer-cur');
            if (drawerCur) {
                const s = (overview.seasonList || []).find(x => x.season === seasonId);
                drawerCur.textContent = s ? (pwSeasonLabel(s.season, isZh) + (s.current ? '*' : '')) : pwSeasonLabel(seasonId, isZh);
            }
            resultArea.querySelectorAll('.sps-pw-drawer-item').forEach(item => {
                item.classList.toggle('active', item.dataset.season === seasonId);
            });
            const detailEl = resultArea.querySelector('.sps-pw-detail');
            if (!detailEl) return;
            detailEl.innerHTML = `<div class="sps-pw-loading">${isZh ? '📡 读取中...' : '📡 Loading...'}</div>`;
            const myReq = ++_seasonReq;
            safeSendMessage({ type: 'FETCH_PW_SEASON', steamId: activeSid, seasonId }, (res) => {
                if (myReq !== _seasonReq || !detailEl.isConnected) return;
                if (res?.success && res.data?.success) {
                    renderPWSeasonDetail(detailEl, res.data, overview, isZh,
                        { steamId: String(activeSid), detail: settings.sps_pw_detail === true });   
                } else {
                    detailEl.innerHTML = `<div class="sps-pw-error">❌ ${res?.data?.error || '查询失败'}</div>`;
                }
            });
        }

        function fetchAndRender(sid, gateAttempt, opts) {
            gateAttempt = gateAttempt || 0;   
            const keepLayout = !!(opts && opts.keepLayout);
            if (_pwGateTimer) { clearTimeout(_pwGateTimer); _pwGateTimer = null; }   
            activeSid = sid;
            const myReq = ++_overviewReq;
            if (!keepLayout) {
                resultArea.innerHTML = `<div class="sps-pw-loading">${isZh ? '📡 读取中...' : '📡 Loading...'}</div>`;
            }   
            safeSendMessage({ type: 'FETCH_PW_STATS', steamId: sid }, (res) => {
                if (myReq !== _overviewReq) return; 
                if (!res?.success || !res.data?.success) {
                    addDebugLog('pw', `overview error=${(res && res.data && res.data.error) || (res &&  (res).error) || 'unknown'} steamid=${sid}`);
                    if (keepLayout && overview) {
                        
                        const gateEl = resultArea.querySelector('.sps-pw-chart-gate');
                        if (gateEl) gateEl.textContent = isZh ? '⚠️ 历史赛季统计加载失败（点右上角 ↻ 重试）' : '⚠️ Season history failed (click ↻ to retry)';
                        return;
                    }
                    resultArea.innerHTML = `<div class="sps-pw-error">❌ ${res?.data?.error || '查询失败'}</div>`;
                    return;
                }
                overview = res.data;

                _pwPendingPhase2 = overview.phase2 ? { sid, myReq } : null;
                if (_pwPendingPhase2) {
                    _pwGateTimer = setTimeout(() => {
                        _pwGateTimer = null;
                        if (myReq !== _overviewReq || !_pwPendingPhase2 || !modal.isConnected) return;
                        if (gateAttempt >= 1) {
                            _pwPendingPhase2 = null;
                            addDebugLog('pw', `phase2 gate timeout twice, give up steamid=${sid}`);
                            const gate = resultArea.querySelector('.sps-pw-chart-gate');
                            if (gate) gate.textContent = isZh ? '⚠️ 历史赛季统计加载失败（点右上角 ↻ 重试）' : '⚠️ Season history failed (click ↻ to retry)';
                            
                            resultArea.querySelectorAll('.sps-pw-drawer-item.sps-pw-skel').forEach(el => {
                                el.classList.remove('sps-pw-skel');
                                const scoreEl = el.querySelector('.sps-pw-drawer-score');
                                if (scoreEl) scoreEl.textContent = isZh ? '加载失败' : 'failed';
                            });
                            return;
                        }
                        _pwPendingPhase2 = null;
                        addDebugLog('pw', `phase2 gate timeout, in-place retry steamid=${sid}`);
                        fetchAndRender(sid, gateAttempt + 1, { keepLayout: true });
                    }, 90000);
                }
                renderPWOverview(resultArea, overview, isZh, selectSeason, pwBanBadgeHtml(overview.pwBan, txt));
                const firstSeason = overview.currentSeason || (overview.seasonList && overview.seasonList[0] && overview.seasonList[0].season) || '';
                const target = (keepLayout && lastSelectedSeason) ? lastSelectedSeason : firstSeason;
                if (target) {
                    selectSeason(target);
                } else {
                    const detailEl = resultArea.querySelector('.sps-pw-detail');
                    if (detailEl) detailEl.innerHTML = `<div class="sps-pw-error">${isZh ? '无赛季数据' : 'No season data'}</div>`;
                }
            }, 60000);
        }

        fetchAndRender(steamId);

        function onRuntimeMessage(msg) {
            if (!msg || !modal.isConnected) return;
            if (msg.type === 'PW_STATS_PHASE2') {
                if (!_pwPendingPhase2 || msg.steamId !== _pwPendingPhase2.sid) return;   
                if (_pwPendingPhase2.myReq !== _overviewReq) return;                     
                if (_pwGateTimer) { clearTimeout(_pwGateTimer); _pwGateTimer = null; }
                _pwPendingPhase2 = null;
                if (!msg.data || msg.data.error) {
                    addDebugLog('pw', `phase2 error=${msg.data && msg.data.error} steamid=${msg.steamId}`);
                    const gate = resultArea.querySelector('.sps-pw-chart-gate');
                    if (gate) gate.textContent = isZh ? '⚠️ 历史赛季统计加载失败' : '⚠️ Season history failed';
                    
                    resultArea.querySelectorAll('.sps-pw-drawer-item.sps-pw-skel').forEach(el => {
                        el.classList.remove('sps-pw-skel');
                        const scoreEl = el.querySelector('.sps-pw-drawer-score');
                        if (scoreEl) scoreEl.textContent = isZh ? '加载失败' : 'failed';
                    });
                    return;
                }
                
                overview = Object.assign({}, overview, msg.data, { phase2: false });
                renderPWOverview(resultArea, overview, isZh, selectSeason, pwBanBadgeHtml(overview.pwBan, txt));
                selectSeason(lastSelectedSeason || overview.currentSeason || '');
            } else if (msg.type === 'PW_SEASON_UPDATE') {
                if (!overview || msg.seasonId === overview.currentSeason) return;
                safeSendMessage({ type: 'CLEAR_PW_CACHE', steamId: activeSid }, () => {
                    fetchAndRender(activeSid);
                });
            }
        }
    }

    let _pwDocListeners = [];
    let _pwDrawerDocClick = null;
    function _pwOnDoc(type, fn) {
        document.addEventListener(type, fn);
        _pwDocListeners.push([type, fn]);
    }
    function _pwClearDoc() {
        _pwDocListeners.forEach(([t, f]) => document.removeEventListener(t, f));
        _pwDocListeners = [];
        if (_pwDrawerDocClick) {
            document.removeEventListener('click', _pwDrawerDocClick);
            _pwDrawerDocClick = null;
        }
    }

    function pwSeasonLabel(s, isZh) {
        if (!s || s === 'live') return isZh ? '当前' : 'Current';
        const m = String(s).match(/^s(\d+)$/i);
        return m ? 'S' + m[1] : String(s);
    }
    function pwSeasonNum(s) {
        const m = String(s || '').match(/s(\d+)/i);
        return m ? parseInt(m[1], 10) : 0;
    }

    function pwTierLabel(season, score, isZh) {
        const n = parseInt(String(score), 10);
        if (!Number.isFinite(n) || n <= 0) return '';
        const num = pwSeasonNum(season);
        const en = ( t) => ({ '精英C+': 'Elite C+', '精英B+': 'Elite B+', '精英A+': 'Elite A+', '普通S': 'S', '黄金S': 'Gold S', '钻石S': 'Diamond S', '魔王S': 'Demon S' })[t] || t;
        const zh = ( t) => isZh ? t : en(t);
        const sSub = (m) => m <= 2600 ? zh('普通S') : m <= 2819 ? zh('黄金S') : m <= 3099 ? zh('钻石S') : zh('魔王S'); 
        if (num && num < 7) {
            
            if (n <= 999) return 'D';
            if (n <= 1200) return 'D+';
            if (n <= 1400) return 'C';
            if (n <= 1600) return 'C+';
            if (n <= 1800) return 'B';
            if (n <= 2000) return 'B+';
            if (n <= 2200) return 'A';
            if (n <= 2400) return 'A+';
            return 'S';
        }
        if (num && num < 21) {
            
            if (n <= 999) return 'D';
            if (n <= 1200) return 'D+';
            if (n <= 1400) return 'C';
            if (n <= 1600) return 'C+';
            if (n <= 1800) return 'B';
            if (n <= 2000) return 'B+';
            if (n <= 2200) return 'A';
            if (n <= 2400) return 'A+';
            return sSub(n);
        }
        
        if (n <= 999) return 'D';
        if (n <= 1150) return 'C';
        if (n <= 1300) return 'C+';
        if (n <= 1450) return zh('精英C+');
        if (n <= 1600) return 'B';
        if (n <= 1750) return 'B+';
        if (n <= 1900) return zh('精英B+');
        if (n <= 2050) return 'A';
        if (n <= 2200) return 'A+';
        if (n <= 2400) return zh('精英A+');
        return sSub(n);
    }
    
    function pwTierSuffix(tier, isZh) {
        return tier ? (isZh ? `（${tier}）` : ` (${tier})`) : '';
    }

    function pwSDecor(season, score, isZh, stars) {
        const st = parseInt(String(stars), 10);
        const num = pwSeasonNum(season);

        const sc = parseInt(String(score), 10);
        if (Number.isFinite(st) && st > 0 && Number.isFinite(sc) && sc >= 2401 && !(num && num < 7)) {   
            const sub = isZh ? (st <= 9 ? '普通S' : st <= 24 ? '黄金S' : st <= 49 ? '钻石S' : '魔王S')
                : (st <= 9 ? 'S' : st <= 24 ? 'Gold S' : st <= 49 ? 'Diamond S' : 'Demon S');
            return sub + '★' + st;
        }
        return pwTierLabel(season, score, isZh);
    }

    function renderPWOverview(body, ov, isZh, selectSeason, banBadge) {
        banBadge = banBadge || '';
        const items = (ov.seasonList || []).map(s => {
            const cur = !!s.current;
            const label = pwSeasonLabel(s.season, isZh) + (cur ? '*' : '');

            const scoreText = ov.phase2 ? (isZh ? '统计中…' : 'loading…') : (s.score > 0 ? `${s.score}${pwTierSuffix(pwSDecor(s.season, s.score, isZh, s.stars || (cur ? ov.stars : 0)), isZh)}` : (isZh ? '无分' : 'no score'));
            const metaText = (!ov.phase2 && s.cnt) ? `${s.cnt}${isZh ? '场' : 'g'} ${(s.winRate || 0).toFixed(0)}%` : '';

            return `<div class="sps-pw-drawer-item${cur ? ' current' : ''}${ov.phase2 ? ' sps-pw-skel' : ''}" data-season="${s.season}"${spsTipAttr(isZh ? '点击查看该赛季' : 'Click to view this season', { pos: 'right', clickable: false })}>
                <span class="sps-pw-drawer-season">${label}</span>
                <span class="sps-pw-drawer-score">${scoreText}</span>
                ${metaText ? `<span class="sps-pw-drawer-meta">${metaText}</span>` : ''}
            </div>`;
        }).join('');

        const chartHtml = ov.phase2
            ? `<div class="sps-pw-chart-gate">${isZh ? '⏳ 历史赛季统计加载中…' : '⏳ Loading season history…'}</div>`
            : renderSeasonChart(ov.seasonList || [], isZh, ov.stars, body._spsTrendPage);
        body._spsSeasonReselect = selectSeason;

        body.innerHTML = `
            <div class="sps-pw-player">
                ${ov.avatar ? `<img class="sps-pw-avatar" src="${safeUrl(ov.avatar)}" alt="" referrerpolicy="no-referrer">` : ''}
                <div class="sps-pw-player-info">
                    <div class="sps-pw-player-name">${esc(ov.name)}${banBadge}</div>
                </div>
            </div>
            ${items ? `<div class="sps-pw-drawer">
                <button class="sps-pw-drawer-btn"><span class="sps-pw-drawer-cur">${isZh ? '选择赛季' : 'Select season'}</span><span class="sps-pw-drawer-arrow">▾</span></button>
                <div class="sps-pw-drawer-panel">${items}</div>
            </div>` : ''}
            <div class="sps-pw-detail"><div class="sps-pw-loading">${isZh ? '📡 读取中...' : '📡 Loading...'}</div></div>
            ${chartHtml ? `<div class="sps-pw-sec">${isZh ? '赛季 ELO 趋势' : 'Season Trend'}</div>${chartHtml}` : ''}`;

        bindPWRosterEntry(body.querySelector('.sps-pw-detail'));

        const drawer = body.querySelector('.sps-pw-drawer');
        if (drawer) {
            const btn = drawer.querySelector('.sps-pw-drawer-btn');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                drawer.classList.toggle('open');
            });
            drawer.querySelectorAll('.sps-pw-drawer-item').forEach(item => {
                item.addEventListener('click', () => {
                    selectSeason(item.dataset.season);
                    drawer.classList.remove('open');
                });
            });
            if (_pwDrawerDocClick) document.removeEventListener('click', _pwDrawerDocClick);
            _pwDrawerDocClick = (e) => {
                if (drawer.classList.contains('open') && !drawer.contains(e.target)) {
                    drawer.classList.remove('open');
                }
            };
            document.addEventListener('click', _pwDrawerDocClick);
        }

        bindTrendNav(body);
        
        body._spsTrendRerender = ( animDir) => {
            if (ov.phase2 === true) return;
            
            const oldSvgWrap = body.querySelector('.sps-pw-chart-wrap') || body.querySelector('.sps-pw-chart');
            if (!oldSvgWrap) return;
            const fresh = renderSeasonChart(ov.seasonList || [], isZh, ov.stars, body._spsTrendPage);
            const holder = document.createElement('template');
            holder.innerHTML = fresh;
            const next = holder.content.firstElementChild;
            if (!next) return;
            oldSvgWrap.replaceWith(next);
            
            const sel = typeof body._spsSeasonReselect === 'function' ? body._spsSeasonReselect : selectSeason;
            bindPWChartTip(body, sel);
            bindTrendNav(body, animDir);
        };

        const svg = body.querySelector('.sps-pw-chart');
        if (svg) bindPWChartTip(body, selectSeason, isZh);
    }

    function bindPWChartTip(body, selectSeason, isZh) {
        const svg =  (body.querySelector('.sps-pw-chart'));
        if (!svg) return;
        const NS = __S_content_pw_js(0);
        const tipG = document.createElementNS(NS, 'g');
        tipG.setAttribute('style', 'display:none; pointer-events:none;');
        svg.appendChild(tipG);
        const showTip = (x, y, label, score, meta) => {
            tipG.innerHTML = '';
            const rect = document.createElementNS(NS, 'rect');
            rect.setAttribute('rx', '4');
            rect.setAttribute('y', '2');
            rect.setAttribute('height', '18');
            rect.setAttribute('fill', 'rgba(12,16,22,0.95)');
            rect.setAttribute('stroke', 'rgba(102,192,244,0.35)');
            const txt = document.createElementNS(NS, 'text');
            txt.setAttribute('x', '8');
            txt.setAttribute('y', '15');
            txt.setAttribute('font-size', '10');
            txt.setAttribute('fill', '#e9ebee');
            const t1 = document.createElementNS(NS, 'tspan');
            t1.setAttribute('fill', '#66c0f4');
            t1.textContent = label;
            txt.appendChild(t1);
            txt.appendChild(document.createTextNode(` ${score}${isZh ? '分' : ''}${meta ? ` · ${meta}` : ''}`));
            tipG.appendChild(rect);
            tipG.appendChild(txt);
            const w = txt.getComputedTextLength();
            const tipW = w + 14;
            const tipH = 24;
            const vb = ( (svg)).viewBox.baseVal;
            let tx = x + 10;
            let ty = y - 12;
            if (tx + tipW > vb.width - 2) tx = x - tipW - 10;   
            if (tx < 2) tx = 2;                                   
            if (ty < 2) ty = y + 14;                              
            if (ty + tipH > vb.height - 2) ty = vb.height - tipH - 2;   
            rect.setAttribute('width', String(tipW));
            tipG.setAttribute('transform', `translate(${tx.toFixed(1)}, ${ty.toFixed(1)})`);
            tipG.style.display = 'block';
        };
        const clearDotHover = () => {
            svg.querySelectorAll('circle.dot.sps-dot-hover, text.num.sps-dot-hover').forEach(el => el.classList.remove('sps-dot-hover'));
        };
        svg.addEventListener('mousemove', (e) => {
            const c = e.target.closest('circle[data-label], text.num[data-label]');
            clearDotHover();
            if (!c) { tipG.style.display = 'none'; return; }
            
            const seasonSel = (window.CSS && CSS.escape) ? CSS.escape(String(c.dataset.season || '')) : '';
            const dot = seasonSel ? svg.querySelector(`circle.dot[data-season="${seasonSel}"]`) : null;
            if (dot) dot.classList.add('sps-dot-hover');
            const num = seasonSel ? svg.querySelector(`text.num[data-season="${seasonSel}"]`) : null;
            if (num) num.classList.add('sps-dot-hover');
            const pt = ( (svg)).createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const ctm = ( (svg)).getScreenCTM();
            if (ctm) {
                const loc = pt.matrixTransform(ctm.inverse());
                showTip(loc.x, loc.y, c.dataset.label, c.dataset.score, c.dataset.meta);
            }
        });
        svg.addEventListener('mouseleave', () => { tipG.style.display = 'none'; clearDotHover(); });
        svg.addEventListener('click', (e) => {
            const c = e.target.closest('circle[data-season], text.num[data-season]');
            if (c && c.dataset.season && typeof selectSeason === 'function') selectSeason(c.dataset.season);
        });
    }

    function renderPentagonRadar(dims, mod) {
        const ds = (dims || []).filter(p => p && Number.isFinite(p.value) && p.value >= 0).slice(0, 5);
        if (ds.length < 3) return '';   

        const W = 260, H = 178, cx = W / 2, cy = H / 2 + 8, R = 52;
        
        const ang = (i) => -Math.PI / 2 + (2 * Math.PI * i) / 5;
        const px = (i, r) => cx + r * Math.cos(ang(i));
        const py = (i, r) => cy + r * Math.sin(ang(i));
        const ring = (frac) => {
            const r = R * frac;
            return [0, 1, 2, 3, 4].map(i => `${px(i, r).toFixed(1)},${py(i, r).toFixed(1)}`).join(' ');
        };
        const grid = [0.25, 0.5, 0.75, 1].map(f => `<polygon points="${ring(f)}" fill="none" stroke="rgba(255,255,255,${f === 1 ? '0.22' : '0.10'})" stroke-width="1"/>`).join('');
        const axes = [0, 1, 2, 3, 4].map(i => `<line x1="${cx}" y1="${cy}" x2="${px(i, R).toFixed(1)}" y2="${py(i, R).toFixed(1)}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`).join('');
        const clamp10 = (v) => Math.max(0, Math.min(10, v)) / 10;
        const poly = ds.map((p, i) => `${px(i, R * clamp10(p.value)).toFixed(1)},${py(i, R * clamp10(p.value)).toFixed(1)}`).join(' ');
        const dotEls = ds.map((p, i) => {
            const x = px(i, R * clamp10(p.value)), y = py(i, R * clamp10(p.value));
            return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="#66c0f4"><title>${esc(p.tip || (p.label + ' ' + p.score))}</title></circle>`;
        }).join('');

        const textW = ( s) => { let w = 0; for (const ch of String(s)) w += ch.charCodeAt(0) > 255 ? 10 : 5.5; return w; };
        const lblEls = ds.map((p, i) => {
            const lx = px(i, R + 15), ly = py(i, R + 15);
            const anchor = Math.abs(lx - cx) < 6 ? 'middle' : (lx > cx ? 'start' : 'end');
            const name = esc(p.label);
            const score = esc(String(p.score));
            const grade = String(p.grade || '');
            const fullW = textW(p.label + ' ' + p.score);
            const badgeDx = anchor === 'end' ? -(fullW + 15) : (anchor === 'middle' ? fullW / 2 + 3 : fullW + 3);
            const badge = grade
                ? `<g transform="translate(${(lx + badgeDx).toFixed(1)}, ${(ly - 9).toFixed(1)})"><rect width="12" height="12" rx="2.5" class="sps-radar-badge g${esc(grade)}"/><text x="6" y="9" text-anchor="middle" font-size="8" font-weight="700" class="sps-radar-badge-txt g${esc(grade)}">${esc(grade)}</text></g>`
                : '';
            return `<text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="${anchor}" font-size="10" fill="#c8cdd4">${name} <tspan fill="#e4e8ee" font-weight="700">${score}</tspan></text>${badge}`;
        }).join('');
        const cls = mod === 'f5e' ? ' sps-radar-f5e' : '';
        return `<svg class="sps-radar${cls}" viewBox="0 0 ${W} ${H}" role="img">
            ${grid}${axes}
            <polygon points="${poly}" fill="rgba(102,192,244,0.22)" stroke="#66c0f4" stroke-width="1.6" stroke-linejoin="round"/>
            ${dotEls}${lblEls}
        </svg>`;
    }

    function pwGradeOf(v) { return v >= 9 ? 'S' : v >= 7.5 ? 'A' : v >= 6 ? 'B' : v >= 4 ? 'C' : 'D'; }

    function bindTrendNav(body, animDir) {
        body.querySelectorAll('.sps-trend-nav').forEach(nav => {
            if (nav._spsNavBound) return;
            nav._spsNavBound = true;
            nav.querySelectorAll('.sps-trend-arrow').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (btn.hasAttribute('disabled')) return;
                    const dir = parseInt(String(btn.dataset.trendDir || '0'), 10) || 0;
                    if (!dir) return;

                    const maxPage = parseInt(String(nav.dataset.maxPage || '0'), 10) || 0;
                    const nextPage = Math.max(0, Math.min(maxPage, (Math.floor(Number(body._spsTrendPage) || 0)) - dir));
                    if (nextPage === (Math.floor(Number(body._spsTrendPage) || 0))) return;   
                    body._spsTrendPage = nextPage;
                    if (typeof body._spsTrendRerender === 'function') body._spsTrendRerender(dir);   
                });
            });
        });
        
        if (animDir) {
            const svg = body.querySelector('.sps-pw-chart');
            if (svg) {
                const cls = animDir < 0 ? 'sps-trend-in-left' : 'sps-trend-in-right';
                svg.classList.add(cls);
                svg.addEventListener('animationend', () => svg.classList.remove(cls), { once: true });
            }
        }
    }

    function renderSeasonChart(seasonList, isZh, currentStars, pageArg) {
        const pts = (seasonList || [])
            .filter(s => s.score > 0)   
            .sort((a, b) => pwSeasonNum(a.season) - pwSeasonNum(b.season))
            .map(s => ({
                label: pwSeasonLabel(s.season, isZh),
                season: s.season,
                score: s.score,
                current: !!s.current,

                meta: (s.cnt ? `${s.cnt}${isZh ? '场' : 'g'} · ${(s.winRate || 0).toFixed(0)}% · ` : '') + pwSDecor(s.season, s.score, isZh, s.stars || (s.current ? currentStars : 0))
            }));
        const total = pts.length;

        const PAGE = 10, PAGE_STEP = 9;
        const pages = Math.max(1, total - PAGE + 1);
        const page = Math.min(Math.max(0, Math.floor(Number(pageArg) || 0) * PAGE_STEP), pages - 1);
        const endIdx = total - page;
        const startIdx = Math.max(0, endIdx - PAGE);
        const win = pts.slice(startIdx, endIdx);
        const n = win.length;
        if (n === 0) return '';
        const W = 460, H = 132, PL = 26, PR = 26, PT = 30, PB = 24;
        const iw = W - PL - PR, ih = H - PT - PB;
        let min = Math.min(...win.map(p => p.score));
        let max = Math.max(...win.map(p => p.score));
        const range = Math.max(max - min, 30);
        min = Math.max(0, min - range * 0.15);
        max = max + range * 0.15;
        const X = (i) => n === 1 ? W / 2 : PL + (iw * i) / (n - 1);
        const Y = (v) => PT + ih - (ih * (v - min)) / (max - min);
        const line = win.map((p, i) => `${X(i).toFixed(1)},${Y(p.score).toFixed(1)}`).join(' ');
        const area = n >= 2 ? `${X(0).toFixed(1)},${PT + ih} ${line} ${X(n - 1).toFixed(1)},${PT + ih}` : '';
        const maxIdx = win.reduce((mi, p, i) => (p.score > win[mi].score ? i : mi), 0);
        const dots = win.map((p, i) => {
            const isMax = i === maxIdx, isCur = p.current;
            const r = isMax ? 4 : 3;
            const fill = isMax ? '#ffc107' : (isCur ? '#a3cf06' : '#0d1520');
            const stroke = isCur ? '#a3cf06' : '#66c0f4';
            const tip = `data-label="${esc(p.label)}" data-score="${esc(p.score)}" data-meta="${esc(p.meta)}" data-season="${esc(p.season)}"`;
            const hitR = 18;
            return `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.score).toFixed(1)}" r="${hitR}" fill="transparent" stroke="none" ${tip}/><circle class="dot" cx="${X(i).toFixed(1)}" cy="${Y(p.score).toFixed(1)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" ${tip}/>`;
        }).join('');
        const labels = win.map((p, i) => {
            const color = p.current ? '#a3cf06' : '#8899aa';
            const bold = p.current ? ' font-weight="700"' : '';
            return `<text x="${X(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="9" fill="${color}"${bold}>${esc(p.label)}${p.current ? '*' : ''}</text>`;
        }).join('');
        const nums = win.map((p, i) => {
            const color = i === maxIdx ? '#ffc107' : (p.current ? '#a3cf06' : '#c8cdd4');
            const tip = `data-label="${esc(p.label)}" data-score="${esc(p.score)}" data-meta="${esc(p.meta)}" data-season="${esc(p.season)}"`;
            return `<text class="num" ${tip} x="${X(i).toFixed(1)}" y="${(Y(p.score) - 8).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="${color}">${p.score}</text>`;
        }).join('');
        const hasCurrent = win.some(p => p.current);

        return `<div class="sps-pw-chart-wrap"><svg class="sps-pw-chart" viewBox="0 0 ${W} ${H}">
            <defs>
                <linearGradient id="spsPwChartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#66c0f4" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#66c0f4" stop-opacity="0.02"/>
                </linearGradient>
            </defs>
            ${area ? `<polygon points="${area}" fill="url(#spsPwChartFill)"/>` : ''}
            ${n >= 2 ? `<polyline points="${line}" fill="none" stroke="#66c0f4" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
            ${dots}${nums}${labels}
        </svg>
        ${n < total ? `<div class="sps-trend-nav" data-max-page="${pages - 1}">
            <button class="sps-trend-arrow" data-trend-dir="-1" aria-label="older"${startIdx <= 0 ? ' disabled' : ''}>‹</button>
            <span class="sps-trend-pageinfo">${startIdx + 1}-${endIdx} / ${total}</span>
            <button class="sps-trend-arrow" data-trend-dir="1" aria-label="newer"${endIdx >= total ? ' disabled' : ''}>›</button>
        </div>` : ''}
        ${hasCurrent ? `<div class="sps-pw-chart-note">* ${isZh ? '当前进行中赛季 · 点击图表点或赛季标签切换' : 'current season · click a point to switch'}</div>` : ''}</div>`;
    }

    function pwMhToneCls(v, thr) {
        const n = pwNum(v);
        return n > 0 ? (n >= pwNum(thr) ? ' up' : ' down') : '';
    }

    function pwMatchRowHtml(m, isZh, mhFilter) {
        const hasStars = ( x) => x && x.stars > 0;
        const dlt = m._delta || { txt: '', cls: '' };
        const mainVal = hasStars(m) ? '★' + m.stars : (m.score > 0 ? m.score : (isZh ? '定级' : 'Place'));
        const dateText = fmtMonthDay(m.date);
        const timeText = String(m.date || '').split(' ')[1] || '';
        const isDetailRow = !!(m.kills || m.deaths || m.map);
        
        const dateHtml = esc(dateText) + (timeText && !isDetailRow ? `<i>${esc(timeText.slice(0, 5))}</i>` : '') +
            (!isDetailRow && m.map ? `<b>${esc(m.map)}</b>` : '');
        const kdHtml = (m.kills || m.deaths) ? `${m.kills}/${m.assists || 0}/${m.deaths}`
            : (m.pwRating > 0 ? m.pwRating.toFixed(2) : '-');
        
        const ratVal = m.pwRating > 0 ? m.pwRating : (m.rating > 0 ? m.rating : 0);
        const ratHtml = ratVal > 0 ? ratVal.toFixed(2) : '-';
        const weHtml = m.we > 0 ? m.we.toFixed(2) : '-';
        
        const ratTone = pwMhToneCls(ratVal, 1);
        const weTone = pwMhToneCls(m.we, 8);
        const adrHtml = m.adr > 0 ? String(Math.round(m.adr)) : '—';
        const scoreHtml = (m.score1 || m.score2) ? `${m.score1}:${m.score2}` : '-';

        const eloVal = m.score > 0 ? m.score : 0;

        const isLadderMode = !m.mode || String(m.mode).indexOf('天梯') >= 0;
        const eloHtml = hasStars(m) ? '★' + m.stars
            : (eloVal > 0 ? String(eloVal)
                : (isDetailRow ? (isLadderMode ? (isZh ? '定级' : 'Place') : '-') : ''));
        const eloCls = isDetailRow ? (!m.isTie && (eloVal > 0 || hasStars(m)) ? (m.isWin ? 'up' : 'down') : '') : dlt.cls;

        const winCls = isDetailRow ? (m.isTie ? '' : (m.isWin ? ' win' : ' lose')) : '';
        const dotHtml = isDetailRow ? `<i class="sps-pw-mh-dot${m.isTie ? ' t' : (m.isWin ? ' w' : '')}"></i>` : '';
        const timeHtml = isDetailRow && timeText ? `<span class="sps-pw-mh-time">${esc(timeText.slice(0, 5))}</span>` : '';

        const hideCls = pwMhRowHidden(pwMhModeKey(m), mhFilter) ? ' sps-mh-hide' : '';
        const weAttr = (m.matchId && !(m.we > 0)) ? ` data-pw-we="${esc(m.matchId)}"` : '';
        if (isDetailRow) {
            return `<div class="sps-pw-mh-row det${winCls}${hideCls}"${m.mode ? ` data-pw-mmode="${esc(m.mode)}"` : ''}>
            ${dotHtml}<span class="sps-pw-mh-date"><span class="sps-pw-mh-dtxt">${esc(dateText)}</span>${timeHtml}</span>
            <span class="sps-pw-mh-map">${m.map ? esc(m.map) : ''}</span>
            <span class="sps-pw-mh-val pw">${kdHtml}</span>
            <span class="sps-pw-mh-val rat${ratTone}">${ratHtml}</span>
            <span class="sps-pw-mh-val we${weTone}"${weAttr}>${weHtml}</span>
            <span class="sps-pw-mh-val adr" data-pw-adr="${esc(m.matchId || '')}">${adrHtml}</span>
            <span class="sps-pw-mh-val hs">${m.hsRatio > 0 ? Math.round(m.hsRatio * 100) + '%' : '—'}</span>
            <span class="sps-pw-mh-val sc${m.matchId ? ' sps-pw-roster-btn' : ''}"${m.matchId ? ` data-pw-roster="${esc(m.matchId)}" role="button" tabindex="0" title="${isZh ? '点击查看本场详情' : 'Click for the 10-player roster'}"` : ''}>${scoreHtml}</span>
            <span class="sps-pw-mh-delta ${eloCls}"><span class="sps-pw-mh-elo">${eloHtml}</span>${pwModeBadgeHtml(m, isZh)}</span>
        </div>`;
        }
        return `<div class="sps-pw-mh-row${hideCls}">
            <span class="sps-pw-mh-date">${dateHtml}</span>
            <span class="sps-pw-mh-val pw">${kdHtml}</span>
            <span class="sps-pw-mh-val rat${ratTone}">${ratHtml}</span>
            <span class="sps-pw-mh-val we${weTone}"${weAttr}>${weHtml}</span>
            <span class="sps-pw-mh-val sc${m.matchId ? ' sps-pw-roster-btn' : ''}"${m.matchId ? ` data-pw-roster="${esc(m.matchId)}" role="button" tabindex="0" title="${isZh ? '点击查看本场详情' : 'Click for the 10-player roster'}"` : ''}>${mainVal}</span>
            <span class="sps-pw-mh-delta ${dlt.cls}">${esc(dlt.txt)}</span>
        </div>`;
    }

    function pwModeShortLabel(mode) {
        const raw = String(mode || '').trim();
        return raw.replace(/^(?:PVP|完美)+/i, '').trim() || raw;
    }

    function pwModeBadgeHtml(m, isZh) {
        const mode = String(m && m.mode || '').trim();
        if (!mode || mode.indexOf('天梯') >= 0) return '';
        const label = pwModeShortLabel(mode);
        const tip = mode.indexOf('周末联赛') >= 0
            ? (isZh ? `${mode} · 每周首胜计分` : `${mode} · first win of the week scores (not ladder ELO/stars)`)
            : (isZh ? `${mode} · 非天梯模式，计分口径与天梯不同` : `${mode} · non-ladder mode (different scoring)`);
        return `<i class="sps-pw-mh-mode" title="${esc(tip)}">${esc(label)}</i>`;
    }

    function pwMhModeKey(m) { return String(m && m.mode || '').trim(); }

    function pwMhIsDefaultMode(md) { return !!md && (md.indexOf('天梯') >= 0 || md.indexOf('周末联赛') >= 0); }

    function pwMhIsGarbageMode(md) {
        return /(^|[^0-9])1\s*v\s*1($|[^0-9])|(^|[^0-9])2\s*v\s*2($|[^0-9])|单挑/i.test(String(md || ''));
    }

    function pwMhFilterItems(modes, isZh) {
        const counts = {};
        (Array.isArray(modes) ? modes : []).forEach(( md) => {
            const k = String(md || '').trim();
            if (k) counts[k] = (counts[k] || 0) + 1;
        });
        const keys = Object.keys(counts);
        const items = keys.map(( k) => ({
            key: k, count: counts[k],
            label: k.indexOf('天梯') >= 0 ? (isZh ? '天梯' : 'Ladder') : pwModeShortLabel(k)
        }));
        return { items, def: keys.filter(( k) => pwMhIsDefaultMode(k)) };
    }

    function pwMhRowHidden(md, sel) {
        return !!md && (Array.isArray(sel) ? sel : []).map(String).indexOf(md) < 0;
    }

    function pwMhFilterModel(modes, selRaw, isZh) {
        const arr = (Array.isArray(modes) ? modes : []).map(( m) => String(m || '').trim());
        const { items, def } = pwMhFilterItems(arr, isZh);
        const keys = items.map(( i) => i.key);
        return { items, def, total: arr.filter(( k) => !!k).length,
            sel: spsModeFilterNormalize(selRaw, keys, def) };
    }

    function pwMhFilterModelFromDom(wrap, selRaw, isZh) {
        const rows = wrap ? Array.from(wrap.querySelectorAll('.sps-pw-mh-row')) : [];
        return pwMhFilterModel(rows.map(( el) => el.getAttribute('data-pw-mmode') || ''), selRaw, isZh);
    }

    function pwMhFilterBarHtml(model, isZh) {
        if (!model || !model.items.length) return '';
        return spsModeFilterBarHtml({ isZh, items: model.items, sel: model.sel, def: model.def,
            total: model.total, defLabel: isZh ? '默认（天梯+周末联赛）' : 'Default (Ladder+Weekend)' });
    }

    function applyPwMhFilter(wrap, sel) {
        if (!wrap) return;
        const keys = (Array.isArray(sel) ? sel : []).map(String);
        wrap.querySelectorAll('.sps-pw-mh-row').forEach(( el) => {
            const md = el.getAttribute('data-pw-mmode') || '';
            el.classList.toggle('sps-mh-hide', !!md && keys.indexOf(md) < 0);
        });
    }

    function pwMhVisibleRows(arr) {
        return (Array.isArray(arr) ? arr : []).filter(( x) => x && !pwMhIsGarbageMode(pwMhModeKey(x)));
    }

    function pwMatchHistoryHtml(d, isZh) {
        const raw = pwMhVisibleRows(Array.isArray(d && d.matchHistory) ? d.matchHistory.filter(x => x && x.date) : []);
        const sid = String((d && d.seasonId) || '');
        
        const mh = sid ? raw.filter(x => !x.seasonId || String(x.seasonId) === sid) : raw;
        if (!mh.length) return '';

        const hasStars = ( m) => Number(m && m.stars) > 0;

        const delta = (i) => {
            const m = mh[i];
            if (!m) return { txt: '', cls: '' };
            if (hasStars(m)) {
                const prev = mh[i + 1];
                if (!hasStars(prev)) return { txt: '', cls: '' };   
                const diff = m.stars - prev.stars;
                return { txt: diff > 0 ? '+' + diff : String(diff), cls: diff > 0 ? 'up' : (diff < 0 ? 'down' : '') };
            }
            const cur = m.score;
            if (!(cur > 0)) return { txt: '', cls: '' };            
            const prevScore = mh[i + 1] ? mh[i + 1].score : 0;
            if (!(prevScore > 0) || hasStars(mh[i + 1])) return { txt: '', cls: '' };   
            const diff = cur - prevScore;
            return { txt: (diff >= 0 ? '+' : '') + diff, cls: diff > 0 ? 'up' : (diff < 0 ? 'down' : '') };
        };
        mh.forEach(( m,  i) => { m._delta = delta(i); });
        const isDetail = d.detail === true || !!(mh[0] && mh[0].map);   
        
        const mhSum = (() => {
            const firstDt = fmtMonthDay(mh[0].date);
            const wins = mh.filter(( m) => m.isWin === true && m.isTie !== true).length;
            const losses = mh.filter(( m) => m.isWin === false && m.isTie !== true).length;
            const cntTxt = (wins + losses) > 0 ? (isZh ? ` · ${wins}胜${losses}负` : ` · ${wins}W-${losses}L`) : '';
            return (firstDt ? (isZh ? '首场 ' + firstDt : 'since ' + firstDt) : '') + cntTxt;
        })();

        const fModel = pwMhFilterModel(isDetail ? mh.map(pwMhModeKey) : [], (d && d.filter) || [], isZh);
        const rows = mh.map(( m) => pwMatchRowHtml(m, isZh, isDetail ? fModel.sel : []));
        return `<div class="sps-pw-mh-wrap">
            <div class="sps-pw-sec sps-pw-mh-toggle">${isZh ? `${pwSeasonLabel(sid, isZh)} 比赛记录` : `Match Records (${pwSeasonLabel(sid, isZh)})`}<i class="sps-pw-mh-sum">${esc(mhSum)}</i><i class="sps-pw-mh-arrow">▾</i></div>
            <div class="sps-pw-mh-body" style="display:none;">
                ${pwMhFilterBarHtml(fModel, isZh)}
                <div class="sps-pw-mh-head">${isDetail
                    ? `<i></i><span>${isZh ? '日期' : 'Date'}</span><span>${isZh ? '地图' : 'Map'}</span><span>K/A/D</span><span>Rat</span><span>WE</span><span>ADR</span><span>HS%</span><span>${isZh ? '比分' : 'Score'}</span><span>ELO</span>`
                    : `<span>${isZh ? '日期' : 'Date'}</span><span>RATING</span><span>Rat</span><span>WE</span><span>${isZh ? 'ELO' : 'ELO'}</span><span>Δ</span>`}</div>
                <div class="sps-pw-mh-rows">${rows.slice(0, 25).join('')}</div>
                ${mh.length > 25 ? `<div class="sps-pw-expand" role="button" tabindex="0" data-pw-expand="mh">▾ ${isZh ? '展开其余 ' + (mh.length - 25) + ' 场' : 'Show all matches'}</div>` : ''}
            </div>
        </div>`;
    }

    function pwBindMhFilterBar(detailEl, wrap) {
        const bar = wrap && wrap.querySelector('.sps-mh-fbar');
        if (!bar) return;
        spsBindModeFilter(bar, () => pwMhFilterModelFromDom(wrap, detailEl._pwMhFilter, detailEl._pwIsZh), (sel) => {
            detailEl._pwMhFilter = sel;
            applyPwMhFilter(wrap, sel);
            spsModeFilterSync(bar, pwMhFilterModelFromDom(wrap, sel, detailEl._pwIsZh));
        });
    }

    function pwRefreshMhFilterBar(detailEl, wrap) {
        if (!wrap) return;
        const model = pwMhFilterModelFromDom(wrap, detailEl._pwMhFilter, detailEl._pwIsZh);
        detailEl._pwMhFilter = model.sel;
        spsCloseModeFilterPop();
        const old = wrap.querySelector('.sps-mh-fbar');
        const body = wrap.querySelector('.sps-pw-mh-body');
        const html = pwMhFilterBarHtml(model, detailEl._pwIsZh);
        if (!html) { if (old) old.remove(); return; }
        if (old) old.outerHTML = html;
        else if (body) body.insertAdjacentHTML('afterbegin', html);
        pwBindMhFilterBar(detailEl, wrap);
        applyPwMhFilter(wrap, model.sel);
    }    

    function bindPWRosterEntry(detailEl) {
        if (!detailEl || detailEl._pwRosterBound || typeof detailEl.addEventListener !== 'function') return;
        detailEl._pwRosterBound = true;
        const pickR = ( ev) => (ev.target && ev.target.closest) ? ev.target.closest('[data-pw-roster]') : null;

        const rowOf = ( mid) => {
            const arr = (detailEl._pwFullData && Array.isArray(detailEl._pwFullData.mh)) ? detailEl._pwFullData.mh : [];
            for (const r0 of arr) if (String(r0.matchId || '') === mid) return r0;
            return null;
        };
        const txtOf = ( cell,  sel) => {
            const rowEl = cell.closest ? cell.closest('.sps-pw-mh-row') : null;
            const el = rowEl && rowEl.querySelector ? rowEl.querySelector(sel) : null;
            const t = el ? String(el.textContent || '').trim() : '';
            return (t && t !== '—') ? t : '';
        };
        const fire = ( cell) => {
            const mid = String(cell.getAttribute('data-pw-roster') || '');
            const r0 = rowOf(mid);
            
            const rowView = r0 ? Object.assign({}, r0, {
                adrText: txtOf(cell, '.sps-pw-mh-val.adr'), hsText: txtOf(cell, '.sps-pw-mh-val.hs'),
                eloText: txtOf(cell, '.sps-pw-mh-delta .sps-pw-mh-elo')
            }) : null;

            openPWRoster(mid, { steamId: (detailEl._pwCtx && detailEl._pwCtx.steamId) || '',
                isZh: detailEl._pwIsZh !== false, row: r0, rowView: rowView,
                seasons: (detailEl._pwOverview && detailEl._pwOverview.seasonList) || [] });
        };
        detailEl.addEventListener('click', ( e) => { const c = pickR(e); if (!c) return; e.preventDefault(); e.stopPropagation(); fire(c); });
        detailEl.addEventListener('keydown', ( e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const c = pickR(e); if (!c) return; e.preventDefault(); fire(c); });
    }

    function bindPWMatchHistory(detailEl) {
        detailEl.querySelectorAll('.sps-pw-mh-wrap').forEach(wrap => {
            if (wrap._mhBound) return;
            wrap._mhBound = true;
            const toggle = wrap.querySelector('.sps-pw-mh-toggle');
            const body = wrap.querySelector('.sps-pw-mh-body');
            if (!toggle || !body) return;
            toggle.addEventListener('click', () => {
                const show = body.style.display === 'none';
                body.style.display = show ? 'block' : 'none';
                wrap.querySelector('.sps-pw-mh-arrow').textContent = show ? '▴' : '▾';
                wrap.classList.toggle('open', show);
                
                if (show && typeof detailEl._pwWeBackfill === 'function') detailEl._pwWeBackfill();
            });

            const model0 = pwMhFilterModelFromDom(wrap, detailEl._pwMhFilter, detailEl._pwIsZh);
            detailEl._pwMhFilter = model0.sel;
            pwBindMhFilterBar(detailEl, wrap);
            applyPwMhFilter(wrap, model0.sel);
        });
        
        detailEl.querySelectorAll('.sps-pw-expand').forEach(btn => {
            if (btn._pwBound) return;
            btn._pwBound = true;
            const go = () => {
                const wrap = btn.closest('.sps-pw-mh-wrap');
                if (wrap && String(btn.dataset.pwExpand) === 'mh') {
                    const rowsEl = wrap.querySelector('.sps-pw-mh-rows');
                    if (!rowsEl || !detailEl._pwFullData) return;
                    const all = Array.isArray(detailEl._pwFullData.mh) ? detailEl._pwFullData.mh : [];
                    const startIdx = rowsEl.querySelectorAll(':scope > .sps-pw-mh-row').length;
                    const rest = all.slice(startIdx, startIdx + 25);
                    if (!rest.length) { btn.textContent = detailEl._pwIsZh ? '没有更多了' : 'No more matches'; btn.style.pointerEvents = 'none'; btn.style.opacity = '0.5'; return; }
                    const frag = document.createElement('template');
                    frag.innerHTML = rest.map(( m) => pwMatchRowHtml(m, detailEl._pwIsZh, detailEl._pwMhFilter)).join('');
                    while (frag.content.firstChild) rowsEl.appendChild(frag.content.firstChild);
                    if (all.length <= startIdx + rest.length) { btn.textContent = detailEl._pwIsZh ? '没有更多了' : 'No more matches'; btn.style.pointerEvents = 'none'; btn.style.opacity = '0.5'; }
                    else { btn.textContent = (detailEl._pwIsZh ? '▾ 展开其余 ' : '▾ Show ') + (all.length - startIdx - rest.length) + (detailEl._pwIsZh ? ' 场' : ' more'); }
                    
                    if (typeof detailEl._pwBackfill === 'function') detailEl._pwBackfill();
                    
                    if (typeof detailEl._pwWeBackfill === 'function') detailEl._pwWeBackfill();
                    applyPwMhFilter(wrap, detailEl._pwMhFilter);
                    
                    pwRefreshMhFilterBar(detailEl, wrap);
                    return;
                }
                
                const kind = String(btn.dataset.pwExpand || '');
                const rowsEl = btn.parentElement && btn.parentElement.querySelector(':scope > ' + (kind === 'maps' ? '.sps-pw-maps' : '.sps-pw-weps'));
                if (!rowsEl || !detailEl._pwFullData) return;
                const all = kind === 'maps' ? (detailEl._pwFullData.maps || []) : (detailEl._pwFullData.weapons || []);
                const rowSel = kind === 'maps' ? '.sps-pw-map' : '.sps-pw-wep';
                const have = rowsEl.querySelectorAll(':scope > ' + rowSel).length;
                const rest = all.slice(have);
                if (!rest.length) { btn.remove(); return; }
                const frag = document.createElement('template');
                if (kind === 'maps') {
                    frag.innerHTML = rest.map(( m,  i) =>
                        `<div class="sps-pw-map"><span class="sps-pw-map-num">${have + i + 1}.</span> ${esc(m.mapName) || '?'} — ${m.totalMatch}场 ${m.totalMatch ? (m.winCount / m.totalMatch * 100).toFixed(1) : '0'}% ADR:${(m.totalMatch ? (m.totalAdr / m.totalMatch) : 0).toFixed(1)} Rat:${(m.totalMatch ? (m.ratingSum / m.totalMatch) : 0).toFixed(2)}</div>`).join('');
                } else {
                    frag.innerHTML = rest.map(( w,  i) => {
                        const fs = w.firstShotAccuracy != null ? (w.firstShotAccuracy * 100).toFixed(1) + '%' : 'N/A';
                        return `<div class="sps-pw-wep"><div class="sps-pw-wep-name">${have + i + 1}. ${esc(w.nameZh || w.name) || '?'}</div>
                        <div class="sps-pw-wep-stats">击杀:${w.killNum || 0} 爆头:${((w.headshotRate || 0) * 100).toFixed(1)}%[${esc(w.levelHeadshotRate) || '?'}] 首发:${fs}[${esc(w.levelAccuracy) || '?'}] 用时:${w.avgTimeToKill || 0}ms[${esc(w.levelAvgTimeToKill) || '?'}]</div></div>`;
                    }).join('');
                }
                while (frag.content.firstChild) rowsEl.appendChild(frag.content.firstChild);
                btn.remove();
            };
            btn.addEventListener('click', go);
            btn.addEventListener('keydown', ( ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } });
        });
    }

    let _pwRosterActiveClose = null;

    function pwRosterAvatar(raw) {
        const s = String(raw || '');
        if (!s) return '';
        return /^(https?:)?\/\//i.test(s) ? safeUrl(s) : esc(__S_content_pw_js(1) + s.replace(/^\/+/, ''));
    }

    function pwRosterNameHtml(p, isZh, idx) {
        const sidRaw = String(p.steamId || '');
        const tail = String(p.steamIdTail || sidRaw.replace(/\D/g, '').slice(-6));
        const name = String(p.nickname || tail || '');
        const label = esc(name || (isZh ? '玩家 ' + ((idx || 0) + 1) : 'player ' + ((idx || 0) + 1)));
        const sid = sidRaw;
        if (/^7656\d{13}$/.test(sid)) {
            const url = __S_content_pw_js(2) + sid;
            return `<a class="sps-f5e-rt-nm sps-f5e-rt-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${isZh ? '打开 Steam 资料页 ' + sid : 'Open Steam profile ' + sid}">${label}</a>`;
        }
        return `<span class="sps-f5e-rt-nm">${label}</span>`;
    }

    function pwMdVal(v, d) {
        const n = pwNum(v);
        if (!(n > 0)) return '—';
        if (d) return n.toFixed(d);
        if (Number.isInteger(n)) return String(n);

        return String(Math.round(n * 100) / 100);
    }

    function pwMdChip(label, value, o) {
        const opt = o || {};
        const z = (value === '—' || value === '0');
        const raw = opt.raw && opt.raw !== label ? opt.raw : '';
        const tip = raw ? ` title="${esc((opt.isZh ? '官方字段：' : 'official field: ') + raw)}"` : '';
        return `<span class="sps-md-chip${z ? ' z' : ''}${opt.hot ? ' hot' : ''}"${tip}><i>${esc(label)}</i><b>${esc(value)}</b></span>`;
    }

    function pwDurMin(v) {
        const n = pwNum(v);
        if (n >= 60000) return Math.round(n / 60000);
        if (n >= 600) return Math.round(n / 60);
        return Math.round(n);
    }

    function pwTimeText(v) {
        const s = String(v == null ? '' : v).trim();
        if (!s) return '';
        
        if (/^\d{9,13}$/.test(s)) {
            const d = new Date(s.length >= 12 ? pwNum(s) : pwNum(s) * 1000);
            const z = ( n) => (n < 10 ? '0' + n : String(n));
            return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes());
        }
        
        return /^(\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2})/.test(s)
            ? s.replace(/(\d{1,2}:\d{2}):\d{2}(?:\.\d+)?$/, '$1')
            : '';
    }

    function pwRoundTotal(rt, s1, s2) {
        const n = pwNum(rt);
        if (n > 0) return n;
        return (pwNum(s1) > 0 || pwNum(s2) > 0) ? (pwNum(s1) + pwNum(s2)) : 0;
    }

    function pwRowSeasonLabel(row, isZh, seasons, tStr) {
        const id = pwSeasonOf(row, seasons, tStr);
        return id ? pwSeasonLabel(id, isZh) : '—';
    }

    function pwSeasonOf(row, seasons, tStr) {
        const own = String((row && row.seasonId) || '').trim();
        if (/^live$/i.test(own)) return 'live';
        
        const m = own.match(/^(?:\d{2,4})?s(\d+)$/i) || own.match(/^(\d+)$/);
        if (m) return 's' + m[1];
        const bg = String((row && row.season) || '').trim();
        if (/^(?:\d{2,4})?s\d+$/i.test(bg)) return 's' + bg.replace(/^.*?s/i, '');
        return pwSeasonByDate(seasons, tStr);
    }

    function pwSeasonByDate(seasons, tStr) {
        const t = String(tStr || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}/.test(t)) return '';
        const rows = (Array.isArray(seasons) ? seasons : [])
            .map((s) => ({ id: String((s && s.season) || ''), hi: String((s && s.latestDate) || '').trim() }))
            .filter((s) => s.id && /^\d{4}-\d{2}-\d{2}/.test(s.hi))
            .sort((a, b) => (a.hi < b.hi ? -1 : (a.hi > b.hi ? 1 : 0)));
        if (!rows.length) return '';
        const hit = rows.find((s) => s.hi >= t);
        return hit ? hit.id : rows[rows.length - 1].id;
    }

    function pwRatOf(p) {
        const pw = pwNum(p && p.pwRating);
        return pw > 0 ? pw : pwNum(p && p.rating);
    }

    const PW_STAT_CATS = ['out', 'multi', 'entry', 'clutch', 'util', 'kill', 'honors', 'other'];
    
    const PW_CAT_TITLES = {
        out: ['输出与生存', 'Damage & survival'],
        multi: ['多杀（单回合 N 杀）', 'Multi-kill'],
        entry: ['首杀与突破', 'Entry / opening'],
        clutch: ['残局 1vN', 'Clutches (1vN)'],
        util: ['道具与投掷', 'Utility'],
        kill: ['特殊击杀', 'Special kills'],
        honors: ['荣誉 / 本场之最（官方旗标）', 'Honors (flags)'],
        other: ['其他（官方原始字段）', 'Other (raw fields)']
    };

    function pwStatNorm(k) { return String(k == null ? '' : k).toLowerCase().replace(/[^a-z0-9]/g, ''); }

    function pwExtraFam(items, fams) {
        const arr = Array.isArray(items) ? items : [];
        for (const re of fams) {
            const hit = arr.filter(( x) => re.test(pwStatNorm(x && x.k)));
            if (hit.length) return hit.reduce(( a,  x) => a + pwNum(x.v), 0);
        }
        return 0;
    }

    function pwPlayerTier(p, isZh, season) {
        const name = String((p && p.rankText) || '').trim();
        if (name) return name;
        const score = pwNum(p && p.rankScore);
        if (score > 0) {
            const t = pwTierLabel(String(season || ''), score, isZh);
            if (t) return t;
        }
        return pwNum(p && p.level) > 0 ? 'Lv ' + pwNum(p.level) : '';
    }

    function pwQuickStats(p) {
        const obj = (p && typeof p === 'object') ? p : {};

        const ex = (Array.isArray(obj.extra) && obj.extra.length)
            ? obj.extra
            : Object.keys(obj).map(( k) => ({ k: k, v: obj[k] }));
        
        const fam = (fams) => {
            for (const re of fams) {
                const hit = ex.filter(( x) => re.test(pwStatNorm(x && x.k)));
                if (hit.length) return hit.reduce(( a,  x) => a + pwNum(x.v), 0);
            }
            return null;
        };

        return {
            fk: fam([/^firstkillnum$/, /^firstkill$/, /^firstblood$/, /^entrykillnum$/, /^entrykill$/]),
            clutch: fam([/^endingwin$/, /^vs[1-5]$/, /^v[1-5]num$/, /^end[1-5]v[1-5]$/, /^clutch/]),
            m2: fam([/^twokillnum$/, /^twokill$/, /^doublekill$/, /^k2$/, /^kill2$/]),
            m3: fam([/^threekillnum$/, /^threekill$/, /^triplekill$/, /^k3$/, /^kill3$/]),
            m4: fam([/^fourkillnum$/, /^fourkill$/, /^quadkill$/, /^k4$/, /^kill4$/]),
            m5: fam([/^fivekillnum$/, /^fivekill$/, /^pentakill$/, /^k5$/, /^kill5$/])
        };
    }

    function pwPlayerSections(p, isZh, roundTotal, season) {
        const C = pwMdChip;
        const tierText = pwPlayerTier(p, isZh, season);
        
        const secs = [];

        secs.push({ cat: '', label: isZh ? '基础' : 'Basics', chips: [
            C(isZh ? '击杀' : 'Kills', pwMdVal(p.kills), { isZh }),
            C(isZh ? '死亡' : 'Deaths', pwMdVal(p.deaths), { isZh }),
            C(isZh ? '助攻' : 'Assists', pwMdVal(p.assists), { isZh }),
            C('K/D', pwNum(p.deaths) > 0 ? (pwNum(p.kills) / pwNum(p.deaths)).toFixed(2) : pwMdVal(p.kills), { isZh }),
            C('ADR', pwMdVal(p.adr, 1), { isZh, hot: pwNum(p.adr) >= 90 }),
            C(isZh ? '爆头率' : 'HS%', pwNum(p.hs) > 0 ? Math.round(pwNum(p.hs) * 100) + '%' : '—', { isZh, raw: 'headShotRatio' }),
            C('WE', pwMdVal(p.we, 2), { isZh, hot: pwNum(p.we) >= 8 }),
            C(isZh ? 'Rat' : 'Rating', pwMdVal(pwRatOf(p), 2), { isZh, raw: 'pwRating（同比赛记录行 Rat 列）/ rating' }),
            C('MVP', pwNum(p.mvps) > 0 ? String(pwNum(p.mvps)) : '—', { isZh, raw: 'mvps/mvpCount', hot: pwNum(p.mvps) > 0 }),
            C(isZh ? '段位' : 'Tier', tierText || '—', { isZh, raw: p.rankText ? 'rankName/levelName' : (pwNum(p.rankScore) > 0 ? 'pvpScore → 段位表' : 'level/tier') }),
            C(isZh ? '胜负' : 'Result', p.win ? '✓' : '—', { isZh })
        ] });
        const extra = Array.isArray(p.extra) ? p.extra : [];
        
        const of = (cat) => extra.filter(( x) => String(x.cat || 'other') === cat);

        const chips = (arr) => arr.map(( x) => C(String(x.label), x.s ? String(x.s) : pwMdVal(x.v), { isZh, raw: String(x.k) }));

        const title = (cat) => {
            const t = PW_CAT_TITLES[cat] || [cat, cat];
            return isZh ? t[0] : t[1];
        };

        PW_STAT_CATS.forEach((cat) => {
            const items = of(cat);
            if (!items.length) return;
            let chipsArr = chips(items);
            if (cat === 'multi') {
                
                const m3 = pwExtraFam(items, [/^((three|four|five)kill)num$/, /^(three|four|five)kill$/, /^(k|kill)[345]$/]);
                chipsArr = chipsArr.concat([C(isZh ? '3K 以上合计（自算）' : '3K+ total (computed)', pwMdVal(m3), { isZh, hot: m3 > 0 })]);
            } else if (cat === 'entry') {

                const fk = pwExtraFam(items, [/^firstkillnum$/, /^firstkill$/, /^firstblood$/, /^entrykillnum$/, /^entrykill$/]);
                const rt = pwNum(roundTotal);
                const rate = (fk > 0 && rt > 0) ? Math.round(fk / rt * 100) + '%' : '—';
                chipsArr = chipsArr.concat([C(isZh ? '首杀率（自算）' : 'Entry rate (computed)', rate, { isZh, raw: 'first_kill / round_total', hot: fk > 0 && rt > 0 })]);
            } else if (cat === 'clutch') {
                
                const total = pwExtraFam(items, [/^endingwin$/, /^vs[1-5]$/, /^v[1-5]num$/, /^end[1-5]v[1-5]$/, /^clutch/]);
                chipsArr = chipsArr.concat([C(isZh ? '残局合计（自算）' : 'Clutch total (computed)', pwMdVal(total), { isZh, hot: total > 0 })]);
            }
            secs.push({ cat: cat, label: title(cat), chips: chipsArr });
        });

        const trace = [];
        if (p.nameKey) trace.push(C(isZh ? '昵称字段' : 'name field', String(p.nameKey), { isZh, hot: true }));
        if (p.idKey) trace.push(C(isZh ? 'ID 字段' : 'id field', String(p.idKey), { isZh }));
        if (trace.length) secs.push({ cat: '', label: isZh ? '字段诊断' : 'Field trace', chips: trace });
        return secs;
    }

    function pwRosterPlayerHtml(p, opts) {
        const isZh = opts.isZh;
        
        const tier = pwPlayerTier(p, isZh, opts.season);
        const me = !!opts.mySid && String(p.steamId || '') === opts.mySid;
        const self = !me && !!opts.viewSid && String(p.steamId || '') === opts.viewSid;
        const ava = pwRosterAvatar(p.avatar);
        const hsPct = pwNum(p.hs) > 0 ? Math.round(pwNum(p.hs) * 100) + '%' : '—';

        const badges = (me ? `<b class="sps-f5e-rt-badge me">${isZh ? '我' : 'ME'}</b>` : '')
            + (self ? `<b class="sps-f5e-rt-badge self">${isZh ? '本页' : 'HERE'}</b>` : '')
            + (p.isMvp ? `<b class="sps-f5e-rt-badge mvp" title="${isZh ? '本场 MVP' : 'Match MVP'}">MVP</b>` : '')
            + (p.isSvp ? `<b class="sps-f5e-rt-badge svp" title="${isZh ? '本场 SVP（败方最佳）' : 'SVP'}">SVP</b>` : '');
        
        const q = pwQuickStats(p);
        const quick = [

            `<span class="sps-f5e-rt-s">${isZh ? '首杀' : 'FK'} <b${q.fk > 0 ? ' class="hi"' : ''}>${q.fk !== null ? q.fk : '—'}</b></span>`,
            q.clutch !== null ? `<span class="sps-f5e-rt-s">${isZh ? '残局' : '1vN'} <b${q.clutch > 0 ? ' class="hi"' : ''}>${q.clutch}</b></span>` : '',
            q.m2 !== null ? `<span class="sps-f5e-rt-mk">2K×${q.m2}</span>` : '',
            q.m3 !== null ? `<span class="sps-f5e-rt-mk">3K×${q.m3}</span>` : '',
            q.m4 !== null ? `<span class="sps-f5e-rt-mk">4K×${q.m4}</span>` : '',
            q.m5 !== null ? `<span class="sps-f5e-rt-mk">5K×${q.m5}</span>` : ''
        ].join('');
        const secs = pwPlayerSections(p, isZh, opts.roundTotal, opts.season);
        const detail = secs.map((s) => `<div class="sps-md-sec"><div class="sps-md-sec-h">${esc(s.label)}</div><div class="sps-md-sec-b">${s.chips.join('')}</div></div>`).join('');
        const cnt = secs.reduce((a, s) => a + s.chips.length, 0);
        return `<div class="sps-f5e-rt-player${me ? ' me' : ''}${self ? ' self' : ''}${opts.expanded ? ' open' : ''}">
            <div class="sps-md-line">
                ${ava ? `<img class="sps-f5e-rt-ava" src="${ava}" alt="" referrerpolicy="no-referrer">` : '<span class="sps-f5e-rt-ava"></span>'}
                <div class="sps-f5e-rt-main">
                    <div class="sps-f5e-rt-top">${pwRosterNameHtml(p, isZh, opts.idx)}${tier ? `<i class="sps-f5e-rt-tier" title="${isZh ? '本场段位' : 'Tier'} ">${esc(tier)}</i>` : ''}${badges}</div>
                    <div class="sps-f5e-rt-stats">
                        <span class="sps-pw-mh-val pw">${pwNum(p.kills)}/${pwNum(p.assists)}/${pwNum(p.deaths)}</span>
                        <span class="sps-f5e-rt-s">ADR ${pwMdVal(p.adr, 1)}</span>
                        <span class="sps-f5e-rt-s">HS% ${hsPct}</span>
                        <span class="sps-f5e-rt-s">WE ${pwMdVal(p.we, 2)}</span>
                        <span class="sps-f5e-rt-s">Rat ${pwMdVal(pwRatOf(p), 2)}</span>
                        ${quick}
                    </div>
                </div>
                <button type="button" class="sps-md-toggle" title="${isZh ? '展开/收起本场全部数据' : 'Toggle all stats'}">${isZh ? '详情' : 'INFO'}<b>${cnt}</b></button>
            </div>
            <div class="sps-md-detail">${detail}</div>
        </div>`;
    }

    function pwTeamAgg(team) {
        const arr = Array.isArray(team) ? team : [];
        const sum = ( f) => arr.reduce(( a,  p) => a + pwNum(f(p)), 0);
        const avg = ( f) => {
            const vals = arr.map(f).map(pwNum).filter(( v) => v > 0);
            return vals.length ? vals.reduce(( a,  b) => a + b, 0) / vals.length : 0;
        };

        const catFam = ( cat,  fams) => arr.reduce(( a,  p) => {
            const ex = (Array.isArray(p.extra) ? p.extra : []).filter(( x) => String(x.cat || '') === cat);
            return a + pwExtraFam(ex, fams);
        }, 0);
        return {
            kills: sum((p) => p.kills), deaths: sum((p) => p.deaths), assists: sum((p) => p.assists),
            adr: avg((p) => p.adr), we: avg((p) => p.we), rating: avg((p) => pwRatOf(p)), mvp: sum((p) => p.mvps),
            
            hasExtras: arr.some(( p) => Array.isArray(p.extra) && p.extra.length > 0),

            firstKill: catFam('entry', [/^firstkillnum$/, /^firstkill$/, /^firstblood$/, /^entrykillnum$/, /^entrykill$/]),
            multi3: catFam('multi', [/^((three|four|five)kill)num$/, /^(three|four|five)kill$/, /^(k|kill)[345]$/]),
            clutch: catFam('clutch', [/^endingwin$/, /^vs[1-5]$/, /^v[1-5]num$/, /^end[1-5]v[1-5]$/, /^clutch/]),
            flash: catFam('util', [/^flash/, /^blind/])
        };
    }

    const pwDemoBtnText = (isZh) => (isZh ? '下载demo' : 'Demo link');

    function renderPWRosterInto(bodyEl, r, opts) {
        const isZh = opts.isZh;
        const teams = Array.isArray(r.teams) && r.teams.length ? r.teams : null;
        const players = Array.isArray(r.players) ? r.players : [];
        const C = pwMdChip;

        const row = (opts && opts.row) || null;
        const pick = ( rv,  rowv) => (rowv !== undefined && rowv !== null && String(rowv) !== '') ? rowv : rv;
        const mapTxt = String(pick(r.map, row && row.map) || '—');
        const s1 = pwNum(pick(r.hasScore ? r.score1 : 0, row && row.score1));
        const s2 = pwNum(pick(r.hasScore ? r.score2 : 0, row && row.score2));
        const hasScore = (row && row.matchId && (pwNum(row.score1) > 0 || pwNum(row.score2) > 0)) || !!r.hasScore;

        const roundTotal = pwRoundTotal(r.roundTotal, s1, s2);
        
        const durMin = pwDurMin(pick(r.duration, row && row.duration));
        const durTxt = durMin > 0 ? durMin + (isZh ? ' 分钟' : ' min') : '—';

        const startRaw = String(r.startTime == null ? '' : r.startTime).trim();
        const endRaw = String(pick(r.endTime, row && row.date) || '').trim();
        const timeLabel = startRaw ? (isZh ? '开始' : 'Start') : (isZh ? '结束' : 'End');
        const timeTxt = pwTimeText(startRaw || endRaw) || '—';

        const seasonId0 = pwSeasonOf(row, (opts && opts.seasons) || [], startRaw || endRaw);

        const pOpt = ( base,  idx) =>
            Object.assign({}, opts, { idx: base + idx, roundTotal: roundTotal,
                season: seasonId0 });   

        const mEv = { winner: pwNum(r.winner), teamCount: teams ? teams.length : 0,
            tie: !!(s1 > 0 && s1 === s2) };   
        const winnerTxt = spsVerdictText(mEv, isZh);

        const teamScore = ( i) => {
            const vals = Array.isArray(r.teamVals) ? r.teamVals : null;
            if (vals && vals.length === 2 && ((vals[0] === 1 && vals[1] === 2) || (vals[0] === 2 && vals[1] === 1))) {
                return vals[i] === 1 ? s1 : s2;
            }
            return i === 0 ? s1 : s2;
        };
        const head = [
            C(isZh ? '地图' : 'Map', mapTxt, { isZh, raw: (r.mapKey ? String(r.mapKey) : 'row.mapName / map') }),
            C(isZh ? '比分' : 'Score', hasScore ? (teamScore(0) + ':' + teamScore(1)) : '—', { isZh, raw: 'row.score1 / score2' }),
            
            (mEv.winner > 0 || mEv.tie) ? C(isZh ? '胜方' : 'Winner', winnerTxt, { isZh, raw: 'base.winTeam（背景已按展示队序对齐）' }) : '',
            C(isZh ? '人数' : 'Players', String(players.length), { isZh }),
            C(isZh ? '总回合' : 'Rounds', pwMdVal(roundTotal), { isZh, raw: 'roundTotal / score1+score2' }),
            C(isZh ? '时长' : 'Duration', durTxt, { isZh, raw: 'row.duration / duration' }),
            C(timeLabel, timeTxt, { isZh, raw: startRaw ? 'base.startTime' : 'row.endTime' }),

            C(isZh ? '赛季' : 'Season', pwRowSeasonLabel(row, isZh, (opts && opts.seasons) || [], startRaw || endRaw),
                { isZh, raw: 'row.seasonId / row.season / 比赛时间推断' }),
            C(isZh ? '模式' : 'Mode', String(((row && row.mode) || '') || '—'), { isZh, raw: __S_content_pw_js(3) }),
            C(isZh ? '比赛 ID' : 'Match ID', String(r.matchId || (row && row.matchId) || '—'), { isZh })
        ].join('');

        const rv = (opts && opts.rowView) || null;

        const viewEv = {
            viewTeamIdx: -1,   
            viewWin: !!(rv && rv.isWin && !rv.isTie),
            
            viewLose: !!(rv && !rv.isWin && !rv.isTie && (pwNum(rv.score1) > 0 || pwNum(rv.score2) > 0)),
            viewTie: !!(rv && rv.isTie)
        };
        const viewRes = spsVerdictText(viewEv, isZh);   
        const viewRow = rv ? [
            C(isZh ? '击杀' : 'Kills', pwMdVal(rv.kills), { isZh }),
            C(isZh ? '死亡' : 'Deaths', pwMdVal(rv.deaths), { isZh }),
            C(isZh ? '助攻' : 'Assists', pwMdVal(rv.assists), { isZh }),
            C('K/D', pwNum(rv.deaths) > 0 ? (pwNum(rv.kills) / pwNum(rv.deaths)).toFixed(2) : pwMdVal(rv.kills), { isZh }),
            C(isZh ? '评分' : 'Rating', pwMdVal(pwRatOf(rv), 2), { isZh, raw: 'row.pwRating（同记录行 Rat 列）/ rating' }),
            C('WE', pwMdVal(rv.we, 2), { isZh, raw: 'row.we' }),
            C('ADR', rv.adrText ? esc(rv.adrText) : '—', { isZh, raw: 'row adr（已回填）' }),
            C(isZh ? '爆头率' : 'HS%', rv.hsText ? esc(rv.hsText) : '—', { isZh }),
            C('ELO/★', rv.eloText ? esc(rv.eloText) : '—', { isZh, raw: 'row.pvpScore/pvpStars' }),
            C(isZh ? '结果' : 'Result', viewRes, { isZh, hot: viewRes === (isZh ? '胜' : 'win') })
        ].join('') : '';
        
        const demo = r.demoUrl
            ? `<a class="sps-md-demo" href="${safeUrl(r.demoUrl)}" target="_blank" rel="noopener noreferrer" title="${isZh ? '打开官方录像/回放入口（本插件不代下、不带凭证）' : 'Open official demo/replay entry (no download here)'}">⬇ ${isZh ? '录像入口' : 'Demo'}</a>`
            : '';

        const mid0 = String((opts && opts.matchId) || r.matchId || '');

        const demoHint = isZh
            ? '左键：复制 demo 直链；Ctrl+左键：用浏览器打开'
            : 'Click: copy the directly-downloadable link (the signed OSS URL behind the platform 302; valid ~24h, no token inside - still do not share it); Ctrl/Cmd+Click: open that URL in the browser and download';
        
        const demoLabel = pwDemoBtnText(isZh);
        const demoBtn = r.demoReady
            ? `<button type="button" class="sps-md-demo dl" data-pw-demo="${esc(mid0)}" data-pw-demo-hint="${esc(demoHint)}" title="${esc(demoHint)}">⬇ ${demoLabel}</button>`
            : `<span class="sps-md-demo off" title="${isZh ? '需先在设置页填好完美 token 与「我的 SteamID」' : 'Set your PW token and SteamID in options first'}">⬇ ${demoLabel}</span>`;
        
        const diag = r.nameMissing
            ? `<div class="sps-md-diag">⚠ ${isZh ? '未能识别昵称字段，已退用 SteamID。可把下列官方字段名反馈给作者：' : 'Player name field not detected; falling back to SteamID. Report these keys:'} <code>${esc((r.rawKeys || []).join(', '))}</code></div>`
            : '';

        const vr = (opts && opts.rowView) || null;
        const viewSid0 = String((opts && opts.viewSid) || '');
        if (viewSid0) {
            const all0 = teams ? teams.reduce(( a,  t) => a.concat(t), []) : players;
            all0.forEach(( p) => {
                if (String(p.steamId || '') !== viewSid0) return;
                if (teams) viewEv.viewTeamIdx = (teams[0] || []).indexOf(p) >= 0 ? 0 : 1;
                if (!vr) return;
                if (!(pwNum(p.adr) > 0) && vr.adrText) p.adr = pwNum(vr.adrText);
                if (!(pwNum(p.hs) > 0) && vr.hsText) p.hs = pwNum(vr.hsText) / 100;
                if (!(pwNum(p.we) > 0)) p.we = pwNum(vr.we);
                if (!(pwRatOf(p) > 0)) p.rating = pwRatOf(vr);

                if (!(pwNum(p.rankScore) > 0)) p.rankScore = pwNum(vr.score !== undefined ? vr.score : vr.pvpScore);
                
                if (vr.isMvp) p.isMvp = true;
            });
        }

        const borderEv = Object.assign({}, mEv, viewEv);
        const teamHtml = ( t,  i) => {
            
            const base = teams ? teams.slice(0, i).reduce(( a,  x) => a + x.length, 0) : 0;
            const g = pwTeamAgg(t);

            const vd = spsTeamVerdict(i, borderEv);
            const win = vd === 'win';
            const lose = vd === 'lose';
            return `<div class="sps-f5e-rt-team${win ? ' win' : (lose ? ' lose' : '')}"><div class="sps-f5e-rt-teamhead"><span>${isZh ? '队伍' : 'Team'} ${i + 1}${win ? ` · ${isZh ? '胜' : 'WIN'}` : (lose ? ` · ${isZh ? '负' : 'LOSS'}` : '')}</span><b>${hasScore ? teamScore(i) : ''}</b></div>
                <div class="sps-md-chiprow">
                    ${C(isZh ? '总击杀' : 'Kills', String(g.kills), { isZh })}
                    ${C(isZh ? '总死亡' : 'Deaths', String(g.deaths), { isZh })}
                    ${C(isZh ? '总助攻' : 'Assists', String(g.assists), { isZh })}
                    ${C(isZh ? '均 ADR' : 'Avg ADR', pwMdVal(g.adr, 1), { isZh })}
                    ${C(isZh ? '均 WE' : 'Avg WE', pwMdVal(g.we, 2), { isZh })}
                    ${C(isZh ? '均 Rat' : 'Avg Rat', pwMdVal(g.rating, 2), { isZh })}
                    ${C('MVP', String(g.mvp), { isZh })}
                    ${g.hasExtras ? C(isZh ? '首杀' : 'FK', String(g.firstKill), { isZh, hot: g.firstKill > 0, raw: 'firstKill（自算）' }) : ''}
                    ${g.hasExtras ? C(isZh ? '3K+' : '3K+', String(g.multi3), { isZh, hot: g.multi3 > 0, raw: 'k3..k5（自算）' }) : ''}
                    ${g.hasExtras ? C(isZh ? '残局' : '1vN', String(g.clutch), { isZh, hot: g.clutch > 0, raw: 'end*（自算）' }) : ''}
                    ${g.hasExtras ? C(isZh ? '致盲' : 'Flashes', String(g.flash), { isZh, hot: g.flash > 0, raw: 'flash*（自算）' }) : ''}
                </div>
                ${t.map(( p,  pi) => pwRosterPlayerHtml(p, pOpt(base, pi))).join('')}</div>`;
        };
        const body = teams
            ? `<div class="sps-f5e-rt-teams">${teams.map(teamHtml).join('')}</div>`
            : `<div class="sps-f5e-rt-teams">${players.map(( p,  pi) => pwRosterPlayerHtml(p, pOpt(0, pi))).join('')}</div>`;
        bodyEl.innerHTML = `<div class="sps-md-sum"><div class="sps-md-sum-h">${isZh ? '比赛概要' : 'Match'}</div><div class="sps-md-chiprow">${head}</div>`
            + (viewRow ? `<div class="sps-md-sum-h">${isZh ? '本页玩家 · 本场' : 'This profile in this match'}</div><div class="sps-md-chiprow">${viewRow}</div>` : '')
            + demo + demoBtn + `</div>` + diag + body;
    }

    function pwReadMySteamId() {
        return new Promise((resolve) => spsReadAccountId([SPS_PW_MY_SID_KEY, 'sps_my_steamid'], resolve));
    }

    async function openPWRoster(matchId, ctx) {
        const mid = String(matchId || '');
        if (!mid) return;
        const isZh = !(ctx && ctx.isZh === false);
        const viewSid = String((ctx && ctx.steamId) || '');
        if (_pwRosterActiveClose) _pwRosterActiveClose();
        const skin = spsHostPanelSkin('.sps-pw-modal:not(.sps-f5e-modal) .sps-pw-panel');
        const modal = document.createElement('div');
        modal.className = 'sps-pw-modal sps-pw-roster sps-pw-pip-mode';
        modal.innerHTML = `<div class="sps-pw-overlay"></div>
            <div class="sps-pw-panel${skin.cls ? ' ' + skin.cls : ''}" style="--sps-corner:${skin.corner};">
                <div class="sps-pw-header"><span class="sps-pw-header-title">${isZh ? '比赛详情' : 'Match details'}</span>
                    <span class="sps-pw-header-actions">
                        <button type="button" class="sps-md-allbtn" title="${isZh ? '展开/收起全部玩家的明细' : 'Expand/collapse all'}">${isZh ? '展开全部' : 'Expand all'}</button>
                        <button class="sps-frame-ctrl sps-pw-roster-close">&times;</button>
                    </span></div>
                <div class="sps-pw-body"><div class="sps-f5e-roster-body"><div class="sps-pw-loading">${isZh ? '📡 读取中...' : '📡 Loading...'}</div></div></div>
            </div>`;
        document.body.appendChild(modal);
        spsFocusWindow(modal);
        document.dispatchEvent(new CustomEvent('sps-window-focus', { detail: { el: modal } }));
        const panel =  (modal.querySelector('.sps-pw-panel'));
        panel.addEventListener('pointerdown', () => { spsFocusWindow(modal); document.dispatchEvent(new CustomEvent('sps-window-focus', { detail: { el: modal } })); });
        const disposeResize = spsBindResize({ target: panel, min: { w: 420, h: 260 } });
        const header =  (modal.querySelector('.sps-pw-header'));
        let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
        header.style.cursor = 'grab';
        header.addEventListener('mousedown', ( e) => {
            if ( (e.target).closest('.sps-pw-roster-close') ||  (e.target).closest('.sps-md-allbtn')) return;
            dragging = true;
            const r = panel.getBoundingClientRect();
            sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
            header.style.cursor = 'grabbing';
            panel.style.position = 'fixed'; panel.style.left = ox + 'px'; panel.style.top = oy + 'px'; panel.style.margin = '0';
            e.preventDefault();
        });
        const onMove = ( e) => {
            if (!dragging) return;
            const pos = spsClampPanelPos(panel, ox + e.clientX - sx, oy + e.clientY - sy);
            panel.style.left = pos.left + 'px'; panel.style.top = pos.top + 'px';
        };
        const onUp = () => { if (dragging) { dragging = false; header.style.cursor = 'grab'; } };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        const close = () => {
            spsUnregisterWindow(modal);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            try { disposeResize(); } catch (e) {  }
            if (_pwRosterActiveClose === close) _pwRosterActiveClose = null;
            modal.remove();
        };
        _pwRosterActiveClose = close;
        modal.querySelector('.sps-pw-roster-close').addEventListener('click', close);
        modal.querySelector('.sps-pw-overlay').addEventListener('click', close);
        const bodyEl =  (modal.querySelector('.sps-f5e-roster-body'));
        
        bodyEl.addEventListener('click', ( e) => {
            const btn = e.target.closest ? e.target.closest('.sps-md-toggle') : null;
            if (!btn) return;
            const row = btn.closest('.sps-f5e-rt-player');
            if (!row) return;
            e.preventDefault(); e.stopPropagation();
            row.classList.toggle('open');
            btn.classList.toggle('on', row.classList.contains('open'));
        });

        bodyEl.addEventListener('click', ( e) => {
            const btn = e.target.closest ? e.target.closest('[data-pw-demo]') : null;
            if (!btn) return;
            e.preventDefault(); e.stopPropagation();
            if (btn.dataset.pwDemoBusy) return;
            const copy = !(e.ctrlKey || e.metaKey);
            const open = !copy;

            const flash = ( text,  title) => {
                btn.textContent = text;
                btn.title = title || text;
                setTimeout(() => {
                    if (!modal.isConnected || btn.dataset.pwDemoBusy) return;
                    btn.textContent = '⬇ ' + pwDemoBtnText(isZh);
                    btn.title = btn.getAttribute('data-pw-demo-hint') || pwDemoBtnText(isZh);
                }, 2500);
            };
            btn.dataset.pwDemoBusy = '1';
            btn.textContent = copy ? (isZh ? '⬇ 解析中…' : '⬇ Resolving…') : (isZh ? '⬇ 打开中…' : '⬇ Opening…');
            safeSendMessage({ type: 'PW_DEMO_LINK', matchId: String(btn.getAttribute('data-pw-demo') || ''), open: open }, ( res) => {
                if (!modal.isConnected) return;
                delete btn.dataset.pwDemoBusy;
                const err = res && res.error ? String(res.error) : '';
                const fail = {
                    NO_TOKEN: isZh ? '⬇ 未配置凭证' : '⬇ No credentials',
                    NO_MATCH: isZh ? '⬇ 缺少比赛 ID' : '⬇ No match id',
                    DNR_FAIL: isZh ? '⬇ 注头失败' : '⬇ Header rule failed',
                    TABS_FAIL: isZh ? '⬇ 打不开标签' : '⬇ Cannot open tab'
                }[err] || (isZh ? '⬇ 生成失败' : '⬇ Failed');
                
                const isDirect = !!(res && res.resolved);
                if (res && res.success && open) {
                    flash(isZh ? '⬇ 已在新标签打开' : '⬇ Opened in tab',
                        isDirect
                            ? (isZh ? '新标签直接下这份文件（自签名直链，浏览器自己请求，不需要身份头）' : 'Downloading in the new tab (self-signed direct link; no identity headers needed)')
                            : (isZh ? '已交新标签（扩展现注身份头请求平台口）；被拒的常见原因是平台按 IP 的下载配额，隔一阵再试' : 'Opened in a new tab (the browser sent the injected identity headers); a rejection is usually the per-IP download quota - retry later'));
                    return;
                }
                if (res && res.success && res.url) {
                    
                    spsCopyText(String(res.url)).then(( ok) => {
                        if (!modal.isConnected) return;
                        flash(ok
                            ? (isDirect ? (isZh ? '⬇ 直链已复制' : '⬇ Link copied') : (isZh ? '⬇ 已复制·未解析' : '⬇ Copied (unresolved)'))
                            : (isZh ? '⬇ 复制失败' : '⬇ Copy failed'),
                            ok
                                ? (isDirect
                                    ? (isZh ? '已复制可直下的直链（OSS 自签名，约 24h 内有效；不含你的 token，仍别公开转发）' : 'Copied a directly-downloadable link (signed OSS URL, valid ~24h; no token inside - still do not post it publicly)')
                                    : (isZh ? '没能解析出直链，复制的是平台地址：它需要身份头，粘到别处会被拒（code 1033）；建议 Ctrl/Cmd+左键直接打开' : 'Resolution failed; copied the platform URL instead: it needs identity headers and will be rejected elsewhere (code 1033). Try Ctrl/Cmd+Click instead'))
                                : (isZh ? '复制失败：试试 Ctrl/Cmd+左键直接打开下载' : 'Copy failed: try Ctrl/Cmd+Click to open and download'));
                    });
                    return;
                }
                flash(fail, fail);
            }, 30000);
        });
        const allBtn =  (modal.querySelector('.sps-md-allbtn'));
        allBtn.addEventListener('click', ( e) => {
            e.preventDefault(); e.stopPropagation();
            const on = !bodyEl.classList.contains('sps-md-all');
            bodyEl.classList.toggle('sps-md-all', on);
            bodyEl.querySelectorAll('.sps-f5e-rt-player').forEach(( r2) => r2.classList.remove('open'));
            bodyEl.querySelectorAll('.sps-md-toggle').forEach(( b2) => b2.classList.remove('on'));
            allBtn.textContent = on ? (isZh ? '收起全部' : 'Collapse all') : (isZh ? '展开全部' : 'Expand all');
        });
        const mySid = await pwReadMySteamId();   
        if (!modal.isConnected) return;
        const opts = { isZh: isZh, mySid: mySid, viewSid: viewSid, expanded: false, matchId: mid,
            row: (ctx && ctx.row) || null, rowView: (ctx && ctx.rowView) || null,
            seasons: (ctx && ctx.seasons) || [] };   
        safeSendMessage({ type: 'FETCH_PW_ROSTER', matchId: mid, steamId: viewSid }, ( res) => {
            if (!modal.isConnected) return;
            const data = res && res.success ? res.data : null;
            if (!data || data.error || (!Array.isArray(data.players) && !(Array.isArray(data.teams) && data.teams.length))) {
                bodyEl.innerHTML = `<div class="sps-pw-na">${isZh ? '该场比赛详情不可得' : 'No match details for this match'}</div>`;
                return;
            }
            renderPWRosterInto(bodyEl, data, opts);
        }, 20000);
    }

    function pwNum(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
    function renderPWSeasonDetail(detailEl, d, ov, isZh, ctx) {
        d = d || {};
        d.winRate = pwNum(d.winRate); d.pwRating = pwNum(d.pwRating); d.kd = pwNum(d.kd);
        d.adr = pwNum(d.adr); d.rws = pwNum(d.rws); d.hsRatio = pwNum(d.hsRatio);
        d.avgWe = pwNum(d.avgWe); d.shot = pwNum(d.shot); d.snipe = pwNum(d.snipe);
        d.breach = pwNum(d.breach); d.prop = pwNum(d.prop); d.victory = pwNum(d.victory);
        d.cnt = pwNum(d.cnt); d.currentScore = pwNum(d.currentScore);
        if (!Array.isArray(d.hotMaps)) d.hotMaps = [];
        if (!Array.isArray(d.hotWeapons)) d.hotWeapons = [];

        if (d.summary && String(d.summary).trim()) ov = Object.assign({}, ov, { summary: String(d.summary).trim() });
        
        detailEl._pwFullData = {
            maps: Array.isArray(d.hotMaps) ? d.hotMaps : [],
            weapons: Array.isArray(d.hotWeapons) ? d.hotWeapons : [],
            mh: pwMhVisibleRows(Array.isArray(d.matchHistory) ? d.matchHistory.filter(( x) => x && x.date) : [])
                .filter(( x) => !d.seasonId || !x.seasonId || String(x.seasonId) === String(d.seasonId))
        };
        detailEl._pwIsZh = isZh;

        detailEl._pwOverview = ov || null;
        detailEl._pwCtx = ctx || null;   
        
        detailEl._pwMhFilter = [];   
        detailEl._pwWeBackfill = (() => {
            let inFlight = false;
            return () => {
                const els = Array.from(detailEl.querySelectorAll('[data-pw-we]'))
                    .filter(( el) => !el.dataset.pwWeDone);
                const batch = els.slice(0, 25);
                batch.forEach(( el) => { el.dataset.pwWeDone = '1'; });   
                const ids = batch.map(( el) => el.getAttribute('data-pw-we') || '').filter(Boolean);
                if (!ids.length || inFlight) return;
                inFlight = true;

                safeSendMessage({ type: __S_content_pw_js(4), steamId: (ctx && ctx.steamId) || '', matchIds: ids }, ( r2) => {
                    inFlight = false;
                    if (!detailEl.isConnected || !r2 || !r2.success || !r2.data || !r2.data.details) return;
                    const det = r2.data.details || {};
                    detailEl.querySelectorAll('[data-pw-we]').forEach(( el) => {
                        const hit = det[el.getAttribute('data-pw-we') || ''];
                        if (hit && hit.we > 0) {
                            el.textContent = hit.we.toFixed(2);
                            
                            el.className = 'sps-pw-mh-val we' + pwMhToneCls(hit.we, 8);
                        }
                    });
                });
            };
        })();
        const maps = (d.hotMaps || []).slice(0, 5).map((m,i) => {
            const c=m.totalMatch||0,w=m.winCount||0,adr=c?((m.totalAdr||0)/c).toFixed(1):'0',rat=c?((m.ratingSum||0)/c).toFixed(2):'0';
            return `<div class="sps-pw-map"><span class="sps-pw-map-num">${i+1}.</span> ${esc(m.mapName)||'?'} — ${c}场 ${c?(w/c*100).toFixed(1):'0'}% ADR:${adr} Rat:${rat}</div>`;
        }).join('') || '<div class="sps-pw-na">—</div>';

        const wps = (d.hotWeapons||[]).slice(0, 5).map((w,i) => {
            const fs=w.firstShotAccuracy!=null?(w.firstShotAccuracy*100).toFixed(1)+'%':'N/A';
            return `<div class="sps-pw-wep"><div class="sps-pw-wep-name">${i+1}. ${esc(w.nameZh || w.name) || '?'}</div>
                <div class="sps-pw-wep-stats">击杀:${w.killNum||0} 爆头:${((w.headshotRate||0)*100).toFixed(1)}%[${esc(w.levelHeadshotRate)||'?'}] 首发:${fs}[${esc(w.levelAccuracy)||'?'}] 用时:${w.avgTimeToKill||0}ms[${esc(w.levelAvgTimeToKill)||'?'}]</div></div>`;
        }).join('') || '<div class="sps-pw-na">—</div>';

        const isCurrent = d.seasonId === ov.currentSeason;
        const scoreLabel = isCurrent ? (isZh ? '当前ELO' : 'Current ELO') : (isZh ? '赛季ELO' : 'Season End ELO');

        const maxSeasonSuffix = ov.maxScore > 0 && ov.maxSeason ? ` (${pwSeasonLabel(ov.maxSeason, isZh)})` : '';

        const maxStars = ov.maxSeason === ov.currentSeason ? ov.stars
            : (((ov.seasonList || []).find(( x) => x.season === ov.maxSeason) || {}).peakStars || 0);
        const maxScoreText = ov.maxScore > 0
            ? `${ov.maxScore}${pwTierSuffix(pwSDecor(ov.maxSeason, ov.maxScore, isZh, maxStars), isZh)}${maxSeasonSuffix}`
            : '-';

        const summaryHtml = ov.summary
            ? `<div class="sps-pw-tag">🏷️ ${esc(String(ov.summary))}</div>` : '';

        const hasScoreList = Array.isArray(d.scoreList) && d.scoreList.length > 0;

        const histStar = ( st,  sc) => {
            const sN = pwNum(st), cN = pwNum(sc);
            return (sN > 0 && cN >= 2401) ? '★' + sN : (cN > 0 ? String(cN) : '');
        };
        const hist5 = hasScoreList
            ? d.scoreList.slice(0, 5).map(( r) => histStar(r && r.stars, r && r.score) || (isZh ? '定级' : 'Place'))
            : (detailEl._pwFullData.mh || []).slice(0, 5).reverse().map(( m) => {
                return histStar(m.stars, m.score) || '—';   
            });

        const pwGi = ( p) => `<div class="sps-pw-gi"><span class="sps-pw-lb">${p[0]}</span><span class="sps-pw-gv">${p[1]}</span></div>`;
        detailEl.innerHTML = `<div class="sps-pw-sec">${isZh?'用户信息':'Info'}</div>
            <div class="sps-pw-grid sps-pw-grid-3col">${[
                [isZh?'玩家':'Player', esc(ov.name || d.name)],
                [isZh?'赛季':'Season', d.seasonId ? pwSeasonLabel(d.seasonId, isZh) : '-'],
                [isZh?'场次/胜率':'Matches/W%',`${d.cnt}场 / ${d.winRate.toFixed(1)}%`],
                [scoreLabel, `${d.currentScore}${pwTierSuffix(pwSDecor(d.seasonId, d.currentScore, isZh, d.stars), isZh)}`],
                [isZh?'历史最高':'All-Time High', maxScoreText],
                ['<span class="sps-pw-gi-blank"></span>', '']   
            ].map(pwGi).join('')}</div>
            ${hist5.length?`<div class="sps-pw-trend">${isZh?'近5局':'Recent5'}: ${hist5.join(' ← ')}</div>`:''}
            <div class="sps-pw-sec">${isZh?'数据表现':'Stats'}</div>
            <div class="sps-pw-grid sps-pw-grid-3col">${[
                ['PW Rating',d.pwRating.toFixed(2)],['ADR',d.adr.toFixed(1)],
                ['K/D',d.kd.toFixed(2)],['RWS',d.rws.toFixed(2)],
                [isZh?'爆头率':'HS%',d.hsRatio.toFixed(1)+'%'],['WE',d.avgWe.toFixed(2)]
            ].map(pwGi).join('')}</div>
            <div class="sps-pw-sec">${isZh?'各项数据':'Data Analysis'}</div>
            <div class="sps-pw-radar-box">${renderPentagonRadar([
                { label: isZh ? '枪法' : 'Shot', score: d.shot.toFixed(2), value: d.shot, grade: pwGradeOf(d.shot) },
                { label: isZh ? '狙击' : 'Snipe', score: d.snipe.toFixed(2), value: d.snipe, grade: pwGradeOf(d.snipe) },
                { label: isZh ? '突破' : 'Breach', score: d.breach.toFixed(2), value: d.breach, grade: pwGradeOf(d.breach) },
                { label: isZh ? '道具' : 'Util', score: d.prop.toFixed(2), value: d.prop, grade: pwGradeOf(d.prop) },
                { label: isZh ? '残局' : 'Clutch', score: d.victory.toFixed(2), value: d.victory, grade: pwGradeOf(d.victory) }
            ], 'pw')}</div>
            ${summaryHtml}
            ${pwMatchHistoryHtml(d, isZh)}
            <div class="sps-pw-sec">${isZh?'常玩地图':'Top Maps'}</div>
            <div class="sps-pw-maps">${maps}</div>
            ${(d.hotMaps||[]).length > 5 ? `<div class="sps-pw-expand" role="button" tabindex="0" data-pw-expand="maps">▾ ${isZh ? '展开其余 ' + ((d.hotMaps||[]).length - 5) + ' 张地图' : 'Show all maps'}</div>` : ''}
            <div class="sps-pw-sec">${isZh?'常用武器':'Top Weapons'}</div>
            <div class="sps-pw-weps">${wps}</div>
            ${(d.hotWeapons||[]).length > 5 ? `<div class="sps-pw-expand" role="button" tabindex="0" data-pw-expand="weapons">▾ ${isZh ? '展开其余 ' + ((d.hotWeapons||[]).length - 5) + ' 件武器' : 'Show all weapons'}</div>` : ''}`;
        bindPWMatchHistory(detailEl);

        if (ctx && ctx.detail && ctx.steamId) {

            safeSendMessage({ type: 'FETCH_PW_MATCHLIST', steamId: ctx.steamId, seasonId: String(d.seasonId || 'recent'), page: 1 }, ( res) => {
                if (!detailEl.isConnected) return;
                if (!res || !res.success || !res.data || !res.data.success || !Array.isArray(res.data.rows)) {

                    const reason = (res && res.data && res.data.reason) || (res && res.data && res.data.error) || (isZh ? '接口未返回数据' : 'no data');
                    const wrapEl0 = detailEl.querySelector('.sps-pw-mh-wrap');
                    if (wrapEl0) {
                        const t0 = wrapEl0.querySelector('.sps-pw-mh-toggle');
                        if (t0 && !wrapEl0.querySelector('.sps-pw-mh-detail-diag')) {
                            const diag = document.createElement('i');
                            diag.className = __S_content_pw_js(5);
                            diag.title = (isZh ? '明细未启用：' : 'detail unavailable: ') + reason;
                            diag.textContent = '?';
                            diag.style.cssText = 'font-style:normal;color:#6a7480;font-size:9px;margin-left:6px;cursor:help;border:1px solid #6a7480;border-radius:50%;width:12px;height:12px;line-height:11px;display:inline-block;text-align:center;';
                            t0.appendChild(diag);
                        }
                    }
                    return;
                }

                const applySummary = ( txt) => {
                    const tagEl = detailEl.querySelector('.sps-pw-tag');
                    if (tagEl) { tagEl.textContent = '🏷️ ' + txt; return; }
                    const radar = detailEl.querySelector('.sps-pw-radar-box');
                    if (radar) {
                        const t = document.createElement('div');
                        t.className = 'sps-pw-tag';
                        t.textContent = '🏷️ ' + txt;
                        radar.insertAdjacentElement('afterend', t);
                    }
                };
                if (res.data.officialSummary) applySummary(res.data.officialSummary);
                const wrapEl = detailEl.querySelector('.sps-pw-mh-wrap');
                if (!res.data.rows.length) return;   
                const rows = res.data.rows;
                const newWrap = pwMatchHistoryHtml({ seasonId: d.seasonId, matchHistory: rows, detail: true, filter: detailEl._pwMhFilter }, isZh);
                if (newWrap) {
                    if (wrapEl) {
                        wrapEl.outerHTML = newWrap;
                    } else {
                        
                        const host = detailEl.querySelector('.sps-pw-tag') || detailEl.querySelector('.sps-pw-radar-box');
                        if (host) host.insertAdjacentHTML('afterend', newWrap);
                    }

                    detailEl._pwFullData = Object.assign({}, detailEl._pwFullData,
                        { mh: rows.filter(( x) => x && x.date) });
                    bindPWMatchHistory(detailEl);

                    const pickBackfill = () => {
                        const els = Array.from(detailEl.querySelectorAll('[data-pw-adr]'))
                            .filter(( el) => el.textContent === '—' || el.textContent === '');
                        return els.slice(0, 25).map(( el) => el.getAttribute('data-pw-adr') || '').filter(Boolean);
                    };
                    const backfillAdr = ( ids) => {
                        if (!ids.length) return;
                        safeSendMessage({ type: __S_content_pw_js(4), steamId: ctx.steamId, matchIds: ids }, ( r2) => {
                            if (!detailEl.isConnected || !r2 || !r2.success || !r2.data || !r2.data.details) return;
                            const det = r2.data.details || {};
                            detailEl.querySelectorAll('[data-pw-adr]').forEach(( el) => {
                                const hit = det[el.getAttribute('data-pw-adr') || ''];
                                if (!hit) return;
                                if (hit.adr > 0) el.textContent = String(Math.round(hit.adr));
                                
                                if (hit.hsRatio > 0) {
                                    const row = el.closest('.sps-pw-mh-row');
                                    const hsEl = row && row.querySelector('.sps-pw-mh-val.hs');
                                    if (hsEl) hsEl.textContent = Math.round(hit.hsRatio * 100) + '%';
                                }
                            });
                        });
                    };
                    backfillAdr(pickBackfill());

                    detailEl._pwBackfill = () => backfillAdr(pickBackfill());
                }
            });
        }
    }

