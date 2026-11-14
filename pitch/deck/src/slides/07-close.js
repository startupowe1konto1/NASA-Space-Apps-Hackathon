// Slide 7: back to orbit. Placeholder from P1: eyebrow and title only.
export default {
  steps: 0,
  mount(ctx) {
    ctx.el.innerHTML = `
      <div class="copy">
        <div class="eyebrow">Built on open data</div>
        <div class="title">${ctx.constants.PROJECT_NAME}</div>
      </div>`;
  },
  enter(_step, ctx) {
    ctx.scene.goTo('orbit', { instant: ctx.instant });
    ctx.setWash(1, 0);
  },
  final(ctx) { this.enter(this.steps, ctx); },
};
