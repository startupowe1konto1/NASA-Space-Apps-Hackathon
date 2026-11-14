// Slide 5: similar regions. Placeholder from P1: eyebrow and title only; the camera rests on the Europe view.
export default {
  steps: 3,
  mount(ctx) {
    ctx.el.innerHTML = `
      <div class="copy">
        <div class="eyebrow">Similar regions</div>
        <div class="title">Ten regions share this climate.</div>
      </div>`;
  },
  enter(_step, ctx) {
    ctx.scene.goTo('europe', { instant: ctx.instant });
    ctx.setWash(1, 0);
  },
  final(ctx) { this.enter(this.steps, ctx); },
};
