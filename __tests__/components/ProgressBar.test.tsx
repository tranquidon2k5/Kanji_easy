import { render, screen } from '@testing-library/react';
import ProgressBar from '@/app/active-learning/components/shared/ProgressBar';

describe('ProgressBar', () => {
  it('renders current / total text', () => {
    render(<ProgressBar current={3} total={12} />);
    expect(screen.getByText('3 / 12')).toBeInTheDocument();
  });

  it('renders 0 / 0 when both are zero', () => {
    render(<ProgressBar current={0} total={0} />);
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
  });

  it('has a progressbar role element', () => {
    render(<ProgressBar current={6} total={12} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
  });

  it('sets aria-valuenow to current', () => {
    render(<ProgressBar current={4} total={10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4');
  });

  it('sets aria-valuemin to 0', () => {
    render(<ProgressBar current={4} total={10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
  });

  it('sets aria-valuemax to total', () => {
    render(<ProgressBar current={4} total={10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '10');
  });

  it('shows 50% width when current is half of total', () => {
    const { container } = render(<ProgressBar current={6} total={12} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveStyle({ width: '50%' });
  });

  it('shows 0% width when total is 0 (avoids divide-by-zero)', () => {
    const { container } = render(<ProgressBar current={0} total={0} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveStyle({ width: '0%' });
  });

  it('shows 100% width when current equals total', () => {
    const { container } = render(<ProgressBar current={10} total={10} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveStyle({ width: '100%' });
  });

  it('applies custom colorClass when provided', () => {
    const { container } = render(
      <ProgressBar current={5} total={10} colorClass="bg-blue-500" />
    );
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar?.className).toContain('bg-blue-500');
  });

  it('uses default green color when colorClass is not provided', () => {
    const { container } = render(<ProgressBar current={5} total={10} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar?.className).toContain('bg-green-500');
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(
      <ProgressBar current={5} total={10} className="my-custom-class" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('my-custom-class');
  });
});
