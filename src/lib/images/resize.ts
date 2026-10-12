export function getResizedDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  if ([width, height, maxEdge].some((value) => !Number.isFinite(value) || value <= 0))
    throw new Error("Nieprawidłowe wymiary obrazu.");
  const ratio = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}
