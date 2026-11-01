

declare function importScripts(...urls: string[]): void;

declare var SPS_STICKER_WAIT_MS_OVERRIDE: number | undefined;

interface SpSettings {
    sps_enable?: boolean;
    sps_language?: string;
    sps_ui_mode?: 'showcase' | 'split' | 'native' | string;
    sps_scale?: number;
    sps_bg_opacity?: number;
    sps_modal_opacity?: number;
    sps_opacity?: number;
    sps_high_contrast?: boolean;
    sps_show_csstats?: boolean;
    sps_show_leetify?: boolean;
    sps_frame_mode?: 'pip' | 'modal' | string;
    
    sps_frame_auto_tab?: boolean;
    
    sps_csstats_carrier?: 'frame' | 'tab' | 'window' | string;
    
    sps_csstats_fetch?: 'auto' | 'direct' | 'tab' | string;
    sps_csstats_cef?: 'auto' | 'visible' | 'off' | string;
    sps_csstats_ttl?: number | string;
    
    sps_frame_window_nofocus?: boolean;
    sps_show_topitems?: boolean;
    sps_show_phase?: boolean;
    sps_container_style?: 'auto' | 'glass' | 'solid' | 'compact' | string;
    sps_corner_style?: 'rounded' | 'sharp' | string;
    sps_split_close_mode?: 'outside' | 'toggle' | string;
    
    sps_hover_mode?: 'hover' | 'click' | string;
    sps_inv_source?: 'steam' | 'steam_mkt' | 'csqaq' | 'steamdt' | string;
    sps_steamdt_key?: string;
    
    sps_steamdt_plat?: 'buff' | 'uuyp' | 'igxe' | 'c5' | 'steam' | string;
    
    sps_float_source?: 'bymykel' | 'steamdt' | string;
    sps_csqaq_key?: string;
    sps_csqaq_plat?: '1' | '2' | string;
    sps_csqaq_accel?: boolean;
    sps_faceit_key?: string;

    sps_leetify_key?: string;
    sps_auto_bind_csqaq?: boolean;
    sps_csqaq_bind_interval?: number;
    
    sps_faceit_cache_ttl?: number;

    sps_pw_detail?: boolean;
    sps_pw_mysteamid?: string;
    sps_pw_token?: string;
    sps_show_pw?: boolean;
    
    sps_show_5e?: boolean;

    sps_my_steamid?: string;

    sps_pw_my_steamid?: string;
    
    sps_f5e_search?: boolean;
    sps_f5e_enh?: boolean;      
    
    sps_f5e_contact?: boolean;
    
    sps_pw_search?: boolean;
    sps_cache_ttl?: number;
    sps_zh_cache_ttl?: number;
    sps_top12_threshold?: number;
    sps_sticker_steam_fallback?: boolean;   
    sps_link_source?: 'auto' | 'csqaq' | 'steamdt' | 'steam_mkt' | string;   
    sps_mkt_query_limit?: number;
    sps_pw_base_seasons?: number;
    sps_currency?: 'CNY' | 'USD' | string;
}

interface SpI18n {
    loading: string; copied: string; region: string; matches: string; winrate: string; recent: string;
    elo_label: string; kd_label: string; hs_label: string;
    profile_btn: string; stats_btn: string; link_text: string;
    inventory: string;
    error_not_found: string; error_no_cs2: string;
    error_net: string; connect_faceit: string; faceit_finder: string;
    
    connect_leetify: string; leetify_bad_key: string; leetify_not_found: string;
    leetify_http: (code: string) => string;
    native_leetify_home: string; lr_label: string; leetify_faceit_ban: string;
    
    csstats_cf_hint: string; csstats_private: string; csstats_not_found: string; csstats_open_cf: string; csstats_auth_gated: string;
    csstats_rate_limited: string;
    cs_hltv_label: string; cs_clutch_label: string; cs_most_played: string; cs_best_label: string; cs_all_ranks: string;
    cs_current_label: string; cs_best_rank_label: string; cs_csgo_rank: string; native_csstats_home: string;
    
    lee_premier: string; lee_aim: string; lee_positioning: string; lee_utility: string;
    lee_clutch: string; lee_opening: string; lee_preaim: string; lee_reaction: string;
    lee_ranks: string; lee_comp: string; lee_wing: string; lee_no_rank: string;
    inv_count: string; top_items_title: string; top_click_hint: string;
    
    inv_pending: (n: number) => string;
    
    csqaq_auth_hint: string;
    pw_btn: string; pw_title: string; id_title: string;
    
    f5e_btn: string; f5e_title: string;
    
    f5e_contact_mobile: string; f5e_contact_email: string;
    f5e_contact_off: string; f5e_contact_fail: string; f5e_contact_none: string; f5e_contact_deny: string;
    qr_title: string; qr_hint: string; qr_copy: string;
    native_title: string; native_loading: string; native_recent: string;
    native_faceit_home: string; native_top_items: string;
    native_inv_value: string; native_inv_count: string;
    native_finder: string;
    
    error_http: (code: string) => string;
    error_hint_off: string;
    
    pw_ban_badge_ok: string; pw_ban_badge_tmp: string; pw_ban_badge_pac: string;
    pw_ban_ok_tip: string;
    pw_ban_tmp_tip: (begin: string, end: string) => string;
    pw_ban_pac_tip: string; pw_ban_expired_note: string;    pw_ban_fetch_fail: string;
    pw_ban_unknown_type: string;
    
    f5e_ban_badge_ok: string;
    f5e_ban_badge_tmp: string;
    f5e_ban_badge_cheat: string;
    f5e_ban_badge_assoc: string;
    f5e_ban_badge_risk: string;
    f5e_ban_badge_unlawful: string;
    f5e_ban_badge_mal: string;
    f5e_ban_badge_roster: string;
    f5e_ban_badge_vac: string;
    f5e_ban_ok_tip: string;
    f5e_ban_tmp_tip: string;
    f5e_ban_cheat_tip: string;
    f5e_ban_assoc_tip: string;
    f5e_ban_risk_tip: string;
    f5e_ban_unlawful_tip: string;
    f5e_ban_mal_tip: string;
    f5e_ban_roster_tip: string;
    f5e_ban_vac_tip: string;
    f5e_ban_fetch_fail: string;
    f5e_ban_badge: string;          
    f5e_ban_d_type: string;         
    f5e_ban_d_reason: string;
    f5e_ban_d_start: string;
    f5e_ban_d_end: string;
    f5e_ban_d_unlimited: string;
    f5e_ban_d_verify: string;
    f5e_ban_d_limited: string;
    f5e_ban_d_match: string;
    f5e_ban_d_mate: string;
    f5e_ban_d_foe: string;
    f5e_ban_d_hint: string;
    f5e_ban_d_days: string;
    f5e_ban_d_served: string;
    
    f5e_ban_d_history: string;
    
    f5e_ban_d_nodate: string;
}

interface SpTopItemRow {
    name: string;
    name_cn?: string;
    mktUrl?: string;   
    goodId?: number;   
    qty?: number;
    unitPrice?: number;
    total?: number;
    phase?: string;
    paintIndex?: number;
    classid?: string;
    img?: string;
    rarityColor?: string;
    exterior?: string;
    type?: string;
    desc?: Array<{ v: string; c?: string }>;
    stickers?: Array<{ n: string; i?: string; kc?: boolean; slab?: boolean; p?: number; hn?: string; accUrl?: string }>;
    tags?: string[];
    itemset?: string;
    contents?: {
        items: Array<{ n: string; r?: string }>;
        rare?: Array<{ n: string; r?: string }>;
    };
    float?: number | null;
    seed?: number | null;
    nameTag?: string;
    currency?: string;      
    tradable?: boolean;     
    stickerValue?: number;  
    floatRange?: { min: number; max: number };
    mktNote?: boolean;
    buyQuote?: boolean;
    phasePriced?: boolean;
}

interface Document {
    _pwClosing?: boolean;
    _pwDragging?: boolean;
}
interface HTMLElement {
    _spsCopyTimer?: number;
    _spsDblTimer?: number;
    _pwBound?: boolean;
}

interface CustomEventMap {
    'sps-window-focus': CustomEvent<{ el: Element | null }>;
}
interface Document {
    addEventListener<K extends keyof CustomEventMap>(type: K, listener: (this: Document, ev: CustomEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof CustomEventMap>(type: K, listener: (this: Document, ev: CustomEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    dispatchEvent<K extends keyof CustomEventMap>(evt: CustomEventMap[K]): boolean;
}
interface Window {
    SPSQR?: any;
    
    __sps5eHookInstalled?: boolean;
    
    __spsPwHookInstalled?: boolean;
}
declare const SPSQR: any;

interface SpMsgFetchFaceit { type: 'FETCH_FACEIT'; steamId: string; apiKey?: string; }

interface SpMsgFetchLeetify { type: 'FETCH_LEETIFY'; steamId: string; apiKey?: string; }

interface SpMsgFetchCSStats { type: 'FETCH_CSSTATS'; steamId: string; visible?: boolean; cef?: boolean; overlay?: boolean; }

interface SpMsgCSStatsTabRole { type: 'CSSTATS_TAB_ROLE'; }

interface SpMsgCSStatsClaim { type: 'CSSTATS_CLAIM'; steamId: string; visible?: boolean; }

interface SpMsgCSStatsArmHeal { type: 'CSSTATS_ARM_HEAL'; steamId: string; returnUrl?: string; }

interface SpMsgCSStatsActivateTab { type: 'CSSTATS_ACTIVATE_TAB'; }

interface SpMsgCSStatsPageSync { type: 'CSSTATS_PAGE_SYNC'; steamId: string; profileHtml: string; statsHtml?: string; }
interface SpMsgCloseCurrentTab { type: 'CLOSE_CURRENT_TAB'; }
interface SpMsgFetchFaceitHistory { type: 'FETCH_FACEIT_HISTORY'; steamId: string; apiKey?: string;  faceitId?: string; }

interface SpMsgFetchFaceitRank { type: 'FETCH_FACEIT_RANK'; steamId?: string; apiKey?: string; faceitId?: string; region?: string; country?: string; }
interface SpMsgFetchInventory { type: 'FETCH_INVENTORY'; steamId: string;  force?: boolean; }
interface SpMsgFetchInventoryPreview { type: 'FETCH_INVENTORY_PREVIEW'; steamId: string; }
interface SpMsgBindCsqaq { type: 'BIND_CSQAQ_IP'; apiKey: string; }
interface SpMsgCheckCsqaq { type: 'CHECK_CSQAQ_IP'; apiKey: string; }
interface SpMsgClearCache { type: 'CLEAR_CACHE'; }
interface SpMsgTriggerBind { type: 'TRIGGER_CSQAQ_BIND'; }
interface SpMsgPwStats { type: 'FETCH_PW_STATS'; steamId: string; }

interface SpMsgPwStatsPhase2 { type: 'PW_STATS_PHASE2'; steamId: string; data: SpPwPhase2Data | { steamId: string; error: string }; }
interface SpMsgPwSeasonUpdate { type: 'PW_SEASON_UPDATE'; seasonId: string; }
interface SpMsgPwSeason { type: 'FETCH_PW_SEASON'; steamId: string; seasonId: string; }
interface SpMsgPwBan { type: 'FETCH_PW_BAN'; steamId: string; }
interface SpMsgClearPw { type: 'CLEAR_PW_CACHE'; steamId?: string; }
interface SpMsgSearchPw { type: 'SEARCH_PW_USER'; keyword: string; }

interface SpMsgVerifyPwToken { type: 'VERIFY_PW_TOKEN'; sps_pw_token?: string; sps_pw_mysteamid?: string; }
interface SpMsgPwTokenStatus { type: 'PW_TOKEN_STATUS'; }

interface SpMsgPwTokenCapture { type: 'PW_TOKEN_CAPTURE'; token: string; steamid?: string; source?: string; }
interface SpMsgPwCapturePing { type: 'PW_CAPTURE_PING'; page?: string; route?: string; keys?: string[]; why?: string; }
interface SpMsgPwTokenClear { type: 'PW_TOKEN_CLEAR'; }

interface SpMsgPwSteamIdHint { type: 'PW_STEAMID_HINT'; steamid: string; source?: string; }
interface SpMsgPwMatchList { type: 'FETCH_PW_MATCHLIST'; steamId: string; seasonId: string; page?: number; seasonDates?: string[]; }
interface SpMsgPwMatchDetails { type: 'FETCH_PW_MATCHDETAILS'; steamId: string; matchIds: string[]; }
interface SpPwMatchDetailRow { matchId: string; date: string; map: string; kills: number; deaths: number; assists: number; rating: number; pwRating: number; we: number; score1: number; score2: number; isWin: boolean;
    
    isTie?: boolean;
    isMvp: boolean; mode: string; score: number; scoreChange: number; stars: number; duration: number; seasonId: string; }

interface SpMsgF5eStats { type: 'FETCH_F5E_STATS'; steamId: string; domain?: string; }
interface SpMsgF5eBan { type: 'FETCH_F5E_BAN'; steamId: string; }
interface SpMsgClearF5e { type: 'CLEAR_F5E_CACHE'; steamId?: string; }
interface SpMsgF5eSeason { type: 'FETCH_F5E_SEASON'; steamId: string; season: string; uuid?: string; beginUnix?: number; endUnix?: number; currentSeason?: string; }
interface SpMsgF5eAdvanced { type: 'FETCH_F5E_ADVANCED'; uuid?: string; steamId?: string; season?: string; }
interface SpMsgF5eMore { type: 'FETCH_F5E_MORE'; uuid?: string; season?: string; beginUnix?: number; endUnix?: number; page?: number; }
interface SpMsgF5eHs { type: 'FETCH_F5E_HS'; uuid?: string; matchIds: string[]; }

interface SpMsgF5eRoster { type: 'FETCH_F5E_ROSTER'; matchId: string; uuid?: string; }

interface SpMsgPwRoster { type: 'FETCH_PW_ROSTER'; matchId: string; steamId?: string; }

interface SpMsgPwDemoLink { type: 'PW_DEMO_LINK'; matchId: string; cupId?: number; open?: boolean; }

interface SpMsgF5eKd { type: 'FETCH_F5E_KD'; uuid?: string; beginUnix?: number; endUnix?: number; seasonMatches?: number; season?: string; }

interface SpMsgF5eContact { type: 'FETCH_F5E_CONTACT'; steamId: string; uuid?: string; domain?: string; }
interface SpMsgF5eSearch { type: 'SEARCH_F5E_USER'; keyword: string; }
interface SpMsgF5eTokenGet { type: 'GET_F5E_TOKEN'; }
interface SpMsgF5eTokenStatus { type: 'F5E_TOKEN_STATUS'; }
interface SpMsgF5eTokenCapture { type: 'F5E_TOKEN_CAPTURE'; token: string; source?: string; }
interface SpMsgF5eCapturePing { type: 'F5E_CAPTURE_PING'; census?: { ck: number; names: string[]; ls: number; ss: number }; }
interface SpMsgF5eTokenClear { type: 'F5E_TOKEN_CLEAR'; }

interface SpMsgEmbedCookie { type: 'EMBED_FIX_COOKIE'; domain: string; url?: string; }

interface SpMsgEmbedOpenTab { type: 'EMBED_OPEN_TAB'; url: string; auto?: boolean; }

interface SpMsgEmbedCookieRelease { type: 'EMBED_COOKIE_RELEASE'; domain: string; }

interface SpMsgEmbedCookieStatus { type: 'EMBED_COOKIE_STATUS'; }

interface SpMsgEmbedLeetifyStoreRead { type: 'EMBED_LEETIFY_STORE_READ'; }

interface SpMsgEmbedLeetifyStoreSync { type: 'EMBED_LEETIFY_STORE_SYNC'; host: string; }

interface SpMsgEmbedLeetifyStoreDone { type: 'EMBED_LEETIFY_STORE_DONE'; host: string; applied: number; skipped: number; failed: number; }
interface SpMsgDebugExport { type: 'SPS_DEBUG_EXPORT'; }
interface SpMsgDebugClear { type: 'SPS_DEBUG_CLEAR'; }

type SpCacheDomain = 'INV' | 'FACEIT' | 'LEETIFY' | 'CSSTATS' | 'PW' | 'ZH' | 'PRICES' | 'F5E';
interface SpMsgClearCacheDomain { type: 'CLEAR_CACHE_DOMAIN'; domain: SpCacheDomain; }
interface SpMsgCacheStats { type: 'SPS_CACHE_STATS'; }
type SpMessageReq = SpMsgFetchFaceit | SpMsgFetchLeetify | SpMsgFetchCSStats | SpMsgFetchFaceitHistory | SpMsgFetchFaceitRank | SpMsgFetchInventory | SpMsgFetchInventoryPreview | SpMsgBindCsqaq | SpMsgCheckCsqaq
    | SpMsgClearCache | SpMsgTriggerBind | SpMsgPwStats | SpMsgPwSeason | SpMsgPwBan | SpMsgClearPw    | SpMsgSearchPw | SpMsgVerifyPwToken | SpMsgPwTokenStatus | SpMsgPwTokenCapture | SpMsgPwCapturePing | SpMsgPwTokenClear | SpMsgPwSteamIdHint | SpMsgPwMatchList | SpMsgPwMatchDetails | SpMsgPwRoster | SpMsgPwDemoLink | SpMsgF5eStats | SpMsgF5eBan | SpMsgF5eSeason | SpMsgF5eAdvanced | SpMsgF5eMore | SpMsgF5eHs | SpMsgF5eRoster | SpMsgF5eKd | SpMsgF5eSearch | SpMsgF5eContact | SpMsgClearF5e | SpMsgF5eTokenGet | SpMsgF5eTokenStatus | SpMsgF5eTokenCapture | SpMsgF5eCapturePing | SpMsgF5eTokenClear | SpMsgEmbedCookie | SpMsgEmbedCookieRelease | SpMsgEmbedCookieStatus | SpMsgEmbedOpenTab | SpMsgEmbedLeetifyStoreRead | SpMsgEmbedLeetifyStoreSync | SpMsgEmbedLeetifyStoreDone | SpMsgDebugExport | SpMsgDebugClear | SpMsgClearCacheDomain | SpMsgCacheStats | SpMsgCSStatsPageSync | SpMsgCSStatsTabRole | SpMsgCSStatsClaim | SpMsgCSStatsArmHeal | SpMsgCSStatsActivateTab | SpMsgCloseCurrentTab;

declare function addDebugLog(tag: string, msg: string): void;
declare function getDebugLogs(): Promise<Array<{ t: number; tag: string; m: string }>>;
declare function clearDebugLogs(): void;

interface SpFaceitOk {
    has_faceit: true;
    error?: undefined;
    nickname?: string;
    url?: string;
    country?: string;
    level?: number;
    elo?: number | string;
    region?: string;
    kd?: any;
    hs?: any;
    win_rate?: any;
    total_matches?: any;
    recent_results?: any[];
    
    histPending?: boolean;
    
    faceitId?: string;
    history?: SpFaceitMatchList;
    
    region_rank?: number;
    
    country_rank?: number;

    rankError?: string;
}
interface SpFaceitMatch {
    map: string; score: string; win: boolean; draw?: boolean; finished_at?: number;
    date?: string; rank?: number | string; mode?: string; rank_type?: number;
    
    kd?: string; kda?: string; diff?: number | string; kills?: number; deaths?: number; adr?: string; hs?: string;
}

interface SpFaceitMatchList { complete: boolean; rows: SpFaceitMatch[]; statsPending?: boolean; statsMissing?: boolean; faceitId?: string; }

interface SpFaceitErr {
    has_faceit?: boolean;
    error: string;
    faceit_finder_url?: string;
    nickname?: string;
}
type SpFaceitData = SpFaceitOk | SpFaceitErr;

interface SpLeetifyOk {
    has_leetify: true;
    error?: undefined;
    name?: string;
    
    url?: string;
    leetify_rating?: number;
    premier?: number;
    aim?: number;
    
    positioning?: number;
    utility?: number;
    
    clutch?: number;
    opening?: number;
    
    preaim?: number;
    
    reaction?: number;
    win_rate?: number;
    total_matches?: number;
    kd?: number;
    hs?: number;
    
    adr?: number;
    
    recent_rows?: SpLeeMatchRow[];
    
    competitive?: Array<{ map: string; rank: number }>;
    
    wingman?: number;
    
    recent?: string[];
    
    faceit_banned?: boolean;
}
interface SpLeetifyErr {
    has_leetify?: boolean;
    error: string;
}
type SpLeetifyData = SpLeetifyOk | SpLeetifyErr;

interface SpCSStatsData {
    name?: string;
    
    backfilling?: boolean;
    
    pending?: boolean;
    
    retryAfterMs?: number;
    
    gateFails?: number;
    kd_ratio?: number;
    hltv_rating?: number;
    matches?: number;
    win_rate?: number;
    hs_percentage?: number;
    adr?: number;
    clutch?: number;
    most_played_map?: string;
    recent_results?: ('W' | 'L' | 'T')[];
    
    recent_rows?: SpLeeMatchRow[];
    premier?: {
        current?: number;
        best?: number;
        season?: number;
        history?: { season: number; current?: number; best?: number; wins?: number }[];
    };
    competitive?: Array<{
        map: string;
        current?: number;
        best?: number;
        wins: number;
    }>;
    wingman?: {
        current?: number;
        best?: number;
        wins: number;
    };
    csgo?: {
        current?: number;
        best?: number;
        wins: number;
    };
    auth_gated?: boolean;
    error?: string;
}

interface SpLeeMatchRow {
    map: string;
    
    score: string;
    win: boolean;
    draw?: boolean;
    
    finished_at?: number;
    
    date?: string;
    
    rank?: number | string;
    
    mode?: string;
    
    rank_type?: number;
    kd?: string;
    
    kda?: string;
    
    diff?: number | string;
    adr?: string;
    hs?: string;
}

interface SpInvCategory { c: number; v: number; }
interface SpCategories {
    skins?: SpInvCategory; cases?: SpInvCategory; keys?: SpInvCategory; agents?: SpInvCategory;
    stickers?: SpInvCategory; graffiti?: SpInvCategory; other?: SpInvCategory;
}
interface SpInventoryData {
    item_count: number;
    total_value: string;        
    error: string | null;       
    currency?: string;          
    source_label?: string;      
    top_items?: SpTopItemRow[];
    categories?: SpCategories | null;
    pendingTotal?: boolean;     
    pendingCount?: number;      
    pendingSince?: number;      
    force?: boolean;            
    incomplete?: boolean;       
    overCap?: boolean;          
}

interface SpPwBanRecord {
    forbidType: string;   
    pac: boolean;         
    active: boolean;      
    begin: string;        
    end: string;          
    nickname: string;
}
type SpPwBanData =
    | { success: true; error?: undefined; records: SpPwBanRecord[]; queriedAt: number }
    | { success?: false; error: string }
    
    | { success?: false; pending: true; records: SpPwBanRecord[] };
interface SpPwSeasonEntry {
    season: string; score: number; peak: number; cnt: number;
    winRate: number; latestDate: string; current: boolean;
    
    stars?: number; peakStars?: number;
}
type SpPwStatsData =
    | { success: true; error?: undefined; name: string; summary: string; avatar: string; seasonList: SpPwSeasonEntry[]; maxScore: number; maxSeason: string; currentSeason: string; pwBan?: SpPwBanData;
        
        phase2?: boolean; matchHistory?: SpPwNormalized['matchHistory'];
        
        stars?: number }
    | { success?: false; error: string };

interface SpPwPhase2Data {
    steamId: string;
    
    name?: string; avatar?: string; summary?: string;
    seasonList: SpPwSeasonEntry[]; maxScore: number; maxSeason: string;
    currentSeason: string; matchHistory: SpPwNormalized['matchHistory']; phase2: false;
    
    stars?: number;
}
type SpPwSeasonData = { success?: boolean; error?: string; [k: string]: any };
interface SpPwUser { steamId?: string; pvpNickName?: string; appNickName?: string; [k: string]: any; }

interface SpF5eUser { username: string; domain: string; avatar?: string; }
interface SpF5eStats { rating: number; rws: number; adr: number; kpr?: number; winStreak: number; elo?: number; }
interface SpF5eMatch {
    matchId: string;

    matchType?: number;
    
    gameMode?: number; startTime: number; endTime?: number; map: string; isWin: boolean;
    
    mapName?: string; isTie?: boolean;
    score1: number; score2: number; changeElo: number; kills: number; deaths: number;
    
    assists?: number;
    rws?: number; adr?: number; rating?: number; isMvp?: boolean; isSvp?: boolean;
}
interface SpF5eAdvanced {
    entry: number; utility: number; lurker: number; understanding: number; sniper: number;

    subs?: Record<string, Array<{ k: string; v: number }>>;
    finalScore: number; professionValue: number; avgValue: number;
    role: string; roleDesc: string; roleAdj: string; roleProperty: string; gameCnt: number;
}
interface SpF5eData {
    success?: true;
    
    error?: string;
    steamId?: string;
    domain?: string;
    uuid?: string;
    username?: string;
    avatar?: string;
    credit?: number;
    elo?: number;
    levelId?: number;
    starNum?: number;
    
    levelType?: number;
    
    starElo?: number;
    rank?: number;
    
    seasonKd?: number;

    seasonMatches?: number;
    
    advanced?: SpF5eAdvanced | null;
    matchTotal?: number;
    matchWin?: number;
    matchLoss?: number;
    matchTie?: number;
    bestSeason?: string;
    eloSeq?: Array<{ isWin: boolean; changeElo: number }>;
    stats?: SpF5eStats | null;
    matches?: SpF5eMatch[];
    
    ban?: SpF5eBanData;
    
    seasonList?: SpF5eSeasonRow[];
    currentSeason?: string;
    maxElo?: number;
    phase2?: boolean;
}

interface SpF5eBanData {
    success?: true;
    error?: string;
    status: number;
    anticheat: number;
    
    kind: string;
    banned: boolean;
    temp: boolean;
    active: boolean;
    loginBannedUntil: number;
    queriedAt: number;
}

interface SpF5eSeasonRow {
    season: string;
    beginUnix?: number;
    endUnix?: number;
    current: boolean;
    matches: number;
    wins: number;
    losses: number;
    elo: number;
    rank: number;
    levelId?: number;
    levelType?: number;
    
    starNum?: number;
}

interface SpF5eSeasonData {
    success?: true;
    error?: string;
    season: string;
    matches: number;
    wins: number;
    losses: number;
    ties: number;
    elo?: number;
    levelId?: number;
    levelType?: number;
    starNum?: number;
    rank?: number;
    rating: number;
    
    rating3?: number;

    avgRating3?: number;

    maxRating3?: number;
    rws: number;
    adr: number;
    hs: number;
    mvp: number;

    kdCnt?: number;
    
    maxStreak?: number;
    maps?: Array<{ map: string; cnt: number; winRate: number; rating: number; rws: number; adr: number }>;
    weapons?: Array<{ weapon: string; kills: number; hs: number }>;
    recentMatches?: SpF5eMatch[];   
    recentMatchesRaw?: number;   
}

interface SpF5eRosterPlayer {
    uid?: number; uuid?: string; username?: string; nickname?: string; avatar?: string;
    domain?: string; steamId?: string;
    levelId?: number; levelType?: number; starNum?: number;
    
    elo?: number;
    kills: number; deaths: number; assists: number; adr: number; hs: number; rws: number;
    ss?: number | null;

    rating?: number; rating2?: number;
    k1?: number; k2?: number; k3?: number; k4?: number; k5?: number;
    isMvp?: boolean; isSvp?: boolean;
    
    liveUrl?: string;
}

interface SpF5eRoster {
    success?: boolean; error?: string;
    matchId?: string; map?: string; mapName?: string;
    score1?: number; score2?: number; startTime?: number; endTime?: number; duration?: number;
    season?: string; matchMode?: number; roundTotal?: number; mvpUid?: number;
    
    winner?: number;
    teams?: SpF5eRosterPlayer[][];
}

interface SpPwRosterPlayer {
    steamId: string; nickname?: string; avatar?: string;
    kills: number; deaths: number; assists: number; adr: number; hs: number; we: number;

    rating?: number; pwRating?: number; mvps?: number; level?: number; win?: boolean;

    rankText?: string; rankScore?: number;
    
    isMvp?: boolean; isSvp?: boolean;
    
    extra?: Array<{ k: string; label: string; cat: string; v: number; s?: string }>;
    nameKey?: string; idKey?: string;
}
interface SpPwRoster {
    success?: boolean; error?: string;
    matchId?: string; map?: string; score1?: number; score2?: number;

    startTime?: string; endTime?: string; duration?: number; roundTotal?: number;
    
    teams?: SpPwRosterPlayer[][];
    players?: SpPwRosterPlayer[];

    demoReady?: boolean;
}
interface SpMessageResponse {
    CSSTATS_CLAIM: { success: true; role: string | null; steamId: string };
    FETCH_FACEIT: { success: true; data: SpFaceitData };
    FETCH_LEETIFY: { success: true; data: SpLeetifyData };
    FETCH_CSSTATS: { success: true; data: SpCSStatsData };
    CSSTATS_PAGE_SYNC: { success: boolean; data?: SpCSStatsData; error?: string };
    CSSTATS_TAB_ROLE: { success: boolean; role: string | null; steamId?: string; returnUrl?: string };
    CSSTATS_ARM_HEAL: { success: boolean; error?: string };
    CSSTATS_ACTIVATE_TAB: { success: boolean; error?: string };
    CLOSE_CURRENT_TAB: { success: true };
    
    FETCH_FACEIT_RANK: { success: true; data: { region_rank?: number; country_rank?: number; rankError?: string } };
    FETCH_FACEIT_HISTORY: { success: true; data: SpFaceitMatchList | { error: string } };
    FETCH_INVENTORY: { success: true; data: SpInventoryData };
    FETCH_INVENTORY_PREVIEW: { success: true; data: SpInventoryData };
    BIND_CSQAQ_IP: { success: true; data: { success: boolean; message?: string } };
    CHECK_CSQAQ_IP: { success: true; data: { bound: boolean; reason: string } };
    CLEAR_CACHE: { success: true; cleared: number };
    TRIGGER_CSQAQ_BIND: { success: true };
    FETCH_PW_STATS: { success: true; data: SpPwStatsData };
    FETCH_PW_SEASON: { success: true; data: SpPwSeasonData };
    FETCH_PW_BAN: { success: true; data: SpPwBanData };
    CLEAR_PW_CACHE: { success: true; cleared: number };
    SEARCH_PW_USER: { success: true; data: { users?: SpPwUser[]; error?: string } };
    VERIFY_PW_TOKEN: { success: boolean; data: { success?: boolean; nickname?: string; error?: string } };
    PW_TOKEN_STATUS: { success: true; data: { configured: boolean; valid?: boolean; nickname?: string; error?: string; checkedAt?: number } };
    
    PW_TOKEN_CAPTURE: { success: boolean; changed?: boolean; mySteamId?: string; error?: string };
    PW_STEAMID_HINT: { success: boolean; mySteamId?: string };
    PW_CAPTURE_PING: { success: true };
    PW_TOKEN_CLEAR: { success: true };
    FETCH_PW_MATCHLIST: { success: boolean; data: { success?: boolean; rows?: SpPwMatchDetailRow[]; page?: number; officialSummary?: string; error?: string; reason?: string } };
    FETCH_PW_MATCHDETAILS: { success: boolean; data: { details?: Record<string, { adr: number }>; error?: string } };
    
    FETCH_PW_ROSTER: { success: boolean; data: SpPwRoster };

    PW_DEMO_LINK: { success: boolean; error?: string; url?: string; opened?: boolean; resolved?: boolean };
    FETCH_F5E_STATS: { success: true; data: SpF5eData };
    FETCH_F5E_BAN: { success: true; data: SpF5eBanData };
    CLEAR_F5E_CACHE: { success: true; cleared: number };
    FETCH_F5E_SEASON: { success: true; data: SpF5eSeasonData };
    FETCH_F5E_ADVANCED: { success: boolean; data: SpF5eAdvanced | null };
    FETCH_F5E_MORE: { success: boolean; data: { season: string; page: number; rows: SpF5eMatch[]; rawCount: number } };

    FETCH_F5E_KD: { success: boolean; data?: { kd: number; cnt: number; pages: number }; error?: string };

    FETCH_F5E_HS: { success: boolean; data: { hs: Record<string, { hs: number; adr: number; assist?: number; ss?: number | null; seg?: { sum: number; n: number } | null }> } };
    
    FETCH_F5E_ROSTER: { success: boolean; data: SpF5eRoster };
    
    FETCH_F5E_CONTACT: { success: boolean; data: { success?: boolean; disabled?: boolean; mobile?: string; email?: string; error?: string } };
    SEARCH_F5E_USER: { success: true; data: { users?: SpF5eUser[]; error?: string } };
    
    GET_F5E_TOKEN: { success: true; token: string; source?: string };
    F5E_TOKEN_STATUS: { success: true; tokenPresent: boolean; tokenLen: number; cookiesApi: boolean; cookieScanHit: boolean; cookieScanLen: number; cookieCount: number; cookieKnownNames: string[]; cookieJwtShaped: number; cookiePartitioned: number; cookieApiErr: string; extVersion: string; cookieAllCount: number; cookieCtrlCount: number; capturePing: { n: number; last: number; censuses: Array<{ t: number; ck: number; names: string[]; ls: number; ss: number }> }; bearerSeen: number; setCookieSeen: number };
    
    F5E_CAPTURE_PING: { success: true };
    F5E_TOKEN_CAPTURE: { success: true; stored: boolean; changed?: boolean };   
    F5E_TOKEN_CLEAR: { success: true };

    EMBED_FIX_COOKIE: { success: true; inject?: { installed: boolean; id: number; error: string; scopeMode?: string; pairs?: number; dropped?: number; names?: string[]; extra?: string[] | null; err?: string; sync?: string; syncCount?: number } };
    EMBED_OPEN_TAB: { success: boolean; error?: string };
    EMBED_COOKIE_RELEASE: { success: boolean; released?: boolean; id?: number; error?: string };

    EMBED_LEETIFY_STORE_READ: { ok: boolean; host?: string; items?: Array<{ k: string; v: string }>; dropped?: number; error?: string };
    EMBED_LEETIFY_STORE_SYNC: { ok: boolean; count?: number; items?: Array<{ k: string; v: string }>; error?: string };
    EMBED_LEETIFY_STORE_DONE: { ok: boolean; error?: string };
    EMBED_COOKIE_STATUS: { success: boolean; error?: string; allowList?: string[]; steamDomain?: string; scopeModes?: string[]; ruleIds?: number[]; api?: boolean; rules?: Array<{ id: number; priority: number; requestDomains: string[] | null; topDomains: string[] | null; initiatorDomains: string[] | null; resourceTypes: string[] | null; scopeMode: string; operation: string; cookieNames: string[]; cookiePairs: number; cookieBytes: number }> };
    SPS_DEBUG_EXPORT: { success: true; diagnostics: {
        exportedAt: string; extensionVersion: string; userAgent: string;
        settings: Record<string, unknown>;
        cacheCount: number;
        cacheSummary: Array<{ key: string; ts: string | null; bytes: number }>;
        
        cacheCore?: { epoch: number; l1: { size: number; max: number }; inflight: { keys: string[] }; breakers: Record<string, { kind: string; streak: number; until: number; remainingMs: number; tripped: boolean }> };
        
        embed?: { success: boolean; error?: string; allowList?: string[]; topDomains?: string[]; ruleIds?: number[]; api?: boolean; rules?: Array<{ id: number; priority: number; requestDomains: string[] | null; topDomains: string[] | null; resourceTypes: string[] | null; operation: string; cookieNames: string[]; cookiePairs: number; cookieBytes: number }> };
        logs: Array<{ t: number; tag: string; m: string }>;
    } };
    SPS_DEBUG_CLEAR: { success: true };
    CLEAR_CACHE_DOMAIN: { success: boolean; cleared?: number; domain?: SpCacheDomain; error?: string };
    SPS_CACHE_STATS: { success: true; stats: {
        totalBytes: number; quotaBytes: number;
        domains: Record<'INV' | 'FACEIT' | 'PW' | 'ZH' | 'PRICES' | 'OTHER', number>;
        domainBytes: Record<'INV' | 'FACEIT' | 'PW' | 'ZH' | 'PRICES' | 'OTHER', number>;
    } };
}
type SpMessageRes = SpMessageResponse[keyof SpMessageResponse];

interface SteamDescSub { name?: string; type?: string; value?: string; color?: string; }
interface SteamTag {
    internal_name?: string; name?: string; category?: string; category_name?: string;
    color?: string; localized_tag_name?: string;
}
interface SteamDescription {
    classid?: string; instanceid?: string;
    icon_url?: string; icon_url_large?: string;
    market_hash_name?: string; market_name?: string; market_name_color?: string;
    name?: string; name_color?: string; type?: string;
    tradable?: number; marketable?: number; commodity?: number;
    market_bucket_group_id?: string;
    descriptions?: SteamDescSub[];
    tags?: SteamTag[];
    fraudwarnings?: any[];
}
interface SteamAsset { appid: number; contextid: string; assetid: string; classid: string; instanceid: string; amount: string; }
interface SteamAssetProp { propertyid: number; int_value?: string | number; float_value?: number; string_value?: string; }
interface SteamAssetPropertyEntry { assetid: string; asset_properties?: SteamAssetProp[]; }
interface SteamInventoryResponse {
    success?: boolean;
    
    Error?: string;
    total_inventory_count?: number;
    assets?: SteamAsset[];
    descriptions?: SteamDescription[];
    asset_properties?: SteamAssetPropertyEntry[];
    more_items?: number;
}

interface SpPwNormalized {
    success: true;
    name: string; avatar: string; summary: string; seasonId: string;
    cnt: number; winRate: number; currentScore: number;
    historyScores: number[];
    pwRating: number; commonRating: number;
    kd: number; adr: number; avgWe: number; rws: number;
    hsRatio: number;
    kills: number; deaths: number; assists: number; mvpCount: number;
    multiKill: number;
    k2: number; k3: number; k4: number; k5: number;
    vs1: number; vs2: number; vs3: number; vs4: number; vs5: number;
    vs1WinRate: number;
    shot: number; snipe: number; breach: number; prop: number; victory: number;
    hotMaps: any[]; hotWeapons: any[]; scoreList: any[]; weList?: number[];
    
    stars?: number;
    matchHistory?: Array<{ date: string; rating: number; pwRating: number; rws: number; score: number; stars?: number; we?: number; seasonId?: string; season?: string; }>;
}
interface SpPwSeasonInfo {
    season: string; score: number; peak: number; cnt: number;
    winRate: number; name: string; latestDate: string;
    
    stars: number; peakStars: number;
}
interface SpCsqaqDplEntry {
    paint_index?: number; label?: string;
    buff_sell_price?: number; buff_buy_price?: number;
    [k: string]: any;
}
interface SpCsqaqGoodDetail {
    dpl?: SpCsqaqDplEntry[];
    goods_info?: { buff_sell_price?: number; [k: string]: any };
    [k: string]: any;
}

interface SpSteamDTPlatformPrice {
    platform?: string;         
    sellPrice?: string | number;
    biddingPrice?: string | number;   
    price?: string | number;
    [k: string]: any;
}

type SpSteamDTPriceListMap = Record<string, SpSteamDTPlatformPrice[]>;

interface SpCacheEnvelope { ts: number; ttl?: number; }

interface HTMLElement {
    value?: any;
    checked?: boolean;
    disabled?: boolean;
    type?: string;
}
interface Element {
    style: CSSStyleDeclaration;
    readonly dataset: DOMStringMap;
    title: string;
    value?: any;
    offsetWidth?: number;
    offsetHeight?: number;
    _pwBound?: boolean;
    
    _f5eBound?: boolean;
    
    _spsNavBound?: boolean;
    
    _spsTrendPage?: number;

    _spsTrendRerender?: (animDir?: number) => void;
    
    _spsSeasonReselect?: (seasonId: string) => void;
}
interface EventTarget {
    closest?(selectors: string): Element | null;
}
interface Event {
    clientX?: number;
    clientY?: number;
    pointerId?: number;
    key?: string;
}
interface Node {
    contains(other: EventTarget | Node | null): boolean;
}
