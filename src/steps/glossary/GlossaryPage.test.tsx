import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import terms from './terms.en.json';
import { GlossaryPage } from './GlossaryPage';

describe('GlossaryPage', () => {
  it('lists every term alphabetically with its sentence under the heading', async () => {
    render(<GlossaryPage />);
    expect(await screen.findByRole('heading', { name: 'Words used in this tool' })).toBeInTheDocument();
    expect(await screen.findByText(terms['soil-wetness-index'].explanation)).toBeInTheDocument();

    const labels = within(screen.getByRole('list', { name: 'Words used in this tool' }))
      .getAllByRole('term')
      .map((el) => el.textContent ?? '');
    expect(labels).toHaveLength(Object.keys(terms).length);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    expect(labels).toEqual(sorted);
    expect(labels[0]).toBe('anomaly');
  });

  it('offers a way back to the step and moves focus to the heading', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<GlossaryPage backToStep={3} onBack={onBack} />);

    expect(await screen.findByRole('heading', { name: 'Words used in this tool' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Back to step 3' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('has no back button when nothing to go back to', async () => {
    render(<GlossaryPage />);
    await screen.findByText('Words used in this tool');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
