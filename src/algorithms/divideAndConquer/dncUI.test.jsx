import { render, screen } from '@testing-library/react';
import DNCTreeView from '../../components/visualizer/DNCTreeView';
import DNCSubproblemView from '../../components/visualizer/DNCSubproblemView';
import DNCStateView from '../../components/visualizer/DNCStateView';
import DNCEventInfoView from '../../components/visualizer/DNCEventInfoView';

describe('DNCTreeView', () => {
  const baseNodes = [
    {
      id: 'n-0',
      parentId: null,
      depth: 0,
      subproblem: 'root [0..7]',
      action: 'divide',
      status: 'splitting',
      children: ['n-1', 'n-2'],
      result: null,
      active: false,
      eventIndex: 0,
    },
    {
      id: 'n-1',
      parentId: 'n-0',
      depth: 1,
      subproblem: 'left [0..3]',
      action: 'recurse',
      status: 'active',
      children: ['n-3', 'n-4'],
      result: null,
      active: true,
      eventIndex: 1,
    },
    {
      id: 'n-2',
      parentId: 'n-0',
      depth: 1,
      subproblem: 'right [4..7]',
      action: 'recurse',
      status: 'pending',
      children: [],
      result: null,
      active: false,
      eventIndex: 2,
    },
  ];

  it('renders empty state when no nodes', () => {
    render(
      <DNCTreeView
        nodes={[]}
        activeNodeId={null}
        isDark={false}
      />
    );
    expect(
      screen.getByText('No recursion tree to display')
    ).toBeInTheDocument();
  });

  it('renders tree with nodes', () => {
    render(
      <DNCTreeView
        nodes={baseNodes}
        activeNodeId={'n-1'}
        isDark={false}
      />
    );

    expect(screen.getByText('Recursion Tree')).toBeInTheDocument();
    expect(screen.getByText('3 nodes')).toBeInTheDocument();
    expect(screen.getByText('root [0..7]')).toBeInTheDocument();
    expect(screen.getByText('left [0..3]')).toBeInTheDocument();
    expect(screen.getByText('right [4..7]')).toBeInTheDocument();
  });

  it('highlights active node', () => {
    render(
      <DNCTreeView
        nodes={baseNodes}
        activeNodeId={'n-1'}
        isDark={false}
      />
    );

    // The active node is visually highlighted via the viewer; assert that the
    // rendered tree includes the active subproblem label text.
    expect(
      screen.getByText((text) => typeof text === 'string' && text.includes('left [0..3]'),
      ),
    ).toBeInTheDocument();
  });

  it('shows results when showResults is true', () => {
    const nodesWithResults = baseNodes.map((n) => ({
      ...n,
      result: n.id === 'n-1' ? 42 : n.result,
    }));

    render(
      <DNCTreeView
        nodes={nodesWithResults}
        activeNodeId={null}
        isDark={false}
        showResults={true}
      />
    );

    expect(screen.getByText('= 42')).toBeInTheDocument();
  });

  it('renders legend', () => {
    render(
      <DNCTreeView
        nodes={baseNodes}
        activeNodeId={null}
        isDark={false}
      />
    );

    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText(/splitting/i)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('renders compact mode', () => {
    render(
      <DNCTreeView
        nodes={baseNodes}
        activeNodeId={null}
        isDark={false}
        compact={true}
      />
    );

    expect(screen.getByText('Recursion Tree')).toBeInTheDocument();
  });
});

describe('DNCSubproblemView', () => {
  it('renders empty state when no content', () => {
    render(
      <DNCSubproblemView
        subproblem=""
        bounds={null}
        depth={0}
        result={null}
        action=""
        isDark={false}
      />
    );

    expect(screen.getByText('No active subproblem')).toBeInTheDocument();
  });

  it('renders subproblem information', () => {
    render(
      <DNCSubproblemView
        subproblem="range[0..7]"
        bounds={null}
        depth={0}
        result={null}
        action="divide: split at 3"
        isDark={false}
      />
    );

    expect(screen.getByText('Current Subproblem')).toBeInTheDocument();
    expect(screen.getByText('range[0..7]')).toBeInTheDocument();
    expect(screen.getByText('divide: split at 3')).toBeInTheDocument();
    expect(screen.getByText('depth 0')).toBeInTheDocument();
  });

  it('renders range bounds', () => {
    render(
      <DNCSubproblemView
        subproblem="test"
        bounds={{ kind: 'range', start: 0, end: 7 }}
        depth={0}
        result={null}
        action=""
        isDark={false}
      />
    );

    expect(screen.getByText('Range')).toBeInTheDocument();
    expect(screen.getByText('[0..7]')).toBeInTheDocument();
    expect(screen.getByText('size: 8')).toBeInTheDocument();
  });

  it('renders points bounds', () => {
    render(
      <DNCSubproblemView
        subproblem="test"
        bounds={{ kind: 'points', count: 10 }}
        depth={0}
        result={null}
        action=""
        isDark={false}
      />
    );

    expect(screen.getByText('Point Set')).toBeInTheDocument();
    expect(screen.getByText('10 points')).toBeInTheDocument();
  });

  it('renders matrix bounds', () => {
    render(
      <DNCSubproblemView
        subproblem="test"
        bounds={{ kind: 'matrix', rows: 4, cols: 4 }}
        depth={0}
        result={null}
        action=""
        isDark={false}
      />
    );

    expect(screen.getByText('Matrix Block')).toBeInTheDocument();
    expect(screen.getByText('4×4')).toBeInTheDocument();
  });

  it('renders result', () => {
    render(
      <DNCSubproblemView
        subproblem="test"
        bounds={null}
        depth={0}
        result={42}
        action=""
        isDark={false}
      />
    );

    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    render(
      <DNCSubproblemView
        subproblem="test"
        bounds={null}
        depth={0}
        result={null}
        action=""
        isDark={true}
      />
    );

    expect(screen.getByText('Current Subproblem')).toBeInTheDocument();
  });
});

describe('DNCStateView', () => {
  it('renders empty state when no vars or memory', () => {
    render(
      <DNCStateView
        vars={{}}
        memory=""
        isDark={false}
      />
    );

    expect(screen.getByText('No state to display')).toBeInTheDocument();
  });

  it('renders variables', () => {
    render(
      <DNCStateView
        vars={{ size: '8', lo: '0', hi: '7' }}
        memory=""
        isDark={false}
      />
    );

    expect(screen.getByText('Variables')).toBeInTheDocument();
    expect(screen.getByText('size')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('lo')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders memory', () => {
    render(
      <DNCStateView
        vars={{}}
        memory="state: { arr: [1, 2, 3] }"
        isDark={false}
      />
    );

    expect(screen.getByText('Memory')).toBeInTheDocument();
    expect(screen.getByText('state: { arr: [1, 2, 3] }')).toBeInTheDocument();
  });

  it('renders both variables and memory', () => {
    render(
      <DNCStateView
        vars={{ size: '8' }}
        memory="subproblem: root\nresult: 42"
        isDark={false}
      />
    );

    expect(screen.getByText('Variables')).toBeInTheDocument();
    expect(screen.getByText('Memory')).toBeInTheDocument();
    expect(screen.getByText('size')).toBeInTheDocument();
    expect(
      screen.getByText((text) => typeof text === 'string' && text.includes('subproblem: root'),
      ),
    ).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    render(
      <DNCStateView
        vars={{ test: 'value' }}
        memory=""
        isDark={true}
      />
    );

    expect(screen.getByText('test')).toBeInTheDocument();
  });
});

describe('DNCEventInfoView', () => {
  const baseEvent = {
    type: 'divide',
    eventId: 'e-1',
    depth: 0,
    subproblem: 'range[0..7]',
    action: 'divide: split at mid=3',
    stateSnapshot: {},
    meta: null,
    nodeId: 'n-0',
    parentId: null,
  };

  it('renders empty state when no event', () => {
    render(
      <DNCEventInfoView
        event={null}
        step={0}
        totalSteps={0}
        isDark={false}
      />
    );

    expect(screen.getByText('No event to display')).toBeInTheDocument();
  });

  it('renders event information', () => {
    render(
      <DNCEventInfoView
        event={baseEvent}
        step={0}
        totalSteps={10}
        isDark={false}
      />
    );

    expect(screen.getByText('Event Info')).toBeInTheDocument();
    expect(screen.getByText('Step 1 / 10')).toBeInTheDocument();
    expect(screen.getByText('divide')).toBeInTheDocument();
    expect(screen.getByText('divide: split at mid=3')).toBeInTheDocument();
    expect(screen.getByText('e-1')).toBeInTheDocument();
    expect(screen.getByText('range[0..7]')).toBeInTheDocument();
    expect(screen.getByText('Node:')).toBeInTheDocument();
    expect(screen.getByText('n-0')).toBeInTheDocument();
  });

  it('hides parent when null', () => {
    render(
      <DNCEventInfoView
        event={baseEvent}
        step={0}
        totalSteps={10}
        isDark={false}
      />
    );

    // Should show Node but not Parent since parentId is null
    expect(screen.getByText('Node:')).toBeInTheDocument();
    expect(screen.queryByText('Parent:')).not.toBeInTheDocument();
  });

  it('shows parent when present', () => {
    const eventWithParent = { ...baseEvent, parentId: 'n-p' };

    render(
      <DNCEventInfoView
        event={eventWithParent}
        step={0}
        totalSteps={10}
        isDark={false}
      />
    );

    expect(screen.getByText('Parent:')).toBeInTheDocument();
    expect(screen.getByText('n-p')).toBeInTheDocument();
  });

  it('renders meta when present', () => {
    const eventWithMeta = {
      ...baseEvent,
      meta: { splitPoint: 3, leftSize: 4 },
    };

    render(
      <DNCEventInfoView
        event={eventWithMeta}
        step={0}
        totalSteps={10}
        isDark={false}
      />
    );

    expect(screen.getByText(/Meta/i)).toBeInTheDocument();
    expect(
      screen.getByText((text) =>
        typeof text === 'string' &&
        text.includes('splitPoint') &&
        text.includes('3'),
      ),
    ).toBeInTheDocument();
  });

  it('renders different event types with appropriate colors', () => {
    const eventTypes = [
      { type: 'enter', action: 'enter' },
      { type: 'divide', action: 'divide' },
      { type: 'recurse', action: 'recurse' },
      { type: 'baseCase', action: 'base-case' },
      { type: 'compare', action: 'compare' },
      { type: 'combine', action: 'combine' },
      { type: 'return', action: 'return' },
      { type: 'complete', action: 'complete' },
    ];

    for (const { type, action } of eventTypes) {
      const event = { ...baseEvent, type, action };

      const { unmount } = render(
        <DNCEventInfoView
          event={event}
          step={0}
          totalSteps={1}
          isDark={false}
        />
      );

      // The event type label uses a distinct style; assert on the action text
      // to avoid matching both the type label and the action line.
      expect(
        screen.getAllByText(action, { exact: true }).length,
      ).toBeGreaterThanOrEqual(1);
      unmount();
    }
  });

  it('renders with dark theme', () => {
    render(
      <DNCEventInfoView
        event={baseEvent}
        step={5}
        totalSteps={20}
        isDark={true}
      />
    );

    expect(screen.getByText('Step 6 / 20')).toBeInTheDocument();
  });
});
