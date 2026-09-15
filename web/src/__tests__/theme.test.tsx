import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

function TestThemeConsumer() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">
        Toggle
      </button>
      <button onClick={() => setTheme("light")} data-testid="set-light-btn">
        Set Light
      </button>
      <button onClick={() => setTheme("dark")} data-testid="set-dark-btn">
        Set Dark
      </button>
    </div>
  );
}

describe("ThemeContext & Mode Management", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.className = "";
  });

  it("defaults to dark mode for tactical reconnaissance HUD", () => {
    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-val").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles theme between dark and light mode", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId("toggle-btn");
    await user.click(toggleBtn);

    expect(screen.getByTestId("theme-val").textContent).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("drono-theme")).toBe("light");

    await user.click(toggleBtn);

    expect(screen.getByTestId("theme-val").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("drono-theme")).toBe("dark");
  });

  it("explicitly sets theme via setTheme", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    await user.click(screen.getByTestId("set-light-btn"));
    expect(screen.getByTestId("theme-val").textContent).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    await user.click(screen.getByTestId("set-dark-btn"));
    expect(screen.getByTestId("theme-val").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("drono-theme")).toBe("dark");
  });

  it("restores dark mode preference from localStorage", () => {
    localStorage.setItem("drono-theme", "dark");

    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-val").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
