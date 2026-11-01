var __S_options_csqaq_js=(function(){var T="FvbfzLWh5cPWZWBRTEtpNw4DVOD6z8o=",P=[0],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);
document.getElementById('bind_csqaq_ip').addEventListener('click', () => {
    const apiKey = document.getElementById('csqaq_key').value.trim();
    if (!apiKey) {
        document.getElementById('status').textContent = '⚠️ 请先填写 CSQAQ Token';
        setTimeout(() => document.getElementById('status').textContent = '', 2000);
        return;
    }
    const btn = document.getElementById('bind_csqaq_ip');
    btn.textContent = '⏳ 绑定中...';
    btn.disabled = true;
    chrome.runtime.sendMessage({ type: "BIND_CSQAQ_IP", apiKey }, (res) => {
        btn.textContent = '🔗 绑定当前 IP 白名单';
        btn.disabled = false;
        const s = document.getElementById('status');
        if (res && res.success) {
            s.innerHTML = `✅ ${escHtml(res.data && res.data.message)}`;
        } else {
            const msg = (res && res.data && res.data.message) ? String(res.data.message) : '绑定失败';
            s.innerHTML = `❌ ${escHtml(msg)} — <a href="${__S_options_csqaq_js(0)}" target="_blank" style="color:#66c0f4;">手动绑定 ↗</a>`;
        }
        setTimeout(() => s.textContent = '', 4000);
    });
});
