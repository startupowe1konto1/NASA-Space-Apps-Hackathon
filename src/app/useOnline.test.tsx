import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { useAppStore } from './store';
import { useOnline } from './useOnline';

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => value });
}

function Probe() {
  return <p>{useOnline() ? 'online' : 'offline'}</p>;
}

afterEach(() => setNavigatorOnline(true));

describe('useOnline', () => {
  it('starts from navigator.onLine and follows the offline and online events', () => {
    setNavigatorOnline(false);
    render(<Probe />);
    expect(screen.getByText('offline')).toBeInTheDocument();

    act(() => {
      setNavigatorOnline(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.getByText('online')).toBeInTheDocument();

    act(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText('offline')).toBeInTheDocument();
  });
});

describe('step 5 offline', () => {
  beforeEach(() => useAppStore.getState().reset());

  it('shows "No connection" and does not start the analysis while offline', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Iowa demo field' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Yes, use these crops' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    act(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event('offline'));
    });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('No connection')).toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(useAppStore.getState().analysis.status).toBe('idle');

    act(() => {
      setNavigatorOnline(true);
      window.dispatchEvent(new Event('online'));
    });
    await screen.findByText('Your rotation', undefined, { timeout: 3000 });
  });
});
