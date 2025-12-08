document.addEventListener('DOMContentLoaded', function () {
    kitapGetir();
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

async function kitapGetir() {
    const apiurl = 'http://localhost:5165/api/kitaplar';
    const tblgovde = document.getElementById('kitapTabloGovdesi');
    if (!tblgovde) return console.warn('Tablo govdesi bulunamadi: kitapTabloGovdesi');

    tblgovde.innerHTML = '<tr><td colspan="6">Yükleniyor...</td></tr>';

    try {
        const res = await fetch(apiurl);
        if (!res.ok) throw new Error('Sunucu hatasi ' + res.status);
        const payload = await res.json();
        const data = Array.isArray(payload) ? payload : (payload.data ?? []);

        if (!Array.isArray(data) || data.length === 0) {
            tblgovde.innerHTML = '<tr><td colspan="6">Kayıt bulunamadı.</td></tr>';
            return;
        }

        const rows = [];
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

            rows.push(`
                <tr>
                    <td>${escapeHtml(kitap.id)}</td>
                    <td>${escapeHtml(kitap.kitapAdi)}</td>
                    <td>${escapeHtml(kitap.yazar)}</td>
                    <td>${escapeHtml(kitap.kategori || '-')}</td>
                    <td><span class="${durumSinifi}">${escapeHtml(durumYazisi)}</span></td>
                    <td>
                        <button class="btn-edit" onclick="kitapDuzenle(${escapeHtml(kitap.id)})">Düzenle</button>
                        <button class="btn-delete" onclick="kitapSil(${escapeHtml(kitap.id)})">Sil</button>
                    </td>
                </tr>
            `);
        });

        tblgovde.innerHTML = rows.join('');//innerHTML+= e gore daha iyi    

    } catch (error) {
        console.error('Hata olustu:', error);
        tblgovde.innerHTML = '<tr><td colspan="6">Backend ile bağlantı kurulamadı.</td></tr>';
    }
}
function kitapSil(id) {
    if (confirm(id + ' ID\'li kitabı silmek istiyor musunuz?')) {
        console.log("Silinecek:", id);

    }
}

function kitapDuzenle(id) {
    console.log("Düzenlenecek:", id);
}
