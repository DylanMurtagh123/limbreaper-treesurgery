  // Homepage-only cinematic intro, shown once per browser session.
  (function(){
    const root = document.documentElement;
    const intro = document.querySelector('.home-intro');
    if (!intro || !root.classList.contains('home-intro-pending')) {
      if (intro) intro.remove();
      return;
    }

    try { sessionStorage.setItem('limbReaperHomeIntroSeen', '1'); } catch (error) {}

    const image = intro.querySelector('.home-intro-image');
    const sawdust = intro.querySelector('.home-intro-sawdust');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let started = false;
    let finished = false;

    if (sawdust && !reducedMotion) {
      for (let index = 0; index < 24; index += 1) {
        const particle = document.createElement('i');
        const spread = ((index * 37) % 101);
        const direction = index % 2 === 0 ? -1 : 1;
        particle.style.setProperty('--dust-x', spread + '%');
        particle.style.setProperty('--dust-y', (((index * 11) % 13) - 6) + 'px');
        particle.style.setProperty('--dust-size', (2 + (index % 4)) + 'px');
        particle.style.setProperty('--dust-delay', ((index % 6) * 0.025) + 's');
        particle.style.setProperty('--dust-drift', (direction * (12 + ((index * 7) % 34))) + 'px');
        particle.style.setProperty('--dust-fall', (30 + ((index * 13) % 75)) + 'px');
        sawdust.appendChild(particle);
      }
    }

    function finish(){
      if (finished) return;
      finished = true;
      root.classList.add('home-intro-leaving');
      window.setTimeout(function(){
        root.classList.remove('home-intro-pending', 'home-intro-leaving');
        intro.remove();
      }, reducedMotion ? 100 : 1180);
    }

    function start(){
      if (started) return;
      started = true;
      window.setTimeout(finish, reducedMotion ? 180 : 2200);
    }

    if (image && image.complete) start();
    else if (image) {
      image.addEventListener('load', start, { once:true });
      image.addEventListener('error', finish, { once:true });
    } else finish();

    // Never allow a failed or unusually slow image request to trap the page.
    window.setTimeout(finish, 5000);
  })();

  // header scroll state
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // mobile menu
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');
  function openMenu(){ mobileMenu.classList.add('open'); menuToggle.setAttribute('aria-expanded','true'); }
  function closeMenu(){ mobileMenu.classList.remove('open'); menuToggle.setAttribute('aria-expanded','false'); }
  menuToggle.addEventListener('click', openMenu);
  mobileClose.addEventListener('click', closeMenu);
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));

  // Submit either contact form to the PHP endpoint without leaving the page.
  (function(){
    const forms = document.querySelectorAll('form[action="contact-handler.php"]');
    forms.forEach(function(form){
      form.addEventListener('submit', async function(e){
      e.preventDefault();
      if (!form.checkValidity()){
        form.reportValidity();
        return;
      }
      const button = form.querySelector('[type="submit"]');
      const status = form.querySelector('[data-form-status]');
      const originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = 'Sending…';
      status.textContent = 'Sending your enquiry…';
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.message || 'Unable to send');
        form.reset();
        status.textContent = 'Thanks — your message has been sent. Ryan will be in touch shortly.';
        const card = document.getElementById('contactCard');
        const success = document.getElementById('formSuccess');
        if (card && success) {
          card.classList.add('submitted');
          success.classList.add('show');
        }
      } catch (error) {
        status.textContent = 'Sorry, your message could not be sent. Please call 07500 002582 or email limreaper.ryan@gmail.com.';
      } finally {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    });
    });
  })();

  // interactive spherical recent-jobs gallery
  (function(){
    const stage = document.getElementById('jobSphere');
    if (!stage) return;

    const items = Array.from(stage.querySelectorAll('.job-sphere-item'));
    const lightbox = document.getElementById('jobLightbox');
    const lightboxImage = lightbox && lightbox.querySelector('img');
    const lightboxCaption = lightbox && lightbox.querySelector('figcaption');
    const lightboxClose = lightbox && lightbox.querySelector('.job-lightbox-close');
    const holoTree = stage.querySelector('.job-holo-tree');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const points = items.map(function(_, index){
      const y = 1 - (index / Math.max(items.length - 1, 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * index;
      return { x:Math.cos(theta) * radius, y:y, z:Math.sin(theta) * radius };
    });

    let rotationX = -0.12;
    let rotationY = 0.35;
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let previousX = 0;
    let previousY = 0;
    let visible = true;
    let lastTime = 0;
    let lastTrigger = null;
    let pressedItem = null;

    function draw(){
      if (holoTree) {
        const treeShiftX = reducedMotion ? 0 : -Math.sin(rotationY) * 10;
        const treeShiftY = reducedMotion ? 0 : Math.sin(rotationX) * 7;
        const treeTilt = reducedMotion ? 0 : -Math.sin(rotationY) * 1.5;

        holoTree.style.setProperty('--tree-shift-x', `${treeShiftX.toFixed(2)}px`);
        holoTree.style.setProperty('--tree-shift-y', `${treeShiftY.toFixed(2)}px`);
        holoTree.style.setProperty('--tree-tilt', `${treeTilt.toFixed(2)}deg`);
      }

      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const sphereRadius = Math.min(width * 0.37, height * 0.39);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);

      points.forEach(function(point, index){
        const x1 = point.x * cosY + point.z * sinY;
        const z1 = -point.x * sinY + point.z * cosY;
        const y2 = point.y * cosX - z1 * sinX;
        const z2 = point.y * sinX + z1 * cosX;
        const depth = (z2 + 1) / 2;
        const scale = 0.58 + depth * 0.54;
        const opacity = 0.28 + depth * 0.72;
        const x = x1 * sphereRadius;
        const y = y2 * sphereRadius;
        const item = items[index];

        item.style.transform = 'translate(-50%, -50%) translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) scale(' + scale.toFixed(3) + ')';
        item.style.opacity = opacity.toFixed(3);
        item.style.zIndex = String(Math.round(depth * 100) + 2);
      });
    }

    function animate(time){
      const elapsed = Math.min(time - lastTime, 40);
      lastTime = time;
      if (visible && !dragging && !reducedMotion && !stage.matches(':hover') && !stage.matches(':focus-within')) {
        rotationY += elapsed * 0.000075;
      }
      draw();
      window.requestAnimationFrame(animate);
    }

    stage.addEventListener('pointerdown', function(event){
      if (event.target.closest('.job-lightbox')) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      dragging = true;
      moved = false;
      pressedItem = event.target.closest('.job-sphere-item');
      startX = previousX = event.clientX;
      startY = previousY = event.clientY;
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointermove', function(event){
      if (!dragging) return;
      const dx = event.clientX - previousX;
      const dy = event.clientY - previousY;
      if (Math.abs(event.clientX - startX) + Math.abs(event.clientY - startY) > 7) moved = true;
      rotationY += dx * 0.006;
      rotationX = Math.max(-1.05, Math.min(1.05, rotationX - dy * 0.0045));
      previousX = event.clientX;
      previousY = event.clientY;
      draw();
    });
    function endDrag(event, cancelled){
      if (!dragging) return;
      dragging = false;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      if (!cancelled && !moved && pressedItem) openImage(pressedItem, false);
      pressedItem = null;
      moved = false;
    }
    stage.addEventListener('pointerup', function(event){ endDrag(event, false); });
    stage.addEventListener('pointercancel', function(event){ endDrag(event, true); });

    stage.addEventListener('keydown', function(event){
      if (lightbox && !lightbox.hidden) return;
      const amount = 0.16;
      if (event.key === 'ArrowLeft') rotationY -= amount;
      else if (event.key === 'ArrowRight') rotationY += amount;
      else if (event.key === 'ArrowUp') rotationX = Math.min(1.05, rotationX + amount);
      else if (event.key === 'ArrowDown') rotationX = Math.max(-1.05, rotationX - amount);
      else return;
      event.preventDefault();
      draw();
    });

    function openImage(item, restoreFocus){
      if (!lightbox || !lightboxImage || !lightboxCaption) return;
      const source = item.querySelector('img');
      lightboxImage.src = source.currentSrc || source.src;
      lightboxImage.alt = source.alt;
      lightboxCaption.textContent = item.dataset.caption || source.alt;
      lastTrigger = restoreFocus ? item : null;
      lightbox.hidden = false;
      if (lightboxClose) lightboxClose.focus();
    }
    items.forEach(function(item){
      item.addEventListener('click', function(event){
        if (event.detail !== 0) return;
        openImage(item, true);
      });
    });
    function closeImage(){
      if (!lightbox) return;
      lightbox.hidden = true;
      lightboxImage.removeAttribute('src');
      if (lastTrigger) lastTrigger.focus();
    }
    if (lightboxClose) lightboxClose.addEventListener('click', closeImage);
    if (lightbox) lightbox.addEventListener('click', function(event){ if (event.target === lightbox) closeImage(); });
    document.addEventListener('keydown', function(event){
      if (event.key === 'Escape' && lightbox && !lightbox.hidden) closeImage();
    });

    if ('IntersectionObserver' in window) {
      const sphereObserver = new IntersectionObserver(function(entries){
        visible = entries[0].isIntersecting;
      }, { threshold:0.08 });
      sphereObserver.observe(stage);
    }
    window.addEventListener('resize', draw, { passive:true });
    draw();
    window.requestAnimationFrame(animate);
  })();

  // reviews carousel
  (function(){
    const grid = document.getElementById('tGrid');
    const prevBtn = document.getElementById('tPrev');
    const nextBtn = document.getElementById('tNext');
    if (!grid || !prevBtn || !nextBtn) return;

    function step(){
      const card = grid.querySelector('.t-card');
      if (!card) return grid.clientWidth * 0.8;
      const gap = parseFloat(getComputedStyle(grid).columnGap || getComputedStyle(grid).gap) || 18;
      return card.getBoundingClientRect().width + gap;
    }
    function updateArrows(){
      const max = grid.scrollWidth - grid.clientWidth - 2;
      prevBtn.disabled = grid.scrollLeft <= 2;
      nextBtn.disabled = grid.scrollLeft >= max;
    }
    prevBtn.addEventListener('click', () => grid.scrollBy({ left: -step(), behavior: 'smooth' }));
    nextBtn.addEventListener('click', () => grid.scrollBy({ left: step(), behavior: 'smooth' }));
    grid.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    updateArrows();
  })();
