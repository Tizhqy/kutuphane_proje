// Pagination settings
let kitaplarPaginationPage = 1;
const KITAPLAR_PAGE_SIZE = 30;
let allKitaplarData = [];
let isLoadingMore = false;

document.addEventListener('DOMContentLoaded', function () {
    loadKitapStats();
    kitapGetir();
    loadKategoriler();
    setupSearchHandlers();
    setupWindowScroll();
});

function setupWindowScroll() {
    window.addEventListener('scroll', function() {
        // Check if scrolled to bottom (within 500px from bottom)
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            loadMoreKitaplar();
        }
    });
}

async function loadKitapStats() {
    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('http://localhost:5165/api/kitaplar', { headers });
        if (!res.ok) return;
        
        const kitapData = await res.json();
        const kitaplar = Array.isArray(kitapData) ? kitapData : (kitapData.data ?? []);
        
        const toplamKitap = kitaplar.length;
        const mevcut = kitaplar.filter(k => k.durum !== 'odunc').length;
        const odunc = kitaplar.filter(k => k.durum === 'odunc').length;
        const bakim = kitaplar.filter(k => k.durum === 'bakim').length;
        
        const stats = document.querySelectorAll('.stat-card');
        if (stats[0]) stats[0].querySelector('.stat-number').textContent = toplamKitap;
        if (stats[1]) stats[1].querySelector('.stat-number').textContent = odunc;
        if (stats[2]) stats[2].querySelector('.stat-number').textContent = mevcut;
        if (stats[3]) stats[3].querySelector('.stat-number').textContent = bakim;
    } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
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

    // Kategori filtresi
    const kategoriBilim = document.getElementById('kategoriBilim');
    if (kategoriBilim) {
        kategoriBilim.addEventListener('change', function() {
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
    const kategori = document.getElementById('kategoriBilim')?.value || '';
    const durum = document.getElementById('durumFiltresi')?.value || '';
    
    if (!query && !kategori && !durum) {
        kitapGetir();
    } else {
        searchKitaplarAdvanced(query, kategori, durum);
    }
}

async function loadKategoriler() {
    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('http://localhost:5165/api/kitaplar', { headers });
        if (!res.ok) return;
        
        const kitapData = await res.json();
        const kitaplar = Array.isArray(kitapData) ? kitapData : (kitapData.data ?? []);
        
        // Unique kategorileri çek
        const kategoriler = [...new Set(kitaplar.map(k => k.kategori).filter(k => k && k.trim()))];
        kategoriler.sort();
        
        const select = document.getElementById('kategoriBilim');
        if (select) {
            kategoriler.forEach(kat => {
                const option = document.createElement('option');
                option.value = kat;
                option.textContent = kat;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
    }
}

function escapeHtml(str) {//copilot baba onerdi burayi  
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function searchKitaplar(query) {
    if (!query) {
        kitapGetir();
        return;
    }
    
    const tblgovde = document.getElementById('kitapTabloGovdesi');
    tblgovde.innerHTML = '<tr><td colspan="6">Aranıyor...</td></tr>';

    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const apiurl = `http://localhost:5165/api/kitaplar/public/search?q=${encodeURIComponent(query)}&page=1&pageSize=1000`;
        const res = await fetch(apiurl, { headers });
        
        if (res.status === 401) {
            tblgovde.innerHTML = '<tr><td colspan="6">Oturum süreniz doldu. Lütfen tekrar giriş yapın.</td></tr>';
            setTimeout(() => window.location.href = 'login.html', 800);
            return;
        }
        if (res.status === 403) {
            tblgovde.innerHTML = '<tr><td colspan="6">Bu alan için admin yetkisi gerekir.</td></tr>';
            return;
        }
        if (!res.ok) throw new Error('Sunucu hatasi ' + res.status);
        
        const payload = await res.json();
        const data = payload.data ?? [];

        if (!Array.isArray(data) || data.length === 0) {
            tblgovde.innerHTML = '<tr><td colspan="6">Aranan kitap bulunamadı.</td></tr>';
            return;
        }

        const rows = [];
        data.forEach(kitap => {
            let durumSinifi = 'status available';
            let durumYazisi = 'Mevcut';

            if (kitap.durum === 'odunc') {
                durumSinifi = 'status borrowed';
                durumYazisi = 'Ödünçte';
            } else if (kitap.durum === 'bakim') {
                durumSinifi = 'status overdue';
                durumYazisi = 'Bakımda';
            }

            rows.push(`
                <tr>
                    <td>${escapeHtml(kitap.id)}</td>
                    <td>${escapeHtml(kitap.kitapAdi)}</td>
                    <td>${escapeHtml(kitap.yazar)}</td>
                    <td>${escapeHtml(kitap.kategori || '-')}</td>
                    <td><span class="${durumSinifi}">${escapeHtml(durumYazisi)}</span></td>
                    <td>
                        <button class="btn-edit" onclick="kitapDuzenle(${escapeHtml(kitap.id)})">Düzenle</button>
                        <button class="btn-delete" onclick="kitapSil(${escapeHtml(kitap.id)})">Sil</button>
                    </td>
                </tr>
            `);
        });

        tblgovde.innerHTML = rows.join('');

    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="6">Arama yapılırken hata oluştu.</td></tr>';
    }
}

async function searchKitaplarAdvanced(query, kategori, durum) {
    const tblgovde = document.getElementById('kitapTabloGovdesi');
    tblgovde.innerHTML = '<tr><td colspan="6">Filtreleniyor...</td></tr>';

    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (kategori) params.append('kategori', kategori);
        if (durum) {
            // Durum eşlemesi: "mevcut" → backend'de mevcut değeri
            if (durum === 'mevcut') {
                params.append('durum', 'mevcut');
            } else {
                params.append('durum', durum);
            }
        }
        params.append('page', '1');
        params.append('pageSize', '1000');
        
        const apiurl = `http://localhost:5165/api/kitaplar/public/search?${params.toString()}`;
        const res = await fetch(apiurl, { headers });
        
        if (res.status === 401) {
            tblgovde.innerHTML = '<tr><td colspan="6">Oturum süreniz doldu. Lütfen tekrar giriş yapın.</td></tr>';
            setTimeout(() => window.location.href = 'login.html', 800);
            return;
        }
        if (res.status === 403) {
            tblgovde.innerHTML = '<tr><td colspan="6">Bu alan için admin yetkisi gerekir.</td></tr>';
            return;
        }
        if (!res.ok) throw new Error('Sunucu hatasi ' + res.status);
        
        const payload = await res.json();
        const data = payload.data ?? [];

        if (!Array.isArray(data) || data.length === 0) {
            tblgovde.innerHTML = '<tr><td colspan="6">Aranan kitap bulunamadı.</td></tr>';
            return;
        }

        const rows = [];
        data.forEach(kitap => {
            let durumSinifi = 'status available';
            let durumYazisi = 'Mevcut';

            if (kitap.durum === 'odunc') {
                durumSinifi = 'status borrowed';
                durumYazisi = 'Ödünçte';
            } else if (kitap.durum === 'bakim') {
                durumSinifi = 'status overdue';
                durumYazisi = 'Bakımda';
            }

            rows.push(`
                <tr>
                    <td>${escapeHtml(kitap.id)}</td>
                    <td>${escapeHtml(kitap.kitapAdi)}</td>
                    <td>${escapeHtml(kitap.yazar)}</td>
                    <td>${escapeHtml(kitap.kategori || '-')}</td>
                    <td><span class="${durumSinifi}">${escapeHtml(durumYazisi)}</span></td>
                    <td>
                        <button class="btn-edit" onclick="showKitapDetail({id: ${escapeHtml(kitap.id)}, kitapAdi: '${escapeHtml(kitap.kitapAdi)}', yazar: '${escapeHtml(kitap.yazar)}', kategori: '${escapeHtml(kitap.kategori || '-')}', isbn: '${escapeHtml(kitap.isbn || '-')}', durum: '${kitap.durum}'})">Detay</button>
                        <button class="btn-delete" onclick="kitapSil(${escapeHtml(kitap.id)})">Sil</button>
                    </td>
                </tr>
            `);
        });

        tblgovde.innerHTML = rows.join('');

    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="6">Arama yapılırken hata oluştu.</td></tr>';
    }
}

async function kitapGetir() {
    const apiurl = 'http://localhost:5165/api/kitaplar';
    const tblgovde = document.getElementById('kitapTabloGovdesi');
    if (!tblgovde) return console.warn('Tablo govdesi bulunamadi: kitapTabloGovdesi');

    tblgovde.innerHTML = '<tr><td colspan="6">Yüklèniyor...</td></tr>';
    
    // Reset pagination
    kitaplarPaginationPage = 1;
    allKitaplarData = [];

    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(apiurl, { headers });
        if (res.status === 401) {
            tblgovde.innerHTML = '<tr><td colspan="6">Oturum süreniz doldu. Lütfen tekrar giriş yapın.</td></tr>';
            setTimeout(() => window.location.href = 'login.html', 800);
            return;
        }
        if (res.status === 403) {
            tblgovde.innerHTML = '<tr><td colspan="6">Bu alan için admin yetkisi gerekir.</td></tr>';
            return;
        }
        if (!res.ok) throw new Error('Sunucu hatasi ' + res.status);
        const payload = await res.json();
        const data = Array.isArray(payload) ? payload : (payload.data ?? []);

        if (!Array.isArray(data) || data.length === 0) {
            tblgovde.innerHTML = '<tr><td colspan="6">Kayıt bulunamadı.</td></tr>';
            return;
        }

        // Store all data for pagination
        allKitaplarData = data;
        
        // Display first page
        displayKitaplarPage(0);

    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="6">Backend ile bağlantı kurulamadı.</td></tr>';
    }
}

function displayKitaplarPage(startIndex) {
    const tblgovde = document.getElementById('kitapTabloGovdesi');
    const endIndex = startIndex + KITAPLAR_PAGE_SIZE;
    const pageData = allKitaplarData.slice(startIndex, endIndex);
    
    const rows = [];
    pageData.forEach(kitap => {
        let durumSinifi = 'status available';
        let durumYazisi = 'Mevcut';

        if (kitap.durum === 'odunc') {
            durumSinifi = 'status borrowed';
            durumYazisi = 'Ödünçte';
        } else if (kitap.durum === 'bakim') {
            durumSinifi = 'status overdue';
            durumYazisi = 'Bakımda';
        }

        rows.push(`
            <tr>
                <td>${escapeHtml(kitap.id)}</td>
                <td>${escapeHtml(kitap.kitapAdi)}</td>
                <td>${escapeHtml(kitap.yazar)}</td>
                <td>${escapeHtml(kitap.kategori || '-')}</td>
                <td><span class="${durumSinifi}">${escapeHtml(durumYazisi)}</span></td>
                <td>
                    <button class="btn-edit" onclick="showKitapDetail(${JSON.stringify(kitap)})">Detay</button>
                    <button class="btn-delete" onclick="showDeleteConfirm(${kitap.id}, '${escapeHtml(kitap.kitapAdi)}', 'kitap'); this.closest('.detail-modal')?.remove();">Sil</button>
                </td>
            </tr>
        `);
    });

    if (startIndex === 0) {
        tblgovde.innerHTML = rows.join('');
    } else {
        tblgovde.innerHTML += rows.join('');
    }
}

function loadMoreKitaplar() {
    if (isLoadingMore) return;
    
    const nextIndex = kitaplarPaginationPage * KITAPLAR_PAGE_SIZE;
    if (nextIndex >= allKitaplarData.length) return;
    
    isLoadingMore = true;
    kitaplarPaginationPage++;
    
    setTimeout(() => {
        displayKitaplarPage(nextIndex);
        isLoadingMore = false;
    }, 200);
}
function kitapSil(id) {
    if (confirm(id + ' ID\'li kitabı silmek istiyor musunuz?')) {
        console.log("Silinecek:", id);

    }
}

function kitapDuzenle(id) {
    console.log("Düzenlenecek:", id);
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
            <h2>${escapeHtml(kitap.kitapAdi)}</h2>
            <div class="detail-grid">
                <div class="detail-row">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value">${kitap.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Yazar:</span>
                    <span class="detail-value">${escapeHtml(kitap.yazar)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Kategori:</span>
                    <span class="detail-value">${escapeHtml(kitap.kategori || '-')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ISBN:</span>
                    <span class="detail-value">${escapeHtml(kitap.isbn || '-')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Durum:</span>
                    <span class="detail-value">${durumYazisi}</span>
                </div>
            </div>
            <div class="detail-modal-actions">
                <button class="btn-edit" onclick="showKitapEditModal(${kitap.id})">Düzenle</button>
                <button class="btn-delete" onclick="showDeleteConfirm(${kitap.id}, '${escapeHtml(kitap.kitapAdi)}', 'kitap'); this.closest('.detail-modal').remove();">Sil</button>
                <button class="btn-secondary" onclick="this.closest('.detail-modal').remove();">Kapat</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showKitapEditModal(kitapId) {
    const kitap = allKitaplarData.find(k => k.id === kitapId);
    if (!kitap) {
        showToast('Kitap bulunamadı', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.innerHTML = `
        <div class="detail-modal-content" style="max-width: 500px;">
            <button class="detail-modal-close" onclick="this.closest('.detail-modal').remove()">✕</button>
            <h2>Kitap Düzenle</h2>
            <div style="margin: 20px 0;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Kitap Adı:</label>
                    <input type="text" id="editKitapAdi" value="${escapeHtml(kitap.kitapAdi)}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Yazar:</label>
                    <input type="text" id="editYazar" value="${escapeHtml(kitap.yazar)}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Kategori:</label>
                    <input type="text" id="editKategori" value="${escapeHtml(kitap.kategori || '')}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">ISBN:</label>
                    <input type="text" id="editIsbn" value="${escapeHtml(kitap.isbn || '')}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Durum:</label>
                    <select id="editDurum" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="mevcut" ${kitap.durum === 'mevcut' ? 'selected' : ''}>Mevcut</option>
                        <option value="odunc" ${kitap.durum === 'odunc' ? 'selected' : ''}>Ödünçte</option>
                        <option value="bakim" ${kitap.durum === 'bakim' ? 'selected' : ''}>Bakımda</option>
                    </select>
                </div>
            </div>
            <div class="detail-modal-actions">
                <button class="btn-edit" onclick="saveKitapChanges(${kitapId})">Kaydet</button>
                <button class="btn-secondary" onclick="this.closest('.detail-modal').remove();">İptal</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveKitapChanges(kitapId) {
    const kitapAdi = document.getElementById('editKitapAdi').value.trim();
    const yazar = document.getElementById('editYazar').value.trim();
    const kategori = document.getElementById('editKategori').value.trim();
    const isbn = document.getElementById('editIsbn').value.trim();
    const durum = document.getElementById('editDurum').value;

    if (!kitapAdi || !yazar) {
        showToast('Kitap adı ve yazar boş olamaz', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('kutuphane_token');
        if (!token) {
            showToast('Oturum sonlandırıldı', 'error');
            window.location.href = 'login.html';
            return;
        }

        const res = await fetch(`http://localhost:5165/api/kitaplar/${kitapId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: kitapId,
                kitapAdi,
                yazar,
                kategori,
                isbn,
                durum
            })
        });

        if (res.status === 401) {
            showToast('Oturum süreniz doldu', 'error');
            window.location.href = 'login.html';
            return;
        }

        if (res.status === 403) {
            showToast('Bu işlem için admin yetkisi gerekir', 'error');
            return;
        }

        if (!res.ok) {
            showToast('Kitap güncellenirken hata oluştu', 'error');
            return;
        }

        showToast('Kitap başarıyla güncellendi', 'success');
        document.querySelectorAll('.detail-modal').forEach(m => m.remove());
        setTimeout(() => {
            kitapGetir();
            loadKitapStats();
        }, 500);
    } catch (error) {
        console.error('Hata:', error);
        showToast('Kitap güncellenirken hata oluştu', 'error');
    }
}

function kitapDuzenle(id) {
    showToast('Kitap düzenleme sayfası', 'info');
}

function kitapSil(id) {
    showToast('Kitap silme sayfası', 'info');
}
// Üye detay popup'ını göster
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