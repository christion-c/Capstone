import { parseOptionalInt, parseOptionalNumber } from "./optional-input";

describe("parseOptionalNumber", () => {
  it("parses a plain decimal string", () => {
    expect(parseOptionalNumber("12.5")).toBe(12.5);
  });

  it("returns null for an empty string", () => {
    expect(parseOptionalNumber("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(parseOptionalNumber("   ")).toBeNull();
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(parseOptionalNumber("  3.25  ")).toBe(3.25);
  });

  it("returns null for a non-numeric string", () => {
    expect(parseOptionalNumber("abc")).toBeNull();
  });

  it("returns null for Infinity", () => {
    expect(parseOptionalNumber("Infinity")).toBeNull();
  });
});

describe("parseOptionalInt", () => {
  it("parses a plain integer string", () => {
    expect(parseOptionalInt("2016")).toBe(2016);
  });

  it("truncates a decimal string to an integer", () => {
    expect(parseOptionalInt("14.9")).toBe(14);
  });

  it("returns null for an empty string", () => {
    expect(parseOptionalInt("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(parseOptionalInt("   ")).toBeNull();
  });

  it("returns null for a non-numeric string", () => {
    expect(parseOptionalInt("not a year")).toBeNull();
  });
});
