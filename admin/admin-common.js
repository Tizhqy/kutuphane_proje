// Admin sayfaları için ortak fonksiyonlar

async function handleLogout() {
    const token = localStorage.getItem('kutuphane_token');
    
    try {
        const response = await fetch('http://localhost:5165/api/Auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            localStorage.removeItem('kutuphane_token');
            localStorage.removeItem('kutuphane_rol');
            localStorage.removeItem('kutuphane_id');
            localStorage.removeItem('kutuphane_ad');
            localStorage.removeItem('kutuphane_uyeId');
            localStorage.removeItem('kutuphane_adSoyad');
            alert('Başarıyla çıkış yapıldı!');
            window.location.href = '../login.html';
        }
    } catch (error) {
        console.error('Logout hatası:', error);
        // Hata olsa bile local storage'ı temizle
        localStorage.removeItem('kutuphane_token');
        localStorage.removeItem('kutuphane_rol');
        localStorage.removeItem('kutuphane_id');
        localStorage.removeItem('kutuphane_ad');
        localStorage.removeItem('kutuphane_uyeId');
        localStorage.removeItem('kutuphane_adSoyad');
        window.location.href = '../login.html';
    }
}

