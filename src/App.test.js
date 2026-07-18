import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import App from './App';

// jsdom lacks scrollTo/scrollIntoView/matchMedia. Plain functions, not
// jest.fn(): CRA sets resetMocks:true, which would strip a
// mockImplementation before the test runs.
beforeAll(() => {
  window.HTMLElement.prototype.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });
});

beforeEach(() => {
  window.localStorage.clear();
});

jest.useFakeTimers();

function renderApp() {
  return render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

function openWidget() {
  fireEvent.click(screen.getByRole('button', { name: /open support chat/i }));
  // Bot reply is delayed 800-1200ms; advance past it.
  act(() => {
    jest.advanceTimersByTime(1500);
  });
}

function clickReply(name) {
  fireEvent.click(screen.getByRole('button', { name }));
  act(() => {
    jest.advanceTimersByTime(1500);
  });
}

test('widget starts as a launcher; opening shows the greeting exactly once (StrictMode-safe)', () => {
  renderApp();

  // Closed by default: launcher present, no conversation yet.
  expect(screen.getByRole('button', { name: /open support chat/i })).toBeInTheDocument();
  expect(screen.queryByText('How can I help you today?')).not.toBeInTheDocument();

  openWidget();

  // Regression guard for the old double-greeting bug: exactly one prompt.
  expect(screen.getAllByText('How can I help you today?')).toHaveLength(1);
});

test('order lookup renders the gamified tracking card', () => {
  renderApp();
  openWidget();

  clickReply(/track order/i);

  fireEvent.change(screen.getByRole('textbox', { name: /type your message/i }), {
    target: { value: '111' }
  });
  fireEvent.click(screen.getByRole('button', { name: /send message/i }));
  act(() => {
    jest.advanceTimersByTime(1500);
  });

  expect(screen.getByText('Order #111')).toBeInTheDocument();
  // 'Shipped' appears as both the status chip and a stepper label
  expect(screen.getAllByText('Shipped').length).toBeGreaterThanOrEqual(1);
  // Journey steps
  for (const step of ['Ordered', 'Processing', 'Delivered']) {
    expect(screen.getByText(step)).toBeInTheDocument();
  }
  // Screen-reader summary announces meaning, not stepper DOM
  expect(screen.getByText(/Order 111: Shipped/)).toBeInTheDocument();
});

test('recommendation quiz walks two steps and reveals a match card with a score', () => {
  renderApp();
  openWidget();

  clickReply(/product recommendations/i);
  expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument();

  clickReply(/hiking & trekking/i);
  expect(screen.getByText(/step 2 of 2/i)).toBeInTheDocument();

  clickReply(/weather protection/i);

  // Reveal phase (650ms) + count-up (700ms)
  act(() => {
    jest.advanceTimersByTime(2000);
  });

  expect(screen.getByText('Waterproof Jackets & Rain Gear')).toBeInTheDocument();
  expect(screen.getByText(/% match/)).toBeInTheDocument();
  // The user's quiz answer stays in the transcript as a chip AND appears
  // as a context chip inside the reveal card
  expect(screen.getAllByText('Hiking & Trekking').length).toBeGreaterThanOrEqual(2);
});

test('theme settings switch mode and persist to localStorage', () => {
  renderApp();
  openWidget();

  fireEvent.click(screen.getByRole('button', { name: /theme settings/i }));
  fireEvent.click(screen.getByRole('button', { name: /dark mode/i }));

  const saved = JSON.parse(window.localStorage.getItem('nso-widget-settings'));
  expect(saved.mode).toBe('dark');

  fireEvent.click(screen.getByRole('button', { name: /ember orange/i }));
  const saved2 = JSON.parse(window.localStorage.getItem('nso-widget-settings'));
  expect(saved2.accent).toBe('ember');
});

test('no emoji in any copy that renders (data + engine)', () => {
  // mockData.js is excluded: it is PRD-locked and its message strings are
  // superseded by the rich order card, so they never render.
  const files = [
    'data/responses.js',
    'data/recommendationTree.js',
    'engine/conversationFlow.js',
    'engine/intentRecognizer.js'
  ];
  const emojiPattern = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
  for (const file of files) {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    expect({ file, hasEmoji: emojiPattern.test(content) }).toEqual({ file, hasEmoji: false });
  }
});
