/** Fail a test clearly when an expected fixture item or recorded call is absent. */
export function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Expected a fixture value or recorded call");
  return value;
}
