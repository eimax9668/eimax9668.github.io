//取得した要素群
const textInput = document.getElementById('textInput');
const applyBtn = document.getElementById('applyBtn');
const sizeInput = document.getElementById('sizeInput');
const sizeNumber = document.getElementById('sizeNumber');
const speedInput = document.getElementById('speedInput');
const pauseBtn = document.getElementById('pauseBtn');

const board = document.getElementById('board');
const track = document.getElementById('track');
const msg1 = document.getElementById('msg1');
const msg2 = document.getElementById('msg2');

let paused = false;

// 文字サイズの同期（スライダーと数値入力）
function setFontSize(px) {
    px = Math.max(24, Math.min(128, Number(px) || 48));
    document.documentElement.style.setProperty('--fontSize', px + 'px');
    sizeInput.value = px;
    sizeNumber.value = px;
    recalcAnimation();
}

sizeInput.addEventListener('input', (e) => setFontSize(e.target.value));
sizeNumber.addEventListener('input', (e) => setFontSize(e.target.value));

// テキスト反映
function applyText() {
    const t = textInput.value.trim() || '（テキスト未入力）';
    msg1.textContent = t;
    msg2.textContent = t;
    recalcAnimation();
}
applyBtn.addEventListener('click', applyText);
textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyText();
});

// 速度（px/秒）設定
function setSpeed(pps) {
    pps = Math.max(40, Math.min(400, Number(pps) || 120));
    document.documentElement.style.setProperty('--speedPps', pps);
    speedInput.value = pps;
    recalcAnimation();
}
speedInput.addEventListener('input', (e) => setSpeed(e.target.value));

// 一時停止/再開
pauseBtn.addEventListener('click', () => {
    paused = !paused;
    track.classList.toggle('paused', paused);
    pauseBtn.textContent = paused ? '再開' : '一時停止';
});

// ウィンドウサイズ変更時も再計算
window.addEventListener('resize', recalcAnimation);

// アニメーション距離とdurationの再計算
function recalcAnimation() {
    // 片方のメッセージ幅を計測
    const spanWidth = msg1.offsetWidth;
    const containerWidth = board.clientWidth;

    // 速度(px/秒)
    const speedPps = Number(getComputedStyle(document.documentElement).getPropertyValue('--speedPps')) || 120;

    // 1周分の移動距離（メッセージ幅＋隙間）
    const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 80;

    // 連続スクロールの見た目を保つため、トラック全体を左へ「spanWidth + gap」移動
    const toX = -(spanWidth + gap);

    // ただし、トラックが画面外へ抜けるまでの体感を安定させるため、
    // コンテナ幅も加味したdurationにする（好みで調整）
    const distance = spanWidth + gap + containerWidth;
    const durationSec = distance / speedPps;

    document.documentElement.style.setProperty('--toX', toX + 'px');
    document.documentElement.style.setProperty('--duration', durationSec + 's');
}

// 初期設定反映
setFontSize(sizeInput.value);
setSpeed(speedInput.value);
applyText();

// 低速端末でのちらつき対策：描画後に一度再計算
window.addEventListener('load', recalcAnimation);

// フルスクリーン切り替え
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen(); // ページ全体をフルスクリーン
    fullscreenBtn.textContent = '終了';
  } else {
    document.exitFullscreen();
    fullscreenBtn.textContent = 'フルスクリーン';
  }
});

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        // フルスクリーンに入った時
        document.documentElement.style.setProperty('--fontSize', '120px');
    } else {
        // フルスクリーンを抜けた時
        document.documentElement.style.setProperty('--fontSize', sizeInput.value + 'px');
    }
    recalcAnimation(); // アニメーション再計算
});

const colorInput = document.getElementById('colorInput');

colorInput.addEventListener('input', (e) => {
    const c = e.target.value;
    document.documentElement.style.setProperty('--ledColor', c);

    // 発光色は少し明るめに自動調整（例：同じ色を薄く）
    const glow = c + '99'; // 簡易的に透明度付きカラーコード
    document.documentElement.style.setProperty('--ledGlow', glow);
});
