import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DNCDebuggerTab } from './DNCDebuggerTab';

describe('DNCDebuggerTab smoke', () => {
  it('closest pair: generates steps, projects snapshots, and renders the plane', () => {
    render(<DNCDebuggerTab isDark={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'GENERATE' }));
    expect(screen.getByText('Coordinate plane')).toBeInTheDocument();

    const next = screen.getByRole('button', { name: 'Next step' });
    for (let i = 0; i < 60; i += 1) {
      fireEvent.click(next);
    }

    expect(screen.getAllByText('Variables').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Memory').length).toBeGreaterThan(0);
    expect(screen.getByText('Recursion Tree')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Last step' }));
    expect(screen.getByText(/Step \d+ \/ \d+/)).toBeInTheDocument();
  });

  it('closest pair: shows a validation notice for invalid custom JSON', () => {
    render(<DNCDebuggerTab isDark={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Custom JSON' }));
    fireEvent.change(screen.getByLabelText('Custom points JSON'), {
      target: { value: 'not json' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'GENERATE' }));

    expect(screen.getByText(/Invalid custom input/)).toBeInTheDocument();
  });

  it('karatsuba: multiplies, renders the recursive view, and validates', () => {
    render(<DNCDebuggerTab isDark={false} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Karatsuba Multiplication' }),
    );
    fireEvent.change(screen.getByLabelText('Karatsuba x'), {
      target: { value: '1234' },
    });
    fireEvent.change(screen.getByLabelText('Karatsuba y'), {
      target: { value: '5678' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'GENERATE' }));

    // Recursive-multiplication view renders and steps through every phase.
    expect(screen.getByText('Recursive multiplication')).toBeInTheDocument();
    const next = screen.getByRole('button', { name: 'Next step' });
    for (let i = 0; i < 120; i += 1) {
      fireEvent.click(next);
    }

    // Final frame shows the exact product (combine box + return banner).
    fireEvent.click(screen.getByRole('button', { name: 'Last step' }));
    expect(screen.getAllByText(/7006652/).length).toBeGreaterThan(0);

    // Oversized input is rejected, not truncated.
    fireEvent.change(screen.getByLabelText('Karatsuba x'), {
      target: { value: '9'.repeat(30) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'GENERATE' }));
    expect(screen.getByText(/limit 16/)).toBeInTheDocument();

    // Malformed input is rejected.
    fireEvent.change(screen.getByLabelText('Karatsuba x'), {
      target: { value: '12x' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'GENERATE' }));
    expect(screen.getByText(/plain integer/)).toBeInTheDocument();
  });

  it('strassen: generates steps, renders the matrix view, and validates', () => {
    render(<DNCDebuggerTab isDark={false} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: '[Advanced] Strassen Matrix Multiplication',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'GENERATE' }));

    // Matrix visualizer renders and steps through the phases.
    expect(
      screen.getByText('Strassen matrix multiplication'),
    ).toBeInTheDocument();
    const next = screen.getByRole('button', { name: 'Next step' });
    for (let i = 0; i < 80; i += 1) {
      fireEvent.click(next);
    }

    fireEvent.click(screen.getByRole('button', { name: 'Last step' }));
    expect(screen.getByText(/Step \d+ \/ \d+/)).toBeInTheDocument();
    expect(screen.getByText('Recursion Tree')).toBeInTheDocument();

    // Non-power-of-two matrices are rejected, not silently padded.
    fireEvent.click(screen.getByRole('button', { name: 'Custom JSON' }));
    fireEvent.change(screen.getByLabelText('Custom matrices JSON'), {
      target: {
        value:
          '[[[1,2,3],[4,5,6],[7,8,9]],[[1,0,0],[0,1,0],[0,0,1]]]',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'GENERATE' }));
    expect(screen.getByText(/not a power of two/)).toBeInTheDocument();
  });
});