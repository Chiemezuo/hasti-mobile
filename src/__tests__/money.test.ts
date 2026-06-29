import { formatNaira } from "../lib/money";

describe("formatNaira", () => {
  it("formats a standard amount", () => {
    const result = formatNaira("2500000.00");
    expect(result).toContain("₦");
    expect(result).toContain("2,500,000");
  });

  it("handles zero", () => {
    const result = formatNaira("0.00");
    expect(result).toContain("₦");
  });

  it("handles non-finite values gracefully", () => {
    const result = formatNaira("not-a-number");
    expect(result).toBe("₦not-a-number");
  });

  it("handles large amounts", () => {
    const result = formatNaira("500000000.00");
    expect(result).toContain("500,000,000");
  });

  it("handles amounts with kobo", () => {
    const result = formatNaira("1500.50");
    expect(result).toContain("1,500");
  });
});
