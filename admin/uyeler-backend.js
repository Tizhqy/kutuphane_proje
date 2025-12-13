document.addEventListener('DOMContentLoaded', function () {
    uyeleriGetir();
});

async function uyeleriGetir() {
    const apiurl = 'http://localhost:5165/api/uyeler';
    const tblgovde = document.getElementById('uyelerTableGovde');
    if (!tblgovde) return;
    tblgovde.innerHTML = '<tr><td colspan="9">Yükleniyor...</td></tr>';

    try {
        const token = localStorage.getItem('kutuphane_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(apiurl, { headers });

        if (res.status === 401) {
            tblgovde.innerHTML = '<tr><td colspan="9">Oturum süreniz doldu. Lütfen yeniden giriş yapın.</td></tr>';
            setTimeout(() => window.location.href = 'login.html', 800);
            return;
        }
        if (res.status === 403) {
            tblgovde.innerHTML = '<tr><td colspan="9">Bu alan için admin yetkisi gerekir.</td></tr>';
            return;
        }
        if (!res.ok) throw new Error('Sunucu hatası: ' + res.status);

        const payload = await res.json();
        const data = Array.isArray(payload) ? payload : (payload.data ?? payload ?? []);

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
    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="9">Backend ile bağlantı kurulamadı.</td></tr>';
    }
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