/** Format a points number with thousands separators. 128450 -> "128,450" */
export function formatPoints(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("en-US");
}
