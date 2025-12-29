// v1.0 - Dark mode and global versioning comment added
let currentPage = 1;
const pageSize = 20;
let hasMore = false;
let allIslemlerData = [];
let isLoadingMore = false;

document.addEventListener('DOMContentLoaded', function () {
    loadIslemStats();
    islemGetir();
    setupWindowScroll();
});

function setupWindowScroll() {
    window.addEventListener('scroll', function() {
        // Check if scrolled to bottom (within 500px from bottom)
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            loadMore();
        }
    });
}

async function loadIslemStats() {
    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('http://localhost:5165/api/islemler?page=1&pageSize=1000', { headers });
        if (!res.ok) return;
        
        const payload = await res.json();
        const islemler = payload.data ?? [];
        
        const toplamIslem = payload.total || islemler.length;
        // İslem türü değil, durum'a göre say
        const odunc = islemler.filter(i => i.durum === 'odunc' || i.durum === 'geciken').length;
        const iade = islemler.filter(i => i.durum === 'iade').length;
        const rezervasyon = islemler.filter(i => i.durum === 'rezervasyon').length;
        
        const stats = document.querySelectorAll('.stat-card');
        if (stats[0]) stats[0].querySelector('.stat-number').textContent = toplamIslem;
        if (stats[1]) stats[1].querySelector('.stat-number').textContent = odunc;
        if (stats[2]) stats[2].querySelector('.stat-number').textContent = iade;
        if (stats[3]) stats[3].querySelector('.stat-number').textContent = rezervasyon;
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

async function islemGetir(page = 1, append = false) {
    const durumFilter = document.getElementById('durumFilter')?.value || '';
    let apiurl = `http://localhost:5165/api/islemler?page=${page}&pageSize=${pageSize}`;
    if (durumFilter) apiurl += `&durum=${encodeURIComponent(durumFilter)}`;
    
    const tblgovde = document.getElementById('islemlerTableGovde');
    if (!tblgovde) return console.warn('Tablo govdesi bulunamadi: islemlerTableGovde');

    if (!append) tblgovde.innerHTML = '<tr><td colspan="11">Yükleǹiyor...</td></tr>';

    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(apiurl, { headers });
        if (res.status === 401) {
            tblgovde.innerHTML = '<tr><td colspan="11">Oturum süreniz doldu. Lütfen tekrar giriş yapın.</td></tr>';
            setTimeout(() => window.location.href = '../login.html', 800);
            return;
        }
        if (res.status === 403) {
            tblgovde.innerHTML = '<tr><td colspan="11">Bu alan için admin yetkisi gerekir.</td></tr>';
            return;
        }
        if (!res.ok) throw new Error('Sunucu hatasi ' + res.status);
        const payload = await res.json();
        const data = Array.isArray(payload) ? payload : (payload.data ?? []);

        if (!Array.isArray(data) || data.length === 0) {
            tblgovde.innerHTML = '<tr><td colspan="11">Kayıt bulunamadı.</td></tr>';
            return;
        }

        const rows = [];
        const startNum = (page - 1) * pageSize;
        data.forEach((islem, idx) => {
            const rowNum = startNum + idx + 1;
            let durumSinifi = 'status borrowed-out';
            let durumYazisi = 'Ödünçte';
            let durumEylem = 'Detay';

            if (islem.durum === 'iade') {
                durumSinifi = 'status returned';
                durumYazisi = 'İade';
            } else if (islem.durum === 'rezervasyon') {
                durumSinifi = 'status pending';
                durumYazisi = 'Rezervasyon';
            } else if (islem.durum === 'odunc') {
                // Check if overdue (14 days)
                const alimDate = new Date(islem.alimTarihi);
                const today = new Date();
                const diffDays = Math.floor((today - alimDate) / (1000 * 60 * 60 * 24));
                if (diffDays > 14) {
                    durumSinifi = 'status overdue';
                    durumYazisi = `Geciken (${diffDays - 14} gün)`;
                } else {
                    durumSinifi = 'status borrowed-out';
                    durumYazisi = 'Ödünçte';
                }
            }
            

            const userAgent = islem.userAgent ?? islem.user_agent ?? islem.UserAgent ?? '';
            const ip = islem.ip_address ?? islem.ipAddress ?? islem.ip ?? '';
            const alim = islem.alimTarihi ?? islem.alim_tarihi ?? '';
            const iade = islem.iadeTarihi ?? islem.iade_tarihi ?? '';
            const metadata = islem.metadata ?? islem.Metadata ?? '';
            const islemTuru = islem.islemTuru ?? islem.islem_turu ?? islem.İslemTuru ?? islem.IslemTuru ?? '';

            let metaDisplay = '-';
            try {
                if (metadata) {
                    const meta = JSON.parse(metadata);
                    metaDisplay = meta.action || meta.note || 'Log';
                }
            } catch (e) { metaDisplay = 'Log'; }

            const shortUA = userAgent.split(' ')[0] || '-';

            rows.push(`
                <tr>
                    <td>${rowNum}</td>
                    <td><strong>${escapeHtml(islem.uyeAdSoyad)}</strong><br><small>#${escapeHtml(islem.uyeId)}</small></td>
                    <td><strong>${escapeHtml(islem.kitapAdi)}</strong><br><small>${escapeHtml(islem.yazar)}</small></td>
                    <td>${escapeHtml(islemTuru)}</td>
                    <td><button class="btn-edit" onclick='showMetadata(${JSON.stringify(metadata)})'>Göster</button></td>
                    <td title="${escapeHtml(userAgent)}">${escapeHtml(shortUA)}</td>
                    <td>${escapeHtml(ip)}</td>
                    <td>${alim}</td>
                    <td>${iade}</td>
                    <td><span class="${durumSinifi}">${durumYazisi}</span></td>
                    <td>
                        <button class="btn-edit" onclick="islemDetay(${islem.id})">${durumEylem}</button>
                    </td>
                </tr>
            `);
        });

        if (append) tblgovde.insertAdjacentHTML('beforeend', rows.join('')); else tblgovde.innerHTML = rows.join('');

        currentPage = page;
        hasMore = !!payload.hasMore;

        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            if (hasMore) loadMoreBtn.style.display = 'block'; else loadMoreBtn.style.display = 'none';
        }

        try { updateTableScrollerVisibility(); } catch (e) { /* ignore */ }

    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="11">Backend ile bağlantı kurulamadı.</td></tr>';
    }
}
function islemSil(id) {
    if (confirm(id + ' ID\'li islemi silmek istiyor musunuz?')) {
        console.log("Silinecek:", id);

    }
}

async function islemDetay(id) {
    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // Fetch full details for this transaction
        const res = await fetch(`http://localhost:5165/api/islemler?page=1&pageSize=1000`, { headers });
        if (!res.ok) {
            showToast('İşlem detayları yüklenemedi', 'error');
            return;
        }

        const payload = await res.json();
        const allIslemler = payload.data ?? [];
        const islem = allIslemler.find(i => i.id === id);
        
        if (!islem) {
            showToast('İşlem bulunamadı', 'error');
            return;
        }

        showIslemDetail(islem);
    } catch (error) {
        console.error('Hata:', error);
        showToast('İşlem detayları yüklenirken hata oluştu', 'error');
    }
}

function showIslemDetail(islem) {
    let durumYazisi = 'Ödünçte';
    if (islem.durum === 'iade') durumYazisi = 'İade';
    else if (islem.durum === 'rezervasyon') durumYazisi = 'Rezervasyon';

    const alimTarihi = islem.alimTarihi ? new Date(islem.alimTarihi).toLocaleDateString('tr-TR') : '-';
    const iadeTarihi = islem.iadeTarihi ? new Date(islem.iadeTarihi).toLocaleDateString('tr-TR') : '-';

    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.innerHTML = `
        <div class="detail-modal-content">
            <button class="detail-modal-close" onclick="this.closest('.detail-modal').remove()">✕</button>
            <h2>İşlem Detayları</h2>
            <div class="detail-grid">
                <div class="detail-row">
                    <span class="detail-label">İşlem ID:</span>
                    <span class="detail-value">${islem.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Üye:</span>
                    <span class="detail-value">${escapeHtml(islem.uyeAdSoyad)} <small>(#${islem.uyeId})</small></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Kitap:</span>
                    <span class="detail-value">${escapeHtml(islem.kitapAdi)} <small>${escapeHtml(islem.yazar)}</small></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">İşlem Türü:</span>
                    <span class="detail-value">${escapeHtml(islem.islemTuru)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Durum:</span>
                    <span class="detail-value">${durumYazisi}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Alım Tarihi:</span>
                    <span class="detail-value">${alimTarihi}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">İade Tarihi:</span>
                    <span class="detail-value">${iadeTarihi}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tarayıcı:</span>
                    <span class="detail-value" title="${escapeHtml(islem.userAgent)}">${escapeHtml((islem.userAgent || '-').split(' ')[0])}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">IP Adresi:</span>
                    <span class="detail-value">${escapeHtml(islem.ipAddress || '-')}</span>
                </div>
            </div>
            <div class="detail-modal-actions">
                <button class="btn-secondary" onclick="this.closest('.detail-modal').remove();">Kapat</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function islemOnayla(id) {
    console.log("Onayla:", id);
}

// -- Table scroller helpers -------------------------------------------------
function ensureTableScroller() {
    const container = document.querySelector('.transaction-table');
    if (!container) return;
    if (container._scrollerInitialized) return;
    // Create buttons appended to body (outside the table)
    const btnRight = document.createElement('button');
    btnRight.className = 'table-scroll-btn table-scroll-right table-scroll-outside';
    btnRight.setAttribute('aria-label', 'scroll right');
    btnRight.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.59 16.34L13.17 11.76 8.59 7.17 10 5.76l6 6-6 6z"/></svg>';

    const btnLeft = document.createElement('button');
    btnLeft.className = 'table-scroll-btn table-scroll-left table-scroll-outside';
    btnLeft.setAttribute('aria-label', 'scroll left');
    btnLeft.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15.41 7.16L10.83 11.74 15.41 16.33 14 17.74l-6-6 6-6z"/></svg>';

    document.body.appendChild(btnLeft);
    document.body.appendChild(btnRight);

    const scrollBy = () => Math.max(200, Math.floor(container.clientWidth * 0.4));

    btnRight.addEventListener('click', () => {
        container.scrollBy({ left: scrollBy(), behavior: 'smooth' });
    });
    btnLeft.addEventListener('click', () => {
        container.scrollBy({ left: -scrollBy(), behavior: 'smooth' });
    });

    // Position and visibility updater
    const update = () => {
        const rect = container.getBoundingClientRect();
        const need = container.scrollWidth > container.clientWidth + 2;

        // if table is nowhere near viewport, hide buttons
        const inView = rect.bottom > 0 && rect.top < window.innerHeight;
        if (!inView) {
            btnLeft.style.display = 'none';
            btnRight.style.display = 'none';
            return;
        }

        // compute vertical center relative to viewport and set fixed top
        const top = Math.min(Math.max(rect.top + rect.height / 2, 60), window.innerHeight - 60);
        // place buttons outside the table area (to the right and left)
        const rightPos = Math.min(window.innerWidth - 12, rect.right + 12);
        const leftPos = Math.max(12, rect.left - 12 - 36);

        // Always show buttons when table is visible; mark disabled when no overflow
        btnRight.style.display = 'flex';
        btnLeft.style.display = 'flex';
        if (need) {
            btnRight.classList.remove('disabled');
            btnLeft.classList.remove('disabled');
        } else {
            btnRight.classList.add('disabled');
            btnLeft.classList.add('disabled');
        }

        btnRight.style.position = 'fixed';
        btnLeft.style.position = 'fixed';
        btnRight.style.top = `${top}px`;
        btnLeft.style.top = `${top}px`;
        btnRight.style.left = `${rightPos}px`;
        btnLeft.style.left = `${leftPos}px`;
    };

    // Attach listeners
    container.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });

    // small observer to detect DOM changes inside the table
    const mo = new MutationObserver(() => setTimeout(update, 50));
    mo.observe(container, { childList: true, subtree: true });

    // Expose for calling after render
    container._scrollerInitialized = true;
    container._updateTableScroller = update;
    // initial update
    setTimeout(update, 100);
}

function updateTableScrollerVisibility() {
    const container = document.querySelector('.transaction-table');
    if (!container) return;
    if (!container._scrollerInitialized) ensureTableScroller();
    if (container._updateTableScroller) container._updateTableScroller();
}

// Initialize scroller on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    ensureTableScroller();
});

function loadMore() {
    if (isLoadingMore) return;
    if (!hasMore) return;
    
    isLoadingMore = true;
    setTimeout(() => {
        islemGetir(currentPage + 1, true);
        isLoadingMore = false;
    }, 200);
}

function filterChanged() {
    currentPage = 1;
    const durum = document.getElementById('durumFilter')?.value || '';
    islemGetir(1, false);
}

function showMetadata(metaStr) {
    const modal = document.getElementById('metadataModal');
    const content = document.getElementById('metadataContent');
    
    if (!metaStr || metaStr === '-') {
        content.textContent = 'Metadata bulunamadı.';
    } else {
        try {
            const parsed = JSON.parse(metaStr);
            content.textContent = JSON.stringify(parsed, null, 2);
        } catch (e) {
            content.textContent = metaStr;
        }
    }
    
    modal.style.display = 'flex';
}

function closeMetadataModal() {
    document.getElementById('metadataModal').style.display = 'none';
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
