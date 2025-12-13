document.addEventListener('DOMContentLoaded', function () {
    kitapGetir();
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
                let durumSinifi = 'status available';
                let durumYazisi = 'Mevcut';
                let rezerveYazisi = 'Rezerve Et';

                if (kitap.durum === 'odunc') {
                    durumSinifi = 'status borrowed';
                    durumYazisi = 'Ödünçte';
                    rezerveYazisi = 'Ödünçte'
                } else if (kitap.durum === 'bakim') {
                    durumSinifi = 'status overdue';
                    durumYazisi = 'Bakımda';
                    rezerveYazisi ='Bakımda';
                }

                const satir = `
                    <div class="book-card">
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
                            <button class="btn-reserve">${rezerveYazisi}</button>
                            <button class="btn-details">Detaylar</button>
                        </div>
                    </div>
                `;

                tblgovde.innerHTML += satir;
            });
        })
        .catch(error => {
            console.error('Hata olustu:', error);
            alert('Backend ile baglanti olmadi');
        });
}