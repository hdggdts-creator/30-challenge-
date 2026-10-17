/**
 * Canvas Confetti Particle System
 * Adapts dynamically to CSS variables for mode and accent
 */

function getThemeConfettiColors(): string[] {
  try {
    const computed = getComputedStyle(document.documentElement);
    const primary = computed.getPropertyValue('--accent-primary').trim() || '#D4AF37';
    const light = computed.getPropertyValue('--accent-light').trim() || '#F5D77A';
    const dark = computed.getPropertyValue('--accent-dark').trim() || '#AA7C11';
    const p1 = computed.getPropertyValue('--player-1-color').trim() || primary;
    const p2 = computed.getPropertyValue('--player-2-color').trim() || '#38BDF8';
    const p3 = computed.getPropertyValue('--player-3-color').trim() || '#10B981';
    const p4 = computed.getPropertyValue('--player-4-color').trim() || '#C084FC';
    const text = computed.getPropertyValue('--text-main').trim() || '#FFFFFF';

    return [primary, light, dark, p1, p2, p3, p4, text];
  } catch (e) {
    return ['#D4AF37', '#F5D77A', '#38BDF8', '#10B981', '#C084FC'];
  }
}

export function triggerConfetti(targetCanvas?: HTMLCanvasElement | null): () => void {
  let canvas = targetCanvas;
  let created = false;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    created = true;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let animationFrameId: number;
  const particles: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    vx: number;
    vy: number;
    rotation: number;
    vRot: number;
    opacity: number;
    shape: 'circle' | 'rect';
  }> = [];

  const colors = getThemeConfettiColors();

  const updateSize = () => {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };
  updateSize();
  window.addEventListener('resize', updateSize);

  // Spawn initial burst
  for (let i = 0; i < 160; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 240,
      y: canvas.height * 0.4 + (Math.random() - 0.5) * 120,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -14 - 4,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle'
    });
  }

  const startTime = Date.now();

  const render = () => {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    // Periodically add smaller secondary bursts
    if (elapsed < 3200 && Math.random() < 0.2) {
      for (let j = 0; j < 6; j++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: -10,
          size: Math.random() * 7 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * 4 + 2,
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 8,
          opacity: 1,
          shape: Math.random() > 0.4 ? 'rect' : 'circle'
        });
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.985; // air drag
      p.rotation += p.vRot;

      if (p.y > canvas.height * 0.8) {
        p.opacity -= 0.015;
      }

      if (p.opacity <= 0 || p.y > canvas.height + 20) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.6);
      }

      ctx.restore();
    }

    if (particles.length > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      if (created && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  };

  animationFrameId = requestAnimationFrame(render);

  return () => {
    window.removeEventListener('resize', updateSize);
    cancelAnimationFrame(animationFrameId);
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (created && canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };
}
