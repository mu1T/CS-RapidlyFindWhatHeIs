var __S_content_native_js=(function(){var T="JPbfzLWh5cPWdWdFTFckOwwDDub81taSqrmO3414eEJYUi4rSiBxUkcwPmBIW+3r/tzcpLbyipluP3xaR2shLAQe7P76gxdeYGZ8BAYvPdbI1PP7k5eEuKdHWVVsYRRzfWkKWiA6Mh4Qr+z93cXup7SOkhfi9cTV2r/2ipZleXNBTW4+KQ0Y6+ru9i8b9Pnq1I7u4aickGNif0ZbLiUzAwP9v/3E1eq/vp6SY2cPQVM0IAgAHPu6lZyM5g==",P=[37,115,94,139,70,0],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);
    function nativeLevelBadge(level) {
        const lvl = parseInt(level) || 0;
        const valid = lvl >= 1 && lvl <= 10;
        return `<div class="sps-lvl-badge ${valid ? 'lvl-' + lvl : 'lvl-1'}" title="FACEIT Lv.${valid ? lvl : '?'}">${valid ? lvl : '?'}</div>`;
    }

    function nativeErrorHtml(msg, isZh) {
        return `<div class="sps-native-note">${esc(msg)}</div>`;
    }

    function nativeCell(label, value, extraCls) {
        return `
            <div class="sps-native-cell${extraCls ? ' ' + extraCls : ''}">
                <span class="sps-native-cell-label">${esc(label)}</span>
                <span class="sps-native-cell-val">${esc(value)}</span>
            </div>
        `;
    }

    function renderNativeFaceit(container, steamID, data, txt, settings) {
        const wrap = container.querySelector('#sps-native-faceit');
        if (!wrap) return;
        const isZh = txt.region === '地区';
        if (!data || data.error != null) {   
            const err =  (data || {});
            const errCode = err.error || 'NO_RESPONSE';
            const isHttpErr = /^HTTP /.test(errCode);
            const msg = errCode === 'NO_KEY' ? txt.connect_faceit
                : errCode === 'NOT_FOUND' ? txt.error_not_found
                : errCode === 'NO_CS2' ? txt.error_no_cs2
                : isHttpErr ? txt.error_http(errCode.slice(5))
                : txt.error_net;
            const finderLink = (errCode === 'NOT_FOUND' || errCode === 'NO_CS2')
                ? `<a class="sps-native-finder-link" data-frame-site="faceitfinder" data-steamid="${esc(steamID)}" title="FaceitFinder">${esc(txt.native_finder)} ↗</a>`
                : '';
            const hintHtml = (isHttpErr || errCode === 'NETWORK_ERROR' || errCode === 'NO_RESPONSE')
                ? `<div class="sps-native-fb-hint">${txt.error_hint_off}</div>` : '';
            wrap.innerHTML = `<div class="sps-native-fallback">${nativeErrorHtml(msg, isZh)}${hintHtml}${finderLink}</div>`;
            return;
        }
        data =  (data);
        const countryLower = (data.country || '').toLowerCase();
        const regionRaw = data.region ? data.region.toUpperCase() : '';
        let zoneDisplay = regionRaw || '-';
        if (isZh && regionRaw && FACEIT_REGION_CN[regionRaw]) zoneDisplay = FACEIT_REGION_CN[regionRaw];
        let countryDisplay = '';
        if (countryLower && isZh && COUNTRY_NAME_CN[countryLower]) countryDisplay = COUNTRY_NAME_CN[countryLower];
        else if (countryLower) {
            const specialAreas = { hk: true, tw: true, mo: true };
            countryDisplay = (specialAreas[countryLower] ? '🇨🇳' : '') + data.country.toUpperCase();
        }

        const fullRegion = faceitZoneRankText(zoneDisplay, countryDisplay, data.region_rank, data.country_rank, isZh);

        let results = Array.isArray(data.recent_results) ? data.recent_results : [];
        const pills = results.filter(r => r === '1' || r === '0').slice(0, 5);
        const pillsHtml = pills.length
            ? pills.map(r => {
                const label = r === '1' ? (isZh ? '胜' : 'Win') : (isZh ? '负' : 'Loss');
                return `<span class="sps-native-pill ${r === '1' ? 'win' : 'lose'}" title="${label}" aria-label="${label}"></span>`;
            }).join('')
            : `<span class="sps-native-muted">-</span>`;

        const numOrRaw = (v) => {
            const n = parseInt(String(v).replace(/,/g, ''), 10);
            return Number.isFinite(n) ? n.toLocaleString('en-US') : String(v);
        };

        if (data.rankError === 'RETRY_LATER' && data.faceitId) {
            safeSendMessage({
                type: 'FETCH_FACEIT_RANK',
                faceitId: data.faceitId,
                region: data.region || '',
                country: data.country || '',
                apiKey: settings && settings.sps_faceit_key
            }, (response) => {
                if (!container.isConnected) return;   
                const rd = response && response.success ? response.data : null;
                if (rd && (rd.region_rank !== undefined || rd.country_rank !== undefined)) {
                    renderNativeFaceit(container, steamID,  ({ ...data, region_rank: rd.region_rank, country_rank: rd.country_rank, rankError: undefined }), txt, settings);
                }
            });
        }

        const hist = (data.history && data.history.rows) ? data.history.rows.slice(0, 10) : [];

        const histLazy = !!data.histPending && hist.length === 0;
        const histClickable = hist.length > 0 || histLazy;
        const histCellCls = histClickable ? ' sps-native-hist-btn' : '';
        const histTitle = histClickable ? (isZh ? '点击查看近期对局' : 'Click for recent matches') : '';
        wrap.innerHTML = `
            <div class="sps-native-faceit-row">
                ${(() => { const ring = faceitEloBar(data.elo, data.level, isZh); return ring
                    ? `<div class="sps-lvl-ring-wrap sps-native">${ring}${nativeLevelBadge(data.level)}</div>`
                    : nativeLevelBadge(data.level); })()}
                <div class="sps-native-faceit-info">
                    <div class="sps-native-faceit-top">
                        <a class="sps-native-faceit-name" data-frame-site="faceit" data-frame-url="${esc(data.url || '')}" title="${esc(txt.native_faceit_home)}">FACEIT</a>
                        <span class="sps-native-sep">·</span>
                        <span class="sps-native-faceit-region">${esc(fullRegion)}</span>
                        ${data.nickname ? `<span class="sps-native-faceit-nick" title="${esc(data.nickname)}">${esc(data.nickname)}</span>` : ''}
                    </div>
                    <div class="sps-native-faceit-cells">
                        ${nativeCell(txt.elo_label, numOrRaw(data.elo), 'sps-native-cell-elo')}
                        ${nativeCell(txt.kd_label, String(data.kd))}
                        ${nativeCell(txt.hs_label, String(data.hs) + '%')}
                        ${nativeCell(txt.matches, numOrRaw(data.total_matches))}
                        ${nativeCell(txt.winrate, String(data.win_rate) + '%')}
                        <div class="sps-native-cell${histCellCls}"${histClickable ? ` role="button" tabindex="0" title="${esc(histTitle)}" data-sps-hist="1"` : ''}>
                            <span class="sps-native-cell-label">${esc(txt.native_recent)}</span>
                            <div class="sps-native-cell-pills">${pillsHtml}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (histClickable) {
            wrap.querySelector('.sps-native-hist-btn').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (_spsNativeCatsEl && _spsNativeCatsEl.style.display === 'block' && _spsNativeCatsKind === 'hist') hideNativeCatsPop();
                else if (hist.length) showNativeHistoryPop( (e.currentTarget), hist, txt);
                else showNativeHistoryLazyPop( (e.currentTarget), steamID, settings.sps_faceit_key, txt,  (data).faceitId);
            });
        }
    }

    function renderNativeLeetify(container, steamID, data, txt) {
        const wrap = container.querySelector('#sps-native-leetify');
        if (!wrap) return;
        const isZh = txt.region === '地区';
        if (!data || data.error != null) {
            const err =  (data || {});
            const errCode = err.error || 'NO_RESPONSE';
            const isHttpErr = /^HTTP /.test(errCode);
            const msg = errCode === 'NO_KEY' ? txt.connect_leetify
                : errCode === 'BAD_KEY' ? txt.leetify_bad_key
                : errCode === 'NOT_FOUND' ? txt.leetify_not_found
                : isHttpErr ? txt.leetify_http(errCode.slice(5))
                : txt.error_net;
            const hintHtml = (isHttpErr || errCode === 'NETWORK_ERROR' || errCode === 'NO_RESPONSE')
                ? `<div class="sps-native-fb-hint">${txt.error_hint_off}</div>` : '';
            let extraAction = '';
            if (errCode === 'NOT_FOUND') {
                const homeTxt = isZh ? '前往主页 ↗' : 'Visit Profile ↗';
                const leeUrl = __S_content_native_js(0) + encodeURIComponent(steamID);
                extraAction = ` <a class="sps-native-finder-link sps-native-leetify-link" data-frame-site="leetify" data-frame-url="${esc(leeUrl)}" data-steamid="${esc(steamID)}" href="${esc(leeUrl)}" target="_blank" title="${esc(txt.native_leetify_home)}" style="margin-left:6px;cursor:pointer;font-size:11px;">${esc(homeTxt)}</a>`;
            }
            wrap.innerHTML = `<div class="sps-native-fallback">${nativeErrorHtml(msg, isZh)}${extraAction}${hintHtml}</div>`;
            return;
        }
        data =  (data);
        const results = Array.isArray(data.recent) ? data.recent : [];
        const pills = results.filter(r => r === '1' || r === '0').slice(0, 5);
        const pillsHtml = pills.length
            ? pills.map(r => {
                const label = r === '1' ? (isZh ? '胜' : 'Win') : (isZh ? '负' : 'Loss');
                return `<span class="sps-native-pill ${r === '1' ? 'win' : 'lose'}" title="${label}" aria-label="${label}"></span>`;
            }).join('')
            : `<span class="sps-native-muted">-</span>`;
        const numOrRaw = (v) => {
            const n = parseInt(String(v).replace(/,/g, ''), 10);
            return Number.isFinite(n) ? n.toLocaleString('en-US') : String(v);
        };

        const histRows = Array.isArray(data.recent_rows) ? data.recent_rows.slice(0, SPS_RECENT_MAX) : [];
        const histClickable = histRows.length > 0;
        const histCellCls = histClickable ? ' sps-native-hist-btn' : '';
        const histTitle = histClickable ? (isZh ? '点击查看近期对局' : 'Click for recent matches') : '';
        const fmt2 = (v) => (typeof v === 'number' && Number.isFinite(v)) ? v.toFixed(2) : '-';

        let premierHtml = '';
        if (data.premier !== undefined && Number(data.premier) > 0) {
            const t = leePremierTier(data.premier);
            premierHtml = `<span class="sps-lee-premier" title="${esc(txt.lee_premier)} · Premier">`
                + `<img src="${chrome.runtime.getURL(__S_content_native_js(1) + t.name + '.svg')}" alt="">`
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

        wrap.innerHTML = `
            <div class="sps-native-faceit-row">
                <div class="sps-native-faceit-info">
                    <div class="sps-native-faceit-top">
                        ${premierHtml}
                        <a class="sps-native-leetify-name" data-frame-site="leetify" data-steamid="${esc(steamID)}" title="${esc(txt.native_leetify_home)}">Leetify</a>
                        ${data.name ? `<span class="sps-native-faceit-nick" title="${esc(data.name)}">${esc(data.name)}</span>` : ''}
                        ${data.faceit_banned ? `<span class="sps-native-leetify-ban" title="${esc(txt.leetify_faceit_ban)}">✖ ${esc(txt.leetify_faceit_ban)}</span>` : ''}
                        ${hasRanks ? `<span class="sps-lee-ranks-btn" role="button" tabindex="0" title="${esc(txt.lee_ranks)}">${esc(txt.lee_ranks)} <span class="sps-lee-chevron">▾</span></span>` : ''}
                    </div>
                    <div class="sps-native-faceit-cells sps-lee-cells">
                        ${nativeCell(txt.lr_label, data.leetify_rating !== undefined ? String(data.leetify_rating) : '-')}
                        ${nativeCell(txt.lee_aim, data.aim !== undefined ? String(data.aim) : '-')}
                        ${nativeCell(txt.lee_positioning, data.positioning !== undefined ? String(data.positioning) : '-')}
                        ${nativeCell(txt.lee_utility, data.utility !== undefined ? String(data.utility) : '-')}
                        ${nativeCell(txt.lee_clutch, data.clutch !== undefined ? fmt2(data.clutch) + '%' : '-')}
                        ${nativeCell(txt.lee_opening, data.opening !== undefined ? fmt2(data.opening) + '%' : '-')}
                        ${nativeCell(txt.lee_preaim, data.preaim !== undefined ? fmt2(data.preaim) + '°' : '-')}
                        ${nativeCell(txt.lee_reaction, data.reaction !== undefined ? data.reaction + 'ms' : '-')}
                        ${nativeCell(txt.kd_label, data.kd !== undefined ? String(data.kd) : '-')}
                        ${nativeCell(txt.hs_label, data.hs !== undefined ? String(data.hs) + '%' : '-')}
                        ${nativeCell(txt.matches, data.total_matches !== undefined ? numOrRaw(data.total_matches) : '-')}
                        ${nativeCell(txt.winrate, data.win_rate !== undefined ? String(data.win_rate) + '%' : '-')}
                        ${nativeCell('ADR', data.adr !== undefined ? String(data.adr) : '-')}
                        <div class="sps-native-cell${histCellCls}"${histClickable ? ` role="button" tabindex="0" title="${esc(histTitle)}" data-sps-hist="1"` : ''}>
                            <span class="sps-native-cell-label">${esc(txt.native_recent)}</span>
                            <div class="sps-native-cell-pills">${pillsHtml}</div>
                        </div>
                    </div>
                    ${ranksHtml}
                </div>
            </div>
        `;
        if (histClickable) {
            const histBtn = wrap.querySelector('.sps-native-hist-btn');
            if (histBtn) {
                const togglePop = (target) => {
                    if (_spsNativeCatsEl && _spsNativeCatsEl.style.display === 'block' && _spsNativeCatsKind === 'hist') hideNativeCatsPop();
                    else showNativeHistoryPop(target, histRows, txt);
                };
                histBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePop( (e.currentTarget));
                });
                histBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePop( (e.currentTarget));
                    }
                });
            }
        }
        if (hasRanks) {
            const btn = wrap.querySelector('.sps-lee-ranks-btn');
            const sec = wrap.querySelector('.sps-lee-ranks');
            bindRankDrawerEvents(btn, sec);
        }
    }

    function renderNativeCSStats(container, steamID, data, txt) {
        const wrap = container.querySelector('#sps-native-csstats');
        if (!wrap) return;
        const isZh = txt.region === '地区';
        if (!data || data.error != null) {
            const err = data || {};
            const errCode = err.error || 'NO_RESPONSE';

            const transient = errCode === 'NETWORK_ERROR' || errCode === 'NO_RESPONSE' || errCode === 'UNKNOWN' || errCode === 'THROTTLED';
            if (transient && wrap.querySelector('.sps-native-faceit-cells')) return;
            let msg = txt.error_net;
            let cfBtn = '';
            if (errCode === 'CF_CHALLENGE') {
                msg = txt.csstats_cf_hint;
                cfBtn = ` <button class="sps-native-cf-btn sps-cf-heal-btn" data-sps-heal="csstats" data-steamid="${esc(steamID)}" title="${esc(txt.csstats_open_cf)}">${esc(txt.csstats_open_cf)}</button>`;
            } else if (errCode === 'PRIVATE') {
                msg = txt.csstats_private;
            } else if (errCode === 'NOT_FOUND') {
                msg = txt.csstats_not_found;
            } else if (errCode === 'RATE_LIMITED' || errCode === 'THROTTLED') {
                
                msg = txt.csstats_rate_limited;
            } else {
                const retryTxt = isZh ? '重试' : 'Retry';
                cfBtn = ` <button class="sps-csstats-retry-btn" data-steamid="${esc(steamID)}" style="margin-left:8px;cursor:pointer;padding:2px 8px;border-radius:3px;border:1px solid currentColor;background:transparent;color:inherit;font-size:11px;">${esc(retryTxt)}</button>`
                    + ` <button class="sps-native-cf-btn sps-cf-heal-btn" data-sps-heal="csstats" data-steamid="${esc(steamID)}" style="margin-left:4px;cursor:pointer;padding:2px 8px;border-radius:3px;border:1px solid #3b82f6;background:transparent;color:#60a5fa;font-size:11px;" title="${esc(txt.csstats_open_cf)}">${esc(txt.csstats_open_cf)}</button>`;
            }
            const isErr = errCode === 'CF_CHALLENGE' || errCode === 'NETWORK_ERROR' || errCode === 'NO_RESPONSE';
            const cls = isErr ? ' sps-fb-err' : ' sps-fb-mute';
            wrap.innerHTML = `<div class="sps-native-fallback ${cls}">${esc(msg)}${cfBtn}</div>`;
            const cfBtnEl = wrap.querySelector('.sps-native-cf-btn');
            if (cfBtnEl) {
                cfBtnEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    cfBtnEl.textContent = isZh ? '跳转验证中…' : 'Verifying...';
                    spsArmCsstatsHeal(steamID);
                });
            }
            const retryBtn = wrap.querySelector('.sps-csstats-retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    wrap.innerHTML = `<div class="sps-native-fallback">${esc(txt.native_loading)}</div>`;
                    const reg = _spsCSStatsCards.get(steamID);
                    if (reg && typeof reg.rerender === 'function') {
                        reg.rerender();
                    }
                });
            }
            return;
        }

        if (data.pending) {
            wrap.innerHTML = spsCsstatsPendingHtml(txt);
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
                        + `<img src="${chrome.runtime.getURL(__S_content_native_js(1) + tCurr.name + '.svg')}" alt="">`
                        + `<span class="sps-lee-premier-num" style="color:${tCurr.color}">${esc(numOrRaw(curr))}</span></span>`;
                    const tBest = leePremierTier(best);
                    const bestBadge = `<span class="sps-lee-premier" title="${esc(txt.lee_premier)} · ${esc(txt.cs_best_rank_label)}">`
                        + `<img src="${chrome.runtime.getURL(__S_content_native_js(1) + tBest.name + '.svg')}" alt="">`
                        + `<span class="sps-lee-premier-num" style="color:${tBest.color}">${esc(numOrRaw(best))}</span></span>`;
                    premierHtml = `<div class="sps-cs-premier-group">${currBadge}<span class="sps-cs-premier-arrow">/</span>${bestBadge}</div>`;
                } else {
                    const targetRating = curr > 0 ? curr : best;
                    const tTarget = leePremierTier(targetRating);
                    const badge = `<span class="sps-lee-premier" title="${esc(txt.lee_premier)} · ${esc(txt.cs_best_label)}">`
                        + `<img src="${chrome.runtime.getURL(__S_content_native_js(1) + tTarget.name + '.svg')}" alt="">`
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
        const histCellCls = histClickable ? ' sps-native-hist-btn' : '';
        const histTitle = histClickable ? (isZh ? '点击查看近期对局' : 'Click for recent matches') : '';

        const pills = Array.isArray(data.recent_results) ? data.recent_results.slice(0, 5) : [];
        const pillsHtml = pills.length
            ? pills.map(r => {
                const label = r === 'W' ? (isZh ? '胜' : 'Win') : (r === 'L' ? (isZh ? '负' : 'Loss') : (isZh ? '平' : 'Tie'));
                return `<span class="sps-native-pill ${r === 'W' ? 'win' : (r === 'L' ? 'lose' : 'tie')}" title="${label}" aria-label="${label}"></span>`;
            }).join('')
            : `<span class="sps-native-muted">-</span>`;

        wrap.innerHTML = `
            <div class="sps-native-faceit-row">
                <div class="sps-native-faceit-info">
                    <div class="sps-native-faceit-top">
                        ${premierHtml}
                        <a class="sps-native-csstats-name" data-frame-site="csstats" data-steamid="${esc(steamID)}" href="${esc(csstatsProfileUrl(steamID))}" target="_blank" title="${esc(txt.native_csstats_home)}">CSStats</a>
                        ${data.name ? `<span class="sps-native-faceit-nick" title="${esc(data.name)}">${esc(data.name)}</span>` : ''}
                        ${data.auth_gated ? `<span class="sps-cs-indicator" style="background:rgba(234,179,8,0.15);color:#eab308;border-color:rgba(234,179,8,0.4);" title="${esc(txt.csstats_auth_gated)}">${esc(isZh ? '需登录' : 'Sign-in')}</span>` : ''}
                        ${data.backfilling ? spsCsstatsBackfillChip(isZh) : ''}
                        ${hasRanks ? `<span class="sps-cs-ranks-btn" role="button" tabindex="0" title="${esc(txt.cs_all_ranks)}">${esc(txt.cs_all_ranks)} <span class="sps-cs-chevron">▾</span></span>` : ''}
                    </div>
                    <div class="sps-native-faceit-cells sps-cs-cells">
                        ${nativeCell(txt.kd_label, data.kd_ratio !== undefined ? fmt2(data.kd_ratio) : '-')}
                        ${nativeCell(txt.cs_hltv_label, data.hltv_rating !== undefined ? fmt2(data.hltv_rating) : '-')}
                        ${nativeCell(txt.winrate, data.win_rate !== undefined ? String(data.win_rate) + '%' : '-')}
                        ${nativeCell(txt.hs_label, data.hs_percentage !== undefined ? String(data.hs_percentage) + '%' : '-')}
                        ${nativeCell('ADR', data.adr !== undefined ? String(data.adr) : '-')}
                        ${nativeCell(txt.cs_clutch_label, data.clutch !== undefined ? String(data.clutch) + '%' : '-')}
                        ${nativeCell(txt.cs_most_played, data.most_played_map ? String(data.most_played_map) : '-')}
                        <div class="sps-native-cell${histCellCls}"${histClickable ? ` role="button" tabindex="0" title="${esc(histTitle)}" data-sps-hist="1"` : ''}>
                            <span class="sps-native-cell-label">${esc(txt.native_recent)}</span>
                            <div class="sps-native-cell-pills">${pillsHtml}</div>
                        </div>
                    </div>
                    ${ranksHtml}
                    ${spsCsstatsLoginHint(data, isZh)}
                </div>
            </div>
        `;

        if (histClickable) {
            const histBtn = wrap.querySelector('.sps-native-hist-btn');
            if (histBtn) {
                const togglePop = (target) => {
                    if (_spsNativeCatsEl && _spsNativeCatsEl.style.display === 'block' && _spsNativeCatsKind === 'hist') hideNativeCatsPop();
                    else showNativeHistoryPop(target, histRows, txt);
                };
                histBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePop( (e.currentTarget));
                });
                histBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePop( (e.currentTarget));
                    }
                });
            }
        }

        if (hasRanks) {
            const btn = wrap.querySelector('.sps-cs-ranks-btn');
            const sec = wrap.querySelector('.sps-cs-ranks');
            bindRankDrawerEvents(btn, sec);
        }
    }

    function showNativeHistoryLazyPop(anchorEl, steamID, apiKey, txt, faceitId) {
        const isZh = txt.region === '地区';
        if (!_spsNativeCatsEl) {
            _spsNativeCatsEl = document.createElement('div');
            _spsNativeCatsEl.className = 'sps-native-cats';
            document.body.appendChild(_spsNativeCatsEl);
        }
        _spsNativeCatsKind = 'hist';
        _spsNativeCatsEl.classList.add(__S_content_native_js(2));   
        _spsNativeCatsEl.innerHTML = `<div class="sps-native-cats-title">${esc(isZh ? '近期对局' : 'Recent Matches')}</div><div class="sps-native-hist-load">${esc(txt.loading)}</div>`;
        _spsNativeCatsEl.style.display = 'block';   
        positionNativeCatsPop(anchorEl);
        
        fetchFaceitHistRows(steamID, apiKey, faceitId, (rows, meta) => {
            if (!_spsNativeCatsEl || _spsNativeCatsKind !== 'hist' || _spsNativeCatsEl.style.display !== 'block') return;   
            if (!rows.length) {
                if (meta.final) {
                    
                    _spsNativeCatsEl.innerHTML = `<div class="sps-native-cats-title">${esc(isZh ? '近期对局' : 'Recent Matches')}</div><div class="sps-native-hist-load">${nativeErrorHtml(isZh ? '拉取失败，点击重试' : 'Fetch failed, click to retry')}</div>`;
                }
                return;
            }
            showNativeHistoryPop(anchorEl, rows.slice(0, 10), txt);   
        }, 30000);
    }

    function positionNativeCatsPop(anchorEl) {
        const r = anchorEl.getBoundingClientRect();
        const pw = _spsNativeCatsEl.offsetWidth;
        let left = r.left;
        if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
        _spsNativeCatsEl.style.left = Math.round(Math.max(8, left)) + 'px';
        _spsNativeCatsEl.style.top = Math.round(Math.min(r.bottom + 8, window.innerHeight - _spsNativeCatsEl.offsetHeight - 8)) + 'px';
    }

    function showNativeHistoryPop(anchorEl, hist, txt) {
        const isZh = txt.region === '地区';
        if (!_spsNativeCatsEl) {
            _spsNativeCatsEl = document.createElement('div');
            _spsNativeCatsEl.className = 'sps-native-cats';
            document.body.appendChild(_spsNativeCatsEl);
        }
        _spsNativeCatsKind = 'hist';
        _spsNativeCatsEl.classList.add(__S_content_native_js(2));   
        const hasStats = hist.some(hh => hh.kd || hh.kda || hh.adr || hh.hs);
        const hasKda = hist.some(hh => hh.kda);
        const hasRank = hist.some(hh => hh.rank !== undefined);
        const hasDate = hist.some(hh => (hh.finished_at && hh.finished_at > 0) || hh.date);

        const dateHead = hasDate ? `<span class="sps-native-hist-date-head">${esc(isZh ? '日期' : 'Date')}</span>` : '';
        const rankHead = hasRank ? `<span class="sps-native-hist-rank-head">${esc(isZh ? '段位' : 'Rank')}</span>` : '';
        
        const statKdaHead = hasKda ? 'KDA' : 'K/D';

        const head = hasStats ? `<div class="sps-native-cats-row sps-native-hist-row sps-recent-pop-head">
            <span class="sps-native-hist-res"></span>
            ${dateHead}
            <span class="sps-native-hist-map">${esc(isZh ? '地图' : 'Map')}</span>
            ${rankHead}
            <span class="sps-native-hist-score">${esc(isZh ? '比分' : 'Score')}</span>
            <span class="sps-native-hist-stat sps-native-hist-kda">${statKdaHead}</span>
            <span class="sps-native-hist-stat">ADR</span>
            <span class="sps-native-hist-stat">HS%</span>
        </div>` : '';
        const rows = head + hist.map(hh => {
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
            const dateHtml = hasDate
                ? `<span class="sps-native-hist-date">${esc(dateStr || '-')}</span>`
                : '';

            let rankHtml = '';
            if (hasRank) {
                const isWing = hh.mode === 'wingman' || hh.rank_type === 7;
                if (typeof hh.rank === 'number' && hh.rank > 50) {
                    rankHtml = `<span class="sps-native-hist-rank">${spsPremierBadgeHtml(hh.rank)}</span>`;
                } else if (typeof hh.rank === 'number' && hh.rank >= 1 && hh.rank <= 18) {
                    rankHtml = `<span class="sps-native-hist-rank">${spsRankBadgeHtml(hh.rank, isZh, isWing)}</span>`;
                } else if (hh.rank) {
                    rankHtml = `<span class="sps-native-hist-rank">${esc(String(hh.rank))}</span>`;
                } else {
                    rankHtml = `<span class="sps-native-hist-rank sps-cs-rank-empty">-</span>`;
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

            return `<div class="sps-native-cats-row sps-native-hist-row">
                <span class="sps-native-hist-res ${resCls}">${resTxt}</span>
                ${dateHtml}
                <span class="sps-native-hist-map"${hh.map && hh.map.length > 18 ? ` title="${esc(hh.map)}"` : ''}>${esc(hh.map || '-')}</span>
                ${rankHtml}
                <span class="sps-native-hist-score ${resCls}">${esc(hh.score || '-')}</span>
                ${hasStats ? `<span class="sps-native-hist-stat sps-native-hist-kda">${esc(kdaVal)}</span>
                <span class="sps-native-hist-stat">${esc(hh.adr || '-')}</span>
                <span class="sps-native-hist-stat">${esc(hh.hs ? String(hh.hs).replace(/%$/, '') + '%' : '-')}</span>` : ''}
            </div>`;
        }).join('');
        _spsNativeCatsEl.innerHTML = `<div class="sps-native-cats-title">${esc(isZh ? '近期对局' : 'Recent Matches')}</div>${rows}`;
        _spsNativeCatsEl.style.display = 'block';
        positionNativeCatsPop(anchorEl);
    }

    function nativeSlotHtml(item, i, steamID, isZh) {
        const rank = i + 1;
        const imgRaw = item.img ? safeUrl(item.img) : '';
        const img = imgRaw && imgRaw !== '#' ? `<img class="item_image" src="${imgRaw}" srcset="${imgRaw}dpx2x 2x" alt="" loading="lazy">` : '';
        let slotCls = '', slotStyle = '';
        if (item.rarityColor && /^#[0-9a-fA-F]{6}$/.test(item.rarityColor)) {
            const r = parseInt(item.rarityColor.slice(1, 3), 16);
            const g = parseInt(item.rarityColor.slice(3, 5), 16);
            const b = parseInt(item.rarityColor.slice(5, 7), 16);
            const dk = (c) => Math.round(c * 0.119 + 36);
            slotCls = ' sps-rarity-slot';
            slotStyle = ` style="--sps-rarity:${esc(item.rarityColor)};--sps-rarity-bg:rgb(${dk(r)},${dk(g)},${dk(b)})"`;
        }
        return `
            <div class="showcase_slot sps-native-card" data-slot-rank="${rank}" tabindex="0">
                <div class="item_showcase_item${slotCls}"${slotStyle}>
                    <a href="${item.mktUrl || (__S_content_native_js(3) + encodeURIComponent(item.name))}" target="_blank" rel="noopener noreferrer">${img}</a>
                    <span class="sps-native-rank">#${rank}</span>
                </div>
            </div>
        `;
    }

    let _spsNativePopEl = null;
    let _spsNativePopHideTimer = null;
    
    const SPS_ITEM_POP_ID = 'sps-native-pop';

    function spsItemPopupHtml(item, isZh, opts) {
        const rarityColor = item.rarityColor && /^#[0-9a-fA-F]{6}$/.test(item.rarityColor) ? item.rarityColor : '';
        const popCardCls = rarityColor ? ' sps-has-rarity' : '';
        const popCardStyle = rarityColor ? ` style="--sps-rarity:${esc(rarityColor)}"` : '';
        const displayName = isZh && item.name_cn ? stripWearSuffix(item.name_cn) : stripWearSuffix(item.name);
        const imgBigRaw = item.img ? safeUrl(String(item.img).replace(/\/\d+fx\d+f$/, '/360fx360f')) : '';
        const imgBig = imgBigRaw && imgBigRaw !== '#' ? imgBigRaw : '';
        const typeLine = item.type ? (isZh ? nativeTypeZh(item.type) : item.type) : '';
        const hasPaint = item.paintIndex != null;
        const row = (label, value) => `<div class="sps-native-pop-row"><span class="sps-native-pop-lbl">${esc(label)}:</span><span class="sps-native-pop-val">${value}</span></div>`;
        const rows = [];
        if (item.exterior) rows.push(row(isZh ? '外观' : 'Exterior', esc(item.exterior)));
        if (item.itemset) rows.push(row(isZh ? '收藏品' : 'Collection', esc(item.itemset)));
        if (hasPaint) rows.push(row(isZh ? '皮肤编号' : 'Paint Index', esc(String(item.paintIndex))));
        if (Number(item.qty) > 1) rows.push(row(isZh ? '数量' : 'Quantity', `${esc(String(item.qty))} ${isZh ? '件' : ''}`));
        if (item.nameTag) rows.push(row(isZh ? '名称标签' : 'Name Tag', esc(item.nameTag)));
        if (item.tradable === false) rows.push(row(isZh ? '交易状态' : 'Trade', isZh ? '不可交易' : 'Not tradable'));
        if (item.float && Number(item.qty) === 1) rows.push(row(isZh ? '磨损率' : 'Float', esc(String(item.float))));
        if (item.seed != null && Number(item.qty) === 1) rows.push(row(isZh ? '图案模板' : 'Pattern', esc(String(item.seed))));
        const cleanDesc = (raw) => esc(String(raw)
            .replace(/<i([\s\S]*?)\/i>/g, '$1')     
            .replace(/<>/g, '')
            .replace(/[<>]/g, ''));

        const descFilter = (d) => {
            const t = String(d && d.v || '')
                .replace(/<i([\s\S]*?)\/i>/g, '$1')
                .replace(/[<>]/g, '')
                .trim();
            if (!t) return false;
            if (/^(外观|Exterior)\s*[:：]/.test(t)) return false;
            if (/^(磨损率|磨损|Float|Paint Wear)\s*[:：]?\s*[0-9.]*$/.test(t)) return false;
            return true;
        };
        const descHtml = (Array.isArray(item.desc) ? item.desc : [])
            .filter(descFilter)
            .map(d => `<div class="sps-native-pop-desc${d.c ? ' sps-c' : ''}"${d.c ? ` style="--sps-c:#${esc(String(d.c).replace(/^#/, ''))}"` : ''}>${cleanDesc(d.v)}</div>`).join('');
        const money = (v) => v >= 1 ? Math.round(v).toLocaleString('en-US') : v.toFixed(2);
        const sym = curSym(item.currency);
        const stickersHtml = (Array.isArray(item.stickers) && item.stickers.length)
            ? `<div class="sps-native-pop-att-label">${esc(isZh ? '配件' : 'Attached stickers')}${item.stickerValue > 0 ? `<span class="sps-native-pop-sticker-val">${sym}${money(item.stickerValue)}</span>` : ''}</div><div class="sps-native-pop-stickers">${item.stickers.map(s => {

                const accUrl = s.accUrl || (__S_content_native_js(3) + encodeURIComponent(s.hn || s.n));
                return `<a class="sps-native-pop-sticker" href="${esc(accUrl)}" target="_blank" rel="noopener noreferrer"><img src="${safeUrl(s.i)}" alt=""><span>${esc(s.n)}</span>${Number(s.p) > 0 ? `<span class="sps-native-pop-sticker-price">${sym}${money(Number(s.p))}</span>` : ''}</a>`;
            }).join('')}</div>`
            : '';
        const tagsHtml = (Array.isArray(item.tags) && item.tags.length)
            ? `<div class="sps-native-pop-tags"><span class="sps-native-pop-lbl">${esc(isZh ? '标签' : 'Tags')}:</span> ${esc(item.tags.join(', '))}</div>`
            : '';
        let contentsHtml = '';
        if (item.contents && Array.isArray(item.contents.items) && item.contents.items.length) {
            const list = item.contents.items.map(x =>
                `<div class="sps-native-pop-crow${x.r ? ' sps-c' : ''}"${x.r ? ` style="--sps-c:#${esc(String(x.r).replace(/^#/, ''))}"` : ''}>${esc(cleanDesc(x.n))}</div>`).join('');
            const rare = (item.contents.rare || []).map(x => `<div class="sps-native-pop-crow sps-crow-rare">★ ${esc(cleanDesc(x.n))}</div>`).join('');
            contentsHtml = `<div class="sps-native-pop-att-label">${esc(isZh ? '可能开出' : 'Contains one of the following')}</div><div class="sps-native-pop-contents">${list}${rare}</div>`;
        }

        let floatBarHtml = '';
        if (Number(item.qty) === 1 && item.float != null && item.floatRange && item.floatRange.max > item.floatRange.min) {
            const fmin = item.floatRange.min, fmax = item.floatRange.max, fv = Number(item.float);
            const pos = Math.max(0, Math.min(100, ((fv - fmin) / (fmax - fmin)) * 100));
            const fmtF = (x) => { const s = Number(x).toFixed(6).replace(/0+$/, '').replace(/\.$/, ''); return s === '0' ? '0' : s; };
            const tip = isZh
                ? `磨损区间 ${fmtF(fmin)} ~ ${fmtF(fmax)}\n该件 ${fmtF(fv)} · 距最低 ${((fv - fmin) / (fmax - fmin) * 100).toFixed(0)}%`
                : `Wear range ${fmtF(fmin)} ~ ${fmtF(fmax)}\nThis one ${fmtF(fv)} · ${((fv - fmin) / (fmax - fmin) * 100).toFixed(0)}% from min`;
            floatBarHtml = `<div class="sps-float-bar" title="${esc(tip)}">`
                + `<span class="sps-float-cap sps-float-cap-min">${esc(fmtF(fmin))}</span>`
                + `<div class="sps-float-bar-track"><div class="sps-float-bar-marker" style="--p:${pos.toFixed(1)}%"></div></div>`
                + `<span class="sps-float-cap sps-float-cap-max">${esc(fmtF(fmax))}</span>`
                + `</div>`;
        }
        const price = nativePriceText(item);
        const mktNote = item.mktNote ? `<span class="sps-native-note" title="${esc(isZh ? '聚合参考价：该来源暂无此相位的细分价数据' : 'Aggregate reference price: no per-phase price data from this source')}">*</span>` : '';
        const buyQuote = item.buyQuote ? `<span class="sps-native-pop-buy" title="${esc(isZh ? '无在售挂单，此价格取当前求购价' : 'No active sell order; price is the current buy-order quote')}">${isZh ? '求购' : 'Buy'}</span>` : '';
        
        const marketLine = (opts && opts.market) ? `<div class="sps-native-pop-market">↗ ${esc(opts.market)}</div>` : '';
        return `
            <div class="sps-native-pop-card${popCardCls}"${popCardStyle}>
                ${imgBig ? `<div class="sps-native-pop-img"><img src="${imgBig}" alt=""></div>` : ''}
                <div class="sps-native-pop-body">
                    <div class="sps-native-pop-name">${esc(displayName)}${item.phase ? `<span class="sps-native-pop-phase">${esc(item.phase)}</span>` : ''}</div>
                    <div class="sps-native-pop-game">
                        <img src="${SPS_CS2_ICON}" alt="">
                        <div>
                            <div class="sps-native-pop-app">Counter-Strike 2</div>
                            ${typeLine ? `<div class="sps-native-pop-type">${esc(typeLine)}</div>` : ''}
                        </div>
                    </div>
                    ${rows.join('')}
                    ${floatBarHtml}
                    ${stickersHtml}
                    ${tagsHtml}
                    ${contentsHtml}
                    ${descHtml}
                    ${price || mktNote || buyQuote ? `<div class="sps-native-pop-price">${esc(price)}${mktNote}${buyQuote}</div>` : ''}
                    ${marketLine}
                </div>
            </div>
        `;
    }

    function spsShowItemPop(item, anchorEl, txt, opts) {
        try {
            if (!_spsNativePopEl) {
                _spsNativePopEl = document.createElement('div');
                _spsNativePopEl.className = 'sps-native-pop';

                _spsNativePopEl.id = SPS_ITEM_POP_ID;
                _spsNativePopEl.setAttribute('role', 'tooltip');
                document.body.appendChild(_spsNativePopEl);
                bindPopHoverKeep();
            }
            clearTimeout(_spsNativePopHideTimer);
            const isZh = txt.region === '地区';
            _spsNativePopEl.innerHTML = spsItemPopupHtml(item, isZh, opts);
            _spsNativePopEl.style.display = 'block';
            if (_spsNativePopEl.setAttribute) _spsNativePopEl.setAttribute('aria-hidden', 'false');
            const r = anchorEl.getBoundingClientRect();
            const pw = _spsNativePopEl.offsetWidth, ph = _spsNativePopEl.offsetHeight;
            let left = r.right + 8;
            if (left + pw > window.innerWidth - 8) left = r.left - pw - 8;
            if (left < 8) left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left));
            let top = r.top - 6;
            if (top + ph > window.innerHeight - 8) top = window.innerHeight - ph - 8;
            if (top < 8) top = 8;
            _spsNativePopEl.style.left = Math.round(left) + 'px';
            _spsNativePopEl.style.top = Math.round(top) + 'px';
        } catch (e) {
        }
    }

    function spsHideItemPop() {
        clearTimeout(_spsNativePopHideTimer);
        _spsNativePopHideTimer = setTimeout(() => { if (_spsNativePopEl) _spsNativePopEl.style.display = 'none'; }, 150);
    }

    function spsHideItemPopNow() {
        clearTimeout(_spsNativePopHideTimer);
        if (!_spsNativePopEl) return;
        _spsNativePopEl.style.display = 'none';
        if (_spsNativePopEl.setAttribute) _spsNativePopEl.setAttribute('aria-hidden', 'true');
    }

    function spsBindItemPop(el, item, txt, opts) {
        if (!el || !el.addEventListener || !item) return;
        const show = () => spsShowItemPop(item, el, txt, opts || {});
        el.addEventListener('mouseenter', show);
        el.addEventListener('mouseleave', () => spsHideItemPop());
        el.addEventListener('focus', show);
        el.addEventListener('blur', () => spsHideItemPopNow());
        el.addEventListener('keydown', ( e) => {
            if (e.key === 'Escape' || e.key === 'Esc') spsHideItemPopNow();
        });
        el.addEventListener('wheel', ( e) => {
            if (spsItemPopWheel(e.deltaY)) e.preventDefault();
        }, { passive: false });
        if (el.setAttribute) el.setAttribute('aria-describedby', SPS_ITEM_POP_ID);
    }
    
    function spsItemPopWheel(deltaY) {
        if (!_spsNativePopEl || _spsNativePopEl.style.display !== 'block') return false;
        const body = _spsNativePopEl.querySelector('.sps-native-pop-body');
        if (!body || body.scrollHeight <= body.clientHeight + 2) return false;
        body.scrollTop += deltaY;
        return true;
    }
    if (SPS_ACTIVE) window.addEventListener('scroll', () => {
        clearTimeout(_spsNativePopHideTimer);
        spsHideItemPop();
    }, { passive: true });
    
    function bindPopHoverKeep() {
        if (!_spsNativePopEl) return;
        _spsNativePopEl.addEventListener('mouseenter', () => clearTimeout(_spsNativePopHideTimer));
        _spsNativePopEl.addEventListener('mouseleave', () => spsHideItemPop());
    }

    let _spsNativeCatsEl = null;
    let _spsNativeCatsKind = '';   

    function nativeCatsHtml(categories, isZh, sym) {
        const catDefs = [
            ['skins', isZh ? '皮肤' : 'Skins'], ['cases', isZh ? '箱子' : 'Cases'],
            ['keys', isZh ? '钥匙' : 'Keys'], ['agents', isZh ? '探员' : 'Agents'],
            ['stickers', isZh ? '印花' : 'Stickers'], ['graffiti', isZh ? '涂鸦' : 'Graffiti'],
            ['other', isZh ? '其他' : 'Other']
        ];
        const rows = catDefs
            .filter(([k]) => categories && categories[k] && ((categories[k].v || 0) > 0 || categories[k].c > 0))
            .map(([k, label]) => {
                const c = categories[k];
                const val = (c.v || 0) > 0 ? `${sym || '¥'}${fmtInvValue(c.v)}` : '-';
                return `<div class="sps-native-cats-row"><span class="sps-native-cats-label">${esc(label)}</span><span class="sps-native-cats-val">${esc(val)}</span><span class="sps-native-cats-count">${esc(String(c.c))}${isZh ? '件' : ''}</span></div>`;
            });
        if (!rows.length) return `<div class="sps-native-cats-empty">${esc(isZh ? '暂无分类数据' : 'No category data')}</div>`;
        return `<div class="sps-native-cats-title">${esc(isZh ? '库存分类' : 'Inventory by Type')}</div>${rows.join('')}`;
    }

    function showNativeCatsPop(anchorEl, categories, txt, sym) {
        if (!_spsNativeCatsEl) {
            _spsNativeCatsEl = document.createElement('div');
            _spsNativeCatsEl.className = 'sps-native-cats';
            document.body.appendChild(_spsNativeCatsEl);
        }
        const isZh = txt.region === '地区';
        _spsNativeCatsKind = 'cats';
        _spsNativeCatsEl.classList.remove(__S_content_native_js(2));   
        _spsNativeCatsEl.innerHTML = nativeCatsHtml(categories, isZh, sym);
        _spsNativeCatsEl.style.display = 'block';
        positionNativeCatsPop(anchorEl);
    }

    function hideNativeCatsPop() {
        if (_spsNativeCatsEl) _spsNativeCatsEl.style.display = 'none';
    }
    if (SPS_ACTIVE) document.addEventListener('click', (e) => {
        if (_spsNativeCatsEl && _spsNativeCatsEl.style.display === 'block'
            && !_spsNativeCatsEl.contains(e.target) && !(e.target.closest && (e.target.closest('.sps-native-stat-btn') || e.target.closest('.sps-native-hist-btn')))) {
            hideNativeCatsPop();
        }
    });
    if (SPS_ACTIVE) document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideNativeCatsPop(); });
    if (SPS_ACTIVE) window.addEventListener('scroll', hideNativeCatsPop, { passive: true });

    function renderNativeInvCountPreview(block, steamID, data, txt) {
        const statEl = block.querySelector('#sps-native-inv-stat');
        if (!statEl) return;
        const err = data && data.error;
        
        if (err === 'Private' || err === 'API Fail' || err === 'HTTP 403') {
            const invCtn = block.querySelector('.sps-native-items-ctn');
            const statCtn = block.querySelector('.sps-native-stats-ctn');
            if (invCtn) invCtn.style.display = 'none';
            if (statCtn) statCtn.style.display = 'none';
            return;
        }
        
        if (!statEl.querySelector('.sps-native-fallback')) return;
        const count = data && data.item_count >= 0 ? data.item_count : null;
        const invUrl = `${__S_content_native_js(5)}${esc(steamID)}/inventory#730`;
        statEl.innerHTML = `
            <a class="showcase_stat" href="${invUrl}" target="_blank" rel="noopener noreferrer" title="${esc(txt.region === '地区' ? '打开 CS2 库存页' : 'Open CS2 inventory')}">
                <div class="value">${count !== null ? esc(String(count)) : '-'}</div>
                <div class="label">${esc(txt.native_inv_count)}</div>
            </a>
            <div class="showcase_stat">
                <div class="value">...</div>
                <div class="label">${esc(txt.native_inv_value)}</div>
            </div>`;
    }

    function renderNativeInventory(steamID, container, invData, txt, showPhase, showTopItems) {
        const statEl = container.querySelector('#sps-native-inv-stat');
        const rowEl = container.querySelector('#sps-native-slots');
        const labelEl = container.querySelector('#sps-native-items-label');
        if (!statEl || !rowEl) return;
        const isZh = txt.region === '地区';

        const count = invData && invData.item_count;
        const total = invData && invData.total_value;
        const totalNum = parseFloat(total);
        const valOk = Number.isFinite(totalNum) && totalNum > 0 && !(invData && invData.error);
        
        const pendingNoValue = !valOk && invData && invData.pendingTotal && !(invData && invData.error);
        const valueText = valOk
            ? `¥${Math.round(totalNum).toLocaleString('en-US')}`
            : (pendingNoValue ? (isZh ? '估值中…' : 'valuing…')
            : (invData && invData.error === 'Rate Limited' ? 'RateLimit' : '-'));
        const srcSuffix = valOk && invData.source_label ? ` · ${invData.source_label}` : '';
        
        let authHtml = '';
        if (invData && invData.error === 'CSQAQ_AUTH') {
            const hint =  (txt).csqaq_auth_hint || 'CSQAQ auth failed';
            authHtml = ` <span class="source-tag error" title="${esc(hint)}">CSQAQ</span>`;
        }
        
        const pendSuffix = (valOk && invData.pendingTotal) ? `（${isZh ? '估值中' : 'valuing'}…）` : '';
        
        const incTitle = (invData && invData.incomplete) ? (isZh ? '库存过大，本轮分页被限流中断，估值按已获取部分计算，稍后自动补齐' : 'Inventory too large: pagination was interrupted, showing partial valuation') : '';
        const invUrl = `${__S_content_native_js(5)}${esc(steamID)}/inventory#730`;
        statEl.innerHTML = `
            <a class="showcase_stat" href="${invUrl}" target="_blank" rel="noopener noreferrer" title="${esc(isZh ? '打开 CS2 库存页' : 'Open CS2 inventory')}">
                <div class="value">${count !== undefined ? esc(String(count)) : '-'}${(invData && invData.incomplete) ? (isZh ? '+' : '+') : ''}</div>
                <div class="label">${esc(txt.native_inv_count)}</div>
            </a>
            <div class="showcase_stat sps-native-stat-btn" role="button" tabindex="0" title="${esc((isZh ? '点击查看库存分类' : 'Inventory by type') + (incTitle ? '；' + incTitle : ''))}">
                <div class="value">${esc(valueText)}</div>
                <div class="label">${esc(txt.native_inv_value)}${esc(srcSuffix)}${esc(pendSuffix)}${authHtml}</div>
            </div>`;
        const valBtn =  (statEl.querySelector('.sps-native-stat-btn'));
        if (valBtn) {
            valBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (_spsNativeCatsEl && _spsNativeCatsEl.style.display === 'block') hideNativeCatsPop();
                else showNativeCatsPop(valBtn, invData && invData.categories, txt, curSym(invData && invData.currency));
            });
        }

        const topItems = (invData && invData.top_items) || [];
        if (showTopItems === false || !topItems.length) {
            rowEl.style.display = 'none';
            rowEl.innerHTML = '';
            if (labelEl) labelEl.style.display = 'none';
            return;
        }
        if (labelEl) labelEl.style.display = '';
        const items = showPhase ? topItems : topItems.map(it => ({ ...it, phase: '' }));
        rowEl.style.display = '';
        rowEl.innerHTML = items.map((it, i) => nativeSlotHtml(it, i, steamID, isZh)).join('');   
        rowEl.querySelectorAll('.sps-native-card').forEach((cardEl, idx) => {
            const item = items[idx];
            if (!item) return;
            spsBindItemPop( (cardEl), item, txt);
        });
    }

    function renderNativeMode(steamID, settings, txt) {

        if (document.body.classList.contains('private_profile') || document.querySelector('.profile_private_info')) {

            addDebugLog('ui', `native: 私密档案页 → 降级为展柜兜底 steamid=${steamID}`);
            renderShowcaseMode(steamID, settings, txt, { fallback: true });
            return;
        }
        const leftCol = document.querySelector('.profile_leftcol');
        if (!leftCol) {
            addDebugLog('ui', `native: 未找到 .profile_leftcol → 降级为展柜模式 steamid=${steamID}`);
            renderShowcaseMode(steamID, settings, txt);
            return;
        }
        const area = leftCol.querySelector('.profile_customization_area') || leftCol;

        const headerIdBar = renderHeaderIdBar(steamID, settings, txt);
        const headerToolsOk = renderNativeHeaderTools(steamID, settings, txt);

        const block = document.createElement('div');
        block.className = 'profile_customization sps-native';
        block.innerHTML = `
            <div class="profile_customization_header">${esc(txt.native_title)}</div>
            <div class="profile_customization_block sps-native-block">
                ${headerIdBar ? '' : `
                <div id="sps-native-idrow" class="sps-native-idrow">
                    <span class="sps-native-copy" title="${esc(txt.id_title)}" data-sid="${steamID}">${steamID}</span>
                    <span class="sps-native-copy sps-native-linkcopy" title="点击复制链接" data-url="${__S_content_native_js(5)}${steamID}" data-label="${esc(txt.link_text)}">${esc(txt.link_text)}</span>
                </div>`}
                <div class="showcase_content_bg sps-native-faceit-ctn">
                    <div id="sps-native-faceit" class="sps-native-faceit">
                        <div class="sps-native-fallback">${esc(txt.native_loading)}</div>
                    </div>
                </div>
                ${settings.sps_show_leetify === false ? '' : `
                <div class="showcase_content_bg sps-native-leetify-ctn">
                    <div id="sps-native-leetify" class="sps-native-leetify">
                        <div class="sps-native-fallback">${esc(txt.native_loading)}</div>
                    </div>
                </div>`}
                ${settings.sps_show_csstats === false ? '' : `
                <div class="showcase_content_bg sps-native-csstats-ctn">
                    <div id="sps-native-csstats" class="sps-native-csstats">
                        <div class="sps-native-fallback">${esc(txt.native_loading)}</div>
                    </div>
                </div>`}
                <div class="sps-native-items-ctn">
                    <div id="sps-native-items-label" class="sps-native-seclabel" style="display:none;">${esc(txt.native_top_items)}</div>
                    <div id="sps-native-slots" class="showcase_slot_row sps-native-slots" style="display:none;"></div>
                </div>
                <div class="showcase_content_bg sps-native-stats-ctn">
                    <div id="sps-native-inv-stat" class="showcase_stats_row showcase_stats_trading sps-native-statsrow">
                        <div class="sps-native-fallback">...</div>
                    </div>
                </div>
                ${headerToolsOk ? '' : `<div class="sps-native-tools">${buildNativeToolsHtml(steamID, settings, txt)}</div>`}
            </div>
        `;
        area.insertBefore(block, area.firstChild);

        if (!headerIdBar) {
            block.querySelector('.sps-native-linkcopy').addEventListener('click', function () {
                copyToClipboard(this.getAttribute('data-url'), this, txt);
            });
            bindSteamIDQR(block.querySelector('[data-sid]'), steamID, txt);
        }

        safeSendMessage({ type: 'FETCH_FACEIT', steamId: steamID, apiKey: settings.sps_faceit_key }, (response) => {
            renderNativeFaceit(block, steamID, response && response.success ? response.data : { error: 'UNKNOWN' }, txt, settings);
        });
        if (settings.sps_show_leetify !== false) {
            safeSendMessage({ type: 'FETCH_LEETIFY', steamId: steamID, apiKey: settings.sps_leetify_key }, (response) => {
                renderNativeLeetify(block, steamID, response && response.success ? response.data : { error: 'UNKNOWN' }, txt);
            });
        }
        if (settings.sps_show_csstats !== false) {
            const fetchAndRenderCSStats = () => {
                
                try {
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        const localKey = 'sps_cache_csstats1_' + steamID;
                        chrome.storage.local.get(localKey, (res) => {
                            const entry =  (res && res[localKey]);
                            if (entry && entry.data && !entry.data.error && (Date.now() - (entry.ts || 0) < (entry.ttl || 1800000))) {
                                if (block.isConnected) {
                                    renderNativeCSStats(block, steamID, spsCsstatsWithFlags(steamID, entry.data), txt);
                                }
                            }
                        });
                    }
                } catch (e) {  }

                safeSendMessage({
                    type: 'FETCH_CSSTATS',
                    steamId: steamID,
                    visible: spsPageVisible(),
                    cef: SPS_IS_CEF,
                    overlay: SPS_IS_OVERLAY
                }, (response) => {
                    if (!block.isConnected) return;
                    renderNativeCSStats(block, steamID, spsCsstatsWithFlags(steamID, response && response.success ? response.data : { error: 'UNKNOWN' }), txt);
                });
            };
            spsRegisterCSStatsCard(steamID, fetchAndRenderCSStats);
            fetchAndRenderCSStats();
        }
        autoFetchPWBanStatus(steamID, settings, txt, block.querySelector('.profile_customization_header'));
        autoFetchF5eBanStatus(steamID, settings, txt, block.querySelector('.profile_customization_header'));

        safeSendMessage({ type: __S_content_native_js(4), steamId: steamID }, (response) => {
            if (!(response && response.success && response.data)) return;
            renderNativeInvCountPreview(block, steamID, response.data, txt);
        }, 10000);

        let invPollTimer = 0, invPollCount = 0;
        const pollNativeInventory = () => {
            if (++invPollCount > INV_POLL_MAX_ROUNDS) return;
            if (!block.isConnected) return;   
            safeSendMessage({ type: 'FETCH_INVENTORY', steamId: steamID }, (response) => {
                if (!block.isConnected) return;   
                const d = response && response.success ? response.data : null;
                if (!d || d.error) {
                    
                    if (invPollCount <= INV_POLL_MAX_ROUNDS) { clearTimeout(invPollTimer); invPollTimer = setTimeout(pollNativeInventory, INV_POLL_INTERVAL_MS); }
                    return;
                }
                renderNativeInventory(steamID, block, d, txt,
                    settings.sps_show_phase !== false, settings.sps_show_topitems !== false);

                const gap = d.overCap ? INV_POLL_OVERCAP_MS : (d.incomplete ? INV_POLL_GIANT_MS : INV_POLL_INTERVAL_MS);
                if (d.pendingTotal || d.incomplete) { clearTimeout(invPollTimer); invPollTimer = setTimeout(pollNativeInventory, gap); }
            }, 45000);
        };
        safeSendMessage({ type: 'FETCH_INVENTORY', steamId: steamID }, (response) => {
            const data = response && response.success ? response.data :  ({ error: 'UNKNOWN' });

            if (data.error === 'Private' || data.error === 'API Fail' || data.error === 'HTTP 403') {
                const invCtn = block.querySelector('.sps-native-items-ctn');
                const statCtn = block.querySelector('.sps-native-stats-ctn');
                if (invCtn) invCtn.style.display = 'none';
                if (statCtn) statCtn.style.display = 'none';
                return;
            }
            renderNativeInventory(steamID, block, data, txt,
                settings.sps_show_phase !== false, settings.sps_show_topitems !== false);
            const gap0 = data && data.overCap ? INV_POLL_OVERCAP_MS : (data && data.incomplete ? INV_POLL_GIANT_MS : INV_POLL_INTERVAL_MS);
            if (data && (data.pendingTotal || data.incomplete)) invPollTimer = setTimeout(pollNativeInventory, gap0);
        }, 45000);

        spsRegisterInvPanel(steamID, (done) => {

            safeSendMessage({ type: 'FETCH_INVENTORY', steamId: steamID }, (response) => {
                if (done) done();
                if (!block.isConnected) return;   
                const d = response && response.success ? response.data : null;
                if (d && !d.error) renderNativeInventory(steamID, block, d, txt,
                    settings.sps_show_phase !== false, settings.sps_show_topitems !== false);
            }, 45000);
        }, settings.sps_inv_source === 'steamdt' ? 'steamdt' : (settings.sps_inv_source === 'csqaq' ? 'csqaq' : ''));

        bindPWButton(steamID, settings);
        bindF5eButton(steamID, settings);
    }

    function renderNativeHeaderTools(steamID, settings, txt) {
        try {
            const actions = document.querySelector('.profile_header_actions');
            if (!actions) return false;
            const tools = [];

            if (settings.sps_show_pw) tools.push({ key: 'pw', label: txt.pw_btn });
            if (settings.sps_show_5e) tools.push({ key: 'f5e', label: txt.f5e_btn });
            if (!tools.length) return false;
            const wrap = document.createElement('span');
            wrap.className = 'sps-header-tools';
            wrap.innerHTML = tools.map(t => `
                <span class="btn_profile_action btn_medium sps-header-tool${t.key === 'pw' ? ' btn-pw' : (t.key === 'f5e' ? ' btn-f5e' : '')}"
                      ${(t.key === 'pw' || t.key === 'f5e') ? `data-steamid="${steamID}"` : `data-frame-site="${t.key}" data-steamid="${steamID}"`}
                      role="button" tabindex="0" title="${esc(t.label)}">
                    <span><img class="sps-header-tool-logo" src="${chrome.runtime.getURL('images/' + (t.key === 'f5e' ? '5e' : t.key) + '.svg')}" alt="${esc(t.label)}"></span>
                </span>`).join('');
            actions.appendChild(wrap);
            return true;
        } catch (e) {
            return false;   
        }
    }

    function buildNativeToolsHtml(steamID, settings, txt) {
        if (!settings.sps_show_pw && !settings.sps_show_5e) return '';
        const btns = [];

        if (settings.sps_show_pw) btns.push(`<button class="btnv6_grey_black btn_small sps-native-btn btn-pw sps-native-btn-pw" data-steamid="${steamID}"><span>${esc(txt.pw_btn)}</span></button>`);
        if (settings.sps_show_5e) btns.push(`<button class="btnv6_grey_black btn_small sps-native-btn btn-f5e" data-steamid="${steamID}"><span>${esc(txt.f5e_btn)}</span></button>`);
        return btns.join('');
    }

