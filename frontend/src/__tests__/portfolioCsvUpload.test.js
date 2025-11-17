import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import UploadCSV from "../components/portfolio/UploadCSV";

jest.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ currentUser: { id: "user-test" } }),
}));

jest.mock("../contexts/AppContext", () => ({
  useApp: () => ({ queueToast: jest.fn() }),
}));

jest.mock("../contexts/PortfolioContext", () => ({
  usePortfolioContext: () => ({
    portfolio: { id: "portfolio-test" },
    reloadPortfolio: jest.fn(),
    updatePortfolioMetrics: jest.fn(),
  }),
}));

jest.mock("../services/supabase/config", () => ({
  supabase: {
    from: () => ({
      insert: jest.fn().mockResolvedValue({}),
      upsert: jest.fn().mockResolvedValue({}),
    }),
  },
}));

describe("UploadCSV component", () => {
  test("renders upload instructions (UI smoke test)", () => {
    render(<UploadCSV />);
    expect(
      screen.getByText(/Import Portfolio Transactions/i),
    ).toBeInTheDocument();
  });

  test.todo("highlights invalid rows when required columns are missing");
  test.todo("submits valid rows to Supabase when import is triggered");
});
