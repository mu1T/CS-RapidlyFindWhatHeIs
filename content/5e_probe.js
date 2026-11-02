var __S_content_5e_probe_js=(function(){var T="Ddnu7JqU6qmmUlxraHQQFmgvKNDe1e72moGLra1TQA8ZWTzZx+/m/4mLoqK+SUc=",P=[31,0,14],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);
    

    const F5E_LOGIN_URL = 'https://arena.5eplay.com/user/login';   

    function bindF5eLoginUI() {
        const loginBtn = document.querySelector('#f5e-login-btn');
        const logoutBtn = document.querySelector('#f5e-logout-btn');
        const statusEl = document.querySelector('#f5e-login-status');
        if (!loginBtn) return;
        loginBtn.addEventListener('click', () => openF5eLoginFrame(statusEl));
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                try {
                    chrome.runtime.sendMessage({ type: __S_content_5e_probe_js(0) }, () => {
                        if (chrome.runtime.lastError) return;   
                        updateF5eLoginStatus(statusEl);
                    });
                } catch (e0) {  }
            });
        }
        updateF5eLoginStatus(statusEl);
    }

    function openF5eLoginTab() {
        try {
            if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
                chrome.tabs.create({ url: F5E_LOGIN_URL });
                return;
            }
        } catch (e0) {  }
        try { window.open(F5E_LOGIN_URL, '_blank'); } catch (e1) {  }
    }

    function openF5eLoginFrame(statusEl) {
        document.querySelector('.f5e-login-window')?.remove();
        const win = document.createElement('div');
        win.className = 'f5e-login-window';
        win.innerHTML = `
            <div class="f5e-login-head">
                <span class="f5e-login-title">🎮 5E 登录 — 登录成功后自动抓取凭证</span>
                <span class="f5e-login-head-btns">
                    <button type="button" class="f5e-login-ctrl f5e-login-grab" id="f5e-grab-btn">抓取</button>
                    <a class="f5e-login-ctrl" href="${F5E_LOGIN_URL}" target="_blank" title="再开一次登录页（若标签页被关了；若弹回首页，点页面右上角「登录」）">↗</a>
                    <button type="button" class="f5e-login-ctrl" id="f5e-login-close" title="关闭">✕</button>
                </span>
            </div>
            <div class="f5e-login-body">
                <div class="f5e-login-loader">🌐 已在浏览器新标签页打开 5E 登录页<br><span style="display:inline-block;margin-top:10px;color:#5a6675;font-size:11px;">在标签页里完成登录（扫码/密码均可）<br>本窗口会在几秒内自动确认，无需其他操作</span></div>
            </div>
            <div class="f5e-login-foot" id="f5e-login-foot">登录页已在浏览器标签页打开（若被拦截点 ↗ 再开一次；若弹回首页，点页面右上角「登录」）。登录完成后凭证自动抓取保存；也可点「抓取」手动检测。</div>`;
        document.body.appendChild(win);
        openF5eLoginTab();

        const w = win.offsetWidth || 440, h = win.offsetHeight || 560;
        win.style.left = Math.max(8, (window.innerWidth - w) / 2) + 'px';
        win.style.top = Math.max(8, (window.innerHeight - h) / 2) + 'px';

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
        });
        head.addEventListener('pointerup', () => { drag = null; });
        head.addEventListener('pointercancel', () => { drag = null; });

        const foot = win.querySelector('#f5e-login-foot');
        let done = false;
        let autoTimer = null;

        const ok = () => {
            if (done) return;
            done = true;
            if (autoTimer) clearInterval(autoTimer);
            foot.textContent = '✅ 凭证已抓取并保存（匿名查询本就可用，登录仅作增强）';
            foot.classList.add('f5e-login-foot-ok');
            setTimeout(() => { updateF5eLoginStatus(statusEl); win.remove(); }, 1400);
        };
        const tryOnce = () => {
            try {
                chrome.runtime.sendMessage({ type: __S_content_5e_probe_js(1) }, (resp) => {
                    if (chrome.runtime.lastError) return;
                    if (resp && resp.success && resp.token) ok();
                });
            } catch (e0) {  }
        };
        win.querySelector('#f5e-grab-btn').addEventListener('click', () => {
            try {
                chrome.runtime.sendMessage({ type: __S_content_5e_probe_js(1) }, (resp) => {
                    if (chrome.runtime.lastError) return;
                    if (resp && resp.success && resp.token) { ok(); return; }
                    
                    chrome.runtime.sendMessage({ type: __S_content_5e_probe_js(2) }, (st) => {
                        if (chrome.runtime.lastError || !st || !st.success) {
                            foot.textContent = '⚠️ 未检测到登录凭证：请先在上方页面完成登录（登录后 cookie 需几秒落盘）；内嵌被拦截时点 ↗ 在新标签页登录';
                            foot.classList.add('f5e-login-foot-warn');
                            return;
                        }
                        const parts = [];
                        if (st.extVersion) parts.push('v' + st.extVersion);
                        if (st.cookieApiErr) parts.push('cookies API 报错: ' + st.cookieApiErr + '（重载扩展/检查内核权限）');
                        if (st.cookieCount < 0) parts.push('cookies API 不可用');
                        else if (!st.cookieApiErr) parts.push('cookie 扫描未命中（5E 域 cookie ' + st.cookieCount + ' 条' +
                            (st.cookieJwtShaped ? '，JWT 形状 ' + st.cookieJwtShaped + ' 条但名不匹配' : '') + '）');

                        if (typeof st.cookieAllCount === 'number' && st.cookieAllCount >= 0) {
                            parts.push('全罐可见 ' + st.cookieAllCount + ' 条' +
                                (typeof st.cookieCtrlCount === 'number' && st.cookieCtrlCount >= 0 ? '（steam 域 ' + st.cookieCtrlCount + ' 条）' : '') +
                                (st.cookieAllCount === 0 ? ' ← 全罐为 0：host_permissions 未生效或被内核策略限制，请确认加载的是仓库源码目录且无企业策略禁扩展权限' : ''));
                        }
                        
                        if (st.capturePing && st.capturePing.n >= 0) {
                            const censuses = st.capturePing.censuses || [];
                            const maxCk = censuses.reduce(( m,  c) => Math.max(m, c.ck || 0), 0);
                            const anyNames = censuses.some(( c) => c.names && c.names.length);
                            if (st.capturePing.n === 0) {
                                parts.push('注入探针 0 次（内容脚本从未进过 5E 页 —— host 权限未生效，或诊断前从未打开过 5E 页面）');
                            } else {
                                parts.push('注入探针 ' + st.capturePing.n + ' 次（内容脚本已进过 5E 页）');
                                if (maxCk > 0) {
                                    parts.push('页面内自见 cookie ' + maxCk + ' 条' + (anyNames ? '（如 ' + (censuses[0].names || []).join('/') + '）' : '') +
                                        '，而 SW 扫 5E 域为 ' + st.cookieCount + ' 条 ← ' + (st.cookieCount === 0
                                            ? 'API 层对 5E 域失明（内核 getAll 缺陷/策略），升级内核或换正式 Chrome 验证'
                                            : 'API 层可见但未命中 JWT（名不匹配/值形状）'));
                                } else {
                                    parts.push('页面内自见 cookie 0 条（页面自己在 5E 域也看不到任何 cookie ← cookie 压根没落罐：登录未真正完成，或内核禁了该站存储）');
                                }
                            }
                        }

                        if (st.capturePing && (st.capturePing.pageHook | 0) > 0) {
                            parts.push('页面钩子已捕获 ' + (st.capturePing.pageHook | 0) + ' 次（cookies API 失明时唯一可用线 —— 刷新已登录 5E 页即可命中，落库后重开弹窗生效）');
                        }
                        parts.push('本会话请求头捕获 ' + (st.bearerSeen || 0) + ' 次 / Set-Cookie 捕获 ' + (st.setCookieSeen || 0) + ' 次' +
                            ((st.bearerSeen || 0) + (st.setCookieSeen || 0) === 0 ? '（登录页未发过带凭证的请求/响应 —— 登录可能未真正完成）' : ''));
                        
                        parts.push('落库为空时：刷新任一已登录 5E 页（5eplay.com 任意页面）后点「抓取」——页面钩子线不依赖 cookies API，内核失明也能抓到');
                        parts.push(st.tokenPresent ? '落库已有旧凭证（可点下方「退出登录」清除后重试）' : '落库为空');
                        parts.push('若捕获也是 0：重载扩展后点「5E 登录」重开标签页，在页面右上角「登录」完整走完登录');
                        foot.textContent = '⚠️ ' + parts.join('；');
                        foot.classList.add('f5e-login-foot-warn');
                    });
                });
            } catch (e1) {  }
        });
        win.querySelector('#f5e-login-close').addEventListener('click', () => {
            if (autoTimer) clearInterval(autoTimer);
            win.remove();
            updateF5eLoginStatus(statusEl);
        });

        const POLL_DEADLINE = Date.now() + 10 * 60000;
        autoTimer = setInterval(() => {
            if (Date.now() > POLL_DEADLINE) {
                clearInterval(autoTimer);
                autoTimer = null;
                if (!done) foot.textContent = 'ℹ️ 自动确认已超时停止（避免长期空转）：登录完成后点上方「抓取」即可保存凭证';
                return;
            }
            tryOnce();
        }, 2000);
        tryOnce();
    }

    function updateF5eLoginStatus(statusEl) {
        if (!statusEl) return;
        try {
            chrome.runtime.sendMessage({ type: __S_content_5e_probe_js(1) }, (resp) => {
                if (chrome.runtime.lastError) return;
                const has = !!(resp && resp.success && resp.token);
                statusEl.textContent = has
                    ? '✅ 已登录（凭证已保存，可点「退出登录」清除）'
                    : '⭕ 未登录（匿名查询仍可用，登录仅作增强）';
                statusEl.style.color = has ? '#4caf50' : '';
            });
        } catch (e0) {  }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindF5eLoginUI);
    else bindF5eLoginUI();
