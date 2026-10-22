document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('particle-canvas');
  const stage = document.querySelector('.particle-stage');
  const reassembleButton = document.getElementById('reassemble-button');

  if (!canvas || !stage || !reassembleButton) return;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const particles = [];
  let animationFrame;
  let dissolveTimer;
  let width = 0;
  let height = 0;

  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const drawTextMask = () => {
    const scale = window.devicePixelRatio || 1;
    width = stage.clientWidth;
    height = stage.clientHeight;
    canvas.width = width * scale;
    canvas.height = height * scale;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);

    const fontSize = Math.min(width * 0.27, height * 0.72, 190);
    context.font = `800 ${fontSize}px system-ui, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#000';
    context.fillText('404', width / 2, height / 2);

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const step = Math.max(3, Math.round(5 * scale));
    const targets = [];

    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        if (image.data[(y * canvas.width + x) * 4 + 3] > 100) {
          targets.push({ x: x / scale, y: y / scale });
        }
      }
    }

    context.clearRect(0, 0, width, height);
    particles.length = 0;
    targets.forEach((target) => {
      particles.push({
        x: randomBetween(-width * 0.2, width * 1.2),
        y: randomBetween(-height * 0.4, height * 1.4),
        targetX: target.x,
        targetY: target.y,
        size: randomBetween(1.3, 2.8),
        alpha: randomBetween(0.55, 1),
        velocityX: randomBetween(-0.25, 0.25),
        velocityY: randomBetween(-0.25, 0.25),
      });
    });
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    particles.forEach((particle) => {
      context.fillStyle = `rgb(65 109 192 / ${particle.alpha})`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });
  };

  const settle = () => {
    particles.forEach((particle) => {
      particle.x += (particle.targetX - particle.x) * 0.05;
      particle.y += (particle.targetY - particle.y) * 0.05;
    });
  };

  const scatter = () => {
    particles.forEach((particle) => {
      particle.velocityX += randomBetween(-0.04, 0.04);
      particle.velocityY += randomBetween(-0.04, 0.04);
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityX *= 0.995;
      particle.velocityY *= 0.995;
    });
  };

  const animate = () => {
    if (reducedMotion.matches || performance.now() < dissolveTimer) {
      settle();
    } else {
      scatter();
    }
    draw();
    animationFrame = requestAnimationFrame(animate);
  };

  const reassemble = () => {
    window.clearTimeout(dissolveTimer);
    dissolveTimer = performance.now() + 3200;
  };

  const resizeObserver = new ResizeObserver(() => {
    drawTextMask();
    dissolveTimer = performance.now() + 3200;
  });

  reassembleButton.addEventListener('click', reassemble);
  resizeObserver.observe(stage);
  drawTextMask();
  stage.classList.add('is-ready');
  dissolveTimer = performance.now() + 2200;
  animate();

  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(animationFrame);
    resizeObserver.disconnect();
  }, { once: true });
});
