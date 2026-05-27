/* ────────────────────────────────────────────
   A·Sc · Line Draw (scroll-synced SVG stroke)
   - 図形ライブラリ SHAPES を切り替えられるギャラリー型
   - 各 .ld-path を全長測定し dashoffset を full→0
   - 進捗 = セクションをどれだけスクロールしたか（位置ベース）
   - 並び順に進捗区間を割り当てて順番に描画
   - ピッカーは SHAPES のキーから自動生成
   - prefers-reduced-motion なら描画済みで静止
   viewBox 基準は 0 0 800 600。
   ──────────────────────────────────────────── */

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ── SVG フラグメント生成ヘルパー ── */
  const path = (d, accent) => `<path class="ld-path${accent ? ' ld-accent' : ''}" d="${d}"/>`;
  const circle = (cx, cy, r, accent) =>
    `<circle class="ld-path${accent ? ' ld-accent' : ''}" cx="${cx}" cy="${cy}" r="${r}"/>`;

  // 正多角形（rot=-90°で頂点を上に）
  const polygon = (cx, cy, r, sides, rot = -Math.PI / 2) => {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = rot + (i * 2 * Math.PI) / sides;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return `M${pts.join(' L')} Z`;
  };

  // アルキメデスのらせん
  const spiral = (cx, cy, turns, spacing, step = 0.18) => {
    const max = turns * 2 * Math.PI;
    let d = '';
    for (let t = 0; t <= max; t += step) {
      const r = spacing * t;
      const x = (cx + r * Math.cos(t)).toFixed(1);
      const y = (cy + r * Math.sin(t)).toFixed(1);
      d += `${d ? 'L' : 'M'}${x} ${y} `;
    }
    return d.trim();
  };

  // 星（n 角星：外接 R と内接 r を交互に）
  const star = (cx, cy, R, r, points = 5, rot = -Math.PI / 2) => {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const rad = i % 2 === 0 ? R : r;
      const a = rot + (i * Math.PI) / points;
      pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
    }
    return `M${pts.join(' L')} Z`;
  };

  /* ── 図形ライブラリ（キーがピッカーのラベルになる） ── */
  const SHAPES = {
    'エンブレム':
      circle(400, 300, 230) +
      path('M400 60 L640 300 L400 540 L160 300 Z') +
      path('M100 300 L700 300') +
      path('M400 40 L400 560') +
      circle(400, 300, 96, true),

    'スター':
      path(star(230, 210, 130, 52, 5)) +
      path(star(560, 170, 95, 38, 5)) +
      path(star(410, 415, 160, 64, 5)) +
      path(star(155, 445, 62, 25, 5)) +
      path(star(650, 440, 78, 31, 5), true),

    'キューブ':
      path('M280 240 L540 240 L540 500 L280 500 Z') +
      path('M190 150 L450 150 L450 410 L190 410 Z') +
      path('M280 240 L190 150 M540 240 L450 150 M540 500 L450 410 M280 500 L190 410'),

    'スパイラル':
      path(spiral(400, 300, 3.5, 11)),

    '同心円':
      circle(400, 300, 80) +
      circle(400, 300, 145) +
      circle(400, 300, 210) +
      circle(400, 300, 255, true),

    '六角':
      path(polygon(275, 235, 135, 6)) +
      path(polygon(545, 215, 105, 6)) +
      path(polygon(415, 430, 125, 6)) +
      path(polygon(645, 430, 70, 6), true),

    '三角':
      path(polygon(255, 235, 150, 3)) +
      path(polygon(560, 215, 120, 3, Math.PI / 2)) +
      path(polygon(420, 435, 165, 3)) +
      path(polygon(650, 445, 80, 3, Math.PI / 6), true),
  };

  const init = (root) => {
    const svg = root.querySelector('.ld-svg');
    // ピッカーは root の外（intro など上部）に置いても拾えるよう document も探す
    const picker = root.querySelector('[data-ld-picker]') || document.querySelector('[data-ld-picker]');
    const pctEl = root.querySelector('[data-ld-pct]');
    if (!svg) return;

    let paths = [];
    let n = 0;
    let ticking = false;
    let inView = true;

    const measure = () => {
      paths = [...svg.querySelectorAll('.ld-path')];
      n = paths.length;
      paths.forEach((p) => {
        const len = p.getTotalLength();
        p._len = len;
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = reduce ? '0' : `${len}`;
      });
    };

    const update = () => {
      ticking = false;
      if (!inView || reduce) return;
      const rect = root.getBoundingClientRect();
      const scrollable = root.offsetHeight - window.innerHeight;
      const progress = clamp(-rect.top / Math.max(1, scrollable), 0, 1);
      paths.forEach((p, i) => {
        const local = clamp(progress * n - i, 0, 1);
        p.style.strokeDashoffset = `${p._len * (1 - local)}`;
      });
      root.style.setProperty('--ld-progress', `${(progress * 100).toFixed(1)}%`);
      if (pctEl) pctEl.textContent = `${Math.round(progress * 100)}%`;
    };

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };

    const setShape = (name) => {
      svg.innerHTML = SHAPES[name];   // svg.innerHTML は SVG 名前空間でパースされる
      measure();
      update();
      if (picker) {
        [...picker.children].forEach((b) =>
          b.setAttribute('aria-pressed', b.dataset.shape === name ? 'true' : 'false'));
      }
    };

    // ピッカー生成
    const names = Object.keys(SHAPES);
    if (picker) {
      names.forEach((name) => {
        const b = document.createElement('button');
        b.className = 'ld-chip';
        b.type = 'button';
        b.textContent = name;
        b.dataset.shape = name;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => setShape(name));
        picker.appendChild(b);
      });
    }

    // 視野外では更新停止
    const io = new IntersectionObserver(
      (entries) => { inView = entries[0].isIntersecting; if (inView) onScroll(); },
      { rootMargin: '0px' }
    );
    io.observe(root);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // 初期図形
    setShape(names[0]);
  };

  document.querySelectorAll('[data-line-draw]').forEach(init);
})();
