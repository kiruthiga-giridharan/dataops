(() => {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     PHOTO / VIDEO UPLOAD PREVIEW
  ══════════════════════════════════════════════════════════════ */
  const photoUpload   = document.getElementById('photoUpload');
  const photoPreview  = document.getElementById('photoPreview');
  const videoPreview  = document.getElementById('videoPreview');
  const uploadLabel   = document.querySelector('.photo-upload-label');

  photoUpload?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('video/')) {
      videoPreview.src = url;
      videoPreview.style.display = 'block';
      photoPreview.style.display = 'none';
    } else {
      photoPreview.src = url;
      photoPreview.style.display = 'block';
      videoPreview.style.display = 'none';
    }
    if (uploadLabel) uploadLabel.style.display = 'none';
  });

  /* ══════════════════════════════════════════════════════════════
     HAMBURGER MENU
  ══════════════════════════════════════════════════════════════ */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  function closeMenu() {
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    mobileMenu?.setAttribute('aria-hidden', 'true');
  }

  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileMenu?.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu?.setAttribute('aria-hidden', String(!isOpen));
  });

  // Close on link click or outside tap
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', e => {
    if (mobileMenu?.classList.contains('open') &&
        !mobileMenu.contains(e.target) &&
        !hamburger?.contains(e.target)) closeMenu();
  });

  /* ══════════════════════════════════════════════════════════════
     THEME
  ══════════════════════════════════════════════════════════════ */
  const root = document.documentElement;
  const btn  = document.getElementById('themeBtn');

  const savedTheme  = () => localStorage.getItem('kg-theme');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('kg-theme', theme);
    btn?.setAttribute('aria-pressed', String(theme === 'dark'));
    // Recolour canvas particles on theme switch
    if (window._particleTheme) window._particleTheme(theme);
  }

  const initial = savedTheme() ?? 'light';
  applyTheme(initial);

  btn?.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!savedTheme()) applyTheme(e.matches ? 'dark' : 'light');
  });

  /* ══════════════════════════════════════════════════════════════
     PARTICLE NETWORK CANVAS
  ══════════════════════════════════════════════════════════════ */
  (function initParticles() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, particles, mouse = { x: -9999, y: -9999 };
    const COUNT      = 72;
    const MAX_DIST   = 140;
    const MOUSE_PULL = 100;

    // Colours per theme
    let dotColor, lineColor;

    function setColors(theme) {
      if (theme === 'dark') {
        dotColor  = 'rgba(127,176,245,';   // violet
        lineColor = 'rgba(82,140,227,';    // indigo
      } else {
        dotColor  = 'rgba(82,140,227,';    // indigo
        lineColor = 'rgba(127,176,245,';   // violet
      }
    }

    setColors(root.getAttribute('data-theme') || 'light');
    // Expose so applyTheme can update without re-initing
    window._particleTheme = (t) => { setColors(t); };

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    class Particle {
      constructor() {
        this.x  = Math.random() * W;
        this.y  = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.r  = Math.random() * 1.8 + 0.8;
      }
    }

    function init() {
      resize();
      particles = Array.from({ length: COUNT }, () => new Particle());
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Update & draw dots
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];

        // Soft mouse attraction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const md = Math.sqrt(dx * dx + dy * dy);
        if (md < MOUSE_PULL) {
          p.vx += dx / md * 0.012;
          p.vy += dy / md * 0.012;
        }

        // Speed cap
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.9) { p.vx *= 0.9 / speed; p.vy *= 0.9 / speed; }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor + '0.7)';
        ctx.fill();
      }

      // Draw edges
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.35;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = lineColor + alpha + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    init();
    draw();

    window.addEventListener('resize', () => { resize(); }, { passive: true });

    // Mouse tracking — relative to canvas
    const hero = document.querySelector('.hero');
    hero?.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });
    hero?.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  })();

  /* ══════════════════════════════════════════════════════════════
     WORD CYCLE
  ══════════════════════════════════════════════════════════════ */
  (function initWordCycle() {
    const el    = document.getElementById('cycleWord');
    if (!el) return;
    const words = ['strategy', 'precision', 'clarity', 'impact', 'velocity'];
    let idx = 0;
    let cycling = false;

    el.classList.add('visible');

    function next() {
      if (cycling) return;
      cycling = true;

      // Step 1: exit (slide up + fade out)
      el.classList.remove('visible');
      el.classList.add('exiting');

      setTimeout(() => {
        // Step 2: swap text, snap to below without transition
        idx = (idx + 1) % words.length;
        el.textContent = words[idx];
        el.classList.remove('exiting');
        el.classList.add('entering'); // no transition — instant reposition

        // Step 3: after two frames (ensures 'entering' is painted), animate to visible
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.classList.remove('entering');
            el.classList.add('visible'); // transition kicks in here
            cycling = false;
          });
        });
      }, 320);
    }

    setTimeout(() => {
      next();
      setInterval(next, 3200);
    }, 2800);
  })();

  /* ══════════════════════════════════════════════════════════════
     COUNT-UP STATS
  ══════════════════════════════════════════════════════════════ */
  (function initCountUp() {
    const stats = document.querySelectorAll('.stat-n[data-count]');
    if (!stats.length) return;

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function countUp(el) {
      const target   = parseInt(el.dataset.count, 10);
      const suffix   = el.dataset.suffix || '';
      const duration = target > 100 ? 1600 : 900;
      const start    = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.floor(easeOut(progress) * target);
        el.innerHTML = value + (suffix ? `<sup>${suffix}</sup>` : '');
        if (progress < 1) requestAnimationFrame(tick);
        else el.innerHTML = target + (suffix ? `<sup>${suffix}</sup>` : '');
      }
      requestAnimationFrame(tick);
    }

    const statsBlock = document.querySelector('.hero-stats');
    if (!statsBlock) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          stats.forEach(el => countUp(el));
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    obs.observe(statsBlock);
  })();

  /* ══════════════════════════════════════════════════════════════
     NAV SCROLL STATE
  ══════════════════════════════════════════════════════════════ */
  const nav = document.getElementById('nav');

  const onScroll = () => {
    nav?.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ══════════════════════════════════════════════════════════════
     SCROLL REVEAL
  ══════════════════════════════════════════════════════════════ */
  const revealObs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); revealObs.unobserve(e.target); }
    }),
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* ══════════════════════════════════════════════════════════════
     BENTO STAGGER
  ══════════════════════════════════════════════════════════════ */
  const bentoObs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); bentoObs.unobserve(e.target); }
    }),
    { threshold: 0.05 }
  );
  document.querySelectorAll('.bento').forEach(el => bentoObs.observe(el));

  /* ══════════════════════════════════════════════════════════════
     SKILL TILES — staggered entrance
  ══════════════════════════════════════════════════════════════ */
  const skillObs = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.skill-tile').forEach((tile, i) => {
            tile.style.opacity = '0';
            tile.style.transform = 'translateY(12px)';
            setTimeout(() => {
              tile.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
              tile.style.opacity = '1';
              tile.style.transform = 'translateY(0)';
            }, i * 55);
          });
          skillObs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  document.querySelectorAll('.scb').forEach(el => skillObs.observe(el));

  /* ══════════════════════════════════════════════════════════════
     SMOOTH ANCHOR SCROLL
  ══════════════════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
    });
  });

  /* ══════════════════════════════════════════════════════════════
     MARQUEE PAUSE ON HOVER
  ══════════════════════════════════════════════════════════════ */
  const track = document.querySelector('.marquee-track');
  const wrap  = document.querySelector('.marquee-wrap');
  wrap?.addEventListener('mouseenter', () => { if (track) track.style.animationPlayState = 'paused'; });
  wrap?.addEventListener('mouseleave', () => { if (track) track.style.animationPlayState = 'running'; });

  /* ══════════════════════════════════════════════════════════════
     HERO HEADLINE STAGGER
  ══════════════════════════════════════════════════════════════ */
  function staggerHeadline() {
    const items = [
      { sel: '.hero-headline .line-1', delay: 0.20 },
      { sel: '.hero-headline .line-2', delay: 0.35 },
      { sel: '.hero-headline .line-3', delay: 0.50 },
    ];
    items.forEach(({ sel, delay }) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.style.opacity   = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = `opacity 0.7s ${delay}s cubic-bezier(0.4,0,0.2,1), transform 0.7s ${delay}s cubic-bezier(0.4,0,0.2,1)`;
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    });
  }

  document.fonts?.ready
    ? document.fonts.ready.then(staggerHeadline)
    : window.addEventListener('load', staggerHeadline);

  /* ══════════════════════════════════════════════════════════════
     HERO BLOB PARALLAX
  ══════════════════════════════════════════════════════════════ */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        document.querySelectorAll('.canvas-blob').forEach((b, i) => {
          b.style.transform = `translateY(${y * (0.08 + i * 0.04)}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ══════════════════════════════════════════════════════════════
     ACTIVE NAV LINK
  ══════════════════════════════════════════════════════════════ */
  const navAnchors = document.querySelectorAll('.nav-links a');
  const activeObs  = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navAnchors.forEach(a => {
            a.style.color = '';
            a.style.background = '';
            if (a.getAttribute('href') === `#${entry.target.id}`) {
              a.style.color = 'var(--indigo)';
              a.style.background = 'rgba(82,140,227,0.08)';
            }
          });
        }
      });
    },
    { rootMargin: '-50% 0px -50% 0px' }
  );
  document.querySelectorAll('section[id], footer').forEach(s => activeObs.observe(s));

})();
