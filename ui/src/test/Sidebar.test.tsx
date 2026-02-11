import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";

function renderWithRouter() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Sidebar />
    </MemoryRouter>
  );
}

describe("Sidebar", () => {
  it("renders ARM branding", () => {
    renderWithRouter();
    expect(screen.getByText("ARM")).toBeInTheDocument();
    expect(screen.getByText("Agent Resource Management")).toBeInTheDocument();
  });

  it("renders all navigation sections", () => {
    renderWithRouter();
    expect(screen.getAllByText("Core").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Advanced").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Monitoring").length).toBeGreaterThan(0);
  });

  it("renders Directory link", () => {
    renderWithRouter();
    const links = screen.getAllByRole("link", { name: /Directory/i });
    expect(links.some((l) => l.getAttribute("href") === "/directory")).toBe(true);
  });

  it("renders System Monitoring link", () => {
    renderWithRouter();
    const links = screen.getAllByRole("link", { name: /System Monitoring/i });
    expect(links.some((l) => l.getAttribute("href") === "/monitoring")).toBe(true);
  });

  it("navigates when link is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter();
    const evalLinks = screen.getAllByRole("link", { name: /Evaluations/i });
    await user.click(evalLinks[0]);
    expect(evalLinks[0]).toHaveAttribute("href", "/evaluations");
  });
});
