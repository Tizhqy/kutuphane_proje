// v1.0 - Dark mode and global versioning comment added
// Pagination settings
let uyelerPaginationPage = 1;
const UYELER_PAGE_SIZE = 30;
let allUyelerData = [];
let isLoadingMore = false;

document.addEventListener('DOMContentLoaded', function () {
    loadUyeStats();
    uyeleriGetir();
    setupSearchHandlers();
    setupWindowScroll();
    setupAddUyeButton();
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

function setupWindowScroll() {
    window.addEventListener('scroll', function() {
        // Check if scrolled to bottom (within 500px from bottom)
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            loadMoreUyeler();
        }
    });
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
                    <select id="addDurum" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
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
    const durum = document.getElementById('addDurum').value;

    // Zorunlu alanlar kontrolü
    if (!adSoyad || !email) {
        showToast('Ad soyad ve email zorunludur', 'error');
        return;
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Geçerli bir email adresi giriniz', 'error');
        return;
    }

    // Ad Soyad'ı ayır (backend Ad ve Soyad ayrı bekliyor)
    const nameParts = adSoyad.split(' ');
    const ad = nameParts[0] || adSoyad;
    const soyad = nameParts.slice(1).join(' ') || ad;

    try {
        const token = localStorage.getItem('kutuphane_token');
        if (!token) {
            showToast('Oturum sonlandırıldı', 'error');
            window.location.href = '../login.html';
            return;
        }

        // Üye kaydı için POST isteği
        const res = await fetch('http://localhost:5165/api/auth/register', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Ad: ad,
                Soyad: soyad,
                Email: email,
                Sifre: 'Temp@123' // Geçici şifre (admin tarafından atanabilir)
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
            showToast(errorData.mesaj || errorData.message || 'Üye eklenirken hata oluştu', 'error');
            return;
        }

        showToast('Üye başarıyla eklendi', 'success');
        document.querySelectorAll('.detail-modal').forEach(m => m.remove());
        
        setTimeout(() => {
            uyeleriGetir();
            loadUyeStats();
        }, 500);
    } catch (error) {
        console.error('Hata:', error);
        showToast('Üye eklenirken hata oluştu', 'error');
    }
}

function setupSearchHandlers() {
    // Tablo bölümündeki arama
    const tableSearchInput = document.querySelector('.search-table');
    if (tableSearchInput) {
        tableSearchInput.addEventListener('keyup', function() {
            applyFilters();
        });
    }

    // Durum filtresi
    const durumFiltresi = document.getElementById('durumFiltresi');
    if (durumFiltresi) {
        durumFiltresi.addEventListener('change', function() {
            applyFilters();
        });
    }
}

function applyFilters() {
    const query = document.querySelector('.search-table')?.value?.trim() || '';
    const durum = document.getElementById('durumFiltresi')?.value || '';
    
    if (!query && !durum) {
        uyeleriGetir();
    } else {
        uyeleriAraAdvanced(query, durum);
    }
}

async function uyeleriGetir() {
    const apiurl = 'http://localhost:5165/api/uyeler';
    const tblgovde = document.getElementById('uyelerTableGovde');
    if (!tblgovde) return;
    tblgovde.innerHTML = '<tr><td colspan="9">Yükleniyor...</td></tr>';

    // Reset pagination
    uyelerPaginationPage = 1;
    allUyelerData = [];

    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(apiurl, { headers });

        if (res.status === 401) {
            tblgovde.innerHTML = '<tr><td colspan="9">Oturum süreniz doldu. Lütfen yeniden giriş yapın.</td></tr>';
            setTimeout(() => window.location.href = '../login.html', 800);
            return;
        }
        if (res.status === 403) {
            tblgovde.innerHTML = '<tr><td colspan="9">Bu alan için admin yetkisi gerekir.</td></tr>';
            return;
        }
        if (!res.ok) throw new Error('Sunucu hatası: ' + res.status);

        const payload = await res.json();
        const data = Array.isArray(payload) ? payload : (payload.data ?? payload ?? []);

        // Store all data for pagination
        allUyelerData = data;
        
        // Display first page
        displayUyelerPage(0);

    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="9">Backend ile bağlantı kurulamadı.</td></tr>';
    }
}

function displayUyelerPage(startIndex) {
    const tblgovde = document.getElementById('uyelerTableGovde');
    const endIndex = startIndex + UYELER_PAGE_SIZE;
    const pageData = allUyelerData.slice(startIndex, endIndex);
    
    const rows = [];
    pageData.forEach(uye => {
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
                <td>${escapeHtml(uye.adSoyad)}</td>
                <td>${escapeHtml(uye.email)}</td>
                <td>${escapeHtml(uye.telefon || '-')}</td>
                <td>${rolHTML}</td> <td>${escapeHtml(ogrenciNo)}</td>
                <td>${kayitTarihi}</td>
                <td><span class="${durumSinifi}">${durumYazisi}</span></td>
                <td>
                    <button class="btn-edit" onclick="showUyeDetailById(${uye.id})">Detay</button>
                    <button class="btn-delete" onclick="showDeleteConfirm(${uye.id}, '${escapeHtml(uye.adSoyad)}', 'uye')">Sil</button>
                </td>
            </tr>
        `;

        rows.push(satir);
    });

    if (startIndex === 0) {
        tblgovde.innerHTML = rows.join('');
    } else {
        tblgovde.innerHTML += rows.join('');
    }
}

function loadMoreUyeler() {
    if (isLoadingMore) return;
    
    const nextIndex = uyelerPaginationPage * UYELER_PAGE_SIZE;
    if (nextIndex >= allUyelerData.length) return;
    
    isLoadingMore = true;
    uyelerPaginationPage++;
    
    setTimeout(() => {
        displayUyelerPage(nextIndex);
        isLoadingMore = false;
    }, 200);
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
            setTimeout(() => window.location.href = '../login.html', 800);
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

async function uyeleriAraAdvanced(query, durum) {
    const tblgovde = document.getElementById('uyelerTableGovde');
    if (!tblgovde) return;
    tblgovde.innerHTML = '<tr><td colspan="9">Filtreleniyor...</td></tr>';

    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const apiurl = 'http://localhost:5165/api/uyeler';
        const res = await fetch(apiurl, { headers });

        if (res.status === 401) {
            tblgovde.innerHTML = '<tr><td colspan="9">Oturum süreniz doldu. Lütfen yeniden giriş yapın.</td></tr>';
            setTimeout(() => window.location.href = '../login.html', 800);
            return;
        }
        if (res.status === 403) {
            tblgovde.innerHTML = '<tr><td colspan="9">Bu alan için admin yetkisi gerekir.</td></tr>';
            return;
        }
        if (!res.ok) throw new Error('Sunucu hatası: ' + res.status);

        const payload = await res.json();
        let data = Array.isArray(payload) ? payload : (payload.data ?? payload ?? []);

        // Filtreleme
        if (query) {
            const lowerQuery = query.toLowerCase();
            data = data.filter(uye => 
                uye.adSoyad?.toLowerCase().includes(lowerQuery) ||
                uye.email?.toLowerCase().includes(lowerQuery) ||
                uye.telefon?.toLowerCase().includes(lowerQuery) ||
                uye.ogrenciNo?.toLowerCase().includes(lowerQuery) ||
                uye.id?.toString().includes(query)
            );
        }
        
        if (durum) {
            data = data.filter(uye => uye.durum === durum);
        }

        tblgovde.innerHTML = "";
        if (data.length === 0) {
            tblgovde.innerHTML = '<tr><td colspan="9">Arama koşullarına uygun üye bulunamadı.</td></tr>';
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
                    <td>${escapeHtml(uye.adSoyad)}</td>
                    <td>${escapeHtml(uye.email)}</td>
                    <td>${escapeHtml(uye.telefon || '-')}</td>
                    <td>${rolHTML}</td> <td>${escapeHtml(ogrenciNo)}</td>
                    <td>${kayitTarihi}</td>
                    <td><span class="${durumSinifi}">${durumYazisi}</span></td>
                    <td>
                        <button class="btn-edit" onclick="showUyeDetailById(${uye.id})">Detay</button>
                        <button class="btn-delete" onclick="showDeleteConfirm(${uye.id}, '${escapeHtml(uye.adSoyad)}', 'uye')">Sil</button>
                    </td>
                </tr>
            `;

            tblgovde.innerHTML += satir;
        });
    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="9">Filtreleme yapılırken hata oluştu.</td></tr>';
    }
}


// ID'ye göre üye detayını göster
function showUyeDetailById(id) {
    const uye = allUyelerData.find(u => u.id === id);
    if (!uye) {
        showToast('Üye bulunamadı', 'error');
        return;
    }
    showUyeDetail(uye);
}

// Üye detay popup'ını göster
function escapeHtmlUye(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function showUyeDetail(uye) {
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
            <h2>${escapeHtmlUye(uye.adSoyad)}</h2>
            <div class="detail-grid">
                <div class="detail-row">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value">${uye.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${escapeHtmlUye(uye.email)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Telefon:</span>
                    <span class="detail-value">${escapeHtmlUye(uye.telefon || '-')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Öğrenci No:</span>
                    <span class="detail-value">${escapeHtmlUye(uye.ogrenciNo || '-')}</span>
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
                <button class="btn-edit" onclick="showUyeEditModal(${uye.id})">Düzenle</button>
                <button class="btn-delete" onclick="showDeleteConfirm(${uye.id}, '${escapeHtmlUye(uye.adSoyad)}', 'uye'); this.closest('.detail-modal').remove();">Sil</button>
                <button class="btn-secondary" onclick="this.closest('.detail-modal').remove();">Kapat</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Ek detayları getir
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
        // sessiz geç
    }
}

function showUyeEditModal(uyeId) {
    const uye = allUyelerData.find(u => u.id === uyeId);
    if (!uye) {
        showToast('Üye bulunamadı', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.innerHTML = `
        <div class="detail-modal-content" style="max-width: 500px;">
            <button class="detail-modal-close" onclick="this.closest('.detail-modal').remove()">✕</button>
            <h2>Üye Düzenle</h2>
            <div style="margin: 20px 0;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ad Soyad:</label>
                    <input type="text" id="editAdSoyad" value="${escapeHtmlUye(uye.adSoyad)}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
                    <input type="email" id="editEmail" value="${escapeHtmlUye(uye.email)}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Telefon:</label>
                    <input type="text" id="editTelefon" value="${escapeHtmlUye(uye.telefon || '')}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Öğrenci No:</label>
                    <input type="text" id="editOgrenciNo" value="${escapeHtmlUye(uye.ogrenciNo || '')}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Durum:</label>
                    <select id="editDurum" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                        <option value="aktif" ${uye.durum === 'aktif' || !uye.durum ? 'selected' : ''}>Aktif</option>
                        <option value="pasif" ${uye.durum === 'pasif' ? 'selected' : ''}>Pasif</option>
                        <option value="askida" ${uye.durum === 'askida' ? 'selected' : ''}>Askıda</option>
                    </select>
                </div>
            </div>
            <div class="detail-modal-actions">
                <button class="btn-edit" onclick="saveUyeChanges(${uyeId})">Kaydet</button>
                <button class="btn-secondary" onclick="this.closest('.detail-modal').remove();">İptal</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveUyeChanges(uyeId) {
    const adSoyad = document.getElementById('editAdSoyad').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const telefon = document.getElementById('editTelefon').value.trim();
    const ogrenciNo = document.getElementById('editOgrenciNo').value.trim();
    const durum = document.getElementById('editDurum').value;

    if (!adSoyad || !email) {
        showToast('Ad soyad ve email boş olamaz', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('kutuphane_token');
        if (!token) {
            showToast('Oturum sonlandırıldı', 'error');
            window.location.href = '../login.html';
            return;
        }

        const res = await fetch(`http://localhost:5165/api/uyeler/${uyeId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: uyeId,
                adSoyad,
                email,
                telefon,
                ogrenciNo,
                durum
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
            showToast('Üye güncellenirken hata oluştu', 'error');
            return;
        }

        showToast('Üye başarıyla güncellendi', 'success');
        document.querySelectorAll('.detail-modal').forEach(m => m.remove());
        setTimeout(() => {
            uyeleriGetir();
            loadUyeStats();
        }, 500);
    } catch (error) {
        console.error('Hata:', error);
        showToast('Üye güncellenirken hata oluştu', 'error');
    }
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