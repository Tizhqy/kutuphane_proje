let currentPage = 1;
const pageSize = 20;
let hasMore = false;

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
            setTimeout(() => window.location.href = 'login.html', 800);
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
            

            // copliot baba bunalri ekeldi ne halta yaradigna bakcaz.. support several possible naming conventions from API
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

function islemDetay(id) {
    console.log("Detay:", id);
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
    islemGetir(currentPage + 1, true);
}

function filterChanged() {
    currentPage = 1;
    const durum = document.getElementById('durumFilter')?.value || '';
    islemGetir(1, false);
}

window.addEventListener('DOMContentLoaded', () => {
    islemGetir(1, false);
});

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

