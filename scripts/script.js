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

// scripts/script.js

document.addEventListener('DOMContentLoaded', () => {
  const rainbowEl = document.getElementById('rainbow-overscroll');
  if (!rainbowEl) return;

  let isAnimating = false;
  let touchStartY = 0;

  // ページ最下部に到達しているか判定する関数
  function isAtBottom() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // 誤差2px以内であれば最下部と判定
    return scrollTop + windowHeight >= documentHeight - 2;
  }

  // アニメーション発火と復帰処理
  function triggerRainbow() {
    if (isAnimating) return;
    isAnimating = true;

    // クラスを付与して虹を表示＆ボディを少し持ち上げる
    rainbowEl.classList.add('active');
    document.body.classList.add('rainbow-active');

    // 0.7秒後にスムーズに戻す
    setTimeout(() => {
      rainbowEl.classList.remove('active');
      document.body.classList.remove('rainbow-active');

      // アニメーション完了後にフラグ解除
      setTimeout(() => {
        isAnimating = false;
      }, 600);
    }, 700);
  }

  // 1. マウスホイール（PC）の検知
  window.addEventListener('wheel', (e) => {
    // 下方向のスクロール（e.deltaY > 0）かつ最下部の場合
    if (e.deltaY > 0 && isAtBottom()) {
      triggerRainbow();
    }
  }, { passive: true });

  // 2. タッチ操作（スマホ）の検知
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY - currentY; // 下へスワイプすると deltaY はプラス

    if (deltaY > 15 && isAtBottom()) {
      triggerRainbow();
    }
  }, { passive: true });

  // 3. キーボード操作（ArrowDown, PageDown, Space）の検知
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'PageDown', ' '].includes(e.key) && isAtBottom()) {
      triggerRainbow();
    }
  });
});