// Slide 4: the engine. Placeholder from P1: eyebrow and title only.
export default {
  steps: 4,
  mount(ctx) {
    ctx.el.innerHTML = `
      <div class="copy">
        <div class="eyebrow">The engine</div>
        <div class="title">Every rotation is tested against ${ctx.data.climate.years} years.</div>
      </div>`;
  },
  enter(_step, ctx) {
    ctx.scene.goTo('field', { instant: ctx.instant });
    ctx.setWash(1, 0);
  },
  final(ctx) { this.enter(this.steps, ctx); },
};
