document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.querySelector('.bi-brightness-high, .bi-moon');
  const html = document.documentElement;

  if (themeToggle) {
    // ページ読み込み時に保存されたテーマを反映
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      html.setAttribute('data-theme', savedTheme);
      if (savedTheme === 'dark') {
        themeToggle.classList.remove('bi-brightness-high');
        themeToggle.classList.add('bi-moon');
      }
    }

    // クリックでテーマ切替
    themeToggle.addEventListener('click', () => {
      const isDark = html.getAttribute('data-theme') === 'dark';
      if (isDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggle.classList.remove('bi-moon');
        themeToggle.classList.add('bi-brightness-high');
      } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggle.classList.remove('bi-brightness-high');
        themeToggle.classList.add('bi-moon');
      }
    });
  }

  // copyLink ボタンの処理
  const copyLinkBtn = document.getElementById('copylink');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          copyLinkBtn.textContent = 'コピーしました';
        })
        .catch(err => {
          console.error('コピーに失敗しました:', err);
        });
    });
  }
});