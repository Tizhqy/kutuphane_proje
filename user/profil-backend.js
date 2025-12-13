document.addEventListener('DOMContentLoaded', function () {
    const girisYapanID = localStorage.getItem('kutuphane_id');
    if (!girisYapanID) {
        alert("Lütfen önce giriş yapın!");
        window.location.href = 'login.html';
        return;
    }

    profilBilgileriniGetir(girisYapanID);
});

function profilBilgileriniGetir(id) {
    const apiurl = `http://localhost:5165/api/profil/${id}`;

    const token = localStorage.getItem('kutuphane_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch(apiurl, { headers })
        .then(response => {
            if (!response.ok) {
                throw new Error("Üye bulunamadı! (Veritabanında ID 1 var mı?)");
            }
            return response.json();
        })
        .then(data => {
            
            const tblgovde = document.getElementById('profilGovde');
            tblgovde.innerHTML = "";

            let ogrenciNoEtiketi = 'Öğrenci No';
            let ogrenciNoDegeri = data.ogrenciNo; 

            if (!ogrenciNoDegeri) {
                ogrenciNoDegeri = ""; 
            }

            let tarihGosterimi = "";
            if(data.kayitTarihi) {
                tarihGosterimi = new Date(data.kayitTarihi).toLocaleDateString('tr-TR');
            }

            const kartHTML = `
                <div class="profile-card">
                    <div class="profile-photo">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="profile-info">
                        <h2 class="profile-name">${data.adSoyad || 'İsimsiz'}</h2>
                        <p class="profile-id">${ogrenciNoEtiketi}: ${ogrenciNoDegeri}</p>
                    </div>
                    <div class="profile-actions">
                        <button class="btn-edit-photo">
                            <i class="fas fa-camera"></i> Fotoğraf Değiştir
                        </button>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><i class="fas fa-cog"></i> Kişisel Bilgiler</h3>
                    
                    <div class="form-groups">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Ad Soyad</label>
                                <input type="text" value="${data.adSoyad || ''}" class="form-input" readonly>
                            </div>
                            <div class="form-group">
                                <label>${ogrenciNoEtiketi}</label>
                                <input type="text" value="${ogrenciNoDegeri}" class="form-input" readonly>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>E-mail</label>
                                <input type="email" value="${data.email || ''}" class="form-input">
                            </div>
                            <div class="form-group">
                                <label>Telefon</label>
                                <input type="tel" value="${data.telefon || ''}" class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Kayıt Tarihi</label>
                                <input type="text" value="${tarihGosterimi}" class="form-input" readonly>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button class="btn-save">
                                <i class="fas fa-save"></i> Değişiklikleri Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            `;

            tblgovde.innerHTML = kartHTML;
        })
        .catch(error => {
            console.error('Hata:', error);
            alert('Profil yüklenirken hata oluştu.');
        });
}
function cikisYap() {
    if(confirm("Çıkış yapmak istediğinize emin misiniz?")) {
        localStorage.removeItem('kutuphane_id');
        localStorage.removeItem('kutuphane_ad');
        localStorage.removeItem('kutuphane_rol');
        
        window.location.href = 'anasayfa.html';
    }
}