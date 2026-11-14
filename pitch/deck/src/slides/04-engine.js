// Slide 4: the engine. A ribbon of the years in the weather record, then the four rotations the app shows for the
// "keep my soil" goal, each with its soil health and climate resilience score and the low-to-high range.
// Spec §5 slide 4. Every number comes from data/field.json; nothing per year is drawn on a rotation row, because the
// export has no per-year results.
import { rotationText } from '../crops.js';

const ROW_H = 60;
const SWEEP_MS = 2000;                       // step 3: the playhead crosses the ribbon while the bars fill
const STEP_MS = [700, 1300, 900, SWEEP_MS + 200, 1100];
const TICKS = [1981, 1990, 2000, 2010, 2020, 2025];

const CSS = `
.s4 .panel4 { position: absolute; left: var(--margin); right: var(--margin); top: 556px; }
.s4 .under { position: absolute; left: 0; right: 0; top: 440px; bottom: 0; pointer-events: none;
  background: linear-gradient(180deg, rgba(5,7,13,0) 0%, rgba(5,7,13,.82) 16%, rgba(5,7,13,.92) 100%); }
.s4 .rib-head { display: flex; justify-content: space-between; align-items: center; height: 24px;
  font-size: var(--fs-label); font-weight: 500; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.s4 .legend { display: flex; align-items: center; gap: 10px; }
.s4 .legend i { width: 16px; height: 16px; background: var(--risk); display: inline-block; }
.s4 .ribbon { position: relative; display: grid; gap: 4px; height: 40px; margin-top: 10px; }
.s4 .cell { background: rgba(245,247,250,.16); opacity: 0; transition: opacity .3s ease; }
.s4 .cell.dry { background: var(--risk); }
.s4:not([data-step-at="0"]) .cell { opacity: 1; }
.s4 .ticks { position: relative; height: 26px; margin-top: 8px; font-size: 17px; color: var(--muted); opacity: 0; transition: opacity .5s ease .6s; }
.s4:not([data-step-at="0"]) .ticks { opacity: 1; }
.s4 .rib-head { opacity: 0; transition: opacity .5s ease; }
.s4:not([data-step-at="0"]) .rib-head { opacity: 1; }
.s4 .ticks span { position: absolute; transform: translateX(-50%); }
.s4 .playhead { position: absolute; top: -8px; bottom: -8px; width: 3px; margin-left: -1.5px; background: var(--text); opacity: 0; }
.s4 .table4 { position: relative; margin-top: 20px; }
.s4 .head4, .s4 .row4 { display: grid; grid-template-columns: minmax(0, 1fr) 440px 440px; column-gap: 48px; align-items: center; }
.s4 .head4 { height: 30px; font-size: var(--fs-label); font-weight: 500; letter-spacing: .12em; text-transform: uppercase; color: var(--muted);
  opacity: 0; transition: opacity .5s ease; }
.s4 .head4 .hint { text-transform: none; letter-spacing: 0; font-weight: 400; font-size: 16px; margin-left: 10px; }
.s4 .rows4 { position: relative; height: ${ROW_H * 4}px; }
.s4 .row4 { position: absolute; left: 0; right: 0; top: 0; height: ${ROW_H}px; border-top: 1px solid var(--hairline);
  opacity: 0; transition: opacity .5s ease, transform .9s cubic-bezier(.22,.8,.24,1); }
.s4 .rows4::after { content: ""; position: absolute; left: 0; right: 0; top: ${ROW_H * 4}px; border-top: 1px solid var(--hairline); }
.s4 .crops { font-size: 25px; line-height: 1.2; white-space: nowrap; }
.s4 .crops small { display: block; margin-top: 2px; font-size: 16px; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.s4 .score { display: grid; grid-template-columns: 1fr 64px; column-gap: 18px; align-items: center; }
.s4 .track { position: relative; height: 16px; background: rgba(245,247,250,.08); }
.s4 .fill { position: absolute; inset: 0; transform-origin: 0 50%; transform: scaleX(0); background: rgba(245,247,250,.62);
  transition: background-color .5s ease; }
.s4 .whisk { position: absolute; top: 50%; height: 2px; margin-top: -1px; background: var(--text); opacity: 0; transition: opacity .4s ease; }
.s4 .whisk::before, .s4 .whisk::after { content: ""; position: absolute; top: -6px; width: 2px; height: 14px; background: var(--text); }
.s4 .whisk::before { left: -1px; } .s4 .whisk::after { right: -1px; }
.s4 .val { font-size: 25px; font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; transition: color .5s ease; }
.s4 .row4.pick .fill { background: var(--field); }
.s4 .row4.pick .val { color: var(--field); }
.s4 .foot { opacity: 0; transition: opacity .5s ease .5s; }
.s4[data-step-at="4"] .foot { opacity: 1; }
`;

function pickRows(data) {
  const ids = data.shownByGoal?.keepSoil;
  if (!Array.isArray(ids) || ids.length === 0) throw new Error('04-engine: shownByGoal.keepSoil is missing');
  const rows = ids.map((id) => {
    const r = data.rotations.find((x) => x.id === id);
    if (!r) throw new Error(`04-engine: rotation "${id}" from shownByGoal.keepSoil is not in rotations`);
    for (const k of ['soilHealth', 'climateResilience']) {
      const s = r[k];
      if (!s || ![s.value, s.low, s.high].every(Number.isFinite)) throw new Error(`04-engine: ${id} has no ${k} value/low/high`);
    }
    return r;
  });
  if (rows.filter((r) => r.isCurrent).length !== 1) throw new Error('04-engine: expected exactly one current rotation among the rows');
  return rows;
}

export default {
  steps: 4,
  _step: 0,
  get stepMs() { return STEP_MS[this._step] ?? 700; },

  mount(ctx) {
    const { data } = ctx;
    const years = data.climate.yearly;
    if (years.length !== data.climate.years) throw new Error('04-engine: climate.yearly does not match climate.years');
    const first = data.climate.firstYear, last = data.climate.lastYear;
    const rows = pickRows(data);
    // Mariusz thinks of his own rotation first, then the others in the order the app lists them.
    const startOrder = [rows.find((r) => r.isCurrent), ...rows.filter((r) => !r.isCurrent)];
    const endOrder = [...rows].sort((a, b) => a.rank - b.rank);
    this.rows = rows.map((r) => ({ r, start: startOrder.indexOf(r), end: endOrder.indexOf(r) }));

    if (!document.getElementById('s4-css')) {
      const st = document.createElement('style'); st.id = 's4-css'; st.textContent = CSS; document.head.append(st);
    }
    ctx.el.classList.add('s4');
    const pct = (y) => ((y - first + 0.5) / years.length) * 100;
    const bar = (s) => `<div class="score"><div class="track"><div class="fill" data-v="${s.value}"></div>
        <div class="whisk" style="left:${s.low}%;width:${s.high - s.low}%"></div></div><div class="val" data-v="${s.value}">0</div></div>`;

    ctx.el.innerHTML = `
      <div class="under"></div>
      <div class="copy">
        <div class="eyebrow">The engine</div>
        <div class="title">Every rotation is tested against ${data.climate.years} years.</div>
      </div>
      <div class="panel4">
        <div class="rib-head"><span>Weather, ${first}–${last}</span><span class="legend"><i></i>Drought year</span></div>
        <div class="ribbon" style="grid-template-columns: repeat(${years.length}, 1fr)">
          ${years.map((y, i) => `<div class="cell${y.drought ? ' dry' : ''}" style="transition-delay:${(i * 0.022).toFixed(3)}s"></div>`).join('')}
          <div class="playhead"></div>
        </div>
        <div class="ticks">${TICKS.filter((t) => t >= first && t <= last).map((t) => `<span style="left:${pct(t)}%">${t}</span>`).join('')}</div>
        <div class="table4">
          <div class="head4"><span>Rotation</span><span>Soil health<span class="hint">0–100, line: low to high</span></span><span>Climate resilience</span></div>
          <div class="rows4">
            ${this.rows.map(({ r }, i) => `<div class="row4" data-i="${i}">
              <div class="crops">${rotationText(r)}${r.isCurrent ? '<small>Mariusz today</small>' : ''}</div>
              ${bar(r.soilHealth)}${bar(r.climateResilience)}</div>`).join('')}
          </div>
        </div>
      </div>
      <div class="foot">Soil health and climate resilience come first. Income is a replay of past years at today's prices, not a forecast.</div>`;

    this.el = ctx.el;
    this.rowEls = [...ctx.el.querySelectorAll('.row4')];
    this.playhead = ctx.el.querySelector('.playhead');
    this.head = ctx.el.querySelector('.head4');
  },

  /** Bars and numbers at fraction f of their values (0 empty, 1 full). */
  fillTo(f) {
    for (const el of this.el.querySelectorAll('.fill')) el.style.transform = `scaleX(${(f * Number(el.dataset.v)) / 100})`;
    for (const el of this.el.querySelectorAll('.val')) el.textContent = String(Math.round(f * Number(el.dataset.v)));
    for (const el of this.el.querySelectorAll('.whisk')) el.style.opacity = f >= 1 ? '1' : '0';
  },

  stopSweep() { cancelAnimationFrame(this.raf); this.raf = 0; this.playhead.style.opacity = '0'; },

  sweep() {
    this.stopSweep();
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, Math.max(0, (now - t0) / SWEEP_MS));   // elapsed time, not frames
      const e = 1 - Math.pow(1 - p, 2);
      this.playhead.style.left = `${p * 100}%`;
      this.playhead.style.opacity = p < 1 ? '1' : '0';
      this.fillTo(e);
      this.raf = p < 1 ? requestAnimationFrame(tick) : 0;
    };
    this.raf = requestAnimationFrame(tick);
  },

  enter(step, ctx) {
    const prev = this._step;
    this._step = step;
    ctx.scene.goTo('engine', { instant: ctx.instant });
    ctx.setWash(0.9, 0);
    this.el.dataset.stepAt = String(step);

    // Rows: hidden before step 2; in Mariusz's order until step 4, then by rank.
    this.head.style.opacity = step >= 2 ? '1' : '0';
    this.rowEls.forEach((el, i) => {
      const { start, end } = this.rows[i];
      el.style.opacity = step >= 2 ? '1' : '0';
      el.style.transitionDelay = step === 2 && !ctx.instant ? `${start * 0.12}s, 0s` : '0s';
      el.style.transform = `translateY(${(step >= 4 ? end : start) * ROW_H}px)`;
      el.classList.toggle('pick', step >= 4 && !this.rows[i].r.isCurrent);
    });

    // Bars: empty until step 3, which sweeps; full from then on.
    if (step < 3) { this.stopSweep(); this.fillTo(0); }
    else if (step === 3 && prev === 2 && !ctx.instant) this.sweep();
    else { this.stopSweep(); this.fillTo(1); }
  },

  final(ctx) { this.enter(this.steps, ctx); },
};
