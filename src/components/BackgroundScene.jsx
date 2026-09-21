import React, { useEffect, useRef } from 'react';

export default function BackgroundScene({ activePlaylist }) {
  const canvasRef = useRef(null);

  const isRain = activePlaylist?.id === 'barish' || activePlaylist?.hasRainEffect;
  const currentBg = isRain ? '/barish_bg.jpg' : (activePlaylist?.bg || '/dreamevelly_bg.jpg');

  // Canvas VFX Engine: Rain & Ripples when Barish, Atmospheric Golden Embers otherwise
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

    // RAIN PARTICLES & SPLASHES
    const rainDrops = Array.from({ length: 180 }, () => ({
      x: Math.random() * (canvas.width + 200) - 100,
      y: Math.random() * canvas.height,
      length: Math.random() * 20 + 12,
      speed: Math.random() * 12 + 18,
      opacity: Math.random() * 0.45 + 0.2,
      width: Math.random() * 1.2 + 0.7,
    }));

    let splashes = [];

    // EMBER PARTICLES (when not raining)
    const embers = Array.from({ length: 35 }, () => ({
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

      if (isRain) {
        // --- RENDER RAIN PARTICLES ---
        ctx.lineCap = 'round';

        rainDrops.forEach((d) => {
          ctx.strokeStyle = `rgba(185, 215, 255, ${d.opacity})`;
          ctx.lineWidth = d.width;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          // slight wind angle
          ctx.lineTo(d.x - 3, d.y + d.length);
          ctx.stroke();

          d.y += d.speed;
          d.x -= 2;

          // Hit ground / bottom threshold -> create splash
          if (d.y > canvas.height - 30) {
            if (Math.random() < 0.25 && splashes.length < 50) {
              splashes.push({
                x: d.x,
                y: canvas.height - Math.random() * 40,
                radius: 1,
                maxRadius: Math.random() * 5 + 2.5,
                opacity: 0.5,
              });
            }
            d.y = -20;
            d.x = Math.random() * (canvas.width + 200) - 50;
          }
        });

        // --- RENDER SPLASHES / WATER RIPPLES ---
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.radius += 0.5;
          s.opacity -= 0.025;

          if (s.opacity <= 0 || s.radius >= s.maxRadius) {
            splashes.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.radius * 2.2, s.radius * 0.7, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(200, 230, 255, ${s.opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      } else {
        // --- RENDER EMBER DUST PARTICLES ---
        embers.forEach((p) => {
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
          if (p.y < -10) {
            p.y = canvas.height + 10;
            p.x = Math.random() * canvas.width;
          }
          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRain]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none bg-[#0a0705]">
      {/* 1. Primary Scene Background Image with Smooth Crossfade */}
      <img
        key={currentBg}
        src={currentBg}
        alt="Atmospheric Scene Background"
        className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out animate-in fade-in"
        style={{
          objectPosition: isRain ? 'center 40%' : 'center 45%',
          filter: isRain
            ? 'brightness(0.68) saturate(0.88) contrast(1.08)'
            : 'brightness(0.72) saturate(0.92) contrast(1.06)',
          transform: 'scale(1.02)',
        }}
      />

      {/* 2. Color Grading Overlay (Cooler teal/grey tint for Rain, Warm Amber for default) */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none transition-colors duration-1000"
        style={{
          backgroundColor: isRain ? 'rgba(8, 14, 20, 0.38)' : 'rgba(15, 10, 7, 0.42)',
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

      {/* 6. Dynamic Canvas (Raindrops & Ripples when Barish, Floating Embers otherwise) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[3]" />
    </div>
  );
}
