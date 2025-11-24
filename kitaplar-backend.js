document.addEventListener('DOMContentLoaded', function () {
    kitapGetir();
});

function kitapGetir() {
    const apiurl = 'http://localhost:5165/api/kitaplar';

    fetch(apiurl)
        .then(response => response.json())
        .then(data => {
            const tblgovde = document.getElementById('kitapTabloGovdesi');
            tblgovde.innerHTML = "";

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

                const satir = `
                    <tr>
                        <td>${kitap.id}</td>
                        <td>${kitap.kitapAdi}</td>  <td>${kitap.yazar}</td>
                        <td>${kitap.kategori}</td>  <td><span class="${durumSinifi}">${durumYazisi}</span></td>
                        <td>
                            <button class="btn-edit">Düzenle</button>
                            <button class="btn-delete">Sil</button>
                        </td>
                    </tr>
                `;

                tblgovde.innerHTML += satir;
            });
        })
        .catch(error => {
            console.error('Hata olustu:', error);
            alert('Backend ile baglanti olmadi');
        });
}