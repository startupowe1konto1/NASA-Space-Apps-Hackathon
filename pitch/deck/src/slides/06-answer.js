// Slide 6: the answer. Placeholder from P1: eyebrow and title only.
export default {
  steps: 5,
  mount(ctx) {
    ctx.el.innerHTML = `
      <div class="copy">
        <div class="eyebrow">The tool</div>
        <div class="title">Three rotations, each with its evidence.</div>
      </div>`;
  },
  enter(_step, ctx) {
    ctx.scene.goTo('field', { instant: ctx.instant });
    ctx.setWash(1, 0);
  },
  final(ctx) { this.enter(this.steps, ctx); },
};
