/**
 * Canvas Confetti Particle System
 */

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

  const colors = [
    '#D4AF37', '#F5D77A', '#FFFFFF', '#B8902B', '#E5E7EB', 
    '#F59E0B', '#38BDF8', '#34D399', '#EC4899', '#A855F7'
  ];

  const updateSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  updateSize();
  window.addEventListener('resize', updateSize);

  // Spawn initial burst
  for (let i = 0; i < 160; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.4 + (Math.random() - 0.5) * 100,
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

  let startTime = Date.now();

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    // Periodically add smaller secondary bursts
    if (elapsed < 3000 && Math.random() < 0.2) {
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

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (particles.length > 0 || elapsed < 5000) {
      animationFrameId = requestAnimationFrame(render);
    }
  };

  animationFrameId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', updateSize);
    if (created && canvas) {
      canvas.remove();
    }
  };
}
