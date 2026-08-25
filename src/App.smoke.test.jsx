// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("App shell", () => {
  it("renders the header and sorting benchmark defaults", () => {
    render(<App />);
    expect(screen.getByText("ALGO BENCHMARK")).toBeTruthy();
    expect(screen.getByRole("button", { name: /RUN BENCHMARK/ })).toBeTruthy();
    expect(screen.getByLabelText("Insertion Sort").checked).toBe(true);
  });

  it("runs a string matching benchmark end-to-end", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "String Matching" }));
    fireEvent.click(screen.getByRole("button", { name: /RUN BENCHMARK/ }));
    await waitFor(
      () => expect(screen.getByText(/STRING MATCHING RESULTS/i)).toBeTruthy(),
      { timeout: 5000 }
    );
    expect(screen.getAllByText("Brute Force").length).toBeGreaterThan(0);
  });

  it("opens the memory debugger and generates steps", () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "debugger" })[0]);
    expect(screen.getByText(/MEMORY DEBUGGER/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /GENERATE/i }));
    expect(screen.getByText(/Step 1 \//i)).toBeTruthy();
  });

  it("exposes the graph debugger under the Graphs domain", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Graphs" }));
    expect(screen.getByText(/GRAPH DEBUGGER/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /GENERATE/i }));
    expect(screen.getByText(/Step 1 \//i)).toBeTruthy();
  });

  it("renders report, history, pseudocode, complexity and AI tabs after a run", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /RUN BENCHMARK/ }));
    await waitFor(() => expect(screen.getByText(/SORTING RESULTS/i)).toBeTruthy(), { timeout: 5000 });

    fireEvent.click(screen.getAllByRole("button", { name: "report" })[0]);
    expect(screen.getByText(/AUTO-GENERATED REPORT/i)).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "history" })[0]);
    expect(screen.getByText(/RUN HISTORY/i)).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "pseudocode" })[0]);
    expect(screen.getByText(/PSEUDOCODE — INSERTION SORT/i)).toBeTruthy();
    expect(screen.getByText(/InsertionSort\(A, n\)/)).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "complexity" })[0]);
    expect(screen.getByText("Paradigm")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "ai" })[0]);
    expect(screen.getByText(/AI ASSISTANT/i)).toBeTruthy();
  });

  it("persists theme choice to localStorage", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    const stored = JSON.parse(window.localStorage.getItem("algo-app:v1:theme"));
    expect(stored).toBe("light");
  });

  it("binary search debugger supports a not-found target", () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "debugger" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Binary Search" }));
    fireEvent.click(screen.getByRole("button", { name: /Not In Array/i }));
    fireEvent.click(screen.getByRole("button", { name: /GENERATE/i }));
    const lastBtn = screen.getByRole("button", { name: "Last step" });
    fireEvent.click(lastBtn);
    expect(screen.getByText(/Not found \(lo > hi\)/)).toBeTruthy();
  });
});
