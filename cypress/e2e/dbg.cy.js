describe("dbg", () => {
  it("prim complete banner", () => {
    cy.viewport(1280, 720);
    cy.visit("/");
    cy.contains("button", "Graphs").click();
    cy.contains("button", "Prim").click();
    cy.contains("button", "GENERATE").click();
    cy.get('button[aria-label="Last step"]').click();
    cy.wait(300);
    cy.get("body").then(($b) => {
      const banners = [...$b.find('[role="status"]')].map((n) => n.textContent.slice(0, 60));
      const lastStep = [...$b.find("span")].filter((s) => /Step \d+ \/ \d+/.test(s.textContent)).map((s) => s.textContent);
      throw new Error("BF banners=" + JSON.stringify(banners) + " step=" + JSON.stringify(lastStep) + " primSelected=" + $b.find("button:contains('Prim')[aria-pressed='true']").length);
    });
  });
});
