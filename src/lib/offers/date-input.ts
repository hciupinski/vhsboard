export const shouldCommitDateValue = (value: string, hasIncompleteNativeValue: boolean): boolean =>
  value !== "" || !hasIncompleteNativeValue;

export const isValidIsoDate = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !value.startsWith("0000-") &&
  Number.isFinite(Date.parse(value)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
