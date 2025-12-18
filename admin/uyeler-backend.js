document.addEventListener('DOMContentLoaded', function () {
    loadUyeStats();
    uyeleriGetir();
});

async function loadUyeStats() {
    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('http://localhost:5165/api/uyeler', { headers });
        if (!res.ok) return;
        
        const payload = await res.json();
        const uyeler = Array.isArray(payload) ? payload : (payload.data ?? payload ?? []);
        
        const toplamUye = uyeler.length;
        const aktif = uyeler.filter(u => u.durum !== 'pasif' && u.durum !== 'askida').length;
        const pasif = uyeler.filter(u => u.durum === 'pasif').length;
        const askida = uyeler.filter(u => u.durum === 'askida').length;
        
        const stats = document.querySelectorAll('.stat-card');
        if (stats[0]) stats[0].querySelector('.stat-number').textContent = toplamUye;
        if (stats[1]) stats[1].querySelector('.stat-number').textContent = aktif;
        if (stats[2]) stats[2].querySelector('.stat-number').textContent = pasif;
        if (stats[3]) stats[3].querySelector('.stat-number').textContent = askida;
    } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
    }
}

async function uyeleriGetir() {
    const apiurl = 'http://localhost:5165/api/uyeler';
    const tblgovde = document.getElementById('uyelerTableGovde');
    if (!tblgovde) return;
    tblgovde.innerHTML = '<tr><td colspan="9">Yükleniyor...</td></tr>';

    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(apiurl, { headers });

        if (res.status === 401) {
            tblgovde.innerHTML = '<tr><td colspan="9">Oturum süreniz doldu. Lütfen yeniden giriş yapın.</td></tr>';
            setTimeout(() => window.location.href = 'login.html', 800);
            return;
        }
        if (res.status === 403) {
            tblgovde.innerHTML = '<tr><td colspan="9">Bu alan için admin yetkisi gerekir.</td></tr>';
            return;
        }
        if (!res.ok) throw new Error('Sunucu hatası: ' + res.status);

        const payload = await res.json();
        const data = Array.isArray(payload) ? payload : (payload.data ?? payload ?? []);

        tblgovde.innerHTML = "";
        data.forEach(uye => {

                let durumSinifi = 'status active';
                let durumYazisi = 'Aktif';
                let rolHTML = rolRozetiOlustur(uye.rolIsimleri);
                
                if (uye.durum == 'pasif') {
                    durumSinifi = 'status overdue';
                    durumYazisi = 'Pasif';
                }

                if (uye.durum == 'askida') {
                    durumSinifi = 'status suspended';
                    durumYazisi = 'Askıda';
                }

                let kayitTarihi = uye.kayitTarihi ? new Date(uye.kayitTarihi).toLocaleDateString('tr-TR') : '-';

                let ogrenciNo = uye.ogrenciNo || '-';

                const satir = `
                    <tr>
                        <td>${uye.id}</td>
                        <td>${uye.adSoyad}</td>
                        <td>${uye.email}</td>
                        <td>${uye.telefon || '-'}</td>
                        <td>${rolHTML}</td> <td>${ogrenciNo}</td>
                        <td>${kayitTarihi}</td>
                        <td><span class="${durumSinifi}">${durumYazisi}</span></td>
                        <td>
                            <button class="btn-edit" onclick="uyeDuzenle(${uye.id})">Düzenle</button>
                            <button class="btn-delete" onclick="uyeSil(${uye.id})">Sil</button>
                        </td>
                    </tr>
                `;

            tblgovde.innerHTML += satir;
        });
    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="9">Backend ile bağlantı kurulamadı.</td></tr>';
    }
}


function uyeSil(id) {
    if (confirm(id + ' ID\'li üyeyi silmek istediğinize emin misiniz?')) {
        console.log("Silinecek ID:", id);
    }
}

async function uyeleriAra(query) {
    if (!query) {
        uyeleriGetir();
        return;
    }

    const tblgovde = document.getElementById('uyelerTableGovde');
    if (!tblgovde) return;
    tblgovde.innerHTML = '<tr><td colspan="9">Aranıyor...</td></tr>';

    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // Üye araması için API çağrısı (ad, soyad, email vs. içinde arar)
        const apiurl = `http://localhost:5165/api/uyeler`;
        const res = await fetch(apiurl, { headers });

        if (res.status === 401) {
            tblgovde.innerHTML = '<tr><td colspan="9">Oturum süreniz doldu. Lütfen yeniden giriş yapın.</td></tr>';
            setTimeout(() => window.location.href = 'login.html', 800);
            return;
        }
        if (res.status === 403) {
            tblgovde.innerHTML = '<tr><td colspan="9">Bu alan için admin yetkisi gerekir.</td></tr>';
            return;
        }
        if (!res.ok) throw new Error('Sunucu hatası: ' + res.status);

        const payload = await res.json();
        let data = Array.isArray(payload) ? payload : (payload.data ?? payload ?? []);

        // Frontend tarafında filtreleme
        const lowerQuery = query.toLowerCase();
        data = data.filter(uye => 
            uye.adSoyad?.toLowerCase().includes(lowerQuery) ||
            uye.email?.toLowerCase().includes(lowerQuery) ||
            uye.telefon?.toLowerCase().includes(lowerQuery) ||
            uye.ogrenciNo?.toLowerCase().includes(lowerQuery) ||
            uye.id?.toString().includes(query)
        );

        tblgovde.innerHTML = "";
        if (data.length === 0) {
            tblgovde.innerHTML = '<tr><td colspan="9">Aranan üye bulunamadı.</td></tr>';
            return;
        }

        data.forEach(uye => {
            let durumSinifi = 'status active';
            let durumYazisi = 'Aktif';
            let rolHTML = rolRozetiOlustur(uye.rolIsimleri);
            
            if (uye.durum == 'pasif') {
                durumSinifi = 'status overdue';
                durumYazisi = 'Pasif';
            }

            if (uye.durum == 'askida') {
                durumSinifi = 'status suspended';
                durumYazisi = 'Askıda';
            }

            let kayitTarihi = uye.kayitTarihi ? new Date(uye.kayitTarihi).toLocaleDateString('tr-TR') : '-';
            let ogrenciNo = uye.ogrenciNo || '-';

            const satir = `
                <tr>
                    <td>${uye.id}</td>
                    <td>${uye.adSoyad}</td>
                    <td>${uye.email}</td>
                    <td>${uye.telefon || '-'}</td>
                    <td>${rolHTML}</td> <td>${ogrenciNo}</td>
                    <td>${kayitTarihi}</td>
                    <td><span class="${durumSinifi}">${durumYazisi}</span></td>
                    <td>
                        <button class="btn-edit" onclick="uyeDuzenle(${uye.id})">Düzenle</button>
                        <button class="btn-delete" onclick="uyeSil(${uye.id})">Sil</button>
                    </td>
                </tr>
            `;

            tblgovde.innerHTML += satir;
        });
    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="9">Arama yapılırken hata oluştu.</td></tr>';
    }
}

function uyeDuzenle(id) {
    console.log("Düzenlenecek ID:", id);
}

// Üye detay popup'ını göster
function showUyeDetail(uye) {
    let durumYazisi = 'Aktif';
    if (uye.durum === 'pasif') durumYazisi = 'Pasif';
    else if (uye.durum === 'askida') durumYazisi = 'Askıda';

    const kayitTarihi = uye.kayitTarihi ? new Date(uye.kayitTarihi).toLocaleDateString('tr-TR') : '-';
    const rolHTML = rolRozetiOlustur(uye.rolIsimleri);

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
                    <span class="detail-value">${uye.email}</span>
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
                    <span class="detail-label">Rol:</span>
                    <span class="detail-value">${rolHTML}</span>
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
                <button class="btn-edit" onclick="uyeDuzenle(${uye.id}); this.closest('.detail-modal').remove();">Düzenle</button>
                <button class="btn-delete" onclick="uyeSil(${uye.id}); this.closest('.detail-modal').remove();">Sil</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Kitap detay popup'ını göster
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

function rolRozetiOlustur(rol) {
    if (!rol) rol = 'Öğrenci'; 

    let kucukRol = rol.toLowerCase();
    if (kucukRol.includes('super_admin') || kucukRol.includes('süper') || kucukRol.includes('super')) {
        return '<span class="badge super">👑 Süper Admin</span>';
    }

    if (kucukRol.includes('admin')) {
        return '<span class="badge admin">🔐 Admin</span>';
    }

    if (kucukRol.includes('personel') || kucukRol.includes('staff')) {
        return '<span class="badge staff">👔 Personel</span>';
    }

    if (kucukRol.includes('akademisyen') || kucukRol.includes('academic')) {
        return '<span class="badge academic">👨‍🏫 Akademisyen</span>';
    }

    return '<span class="badge student">👨‍🎓 Öğrenci</span>';
}