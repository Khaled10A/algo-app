/**
 * Greedy algorithm descriptors.
 *
 * Placeholder descriptors for the three greedy algorithms. The `debug` and
 * `steps` functions will be wired up once the individual algorithms are
 * implemented. Until then the descriptors satisfy the registry contract so
 * the Greedy domain appears in the sidebar and the debugger tab can list the
 * algorithms (with a "coming soon" notice).
 */

export const HUFFMAN_CODE_LINES = [
  { n: 0, code: '// Huffman coding — build prefix code tree' },
  { n: 1, code: '// Calculate character frequencies' },
  { n: 2, code: '// Build min-priority queue from frequencies' },
  { n: 3, code: '// Merge two lowest-frequency nodes' },
  { n: 4, code: '// Assign Huffman codes via tree traversal' },
  { n: 5, code: '// Encode text with prefix codes' },
];

export const HUFFMAN_PSEUDOCODE = `HuffmanCoding(text):
  // Step 1: Calculate character frequencies
  frequencies = empty map
  for each character c in text:
    frequencies[c] = frequencies[c] + 1
  
  // Step 2: Create leaf nodes and insert into min-priority queue
  queue = empty min-priority queue
  for each (character, frequency) in frequencies:
    node = leaf(frequency, character)
    queue.enqueue(frequency, node)
  
  // Special case: single unique character
  if queue.size == 1:
    leaf = dequeue(queue)
    root = internal(leaf.frequency, leaf, null)
  else:
    // Step 3: Build Huffman tree
    while queue.size > 1:
      left  = dequeue_min(queue)   // Two lowest-frequency nodes
      right = dequeue_min(queue)
      merged_freq = left.frequency + right.frequency
      parent = internal(merged_freq, left, right)
      enqueue(queue, merged_freq, parent)
    root = dequeue_min(queue)
  
  // Step 4: Assign Huffman codes via DFS
  codes = empty list
  stack = [(root, "")]
  while stack is not empty:
    (node, prefix) = stack.pop()
    if node.is_leaf:
      node.code = prefix (or "0" if prefix is empty)
      codes.append((node.character, node.code))
    if node.right:
      stack.push((node.right, prefix + "1"))
    if node.left:
      stack.push((node.left, prefix + "0"))
  
  // Step 5: Encode the input
  encoded = ""
  for each character c in text:
    encoded = encoded + codes[c].code
  
  return (codes, encoded)`;

export const HUFFMAN_DESCRIPTION =
  'Compresses data by building a variable-length prefix code from symbol ' +
  'frequencies. A min-priority queue repeatedly merges the two least-frequent ' +
  'nodes into a new internal node until one tree remains; the resulting Huffman ' +
  'tree yields shorter codes for more frequent symbols. As a greedy algorithm, ' +
  'each merge is the locally optimal choice — combining the two smallest ' +
  'frequencies — which provably produces an optimal prefix code.';

export const HUFFMAN_DEFAULT_INPUT = {
  symbols: ['a', 'b', 'c', 'd', 'e', 'f'],
  frequencies: [5, 9, 12, 13, 16, 45],
};

export const ACTIVITY_CODE_LINES = [
  { n: 0, code: '// Activity selection — greedy interval scheduling' },
  { n: 1, code: '// Sort activities by finish time (ascending)' },
  { n: 2, code: '// Select first activity, then greedily pick compatible ones' },
  { n: 3, code: '// An activity is compatible if its start >= last selected finish' },
];

export const ACTIVITY_PSEUDOCODE = `ActivitySelection(activities):
  // Input: array of activities with start and finish times
  // Output: maximum-size set of mutually compatible activities
  
  // Step 1: Sort activities by finish time (ascending)
  sorted = sort(activities, by finish time ascending)
  
  // Step 2: Select first activity (greedy choice)
  selected = [sorted[0]]
  lastFinish = sorted[0].finish
  
  // Step 3: Consider remaining activities in sorted order
  for i = 1 to sorted.length - 1:
    current = sorted[i]
    
    // Greedy decision: is current activity compatible?
    if current.start >= lastFinish:
      // Compatible: select it and update last finish time
      selected.append(current)
      lastFinish = current.finish
    else:
      // Incompatible: skip it (reject)
      reject(current)
  
  return selected
  
  // Time Complexity: O(n log n) for sorting + O(n) for selection = O(n log n)
  // Space Complexity: O(n) for storing activities and selected set
  // 
  // The greedy choice is optimal: selecting the activity with earliest finish
  // time that is compatible leaves maximum room for remaining activities.`;

export const ACTIVITY_DESCRIPTION =
  'Given a set of activities with start and finish times, selects the maximum ' +
  'number of mutually compatible activities. The greedy choice is always to pick ' +
  'the activity with the earliest finish time that is compatible with the last ' +
  'selected activity; this leaves the maximum possible room for the remaining ' +
  'activities and provably yields an optimal solution.';

export const ACTIVITY_DEFAULT_INPUT = [
  { start: 1, finish: 4 },
  { start: 3, finish: 5 },
  { start: 0, finish: 6 },
  { start: 5, finish: 7 },
  { start: 3, finish: 9 },
  { start: 5, finish: 9 },
  { start: 6, finish: 10 },
  { start: 8, finish: 11 },
  { start: 8, finish: 12 },
  { start: 2, finish: 14 },
  { start: 12, finish: 16 },
];

export const FRACTIONAL_KNAPSACK_CODE_LINES = [
  { n: 0, code: '// Fractional knapsack — greedy by value/weight ratio' },
  { n: 1, code: '// Calculate value/weight ratio for each item' },
  { n: 2, code: '// Sort items by ratio descending' },
  { n: 3, code: '// Take full items while they fit; take fraction of last item' },
  { n: 4, code: '// Unlike 0/1 knapsack, items can be partially taken' },
];

export const FRACTIONAL_KNAPSACK_PSEUDOCODE = `FractionalKnapsack(items, capacity):
  // Input: items with weight and value, knapsack capacity
  // Output: maximum total value (items can be taken fractionally)
  
  // Educational contrast with 0/1 Knapsack:
  // - Fractional Knapsack: items can be partially taken, greedy works
  // - 0/1 Knapsack: items taken whole or not at all, requires DP
  
  // Step 1: Calculate value/weight ratio for each item
  for each item in items:
    item.ratio = item.value / item.weight
  
  // Step 2: Sort items by ratio descending (greedy criterion)
  sorted = sort(items, by ratio descending)
  
  // Step 3: Greedily select items
  totalValue = 0
  remaining = capacity
  
  for each item in sorted:
    if remaining <= 0:
      break  // Knapsack full
    
    if item.weight <= remaining:
      // Take the entire item (greedy choice: highest ratio fits)
      taken = item.weight
      fraction = 1 (full item)
      totalValue += item.value
      remaining -= item.weight
    else:
      // Take a fraction of the item (fills remaining capacity)
      fraction = remaining / item.weight
      taken = remaining
      totalValue += item.value * fraction
      remaining = 0
  
  return totalValue
  
  // Time Complexity: O(n log n) for sorting + O(n) for selection = O(n log n)
  // Space Complexity: O(n) for storing items and solution
  // 
  // Greedy choice is optimal: taking the item with highest value/weight ratio
  // maximizes value per unit of weight, which is optimal for fractional case.`;

export const FRACTIONAL_KNAPSACK_DESCRIPTION =
  ' Maximizes the total value of items placed into a knapsack of limited ' +
  'capacity, where items can be taken fractionally. The greedy choice is to ' +
  'always take as much as possible of the item with the highest value-to-weight ' +
  'ratio; this is optimal for the fractional variant (but not for 0/1 knapsack, ' +
  'which requires dynamic programming).';

export const FRACTIONAL_KNAPSACK_DEFAULT_INPUT = {
  items: [
    { weight: 10, value: 60 },
    { weight: 20, value: 100 },
    { weight: 30, value: 120 },
  ],
  capacity: 50,
};

export const huffmanDescriptors = [
  {
    id: 'huffman-coding',
    name: 'Huffman Coding',
    category: 'greedy',
    color: '#8b5cf6',
    complexity: {
      best: 'O(n log n)',
      average: 'O(n log n)',
      worst: 'O(n log n)',
      space: 'O(n)',
      paradigm: 'Greedy (prefix codes)',
    },
    description: HUFFMAN_DESCRIPTION,
    pseudocode: HUFFMAN_PSEUDOCODE,
    codeLines: HUFFMAN_CODE_LINES,
    defaultInput: HUFFMAN_DEFAULT_INPUT,
  },
];

export const activityDescriptors = [
  {
    id: 'activity-selection',
    name: 'Activity Selection',
    category: 'greedy',
    color: '#06b6d4',
    complexity: {
      best: 'O(n log n)',
      average: 'O(n log n)',
      worst: 'O(n log n)',
      space: 'O(n)',
      paradigm: 'Greedy (interval scheduling)',
    },
    description: ACTIVITY_DESCRIPTION,
    pseudocode: ACTIVITY_PSEUDOCODE,
    codeLines: ACTIVITY_CODE_LINES,
    defaultInput: ACTIVITY_DEFAULT_INPUT,
  },
];

export const fractionalKnapsackDescriptors = [
  {
    id: 'fractional-knapsack',
    name: 'Fractional Knapsack',
    category: 'greedy',
    color: '#f59e0b',
    complexity: {
      best: 'O(n log n)',
      average: 'O(n log n)',
      worst: 'O(n log n)',
      space: 'O(n)',
      paradigm: 'Greedy (fractional selection)',
    },
    description: FRACTIONAL_KNAPSACK_DESCRIPTION,
    pseudocode: FRACTIONAL_KNAPSACK_PSEUDOCODE,
    codeLines: FRACTIONAL_KNAPSACK_CODE_LINES,
    defaultInput: FRACTIONAL_KNAPSACK_DEFAULT_INPUT,
  },
];

export const greedyDescriptors = [
  ...huffmanDescriptors,
  ...activityDescriptors,
  ...fractionalKnapsackDescriptors,
];
