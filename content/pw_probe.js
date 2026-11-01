var __S_content_pw_probe_js=(function(){var T="IfbfzLWh5cPWdnJSWVQiJk8ZFvjj0oHfprvM09JmeENYUA==",P=[0],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);
    

    const PW_LOGIN_URL = __S_content_pw_probe_js(0);   

    const PW_IS_CEF = /valve steam client|steamwebhelper/i.test(
        (typeof navigator !== 'undefined' && navigator.userAgent) || '');

    let pwLoginWin = null;

    function bindPwLoginUI() {
        const loginBtn = document.querySelector('#pw-login-btn');
        const clearBtn = document.querySelector('#pw-logout-btn');
        const statusEl = document.querySelector('#pw-login-status');
        if (!loginBtn) return;
        loginBtn.addEventListener('click', () => { openPwLoginWindow(statusEl); pwWaiting(statusEl); });
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                try {
                    chrome.runtime.sendMessage({ type: 'PW_TOKEN_CLEAR' }, () => {
                        void chrome.runtime.lastError;   
                        const tokEl = document.getElementById('pw_token');
                        if (tokEl) tokEl.value = '';
                        const pv = document.getElementById('pw-verify-status');
                        if (pv) { pv.textContent = '⭕ 未配置'; pv.style.color = ''; }
                        updatePwLoginStatus(statusEl);
                    });
                } catch (e0) {  }
            });
        }

        try {
            chrome.storage.onChanged.addListener(( changes,  areaName) => {
                const tok = areaName === 'local' && changes ? changes.sps_pw_token : null;
                const sid = areaName === 'sync' && changes ? changes.sps_pw_mysteamid : null;
                if (!tok && !sid) return;   
                pwMirrorCredsIntoInputs();
                if (tok && String(tok.newValue || '')) pwAfterCapture(statusEl);
                else updatePwLoginStatus(statusEl);
            });
        } catch (e1) {  }
        updatePwLoginStatus(statusEl);
    }

    function openPwLoginTab(done) {
        
        const report = (opened, why) => { if (done) done({ opened, why }); };
        let hasTabs = false;
        try { hasTabs = !(typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.create); } catch (e0) { hasTabs = false; }
        if (!hasTabs) {
            if (PW_IS_CEF) { report(false, '这个环境没有 tabs API（Steam 内置浏览器）'); return; }
            try {
                const h = window.open(PW_LOGIN_URL, '_blank');
                report(!!h, h ? '已用 window.open 开新窗口' : 'window.open 返回空（被浏览器拦了）');
            } catch (e2) { report(false, 'window.open 抛异常：' + String((e2 && e2.message) || e2)); }
            return;
        }
        
        const openInKnownWindow = () => {
            const wins =  (typeof chrome === 'undefined' ? null : chrome.windows);
            if (!wins || typeof wins.getAll !== 'function') { report(false, 'tabs.create 报「没有当前窗口」，且这个环境连 windows API 也没有'); return; }
            try {
                wins.getAll({}, ( ws) => {
                    const le = chrome.runtime.lastError;
                    if (le) { report(false, 'windows.getAll 报错：' + String(le.message || le)); return; }
                    const id = (Array.isArray(ws) ? ws : []).map((x) => x && x.id).filter((n) => n !== undefined && n !== null)[0];
                    if (id === undefined) { openInNewWindow(); return; }
                    createTab({ windowId: id, active: true }, '已开标签（指定窗口 #' + id + '） #');
                });
            } catch (e3) { report(false, 'windows.getAll 抛异常：' + String((e3 && e3.message) || e3)); }
        };
        
        const openInNewWindow = () => {
            const wins =  (typeof chrome === 'undefined' ? null : chrome.windows);
            if (!wins || typeof wins.create !== 'function') { report(false, '没有可用窗口，且这个环境没有 windows.create'); return; }
            try {
                wins.create({ url: PW_LOGIN_URL }, ( wi) => {
                    const le = chrome.runtime.lastError;
                    if (le) { report(false, '新建窗口被拒：' + String(le.message || le)); return; }
                    const id = wi && wi.id;
                    report(!!id, id ? '已新建窗口 #' + id + ' 打开登录页' : '新建窗口没回 id（宿主没真开）');
                });
            } catch (e4) { report(false, 'windows.create 抛异常：' + String((e4 && e4.message) || e4)); }
        };
        
        const createTab = (extra, okLabel, retryOnNoWindow) => {
            try {
                chrome.tabs.create(Object.assign({ url: PW_LOGIN_URL }, extra), ( t) => {
                    const le = chrome.runtime.lastError;
                    if (le) {
                        const msg = String(le.message || le);
                        
                        if (retryOnNoWindow && /no current window/i.test(msg)) { openInKnownWindow(); return; }
                        report(false, 'tabs.create 报错：' + msg); return;
                    }
                    const id = t && t.id;
                    report(!!id, id ? okLabel + id : '宿主回了个没有 id 的标签（没真开）');
                });
            } catch (e1) { report(false, 'tabs.create 抛异常：' + String((e1 && e1.message) || e1)); }
        };
        createTab({ active: true }, '已开标签 #', true);
    }

    function pwShowManualLogin(win) {
        if (!win || win.__manualShown) return;   
        const body = win.querySelector('.f5e-login-body');
        if (!body) return;
        win.__manualShown = true;
        const loader = win.querySelector('.f5e-login-loader');
        if (loader) loader.textContent = '🚫 标签页没开出去 —— 用下面这行网址手动走登录';
        const row = document.createElement('div');
        row.style.cssText = 'padding:10px 12px;border-top:1px solid #2b3340;text-align:left;';
        row.innerHTML = '<div style="font-size:11px;color:#8b97a8;margin-bottom:6px;">登录网址（点一下即全选，Ctrl+C 复制）：</div>' +
            '<input id="pw-manual-url" type="text" readonly value="' + PW_LOGIN_URL + '"' +
            ' style="width:100%;box-sizing:border-box;font-size:11px;padding:6px 8px;color:#cdd6e0;background:#1b2230;border:1px solid #2f3a4a;border-radius:6px;">';
        body.appendChild(row);
        const inp =  (row.querySelector('#pw-manual-url'));
        if (inp) {
            inp.addEventListener('focus', () => inp.select());
            inp.addEventListener('click', () => inp.select());
        }
    }

    function openPwLoginWindow(statusEl) {
        pwCloseLoginWindow();
        const win = document.createElement('div');
        win.className = 'f5e-login-window';
        win.innerHTML = `
            <div class="f5e-login-head">
                <span class="f5e-login-title">🎮 完美 Steam 登录 — 登录成功后自动抓取凭证</span>
                <span class="f5e-login-head-btns">
                    <button type="button" class="f5e-login-ctrl f5e-login-grab" id="pw-grab-btn" title="查一次凭证是否已落库">抓取</button>
                    <button type="button" class="f5e-login-ctrl" id="pw-tab-btn" title="再开一次登录页（标签页被关了/没开出来时用）">↗</button>
                    <button type="button" class="f5e-login-ctrl" id="pw-login-close" title="关闭">✕</button>
                </span>
            </div>
            <div class="f5e-login-body">
                <div class="f5e-login-loader">🌐 已在浏览器新标签页打开完美登录页<br><span style="display:inline-block;margin-top:10px;color:#5a6675;font-size:11px;">在标签页里点「STEAM账号登录」走完授权<br>token 回跳到地址栏即被自动捕获，本窗自行收尾，不用回来点按钮</span></div>
            </div>
            <div class="f5e-login-foot" id="pw-login-foot">标签页里走完 Steam 授权即自动回填凭证（token 只存本地，捕获在标签页那一侧完成）。标签页没开出来就点 ↗ 再试一次。</div>`;
        document.body.appendChild(win);
        pwLoginWin = win;

        const w0 = win.offsetWidth || 440, h0 = win.offsetHeight || 560;
        win.style.left = Math.max(8, (window.innerWidth - w0) / 2) + 'px';
        win.style.top = Math.max(8, (window.innerHeight - h0) / 2) + 'px';

        const w = win;

        const head = win.querySelector('.f5e-login-head');
        let drag = null;
        head.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button, a')) return;
            const r = win.getBoundingClientRect();
            drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
            try { head.setPointerCapture(e.pointerId); } catch (e0) {  }
            e.preventDefault();
        });
        head.addEventListener('pointermove', (e) => {
            if (!drag) return;
            const ww = win.offsetWidth, wh = win.offsetHeight;
            const x = Math.min(Math.max(e.clientX - drag.dx, 24 - ww), window.innerWidth - 24);
            const y = Math.min(Math.max(e.clientY - drag.dy, 0), window.innerHeight - 36);
            win.style.left = x + 'px';
            win.style.top = y + 'px';
            win.style.right = 'auto'; win.style.bottom = 'auto';
        });
        head.addEventListener('pointerup', () => { drag = null; });
        head.addEventListener('pointercancel', () => { drag = null; });

        const foot = win.querySelector('#pw-login-foot');

        const openTab = () => openPwLoginTab((r) => {
            if (pwLoginWin !== win || r.opened) return;   
            foot.textContent = '⚠️ 标签页没开出去（' + r.why + '）。' +
                (PW_IS_CEF ? 'Steam 内置浏览器里这里不会改用弹窗 —— 宿主把弹窗落到当前窗口，选项页会被整个顶掉。' : '') +
                '复制窗里那行网址，用系统浏览器打开走完登录，再把地址栏里的 token 贴进「登录凭证」框。';
            foot.classList.add('f5e-login-foot-warn');
            pwShowManualLogin(win);
        });
        openTab();
        win.querySelector('#pw-tab-btn').addEventListener('click', openTab);
        win.querySelector('#pw-login-close').addEventListener('click', () => pwCloseLoginWindow());
        win.querySelector('#pw-grab-btn').addEventListener('click', () => {
            try {
                chrome.storage.local.get({ sps_pw_token: '' }, ( r) => {
                    if (chrome.runtime.lastError) return;
                    if (String((r && r.sps_pw_token) || '').trim()) {
                        foot.textContent = '✅ 凭证已在库（正在回填设置页…）';
                        foot.classList.add('f5e-login-foot-ok');
                        pwAfterCapture(statusEl);
                        return;
                    }
                    foot.textContent = '⚠️ 还没抓到 token：确认标签页里点过「STEAM账号登录」并走完授权（回跳地址栏里会短暂出现 token）。' +
                        '标签页停在登录页也没关系 —— 去诊断包看 [PW] 捕获探针 有没有命中 partner 页（一条都没有 = 脚本没进那页 = host 权限未生效）';
                    foot.classList.add('f5e-login-foot-warn');
                });
            } catch (e0) {  }
        });

        w._hintTimer = setTimeout(() => {
            if (!pwLoginWin) return;
            chrome.storage.local.get({ sps_pw_token: '' }, ( r) => {
                if (chrome.runtime.lastError || String((r && r.sps_pw_token) || '').trim()) return;
                foot.textContent = PW_IS_CEF
                    ? 'ℹ️ 12 秒还没抓到凭证：内置浏览器里标签页可能压根没弹出来（宿主收了开标签的请求，不代表你能看见它）。' +
                      '窗里那行网址复制到其他浏览器走完登录，再把地址栏里的 token 贴进「登录凭证」框。'
                    : 'ℹ️ 还没抓到凭证：多半是标签页里的 Steam 授权没走完（或那一页要求重新登录）。' +
                      '在标签页里从头点一次「STEAM账号登录」，成功后本窗会自己收到落库通知并收尾。';
                foot.classList.add('f5e-login-foot-warn');
                if (PW_IS_CEF) pwShowManualLogin(win);
            });
        }, 12000);
    }

    function pwCloseLoginWindow() {
        const win = pwLoginWin;
        pwLoginWin = null;
        if (!win) return;
        if (win._hintTimer) clearTimeout(win._hintTimer);
        try { win.remove(); } catch (e0) {  }
    }

    function pwMirrorCredsIntoInputs() {
        try {
            chrome.storage.local.get({ sps_pw_token: '' }, ( l) => {
                if (chrome.runtime.lastError) return;
                const tok = String(l.sps_pw_token || '');
                const tokEl =  (document.getElementById('pw_token'));
                if (tokEl && tok && tokEl.value.trim() !== tok) tokEl.value = tok;
                chrome.storage.sync.get({ sps_pw_mysteamid: '' }, ( s) => {
                    if (chrome.runtime.lastError) return;
                    const sid = String(s.sps_pw_mysteamid || '').replace(/\D/g, '');
                    const sidEl =  (document.getElementById('pw_mysteamid'));
                    if (sidEl && sid && !sidEl.value.trim()) sidEl.value = sid;
                });
            });
        } catch (e0) {  }
    }

    function pwAfterCapture( statusEl) {
        pwMirrorCredsIntoInputs();

        const doneWin = pwLoginWin;
        setTimeout(() => { if (pwLoginWin && pwLoginWin === doneWin) pwCloseLoginWindow(); }, 1200);
        if (statusEl) {
            statusEl.textContent = '✅ 凭证已自动获取（正在验证有效性…）';
            statusEl.style.color = '#4caf50';
        }
        setTimeout(() => {
            const tokEl =  (document.getElementById('pw_token'));
            const sidEl =  (document.getElementById('pw_mysteamid'));
            if (tokEl && sidEl && tokEl.value.trim() && sidEl.value.trim()) {
                const btn =  (document.getElementById('pw-verify-btn'));
                if (btn) btn.click();
                
                setTimeout(() => { if (statusEl) statusEl.textContent = '✅ 已获取登录凭证（仅存本地，可点「清除凭证」删除）'; }, 100);
                return;
            }
            if (statusEl) {
                statusEl.textContent = '⚠️ 凭证已获取，还差「凭据账号 SteamID」（填上后点「验证有效性」）';
                statusEl.style.color = '#c9a227';
            }
        }, 80);
    }

    function pwWaiting( statusEl) {
        if (!statusEl) return;
        statusEl.textContent = '⏳ 登录页已在浏览器新标签页打开：在里面选 Steam 登录，成功后自动填入';
        statusEl.style.color = '#c9a227';
    }

    function updatePwLoginStatus( statusEl) {
        if (!statusEl) return;
        try {
            chrome.storage.local.get({ sps_pw_token: '' }, ( l) => {
                if (chrome.runtime.lastError) return;
                const has = !!String(l.sps_pw_token || '').trim();
                statusEl.textContent = has
                    ? '✅ 已获取登录凭证（仅存本地，可点「清除凭证」删除）'
                    : '⭕ 未获取';
                statusEl.style.color = has ? '#4caf50' : '';
            });
        } catch (e0) {  }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindPwLoginUI);
    else bindPwLoginUI();
