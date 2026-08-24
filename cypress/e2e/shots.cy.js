const OVERRIDE = "*,*::before,*::after{backdrop-filter:none !important;-webkit-backdrop-filter:none !important} .glass-toolbar{background:rgba(30,30,33,0.97) !important} .glass-sidebar{background:rgba(28,28,30,0.97) !important} .glass-floating{background:rgba(40,40,43,0.97) !important} .glass-modal{background:rgba(36,36,38,0.98) !important} .glass-thin{background:rgba(44,44,47,0.96) !important} body[data-theme='light'] .glass-toolbar{background:rgba(252,252,254,0.98) !important} body[data-theme='light'] .glass-sidebar{background:rgba(248,248,250,0.98) !important} body[data-theme='light'] .glass-floating{background:rgba(255,255,255,0.97) !important} body[data-theme='light'] .glass-thin{background:rgba(255,255,255,0.96) !important}";
function prep(doc) {
  const s = doc.createElement("style");
  s.textContent = OVERRIDE;
  doc.head.appendChild(s);
}
const shots = [
  ["benchmark-sort", () => {}],
  ["benchmark-results", () => { cy.contains("button", "RUN BENCHMARK").click(); cy.contains("SORTING RESULTS", { timeout: 8000 }).should("exist"); }],
  ["benchmark-string", () => cy.contains("button", "String Matching").click()],
  ["visualizer", () => { cy.contains("button", "visualizer").click(); cy.contains("button", /Generate array/i).click(); cy.wait(900); }],
  ["complexity", () => cy.contains("button", "complexity").click()],
  ["pseudocode", () => cy.contains("button", "pseudocode").click()],
  ["history", () => { cy.contains("button", "history").click(); }],
  ["report", () => cy.contains("button", "report").click()],
  ["debugger", () => { cy.contains("button", "debugger").click(); cy.contains("button", "GENERATE").click(); cy.wait(500); }],
  ["graphs", () => { cy.contains("button", "Graphs").click(); cy.contains("button", "GENERATE").click(); cy.wait(500); }],
  ["ai", () => cy.contains("button", "ai").click()],
  ["light-benchmark", () => cy.get('[aria-label="Toggle theme"]').click()],
];
describe("material pass", () => {
  shots.forEach(([name, setup]) => {
    it(name, () => {
      cy.viewport(1440, 900);
      cy.visit("/");
      cy.document().then(prep);
      cy.wait(500);
      setup();
      cy.wait(600);
      cy.screenshot("m-" + name, { overwrite: true });
    });
  });
});
