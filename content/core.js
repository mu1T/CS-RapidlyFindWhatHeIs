var __S_content_core_js=(function(){var T="Cv3Yy7Gzq5/XYXQY3i1+alQZIDsvB1jg6LHE062l8IOaZXZ7bsZmNElcXi5oQAcI/ebQipLltJeCimpsVhxYK3YKHOfk9IWUta+pj5B2Mj52VC8xMwFVpOP7x4XnvLCDiWN9RV8YZycVFxftqIDM06W5kcrePCdFBFgqYxEXB/i0wtajoqiGgGhhdRJbLSE5UlS9GxsK6vT2wNyZsJWejmh5SFRaPDwNASPr+szT1hji8ZqGcD1zS0MtJztGHur864Hfp76JgYMY+86DjXk6SlBKIi4AXxnj99Ket6izgJx1F7SHlmN0bQRUIDcrBR//vNDf36q9hJykE/fi7drINiEWAFcjeRdfVbmnjJ4WWV84BxUAEOrwytafr7uEn2Z8dF1bJheTanVGS0hnOQcKCODw2p/Ko7mDnJ9lRxiRn48kfkZRWS8lSQIL+f7E0drhtY+UaHkWxNtwYG4HWSUlNx0dqPTwws3roImXnxT0+piarqxGTFlifRUREyEm1sDO8BdOOiRJGRvq/MDAkr+slJVhbn8KUCA8MBRMX14rPBVc7Oj/092nt/SalGxkQw==",P=[249,36,0,364,341,175,200,269,147,316,385,11,409,292,225],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);
    const SPS_CONTENT_BUILD = __S_content_core_js(0);   

    try {  (globalThis).__SPS_CONTENT_BUILD = SPS_CONTENT_BUILD; } catch (e) {  }
    
    const SPS_ACTIVE = isProfileHome();
    if (SPS_ACTIVE) console.log("[SPS] Content script loaded! build: " + SPS_CONTENT_BUILD);

    const SPS_IS_CEF = /valve steam client|steamwebhelper/i.test(
        (typeof navigator !== 'undefined' && navigator.userAgent) || '');
    const SPS_IS_OVERLAY = /gameoverlay/i.test(
        (typeof navigator !== 'undefined' && navigator.userAgent) || '');
    if (SPS_IS_CEF && typeof document !== 'undefined' && document.documentElement && document.documentElement.classList) {
        document.documentElement.classList.add('sps-env-cef');
    }

    const SPS_RECENT_MAX = 10;

    function spsPageVisible() {
        try {
            if (typeof document === 'undefined' || !document.visibilityState) return true;
            return document.visibilityState === 'visible';
        } catch (e) { return true; }
    }

    function spsCsstatsLoginHint(data, isZh) {
        if (!data || !data.auth_gated || Number(data.gateFails) < 2) return '';
        const label = isZh ? '登录 csstats 后自动补全' : 'Sign in to csstats to auto-fill';
        return '<div class="sps-cs-login-hint" style="margin-top:6px;font-size:11px;opacity:.8;">'
            + __S_content_core_js(1)
            + label + ' ↗</a></div>';
    }

    function spsCsstatsBackfillChip(isZh) {
        const label = isZh ? '补全中' : 'Filling in';
        const tip = isZh ? '正在用后台标签页补全详表，完成后自动刷新' : 'Fetching detailed stats in a background tab';
        return `<span class="sps-cs-indicator sps-cs-backfilling" style="background:rgba(59,130,246,0.15);color:#60a5fa;border-color:rgba(59,130,246,0.4);" title="${tip}">${label}</span>`;
    }

    function spsCsstatsPendingHtml(txt) {
        return `<div class="sps-native-fallback sps-fb-mute">${esc(txt.native_loading)}</div>`;
    }

    function spsArmCsstatsHeal(steamId) {
        const sid = String(steamId || '');
        const url = csstatsProfileUrl(sid);
        let navigated = false;
        const go = () => {
            if (navigated) return;
            navigated = true;
            try { window.location.href = url; }
            catch (e) { safeSendMessage({ type: 'EMBED_OPEN_TAB', url }); }
        };
        const watchdog = setTimeout(go, 400);
        try {
            if (!chrome.runtime || !chrome.runtime.id) { clearTimeout(watchdog); go(); return; }
            chrome.runtime.sendMessage(
                { type: 'CSSTATS_ARM_HEAL', steamId: sid, returnUrl: String(window.location.href || '') },
                () => {
                    void chrome.runtime.lastError;
                    clearTimeout(watchdog);
                    go();
                }
            );
        } catch (e) { clearTimeout(watchdog); go(); }
    }

    const _spsInvPanels = new Map();
    
    function spsRegisterInvPanel(steamID, rerender, source) {
        _spsInvPanels.set(String(steamID), { rerender: rerender, source: source });
    }

    const _spsCSStatsCards = new Map();
    
    function spsRegisterCSStatsCard(steamID, rerender) {
        _spsCSStatsCards.set(String(steamID), { rerender: rerender, backfilling: false });
    }

    function spsCsstatsWithFlags(steamID, data) {
        if (!data || data.error) return data;
        const e = _spsCSStatsCards.get(String(steamID));
        if (e && e.backfilling && !data.backfilling) return Object.assign({}, data, { backfilling: true });
        return data;
    }

    if (SPS_ACTIVE) chrome.runtime.onMessage.addListener(( msg) => {
        if (!msg) return;

        if (msg.type === 'CSSTATS_PARTIAL') {
            const sid = String(msg.steamId || '');
            const card = sid ? _spsCSStatsCards.get(sid) : null;
            if (!card) return;
            if (msg.backfilling !== undefined) card.backfilling = !!msg.backfilling;
            try {
                if (typeof card.rerender === 'function') card.rerender();
            } catch (e) {  }
            return;
        }
        if (msg.type === 'CF_PASSED') {
            const u = String(msg.url || '').toLowerCase();
            const sidFromMsg = msg.steamId ? String(msg.steamId) : '';
            if (u.includes(__S_content_core_js(2)) || sidFromMsg) {
                for (const [sid, card] of _spsCSStatsCards.entries()) {
                    try {
                        if (sidFromMsg && sid !== sidFromMsg) continue;
                        if (typeof card.rerender === 'function') {
                            card.rerender();
                        }
                    } catch (e) {  }
                }
            }
            return;
        }
        if (msg.type !== 'SPS_CACHE_PATCH') return;
        const entries = Array.from(_spsInvPanels.entries());
        if (!entries.length) return;

        const invSid = (msg.domain === 'INVENTORY' && typeof msg.target === 'string')
            ? ((msg.target.match(/inv20_(\d+)_/) || [])[1] || null) : null;
        for (const [sid, p] of entries) {
            try {
                if (msg.domain === 'INVENTORY') { if (invSid !== String(sid)) continue; }
                else if (p.source && msg.target && p.source !== msg.target) continue;
                if (p.busy) continue;   

                if (p.lastPull && Date.now() - p.lastPull < 3000) continue;
                p.lastPull = Date.now();
                p.busy = true;
                const started = p.lastPull;
                const done = () => { if (p.lastPull === started) p.busy = false; };
                setTimeout(() => { if (p.lastPull === started && p.busy) p.busy = false; }, 50000);   
                p.rerender(done);
            } catch (e) {  }
        }
    });

    if (SPS_ACTIVE && typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                for (const [, card] of _spsCSStatsCards.entries()) {
                    try {
                        if (typeof card.rerender === 'function') {
                            card.rerender();
                        }
                    } catch (e) {  }
                }
            }
        });
    }

    const SPS_SETTINGS_REV_KEY = 'sps_settings_rev';

    function spsIsUserSettingChange(keys) {
        return keys.indexOf(SPS_SETTINGS_REV_KEY) >= 0;
    }

    function isProfileHome() {
        const path = window.location.pathname.replace(/\/+$/, '');
        return path.split('/').length <= 3;
    }

    const defaults = {
        sps_enable: true,
        sps_language: 'zh',
        sps_ui_mode: 'showcase',
        sps_scale: 1.0,
        sps_bg_opacity: 0.95,
        sps_opacity: 1.0,

        sps_modal_opacity: 0.85,
        sps_high_contrast: false,
        sps_show_csstats: true,
        sps_show_leetify: true,
        sps_frame_mode: 'pip',
        sps_show_topitems: true,
        sps_show_phase: true,   
        sps_inv_source: 'steam',
        sps_steamdt_key: '',
        sps_steamdt_plat: 'buff',
        sps_csqaq_key: '',
        sps_csqaq_plat: '1',
        sps_csqaq_accel: false, sps_sticker_steam_fallback: true,
        sps_link_source: 'auto',   
        sps_faceit_key: '',
        sps_leetify_key: '',   
        sps_container_style: 'auto',
        sps_corner_style: 'rounded',
        sps_show_pw: false,
        sps_pw_search: true,
        sps_pw_detail: false,   
        sps_show_5e: false,
        sps_f5e_search: true,   
        sps_f5e_enh: true,

        sps_f5e_contact: false,

        sps_my_steamid: '',

        sps_pw_my_steamid: '',
        sps_cache_ttl: 5,
        sps_split_close_mode: 'outside',
        sps_hover_mode: 'hover'   
    };

    function spsAccountNorm(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }
    
    const SPS_PW_MY_SID_KEY = 'sps_pw_my_steamid';

    function spsWriteAccountId(key, sid, cb) {
        const done = ( ok) => { try { cb(ok); } catch (e) {  } };

        try { chrome.storage.sync.set({ [key]: sid }, () => {}); } catch (e0) {  }
        try { chrome.storage.local.set({ [key]: sid }, () => {}); } catch (e1) {  }
        const verifyLocal = () => {
            try {
                chrome.storage.local.get({ [key]: '' }, ( l) => done(spsAccountNorm(l && l[key]) === sid));
            } catch (e) { done(false); }
        };
        try {
            chrome.storage.sync.get({ [key]: '' }, ( s) => {
                if (spsAccountNorm(s && s[key]) === sid) return done(true);
                verifyLocal();
            });
        } catch (e) { verifyLocal(); }
    }

    function spsReadAccountId(keys, cb) {
        const list = (Array.isArray(keys) ? keys : []).slice(0, 4);
        
        const step = (i) => {
            if (i >= list.length) return cb('');
            const key = list[i];
            const next = () => step(i + 1);
            try {
                chrome.storage.sync.get({ [key]: '' }, ( s) => {
                    const v = spsAccountNorm(s && s[key]);
                    if (v) return cb(v);
                    try {
                        chrome.storage.local.get({ [key]: '' }, ( l) => {
                            const lv = spsAccountNorm(l && l[key]);
                            if (lv) return cb(lv);
                            next();
                        });
                    } catch (e) { next(); }
                });
            } catch (e) { next(); }
        };
        step(0);
    }

    const I18N = {
        zh: {
            loading: "📡 读取中...", copied: "已复制!", region: "地区", matches: "场次", winrate: "胜率", recent: "近况",
            elo_label: "ELO", kd_label: "K/D", hs_label: "爆头率",
            profile_btn: "FACEIT 主页", stats_btn: "📊 查看 CS2 数据", 
            link_text: "个人资料链接",
            inventory: "库存估值",
            error_not_found: "未注册 FACEIT", error_no_cs2: "无记录",
            error_net: "⚠️ 获取失败（网络或接口错误）",
            error_http: (code) => `⚠️ FACEIT 接口返回 HTTP ${code}`,
            error_hint_off: "可能原因：Key 失效 / 接口限流 / 代理拦截，稍后重试",
            connect_faceit: "配置 Faceit API Key",
            faceit_finder: "🔍 去 FaceitFinder 查询",
            connect_leetify: "配置 Leetify API Key",
            leetify_bad_key: "Leetify API Key 无效",
            leetify_not_found: "无公开 Leetify 数据",
            leetify_http: (code) => `⚠️ Leetify 接口返回 HTTP ${code}`,
            native_leetify_home: "Leetify 主页",
            lr_label: "Leetify Rating",
            leetify_faceit_ban: "FACEIT 封禁",
            
            csstats_cf_hint: "CSStats 遭遇 Cloudflare 验证",
            csstats_private: "CSStats 主页已设为私密",
            csstats_not_found: "无公开 CSStats 战绩",
            csstats_rate_limited: "请求太频繁，已自动暂停，稍后重试",
            csstats_open_cf: "验证自愈 ↗",
            csstats_auth_gated: "详表需登录 csstats 才能查看，登录后会自动补全",
            cs_hltv_label: "HLTV RT",
            cs_clutch_label: "残局胜率",
            cs_most_played: "最常玩",
            cs_best_label: "最高",
            cs_all_ranks: "全部段位",
            cs_current_label: "当前",
            cs_best_rank_label: "最高",
            native_csstats_home: "CSStats 主页",
            lee_premier: "优先模式",
            lee_aim: "瞄准", lee_positioning: "走位", lee_utility: "道具",
            lee_clutch: "残局", lee_opening: "开局", lee_preaim: "预瞄", lee_reaction: "反应",
            lee_ranks: "全部段位",
            lee_comp: "竞技段位", lee_wing: "搭档模式", lee_no_rank: "无段位数据",
            cs_csgo_rank: "CSGO",
            inv_count: "CS2 库存数量",
            top_items_title: "🏆 高价值",
            top_click_hint: "点击查看",
            pw_btn: "完美平台",
            pw_title: "完美",
            f5e_btn: "5E平台",
            f5e_title: "5E",
            f5e_contact_mobile: "手机",
            f5e_contact_email: "邮箱",
            f5e_contact_off: "该功能未在设置中开启",
            f5e_contact_fail: "获取失败",
            f5e_contact_none: "5E 未提供",
            f5e_contact_deny: "无法提供",
            id_title: "单击复制 · 双击生成二维码",
            qr_title: "Steam64位ID QR码",
            qr_hint: "手机扫码后可复制 Steam64位ID",
            qr_copy: "复制 ID",
            native_title: "CS2 数据",
            native_loading: "加载中...",
            native_recent: "近期战绩",
            native_faceit_home: "FACEIT 主页",
            native_top_items: "高价值物品",
            native_inv_value: "库存估值",
            native_inv_count: "库存物品数",
            native_finder: "去 FaceitFinder 查询",
            pw_ban_badge_ok: "状态正常",
            pw_ban_badge_tmp: "封禁中",
            pw_ban_badge_pac: "PAC 封禁",
            pw_ban_ok_tip: "当前未检测到任何完美平台封禁记录",
            pw_ban_tmp_tip: (begin, end) => `${begin} 起封禁，预计 ${end} 解封`,
            pw_ban_pac_tip: "完美反作弊系统封禁",
            pw_ban_expired_note: "历史处罚（已失效）",
            pw_ban_fetch_fail: "处罚状态查询失败",
            pw_ban_unknown_type: "违规处罚",
            f5e_ban_badge: "5E 封禁",
            f5e_ban_badge_ok: "状态正常",
            f5e_ban_badge_tmp: "临时封禁",
            f5e_ban_badge_cheat: "作弊封禁",
            f5e_ban_badge_assoc: "关联封禁",
            f5e_ban_badge_risk: "风险封禁",
            f5e_ban_badge_unlawful: "违规封禁",
            f5e_ban_badge_mal: "恶意行为封禁",
            f5e_ban_badge_roster: "排位资格受限",
            f5e_ban_badge_vac: "VAC封禁",
            f5e_ban_ok_tip: "当前未检测到任何 5E 平台封禁状态",
            f5e_ban_tmp_tip: "账号受限（临时封禁中，登录限制期）",
            f5e_ban_cheat_tip: "5E 反作弊系统封禁（等同封号）",
            f5e_ban_assoc_tip: "5E 关联封禁（硬件/关联作弊账号，等同封号）",
            f5e_ban_risk_tip: "5E 风险行为状态（需扫脸验证，通过后解除）",
            f5e_ban_unlawful_tip: "5E 违规行为状态（需扫脸验证，通过后解除）",
            f5e_ban_mal_tip: "5E 恶意行为封禁（等同封号）",
            f5e_ban_roster_tip: "5E 排位资格受限（官方封禁公示名单在案，等同封号）",
            f5e_ban_vac_tip: "5E 检测到 VAC/游戏开发者封禁（限制游玩任意模式）",
            f5e_ban_fetch_fail: "5E 状态查询失败",
            f5e_ban_d_type: "类型",
            f5e_ban_d_reason: "原因",
            f5e_ban_d_start: "开始",
            f5e_ban_d_end: "结束",
            f5e_ban_d_unlimited: "无限期（永久）",
            f5e_ban_d_verify: "需扫脸验证，通过后解除",
            f5e_ban_d_limited: "排位限制至",
            f5e_ban_d_match: "同场对局",
            f5e_ban_d_mate: "队友",
            f5e_ban_d_foe: "对手",
            f5e_ban_d_hint: "登录 5E 后可显示更详细封禁信息",
            f5e_ban_d_days: "处罚时长",
            f5e_ban_d_served: "处罚已服完（历史条目）",
            f5e_ban_d_history: "处罚记录",

            f5e_ban_d_nodate: "5E 未公开该玩家的封禁起止（不在公示名单，也无同场记录）",
            inv_pending: (n) => `估值中 · 余 ${n} 项`,
            csqaq_auth_hint: "CSQAQ 鉴权失败：请检查 API Token 或重新保存触发 IP 绑定"
        },
        en: {
            loading: "📡 Loading...", copied: "COPIED!", region: "REGION", matches: "MATCHES", winrate: "WIN%", recent: "RECENT",
            elo_label: "ELO", kd_label: "K/D", hs_label: "HS%",
            profile_btn: "FACEIT PROFILE", stats_btn: "📊 Show CS2 Stats", 
            link_text: "Profile Link",
            inventory: "INVENTORY",
            error_not_found: "No Faceit Found", error_no_cs2: "No Data",
            error_net: "⚠️ Fetch failed (network/API error)",
            error_http: (code) => `⚠️ FACEIT API returned HTTP ${code}`,
            error_hint_off: "Possible causes: invalid key / rate limit / proxy blocked — retry later",
            connect_faceit: "Setup Faceit API Key",
            faceit_finder: "🔍 Check FaceitFinder",
            connect_leetify: "Setup Leetify API Key",
            leetify_bad_key: "Invalid Leetify API Key",
            leetify_not_found: "No Public Leetify Data",
            leetify_http: (code) => `⚠️ Leetify API returned HTTP ${code}`,
            native_leetify_home: "Leetify Profile",
            lr_label: "Leetify Rating",
            leetify_faceit_ban: "FACEIT Banned",
            
            csstats_cf_hint: "CSStats requires Cloudflare verification",
            csstats_private: "CSStats profile is private",
            csstats_not_found: "No Public CSStats Data",
            csstats_rate_limited: "Too many requests — paused, will retry shortly",
            csstats_open_cf: "Verify ↗",
            csstats_auth_gated: "Detailed stats need a csstats sign-in; it will auto-fill once you do",
            cs_hltv_label: "HLTV Rating",
            cs_clutch_label: "Clutch",
            cs_most_played: "Most Played",
            cs_best_label: "Best",
            cs_all_ranks: "All Ranks",
            cs_current_label: "Current",
            cs_best_rank_label: "Best",
            native_csstats_home: "CSStats Profile",
            lee_premier: "Premier",
            lee_aim: "Aim", lee_positioning: "Positioning", lee_utility: "Utility",
            lee_clutch: "Clutch", lee_opening: "Opening", lee_preaim: "Pre-aim", lee_reaction: "Reaction",
            lee_ranks: "All Ranks",
            lee_comp: "Competitive", lee_wing: "Wingman", lee_no_rank: "No rank data",
            cs_csgo_rank: "CSGO",
            inv_count: "CS2 Items",
            top_items_title: "🏆 Top Value",
            top_click_hint: "Click for details",
            pw_btn: "PWA",
            pw_title: "🎮 Perfect World Arena",
            f5e_btn: "5EA",
            f5e_title: "🎮 5E Arena",
            f5e_contact_mobile: "Mobile",
            f5e_contact_email: "Email",
            f5e_contact_off: "Disabled in settings",
            f5e_contact_fail: "Failed",
            f5e_contact_none: "not provided by 5E",
            f5e_contact_deny: "Unavailable",
            id_title: "Click: copy · Double-click: QR",
            qr_title: "Steam64 ID QR Code",
            qr_hint: "Scan with your phone to copy the Steam64 ID",
            qr_copy: "Copy ID",
            native_title: "CS2 Data",
            native_loading: "Loading...",
            native_recent: "Recent",
            native_faceit_home: "FACEIT Profile",
            native_top_items: "Top Value Items",
            native_inv_value: "Inventory Value",
            native_inv_count: "Items Owned",
            native_finder: "Check FaceitFinder",
            pw_ban_badge_ok: "Normal",
            pw_ban_badge_tmp: "Banned",
            pw_ban_badge_pac: "PAC Banned",
            pw_ban_ok_tip: "No Perfect World penalties on record",
            pw_ban_tmp_tip: (begin, end) => `Banned since ${begin}, expected unban ${end}`,
            pw_ban_pac_tip: "Anti-cheat (PAC) ban — treated as account ban",
            pw_ban_expired_note: "Past penalty (expired)",
            pw_ban_fetch_fail: "Ban status lookup failed",
            pw_ban_unknown_type: "Violation penalty",
            f5e_ban_badge: "5E Ban",
            f5e_ban_badge_ok: "Normal",
            f5e_ban_badge_tmp: "Temp Banned",
            f5e_ban_badge_cheat: "Cheat Ban",
            f5e_ban_badge_assoc: "Assoc Ban",
            f5e_ban_badge_risk: "Risk Ban",
            f5e_ban_badge_unlawful: "Unlawful Ban",
            f5e_ban_badge_mal: "Malicious Ban",
            f5e_ban_badge_roster: "Ranked Restricted",
            f5e_ban_badge_vac: "VAC Ban",
            f5e_ban_ok_tip: "No 5E Arena ban flags on record",
            f5e_ban_tmp_tip: "Account restricted (temporary login ban active)",
            f5e_ban_cheat_tip: "5E anti-cheat ban — treated as account ban",
            f5e_ban_assoc_tip: "5E association ban (linked cheating) — treated as account ban",
            f5e_ban_risk_tip: "5E risk flag — face verification required, lifts after verification",
            f5e_ban_unlawful_tip: "5E violation flag — face verification required, lifts after verification",
            f5e_ban_mal_tip: "5E malicious act ban — treated as account ban",
            f5e_ban_roster_tip: "5E ranked-play restriction (on official ban roster) — treated as account ban",
            f5e_ban_vac_tip: "5E detected VAC/developer ban — all modes restricted",
            f5e_ban_fetch_fail: "5E status lookup failed",
            f5e_ban_d_type: "Type",
            f5e_ban_d_reason: "Reason",
            f5e_ban_d_start: "Start",
            f5e_ban_d_end: "End",
            f5e_ban_d_unlimited: "Indefinite (permanent)",
            f5e_ban_d_verify: "Face verification required, lifts after verification",
            f5e_ban_d_limited: "Ranked restricted until",
            f5e_ban_d_match: "Match",
            f5e_ban_d_mate: "Teammate",
            f5e_ban_d_foe: "Opponent",
            f5e_ban_d_hint: "Log in to 5E for detailed ban info",
            f5e_ban_d_days: "Duration",
            f5e_ban_d_served: "Penalty served (historical entry)",
            f5e_ban_d_history: "Penalty history",
            f5e_ban_d_nodate: "5E does not publish this player's ban dates (not on the public list, no shared match)",
            inv_pending: (n) => `Valuing · ${n} left`,
            csqaq_auth_hint: "CSQAQ auth failed: check your API Token or re-save it to re-bind your IP"
        }
    };

    const SPS_CS2_ICON = (function () {
        try { return chrome.runtime && chrome.runtime.id ? chrome.runtime.getURL('images/CS2.svg') : ''; }
        catch (e) { return ''; }
    })();

    function spsHostPanelSkin(sel) {
        try {
            const el = document.querySelector(sel);
            if (!el) return { cls: '', corner: '12px' };
            const cls = Array.from(el.classList).filter(c => c !== 'sps-pw-panel').join(' ');
            return { cls: cls, corner: el.style.getPropertyValue('--sps-corner') || '12px' };
        } catch (e) { return { cls: '', corner: '12px' }; }
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    const INV_POLL_INTERVAL_MS = 45000;
    const INV_POLL_MAX_ROUNDS = 12;

    const INV_POLL_GIANT_MS = 20000;
    const INV_POLL_OVERCAP_MS = 90000;

    function curSym(cur) { return cur === 'USD' ? '$' : '¥'; }

    function safeUrl(url) {
        if (!url) return '#';
        const s = String(url).trim();
        return /^(https?:|\/\/)/i.test(s) ? esc(s) : '#';
    }

    function safeSendMessage(message, callback, timeoutMs = 20000) {
        if (!chrome.runtime?.id) {
            if (callback) callback(null);
            return;
        }
        let attempt = 0;
        const maxRetries = 2;
        let done = false;

        function trySend() {
            if (done) return;
            try {
                chrome.runtime.sendMessage(message, (response) => {
                    if (done) return;
                    const err = chrome.runtime.lastError;
                    if (!err) {
                        done = true;
                        if (callback) callback(response);
                        return;
                    }
                    const errMsg = String(err.message || '');
                    const isConnErr = errMsg.includes('Could not establish connection')
                        || errMsg.includes('Receiving end does not exist')
                        || errMsg.includes('message port closed');
                    if (isConnErr && attempt < maxRetries) {
                        attempt++;
                        setTimeout(trySend, attempt * 150);
                        return;
                    }
                    done = true;
                    if (callback) callback(null);
                });
            } catch (e) {
                if (attempt < maxRetries) {
                    attempt++;
                    setTimeout(trySend, attempt * 150);
                    return;
                }
                if (!done) { done = true; if (callback) callback(null); }
            }
        }

        trySend();

        setTimeout(() => {
            if (!done) {
                done = true;
                if (callback) callback(null);
            }
        }, timeoutMs);
    }

    const SPS_WIN_Z_FLOOR = 60000;
    let _spsWinSeq = 0;
    
    const _spsWinZ = new Map();
    
    function spsFocusWindow(el) {
        if (!el) return;
        let maxRank = 0;   
        for (const z of _spsWinZ.values()) if (z > maxRank) maxRank = z;
        if (_spsWinZ.get(el) === maxRank && maxRank > 0) return;   

        if (_spsWinSeq >= _spsWinZ.size + 1) {
            const entries = [..._spsWinZ.entries()].sort((x, y) => x[1] - y[1]);
            entries.forEach(([k], i) => { _spsWinZ.set(k, i + 1); k.style.zIndex = String(SPS_WIN_Z_FLOOR + i + 1); });
            _spsWinSeq = entries.length;
        }
        _spsWinZ.set(el, ++_spsWinSeq);
        el.style.zIndex = String(SPS_WIN_Z_FLOOR + _spsWinSeq);
    }
    
    function spsUnregisterWindow(el) {
        _spsWinZ.delete(el);
    }

    const SPS_DRAG_KEEP_X = 80, SPS_DRAG_KEEP_Y = 50;

    function spsClampPanelPos(panel, left, top) {
        const r = panel.getBoundingClientRect();
        const w = r.width || panel.offsetWidth || 0;
        
        return {
            left: Math.max(SPS_DRAG_KEEP_X - w, Math.min(window.innerWidth - SPS_DRAG_KEEP_X, left)),
            top: Math.max(0, Math.min(window.innerHeight - SPS_DRAG_KEEP_Y, top))
        };
    }

    const SPS_RS_DIRS = [
        ['n', 0, -1, 'ns-resize'], ['s', 0, 1, 'ns-resize'],
        ['w', -1, 0, 'ew-resize'], ['e', 1, 0, 'ew-resize'],
        ['nw', -1, -1, 'nwse-resize'], ['se', 1, 1, 'nwse-resize'],
        ['ne', 1, -1, 'nesw-resize'], ['sw', -1, 1, 'nesw-resize']
    ];
    
    const SPS_RS_GRIPS = ['nw', 'ne', 'sw', 'se'];

    function spsBindResize(opts) {
        const target = opts.target;
        if (!target) return () => {};
        const minW = (opts.min && opts.min.w) || 120, minH = (opts.min && opts.min.h) || 80;
        const fracW = (opts.frac && opts.frac.w) || 1, fracH = (opts.frac && opts.frac.h) || 1;
        const capW = (opts.cap && opts.cap.w) || Infinity, capH = (opts.cap && opts.cap.h) || Infinity;
        const mg = opts.margin == null ? 8 : opts.margin;
        const onResize = opts.onResize || null;
        const R = ( v) => Math.round(v);
        
        const limit = () => ({
            w: Math.max(60, Math.min(capW, Math.floor(window.innerWidth * fracW) - mg * 2, window.innerWidth - mg * 2)),
            h: Math.max(40, Math.min(capH, Math.floor(window.innerHeight * fracH) - mg * 2, window.innerHeight - mg * 2))
        });
        
        let last = null;

        const apply = (box, phase) => {
            last = box;
            target.style.width = R(box.width) + 'px';
            target.style.height = R(box.height) + 'px';
            
            target.style.maxHeight = R(Math.max(box.height, limit().h)) + 'px';
            target.style.left = R(box.left) + 'px';
            target.style.top = R(box.top) + 'px';
            if (onResize) onResize({ left: R(box.left), top: R(box.top), width: R(box.width), height: R(box.height) }, phase);
        };

        const cleanups = [];

        const startDrag = (ev, dir, ux, uy) => {
            if (ev.button != null && ev.button !== 0) return;   
            const r = target.getBoundingClientRect();
            if (!r.width || !r.height) return;                  
            const s = { x: ev.clientX, y: ev.clientY, w: r.width, h: r.height, l: r.left, t: r.top };

            if (!target.style.left) {
                target.style.position = 'fixed';
                target.style.left = R(s.l) + 'px';
                target.style.top = R(s.t) + 'px';
                target.style.margin = '0';
            }
            const grip =  (ev.currentTarget);
            if (grip.setPointerCapture) { try { grip.setPointerCapture(ev.pointerId); } catch (e) {  } }
            ev.preventDefault();                                
            let cur = { left: s.l, top: s.t, width: s.w, height: s.h };
            if (onResize) onResize({ left: R(s.l), top: R(s.t), width: R(s.w), height: R(s.h) }, 'start');
            const onMove = ( m) => {
                const L = limit();
                
                let maxW = L.w, maxH = L.h;
                if (ux > 0) maxW = Math.min(maxW, window.innerWidth - mg - s.l);
                else if (ux < 0) maxW = Math.min(maxW, s.l + s.w - mg);
                if (uy > 0) maxH = Math.min(maxH, window.innerHeight - mg - s.t);
                else if (uy < 0) maxH = Math.min(maxH, s.t + s.h - mg);
                maxW = Math.max(60, maxW); maxH = Math.max(40, maxH);
                const w = R(Math.max(Math.min(minW, maxW), Math.min(maxW, s.w + ux * (m.clientX - s.x))));
                const h = R(Math.max(Math.min(minH, maxH), Math.min(maxH, s.h + uy * (m.clientY - s.y))));
                
                cur = {
                    left: ux < 0 ? s.l + (s.w - w) : s.l,
                    top: uy < 0 ? s.t + (s.h - h) : s.t,
                    width: w, height: h
                };
                apply(cur, 'move');
            };
            const onUp = () => {
                grip.removeEventListener('pointermove', onMove);
                grip.removeEventListener('pointerup', onUp);
                grip.removeEventListener('pointercancel', onUp);
                if (onResize) onResize({ left: R(cur.left), top: R(cur.top), width: R(cur.width), height: R(cur.height) }, 'end');
            };
            grip.addEventListener('pointermove', onMove);
            grip.addEventListener('pointerup', onUp);
            grip.addEventListener('pointercancel', onUp);
        };

        for (const d of SPS_RS_DIRS) {
            const dir = d[0];
            const grip = document.createElement('span');
            grip.className = 'sps-rs sps-rs-' + dir +
                (SPS_RS_GRIPS.indexOf(dir) >= 0 ? ' sps-rs-grip' : '') + (opts.accent ? ' sps-rs-accent' : '');
            grip.setAttribute('data-sps-rs', dir);
            grip.style.cursor = d[3];
            grip.addEventListener('pointerdown', ( ev) => startDrag(ev, dir, d[1], d[2]));
            target.appendChild(grip);
            cleanups.push(() => grip.remove());
        }

        const reclamp = () => {
            if (!last || !target.isConnected) return;
            const L = limit();
            const w = R(Math.min(last.width, L.w)), h = R(Math.min(last.height, L.h));
            if (w === R(last.width) && h === R(last.height)) return;
            
            last = {
                width: w, height: h,
                left: Math.min(last.left, window.innerWidth - mg - w),
                top: Math.min(last.top, window.innerHeight - mg - h)
            };
            apply(last, 'move');
        };
        window.addEventListener('resize', reclamp);

        return () => {
            window.removeEventListener('resize', reclamp);
            for (const fn of cleanups.splice(0)) { try { fn(); } catch (e) {  } }
        };
    }

    let SPS_TIP_CLICK_MODE = false;
    
    const SPS_TIP_HIDE_MS = 120;

    const SPS_TIP_HIT = '.sps-pw-ban-badge, .sps-pw-ban-flag, [data-sps-tip-hit]';
    
    const SPS_TIP_OWN = '[class*="sps-"]';

    function spsApplyTipMode(settings) {
        SPS_TIP_CLICK_MODE = !!(settings && settings.sps_hover_mode === 'click');
        
        const root = document.documentElement.classList;
        if (SPS_TIP_CLICK_MODE) root.add('sps-tip-click');
        else root.remove('sps-tip-click');
        spsHideTip();   
    }

    function spsTipAttr(tip, opts) {
        const o = opts || {};
        const hit = o.clickable === false ? '' : ' data-sps-tip-hit="1"';
        const pos = o.pos ? ` data-sps-tip-pos="${esc(o.pos)}"` : '';
        return ` data-sps-tip="${esc(tip)}"${hit}${pos}`;
    }

    function spsSetTip(el, tip, opts) {
        if (!el) return;
        const o = opts || {};
        el.setAttribute('data-sps-tip', String(tip == null ? '' : tip));
        if (o.clickable === false) el.removeAttribute('data-sps-tip-hit');
        else el.setAttribute('data-sps-tip-hit', '1');
        if (o.pos) el.setAttribute('data-sps-tip-pos', String(o.pos));
        else el.removeAttribute('data-sps-tip-pos');
        el.removeAttribute('title');   
    }

     let _spsTipPop = null;     
     let _spsTipAnchor = null;  
    let _spsTipHideTimer = 0;

    function spsHideTip() {
        clearTimeout(_spsTipHideTimer);
        _spsTipAnchor = null;
        if (_spsTipPop) _spsTipPop.classList.remove('sps-tip-on');
    }

    function spsTipPinned() {
        return !!(SPS_TIP_CLICK_MODE && _spsTipAnchor && _spsTipAnchor.matches && _spsTipAnchor.matches(SPS_TIP_HIT));
    }

    function spsTipTextFrom(el) {
        if (!el || !el.getAttribute) return '';
        let text = el.getAttribute('data-sps-tip');
        const legacy = el.getAttribute('title');
        if (legacy) {
            if (!text) { text = legacy; el.setAttribute('data-sps-tip', legacy); }
            el.removeAttribute('title');
        }
        return text || '';
    }

    function spsShowTip(anchor, text) {
        if (!_spsTipPop) {
            _spsTipPop = document.createElement('div');
            _spsTipPop.className = 'sps-tip-pop';
            document.body.appendChild(_spsTipPop);
            window.addEventListener('resize', spsHideTip, { passive: true });
            window.addEventListener('scroll', spsHideTip, { passive: true, capture: true });
        }
        clearTimeout(_spsTipHideTimer);
        _spsTipAnchor = anchor;
        _spsTipPop.textContent = String(text == null ? '' : text);
        const r = anchor.getBoundingClientRect();
        const w = _spsTipPop.offsetWidth, h = _spsTipPop.offsetHeight, pad = 8;

        const pos = anchor.getAttribute && anchor.getAttribute('data-sps-tip-pos');
        let left, top;
        if (pos === 'right') {
            left = r.right + 8;
            top = r.top + (r.height - h) / 2;
            if (left + w > window.innerWidth - pad) left = r.left - w - 8;   
            left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));
            top = Math.max(pad, Math.min(top, window.innerHeight - h - pad));
        } else {
            left = r.left; top = r.bottom + 6;
            if (top + h > window.innerHeight - pad) top = r.top - h - 6;   
            if (top < pad) top = Math.min(Math.max(pad, r.bottom + 6), Math.max(pad, window.innerHeight - h - pad));
            left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));
        }
        _spsTipPop.style.left = Math.round(left) + 'px';
        _spsTipPop.style.top = Math.round(top) + 'px';
        void _spsTipPop.offsetWidth;   
        _spsTipPop.classList.add('sps-tip-on');   
    }

    function spsTipTargetFrom(target) {
        if (!target || !target.closest) return null;
        const mark = target.closest(SPS_TIP_HIT);
        if (mark) return mark;
        if (!target.closest(SPS_TIP_OWN)) return null;
        return target.closest('[data-sps-tip], [title]');
    }

    function spsBindTips() {
        const root =  (document.documentElement);
        if (root._spsTipBound) return;
        root._spsTipBound = true;

        document.addEventListener('mouseover', (e) => {
            if (spsTipPinned()) return;   
            const t =  (e.target);
            if (SPS_TIP_CLICK_MODE && t && t.closest && t.closest(SPS_TIP_HIT)) return;   
            const el = spsTipTargetFrom(t);
            if (!el) { spsHideTip(); return; }        
            const text = spsTipTextFrom(el);
            if (!text) { spsHideTip(); return; }      
            spsShowTip(el, text);
        }, false);
        document.addEventListener('mouseout', (e) => {
            if (!_spsTipAnchor || spsTipPinned()) return;
            const t =  (e.target);
            const rel =  (e.relatedTarget);
            if (t !== _spsTipAnchor && !_spsTipAnchor.contains(t)) return;   
            if (rel && _spsTipAnchor.contains(rel)) return;                  
            _spsTipHideTimer = setTimeout(spsHideTip, SPS_TIP_HIDE_MS);      
        }, false);

        document.addEventListener('click', (e) => {
            if (!SPS_TIP_CLICK_MODE) return;
            const t =  (e.target);
            const mark = t && t.closest && t.closest(SPS_TIP_HIT);
            if (!mark) { spsHideTip(); return; }   
            const text = spsTipTextFrom(mark);
            if (!text) { spsHideTip(); return; }   
            e.preventDefault();
            e.stopImmediatePropagation();
            if (_spsTipAnchor === mark && _spsTipPop && _spsTipPop.classList.contains('sps-tip-on')) { spsHideTip(); return; }   
            spsShowTip(mark, text);
        }, true);
        document.addEventListener('keydown', ( e) => { if (e && e.key === 'Escape') spsHideTip(); }, true);
    }

    function fetchFaceitHistRows(steamId, apiKey, faceitId, onRows = () => {}, timeoutMs = 30000) {
        let followUps = 0;
        const ask = ( fid) => {
            safeSendMessage({ type: __S_content_core_js(3), steamId, apiKey, faceitId: fid }, (resp) => {
                const d =  (resp && resp.success ? resp.data : null);
                if (!d || d.error || !Array.isArray(d.rows)) {
                    if (followUps === 0) onRows([], { final: true, complete: false });   
                    return;   
                }
                const final = !d.statsPending;
                onRows(d.rows, { final, complete: !!d.complete, faceitId: d.faceitId });
                if (final || followUps >= 2) return;   
                followUps++;
                setTimeout(() => ask(d.faceitId || fid), 300);   
            }, timeoutMs);
        };
        ask(faceitId);
    }

    function getSteamID64() {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const match = script.textContent.match(/g_rgProfileData\s*=\s*(\{.*?\});/);
            if (match && match[1]) {
                try { return JSON.parse(match[1]).steamid; } catch (e) {}
            }
        }
        const href = window.location.href;
        const urlMatch = href.match(/\/profiles\/(\d+)/);
        if (urlMatch) return urlMatch[1];

        const miniProfile = document.querySelector('.profile_header [data-miniprofile]');
        if (miniProfile) {
            const accountid = parseInt(miniProfile.getAttribute('data-miniprofile'), 10);
            if (Number.isFinite(accountid) && accountid > 0) {
                return (BigInt(accountid) + 76561197960265728n).toString();
            }
        }
        return null;
    }

    function spsParseColor(str) {
        const s = String(str == null ? '' : str).trim();
        if (!s) return null;
        if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
        let m = s.match(/^rgba?\(([^)]+)\)$/i);
        if (m) {
            const p = m[1].split(/[,/\s]+/).filter(Boolean).map(Number);
            if (p.length < 3 || !p.slice(0, 3).every(Number.isFinite)) return null;
            const a = p.length > 3 && Number.isFinite(p[3]) ? Math.max(0, Math.min(1, p[3])) : 1;
            return { r: p[0], g: p[1], b: p[2], a };
        }
        m = s.match(/^#([0-9a-f]{3,8})$/i);
        if (m) {
            const h = m[1], hex = (x) => parseInt(x, 16);
            if (h.length === 3) return { r: hex(h[0] + h[0]), g: hex(h[1] + h[1]), b: hex(h[2] + h[2]), a: 1 };
            if (h.length === 6) return { r: hex(h.slice(0, 2)), g: hex(h.slice(2, 4)), b: hex(h.slice(4, 6)), a: 1 };
            if (h.length === 8) return { r: hex(h.slice(0, 2)), g: hex(h.slice(2, 4)), b: hex(h.slice(4, 6)), a: hex(h.slice(6, 8)) / 255 };
        }
        return null;
    }

    function spsMixColor(fg, bg) {
        const f = fg || { r: 0, g: 0, b: 0, a: 0 };
        const b = bg || { r: 0, g: 0, b: 0, a: 0 };
        const a = f.a + b.a * (1 - f.a);
        if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
        const mix = ( x,  y) => Math.round((x * f.a + y * b.a * (1 - f.a)) / a);
        return { r: mix(f.r, b.r), g: mix(f.g, b.g), b: mix(f.b, b.b), a };
    }

    function spsIsLight(rgb) {
        if (!rgb) return false;
        return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 > 0.5;
    }

    function spsThemeTint(grad) {
        const s = String(grad == null ? '' : grad);
        if (!s || !/gradient/i.test(s)) return null;
        let best =  (null);
        const re = /rgba?\(([^)]+)\)/gi;
        let m;
        while ((m = re.exec(s))) {
            const c = spsParseColor('rgb(' + m[1].replace(/[/\s,]+/g, ',') + ')');
            if (!c || c.a <= 0.05) continue;
            if (!best || c.a > best.a) best = c;
        }
        return best;
    }

    function spsCss(c, alpha) {
        const a = alpha == null ? (c && c.a == null ? 1 : c.a) : alpha;
        return `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${Number(a).toFixed(3)})`;
    }

    function spsSurfaceHost() {
        return document.querySelector('.profile_customization_area')
            || document.querySelector('.profile_content')
            || document.querySelector('#responsive_page_template_content')
            || document.body;
    }

    function spsThemeCarrier() {
        return document.querySelector('.profile_content')
            || document.querySelector('#responsive_page_template_content')
            || document.body;
    }

    function spsPlateColor(el, stopEl) {
        if (!el || el.nodeType !== 1 || typeof getComputedStyle !== 'function') return null;
        const layers = [];
        let n =  (el);
        while (n && n.nodeType === 1 && n !== stopEl && n !== document.body && n !== document.documentElement && layers.length < 12) {
            layers.push(n);
            n = n.parentElement;
        }
        let acc =  (null);
        for (let i = layers.length - 1; i >= 0; i--) {
            const cs = getComputedStyle(layers[i]);
            const c = cs && spsParseColor(cs.backgroundColor);
            if (!c || c.a <= 0) continue;
            acc = acc ? spsMixColor(c, acc) : c;
        }
        return acc;
    }

    function spsSampleHeaderSurface() {
        const out = { color: null, tint: null, isLight: false, ok: false };
        if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return out;
        const carrier = document.querySelector('.profile_header_bg_texture')
            || document.querySelector('.profile_header')
            || null;
        if (!carrier || typeof getComputedStyle !== 'function') return out;
        try {
            const chain = [];
            let el = carrier;
            while (el && el.nodeType === 1 && chain.length < 12) { chain.push(el); el = el.parentElement; }
            let acc = { r: 0, g: 0, b: 0, a: 1 };
            for (let i = chain.length - 1; i >= 0; i--) {
                const cs = getComputedStyle(chain[i]);
                if (!cs) continue;
                const c = spsParseColor(cs.backgroundColor);
                if (c && c.a > 0) acc = spsMixColor(c, acc);
            }
            const ccs = getComputedStyle(carrier);
            const tint = (ccs && ccs.backgroundImage && /gradient/i.test(ccs.backgroundImage))
                ? spsThemeTint(ccs.backgroundImage)
                : null;
            const surface = tint ? spsMixColor(tint, acc) : acc;
            out.tint = tint;
            out.color = surface;
            out.isLight = spsIsLight(surface);
            out.ok = true;
        } catch (e) {  }
        return out;
    }

    function spsAdoptNativeTextStyle(el, anchors) {
        if (!el || !el.style || typeof el.style.setProperty !== 'function') return false;
        if (typeof getComputedStyle !== 'function') return false;
        const list = Array.isArray(anchors) ? anchors : [anchors];
        const src = list.filter(a => a && a.nodeType === 1)[0];
        if (!src) return false;
        try {
            const cs = getComputedStyle(src);
            if (!cs) return false;
            const color = String(cs.color || '');
            const fontSize = String(cs.fontSize || '');
            if (!color || !fontSize) return false;
            el.style.setProperty('--sps-native-color', color);
            el.style.setProperty(__S_content_core_js(4), fontSize);
            const fontFamily = String(cs.fontFamily || '');
            const fontWeight = String(cs.fontWeight || '');
            if (fontFamily) el.style.setProperty(__S_content_core_js(5), fontFamily);
            if (fontWeight) el.style.setProperty(__S_content_core_js(6), fontWeight);
            return true;
        } catch (e) {  }
        return false;
    }

    function spsSampleSurface() {
        const out =  ({ scrim: '', plate: '', panelBg: '', panelImg: '', panelBlur: '', color: null, base: null, gradient: '', hasBg: false, isLight: false, ok: false, host: '', header: { color: null, tint: null, isLight: false, ok: false } });
        const body = document.body;

        out.hasBg = !!(body && body.classList && body.classList.contains(__S_content_core_js(7)))
            || !!document.querySelector('.profile_background_image')
            || !!document.querySelector('.profile_background_image_content')
            || !!document.querySelector('#profile_background');
        
        out.header = spsSampleHeaderSurface();
        let scrimEl = document.querySelector('.showcase_content_bg');
        let probe =  (null);
        let hostKind = '';
        try {
            if (!scrimEl && typeof document.createElement === 'function') {

                probe = document.createElement('div');
                probe.className = 'profile_customization sps-native';
                probe.setAttribute('aria-hidden', 'true');
                probe.style.cssText = 'position:absolute!important;left:-9999px!important;top:0!important;width:120px!important;height:24px!important;visibility:hidden!important;pointer-events:none!important;';
                const probeBlock = document.createElement('div');
                probeBlock.className = __S_content_core_js(8);
                const probeScrim = document.createElement('div');
                probeScrim.className = 'showcase_content_bg';
                probeBlock.appendChild(probeScrim);
                probe.appendChild(probeBlock);
                const host = spsSurfaceHost();

                hostKind = host === document.body ? 'body' : (host && host.className ? String(host.className).split(' ')[0] : '');
                if (host && host.appendChild) host.appendChild(probe);
                scrimEl = probeScrim;
            }
            if (scrimEl && typeof getComputedStyle === 'function') {
                const ss = getComputedStyle(scrimEl);
                out.scrim = (ss && ss.backgroundColor) || '';

                const plate = spsPlateColor(scrimEl, spsThemeCarrier());
                out.plate = plate ? spsCss(plate) : '';
                out.panelBg = out.plate || out.scrim;
                out.panelImg = (ss && ss.backgroundImage && ss.backgroundImage !== 'none') ? ss.backgroundImage : '';
                out.panelBlur = (ss && ss.backdropFilter && ss.backdropFilter !== 'none') ? ss.backdropFilter : '';
                
                const chain = [];
                let el = scrimEl;
                while (el && el.nodeType === 1 && chain.length < 12) { chain.push(el); el = el.parentElement; }
                let acc = { r: 0, g: 0, b: 0, a: 1 };
                for (let i = chain.length - 1; i >= 0; i--) {
                    const cs = typeof getComputedStyle === 'function' ? getComputedStyle(chain[i]) : null;
                    if (!cs) continue;
                    const c = spsParseColor(cs.backgroundColor);
                    if (c && c.a > 0) acc = spsMixColor(c, acc);
                    if (!out.gradient && cs.backgroundImage && /gradient/i.test(cs.backgroundImage)) out.gradient = cs.backgroundImage;
                }
                out.color = acc;
                out.isLight = spsIsLight(acc);
                
                const carrier = spsThemeCarrier();
                const ccs = carrier ? getComputedStyle(carrier) : null;
                if (ccs) {
                    out.base = spsParseColor(ccs.backgroundColor);
                    if (ccs.backgroundImage && /gradient/i.test(ccs.backgroundImage)) out.gradient = ccs.backgroundImage;
                }

                out.host = hostKind || 'live';
                out.ok = !!out.scrim && hostKind !== 'body';
            }
        } catch (e) {  }
        if (probe && probe.parentNode) probe.parentNode.removeChild(probe);
        return out;
    }

    function spsApplyTone(s, isLight) {
        const root = document.documentElement;
        root.classList.remove('sps-surface-light', 'sps-surface-dark');
        root.classList.add(isLight ? 'sps-surface-light' : 'sps-surface-dark');
        
        const hdrLight = !!(s && s.header && s.header.isLight);
        root.classList.remove(__S_content_core_js(9), __S_content_core_js(10));
        root.classList.add(hdrLight ? __S_content_core_js(9) : __S_content_core_js(10));
        if (root.style && root.style.setProperty) root.style.setProperty('--sps-color-scheme', isLight ? 'light' : 'dark');
    }

    function spsApplySurface(cStyle, surface) {
        const root = document.documentElement;
        const style = String(cStyle || 'auto');
        const forcedDark = style === 'solid' || style === 'glass';
        const s = surface || spsSampleSurface();

        ['auto', 'glass', 'solid', 'compact'].forEach((k) => root.classList.remove('sps-style-' + k));
        if (style !== 'auto') root.classList.add('sps-style-' + style);
        const isLight = !forcedDark && style === 'auto' && !!s.isLight;
        
        spsApplyTone(s, isLight);
        
        root.classList.remove('sps-auto-hasbg');
        if (style === 'auto' && s.hasBg) root.classList.add('sps-auto-hasbg');
        const setV = (k, v) => { if (root.style && root.style.setProperty) root.style.setProperty(k, v); };
        const rmV = (k) => { if (root.style && root.style.removeProperty) root.style.removeProperty(k); };
        if (s.color && style === 'auto') {

            const panelC = s.panelBg ? spsParseColor(s.panelBg) : null;
            const nativeC = panelC && panelC.a > 0.05 ? panelC : null;

            const tintC = spsThemeTint(s.gradient);
            const baseC = (s.base && s.base.a > 0.05) ? s.base : (tintC || s.color);
            setV('--sps-auto-bg', nativeC ? s.panelBg : spsCss(baseC, 0.95));
            setV('--sps-auto-bg-image', s.panelImg || 'none');

            const frost = 'blur(20px) saturate(130%)';
            const plateTranslucent = !!nativeC && nativeC.a < 0.9;
            setV('--sps-auto-blur', s.panelBlur || (s.hasBg || plateTranslucent ? frost : 'none'));
            setV('--sps-auto-border', 'transparent');
            setV('--sps-auto-shadow', 'none');

            const scrimC = s.scrim ? spsParseColor(s.scrim) : null;
            const menuC = scrimC && baseC ? spsMixColor(scrimC, baseC) : baseC;

            setV('--sps-auto-bg-menu', nativeC ? spsCss(nativeC) : spsCss(menuC, Math.max(menuC.a, 0.45)));
            setV(__S_content_core_js(11), s.panelImg || 'none');
        } else {
            ['--sps-auto-bg', '--sps-auto-bg-menu', __S_content_core_js(11), '--sps-auto-blur', '--sps-auto-border', '--sps-auto-shadow', '--sps-auto-bg-image'].forEach(rmV);
        }
        return s;
    }

    function detectProfileTheme() {
        const body = document.body;
        const hasBg = body.classList.contains(__S_content_core_js(7)) ||
                      document.querySelector('.profile_background_image') !== null ||
                      document.querySelector('.profile_background_image_content') !== null;
        const hasCustomBg = document.querySelector('[class*="profile_customization"]') !== null;

        const sampled = spsSampleSurface();
        let brightness = 0.3;
        if (sampled.color) {
            brightness = (0.299 * sampled.color.r + 0.587 * sampled.color.g + 0.114 * sampled.color.b) / 255;
        } else {
            const bgColor = getComputedStyle(body).backgroundColor;
            const rgb = bgColor ? bgColor.match(/\d+/g) : null;
            if (rgb && rgb.length >= 3) brightness = (0.299*+rgb[0] + 0.587*+rgb[1] + 0.114*+rgb[2]) / 255;
        }
        const isLightTheme = brightness > 0.5 || body.classList.contains('v6');
        document.documentElement.classList.remove('sps-page-light', 'sps-page-dark');
        document.documentElement.classList.add('sps-theme-detected');
        if (hasBg || hasCustomBg) document.documentElement.classList.add('sps-page-has-bg');
        return { hasBg, brightness, isLightTheme, surface: sampled };
    }

    function getContainerClass(settings, baseClass) {
        let cls = baseClass;
        if (settings.sps_high_contrast) cls += ' sps-high-contrast';
        return cls;
    }

    const WEAR_SUFFIX_RE = /\s*\((?:崭新出厂|略有磨损|久经沙场|破损不堪|战痕累累|无磨损|原版|Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/;
    function stripWearSuffix(name) {
        return String(name || '').replace(WEAR_SUFFIX_RE, '');
    }

    const TYPE_ZH = [
        ['Sniper Rifle', '狙击步枪'], ['Machinegun', '机枪'], ['Music Kit', '音乐盒'],
        ['Container', '武器箱'], ['Graffiti', '涂鸦'], ['Collectible', '收藏品'],
        ['Souvenir', '纪念品'],
        ['Consumer Grade', '消费级'], ['Industrial Grade', '工业级'], ['Mil-Spec Grade', '军规级'],
        ['Restricted', '受限级'], ['Classified', '保密级'], ['Covert', '隐秘级'], ['Contraband', '违禁级'],
        ['Base Grade', '基础级'], ['High Grade', '高级'], ['Remarkable', '优异'], ['Exotic', '异彩'],
        ['Extraordinary', '非凡'], ['Distinguished', '杰出'], ['Exceptional', '出众'],
        ['Superior', '卓越'], ['Master', '大师'], ['Genuine', '正宗'], ['Stock', '标准'],
        ['Pistol', '手枪'], ['Rifle', '步枪'], ['SMG', '微型冲锋枪'], ['Shotgun', '霰弹枪'],
        ['Agent', '探员'], ['Sticker', '印花'], ['Gloves', '手套'], ['Knife', '匕首'],
        ['Key', '钥匙'], ['Tool', '工具']
    ];
    function nativeTypeZh(type) {
        let s = String(type || '');
        for (const [en, zh] of TYPE_ZH) s = s.split(en).join(zh);
        return s;
    }

    function nativePriceText(item) {
        const up = Number(item.unitPrice);
        if (!Number.isFinite(up) || up <= 0) return '';
        const amt = up >= 1 ? Math.round(up).toLocaleString('en-US') : up.toFixed(2);
        return `${curSym(item.currency)}${amt}${item.qty > 1 ? ` ×${item.qty}` : ''}`;
    }

    async function spsCopyText(text) {
        const s = String(text == null ? '' : text);
        if (!s) return false;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(s);
                return true;
            }
        } catch (e) {  }
        try {
            const ta = document.createElement('textarea');
            ta.value = s;
            ta.setAttribute('readonly', 'readonly');
            ta.style.position = 'fixed';
            ta.style.top = '-1000px';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            ta.remove();
            return !!ok;
        } catch (e) { return false; }
    }

    function copyToClipboard(text, element, txt) {
        navigator.clipboard.writeText(text);
        const original = element.getAttribute('data-label') || element.getAttribute('data-sid') || element.innerText;
        element.innerText = txt.copied;
        element.classList.add('sps-copied-anim');
        clearTimeout(element._spsCopyTimer);
        element._spsCopyTimer = setTimeout(() => {
            element.innerText = original;
            element.classList.remove('sps-copied-anim');
        }, 1000);
    }

    const FACEIT_REGION_CN = {
        'EU': '欧洲', 'NA': '北美', 'SA': '南美',
        'SEA': '东南亚', 'OCE': '大洋洲', 'ME': '中东',
        'AF': '非洲', 'AS': '亚洲', 'EA': '东亚'
    };

    const COUNTRY_NAME_CN = {
        'hk': '中国香港', 'tw': '中国台湾', 'mo': '中国澳门', 'cn': '中国',
        'us': '美国', 'ca': '加拿大', 'mx': '墨西哥',
        'gb': '英国', 'de': '德国', 'fr': '法国', 'it': '意大利', 'es': '西班牙',
        'pt': '葡萄牙', 'nl': '荷兰', 'be': '比利时', 'ch': '瑞士', 'at': '奥地利',
        'pl': '波兰', 'cz': '捷克', 'sk': '斯洛伐克', 'hu': '匈牙利', 'ro': '罗马尼亚',
        'bg': '保加利亚', 'hr': '克罗地亚', 'rs': '塞尔维亚', 'si': '斯洛文尼亚',
        'ba': '波黑', 'mk': '北马其顿', 'al': '阿尔巴尼亚', 'gr': '希腊',
        'cy': '塞浦路斯', 'mt': '马耳他', 'ie': '爱尔兰', 'lu': '卢森堡',
        'dk': '丹麦', 'se': '瑞典', 'no': '挪威', 'fi': '芬兰', 'is': '冰岛',
        'ee': '爱沙尼亚', 'lv': '拉脱维亚', 'lt': '立陶宛', 'ua': '乌克兰',
        'by': '白俄罗斯', 'md': '摩尔多瓦', 'ru': '俄罗斯',
        'jp': '日本', 'kr': '韩国', 'kp': '朝鲜',
        'sg': '新加坡', 'my': '马来西亚', 'th': '泰国', 'vn': '越南',
        'id': '印度尼西亚', 'ph': '菲律宾', 'bn': '文莱', 'kh': '柬埔寨',
        'la': '老挝', 'mm': '缅甸', 'mn': '蒙古', 'np': '尼泊尔',
        'bd': '孟加拉国', 'lk': '斯里兰卡', 'pk': '巴基斯坦', 'in': '印度',
        'mv': '马尔代夫', 'bt': '不丹', 'tl': '东帝汶',
        'au': '澳大利亚', 'nz': '新西兰', 'fj': '斐济', 'pg': '巴布亚新几内亚',
        'br': '巴西', 'ar': '阿根廷', 'cl': '智利', 'pe': '秘鲁', 'co': '哥伦比亚',
        've': '委内瑞拉', 'ec': '厄瓜多尔', 'bo': '玻利维亚', 'py': '巴拉圭',
        'uy': '乌拉圭', 'gy': '圭亚那', 'sr': '苏里南',
        'za': '南非', 'eg': '埃及', 'ma': '摩洛哥', 'dz': '阿尔及利亚',
        'tn': '突尼斯', 'ly': '利比亚', 'ng': '尼日利亚', 'ke': '肯尼亚',
        'gh': '加纳', 'ci': '科特迪瓦', 'sn': '塞内加尔', 'cm': '喀麦隆',
        'et': '埃塞俄比亚', 'tz': '坦桑尼亚', 'ug': '乌干达', 'ao': '安哥拉',
        'mz': '莫桑比克', 'zw': '津巴布韦', 'bw': '博茨瓦纳', 'na': '纳米比亚',
        'mu': '毛里求斯', 'sc': '塞舌尔', 'rw': '卢旺达',
        'sa': '沙特阿拉伯', 'ae': '阿联酋', 'qa': '卡塔尔', 'kw': '科威特',
        'bh': '巴林', 'om': '阿曼', 'il': '以色列', 'jo': '约旦',
        'lb': '黎巴嫩', 'iq': '伊拉克', 'ir': '伊朗', 'sy': '叙利亚',
        'ye': '也门', 'ps': '巴勒斯坦', 'kz': '哈萨克斯坦', 'uz': '乌兹别克斯坦',
        'tm': '土库曼斯坦', 'kg': '吉尔吉斯斯坦', 'tj': '塔吉克斯坦',
        'az': '阿塞拜疆', 'ge': '格鲁吉亚', 'am': '亚美尼亚', 'tr': '土耳其',
        'cr': '哥斯达黎加', 'pa': '巴拿马', 'cu': '古巴', 'jm': '牙买加',
        'do': '多米尼加', 'ht': '海地', 'tt': '特立尼达和多巴哥',
        'gt': '危地马拉', 'hn': '洪都拉斯', 'sv': '萨尔瓦多', 'ni': '尼加拉瓜',
        'pr': '波多黎各', 'bs': '巴哈马', 'bb': '巴巴多斯',
        'xk': '科索沃', 'me': '黑山', 'ad': '安道尔', 'mc': '摩纳哥',
        'li': '列支敦士登', 'sm': '圣马力诺', 'va': '梵蒂冈'
    };

    function fmtMonthDay(v) {
        const d = new Date(typeof v === 'number' ? v * 1000 : String(v).replace(' ', 'T') + '+08:00');
        if (isNaN(d.getTime())) return '';
        return (d.getMonth() + 1) + '/' + d.getDate();
    }

    function fmtInvValue(v) {
        if (v >= 10000) return (v / 10000).toFixed(1) + '万';
        return Math.round(v).toLocaleString();
    }

    const SPS_FACEIT_LEVEL_MIN = [100, 501, 751, 901, 1051, 1201, 1351, 1531, 1751, 2001];
    
    function faceitEloProgress(elo) {
        const e = parseInt(String(elo), 10);
        if (!Number.isFinite(e) || e <= 0) return null;
        let l = 0;
        for (let i = SPS_FACEIT_LEVEL_MIN.length - 1; i >= 0; i--) { if (e >= SPS_FACEIT_LEVEL_MIN[i]) { l = i + 1; break; } }
        if (!l) return { level: 0, pct: 0, min: 0, next: 100, elo: e };   
        const min = SPS_FACEIT_LEVEL_MIN[l - 1];
        const next = SPS_FACEIT_LEVEL_MIN[l] || (min + 100);   
        return { level: l, pct: e >= 2001 ? 1 : Math.max(0.02, Math.min(1, (e - min) / (next - min))), min, next, elo: e };
    }
    
    function faceitEloBar(elo, level, isZh) {
        const p = faceitEloProgress(elo);
        if (!p) return '';

        const badgeLvl = parseInt(String(level), 10);
        const badgeValid = Number.isFinite(badgeLvl) && badgeLvl >= 1;
        const sameLevel = !badgeValid || badgeLvl === p.level;

        const tip = badgeValid && badgeLvl >= 10 && sameLevel
            ? (isZh ? `已经到顶啦~（${p.elo} ELO）` : `Max level 10 (${p.elo} ELO)`)
            : (sameLevel
                ? (isZh
                    ? `本等级 ${p.min} 起，再 ${Math.max(0, p.next - p.elo)} 分升到 ${p.level + 1} 级`
                    : `Level starts at ${p.min}; ${Math.max(0, p.next - p.elo)} ELO to level ${p.level + 1}`)
                : (isZh
                    ? `当前 ${p.elo} ELO 处于 ${p.level} 级区间，与徽章等级 ${badgeLvl} 短暂不同步（数据源延迟）`
                    : `${p.elo} ELO is in the level ${p.level} range, briefly out of sync with badge level ${badgeLvl}`));
        return `<i class="sps-elo-ring" title="${esc(tip)}" style="--p:${(p.pct * 100).toFixed(1)}%"></i>`;
    }

    function faceitZoneRankText(zoneDisplay, countryDisplay, regionRank, countryRank, isZh) {
        const toRank = ( v) => {
            if (v === undefined || v === null || v === '') return 0;
            const n = parseInt(String(v).replace(/[#,]/g, ''), 10);
            return Number.isFinite(n) && n > 0 ? n : 0;
        };
        const rr = toRank(regionRank), cr = toRank(countryRank);
        const zone = zoneDisplay || (isZh ? '未知' : '-');
        const country = countryDisplay || '';
        const zhRank = ( n) => '#' + n.toLocaleString('en-US');
        if (!rr && !cr) return country ? `${zone} ${country}` : zone;
        if (!cr) return country ? `${zone} ${zhRank(rr)} · ${country}` : `${zone} ${zhRank(rr)}`;
        if (!rr) return country ? `${zone} · ${country} ${zhRank(cr)}` : `${zone} · ${zhRank(cr)}`;
        return `${zone} ${zhRank(rr)} · ${country ? country + ' ' + zhRank(cr) : zhRank(cr)}`;
    }

    function spsTeamVerdict(idx, ev) {
        const e = ev || {};
        const n = Number(idx);
        if (!(n >= 0)) return '';
        const w = Number(e.winner);
        const cnt = Number(e.teamCount) > 0 ? Number(e.teamCount) : 0;
        if (w >= 1 && (!cnt || w <= cnt)) return w === n + 1 ? 'win' : 'lose';
        if (e.viewTie) return '';
        if (Number(e.viewTeamIdx) !== n) return '';
        return e.viewWin ? 'win' : (e.viewLose ? 'lose' : '');
    }

    function spsVerdictText(ev, isZh) {
        const e = ev || {};
        const cnt = Number(e.teamCount) > 0 ? Number(e.teamCount) : 0;
        
        const scan = Math.max(cnt, Number(e.winner) > 0 ? Number(e.winner) : 0);
        for (let i = 0; i < scan; i++) {
            if (spsTeamVerdict(i, e) === 'win') return isZh ? ('队伍' + (i + 1) + ' 胜') : ('Team ' + (i + 1) + ' win');
        }
        
        if (e.tie || e.viewTie) return isZh ? '平局' : 'tie';
        
        if (e.viewWin) return isZh ? '胜' : 'win';
        if (e.viewLose) return isZh ? '负' : 'loss';
        return '—';
    }

    function spsModeFilterNormalize(sel, keys, def) {
        const ks = (Array.isArray(keys) ? keys : []).map(String);
        const keep = ( arr) => (Array.isArray(arr) ? arr : []).map(String)
            .filter(( k,  i,  a) => ks.indexOf(k) >= 0 && a.indexOf(k) === i);
        const s = keep(sel);
        if (s.length) return s;
        const d = keep(def);
        return d.length ? d : ks.slice();
    }

    function spsModeFilterFollow(sel, keys, def, userSet) {
        return spsModeFilterNormalize(userSet ? sel : [], keys, def);
    }

    function spsModeFilterIsDefault(sel, keys, def) {
        const ks = (Array.isArray(keys) ? keys : []).map(String);
        const s = spsModeFilterNormalize(sel, ks, def), d = spsModeFilterNormalize([], ks, def);
        return s.length === d.length && s.every( k => d.indexOf(k) >= 0);
    }

    function spsModeFilterBarHtml(opt) {
        const isZh = !!opt.isZh;
        const items = Array.isArray(opt.items) ? opt.items : [];
        const keys = items.map(i => i.key);
        const sel = spsModeFilterNormalize(opt.sel, keys, opt.def);
        const isDef = spsModeFilterIsDefault(sel, keys, opt.def);
        const rows = items.map(it => {
            const on = sel.indexOf(it.key) >= 0;
            return `<div class="sps-mh-fitem${on ? '' : ' off'}" data-sps-fit="${esc(it.key)}">` +
                `<input type="checkbox" class="sps-mh-fchk" data-sps-fchk="${esc(it.key)}"${on ? ' checked' : ''}>` +
                `<span class="sps-mh-fname" data-sps-fonly="${esc(it.key)}" title="${isZh ? '只看该模式' : 'Only this mode'}">${esc(it.label)}</span>` +
                `<span class="sps-mh-fcount">${esc(String(it.count))}</span></div>`;
        }).join('');
        const tip = isZh ? '模式过滤' : 'Mode filter';
        const sum = isZh ? `显示 ${sel.length}/${keys.length} 种 · ${opt.total || 0} 场`
            : `${sel.length}/${keys.length} modes · ${opt.total || 0} matches`;
        const defTxt = opt.defLabel || (isZh ? '默认' : 'Default');
        return `<div class="sps-pw-mh-filters sps-mh-fbar">` +
            `<button type="button" class="sps-mh-fbtn${isDef ? '' : ' on'}" data-sps-fbtn="1" aria-expanded="false" aria-label="${esc(tip)}" title="${esc(tip)}">` +
            `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.9 2.7h12.2l-4.8 5.5v4.6l-2.6 1.4V8.2z" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round"/></svg>` +
            `</button>` +
            `<div class="sps-mh-fpop" data-sps-fpop="1" hidden>` +
            `<div class="sps-mh-fpop-head"><span>${esc(tip)}</span><span class="sps-mh-fpop-sum" data-sps-fsum="1">${esc(sum)}</span></div>` +
            `<div class="sps-mh-fpop-list">${rows}</div>` +
            `<div class="sps-mh-fpop-foot">` +
            `<span data-sps-fdef="1" role="button" tabindex="0" title="${esc(defTxt)}">${esc(defTxt)}</span>` +
            `<span data-sps-fall="1" role="button" tabindex="0">${isZh ? '全选' : 'All'}</span>` +
            `</div></div></div>`;
    }

    function spsModeFilterSync(bar, opt) {
        if (!bar || !opt) return;
        const items = Array.isArray(opt.items) ? opt.items : [];
        const keys = items.map(( i) => i.key);
        const sel = spsModeFilterNormalize(opt.sel, keys, opt.def);
        const btn = bar.querySelector('[data-sps-fbtn]');
        if (btn) btn.classList.toggle('on', !spsModeFilterIsDefault(sel, keys, opt.def));
        bar.querySelectorAll('[data-sps-fchk]').forEach(( c) => {
            c.checked = sel.indexOf(String(c.getAttribute('data-sps-fchk') || '')) >= 0;
        });
        bar.querySelectorAll('[data-sps-fit]').forEach(( it) => {
            it.classList.toggle('off', sel.indexOf(String(it.getAttribute('data-sps-fit') || '')) < 0);
        });
        const sum = bar.querySelector('[data-sps-fsum]');
        if (sum) {
            const total = items.reduce(( a,  i) => a + (Number(i.count) || 0), 0);
            sum.textContent = opt.isZh ? `显示 ${sel.length}/${keys.length} 种 · ${total} 场`
                : `${sel.length}/${keys.length} modes · ${total} matches`;
        }
    }

    let _spsFilterPop = null;

    function spsCloseModeFilterPop() {
        const cur = _spsFilterPop;
        if (!cur) return;
        _spsFilterPop = null;
        try { cur.pop.setAttribute('hidden', ''); } catch (e) {  }
        try { cur.btn.setAttribute('aria-expanded', 'false'); } catch (e) {  }
        try { if (cur.off) cur.off(); } catch (e) {  }
    }

    function spsPositionModeFilterPop(btn, pop) {
        const host = btn.closest('.sps-pw-panel') || btn.closest('.sps-pw-modal') || document.body;
        const hr = host.getBoundingClientRect(), br = btn.getBoundingClientRect();
        const w = pop.offsetWidth || 196, h = pop.offsetHeight || 200, pad = 8;
        let left = (br.right - hr.left) - w;
        left = Math.max(pad, Math.min(left, Math.max(pad, hr.width - w - pad)));
        let top = (br.bottom - hr.top) + 4;
        if (top + h > hr.height - pad) {
            const above = (br.top - hr.top) - h - 4;
            top = above >= pad ? above : Math.max(pad, hr.height - h - pad);
        }
        pop.style.left = Math.round(left) + 'px';
        pop.style.top = Math.round(top) + 'px';
    }

    function spsOpenModeFilterPop(bar, btn, pop) {
        spsCloseModeFilterPop();
        pop.removeAttribute('hidden');
        spsPositionModeFilterPop(btn, pop);
        btn.setAttribute('aria-expanded', 'true');
        const onDown = ( e) => {
            if (!pop.contains(e.target) && !bar.contains(e.target)) spsCloseModeFilterPop();
        };
        const onKey = ( e) => { if (e && e.key === 'Escape') spsCloseModeFilterPop(); };

        const onScroll = ( e) => {
            if (e && e.target && e.target.nodeType === 1 && pop.contains( (e.target))) return;
            spsCloseModeFilterPop();
        };
        const off = () => {
            document.removeEventListener('pointerdown', onDown, true);
            document.removeEventListener('keydown', onKey, true);
            document.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onScroll);
        };
        document.addEventListener('pointerdown', onDown, true);
        document.addEventListener('keydown', onKey, true);
        document.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);
        _spsFilterPop = { bar, btn, pop, off };
    }

    function spsBindModeFilter(bar, opt, onChange) {
        if (!bar || bar._spsFBound) return;
        bar._spsFBound = true;
        const btn = bar.querySelector('[data-sps-fbtn]');
        const pop = bar.querySelector('[data-sps-fpop]');
        if (!btn || !pop) return;

        const emit = (next) => {
            const o = opt() || {};
            const keys = (o.items || []).map(( i) => i.key);
            onChange(spsModeFilterNormalize(next, keys, o.def));
        };
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!pop.hasAttribute('hidden')) spsCloseModeFilterPop();
            else spsOpenModeFilterPop(bar, btn, pop);
        });
        
        pop.addEventListener('click', (e) => {
            const t =  (e.target);
            const only = t.closest('[data-sps-fonly]');
            if (only) { e.stopPropagation(); emit([String(only.getAttribute('data-sps-fonly') || '')]); return; }
            if (t.closest('[data-sps-fdef]')) { e.stopPropagation(); emit([]); return; }
            if (t.closest('[data-sps-fall]')) { e.stopPropagation(); emit(((opt() || {}).items || []).map(( i) => i.key)); return; }
            const item = t.closest('[data-sps-fit]');
            if (item && t.tagName !== 'INPUT') {
                e.stopPropagation();
                const k = String(item.getAttribute('data-sps-fit') || '');
                const cur = (opt() || {}).sel || [];
                const has = Array.isArray(cur) ? cur.map(String).indexOf(k) >= 0 : false;
                emit(has ? cur.filter(( x) => String(x) !== k) : [].concat(cur, [k]));
            }
        });
        pop.addEventListener('change', (e) => {
            const t =  (e.target);
            if (!t || t.getAttribute('data-sps-fchk') === null) return;
            const cur = [];
            pop.querySelectorAll('[data-sps-fchk]').forEach(( c) => {
                if (c.checked) cur.push(String(c.getAttribute('data-sps-fchk') || ''));
            });
            emit(cur);
        });
    }

    const LEE_RANK_ZH = ['', '白银I', '白银II', '白银III', '白银IV', '白银精英', '白银精英大师',
        '黄金新星I', '黄金新星II', '黄金新星III', '黄金新星大师',
        '大师守护者I', '大师守护者II', '大师守护者精英', '杰出大师守护者',
        '传奇之鹰', '传奇之鹰大师', '无上之首席大师', '全球精英'];
    const LEE_RANK_EN = ['', 'Silver I', 'Silver II', 'Silver III', 'Silver IV', 'Silver Elite', 'Silver Elite Master',
        'Gold Nova I', 'Gold Nova II', 'Gold Nova III', 'Gold Nova Master',
        'Master Guardian I', 'Master Guardian II', 'Master Guardian Elite', 'Distinguished Master Guardian',
        'Legendary Eagle', 'Legendary Eagle Master', 'Supreme Master First Class', 'Global Elite'];
    const SPS_RANK_ZH = LEE_RANK_ZH;
    const SPS_RANK_EN = LEE_RANK_EN;

    function leeRankIconUrl(rank) {
        const n = Number(rank) || 0;
        return (n >= 1 && n <= 18) ? chrome.runtime.getURL(__S_content_core_js(12) + n + '.png') : '';
    }
    const spsRankIconUrl = leeRankIconUrl;

    function leeWingmanRankIconUrl(rank) {
        const n = Number(rank) || 0;
        return (n >= 1 && n <= 18) ? chrome.runtime.getURL(__S_content_core_js(13) + n + '.png') : '';
    }
    const spsWingmanRankIconUrl = leeWingmanRankIconUrl;

    function leeRankColor(rank) {
        const n = Number(rank) || 0;
        if (n >= 18) return '#e4ae39';
        if (n >= 17) return '#eb4b4b';
        if (n >= 16) return '#d32ce6';
        if (n >= 15) return '#8847ff';
        if (n >= 14) return '#4b69ff';
        if (n >= 11) return '#70b04a';
        if (n >= 7) return '#d9a441';
        return '#b0c3d9';
    }
    const spsRankColor = leeRankColor;

    const LEE_PREMIER_TIERS = [
        { starts: 0, name: 'grey', color: '#c4cce2' },
        { starts: 5000, name: 'lightblue', color: '#8cc6ff' },
        { starts: 10000, name: 'blue', color: '#6a7dff' },
        { starts: 15000, name: 'purple', color: '#c166ff' },
        { starts: 20000, name: 'pink', color: '#f03cff' },
        { starts: 25000, name: 'red', color: '#eb4b4b' },
        { starts: 30000, name: 'gold', color: '#ffd700' }
    ];

    function leePremierTier(r) {
        const n = Number(r) || 0;
        let t = LEE_PREMIER_TIERS[0];
        for (const tier of LEE_PREMIER_TIERS) if (n >= tier.starts) t = tier;
        return t;
    }
    const spsPremierTier = leePremierTier;

    function leeMapName(map) {
        const b = String(map || '').replace(/^de_/, '');
        return b.charAt(0).toUpperCase() + b.slice(1);
    }
    const spsMapName = leeMapName;

    function spsRankBadgeHtml(rank, isZh, isWingman) {
        if (!rank) {
            return '<span class="sps-cs-rank-empty">-</span>';
        }
        const names = isZh ? SPS_RANK_ZH : SPS_RANK_EN;
        const prefix = isWingman ? (isZh ? '搭档 · ' : 'Wingman · ') : '';
        const rn = prefix + (names[rank] || ('Lv.' + rank));
        const icon = isWingman ? spsWingmanRankIconUrl(rank) : spsRankIconUrl(rank);
        return icon
            ? `<img class="sps-lee-rank-img" src="${icon}" title="${esc(rn)}" alt="${esc(rn)}">`
            : `<span class="sps-lee-rank-chip" style="--tier:${spsRankColor(rank)}" title="${esc(rn)}">${esc(String(rank))}</span>`;
    }

    function spsPremierBadgeHtml(rating) {
        const num = Number(rating) || 0;
        if (!num) return '<span class="sps-cs-rank-empty">-</span>';
        const t = spsPremierTier(num);
        const numStr = num.toLocaleString('en-US');
        return `<span class="sps-lee-premier sps-cs-premier-mini" title="${t.name}">`
            + `<img src="${chrome.runtime.getURL(__S_content_core_js(14) + t.name + '.svg')}" alt="">`
            + `<span class="sps-lee-premier-num" style="color:${t.color}">${esc(numStr)}</span></span>`;
    }

    function renderDualRankDrawerHtml(comp, premHist, wing, txt, isZh, csgo) {
        const leftHtml = comp.length ? `
            <div class="sps-cs-ranks-col sps-cs-ranks-left">
                <div class="sps-cs-ranks-sec">${esc(txt.lee_comp)}</div>
                <div class="sps-cs-ranks-table">
                    <div class="sps-cs-ranks-head"><span>Map</span><span>${esc(txt.cs_current_label)}</span><span>${esc(txt.cs_best_rank_label)}</span></div>
                    ${comp.map(r => `
                        <div class="sps-cs-rank-row">
                            <span class="sps-cs-map-name">${esc(spsMapName(r.map))}<small class="sps-cs-map-wins">${r.wins || 0} Win</small></span>
                            <span class="sps-cs-rank-col">${spsRankBadgeHtml(r.current, isZh)}</span>
                            <span class="sps-cs-rank-col">${spsRankBadgeHtml(r.best, isZh)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        const rightPremRows = premHist.map(h => {
            return `
                <div class="sps-cs-rank-row">
                    <span class="sps-cs-map-name">Season ${h.season}<small class="sps-cs-map-wins">${h.wins || 0} Win</small></span>
                    <span class="sps-cs-rank-col">${spsPremierBadgeHtml(h.current)}</span>
                    <span class="sps-cs-rank-col">${spsPremierBadgeHtml(h.best)}</span>
                </div>
            `;
        }).join('');

        const rightWingRow = wing ? `
            <div class="sps-cs-ranks-sec" style="margin-top:6px;">${esc(txt.lee_wing)}</div>
            <div class="sps-cs-rank-row">
                <span class="sps-cs-map-name"><img class="sps-lee-mode-img" src="${chrome.runtime.getURL('images/leetify/mode_wingman.svg')}" alt=""> Wingman<small class="sps-cs-map-wins">${wing.wins || 0} Win</small></span>
                <span class="sps-cs-rank-col">${spsRankBadgeHtml(wing.current, isZh, true)}</span>
                <span class="sps-cs-rank-col">${spsRankBadgeHtml(wing.best, isZh, true)}</span>
            </div>
        ` : '';

        const rightCsgoRow = csgo ? `
            <div class="sps-cs-ranks-sec" style="margin-top:6px;">${esc(txt.cs_csgo_rank || 'CSGO')}</div>
            <div class="sps-cs-rank-row">
                <span class="sps-cs-map-name"><img class="sps-lee-mode-img" src="${chrome.runtime.getURL('images/logo-csgo.png')}" alt="CS:GO"><small class="sps-cs-map-wins">${csgo.wins || 0} Win</small></span>
                <span class="sps-cs-rank-col">${spsRankBadgeHtml(csgo.current, isZh, false)}</span>
                <span class="sps-cs-rank-col">${spsRankBadgeHtml(csgo.best, isZh, false)}</span>
            </div>
        ` : '';

        const rightHtml = (premHist.length || wing || csgo) ? `
            <div class="sps-cs-ranks-col sps-cs-ranks-right">
                ${premHist.length ? `
                    <div class="sps-cs-ranks-sec">${esc(txt.lee_premier)}</div>
                    <div class="sps-cs-ranks-table">
                        <div class="sps-cs-ranks-head"><span>Season</span><span>${esc(txt.cs_current_label)}</span><span>${esc(txt.cs_best_rank_label)}</span></div>
                        ${rightPremRows}
                    </div>
                ` : `
                    <div class="sps-cs-ranks-table">
                        <div class="sps-cs-ranks-head"><span>Mode</span><span>${esc(txt.cs_current_label)}</span><span>${esc(txt.cs_best_rank_label)}</span></div>
                    </div>
                `}
                ${rightWingRow}
                ${rightCsgoRow}
            </div>
        ` : '';

        return `
            <div class="sps-cs-ranks" style="display:none;">
                <div class="sps-cs-ranks-wrap">
                    ${leftHtml}
                    ${rightHtml}
                </div>
            </div>
        `;
    }

    function bindRankDrawerEvents(btn, sec) {
        if (!btn || !sec) return;
        const sEl =  (sec);
        if (typeof btn.setAttribute === 'function') btn.setAttribute('aria-expanded', 'false');
        const toggle = () => {
            const open = sEl.style.display === 'block';
            sEl.style.display = open ? 'none' : 'block';
            btn.classList.toggle('open', !open);
            if (typeof btn.setAttribute === 'function') btn.setAttribute('aria-expanded', String(!open));
        };
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle();
        });
        btn.addEventListener('keydown', (e) => {
            const ev =  (e);
            if (ev.key === 'Enter' || ev.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                toggle();
            }
        });
    }

