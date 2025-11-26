document.addEventListener('DOMContentLoaded', function () {
    uyeleriGetir();
});

function uyeleriGetir() {
    const apiurl = 'http://localhost:5165/api/uyeler';

    fetch(apiurl)
        .then(response => response.json())
        .then(data => {
            const tblgovde = document.getElementById('uyelerTableGovde');
            tblgovde.innerHTML = "";

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
        })
        .catch(error => {
            console.error('Hata olustu:', error);
            alert('Backend ile bağlantı kurulamadı!');
        });
}


function uyeSil(id) {
    if (confirm(id + ' ID\'li üyeyi silmek istediğinize emin misiniz?')) {
        console.log("Silinecek ID:", id);
    }
}

function uyeDuzenle(id) {
    console.log("Düzenlenecek ID:", id);
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