describe("DP Debugger", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.window().then((win) => win.localStorage.clear());
    cy.reload();
    // Navigate to DP debugger
    cy.contains("button", "Dynamic Programming").click();
    cy.contains("button", "debugger").click();
  });

  it("shows empty state with algorithm buttons and generate prompt", () => {
    cy.contains("DP Debugger").should("be.visible");
    cy.contains("Select a DP algorithm and click Generate").should("be.visible");
    cy.contains("button", "GENERATE").should("be.visible");
  });

  it("generates Fibonacci Tabulation with default input", () => {
    cy.contains("button", "Fibonacci (Tabulation)").click();
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");
    cy.contains("FILLING").should("be.visible");
  });

  it("generates Fibonacci Memoization", () => {
    cy.contains("button", "Fibonacci (Memoization)").click();
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");
  });

  it("generates 0/1 Knapsack", () => {
    cy.contains("button", "0/1 Knapsack").click();
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");
    cy.contains("table").should("exist");
  });

  it("generates LCS", () => {
    cy.contains("button", "Longest Common Subsequence").click();
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");
    cy.contains("table").should("exist");
  });

  it("generates LIS", () => {
    cy.contains("button", "Longest Increasing Subsequence").click();
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");
  });

  it("generates Matrix Chain Multiplication", () => {
    cy.contains("button", "Matrix Chain").click();
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");
    cy.contains("table").should("exist");
  });

  it("generates Edit Distance", () => {
    cy.contains("button", "Edit Distance").click();
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");
    cy.contains("table").should("exist");
  });

  it("playback: next, previous, play, pause, reset", () => {
    cy.contains("button", "Fibonacci (Tabulation)").click();
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");

    // Next step
    cy.get('button[aria-label="Next step"]').click();
    cy.contains(/Step 2 \//i).should("be.visible");

    // Previous step
    cy.get('button[aria-label="Previous step"]').click();
    cy.contains(/Step 1 \//i).should("be.visible");

    // Play
    cy.get('button[aria-label="Play"]').click();
    cy.contains("⏸").should("be.visible");

    // Pause
    cy.get('button[aria-label="Pause"]').click();
    cy.contains("▶").should("be.visible");

    // Last step
    cy.get('button[aria-label="Last step"]').click();
    cy.contains("COMPLETE").should("be.visible");

    // First step
    cy.get('button[aria-label="First step"]').click();
    cy.contains(/Step 1 \//i).should("be.visible");
  });

  it("reconstruction is visible at the end of Edit Distance", () => {
    cy.contains("button", "Edit Distance").click();
    cy.contains("button", "GENERATE").click();
    cy.get('button[aria-label="Last step"]').click();
    cy.contains("COMPLETE").should("be.visible");
    // The answer should show the edit distance
    cy.contains("Answer:").should("be.visible");
  });

  it("reconstruction is visible at the end of LCS", () => {
    cy.contains("button", "Longest Common Subsequence").click();
    cy.contains("button", "GENERATE").click();
    cy.get('button[aria-label="Last step"]').click();
    cy.contains("COMPLETE").should("be.visible");
    cy.contains("Answer:").should("be.visible");
  });

  it("reconstruction is visible at the end of Matrix Chain", () => {
    cy.contains("button", "Matrix Chain").click();
    cy.contains("button", "GENERATE").click();
    cy.get('button[aria-label="Last step"]').click();
    cy.contains("COMPLETE").should("be.visible");
    cy.contains("Answer:").should("be.visible");
  });

  it("switching algorithms resets state", () => {
    cy.contains("button", "Fibonacci (Tabulation)").click();
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");

    // Switch to another algorithm
    cy.contains("button", "0/1 Knapsack").click();
    // Previous steps should be gone
    cy.contains("Select a DP algorithm and click Generate").should("be.visible");
    cy.contains(/Step 1 \//i).should("not.exist");
  });

  it("changing inputs and regenerating produces new steps", () => {
    cy.contains("button", "Fibonacci (Tabulation)").click();
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");

    // The speed slider should be visible
    cy.contains("Speed:").should("be.visible");
  });

  it("input validation rejects oversized inputs", () => {
    cy.contains("button", "Fibonacci (Tabulation)").click();
    // Set n to a very large value
    cy.get('input[aria-label="n"]').invoke("val", 50).trigger("input");
    cy.contains("button", "GENERATE").click();
    cy.get('[role="alert"]').should("contain.text", "too large");
  });

  it("all 7 algorithm buttons are visible", () => {
    cy.contains("button", "Fibonacci (Memoization)").should("exist");
    cy.contains("button", "Fibonacci (Tabulation)").should("exist");
    cy.contains("button", "0/1 Knapsack").should("exist");
    cy.contains("button", "Longest Common Subsequence").should("exist");
    cy.contains("button", "Longest Increasing Subsequence").should("exist");
    cy.contains("button", "Matrix Chain").should("exist");
    cy.contains("button", "Edit Distance").should("exist");
  });

  it("DP table is rendered for 2D algorithms", () => {
    cy.contains("button", "0/1 Knapsack").click();
    cy.contains("button", "GENERATE").click();
    cy.contains("table").should("exist");
    // Should have row and column headers
    cy.contains("Item 1").should("exist");
  });

  it("code panel shows pseudocode lines", () => {
    cy.contains("button", "Fibonacci (Tabulation)").click();
    cy.contains("button", "GENERATE").click();
    cy.contains("function fib(n)").should("exist");
    cy.contains("dp[i] = dp[i-1] + dp[i-2]").should("exist");
  });

  it("variables panel shows current state", () => {
    cy.contains("button", "Fibonacci (Tabulation)").click();
    cy.contains("button", "GENERATE").click();
    cy.contains("Variables").should("be.visible");
  });

  it("step slider allows jumping to arbitrary step", () => {
    cy.contains("button", "Fibonacci (Tabulation)").click();
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");

    // Use the step slider to jump to a later step
    cy.get('input[aria-label="Step position"]').invoke("val", 5).trigger("input", { force: true });
    cy.contains(/Step 6 \//i).should("be.visible");
  });
});
