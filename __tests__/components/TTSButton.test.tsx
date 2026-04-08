import { render, screen, fireEvent } from '@testing-library/react';
import TTSButton from '@/app/active-learning/components/shared/TTSButton';

// Mock the Web Speech API
const mockCancel = jest.fn();
const mockSpeak = jest.fn();

beforeEach(() => {
  mockCancel.mockClear();
  mockSpeak.mockClear();

  // Provide a working speechSynthesis mock
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    configurable: true,
    value: {
      cancel: mockCancel,
      speak: mockSpeak,
    },
  });
});

describe('TTSButton', () => {
  it('renders a button', () => {
    render(<TTSButton text="学校" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('is enabled when speechSynthesis is supported', () => {
    render(<TTSButton text="学校" />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('calls speechSynthesis.cancel and speak on click', () => {
    render(<TTSButton text="学校" />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockSpeak).toHaveBeenCalledTimes(1);
  });

  it('calls speak with a ja-JP utterance', () => {
    render(<TTSButton text="学校" />);
    fireEvent.click(screen.getByRole('button'));
    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('ja-JP');
    expect(utterance.text).toBe('学校');
  });

  it('has aria-label containing the text', () => {
    render(<TTSButton text="先生" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', expect.stringContaining('先生'));
  });

  it('shows shortcut label "R" when shortcutLabel prop is true', () => {
    render(<TTSButton text="学校" shortcutLabel />);
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('does not show shortcut label when shortcutLabel is false (default)', () => {
    render(<TTSButton text="学校" />);
    expect(screen.queryByText('R')).toBeNull();
  });

  it('is disabled when speechSynthesis is not available', () => {
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      configurable: true,
      value: undefined,
    });
    render(<TTSButton text="学校" />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
