// Toast notification göster
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    
    // CSS animasyon
    if (!document.getElementById('toastStyle')) {
        const style = document.createElement('style');
        style.id = 'toastStyle';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // 3 saniye sonra sil
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    loadPanelStats();
    loadRecentTransactions();
    setupQuickActions();
    setupHeaderSearch();
});

async function loadPanelStats() {
    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Kitaplar verilerini al
        const kitapRes = await fetch('http://localhost:5165/api/kitaplar', { headers });
        if (!kitapRes.ok) throw new Error('Kitaplar alınamadı');
        const kitapData = await kitapRes.json();
        const kitaplar = Array.isArray(kitapData) ? kitapData : (kitapData.data ?? []);

        // İstatistikleri hesapla
        const toplamKitap = kitaplar.length;
        const mevcut = kitaplar.filter(k => k.durum === 'uygun' || k.durum !== 'odunc').length;
        const odunc = kitaplar.filter(k => k.durum === 'odunc').length;
        const bakim = kitaplar.filter(k => k.durum === 'bakim').length;

        // DOM'u güncelle
        const stats = document.querySelectorAll('.stat-card');
        if (stats[0]) stats[0].querySelector('.stat-number').textContent = toplamKitap;
        if (stats[1]) stats[1].querySelector('.stat-number').textContent = odunc;
        if (stats[2]) stats[2].querySelector('.stat-number').textContent = mevcut;
        if (stats[3]) stats[3].querySelector('.stat-number').textContent = bakim;

        showToast('Panel istatistikleri yüklendi', 'success');
    } catch (error) {
        console.error('Panel istatistikleri yüklenirken hata:', error);
        showToast('Panel istatistikleri yüklenemedi', 'error');
    }
}

async function loadRecentTransactions() {
    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Son 5 işlemi al
        const res = await fetch('http://localhost:5165/api/islemler?page=1&pageSize=5', { headers });
        if (!res.ok) throw new Error('İşlemler alınamadı');
        const payload = await res.json();
        const islemler = payload.data ?? [];

        const transactionList = document.querySelector('.transaction-list');
        
        if (!islemler || islemler.length === 0) {
            transactionList.innerHTML = '<div class="empty-state"><p>Henüz işlem yok</p></div>';
            return;
        }

        let html = '';
        islemler.forEach(islem => {
            const tarih = new Date(islem.olusturmaTarihi).toLocaleDateString('tr-TR');
            const saat = new Date(islem.olusturmaTarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            
            let durumIcon = '📦';
            if (islem.islemTuru === 'odunc') durumIcon = '📤';
            else if (islem.islemTuru === 'iade') durumIcon = '📥';
            else if (islem.islemTuru === 'rezervasyon') durumIcon = '🔖';

            html += `
                <div class="transaction-item" style="padding: 12px; border-bottom: 1px solid #eee; display: grid; grid-template-columns: 1fr auto; gap: 15px; align-items: center; cursor: pointer;" onclick="showUyeDetail({id: ${islem.uyeId}, adSoyad: '${islem.uyeAdSoyad}', email: 'Kullanıcı'})">
                    <div>
                        <div style="font-weight: 600; color: #333;">${durumIcon} ${islem.kitapAdi}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">${islem.uyeAdSoyad} • ${tarih} ${saat}</div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 11px; background: #f0f0f0; padding: 4px 8px; border-radius: 4px; display: inline-block;">${islem.durum || 'Aktif'}</span>
                    </div>
                </div>
            `;
        });

        transactionList.innerHTML = html;
    } catch (error) {
        console.error('Son işlemler yüklenirken hata:', error);
        const transactionList = document.querySelector('.transaction-list');
        transactionList.innerHTML = '<div class="empty-state"><p>İşlemler yüklenemedi</p></div>';
    }
}

function setupQuickActions() {
    const buttons = document.querySelectorAll('.action-buttons button');
    
    if (buttons[0]) {
        buttons[0].addEventListener('click', function() {
            window.location.href = 'kitaplar.html';
        });
    }
    
    if (buttons[1]) {
        buttons[1].addEventListener('click', function() {
            window.location.href = 'uyeler.html';
        });
    }
    
    if (buttons[2]) {
        buttons[2].addEventListener('click', function() {
            window.location.href = 'islemler.html';
        });
    }
}

// Detay popup fonksiyonları panel'de de çalışsın
function showKitapDetail(kitap) {
    let durumYazisi = 'Mevcut';
    if (kitap.durum === 'odunc') durumYazisi = 'Ödünçte';
    else if (kitap.durum === 'bakim') durumYazisi = 'Bakımda';

    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.innerHTML = `
        <div class="detail-modal-content">
            <button class="detail-modal-close" onclick="this.closest('.detail-modal').remove()">✕</button>
            <h2>${kitap.kitapAdi}</h2>
            <div class="detail-grid">
                <div class="detail-row">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value">${kitap.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Yazar:</span>
                    <span class="detail-value">${kitap.yazar}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Kategori:</span>
                    <span class="detail-value">${kitap.kategori || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ISBN:</span>
                    <span class="detail-value">${kitap.isbn || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Durum:</span>
                    <span class="detail-value">${durumYazisi}</span>
                </div>
            </div>
            <div class="detail-modal-actions">
                <button class="btn-edit" onclick="this.closest('.detail-modal').remove();">Kapat</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showUyeDetail(uye) {
    let durumYazisi = 'Aktif';
    if (uye.durum === 'pasif') durumYazisi = 'Pasif';
    else if (uye.durum === 'askida') durumYazisi = 'Askıda';

    const kayitTarihi = uye.kayitTarihi ? new Date(uye.kayitTarihi).toLocaleDateString('tr-TR') : '-';

    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.innerHTML = `
        <div class="detail-modal-content">
            <button class="detail-modal-close" onclick="this.closest('.detail-modal').remove()">✕</button>
            <h2>${uye.adSoyad}</h2>
            <div class="detail-grid">
                <div class="detail-row">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value">${uye.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${uye.email || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Telefon:</span>
                    <span class="detail-value">${uye.telefon || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Öğrenci No:</span>
                    <span class="detail-value">${uye.ogrenciNo || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Kayıt Tarihi:</span>
                    <span class="detail-value">${kayitTarihi}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Durum:</span>
                    <span class="detail-value">${durumYazisi}</span>
                </div>
            </div>
            <div class="detail-modal-actions">
                <button class="btn-edit" onclick="this.closest('.detail-modal').remove();">Kapat</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}
