// Admin sayfaları için ortak fonksiyonlar

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

async function handleLogout() {
    const token = localStorage.getItem('kutuphane_token');
    
    try {
        const response = await fetch('http://localhost:5165/api/Auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            localStorage.removeItem('kutuphane_token');
            localStorage.removeItem('kutuphane_rol');
            localStorage.removeItem('kutuphane_id');
            localStorage.removeItem('kutuphane_ad');
            localStorage.removeItem('kutuphane_uyeId');
            localStorage.removeItem('kutuphane_adSoyad');
            alert('Başarıyla çıkış yapıldı!');
            window.location.href = '../login.html';
        }
    } catch (error) {
        console.error('Logout hatası:', error);
        // Hata olsa bile local storage'ı temizle
        localStorage.removeItem('kutuphane_token');
        localStorage.removeItem('kutuphane_rol');
        localStorage.removeItem('kutuphane_id');
        localStorage.removeItem('kutuphane_ad');
        localStorage.removeItem('kutuphane_uyeId');
        localStorage.removeItem('kutuphane_adSoyad');
        window.location.href = '../login.html';
    }
}

// Header arama kutosunu yönet - Hem kitap hem üye araması
function setupHeaderSearch() {
    const headerSearchInput = document.querySelector('.search-input');
    if (!headerSearchInput) return;

    // Dropdown div'i oluştur
    const dropdownDiv = document.createElement('div');
    dropdownDiv.className = 'search-dropdown';
    dropdownDiv.id = 'searchDropdown';
    dropdownDiv.style.display = 'none';
    headerSearchInput.parentElement.appendChild(dropdownDiv);

    // Input event - yazarken arama yap
    headerSearchInput.addEventListener('input', async function() {
        const query = this.value.trim();
        
        if (!query || query.length < 2) {
            dropdownDiv.style.display = 'none';
            return;
        }

        let kitapResults = [];
        let uyeResults = [];

        try {
            const token = localStorage.getItem('kutuphane_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            // KİTAPLARI ARA
            try {
                const kitapParams = new URLSearchParams();
                kitapParams.append('q', query);
                kitapParams.append('page', '1');
                kitapParams.append('pageSize', '5');
                
                const kitapRes = await fetch(`http://localhost:5165/api/kitaplar/public/search?${kitapParams.toString()}`, { headers });
                if (kitapRes.ok) {
                    const kitapData = await kitapRes.json();
                    kitapResults = (kitapData.data || []).map(k => ({
                        type: 'kitap',
                        id: k.id,
                        title: k.kitapAdi,
                        subtitle: `${k.yazar} - ${k.kategori}`,
                        data: k,
                        icon: '📚'
                    }));
                }
            } catch (e) {
                console.error('Kitap araması hatası:', e);
            }

            // ÜYELERİ ARA
            try {
                const uyeRes = await fetch('http://localhost:5165/api/uyeler', { headers });
                if (uyeRes.ok) {
                    const payload = await uyeRes.json();
                    let allUsers = Array.isArray(payload) ? payload : (payload.data ?? payload ?? []);
                    const lowerQuery = query.toLowerCase();
                    uyeResults = allUsers
                        .filter(u => 
                            u.adSoyad?.toLowerCase().includes(lowerQuery) ||
                            u.email?.toLowerCase().includes(lowerQuery)
                        )
                        .slice(0, 5)
                        .map(u => ({
                            type: 'uye',
                            id: u.id,
                            title: u.adSoyad,
                            subtitle: u.email,
                            data: u,
                            icon: '👤'
                        }));
                }
            } catch (e) {
                console.error('Üye araması hatası:', e);
            }

            // Sonuçları birleştir
            const allResults = [...kitapResults, ...uyeResults];

            // Dropdown'u doldur
            if (allResults.length > 0) {
                let html = '';
                
                // Kitaplar bölümü
                if (kitapResults.length > 0) {
                    html += '<div style="padding: 8px 12px; font-weight: 600; color: #1a237e; font-size: 11px; background: #f5f5f5;">📚 KİTAPLAR</div>';
                    kitapResults.forEach(r => {
                        html += `
                            <div class="search-item" data-type="${r.type}" data-id="${r.id}" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 13px;">
                                <div style="font-weight: 500; color: #333;">${r.icon} ${r.title}</div>
                                <div style="color: #666; font-size: 12px;">${r.subtitle}</div>
                            </div>
                        `;
                    });
                }

                // Üyeler bölümü
                if (uyeResults.length > 0) {
                    html += '<div style="padding: 8px 12px; font-weight: 600; color: #1a237e; font-size: 11px; background: #f5f5f5;">👤 ÜYELER</div>';
                    uyeResults.forEach(r => {
                        html += `
                            <div class="search-item" data-type="${r.type}" data-id="${r.id}" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 13px;">
                                <div style="font-weight: 500; color: #333;">${r.icon} ${r.title}</div>
                                <div style="color: #666; font-size: 12px;">${r.subtitle}</div>
                            </div>
                        `;
                    });
                }

                dropdownDiv.innerHTML = html;
                dropdownDiv.style.display = 'block';

                // Tıklama event'leri
                dropdownDiv.querySelectorAll('.search-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const type = this.getAttribute('data-type');
                        const id = this.getAttribute('data-id');
                        const resultData = allResults.find(r => r.id == id && r.type === type);
                        
                        headerSearchInput.value = '';
                        dropdownDiv.style.display = 'none';

                        if (type === 'kitap' && typeof showKitapDetail === 'function') {
                            showKitapDetail(resultData.data);
                        } else if (type === 'uye' && typeof showUyeDetail === 'function') {
                            showUyeDetail(resultData.data);
                        }
                    });
                });
            } else {
                dropdownDiv.innerHTML = '<div style="padding: 10px; color: #999; font-size: 13px;">Sonuç bulunamadı</div>';
                dropdownDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Arama hatası:', error);
        }
    });

    // Dropdown'ı kapat - input dışında tıklandığında
    document.addEventListener('click', function(e) {
        if (e.target !== headerSearchInput && !e.target.closest('.search-dropdown')) {
            dropdownDiv.style.display = 'none';
        }
    });
}

// Kategori seçim popup'ı göster
function showKategoriPopup(callback) {
    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.innerHTML = `
        <div class="detail-modal-content" style="max-width: 500px;">
            <button class="detail-modal-close" onclick="this.closest('.detail-modal').remove()">✕</button>
            <h2>Kategori Seç</h2>
            <div id="kategoriSearchBox" style="margin: 15px 0;">
                <input type="text" id="kategoriSearch" placeholder="Kategori ara..." style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div id="kategoriList" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">
                <div style="text-align: center; padding: 20px; color: #999;">Yükleniyor...</div>
            </div>
            <div class="detail-modal-actions">
                <button class="btn-secondary" onclick="this.closest('.detail-modal').remove();">İptal</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Kategorileri yükle
    loadKategoriList(callback, modal);
}

async function loadKategoriList(callback, modal) {
    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('http://localhost:5165/api/kitaplar', { headers });
        if (!res.ok) throw new Error('Kategoriler yüklenemedi');
        
        const kitapData = await res.json();
        const kitaplar = Array.isArray(kitapData) ? kitapData : (kitapData.data ?? []);
        
        // Unique kategorileri al
        let kategoriler = [...new Set(kitaplar.map(k => k.kategori).filter(k => k && k.trim()))];
        kategoriler.sort();
        
        const listDiv = modal.querySelector('#kategoriList');
        const renderKategoriler = () => {
            const searchTerm = modal.querySelector('#kategoriSearch')?.value?.toLowerCase() || '';
            const filtered = kategoriler.filter(k => k.toLowerCase().includes(searchTerm));
            
            if (filtered.length === 0) {
                listDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Kategori bulunamadı</div>';
                return;
            }
            
            listDiv.innerHTML = filtered.map(kat => `
                <div style="padding: 12px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;" 
                     onmouseover="this.style.backgroundColor='#f5f5f5'" 
                     onmouseout="this.style.backgroundColor='transparent'"
                     onclick="selectKategori('${escapeHtml(kat)}', ${callback}, this.closest('.detail-modal'))">
                    ${escapeHtml(kat)}
                </div>
            `).join('');
        };
        
        renderKategoriler();
        
        const searchInput = modal.querySelector('#kategoriSearch');
        if (searchInput) {
            searchInput.addEventListener('keyup', renderKategoriler);
        }
        
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        modal.querySelector('#kategoriList').innerHTML = '<div style="padding: 20px; color: #f44336;">Kategoriler yüklenemedi</div>';
    }
}

function selectKategori(kategoriAdi, callback, modal) {
    if (typeof callback === 'function') {
        callback(kategoriAdi);
    }
    modal?.remove();
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

// Silme onayı popup'ı
function showDeleteConfirm(id, itemName, itemType = 'uye') {
    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.innerHTML = `
        <div class="detail-modal-content" style="max-width: 400px;">
            <button class="detail-modal-close" onclick="this.closest('.detail-modal').remove()">✕</button>
            <h2 style="color: #f44336;">Silme Onayı</h2>
            <div style="margin: 20px 0; font-size: 16px;">
                <p><strong>${escapeHtml(itemName)}</strong> ögesini silmek istediğinize emin misiniz?</p>
                <p style="color: #999; font-size: 14px;">Bu işlem geri alınamaz.</p>
            </div>
            <div class="detail-modal-actions">
                <button class="btn-delete" onclick="confirmDelete(${id}, '${itemType}'); this.closest('.detail-modal').remove();">Evet, Sil</button>
                <button class="btn-secondary" onclick="this.closest('.detail-modal').remove();">İptal</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function confirmDelete(id, itemType = 'uye') {
    try {
        const token = localStorage.getItem('kutuphane_token');
        if (!token) {
            showToast('Oturum sonlandırıldı', 'error');
            window.location.href = 'login.html';
            return;
        }

        let endpoint = '';
        if (itemType === 'uye') {
            endpoint = `http://localhost:5165/api/uyeler/${id}`;
        } else if (itemType === 'kitap') {
            endpoint = `http://localhost:5165/api/kitaplar/${id}`;
        } else {
            showToast('Bilinmeyen öge türü', 'error');
            return;
        }

        const res = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
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
            showToast('Silme işlemi başarısız oldu', 'error');
            return;
        }

        showToast('Öge başarıyla silindi', 'success');
        
        // Refresh the appropriate table
        if (itemType === 'uye') {
            setTimeout(() => {
                if (window.uyeleriGetir) window.uyeleriGetir();
                if (window.loadUyeStats) window.loadUyeStats();
            }, 500);
        } else if (itemType === 'kitap') {
            setTimeout(() => {
                if (window.kitapGetir) window.kitapGetir();
                if (window.loadKitapStats) window.loadKitapStats();
            }, 500);
        }
    } catch (error) {
        console.error('Silme hatası:', error);
        showToast('Silme işlemi sırasında hata oluştu', 'error');
    }
}

// DOM hazır olunca header aramasını ayarla
document.addEventListener('DOMContentLoaded', function() {
    setupHeaderSearch();
});



