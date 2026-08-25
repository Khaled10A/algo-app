// Tests the standalone landing/ artifact. Excluded from the default run
// (see excludeSpecPattern in cypress.config.js) because it needs its own
// static server. Run with:
//   cd landing && python3 -m http.server 4173
//   CYPRESS_BASE_URL=http://localhost:5173 npx cypress run --e2e --spec cypress/e2e/landing.cy.js
const LANDING_URL = "http://localhost:4173/index.html";

describe("Landing page", () => {
  before(() => {
    cy.request({ url: LANDING_URL, failOnStatusCode: false, timeout: 2000 })
      .then(
        (resp) => {
          if (!resp || resp.status !== 200) {
            cy.log("Landing dev server not running — skipping suite (start: cd landing && python3 -m http.server 4173)");
            Cypress.skip();
          }
        },
        () => {
          cy.log("Landing dev server not running — skipping suite (start: cd landing && python3 -m http.server 4173)");
          Cypress.skip();
        }
      );
  });

  beforeEach(() => {
    cy.visit(LANDING_URL);
  });

  it("renders the full single-viewport composition", () => {
    cy.title().should("eq", "Intelligence Designed To Evolve");
    cy.get(".bg-video source").should(
      "have.attr",
      "src",
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
    );
    cy.get(".headline-line.l1").should("have.text", "Intelligence");
    cy.get(".headline-line.l2").should("have.text", "Designed To Evolve");
    cy.contains("Trusted by 2000+ Enterprises").should("be.visible");
    cy.contains("a.cta", "Get Started").should("be.visible");
    cy.get(".trust-avatar i.fa-microsoft").should("exist");
    cy.get(".trust-avatar i.fa-amazon").should("exist");
    cy.get(".trust-avatar i.fa-google").should("exist");
  });

  it("counts stats up to final values", () => {
    cy.wait(2600);
    cy.get('.stat-value[data-target="120"]').should("have.text", "120ms");
    cy.get('.stat-value[data-target="99.99"]').should("have.text", "99.99%");
    cy.get('.stat-value[data-target="24"]').should("have.text", "24/7");
    cy.get('.stat-value[data-target="2.4"]').should("have.text", "2.4M");
  });

  it("keeps nav links and sign in interactive", () => {
    cy.get(".nav-link").should("have.length", 4);
    cy.get(".nav-link.is-active").should("have.text", "Home");
    cy.get(".sign-in").should("be.visible");
  });
});

describe("Landing mobile", () => {
  beforeEach(() => {
    cy.viewport(375, 720);
    cy.visit("http://localhost:4173/index.html");
  });

  it("hides desktop nav and toggles the sheet menu", () => {
    cy.get(".nav-pill").should("not.be.visible");
    cy.get(".sign-in").should("not.be.visible");
    cy.get(".burger").should("be.visible").click();
    cy.get(".burger").should("have.attr", "aria-expanded", "true");
    cy.get("#mobile-menu").should("be.visible");
    cy.get("#mobile-menu .menu-link").should("have.length", 4);
    cy.get("#mobile-menu .menu-signin").should("be.visible");
    cy.get("body").should("have.class", "menu-open");

    cy.contains("#mobile-menu .menu-link", "Product").click();
    cy.get("#mobile-menu").should("not.be.visible");
    cy.get(".burger").should("have.attr", "aria-expanded", "false");
  });

  it("closes the menu with Escape and on resize past 720px", () => {
    cy.get(".burger").click();
    cy.get("#mobile-menu").should("be.visible");
    cy.get("body").type("{esc}");
    cy.get("#mobile-menu").should("not.be.visible");

    cy.get(".burger").click();
    cy.viewport(900, 720);
    cy.get("#mobile-menu").should("not.be.visible");
  });

  it("shows 2x2 stats grid values on small screens", () => {
    cy.wait(2600);
    cy.get('.stat-value[data-target="2.4"]').should("have.text", "2.4M");
  });
});
