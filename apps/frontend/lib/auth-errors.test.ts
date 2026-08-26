import { getAuthErrorMessage } from "./auth-errors";

describe("getAuthErrorMessage", () => {
  const cases: [string, string][] = [
    ["auth/invalid-email", "Please enter a valid email address."],
    ["auth/user-not-found", "Email or password is incorrect."],
    ["auth/wrong-password", "Email or password is incorrect."],
    ["auth/invalid-credential", "Email or password is incorrect."],
    ["auth/too-many-requests", "Too many attempts. Please try again later."],
    ["auth/email-already-in-use", "That email is already in use."],
    ["auth/weak-password", "Password is too weak. Use a stronger one."],
  ];

  it.each(cases)("maps %s to a specific user-facing message", (code, expected) => {
    expect(getAuthErrorMessage({ code }, "fallback")).toBe(expected);
  });

  it("falls back to the caller's default message for an unrecognized code", () => {
    expect(getAuthErrorMessage({ code: "auth/some-new-error" }, "fallback message")).toBe(
      "fallback message",
    );
  });

  it("falls back to the default message for a non-object error", () => {
    expect(getAuthErrorMessage("not an error object", "fallback")).toBe("fallback");
    expect(getAuthErrorMessage(null, "fallback")).toBe("fallback");
    expect(getAuthErrorMessage(undefined, "fallback")).toBe("fallback");
  });

  it("falls back to the default message for an object with no code field", () => {
    expect(getAuthErrorMessage({ message: "boom" }, "fallback")).toBe("fallback");
  });
});
