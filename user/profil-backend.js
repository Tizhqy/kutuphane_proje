// v1.0 - Dark mode and global versioning comment added
document.addEventListener('DOMContentLoaded', function () {
    const girisYapanID = localStorage.getItem('kutuphane_id');
    if (!girisYapanID) {
        showToast('Lütfen önce giriş yapın!', 'warning');
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
                
                <div class="profile-right-column">
                    <div class="settings-section">
                        <h3><i class="fas fa-cog"></i> Kişisel Bilgiler</h3>
                        
                        <div class="form-groups">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Ad Soyad</label>
                                    <input type="text" id="editAdSoyad" value="${data.adSoyad || ''}" class="form-input">
                                </div>
                                <div class="form-group">
                                    <label>${ogrenciNoEtiketi}</label>
                                    <input type="text" id="editOgrenciNo" value="${ogrenciNoDegeri}" class="form-input">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>E-mail</label>
                                    <input type="email" id="editEmail" value="${data.email || ''}" class="form-input">
                                </div>
                                <div class="form-group">
                                    <label>Telefon</label>
                                    <input type="tel" id="editTelefon" value="${data.telefon || ''}" class="form-input">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Kayıt Tarihi</label>
                                    <input type="text" value="${tarihGosterimi}" class="form-input" readonly>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button class="btn-save" id="btnSaveProfile">
                                    <i class="fas fa-save"></i> Değişiklikleri Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3><i class="fas fa-lock"></i> Şifre Değiştir</h3>
                        <div class="form-groups">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Mevcut Şifre</label>
                                    <input type="password" id="sifreEski" placeholder="Mevcut şifrenizi girin" class="form-input">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Yeni Şifre</label>
                                    <input type="password" id="sifreYeni" placeholder="Yeni şifre girin" class="form-input">
                                    <small class="password-hint">En az bir büyük harf, bir küçük harf ve bir rakam içermelidir</small>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Yeni Şifre Tekrar</label>
                                    <input type="password" id="sifreYeniTekrar" placeholder="Yeni şifreyi tekrar girin" class="form-input">
                                </div>
                            </div>
                            <div class="form-actions">
                                <button class="btn-save" id="btnChangePassword">
                                    <i class="fas fa-key"></i> Şifre Değiştir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            tblgovde.innerHTML = kartHTML;

            // Şifre değiştir butonuna event ekle
            const btnChangePassword = document.getElementById('btnChangePassword');
            if (btnChangePassword) {
                btnChangePassword.addEventListener('click', async function() {
                    await sifreyiDegistir();
                });
            }

            // Kaydet butonuna event ekle
            const btn = document.getElementById('btnSaveProfile');
            if (btn) {
                btn.addEventListener('click', async function() {
                    const adSoyad = document.getElementById('editAdSoyad')?.value?.trim() || '';
                    const email = document.getElementById('editEmail')?.value?.trim() || '';
                    const telefon = document.getElementById('editTelefon')?.value?.trim() || '';
                    const ogrenciNo = document.getElementById('editOgrenciNo')?.value?.trim() || '';

                    if (!adSoyad) { showToast('Ad Soyad boş olamaz', 'error'); return; }
                    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { showToast('Geçerli bir email girin', 'error'); return; }

                    const token = localStorage.getItem('kutuphane_token');
                    if (!token) {
                        showToast('Oturum süreniz doldu', 'error');
                        window.location.href = '../login.html';
                        return;
                    }

                    try {
                        const res = await fetch('http://localhost:5165/api/profil', {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ adSoyad, email, telefon, ogrenciNo })
                        });

                        if (res.status === 401) { showToast('Oturum süreniz doldu', 'error'); window.location.href = '../login.html'; return; }
                        if (!res.ok) { showToast('Profil güncellenemedi', 'error'); return; }

                        showToast('Profil güncellendi', 'success');
                        // LocalStorage güncelle (görünen adı güncellemek için)
                        localStorage.setItem('kutuphane_ad', adSoyad);
                        localStorage.setItem('kutuphane_adSoyad', adSoyad);
                    } catch (err) {
                        console.error('Profil güncelleme hatası:', err);
                        showToast('İşlem başarısız', 'error');
                    }
                });
            }
        })
        .catch(error => {
            console.error('Hata:', error);
            showToast('Profil yüklenirken hata oluştu.', 'error');
        });
}
async function sifreyiDegistir() {
    const sifreEski = document.getElementById('sifreEski')?.value?.trim() || '';
    const sifreYeni = document.getElementById('sifreYeni')?.value?.trim() || '';
    const sifreYeniTekrar = document.getElementById('sifreYeniTekrar')?.value?.trim() || '';

    // Validasyonlar
    if (!sifreEski) { showToast('Mevcut şifrenizi girin', 'error'); return; }
    if (!sifreYeni) { showToast('Yeni şifrenizi girin', 'error'); return; }
    if (!sifreYeniTekrar) { showToast('Yeni şifrenizi tekrar girin', 'error'); return; }

    if (sifreYeni !== sifreYeniTekrar) { 
        showToast('Yeni şifreler eşleşmiyor', 'error'); 
        return; 
    }

    // Şifre güçlülük kontrolü (en az bir büyük harf, bir küçük harf, bir rakam)
    const sifreRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!sifreRegex.test(sifreYeni)) {
        showToast('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir', 'error');
        return;
    }

    const token = localStorage.getItem('kutuphane_token');
    if (!token) {
        showToast('Oturum süreniz doldu', 'error');
        window.location.href = '../login.html';
        return;
    }

    try {
        const res = await fetch('http://localhost:5165/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                eskiSifre: sifreEski,
                yeniSifre: sifreYeni 
            })
        });

        if (res.status === 401) { 
            showToast('Oturum süreniz doldu', 'error'); 
            window.location.href = '../login.html'; 
            return; 
        }

        const data = await res.json();
        
        if (!res.ok) { 
            showToast(data.mesaj || 'Şifre değiştirilirken hata oluştu', 'error'); 
            return; 
        }

        showToast('Şifre başarıyla değiştirildi', 'success');
        // Alanları temizle
        document.getElementById('sifreEski').value = '';
        document.getElementById('sifreYeni').value = '';
        document.getElementById('sifreYeniTekrar').value = '';
    } catch (err) {
        console.error('Şifre değiştirme hatası:', err);
        showToast('İşlem başarısız', 'error');
    }
}

function cikisYap() {
    if(confirm("Çıkış yapmak istediğinize emin misiniz?")) {
        localStorage.removeItem('kutuphane_id');
        localStorage.removeItem('kutuphane_ad');
        localStorage.removeItem('kutuphane_rol');
        
        window.location.href = 'anasayfa.html';
    }
}