// Slide 3: the data. Placeholder from P1: eyebrow and title only.
export default {
  steps: 3,
  mount(ctx) {
    ctx.el.innerHTML = `
      <div class="copy">
        <div class="eyebrow">The data</div>
        <div class="title">Five layers already describe this field.</div>
      </div>`;
  },
  enter(_step, ctx) {
    ctx.scene.goTo('field', { instant: ctx.instant });
    ctx.setWash(1, 0);
  },
  final(ctx) { this.enter(this.steps, ctx); },
};
