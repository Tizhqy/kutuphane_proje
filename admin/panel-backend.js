// v1.0 - Dark mode and global versioning comment added
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
    setupAddKitapButton();
    setupAddUyeButton();
});

async function loadPanelStats() {
    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Kitap ve aktif ceza verilerini paralel çek
        const [kitapRes, cezaRes] = await Promise.all([
            fetch('http://localhost:5165/api/kitaplar', { headers }),
            fetch('http://localhost:5165/api/cezalar?page=1&pageSize=1&durum=aktif', { headers })
        ]);

        if (!kitapRes.ok) throw new Error('Kitaplar alınamadı');
        if (!cezaRes.ok) throw new Error('Cezalar alınamadı');

        const kitapData = await kitapRes.json();
        const kitaplar = Array.isArray(kitapData) ? kitapData : (kitapData.data ?? []);

        const cezaPayload = await cezaRes.json();
        const aktifCezaToplam = typeof cezaPayload.total === 'number' ? cezaPayload.total : ((cezaPayload.data ?? []).length);

        // İstatistikleri hesapla
        const toplamKitap = kitaplar.length;
        const odunc = kitaplar.filter(k => k.durum === 'odunc').length;
        const musait = kitaplar.filter(k => k.durum === 'musait').length;

        // DOM'u güncelle: 1)Toplam, 2)Ödünç, 3)Müsait, 4)Geç Kalan (aktif ceza)
        const stats = document.querySelectorAll('.stat-card');
        if (stats[0]) stats[0].querySelector('.stat-number').textContent = toplamKitap;
        if (stats[1]) stats[1].querySelector('.stat-number').textContent = odunc;
        if (stats[2]) stats[2].querySelector('.stat-number').textContent = musait;
        if (stats[3]) stats[3].querySelector('.stat-number').textContent = aktifCezaToplam;

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
    // Hızlı Eylemler butonları artık modal açacak
    // setupAddKitapButton ve setupAddUyeButton tarafından yönetiliyor
}

function setupAddKitapButton() {
    const addBtn = document.getElementById('addKitap');
    if (addBtn) {
        addBtn.addEventListener('click', showAddKitapModal);
    }
}

function showAddKitapModal() {
    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.innerHTML = `
        <div class="detail-modal-content" style="max-width: 500px;">
            <button class="detail-modal-close" onclick="this.closest('.detail-modal').remove()">✕</button>
            <h2>Yeni Kitap Ekle</h2>
            <div style="margin: 20px 0;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Kitap Adı: <span style="color: red;">*</span></label>
                    <input type="text" id="addKitapAdi" placeholder="Kitap adını giriniz" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Yazar: <span style="color: red;">*</span></label>
                    <input type="text" id="addYazar" placeholder="Yazar adını giriniz" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Kategori:</label>
                    <input type="text" id="addKategori" placeholder="Kategori giriniz" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">ISBN:</label>
                    <input type="text" id="addIsbn" placeholder="ISBN numarası" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Yayın Yılı:</label>
                    <input type="number" id="addYayinYili" placeholder="Örn: 2024" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Durum:</label>
                    <select id="addDurumKitap" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                        <option value="musait">Müsait</option>
                        <option value="odunc">Ödünçte</option>
                        <option value="bakim">Bakımda</option>
                    </select>
                </div>
            </div>
            <div class="detail-modal-actions">
                <button class="btn-edit" onclick="saveNewKitap()">Ekle</button>
                <button class="btn-secondary" onclick="this.closest('.detail-modal').remove();">Vazgeç</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveNewKitap() {
    const kitapAdi = document.getElementById('addKitapAdi').value.trim();
    const yazar = document.getElementById('addYazar').value.trim();
    const kategori = document.getElementById('addKategori').value.trim();
    const isbn = document.getElementById('addIsbn').value.trim();
    const yayinYili = document.getElementById('addYayinYili').value.trim();
    const durum = document.getElementById('addDurumKitap').value;

    if (!kitapAdi || !yazar) {
        showToast('Kitap adı ve yazar zorunludur', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('kutuphane_token');
        if (!token) {
            showToast('Oturum sonlandırıldı', 'error');
            window.location.href = '../login.html';
            return;
        }

        const body = { kitapAdi, yazar, durum };
        if (kategori) body.kategori = kategori;
        if (isbn) body.isbn = isbn;
        if (yayinYili) body.yayinYili = parseInt(yayinYili);

        const res = await fetch('http://localhost:5165/api/kitaplar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (res.status === 401) {
            showToast('Oturum süreniz doldu', 'error');
            window.location.href = '../login.html';
            return;
        }

        if (res.status === 403) {
            showToast('Bu işlem için admin yetkisi gerekir', 'error');
            return;
        }

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            showToast(errorData.message || 'Kitap eklenirken hata oluştu', 'error');
            return;
        }

        showToast('Kitap başarıyla eklendi', 'success');
        document.querySelectorAll('.detail-modal').forEach(m => m.remove());
        
        setTimeout(() => {
            loadPanelStats();
            loadRecentTransactions();
        }, 500);
    } catch (error) {
        console.error('Hata:', error);
        showToast('Kitap eklenirken hata oluştu', 'error');
    }
}

function setupAddUyeButton() {
    const addBtn = document.getElementById('addUye');
    if (addBtn) {
        addBtn.addEventListener('click', showAddUyeModal);
    }
}

function showAddUyeModal() {
    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.innerHTML = `
        <div class="detail-modal-content" style="max-width: 500px;">
            <button class="detail-modal-close" onclick="this.closest('.detail-modal').remove()">✕</button>
            <h2>Yeni Üye Ekle</h2>
            <div style="margin: 20px 0;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ad Soyad: <span style="color: red;">*</span></label>
                    <input type="text" id="addUyeAdi" placeholder="Üye adını giriniz" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email: <span style="color: red;">*</span></label>
                    <input type="email" id="addMail" placeholder="Üye e-mailini giriniz" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Telefon:</label>
                    <input type="text" id="addTel" placeholder="Telefon giriniz" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Öğrenci Numarası:</label>
                    <input type="text" id="addOgno" placeholder="Öğrenci numarası" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Durum:</label>
                    <select id="addDurumUye" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                        <option value="aktif">Aktif</option>
                        <option value="pasif">Pasif</option>
                        <option value="askida">Askıda</option>
                    </select>
                </div>
            </div>
            <div class="detail-modal-actions">
                <button class="btn-edit" onclick="saveNewUye()">Ekle</button>
                <button class="btn-secondary" onclick="this.closest('.detail-modal').remove();">Vazgeç</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveNewUye() {
    const adSoyad = document.getElementById('addUyeAdi').value.trim();
    const email = document.getElementById('addMail').value.trim();
    const telefon = document.getElementById('addTel').value.trim();
    const ogrenciNo = document.getElementById('addOgno').value.trim();
    const durum = document.getElementById('addDurumUye').value;

    if (!adSoyad || !email) {
        showToast('Ad soyad ve email zorunludur', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Geçerli bir email adresi giriniz', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('kutuphane_token');
        if (!token) {
            showToast('Oturum sonlandırıldı', 'error');
            window.location.href = '../login.html';
            return;
        }

        const res = await fetch('http://localhost:5165/api/auth/register', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adSoyad,
                email,
                telefon: telefon || null,
                ogrenciNo: ogrenciNo || null,
                durum,
                sifre: 'Temp@123'
            })
        });

        if (res.status === 401) {
            showToast('Oturum süreniz doldu', 'error');
            window.location.href = '../login.html';
            return;
        }

        if (res.status === 403) {
            showToast('Bu işlem için admin yetkisi gerekir', 'error');
            return;
        }

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            showToast(errorData.message || 'Üye eklenirken hata oluştu', 'error');
            return;
        }

        showToast('Üye başarıyla eklendi', 'success');
        document.querySelectorAll('.detail-modal').forEach(m => m.remove());
        
        setTimeout(() => {
            loadPanelStats();
            loadRecentTransactions();
        }, 500);
    } catch (error) {
        console.error('Hata:', error);
        showToast('Üye eklenirken hata oluştu', 'error');
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

async function showUyeDetail(uye) {
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
                <div class="detail-row">
                    <span class="detail-label">Aktif Ödünç:</span>
                    <span class="detail-value" id="uye-aktif-odunc-${uye.id}">Yükleniyor...</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Aktif Ceza:</span>
                    <span class="detail-value" id="uye-aktif-ceza-${uye.id}">Yükleniyor...</span>
                </div>
            </div>
            <div class="detail-modal-actions">
                <button class="btn-edit" onclick="this.closest('.detail-modal').remove();">Kapat</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Ek ayrıntıları getir (aktif ödünç ve aktif ceza)
    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const [islemRes, cezaRes] = await Promise.all([
            fetch(`http://localhost:5165/api/islemler?page=1&pageSize=50&durum=odunc&uyeId=${uye.id}`, { headers }),
            fetch(`http://localhost:5165/api/cezalar?page=1&pageSize=1&durum=aktif&uyeId=${uye.id}`, { headers })
        ]);
        if (islemRes.ok) {
            const payload = await islemRes.json();
            const aktifOdunc = (payload.data ?? []).filter(x => !x.iadeTarihi).length;
            const el = document.getElementById(`uye-aktif-odunc-${uye.id}`);
            if (el) el.textContent = String(aktifOdunc);
        }
        if (cezaRes.ok) {
            const payload = await cezaRes.json();
            const aktifCeza = typeof payload.total === 'number' ? payload.total : ((payload.data ?? []).length);
            const el = document.getElementById(`uye-aktif-ceza-${uye.id}`);
            if (el) el.textContent = String(aktifCeza);
        }
    } catch (e) {
        // Sessizce geç
    }
}
