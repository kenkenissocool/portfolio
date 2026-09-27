/* Static content stays usable if scripting, canvas or clipboard is unavailable. */
(() => {
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.star-field');
  const context = canvas.getContext('2d');
  const motionButton = document.querySelector('.motion-toggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  let paused = reducedMotion.matches;
  let visible = true;
  let frame = 0;
  let width = 0;
  let height = 0;
  let particles = [];
  const pointer = { x: 0, y: 0, strength: 0, px: 0, py: 0 };
  const target = { x: 0, y: 0, strength: 0, px: 0, py: 0 };

  function fourPointStar(x, y, radius) {
    const rx = radius * .94;
    const ry = radius * 1.08;
    context.moveTo(x, y - ry);
    context.bezierCurveTo(x + rx * .035, y - ry * .15, x + rx * .15, y - ry * .035, x + rx, y);
    context.bezierCurveTo(x + rx * .15, y + ry * .035, x + rx * .035, y + ry * .15, x, y + ry);
    context.bezierCurveTo(x - rx * .035, y + ry * .15, x - rx * .15, y + ry * .035, x - rx, y);
    context.bezierCurveTo(x - rx * .15, y - ry * .035, x - rx * .035, y - ry * .15, x, y - ry);
    context.closePath();
  }

  function draw() {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#151916';
    context.beginPath();
    for (const p of particles) {
      let x = p.x + pointer.x * 4;
      let y = p.y + pointer.y * 3;
      const dx = x - pointer.px;
      const dy = y - pointer.py;
      const distance = Math.hypot(dx, dy);
      const influence = Math.max(0, 1 - distance / 130) * pointer.strength;
      // Only a small local displacement: the aligned matrix remains legible.
      if (distance > 0) {
        x += dx / distance * influence * 5;
        y += dy / distance * influence * 5;
      }
      fourPointStar(x, y, p.radius * (1 + influence * .16));
    }
    context.fill();
    hero.style.setProperty('--metal-x', `${pointer.x * -11}px`);
    hero.style.setProperty('--metal-y', `${pointer.y * -7}px`);
    hero.style.setProperty('--metal-r', `${pointer.x * .35}deg`);
  }

  function resize() {
    if (!context) return;
    width = hero.clientWidth;
    height = hero.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const mobile = width <= 600;
    const cx = width * (mobile ? .31 : .34);
    const cy = height * (mobile ? .395 : .45);
    const rx = width * (mobile ? .57 : .34);
    const ry = height * (mobile ? .285 : .47);
    const step = mobile ? 8 : Math.max(10, Math.min(15, width / 115));
    particles = [];
    for (let row = -Math.ceil(ry / step); row <= Math.ceil(ry / step); row++) {
      for (let col = -Math.ceil(rx / step); col <= Math.ceil(rx / step); col++) {
        const x = col * step;
        const y = row * step;
        const envelope = Math.pow(Math.abs(x / rx), .55) + Math.pow(Math.abs(y / ry), .55);
        if (envelope > 1.12) continue;
        const inside = Math.max(0, Math.min(1, (1 - envelope) / .22));
        const halo = Math.max(0, (1.12 - envelope) / 1.12) * .018;
        const radius = step * (.44 * Math.pow(inside, .45) + halo);
        if (radius > .25) particles.push({ x: cx + x, y: cy + y, radius });
      }
    }
    draw();
    hero.dataset.canvasReady = '';
  }

  function animate() {
    frame = 0;
    if (paused || !visible || document.hidden) return;
    let moving = false;
    for (const key of ['x', 'y', 'strength', 'px', 'py']) {
      const delta = target[key] - pointer[key];
      if (Math.abs(delta) > .002) { pointer[key] += delta * .09; moving = true; }
      else pointer[key] = target[key];
    }
    draw();
    if (moving) frame = requestAnimationFrame(animate);
  }

  function wake() {
    if (!paused && visible && !document.hidden && !frame) frame = requestAnimationFrame(animate);
  }

  function updateMotion() {
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'アニメーションを再開' : 'アニメーションを停止');
    motionButton.querySelector('.motion-label').textContent = paused ? 'Motion off' : 'Motion on';
    if (paused) {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const key of Object.keys(pointer)) pointer[key] = target[key] = 0;
      draw();
    } else wake();
  }

  if (context) {
    resize();
    new ResizeObserver(resize).observe(hero);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else { cancelAnimationFrame(frame); frame = 0; }
    }, { threshold: 0 }).observe(hero);
    hero.addEventListener('pointermove', event => {
      if (paused || !finePointer.matches || event.pointerType === 'touch') return;
      const bounds = hero.getBoundingClientRect();
      target.px = event.clientX - bounds.left;
      target.py = event.clientY - bounds.top;
      target.x = (target.px / width - .5) * 2;
      target.y = (target.py / height - .5) * 2;
      target.strength = 1;
      wake();
    });
    hero.addEventListener('pointerleave', () => {
      target.x = target.y = target.strength = 0;
      wake();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else wake();
    });
    motionButton.hidden = false;
    motionButton.addEventListener('click', () => { paused = !paused; updateMotion(); });
    reducedMotion.addEventListener('change', event => { paused = event.matches; updateMotion(); });
    updateMotion();
  }

  const projects = {
    mirrored: { title: 'Mirrored Human', category: 'PROTOTYPE / EMG × EMS', description: '筋電位（EMG）から筋肉の活動を読み取り、筋電気刺激（EMS）を使って別の身体へ動作を伝えることを目指した試作。センサと刺激パッドを装着し、位置やタイミングによる動作の違いを探索しました。' },
    blueing: { title: 'JFA blue-ing! / Dream Theater', category: 'COLLABORATION / GENERATIVE VIDEO', description: 'デジタルネイチャー研究室とJFAの共同研究。巨大な湾曲スクリーン「Dream Theater」の映像制作に参加し、日本代表ユニフォームのLoRAモデル学習と、Stable Diffusion Vid2Vidによる映像生成を担当しました。' },
    mingei: { title: '計算機自然と民藝', category: 'EXHIBITION / FABRICATION', description: '2022年10月、日本科学未来館でのラボ展。金具や接着剤を構造に使わない木組みの火棚の設営と、CMAを用いたプロジェクト展示のセットアップ・展示説明に携わりました。' },
    ueta: { title: '植田建設工業', category: 'ARCHIVE / CODING', description: 'コーポレートサイト、全6ページのコーディング。大学時代のWeb制作から。' },
    piano: { title: '日本ピアノアワード', category: 'ARCHIVE / DESIGN', description: '日本ピアノアワードのランディングページデザイン。大学時代の制作から。' },
    benri: { title: '便利屋さん', category: 'ARCHIVE / DESIGN', description: '便利屋さんのランディングページデザイン。大学時代の制作から。' }
  };
  const dialog = document.querySelector('.project-dialog');
  if (typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-project]').forEach(link => {
      link.addEventListener('click', event => {
        // Preserve open-in-new-tab, downloads and the no-JS image fallback.
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        const project = projects[link.dataset.project];
        if (!project) return;
        event.preventDefault();
        document.getElementById('dialog-title').textContent = project.title;
        document.getElementById('dialog-category').textContent = project.category;
        document.getElementById('dialog-description').textContent = project.description;
        const image = document.getElementById('dialog-image');
        image.src = link.getAttribute('href');
        image.alt = link.querySelector('img').alt;
        dialog.classList.toggle('photo-dialog', link.classList.contains('practice-image'));
        dialog.showModal();
        dialog.scrollTop = 0;
        document.body.classList.add('modal-open');
      });
    });
    document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  }

  const copyButton = document.querySelector('.copy-email');
  if (navigator.clipboard && window.isSecureContext) {
    copyButton.hidden = false;
    let resetTimer;
    copyButton.addEventListener('click', async () => {
      const status = document.querySelector('.copy-status');
      try {
        await navigator.clipboard.writeText('kenkenissocool@gmail.com');
        copyButton.textContent = 'Copied ✓';
        status.textContent = 'メールアドレスをコピーしました。';
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { copyButton.textContent = 'Copy email ↗'; }, 2500);
      } catch {
        status.textContent = 'コピーできませんでした。上のメールアドレスを選択してコピーしてください。';
        status.classList.remove('sr-only');
      }
    });
  }
  document.getElementById('year').textContent = new Date().getFullYear();
})();
