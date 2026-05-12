/** Compact random ID — same algorithm as the frontend's uid() */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
