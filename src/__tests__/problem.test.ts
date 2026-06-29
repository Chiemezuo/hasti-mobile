import { isProblemDetail, getFieldErrors, getGlobalError } from "../lib/problem";

describe("isProblemDetail", () => {
  it("returns true for a valid problem detail", () => {
    expect(
      isProblemDetail({ type: "about:blank", title: "Not found", status: 404 })
    ).toBe(true);
  });

  it("returns false for null", () => {
    expect(isProblemDetail(null)).toBe(false);
  });

  it("returns false for missing fields", () => {
    expect(isProblemDetail({ title: "Missing status" })).toBe(false);
  });
});

describe("getFieldErrors", () => {
  it("maps errors to first message per field", () => {
    const result = getFieldErrors({
      type: "about:blank",
      title: "Validation error",
      status: 422,
      errors: {
        email: ["Invalid email", "Too long"],
        password: ["Too short"],
      },
    });
    expect(result.email).toBe("Invalid email");
    expect(result.password).toBe("Too short");
  });

  it("returns empty object when no errors", () => {
    expect(
      getFieldErrors({ type: "about:blank", title: "Error", status: 400 })
    ).toEqual({});
  });
});

describe("getGlobalError", () => {
  it("returns empty string when field errors are present", () => {
    const result = getGlobalError({
      type: "about:blank",
      title: "Validation",
      status: 422,
      errors: { email: ["Invalid"] },
    });
    expect(result).toBe("");
  });

  it("returns the title when no field errors", () => {
    const result = getGlobalError({
      type: "about:blank",
      title: "Unauthorized",
      status: 401,
    });
    expect(result).toBe("Unauthorized");
  });
});
