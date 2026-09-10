import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { GreedyDebuggerTab } from './GreedyDebuggerTab';

describe('GreedyDebuggerTab smoke test', () => {
  it('renders without crashing', () => {
    const { container } = render(<GreedyDebuggerTab isDark={true} />);
    expect(container).toBeDefined();
  });

  it('displays Greedy Algorithms Debugger title', () => {
    const { container } = render(<GreedyDebuggerTab isDark={true} />);
    expect(container.textContent).toContain('Greedy Algorithms Debugger');
  });

  it('shows algorithm selector buttons', () => {
    const { container } = render(<GreedyDebuggerTab isDark={true} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    // Should have at least 3 algorithm buttons + GENERATE button
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });

  it('shows GENERATE button', () => {
    const { container } = render(<GreedyDebuggerTab isDark={true} />);
    const buttons = container.querySelectorAll('button');
    const generateBtn = Array.from(buttons).find(btn => btn.textContent === 'GENERATE');
    expect(generateBtn).toBeDefined();
  });

  it('shows playback speed control', () => {
    const { container } = render(<GreedyDebuggerTab isDark={true} />);
    expect(container.textContent).toContain('Speed');
  });

  it('shows empty state message', () => {
    const { container } = render(<GreedyDebuggerTab isDark={true} />);
    expect(container.textContent).toContain('Select a Greedy algorithm and click Generate');
  });

  it('shows Huffman input field', () => {
    const { container } = render(<GreedyDebuggerTab isDark={true} />);
    expect(container.textContent).toContain('Input text');
    expect(container.textContent).toContain('200');
  });
});
