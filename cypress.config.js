const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: false,
  baseUrl: process.env.CYPRESS_BASE_URL || "http://127.0.0.1:5173",

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
