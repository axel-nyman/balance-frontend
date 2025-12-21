import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  getMonthName,
  calculateBudgetTotals,
  isBudgetBalanced,
  compareMonthYear,
  parseAmount,
} from "./utils";

describe("formatCurrency", () => {
  it("formats positive amounts with Swedish locale", () => {
    // Swedish locale uses non-breaking space (U+00A0) as thousand separator
    expect(formatCurrency(1234.56)).toBe("1\u00A0234,56 kr");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("0,00 kr");
  });

  it("formats negative amounts", () => {
    // Swedish locale uses minus sign (U+2212) instead of hyphen-minus
    expect(formatCurrency(-500)).toBe("\u2212500,00 kr");
  });

  it("formats large amounts with thousand separators", () => {
    expect(formatCurrency(1000000)).toBe("1\u00A0000\u00A0000,00 kr");
  });

  it("rounds to two decimal places", () => {
    expect(formatCurrency(123.456)).toBe("123,46 kr");
  });
});

describe("formatDate", () => {
  it("formats ISO date string to Swedish locale", () => {
    const result = formatDate("2025-03-15");
    expect(result).toMatch(/15.*mar.*2025/i);
  });

  it("formats datetime string", () => {
    const result = formatDate("2025-12-25T10:30:00Z");
    expect(result).toMatch(/25.*dec.*2025/i);
  });
});

describe("formatMonthYear", () => {
  it("formats month and year in Swedish", () => {
    const result = formatMonthYear(3, 2025);
    expect(result.toLowerCase()).toContain("mars");
    expect(result).toContain("2025");
  });

  it("handles January (month 1)", () => {
    const result = formatMonthYear(1, 2025);
    expect(result.toLowerCase()).toContain("januari");
  });

  it("handles December (month 12)", () => {
    const result = formatMonthYear(12, 2025);
    expect(result.toLowerCase()).toContain("december");
  });
});

describe("getMonthName", () => {
  it("returns Swedish month names", () => {
    expect(getMonthName(1).toLowerCase()).toBe("januari");
    expect(getMonthName(6).toLowerCase()).toBe("juni");
    expect(getMonthName(12).toLowerCase()).toBe("december");
  });
});

describe("calculateBudgetTotals", () => {
  it("calculates totals correctly", () => {
    const income = [{ amount: 50000 }, { amount: 5000 }];
    const expenses = [{ amount: 30000 }, { amount: 2000 }];
    const savings = [{ amount: 10000 }, { amount: 8000 }];

    const result = calculateBudgetTotals(income, expenses, savings);

    expect(result.incomeTotal).toBe(55000);
    expect(result.expensesTotal).toBe(32000);
    expect(result.savingsTotal).toBe(18000);
    expect(result.balance).toBe(5000); // 55000 - 32000 - 18000 = 5000
  });

  it("handles empty arrays", () => {
    const result = calculateBudgetTotals([], [], []);
    expect(result.balance).toBe(0);
  });
});

describe("isBudgetBalanced", () => {
  it("returns true for zero", () => {
    expect(isBudgetBalanced(0)).toBe(true);
  });

  it("returns true for near-zero (floating point)", () => {
    expect(isBudgetBalanced(0.001)).toBe(true);
    expect(isBudgetBalanced(-0.005)).toBe(true);
  });

  it("returns false for non-zero", () => {
    expect(isBudgetBalanced(1)).toBe(false);
    expect(isBudgetBalanced(-50)).toBe(false);
  });
});

describe("compareMonthYear", () => {
  it("compares correctly", () => {
    expect(
      compareMonthYear({ month: 3, year: 2025 }, { month: 1, year: 2025 })
    ).toBeGreaterThan(0);
    expect(
      compareMonthYear({ month: 1, year: 2025 }, { month: 3, year: 2025 })
    ).toBeLessThan(0);
    expect(
      compareMonthYear({ month: 3, year: 2025 }, { month: 3, year: 2025 })
    ).toBe(0);
    expect(
      compareMonthYear({ month: 12, year: 2024 }, { month: 1, year: 2025 })
    ).toBeLessThan(0);
  });
});

describe("parseAmount", () => {
  it("parses Swedish format", () => {
    expect(parseAmount("1 234,56")).toBe(1234.56);
  });

  it("parses standard format", () => {
    expect(parseAmount("1234.56")).toBe(1234.56);
  });

  it("returns 0 for invalid input", () => {
    expect(parseAmount("abc")).toBe(0);
    expect(parseAmount("")).toBe(0);
  });
});
