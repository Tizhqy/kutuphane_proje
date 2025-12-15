// User sayfaları için ortak fonksiyonlar
(function () {
    function initializeUserProfile() {
        const userId = localStorage.getItem('kutuphane_uyeId') || localStorage.getItem('kutuphane_id');
        const userName = localStorage.getItem('kutuphane_adSoyad') || localStorage.getItem('kutuphane_ad') || '';
        const userRole = localStorage.getItem('kutuphane_rol') || '';

        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRole');
        const profileEl = document.getElementById('userProfile');
        const logoutBtn = document.getElementById('logoutBtn');

        if (!userId) {
            window.location.href = 'login.html';
            return;
        }

        if (nameEl) nameEl.textContent = userName || 'Üye';
        if (roleEl) {
            const rolMap = {
                'admin': 'Admin',
                'super_admin': 'Süper Admin',
                'akademisyen': 'Akademisyen',
                'personel': 'Personel',
                'ogrenci': 'Öğrenci'
            };
            const normalizedRole = (userRole || 'ogrenci').toLowerCase().replace('_', ' ').trim();
            const displayRole = rolMap[normalizedRole] || rolMap[userRole.toLowerCase()] || 'Öğrenci';
            roleEl.textContent = displayRole;
            console.log('Rol ayarlandı:', userRole, '→', displayRole);
        }

        function logout() {
            const token = localStorage.getItem('kutuphane_token');
            
            fetch('http://localhost:5165/api/Auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).then(() => {
                localStorage.removeItem('kutuphane_id');
                localStorage.removeItem('kutuphane_ad');
                localStorage.removeItem('kutuphane_rol');
                localStorage.removeItem('kutuphane_token');
                localStorage.removeItem('kutuphane_uyeId');
                localStorage.removeItem('kutuphane_adSoyad');
                window.location.href = '../login.html';
            }).catch((error) => {
                console.error('Logout hatası:', error);
                // local storage temizleme
                localStorage.removeItem('kutuphane_id');
                localStorage.removeItem('kutuphane_ad');
                localStorage.removeItem('kutuphane_rol');
                localStorage.removeItem('kutuphane_token');
                localStorage.removeItem('kutuphane_uyeId');
                localStorage.removeItem('kutuphane_adSoyad');
                window.location.href = '../login.html';
            });
        }

        if (logoutBtn) logoutBtn.addEventListener('click', logout);

        if (profileEl) {
            profileEl.addEventListener('click', function (e) {
                if (e.target && e.target.id === 'logoutBtn') return;
                this.classList.toggle('open');
            });
        }
    }

    // DOM ready 
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUserProfile);
    } else {
        initializeUserProfile();
    }
})();
