// User sayfaları için ortak fonksiyonlar

// Toast notification utility
window.showToast = function(message, type = 'info', duration = 5000) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) container.remove();
    }, duration);
};

(function () {
    function initializeUserProfile() {
        const userId = localStorage.getItem('kutuphane_uyeId') || localStorage.getItem('kutuphane_id');
        const userName = localStorage.getItem('kutuphane_adSoyad') || localStorage.getItem('kutuphane_ad') || '';
        const userRole = localStorage.getItem('kutuphane_rol') || '';

        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRole');
        const profileEl = document.getElementById('userProfile');
        const logoutBtn = document.getElementById('logoutBtn');

        if (!userId) {
            window.location.href = 'login.html';
            return;
        }

        if (nameEl) nameEl.textContent = userName || 'Üye';
        if (roleEl) {
            const rolMap = {
                'admin': 'Admin',
                'super_admin': 'Süper Admin',
                'akademisyen': 'Akademisyen',
                'personel': 'Personel',
                'ogrenci': 'Öğrenci'
            };
            const normalizedRole = (userRole || 'ogrenci').toLowerCase().replace('_', ' ').trim();
            const displayRole = rolMap[normalizedRole] || rolMap[userRole.toLowerCase()] || 'Öğrenci';
            roleEl.textContent = displayRole;
            console.log('Rol ayarlandı:', userRole, '→', displayRole);
        }

        function logout() {
            const token = localStorage.getItem('kutuphane_token');
            
            fetch('http://localhost:5165/api/Auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).then(() => {
                localStorage.removeItem('kutuphane_id');
                localStorage.removeItem('kutuphane_ad');
                localStorage.removeItem('kutuphane_rol');
                localStorage.removeItem('kutuphane_token');
                localStorage.removeItem('kutuphane_uyeId');
                localStorage.removeItem('kutuphane_adSoyad');
                window.location.href = '../login.html';
            }).catch((error) => {
                console.error('Logout hatası:', error);
                // local storage temizleme
                localStorage.removeItem('kutuphane_id');
                localStorage.removeItem('kutuphane_ad');
                localStorage.removeItem('kutuphane_rol');
                localStorage.removeItem('kutuphane_token');
                localStorage.removeItem('kutuphane_uyeId');
                localStorage.removeItem('kutuphane_adSoyad');
                window.location.href = '../login.html';
            });
        }

        if (logoutBtn) logoutBtn.addEventListener('click', logout);

        if (profileEl) {
            profileEl.addEventListener('click', function (e) {
                if (e.target && e.target.id === 'logoutBtn') return;
                this.classList.toggle('open');
            });
        }
    }

    // DOM ready 
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUserProfile);
    } else {
        initializeUserProfile();
    }
})();

// Header'daki global arama kutusu - tüm user sayfalarında çalışır
(function() {
    function setupGlobalSearch() {
        const headerSearchInput = document.querySelector('.search-input');
        if (!headerSearchInput) return;
        
        // Eğer user-kitaplar.html sayfasındaysak, ukitaplar-backend.js zaten handle ediyor
        if (window.location.pathname.includes('user-kitaplar.html')) return;
        
        headerSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    // Kitap kataloğu sayfasına arama sorgusuyla yönlendir
                    window.location.href = `user-kitaplar.html?q=${encodeURIComponent(query)}`;
                } else {
                    window.location.href = 'user-kitaplar.html';
                }
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupGlobalSearch);
    } else {
        setupGlobalSearch();
    }
})();

// Basit ödeme (ceza) modalı - yalnızca UI, işlem yapmaz
window.showPaymentModal = function(initialAmount) {
    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 10000;
    `;

    const content = document.createElement('div');
    content.className = 'detail-modal-content';
    content.style.cssText = `
        width: 100%; max-width: 460px; background: #fff; border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.2);
        padding: 20px 20px 16px 20px; box-sizing: border-box; font-family: Arial, sans-serif;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.className = 'detail-modal-close';
    closeBtn.style.cssText = `
        border: none; background: transparent; font-size: 18px; cursor: pointer; float: right; color: #666;
    `;
    closeBtn.onclick = () => modal.remove();

    const title = document.createElement('h2');
    title.textContent = 'Ceza Ödeme';
    title.style.cssText = 'margin: 4px 0 16px 0; font-size: 20px;';

    const form = document.createElement('div');
    form.innerHTML = `
        <div style="display:grid; gap:12px;">
            <div>
                <label style="display:block; font-weight:600; margin-bottom:6px;">Tutar (₺)</label>
                <input type="number" id="odemeTutar" min="0" step="0.01" value="${initialAmount ? String(initialAmount) : ''}" placeholder="Örn: 25.00" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; font-weight:600; margin-bottom:6px;">Kart Üzerindeki İsim</label>
                <input type="text" id="odemeIsim" placeholder="Ad Soyad" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;" />
            </div>
            <div>
                <label style="display:block; font-weight:600; margin-bottom:6px;">Kart Numarası</label>
                <input type="text" id="odemeKart" placeholder="1234 5678 9012 3456" maxlength="19" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;" />
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                    <label style="display:block; font-weight:600; margin-bottom:6px;">Son Kullanma (AA/YY)</label>
                    <input type="text" id="odemeSKT" placeholder="MM/YY" maxlength="5" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;" />
                </div>
                <div>
                    <label style="display:block; font-weight:600; margin-bottom:6px;">CVV</label>
                    <input type="password" id="odemeCVV" placeholder="***" maxlength="4" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;" />
                </div>
            </div>
        </div>
    `;

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:10px; justify-content:flex-end; margin-top:16px;';
    const payBtn = document.createElement('button');
    payBtn.textContent = 'Ödemeyi Yap';
    payBtn.className = 'btn-edit';
    payBtn.style.cssText = 'background:#2e7d32; color:#fff; border:none; padding:10px 14px; border-radius:8px; cursor:pointer;';
    payBtn.onclick = () => {
        showToast('Bu bir demo ekranıdır. Ödeme işlemi yapılmayacak.', 'info');
        modal.remove();
    };
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Vazgeç';
    cancelBtn.className = 'btn-secondary';
    cancelBtn.style.cssText = 'background:#f0f0f0; color:#333; border:none; padding:10px 14px; border-radius:8px; cursor:pointer;';
    cancelBtn.onclick = () => modal.remove();

    actions.appendChild(payBtn);
    actions.appendChild(cancelBtn);

    content.appendChild(closeBtn);
    content.appendChild(title);
    content.appendChild(form);
    content.appendChild(actions);
    modal.appendChild(content);
    document.body.appendChild(modal);
};

// Kitap iade modalı: islem = { id, kitapAdi, yazar, alimTarihi }, onSuccess = callback()
window.showReturnModal = function(islem, onSuccess) {
    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 10000;`;

    const content = document.createElement('div');
    content.className = 'detail-modal-content';
    content.style.cssText = `width: 100%; max-width: 520px; background: #fff; border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.2); padding: 20px; box-sizing: border-box; font-family: Arial, sans-serif;`;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.className = 'detail-modal-close';
    closeBtn.style.cssText = 'border:none; background:transparent; font-size:18px; cursor:pointer; float:right; color:#666;';
    closeBtn.onclick = () => modal.remove();

    const title = document.createElement('h2');
    title.textContent = 'İade Et';
    title.style.cssText = 'margin: 4px 0 16px 0; font-size: 20px;';

    const alim = islem.alimTarihi ? new Date(islem.alimTarihi) : null;
    const due = alim ? new Date(alim.getTime() + 14 * 24 * 60 * 60 * 1000) : null;

    const details = document.createElement('div');
    details.style.cssText = 'display:grid; gap:10px; background:#fafafa; border:1px solid #eee; border-radius:10px; padding:12px;';
    details.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
            <div style="flex:1;">
                <div style="font-weight:700; color:#1a237e;">${(islem.kitapAdi||'Bilinmiyor')}</div>
                <div style="font-size:12px; color:#666;">${(islem.yazar||'-')}</div>
            </div>
            <div style="text-align:right; font-size:12px; color:#444;">
                <div>Alım: ${alim ? alim.toLocaleDateString('tr-TR') : '-'}</div>
                <div>İade: ${due ? due.toLocaleDateString('tr-TR') : '-'}</div>
            </div>
        </div>
        <div style="font-size:13px; color:#555;">Bu kitabı iade etmek istediğinize emin misiniz?</div>
    `;

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:10px; justify-content:flex-end; margin-top:16px;';
    const returnBtn = document.createElement('button');
    returnBtn.textContent = 'İade Et';
    returnBtn.className = 'btn-edit';
    returnBtn.style.cssText = 'background:#1a237e; color:#fff; border:none; padding:10px 14px; border-radius:8px; cursor:pointer;';
    returnBtn.onclick = async () => {
        try {
            const token = localStorage.getItem('kutuphane_token');
            if (!token) {
                window.location.href = '../login.html';
                return;
            }
            returnBtn.disabled = true;
            returnBtn.textContent = 'İade ediliyor...';
            const res = await fetch('http://localhost:5165/api/islemler/iade-et', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ islemId: islem.id })
            });
            if (!res.ok) throw new Error('İade hatası');
            showToast('Kitap iade edildi.', 'success');
            modal.remove();
            if (typeof onSuccess === 'function') onSuccess();
        } catch (e) {
            showToast('Hata: ' + e.message, 'error');
            returnBtn.disabled = false;
            returnBtn.textContent = 'İade Et';
        }
    };
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Vazgeç';
    cancelBtn.className = 'btn-secondary';
    cancelBtn.style.cssText = 'background:#f0f0f0; color:#333; border:none; padding:10px 14px; border-radius:8px; cursor:pointer;';
    cancelBtn.onclick = () => modal.remove();

    actions.appendChild(returnBtn);
    actions.appendChild(cancelBtn);

    content.appendChild(closeBtn);
    content.appendChild(title);
    content.appendChild(details);
    content.appendChild(actions);
    modal.appendChild(content);
    document.body.appendChild(modal);
};
