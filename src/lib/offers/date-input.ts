export const shouldCommitDateValue = (value: string, hasIncompleteNativeValue: boolean): boolean =>
  value !== "" || !hasIncompleteNativeValue;
