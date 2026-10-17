import React, { useEffect, useRef, useState } from 'react';

interface IntroStageBackgroundProps {
  colorMode: 'dark' | 'light' | 'auto';
  accentColor?: string;
}

export const IntroStageBackground: React.FC<IntroStageBackgroundProps> = ({ colorMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageError, setImageError] = useState(false);

  // Determine effective mode for canvas particle tone
  const isDark = colorMode === 'dark' || (colorMode === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    // 1. Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // 2. Low-end device detection
    const nav = navigator as unknown as { hardwareConcurrency?: number; deviceMemory?: number };
    const isLowEnd = (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) || (nav.deviceMemory && nav.deviceMemory < 4);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Gold dust colors from theme
    const goldColor = isDark ? '245, 215, 122' : '184, 134, 11';
    const particleCount = isLowEnd ? 10 : 24;

    interface Particle {
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      opacity: number;
      maxOpacity: number;
      pulseSpeed: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.8,
        speedY: -(Math.random() * 0.35 + 0.1),
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.4 + 0.2,
        maxOpacity: Math.random() * 0.45 + 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let lastTime = performance.now();

    const render = (time: number) => {
      // Throttle slightly if needed, or normal 60fps
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY * (delta * 60);
        p.x += p.speedX * (delta * 60);
        p.opacity += Math.sin(time * 0.001 * p.pulseSpeed) * 0.004;

        // Wrap particles
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentOp = Math.max(0.08, Math.min(p.maxOpacity, p.opacity));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${goldColor}, ${currentOp})`;
        ctx.shadowBlur = 5;
        ctx.shadowColor = `rgba(${goldColor}, 0.5)`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isDark]);

  return (
    <div
      className={`intro-stage-container intro-stage-animated ${imageError ? 'fallback-active' : ''}`}
      aria-hidden="true"
    >
      {/* Hidden tester to trigger graceful fallback if image is missing */}
      <img
        src={`/assets/bg-intro-${isDark ? 'dark' : 'light'}-wide.webp`}
        alt=""
        decoding="async"
        loading="eager"
        className="hidden"
        onError={() => setImageError(true)}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
    </div>
  );
};
