document.addEventListener('DOMContentLoaded', function () {
    islemGetir();
});
function escapeHtml(str) {//copilot baba onerdi burayi  
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function islemGetir() {
    const apiurl = 'http://localhost:5165/api/islemler';
    const tblgovde = document.getElementById('islemlerTableGovde');
    if (!tblgovde) return console.warn('Tablo govdesi bulunamadi: islemlerTableGovde');

    tblgovde.innerHTML = '<tr><td colspan="11">Yüklèniyor...</td></tr>';

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
        data.forEach(islem => {
            let durumSinifi = 'status borrowed-out';
            let durumYazisi = 'Ödünçte';
            let durumEylem = 'İade Al';

            if (islem.durum === 'iade') {
                durumSinifi = 'status returned';
                durumYazisi = 'İade';
                durumEylem = 'Detay';
            } else if (islem.durum === 'geciken') {
                durumSinifi = 'status overdue';
                durumYazisi = 'Geciken';
                durumEylem = 'Hatırlat';
            } else if (islem.durum === 'bekliyor'){
                durumSinifi = 'status pending';
                durumYazisi = 'Bekliyor';
                durumEylem = 'Onayla';
            }
            

            // copliot baba bunalri ekeldi ne halta yaradigna bakcaz.. support several possible naming conventions from API
            const userAgent = islem.userAgent ?? islem.user_agent ?? islem.UserAgent ?? '';
            const ip = islem.ip_address ?? islem.ipAddress ?? islem.ip ?? '';
            const alim = islem.alimTarihi ?? islem.alim_tarihi ?? '';
            const iade = islem.iadeTarihi ?? islem.iade_tarihi ?? '';
            const metadata = islem.metadata ?? islem.Metadata ?? '';
            const islemTuru = islem.islemTuru ?? islem.islem_turu ?? islem.İslemTuru ?? islem.IslemTuru ?? '';

            rows.push(`
                <tr>
                    <td title="${escapeHtml(islem.id)}">${escapeHtml(islem.id)}</td>
                    <td title="${escapeHtml(islem.uyeId)}">${escapeHtml(islem.uyeId)}</td>
                    <td title="${escapeHtml(islem.kitapId)}">${escapeHtml(islem.kitapId)}</td>
                    <td title="${escapeHtml(islemTuru)}">${escapeHtml(islemTuru)}</td>
                    <td title="${escapeHtml(metadata)}">${escapeHtml(metadata)}</td>
                    <td title="${escapeHtml(userAgent)}">${escapeHtml(userAgent)}</td>
                    <td title="${escapeHtml(ip)}">${escapeHtml(ip)}</td>
                    <td title="${escapeHtml(alim)}">${escapeHtml(alim)}</td>
                    <td title="${escapeHtml(iade)}">${escapeHtml(iade)}</td>
                    <td title="${escapeHtml(durumYazisi)}"><span class="${durumSinifi}">${durumYazisi}</span></td>
                    <td>
                        <button class="btn-edit">${durumEylem}</button>
                        <button class="btn-delete">Sil</button>
                    </td>
                </tr>
            `);
        });

        tblgovde.innerHTML = rows.join('');//innerHTML+= e gore daha iyi    
            tblgovde.innerHTML = rows.join('');//innerHTML+= e gore daha iyi    

            // Update scroller button visibility after rendering rows
            try {
                updateTableScrollerVisibility();
            } catch (e) { /* ignore if scroller not initialized */ }

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


