    
    
    function renderShowcaseMode(steamID, settings, txt, opts) {
        const fallback = !!(opts && opts.fallback);
        let mainContent = document.querySelector('.profile_content')
            || document.querySelector('.responsive_page_template_content')
            || document.querySelector('.profile_page')
            || document.querySelector('.pagecontent');
        if (!mainContent) {
            console.log('[SPS] No suitable container found on page');
            return;
        }

        if (!mainContent.classList.contains('profile_content') && !mainContent.id) {
            const pc = document.querySelector('.profile_content');
            if (pc) mainContent = pc;
        }

        const container = document.createElement('div');
        container.className = getContainerClass(settings, 'sps-container sps-showcase-mode');

        let toolsHtml = '';
        
        if (settings.sps_show_pw) toolsHtml += `<button class="sps-btn btn-pw" data-steamid="${steamID}">${txt.pw_btn}</button>`;
        if (settings.sps_show_5e) toolsHtml += `<button class="sps-btn btn-f5e" data-steamid="${steamID}">${txt.f5e_btn}</button>`;

        const permalinkUrl = `https://steamcommunity.com/profiles/${steamID}`;

        container.innerHTML = `
            <div class="sps-header">
                <div class="sps-id-group">
                    <div class="sps-id-item">
                        <span class="sps-icon">🆔</span>
                        <span class="sps-text-copy" title="${esc(txt.id_title)}" data-sid="${steamID}">${steamID}</span>
                    </div>
                    <div class="sps-id-item">
                        <span class="sps-icon">🔗</span>
                        <span class="sps-link-copy" title="点击复制链接" data-url="${permalinkUrl}" data-label="${esc(txt.link_text)}">${txt.link_text}</span>
                    </div>
                </div>
                <div class="sps-tools">${toolsHtml}</div>
            </div>
            <div class="sps-content-area">
                <div class="sps-loading">${txt.loading}</div>
            </div>
        `;

        const insertPoint = mainContent.querySelector('.profile_header') || mainContent.querySelector('.profile_in_header') || null;
        if (insertPoint) {
            mainContent.insertBefore(container, insertPoint);
        } else if (mainContent.firstChild) {
            mainContent.insertBefore(container, mainContent.firstChild);
        } else {
            mainContent.appendChild(container);
        }

        const linkCopyEl = container.querySelector('.sps-link-copy');
        if (linkCopyEl) linkCopyEl.addEventListener('click', function() { copyToClipboard(permalinkUrl,  (this), txt); });
        const textCopyEl = container.querySelector('.sps-text-copy');
        if (textCopyEl) bindSteamIDQR( (textCopyEl), steamID, txt);

        bindEventsAndFetch(container, steamID, txt, fallback ? 'showcase-fallback' : 'showcase', settings);
        bindPWButton(steamID, settings);
        bindF5eButton(steamID, settings);
        
        autoFetchPWBanStatus(steamID, settings, txt, container.querySelector('.sps-header .sps-id-group'));
        
        autoFetchF5eBanStatus(steamID, settings, txt, container.querySelector('.sps-header .sps-id-group'));
    }

    function renderHeaderIdBar(steamID, settings, txt) {
        const headerContent = document.querySelector('.profile_header_content');
        if (!headerContent) return false;
        const permalinkUrl = `https://steamcommunity.com/profiles/${steamID}`;

        const idBar = document.createElement('div');
        idBar.className = getContainerClass(settings, 'sps-split-id-row');
        idBar.innerHTML = `
            <div class="sps-id-item">
                <span class="sps-icon">🆔</span>
                <span class="sps-text-copy" title="${esc(txt.id_title)}" data-sid="${steamID}">${steamID}</span>
            </div>
            <div class="sps-id-item">
                <span class="sps-icon">🔗</span>
                <span class="sps-link-copy" title="点击复制链接" data-url="${permalinkUrl}" data-label="${esc(txt.link_text)}">${txt.link_text}</span>
            </div>
        `;

        const personaBlock =  (headerContent.querySelector('.profile_header_centered_persona'));
        const nameEl =  (headerContent.querySelector('.persona_name'));
        const hostBlock = personaBlock || (nameEl ? nameEl.parentElement : null);
        if (hostBlock) {
            const realNameEl =  (hostBlock.querySelector('.header_real_name'));
            if (realNameEl) hostBlock.insertBefore(idBar, realNameEl);
            else hostBlock.appendChild(idBar);   
        } else {
            headerContent.appendChild(idBar);   
        }

        spsAdoptNativeTextStyle(idBar, [
            hostBlock ? hostBlock.querySelector('.header_real_name') : null,
            hostBlock ? hostBlock.querySelector('.header_location') : null,
            headerContent
        ]);

        idBar.querySelector('.sps-link-copy').addEventListener('click', function() { copyToClipboard(permalinkUrl, this, txt); });
        bindSteamIDQR(idBar.querySelector('.sps-text-copy'), steamID, txt);
        return idBar;
    }

    let _spsSplitOutsideClose = null;

    function renderSplitMode(steamID, settings, txt) {
        const headerContent = document.querySelector('.profile_header_content');
        if (!headerContent) {

            addDebugLog('ui', `split: 未找到 .profile_header_content → 降级为展柜模式 steamid=${steamID}`);
            renderShowcaseMode(steamID, settings, txt, { fallback: false });
            return;
        }

        const idBar = renderHeaderIdBar(steamID, settings, txt);

        const headerActions = document.querySelector('.profile_header_actions');
        if (headerActions) {
            const statsBtnContainer = document.createElement('div');
            statsBtnContainer.className = 'sps-split-btn-wrapper';
            const dropdownClass = getContainerClass(settings, 'sps-dropdown-panel');
            
            statsBtnContainer.innerHTML = `
                <span data-panel="{&quot;focusable&quot;:true}" role="button" aria-haspopup="true" aria-expanded="false" title="${esc(txt.stats_btn)}" class="btn_profile_action btn_medium sps-toggle-btn">
                    <span><img src="${chrome.runtime.getURL('images/CS2.svg')}" alt=""></span>
                </span>
                <div class="${dropdownClass}" style="display:none;">
                    <div class="sps-tools-mini">
                        <!-- v1.10.40：CSStats 跳转钮撤下（展柜/分体由数据卡承担，卡内名链仍可跳帧窗） -->
                        ${settings.sps_show_pw ? `<button class="sps-btn-mini btn-pw" data-steamid="${steamID}">${txt.pw_btn}</button>` : ''}
                        ${settings.sps_show_5e ? `<button class="sps-btn-mini btn-f5e" data-steamid="${steamID}">${txt.f5e_btn}</button>` : ''}
                    </div>
                    <div class="sps-content-area">
                         <div class="sps-loading">${txt.loading}</div>
                    </div>
                </div>
            `;

            headerActions.appendChild(statsBtnContainer);

            const btn = statsBtnContainer.querySelector('.sps-toggle-btn');
            const panel = statsBtnContainer.querySelector('.sps-dropdown-panel');
            let isFetched = false;
            const closeMode = settings.sps_split_close_mode || 'outside';
            let isOpen = false;
            let _closeTimer = null;

            function openPanel() {
                if (_closeTimer) { clearTimeout(_closeTimer); _closeTimer = null; }

                const _scale = Number(settings.sps_scale) || 1;
                panel.style.maxWidth = Math.max(240, Math.floor((window.innerWidth - 20) / _scale)) + 'px';
                panel.style.maxHeight = Math.max(200, Math.floor((window.innerHeight - 120) / _scale)) + 'px';
                panel.classList.remove('sps-closing');
                panel.style.display = 'block';
                btn.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
                isOpen = true;
                document._pwClosing = false;
                document._pwDragging = false;
                if (!isFetched) {
                    bindEventsAndFetch(statsBtnContainer, steamID, txt, 'split', settings);
                    isFetched = true;
                }
            }
            function closePanel() {
                if (_closeTimer) clearTimeout(_closeTimer);
                panel.classList.add('sps-closing');
                _closeTimer = setTimeout(() => {
                    panel.style.display = 'none';
                    panel.classList.remove('sps-closing');
                    btn.classList.remove('active');
                    btn.setAttribute('aria-expanded', 'false');
                    _closeTimer = null;
                }, 150);
                isOpen = false;
            }

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (isOpen) { closePanel(); return; }
                openPanel();
            });

            if (_spsSplitOutsideClose) {
                document.removeEventListener('click', _spsSplitOutsideClose);
                _spsSplitOutsideClose = null;
            }
            if (closeMode === 'outside') {
                const onDocClick = (e) => {
                    if (!statsBtnContainer.isConnected) {
                        
                        document.removeEventListener('click', onDocClick);
                        if (_spsSplitOutsideClose === onDocClick) _spsSplitOutsideClose = null;
                        return;
                    }
                    if (!isOpen) return;
                    if (statsBtnContainer.contains(e.target)) return;
                    if (document._pwDragging) { return; }
                    if (document._pwClosing) { document._pwClosing = false; return; }
                    const pwModal = document.querySelector('.sps-pw-modal');
                    if (pwModal && pwModal.contains(e.target)) return;
                    closePanel();
                };
                _spsSplitOutsideClose = onDocClick;
                document.addEventListener('click', onDocClick);
            }
        }

        bindPWButton(steamID, settings);
        bindF5eButton(steamID, settings);

        const banAnchor = idBar ||  (headerContent);
        autoFetchPWBanStatus(steamID, settings, txt, banAnchor);
        autoFetchF5eBanStatus(steamID, settings, txt, banAnchor);
    }

    let _qrPopEl = null;
    let _qrAnchorEl = null;   

    function renderSteamIDQR(steamID, txt, anchorEl) {
        hideSteamIDQR();
        if (typeof SPSQR === 'undefined' || !window.SPSQR) return;
        const qr = SPSQR.create(String(steamID), { errorCorrectionLevel: 'M' });
        const size = qr.modules.size;
        const scale = 6;
        const margin = 2;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = (size + margin * 2) * scale;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#131a2a';
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (qr.modules.get(r, c)) {
                    ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
                }
            }
        }

        const pop = document.createElement('div');
        const copyLabel = txt.qr_copy;
        pop.className = 'sps-qr-pop';
        pop.innerHTML = `
            <div class="sps-qr-head">
                <span class="sps-qr-title">${esc(txt.qr_title)}</span>
                <button class="sps-frame-ctrl sps-qr-close" title="×">×</button>
            </div>
            <div class="sps-qr-body">
                <div class="sps-qr-code"></div>
                <div class="sps-qr-idbox">${esc(steamID)}</div>
                <div class="sps-qr-hint">${esc(txt.qr_hint)}</div>
                <button class="sps-btn sps-qr-copybtn">${esc(copyLabel)}</button>
            </div>
        `;
        pop.querySelector('.sps-qr-code').appendChild(canvas);
        pop.querySelector('.sps-qr-close').addEventListener('click', hideSteamIDQR);
        const copyBtn = pop.querySelector('.sps-qr-copybtn');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(String(steamID));
            copyBtn.textContent = txt.copied;
            setTimeout(() => { copyBtn.textContent = copyLabel; }, 1000);
        });

        document.body.appendChild(pop);
        let left = Math.round(window.innerWidth / 2 - pop.offsetWidth / 2 - 120);
        let top = 90;
        if (anchorEl) {
            const r = anchorEl.getBoundingClientRect();
            left = Math.round(r.left + r.width / 2 - pop.offsetWidth / 2);
            top = r.top - pop.offsetHeight - 10;
            if (top < 10) top = r.bottom + 10;
            left = Math.max(10, Math.min(left, window.innerWidth - pop.offsetWidth - 10));
            if (top + pop.offsetHeight > window.innerHeight - 10) {
                top = Math.max(10, window.innerHeight - pop.offsetHeight - 10);
            }
        }
        pop.style.left = left + 'px';
        pop.style.top = top + 'px';
        _qrPopEl = pop;
        _qrAnchorEl = anchorEl || null;
    }

    function hideSteamIDQR() {
        if (_qrPopEl) { _qrPopEl.remove(); _qrPopEl = null; }
        _qrAnchorEl = null;
    }

    function bindSteamIDQR(el, steamID, txt) {
        if (!el) return;
        el.setAttribute('data-sid', String(steamID));
        const DBL_MS = 300;
        el.addEventListener('click', () => {
            clearTimeout(el._spsDblTimer);
            el._spsDblTimer = setTimeout(() => {
                copyToClipboard(steamID, el, txt);
            }, DBL_MS);
        });
        el.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearTimeout(el._spsDblTimer);   
            clearTimeout(el._spsCopyTimer);
            if (el.innerText === txt.copied) {
                
                el.innerText = el.getAttribute('data-label') || el.getAttribute('data-sid') || String(steamID);
                el.classList.remove('sps-copied-anim');
            }
            requestAnimationFrame(() => {
                renderSteamIDQR(steamID, txt, el);
            });
        });
    }

    if (SPS_ACTIVE) document.addEventListener('click', (e) => {
        if (_qrPopEl && e.target !== _qrAnchorEl && !_qrPopEl.contains(e.target)) hideSteamIDQR();
    });
    if (SPS_ACTIVE) document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideSteamIDQR();
    });

    function bindEventsAndFetch(container, steamID, txt, mode, settings) {
        const fallbackMode = mode === 'showcase-fallback';   
        const contentArea = container.querySelector('.sps-content-area');

        contentArea.innerHTML = `
            <div class="sps-main">
                <div id="sps-faceit-lvl" class="sps-level-wrapper sps-lvl-loading">
                    <div class="sps-lvl-badge lvl-1">?</div>
                </div>

                <div class="sps-stats-grid" id="sps-grid-container">
                    <!-- Faceit Stats -->
                    <div id="sps-faceit-stats" class="sps-stats-contents sps-stats-dim">
                         <div class="sps-stat-box"><span class="sps-stat-label">${txt.loading}</span></div>
                    </div>
${fallbackMode ? '' : `
                    <!-- Inventory Stats -->
                    <div id="sps-inv-stats" class="sps-inv-group">
                        <div class="sps-stat-box inv-box-count">
                            <span class="sps-stat-label">${txt.inv_count}</span>
                            <span class="sps-stat-val sps-val-load">...</span>
                        </div>
                        <div class="sps-stat-box inv-box-val">
                            <span class="sps-stat-label">${txt.inventory}</span>
                            <span class="sps-stat-val sps-val-load sps-val-nowrap">...</span>
                        </div>
                    </div>`}
                </div>
            </div>
            <!-- Top Items (outside grid to avoid layout shift) -->
            <div id="sps-top-items" class="sps-top-items" style="display:none;"></div>
            <div id="sps-footer-wrapper"></div>
            ${settings.sps_show_leetify === false ? '' : `
            <div id="sps-leetify-card" class="sps-showcase-leetify">
                <div class="sps-loading">${txt.loading}</div>
            </div>`}
            ${settings.sps_show_csstats === false ? '' : `
            <div id="sps-csstats-card" class="sps-showcase-csstats">
                <div class="sps-loading">${txt.loading}</div>
            </div>`}
        `;

        safeSendMessage({
            type: "FETCH_FACEIT",
            steamId: steamID,
            apiKey: settings.sps_faceit_key
        }, (response) => {
            if (response && response.success) {
                updateFaceitUI(container, response.data, txt, steamID, settings);
                if (response.data && response.data.error) addDebugLog('faceit', `error=${response.data.error} steamid=${steamID}`);
            } else {
                addDebugLog('faceit', `no response / success=false steamid=${steamID}`);
                updateFaceitUI(container, { error: "UNKNOWN" }, txt);
            }
        });

        if (settings.sps_show_leetify !== false) {
            safeSendMessage({
                type: "FETCH_LEETIFY",
                steamId: steamID,
                apiKey: settings.sps_leetify_key
            }, (response) => {
                if (!container.isConnected) return;
                if (response && response.success) {
                    updateLeetifyUI(container, response.data, txt, steamID, settings);
                    if (response.data && response.data.error) addDebugLog('leetify', `error=${response.data.error} steamid=${steamID}`);
                } else {
                    addDebugLog('leetify', `no response / success=false steamid=${steamID}`);
                    updateLeetifyUI(container, { error: "UNKNOWN" }, txt, steamID, settings);
                }
            }, 20000);
        }

        if (settings.sps_show_csstats !== false) {
            const fetchAndRenderCSStats = () => {
                
                try {
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        const localKey = 'sps_cache_csstats1_' + steamID;
                        chrome.storage.local.get(localKey, (res) => {
                            const entry =  (res && res[localKey]);
                            if (entry && entry.data && !entry.data.error && (Date.now() - (entry.ts || 0) < (entry.ttl || 1800000))) {
                                if (container.isConnected) {
                                    updateCSStatsUI(container, spsCsstatsWithFlags(steamID, entry.data), txt, steamID, settings);
                                }
                            }
                        });
                    }
                } catch (e) {  }

                safeSendMessage({
                    type: "FETCH_CSSTATS",
                    steamId: steamID,
                    visible: spsPageVisible(),
                    cef: SPS_IS_CEF,
                    overlay: SPS_IS_OVERLAY
                }, (response) => {
                    if (!container.isConnected) return;
                    if (response && response.success) {
                        updateCSStatsUI(container, spsCsstatsWithFlags(steamID, response.data), txt, steamID, settings);
                        if (response.data && response.data.error) addDebugLog('csstats', `error=${response.data.error} steamid=${steamID}`);
                    } else {
                        addDebugLog('csstats', `no response / success=false steamid=${steamID}`);
                        updateCSStatsUI(container, { error: "UNKNOWN" }, txt, steamID, settings);
                    }
                }, 20000);
            };
            spsRegisterCSStatsCard(steamID, fetchAndRenderCSStats);
            fetchAndRenderCSStats();
        }

        if (fallbackMode) return;   

        safeSendMessage({ type: "FETCH_INVENTORY_PREVIEW", steamId: steamID }, (response) => {
            if (response && response.success && response.data) renderInvCountPreview(container, response.data, txt);
        }, 10000);

        let invPollTimer = 0, invPollCount = 0;
        const pollInventory = () => {
            if (++invPollCount > INV_POLL_MAX_ROUNDS) return;   
            if (!container.isConnected) return;   
            safeSendMessage({ type: "FETCH_INVENTORY", steamId: steamID }, (response) => {
                if (!container.isConnected) return;   
                const d = response && response.success ? response.data : null;
                if (!d || d.error) {
                    
                    if (invPollCount <= INV_POLL_MAX_ROUNDS) { clearTimeout(invPollTimer); invPollTimer = setTimeout(pollInventory, INV_POLL_INTERVAL_MS); }
                    return;
                }
                updateInventoryUI(container, d, txt, settings?.sps_show_phase !== false, settings?.sps_show_topitems !== false);

                const gap = d.overCap ? INV_POLL_OVERCAP_MS : (d.incomplete ? INV_POLL_GIANT_MS : INV_POLL_INTERVAL_MS);
                if (d.pendingTotal || d.incomplete) { clearTimeout(invPollTimer); invPollTimer = setTimeout(pollInventory, gap); }
            }, 45000);
        };
        safeSendMessage({
            type: "FETCH_INVENTORY",
            steamId: steamID
        }, (response) => {
            if (response && response.success) {
                const d = response.data;
                if (d && d.error) addDebugLog('inv', `error=${d.error} source=${d.source_label || '-'} count=${d.item_count}`);
                updateInventoryUI(container, d, txt, settings?.sps_show_phase !== false, settings?.sps_show_topitems !== false);
                const gap0 = d && d.overCap ? INV_POLL_OVERCAP_MS : (d && d.incomplete ? INV_POLL_GIANT_MS : INV_POLL_INTERVAL_MS);
                if (d && (d.pendingTotal || d.incomplete)) invPollTimer = setTimeout(pollInventory, gap0);
            } else {
                addDebugLog('inv', `no response / success=false steamid=${steamID}`);
                updateInventoryUI(container,  ({ error: "UNKNOWN" }), txt, true, settings?.sps_show_topitems !== false);
            }
        }, 45000);

        spsRegisterInvPanel(steamID, (done) => {

            safeSendMessage({ type: "FETCH_INVENTORY", steamId: steamID }, (response) => {
                if (done) done();
                if (!container.isConnected) return;   
                const d = response && response.success ? response.data : null;
                if (d && !d.error) updateInventoryUI(container, d, txt, settings?.sps_show_phase !== false, settings?.sps_show_topitems !== false);
            }, 45000);
        }, settings?.sps_inv_source === 'steamdt' ? 'steamdt' : (settings?.sps_inv_source === 'csqaq' ? 'csqaq' : ''));
    }

    function renderRecentHistoryRows(hist, isZh) {
        
        const hasStats = hist.some(hh => hh.kd || hh.kda || hh.adr || hh.hs);
        const hasKda = hist.some(hh => hh.kda);
        const hasRank = hist.some(hh => hh.rank !== undefined);
        const hasDate = hist.some(hh => (hh.finished_at && hh.finished_at > 0) || hh.date);

        const dateHead = hasDate ? `<span class="sps-recent-pop-date-head">${isZh ? '日期' : 'Date'}</span>` : '';
        const rankHead = hasRank ? `<span class="sps-recent-pop-rank-head">${isZh ? '段位' : 'Rank'}</span>` : '';
        
        const statKdaHead = hasKda ? 'KDA' : 'K/D';

        const head = hasStats ? `<div class="sps-recent-pop-row sps-recent-pop-head">
            <span class="sps-recent-pop-res"></span>
            ${dateHead}
            <span class="sps-recent-pop-map">${isZh ? '地图' : 'Map'}</span>
            ${rankHead}
            <span class="sps-recent-pop-score">${isZh ? '比分' : 'Score'}</span>
            <span class="sps-recent-pop-stat sps-recent-pop-kda">${statKdaHead}</span>
            <span class="sps-recent-pop-stat">ADR</span>
            <span class="sps-recent-pop-stat">HS%</span>
        </div>` : '';
        return head + hist.map(hh => {
            let dateStr = '';
            if (hh.date) {
                const dM = String(hh.date).match(/(?:(\d{1,2})月(\d{1,2})日|(\d{1,2})[\/\-](\d{1,2}))/);
                if (dM) {
                    const m = parseInt(dM[1] || dM[3], 10);
                    const d = parseInt(dM[2] || dM[4], 10);
                    dateStr = `${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
                } else {
                    dateStr = String(hh.date).replace(/^\d+(?:st|nd|rd|th)?年/i, '')
                        .replace(/周[一二三四五六日天]/g, '')
                        .replace(/\b20\d{2}[-/.]?/g, '')
                        .trim();
                }
            } else if (hh.finished_at && hh.finished_at > 0) {
                const ed = new Date(hh.finished_at * 1000);
                const m = ed.getMonth() + 1;
                const d = ed.getDate();
                dateStr = `${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
            }
            const dateHtml = hasDate ? `<span class="sps-recent-pop-date">${esc(dateStr || '-')}</span>` : '';

            let rankHtml = '';
            if (hasRank) {
                const isWing = hh.mode === 'wingman' || hh.rank_type === 7;
                if (typeof hh.rank === 'number' && hh.rank > 50) {
                    rankHtml = `<span class="sps-recent-pop-rank">${spsPremierBadgeHtml(hh.rank)}</span>`;
                } else if (typeof hh.rank === 'number' && hh.rank >= 1 && hh.rank <= 18) {
                    rankHtml = `<span class="sps-recent-pop-rank">${spsRankBadgeHtml(hh.rank, isZh, isWing)}</span>`;
                } else if (hh.rank) {
                    rankHtml = `<span class="sps-recent-pop-rank">${esc(String(hh.rank))}</span>`;
                } else {
                    rankHtml = `<span class="sps-recent-pop-rank sps-cs-rank-empty">-</span>`;
                }
            }

            const resCls = hh.draw ? 'draw' : (hh.win ? 'win' : 'lose');
            const resTxt = hh.draw ? (isZh ? '平' : 'T') : (hh.win ? (isZh ? '胜' : 'W') : (isZh ? '负' : 'L'));
            let kdaVal = '-';
            if (hh.kda) {
                kdaVal = hh.kda;
            } else if (hh.kd) {
                kdaVal = hh.kd;
            }

            return `<div class="sps-recent-pop-row">
                <span class="sps-recent-pop-res ${resCls}">${resTxt}</span>
                ${dateHtml}
                <span class="sps-recent-pop-map"${hh.map && hh.map.length > 18 ? ` title="${esc(hh.map)}"` : ''}>${esc(hh.map || '-')}</span>
                ${rankHtml}
                <span class="sps-recent-pop-score ${resCls}">${esc(hh.score || '-')}</span>
                ${hasStats ? `<span class="sps-recent-pop-stat sps-recent-pop-kda">${esc(kdaVal)}</span>
                <span class="sps-recent-pop-stat">${esc(hh.adr || '-')}</span>
                <span class="sps-recent-pop-stat">${esc(hh.hs ? String(hh.hs).replace(/%$/, '') + '%' : '-')}</span>` : ''}
            </div>`;
        }).join('');
    }

    function updateFaceitUI(container, data, txt, steamID, settings) {
        const lvlWrapper = container.querySelector('#sps-faceit-lvl');
        const statsWrapper = container.querySelector('#sps-faceit-stats');
        const gridContainer = container.querySelector('#sps-grid-container');
        const footerWrapper = container.querySelector('#sps-footer-wrapper');

        if (!data || data.error != null) {
            const err =  (data || {});
            const errCode = err.error || "NO_RESPONSE";
            const isNoKey = errCode === "NO_KEY";
            const isNotFound = errCode === "NOT_FOUND";
            const isNoCS2 = errCode === "NO_CS2";
            
            requestAnimationFrame(() => {
                lvlWrapper.style.display = 'none';
                statsWrapper.innerHTML = '';
                gridContainer.classList.add('sps-grid-centered');
                
                let fallbackHtml = '';
                if (isNotFound) {
                    const fidMatch = String(err.faceit_finder_url || '').match(/\/profile\/(\d+)/);
                    const fid = fidMatch ? fidMatch[1] : '';
                    fallbackHtml = `
                    <div class="sps-finder-fallback">
                        <span class="sps-fb-note">${txt.error_not_found}</span>
                        <button class="sps-btn btn-finder-small" data-frame-site="faceitfinder" data-steamid="${esc(fid)}">${txt.faceit_finder} ↗</button>
                    </div>
                `;
                } else if (isNoKey) {
                    fallbackHtml = `<div class="sps-finder-fallback sps-fb-err">${txt.connect_faceit}</div>`;
                } else if (isNoCS2) {
                    fallbackHtml = `<div class="sps-finder-fallback sps-fb-mute">${txt.error_no_cs2}</div>`;
                } else {
                    
                    const main = /^HTTP /.test(errCode) ? txt.error_http(errCode.slice(5)) : txt.error_net;
                    fallbackHtml = `<div class="sps-finder-fallback sps-fb-err">${main}</div>`
                        + `<div class="sps-fb-hint">${txt.error_hint_off}</div>`;
                }
                footerWrapper.innerHTML = fallbackHtml;
            });
            return;
        }

        data =  (data);
        gridContainer.classList.remove('sps-grid-centered');
        lvlWrapper.classList.remove('sps-lvl-loading');
        const countryLower = (data.country || '').toLowerCase();
        const regionRaw = data.region ? data.region.toUpperCase() : '';
        const isZh = txt.region === '地区';
        const ringHtml = faceitEloBar(data.elo, data.level, isZh);
        lvlWrapper.innerHTML = ringHtml
            ? `<div class="sps-lvl-ring-wrap">${ringHtml}<div class="sps-lvl-badge lvl-${parseInt(String(data.level), 10) || 1}">${esc(data.level) || '-'}</div></div>`
            : `<div class="sps-lvl-badge lvl-${parseInt(String(data.level), 10) || 1}">${esc(data.level) || '-'}</div>`;

        let zoneDisplay = regionRaw || '-';
        if (isZh && regionRaw && FACEIT_REGION_CN[regionRaw]) {
            zoneDisplay = FACEIT_REGION_CN[regionRaw];
        }

        let countryDisplay = '';
        if (countryLower && isZh && COUNTRY_NAME_CN[countryLower]) {
            countryDisplay = COUNTRY_NAME_CN[countryLower];
        } else if (countryLower) {
            const specialAreas = { hk: true, tw: true, mo: true };
            const prefix = specialAreas[countryLower] ? '🇨🇳' : '';
            countryDisplay = prefix + data.country.toUpperCase();
        }

        const fullRegionText = faceitZoneRankText(zoneDisplay, countryDisplay, data.region_rank, data.country_rank, isZh);

        statsWrapper.classList.remove('sps-stats-dim');
        statsWrapper.innerHTML = `
            <div class="sps-stat-box"><span class="sps-stat-label">${txt.region}</span><span class="sps-stat-val region-tag">${esc(fullRegionText)}</span></div>
            <div class="sps-stat-box"><span class="sps-stat-label">${txt.elo_label}</span><span class="sps-stat-val val-highlight">${esc(data.elo)}</span></div>
            <div class="sps-stat-box"><span class="sps-stat-label">${txt.kd_label}</span><span class="sps-stat-val val-sub">${esc(data.kd)}</span></div>
            <div class="sps-stat-box"><span class="sps-stat-label">${txt.hs_label}</span><span class="sps-stat-val val-sub">${esc(data.hs)}%</span></div>
            <div class="sps-stat-box"><span class="sps-stat-label">${txt.matches}</span><span class="sps-stat-val val-sub">${esc(data.total_matches)}</span></div>
            <div class="sps-stat-box"><span class="sps-stat-label">${txt.winrate}</span><span class="sps-stat-val val-sub">${esc(data.win_rate)}%</span></div>
        `;

        if (data.rankError === 'RETRY_LATER' && data.faceitId) {
            safeSendMessage({
                type: "FETCH_FACEIT_RANK",
                faceitId: data.faceitId,
                region: data.region || '',
                country: data.country || '',
                apiKey: settings && settings.sps_faceit_key
            }, (response) => {
                if (!container.isConnected) return;   
                const rd = response && response.success ? response.data : null;
                if (rd && (rd.region_rank !== undefined || rd.country_rank !== undefined)) {
                    updateFaceitUI(container,  ({ ...data, region_rank: rd.region_rank, country_rank: rd.country_rank, rankError: undefined }), txt, steamID, settings);
                }
            });
        }

        let results = Array.isArray(data.recent_results) ? data.recent_results : [];
        let validResults = results.filter(r => r === "1" || r === "0");
        const displayResults = validResults.slice(0, 5);
        const recentHtml = displayResults.length > 0 ? displayResults.map(r => `<div class="match-pill ${r === '1' ? 'win' : 'lose'}"></div>`).join('') : '<span class="sps-recent-empty">-</span>';

        const hist = (data.history && data.history.rows) ? data.history.rows.slice(0, 10) : [];
        const histLazy = !!data.histPending && !hist.length;
        footerWrapper.innerHTML = `
            <div class="sps-footer">
                <div class="sps-recent-bar${hist.length || histLazy ? ' sps-recent-clickable' : ''}"${hist.length || histLazy ? ` role="button" title="${esc(txt.region === '地区' ? '点击查看近期对局详情' : 'Click for match details')}"` : ''}><span class="sps-recent-label">${txt.recent}</span>${recentHtml}</div>
                <div class="sps-recent-pop" style="display:none;"></div>
                <button class="sps-faceit-home" data-frame-site="faceit" data-frame-url="${esc(data.url)}">
                    ${esc(txt.profile_btn)} <span class="sps-faceit-arrow" aria-hidden="true">↗</span>
                </button>
            </div>
        `;
        if (hist.length || histLazy) {
            const bar = footerWrapper.querySelector('.sps-recent-bar');
            const pop = footerWrapper.querySelector('.sps-recent-pop');
            const isZh = txt.region === '地区';
            bar.addEventListener('click', (e) => {
                e.preventDefault();
                const show = pop.style.display === 'none';
                if (show && !pop.dataset.histDone) {
                    if (hist.length) {
                        pop.innerHTML = renderRecentHistoryRows(hist, isZh);
                        pop.dataset.histDone = '1';
                    } else if (steamID && settings) {
                        pop.innerHTML = `<div class="sps-recent-pop-load">${txt.loading}</div>`;

                        fetchFaceitHistRows(steamID, settings.sps_faceit_key,  (data).faceitId, (rows, meta) => {
                            if (!pop.isConnected) return;   
                            if (!rows.length) {
                                if (meta.final) pop.innerHTML = `<div class="sps-recent-pop-load">${isZh ? '拉取失败，点击重试' : 'Fetch failed, click to retry'}</div>`;
                                return;   
                            }
                            pop.innerHTML = renderRecentHistoryRows(rows, isZh);
                            if (meta.complete && meta.final) pop.dataset.histDone = '1';   
                        }, 30000);
                    } else {
                        pop.innerHTML = `<div class="sps-recent-pop-load">${isZh ? '暂无近期对局' : 'No recent matches'}</div>`;
                        pop.dataset.histDone = '1';
                    }
                }
                pop.style.display = show ? 'block' : 'none';
            });
        }
    }

    function updateLeetifyUI(container, data, txt, steamID, settings) {
        const card = container.querySelector('#sps-leetify-card');
        if (!card) return;
        const isZh = txt.region === '地区';
        if (!data || data.error != null) {
            const err =  (data || {});
            const errCode = err.error || "NO_RESPONSE";
            const isHttpErr = /^HTTP /.test(errCode);
            const msg = errCode === 'NO_KEY' ? txt.connect_leetify
                : errCode === 'BAD_KEY' ? txt.leetify_bad_key
                : errCode === 'NOT_FOUND' ? txt.leetify_not_found
                : isHttpErr ? txt.leetify_http(errCode.slice(5))
                : txt.error_net;
            const hintHtml = (isHttpErr || errCode === 'NETWORK_ERROR' || errCode === 'NO_RESPONSE')
                ? `<div class="sps-fb-hint">${txt.error_hint_off}</div>` : '';
            const isErr = errCode === 'NO_KEY' || errCode === 'BAD_KEY' || isHttpErr || errCode === 'NETWORK_ERROR' || errCode === 'NO_RESPONSE';
            const cls = isErr ? ' sps-fb-err' : (errCode === 'NOT_FOUND' ? ' sps-fb-mute' : '');
            let extraAction = '';
            if (errCode === 'NOT_FOUND') {
                const homeTxt = isZh ? '前往主页 ↗' : 'Visit Profile ↗';
                const leeUrl = 'https://leetify.com/app/profile/' + encodeURIComponent(steamID);
                extraAction = ` <a class="sps-lee-fallback-link" data-frame-site="leetify" data-frame-url="${esc(leeUrl)}" data-steamid="${esc(steamID)}" href="${esc(leeUrl)}" target="_blank" title="${esc(txt.native_leetify_home)}" style="margin-left:8px;color:#f84982;text-decoration:underline;cursor:pointer;font-size:12px;">${esc(homeTxt)}</a>`;
            }
            card.innerHTML = `<div class="sps-finder-fallback${cls}">${esc(msg)}${extraAction}</div>${hintHtml}`;
            return;
        }

        data =  (data);
        const results = Array.isArray(data.recent) ? data.recent : [];
        const pills = results.filter(r => r === '1' || r === '0').slice(0, 5);
        const pillsHtml = pills.length
            ? pills.map(r => {
                const label = r === '1' ? (isZh ? '胜' : 'Win') : (isZh ? '负' : 'Loss');
                return `<span class="match-pill ${r === '1' ? 'win' : 'lose'}" title="${label}" aria-label="${label}"></span>`;
            }).join('')
            : `<span class="sps-recent-empty">-</span>`;

        const numOrRaw = (v) => {
            const n = parseInt(String(v).replace(/,/g, ''), 10);
            return Number.isFinite(n) ? n.toLocaleString('en-US') : String(v);
        };
        const histRows = Array.isArray(data.recent_rows) ? data.recent_rows.slice(0, SPS_RECENT_MAX) : [];
        const histClickable = histRows.length > 0;
        const histTitle = histClickable ? (isZh ? '点击查看近期对局详情' : 'Click for match details') : '';
        const fmt2 = (v) => (typeof v === 'number' && Number.isFinite(v)) ? v.toFixed(2) : '-';

        let premierHtml = '';
        if (data.premier !== undefined && Number(data.premier) > 0) {
            const t = leePremierTier(data.premier);
            premierHtml = `<span class="sps-lee-premier" title="${esc(txt.lee_premier)} · Premier">`
                + `<img src="${chrome.runtime.getURL('images/leetify/premier_' + t.name + '.svg')}" alt="">`
                + `<span class="sps-lee-premier-num" style="color:${t.color}">${esc(numOrRaw(data.premier))}</span></span>`;
        }

        const comp = (Array.isArray(data.competitive) ? data.competitive : [])
            .filter(r => r && Number(r.rank) > 0)
            .sort((a, b) => Number(b.rank) - Number(a.rank));
        const wing = (typeof data.wingman === 'number' && data.wingman > 0) ? data.wingman : undefined;
        const hasRanks = !!(comp.length || wing);
        let ranksHtml = '';
        if (hasRanks) {
            const names = isZh ? LEE_RANK_ZH : LEE_RANK_EN;
            const rankHtml = (rank, isWing) => {
                const rn = (isWing ? (isZh ? '搭档 · ' : 'Wingman · ') : '') + (names[rank] || ('Lv.' + rank));
                const icon = isWing ? leeWingmanRankIconUrl(rank) : leeRankIconUrl(rank);
                return icon
                    ? `<img class="sps-lee-rank-img" src="${icon}" title="${esc(rn)}" alt="${esc(rn)}">`
                    : `<span class="sps-lee-rank-chip" style="--tier:${leeRankColor(rank)}" title="${esc(rn)}">${esc(String(rank))}</span>`;
            };
            ranksHtml = `<div class="sps-lee-ranks">`
                + (comp.length ? `<div class="sps-lee-ranks-sec">${esc(txt.lee_comp)}</div>`
                    + `<div class="sps-lee-maps">${comp.map(r =>
                        `<span class="sps-lee-map"><span class="sps-lee-map-name">${esc(leeMapName(r.map))}</span>${rankHtml(r.rank, false)}</span>`).join('')}</div>` : '')
                + (wing ? `<div class="sps-lee-ranks-sec">${esc(txt.lee_wing)}</div>`
                    + `<div class="sps-lee-maps"><span class="sps-lee-map">`
                    + `<span class="sps-lee-map-name">Wingman</span>${rankHtml(wing, true)}</span></div>` : '')
                + `</div>`;
        }

        const sid = steamID || '';
        card.innerHTML = `
            <div class="sps-lee-header">
                ${premierHtml}
                <a class="sps-lee-name" data-frame-site="leetify" data-steamid="${esc(sid)}" title="${esc(txt.native_leetify_home)}">Leetify</a>
                ${data.name ? `<span class="sps-lee-nick" title="${esc(data.name)}">${esc(data.name)}</span>` : ''}
                ${data.faceit_banned ? `<span class="sps-lee-ban" title="${esc(txt.leetify_faceit_ban)}">✖ ${esc(txt.leetify_faceit_ban)}</span>` : ''}
                ${hasRanks ? `<span class="sps-lee-ranks-btn" role="button" tabindex="0" title="${esc(txt.lee_ranks)}">${esc(txt.lee_ranks)} <span class="sps-lee-chevron">▾</span></span>` : ''}
            </div>
            <div class="sps-lee-grid">
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.lr_label)}</span><span class="sps-stat-val val-highlight">${esc(data.leetify_rating !== undefined ? String(data.leetify_rating) : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.lee_aim)}</span><span class="sps-stat-val val-sub">${esc(data.aim !== undefined ? String(data.aim) : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.lee_positioning)}</span><span class="sps-stat-val val-sub">${esc(data.positioning !== undefined ? String(data.positioning) : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.lee_utility)}</span><span class="sps-stat-val val-sub">${esc(data.utility !== undefined ? String(data.utility) : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.lee_clutch)}</span><span class="sps-stat-val val-sub">${esc(data.clutch !== undefined ? fmt2(data.clutch) + '%' : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.lee_opening)}</span><span class="sps-stat-val val-sub">${esc(data.opening !== undefined ? fmt2(data.opening) + '%' : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.lee_preaim)}</span><span class="sps-stat-val val-sub">${esc(data.preaim !== undefined ? fmt2(data.preaim) + '°' : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.lee_reaction)}</span><span class="sps-stat-val val-sub">${esc(data.reaction !== undefined ? data.reaction + 'ms' : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.kd_label)}</span><span class="sps-stat-val val-sub">${esc(data.kd !== undefined ? String(data.kd) : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.hs_label)}</span><span class="sps-stat-val val-sub">${esc(data.hs !== undefined ? String(data.hs) + '%' : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.matches)}</span><span class="sps-stat-val val-sub">${esc(data.total_matches !== undefined ? numOrRaw(data.total_matches) : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.winrate)}</span><span class="sps-stat-val val-sub">${esc(data.win_rate !== undefined ? String(data.win_rate) + '%' : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">ADR</span><span class="sps-stat-val val-sub">${esc(data.adr !== undefined ? String(data.adr) : '-')}</span></div>
                <div class="sps-stat-box${histClickable ? ' sps-recent-clickable' : ''}"${histClickable ? ` role="button" tabindex="0" title="${esc(histTitle)}" data-sps-hist="1"` : ''}>
                    <span class="sps-stat-label">${esc(txt.native_recent)}</span>
                    <div class="sps-lee-pills">${pillsHtml}</div>
                </div>
            </div>
            <div class="sps-recent-pop" style="display:none;"></div>
            ${ranksHtml}
        `;

        if (histClickable) {
            const recentBox = card.querySelector('.sps-recent-clickable[data-sps-hist="1"]');
            const pop = card.querySelector('.sps-recent-pop');
            if (recentBox && pop) {
                const toggleRecent = () => {
                    const show = pop.style.display === 'none';
                    if (show && !pop.dataset.histDone) {
                        pop.innerHTML = renderRecentHistoryRows(histRows, isZh);
                        pop.dataset.histDone = '1';
                    }
                    pop.style.display = show ? 'block' : 'none';
                    recentBox.classList.toggle('active', show);
                };
                recentBox.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleRecent(); });
                recentBox.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRecent(); }
                });
            }
        }
        if (hasRanks) {
            const btn = card.querySelector('.sps-lee-ranks-btn');
            const sec = card.querySelector('.sps-lee-ranks');
            bindRankDrawerEvents(btn, sec);
        }
    }

    function updateCSStatsUI(container, data, txt, steamID, settings) {
        const card = container.querySelector('#sps-csstats-card');
        if (!card) return;
        const isZh = txt.region === '地区';
        const sid = steamID || '';
        if (!data || data.error != null) {
            const err = data || {};
            const errCode = err.error || 'NO_RESPONSE';
            
            const transient = errCode === 'NETWORK_ERROR' || errCode === 'NO_RESPONSE' || errCode === 'UNKNOWN' || errCode === 'THROTTLED';
            if (transient && card.querySelector('.sps-cs-grid')) return;
            let msg = txt.error_net;
            let cfBtn = '';
            if (errCode === 'CF_CHALLENGE') {
                msg = txt.csstats_cf_hint;
                cfBtn = ` <button class="sps-native-cf-btn sps-cf-heal-btn" data-sps-heal="csstats" data-steamid="${esc(sid)}" title="${esc(txt.csstats_open_cf)}">${esc(txt.csstats_open_cf)}</button>`;
            } else if (errCode === 'PRIVATE') {
                msg = txt.csstats_private;
            } else if (errCode === 'NOT_FOUND') {
                msg = txt.csstats_not_found;
            } else if (errCode === 'RATE_LIMITED' || errCode === 'THROTTLED') {
                
                msg = txt.csstats_rate_limited;
            } else {
                const retryTxt = isZh ? '重试' : 'Retry';
                cfBtn = ` <button class="sps-csstats-retry-btn" data-steamid="${esc(sid)}" style="margin-left:8px;cursor:pointer;padding:2px 8px;border-radius:3px;border:1px solid currentColor;background:transparent;color:inherit;font-size:11px;">${esc(retryTxt)}</button>`
                    + ` <button class="sps-native-cf-btn sps-cf-heal-btn" data-sps-heal="csstats" data-steamid="${esc(sid)}" style="margin-left:4px;cursor:pointer;padding:2px 8px;border-radius:3px;border:1px solid #3b82f6;background:transparent;color:#60a5fa;font-size:11px;" title="${esc(txt.csstats_open_cf)}">${esc(txt.csstats_open_cf)}</button>`;
            }
            const isErr = errCode === 'CF_CHALLENGE' || errCode === 'NETWORK_ERROR' || errCode === 'NO_RESPONSE';
            const cls = isErr ? ' sps-fb-err' : ' sps-fb-mute';
            card.innerHTML = `<div class="sps-finder-fallback${cls}">${esc(msg)}${cfBtn}</div>`;
            const cfBtnEl = card.querySelector('.sps-native-cf-btn');
            if (cfBtnEl) {
                cfBtnEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    cfBtnEl.textContent = isZh ? '跳转验证中…' : 'Verifying...';
                    spsArmCsstatsHeal(sid);
                });
            }
            const retryBtn = card.querySelector('.sps-csstats-retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    card.innerHTML = `<div class="sps-loading">${esc(txt.loading)}</div>`;
                    const reg = _spsCSStatsCards.get(sid);
                    if (reg && typeof reg.rerender === 'function') {
                        reg.rerender();
                    }
                });
            }
            return;
        }

        if (data.pending) {
            card.innerHTML = spsCsstatsPendingHtml(txt);
            return;
        }

        const numOrRaw = (v) => {
            const n = parseInt(String(v).replace(/,/g, ''), 10);
            return Number.isFinite(n) ? n.toLocaleString('en-US') : String(v);
        };
        const fmt2 = (v) => (typeof v === 'number' && Number.isFinite(v)) ? v.toFixed(2) : '-';

        let premierHtml = '';
        if (data.premier) {
            const curr = Number(data.premier.current) || 0;
            const best = Number(data.premier.best) || curr;
            if (curr > 0 || best > 0) {
                if (curr > 0 && best > curr) {
                    const tCurr = leePremierTier(curr);
                    const currBadge = `<span class="sps-lee-premier" title="${esc(txt.lee_premier)} · ${esc(txt.cs_current_label)}">`
                        + `<img src="${chrome.runtime.getURL('images/leetify/premier_' + tCurr.name + '.svg')}" alt="">`
                        + `<span class="sps-lee-premier-num" style="color:${tCurr.color}">${esc(numOrRaw(curr))}</span></span>`;
                    const tBest = leePremierTier(best);
                    const bestBadge = `<span class="sps-lee-premier" title="${esc(txt.lee_premier)} · ${esc(txt.cs_best_rank_label)}">`
                        + `<img src="${chrome.runtime.getURL('images/leetify/premier_' + tBest.name + '.svg')}" alt="">`
                        + `<span class="sps-lee-premier-num" style="color:${tBest.color}">${esc(numOrRaw(best))}</span></span>`;
                    premierHtml = `<div class="sps-cs-premier-group">${currBadge}<span class="sps-cs-premier-arrow">/</span>${bestBadge}</div>`;
                } else {
                    const targetRating = curr > 0 ? curr : best;
                    const tTarget = leePremierTier(targetRating);
                    const badge = `<span class="sps-lee-premier" title="${esc(txt.lee_premier)} · ${esc(txt.cs_best_label)}">`
                        + `<img src="${chrome.runtime.getURL('images/leetify/premier_' + tTarget.name + '.svg')}" alt="">`
                        + `<span class="sps-lee-premier-num" style="color:${tTarget.color}">${esc(numOrRaw(targetRating))}</span></span>`;
                    premierHtml = `<div class="sps-cs-premier-group">${badge}<span class="sps-cs-indicator" title="${esc(txt.cs_best_label)}">${esc(txt.cs_best_label)}</span></div>`;
                }
            }
        }

        const comp = (Array.isArray(data.competitive) ? data.competitive : [])
            .filter(r => r && (r.current || r.best))
            .sort((a, b) => Number(b.best || b.current || 0) - Number(a.best || a.current || 0));
        const wing = (data.wingman && (data.wingman.current || data.wingman.best)) ? data.wingman : undefined;
        const premHist = (data.premier && Array.isArray(data.premier.history)) ? data.premier.history : [];
        const csgo = (data.csgo && (data.csgo.current || data.csgo.best)) ? data.csgo : undefined;
        const hasRanks = !!(comp.length || wing || premHist.length || csgo);

        const ranksHtml = hasRanks ? renderDualRankDrawerHtml(comp, premHist, wing, txt, isZh, csgo) : '';

        const histRows = Array.isArray(data.recent_rows) ? data.recent_rows.slice(0, SPS_RECENT_MAX) : [];
        const histClickable = histRows.length > 0;
        const histTitle = histClickable ? (isZh ? '点击查看近期对局' : 'Click for recent matches') : '';

        const pills = Array.isArray(data.recent_results) ? data.recent_results.slice(0, 5) : [];
        const pillsHtml = pills.length
            ? pills.map(r => {
                const label = r === 'W' ? (isZh ? '胜' : 'Win') : (r === 'L' ? (isZh ? '负' : 'Loss') : (isZh ? '平' : 'Tie'));
                return `<span class="match-pill ${r === 'W' ? 'win' : (r === 'L' ? 'lose' : 'tie')}" title="${label}" aria-label="${label}"></span>`;
            }).join('')
            : `<span class="sps-recent-empty">-</span>`;

        card.innerHTML = `
            <div class="sps-lee-header">
                ${premierHtml}
                <a class="sps-lee-name" data-frame-site="csstats" data-steamid="${esc(sid)}" href="${esc(csstatsProfileUrl(sid))}" target="_blank" title="${esc(txt.native_csstats_home)}">CSStats</a>
                ${data.name ? `<span class="sps-lee-nick" title="${esc(data.name)}">${esc(data.name)}</span>` : ''}
                ${data.auth_gated ? `<span class="sps-cs-indicator" style="background:rgba(234,179,8,0.15);color:#eab308;border-color:rgba(234,179,8,0.4);" title="${esc(txt.csstats_auth_gated)}">${esc(isZh ? '需登录' : 'Sign-in')}</span>` : ''}
                ${data.backfilling ? spsCsstatsBackfillChip(isZh) : ''}
                ${hasRanks ? `<span class="sps-cs-ranks-btn sps-lee-ranks-btn" role="button" tabindex="0" title="${esc(txt.cs_all_ranks)}">${esc(txt.cs_all_ranks)} <span class="sps-lee-chevron">▾</span></span>` : ''}
            </div>
            <div class="sps-lee-grid sps-cs-grid">
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.kd_label)}</span><span class="sps-stat-val val-highlight">${esc(data.kd_ratio !== undefined ? fmt2(data.kd_ratio) : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.cs_hltv_label)}</span><span class="sps-stat-val val-sub">${esc(data.hltv_rating !== undefined ? fmt2(data.hltv_rating) : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.winrate)}</span><span class="sps-stat-val val-sub">${esc(data.win_rate !== undefined ? String(data.win_rate) + '%' : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.hs_label)}</span><span class="sps-stat-val val-sub">${esc(data.hs_percentage !== undefined ? String(data.hs_percentage) + '%' : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">ADR</span><span class="sps-stat-val val-sub">${esc(data.adr !== undefined ? String(data.adr) : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.cs_clutch_label)}</span><span class="sps-stat-val val-sub">${esc(data.clutch !== undefined ? String(data.clutch) + '%' : '-')}</span></div>
                <div class="sps-stat-box"><span class="sps-stat-label">${esc(txt.cs_most_played)}</span><span class="sps-stat-val val-sub">${esc(data.most_played_map ? String(data.most_played_map) : '-')}</span></div>
                <div class="sps-stat-box${histClickable ? ' sps-recent-clickable' : ''}"${histClickable ? ` role="button" tabindex="0" title="${esc(histTitle)}" data-sps-hist="1"` : ''}>
                    <span class="sps-stat-label">${esc(txt.native_recent)}</span>
                    <div class="sps-lee-pills">${pillsHtml}</div>
                </div>
            </div>
            <div class="sps-recent-pop" style="display:none;"></div>
            ${ranksHtml}
            ${spsCsstatsLoginHint(data, isZh)}
        `;

        if (histClickable) {
            const recentBox = card.querySelector('.sps-recent-clickable[data-sps-hist="1"]');
            const pop = card.querySelector('.sps-recent-pop');
            if (recentBox && pop) {
                const toggleRecent = () => {
                    const show = pop.style.display === 'none';
                    if (show && !pop.dataset.histDone) {
                        pop.innerHTML = renderRecentHistoryRows(histRows, isZh);
                        pop.dataset.histDone = '1';
                    }
                    pop.style.display = show ? 'block' : 'none';
                    recentBox.classList.toggle('active', show);
                };
                recentBox.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleRecent(); });
                recentBox.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRecent(); }
                });
            }
        }

        if (hasRanks) {
            const btn = card.querySelector('.sps-cs-ranks-btn');
            const sec = card.querySelector('.sps-cs-ranks');
            bindRankDrawerEvents(btn, sec);
        }
    }

    function renderInvCountPreview(container, data, txt) {
        const statsWrapper = container.querySelector('#sps-inv-stats');
        if (!statsWrapper) return;   
        
        const stillLoading = statsWrapper.querySelector('.sps-val-load');
        if (!stillLoading) return;
        const hasErr = !data || !!data.error;
        const countText = !hasErr && data.item_count >= 0 ? String(data.item_count) : 'ERR';
        const countBox = statsWrapper.querySelector('.inv-box-count');
        if (countBox) {
            countBox.innerHTML = `<span class="sps-stat-label">${txt.inv_count}</span>
                <span class="sps-stat-val ${countText === 'ERR' ? 'sps-val-err' : 'sps-val-ok'}">${countText}</span>`;
        }
    }

    function updateInventoryUI(container, invData, txt, showPhase, showTopItems) {
        const statsWrapper = container.querySelector('#sps-inv-stats');
        if (!statsWrapper) return;
        const isZh = txt.region === '地区';

        let invCountDisplay = "-";
        let invValueDisplay = "-";
        let invCountCls = "sps-val-ok";
        let invValueCls = "sps-val-info";
        let sourceHtml = "";

        if (invData.error && invData.error !== "Rate Limited") {
            invCountDisplay = "ERR";
            invValueDisplay = "ERR";
            invCountCls = "sps-val-err";
            invValueCls = "sps-val-err";
        } else {
            invCountDisplay = invData.item_count !== undefined ? String(invData.item_count) : "-";

            if (invData.error === "Rate Limited") {
                invValueDisplay = "RateLimit";
                invValueCls = "sps-val-warn";
                sourceHtml = `<span class="source-tag error">Limit</span>`;
            } else if (invData.error === "CSQAQ_AUTH") {
                
                invValueDisplay = "ERR";
                invValueCls = "sps-val-err";
                const hint =  (txt).csqaq_auth_hint || 'CSQAQ auth failed';
                sourceHtml = `<span class="source-tag error" title="${esc(hint)}">CSQAQ</span>`;
            } else if (invData.total_value && invData.total_value !== "-" && invData.total_value !== "0.00") {
                invValueDisplay = `${curSym(invData.currency)}${invData.total_value}`;
                sourceHtml = invData.source_label ? `<span class="source-tag">${esc(invData.source_label)}</span>` : '';
                
                if (invData.pendingTotal) sourceHtml += ` <span class="source-tag">${esc(txt.inv_pending ? txt.inv_pending(invData.pendingCount || 0) : '...')}</span>`;
                
                if (invData.incomplete) sourceHtml += ` <span class="source-tag error" title="${esc(invData.overCap ? (isZh ? '库存超大（超过 4 万件），已达单轮拉取上限，估值按已获取部分计算；后续轮次将逐步补齐，完整统计可能始终受限' : 'Inventory extremely large (40k+): per-round scan cap reached, partial valuation shown; later rounds catch up gradually') : (isZh ? '库存过大，本轮分页被限流中断，估值按已获取部分计算，稍后自动补齐' : 'Inventory too large: pagination was interrupted, showing partial valuation'))}">${esc(isZh ? '未完全统计' : 'Incomplete')}</span>`;
            } else {
                invValueDisplay = "-";

                if (invData.pendingTotal) {
                    sourceHtml = `<span class="source-tag">${esc(txt.inv_pending ? txt.inv_pending(invData.pendingCount || 0) : '...')}</span>`;
                }
            }
        }

        const cats = invData.categories;
        const hasTopItems = (invData.top_items || []).length > 0;
        const valOk = invData.total_value && invData.total_value !== "-" && invData.total_value !== "0.00";
        const catDefs = [
            ['skins', isZh ? '皮肤' : 'Skins'], ['cases', isZh ? '箱子' : 'Cases'],
            ['agents', isZh ? '探员' : 'Agents'], ['stickers', isZh ? '印花' : 'Stickers'],
            ['graffiti', isZh ? '涂鸦' : 'Graffiti'], ['keys', isZh ? '钥匙' : 'Keys'],
            ['other', isZh ? '其他' : 'Other']
        ];

        statsWrapper.innerHTML = `
            <div class="sps-stat-box inv-box-count sps-count-clickable" id="sps-count-click" title="${txt.top_click_hint}${invData.incomplete ? (isZh ? '；库存过大，本轮未完全统计' : '; partial inventory scanned this round') : ''}">
                <span class="sps-stat-label">${txt.inv_count}</span>
                <span class="sps-stat-val ${invCountCls}">${invCountDisplay}</span>
            </div>
            <div class="sps-stat-box inv-box-val">
                <span class="sps-stat-label">${txt.inventory} ${sourceHtml}</span>
                <span class="sps-stat-val ${invValueCls} sps-val-nowrap">${invValueDisplay}</span>
            </div>
        `;

        const topItemsEl = container.querySelector('#sps-top-items');
        if (topItemsEl && showTopItems === false) {
            topItemsEl.style.display = 'none';
            return;
        }
        const topItems = invData.top_items || [];
        const enrichedTopItems = showPhase ? topItems : topItems.map(item => ({ ...item, phase: '' }));

        const mktTipCsqaq = isZh ? '在 CSQAQ 中查看' : 'View on CSQAQ';
        const mktTipSteam = isZh ? '在 Steam 市场中查看' : 'View on Steam Market';
        
        const mktChannelTip = (href) => {
            const host = String(href || '').replace(/^[a-z]+:\/\//i, '').split('/')[0];
            return /(^|\.)csqaq\.com$/i.test(host) ? mktTipCsqaq : mktTipSteam;
        };

        const countBox = container.querySelector('#sps-count-click');
        if (topItemsEl && enrichedTopItems.length > 0) {
            const itemsHtml = enrichedTopItems.map((item, i) => {
                const displayName = (isZh && item.name_cn) ? item.name_cn : item.name;
                const phaseSuffix = item.phase || '';
                const mktNote = item.mktNote ? `<span class="sps-phase-note">*</span>` : '';
                const up = Number(item.unitPrice);
                const priceText = Number.isFinite(up) && up > 0 ? `${curSym(item.currency)}${up.toFixed(0)}${item.qty > 1 ? ` ×${item.qty}` : ''}` : '';
                const buyQuote = item.buyQuote ? `<span class="sps-buy-q">${isZh ? '求购' : 'Buy'}</span>` : '';
                const mktHref = item.mktUrl || (item.name ? 'https://steamcommunity.com/market/listings/730/' + encodeURIComponent(item.name) : '');
                
                return `
                    <a class="sps-top-item${mktHref ? ' sps-top-mkt' : ''}"${mktHref ? ` href="${esc(mktHref)}" target="_blank" rel="noopener noreferrer"` : ' href="javascript:void(0)"'}>
                        <span class="sps-top-rank">#${i + 1}</span>
                        <span class="sps-top-name">${esc(displayName)}<span class="sps-phase">${esc(phaseSuffix)}</span>${mktNote}</span>
                        ${priceText ? `<span class="sps-top-price">${priceText}${buyQuote}</span>` : ''}
                    </a>
                `;
            }).join('');
            const catValueText = (cats && hasTopItems && valOk)
                ? catDefs.filter(([k]) => (cats[k].v || 0) > 0 || cats[k].c > 0)
                    .map(([k, label]) => (cats[k].v || 0) > 0 ? `${label} ${curSym(invData.currency)}${fmtInvValue(cats[k].v)}` : `${label} ${cats[k].c}${isZh ? '件' : ''}`)
                    .join(' · ')
                : '';
            topItemsEl.innerHTML = `<div class="sps-top-items-title">${txt.top_items_title}${catValueText ? `<span class="sps-top-cats">${catValueText}</span>` : ''}</div>${itemsHtml}`;

            topItemsEl.querySelectorAll('.sps-top-item').forEach((rowEl, idx) => {
                const item = enrichedTopItems[idx];
                if (!item) return;
                const anchor =  (rowEl);
                const href = item.mktUrl || (item.name ? 'https://steamcommunity.com/market/listings/730/' + encodeURIComponent(item.name) : '');

                spsBindItemPop(anchor, item, txt, { market: href ? mktChannelTip(href) : '' });
            });
            let expanded = false;
            if (countBox) {
                countBox.addEventListener('click', () => {
                    expanded = !expanded;
                    topItemsEl.style.display = expanded ? 'block' : 'none';
                    countBox.classList.toggle('sps-count-active', expanded);
                });
            }
        } else if (topItemsEl) {
            topItemsEl.style.display = 'none';
        }
    }

