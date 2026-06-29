import {
  TRANSACTION_LABELS,
  TRANSACTION_CHIP_FAMILY,
  TRANSACTION_DESCRIPTIONS,
  isTerminal,
} from "../lib/escrow-labels";

describe("escrow-labels", () => {
  it("covers all 7 transaction states in labels", () => {
    const states = [
      "INITIATED",
      "IN_ESCROW",
      "UNDER_REVIEW",
      "DISPUTED",
      "COMPLETED",
      "CANCELLED",
      "REFUNDED",
    ] as const;

    for (const state of states) {
      expect(TRANSACTION_LABELS[state]).toBeTruthy();
      expect(TRANSACTION_CHIP_FAMILY[state]).toBeTruthy();
      expect(TRANSACTION_DESCRIPTIONS[state]).toBeTruthy();
    }
  });

  it("identifies terminal states", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
    expect(isTerminal("REFUNDED")).toBe(true);
  });

  it("identifies non-terminal states", () => {
    expect(isTerminal("INITIATED")).toBe(false);
    expect(isTerminal("IN_ESCROW")).toBe(false);
    expect(isTerminal("UNDER_REVIEW")).toBe(false);
    expect(isTerminal("DISPUTED")).toBe(false);
  });

  it("maps INITIATED to attention chip family", () => {
    expect(TRANSACTION_CHIP_FAMILY["INITIATED"]).toBe("attention");
  });

  it("maps COMPLETED to positive chip family", () => {
    expect(TRANSACTION_CHIP_FAMILY["COMPLETED"]).toBe("positive");
  });

  it("maps DISPUTED to negative chip family", () => {
    expect(TRANSACTION_CHIP_FAMILY["DISPUTED"]).toBe("negative");
  });
});
