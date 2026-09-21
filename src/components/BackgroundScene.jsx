import React, { useEffect, useRef } from 'react';

export default function BackgroundScene() {
  const canvasRef = useRef(null);

  // Atmospheric Dust / Smog VFX
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.3) * 0.25,
      vy: -Math.random() * 0.3 - 0.08,
      opacity: Math.random() * 0.35 + 0.15,
      pulse: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.pulse += 0.015;
        const currentOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 160, ${currentOpacity})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(255, 180, 80, 0.3)';
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none bg-[#0a0705]">
      {/* 1. Cinematic Background Image */}
      <img
        src="/dreamevelly_bg.jpg"
        alt="DREAMEVELLY 2026 Ambience Scene"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out"
        style={{
          objectPosition: 'center 45%',
          filter: 'brightness(0.72) saturate(0.92) contrast(1.06)',
          transform: 'scale(1.02)',
        }}
      />

      {/* 2. Warm Amber/Brown Cinematic Tint Overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundColor: 'rgba(15, 10, 7, 0.42)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* 3. Atmospheric Radial Vignette */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 42%, transparent 35%, rgba(12, 9, 7, 0.45) 68%, rgba(10, 7, 5, 0.88) 100%)',
        }}
      />

      {/* 4. Top Header Shadow Gradient */}
      <div
        className="absolute inset-x-0 top-0 h-36 z-[2] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(10, 7, 5, 0.82) 0%, rgba(10, 7, 5, 0.45) 35%, rgba(10, 7, 5, 0.15) 70%, transparent 100%)',
        }}
      />

      {/* 5. Bottom Floor / Player Dock Shadow Gradient */}
      <div
        className="absolute inset-x-0 bottom-0 h-56 z-[2] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(10, 7, 5, 0.95) 0%, rgba(10, 7, 5, 0.72) 22%, rgba(10, 7, 5, 0.35) 50%, rgba(10, 7, 5, 0.08) 80%, transparent 100%)',
        }}
      />

      {/* 6. Ambient Dust Particles Floating Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[3]" />
    </div>
  );
}
