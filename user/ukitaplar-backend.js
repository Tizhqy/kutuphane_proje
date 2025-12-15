const BOOK_MAP = {};

document.addEventListener('DOMContentLoaded', function () {
    kitapGetir();
    setupModalHandlers();
});

function kitapGetir() {
    const apiurl = 'http://localhost:5165/api/kitaplar/public';

    const token = localStorage.getItem('kutuphane_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch(apiurl, { headers })
        .then(response => {
            console.log('API Response status:', response.status);
            if (response.status === 401) {
                console.error('401 Unauthorized - Token geçersiz veya yok');
                alert('Oturum süreniz doldu. Lütfen yeniden giriş yapın.');
                window.location.href = '../login.html';
                return null;
            }
            if (response.status === 403) {
                console.error('403 Forbidden - Yetki yok');
                console.log('Token:', localStorage.getItem('kutuphane_token'));
                console.log('Rol:', localStorage.getItem('kutuphane_rol'));
                alert('Bu alan için yetkiniz yok.');
                return null;
            }
            if (!response.ok) throw new Error('Sunucu hatası: ' + response.status);
            return response.json();
        })
        .then(payload => {
            if (!payload) return;
            const data = Array.isArray(payload) ? payload : (payload.data ?? []);
            const tblgovde = document.getElementById('ukitaplarGovde');
            tblgovde.innerHTML = "";

            data.forEach(kitap => {
                // Normalize property names
                const id = kitap.id ?? kitap.kitapId;
                BOOK_MAP[id] = { ...kitap, id };
                let durumSinifi = 'available';
                let durumYazisi = 'Mevcut';
                let rezerveYazisi = 'Ödünç Al';

                if (kitap.durum === 'odunc') {
                    durumSinifi = 'borrowed';
                    durumYazisi = 'Ödünçte';
                    rezerveYazisi = 'Rezerve Et'
                } else if (kitap.durum === 'bakim') {
                    durumSinifi = 'overdue';
                    durumYazisi = 'Bakımda';
                    rezerveYazisi ='Bakımda';
                }

                const satir = `
                    <div class="book-card" data-id="${id}">
                        <div class="book-image">
                            <i class="fas fa-book book-placeholder"></i>
                        </div>
                        <div class="book-info">
                            <h4 class="book-title">${kitap.kitapAdi}</h4>
                            <p class="book-author">${kitap.yazar}</p>
                            <p class="book-category">${kitap.kategori}</p>
                            <span class="book-${durumSinifi}">${durumYazisi}</span>
                        </div>
                        <div class="book-actions">
                            <button class="btn-reserve" data-id="${id}">${rezerveYazisi}</button>
                            <button class="btn-details" data-id="${id}">Detaylar</button>
                        </div>
                    </div>
                `;

                tblgovde.innerHTML += satir;
            });

            // Event delegation for buttons to open modal
            tblgovde.addEventListener('click', function(e) {
                const btn = e.target.closest('button');
                if (!btn) return;
                const id = btn.getAttribute('data-id') || btn.closest('.book-card')?.getAttribute('data-id');
                if (!id) return;
                const kitap = BOOK_MAP[id];
                if (!kitap) return;
                openKitapModal(kitap);
            });
        })
        .catch(error => {
            console.error('Hata olustu:', error);
            alert('Backend ile baglanti olmadi');
        });
}

function setupModalHandlers() {
    const modal = document.getElementById('kitapModal');
    const closeBtn = document.getElementById('modalClose');
    const backdrop = document.getElementById('modalBackdrop');
    const reserveBtn = document.getElementById('reserveSubmit');
    const borrowBtn = document.getElementById('borrowBtn');

    if (closeBtn) closeBtn.addEventListener('click', hideModal);
    if (backdrop) backdrop.addEventListener('click', hideModal);
    if (reserveBtn) reserveBtn.addEventListener('click', submitReservation);
    if (borrowBtn) borrowBtn.addEventListener('click', function() {
        const id = borrowBtn.getAttribute('data-id');
        if (!id) return;
        oduncAl(parseInt(id, 10));
        hideModal();
    });
}

async function submitReservation() {
    const dateEl = document.getElementById('reservationDate');
    const date = dateEl?.value;
    if (!date) { alert('Lütfen bir tarih seçin.'); return; }

    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14); // 14 günlük rezervasyon

    const kitapId = document.getElementById('borrowBtn')?.getAttribute('data-id');
    if (!kitapId) return;

    const token = localStorage.getItem('kutuphane_token');
    if (!token) {
        alert('Oturum süresi doldu.');
        window.location.href = '../login.html';
        return;
    }

    try {
        const res = await fetch('http://localhost:5165/api/rezervasyonlar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                kitapId: parseInt(kitapId, 10),
                baslangicTarihi: startDate.toISOString(),
                birisTarihi: endDate.toISOString()
            })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Rezervasyon başarısız');
        }

        alert('Kitap başarıyla rezerve edildi!');
        hideModal();
        kitapGetir();
    } catch (error) {
        console.error('Hata:', error);
        alert('Hata: ' + error.message);
    }
}

function openKitapModal(kitap) {
    const modal = document.getElementById('kitapModal');
    if (!modal) return;
    document.getElementById('modalTitle').textContent = kitap.kitapAdi;
    document.getElementById('modalAuthor').textContent = kitap.yazar;
    document.getElementById('modalCategory').textContent = kitap.kategori || '-';
    document.getElementById('modalYear').textContent = kitap.yayinYili ?? kitap.yayin_yili ?? '-';
    document.getElementById('modalIsbn').textContent = kitap.isbn || '-';
    const statusEl = document.getElementById('modalStatus');
    const borrowBtn = document.getElementById('borrowBtn');
    const resWrap = document.getElementById('modalReservations');
    const available = (kitap.durum === 'musait' || kitap.durum === 'mevcut');
    statusEl.textContent = available ? 'Durum: Mevcut' : (kitap.durum === 'odunc' ? 'Durum: Ödünçte' : 'Durum: Bakımda');
    
    borrowBtn.disabled = !available;
    borrowBtn.setAttribute('data-id', kitap.id);
    
    if (!available) {
        resWrap.style.display = 'block';
        loadReservations(kitap.id);
    } else {
        resWrap.style.display = 'none';
    }

    modal.classList.remove('hidden');
    document.body.classList.add('blurred');
}

async function loadReservations(kitapId) {
    const token = localStorage.getItem('kutuphane_token');
    if (!token) return;

    try {
        const res = await fetch(`http://localhost:5165/api/rezervasyonlar/kitap/${kitapId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) return;
        const data = await res.json();
        const list = document.getElementById('reservationList');
        
        if (data.data && data.data.length > 0) {
            list.innerHTML = data.data.map(r => 
                `<li>${new Date(r.baslangicTarihi).toLocaleDateString('tr-TR')} - ${new Date(r.birisTarihi).toLocaleDateString('tr-TR')}</li>`
            ).join('');
        } else {
            list.innerHTML = '<li>Rezervasyon bulunmamaktadır.</li>';
        }
    } catch (error) {
        console.error('Rezervasyon yükleme hatası:', error);
    }
}

function hideModal() {
    const modal = document.getElementById('kitapModal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('blurred');
}

function oduncAl(kitapId) {
    const token = localStorage.getItem('kutuphane_token');
    if (!token) {
        alert('Oturum expired. Lütfen yeniden giriş yapın.');
        window.location.href = '../login.html';
        return;
    }

    const apiurl = 'http://localhost:5165/api/islemler/odunc-al';
    
    fetch(apiurl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ kitapId: kitapId })
    })
    .then(response => {
        if (response.status === 401) {
            alert('Oturum süreniz doldu. Lütfen yeniden giriş yapın.');
            window.location.href = '../login.html';
            return null;
        }
        if (response.status === 403) {
            alert('Bu işlem için yetkiniz yok.');
            return null;
        }
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || 'Ödünç alma başarısız');
            });
        }
        return response.json();
    })
    .then(data => {
        if (!data) return;
        alert('Kitap başarıyla ödünç alındı!');
        kitapGetir();
    })
    .catch(error => {
        console.error('Hata:', error);
        alert('Hata: ' + error.message);
    });
}