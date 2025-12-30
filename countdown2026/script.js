// グローバル変数
let countdownInterval;
let previousValues = { days: '', minutes: '', seconds: '' };
let particles = [];
let fireworks = [];
let particleAnimationId;

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

// 花火を発射
function launchFirework() {
  const canvas = document.getElementById('fireworks-canvas');
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height * 0.5;
  fireworks.push(new Firework(x, y));
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
  const msg = document.getElementById('countdown-message');

  if (daysDigit) {
    const v = String(totalHours);
    if (previousValues.days !== v) {
      daysDigit.textContent = v;
      previousValues.days = v;
      daysDigit.classList.add('changed');
      setTimeout(() => daysDigit.classList.remove('changed'), 500);
    }
  }

  if (minutesDigit) {
    const v = String(minutes).padStart(2, "0");
    if (previousValues.minutes !== v) {
      minutesDigit.textContent = v;
      previousValues.minutes = v;
      minutesDigit.classList.add('changed');
      setTimeout(() => minutesDigit.classList.remove('changed'), 500);
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

  if (msg) {
    msg.textContent = '';
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
  initThemeSelector();
  
  countdownInterval = setInterval(countdownTo2026, 1000);
  countdownTo2026();
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-btn')) {
      launchFirework();
    }
  });
});
