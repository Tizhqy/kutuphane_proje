// v1.0 - Dark mode and global versioning comment added
// Toast notification utility
function showToast(message, type = 'info', duration = 4000) {
    const existing = document.querySelectorAll('.app-toast');
    existing.forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `app-toast app-toast-${type}`;
    const colors = { success: '#4CAF50', error: '#f44336', warning: '#ff9800', info: '#2196F3' };
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background-color: ${colors[type] || colors.info};
        color: white; padding: 16px 24px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;
        font-weight: 500; animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    if (!document.getElementById('toastAnimStyle')) {
        const style = document.createElement('style');
        style.id = 'toastAnimStyle';
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

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

                showToast(errMsg, 'error');
                return;
            }

            const data = await response.json();

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

            const gelenRol = (data.rol || '').toLowerCase();

            const adminKeys = ['admin', 'super', 'süper', 'super_admin'];
            const isAdmin = adminKeys.some(k => gelenRol.includes(k));

            if (isAdmin) {
                window.location.href = 'admin/index.html';
            } else {
                window.location.href = 'user/user-dashboard.html';
            }

        } catch (error) {
            console.error('Hata:', error);
            showToast('Sunucuya bağlanılamadı! Backend çalışıyor mu?', 'error');
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
            showToast('Lütfen tüm gerekli alanları doldurun!', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Şifre en az 6 karakter olmalıdır!', 'error');
            return;
        }

        // Backend ile uyumlu şifre kontrolü
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(password)) {
            showToast('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir!', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Şifreler eşleşmiyor!', 'error');
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
                showToast(data.mesaj || 'Kayıt sırasında hata oluştu!', 'error');
                return;
            }

            showToast('✅ Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
            
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
            showToast('Sunucuya bağlanılamadı! Backend çalışıyor mu?', 'error');
        }
    });
}

// Şifremi Unuttum Linki
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        showForgotPasswordModal();
    });
}

function showForgotPasswordModal() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 400px; box-shadow: 0 8px 24px rgba(0,0,0,0.2);';
    
    content.innerHTML = `
        <h2 style="margin: 0 0 10px 0; color: #1a237e;">Şifremi Unuttum</h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">E-posta adresinizi girin, size geçici şifre gönderelim.</p>
        <input type="email" id="forgotEmail" placeholder="E-posta adresiniz" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; margin-bottom: 16px;" />
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancelForgot" style="padding: 10px 20px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer;">Vazgeç</button>
            <button id="submitForgot" style="padding: 10px 20px; background: #1a237e; color: white; border: none; border-radius: 8px; cursor: pointer;">Gönder</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('cancelForgot').onclick = () => modal.remove();
    document.getElementById('submitForgot').onclick = async () => {
        const email = document.getElementById('forgotEmail').value.trim();
        if (!email) {
            showToast('Lütfen e-posta adresinizi girin', 'warning');
            return;
        }
        
        const submitBtn = document.getElementById('submitForgot');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gönderiliyor...';
        
        try {
            const response = await fetch('http://localhost:5165/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast(data.mesaj || 'Şifre sıfırlama talimatları e-posta adresinize gönderildi.', 'success');
                modal.remove();
            } else {
                showToast(data.mesaj || 'Bir hata oluştu', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Gönder';
            }
        } catch (error) {
            console.error('Hata:', error);
            showToast('Sunucuya bağlanılamadı!', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gönder';
        }
    };
    
    document.getElementById('forgotEmail').focus();
}
