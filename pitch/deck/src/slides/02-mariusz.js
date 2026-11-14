// Slide 2: Mariusz. Placeholder from P1: eyebrow and title only; the slide task fills in the facts row and the notebook.
export default {
  steps: 3,
  mount(ctx) {
    ctx.el.innerHTML = `
      <div class="copy">
        <div class="eyebrow">The problem</div>
        <div class="title">Mariusz plans next year from a notebook.</div>
      </div>`;
  },
  enter(_step, ctx) {
    ctx.scene.goTo('field', { instant: ctx.instant });
    ctx.setWash(1, 0);
  },
  final(ctx) { this.enter(this.steps, ctx); },
};
