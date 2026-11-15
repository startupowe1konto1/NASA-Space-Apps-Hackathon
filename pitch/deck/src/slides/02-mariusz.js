// Slide 2: Mariusz. Step 1 the facts row, step 2 the notebook card, step 3 the open 2027 row (one pulse).
import { cropName } from '../crops.js';

const CSS = `
.s-mariusz .nb { position: absolute; left: 1240px; top: 250px; width: 560px; height: 600px; padding: 30px 36px 0 84px;
  background-color: #f3eee1; color: #1f2a44; border-radius: 3px; box-shadow: 0 14px 34px rgba(0, 0, 0, .35);
  background-image: linear-gradient(90deg, transparent 62px, rgba(200, 70, 70, .6) 62px, rgba(200, 70, 70, .6) 64px, transparent 64px),
    repeating-linear-gradient(180deg, transparent 0, transparent 77px, rgba(90, 130, 190, .35) 77px, rgba(90, 130, 190, .35) 78px);
  background-position: 0 0, 0 24px; transform: translateX(80px); }
.s-mariusz .nb[data-from].on { transform: none; }
.s-mariusz .nb .r { display: flex; align-items: baseline; height: 78px; padding-bottom: 6px; font-family: var(--hand); font-weight: 500;
  font-size: 50px; line-height: 1; white-space: nowrap; align-items: flex-end; }
.s-mariusz .nb .r b { font-weight: 500; width: 128px; flex: none; }
.s-mariusz .nb .r.open { color: #b3361f; }
/* Caveat's "?" draws about 11 px past its own box on the right. During the pulse Chrome puts it on a GPU layer cut to
   that box, which hid the right half; the padding makes the box hold the whole glyph, the margin keeps the layout. */
.s-mariusz .nb .r.open i { font-style: normal; font-size: 64px; display: inline-block; padding: 0 16px 6px 0; margin: 0 -16px -6px 0;
  transform-origin: 50% 70%; }
.s-mariusz .nb .r.open.pulse i { animation: s-mariusz-pulse .9s ease-in-out .6s 1; }
@keyframes s-mariusz-pulse { 0%, 100% { transform: scale(1); } 40% { transform: scale(1.45); } }
.s-mariusz .nb .r[data-from] { transition: opacity .5s ease; transform: none; }
`;

const fmtCoord = (v, pos, neg) => `${(Math.round(Math.abs(v) * 1e4 + 1e-6) / 1e4).toFixed(4)}° ${v >= 0 ? pos : neg}`;

export default {
  // One key press: the descent lands on the parcel (step 0), then title, facts and notebook together (1), then the
  // open 2027 row (2). The stage plays the steps in a row.
  steps: 2,
  stepMs: 1100,   // the notebook slides in before the 2027 row appears
  mount(ctx) {
    if (!document.getElementById('s-mariusz-css')) {
      const st = document.createElement('style'); st.id = 's-mariusz-css'; st.textContent = CSS; document.head.append(st);
    }
    const { field, notebook } = ctx.data;
    ctx.el.classList.add('s-mariusz');
    const rows = notebook.map((n) => `<div class="r"><b>${n.year}</b>${cropName(n.crop)}</div>`).join('');
    ctx.el.innerHTML = `
      <div class="copy" data-from="1">
        <div class="eyebrow">The problem</div>
        <div class="title lines">Originally,<br>Jan has no data<br>to back his decisions</div>
        <div class="facts">
          <span><small>Location</small>Uzarzewo, near Poznań</span>
          <span><small>Coordinates</small>${fmtCoord(field.centroid.lat, 'N', 'S')}, ${fmtCoord(field.centroid.lon, 'E', 'W')}</span>
          <span><small>Area</small>${field.areaHa.toFixed(1)} ha</span>
        </div>
      </div>
      <div class="nb" data-from="1">
        ${rows}
        <div class="r open" data-from="2"><b>${notebook[notebook.length - 1].year + 1}</b><i>?</i></div>
      </div>`;
    this.open = ctx.el.querySelector('.r.open');
  },
  enter(step, ctx) {
    ctx.scene.goTo('field', { instant: ctx.instant });
    ctx.setWash(step >= 1 ? 1 : 0, step >= 1 ? 0.6 : 0);
    const o = this.open;
    o.classList.remove('pulse');
    if (step >= 2 && !ctx.instant) { void o.offsetWidth; o.classList.add('pulse'); }
  },
  final(ctx) { this.enter(this.steps, ctx); },
};
