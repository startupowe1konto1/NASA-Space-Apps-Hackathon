// Slides "tool-1" and "tool-2": the app. Each shows two screenshots of the app side by side in plain browser frames that
// rise from the field, one after the other, on a single key press. tool-2 ends with the sentence about the farmer's judgment.
// Screenshots are taken later by a script (task P8). A file that is not there yet shows a plain label and one console.warn;
// ctx.el.dataset.missing holds the number of screenshots not (yet) loaded, so the PDF script can refuse to print.

// Stage px. Each frame: 800 px wide, a 22 px bar, then a 16:10 view (for 1280 x 800 screenshots).
const FRAME = { top: 300, w: 800, bar: 22, gap: 96 };
const VIEW_H = Math.round((FRAME.w - 2) * 10 / 16);

const CSS = `
.s-tool .copy { width: 1696px; }
.s-tool .title { font-size: 72px; }
.s-tool .pair { position: absolute; left: var(--margin); top: ${FRAME.top}px; display: flex; gap: ${FRAME.gap}px; }
.s-tool .shotbox { width: ${FRAME.w}px; opacity: 0; transform: translateY(60px);
  transition: opacity .6s ease, transform .9s cubic-bezier(.2, .7, .2, 1); }
.s-tool .shotbox.on { opacity: 1; transform: none; }
.s-tool .frame { box-sizing: border-box; width: 100%; background: #0b0e16; border: 1px solid var(--hairline);
  border-radius: 10px; overflow: hidden; }
.s-tool .frame .bar { height: ${FRAME.bar}px; border-bottom: 1px solid var(--hairline); background: #121722; }
.s-tool .frame .view { position: relative; height: ${VIEW_H}px; background: #0b0e16; }
.s-tool .frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.s-tool .frame .pending { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 22px; color: var(--muted); }
.s-tool .cap { margin-top: 16px; font-size: 26px; font-weight: 500; }
.s-tool .cap i { font-style: normal; color: var(--muted); margin-right: 12px; font-feature-settings: "tnum" 1; }
.s-tool .rule { position: absolute; left: var(--margin); right: var(--margin); bottom: 60px; font-size: 32px; font-weight: 500;
  line-height: 1.25; opacity: 0; transition: opacity .6s ease .3s; }
.s-tool .rule.on { opacity: 1; }
`;

function toolSlide({ title, shots, rule }) {
  return {
    steps: 2,          // 1: left screenshot, 2: right screenshot (and the closing sentence on tool-2)
    stepMs: 900,
    mount(ctx) {
      if (!document.getElementById('s-tool-css')) {
        const st = document.createElement('style'); st.id = 's-tool-css'; st.textContent = CSS; document.head.append(st);
      }
      ctx.el.classList.add('s-tool');
      ctx.el.innerHTML = `
        <div class="copy">
          <div class="eyebrow">The tool</div>
          <div class="title">${title}</div>
        </div>
        <div class="pair"></div>
        ${rule ? `<div class="rule">${rule}</div>` : ''}`;
      const pair = ctx.el.querySelector('.pair');
      let missing = shots.length;
      ctx.el.dataset.missing = String(missing);
      this.boxes = shots.map(({ file, n, caption }) => {
        const box = document.createElement('div');
        box.className = 'shotbox';
        box.innerHTML = `<div class="frame"><div class="bar"></div><div class="view"></div></div>
          <div class="cap"><i>${n}</i>${caption}</div>`;
        const view = box.querySelector('.view');
        const img = new Image();
        img.alt = ''; img.draggable = false;
        img.onload = () => { ctx.el.dataset.missing = String(--missing); };
        img.onerror = () => {
          console.warn(`Slide ${ctx.index + 1}: screenshot missing: assets/app/${file}`);
          img.remove();
          const label = document.createElement('div');
          label.className = 'pending'; label.textContent = `Screenshot pending: ${file}`;
          view.append(label);
        };
        img.src = `assets/app/${file}`;
        view.append(img);
        pair.append(box);
        return box;
      });
      this.rule = ctx.el.querySelector('.rule');
    },
    enter(step, ctx) {
      ctx.scene.goTo('field', { instant: ctx.instant });
      ctx.setWash(1, 0.6);
      this.boxes.forEach((b, i) => b.classList.toggle('on', step >= i + 1));
      this.rule?.classList.toggle('on', step >= 2);
    },
    final(ctx) { this.enter(this.steps, ctx); },
  };
}

export const toolStart = toolSlide({
  title: 'Mariusz starts with his field and his notebook.',
  shots: [
    { file: '01-field.png', n: '1', caption: 'Mark the field on the map' },
    { file: '02-history.png', n: '2', caption: 'Copy the notebook' },
  ],
});

export const toolResult = toolSlide({
  title: 'Three rotations, each with its evidence.',
  shots: [
    { file: '03-goal.png', n: '3', caption: 'Pick a goal' },
    { file: '04-rotations.png', n: '4', caption: 'Compare three rotations' },
  ],
  rule: "The tool supports the farmer's judgment. It does not replace it.",
});
