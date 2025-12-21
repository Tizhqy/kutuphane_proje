document.addEventListener('DOMContentLoaded', function () {
    loadCezaStats();
    cezaGetir();
    setupSearchHandlers();
});

async function loadCezaStats() {
    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('http://localhost:5165/api/cezalar?page=1&pageSize=1000', { headers });
        if (!res.ok) return;
        
        const payload = await res.json();
        const cezalar = payload.data ?? [];
        
        const toplamCeza = cezalar.length;
        const toplamTutar = cezalar.reduce((sum, c) => sum + (c.cezaTutari || 0), 0);
        const odenmedis = cezalar.filter(c => c.durum === 'aktif').length;
        const odenmis = cezalar.filter(c => c.durum === 'odemendi' || c.durum === 'afedildi').length;
        
        const stats = document.querySelectorAll('.stat-card');
        if (stats[0]) stats[0].querySelector('.stat-number').textContent = toplamCeza;
        if (stats[1]) stats[1].querySelector('.stat-number').textContent = toplamTutar.toFixed(2) + ' ₺';
        if (stats[2]) stats[2].querySelector('.stat-number').textContent = odenmis;
        if (stats[3]) stats[3].querySelector('.stat-number').textContent = odenmedis;
    } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
    }
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function cezaGetir() {
    const apiurl = 'http://localhost:5165/api/cezalar?page=1&pageSize=1000';
    const tblgovde = document.getElementById('cezaTabloGovdesi');
    if (!tblgovde) return console.warn('Tablo govdesi bulunamadi: cezaTabloGovdesi');

    tblgovde.innerHTML = '<tr><td colspan="7">Yükleǹiyor...</td></tr>';

    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(apiurl, { headers });
        if (res.status === 401) {
            tblgovde.innerHTML = '<tr><td colspan="7">Oturum süreniz doldu. Lütfen tekrar giriş yapın.</td></tr>';
            setTimeout(() => window.location.href = 'login.html', 800);
            return;
        }
        if (res.status === 403) {
            tblgovde.innerHTML = '<tr><td colspan="7">Bu alan için admin yetkisi gerekir.</td></tr>';
            return;
        }
        if (!res.ok) throw new Error('Sunucu hatasi ' + res.status);
        const payload = await res.json();
        const data = payload.data ?? [];

        if (!Array.isArray(data) || data.length === 0) {
            tblgovde.innerHTML = '<tr><td colspan="7">Ceza kaydı bulunamadı.</td></tr>';
            return;
        }

        const rows = [];
        data.forEach(ceza => {
            let durumSinifi = 'status pending';
            let durumYazisi = 'Aktif (Ödenmemiş)';

            if (ceza.durum === 'odemendi') {
                durumSinifi = 'status available';
                durumYazisi = 'Ödenmiş';
            } else if (ceza.durum === 'afedildi') {
                durumSinifi = 'status available';
                durumYazisi = 'Affedildi';
            }

            const cezaTarihi = ceza.cezaTarihi ? new Date(ceza.cezaTarihi).toLocaleDateString('tr-TR') : '-';

            rows.push(`
                <tr>
                    <td>${escapeHtml(ceza.id)}</td>
                    <td><strong>${escapeHtml(ceza.uyeAdSoyad || '-')}</strong></td>
                    <td>${escapeHtml(ceza.kitapAdi || '-')}</td>
                    <td>${cezaTarihi}</td>
                    <td><strong>${(ceza.cezaTutari || 0).toFixed(2)} ₺</strong></td>
                    <td><span class="${durumSinifi}">${escapeHtml(durumYazisi)}</span></td>
                    <td>
                        <button class="btn-edit" onclick="cezaDetay(${escapeHtml(ceza.id)})">Detay</button>
                        <button class="btn-delete" onclick="cezaSil(${escapeHtml(ceza.id)})">Sil</button>
                    </td>
                </tr>
            `);
        });

        tblgovde.innerHTML = rows.join('');

    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="7">Backend ile bağlantı kurulamadı.</td></tr>';
    }
}

function setupSearchHandlers() {
    // Tablo bölümündeki arama
    const tableSearchInput = document.querySelector('.search-table');
    if (tableSearchInput) {
        tableSearchInput.addEventListener('keyup', function() {
            const query = this.value.trim();
            if (query) {
                searchCeza(query);
            } else {
                cezaGetir();
            }
        });
    }

    // Durum filtresi
    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            const durum = this.value;
            const searchInput = document.querySelector('.search-table');
            const query = searchInput?.value?.trim() || '';
            
            if (query || durum) {
                searchCezaAdvanced(query, durum);
            } else {
                cezaGetir();
            }
        });
    }
}

async function searchCeza(query) {
    if (!query) {
        cezaGetir();
        return;
    }
    
    const tblgovde = document.getElementById('cezaTabloGovdesi');
    tblgovde.innerHTML = '<tr><td colspan="7">Aranıyor...</td></tr>';

    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const apiurl = `http://localhost:5165/api/cezalar?page=1&pageSize=1000`;
        const res = await fetch(apiurl, { headers });
        
        if (res.status === 401) {
            tblgovde.innerHTML = '<tr><td colspan="7">Oturum süreniz doldu. Lütfen tekrar giriş yapın.</td></tr>';
            setTimeout(() => window.location.href = 'login.html', 800);
            return;
        }
        if (res.status === 403) {
            tblgovde.innerHTML = '<tr><td colspan="7">Bu alan için admin yetkisi gerekir.</td></tr>';
            return;
        }
        if (!res.ok) throw new Error('Sunucu hatasi ' + res.status);
        
        const payload = await res.json();
        let data = payload.data ?? [];

        // Frontend tarafında filtreleme
        const lowerQuery = query.toLowerCase();
        data = data.filter(ceza => 
            ceza.uyeAdSoyad?.toLowerCase().includes(lowerQuery) ||
            ceza.kitapAdi?.toLowerCase().includes(lowerQuery) ||
            ceza.id?.toString().includes(query)
        );

        if (!Array.isArray(data) || data.length === 0) {
            tblgovde.innerHTML = '<tr><td colspan="7">Aranan ceza bulunamadı.</td></tr>';
            return;
        }

        const rows = [];
        data.forEach(ceza => {
            let durumSinifi = 'status pending';
            let durumYazisi = 'Aktif (Ödenmemiş)';

            if (ceza.durum === 'odemendi') {
                durumSinifi = 'status available';
                durumYazisi = 'Ödenmiş';
            } else if (ceza.durum === 'afedildi') {
                durumSinifi = 'status available';
                durumYazisi = 'Affedildi';
            }

            const cezaTarihi = ceza.cezaTarihi ? new Date(ceza.cezaTarihi).toLocaleDateString('tr-TR') : '-';

            rows.push(`
                <tr>
                    <td>${escapeHtml(ceza.id)}</td>
                    <td><strong>${escapeHtml(ceza.uyeAdSoyad || '-')}</strong></td>
                    <td>${escapeHtml(ceza.kitapAdi || '-')}</td>
                    <td>${cezaTarihi}</td>
                    <td><strong>${(ceza.cezaTutari || 0).toFixed(2)} ₺</strong></td>
                    <td><span class="${durumSinifi}">${escapeHtml(durumYazisi)}</span></td>
                    <td>
                        <button class="btn-edit" onclick="cezaDetay(${escapeHtml(ceza.id)})">Detay</button>
                        <button class="btn-delete" onclick="cezaSil(${escapeHtml(ceza.id)})">Sil</button>
                    </td>
                </tr>
            `);
        });

        tblgovde.innerHTML = rows.join('');

    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="7">Arama yapılırken hata oluştu.</td></tr>';
    }
}

async function searchCezaAdvanced(query, durum) {
    const tblgovde = document.getElementById('cezaTabloGovdesi');
    tblgovde.innerHTML = '<tr><td colspan="7">Aranıyor...</td></tr>';

    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const apiurl = `http://localhost:5165/api/cezalar?page=1&pageSize=1000`;
        const res = await fetch(apiurl, { headers });
        
        if (res.status === 401) {
            tblgovde.innerHTML = '<tr><td colspan="7">Oturum süreniz doldu. Lütfen tekrar giriş yapın.</td></tr>';
            setTimeout(() => window.location.href = 'login.html', 800);
            return;
        }
        if (res.status === 403) {
            tblgovde.innerHTML = '<tr><td colspan="7">Bu alan için admin yetkisi gerekir.</td></tr>';
            return;
        }
        if (!res.ok) throw new Error('Sunucu hatasi ' + res.status);
        
        const payload = await res.json();
        let data = payload.data ?? [];

        // Filtreleme
        const lowerQuery = query.toLowerCase();
        data = data.filter(ceza => {
            const matchesQuery = !query || 
                ceza.uyeAdSoyad?.toLowerCase().includes(lowerQuery) ||
                ceza.kitapAdi?.toLowerCase().includes(lowerQuery) ||
                ceza.id?.toString().includes(query);
            
            const matchesDurum = !durum || ceza.durum === durum;
            
            return matchesQuery && matchesDurum;
        });

        if (!Array.isArray(data) || data.length === 0) {
            tblgovde.innerHTML = '<tr><td colspan="7">Aranan ceza bulunamadı.</td></tr>';
            return;
        }

        const rows = [];
        data.forEach(ceza => {
            let durumSinifi = 'status pending';
            let durumYazisi = 'Aktif (Ödenmemiş)';

            if (ceza.durum === 'odemendi') {
                durumSinifi = 'status available';
                durumYazisi = 'Ödenmiş';
            } else if (ceza.durum === 'afedildi') {
                durumSinifi = 'status available';
                durumYazisi = 'Affedildi';
            }

            const cezaTarihi = ceza.cezaTarihi ? new Date(ceza.cezaTarihi).toLocaleDateString('tr-TR') : '-';

            rows.push(`
                <tr>
                    <td>${escapeHtml(ceza.id)}</td>
                    <td><strong>${escapeHtml(ceza.uyeAdSoyad || '-')}</strong></td>
                    <td>${escapeHtml(ceza.kitapAdi || '-')}</td>
                    <td>${cezaTarihi}</td>
                    <td><strong>${(ceza.cezaTutari || 0).toFixed(2)} ₺</strong></td>
                    <td><span class="${durumSinifi}">${escapeHtml(durumYazisi)}</span></td>
                    <td>
                        <button class="btn-edit" onclick="cezaDetay(${escapeHtml(ceza.id)})">Detay</button>
                        <button class="btn-delete" onclick="cezaSil(${escapeHtml(ceza.id)})">Sil</button>
                    </td>
                </tr>
            `);
        });

        tblgovde.innerHTML = rows.join('');

    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="7">Arama yapılırken hata oluştu.</td></tr>';
    }
}

async function cezaDetay(id) {
    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`http://localhost:5165/api/cezalar/${id}`, { headers });
        
        if (!res.ok) {
            showToast('Ceza detayı alınamadı', 'error');
            return;
        }
        
        const payload = await res.json();
        const ceza = payload.data;
        
        const userRol = localStorage.getItem('kutuphane_rol');
        const isAdmin = userRol === 'admin';
        
        const cezaTarihi = ceza.cezaTarihi ? new Date(ceza.cezaTarihi).toLocaleDateString('tr-TR') : '-';
        const odemeTarihi = ceza.odemeTarihi ? new Date(ceza.odemeTarihi).toLocaleDateString('tr-TR') : '-';
        
        let durumYazisi = 'Aktif (Ödenmemiş)';
        let durumSinifi = 'status pending';
        
        if (ceza.durum === 'odemendi') {
            durumYazisi = 'Ödenmiş';
            durumSinifi = 'status available';
        } else if (ceza.durum === 'afedildi') {
            durumYazisi = 'Affedildi';
            durumSinifi = 'status available';
        }
        
        let affetButonu = '';
        if (isAdmin && ceza.durum === 'aktif') {
            affetButonu = `<button class="btn-edit" onclick="showAffetModal(${ceza.id})">Cezayı Affet</button>`;
        }
        
        const modal = document.createElement('div');
        modal.className = 'detail-modal';
        modal.innerHTML = `
            <div class="detail-modal-content">
                <button class="detail-modal-close" onclick="this.closest('.detail-modal').remove()">✕</button>
                <h2>Ceza Detayı</h2>
                <div class="detail-grid">
                    <div class="detail-row">
                        <span class="detail-label">Ceza ID:</span>
                        <span class="detail-value">${ceza.id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Üye:</span>
                        <span class="detail-value"><strong>${escapeHtml(ceza.uyeAdSoyad || '-')}</strong></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Kitap:</span>
                        <span class="detail-value">${escapeHtml(ceza.kitapAdi || '-')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Ceza Tarihi:</span>
                        <span class="detail-value">${cezaTarihi}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Tutar:</span>
                        <span class="detail-value"><strong>${(ceza.cezaTutari || 0).toFixed(2)} ₺</strong></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Durum:</span>
                        <span class="detail-value"><span class="${durumSinifi}">${escapeHtml(durumYazisi)}</span></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Ödeme Tarihi:</span>
                        <span class="detail-value">${odemeTarihi}</span>
                    </div>
                    ${ceza.aciklama ? `
                    <div class="detail-row">
                        <span class="detail-label">Açıklama:</span>
                        <span class="detail-value">${escapeHtml(ceza.aciklama)}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="detail-modal-actions">
                    ${affetButonu}
                    <button class="btn-secondary" onclick="this.closest('.detail-modal').remove();">Kapat</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Ceza detayı alınamadı:', error);
        showToast('Ceza detayı yükleme hatası', 'error');
    }
}

function showAffetModal(cezaId) {
    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.innerHTML = `
        <div class="detail-modal-content" style="max-width: 400px;">
            <button class="detail-modal-close" onclick="this.closest('.detail-modal').remove()">✕</button>
            <h2>Ceza Affetme</h2>
            <div style="margin: 20px 0;">
                <label for="affetNeden" style="display: block; margin-bottom: 10px; font-weight: bold;">Affetme Nedeni (İsteğe bağlı):</label>
                <textarea id="affetNeden" placeholder="Affetme nedenini yazınız..." style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; min-height: 80px; font-family: Arial, sans-serif;"></textarea>
            </div>
            <div class="detail-modal-actions">
                <button class="btn-delete" onclick="cezaAffet(${cezaId})">Affet</button>
                <button class="btn-secondary" onclick="this.closest('.detail-modal').remove();">İptal</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function cezaAffet(cezaId) {
    const neden = document.getElementById('affetNeden')?.value?.trim() || '';
    
    try {
        const token = localStorage.getItem('kutuphane_token');
        if (!token) {
            showToast('Oturum sonlandırıldı', 'error');
            window.location.href = 'login.html';
            return;
        }
        
        const res = await fetch(`http://localhost:5165/api/cezalar/${cezaId}/affe`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(neden)
        });
        
        if (res.status === 401) {
            showToast('Oturum süreniz doldu', 'error');
            setTimeout(() => window.location.href = 'login.html', 800);
            return;
        }
        
        if (res.status === 403) {
            showToast('Bu işlem için admin yetkisi gerekir', 'error');
            return;
        }
        
        if (!res.ok) {
            showToast('Ceza affetme işlemi başarısız', 'error');
            return;
        }
        
        const payload = await res.json();
        if (payload.success) {
            showToast('Ceza başarıyla affedildi', 'success');
            document.querySelectorAll('.detail-modal').forEach(m => m.remove());
            setTimeout(() => {
                cezaGetir();
                loadCezaStats();
            }, 500);
        }
        
    } catch (error) {
        console.error('Ceza affetme hatası:', error);
        showToast('Ceza affetme sırasında hata oluştu', 'error');
    }
}

function cezaSil(id) {
    showToast('Ceza silme işlevi yakında eklenecek', 'info');
}

// Detay popup fonksiyonları
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
