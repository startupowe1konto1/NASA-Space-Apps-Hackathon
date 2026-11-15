// Slide 6: the answer. A plain browser frame rises from the field and cross-fades four screenshots of the app (steps 1-4);
// at step 5 it moves left and shrinks, and the closing lines appear on the right.
// Screenshots are taken later by a script (task P8). A file that is not there yet shows a plain label and one console.warn;
// ctx.el.dataset.missing holds the number of screenshots not (yet) loaded, so the PDF script can refuse to print.
const FILES = ['01-field.png', '02-history.png', '03-goal.png', '04-rotations.png'];

// Stage px. Frame: 1024 x 640 content (16:10, for 1280 x 800 screenshots) under a 28 px bar, 1 px border.
const FRAME = { left: 800, top: 330, w: 1026, bar: 28, content: 640 };
const REST = { x: 112, y: 500, scale: 0.74 }; // step 5: frame top-left at (112, 500), 74 % size

const CSS = `
.s-answer .frame { position: absolute; left: ${FRAME.left}px; top: ${FRAME.top}px; width: ${FRAME.w}px; box-sizing: border-box;
  background: #0b0e16; border: 1px solid var(--hairline); border-radius: 12px; overflow: hidden; transform-origin: 0 0;
  opacity: 0; transform: translateY(70px);
  transition: opacity .6s ease, transform .9s cubic-bezier(.2, .7, .2, 1); }
.s-answer[data-fs="1"] .frame { opacity: 1; transform: none; }
.s-answer[data-fs="2"] .frame { opacity: 1; transform: translate(${REST.x - FRAME.left}px, ${REST.y - FRAME.top}px) scale(${REST.scale}); }
.s-answer .frame .bar { height: ${FRAME.bar}px; border-bottom: 1px solid var(--hairline); background: #121722; }
.s-answer .frame .view { position: relative; width: 1024px; height: ${FRAME.content}px; background: #0b0e16; }
.s-answer .frame .shot { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block;
  opacity: 0; transition: opacity .6s ease; }
.s-answer .frame .shot.show { opacity: 1; }
.s-answer .frame .pending { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 26px; color: var(--muted); opacity: 0; transition: opacity .6s ease; }
.s-answer .frame .pending.show { opacity: 1; }
.s-answer .closing { position: absolute; left: 930px; top: 330px; width: 880px; }
.s-answer .closing .lead { font-size: 34px; line-height: 1.3; color: var(--muted); }
.s-answer .closing h3 { margin: 30px 0 0; font-size: 52px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; }
.s-answer .closing .lead + h3 { margin-top: 36px; }
.s-answer .closing .rule { margin-top: 56px; padding-top: 28px; border-top: 1px solid var(--hairline);
  font-size: 40px; line-height: 1.25; font-weight: 500; }
.s-answer .closing [data-from].on { transition-delay: .9s; }
.s-answer .closing h3[data-from].on { transition-delay: 1.05s; }
.s-answer .closing h3[data-from].on + h3 { transition-delay: 1.2s; }
.s-answer .closing .rule span { display: block; }
.s-answer .closing .rule[data-from].on { transition-delay: 1.4s; }
`;

export default {
  steps: 5,
  manual: true,   // one key press per app screenshot (the pitch owner's exception to one press per slide)
  stepMs: 1400,
  mount(ctx) {
    if (!document.getElementById('s-answer-css')) {
      const st = document.createElement('style'); st.id = 's-answer-css'; st.textContent = CSS; document.head.append(st);
    }
    ctx.el.classList.add('s-answer');
    ctx.el.innerHTML = `
      <div class="copy">
        <div class="eyebrow">The tool</div>
        <div class="title">Three rotations, each with its evidence.</div>
      </div>
      <div class="frame"><div class="bar"></div><div class="view"></div></div>
      <div class="closing">
        <div class="lead" data-from="5">Two things are on every card.</div>
        <h3 data-from="5">What we do not know</h3>
        <h3 data-from="5">Check locally</h3>
        <div class="rule" data-from="5"><span>The tool supports the farmer's judgment.</span> <span>It does not replace it.</span></div>
      </div>`;
    const view = ctx.el.querySelector('.view');
    this.shots = [];
    let missing = FILES.length;
    ctx.el.dataset.missing = String(missing);
    FILES.forEach((file, i) => {
      const img = new Image();
      img.className = 'shot'; img.alt = ''; img.draggable = false;
      const label = document.createElement('div');
      label.className = 'pending'; label.textContent = `Screenshot pending: ${file}`;
      view.append(img, label);
      this.shots.push({ img, label, ok: false });
      img.onload = () => { this.shots[i].ok = true; ctx.el.dataset.missing = String(--missing); this.paint(); };
      img.onerror = () => { console.warn(`Slide 6: screenshot missing: assets/app/${file}`); this.paint(); };
      img.src = `assets/app/${file}`;
    });
    this.frame = ctx.el.querySelector('.frame');
    this.cur = 0;
  },
  /** Show the screenshot of the current step (step 5 keeps the last one), or its label if the file is missing. */
  paint() {
    const n = Math.min(Math.max(this.cur, 1), 4) - 1;
    this.shots.forEach((s, i) => {
      const on = this.cur >= 1 && i === n;
      s.img.classList.toggle('show', on && s.ok);
      s.label.classList.toggle('show', on && !s.ok && s.img.complete);
    });
  },
  enter(step, ctx) {
    ctx.scene.goTo('field', { instant: ctx.instant });
    ctx.setWash(1, step >= 5 ? 0.6 : 0);
    ctx.el.dataset.fs = step >= 5 ? '2' : step >= 1 ? '1' : '0';
    this.cur = step;
    this.paint();
  },
  final(ctx) { this.enter(this.steps, ctx); },
};
