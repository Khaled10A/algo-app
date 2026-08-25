describe("Algo App", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.window().then((win) => win.localStorage.clear());
    cy.reload();
  });

  it("runs a sorting benchmark and shows results", () => {
    cy.contains("button", "RUN BENCHMARK").click();
    cy.contains("SORTING RESULTS", { timeout: 8000 }).should("be.visible");
    cy.contains("Insertion Sort").should("be.visible");
    cy.contains("Merge Sort").should("be.visible");
  });

  it("switches to string matching and runs a benchmark", () => {
    cy.contains("button", "String Matching").click();
    cy.contains("button", "RUN BENCHMARK").click();
    cy.contains("STRING MATCHING RESULTS", { timeout: 8000 }).should("be.visible");
    cy.contains("Brute Force").should("be.visible");
    cy.contains("KMP").should("be.visible");
  });

  it("shows a CANCEL control during a long benchmark and returns to idle when cancelled", () => {
    cy.get('input[placeholder="50,100,150"]').clear().type("30000");
    cy.contains("button", "RUN BENCHMARK").click();
    cy.contains("button", "CANCEL", { timeout: 4000 }).should("be.visible").click();
    cy.contains("button", "RUN BENCHMARK", { timeout: 4000 }).should("be.visible");
    cy.contains("button", "CANCEL").should("not.exist");
  });

  it("surfaces a visible error for pathological inputs instead of silently failing", () => {
    cy.get('input[placeholder="50,100,150"]').clear().type("99999999");
    cy.contains("button", "RUN BENCHMARK").click();
    cy.get('[role="alert"]', { timeout: 4000 })
      .should("be.visible")
      .and("contain.text", "exceeds the maximum");
  });

  it("truncates oversized debugger arrays with a visible notice", () => {
    cy.contains("button", "debugger").first().click();
    cy.contains("button", "Custom").click();
    const bigArray = Array.from({ length: 90 }, (_, i) => i + 1).join(",");
    cy.get('input[aria-label="Custom array"]').clear().type(bigArray);
    cy.contains("button", "GENERATE").click();
    cy.contains(/truncated to the first 64/i).should("be.visible");
    cy.contains(/Step 1 \//i).should("be.visible");
  });

  it("degrades gracefully when persisted results reference unknown algorithm ids", () => {
    cy.window().then((win) => {
      win.localStorage.setItem(
        "algo-app:v1:results:sort",
        JSON.stringify({
          id: "stale",
          kind: "sorting",
          label: "Sort Run #1",
          ts: "00:00:00",
          metric: "time",
          inputMode: "random",
          customArr: null,
          results: { "ghost-sort": { random: [{ n: 10, time: 1, comparisons: 5 }] } },
          sizes: [10],
          algos: ["ghost-sort"],
          types: ["random"],
        })
      );
    });
    cy.reload();
    cy.contains("button", "report").click();
    cy.contains("AUTO-GENERATED REPORT").should("be.visible");
    cy.contains("ghost-sort").should("exist");

    cy.contains("button", "pseudocode").click();
    cy.contains("pseudocode").should("be.visible");
    cy.window().then((win) =>
      win.localStorage.setItem("algo-app:v1:pseudo:algo", JSON.stringify("deleted-algo"))
    );
    cy.reload();
    cy.contains("button", "pseudocode").click();
    cy.contains(/Unknown algorithm/i).should("be.visible");
  });

  it("steps through Dijkstra with distances, priority queue and unreachable badge", () => {
    cy.contains("button", "Graphs").click();
    cy.contains("button", "Dijkstra").click();
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");
    cy.contains("Priority queue").scrollIntoView().should("be.visible");
    cy.contains("Distances").scrollIntoView().should("be.visible");
    cy.get('button[aria-label="Last step"]').click();
    cy.get("svg").should("contain.text", "∞");
    cy.contains("Visit order").scrollIntoView().should("exist");
    cy.contains("span", /Done —/).should("exist");
  });

  it("graph playground: edit graph, run Dijkstra on it, reset and restore", () => {
    cy.contains("button", "Graphs").click();
    cy.contains("button", "Dijkstra").click();

    cy.contains("button", "Clear").click();
    cy.contains(/Graph cleared/i).should("exist");
    cy.contains("Empty graph — add a node to begin").should("be.visible");

    cy.contains("button", "Add node").click();
    cy.contains(/Node A added/i).should("exist");
    cy.contains("button", "Add node").click();
    cy.contains(/Node B added/i).should("exist");

    cy.get('select[aria-label="Edge source"]').select("A");
    cy.get('select[aria-label="Edge target"]').select("B");
    cy.get('input[aria-label="Edge weight"]').clear().type("7");
    cy.contains("button", "Add edge").click();
    cy.contains(/Edge A — B added/i).should("exist");

    cy.contains("button", "Add node").click();
    cy.contains(/Node C added/i).should("exist");
    cy.get('select[aria-label="Edge source"]').select("A");
    cy.get('select[aria-label="Edge target"]').select("C");
    cy.get('input[aria-label="Edge weight"]').clear().type("1");
    cy.contains("button", "Add edge").click();

    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");
    cy.contains("Distances").scrollIntoView().should("be.visible");
    cy.get("svg").should("contain.text", "∞");

    cy.get('button[aria-label="Last step"]').click();
    cy.contains("Distances").scrollIntoView().should("be.visible");
    cy.get("svg").should("contain.text", "0");

    cy.contains("button", "Update weight").scrollIntoView().should("be.visible");
    cy.get('select[aria-label="Edge source"]').select("A");
    cy.get('select[aria-label="Edge target"]').select("B");
    cy.get('input[aria-label="Edge weight"]').clear().type("-5");
    cy.contains("button", "Update weight").click();
    cy.contains(/weight set to -5/i).should("exist");

    cy.contains("button", "GENERATE").click();
    cy.get('[role="status"]').should("contain.text", "negative weights");

    cy.contains("button", "Restore default").click();
    cy.contains(/Default example graph restored/i).should("exist");
    cy.contains("button", "GENERATE").click();
    cy.contains(/Step 1 \//i).should("be.visible");
    cy.get("svg").should("contain.text", "∞");
  });

  it("graph playground: canvas placement and delete mode work", () => {
    cy.contains("button", "Graphs").click();
    cy.contains("button", "Dijkstra").click();
    cy.contains("button", "Clear").click();

    cy.contains("button", "Place node").click();
    cy.get('svg[aria-label="Graph playground"]').click(200, 160);
    cy.contains(/Node A added/i).should("exist");
    cy.get('svg[aria-label="Graph playground"]').click(300, 160);
    cy.contains(/Node B added/i).should("exist");

    cy.contains("button", "Connect").click();
    cy.get('svg[aria-label="Graph playground"] circle[r="22"]').eq(0).click();
    cy.get('svg[aria-label="Graph playground"] circle[r="22"]').eq(1).click();
    cy.contains(/Edge A — B added/i).should("exist");

    cy.contains("button", "Delete").click();
    cy.get('svg[aria-label="Graph playground"] circle[r="22"]').eq(0).click();
    cy.contains(/Node A removed/i).should("exist");
    cy.get('svg[aria-label="Graph playground"]').should("not.contain.text", "A");

    cy.contains("button", "Restore default").click();
    cy.contains(/Default example graph restored/i).should("exist");
  });

  it("groups metric radios so arrow keys move the selection", () => {
    cy.get('input[type="radio"][name="sort-metric"]')
      .first()
      .focus()
      .type("{downArrow}");
    cy.get('input[type="radio"][name="sort-metric"]').eq(1).should("be.checked");
  });
});
