import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '../../app/store';
import { demoFields } from '../../fixtures';
import { FieldList } from './FieldList';

const real = {
  selectField: useAppStore.getState().selectField,
  removeField: useAppStore.getState().removeField,
  updateField: useAppStore.getState().updateField,
};
const { iowa, poznan } = demoFields;
const rowText = (f: { name: string; areaHa: number }) => `${f.name}, ${f.areaHa.toFixed(1)} ha`;
const rowOf = (f: { name: string; areaHa: number }) => screen.getByText(rowText(f)).closest('li')!;

beforeEach(() => {
  useAppStore.getState().reset();
  useAppStore.setState({
    fields: [iowa, poznan],
    selectedFieldId: iowa.id,
    selectField: vi.fn(real.selectField),
    removeField: vi.fn(real.removeField),
    updateField: vi.fn(real.updateField),
  });
});

afterEach(() => {
  useAppStore.setState(real);
});

describe('FieldList', () => {
  it('shows one row per field with its name and area', async () => {
    render(<FieldList />);
    const list = screen.getByRole('list', { name: 'Your fields' });
    await within(list).findByText(rowText(iowa));
    expect(within(list).getByText(rowText(poznan))).toBeInTheDocument();
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('marks the selected field and selects another one with its radio', async () => {
    const user = userEvent.setup();
    render(<FieldList />);
    expect(await screen.findByRole('radio', { name: rowText(iowa) })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: rowText(poznan) }));

    expect(useAppStore.getState().selectField).toHaveBeenCalledWith(poznan.id);
    expect(await screen.findByRole('radio', { name: rowText(poznan) })).toBeChecked();
  });

  it('selects with the keyboard', async () => {
    const user = userEvent.setup();
    render(<FieldList />);
    (await screen.findByRole('radio', { name: rowText(iowa) })).focus();
    await user.keyboard('{ArrowDown}');
    expect(useAppStore.getState().selectField).toHaveBeenCalledWith(poznan.id);
  });

  it('deletes a field with its Delete button', async () => {
    const user = userEvent.setup();
    render(<FieldList />);
    await screen.findByText(rowText(poznan));

    await user.click(within(rowOf(poznan)).getByRole('button', { name: 'Delete' }));

    expect(useAppStore.getState().removeField).toHaveBeenCalledWith(poznan.id);
    expect(screen.queryByText(rowText(poznan))).not.toBeInTheDocument();
    await screen.findByText(rowText(iowa));
  });

  it('renames a field', async () => {
    const user = userEvent.setup();
    render(<FieldList />);
    await screen.findByText(rowText(iowa));
    const input = within(rowOf(iowa)).getByRole('textbox', { name: 'Field name' });

    await user.clear(input);
    await user.type(input, 'North block{Enter}');

    expect(useAppStore.getState().updateField).toHaveBeenCalledWith(expect.objectContaining({ id: iowa.id, name: 'North block' }));
    await screen.findByText(rowText({ name: 'North block', areaHa: iowa.areaHa }));
  });

  it('saves a new name when the input loses focus', async () => {
    const user = userEvent.setup();
    render(<FieldList />);
    await screen.findByText(rowText(poznan));
    const input = within(rowOf(poznan)).getByRole('textbox', { name: 'Field name' });

    await user.clear(input);
    await user.type(input, 'Meadow');
    await user.tab();

    expect(useAppStore.getState().updateField).toHaveBeenCalledWith(expect.objectContaining({ id: poznan.id, name: 'Meadow' }));
    await screen.findByText(rowText({ name: 'Meadow', areaHa: poznan.areaHa }));
  });

  it('keeps the old name when the new one is blank', async () => {
    const user = userEvent.setup();
    render(<FieldList />);
    await screen.findByText(rowText(iowa));
    const input = within(rowOf(iowa)).getByRole('textbox', { name: 'Field name' });

    await user.clear(input);
    await user.tab();

    expect(useAppStore.getState().updateField).not.toHaveBeenCalled();
    expect(input).toHaveValue(iowa.name);
  });

  it('gives no button a name that contains a field name', async () => {
    render(<FieldList />);
    await screen.findByText(rowText(iowa));
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      const name = button.textContent ?? '';
      const label = `${name} ${button.getAttribute('aria-label') ?? ''}`.toLowerCase();
      for (const field of [iowa, poznan]) expect(label).not.toContain(field.name.toLowerCase());
      expect(button).toHaveAccessibleName('Delete');
    }
    // Delete still tells a screen reader which field it removes, through its description.
    expect(within(rowOf(iowa)).getByRole('button', { name: 'Delete' })).toHaveAccessibleDescription(rowText(iowa));
  });

  it('says so when there are no fields', async () => {
    useAppStore.setState({ fields: [], selectedFieldId: null });
    render(<FieldList />);
    await screen.findByText('No fields yet.');
  });
});
