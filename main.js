/* ============================================================
   main.js  –  Three.js 3D Hero + All Portfolio Interactions
   ============================================================ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

/* ============================================================
   1.  THREE.JS – HERO PARTICLE NETWORK
   ============================================================ */
(function initThreeHero() {
  const canvas  = document.getElementById('hero-canvas');
  const section = document.querySelector('.hero');
  if (!canvas || !section) return;

  /* --- Renderer ------------------------------------------- */
  const isMobile = window.innerWidth < 768;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2));
  renderer.setClearColor(0x000000, 0);

  /* --- Scene & Camera ------------------------------------- */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.z = 28;

  /* --- Geometry: floating particles ----------------------- */
  const PARTICLE_COUNT = isMobile ? 600 : 1800;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors    = new Float32Array(PARTICLE_COUNT * 3);

  const colorA = new THREE.Color('#3b82f6'); // blue-500   (primary)
  const colorB = new THREE.Color('#8b5cf6'); // purple-500 (secondary)
  const colorC = new THREE.Color('#60a5fa'); // blue-400   (light accent)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3]     = (Math.random() - 0.5) * 80;
    positions[i3 + 1] = (Math.random() - 0.5) * 60;
    positions[i3 + 2] = (Math.random() - 0.5) * 40;

    const mix = Math.random();
    const c   = mix < 0.33 ? colorA : mix < 0.66 ? colorB : colorC;
    colors[i3]     = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

  const mat = new THREE.PointsMaterial({
    size:        0.18,
    vertexColors: true,
    transparent: true,
    opacity:     0.85,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* --- Geometry: connection lines  ----------------------- */
  const LINE_COUNT = isMobile ? 60 : 180;
  const linePositions = new Float32Array(LINE_COUNT * 6);
  const lineColors    = new Float32Array(LINE_COUNT * 6);

  for (let i = 0; i < LINE_COUNT; i++) {
    const i6 = i * 6;
    const p1 = Math.floor(Math.random() * PARTICLE_COUNT) * 3;
    const p2 = Math.floor(Math.random() * PARTICLE_COUNT) * 3;

    linePositions[i6]     = positions[p1];
    linePositions[i6 + 1] = positions[p1 + 1];
    linePositions[i6 + 2] = positions[p1 + 2];
    linePositions[i6 + 3] = positions[p2];
    linePositions[i6 + 4] = positions[p2 + 1];
    linePositions[i6 + 5] = positions[p2 + 2];

    // Blue-dominant lines with purple hint
    lineColors[i6]   = lineColors[i6+3] = 0.20;   // R
    lineColors[i6+1] = lineColors[i6+4] = 0.38;   // G  → cyan-blue
    lineColors[i6+2] = lineColors[i6+5] = 0.85;   // B
  }

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color',    new THREE.BufferAttribute(lineColors,    3));

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.18,
  });

  const lineSegs = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineSegs);

  /* --- Floating geometric ring --------------------------- */
  const torusGeo = new THREE.TorusGeometry(8, 0.08, 8, 120);
  const torusMat = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,   /* blue-500 */
    transparent: true,
    opacity: 0.13,
    wireframe: false,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.rotation.x = Math.PI / 4;
  scene.add(torus);

  const torus2Geo = new THREE.TorusGeometry(13, 0.05, 8, 120);
  const torus2Mat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,   /* purple-500 */
    transparent: true,
    opacity: 0.09,
  });
  const torus2 = new THREE.Mesh(torus2Geo, torus2Mat);
  torus2.rotation.x = -Math.PI / 6;
  torus2.rotation.y = Math.PI / 5;
  scene.add(torus2);

  /* --- Mouse parallax ------------------------------------- */
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* --- Resize -------------------------------------------- */
  function resize() {
    const w = section.clientWidth;
    const h = section.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* --- Animate ------------------------------------------- */
  let clock = new THREE.Clock();
  let isHeroVisible = true;
  let rafId;

  // Optimize: Pause render loop when hero is off-screen
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isHeroVisible = entry.isIntersecting;
      if (isHeroVisible) {
        clock.getDelta(); // reset delta so it doesn't jump
        animate();
      } else {
        cancelAnimationFrame(rafId);
      }
    });
  }, { threshold: 0 });
  observer.observe(section);

  function animate() {
    if (!isHeroVisible) return;
    rafId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Smooth mouse follow
    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;

    // Slow rotation + mouse parallax
    points.rotation.y = elapsed * 0.025 + targetX * 0.15;
    points.rotation.x =                   targetY * 0.1;

    lineSegs.rotation.y = elapsed * 0.02 + targetX * 0.12;
    lineSegs.rotation.x =                  targetY * 0.08;

    torus.rotation.z  = elapsed * 0.04;
    torus.rotation.y  = elapsed * 0.015 + targetX * 0.2;

    torus2.rotation.z = -elapsed * 0.025;
    torus2.rotation.x = elapsed * 0.01 + targetY * 0.15;

    // Breathing opacity
    mat.opacity = 0.7 + Math.sin(elapsed * 0.5) * 0.15;

    renderer.render(scene, camera);
  }
  animate();
})();


/* ============================================================
   2.  CURSOR GLOW
   ============================================================ */
(function initCursorGlow() {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
})();


/* ============================================================
   3.  NAVBAR – SCROLL EFFECT
   ============================================================ */
(function initNavbar() {
  const header = document.querySelector('header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
})();


/* ============================================================
   4.  SCROLL REVEAL
   ============================================================ */
(function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach((el) => observer.observe(el));
})();


/* ============================================================
   5.  STAT COUNTERS (number roll animation)
   ============================================================ */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const start    = performance.now();

        function update(now) {
          const elapsed  = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            // Trigger glow pulse when done
            el.classList.add('counted');
            setTimeout(() => el.classList.remove('counted'), 1000);
          }
        }

        requestAnimationFrame(update);
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
})();


/* ============================================================
   6.  3D CARD TILT (hover effect con brillo)
   ============================================================ */
(function initCardTilt() {
  /* Targets: skill groups, stats, interests, soft skills, manifesto cards */
  const cards = document.querySelectorAll('.skill-group, .stat-card, .interest-card, .soft-skill-card, .manifesto-card');
  if (!cards.length) return;

  const CONFIG = {
    maxTilt:   12,     // grados máximos de inclinación
    scale:     1.04,   // escala al hacer hover
    speed:     400,    // ms de transición al entrar/salir
    glareMax:  0.35,   // opacidad máxima del brillo
    perspective: 900,
  };

  cards.forEach((card) => {
    /* ---- Crear capa de brillo (glare) --------------------- */
    const glare = document.createElement('div');
    glare.className = 'tilt-glare';
    glare.innerHTML = '<div class="tilt-glare-inner"></div>';

    /* El card necesita position:relative para contener el glare */
    card.style.position = 'relative';
    card.style.overflow  = 'hidden';
    card.appendChild(glare);

    /* ---- State -------------------------------------------- */
    let rafId = null;
    let entering = false;

    /* ---- Helpers ------------------------------------------ */
    function getRect() { return card.getBoundingClientRect(); }

    function calcTilt(e) {
      const rect   = getRect();
      const x      = e.clientX - rect.left;  // px desde borde izq
      const y      = e.clientY - rect.top;   // px desde borde sup
      const cx     = rect.width  / 2;
      const cy     = rect.height / 2;
      const tiltX  = ((y - cy) / cy) * -CONFIG.maxTilt;  // eje X (arriba/abajo)
      const tiltY  = ((x - cx) / cx) *  CONFIG.maxTilt;  // eje Y (izq/der)
      // posición porcentual para el glare
      const glareX = (x / rect.width)  * 100;
      const glareY = (y / rect.height) * 100;
      return { tiltX, tiltY, glareX, glareY };
    }

    function applyTilt(tiltX, tiltY, glareX, glareY) {
      card.style.transform =
        `perspective(${CONFIG.perspective}px) ` +
        `rotateX(${tiltX}deg) rotateY(${tiltY}deg) ` +
        `scale3d(${CONFIG.scale}, ${CONFIG.scale}, ${CONFIG.scale})`;

      const inner = glare.querySelector('.tilt-glare-inner');
      if (inner) {
        inner.style.opacity    = CONFIG.glareMax * ((glareY + glareX) / 200);
        inner.style.background =
          `radial-gradient(circle at ${glareX}% ${glareY}%, ` +
          `rgba(255,255,255,0.15) 0%, ` +
          `rgba(59,130,246,0.14) 35%, ` +
          `rgba(139,92,246,0.10) 60%, ` +
          `transparent 75%)`;
      }
    }

    function resetTilt() {
      card.style.transition =
        `transform ${CONFIG.speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;
      card.style.transform  =
        `perspective(${CONFIG.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
      const inner = glare.querySelector('.tilt-glare-inner');
      if (inner) inner.style.opacity = '0';
    }

    /* ---- Event Listeners ---------------------------------- */
    card.addEventListener('mouseenter', (e) => {
      entering = true;
      card.style.transition =
        `transform ${CONFIG.speed / 2}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;
    });

    card.addEventListener('mousemove', (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const { tiltX, tiltY, glareX, glareY } = calcTilt(e);
        if (entering) {
          card.style.transition = 'transform 80ms ease';
          entering = false;
        }
        applyTilt(tiltX, tiltY, glareX, glareY);
      });
    });

    card.addEventListener('mouseleave', () => {
      if (rafId) cancelAnimationFrame(rafId);
      resetTilt();
    });

    /* Touch support (optional) */
    card.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const { tiltX, tiltY, glareX, glareY } = calcTilt(touch);
      applyTilt(tiltX, tiltY, glareX, glareY);
    }, { passive: true });

    card.addEventListener('touchend', resetTilt);
  });
})();


/* ============================================================
   8.  MAGNETIC BUTTONS
   ============================================================ */
(function initMagneticButtons() {
  const btns = document.querySelectorAll('.btn-primary, .btn-ghost');
  if (!btns.length) return;

  const STRENGTH = 0.35; // pull strength (0 = none, 1 = full)

  btns.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * STRENGTH;
      const dy   = (e.clientY - cy) * STRENGTH;
      btn.style.transition = 'transform 0.15s ease';
      btn.style.transform  = `translate(${dx}px, ${dy}px) scale(1.04)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)';
      btn.style.transform  = 'translate(0, 0) scale(1)';
    });
  });
})();


/* ============================================================
   9.  HERO PARAGRAPH STAGGERED FADE-IN
   ============================================================ */
(function initHeroParagraph() {
  const p = document.querySelector('.hero-content > p');
  if (!p) return;
  p.style.opacity   = '0';
  p.style.transform = 'translateY(24px)';
  p.style.transition = 'opacity 0.7s 0.8s ease, transform 0.7s 0.8s ease';
  // Trigger after paint
  requestAnimationFrame(() => requestAnimationFrame(() => {
    p.style.opacity   = '1';
    p.style.transform = 'translateY(0)';
  }));

  // Same for hero-actions
  const actions = document.querySelector('.hero-actions');
  if (actions) {
    actions.style.opacity    = '0';
    actions.style.transform  = 'translateY(24px)';
    actions.style.transition = 'opacity 0.7s 1s ease, transform 0.7s 1s ease';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      actions.style.opacity   = '1';
      actions.style.transform = 'translateY(0)';
    }));
  }
})();


/* ============================================================
   10. ACTIVE NAV LINK on scroll
   ============================================================ */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a[href^="#"]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove('active'));
          const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
          if (active) active.classList.add('active');
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((s) => observer.observe(s));
})();


/* ============================================================
   11. POKER DECK PROJECTS
   ============================================================ */
(function initPokerDeck() {
  const scene  = document.getElementById('poker-scene');
  const hand   = document.getElementById('poker-hand');
  const cards  = document.querySelectorAll('.poker-card');
  const detail = document.getElementById('poker-detail');

  if (!scene || !hand || !cards.length || !detail) return;

  // Helper to fetch translation
  function t(key) {
    const lang = window.currentLang || 'es';
    if (window.translations && window.translations[lang]) {
      return window.translations[lang][key] || key;
    }
    return key;
  }

  // Project Database
  const projects = [
    {
      icon: '🛒',
      get title() { return t('proj_0_title'); },
      get desc() { return t('proj_0_desc'); },
      tags: ['JavaScript ES6+', 'HTML5', 'CSS3', 'Lógica de Negocio'],
      link: 'https://github.com/alejandro-xoxo/Proyecto_E-commerce_AcevedoMiguel'
    },
    {
      icon: '⚡',
      get title() { return t('proj_1_title'); },
      get desc() { return t('proj_1_desc'); },
      tags: ['Problem Solving', 'Trabajo en Equipo', 'AI Agents', 'Agile / Entrega Rápida'],
      link: 'https://github.com/alejandro-xoxo/HachatonCampuslans2026'
    },
    {
      icon: '<img src="src/icons/tux.png" alt="Linux" class="custom-icon">',
      get title() { return t('proj_2_title'); },
      get desc() { return t('proj_2_desc'); },
      tags: ['Linux', 'Bash Scripting', 'Hyprland', 'Sysadmin'],
      link: 'https://github.com/alejandro-xoxo/Miarch'
    },
    {
      icon: '🚀',
      get title() { return t('proj_3_title'); },
      get desc() { return t('proj_3_desc'); },
      tags: ['HTML5 Semántico', 'CSS3 Avanzado', 'Responsive Design', 'UI / Frontend'],
      link: 'https://github.com/alejandro-xoxo/space-travel-ui'
    }
  ];

  let activeIndex = -1;

  // Render detail panel
  function showDetail(index) {
    const p = projects[index];
    if (!p) return;

    detail.innerHTML = `
      <div class="poker-detail-card">
        <button class="detail-close" aria-label="Cerrar detalle" data-i18n="proj_btn_back">${t('proj_btn_back')}</button>
        <div class="detail-header">
          <div class="detail-icon" aria-hidden="true">${p.icon}</div>
          <h3 class="detail-title">${p.title}</h3>
        </div>
        <p class="detail-desc">${p.desc}</p>
        <div class="detail-tags">
          ${p.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="detail-footer">
          <a href="${p.link}" target="_blank" rel="noopener" class="detail-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
            <span data-i18n="proj_btn_code">${t('proj_btn_code')}</span>
          </a>
        </div>
      </div>
    `;

    // Close button logic
    const closeBtn = detail.querySelector('.detail-close');
    closeBtn.addEventListener('click', closeCard);
  }

  // Calculate fan transforms
  function updateFan() {
    const isMobile = window.innerWidth <= 700;
    const total = cards.length;
    
    cards.forEach((card, i) => {
      if (card.classList.contains('active')) {
        // Active card pulls up and pops forward in 3D space
        card.style.transform = isMobile 
          ? 'rotate(0deg) translateX(0) translateY(0) translateZ(150px) scale(1.15)'
          : 'rotate(0deg) translateX(0) translateY(0) translateZ(200px) scale(1.2)';
        card.style.zIndex = '100';
      } else {
        // Normal fan position
        const centerOffset = i - (total - 1) / 2;
        
        // Spread parameters
        const rotateStep = isMobile ? 12 : 16;
        const xStep      = isMobile ? 45 : 70;
        const yDrop      = isMobile ? 8  : 14;

        const rotate = centerOffset * rotateStep;
        const tx     = centerOffset * xStep;
        const ty     = Math.abs(centerOffset) * yDrop;
        const scale  = 1;

        card.style.transform = `rotate(${rotate}deg) translateX(${tx}px) translateY(${ty}px) scale(${scale})`;
        
        // Side cards go behind inner cards slightly
        card.style.zIndex = 10 - Math.abs(centerOffset);
      }
    });
  }

  // Reset to initial fan state
  function closeCard() {
    activeIndex = -1;
    cards.forEach(c => {
      c.classList.remove('active', 'flipped');
    });
    detail.setAttribute('aria-hidden', 'true');
    detail.innerHTML = `
      <p class="poker-hint" data-i18n="projects_hint">
        ${t('projects_hint')}
      </p>
    `;
    updateFan();
  }

  // Handle click on card
  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      if (activeIndex === i) {
        // Double click: close
        closeCard();
        return;
      }

      // Close previous
      cards.forEach(c => c.classList.remove('active', 'flipped'));
      
      // Open new
      activeIndex = i;
      card.classList.add('active');
      
      // 1. Move card to center (updateFan)
      updateFan();
      
      // 2. Wait for move, then flip and show detail
      setTimeout(() => {
        if (activeIndex === i) {
          card.classList.add('flipped');
          showDetail(i);
        }
      }, 450);
    });

    // Keyboard support (Enter to click)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      } else if (e.key === 'ArrowRight') {
        const next = cards[i + 1] || cards[0];
        next.focus();
      } else if (e.key === 'ArrowLeft') {
        const prev = cards[i - 1] || cards[cards.length - 1];
        prev.focus();
      }
    });
  });

  // Handle window resize to recalculate fan
  window.addEventListener('resize', () => {
    if (activeIndex === -1) updateFan();
  });

  // Reveal animation for the hand
  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        cards.forEach((card, i) => {
          card.style.animation = `deal-in 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.15}s both`;
        });
        updateFan();
        sceneObserver.unobserve(scene);
      }
    });
  }, { threshold: 0.2 });

  sceneObserver.observe(scene);

  // Listener for dynamic language switch while a card is open
  document.addEventListener('languageChanged', () => {
    // Re-render open card details with new language
    if (activeIndex !== -1) {
      showDetail(activeIndex);
    }
  });
})();

