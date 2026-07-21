import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import App from "@/App";
import { createAppStore } from "@/store/store";

describe("App", () => {
  it("renders the Day 1 search page shell", () => {
    render(
      <Provider store={createAppStore(null)}>
        <App />
      </Provider>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Sound Search" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Search sounds" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(
      screen.getByRole("heading", { name: "Recent searches" }),
    ).toBeInTheDocument();
  });
});
