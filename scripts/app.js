const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const apiUrl = 'http://localhost:5165/api/auth/login';

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Email: email,
                    Sifre: password
                })
            });

            if (!response.ok) {
                let errMsg = "Hatalı E-mail veya Şifre!";
                try {
                    const errorData = await response.json();
                    errMsg = errorData.mesaj || errMsg;
                } catch (ex) {
                    try {
                        const txt = await response.text();
                        if (txt) errMsg = txt;
                    } catch { }
                }

                localStorage.removeItem('kutuphane_token');
                localStorage.removeItem('kutuphane_rol');

                alert(errMsg);
                return;
            }

            const data = await response.json();

            console.log('login response', response.status, data);

            if (data.uyeId) {
                localStorage.setItem('kutuphane_id', data.uyeId);
                localStorage.setItem('kutuphane_uyeId', data.uyeId);
            }
            if (data.adSoyad) {
                localStorage.setItem('kutuphane_ad', data.adSoyad);
                localStorage.setItem('kutuphane_adSoyad', data.adSoyad);
            }
            if (data.rol) localStorage.setItem('kutuphane_rol', data.rol);
            if (data.token) localStorage.setItem('kutuphane_token', data.token);

            // alert("Hoşgeldin " + (data.adSoyad || 'üyemiz'));

            const gelenRol = (data.rol || '').toLowerCase();
            console.log('gelen rol:', gelenRol);

            const adminKeys = ['admin', 'super', 'süper', 'super_admin'];
            const isAdmin = adminKeys.some(k => gelenRol.includes(k));

            if (isAdmin) {
                window.location.href = 'admin/index.html';
            } else {
                window.location.href = 'user/user-dashboard.html';
            }

        } catch (error) {
            console.error('Hata:', error);
            console.log("Sunucuya bağlanılamadı! Backend (dotnet run) çalışıyor mu?");
        }
    });
}


const registerBtn = document.querySelector('.register-btn');
if (registerBtn) {
    registerBtn.addEventListener('click', function () {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        const title = document.getElementById('formTitle');
        if (title) title.textContent = 'Kayıt Olun';
    });
}

const backToLogin = document.getElementById('backToLogin');
if (backToLogin) {
    backToLogin.addEventListener('click', function () {
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        const title = document.getElementById('formTitle');
        if (title) title.textContent = 'Giriş Yapın';
    });
}

// Register Form Submit
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('reg_email').value.trim();
        const password = document.getElementById('reg_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        // Validasyon
        if (!fullname || !email || !password) {
            alert('Lütfen tüm gerekli alanları doldurun!');
            return;
        }

        if (password.length < 5) {
            alert('Şifre en az 5 karakter olmalıdır!');
            return;
        }

        if (password !== confirmPassword) {
            alert('Şifreler eşleşmiyor!');
            return;
        }

        // Ad Soyad'ı ayır
        const nameParts = fullname.split(' ');
        const ad = nameParts[0] || '';
        const soyad = nameParts.slice(1).join(' ') || nameParts[0];

        const apiUrl = 'http://localhost:5165/api/auth/register';

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Ad: ad,
                    Soyad: soyad,
                    Email: email,
                    Sifre: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.mesaj || 'Kayıt sırasında hata oluştu!');
                return;
            }

            alert('✅ Kayıt başarılı! Giriş yapabilirsiniz.');
            
            // Login formuna dön
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
            const title = document.getElementById('formTitle');
            if (title) title.textContent = 'Giriş Yapın';

            // Email alanını doldur
            document.getElementById('email').value = email;
            document.getElementById('password').focus();

        } catch (error) {
            console.error('Hata:', error);
            alert('Sunucuya bağlanılamadı! Backend çalışıyor mu?');
        }
    });
}

