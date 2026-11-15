// Slide 7: back to orbit. Built on open data: who we are on the left, every dataset used for this field on the right.
// NASA-ness comes from the `nasa` flag of datasets.list, never from a name list. Every id appears exactly once.
const CSS = `
.slide[data-slide="7"] .who { margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--hairline); font-size: 22px; line-height: 1.4; }
.slide[data-slide="7"] .who small { display: block; margin: 14px 0 4px; font-size: var(--fs-label); font-weight: 500; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.slide[data-slide="7"] .who .two { display: grid; grid-template-columns: 200px 1fr; column-gap: 24px; }
.slide[data-slide="7"] .who .two small { margin-top: 0; }
.slide[data-slide="7"] .scrim { position: absolute; right: 0; top: 0; bottom: 0; width: 960px; pointer-events: none;
  background: linear-gradient(270deg, rgba(5, 7, 13, .92) 0%, rgba(5, 7, 13, .9) 66%, rgba(5, 7, 13, 0) 100%); }
.slide[data-slide="7"] .panel { z-index: 1; }
.slide[data-slide="7"] .who div { white-space: nowrap; }
.slide[data-slide="7"] .who .ai { margin-top: 16px; font-size: 20px; color: #d5dbe3; white-space: normal; }
.slide[data-slide="7"] .panel { top: 104px; }
.slide[data-slide="7"] .grp { margin: 0 0 14px; }
.slide[data-slide="7"] .grp h3 { margin: 0 0 6px; font-size: 18px; }
.slide[data-slide="7"] .ds { padding: 5px 0; border-top: 1px solid var(--hairline); }
.slide[data-slide="7"] .ds:last-child { border-bottom: 1px solid var(--hairline); }
.slide[data-slide="7"] .ds b { display: block; font-weight: 500; font-size: 20px; line-height: 1.28; }
.slide[data-slide="7"] .ds i { display: block; font-style: normal; font-size: 16px; line-height: 1.3; color: var(--muted); margin-top: 2px; }
.slide[data-slide="7"] .ds.nasa b { color: var(--text); }
.slide[data-slide="7"] .credits { margin-top: 4px; font-size: 16px; line-height: 1.45; color: #b4bdc9; }
`;

// Short display forms, derived from the data text: drop a trailing parenthesis or clause.
const short = (s) => s.split(/ \(|, /)[0];

function groups(data) {
  const used = data.datasetsUsedForThisField.ids;
  const byId = new Map(data.datasets.list.map((d) => [d.id, d]));
  const rows = used.map((id) => {
    const d = byId.get(id);
    if (!d) throw new Error(`Slide 7: dataset "${id}" is in datasetsUsedForThisField but not in datasets.list`);
    return d;
  });
  if (new Set(used).size !== used.length) throw new Error('Slide 7: duplicate dataset id in datasetsUsedForThisField');
  // The parcel outline comes from the land register through the map, not through the analysis, so it may have no
  // dataset id in the export. Then it is named from field.source ("GUGiK ULDK (land register parcel)"). Once the app
  // registers it as a dataset, it arrives in `rows` and this adds nothing.
  const src = data.field?.source ?? '';
  const m = /^(\S+)\s+(\S+)\s*\((.+)\)$/.exec(src);
  if (!m) throw new Error(`Slide 7: cannot read the parcel source from field.source "${src}"`);
  if (!rows.some((d) => short(d.provider) === m[1] || d.provider.includes(m[1]))) {
    rows.push({ id: 'field.source', provider: m[1], name: `${m[2]} ${m[3]}`, nasa: false });
  }
  const nasa = rows.filter((d) => d.nasa === true);
  const providers = new Map();
  for (const d of rows.filter((x) => x.nasa !== true)) {
    const p = short(d.provider);
    if (!providers.has(p)) providers.set(p, []);
    providers.get(p).push(d);
  }
  return { nasa, providers };
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export default {
  steps: 0,
  mount(ctx) {
    const { EVENT, CHALLENGE, PROJECT_NAME, TEAM, MEMBERS, APP_URL } = ctx.constants;
    const { nasa, providers } = groups(ctx.data);
    if (!document.getElementById('slide7-css')) {
      const st = document.createElement('style'); st.id = 'slide7-css'; st.textContent = CSS; document.head.append(st);
    }
    const link = APP_URL ? `<small>App</small><div>${esc(APP_URL)}</div>` : '';
    const nasaHtml = nasa.map((d) => `<div class="ds nasa" data-id="${d.id}"><b>${esc(short(d.name))}</b></div>`).join('');
    const otherHtml = [...providers].map(([p, list]) =>
      `<div class="ds" data-id="${list.map((d) => d.id).join(' ')}"><i style="margin:0 0 3px">${esc(p)}</i>${
        list.map((d) => `<b>${esc(short(d.name))}</b>`).join('')}</div>`).join('');
    ctx.el.innerHTML = `
      <div class="copy">
        <div class="eyebrow">Built on open data</div>
        <div class="title">${esc(PROJECT_NAME)}</div>
        <div class="who">
          <div class="two"><div><small>Team</small><div>${esc(TEAM)}</div></div>
          <div><small>Members</small>${MEMBERS.map((m) => `<div>${esc(m)}</div>`).join('')}</div></div>
          <small>Challenge</small><div>${esc(EVENT)}</div><div>${esc(CHALLENGE)}</div>
          ${link}
          <div class="ai">Built with AI assistance; details on the project page.</div>
        </div>
      </div>
      <div class="scrim"></div>
      <div class="panel">
        <div class="grp"><h3>NASA</h3>${nasaHtml}</div>
        <div class="grp"><h3>Partners and others</h3>${otherHtml}</div>
        <div class="credits">Imagery in this deck: NASA GIBS (Blue Marble, MODIS Terra, HLS). Spacecraft model: Landsat 8, NASA 3D Resources. Typeface: Inter and Caveat, SIL Open Font License 1.1.</div>
      </div>`;
  },
  enter(_step, ctx) {
    ctx.scene.goTo('orbit', { instant: ctx.instant });
    ctx.setWash(1, 1);
  },
  final(ctx) { this.enter(this.steps, ctx); },
};
