// グローバル変数
let countdownInterval;
let previousValues = { days: '', minutes: '', seconds: '' };
let particles = [];
let fireworks = [];
let particleAnimationId;

// クリックカウンター
let clickCounts = {
  hours: 0,
  minutes: 0,
  targetHours: 0,
  targetMinutes: 0
};

// ピンポンゲーム関連
let pongGame = null;
let pongAnimationId = null;

// テーマ色を取得する関数
function getThemeColor() {
  return getComputedStyle(document.body).getPropertyValue('--digit-color').trim();
}

// パーティクルシステム
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.life = Math.random() * 100 + 50;
    this.maxLife = this.life;
    this.size = Math.random() * 2 + 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.vy += 0.02;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = getThemeColor();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead(canvas) {
    return this.life <= 0 || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height;
  }
}

// 花火システム
class Firework {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.particles = [];
    this.colors = [
      getThemeColor(),
      '#ffffff'
    ];
    
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60,
        color: this.colors[Math.floor(Math.random() * this.colors.length)]
      });
    }
  }

  update() {
    this.particles = this.particles.map(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life--;
      return p;
    }).filter(p => p.life > 0);
  }

  draw(ctx) {
    this.particles.forEach(p => {
      const alpha = p.life / 60;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  isDead() {
    return this.particles.length === 0;
  }
}

// ピンポンゲームクラス
class PongGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    
    // パドル
    this.paddleWidth = 100;
    this.paddleHeight = 15;
    this.paddleX = (this.width - this.paddleWidth) / 2;
    this.paddleY = this.height - 50;
    this.paddleSpeed = 10;
    
    // ボール
    this.ballSize = 10;
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
    this.ballSpeedX = 10;
    this.ballSpeedY = -10;
    
    // スコア
    this.score = 0;
    
    // ゲーム開始アニメーション
    this.startAnimationTime = 0;
    this.isStarting = true;
    this.startCountdown = 3;
    this.startCountdownElement = document.getElementById('game-start-countdown');
    
    // キー入力
    this.keys = {};
    
    this.setupEventListeners();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  resizeCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // パドルを中央に
    this.paddleX = (this.width - this.paddleWidth) / 2;
    this.paddleY = this.height - 50;
    
    // ボールを中央に
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
  }
  
  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
    
    // マウス移動でパドルを動かす
    document.addEventListener('mousemove', (e) => {
      this.paddleX = e.clientX - this.paddleWidth / 2;
      if (this.paddleX < 0) this.paddleX = 0;
      if (this.paddleX > this.width - this.paddleWidth) {
        this.paddleX = this.width - this.paddleWidth;
      }
    });
  }
  
  update() {
    // ゲーム開始アニメーション中は更新しない
    if (this.isStarting) {
      this.startAnimationTime++;
      
      // HTML要素でカウントダウンを表示
      if (this.startCountdownElement) {
        if (this.startCountdown > 0) {
          this.startCountdownElement.textContent = this.startCountdown;
          this.startCountdownElement.style.display = 'block';
        } else {
          this.startCountdownElement.textContent = 'START!';
        }
      }
      
      if (this.startAnimationTime >= 60) {
        this.startCountdown--;
        this.startAnimationTime = 0;
        if (this.startCountdown <= 0) {
          // START!を少し表示してから非表示
          setTimeout(() => {
            if (this.startCountdownElement) {
              this.startCountdownElement.style.display = 'none';
            }
            this.isStarting = false;
          }, 500);
        }
      }
    }
    
    // ゲーム開始中はゲームロジックをスキップ
    if (this.isStarting) {
      return;
    }
    
    // キーボード入力でパドルを動かす
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.paddleX -= this.paddleSpeed;
      if (this.paddleX < 0) this.paddleX = 0;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.paddleX += this.paddleSpeed;
      if (this.paddleX > this.width - this.paddleWidth) {
        this.paddleX = this.width - this.paddleWidth;
      }
    }
    
    // ボールの移動
    this.ballX += this.ballSpeedX;
    this.ballY += this.ballSpeedY;
    
    // 左右の壁で跳ね返る
    if (this.ballX <= this.ballSize || this.ballX >= this.width - this.ballSize) {
      this.ballSpeedX = -this.ballSpeedX;
    }
    
    // 上の壁で跳ね返る
    if (this.ballY <= this.ballSize) {
      this.ballSpeedY = -this.ballSpeedY;
    }
    
    // パドルとの衝突判定
    if (this.ballY + this.ballSize >= this.paddleY &&
        this.ballY - this.ballSize <= this.paddleY + this.paddleHeight &&
        this.ballX + this.ballSize >= this.paddleX &&
        this.ballX - this.ballSize <= this.paddleX + this.paddleWidth) {
      this.ballSpeedY = -Math.abs(this.ballSpeedY);
      // パドルのどの位置に当たったかで角度を変える
      const hitPos = (this.ballX - this.paddleX) / this.paddleWidth;
      this.ballSpeedX = (hitPos - 0.5) * 10;
      // スコアを増やす
      this.score++;
      // 花火エフェクト
      launchFirework(this.ballX, this.ballY);
    }
    
    // ボールが下に落ちたらゲームオーバー
    if (this.ballY > this.height) {
      this.gameOver(); 
      return;
    }
  }
  
  draw() {
    const color = getThemeColor();
    
    // 背景をクリア（透過）
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // ゲーム開始アニメーションはHTML要素で表示（Canvas内では描画しない）
    
    // スコア表示
    if (!this.isStarting) {
      this.ctx.save();
      this.ctx.fillStyle = color;
      this.ctx.font = `bold ${Math.min(this.width / 20, 40)}px 'Space Grotesk', monospace`;
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'top';
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = color;
      this.ctx.fillText(`SCORE: ${this.score}`, 20, 20);
      this.ctx.restore();
    }
    
    // パドルを描画
    this.ctx.fillStyle = color;
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = color;
    this.ctx.fillRect(this.paddleX, this.paddleY, this.paddleWidth, this.paddleHeight);
    this.ctx.shadowBlur = 0;
    
    // ボールを描画（ゲーム開始中は描画しない）
    if (!this.isStarting) {
      this.ctx.fillStyle = color;
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = color;
      this.ctx.beginPath();
      this.ctx.arc(this.ballX, this.ballY, this.ballSize, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }
  
  gameOver() {
    this.stop();
    // カウントダウンに戻る
    showCountdown();
    resetClickCounts();
    document.getElementById('days').classList.remove('completed');
    document.getElementById('minutes').classList.remove('completed');
    document.getElementById('seconds').classList.remove('completed');
  }
  
  start() {
    // ゲーム開始時に花火を発射
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        launchFirework(
          Math.random() * this.width,
          Math.random() * this.height * 0.5
        );
      }, i * 100);
    }
    
    const animate = () => {
      this.update();
      this.draw();
      if (pongGame) {
        pongAnimationId = requestAnimationFrame(animate);
      }
    };
    animate();
  }
  
  stop() {
    pongGame = null;
    if (pongAnimationId) {
      cancelAnimationFrame(pongAnimationId);
      pongAnimationId = null;
    }
    const canvas = document.getElementById('pong-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // ゲーム開始カウントダウンを非表示
    const startCountdownElement = document.getElementById('game-start-countdown');
    if (startCountdownElement) {
      startCountdownElement.style.display = 'none';
    }
  }
}

// パーティクルアニメーション
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  for (let i = 0; i < 50; i++) {
    particles.push(new Particle(
      Math.random() * canvas.width,
      Math.random() * canvas.height
    ));
  }
  
  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles = particles.filter(p => {
      p.update();
      p.draw(ctx);
      return !p.isDead(canvas);
    });
    
    if (particles.length < 50 && Math.random() < 0.3) {
      particles.push(new Particle(
        Math.random() * canvas.width,
        Math.random() * canvas.height
      ));
    }
    
    particleAnimationId = requestAnimationFrame(animateParticles);
  }
  
  animateParticles();
}

// 花火
function initFireworks() {
  const canvas = document.getElementById('fireworks-canvas');
  const ctx = canvas.getContext('2d');
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  function animateFireworks() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    fireworks = fireworks.filter(fw => {
      fw.update();
      fw.draw(ctx);
      return !fw.isDead();
    });
    
    requestAnimationFrame(animateFireworks);
  }
  
  animateFireworks();
}

// ピンポンゲームCanvas初期化
function initPongCanvas() {
  const canvas = document.getElementById('pong-canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '100';
  canvas.style.pointerEvents = 'auto';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// 花火を発射
function launchFirework(x, y) {
  const canvas = document.getElementById('fireworks-canvas');
  const fireworkX = x !== undefined ? x : Math.random() * canvas.width;
  const fireworkY = y !== undefined ? y : Math.random() * canvas.height * 0.5;
  fireworks.push(new Firework(fireworkX, fireworkY));
}

// クリックカウンターをリセット
function resetClickCounts() {
  clickCounts.hours = 0;
  clickCounts.minutes = 0;
}

// カウントダウンを表示
function showCountdown() {
  const pongCanvas = document.getElementById('pong-canvas');
  if (pongCanvas) pongCanvas.style.display = 'none';
}

// ピンポンゲームを開始
function startPongGame() {
  const pongCanvas = document.getElementById('pong-canvas');
  if (pongCanvas) pongCanvas.style.display = 'block';
  
  pongGame = new PongGame(pongCanvas);
  pongGame.start();
}

// カウントダウン関数
function countdownTo2026() {
  const now = new Date();
  const target = new Date('2026-01-01T00:00:00+09:00');
  const diff = Math.max(0, Math.floor((target - now) / 1000));
  
  if (diff === 0) {
    const msg = document.getElementById('countdown-message');
    if (msg) {
      msg.textContent = '2026年になりました！';
    }
    
    for (let i = 0; i < 10; i++) {
      setTimeout(() => launchFirework(), i * 300);
    }
    
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    return;
  }

  const totalHours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  const daysDigit = document.getElementById('days');
  const minutesDigit = document.getElementById('minutes');
  const secondsDigit = document.getElementById('seconds');

  if (daysDigit) {
    const v = String(totalHours);
    if (previousValues.days !== v) {
      daysDigit.textContent = v;
      previousValues.days = v;
      daysDigit.classList.add('changed');
      setTimeout(() => daysDigit.classList.remove('changed'), 500);
      
      // 目標クリック数を更新
      clickCounts.targetHours = parseInt(v) || 0;
      clickCounts.hours = 0; // リセット
    }
  }

  if (minutesDigit) {
    const v = String(minutes).padStart(2, "0");
    if (previousValues.minutes !== v) {
      minutesDigit.textContent = v;
      previousValues.minutes = v;
      minutesDigit.classList.add('changed');
      setTimeout(() => minutesDigit.classList.remove('changed'), 500);
      
      // 目標クリック数を更新
      clickCounts.targetMinutes = parseInt(v) || 0;
      clickCounts.minutes = 0; // リセット
    }
  }

  if (secondsDigit) {
    const v = String(seconds).padStart(2, "0");
    if (previousValues.seconds !== v) {
      secondsDigit.textContent = v;
      previousValues.seconds = v;
      secondsDigit.classList.add('changed');
      setTimeout(() => secondsDigit.classList.remove('changed'), 500);
    }
  }
}

// テーマ切り替え
function initThemeSelector() {
  const themes = ['orange', 'blue', 'green', 'purple', 'red', 'cyan'];
  const themeBtn = document.getElementById('theme-toggle');
  let currentThemeIndex = themes.indexOf(localStorage.getItem('countdown-theme') || 'orange');
  
  if (currentThemeIndex === -1) {
    currentThemeIndex = 0;
  }
  
  function applyTheme(index) {
    const theme = themes[index];
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('countdown-theme', theme);
    themeBtn.style.color = getComputedStyle(document.body).getPropertyValue('--digit-color').trim();
  }
  
  applyTheme(currentThemeIndex);
  
  themeBtn.addEventListener('click', () => {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme(currentThemeIndex);
  });
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initFireworks();
  initPongCanvas();
  initThemeSelector();
  
  countdownInterval = setInterval(countdownTo2026, 1000);
  countdownTo2026();
  
  // 各カウントダウン要素にクリックイベントを追加
  const daysDigit = document.getElementById('days');
  const minutesDigit = document.getElementById('minutes');
  const secondsDigit = document.getElementById('seconds');
  
  // 時間のクリック処理
  if (daysDigit) {
    daysDigit.style.cursor = 'pointer';
    daysDigit.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (pongGame) return; // ゲーム中は無効
      
      clickCounts.hours++;
      const target = clickCounts.targetHours;
      
      // クリックアニメーション
      daysDigit.classList.add('clicked');
      setTimeout(() => {
        daysDigit.classList.remove('clicked');
      }, 300);
      
      // 目標回数に達したかチェック
      if (clickCounts.hours >= target && target > 0) {
        // 完了エフェクト
        launchFirework(
          daysDigit.getBoundingClientRect().left + daysDigit.offsetWidth / 2,
          daysDigit.getBoundingClientRect().top + daysDigit.offsetHeight / 2
        );
        daysDigit.classList.add('completed');  
      }
    });
  }
  
  // 分のクリック処理
  if (minutesDigit) {
    minutesDigit.style.cursor = 'pointer';
    minutesDigit.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (pongGame) return; // ゲーム中は無効
      
      // 時間の目標回数に達していない場合は無効
      if (clickCounts.hours < clickCounts.targetHours || clickCounts.targetHours === 0) {
        return;
      }
      
      clickCounts.minutes++;
      const target = clickCounts.targetMinutes;
      
      // クリックアニメーション
      minutesDigit.classList.add('clicked');
      setTimeout(() => {
        minutesDigit.classList.remove('clicked');
      }, 300);
      
      // 目標回数に達したかチェック
      if (clickCounts.minutes >= target && target > 0) {
        // 完了エフェクト
        launchFirework(
          minutesDigit.getBoundingClientRect().left + minutesDigit.offsetWidth / 2,
          minutesDigit.getBoundingClientRect().top + minutesDigit.offsetHeight / 2
        );
        minutesDigit.classList.add('completed');  
      }
    });
  }
  
  // 秒のクリック処理
  if (secondsDigit) {
    secondsDigit.style.cursor = 'pointer';
    secondsDigit.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (pongGame) return; // ゲーム中は無効
      
      // 時間と分の目標回数に達していない場合は無効
      if (clickCounts.hours < clickCounts.targetHours || 
          clickCounts.minutes < clickCounts.targetMinutes ||
          clickCounts.targetHours === 0 ||
          clickCounts.targetMinutes === 0) {
        return;
      }
      
      // ピンポンゲームを開始
      startPongGame();
      secondsDigit.classList.add('completed');  
    });
  }
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-btn') && !e.target.closest('.countdown-digit')) {
      if (!pongGame) {
        launchFirework();
      }
    }
  });
});
