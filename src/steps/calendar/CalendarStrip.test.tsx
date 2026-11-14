import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CalendarMonth, Dataset, Sourced } from '../../contracts';
import { fixtureDatasets, iowaAnalysis } from '../../fixtures';
import { CalendarStrip } from './CalendarStrip';
import { yearCount } from './marks';

const power: Dataset = {
  id: 'nasa-power-monthly',
  name: 'NASA POWER monthly agroclimatology',
  provider: 'NASA LaRC',
  url: 'https://power.larc.nasa.gov/',
  nasa: true,
  resolution: 'about 50 km',
  period: '1981–2025',
  kind: 'model',
};

const share = (value: number | null, extra: Partial<Sourced> = {}): Sourced => ({
  value,
  unit: 'share of years',
  datasetIds: ['nasa-power-monthly'],
  kind: 'model',
  retrievedAt: '2026-11-14',
  ...extra,
});

const record = { low: 0, high: 1, basis: '45 years, 1981–2025' };

/** Two rotation years: maize then soybean, bare from harvest to planting. */
function twoYears(): CalendarMonth[] {
  const months: CalendarMonth[] = [];
  for (let yearIndex = 0; yearIndex < 2; yearIndex++) {
    const crop = yearIndex === 0 ? 'maize' : 'soybean';
    for (let month = 1; month <= 12; month++) {
      const growing = month >= 5 && month <= 10;
      months.push({
        yearIndex,
        month,
        ...(growing ? { crop } : {}),
        cover: growing ? 'crop' : month === 11 ? 'residue' : 'bare',
        exposure: [],
      });
    }
  }
  months[11] = { yearIndex: 0, month: 12, crop: 'cereal-rye', cover: 'cover-crop', exposure: [] };
  const july = months[6]!;
  july.exposure = [{ hazard: 'drought', probability: share(11 / 45, { range: record }) }];
  const augustSoy = months[12 + 7]!;
  augustSoy.exposure = [{ hazard: 'heat', probability: share(0.31) }];
  const septemberSoy = months[12 + 8]!;
  septemberSoy.exposure = [
    { hazard: 'frost', probability: share(null, { missingReason: 'frost days are missing for 1983' }) },
  ];
  return months;
}

describe('CalendarStrip', () => {
  it('is a table named as a calendar, with one row per rotation year and twelve months each', async () => {
    render(<CalendarStrip months={twoYears()} datasets={[power]} />);
    const table = await screen.findByRole('table', { name: /calendar/i });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3); // month header + two years
    expect(within(rows[1]!).getByRole('rowheader')).toHaveTextContent('Year 1');
    expect(within(rows[1]!).getAllByRole('cell')).toHaveLength(12);
    expect(within(rows[2]!).getAllByRole('cell')).toHaveLength(12);
  });

  it('names every month cell in words, so the cover state does not rest on colour alone', async () => {
    render(<CalendarStrip months={twoYears()} datasets={[power]} />);
    expect((await screen.findAllByLabelText('March, bare soil')).length).toBe(2);
    expect(screen.getAllByLabelText('November, residue')).toHaveLength(2);
    expect(screen.getByLabelText('June, Maize')).toBeInTheDocument();
    expect(screen.getByLabelText('December, cover crop: Cereal rye (cover)')).toBeInTheDocument();
  });

  it('uses the crop names it is given', async () => {
    render(
      <CalendarStrip months={twoYears()} datasets={[power]} cropName={(id) => (id === 'maize' ? 'Corn' : id)} />,
    );
    expect(await screen.findByLabelText('June, Corn')).toBeInTheDocument();
  });

  it('marks a month with a hazard and names the hazard in the label', async () => {
    render(<CalendarStrip months={twoYears()} datasets={[power]} />);
    const july = await screen.findByRole('button', { name: 'July, Maize, drought risk' });
    expect(within(july).getByTestId('mark-drought')).toBeInTheDocument();
  });

  it('shows "in 11 of 45 years" with its source chip when the exposed month is tapped', async () => {
    const user = userEvent.setup();
    render(<CalendarStrip months={twoYears()} datasets={[power]} />);
    await user.click(await screen.findByRole('button', { name: 'July, Maize, drought risk' }));
    const details = await screen.findByRole('region', { name: /July, year 1/ });
    expect(await within(details).findByText('Drought in July')).toBeInTheDocument();
    expect(within(details).getByText('11')).toBeInTheDocument();
    expect(within(details).getByText('of 45 years')).toBeInTheDocument();
    expect(within(details).getByText('model estimate')).toBeInTheDocument();
    await user.click(within(details).getByRole('button', { name: /model estimate/ }));
    expect(await within(details).findByText('NASA POWER monthly agroclimatology')).toBeInTheDocument();
    expect(within(details).getByText('1981–2025')).toBeInTheDocument();
  });

  it('shows a share as a percentage when the source does not say how many years it covers', async () => {
    const user = userEvent.setup();
    render(<CalendarStrip months={twoYears()} datasets={[power]} />);
    await user.click(await screen.findByRole('button', { name: 'August, Soybean, heat risk' }));
    const details = await screen.findByRole('region', { name: /August, year 2/ });
    expect(await within(details).findByText('Heat in August')).toBeInTheDocument();
    expect(within(details).getByText('31')).toBeInTheDocument();
    expect(within(details).getByText('% of years')).toBeInTheDocument();
    expect(details.textContent).not.toMatch(/of 45/);
  });

  it('shows the reason, and no number, when the share is missing', async () => {
    const user = userEvent.setup();
    render(<CalendarStrip months={twoYears()} datasets={[power]} />);
    await user.click(await screen.findByRole('button', { name: 'September, Soybean, frost risk' }));
    const details = await screen.findByRole('region', { name: /September, year 2/ });
    expect(await within(details).findByText('No data')).toBeInTheDocument();
    expect(within(details).getByText('frost days are missing for 1983')).toBeInTheDocument();
  });

  it('closes the details when the same month is tapped again', async () => {
    const user = userEvent.setup();
    render(<CalendarStrip months={twoYears()} datasets={[power]} />);
    const july = await screen.findByRole('button', { name: 'July, Maize, drought risk' });
    await user.click(july);
    expect(july).toHaveAttribute('aria-expanded', 'true');
    await user.click(july);
    expect(july).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Drought in July')).not.toBeInTheDocument();
  });

  it('has a legend with the four cover states and three hazards, and says bare months are our calculation', async () => {
    render(<CalendarStrip months={twoYears()} datasets={[power]} />);
    const legend = await screen.findByRole('list', { name: 'Legend' });
    for (const text of ['Crop', 'Cover crop', 'Residue', 'Bare soil', 'Drought', 'Heat', 'Frost']) {
      expect(within(legend).getByText(text)).toBeInTheDocument();
    }
    expect(screen.getByText('Bare periods are our calculation from crop calendars.')).toBeInTheDocument();
  });

  it('shows the no-data state with a reason for an empty calendar, never a blank', async () => {
    render(<CalendarStrip months={[]} datasets={[power]} />);
    expect(await screen.findByText('No data')).toBeInTheDocument();
    expect(screen.getByText(/no month-by-month calendar/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('marks a month as missing when the calendar skips it', async () => {
    const months = twoYears().filter((m) => !(m.yearIndex === 1 && m.month === 4));
    render(<CalendarStrip months={months} datasets={[power]} />);
    expect(await screen.findByLabelText('April, no data')).toBeInTheDocument();
  });

  it('leaves out a mark for a hazard at or under the mark share of the hazard rules', async () => {
    const months = twoYears();
    months[6]!.exposure = [{ hazard: 'drought', probability: share(0.1) }];
    render(<CalendarStrip months={months} datasets={[power]} />);
    expect(await screen.findByLabelText('July, Maize')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /July/ })).not.toBeInTheDocument();
  });

  it('renders a rotation from the Iowa fixture: one row per rotation year', async () => {
    const rotation = iowaAnalysis.rotations[0]!;
    render(<CalendarStrip months={rotation.calendar} datasets={fixtureDatasets} label="your rotation" />);
    const table = await screen.findByRole('table', { name: /calendar: your rotation/i });
    expect(within(table).getAllByRole('row')).toHaveLength(rotation.years.length + 1);
  });
});

describe('yearCount', () => {
  it('reads the number of years from the basis of the range', () => {
    expect(yearCount(share(0.2, { range: { low: 0, high: 1, basis: '45 years, 1981–2025' } }))).toBe(45);
    expect(yearCount(share(0.2, { range: { low: 0, high: 1, basis: 'all years 1981–2025' } }))).toBe(45);
  });

  it('gives null when nothing says how many years there are', () => {
    expect(yearCount(share(0.2))).toBeNull();
    expect(yearCount(share(0.2, { range: { low: 0, high: 1, basis: '10th to 90th percentile' } }))).toBeNull();
  });
});
