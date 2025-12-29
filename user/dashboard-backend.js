// v1.0 - Dark mode and global versioning comment added
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  loadCurrentBooks();
});

async function loadDashboardStats() {
  const numbers = document.querySelectorAll('.user-stats .stat-card .stat-number');
  const loansEl = numbers[0];
  const resEl = numbers[1];
  const overdueEl = numbers[2];
  const readEl = numbers[3];

  const token = localStorage.getItem('kutuphane_token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}` };

  try {
    // Aktif ödünç kitaplar
    const loanRes = await fetch('http://localhost:5165/api/islemler/benim-kitaplarim', { headers });
    const loanData = loanRes.ok ? await loanRes.json() : { total: 0 };
    if (loansEl) loansEl.textContent = loanData.total ?? 0;

    // Aktif rezervasyonlar
    const rezRes = await fetch('http://localhost:5165/api/rezervasyonlar/benim-rezervasyonlarim?page=1&pageSize=1', { headers });
    const rezData = rezRes.ok ? await rezRes.json() : { total: 0 };
    if (resEl) resEl.textContent = rezData.total ?? 0;

    // Geciken kitaplar
    const gecRes = await fetch('http://localhost:5165/api/islemler/geciken', { headers });
    const gecData = gecRes.ok ? await gecRes.json() : { total: 0 };
    if (overdueEl) overdueEl.textContent = gecData.total ?? 0;

    // Toplam okuduğum (iade edilmiş)
    const readRes = await fetch('http://localhost:5165/api/islemler/toplam-okudugum', { headers });
    const readData = readRes.ok ? await readRes.json() : { total: 0 };
    if (readEl) readEl.textContent = readData.total ?? 0;
  } catch (err) {
    console.error('Dashboard istatistik hatası:', err);
  }
}

async function loadCurrentBooks() {
  const container = document.getElementById('currentBooksContainer');
  if (!container) return;

  const token = localStorage.getItem('kutuphane_token');
  if (!token) return;
  const headers = { 'Authorization': `Bearer ${token}` };

  try {
    const res = await fetch('http://localhost:5165/api/islemler/benim-kitaplarim', { headers });
    if (!res.ok) {
      container.innerHTML = '<p style="text-align: center; padding: 20px;">Kitaplar yüklenemedi.</p>';
      return;
    }

    const data = await res.json();
    const books = (data.data || []).slice(0, 3); // Limit 3

    if (books.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 20px;">Şu an ödünç aldığınız kitap yok.</p>';
      return;
    }

    container.innerHTML = books.map(book => {
      const alimTarihi = book.alimTarihi ? new Date(book.alimTarihi) : null;
      const iadeTarihi = alimTarihi ? new Date(alimTarihi.getTime() + 14 * 24 * 60 * 60 * 1000) : null;
      const iadeTarihiStr = iadeTarihi ? iadeTarihi.toLocaleDateString('tr-TR') : '-';
      const isOverdue = iadeTarihi && iadeTarihi < new Date();

      return `
        <div class="book-item ${isOverdue ? 'overdue' : ''}">
          <div class="book-info">
            <strong>${escapeHtml(book.kitapAdi || 'Bilinmeyen Kitap')}</strong>
            <p>${escapeHtml(book.yazar || '')}</p>
            <span class="due-date ${isOverdue ? 'overdue-text' : ''}">${isOverdue ? 'Gecikmiş' : 'İade Tarihi'}: ${iadeTarihiStr}</span>
          </div>
          <div class="book-actions">
            <button class="btn-return" onclick="window.location.href='user-kitaplarim.html'">İade Et</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Ödünç kitaplar yükleme hatası:', err);
    container.innerHTML = '<p style="text-align: center; padding: 20px;">Bir hata oluştu.</p>';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
