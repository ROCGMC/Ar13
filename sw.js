<style>
    /* ... 保留之前的 CSS ... */
    
    /* 新增互動反饋樣式 */
    .btn { 
        width: 100%; padding: 15px; border: none; border-radius: 10px; 
        font-weight: bold; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex; justify-content: center; align-items: center; gap: 8px;
    }
    
    /* 按下時的縮小感 */
    .btn:active { transform: scale(0.95); opacity: 0.8; }
    
    /* 禁用狀態（處理中） */
    .btn:disabled { background: #444 !important; color: #888; cursor: not-allowed; transform: none; }

    /* 掃描中的閃爍動畫 */
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0px rgba(0, 255, 136, 0.4); }
        70% { box-shadow: 0 0 0 15px rgba(0, 255, 136, 0); }
        100% { box-shadow: 0 0 0 0px rgba(0, 255, 136, 0); }
    }
    .scanning { animation: pulse 1.5s infinite; background: #6f42c1 !important; }

    /* 浮動提示框 */
    .toast {
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.8); color: white; padding: 10px 20px;
        border-radius: 20px; font-size: 0.9rem; z-index: 2000; display: none;
    }
</style>

<div id="toast" class="toast"></div>

<script>
    // 輔助函式：顯示反饋提示
    function showToast(msg, duration = 2000) {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.style.display = 'block';
        setTimeout(() => { t.style.display = 'none'; }, duration);
    }

    // 優化後的寫入函式
    async function saveAndSign() {
        const btn = event.currentTarget;
        const originalText = btn.innerText;
        
        const title = document.getElementById('editTitle').value;
        if (!title) { showToast("❌ 請輸入標題"); return; }

        try {
            // 進入載入狀態
            btn.disabled = true;
            btn.innerText = "🔒 正在加密簽署...";

            const pairId = "RMS_" + Date.now();
            const encoder = new TextEncoder();
            const signature = await window.crypto.subtle.sign("RSASSA-PKCS1-v1_5", keyPair.privateKey, encoder.encode(pairId));
            const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

            const data = { title, desc: document.getElementById('editDesc').value, id: pairId, sig: sigBase64 };
            localStorage.setItem(pairId, JSON.stringify(data));

            btn.innerText = "📡 請靠近 NFC 標籤...";
            
            const ndef = new NDEFReader();
            await ndef.write(`${pairId}|${sigBase64}`);
            
            showToast("✅ 寫入成功！");
            btn.innerText = "✅ 完成";
            setTimeout(() => { location.reload(); }, 1000);
        } catch (e) {
            showToast("❌ 錯誤：" + e.message);
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }

    // 優化後的讀取函式
    async function startSecureRead() {
        const btn = event.currentTarget;
        try {
            const ndef = new NDEFReader();
            await ndef.scan();
            
            btn.classList.add('scanning');
            btn.innerText = "📡 正在尋找標籤...";
            showToast("請將手機靠近標籤");

            ndef.onreading = async ({ message }) => {
                btn.classList.remove('scanning');
                btn.innerText = "🔍 解析中...";
                
                const raw = new TextDecoder().decode(message.records[0].data);
                const [pairId, sigBase64] = raw.split('|');
                
                const sigArray = new Uint8Array(atob(sigBase64).split("").map(c => c.charCodeAt(0)));
                const isValid = await window.crypto.subtle.verify(
                    "RSASSA-PKCS1-v1_5", keyPair.publicKey, sigArray, new TextEncoder().encode(pairId)
                );

                const view = document.getElementById('viewArea');
                view.style.display = 'block';
                btn.innerText = "📖 開始感應標籤"; // 重置

                if (isValid) {
                    showToast("🛡️ 驗證通過");
                    document.getElementById('vResult').innerHTML = "<span class='verify-pass'>🛡️ 正品標籤</span>";
                    const localData = JSON.parse(localStorage.getItem(pairId) || "{}");
                    document.getElementById('vTitle').innerText = localData.title || "未知內容";
                    document.getElementById('vDesc').innerText = localData.desc || "";
                } else {
                    showToast("⚠️ 警報：非法標籤");
                    document.getElementById('vResult').innerHTML = "<span class='verify-fail'>⚠️ 警告：簽章不符！</span>";
                }
            };
        } catch (e) {
            showToast("❌ 掃描啟動失敗");
        }
    }
</script>
