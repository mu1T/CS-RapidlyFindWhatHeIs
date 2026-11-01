

(function () {
    'use strict';
    const FROM_HOST = '__spsFrameHost';     
    const TO_HOST = '__spsFrameBridge';     
    const NAV_KEY = '__spsFrameNav';
    const NAV_MAX = 20;

    let isTop = false;
    try { isTop = (window.top === window.self); } catch (e) { isTop = false; }
    if (isTop) return;
    let crossOriginParent = true;
    try { void window.parent.location.href; crossOriginParent = false; } catch (e) { crossOriginParent = true; }
    if (!crossOriginParent) return;

    function readNav() {
        try {
            const a = JSON.parse(sessionStorage.getItem(NAV_KEY) || '[]');
            return Array.isArray(a) ? a.filter((x) => typeof x === 'string' && x) : [];
        } catch (e) { return []; }
    }
    
    function writeNav(a) {
        try { sessionStorage.setItem(NAV_KEY, JSON.stringify(a.slice(-NAV_MAX))); }
        catch (e) {  }
    }

    let href = '';
    try { href = String(location.href || ''); } catch (e) { href = ''; }
    
    let openHref = '';
    let openTimer = 0;
    const nav = readNav();
    if (href && nav[nav.length - 1] !== href) { nav.push(href); writeNav(nav); }

    let hostOrigin = '';

    function post(msg) {
        if (!hostOrigin) return;                 
        try {
            if (window.parent === window) return;
            msg[TO_HOST] = 1;
            window.parent.postMessage(msg, hostOrigin);
        } catch (e) {  }
    }

    function cfBlocked() {
        try {
            if (document.querySelector('#cf-wrapper, #challenge-form, .cf-browser-verification, #cf-challenge-running, #challenge-stage, #cf-please-wait')) return true;
            const txt = String((document.body && document.body.textContent) || '').slice(0, 900);
            return /该内容被屏蔽|正在进行安全验证|安全服务防护恶意自动程序|Checking your browser|Just a moment|Verify you(?:'re| are) human|needs to check your browser|Performance\s*&\s*security by Cloudflare|请稍候/.test(txt);
        } catch (e) { return false; }
    }

    function navigatesInFrame(el) {
        if (!el || !el.closest) return false;
        const a = el.closest('a[href]');
        if (a) {
            
            return String(a.target || '').toLowerCase() !== '_blank';
        }
        return !!el.closest('button, input[type="submit"], [role="button"]');
    }
    
    function handOffVerify() { post({ op: 'verify' }); }
    try {
        document.addEventListener('click', (e) => {
            if (!cfBlocked()) return;                 
            if (!navigatesInFrame( (e.target))) return;

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            handOffVerify();
        }, true);
        document.addEventListener('submit', (e) => {
            if (!cfBlocked()) return;                 
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            handOffVerify();
        }, true);
    } catch (e) {  }

    function report() {
        let sw = 0, cw = 0;
        try {
            const de = document.documentElement;
            const bd = document.body;
            sw = Math.max(de ? de.scrollWidth : 0, bd ? bd.scrollWidth : 0);
            cw = de ? de.clientWidth : 0;
        } catch (e) { sw = 0; cw = 0; }

        const blocked = cfBlocked();
        post({ op: 'metrics', sw: sw, cw: cw, canBack: nav.length > 1, blk: blocked });
        if (blocked) post({ op: 'blocked', href: href });
    }

    function goBack() {
        const stack = readNav();
        if (stack.length < 2) { report(); return; }
        stack.pop();
        writeNav(stack);
        const prev = stack[stack.length - 1];
        try { if (prev) location.replace(prev); } catch (e) {  }
    }

    try {
        window.addEventListener('message', (e) => {
            if (e.source !== window.parent) return;      
            const d = e.data;
            if (!d || d[FROM_HOST] !== 1) return;
            if (d.op === 'hello') {

                if (!hostOrigin) {
                    const o = String(e.origin || d.hostOrigin || '');
                    if (/^https?:\/\//i.test(o)) hostOrigin = o;
                }
                report();       
            }
            else if (d.op === 'back') goBack();
            else if (d.op === 'open-ack') {       
                clearTimeout(openTimer);
                openTimer = 0;
                openHref = '';
            }
        });
    } catch (e) {  }

    function matchLinkOf(a) {
        try {
            const u = new URL(String(a.href || ''), location.href);
            if (u.protocol !== 'https:') return '';
            const h = u.hostname.replace(/^www\./, '');
            if (h !== location.hostname.replace(/^www\./, '')) return '';
            return /^\/match\//.test(u.pathname) ? u.href : '';
        } catch (e) { return ''; }
    }

    function matchHrefFrom(el) {
        const a = el && el.closest ? el.closest('a[href]') : null;
        if (a) { const h = matchLinkOf(a); if (h) return h; }
        
        for (let n = el, i = 0; n && i < 6; n = n.parentElement, i++) {
            const oc = n.getAttribute ? n.getAttribute('onclick') : '';
            if (!oc) continue;
            const m = String(oc).match(/\/match\/(\d+)/);
            if (m) return location.origin + '/match/' + m[1];
        }
        
        const row = el && el.closest ? el.closest('tr') : null;
        const inRow = row ? row.querySelector('a[href*="/match/"]') : null;
        if (inRow) return matchLinkOf(inRow);
        return '';
    }
    try {
        document.addEventListener('click', (e) => {
            const t =  (e.target);
            const href = matchHrefFrom(t);
            if (!href) return;

            e.preventDefault();
            e.stopPropagation();
            openHref = href;
            post({ op: 'open', href: href });

            clearTimeout(openTimer);
            openTimer = setTimeout(() => {
                if (!openHref) return;
                try { location.href = openHref; } catch (err) {  }
            }, 700);
        }, true);
    } catch (e) {  }

    try {
        window.addEventListener('load', report);
        window.addEventListener('resize', report);
    } catch (e) {  }
    setTimeout(report, 600);
    setTimeout(report, 2000);
})();
