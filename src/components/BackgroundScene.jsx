import React, { useEffect, useRef } from 'react';

export default function BackgroundScene({ activePlaylist }) {
  const canvasRef = useRef(null);

  const theme = activePlaylist?.theme || (
    activePlaylist?.id === 'barish' ? 'barish' :
    activePlaylist?.id === 'english-indie' ? 'aurora' :
    activePlaylist?.id === 'indie-2026' ? 'indie' : 'dreamvalley'
  );

  const currentBg = activePlaylist?.bg || (
    theme === 'barish' ? '/barish_bg.jpg' :
    theme === 'aurora' ? '/english_aurora_bg.jpg' :
    theme === 'indie' ? '/indie_mist_bg.jpg' : '/dreamevelly_bg.jpg'
  );

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

    // ==========================================
    // 1. BARISH (RAIN + SPLASHES + BIJLI / LIGHTNING)
    // ==========================================
    const rainDrops = Array.from({ length: 190 }, () => ({
      x: Math.random() * (canvas.width + 200) - 100,
      y: Math.random() * canvas.height,
      length: Math.random() * 22 + 14,
      speed: Math.random() * 14 + 18,
      opacity: Math.random() * 0.45 + 0.25,
      width: Math.random() * 1.3 + 0.7,
    }));
    let splashes = [];

    // Lightning State & Generator
    let lightning = {
      active: false,
      timer: 160 + Math.random() * 200, // frames until first strike (~3-6s)
      flashOpacity: 0,
      bolt: null,
      frame: 0,
    };

    const generateBolt = (w, h) => {
      const startX = w * (0.2 + Math.random() * 0.6);
      let curX = startX;
      let curY = 0;
      const segments = [];
      const targetY = h * (0.38 + Math.random() * 0.22);
      const steps = 16;
      const stepY = targetY / steps;

      for (let i = 0; i < steps; i++) {
        const nextX = curX + (Math.random() - 0.5) * 44;
        const nextY = curY + stepY * (0.75 + Math.random() * 0.5);
        segments.push({
          x1: curX,
          y1: curY,
          x2: nextX,
          y2: nextY,
          w: Math.max(1, 2.6 * (1 - i / steps)),
        });

        // Fork / Branching bolt
        if (Math.random() < 0.32 && i < steps - 2) {
          let bX = nextX;
          let bY = nextY;
          const bSteps = 3 + Math.floor(Math.random() * 4);
          const dir = Math.random() > 0.5 ? 24 : -24;
          for (let j = 0; j < bSteps; j++) {
            const nbX = bX + dir + (Math.random() - 0.5) * 22;
            const nbY = bY + stepY * 0.6;
            segments.push({
              x1: bX,
              y1: bY,
              x2: nbX,
              y2: nbY,
              w: 0.9,
            });
            bX = nbX;
            bY = nbY;
          }
        }

        curX = nextX;
        curY = nextY;
      }
      return { segments, originX: startX };
    };

    // ==========================================
    // 2. DREAMVALLEY 2026 (METEOR SHOWER / ULKA PIND)
    // ==========================================
    let meteors = [];
    let meteorSpawnTimer = 25 + Math.random() * 35;

    // ==========================================
    // 3. AURORA (ICELAND NORTHERN LIGHTS + CLEAN GENTLE SNOWFALL)
    // ==========================================
    const snowflakes = Array.from({ length: 65 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.0 + 0.8,
      speed: Math.random() * 1.1 + 0.5,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.01,
      opacity: Math.random() * 0.55 + 0.25,
    }));

    // ==========================================
    // 4. INDIE (MISTY FOREST LAKE + CABIN SPARKS)
    // ==========================================
    const mistLayers = Array.from({ length: 8 }, (_, i) => ({
      x: (i * (canvas.width / 4)) - 100,
      y: canvas.height * (0.35 + (i % 4) * 0.12),
      width: Math.random() * 380 + 320,
      height: Math.random() * 70 + 50,
      speed: Math.random() * 0.25 + 0.1,
      opacity: Math.random() * 0.09 + 0.05,
    }));

    const cabinSparks = Array.from({ length: 30 }, () => ({
      x: canvas.width * 0.6 + (Math.random() - 0.5) * 160,
      y: canvas.height * 0.55 + Math.random() * 120,
      radius: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.4) * 0.35,
      vy: -Math.random() * 0.6 - 0.2,
      opacity: Math.random() * 0.7 + 0.2,
      life: Math.random(),
    }));

    // ==========================================
    // MAIN RENDER LOOP
    // ==========================================
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (theme === 'barish') {
        // --- 1. RAIN PARTICLES ---
        ctx.lineCap = 'round';
        rainDrops.forEach((d) => {
          ctx.strokeStyle = `rgba(185, 215, 255, ${d.opacity})`;
          ctx.lineWidth = d.width;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - 3.5, d.y + d.length);
          ctx.stroke();

          d.y += d.speed;
          d.x -= 2.2;

          // Splash trigger
          if (d.y > canvas.height - 35) {
            if (Math.random() < 0.3 && splashes.length < 60) {
              splashes.push({
                x: d.x,
                y: canvas.height - Math.random() * 45,
                radius: 1,
                maxRadius: Math.random() * 5.5 + 2.5,
                opacity: 0.55,
              });
            }
            d.y = -20;
            d.x = Math.random() * (canvas.width + 200) - 50;
          }
        });

        // --- SPLASHES & RIPPLES ---
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.radius += 0.55;
          s.opacity -= 0.026;

          if (s.opacity <= 0 || s.radius >= s.maxRadius) {
            splashes.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.radius * 2.2, s.radius * 0.7, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(210, 235, 255, ${s.opacity})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }

        // --- ⚡ BIJLI KADAKNA (LIGHTNING FLASH & BOLT) ---
        lightning.timer -= 1;
        if (lightning.timer <= 0 && !lightning.active) {
          lightning.active = true;
          lightning.frame = 0;
          lightning.bolt = generateBolt(canvas.width, canvas.height);
          lightning.timer = 240 + Math.random() * 340; // Next strike in 4-9 sec
        }

        if (lightning.active) {
          lightning.frame += 1;

          // Realistic double-flash pulsation: Peak -> Dip -> Secondary peak -> Fade
          if (lightning.frame <= 2) {
            lightning.flashOpacity = 0.58;
          } else if (lightning.frame === 3) {
            lightning.flashOpacity = 0.22;
          } else if (lightning.frame <= 5) {
            lightning.flashOpacity = 0.68; // Main strike
          } else if (lightning.frame <= 7) {
            lightning.flashOpacity = 0.35;
          } else {
            lightning.flashOpacity *= 0.68;
          }

          if (lightning.frame > 14 || lightning.flashOpacity < 0.02) {
            lightning.active = false;
            lightning.flashOpacity = 0;
          }

          // Sky Glow Flash (Ambient radial burst from strike origin)
          if (lightning.flashOpacity > 0.03 && lightning.bolt) {
            const grad = ctx.createRadialGradient(
              lightning.bolt.originX, 0, 30,
              lightning.bolt.originX, canvas.height * 0.45, canvas.width * 0.85
            );
            grad.addColorStop(0, `rgba(235, 245, 255, ${lightning.flashOpacity * 0.85})`);
            grad.addColorStop(0.35, `rgba(165, 215, 255, ${lightning.flashOpacity * 0.45})`);
            grad.addColorStop(1, `rgba(110, 170, 240, ${lightning.flashOpacity * 0.12})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Lightning Bolt Segments (Frames 1-8)
            if (lightning.frame <= 8) {
              // Outer electric halo stroke
              ctx.lineWidth = 6;
              ctx.strokeStyle = `rgba(170, 220, 255, ${lightning.flashOpacity * 0.7})`;
              ctx.beginPath();
              lightning.bolt.segments.forEach((seg) => {
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
              });
              ctx.stroke();

              // Inner sharp white core
              ctx.lineWidth = 2.2;
              ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, lightning.flashOpacity * 1.5)})`;
              ctx.beginPath();
              lightning.bolt.segments.forEach((seg) => {
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
              });
              ctx.stroke();
            }
          }
        }

      } else if (theme === 'aurora') {
        // --- 2. ICELAND WHITE SNOW & CLEAN GENTLE SNOWFALL (NO LIGHT MOVEMENT) ---
        snowflakes.forEach((s) => {
          s.sway += s.swaySpeed;
          s.y += s.speed;
          s.x += Math.sin(s.sway) * 0.55;

          if (s.y > canvas.height + 10) {
            s.y = -10;
            s.x = Math.random() * canvas.width;
          }

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(230, 245, 255, ${s.opacity})`;
          ctx.shadowBlur = 3;
          ctx.shadowColor = 'rgba(160, 220, 255, 0.4)';
          ctx.fill();
          ctx.shadowBlur = 0;
        });

      } else if (theme === 'indie') {
        // --- 3. MISTY PACIFIC LAKE + COZY CABIN SPARKS ---
        // Rolling translucent fog clouds
        mistLayers.forEach((m) => {
          m.x += m.speed;
          if (m.x > canvas.width + 150) {
            m.x = -m.width - 50;
            m.y = canvas.height * (0.35 + Math.random() * 0.35);
          }

          const grad = ctx.createRadialGradient(
            m.x + m.width / 2, m.y + m.height / 2, 10,
            m.x + m.width / 2, m.y + m.height / 2, m.width / 2
          );
          grad.addColorStop(0, `rgba(180, 210, 230, ${m.opacity})`);
          grad.addColorStop(0.6, `rgba(150, 185, 210, ${m.opacity * 0.5})`);
          grad.addColorStop(1, 'transparent');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(m.x + m.width / 2, m.y + m.height / 2, m.width / 2, m.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        });

        // Floating fireplace sparks from cabin
        cabinSparks.forEach((sp) => {
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.life -= 0.005;

          if (sp.life <= 0 || sp.y < canvas.height * 0.3) {
            sp.x = canvas.width * 0.65 + (Math.random() - 0.5) * 140;
            sp.y = canvas.height * 0.65 + Math.random() * 80;
            sp.life = 1;
          }

          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 185, 95, ${sp.opacity * sp.life})`;
          ctx.shadowBlur = 5;
          ctx.shadowColor = 'rgba(255, 140, 50, 0.6)';
          ctx.fill();
          ctx.shadowBlur = 0;
        });

      } else {
        // --- 4. DREAMVALLEY 2026: GRACEFUL METEOR SHOWER (NO JUGNOO) ---
        meteorSpawnTimer -= 1;
        if (meteorSpawnTimer <= 0) {
          // Spawn 1 or 2 meteors
          const count = Math.random() < 0.35 ? 2 : 1;
          for (let c = 0; c < count; c++) {
            const angle = Math.PI * 0.22 + (Math.random() - 0.5) * 0.08;
            const speed = Math.random() * 6 + 10;
            const length = Math.random() * 110 + 70;
            meteors.push({
              x: Math.random() * (canvas.width * 1.1) - canvas.width * 0.05,
              y: Math.random() * (canvas.height * 0.28) - 20,
              vx: -Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              length: length,
              opacity: Math.random() * 0.35 + 0.65,
              decay: Math.random() * 0.016 + 0.012,
              width: Math.random() * 1.4 + 1.1,
              isGolden: Math.random() > 0.4,
            });
          }
          // Steady, soothing meteor shower interval: ~0.8 to 1.6 seconds
          meteorSpawnTimer = 45 + Math.random() * 50;
        }

        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          const tailX = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.length;
          const tailY = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.length;

          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          if (m.isGolden) {
            grad.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`);
            grad.addColorStop(0.18, `rgba(255, 220, 140, ${m.opacity * 0.85})`);
            grad.addColorStop(0.65, `rgba(245, 150, 50, ${m.opacity * 0.35})`);
            grad.addColorStop(1, 'transparent');
          } else {
            grad.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`);
            grad.addColorStop(0.2, `rgba(180, 230, 255, ${m.opacity * 0.85})`);
            grad.addColorStop(0.7, `rgba(110, 175, 255, ${m.opacity * 0.3})`);
            grad.addColorStop(1, 'transparent');
          }

          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tailX, tailY);
          ctx.lineWidth = m.width;
          ctx.strokeStyle = grad;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Luminous meteor head glow
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.width * 1.1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${m.opacity})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = m.isGolden ? 'rgba(255, 200, 100, 0.75)' : 'rgba(150, 220, 255, 0.75)';
          ctx.fill();
          ctx.shadowBlur = 0;

          m.x += m.vx;
          m.y += m.vy;
          m.opacity -= m.decay;

          if (m.opacity <= 0 || m.y > canvas.height * 0.65 || m.x < -120) {
            meteors.splice(i, 1);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none bg-[#0a0705]">
      {/* 1. Primary Scene Background Image with Smooth Crossfade */}
      <img
        key={currentBg}
        src={currentBg}
        alt="Atmospheric Scene Background"
        className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out animate-in fade-in"
        style={{
          objectPosition: theme === 'barish' ? 'center 40%' : 'center 45%',
          filter: theme === 'barish'
            ? 'brightness(0.70) saturate(0.92) contrast(1.08)'
            : theme === 'aurora'
            ? 'brightness(0.78) saturate(1.05) contrast(1.05)'
            : theme === 'indie'
            ? 'brightness(0.72) saturate(0.95) contrast(1.06)'
            : 'brightness(0.74) saturate(0.95) contrast(1.06)',
          transform: 'scale(1.02)',
        }}
      />

      {/* 2. Color Grading Overlay per theme */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none transition-colors duration-1000"
        style={{
          backgroundColor:
            theme === 'barish' ? 'rgba(8, 14, 20, 0.32)' :
            theme === 'aurora' ? 'rgba(4, 10, 20, 0.24)' :
            theme === 'indie' ? 'rgba(8, 16, 22, 0.30)' :
            'rgba(15, 10, 7, 0.35)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* 3. Soft Ambient Vignette (Zero black circle behind cards) */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(8, 6, 5, 0.45) 100%)',
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

      {/* 6. Dynamic VFX Canvas (Rain & Lightning, Aurora & Snow, Mist & Sparks, Fireflies & Shooting Stars) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[3]" />
    </div>
  );
}
