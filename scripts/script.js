document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const initializeThemeToggle = () => {
    const themeToggle = document.querySelector('.bi-brightness-high, .bi-moon');
    if (!themeToggle || themeToggle.dataset.themeInitialized === 'true') return;

    themeToggle.dataset.themeInitialized = 'true';

    // ページ読み込み時に保存されたテーマを反映
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      html.setAttribute('data-theme', savedTheme);
    }
    themeToggle.classList.toggle('bi-moon', html.getAttribute('data-theme') === 'dark');
    themeToggle.classList.toggle('bi-brightness-high', html.getAttribute('data-theme') !== 'dark');

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
  };

  initializeThemeToggle();
  document.addEventListener('footerLoaded', initializeThemeToggle);

  const initializeFlashlightToggle = () => {
    const flashlightToggle = document.querySelector('.bi-vignette');
    if (!flashlightToggle || flashlightToggle.dataset.flashlightInitialized === 'true') return;

    flashlightToggle.dataset.flashlightInitialized = 'true';
    document.documentElement.dataset.flashlight = 'off';
    flashlightToggle.addEventListener('click', () => {
      const isEnabled = document.documentElement.dataset.flashlight === 'on';
      document.documentElement.dataset.flashlight = isEnabled ? 'off' : 'on';
      const nextLabel = isEnabled ? '懐中電灯モードをオンにする' : '懐中電灯モードをオフにする';
      flashlightToggle.setAttribute('aria-label', nextLabel);
      flashlightToggle.setAttribute('title', nextLabel);
    });
  };

  initializeFlashlightToggle();
  document.addEventListener('footerLoaded', initializeFlashlightToggle);

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

document.addEventListener('DOMContentLoaded', () => {
  // このスクリプトが実行されるページのいいねコンテナを取得
  const likeContainer = document.querySelector('.like-container');
  if (!likeContainer) return;

  const articleId = likeContainer.dataset.articleId;
  const likeButton = likeContainer.querySelector('.like-button');
  const likeCountSpan = likeContainer.querySelector('.like-count');
  
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzSWTLAhn9tLjqNLDJqc33pX4ob374oz8Um9PwpCH4hcOBu7kAKlhnPRli3HMuJ_Ya7uw/exec";

  const fetchCurrentLikes = async () => {
    try {
      // いいね数を取得
      const response = await fetch(`${GAS_URL}?articleId=${articleId}`);
      if (!response.ok) throw new Error('Network response was not ok.');
      
      const data = await response.json();
      if (data.likeCount !== undefined) {
        likeCountSpan.textContent = data.likeCount;
      }
    } catch (error) {
      console.error('いいね数の取得に失敗:', error);
      likeCountSpan.textContent = '取得失敗';
    }
  };

  // --- 2. ボタンクリック時にいいねを送信 ---
  let isSending = false; // 送信中フラグ

  const handleLikeClick = async () => {
    if (isSending) return; // 送信中なら無視
    isSending = true;

    // ボタンを無効化＆「送信中…」に変更
    likeButton.disabled = true;
    likeButton.style.cursor = 'not-allowed';
    const originalText = likeButton.innerHTML;
    likeButton.innerHTML = '<i class="bi bi-suit-heart"></i> 送信中…';

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ articleId: articleId }),
      });

      if (!response.ok) throw new Error('Network response was not ok.');

      const data = await response.json();
      if (data.likeCount !== undefined) {
        likeCountSpan.textContent = data.likeCount;
        localStorage.setItem(`liked_${articleId}`, 'true');
        likeButton.innerHTML = '<i class="bi bi-suit-heart-fill"></i> いいね済み';
        likeButton.style.cursor = 'not-allowed';
      }
    } catch (error) {
      console.error('いいねの送信に失敗:', error);
      // エラー時は元のボタンに戻す
      likeButton.disabled = false;
      likeButton.style.cursor = '';
      likeButton.innerHTML = originalText;
    } finally {
      isSending = false;
    }
  };

  // --- 3. 実行処理 ---

  // 既にいいね済みかローカルストレージでチェック
  if (localStorage.getItem(`liked_${articleId}`) === 'true') {
    likeButton.disabled = true;
    likeButton.innerHTML = '<i class="bi bi-suit-heart-fill "></i> いいね済み';
    likeButton.style.cursor = 'not-allowed';
  } else {
    // まだいいねしていなければ、クリックイベントを設定
    likeButton.addEventListener('click', handleLikeClick);
  }

  // ページ読み込み時に現在のいいね数を取得・表示
  fetchCurrentLikes();
});