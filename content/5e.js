    

    const F5E_ELO_TIERS = [
        [0, 'D'], [1201, 'C'], [1351, 'C+'], [1501, 'C++'], [1601, 'B'],
        [1751, 'B+'], [1901, 'B++'], [2001, 'A'], [2151, 'A+'], [2301, 'A++']
    ];
    
    const F5E_LEGACY_TIERS = [
        [0, 'D'], [1001, 'D'], [1301, 'C'], [1601, 'C'], [1801, 'B'],
        [2001, 'B'], [2201, 'A'], [2401, 'A'], [2601, 'S'], [2801, 'S+']
    ];
    const F5E_LEGACY_EN = { 'D': 'D', 'C': 'C', 'B': 'B', 'A': 'A', 'S': 'S', 'S+': 'S+' };
    const F5E_S_STAR_ELO = 12.5;   

    const F5E_AUTO_WALK_MAX = 10;   

    const F5E_MT_CORE = [9, 1, 0, 4, 6, 8, 11, 163];   
    const F5E_MT_SOFT = [5, 2, 174, 37, 3];             

    const F5E_MT_DEFAULT = [9, 163];

    const F5E_SEG_MIN_N = 5;

    const F5E_KD_WALK_MAX = 8;

    function f5eIsDefaultMode(mt) { const n = f5eNum(mt); return n < 0 || F5E_MT_DEFAULT.indexOf(n) >= 0; }

    function f5eTierTable(season) {
        const m = /^(\d{4})s(\d+)$/i.exec(String(season || ''));
        if (!m) return 'new';   
        const y = parseInt(m[1], 10), s = parseInt(m[2], 10);
        if (y > 2025) return 'new';
        if (y === 2025) return s >= 2 ? 'legacy' : '';
        return '';
    }
    
    function f5eHasTier(season) { return !!f5eTierTable(season); }

    function f5eUnranked(levelId, season) {
        if (levelId === undefined || levelId === null || levelId === '') return false;   
        return f5eTierTable(season) !== '' && f5eNum(levelId) <= 0;
    }

    function f5eEloTier(elo, isZh, season, levelId) {
        const table = f5eTierTable(season);
        if (!table) return '';   
        
        if (levelId !== undefined && levelId !== null && levelId !== '' && f5eNum(levelId) <= 0) return '';
        const n = parseInt(String(elo), 10);
        if (!Number.isFinite(n) || n <= 0) return '';   
        if (table === 'legacy') {
            
            let zh = '';
            for (const t of F5E_LEGACY_TIERS) { if (n >= t[0]) zh = String(t[1]); }
            if (!zh) return '';
            return isZh ? zh : String(F5E_LEGACY_EN[zh] || zh);
        }
        
        if (n >= 2401) return 'S';
        let zh = '';
        for (const t of F5E_ELO_TIERS) { if (n >= t[0]) zh = String(t[1]); }
        if (!isZh) {
            const en = { 'D': 'D', 'C': 'C', 'C+': 'C+', 'C++': 'C++', 'B': 'B', 'B+': 'B+', 'B++': 'B++', 'A': 'A', 'A+': 'A+', 'A++': 'A++' };
            return en[zh] || zh;
        }
        return zh;
    }

    function f5eStarCount(elo, starNum, season, levelId) {
        const table = f5eTierTable(season);
        if (!table) return 0;
        
        if (levelId !== undefined && levelId !== null && levelId !== '' && f5eNum(levelId) <= 0) return 0;
        const n = parseFloat(String(elo));
        if (!Number.isFinite(n) || n <= 0) return 0;
        const sn = parseInt(String(starNum), 10);
        
        const hasStarNum = Number.isFinite(sn) && sn > 0 && sn <= 999;
        if (table === 'legacy') {
            if (n < 2801) return 0;   
            return hasStarNum ? sn : 0;
        }
        if (n < 2401) return 0;   
        return hasStarNum ? sn : Math.floor((n - 2400) / F5E_S_STAR_ELO);
    }

    function f5eSStarSuffix(elo, starNum, season, levelId) {
        const stars = f5eStarCount(elo, starNum, season, levelId);
        return stars > 0 ? '·' + stars + '★' : '';
    }

    function f5eTierFull(elo, starNum, season, isZh, levelId) {
        const stars = f5eStarCount(elo, starNum, season, levelId);
        const suffix = stars > 0 ? '·' + stars + '★' : '';
        const base = f5eEloTier(elo, isZh !== false, season, levelId);
        if (base !== 'S') return base + suffix;
        const up = stars >= 40 ? 'SSS' : (stars >= 20 ? 'SS' : 'S');
        return up + suffix;
    }

    function f5eBanDetailText(banData, txt) {
        const ev = banData && banData.ev;
        const nowS = Date.now() / 1000;
        const k = String((banData && banData.kind) || '');
        const kindName = { cheat: txt.f5e_ban_badge_cheat, assoc: txt.f5e_ban_badge_assoc, risk: txt.f5e_ban_badge_risk, unlawful: txt.f5e_ban_badge_unlawful, malicious: txt.f5e_ban_badge_mal, roster: txt.f5e_ban_badge_roster, vac: txt.f5e_ban_badge_vac };
        const C = txt.region === '地区' ? '：' : ': ';
        const fmt = ( ts) => {
            const n = f5eNum(ts);
            if (!n) return '';
            const d = new Date(n * 1000);
            const p = ( x) => (x < 10 ? '0' + x : '' + x);
            return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
        };
        
        const fmtDays = ( n) => {
            const zh = txt.region === '地区';
            if (n >= 365) { const y = Math.floor(n / 365), d = n % 365; return y + (zh ? ' 年' : 'y') + (d ? ' ' + d + (zh ? ' 天' : 'd') : ''); }
            return n + (zh ? ' 天' : 'd');
        };
        const lines = [];
        const typeName = (ev && ev.banName) || kindName[k] || '';
        if (typeName) lines.push(txt.f5e_ban_d_type + C + typeName);

        const rosterDays = banData.banDays != null ? f5eNum(banData.banDays) : null;
        const evDays = (ev && ev.days != null && f5eNum(ev.days) >= 0) ? f5eNum(ev.days) : null;
        const days = rosterDays !== null ? rosterDays : evDays;
        const indefinite = days === 0;
        const reason = (ev && ev.banReason) || banData.banReason || '';
        if (reason) lines.push(txt.f5e_ban_d_reason + C + reason);
        if (days !== null) lines.push(txt.f5e_ban_d_days + C + (indefinite ? txt.f5e_ban_d_unlimited : fmtDays(days)));
        if (ev && f5eNum(ev.start)) lines.push(txt.f5e_ban_d_start + C + fmt(ev.start));
        if (ev && f5eNum(ev.end)) lines.push(txt.f5e_ban_d_end + C + fmt(ev.end));
        if (banData.served) lines.push(txt.f5e_ban_d_served);
        if (!ev) {
            const lim = f5eNum(banData.limitUntil) || (!k && f5eNum(banData.loginBannedUntil)) || 0;
            if (lim > nowS) lines.push(txt.f5e_ban_d_limited + C + fmt(lim));
            else if (k === 'risk' || k === 'unlawful') lines.push(txt.f5e_ban_d_verify);

            else if (!reason && days === null && !banData.served && typeName) lines.push(txt.f5e_ban_d_nodate);
        }
        if (ev && f5eNum(ev.matchStart)) lines.push(txt.f5e_ban_d_match + C + fmt(ev.matchStart) + (ev.mapName ? ' · ' + ev.mapName : '') + (ev.groupType === 2 ? ' · ' + txt.f5e_ban_d_mate : ev.groupType === 1 ? ' · ' + txt.f5e_ban_d_foe : ''));
        if (!lines.length) return '';
        if (!banData.enhanced) lines.push(txt.f5e_ban_d_hint);   
        return lines.join('\n');
    }

    function f5eBanBadgeInfo(banData, txt) {
        if (!banData || !banData.success) return null;
        const detail = f5eBanDetailText(banData, txt);
        
        if (banData.active === false) return { cls: 'ok', label: txt.f5e_ban_badge_ok, tip: detail || txt.f5e_ban_ok_tip };
        const k = String(banData.kind || '');
        const tipMap = { cheat: txt.f5e_ban_cheat_tip, assoc: txt.f5e_ban_assoc_tip, risk: txt.f5e_ban_risk_tip, unlawful: txt.f5e_ban_unlawful_tip, malicious: txt.f5e_ban_mal_tip, roster: txt.f5e_ban_roster_tip, vac: txt.f5e_ban_vac_tip };

        const rosterDays = banData.banDays != null ? f5eNum(banData.banDays) : null;
        const evDays = (banData.ev && banData.ev.days != null && f5eNum(banData.ev.days) >= 0) ? f5eNum(banData.ev.days) : null;
        const days = rosterDays !== null ? rosterDays : evDays;
        const permanent = days === 0;
        const decade = days !== null && days >= 3650;
        const accountLevel = (k === 'cheat' || k === 'assoc' || k === 'vac') && days === null;
        const cls = (permanent || decade || accountLevel) ? 'pac' : 'tmp';
        return { cls, label: txt.f5e_ban_badge, tip: detail || tipMap[k] || txt.f5e_ban_tmp_tip };
    }

    function f5eBanBadgeHtml(banData, txt) {
        const info = f5eBanBadgeInfo(banData, txt);
        if (!info) return '';
        return `<span class="sps-pw-ban-badge sps-pw-ban-${info.cls}"${spsTipAttr(info.tip)}>${esc(info.label)}</span>`;
    }

    function f5eBanHistoryHtml(banData, isZh) {
        const list = banData && Array.isArray(banData.evList) ? banData.evList : null;
        if (!list || list.length < 2) return '';
        const rows = list.map(( e) => {

            const bt = f5eNum(e.banType);
            const kindName = { '-4': isZh ? '作弊封禁' : 'Cheat ban', '-1': isZh ? '恶意行为封禁' : 'Malicious ban', '-11': isZh ? '排位资格受限' : 'Ranked restricted', '-2': isZh ? '风险封禁' : 'Risk ban', '-6': isZh ? '违规封禁' : 'Violation ban', '-9': 'VAC' };
            const type = String(e.banName || kindName[String(bt)] || (bt ? String(bt) : '—'));
            const days = e.days != null ? f5eNum(e.days) : -1;
            const dur = days === 0 ? (isZh ? '无限期' : 'indefinite') : days > 0 ? (days + (isZh ? ' 天' : 'd')) : (isZh ? '时长未知' : 'duration unknown');
            const startTxt = f5eNum(e.start) ? new Date(f5eNum(e.start) * 1000).toLocaleDateString() : '—';
            const matchTxt = f5eNum(e.matchStart)
                ? (isZh ? '同场 ' : 'with ') + new Date(f5eNum(e.matchStart) * 1000).toLocaleDateString()
                  + (e.mapName ? ' · ' + e.mapName : '')
                  + (f5eNum(e.groupType) === 2 ? (isZh ? ' · 队友' : ' · teammate') : f5eNum(e.groupType) === 1 ? (isZh ? ' · 对手' : ' · opponent') : '')
                : '';
            return `<div class="sps-f5e-banhist-row">` +
                `<span class="sps-f5e-banhist-date">${esc(startTxt)}</span>` +
                `<span class="sps-f5e-banhist-type">${esc(type)}</span>` +
                `<span class="sps-f5e-banhist-reason"${spsTipAttr(String(e.banReason || ''))}>${esc(String(e.banReason || '') || '—')}</span>` +
                `<span class="sps-f5e-banhist-days">${esc(dur)}</span>` +
                (matchTxt ? `<span class="sps-f5e-banhist-match">${esc(matchTxt)}</span>` : '') +
                `</div>`;
        }).join('');
        return `<div class="sps-pw-sec sps-f5e-banhist">${isZh ? '处罚记录' : 'Penalty history'} · ${list.length}` +
            `<div class="sps-f5e-banhist-list">${rows}</div></div>`;
    }

    function f5eBanReasonTip(banData, txt) {
        const info = f5eBanBadgeInfo(banData, txt);
        if (!info) return txt.f5e_ban_fetch_fail;
        if (info.cls !== 'ok' && banData.banReason) {

            const hasDays = banData.banDays != null;
            const days = hasDays ? (parseInt(String(banData.banDays), 10) || 0) : -1;
            return `${banData.banType || ''} · ${banData.banReason}${days > 0 ? `（${days}${txt.region === '地区' ? '天' : 'd'}）` : (days === 0 && banData.banType ? '（永久）' : '')}`;
        }
        return info.tip;
    }

    function autoFetchF5eBanStatus(steamID, settings, txt, titleHeader) {
        if (!settings.sps_show_5e) return;
        safeSendMessage({ type: 'FETCH_F5E_BAN', steamId: steamID }, (res) => {
            if (!chrome.runtime || !chrome.runtime.id) return;   
            const banData = res && res.success ? res.data : null;
            const info = f5eBanBadgeInfo(banData, txt);
            if (!info) return;   
            const cls = info.cls;   
            const btn = document.querySelector('.sps-header-tool.btn-f5e');
            if (btn) btn.title = `${txt.f5e_btn} · ${info.label}`;
            document.querySelectorAll('.btn-f5e.sps-btn, .btn-f5e.sps-btn-mini, .sps-native-btn.btn-f5e').forEach(b => {
                b.title = `${b.textContent || txt.f5e_btn} · ${info.label}`;
            });
            if (cls !== 'ok' && titleHeader && !titleHeader.querySelector('.sps-f5e-ban-flag')) {   
                const flag = document.createElement('span');
                flag.className = 'sps-pw-ban-flag sps-f5e-ban-flag sps-pw-ban-' + cls;
                flag.textContent = info.label;
                spsSetTip(flag, f5eBanReasonTip(banData, txt));
                titleHeader.appendChild(flag);
            }
            addDebugLog('f5e', `ban=${cls} steamid=${steamID}`);
        }, 15000);
    }

    function bindF5eButton(steamID, settings) {
        if (!settings.sps_show_5e) return;
        function attachF5eClick() {
            document.querySelectorAll('.btn-f5e').forEach(btn => {
                if (btn._f5eBound) return;
                btn._f5eBound = true;
                const sid = btn.dataset.steamid || steamID;
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!chrome.runtime || !chrome.runtime.id) return;   
                    openF5eModal(sid, settings);
                });
            });
        }
        attachF5eClick();
        const obs = new MutationObserver(() => attachF5eClick());
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => obs.disconnect(), 10000);
    }

    let _f5eActiveClose = null;

    function openF5eModal(steamId, settings) {
        const txt = I18N[settings.sps_language] || I18N.zh;
        const isZh = txt.region === '地区';
        if (_f5eActiveClose) _f5eActiveClose();   
        else {
            
            document.querySelector('.sps-f5e-modal')?.remove();
            document.querySelector('.sps-f5e-badge')?.remove();
            _f5eClearDoc();
        }

        const modal = document.createElement('div');
        const cornerVal = settings.sps_corner_style === 'sharp' ? '2px' : '12px';
        const cStyle = (settings.sps_container_style || 'auto');
        const panelBgCls = cStyle === 'solid' ? ' sps-pw-solid' : (cStyle === 'glass' ? ' sps-pw-glass' : '');
        
        const isFrameModal = (settings.sps_frame_mode || 'pip') === 'modal';
        modal.className = 'sps-pw-modal sps-f5e-modal' + (isFrameModal ? '' : ' sps-pw-pip-mode');
        modal.innerHTML = `<div class="sps-pw-overlay"></div>
            <div class="sps-pw-panel${panelBgCls}" style="--sps-corner:${cornerVal};">
                <div class="sps-pw-header"><span class="sps-pw-header-title">${txt.f5e_title}</span>
                    <span class="sps-pw-header-actions">
                        ${settings.sps_f5e_contact === true ? `<button type="button" class="sps-f5e-contact-dot" aria-label="${isZh ? '账号绑定信息（设置内可关）' : 'Account binding info'}"></button>` : ''}
                        <button type="button" class="sps-frame-ctrl sps-f5e-setme" title="${isZh ? '把当前资料页设为我（比赛详情里高亮）' : 'Set current profile as me (highlight in match details)'}">★</button>
                        <button class="sps-frame-ctrl sps-f5e-refresh" title="${isZh ? '刷新（清除缓存重新查询）' : 'Refresh (clear cache)'}">↻</button>
                        <button class="sps-frame-ctrl sps-f5e-min" title="${isZh ? '最小化（挂起保留数据）' : 'Minimize'}">—</button>
                        <button class="sps-frame-ctrl sps-f5e-close">&times;</button>
                    </span></div>
                <div class="sps-f5e-contact-bar" style="display:none;"></div>
                <div class="sps-pw-body">
                    ${settings.sps_f5e_search !== false ? `<div class="sps-pw-search-row">
                        <input type="text" class="sps-pw-search-input sps-f5e-search-input" maxlength="32" placeholder="${isZh ? '输入5E昵称搜索...' : 'Search 5E nickname...'}">
                        <button class="sps-pw-search-btn sps-f5e-search-btn">${isZh ? '搜索' : 'Search'}</button>
                    </div>
                    <div class="sps-pw-search-results sps-f5e-search-results" style="display:none;"></div>` : ''}
                    <div class="sps-pw-result-area sps-f5e-result-area"><div class="sps-pw-loading">${isZh ? '📡 读取中...' : '📡 Loading...'}</div></div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        
        spsFocusWindow(modal);
        document.dispatchEvent(new CustomEvent('sps-window-focus', { detail: { el: modal } }));
        const panel = modal.querySelector('.sps-pw-panel');
        panel.addEventListener('pointerdown', () => {
            spsFocusWindow(modal);
            document.dispatchEvent(new CustomEvent('sps-window-focus', { detail: { el: modal } }));
        });

        const contactDot = modal.querySelector('.sps-f5e-contact-dot');
        const contactBar =  (modal.querySelector('.sps-f5e-contact-bar'));
        if (contactDot && contactBar) {
            let fetched = false;
            contactDot.addEventListener('click', ( e) => {
                e.stopPropagation();
                const open = contactBar.style.display === 'none';
                contactBar.style.display = open ? 'block' : 'none';
                contactDot.classList.toggle('on', open);
                if (!open || fetched) return;
                fetched = true;
                contactBar.textContent = isZh ? '读取中…' : 'Loading…';

                const ov = overview || null;
                safeSendMessage({ type: 'FETCH_F5E_CONTACT', steamId: activeSid || steamId,
                    uuid: (ov && ov.uuid) || '', domain: activeDomain || (ov && ov.domain) || '' }, ( res) => {
                    if (!contactBar.isConnected) return;
                    const d = res && res.success ? res.data : null;
                    if (!d) { contactBar.textContent = txt.f5e_contact_fail; fetched = false; return; }   
                    
                    if (d.deny) { contactBar.textContent = txt.f5e_contact_deny; return; }
                    if (d.disabled) { contactBar.textContent = txt.f5e_contact_off; fetched = false; return; }
                    if (!d.mobile && !d.email) { contactBar.textContent = txt.f5e_contact_none; fetched = false; return; }
                    contactBar.textContent = `${txt.f5e_contact_mobile} ${d.mobile || txt.f5e_contact_none} · ${txt.f5e_contact_email} ${d.email || txt.f5e_contact_none}`;
                }, 12000);
            });
        }

        const setmeBtn = modal.querySelector('.sps-f5e-setme');
        if (setmeBtn) {
            setmeBtn.addEventListener('click', ( e) => {
                e.stopPropagation();
                const sid = String(steamId || '');
                if (!/^7656\d{13}$/.test(sid)) {
                    setmeBtn.title = isZh ? '当前资料页 SteamID 无效' : 'Invalid SteamID';
                    return;
                }

                spsWriteAccountId('sps_my_steamid', sid, ( ok) => {
                    setmeBtn.classList.toggle('on', ok);
                    setmeBtn.title = ok ? (isZh ? '已设为我：' + sid : 'Set as me: ' + sid) : (isZh ? '设置失败（存储未生效）' : 'Failed (not stored)');
                });
            });
            spsReadAccountId(['sps_my_steamid'], ( sid) => {
                if (!modal.isConnected || !sid) return;
                if (sid === String(steamId || '')) {
                    setmeBtn.classList.add('on');
                    setmeBtn.title = isZh ? '已设为我：' + sid : 'Set as me: ' + sid;
                } else {
                    setmeBtn.title = isZh ? '当前设为我：' + sid + '（点此改为本页）' : 'Me: ' + sid + ' (click to change)';
                }
            });
        }

        const header = modal.querySelector('.sps-pw-header');
        const F5E_MIN_W = 360, F5E_MIN_H = 240, F5E_DEF_W = 560;
        if (window.innerWidth < F5E_DEF_W + 8) {
            panel.style.width = Math.max(80, window.innerWidth - 8) + 'px';
        }
        const disposeResize = spsBindResize({ target:  (panel), min: { w: F5E_MIN_W, h: F5E_MIN_H } });
        let isDragging = false, startX = 0, startY = 0, origX = 0, origY = 0;
        header.style.cursor = 'grab';
        header.addEventListener('mousedown', ( e) => {
            if (e.target.closest('.sps-f5e-close') || e.target.closest('.sps-f5e-refresh') || e.target.closest('.sps-f5e-min') || e.target.closest('.sps-f5e-contact-dot') || e.target.closest('.sps-f5e-setme')) return;
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
        _f5eOnDoc('mousemove', ( e) => {
            if (!isDragging) return;

            const pos = spsClampPanelPos( (panel),
                origX + e.clientX - startX, origY + e.clientY - startY);
            panel.style.left = pos.left + 'px';
            panel.style.top = pos.top + 'px';
        });
        _f5eOnDoc('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'grab';
            }
        });

        const cleanupFns = [];
        
        cleanupFns.push(disposeResize);
        const f5eRuntimeListener = ( msg) => { onRuntimeMessage(msg); };
        chrome.runtime.onMessage.addListener(f5eRuntimeListener);
        cleanupFns.push(() => chrome.runtime.onMessage.removeListener(f5eRuntimeListener));

        const closeModal = () => {
            spsUnregisterWindow(modal);
            for (const fn of cleanupFns.splice(0)) { try { fn(); } catch (e) {  } }
            _f5eActiveClose = null;
            modal.remove();
            _f5eClearDoc();

            try { spsCloseModeFilterPop(); } catch (e) {  }
            const badge = document.querySelector('.sps-f5e-badge');
            if (badge) { badge.remove(); layoutBadges(); }
        };
        _f5eActiveClose = closeModal;
        modal.querySelector('.sps-f5e-close').addEventListener('click', closeModal);
        modal.querySelector('.sps-pw-overlay').addEventListener('click', () => {
            const badge = document.querySelector('.sps-f5e-badge');
            if (badge) { modal.style.display = 'none'; }
            else closeModal();
        });
        modal.querySelector('.sps-f5e-min').addEventListener('click', () => {
            modal.style.display = 'none';
            let badge = document.querySelector('.sps-f5e-badge');
            if (!badge) {
                badge = document.createElement('button');
                badge.className = 'sps-pw-badge sps-f5e-badge';   
                document.body.appendChild(badge);
                badge.addEventListener('click', () => {
                    const m = document.querySelector('.sps-f5e-modal');
                    if (m) {
                        m.style.display = 'flex';
                        spsFocusWindow(m);
                        document.dispatchEvent(new CustomEvent('sps-window-focus', { detail: { el: m } }));
                    }
                    hideBadgeAt(badge);
                });
            }
            badge.textContent = txt.f5e_btn || '5E平台';
            showBadgeAt(badge);
        });

        const resultArea = modal.querySelector('.sps-f5e-result-area');
        modal.querySelector('.sps-f5e-refresh').addEventListener('click', () => {
            const btn = modal.querySelector('.sps-f5e-refresh');
            btn.classList.add('spinning');
            safeSendMessage({ type: 'CLEAR_F5E_CACHE', steamId: activeSid }, () => {
                setTimeout(() => btn.classList.remove('spinning'), 600);
                fetchAndRender(activeSid);
            });
        });

        if (settings.sps_f5e_search !== false) {
            const searchInput = modal.querySelector('.sps-f5e-search-input');
            const searchBtn = modal.querySelector('.sps-f5e-search-btn');
            const searchResults = modal.querySelector('.sps-f5e-search-results');
            let searchTimer = null;
            function doSearch() {
                const kw = String(searchInput.value || '').trim();
                if (!kw || !chrome.runtime || !chrome.runtime.id) {
                    searchResults.style.display = 'none';
                    searchResults.innerHTML = '';
                    return;
                }
                searchResults.style.display = 'block';
                searchResults.innerHTML = `<div class="sps-pw-loading">${isZh ? '🔍 搜索中...' : '🔍 Searching...'}</div>`;
                safeSendMessage({ type: 'SEARCH_F5E_USER', keyword: kw }, ( response) => {
                    const users = response && response.success && response.data && Array.isArray(response.data.users) ? response.data.users : [];
                    if (!users.length) {
                        searchResults.innerHTML = `<div class="sps-pw-error">${isZh ? '未找到玩家' : 'No players found'}</div>`;
                        return;
                    }
                    searchResults.innerHTML = users.map(( u) =>
                        `<div class="sps-pw-search-item sps-f5e-search-item" data-domain="${esc(u.domain)}">
                            <span class="sps-f5e-si-name">${esc(u.username)}</span><span class="sps-f5e-si-domain">${esc(u.domain)}</span>
                        </div>`).join('');
                    searchResults.querySelectorAll('.sps-f5e-search-item').forEach(item => {
                        item.addEventListener('click', () => {
                            searchResults.style.display = 'none';
                            searchResults.innerHTML = '';
                            searchInput.value = '';
                            fetchAndRender(String(item.dataset.domain || ''), { byDomain: true });
                        });
                    });
                }, 20000);
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
            searchInput.addEventListener('keydown', ( e) => { if (e.key === 'Enter') { clearTimeout(searchTimer); doSearch(); } });
        }

        let activeSid = steamId;
        let activeDomain = '';
        let _overviewReq = 0;
        let _seasonReq = 0;
        let overview = null;
        let _f5ePendingPhase2 = null;   
        let _f5eGateTimer = null;       
        let lastSelectedSeason = '';    
        const banTxt = txt;

        function selectSeason(seasonId) {
            if (!overview || !seasonId) return;
            lastSelectedSeason = seasonId;
            const drawerCur = resultArea.querySelector('.sps-f5e-drawer-cur');
            if (drawerCur) {
                const s = (overview.seasonList || []).find(( x) => x.season === seasonId);
                drawerCur.textContent = s ? (f5eSeasonLabel(s.season) + (s.current ? '*' : '')) : f5eSeasonLabel(seasonId);
            }
            resultArea.querySelectorAll('.sps-f5e-drawer-item').forEach(item => {
                item.classList.toggle('active', item.dataset.season === seasonId);
            });
            const detailEl = resultArea.querySelector('.sps-f5e-detail');
            if (!detailEl) return;
            detailEl.innerHTML = `<div class="sps-pw-loading">${isZh ? '📡 读取中...' : '📡 Loading...'}</div>`;
            const myReq = ++_seasonReq;

            const sWin = (overview.seasonList || []).find(( x) => x.season === seasonId) || null;
            safeSendMessage({ type: 'FETCH_F5E_SEASON', steamId: activeSid, uuid: overview.uuid || undefined, season: seasonId,
                beginUnix: sWin ? sWin.beginUnix : undefined, endUnix: sWin ? sWin.endUnix : undefined,
                currentSeason: overview.currentSeason }, ( resp) => {
                if (myReq !== _seasonReq || !detailEl.isConnected) return;
                if (resp?.success && resp.data?.success) {
                    renderF5eSeasonDetail(detailEl, resp.data, overview, isZh);
                    bindF5eMatchHistory(detailEl);   
                    bindF5eAdvancedLoader(detailEl, overview, String(resp.data.season || seasonId), activeSid, isZh, (overview.__advData = overview.__advData || new Map()));   
                } else {
                    detailEl.innerHTML = `<div class="sps-pw-error">❌ ${resp?.data?.error || (isZh ? '查询失败' : 'failed')}</div>`;
                }
            });
        }

        function fetchAndRender(key, opts) {
            const byDomain = !!(opts && opts.byDomain);
            const keepLayout = !!(opts && opts.keepLayout);
            const gateAttempt = (opts && opts.gateAttempt) || 0;
            if (_f5eGateTimer) { clearTimeout(_f5eGateTimer); _f5eGateTimer = null; }
            if (byDomain) { activeDomain = key; activeSid = ''; }
            else { activeSid = key; activeDomain = ''; }
            const myReq = ++_overviewReq;
            if (!keepLayout) {
                resultArea.innerHTML = `<div class="sps-pw-loading">${isZh ? '📡 读取中...' : '📡 Loading...'}</div>`;
            }
            safeSendMessage({ type: 'FETCH_F5E_STATS', steamId: activeSid, domain: activeDomain || undefined }, ( response) => {
                if (myReq !== _overviewReq) return;   
                if (!area_check()) return;
                const d = response && response.success ? response.data : null;
                if (!d || d.error) {
                    addDebugLog('f5e', `overview error=${(d && d.error) || 'unknown'} key=${key}`);
                    if (keepLayout && overview) {
                        const gateEl = resultArea.querySelector('.sps-pw-chart-gate');
                        if (gateEl) gateEl.textContent = isZh ? '⚠️ 历史赛季统计加载失败（点右上角 ↻ 重试）' : '⚠️ Season history failed (click ↻ to retry)';
                        return;
                    }
                    renderF5eError(resultArea, isZh, d && d.error ? d.error : 'NETWORK_ERROR');
                    return;
                }
                overview = d;

                const phaseKey = byDomain ? 'd:' + activeDomain : activeSid;
                _f5ePendingPhase2 = overview.phase2 ? { key: phaseKey, myReq } : null;
                if (_f5ePendingPhase2) {
                    _f5eGateTimer = setTimeout(() => {
                        _f5eGateTimer = null;
                        if (myReq !== _overviewReq || !_f5ePendingPhase2 || !modal.isConnected) return;
                        if (gateAttempt >= 1) {
                            _f5ePendingPhase2 = null;
                            addDebugLog('f5e', `phase2 gate timeout twice, give up key=${phaseKey}`);
                            const gate = resultArea.querySelector('.sps-pw-chart-gate');
                            if (gate) gate.textContent = isZh ? '⚠️ 历史赛季统计加载失败（点右上角 ↻ 重试）' : '⚠️ Season history failed (click ↻ to retry)';
                            return;
                        }
                        _f5ePendingPhase2 = null;
                        addDebugLog('f5e', `phase2 gate timeout, in-place retry key=${phaseKey}`);
                        fetchAndRender(key, { byDomain, keepLayout: true, gateAttempt: gateAttempt + 1 });
                    }, 90000);
                }
                renderF5eOverview(resultArea, overview, isZh, settings, selectSeason, f5eBanBadgeHtml(overview.ban, banTxt), overview.ban);
                if (overview.phase2 !== true) {
                    const target = (keepLayout && lastSelectedSeason) ? lastSelectedSeason
                        : (overview.currentSeason || ((overview.seasonList || [])[0] || {}).season || '');
                    if (target) selectSeason(target);
                } else {

                    selectSeason(lastSelectedSeason || overview.currentSeason || '');
                }
            }, 60000);
        }

        function area_check() { return !!modal.isConnected; }

        fetchAndRender(steamId);

        function onRuntimeMessage(msg) {
            if (!msg || !modal.isConnected) return;
            
            if (msg.type === 'F5E_KD_PROGRESS') {
                if (msg.season && lastSelectedSeason && String(msg.season) !== String(lastSelectedSeason)) return;
                const host = resultArea.querySelector('[data-f5e-kd]');
                if (!host) return;
                const d = msg.data || {};
                host.innerHTML = f5eKdProgressHtml(f5eNum(d.cnt), f5eNum(d.target), isZh);
                return;
            }
            if (msg.type === 'F5E_STATS_PHASE2') {
                if (!_f5ePendingPhase2 || !msg.data) return;

                const byKey = msg.key === _f5ePendingPhase2.key;
                const bySid = !msg.key && msg.steamId === activeSid;
                if (!byKey && !bySid) return;      
                if (_f5ePendingPhase2.myReq !== _overviewReq) return; 
                if (_f5eGateTimer) { clearTimeout(_f5eGateTimer); _f5eGateTimer = null; }
                _f5ePendingPhase2 = null;
                if (msg.data.error) {
                    addDebugLog('f5e', `phase2 error=${msg.data.error} key=${msg.key}`);
                    const gate = resultArea.querySelector('.sps-pw-chart-gate');
                    if (gate) gate.textContent = isZh ? '⚠️ 历史赛季统计加载失败' : '⚠️ Season history failed';
                    return;
                }
                
                overview = Object.assign({}, overview, msg.data, { phase2: false });
                renderF5eOverview(resultArea, overview, isZh, settings, selectSeason, f5eBanBadgeHtml(overview.ban, banTxt), overview.ban);
                selectSeason(lastSelectedSeason || overview.currentSeason || '');
            }
        }
    }

    let _f5eDocListeners = [];
    let _f5eLastDrawerCloser = null;   
    function _f5eOnDoc(type, fn) {
        document.addEventListener(type, fn);
        _f5eDocListeners.push([type, fn]);
    }
    function _f5eClearDoc() {
        _f5eDocListeners.forEach(([t, f]) => document.removeEventListener(t, f));
        _f5eDocListeners = [];
        _f5eLastDrawerCloser = null;
    }

    function renderF5eError(area, isZh, code) {
        const ZH = {
            NOT_BINDDED: '❌ 未查询到该 SteamID 绑定的 5E 账号（未注册 5E 或未绑定 Steam）',
            RESOLVE_FAILED: '❌ 5E 账号解析失败（平台接口波动，稍后重试）',
            NETWORK_ERROR: '📡 5E 平台请求失败（网络波动，稍后重试）'
        };
        const EN = {
            NOT_BINDDED: '❌ No 5E account bound to this SteamID',
            RESOLVE_FAILED: '❌ 5E account resolve failed (platform hiccup, retry later)',
            NETWORK_ERROR: '📡 5E request failed (network hiccup, retry later)'
        };
        area.innerHTML = `<div class="sps-pw-error">${isZh ? (ZH[code] || ZH.NETWORK_ERROR) : (EN[code] || EN.NETWORK_ERROR)}</div>`;
    }

    function renderF5eOverview(area, d, isZh, settings, selectSeason, banBadge, banData) {
        void settings;
        banBadge = banBadge || '';
        const txt = I18N[settings.sps_language] || I18N.zh;

        const seasonList = Array.isArray(d.seasonList) ? d.seasonList : [];
        const creditLine = d.credit > 0 ? `${isZh ? '信用分 ' : 'Credit '}${esc(String(d.credit))}` : '';

        const rawAvatar = d.avatar ? String(d.avatar) : '';
        const avatarUrl = /^https?:/i.test(rawAvatar) ? safeUrl(rawAvatar)
            : (rawAvatar ? 'https://oss-arena.5eplay.com/' + rawAvatar.replace(/^\/+/, '') : '');
        const phase2 = d.phase2 === true;

        const items = seasonList.map(( s) => {
            const cur = !!s.current;
            const label = f5eSeasonLabel(s.season) + (cur ? '*' : '');

            const tier = (!phase2 && s.elo > 0) ? f5eTierFull(s.elo, s.starNum, s.season, isZh, s.levelId) : '';
            const unranked = !phase2 && s.elo > 0 && f5eUnranked(s.levelId, s.season);
            const tierNote = tier ? '（' + tier + '）' : (unranked ? (isZh ? '（未定级）' : ' (unranked)') : '');
            const scoreText = phase2 ? (isZh ? '统计中…' : 'loading…') : (s.elo > 0
                ? `${s.elo}${tierNote}`
                : (isZh ? '无分' : 'no score'));
            const metaText = (!phase2 && s.matches > 0)
                ? `${s.matches}${isZh ? '场' : 'g'} ${((s.wins || 0) / s.matches * 100).toFixed(0)}%`
                : '';

            return `<div class="sps-pw-drawer-item sps-f5e-drawer-item${cur ? ' current' : ''}${phase2 ? ' sps-pw-skel' : ''}" data-season="${esc(s.season)}"${spsTipAttr(isZh ? '点击查看该赛季' : 'Click to view this season', { pos: 'right', clickable: false })}>
                <span class="sps-pw-drawer-season">${esc(label)}</span>
                <span class="sps-pw-drawer-score">${esc(scoreText)}</span>
                ${metaText ? `<span class="sps-pw-drawer-meta">${esc(metaText)}</span>` : ''}
            </div>`;
        }).join('');

        const peak = f5eGetPeak(d);
        
        const chartHtml = (phase2 || !seasonList.length)
            ? `<div class="sps-pw-chart-gate">${phase2 ? (isZh ? '历史赛季统计加载中…' : 'Loading season history…') : (isZh ? '暂无赛季数据' : 'No season data')}</div>`
            : renderF5eSeasonChart(seasonList, isZh, area._spsTrendPage, peak.season);

        area.innerHTML = `
            <div class="sps-panel-hero sps-pw-player">
                <div class="sps-panel-hero-user">
                    ${avatarUrl ? `<img class="sps-panel-hero-ava sps-pw-avatar" src="${esc(avatarUrl)}" alt="" referrerpolicy="no-referrer">` : ''}
                    <div class="sps-panel-hero-meta sps-pw-player-info">
                        <div class="sps-panel-hero-name sps-pw-player-name">${esc(d.username || '')}${banBadge}</div>
                        <div class="sps-panel-hero-sub">${isZh ? '5E 对战平台' : '5E Platform'}${creditLine ? ` · ${creditLine}` : ''}</div>
                    </div>
                </div>
            </div>
            ${items ? `<div class="sps-pw-drawer sps-f5e-drawer">
                <button class="sps-pw-drawer-btn"><span class="sps-pw-drawer-cur sps-f5e-drawer-cur">${isZh ? '选择赛季' : 'Select season'}</span><span class="sps-pw-drawer-arrow">▾</span></button>
                <div class="sps-pw-drawer-panel">${items}</div>
            </div>` : (phase2 ? `<div class="sps-pw-chart-gate sps-f5e-drawer-skel">${isZh ? '历史赛季统计加载中…' : 'Loading season history…'}</div>` : '')}
            ${f5eBanHistoryHtml(banData, isZh)}
            <div class="sps-f5e-detail"><div class="sps-pw-loading">${isZh ? '读取中...' : 'Loading...'}</div></div>
            ${chartHtml ? `<div class="sps-pw-sec">${isZh ? '赛季 ELO 趋势' : 'Season Trend'}</div><div class="sps-card-section">${chartHtml}</div>` : ''}`;

        const drawer = area.querySelector('.sps-f5e-drawer');
        if (drawer) {
            const btn = drawer.querySelector('.sps-pw-drawer-btn');
            btn.addEventListener('click', ( e) => {
                e.stopPropagation();
                drawer.classList.toggle('open');
            });
            drawer.querySelectorAll('.sps-f5e-drawer-item').forEach(item => {
                item.addEventListener('click', () => {
                    selectSeason(String(item.dataset.season || ''));
                    drawer.classList.remove('open');
                });
            });
            const docCloser = ( e) => {
                if (drawer.classList.contains('open') && !drawer.contains(e.target)) {
                    drawer.classList.remove('open');
                }
            };
            
            if (_f5eLastDrawerCloser) {
                document.removeEventListener('click', _f5eLastDrawerCloser);
                _f5eDocListeners = _f5eDocListeners.filter((p) => !(p[0] === 'click' && p[1] === _f5eLastDrawerCloser));
            }
            _f5eLastDrawerCloser = docCloser;
            _f5eOnDoc('click', docCloser);
        }

        bindF5eChartTip(area, selectSeason);
        bindTrendNav(area);

        area._spsTrendRerender = ( animDir) => {
            if (phase2 || !seasonList.length) return;
            
            const oldSvg = area.querySelector('.sps-pw-chart-wrap') || area.querySelector('.sps-f5e-chart');
            if (!oldSvg) return;
            const holder = document.createElement('template');
            holder.innerHTML = renderF5eSeasonChart(seasonList, isZh, area._spsTrendPage, peak.season);
            const next = holder.content.firstElementChild;
            if (!next) return;
            oldSvg.replaceWith(next);
            bindF5eChartTip(area, selectSeason);
            bindTrendNav(area, animDir);
        };
    }

    function f5eSeasonLabel(season) {
        const m = /^(\d{4})s(\d+)$/i.exec(String(season || ''));
        return m ? m[1] + ' S' + m[2] : (String(season || '') || '-');
    }

    function f5eNum(v) { const n = parseFloat(String(v)); return Number.isFinite(n) ? n : 0; }

    function fmtMonthDay5e(dt) {
        const p = ( x) => String(x).padStart(2, '0');
        return `${p(dt.getMonth() + 1)}/${p(dt.getDate())} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
    }

    function f5ePickPeakSeason(seasonList, fallbackElo) {
        const tierOrder = ( s) => {
            
            const tag = f5eTierFull(s.elo, s.starNum, s.season, true, s.levelId);
            const m = /^([A-Z+]+)(?:·(\d+)★)?$/.exec(String(tag || ''));
            if (!m) return 0;
            const ladder = ['D', 'C', 'C+', 'C++', 'B', 'B+', 'B++', 'A', 'A+', 'A++', 'S', 'SS', 'SSS', 'S+'];
            return (ladder.indexOf(m[1]) + 1) * 1000 + (f5eNum(m[2]) || 0);   
        };
        let best = null, bestKey = -1;
        for (const s of (seasonList || [])) {
            const elo = f5eNum(s.elo);
            if (elo <= 0) continue;
            const key = tierOrder(s) * 1e6 + elo;   
            if (key > bestKey) { bestKey = key; best = s; }
        }
        if (best) return { season: String(best.season || ''), elo: f5eNum(best.elo), starNum: f5eNum(best.starNum), levelId: f5eNum(best.levelId) };
        return { season: '', elo: f5eNum(fallbackElo), starNum: 0, levelId: 0 };
    }

    function f5eGetPeak(ov) {
        if (!ov || typeof ov !== 'object') return { season: '', elo: 0, starNum: 0, levelId: 0 };
        const peakRow = (ov.peakSeason && f5eNum(ov.peakElo) > 0)
            ? [{ season: String(ov.peakSeason), elo: f5eNum(ov.peakElo), starNum: f5eNum(ov.peakStarNum), levelId: f5eNum(ov.peakLevelId), peak: true }]
            : [];
        const maxElo = Math.max(f5eNum(ov.maxElo) || 0, f5eNum(ov.elo) || 0);
        const curRow = (ov.currentSeason && f5eNum(ov.elo) > 0)
            ? [{ season: String(ov.currentSeason), elo: f5eNum(ov.elo), starNum: f5eNum(ov.starNum), levelId: f5eNum(ov.levelId), current: true }] : [];
        return f5ePickPeakSeason((ov.seasonList || []).concat(peakRow, curRow), maxElo);
    }

    function renderF5eSeasonChart(seasonList, isZh, pageArg, peakSeasonArg) {
        const pts = (seasonList || [])
            .filter(( s) => s.matches > 0 && f5eNum(s.elo) > 0)
            .sort(( a,  b) => f5eSeasonOrderC(a.season) - f5eSeasonOrderC(b.season))
            .map(( s) => ({
                label: f5eSeasonLabel(s.season),
                season: s.season,
                score: f5eNum(s.elo),
                tier: f5eTierFull(s.elo, s.starNum, s.season, isZh, s.levelId),
                current: !!s.current,
                meta: (isZh ? `${s.matches}场` : s.matches + 'g') + (s.rank > 0 ? ` · #${s.rank}` : '')
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

        const targetPeak = String(peakSeasonArg || (f5ePickPeakSeason(seasonList).season || ''));
        const maxIdx = targetPeak ? win.findIndex(p => p.season === targetPeak) : -1;
        const dots = win.map((p, i) => {
            const isMax = i === maxIdx, isCur = p.current;
            const r = isMax ? 4 : 3;
            const fill = isMax ? '#ffc107' : (isCur ? '#a3cf06' : '#0d1520');
            const stroke = isCur ? '#a3cf06' : '#66c0f4';
            const tip = `data-label="${esc(p.label)}" data-score="${esc(p.score)}" data-meta="${esc(p.meta)}" data-season="${esc(p.season)}" data-tier="${esc(p.tier || '')}"`;
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
            const tip = `data-label="${esc(p.label)}" data-score="${esc(p.score)}" data-meta="${esc(p.meta)}" data-season="${esc(p.season)}" data-tier="${esc(p.tier || '')}"`;
            return `<text class="num" ${tip} x="${X(i).toFixed(1)}" y="${(Y(p.score) - 8).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="${color}">${p.score}</text>`;
        }).join('');

        return `<div class="sps-pw-chart-wrap"><svg class="sps-pw-chart sps-f5e-chart" viewBox="0 0 ${W} ${H}">
            <defs>
                <linearGradient id="spsF5eChartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#66c0f4" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#66c0f4" stop-opacity="0.02"/>
                </linearGradient>
            </defs>
            ${area ? `<polygon points="${area}" fill="url(#spsF5eChartFill)"/>` : ''}
            ${n >= 2 ? `<polyline points="${line}" fill="none" stroke="#66c0f4" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
            ${dots}${nums}${labels}
        </svg>
        ${n < total ? `<div class="sps-trend-nav" data-max-page="${pages - 1}">
            <button class="sps-trend-arrow" data-trend-dir="-1" aria-label="older"${startIdx <= 0 ? ' disabled' : ''}>‹</button>
            <span class="sps-trend-pageinfo">${startIdx + 1}-${endIdx} / ${total}</span>
            <button class="sps-trend-arrow" data-trend-dir="1" aria-label="newer"${endIdx >= total ? ' disabled' : ''}>›</button>
        </div>` : ''}</div>`;
    }

    function f5eSeasonOrderC(season) {
        const m = /^(\d{4})s(\d+)$/i.exec(String(season || ''));
        return m ? (parseInt(m[1], 10) * 10 + parseInt(m[2], 10)) : 0;
    }

    function bindF5eChartTip(body, selectSeason) {
        ( (body)).__f5eTipTier = '';   
        const svg =  (body.querySelector('.sps-f5e-chart'));
        if (!svg) return;
        const NS = 'http://www.w3.org/2000/svg';
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
            const t = document.createElementNS(NS, 'text');
            t.setAttribute('x', '8');
            t.setAttribute('y', '15');
            t.setAttribute('font-size', '10');
            t.setAttribute('fill', '#e9ebee');
            const t1 = document.createElementNS(NS, 'tspan');
            t1.setAttribute('fill', '#66c0f4');
            t1.textContent = label;
            t.appendChild(t1);
            const tier = ( (body)).__f5eTipTier || '';
            t.appendChild(document.createTextNode(` ${score}${tier ? '（' + tier + '）' : ''}${meta ? ` · ${meta}` : ''}`));
            tipG.appendChild(rect);
            tipG.appendChild(t);
            const w = t.getComputedTextLength();
            const tipW = w + 14;
            const tipH = 24;
            const vb = ( (svg)).viewBox.baseVal;
            let tx = x + 10, ty = y - 12;
            if (tx + tipW > vb.width - 2) tx = x - tipW - 10;
            if (tx < 2) tx = 2;
            if (ty < 2) ty = y + 14;
            if (ty + tipH > vb.height - 2) ty = vb.height - tipH - 2;
            rect.setAttribute('width', String(tipW));
            tipG.setAttribute('transform', `translate(${tx.toFixed(1)}, ${ty.toFixed(1)})`);
            tipG.style.display = 'block';
        };
        const clearHover = () => {
            svg.querySelectorAll('circle.dot.sps-dot-hover, text.num.sps-dot-hover').forEach(el => el.classList.remove('sps-dot-hover'));
        };
        svg.addEventListener('mousemove', ( e) => {
            const c = e.target.closest('circle[data-label], text.num[data-label]');
            clearHover();
            if (!c) { tipG.style.display = 'none'; return; }
            ( (body)).__f5eTipTier = c.dataset.tier || '';   
            
            const seasonSel = (window.CSS && CSS.escape) ? CSS.escape(String(c.dataset.season || '')) : '';
            const dot = seasonSel ? svg.querySelector(`circle.dot[data-season="${seasonSel}"]`) : null;
            if (dot) dot.classList.add('sps-dot-hover');
            const num = seasonSel ? svg.querySelector(`text.num[data-season="${seasonSel}"]`) : null;
            if (num) num.classList.add('sps-dot-hover');
            const pt = ( (svg)).createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const ctm = ( (svg)).getScreenCTM();
            if (ctm) {
                const loc = pt.matrixTransform(ctm.inverse());
                showTip(loc.x, loc.y, c.dataset.label, c.dataset.score, c.dataset.meta);
            }
        });
        svg.addEventListener('mouseleave', () => { tipG.style.display = 'none'; clearHover(); });
        svg.addEventListener('click', ( e) => {
            const c = e.target.closest('circle[data-season], text.num[data-season]');
            if (c && c.dataset.season && typeof selectSeason === 'function') selectSeason(String(c.dataset.season));
        });
    }

    function f5eMhSummary(mh, isZh, sel) {
        if (!Array.isArray(mh) || !mh.length) return '';
        const keys = Array.isArray(sel) && sel.length ? sel.map(String) : null;
        const pool = keys
            ? mh.filter(( m) => {
                const mt = String(m && m.matchType != null ? m.matchType : '');
                return !mt || mt === '-1' || keys.indexOf(mt) >= 0;
            })
            : mh;
        if (!pool.length) return '';
        const firstDt = pool[0].startTime > 0 ? fmtMonthDay5e(new Date(pool[0].startTime * 1000)) : '';
        const w = pool.filter(( m) => m.isWin && !m.isTie).length;
        const l = pool.filter(( m) => !m.isWin && !m.isTie).length;
        return (firstDt ? (isZh ? '首场 ' + firstDt : 'since ' + firstDt) : '') +
            (isZh ? ` · ${w}胜${l}负` : ` · ${w}W-${l}L`);
    }

    function bindF5eMatchHistory(detailEl) {
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
            });
        });
    }

    function f5eRowStars(afterElo, starNum, season) {
        const elo = f5eNum(afterElo);
        const legacy = f5eTierTable(season) === 'legacy';
        const floor = legacy ? 2801 : 2401;   
        if (elo < floor) return 0;
        const sn = parseInt(String(starNum), 10);
        if (Number.isFinite(sn) && sn > 0 && sn <= 999) return sn;
        return legacy ? 0 : Math.floor((elo - 2400) / F5E_S_STAR_ELO);   
    }

    function renderF5eAdvancedSection(ov, seasonId, isZh, advData) {
        const cur = String(seasonId || '');
        const adv = advData && advData.has(cur)
            ? advData.get(cur)
            : (cur === (ov.currentSeason || '') && ov.advanced && String(ov.advanced.season || '') === cur ? ov.advanced : undefined);
        if (adv) return renderF5eAdvancedHtml(adv, isZh);
        
        return `<div class="sps-f5e-adv sps-f5e-adv-load" data-adv-season="${esc(cur)}" aria-busy="true">📡 ${isZh ? '读取中...' : 'Loading...'}</div>`;
    }

    function bindF5eAdvancedLoader(detailEl, ov, seasonId, steamId, isZh, advData) {
        const btn = detailEl.querySelector('.sps-f5e-adv-load');
        if (!btn) return;
        const sid = String(btn.dataset.advSeason || String(seasonId || ''));
        if (advData.has(sid) && advData.get(sid)) return;   
        safeSendMessage({ type: 'FETCH_F5E_ADVANCED', uuid: ov.uuid || '', steamId: String(steamId || ''), season: sid }, ( resp) => {
            if (!detailEl.isConnected) return;   
            if (resp && resp.success && resp.data) {
                advData.set(sid, resp.data);
                
                const live = detailEl.querySelector('.sps-f5e-adv-load');
                if (live && String(live.dataset.advSeason || '') === sid) live.outerHTML = renderF5eAdvancedSection(ov, sid, isZh, advData);
            }
            
        });
    }

    const F5E_ADV_SUB_LABEL = {
        counter_kill: ['对枪', 'Counter'], entry: ['入场', 'Entry'], burst: ['爆发', 'Burst'],
        aim: ['瞄准', 'Aim'], extra: ['其他', 'Extra'],
        cover: ['掩护', 'Cover'], suppression: ['压制', 'Suppress'], delay: ['拖延', 'Delay'], damage: ['伤害', 'Damage'],
        info_collection: ['信息收集', 'Info'], stealth: ['隐蔽', 'Stealth'], trade: ['补枪', 'Trade'], position_control: ['点控', 'Position'],
        map_control: ['图控', 'Map ctrl'], pressure_resist: ['抗压', 'Pressure'], position_search: ['选位', 'Positioning'], discipline: ['纪律', 'Discipline'],
        quick_reaction: ['反应', 'Reaction'], direct_aim: ['直瞄', 'Direct aim'], pistol: ['手枪', 'Pistol'], cover_quality: ['掩体', 'Cover q']
    };

    function renderF5eAdvancedHtml(adv, isZh) {
        if (!adv || typeof adv !== 'object') return '';
        
        const dims = [
            { key: 'entry_scores', zh: '突破', en: 'Entry', score: f5eNum(adv.entry) },
            { key: 'utility_scores', zh: '道具', en: 'Util', score: f5eNum(adv.utility) },
            { key: 'lurker_scores', zh: '潜伏', en: 'Lurk', score: f5eNum(adv.lurker) },
            { key: 'game_understanding_scores', zh: '意识', en: 'Aware', score: f5eNum(adv.understanding) },
            { key: 'sniper_scores', zh: '狙击', en: 'Snipe', score: f5eNum(adv.sniper) }
        ];
        const finalScore = f5eNum(adv.finalScore);
        const hasDim = dims.some(( d) => d.score > 0);
        
        if (!hasDim && finalScore <= 0 && f5eNum(adv.gameCnt) <= 0) return '';

        const dimCls = ( v) => v >= 80 ? 'S' : (v >= 60 ? 'A' : (v >= 40 ? 'B' : (v >= 20 ? 'C' : 'D')));

        const tip = ( d) => {
            const subs = (adv.subs && Array.isArray(adv.subs[d.key])) ? adv.subs[d.key] : [];
            return subs.map(( s) => {
                const lb = F5E_ADV_SUB_LABEL[s.k];
                return (lb ? (isZh ? lb[0] : lb[1]) : String(s.k)) + ' ' + f5eNum(s.v);
            }).join(' · ');
        };
        const roleLine = adv.role ? `${esc(String(adv.role))}${adv.roleAdj ? ' · ' + esc(String(adv.roleAdj)) : ''}${adv.roleProperty ? '（' + esc(String(adv.roleProperty)) + '）' : ''}` : '';
        
        const finalBlock = finalScore > 0
            ? `<div class="sps-f5e-adv-finalblock g${dimCls(finalScore)}"><span>${isZh ? '总评' : 'Overall'}</span><b>${finalScore}</b>${adv.professionValue > 0 ? `<i title="${isZh ? '职业价值' : 'Pro value'} ${adv.professionValue} / ${isZh ? '平均' : 'avg'} ${adv.avgValue}">${isZh ? '职业价值 ' : 'Pro '}${adv.professionValue}</i>` : ''}</div>` : '';

        const radarHtml = hasDim
            ? renderPentagonRadar(dims.map(( d) => ({
                label: isZh ? d.zh : d.en,
                score: d.score,
                value: d.score / 10,
                grade: dimCls(d.score),
                tip: tip(d)
            })), 'f5e')
            : '';
        const radarWrap = (radarHtml || finalBlock) ? `<div class="sps-pw-radar-box">${radarHtml}${finalBlock}</div>` : '';
        return `<div class="sps-pw-sec">${isZh ? '各项数据' : 'Ability Analysis'}</div>
            <div class="sps-f5e-adv sps-card-section">
                ${radarWrap}
                ${roleLine ? `<div class="sps-f5e-adv-role">🎖️ ${roleLine}</div>` : ''}
                ${adv.gameCnt > 0 ? `<div class="sps-f5e-adv-note">${esc(isZh ? `基于 ${adv.gameCnt} 场样本` : 'Based on ' + adv.gameCnt + ' matches')}${adv.roleDesc ? ' · ' + esc(String(adv.roleDesc)) : ''}</div>` : ''}
            </div>`;
    }

    function f5eMatchRowHtml(m, isZh, season) {
        const dateStr = m.startTime > 0 ? fmtMonthDay5e(new Date(m.startTime * 1000)) : '';
        const timePart = dateStr.slice(6);
        const after = f5eNum(m.afterElo);

        const isLadderRow = f5eNum(m.matchType) === 9;
        const rowStars = isLadderRow ? f5eRowStars(after, m.starNum, season) : 0;
        
        const eloTxt = rowStars > 0 ? '★' + rowStars
            : (after > 0 ? after.toFixed(0)
                : (m.changeElo ? (m.changeElo > 0 ? '+' + m.changeElo.toFixed(0) : m.changeElo.toFixed(0)) : ''));
        const eloCls = m.isTie ? '' : (m.isWin ? 'up' : 'down');
        
        const kdBase = `${esc(String(m.kills))}/${esc(String(m.deaths))}`;
        const kadCell = `<span class="sps-pw-mh-val pw"${m.matchId ? ` data-f5e-kad="${esc(m.matchId)}"` : ''}>${kdBase}</span>`;

        const hsCell = `<span class="sps-pw-mh-val hs"${m.matchId ? ` data-f5e-hs="${esc(m.matchId)}"` : ''}>${m.hsRatio > 0 ? Math.round(m.hsRatio * 100) + '%' : '—'}</span>`;
        const winCls = m.isTie ? '' : (m.isWin ? ' win' : ' lose');

        const dotHtml = `<i class="sps-pw-mh-dot${m.isTie ? ' t' : (m.isWin ? ' w' : '')}"></i>`;

        const hasSs = m.rating3 != null && f5eNum(m.rating3) !== 0;

        const ratTone = f5eNum(m.rating) > 0 ? (f5eNum(m.rating) >= 1 ? ' up' : ' down') : '';
        const ssTone = hasSs ? (f5eNum(m.rating3) > 0 ? ' hi' : ' down') : '';
        return `<div class="sps-pw-mh-row det det5${winCls}" data-f5e-mt="${f5eNum(m.matchType)}">
            ${dotHtml}<span class="sps-pw-mh-date">${esc(dateStr.slice(0, 5))}${timePart ? `<span class="sps-pw-mh-time">${esc(timePart)}</span>` : ''}</span>
            <span class="sps-pw-mh-map">${esc((isZh && m.mapName) ? m.mapName : (m.map || '?'))}</span>
            ${kadCell}
            <span class="sps-pw-mh-val rat${ratTone}">${f5eNum(m.rating) > 0 ? f5eNum(m.rating).toFixed(2) : '-'}</span>
            <span class="sps-pw-mh-val ss${ssTone}"${!hasSs && m.matchId ? ` data-f5e-ss="${esc(m.matchId)}"` : ''}${isLadderRow && m.matchId ? ` data-f5e-seg="${esc(m.matchId)}"` : ''}>${hasSs ? f5eNum(m.rating3).toFixed(2) : '-'}</span>
            <span class="sps-pw-mh-val adr">${m.adr > 0 ? m.adr.toFixed(1) : '-'}</span>
            ${hsCell}
            <span class="sps-pw-mh-val sc${m.matchId ? ' sps-f5e-roster-btn' : ''}"${m.matchId ? ` data-f5e-roster="${esc(m.matchId)}" role="button" tabindex="0" title="${isZh ? '点击查看本场详情' : 'Click for the 10-player roster'}"` : ''}>${m.score1}:${m.score2}${m.isMvp ? ' 🏅' : ''}</span>
            <span class="sps-pw-mh-delta ${eloCls}"><span class="sps-pw-mh-elo">${esc(eloTxt)}</span>${modeBadgeHtml(m, isZh)}</span>
        </div>`;
    }

    function modeBadgeHtml(m, isZh) {
        const mt = f5eNum(m.matchType);
        const credit = m.isCredit ? (isZh ? '-受信' : '-T') : '';
        if (mt === 1) return `<i class="sps-pw-mh-mode" title="${isZh ? '对战匹配 · 此加减非优先排位 ELO' : 'Match Making · not priority ELO'}">${isZh ? '对战匹配' : 'MM'}${credit}</i>`;
        if (mt === 0) return `<i class="sps-pw-mh-mode" title="${isZh ? '新手匹配 · 无排位 ELO' : 'Beginner · no ranked ELO'}">${isZh ? '新手' : 'NEW'}</i>`;
        if (mt === 4) return `<i class="sps-pw-mh-mode" title="${isZh ? '5EPL · 此加减为职业联赛分非天梯分' : '5EPL · not ladder ELO'}">5EPL</i>`;
        if (mt === 6) return `<i class="sps-pw-mh-mode" title="${isZh ? '5EPL-C · 此加减为挑战联赛分非天梯分' : '5EPL-C · not ladder ELO'}">5EPL-C</i>`;
        if (mt === 8) return `<i class="sps-pw-mh-mode" title="${isZh ? '5EPL-D · 此加减为联赛分非天梯分' : '5EPL-D · not ladder ELO'}">5EPL-D</i>`;
        if (mt === 11) return `<i class="sps-pw-mh-mode" title="${isZh ? '5EPL-A · 此加减为联赛分非天梯分' : '5EPL-A · not ladder ELO'}">5EPL-A</i>`;
        if (mt === 163) return `<i class="sps-pw-mh-mode" title="${isZh ? '全民联赛 · 此加减为天梯分' : 'League · not ladder ELO'}">${isZh ? '联赛' : 'LG'}</i>`;
        if (mt === 3) return `<i class="sps-pw-mh-mode" title="${isZh ? '锦标赛 · 此加减为赛事分非天梯分（默认不显，可在过滤器里筛出来）' : 'Tournament · not ladder ELO (hidden by default, see filter)'}">${isZh ? '锦标赛' : 'TRN'}</i>`;
        
        if (mt === 5) return `<i class="sps-pw-mh-mode" title="${isZh ? '十人约战 · 5v5 约战局，非天梯分' : '10-man · casual 5v5, not ladder ELO'}">${isZh ? '十人约战' : '10P'}</i>`;
        if (mt === 2) return `<i class="sps-pw-mh-mode" title="${isZh ? '战队匹配 · 非天梯分' : 'Team clan match · not ladder ELO'}">${isZh ? '战队匹配' : 'CLAN'}</i>`;
        if (mt === 174) return `<i class="sps-pw-mh-mode" title="${isZh ? '团队匹配 · 非天梯分' : 'Team match · not ladder ELO'}">${isZh ? '团队匹配' : 'TEAM'}</i>`;
        if (mt === 37) return `<i class="sps-pw-mh-mode" title="${isZh ? '自定义房间 · 无排位分' : 'Custom lobby · no ranked ELO'}">${isZh ? '自定义' : 'CUSTOM'}</i>`;
        return '';
    }

    function f5ePeerNoteHtml(peerAvg, isZh) {
        if (!(peerAvg > 0)) return '';
        return `<i class="sps-f5e-note sps-f5e-ss-seg" data-f5e-seg-host="1" data-f5e-seg-official="1">${isZh ? '同水平均值' : 'Level avg'} ${peerAvg.toFixed(2)}</i>`;
    }

    function f5eKdNoteHtml(cnt, isZh) {
        if (!(cnt > 0)) return '';
        return `<i class="sps-f5e-note">${Math.round(cnt)}${isZh ? '场' : ' games'}</i>`;
    }

    function f5eKdProgressHtml(n, m, isZh) {
        const nn = Math.max(0, Math.round(f5eNum(n)));
        const mm = Math.max(0, Math.round(f5eNum(m)));
        return `<i class="sps-f5e-note sps-f5e-kd-prog">${isZh ? '采样中' : 'sampling'} ${nn}${mm > 0 ? '/' + mm : ''}</i>`;
    }

    function renderF5eSeasonDetail(detailEl, sd, ov, isZh) {
        const total = sd.matches > 0 ? (sd.wins / sd.matches * 100) : 0;
        const tier = f5eTierFull(sd.elo, sd.starNum, sd.season, isZh, sd.levelId);
        
        const unranked = f5eNum(sd.elo) > 0 && f5eUnranked(sd.levelId, sd.season);
        const isCurrent = !!sd.season && sd.season === ov.currentSeason;
        const eloLabel = isCurrent ? (isZh ? '当前ELO' : 'Current ELO') : (isZh ? '赛季ELO' : 'Season ELO');

        const maxElo = Math.max(f5eNum(ov.maxElo) || 0, f5eNum(ov.elo) || 0);
        const peak = f5eGetPeak(ov);
        const maxSeason = peak.season;
        const peakElo = peak.elo || maxElo;
        const maxTier = peakElo > 0 ? f5eTierFull(peakElo, peak.starNum, maxSeason, isZh, peak.levelId) : '';
        const peakUnranked = maxTier === '' && f5eNum(peakElo) > 0 && f5eUnranked(peak.levelId, maxSeason);
        const maxSeasonSuffix = maxSeason ? ` (${esc(f5eSeasonLabel(maxSeason))})` : '';
        const maxEloText = peakElo > 0 ? `${peakElo}${maxTier ? '（' + maxTier + '）' : (peakUnranked ? (isZh ? '（未定级）' : ' (unranked)') : '')}${maxSeasonSuffix}` : '-';

        const matches = Array.isArray(sd.recentMatches) ? sd.recentMatches : [];

        const mhRows = matches.slice(0, 25);
        const matchRows = mhRows.map(( m) => f5eMatchRowHtml(m, isZh, sd.season)).join('');   

        const initialDef = F5E_MT_DEFAULT.map(String);
        const hasDefMode = mhRows.some(( m) => f5eIsDefaultMode(m.matchType));
        const initialSel = Array.isArray(detailEl && detailEl._f5eMhFilter) && detailEl._f5eMhFilter.length
            ? detailEl._f5eMhFilter
            : (hasDefMode ? initialDef : []);
        const mhSumHtml = f5eMhSummary(mhRows, isZh, initialSel);

        const rankRow = (() => {
            const rk = f5eNum(sd.rank) || 0;
            if (rk <= 0) return [isZh ? '当前赛季排名' : 'Season Rank', '-'];
            const stars = f5eSStarSuffix(sd.elo, sd.starNum, sd.season, sd.levelId).replace(/^·/, '');   
            const rkTxt = '#' + rk.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return [isZh ? '当前赛季排名' : 'Season Rank', rkTxt + (stars ? '（' + stars + '）' : '')];
        })();

        const recentPool = (matches || []).slice();
        const recent5Seen = new Set(recentPool.map(( m) => String(m.matchId || '')));
        const computeRecent5 = () => recentPool
            .filter(( m) => f5eNum(m.matchType) === 9 && f5eNum(m.afterElo) > 0)
            .slice(0, 5)
            .map(( m) => {
                const stars = f5eRowStars(f5eNum(m.afterElo), m.starNum, sd.season);
                return stars > 0 ? '★' + stars : String(Math.round(f5eNum(m.afterElo)));
            });
        const recent5 = computeRecent5();
        const sWinPre = ((ov && ov.seasonList) || []).find(( x) => x.season === sd.season) || null;
        
        const rawCountNum = f5eNum(sd.recentMatchesRaw);
        const morePagesMaybe = rawCountNum >= 25;

        const ladderWant = Math.min(f5eNum(sd.matches), 25);   

        const ladderSeen1 = matches.reduce(( a,  m) => a + (f5eIsDefaultMode(m.matchType) ? 1 : 0), 0);
        const coreRowCnt = ladderSeen1;   
        const tableAutoWalk = morePagesMaybe && (coreRowCnt === 0 || (ladderWant > 0 && ladderSeen1 < ladderWant));
        detailEl._f5eLadderWant = ladderWant;   

        const noCoreNote = coreRowCnt === 0 && morePagesMaybe
            ? `<div class="sps-pw-na">${isZh ? '首页 25 场均非天梯/联赛，正在自动翻页…' : 'Page 1 had only non-ladder modes; auto-loading…'}</div>`
            : '';

        const mayWalk = !tableAutoWalk && recent5.length < 5 && !!(ov && ov.uuid) && !!(sWinPre && f5eNum(sWinPre.beginUnix) > 0) &&
            f5eNum(sd.matches) > 0 &&
            morePagesMaybe;   
        
        const recent5Html = (recent5.length || mayWalk || tableAutoWalk)
            ? `<div class="sps-pw-trend">${isZh ? '近5局' : 'Recent5'}: <span class="sps-f5e-recent5">${esc(recent5.join(' ← ')) || '…'}</span></div>` : '';

        const gi = ( p) => `<div class="sps-pw-gi"><span class="sps-pw-lb">${p[0]}</span><span class="sps-pw-gv">${p[1]}</span></div>`;

        const has5ess = sd.rating3 != null && f5eNum(sd.rating3) !== 0;
        const ssLabel = has5ess ? '5ESS' : (isZh ? '最高连胜' : 'Streak');

        const peerNote = f5ePeerNoteHtml(f5eNum(sd.avgRating3), isZh);
        const segHost = peerNote || '<i class="sps-f5e-ss-seg" data-f5e-seg-host="1"></i>';
        const ssValue = has5ess
            ? `${f5eNum(sd.rating3).toFixed(2)}${segHost}`
            : (f5eNum(sd.maxStreak) > 0 ? String(f5eNum(sd.maxStreak)) : '-');

        const kdOfficial = isCurrent && f5eNum(ov.seasonKd) > 0;
        const kdVal = kdOfficial ? f5eNum(ov.seasonKd) : f5eNum(sd.kd);
        const kdCnt = kdOfficial ? (f5eNum(ov.seasonMatches) || f5eNum(sd.matches)) : f5eNum(sd.kdCnt);
        const kdCell = kdVal > 0 ? kdVal.toFixed(2) + f5eKdNoteHtml(kdCnt, isZh) : '-';
        detailEl.innerHTML = `<div class="sps-pw-sec">${isZh ? '用户信息' : 'Info'}</div>
            <div class="sps-pw-grid sps-pw-grid-3col sps-card-section">${[
                [isZh ? '玩家' : 'Player', esc(ov.username || '')],
                [isZh ? '赛季' : 'Season', sd.season ? esc(f5eSeasonLabel(sd.season)) : '-'],
                [isZh ? '场次/胜率' : 'Matches/W%', `${sd.matches}${isZh ? '场' : 'g'} / ${total.toFixed(1)}%`],
                [eloLabel, sd.elo > 0 ? `<span class="sps-rank-pill">${Number(sd.elo).toFixed(0)}${tier ? '（' + tier + '）' : (unranked ? (isZh ? '（未定级）' : ' (unranked)') : '')}</span>` : '-'],
                [isZh ? '历史最高' : 'All-Time High', maxEloText ? `<span class="sps-gold-pill">${maxEloText}</span>` : '-'],
                rankRow
            ].map(gi).join('')}</div>
            ${recent5Html}
            <div class="sps-pw-sec">${isZh ? '数据表现' : 'Stats'}</div>
            <div class="sps-pw-grid sps-pw-grid-3col sps-card-section">${[
                ['Rating', sd.rating > 0 ? `<span class="${sd.rating >= 1.2 ? 'sps-val-hi' : (sd.rating >= 1.0 ? 'sps-val-mid' : '')}">${sd.rating.toFixed(2)}</span>` : '-'],
                ['ADR', sd.adr > 0 ? `<span class="${sd.adr >= 85 ? 'sps-val-hi' : (sd.adr >= 75 ? 'sps-val-mid' : '')}">${sd.adr.toFixed(1)}</span>` : '-'],
                
                [isZh ? 'K/D' : 'K/D', `<span data-f5e-kd="1">${kdCell}</span>`],
                ['RWS', sd.rws > 0 ? sd.rws.toFixed(1) : '-'],
                [isZh ? '爆头率' : 'HS%', sd.hs > 0 ? sd.hs.toFixed(1) + '%' : '-'],
                [ssLabel, ssValue]
            ].map(gi).join('')}</div>
            ${`<div class="sps-f5e-adv-host">${renderF5eAdvancedSection(ov, sd.season, isZh, (ov.__advData = ov.__advData || new Map()))}</div>`}
            ${(matches.length || morePagesMaybe) ? `<div class="sps-pw-mh-wrap"${tableAutoWalk ? ' data-f5e-auto="1"' : ''}>
                <div class="sps-pw-sec sps-pw-mh-toggle">${isZh ? esc(f5eSeasonLabel(sd.season)) + ' 比赛记录' : 'Match Records (' + esc(f5eSeasonLabel(sd.season)) + ')'}<i class="sps-pw-mh-sum">${esc(mhSumHtml)}</i><i class="sps-pw-mh-arrow">▾</i></div>
                <div class="sps-pw-mh-body" style="display:none;">
                    <div class="sps-pw-mh-head head5"><i></i><span>${isZh ? '日期' : 'Date'}</span><span>${isZh ? '地图' : 'Map'}</span><span>K/A/D</span><span>Rat</span><span>5ESS</span><span>ADR</span><span>HS%</span><span>${isZh ? '比分' : 'Score'}</span><span>ELO</span></div>
                    <div class="sps-pw-mh-rows">${noCoreNote}${matchRows || '<div class="sps-pw-na">—</div>'}</div>
                    ${matches.length >= 25 || (sd.recentMatchesRaw || 0) >= 25 ? `<div class="sps-pw-mh-more" role="button" tabindex="0" data-f5e-more="1">▾ ${isZh ? '加载更多（每次 25 场）' : 'Load more (25)'}</div>` : ''}
            </div>` : ''}
            <div class="sps-pw-sec">${isZh ? '常玩地图' : 'Top Maps (top 5)'}</div>
            <div class="sps-pw-maps sps-card-section">${(sd.maps || []).slice(0, 5).map(( mp,  i) =>
                `<div class="sps-pw-map"><span class="sps-pw-map-num">${i + 1}.</span> ${esc(mp.map) || '?'} — ${mp.cnt}${isZh ? '场' : 'g'} ${mp.winRate.toFixed(1)}% ADR:${mp.adr.toFixed(1)} Rat:${mp.rating.toFixed(2)}
                <div class="sps-bar-wrap"><div class="sps-bar-fill" style="width:${Math.min(100, Math.max(0, mp.winRate))}%;"></div></div></div>`).join('') || '<div class="sps-pw-na">—</div>'}</div>
            <div class="sps-pw-sec">${isZh ? '常用武器' : 'Top Weapons (top 5)'}</div>
            <div class="sps-pw-weps sps-card-section">${(sd.weapons || []).slice(0, 5).map(( w,  i) =>
                `<div class="sps-pw-wep"><div class="sps-pw-wep-name">${i + 1}. ${esc(w.weapon) || '?'}</div>
                <div class="sps-pw-wep-stats">击杀:${w.kills || 0} 爆头:${w.hs.toFixed(1)}%</div>
                <div class="sps-bar-wrap"><div class="sps-bar-fill" style="width:${Math.min(100, Math.max(0, w.hs))}%;"></div></div></div>`).join('') || '<div class="sps-pw-na">—</div>'}</div>`;

        detailEl._f5eRecent5Sink = ( rows) => {
            const el = detailEl.querySelector('.sps-f5e-recent5');
            if (!el) return;
            rows.forEach(( m) => {
                const k = String(m.matchId || '');
                if (k && !recent5Seen.has(k)) { recent5Seen.add(k); recentPool.push(m); }
            });
            const cur = computeRecent5();
            if (cur.length) el.textContent = cur.join(' ← ');
        };
        bindF5eDetail(detailEl, ov, String(sd.season || ''), isZh);
        
        renderF5eChips(detailEl, isZh);
        if (mayWalk) {
            
            const walkEl = detailEl.querySelector('.sps-f5e-recent5');
            let wp = 1;
            const walk = () => {
                if (!walkEl || !walkEl.isConnected || wp > 6) return;
                const page = ++wp;
                const sWin = ((ov && ov.seasonList) || []).find(( x) => x.season === sd.season) || null;
                safeSendMessage({ type: 'FETCH_F5E_MORE', uuid: (ov && ov.uuid) || undefined, season: String(sd.season || ''),
                    beginUnix: sWin ? sWin.beginUnix : undefined, endUnix: sWin ? sWin.endUnix : undefined, page }, ( resp) => {
                    if (!walkEl.isConnected) return;
                    const rows = resp && resp.success && Array.isArray(resp.data && resp.data.rows) ? resp.data.rows : [];
                    const rawCount = Number((resp && resp.data && resp.data.rawCount) != null ? resp.data.rawCount : rows.length);
                    rows.forEach(( m) => {
                        const k = String(m.matchId || '');
                        if (k && !recent5Seen.has(k)) { recent5Seen.add(k); recentPool.push(m); }
                    });
                    const cur = computeRecent5();
                    if (cur.length) walkEl.textContent = cur.join(' ← ');
                    if (cur.length >= 5 || rawCount < 25 || !rows.length) return;   
                    walk();
                });
            };
            walk();
        }

        const seg = { sum: 0, n: 0, matches: 0 };   
        const segSeen = new Set();                  
        const writeBack = ( hs) => {
            detailEl.querySelectorAll('[data-f5e-hs]').forEach(( el) => {
                const hit = hs[el.getAttribute('data-f5e-hs') || ''];

                if (hit && typeof hit.hs === 'number') el.textContent = Math.round(hit.hs * 100) + '%';
            });

            detailEl.querySelectorAll('[data-f5e-kad]').forEach(( el) => {
                const hit = hs[el.getAttribute('data-f5e-kad') || ''];
                if (hit && typeof hit.assist === 'number') {
                    const cur = el.textContent.split('/');
                    if (cur.length === 2) el.textContent = cur[0] + '/' + hit.assist + '/' + cur[1];
                }
            });

            detailEl.querySelectorAll('[data-f5e-ss]').forEach(( el) => {
                const hit = hs[el.getAttribute('data-f5e-ss') || ''];
                if (hit && hit.ss != null && f5eNum(hit.ss) !== 0) {
                    el.textContent = f5eNum(hit.ss).toFixed(2);
                    
                    el.className = 'sps-pw-mh-val ss' + (f5eNum(hit.ss) > 0 ? ' hi' : ' down');
                }
            });

            detailEl.querySelectorAll('[data-f5e-seg]').forEach(( el) => {
                const id = el.getAttribute('data-f5e-seg') || '';
                if (!id || segSeen.has(id)) return;              
                const hit = hs[id];
                if (!hit || !hit.seg || !(f5eNum(hit.seg.n) > 0)) return;   
                segSeen.add(id);
                seg.sum += f5eNum(hit.seg.sum);
                seg.n += f5eNum(hit.seg.n);
                seg.matches++;
            });
            const segHost = detailEl.querySelector('[data-f5e-seg-host]');
            
            if (segHost && segHost.getAttribute('data-f5e-seg-official') !== '1' && seg.n >= F5E_SEG_MIN_N) {
                const segAvg = seg.sum / seg.n;

                segHost.textContent = `${isZh ? '同段' : 'Seg'} ${segAvg.toFixed(2)}`;
            }
        };

        const collectPending = () => {
            const ids = new Set();
            detailEl.querySelectorAll('[data-f5e-hs]').forEach(( el) => {
                if (el.textContent === '—') ids.add(el.getAttribute('data-f5e-hs') || '');
            });
            detailEl.querySelectorAll('[data-f5e-kad]').forEach(( el) => {
                if (el.textContent.split('/').length === 2) ids.add(el.getAttribute('data-f5e-kad') || '');
            });
            detailEl.querySelectorAll('[data-f5e-ss]').forEach(( el) => {
                if (el.textContent.trim() === '-') ids.add(el.getAttribute('data-f5e-ss') || '');
            });
            ids.delete('');
            return Array.from(ids);
        };

        const runBackfill = (ids, allowRetry) => {
            
            const token = (detailEl._f5eBackfillToken = (Number(detailEl._f5eBackfillToken) || 0) + 1);
            const list = ids.slice();
            const again = [];
            let i = 0;
            const step = () => {
                if (!detailEl.isConnected || Number(detailEl._f5eBackfillToken) !== token) return;
                if (i >= list.length) {
                    if (allowRetry && again.length) runBackfill(again, false);
                    return;
                }
                const chunk = list.slice(i, i + 8);
                i += 8;
                safeSendMessage({ type: 'FETCH_F5E_HS', uuid: (ov && ov.uuid) || '', matchIds: chunk }, ( resp) => {
                    if (!detailEl.isConnected || Number(detailEl._f5eBackfillToken) !== token) return;
                    const got = (resp && resp.success && resp.data && resp.data.hs) || {};
                    writeBack(got);
                    if (allowRetry) chunk.forEach(( id) => { if (!got[id]) again.push(id); });
                    step();
                });
            };
            step();
        };
        
        const hsTrigger = () => {
            const ids = collectPending();
            if (ids.length) runBackfill(ids, true);
        };
        detailEl._f5eBackfill = hsTrigger;   
        hsTrigger();   

        const kdHost = detailEl.querySelector('[data-f5e-kd]');
        const kdCap = F5E_KD_WALK_MAX * 25;
        const kdWant = Math.min(f5eNum(sd.matches), kdCap);
        if (kdHost && !isCurrent && kdWant > 0 && f5eNum(sd.kdCnt) < kdWant &&
            detailEl._f5eKdWalkSeason !== String(sd.season) && !!(sWinPre && f5eNum(sWinPre.beginUnix) > 0)) {
            detailEl._f5eKdWalkSeason = String(sd.season);   

            const prevKdHtml = kdHost.innerHTML;
            kdHost.innerHTML = f5eKdProgressHtml(f5eNum(sd.kdCnt), kdWant, isZh);
            safeSendMessage({ type: 'FETCH_F5E_KD', uuid: (ov && ov.uuid) || '', season: String(sd.season || ''),
                beginUnix: sWinPre.beginUnix, endUnix: sWinPre.endUnix, seasonMatches: f5eNum(sd.matches) },
                ( resp) => {
                    
                    if (!detailEl.isConnected || !kdHost.isConnected) return;
                    if (detailEl._f5eKdWalkSeason !== String(sd.season)) return;
                    if (!resp || !resp.success || !resp.data || !(f5eNum(resp.data.cnt) > 0)) { kdHost.innerHTML = prevKdHtml; return; }
                    if (f5eNum(resp.data.cnt) <= f5eNum(sd.kdCnt) || !(f5eNum(resp.data.kd) > 0)) { kdHost.innerHTML = prevKdHtml; return; }
                    kdHost.innerHTML = f5eNum(resp.data.kd).toFixed(2) + f5eKdNoteHtml(f5eNum(resp.data.cnt), isZh);
                });
        }
    }

    function f5eModeName(k, isZh) {
        const zh = { '9': '天梯', '1': '对战匹配', '0': '新手', '4': '5EPL', '6': '5EPL-C', '8': '5EPL-D', '11': '5EPL-A', '163': '全民联赛', '3': '锦标赛', '5': '十人约战', '2': '战队匹配', '174': '团队匹配', '37': '自定义房间' };
        const en = { '9': 'Ladder', '1': 'MM', '0': 'NEW', '4': '5EPL', '6': '5EPL-C', '8': '5EPL-D', '11': '5EPL-A', '163': 'League', '3': 'Tournament', '5': '10-man', '2': 'Clan', '174': 'Team', '37': 'Custom' };
        return isZh ? (zh[k] || k) : (en[k] || k);
    }

    function renderF5eChips(detailEl, isZh) {
        if (!detailEl) return;
        const wrap = detailEl.querySelector('.sps-pw-mh-wrap');
        if (!wrap) return;
        const rowsEl = wrap.querySelector('.sps-pw-mh-rows');
        const rows = rowsEl ? Array.from(rowsEl.querySelectorAll('.sps-pw-mh-row.det5')) : [];
        const counts = {};
        let typed = 0;   
        rows.forEach(( el) => {
            const k = el.getAttribute('data-f5e-mt') || '';
            if (!k || k === '-1') return;
            counts[k] = (counts[k] || 0) + 1;
            typed++;
        });
        const keys = Object.keys(counts);
        const old = wrap.querySelector('.sps-pw-mh-filters');
        if (!keys.length) {   
            if (old) old.remove();
            detailEl._f5eMhFilter = [];
            applyF5eMhFilter(detailEl, []);
            return;
        }
        
        const def = keys.filter(( k) => F5E_MT_DEFAULT.indexOf(f5eNum(k)) >= 0);
        const items = keys.map(( k) => ({ key: k, label: f5eModeName(k, isZh), count: counts[k] }))
            .sort(( a,  b) => f5eNum(a.key) - f5eNum(b.key));
        const opt = () => ({ isZh, items, def, sel: detailEl._f5eMhFilter, total: typed });

        detailEl._f5eMhFilter = spsModeFilterFollow(detailEl._f5eMhFilter, keys, def, detailEl._f5eMhFilterUser === true);
        spsCloseModeFilterPop();   
        const html = spsModeFilterBarHtml({ isZh, items, sel: detailEl._f5eMhFilter, def, total: typed,
            defLabel: isZh ? '默认（天梯+联赛）' : 'Default (Ladder+League)' });
        if (old) old.outerHTML = html;
        else {
            const bodyEl = wrap.querySelector('.sps-pw-mh-body');
            if (bodyEl) bodyEl.insertAdjacentHTML('afterbegin', html);
        }
        const fresh = wrap.querySelector('.sps-pw-mh-filters');
        if (fresh) {
            spsBindModeFilter(fresh, opt, (sel) => {
                detailEl._f5eMhFilterUser = true;   
                detailEl._f5eMhFilter = sel;
                spsModeFilterSync(fresh, { isZh, items, def, sel });
                applyF5eMhFilter(detailEl, sel, isZh);
            });
        }
        if (fresh) spsModeFilterSync(fresh, opt());
        applyF5eMhFilter(detailEl, detailEl._f5eMhFilter, isZh);
    }

    function applyF5eMhFilter(detailEl, sel, isZh) {
        if (!detailEl) return;
        const wrap = typeof detailEl.querySelector === 'function' ? detailEl.querySelector('.sps-pw-mh-wrap') : null;
        if (!wrap) return;
        const keys = (Array.isArray(sel) ? sel : []).map(String);
        const rows = typeof wrap.querySelectorAll === 'function' ? wrap.querySelectorAll('.sps-pw-mh-row.det5') : [];
        rows.forEach(( el) => {
            const mt = el.getAttribute('data-f5e-mt') || '';
            el.style.display = (!mt || mt === '-1' || keys.indexOf(mt) >= 0) ? '' : 'none';
        });

        const sumEl = typeof wrap.querySelector === 'function' ? wrap.querySelector('.sps-pw-mh-sum') : null;
        if (sumEl) {
            const visible = Array.from(rows).filter(( el) => el.style.display !== 'none');
            if (!visible.length) {
                sumEl.textContent = '';
            } else {
                const firstDtEl = visible[0].querySelector('.sps-pw-mh-date');
                let firstDt = '';
                if (firstDtEl) {
                    const timeEl = typeof firstDtEl.querySelector === 'function' ? firstDtEl.querySelector('.sps-pw-mh-time') : null;
                    if (timeEl) {
                        const timeTxt = String(timeEl.textContent || '').trim();
                        const dtxtEl = typeof firstDtEl.querySelector === 'function' ? firstDtEl.querySelector('.sps-pw-mh-dtxt') : null;
                        const dateTxt = dtxtEl
                            ? String(dtxtEl.textContent || '').trim()
                            : (firstDtEl.childNodes && firstDtEl.childNodes[0] ? String(firstDtEl.childNodes[0].textContent || '').trim() : '');
                        firstDt = (dateTxt && timeTxt) ? `${dateTxt} ${timeTxt}` : (dateTxt || timeTxt || String(firstDtEl.textContent || '').trim());
                    } else {
                        firstDt = String(firstDtEl.textContent || '').trim();
                    }
                    firstDt = firstDt.replace(/^(\d{1,4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2})(\d{1,2}:\d{2}(?::\d{2})?)$/, '$1 $2').replace(/\s+/g, ' ');
                }
                const w = visible.filter(( el) => el.classList.contains('win')).length;
                const l = visible.filter(( el) => el.classList.contains('lose')).length;
                const zh = typeof isZh === 'boolean' ? isZh : (sumEl.textContent.indexOf('胜') >= 0 || !sumEl.textContent.includes('W-'));
                sumEl.textContent = (firstDt ? (zh ? '首场 ' + firstDt : 'since ' + firstDt) : '') +
                    (zh ? ` · ${w}胜${l}负` : ` · ${w}W-${l}L`);
            }
        }
    }

    function bindF5eDetail(detailEl, ov, season, isZh) {
        if (!detailEl) return;

        detailEl._f5eRosterCtx = { ov: ov, season: String(season || ''), isZh: isZh };
        if (!detailEl._f5eRosterBound) {
            detailEl._f5eRosterBound = true;
            const pick = ( ev) => (ev.target && ev.target.closest) ? ev.target.closest('[data-f5e-roster]') : null;
            detailEl.addEventListener('click', ( e) => {
                const cell = pick(e);
                if (!cell) return;
                e.preventDefault(); e.stopPropagation();
                openF5eRoster(String(cell.getAttribute('data-f5e-roster') || ''), detailEl._f5eRosterCtx || {});
            });
            detailEl.addEventListener('keydown', ( e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const cell = pick(e);
                if (!cell) return;
                e.preventDefault();
                openF5eRoster(String(cell.getAttribute('data-f5e-roster') || ''), detailEl._f5eRosterCtx || {});
            });
        }

        const autoWrap = detailEl.querySelector('.sps-pw-mh-wrap');
        const auto = !!autoWrap && autoWrap.getAttribute('data-f5e-auto') === '1';
        const ladderWant = f5eNum(detailEl._f5eLadderWant);

        const moreBtn = detailEl.querySelector('[data-f5e-more]');
        if (moreBtn && !moreBtn._f5eBound) {
            moreBtn._f5eBound = true;
            moreBtn.addEventListener('click', () => {
                if (moreBtn.dataset.f5eDone === '1') return;
                const rowsEl = detailEl.querySelector('.sps-pw-mh-rows');
                if (!rowsEl) return;
                const page = (parseInt(String(moreBtn.dataset.f5ePage || '1'), 10) || 1) + 1;
                moreBtn.textContent = isZh ? '📡 读取中...' : '📡 Loading...';
                const sWin = (ov && ov.seasonList || []).find(( x) => x.season === season) || null;
                safeSendMessage({ type: 'FETCH_F5E_MORE', uuid: (ov && ov.uuid) || undefined, season,
                    beginUnix: sWin ? sWin.beginUnix : undefined, endUnix: sWin ? sWin.endUnix : undefined, page }, ( resp) => {

                    if (!detailEl.isConnected || !moreBtn.isConnected || moreBtn.dataset.f5eDone === '1') return;   
                    if (!resp || !resp.success || !Array.isArray(resp.data && resp.data.rows)) {
                        moreBtn.textContent = isZh ? '⚠️ 加载失败，点击重试' : '⚠️ Failed, click to retry';
                        return;   
                    }
                    const rows = resp.data.rows;
                    const rawCount = Number(resp.data.rawCount != null ? resp.data.rawCount : rows.length);
                    if (rows.length) {
                        const frag = document.createElement('template');
                        frag.innerHTML = rows.map(( m) => f5eMatchRowHtml(m, isZh, season)).join('');
                        while (frag.content.firstChild) rowsEl.appendChild(frag.content.firstChild);

                        const naEl = rowsEl.querySelector(':scope > .sps-pw-na');   
                        if (naEl && rows.some(( m) => f5eIsDefaultMode(m.matchType))) naEl.remove();
                        
                        if (typeof detailEl._f5eRecent5Sink === 'function') detailEl._f5eRecent5Sink(rows);

                        renderF5eChips(detailEl, isZh);
                        if (typeof detailEl._f5eBackfill === 'function') detailEl._f5eBackfill();
                    }

                    if (rawCount < 25) {
                        moreBtn.dataset.f5eDone = '1';
                        moreBtn.textContent = isZh ? '没有更多了' : 'No more matches';
                    } else {
                        moreBtn.dataset.f5ePage = String(page);
                        moreBtn.textContent = isZh ? '▾ 加载更多（每次 25 场）' : '▾ Load more (25)';

                        const ladderShown = Array.from(rowsEl.querySelectorAll('.sps-pw-mh-row.det5'))
                            .filter(( el) => f5eIsDefaultMode(el.getAttribute('data-f5e-mt') || '')).length;
                        const needLadder = auto && ladderWant > 0 && ladderShown < ladderWant;
                        if (moreBtn.isConnected && page < F5E_AUTO_WALK_MAX && (needLadder || rows.length === 0)) moreBtn.click();
                    }
                });
            });
        }
        
        if (auto && moreBtn && !moreBtn.dataset.f5eDone) moreBtn.click();
    }

    const F5E_STAT_CATS = ['out', 'multi', 'entry', 'clutch', 'util', 'kill', 'honors', 'other'];

    let _f5eRosterActiveClose = null;

    function f5eRosterAvatar(raw) {
        const s = String(raw || '');
        if (!s) return '';
        return /^https?:/i.test(s) ? safeUrl(s) : esc('https://oss-arena.5eplay.com/' + s.replace(/^\/+/, ''));
    }

    function f5eRosterTier(p, season, isZh) {
        const elo = f5eNum(p && p.elo);
        if (!(elo > 0)) return '';
        return f5eTierFull(elo, p.starNum, season, isZh, p.levelId);
    }

    function f5eRosterNameHtml(p, isZh) {
        const name = String(p.nickname || p.username || p.domain || (p.steamId ? String(p.steamId).slice(-6) : ''));
        const label = esc(name || (isZh ? '匿名' : 'anon'));
        const sid = String(p.steamId || '');
        if (/^7656\d{13}$/.test(sid)) {
            const url = 'https://steamcommunity.com/profiles/' + sid;
            return `<a class="sps-f5e-rt-nm sps-f5e-rt-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${isZh ? '打开 Steam 资料页 ' + sid : 'Open Steam profile ' + sid}">${label}</a>`;
        }
        const dm = String(p.domain || '');
        if (dm) {
            const url = 'https://www.5eplay.com/profile/' + encodeURIComponent(dm);
            return `<a class="sps-f5e-rt-nm sps-f5e-rt-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${isZh ? '打开 5E 资料页 ' + dm : 'Open 5E profile ' + dm}">${label}</a>`;
        }
        return `<span class="sps-f5e-rt-nm">${label}</span>`;
    }

    function mdVal(v, d) {
        const n = f5eNum(v);
        if (!(n > 0)) return '—';
        return d ? n.toFixed(d) : String(Math.round(n));
    }
    
    function mdPct(v) {
        const n = f5eNum(v);
        return n > 0 ? Math.round(n * 100) + '%' : '—';
    }

    function f5eRatOf(p) {
        const r2 = f5eNum(p && p.rating2);
        return r2 > 0 ? r2 : f5eNum(p && p.rating);
    }

    function mdChip(label, value, o) {
        const opt = o || {};
        const z = (value === '—' || value === '0');
        const tip = opt.raw ? ` title="${esc((opt.isZh ? '官方字段：' : 'official field: ') + opt.raw)}"` : '';
        return `<span class="sps-md-chip${z ? ' z' : ''}${opt.hot ? ' hot' : ''}"${tip}><i>${esc(label)}</i><b>${esc(value)}</b></span>`;
    }

    function mdSection(label, chips) {
        const body = (chips || []).filter(Boolean).join('');
        return body ? `<div class="sps-md-sec"><div class="sps-md-sec-h">${esc(label)}</div><div class="sps-md-sec-b">${body}</div></div>` : '';
    }

    function f5ePlayerSections(p, isZh, roundTotal) {
        const C = mdChip;
        
        const catIdx = (c) => { const i = F5E_STAT_CATS.indexOf(c); return i < 0 ? F5E_STAT_CATS.length : i; };
        const rt = f5eNum(p.roundTotal) > 0 ? f5eNum(p.roundTotal) : f5eNum(roundTotal);
        const secs = [];
        
        secs.push({ cat: 'out', label: isZh ? '输出与生存' : 'Damage & survival', chips: [
            C(isZh ? '击杀' : 'Kills', mdVal(p.kills), { isZh }),
            C(isZh ? '死亡' : 'Deaths', mdVal(p.deaths), { isZh }),
            C(isZh ? '助攻' : 'Assists', mdVal(p.assists), { isZh }),
            C('K/D', f5eNum(p.deaths) > 0 ? (f5eNum(p.kills) / f5eNum(p.deaths)).toFixed(2) : mdVal(p.kills), { isZh }),
            C('ADR', mdVal(p.adr, 1), { isZh, hot: f5eNum(p.adr) >= 90 }),
            C('KAST', mdPct(p.kast), { isZh }),
            C('RWS', mdVal(p.rws, 1), { isZh, hot: f5eNum(p.rws) >= 10 }),
            C('5ESS', p.ss != null && f5eNum(p.ss) !== 0 ? f5eNum(p.ss).toFixed(2) : '—', { isZh, hot: f5eNum(p.ss) > 0 }),
            C(isZh ? '爆头率' : 'HS%', mdPct(p.hs), { isZh }),
            C('Rating', mdVal(f5eRatOf(p), 2), { isZh, raw: 'rating2（5E 官网显示口径）/ rating' })
        ] });
        
        secs.push({ cat: 'multi', label: isZh ? '多杀（单回合 N 杀的回合数）' : 'Multi-kill rounds', chips: [
            C(isZh ? '1 杀回合' : '1K', mdVal(p.k1), { isZh, raw: 'kill_1' }),
            C(isZh ? '2 杀回合' : '2K', mdVal(p.k2), { isZh, raw: 'kill_2' }),
            C(isZh ? '3 杀回合' : '3K', mdVal(p.k3), { isZh, raw: 'kill_3' }),
            C(isZh ? '4 杀回合' : '4K', mdVal(p.k4), { isZh, raw: 'kill_4' }),
            C(isZh ? '5 杀回合' : '5K', mdVal(p.k5), { isZh, raw: 'kill_5' }),
            C(isZh ? '3K 以上合计' : '3K+ total', mdVal(f5eNum(p.k3) + f5eNum(p.k4) + f5eNum(p.k5)), { isZh, hot: f5eNum(p.k4) + f5eNum(p.k5) > 0 }),
            C(isZh ? '1 助攻回合' : '1A', mdVal(p.a1), { isZh, raw: 'many_assists_cnt1' }),
            C(isZh ? '2 助攻回合' : '2A', mdVal(p.a2), { isZh, raw: 'many_assists_cnt2' }),
            C(isZh ? '3 助攻回合' : '3A', mdVal(p.a3), { isZh, raw: 'many_assists_cnt3' }),
            C(isZh ? '4 助攻回合' : '4A', mdVal(p.a4), { isZh, raw: 'many_assists_cnt4' }),
            C(isZh ? '5 助攻回合' : '5A', mdVal(p.a5), { isZh, raw: 'many_assists_cnt5' })
        ] });
        
        const fd = f5eNum(p.firstKill) - f5eNum(p.firstDeath);
        secs.push({ cat: 'entry', label: isZh ? '首杀与突破' : 'Entry / opening', chips: [
            C(isZh ? '首杀' : 'First kills', mdVal(p.firstKill), { isZh, raw: 'first_kill', hot: f5eNum(p.firstKill) > 0 }),
            C(isZh ? '首死' : 'First deaths', mdVal(p.firstDeath), { isZh, raw: 'first_death' }),
            C(isZh ? '首杀率' : 'Entry rate', rt > 0 ? Math.round(f5eNum(p.firstKill) / rt * 100) + '%' : '—', { isZh }),
            C(isZh ? '首杀净胜' : 'Entry diff', (f5eNum(p.firstKill) || f5eNum(p.firstDeath)) ? (fd > 0 ? '+' + fd : String(fd)) : '—', { isZh, hot: fd > 0 }),
            C('AWP 击杀', mdVal(p.awpKill), { isZh, raw: 'awp_kill', hot: f5eNum(p.awpKill) > 0 }),
            C(isZh ? '破点收益' : 'Benefit kills', mdVal(p.benefitKill), { isZh, raw: 'benefit_kill' })
        ] });
        
        const clutch = f5eNum(p.end1) + f5eNum(p.end2) + f5eNum(p.end3) + f5eNum(p.end4) + f5eNum(p.end5);
        secs.push({ cat: 'clutch', label: isZh ? '残局 1vN' : 'Clutches (1vN)', chips: [
            C('1v1', mdVal(p.end1), { isZh, raw: 'end_1v1', hot: f5eNum(p.end1) > 0 }),
            C('1v2', mdVal(p.end2), { isZh, raw: 'end_1v2', hot: f5eNum(p.end2) > 0 }),
            C('1v3', mdVal(p.end3), { isZh, raw: 'end_1v3', hot: f5eNum(p.end3) > 0 }),
            C('1v4', mdVal(p.end4), { isZh, raw: 'end_1v4', hot: f5eNum(p.end4) > 0 }),
            C('1v5', mdVal(p.end5), { isZh, raw: 'end_1v5', hot: f5eNum(p.end5) > 0 }),
            C(isZh ? '残局合计' : 'Clutch total', mdVal(clutch), { isZh, hot: clutch > 0 })
        ] });
        
        secs.push({ cat: 'util', label: isZh ? '道具与投掷' : 'Utility', chips: [
            C(isZh ? '致盲敌人' : 'Enemies flashed', mdVal(p.flashEnemy), { isZh, raw: 'flash_enemy', hot: f5eNum(p.flashEnemy) > 0 }),
            C(isZh ? '致盲时长(s)' : 'Blind time (s)', mdVal(p.flashEnemyTime), { isZh, raw: 'flash_enemy_time' }),
            C(isZh ? '闪队友' : 'Teammates flashed', mdVal(p.flashTeam), { isZh, raw: 'flash_team' }),
            C(isZh ? '闪队友时长(s)' : 'Team blind (s)', mdVal(p.flashTeamTime), { isZh, raw: 'flash_team_time' }),
            C(isZh ? '总投掷时长(s)' : 'Utility time (s)', mdVal(p.flashTime), { isZh, raw: 'flash_time' }),
            C(isZh ? '下包' : 'Plants', mdVal(p.plantedBomb), { isZh, raw: 'planted_bomb', hot: f5eNum(p.plantedBomb) > 0 }),
            C(isZh ? '拆包' : 'Defuses', mdVal(p.defusedBomb), { isZh, raw: 'defused_bomb', hot: f5eNum(p.defusedBomb) > 0 }),
            C('C4 爆炸', mdVal(p.explodeBomb), { isZh, raw: 'explode_bomb' }),
            C(isZh ? '投掷伤害' : 'Utility dmg', mdVal(p.throwHarm), { isZh, raw: 'throw_harm' }),
            C(isZh ? '对敌投掷' : 'Utility dmg (enemy)', mdVal(p.throwHarmEnemy), { isZh, raw: 'throw_harm_enemy' })
        ] });
        
        secs.push({ cat: 'kill', label: isZh ? '特殊击杀（官方原始字段）' : 'Special kills', chips: [
            C('perfect_kill', mdVal(p.perfectKill), { isZh, raw: 'perfect_kill' }),
            C('assisted_kill', mdVal(p.assistedKill), { isZh, raw: 'assisted_kill' }),
            C('revenge_kill', mdVal(p.revengeKill), { isZh, raw: 'revenge_kill', hot: f5eNum(p.revengeKill) > 0 }),
            C('jump_total', mdVal(p.jumpTotal), { isZh, raw: 'jump_total' }),
            C('hold_total', mdVal(p.holdTotal), { isZh, raw: 'hold_total' }),
            C(isZh ? '误伤队友' : 'Team kills', mdVal(p.teamKill), { isZh, raw: 'team_kill' })
        ] });
        
        const most = p.most || {};
        const honors = [];
        if (p.isMvp) honors.push(C('MVP', '★', { isZh, hot: true }));
        if (p.isSvp) honors.push(C('SVP', '◆', { isZh }));
        if (p.isWin) honors.push(C(isZh ? '本场胜利' : 'Win', '✓', { isZh }));
        if (p.isTie) honors.push(C(isZh ? '平局' : 'Tie', '=', { isZh }));
        if (most.firstKill) honors.push(C(isZh ? '首杀最多' : 'Most first kills', '★', { isZh, hot: true, raw: 'is_most_first_kill' }));
        if (most.awp) honors.push(C(isZh ? '狙击最多' : 'Most AWP', '★', { isZh, hot: true, raw: 'is_most_awp' }));
        if (most.assist) honors.push(C(isZh ? '助攻最多' : 'Most assists', '★', { isZh, hot: true, raw: 'is_most_assist' }));
        if (most.headshot) honors.push(C(isZh ? '爆头最多' : 'Most HS', '★', { isZh, hot: true, raw: 'is_most_headshot' }));
        if (most.end) honors.push(C(isZh ? '残局最多' : 'Most clutches', '★', { isZh, hot: true, raw: 'is_most_end' }));
        if (most.jump) honors.push(C(isZh ? '跳杀最多' : 'Most jump kills', '★', { isZh, hot: true, raw: 'is_most_jump' }));
        if (most.oneVtwo) honors.push(C(isZh ? '1v2 最多' : 'Most 1v2', '★', { isZh, hot: true, raw: 'is_most_1v2' }));
        if (honors.length) secs.push({ cat: 'honors', label: isZh ? '本场之最 / 荣誉' : 'Honors', chips: honors });
        
        secs.sort(( a,  b) => catIdx(a.cat) - catIdx(b.cat));
        return secs;
    }

    function f5eRosterPlayerHtml(p, opts) {
        const isZh = opts.isZh;
        const me = !!opts.mySid && String(p.steamId || '') === opts.mySid;                 
        const self = !me && !!opts.ovUuid && String(p.uuid || '') === opts.ovUuid;          
        const tier = f5eRosterTier(p, opts.season, isZh);
        const hasSs = p.ss != null && f5eNum(p.ss) !== 0;
        const ss = hasSs ? f5eNum(p.ss).toFixed(2) : '—';
        const ssCls = hasSs ? (f5eNum(p.ss) > 0 ? 'hi' : 'down') : '';
        const ava = f5eRosterAvatar(p.avatar);

        const rat = mdVal(f5eRatOf(p), 2);
        
        const live = p.liveUrl ? `<a class="sps-f5e-rt-live" href="${safeUrl(p.liveUrl)}" target="_blank" rel="noopener noreferrer" title="${isZh ? '直播间' : 'Live stream'}">🔴${isZh ? '直播' : 'LIVE'}</a>` : '';
        const badges = (me ? `<b class="sps-f5e-rt-badge me" title="${isZh ? '我的账号' : 'my account'}">${isZh ? '我' : 'ME'}</b>` : '')
            + (self ? `<b class="sps-f5e-rt-badge self" title="${isZh ? '当前查看的玩家' : 'viewed player'}">${isZh ? '本页' : 'HERE'}</b>` : '')
            + (p.isMvp ? '<b class="sps-f5e-rt-badge mvp">MVP</b>' : '')
            + (p.isSvp ? `<b class="sps-f5e-rt-badge svp" title="${isZh ? '败方最佳' : 'SVP'}">SVP</b>` : '');
        const clutch = f5eNum(p.end1) + f5eNum(p.end2) + f5eNum(p.end3) + f5eNum(p.end4) + f5eNum(p.end5);
        const mk = [];
        if (f5eNum(p.k3) > 0) mk.push('3K×' + f5eNum(p.k3));
        if (f5eNum(p.k4) > 0) mk.push('4K×' + f5eNum(p.k4));
        if (f5eNum(p.k5) > 0) mk.push('5K×' + f5eNum(p.k5));
        const secs = f5ePlayerSections(p, isZh, opts.roundTotal);
        const detail = secs.map((s) => mdSection(s.label, s.chips)).join('');
        const cnt = secs.reduce((a, s) => a + s.chips.length, 0);
        return `<div class="sps-f5e-rt-player${me ? ' me' : ''}${self ? ' self' : ''}${opts.expanded ? ' open' : ''}">
            <div class="sps-md-line">
                ${ava ? `<img class="sps-f5e-rt-ava" src="${ava}" alt="" referrerpolicy="no-referrer">` : '<span class="sps-f5e-rt-ava"></span>'}
                <div class="sps-f5e-rt-main">
                    <div class="sps-f5e-rt-top">${f5eRosterNameHtml(p, isZh)}${tier ? `<i class="sps-f5e-rt-tier">${esc(tier)}</i>` : ''}${live}${badges}</div>
                    <div class="sps-f5e-rt-stats">
                        <span class="sps-pw-mh-val pw">${f5eNum(p.kills)}/${f5eNum(p.assists)}/${f5eNum(p.deaths)}</span>
                        <span class="sps-f5e-rt-diff ${f5eNum(p.kills) > f5eNum(p.deaths) ? 'sps-val-hi' : (f5eNum(p.kills) < f5eNum(p.deaths) ? 'sps-val-low' : '')}">${f5eNum(p.kills) >= f5eNum(p.deaths) ? '+' + (f5eNum(p.kills) - f5eNum(p.deaths)) : (f5eNum(p.kills) - f5eNum(p.deaths))}</span>
                        <span class="sps-f5e-rt-s">ADR ${mdVal(p.adr, 1)}</span>
                        <span class="sps-f5e-rt-s">HS% ${mdPct(p.hs)}</span>
                        <span class="sps-f5e-rt-s">5ESS <b class="${ssCls}">${ss}</b></span>
                        <span class="sps-f5e-rt-s">Rat ${rat}</span>
                        <span class="sps-f5e-rt-s">RWS ${mdVal(p.rws, 1)}</span>
                        <span class="sps-f5e-rt-s">KAST ${mdPct(p.kast)}</span>
                        <span class="sps-f5e-rt-s">${isZh ? '首杀' : 'FK'} ${mdVal(p.firstKill)}</span>
                        <span class="sps-f5e-rt-s">${isZh ? '残局' : '1vN'} ${mdVal(clutch)}</span>
                        ${mk.length ? `<span class="sps-f5e-rt-mk">${esc(mk.join(' '))}</span>` : ''}
                    </div>
                </div>
                <button type="button" class="sps-md-toggle" title="${isZh ? '展开/收起本场全部数据' : 'Toggle all stats'}">${isZh ? '详情' : 'INFO'}<b>${cnt}</b></button>
            </div>
            <div class="sps-md-detail">${detail}</div>
        </div>`;
    }

    function f5eTeamAgg(team) {
        const arr = Array.isArray(team) ? team : [];
        const sum = ( f) => arr.reduce(( a,  p) => a + f5eNum(f(p)), 0);
        const avg = ( f) => {
            const vals = arr.map(f).map(f5eNum).filter(( v) => v > 0);
            return vals.length ? vals.reduce(( a,  b) => a + b, 0) / vals.length : 0;
        };
        return {
            kills: sum((p) => p.kills), deaths: sum((p) => p.deaths), assists: sum((p) => p.assists),
            adr: avg((p) => p.adr), rating: avg((p) => f5eRatOf(p)), ss: avg((p) => p.ss), kast: avg((p) => p.kast),
            firstKill: sum((p) => p.firstKill), flash: sum((p) => p.flashEnemy),
            multi3: sum((p) => f5eNum(p.k3) + f5eNum(p.k4) + f5eNum(p.k5)),
            clutch: sum((p) => f5eNum(p.end1) + f5eNum(p.end2) + f5eNum(p.end3) + f5eNum(p.end4) + f5eNum(p.end5))
        };
    }

    function f5eVerdictEv(r) {
        const s1 = f5eNum(r && r.score1), s2 = f5eNum(r && r.score2);
        return {
            winner: f5eNum(r && r.winner),
            teamCount: (r && Array.isArray(r.teams)) ? r.teams.length : 0,
            tie: !!(s1 > 0 && s1 === s2)   
        };
    }

    function f5eRosterTeamHtml(team, idx, r, opts) {
        const isZh = opts.isZh;
        const vd = spsTeamVerdict(idx, f5eVerdictEv(r));
        const win = vd === 'win';
        const lose = vd === 'lose';
        const score = idx === 0 ? r.score1 : r.score2;
        const g = f5eTeamAgg(team);

        return `<div class="sps-f5e-rt-team${win ? ' win' : (lose ? ' lose' : '')}">
            <div class="sps-f5e-rt-teamhead"><span>${isZh ? '队伍' : 'Team'} ${idx + 1}${win ? ` · ${isZh ? '胜' : 'WIN'}` : (lose ? ` · ${isZh ? '负' : 'LOSS'}` : '')}</span><b>${f5eNum(score)}</b></div>
            <div class="sps-md-chiprow">
                ${mdChip(isZh ? '总击杀' : 'Kills', String(g.kills), { isZh })}
                ${mdChip(isZh ? '总死亡' : 'Deaths', String(g.deaths), { isZh })}
                ${mdChip(isZh ? '总助攻' : 'Assists', String(g.assists), { isZh })}
                ${mdChip(isZh ? '均 ADR' : 'Avg ADR', mdVal(g.adr, 1), { isZh })}
                ${mdChip(isZh ? '均 Rat' : 'Avg Rat', mdVal(g.rating, 2), { isZh })}
                ${mdChip(isZh ? '均 5ESS' : 'Avg 5ESS', g.ss > 0 ? g.ss.toFixed(2) : '—', { isZh })}
                ${mdChip(isZh ? '均 KAST' : 'Avg KAST', mdPct(g.kast), { isZh })}
                ${mdChip(isZh ? '首杀' : 'FK', String(g.firstKill), { isZh })}
                ${mdChip(isZh ? '3K+' : '3K+', String(g.multi3), { isZh })}
                ${mdChip(isZh ? '残局' : '1vN', String(g.clutch), { isZh })}
                ${mdChip(isZh ? '致盲' : 'Flashes', String(g.flash), { isZh })}
            </div>
            ${team.map(( p) => f5eRosterPlayerHtml(p, opts)).join('')}
        </div>`;
    }

    function f5eMatchSummaryHtml(r, isZh) {
        const ts = ( v) => { const n = f5eNum(v); return n > 0 ? new Date(n * 1000).toLocaleString() : '—'; };
        const dur = f5eNum(r.duration) > 0 ? Math.round(f5eNum(r.duration) / 60) + (isZh ? ' 分钟' : ' min') : '—';

        const resTxt = spsVerdictText(f5eVerdictEv(r), isZh);
        const chips = [
            mdChip(isZh ? '地图' : 'Map', (isZh && r.mapName) ? r.mapName : (r.map || '—'), { isZh, raw: 'map' }),
            mdChip(isZh ? '比分' : 'Score', f5eNum(r.score1) + ':' + f5eNum(r.score2), { isZh }),
            mdChip(isZh ? '结果' : 'Result', resTxt, { isZh, raw: 'match_winner' }),
            mdChip(isZh ? '模式' : 'Mode', f5eModeName(String(r.matchMode), isZh), { isZh, raw: 'match_mode' }),
            mdChip(isZh ? '赛季' : 'Season', f5eSeasonLabel(r.season), { isZh }),
            mdChip(isZh ? '总回合' : 'Rounds', mdVal(r.roundTotal), { isZh, raw: 'round_total' }),
            mdChip(isZh ? '时长' : 'Duration', dur, { isZh }),
            mdChip(isZh ? '开始' : 'Start', ts(r.startTime), { isZh, raw: 'start_time' }),
            mdChip(isZh ? '结束' : 'End', ts(r.endTime), { isZh, raw: 'end_time' }),
            mdChip(isZh ? '比赛 ID' : 'Match ID', String(r.matchId || '—'), { isZh, raw: 'match_code' }),
            mdChip(isZh ? '房间' : 'Server', String(r.gameName || '—'), { isZh, raw: 'game_name' })
        ];
        
        const all = [].concat.apply([], (Array.isArray(r.teams) ? r.teams : [])).filter(Boolean);
        const nameOf = ( flag,  uidKey) => {
            const uid = f5eNum(r.mostUid && r.mostUid[uidKey]);
            const hit = all.find(( x) => (x.most && x.most[flag]) || (uid > 0 && f5eNum(x.uid) === uid));
            if (!hit) return '';
            return String(hit.nickname || hit.username || (hit.steamId ? String(hit.steamId).slice(-6) : ''));
        };
        const most = [];
        const addMost = ( label,  flag,  uidKey) => {
            const n = nameOf(flag, uidKey);
            if (n) most.push(mdChip(label, n, { isZh, hot: true }));
        };
        addMost(isZh ? '首杀最多' : 'Most FK', 'firstKill', 'firstKill');
        addMost(isZh ? '狙击最多' : 'Most AWP', 'awp', 'awp');
        addMost(isZh ? '助攻最多' : 'Most A', 'assist', 'assist');
        addMost(isZh ? '爆头最多' : 'Most HS', 'headshot', 'headshot');
        addMost(isZh ? '残局最多' : 'Most 1vN', 'end', 'end');
        addMost(isZh ? '跳杀最多' : 'Most jump', 'jump', 'jump');
        addMost(isZh ? '1v2 最多' : 'Most 1v2', 'oneVtwo', 'oneVtwo');

        const demo = r.demoUrl
            ? `<button type="button" class="sps-md-demo dl" data-f5e-demo="${esc(String(r.demoUrl))}" title="${isZh ? '左键：复制 demo 直链；Ctrl+左键：用浏览器打开' : 'Click: copy the demo link; Ctrl+Click: open it in the browser'}">⬇ 下载${isZh ? 'demo' : 'demo'}</button>`
            : '';
        const s1 = f5eNum(r.score1);
        const s2 = f5eNum(r.score2);
        const hasScore = (r.score1 != null && r.score2 != null) && (s1 > 0 || s2 > 0);
        const bannerMap = (isZh && r.mapName) ? r.mapName : (r.map || '—');
        const vEv = f5eVerdictEv(r);
        const opts = (arguments.length > 2 && arguments[2]) ? arguments[2] : ((r && r._opts) || {});
        let viewTeamIdx = -1;
        if (Array.isArray(r.teams)) {
            const targetUuid = String((opts && opts.ovUuid) || (r && r.ovUuid) || '');
            const targetSid = String((opts && (opts.viewSid || opts.mySid)) || (r && (r.viewSid || r.mySid)) || '');
            for (let i = 0; i < r.teams.length; i++) {
                const team = r.teams[i] || [];
                if (targetUuid && team.some(( p) => String((p && p.uuid) || '') === targetUuid)) {
                    viewTeamIdx = i;
                    break;
                }
                if (targetSid && team.some(( p) => String((p && p.steamId) || '') === targetSid)) {
                    viewTeamIdx = i;
                    break;
                }
            }
        }
        let bannerVerdictTxt = '';
        let bannerVerdictCls = '';
        if (vEv.tie) {
            bannerVerdictTxt = isZh ? '平局' : 'Tie';
            bannerVerdictCls = 'tie';
        } else if (vEv.winner > 0 && viewTeamIdx >= 0) {
            const isWin = (viewTeamIdx + 1) === vEv.winner;
            bannerVerdictTxt = isWin ? (isZh ? '胜' : 'WIN') : (isZh ? '负' : 'LOSS');
            bannerVerdictCls = isWin ? 'win' : 'lose';
        } else {
            bannerVerdictTxt = resTxt;
            bannerVerdictCls = vEv.winner > 0 ? (resTxt.indexOf(isZh ? '胜' : 'win') >= 0 ? 'win' : 'lose') : '';
        }
        const metaParts = [];
        const tStr = ts(r.startTime);
        if (tStr && tStr !== '—') metaParts.push(tStr);
        if (r.modeName) metaParts.push(r.modeName);
        if (r.matchId) metaParts.push('ID ' + r.matchId);
        const metaHtml = metaParts.map(p => `<span>${esc(p)}</span>`).join('<span class="sps-rb-dot">·</span>');
        const bannerHtml = spsRosterBannerHtml({
            isZh,
            hasScore,
            s1,
            s2,
            mapTxt: bannerMap,
            verdictTxt: bannerVerdictTxt,
            verdictCls: bannerVerdictCls,
            durTxt: dur,
            roundTotal: f5eNum(r.roundTotal),
            metaHtml
        });
        return bannerHtml + `<div class="sps-md-sum">
            <div class="sps-md-sum-h">${isZh ? '比赛概要' : 'Match'}</div>
            <div class="sps-md-chiprow">${chips.join('')}</div>
            ${most.length ? `<div class="sps-md-sum-h">${isZh ? '本场之最' : 'Match leaders'}</div><div class="sps-md-chiprow">${most.join('')}</div>` : ''}
            ${demo}
        </div>`;
    }

    function renderF5eRosterInto(bodyEl, r, ctx) {
        const isZh = ctx.isZh;
        const teams = Array.isArray(r.teams) ? r.teams : [];

        const opts = {
            isZh: isZh, season: String((r && r.season) || ctx.season || ''),
            ovUuid: ctx.ovUuid || '', mySid: ctx.mySid || '',
            roundTotal: f5eNum(r.roundTotal), expanded: ctx.expanded !== false
        };
        bodyEl.innerHTML = f5eMatchSummaryHtml(r, isZh, opts)
            + `<div class="sps-f5e-rt-teams">${teams.map(( t,  i) => f5eRosterTeamHtml(t, i, r, opts)).join('')}</div>`;
    }

    function f5eReadMySteamId() {
        return new Promise((resolve) => spsReadAccountId(['sps_my_steamid'], resolve));
    }

    async function openF5eRoster(matchId, ctx) {
        const mid = String(matchId || '');
        if (!mid) return;
        const ov = (ctx && ctx.ov) || {};
        const season = String((ctx && ctx.season) || '');
        const isZh = !(ctx && ctx.isZh === false);
        if (_f5eRosterActiveClose) _f5eRosterActiveClose();   
        const skin = spsHostPanelSkin('.sps-pw-modal.sps-f5e-modal .sps-pw-panel');
        const modal = document.createElement('div');
        modal.className = 'sps-pw-modal sps-f5e-roster sps-f5e-modal sps-pw-pip-mode';
        modal.innerHTML = `<div class="sps-pw-overlay"></div>
            <div class="sps-pw-panel${skin.cls ? ' ' + skin.cls : ''}" style="--sps-corner:${skin.corner};">
                <div class="sps-pw-header"><span class="sps-pw-header-title">${isZh ? '比赛详情' : 'Match details'}</span>
                    <span class="sps-pw-header-actions">
                        <button type="button" class="sps-md-allbtn" title="${isZh ? '展开/收起全部玩家的明细' : 'Expand/collapse all'} ">${isZh ? '展开全部' : 'Expand all'}</button>
                        <button class="sps-frame-ctrl sps-f5e-roster-close">&times;</button>
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
            if ( (e.target).closest('.sps-f5e-roster-close') ||  (e.target).closest('.sps-md-allbtn')) return;
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
            if (_f5eRosterActiveClose === close) _f5eRosterActiveClose = null;
            modal.remove();
        };
        _f5eRosterActiveClose = close;
        modal.querySelector('.sps-f5e-roster-close').addEventListener('click', close);
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
            const btn = e.target.closest ? e.target.closest('[data-f5e-demo]') : null;
            if (!btn) return;
            e.preventDefault(); e.stopPropagation();
            const url = String(btn.getAttribute('data-f5e-demo') || '').trim();
            if (!/^https?:\/\//i.test(url)) return;   
            if (e.ctrlKey || e.metaKey) {
                try {
                    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) { chrome.tabs.create({ url: url }); return; }
                } catch (e0) {  }
                try { window.open(url, '_blank', 'noopener'); } catch (e1) {  }
                return;
            }
            spsCopyText(url).then(( ok) => {
                const prev = btn.textContent;
                btn.textContent = ok ? '⬇ 已复制' : '⬇ 复制失败';
                setTimeout(() => { btn.textContent = prev; }, 1500);
            });
        });
        const allBtn =  (modal.querySelector('.sps-md-allbtn'));
        allBtn.addEventListener('click', ( e) => {
            e.preventDefault(); e.stopPropagation();
            const on = !bodyEl.classList.contains('sps-md-all');
            bodyEl.classList.toggle('sps-md-all', on);
            bodyEl.querySelectorAll('.sps-f5e-rt-player').forEach(( r) => r.classList.remove('open'));
            bodyEl.querySelectorAll('.sps-md-toggle').forEach(( b) => b.classList.remove('on'));
            allBtn.textContent = on ? (isZh ? '收起全部' : 'Collapse all') : (isZh ? '展开全部' : 'Expand all');
        });
        const mySid = await f5eReadMySteamId();
        if (!modal.isConnected) return;
        const rosterCtx = { isZh: isZh, season: season, ovUuid: String(ov.uuid || ''), mySid: mySid, roster: null, expanded: false };
        safeSendMessage({ type: 'FETCH_F5E_ROSTER', uuid: ov.uuid || undefined, matchId: mid }, ( res) => {
            if (!modal.isConnected) return;
            const data = res && res.success ? res.data : null;
            if (!data || data.error || !Array.isArray(data.teams) || !data.teams.length) {
                bodyEl.innerHTML = `<div class="sps-pw-na">${isZh ? '该场比赛详情不可得' : 'No match details for this match'}</div>`;
                return;
            }
            rosterCtx.roster = data;
            renderF5eRosterInto(bodyEl, data, rosterCtx);
        }, 20000);
    }
