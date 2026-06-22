describe("Algo App", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("runs a sorting benchmark and shows results", () => {
    cy.contains("button", "RUN BENCHMARK").click();
    cy.contains("SORTING RESULTS", { timeout: 5000 }).should("be.visible");
    cy.contains("Insertion Sort").should("be.visible");
    cy.contains("Merge Sort").should("be.visible");
  });

  it("switches to string matching and runs a benchmark", () => {
    cy.contains("button", "String Matching").click();
    cy.contains("button", "RUN BENCHMARK").click();
    cy.contains("STRING MATCHING RESULTS", { timeout: 5000 }).should("be.visible");
    cy.contains("Brute Force").should("be.visible");
    cy.contains("KMP").should("be.visible");
  });
});
