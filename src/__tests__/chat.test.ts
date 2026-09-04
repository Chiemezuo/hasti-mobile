import { isMessageMine } from "../lib/chat";

describe("isMessageMine", () => {
  it("trusts senderId over an unreliable mine flag when senderId matches the current user", () => {
    const result = isMessageMine({ senderId: "user-1", mine: false }, "user-1");
    expect(result).toBe(true);
  });

  it("trusts senderId over an unreliable mine flag when senderId does not match", () => {
    const result = isMessageMine({ senderId: "realtor-1", mine: true }, "user-1");
    expect(result).toBe(false);
  });

  it("falls back to the mine flag when senderId is null (e.g. system messages)", () => {
    expect(isMessageMine({ senderId: null, mine: true }, "user-1")).toBe(true);
    expect(isMessageMine({ senderId: null, mine: false }, "user-1")).toBe(false);
  });

  it("falls back to the mine flag when the current user id is unknown", () => {
    expect(isMessageMine({ senderId: "user-1", mine: true }, undefined)).toBe(true);
  });
});
