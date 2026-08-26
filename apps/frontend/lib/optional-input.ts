// Parses a free-text form field into a number, or null when the field
// was left blank/whitespace-only or isn't a valid number - "null"
// specifically means "the user didn't provide this," distinct from an
// explicit 0, which several optional fields (fuel-check-in miles,
// vehicle MPG/tank size) rely on to know whether to leave an existing
// value alone versus overwrite it with 0.
export function parseOptionalNumber(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number.parseFloat(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

// Same as parseOptionalNumber, but truncates to an integer (used for
// a vehicle's model year).
export function parseOptionalInt(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number.parseInt(trimmedValue, 10);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}
