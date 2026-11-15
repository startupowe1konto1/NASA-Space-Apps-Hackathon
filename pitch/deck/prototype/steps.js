// Step control shared by both examples: arrow keys, the two buttons, ?step=n and ?auto=1.
(() => {
  const stage = document.getElementById('stage');
  const count = document.getElementById('count');
  const LAST = Number(document.getElementById('stage').dataset.last) || 3;
  const params = new URLSearchParams(location.search);
  let step = Math.min(LAST, Math.max(0, Number(params.get('step')) || 0));

  function fit() {
    const box = document.querySelector('.fit').getBoundingClientRect();
    const scale = Math.min(box.width / 1920, box.height / 1080) * 0.98;
    stage.style.transform = `scale(${scale})`;
  }
  function go(next) {
    step = Math.min(LAST, Math.max(0, next));
    stage.dataset.step = String(step);
    count.textContent = `step ${step + 1} of ${LAST + 1}`;
    window.dispatchEvent(new CustomEvent('step', { detail: step }));
  }
  document.getElementById('next').onclick = () => go(step + 1);
  document.getElementById('prev').onclick = () => go(step - 1);
  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') go(step + 1);
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(step - 1);
  });
  addEventListener('resize', fit);
  fit();
  go(step);
  if (params.get('auto')) setInterval(() => go(step === LAST ? 0 : step + 1), 3800);
})();
