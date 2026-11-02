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
            s.innerHTML = `❌ ${escHtml(msg)} — <a href="https://csqaq.com/home" target="_blank" style="color:#66c0f4;">手动绑定 ↗</a>`;
        }
        setTimeout(() => s.textContent = '', 4000);
    });
});
