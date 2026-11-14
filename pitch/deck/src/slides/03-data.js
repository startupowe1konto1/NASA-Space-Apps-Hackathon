// Slide 3: the data. Five translucent sheets in the parcel's shape fall onto the field, a numbered table with leader
// lines names them, the facts row counts up. Everything runs on elapsed time (spec section 9).

// Table rows. `ids` are dataset ids that must be in datasetsUsedForThisField.ids; if one is not, mount throws so a stale
// table cannot ship. The parcel outline has no dataset id (it is `field.source`), so that row is checked by `source`.
const LAYERS = [
  { layer: (c) => `Weather, ${c.firstYear}–${c.lastYear}`, source: 'NASA POWER', ids: ['nasa-power-monthly'] },
  // Root-zone soil wetness (GWETROOT) is one of the POWER monthly parameters.
  { layer: () => 'Root-zone soil wetness', source: 'NASA POWER', ids: ['nasa-power-monthly'] },
  { layer: () => 'Slope', source: 'NASADEM', ids: ['nasadem'] },
  { layer: () => 'Soil', source: 'SoilGrids', ids: ['isric-soilgrids'] },
  { layer: () => 'Parcel boundary', source: 'GUGiK land register', parcelSource: /GUGiK/i },
];

const SHEET_FALL_S = 0.9, SHEET_GAP_S = 0.22, COUNT_S = 0.8, START_Y = 1.0;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);

const CSS = `
.slide[data-slide="3"] .layers .row { grid-template-columns: 38px 1fr auto; }
.slide[data-slide="3"] .facts span { padding: 0 20px; }
.slide[data-slide="3"] .facts span:first-child { padding-left: 0; }
.slide[data-slide="3"] .facts small { white-space: normal; max-width: 170px; min-height: 2.6em; line-height: 1.3; }
.slide[data-slide="3"] .facts b { font-weight: 600; font-size: 40px; letter-spacing: -0.02em; line-height: 1; }
.slide[data-slide="3"] .facts b em { font-style: normal; font-weight: 400; font-size: 22px; color: var(--muted); letter-spacing: 0; margin-left: 6px; }
.slide[data-slide="3"] svg.leaders { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0; transition: opacity .5s ease .2s; }
`;

function checkIds(data) {
  const used = data.datasetsUsedForThisField?.ids;
  if (!Array.isArray(used)) throw new Error('Slide 3: datasetsUsedForThisField.ids is missing from field.json');
  for (const row of LAYERS) {
    for (const id of row.ids ?? []) {
      if (!used.includes(id)) throw new Error(`Slide 3: table row "${row.source}" needs dataset "${id}", which is not in datasetsUsedForThisField.ids`);
    }
    if (row.parcelSource && !row.parcelSource.test(data.field?.source ?? '')) {
      throw new Error(`Slide 3: parcel boundary row needs field.source to name GUGiK, got "${data.field?.source}"`);
    }
  }
  // NASA count: the used ids joined with datasets.list, provider flag `nasa`.
  const byId = new Map(data.datasets.list.map((d) => [d.id, d]));
  let nasa = 0;
  for (const id of used) {
    const d = byId.get(id);
    if (!d) throw new Error(`Slide 3: dataset "${id}" is in datasetsUsedForThisField.ids but not in datasets.list`);
    if (d.nasa) nasa++;
  }
  if (used.length !== data.datasetsUsedForThisField.total || nasa !== data.datasetsUsedForThisField.nasa) {
    throw new Error(`Slide 3: derived counts (${used.length} datasets, ${nasa} NASA) disagree with datasetsUsedForThisField (${data.datasetsUsedForThisField.total}, ${data.datasetsUsedForThisField.nasa})`);
  }
  return { total: used.length, nasa };
}

export default {
  steps: 3,
  mount(ctx) {
    const { data, scene } = ctx;
    const clim = data.climate;
    const counts = checkIds(data);
    const facts = [
      { label: 'Datasets for this field', value: counts.total, unit: '' },
      { label: 'From NASA', value: counts.nasa, unit: '' },
      { label: 'Weather record', value: clim.years, unit: 'years' },
    ];

    if (!document.getElementById('slide3-css')) {
      const s = document.createElement('style'); s.id = 'slide3-css'; s.textContent = CSS; document.head.append(s);
    }
    ctx.el.innerHTML = `
      <div class="copy">
        <div class="eyebrow">The data</div>
        <div class="title">Five layers already describe this field.</div>
        <div class="lede">Open data, read for this exact place.</div>
        <div class="facts" data-from="3">${facts.map((f) => `<span><small>${f.label}</small><b></b></span>`).join('')}</div>
      </div>
      <svg class="leaders" viewBox="0 0 1920 1080" aria-hidden="true"></svg>
      <div class="panel layers" data-from="2">
        <div class="row head" style="grid-template-columns:38px 1fr auto"><span>#</span><span>Layer</span><span>Source</span></div>
        ${LAYERS.map((r, i) => `<div class="row"><span class="n">${String(i + 1).padStart(2, '0')}</span><span>${r.layer(clim)}</span><span class="src">${r.source}</span></div>`).join('')}
      </div>`;

    const leaders = ctx.el.querySelector('svg.leaders');
    const panel = ctx.el.querySelector('.layers');
    const rows = [...panel.querySelectorAll('.row:not(.head)')];
    const factEls = [...ctx.el.querySelectorAll('.facts b')];
    const setFacts = (p) => factEls.forEach((b, i) => {
      b.textContent = String(Math.round(facts[i].value * p));
      if (facts[i].unit) b.insertAdjacentHTML('beforeend', `<em>${facts[i].unit}</em>`);
    });
    setFacts(0);

    // State, all on elapsed time. fallAt / countAt are performance.now() stamps (-1e9 = long finished).
    const st = this.st = { step: 0, fallAt: null, countAt: null, raf: 0 };
    const countLoop = () => {
      st.raf = 0;
      if (st.countAt === null) return;
      const p = clamp01((performance.now() - st.countAt) / (COUNT_S * 1000));
      setFacts(easeOut(p));
      if (p < 1) st.raf = requestAnimationFrame(countLoop);
    };
    st.startCount = (instant) => {
      if (instant) { st.countAt = -1e9; cancelAnimationFrame(st.raf); st.raf = 0; setFacts(1); return; }
      if (st.countAt !== null) return;            // idempotent: already counting or done
      st.countAt = performance.now();
      st.raf = requestAnimationFrame(countLoop);
    };
    st.resetCount = () => { st.countAt = null; cancelAnimationFrame(st.raf); st.raf = 0; setFacts(0); };

    if (!scene.available) { leaders.style.display = 'none'; return; }

    // Sheets: the parcel's own shape, hovering as a stack.
    const { THREE } = scene;
    const color = getComputedStyle(document.documentElement).getPropertyValue('--data').trim();
    const shapeGeo = new THREE.ShapeGeometry(new THREE.Shape(scene.fieldRing.map((p) => new THREE.Vector2(p.x, -p.z))));
    const edgeGeo = new THREE.BufferGeometry().setFromPoints(scene.fieldRing.map((p) => new THREE.Vector3(p.x, 0, p.z)));
    const sheets = LAYERS.map((_, i) => {
      const group = new THREE.Group();
      const fillMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      const fill = new THREE.Mesh(shapeGeo, fillMat);
      fill.rotation.x = -Math.PI / 2;
      const edgeMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false });
      const edge = new THREE.Line(edgeGeo, edgeMat);
      fill.renderOrder = edge.renderOrder = 10 - i;
      group.add(fill, edge);
      group.visible = false;
      scene.ground.add(group);
      return { group, fillMat, edgeMat, rest: 0.22 - i * 0.05, y: START_Y };
    });
    const FILL_OPACITY = 0.14;
    const v = new THREE.Vector3();

    scene.onFrame(({ now }) => {
      // Visible only while this slide is active and its first step is reached. stage.js puts `.active` on ctx.el
      // before it calls enter(), so this is the slide's own state: no frame counts, no view check.
      const live = ctx.el.classList.contains('active') && st.step >= 1 && st.fallAt !== null;
      const el = live ? (now - st.fallAt) / 1000 : 0;
      sheets.forEach((s, i) => {
        const q = live ? easeOut((el - i * SHEET_GAP_S) / SHEET_FALL_S) : 0;   // top sheet (01) first
        s.y = START_Y + (s.rest - START_Y) * q;
        s.group.position.y = s.y;
        s.fillMat.opacity = FILL_OPACITY * q; s.edgeMat.opacity = 0.9 * q;
        s.group.visible = q > 0.001;
      });

      // Leader lines: straight, from the same corner of every sheet (the ring vertex furthest right on screen) to the
      // left end of its row. All anchors share one x and keep the rows' order, so the lines cannot cross.
      if (!live || st.step < 2) { leaders.innerHTML = ''; return; }
      let best = 0, bx = -Infinity;
      scene.fieldRing.forEach((p, k) => { const [x] = scene.project(v.set(p.x, sheets[0].rest, p.z)); if (x > bx) { bx = x; best = k; } });
      const corner = scene.fieldRing[best];
      const tx = panel.offsetLeft - 18;
      let out = '';
      sheets.forEach((s, i) => {
        const [x, y] = scene.project(v.set(corner.x, s.y, corner.z));
        const ty = panel.offsetTop + rows[i].offsetTop + rows[i].offsetHeight / 2;
        out += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${tx}" y2="${ty.toFixed(1)}" stroke="rgba(255,255,255,.5)" stroke-width="1.5"/>`
          + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#fff"/>`;
      });
      leaders.innerHTML = out;
    });
  },
  enter(step, ctx) {
    const st = this.st;
    ctx.scene.goTo('data', { instant: ctx.instant });
    ctx.setWash(1, 1);
    st.step = step;
    if (step >= 1) {
      if (ctx.instant) st.fallAt = -1e9;                      // jump to the end of the fall
      else if (st.fallAt === null) st.fallAt = performance.now();
    } else st.fallAt = null;
    ctx.el.querySelector('svg.leaders').style.opacity = ctx.scene.available && step >= 2 ? '1' : '0';
    if (step >= 3) st.startCount(ctx.instant); else st.resetCount();
  },
  final(ctx) { this.enter(this.steps, ctx); },
};
