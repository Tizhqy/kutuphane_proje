document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;

    validateForm(email, password);
});

// localdan kullanici
function getStoredUsers() {
    try {
        const raw = localStorage.getItem('users');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

// kayit
function storeUser(user) {
    const users = getStoredUsers();
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
}

function validateForm(email, password) {
    if (email === '') {
        alert('Email boş olamaz!');
        return false;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        alert('Geçerli bir email girin! (örnek: ad@ktu.edu.tr)');
        return false;
    }


    if (password === '') {
        alert('Şifre boş olamaz!');
        return false;
    }
    

    if (password.length < 6) {
        alert('Şifre en az 6 karakter olmalı!');
        return false;
    }


    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!user) {
        alert('Kullanıcı bulunamadı veya şifre yanlış. Kayıtlı değilseniz önce kayıt olun.');
        return false;
    }

    alert('✅ Giriş başarılı! Yönlendiriliyor...');

    if (user.userType === 'staff') {
        window.location.href = 'index.html';
    } else {
        window.location.href = 'user-dashboard.html';
    }
    return true;
}

// kayit formuna gec
document.querySelector('.register-btn').addEventListener('click', function() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Kayıt Olun';
});

// giris formu
document.getElementById('backToLogin').addEventListener('click', function() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Giriş Yapın';
});

// kayit validasyonu
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    let fullname = document.getElementById('fullname').value;
    let email = document.getElementById('reg_email').value;
    let phone = document.getElementById('phone').value;
    let password = document.getElementById('reg_password').value;
    let confirmPassword = document.getElementById('confirm_password').value;
    let userType = document.getElementById('user_type').value;
    
    validateRegisterForm(fullname, email, phone, password, confirmPassword, userType);
});

function validateRegisterForm(fullname, email, phone, password, confirmPassword, userType) {
    // Ad soyad
    if (fullname === '' || fullname.length < 3) {
        alert('Ad soyad en az 3 karakter olmalı!');
        return false;
    }

    // Email 
    if (email === '' || !email.includes('@') || !email.includes('.')) {
        alert('Geçerli bir email girin!');
        return false;
    }

    // kopya 
    const users = getStoredUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        alert('Bu email zaten kayıtlı. Lütfen başka bir email ile kayıt olun veya giriş yapın.');
        return false;
    }

    // Telefon 
    if (phone === '' || phone.replace(/\D/g, '').length < 10) {
        alert('Geçerli bir telefon numarası girin!');
        return false;
    }

    // sifre 
    if (password.length < 6 || password.length > 40) {
        alert('Şifre 6-40 karakter arasında olmalı!');
        return false;
    }

    // sifre 
    if (password !== confirmPassword) {
        alert('Şifreler eşleşmiyor!');
        return false;
    }

    // kullanici 
    if (userType === '' || userType == null) {
        alert('Kullanıcı tipini seçin!');
        return false;
    }

    //  obje olsutur
    const newUser = {
        fullname: fullname,
        email: email.toLowerCase(),
        phone: phone,
        student_number: document.getElementById('student_number') ? document.getElementById('student_number').value : null,
        userType: userType,
        password: password,
        createdAt: new Date().toISOString()
    };

    storeUser(newUser);
    alert('✅ Kayıt başarılı! Artık giriş yapabilirsiniz.');


    document.getElementById('registerForm').reset();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Giriş Yapın';
    return true;
}

// renk
document.getElementById('password').addEventListener('input', function() {
    let password = this.value;
    
    if (password.length === 0) {
        this.style.borderColor = '';
        this.style.backgroundColor = '';
    } else if (password.length < 6) {
        this.style.borderColor = '#ff4444';
        this.style.backgroundColor = '#fff5f5';
    } else {
        this.style.borderColor = '#4CAF50';
        this.style.backgroundColor = '#f5fff5';
    }
});

// mail
document.getElementById('email').addEventListener('input', function() {
    let email = this.value;
    
    if (email.length === 0) {
        this.style.borderColor = '';
        this.style.backgroundColor = '';
    } else if (!email.includes('@') || !email.includes('.')) {
        this.style.borderColor = '#ff4444';
        this.style.backgroundColor = '#fff5f5';
    } else {
        this.style.borderColor = '#4CAF50';
        this.style.backgroundColor = '#f5fff5';
    }
});

// sifre
document.getElementById('reg_password').addEventListener('input', function() {
    let password = this.value;
    
    if (password.length === 0) {
        this.style.borderColor = '';
        this.style.backgroundColor = '';
    } else if (password.length < 6 || password.length > 40) {
        this.style.borderColor = '#ff4444';
        this.style.backgroundColor = '#fff5f5';
    } else {
        this.style.borderColor = '#4CAF50';
        this.style.backgroundColor = '#f5fff5';
    }
});


document.getElementById('confirm_password').addEventListener('input', function() {
    let password = document.getElementById('reg_password').value;
    let confirmPassword = this.value;
    
    if (confirmPassword.length === 0) {
        this.style.borderColor = '';
        this.style.backgroundColor = '';
    } else if (password !== confirmPassword) {
        this.style.borderColor = '#ff4444';
        this.style.backgroundColor = '#fff5f5';
    } else {
        this.style.borderColor = '#4CAF50';
        this.style.backgroundColor = '#f5fff5';
    }
});

(function initDefaultAdmin(){
    const users = getStoredUsers();
    const adminExists = users.some(u => u.email.toLowerCase() === 'admin@ktu.edu.tr');
    if (!adminExists) {
        const admin = {
            fullname: 'Admin User',
            email: 'admin@ktu.edu.tr',
            phone: '05550000000',
            student_number: null,
            userType: 'staff',
            password: 'admin123',
            createdAt: new Date().toISOString()
        };
        storeUser(admin);
        console.log('Default admin user created: admin@ktu.edu.tr / admin123');
    }
})();